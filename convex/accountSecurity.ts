import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser, requireAdmin } from "./lib/access";
import { retrieveAccount, invalidateSessions } from "@convex-dev/auth/server";
import { rateLimiter } from "./lib/rateLimits";
async function digest(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export const context = internalQuery({
  args: {},
  handler: async (ctx) => {
    const actor = await requireUser(ctx);
    if (actor.role === "ADMIN") await requireAdmin(ctx, 5 * 60000);
    return { _id: actor._id, email: actor.email };
  },
});
export const reserve = internalMutation({
  args: { email: v.string(), codeHash: v.string() },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    await rateLimiter.limit(ctx, "mfa", {
      key: `email-change:${actor._id}`,
      throws: true,
    });
    if (actor.email === args.email)
      throw new Error("Use a different email address");
    if (
      await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first()
    )
      throw new Error("This email cannot be used");
    return ctx.db.insert("emailChanges", {
      userId: actor._id,
      ...args,
      attempts: 0,
      expiresAt: Date.now() + 15 * 60000,
      createdAt: Date.now(),
    });
  },
});
export const requestEmailChange = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const user = await ctx.runQuery(internal.accountSecurity.context, {}),
      email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      throw new Error("Invalid email");
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
      throw new Error(
        "Verified transactional email delivery is not configured",
      );
    const verified = await retrieveAccount(ctx, {
      provider: "password",
      account: { id: user.email, secret: args.password },
    });
    if (verified.user._id !== user._id)
      throw new Error("Reauthentication failed");
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const code = Array.from(bytes)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    const id = await ctx.runMutation(internal.accountSecurity.reserve, {
      email,
      codeHash: await digest(code),
    });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `email-change-${id}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [email],
        subject: "Confirm your Aliko Diamond Key email change",
        text: `Your verification code is ${code}. It expires in 15 minutes. Enter it in your account settings. If you did not request this change, ignore it.`,
      }),
    });
    if (!response.ok)
      throw new Error("Email delivery failed; request a new code");
  },
});
export const confirm = internalMutation({
  args: { codeHash: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role === "ADMIN") await requireAdmin(ctx, 5 * 60000);
    const pending = await ctx.db
      .query("emailChanges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    if (
      !pending ||
      pending.verifiedAt ||
      pending.expiresAt <= Date.now() ||
      pending.attempts >= 5
    )
      throw new Error("Request a new verification code");
    if (pending.codeHash !== args.codeHash) {
      await ctx.db.patch(pending._id, { attempts: pending.attempts + 1 });
      return { ok: false, userId: user._id };
    }
    if (
      await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", pending.email))
        .first()
    )
      throw new Error("This email cannot be used");
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", user._id).eq("provider", "password"),
      )
      .unique();
    if (!account) throw new Error("Password account unavailable");
    const collision = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", pending.email),
      )
      .unique();
    if (collision) throw new Error("This email cannot be used");
    await ctx.db.patch(account._id, {
      providerAccountId: pending.email,
      emailVerified: pending.email,
    });
    await ctx.db.patch(user._id, {
      email: pending.email,
      emailVerificationTime: Date.now(),
    });
    await ctx.db.patch(pending._id, { verifiedAt: Date.now() });
    // Revoke sessions atomically with changing the sign-in identifier.
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();
    for (const session of sessions)
      await ctx.db.patch(session._id, { expirationTime: Date.now() - 1 });
    await ctx.db.insert("notificationLog", {
      channel: "EMAIL",
      recipient: user.email,
      subject: "Your account email was changed",
      message:
        "Your Aliko Diamond Key sign-in email changed. Contact support immediately if you did not authorize this change.",
      status: "QUEUED",
      createdAt: Date.now(),
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: user._id,
      action: "EMAIL_CHANGED",
      entityType: "users",
      entityId: String(user._id),
      createdAt: Date.now(),
    });
    return { ok: true, userId: user._id };
  },
});
export const confirmEmailChange = action({
  args: { code: v.string() },
  handler: async (ctx, args): Promise<void> => {
    if (!/^[a-f0-9]{48}$/.test(args.code.trim()))
      throw new Error("Invalid verification code");
    const result = await ctx.runMutation(internal.accountSecurity.confirm, {
      codeHash: await digest(args.code.trim()),
    });
    if (!result.ok) throw new Error("Invalid verification code");
    await invalidateSessions(ctx, { userId: result.userId });
  },
});
