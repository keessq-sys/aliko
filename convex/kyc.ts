import { auditedMutation } from "./lib/auditedMutation";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { rateLimiter } from "./lib/rateLimits";
import { requireUser } from "./lib/access";
const CONSENT_VERSION = "2026-10-03";
import type { Id } from "./_generated/dataModel";

const verificationType = v.union(
  v.literal("NIN"),
  v.literal("BVN"),
  v.literal("PASSPORT"),
  v.literal("DRIVERS_LICENSE"),
  v.literal("CAC"),
);

export const getWorkflowContext = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User profile not found");
    const consent = await ctx.db
      .query("policyAcceptances")
      .withIndex("by_user_policy", (q: any) =>
        q.eq("userId", userId).eq("policy", "KYC_CONSENT"),
      )
      .order("desc")
      .first();
    if (!consent || consent.version !== CONSENT_VERSION)
      throw new Error("Accept the KYC consent notice before verification");
    return { consentVersion: consent.version, consentedAt: consent.acceptedAt };
  },
});
export const expireVerifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("kycVerifications")
      .withIndex("by_status_expiry", (q) =>
        q
          .eq("status", "VERIFIED")
          .gt("expiresAt", 0)
          .lte("expiresAt", Date.now()),
      )
      .take(100);
    for (const record of expired) {
      await ctx.db.patch(record._id, {
        status: "FAILED",
        failureReason: "Verification validity expired",
        updatedAt: Date.now(),
      });
      const current = await ctx.db
        .query("kycVerifications")
        .withIndex("by_user", (q) => q.eq("userId", record.userId))
        .take(100);
      await ctx.db.patch(record.userId, {
        kycVerified: current.some(
          (row) =>
            row.status === "VERIFIED" &&
            (!row.expiresAt || row.expiresAt > Date.now()),
        ),
      });
    }
  },
});

export const saveWorkflowSession = internalMutation({
  args: {
    userId: v.id("users"),
    type: verificationType,
    providerReference: v.string(),
    subjectHash: v.string(),
    consentVersion: v.string(),
    consentedAt: v.number(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "checkout", {
      key: `kyc:${args.userId}`,
      throws: true,
    });
    if (
      await ctx.db
        .query("kycVerifications")
        .withIndex("by_provider_reference", (q) =>
          q.eq("providerReference", args.providerReference),
        )
        .first()
    )
      throw new Error("Verification reference already exists");
    const now = Date.now();
    const value = {
      providerReference: args.providerReference,
      subjectHash: args.subjectHash,
      consentVersion: args.consentVersion,
      consentedAt: args.consentedAt,
      sessionExpiresAt: args.expiresAt,
      status: "PENDING" as const,
      providerStatus: "session_created",
      failureReason: undefined,
      updatedAt: now,
    };
    return ctx.db.insert("kycVerifications", {
      userId: args.userId,
      type: args.type,
      ...value,
      createdAt: now,
    });
  },
});

async function currentUser(ctx: any) {
  return requireUser(ctx);
}

/** Records explicit consent before any identity data is sent to a provider. */
export const acceptKycConsent = auditedMutation("kyc:acceptKycConsent")({
  args: { version: v.string() },
  handler: async (ctx, { version }) => {
    const user = await currentUser(ctx);
    const cleanVersion = version.trim();
    if (cleanVersion !== CONSENT_VERSION)
      throw new Error("Invalid consent version");
    const previous = await ctx.db
      .query("policyAcceptances")
      .withIndex("by_user_policy", (q: any) =>
        q.eq("userId", user._id).eq("policy", "KYC_CONSENT"),
      )
      .order("desc")
      .first();
    if (previous?.version === cleanVersion) return previous._id;
    return ctx.db.insert("policyAcceptances", {
      userId: user._id,
      policy: "KYC_CONSENT",
      version: cleanVersion,
      acceptedAt: Date.now(),
    });
  },
});

export const getMyVerifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    return ctx.db
      .query("kycVerifications")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const applyQoreIdResult = internalMutation({
  args: {
    providerReference: v.string(),
    providerStatus: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("VERIFIED"),
      v.literal("FAILED"),
    ),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("kycVerifications")
      .withIndex("by_provider_reference", (q: any) =>
        q.eq("providerReference", args.providerReference),
      )
      .unique();
    if (!record) return { matched: false };
    const now = Date.now();
    await ctx.db.patch(record._id, {
      status: args.status,
      providerStatus: args.providerStatus.slice(0, 80),
      failureReason: args.failureReason?.slice(0, 500),
      reviewedAt: args.status === "PENDING" ? undefined : now,
      updatedAt: now,
    });
    const current = await ctx.db
      .query("kycVerifications")
      .withIndex("by_user", (q) => q.eq("userId", record.userId))
      .take(100);
    await ctx.db.patch(record.userId, {
      kycVerified: current.some(
        (row) =>
          row.status === "VERIFIED" && (!row.expiresAt || row.expiresAt > now),
      ),
    });
    return { matched: true };
  },
});
