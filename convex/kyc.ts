import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
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
    const consent = await ctx.db.query("policyAcceptances")
      .withIndex("by_user_policy", (q: any) => q.eq("userId", userId).eq("policy", "KYC_CONSENT"))
      .order("desc").first();
    if (!consent) throw new Error("Accept the KYC consent notice before verification");
    return { consentVersion: consent.version, consentedAt: consent.acceptedAt };
  },
});

export const saveWorkflowSession = internalMutation({
  args: {
    userId: v.id("users"), type: verificationType, providerReference: v.string(),
    subjectHash: v.string(), consentVersion: v.string(), consentedAt: v.number(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("kycVerifications")
      .withIndex("by_user_type", (q: any) => q.eq("userId", args.userId).eq("type", args.type))
      .order("desc").first();
    const now = Date.now();
    const value = {
      providerReference: args.providerReference, subjectHash: args.subjectHash,
      consentVersion: args.consentVersion, consentedAt: args.consentedAt,
      expiresAt: args.expiresAt, status: "PENDING" as const, providerStatus: "session_created",
      failureReason: undefined, updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, value);
      return existing._id;
    }
    return ctx.db.insert("kycVerifications", { userId: args.userId, type: args.type, ...value, createdAt: now });
  },
});

/** Mints a short-lived, single-use QoreID Web SDK token on the trusted server. */
export const startQoreIdWorkflow = action({
  args: { type: verificationType },
  handler: async (ctx, { type }): Promise<{ sdkSessionToken: string; reference: string; expiresAt?: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const clientId = process.env.QOREID_CLIENT_ID;
    const secret = process.env.QOREID_CLIENT_SECRET;
    const workflowId = Number(process.env.QOREID_WORKFLOW_ID);
    if (!clientId || !secret || !Number.isSafeInteger(workflowId) || workflowId <= 0)
      throw new Error("QoreID production workflow is not configured");
    const context = await ctx.runQuery(internal.kyc.getWorkflowContext, { userId });
    const reference = `ADK-${Date.now()}-${crypto.randomUUID().slice(0, 12)}`;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(userId)));
    const subjectHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const response = await fetch("https://api.qoreid.com/v1/sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
        "Content-Type": "application/json",
        "Idempotency-Key": reference,
      },
      body: JSON.stringify({ type: "workflow", workflowId, reference }),
    });
    const body: any = await response.json().catch(() => ({}));
    if (!response.ok || !body.sdkSessionToken) {
      console.error("QoreID session creation failed", { status: response.status, reference });
      throw new Error("Identity verification is temporarily unavailable");
    }
    const expiresAt = typeof body.expiresAt === "number" ? body.expiresAt :
      typeof body.expiresAt === "string" ? Date.parse(body.expiresAt) : undefined;
    await ctx.runMutation(internal.kyc.saveWorkflowSession, {
      userId, type, providerReference: reference, subjectHash,
      consentVersion: context.consentVersion, consentedAt: context.consentedAt,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : undefined,
    });
    return { sdkSessionToken: body.sdkSessionToken, reference, expiresAt };
  },
});

async function currentUser(ctx: any) {
  const id = await getAuthUserId(ctx);
  if (!id) throw new Error("Unauthorized");
  const user = await ctx.db.get(id as Id<"users">);
  if (!user) throw new Error("User profile not found");
  return user;
}

/** Records explicit consent before any identity data is sent to a provider. */
export const acceptKycConsent = mutation({
  args: { version: v.string() },
  handler: async (ctx, { version }) => {
    const user = await currentUser(ctx);
    const cleanVersion = version.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanVersion))
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

/** Creates the local record after the provider returns a workflow reference.
 * The browser never sends raw NIN/BVN values to Convex. */
export const registerProviderVerification = mutation({
  args: {
    type: verificationType,
    providerReference: v.string(),
    subjectHash: v.string(),
    consentVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!/^[A-Za-z0-9._:-]{6,160}$/.test(args.providerReference))
      throw new Error("Invalid provider reference");
    if (!/^[a-f0-9]{64}$/i.test(args.subjectHash))
      throw new Error("Invalid subject digest");
    const consent = await ctx.db
      .query("policyAcceptances")
      .withIndex("by_user_policy", (q: any) =>
        q.eq("userId", user._id).eq("policy", "KYC_CONSENT"),
      )
      .order("desc")
      .first();
    if (!consent || consent.version !== args.consentVersion)
      throw new Error("Current KYC consent is required");
    const existing = await ctx.db
      .query("kycVerifications")
      .withIndex("by_user_type", (q: any) =>
        q.eq("userId", user._id).eq("type", args.type),
      )
      .order("desc")
      .first();
    const now = Date.now();
    const value = {
      providerReference: args.providerReference,
      subjectHash: args.subjectHash.toLowerCase(),
      status: "PENDING" as const,
      providerStatus: "pending",
      consentVersion: consent.version,
      consentedAt: consent.acceptedAt,
      failureReason: undefined,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, value);
      return existing._id;
    }
    return ctx.db.insert("kycVerifications", {
      userId: user._id,
      type: args.type,
      ...value,
      createdAt: now,
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
    const record = await ctx.db.query("kycVerifications")
      .withIndex("by_provider_reference", (q: any) =>
        q.eq("providerReference", args.providerReference),
      ).unique();
    if (!record) return { matched: false };
    const now = Date.now();
    await ctx.db.patch(record._id, {
      status: args.status,
      providerStatus: args.providerStatus.slice(0, 80),
      failureReason: args.failureReason?.slice(0, 500),
      reviewedAt: args.status === "PENDING" ? undefined : now,
      updatedAt: now,
    });
    if (args.status === "VERIFIED") {
      await ctx.db.patch(record.userId, { kycVerified: true });
    }
    return { matched: true };
  },
});

