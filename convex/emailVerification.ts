import { v } from "convex/values";
import {
  action,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./lib/access";
import { rateLimiter } from "./lib/rateLimits";
async function digest(token: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export const recipient = internalQuery({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return { email: user.email, verified: Boolean(user.emailVerificationTime) };
  },
});
export const reserve = internalMutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await rateLimiter.limit(ctx, "mfa", {
      key: `verify-email:${user._id}`,
      throws: true,
    });
    return ctx.db.insert("accountVerifications", {
      userId: user._id,
      email: user.email,
      tokenHash: args.tokenHash,
      expiresAt: Date.now() + 3600000,
      createdAt: Date.now(),
    });
  },
});
export const recordDelivery = internalMutation({
  args: { id: v.id("accountVerifications"), providerId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { providerId: args.providerId });
  },
});
export const request = action({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.emailVerification.recipient, {});
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
      throw new Error("Email verification is not configured.");
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    const id = await ctx.runMutation(internal.emailVerification.reserve, {
      tokenHash: await digest(token),
    });
    const url = new URL(
      "/auth/verify",
      process.env.APP_URL ?? "https://alikodiamondkey.com",
    );
    url.searchParams.set("token", token);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `verify-${id}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [user.email],
        subject: "Verify your Aliko Diamond Key email",
        text: `Verify your email using this link within one hour: ${url.href}\nIf you did not request this, ignore this email.`,
      }),
    });
    const body = await response.json();
    if (!response.ok || !body.id)
      throw new Error(
        "Verification email could not be sent. Please contact support.",
      );
    await ctx.runMutation(internal.emailVerification.recordDelivery, {
      id,
      providerId: body.id,
    });
    // Accepted is intentionally distinct from provider-delivered or user-verified.
    return { accepted: true };
  },
});
export const confirm = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new Error("Invalid verification link.");
    const hash = await digest(token);
    const row = await ctx.db
      .query("accountVerifications")
      .withIndex("by_hash", (q) => q.eq("tokenHash", hash))
      .unique();
    if (!row || row.verifiedAt || row.expiresAt <= Date.now())
      throw new Error("This verification link is invalid or expired.");
    const user = await ctx.db.get(row.userId);
    if (!user || user.email !== row.email)
      throw new Error("The account email changed. Request a new link.");
    await ctx.db.patch(row._id, { verifiedAt: Date.now() });
    await ctx.db.patch(user._id, { emailVerificationTime: Date.now() });
    await ctx.db.insert("adminAuditLog", {
      actorId: user._id,
      action: "ACCOUNT_EMAIL_VERIFIED",
      entityType: "users",
      entityId: String(user._id),
      createdAt: Date.now(),
    });
    return { verified: true };
  },
});
