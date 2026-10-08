import { auditedMutation } from "./lib/auditedMutation";
import { v, ConvexError } from "convex/values";
import {
  action,
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser, requireAdmin } from "./lib/access";
import { normalizeNin, ninProblem, protectNin, revealNin } from "./lib/nin";
import { rateLimiter } from "./lib/rateLimits";

export const status = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const record = await ctx.db
      .query("identities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return record
      ? {
          status: record.status,
          formatValid:
            record.status !== "FAILED" && /^\d{4}$/.test(record.lastFour),
          maskedNin: `•••••••${record.lastFour}`,
          reviewReason: record.reviewReason,
        }
      : null;
  },
});
/** Existing accounts can complete identity onboarding without recreating their account. */
export const submit = action({
  args: { nin: v.string(), consent: v.boolean() },
  handler: async (ctx, args): Promise<void> => {
    if (!args.consent)
      throw new ConvexError(
        "Accept the NIN verification consent before registration.",
      );
    const problem = ninProblem(args.nin);
    if (problem) throw new ConvexError(problem);
    const protectedNin = await protectNin(normalizeNin(args.nin));
    await ctx.runMutation(internal.identity.save, protectedNin);
  },
});
export const save = internalMutation({
  args: { cipher: v.string(), fingerprint: v.string(), lastFour: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await rateLimiter.limit(ctx, "registration", {
      key: `identity:${user._id}`,
      throws: true,
    });
    const previous = await ctx.db
      .query("identities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (previous && previous.status !== "FAILED")
      throw new ConvexError("Your NIN has already been submitted.");
    const duplicate = await ctx.db
      .query("identities")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", args.fingerprint))
      .first();
    if (duplicate && duplicate.userId !== user._id)
      throw new ConvexError(
        "This NIN is already associated with an account. Contact support.",
      );
    const now = Date.now();
    const fields = {
      userId: user._id,
      ninCipher: args.cipher,
      fingerprint: args.fingerprint,
      lastFour: args.lastFour,
      status: "PENDING" as const,
      consentVersion: "2026-10-03",
      consentedAt: now,
      updatedAt: now,
      reviewedAt: undefined,
      reviewedBy: undefined,
      reviewReason: undefined,
      verificationMethod: undefined,
    };
    if (previous) await ctx.db.patch(previous._id, fields);
    else await ctx.db.insert("identities", { ...fields, createdAt: now });
    await ctx.db.patch(user._id, { kycVerified: false });
    await ctx.db.insert("policyAcceptances", {
      userId: user._id,
      policy: "KYC_CONSENT",
      version: "2026-10-03",
      acceptedAt: now,
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: user._id,
      action: "NIN_SUBMITTED",
      entityType: "users",
      entityId: String(user._id),
      createdAt: now,
    });
  },
});
export const authorizedRecord = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const actorId = await requireAdmin(ctx, 5 * 60000);
    const record = await ctx.db
      .query("identities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!record) throw new Error("NIN has not been submitted");
    return { record, actorId };
  },
});
export const logReveal = internalMutation({
  args: { actorId: v.id("users"), userId: v.id("users") },
  handler: async (ctx, args) => {
    // Recheck session and MFA at the write boundary too.
    if ((await requireAdmin(ctx, 5 * 60000)) !== args.actorId)
      throw new Error("Forbidden");
    await ctx.db.insert("adminAuditLog", {
      actorId: args.actorId,
      action: "NIN_VIEWED",
      entityType: "users",
      entityId: String(args.userId),
      createdAt: Date.now(),
    });
  },
});
export const reveal = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<string> => {
    const { record, actorId } = await ctx.runQuery(
      internal.identity.authorizedRecord,
      args,
    );
    const nin = await revealNin(record.ninCipher);
    await ctx.runMutation(internal.identity.logReveal, {
      userId: args.userId,
      actorId,
    });
    return nin;
  },
});
export const review = auditedMutation("identity:review")({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("VERIFIED"), v.literal("FAILED")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actorId = await requireAdmin(ctx, 5 * 60000);
    if (
      args.reason.trim().length < 20 ||
      args.reason.length > 1000 ||
      /[0-9٠-٩۰-۹]{11}/.test(args.reason)
    )
      throw new Error(
        "Record verification evidence or a rejection reason (20–1000 characters).",
      );
    const record = await ctx.db
      .query("identities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!record) throw new Error("NIN has not been submitted");
    const now = Date.now();
    await ctx.db.patch(record._id, {
      status: args.status,
      reviewedBy: actorId,
      reviewedAt: now,
      reviewReason: args.reason.trim(),
      verificationMethod: "MANUAL",
      updatedAt: now,
    });
    await ctx.db.patch(args.userId, {
      kycVerified: args.status === "VERIFIED",
    });
    await ctx.db.insert("adminAuditLog", {
      actorId,
      action: `NIN_${args.status}`,
      entityType: "users",
      entityId: String(args.userId),
      detail:
        "Manual identity review; evidence retained in restricted identity record",
      createdAt: now,
    });
  },
});
