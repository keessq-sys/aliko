import { auditedMutation } from "./lib/auditedMutation";
import { v } from "convex/values";
import { getAuthSessionId } from "@convex-dev/auth/server";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireUser } from "./lib/access";
import { rateLimiter } from "./lib/rateLimits";
import { base32, totp, encryptSecret, decryptSecret } from "./lib/totp";
/** Operator-only recovery, disabled unless deliberately enabled in deployment settings. */
export const recoverEnrollment = internalMutation({
  args: { userId: v.id("users"), operator: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    if (process.env.ADMIN_MFA_RECOVERY_ENABLED !== "true")
      throw new Error("Operator recovery is disabled");
    if (args.operator.trim().length < 5 || args.reason.trim().length < 20)
      throw new Error("Record the verified operator and recovery evidence");
    const user = await ctx.db.get(args.userId);
    if (user?.role !== "ADMIN")
      throw new Error("Administrator account not found");
    const record = await ctx.db
      .query("adminMfa")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (record) await ctx.db.delete(record._id);
    const proofs = await ctx.db
      .query("mfaSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(1000);
    for (const proof of proofs) await ctx.db.delete(proof._id);
    await ctx.db.insert("adminAuditLog", {
      actorId: args.userId,
      action: "ADMIN_MFA_OPERATOR_RECOVERY",
      entityType: "users",
      entityId: String(args.userId),
      detail: `${args.operator}: ${args.reason}`.slice(0, 500),
      createdAt: Date.now(),
    });
  },
});
async function admin(ctx: any) {
  const user = await requireUser(ctx);
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}
export const status = query({
  args: {},
  handler: async (ctx) => {
    const user = await admin(ctx);
    const record = await ctx.db
      .query("adminMfa")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const sessionId = await getAuthSessionId(ctx);
    const proof = sessionId
      ? await ctx.db
          .query("mfaSessions")
          .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
          .unique()
      : null;
    return {
      enrolled: record?.enabled ?? false,
      verified: Boolean(proof && proof.expiresAt > Date.now()),
    };
  },
});
export const beginEnrollment = auditedMutation("adminSecurity:beginEnrollment")({
  args: {},
  handler: async (ctx) => {
    const user = await admin(ctx);
    await rateLimiter.limit(ctx, "registration", {
      key: `mfa:${user._id}`,
      throws: true,
    });
    const existing = await ctx.db
      .query("adminMfa")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existing?.enabled) throw new Error("MFA already enrolled");
    const secret = base32(crypto.getRandomValues(new Uint8Array(20)));
    const values = {
      userId: user._id,
      cipher: await encryptSecret(secret),
      enabled: false,
      createdAt: Date.now(),
    };
    if (existing) await ctx.db.patch(existing._id, values);
    else await ctx.db.insert("adminMfa", values);
    return {
      secret,
      uri: `otpauth://totp/Aliko%20Diamond%20Key:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Aliko%20Diamond%20Key&algorithm=SHA1&digits=6&period=30`,
    };
  },
});
export const verify = auditedMutation("adminSecurity:verify")({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await admin(ctx);
    await rateLimiter.limit(ctx, "mfa", {
      key: `mfa-code:${user._id}`,
      throws: true,
    });
    const record = await ctx.db
      .query("adminMfa")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (!record || !/^\d{6}$/.test(code)) throw new Error("Invalid code");
    const secret = await decryptSecret(record.cipher);
    const now = Math.floor(Date.now() / 30000);
    let matched = -1;
    for (const step of [now - 1, now, now + 1])
      if (
        step > (record.lastCounter ?? -1) &&
        (await totp(secret, step)) === code
      )
        matched = step;
    if (matched < 0) throw new Error("Invalid or reused code");
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) throw new Error("Unauthorized");
    await ctx.db.patch(record._id, { enabled: true, lastCounter: matched });
    const existing = await ctx.db
      .query("mfaSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();
    const proof = {
      sessionId,
      userId: user._id,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + 30 * 60000,
    };
    if (existing) await ctx.db.patch(existing._id, proof);
    else await ctx.db.insert("mfaSessions", proof);
    await ctx.db.insert("adminAuditLog", {
      actorId: user._id,
      action: "ADMIN_MFA_VERIFIED",
      entityType: "authSessions",
      entityId: String(sessionId),
      createdAt: Date.now(),
    });
    return { verified: true };
  },
});
