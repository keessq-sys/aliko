import { auditedMutation } from "./lib/auditedMutation";
import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin, requireUser, requireSubmittedNin } from "./lib/access";
import { rateLimiter, contactRateKey } from "./lib/rateLimits";

import { assertNigeriaLocation, normalizeState } from "./lib/nigeriaLocations";

function makeRef(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomUUID();
  return `ADK-${prefix}-${year}-${rand}`;
}

export const myEnrolments = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const managers = await ctx.db
      .query("estateManagers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
    const agents = await ctx.db
      .query("agentApplications")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .order("desc")
      .take(50);
    return {
      managers: managers.filter((m) => m.userId === user._id),
      agents: agents.filter((a) => a.userId === user._id),
    };
  },
});

// ── Public: agent application (5-step wizard) ──────────────────────────────
export const submitAgentApplication = auditedMutation(
  "partners:submitAgentApplication",
)({
  args: {
    fullName: v.string(),
    submissionKey: v.optional(v.string()),
    email: v.string(),
    phone: v.string(),
    operatingState: v.optional(v.string()),
    operatingLga: v.optional(v.string()),
    stateOfOrigin: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    gender: v.optional(v.string()),
    nationality: v.optional(v.string()),
    niaNumber: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    address: v.optional(v.string()),
    expectedListings: v.optional(v.string()),

    agencyName: v.optional(v.string()),
    agentType: v.optional(v.string()),
    reanNumber: v.optional(v.string()),
    experience: v.optional(v.string()),
    specializations: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    statesOfOperation: v.optional(v.array(v.string())),
    primaryLgas: v.optional(v.string()),
    documentUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const applicant = await requireUser(ctx);
    const userId = applicant._id;
    if (args.email.trim().toLowerCase() !== applicant.email.toLowerCase())
      throw new ConvexError("Use your account email");
    if (
      args.fullName.trim().length < 2 ||
      args.fullName.length > 120 ||
      !/^\+?[0-9]{10,15}$/.test(args.phone.replace(/[\s()-]/g, ""))
    )
      throw new ConvexError("Provide a valid name and phone number.");
    if (args.submissionKey) {
      if (!/^[a-zA-Z0-9-]{16,80}$/.test(args.submissionKey))
        throw new ConvexError("Invalid enrolment request");
      const saved = await ctx.db
        .query("agentApplications")
        .withIndex("by_submission", (q) =>
          q.eq("userId", userId).eq("submissionKey", args.submissionKey),
        )
        .unique();
      if (saved) return { id: saved._id, reference: saved.reference };
    }
    const identity = await ctx.db
      .query("identities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!identity)
      throw new ConvexError(
        "Submit your NIN and consent before professional enrolment.",
      );
    if (!args.operatingState || !args.operatingLga)
      throw new ConvexError("Select your operating state and LGA.");
    assertNigeriaLocation(args.operatingState, args.operatingLga);
    for (const state of args.statesOfOperation ?? [])
      assertNigeriaLocation(state);
    await rateLimiter.limit(ctx, "registration", {
      key: String(userId),
      throws: true,
    });
    await ctx.db.patch(userId, {
      phone: args.phone.trim(),
      agencyName: args.agencyName,
      operatingState: normalizeState(args.operatingState),
      operatingLga: args.operatingLga,
      whatsapp: (args.whatsapp || args.phone).replace(/[\s()-]/g, ""),
      requestedAccountType: "AGENT",
      ...(args.address && args.address.trim().length >= 10
        ? { address: args.address.trim() }
        : {}),
    });
    const now = Date.now();
    const reference = makeRef("AGT");
    const id = await ctx.db.insert("agentApplications", {
      reference,
      userId,
      ...args,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });
    return { id, reference };
  },
});

// ── Public: estate manager enrolment ───────────────────────────────────────
export const submitManagerApplication = auditedMutation(
  "partners:submitManagerApplication",
)({
  args: {
    companyName: v.string(),
    submissionKey: v.optional(v.string()),
    contactName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.optional(v.string()),
    operatingState: v.optional(v.string()),
    operatingLga: v.optional(v.string()),
    cacRcNumber: v.optional(v.string()),
    statesOfOperation: v.array(v.string()),
    portfolioSize: v.optional(v.string()),
    plan: v.union(v.literal("STARTER"), v.literal("PROFESSIONAL")),
  },
  handler: async (ctx, args) => {
    const applicant = await requireUser(ctx);
    const userId = applicant._id;
    if (args.email.trim().toLowerCase() !== applicant.email.toLowerCase())
      throw new ConvexError("Use your account email");
    if (
      args.companyName.trim().length < 2 ||
      args.companyName.length > 160 ||
      args.contactName.trim().length < 2 ||
      args.contactName.length > 120 ||
      !/^\+?[0-9]{10,15}$/.test(args.phone.replace(/[\s()-]/g, ""))
    )
      throw new ConvexError(
        "Provide a valid company, contact name and phone number.",
      );
    if (args.submissionKey) {
      if (!/^[a-zA-Z0-9-]{16,80}$/.test(args.submissionKey))
        throw new ConvexError("Invalid enrolment request");
      const saved = await ctx.db
        .query("estateManagers")
        .withIndex("by_submission", (q) =>
          q.eq("userId", userId).eq("submissionKey", args.submissionKey),
        )
        .unique();
      if (saved) {
        if (saved.plan !== args.plan)
          throw new ConvexError(
            "Your application was saved with a different plan. Review My payments before changing plans.",
          );
        return { id: saved._id };
      }
    }
    const identity = await ctx.db
      .query("identities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!identity)
      throw new ConvexError(
        "Submit your NIN and consent before professional enrolment.",
      );
    if (!args.operatingState || !args.operatingLga)
      throw new ConvexError("Select your operating state and LGA.");
    assertNigeriaLocation(args.operatingState, args.operatingLga);
    for (const state of args.statesOfOperation ?? [])
      assertNigeriaLocation(state);
    await rateLimiter.limit(ctx, "registration", {
      key: String(userId),
      throws: true,
    });
    if (args.address !== undefined && args.address.trim().length < 10)
      throw new ConvexError("Provide your full legal address before checkout.");
    await ctx.db.patch(userId, {
      phone: args.phone.trim(),
      companyName: args.companyName.trim(),
      requestedAccountType: "ESTATE_MANAGER",
      whatsapp: args.phone.replace(/[\s()-]/g, ""),
      operatingState: normalizeState(args.operatingState),
      operatingLga: args.operatingLga,
      ...(args.address ? { address: args.address.trim() } : {}),
    });
    const now = Date.now();
    const id = await ctx.db.insert("estateManagers", {
      userId,
      ...args,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});

// ── Admin: agent applications ──────────────────────────────────────────────
export const listAgentApplications = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("PENDING"),
        v.literal("UNDER_REVIEW"),
        v.literal("APPROVED"),
        v.literal("REJECTED"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.status) {
      return await ctx.db
        .query("agentApplications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(500);
    }
    const rows = await ctx.db.query("agentApplications").take(500);
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ── Public: verified-agent directory ────────────────────────────────────
// Only APPROVED applications, and only the fields meant to be public — no
// NIN, no internal review notes, no raw document URLs. Backs the public
// /agents directory, which previously rendered 8 hardcoded fake agents.
export const listApprovedAgents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("agentApplications")
      .withIndex("by_status", (q) => q.eq("status", "APPROVED"))
      .take(500);
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.slice(0, args.limit ?? 100).map((r) => ({
      _id: r._id,
      fullName: r.fullName,
      agencyName: r.agencyName,
      specializations: r.specializations ?? [],
      statesOfOperation: r.statesOfOperation ?? [],
      experience: r.experience,
      bio: r.bio,
    }));
  },
});

export const reviewAgentApplication = auditedMutation(
  "partners:reviewAgentApplication",
)({
  args: {
    id: v.id("agentApplications"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("UNDER_REVIEW"),
      v.literal("APPROVED"),
      v.literal("REJECTED"),
    ),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, reviewNotes }) => {
    const reviewerId = await requireAdmin(ctx);
    const application = await ctx.db.get(id);
    if (!application?.userId)
      throw new ConvexError(
        "Link the application to an authenticated account first",
      );
    const account = await ctx.db.get(application.userId);
    if (!account || account.role === "ADMIN")
      throw new ConvexError("Invalid applicant account");
    if (status === "APPROVED")
      await requireSubmittedNin(ctx, application.userId);
    await ctx.db.patch(application.userId, {
      role: status === "APPROVED" ? "AGENT" : "CLIENT",
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: reviewerId,
      action: "AGENT_APPLICATION_REVIEWED",
      entityType: "agentApplications",
      entityId: String(id),
      detail: status,
      createdAt: Date.now(),
    });
    const patch: Record<string, unknown> = { status, updatedAt: Date.now() };
    if (reviewNotes !== undefined) patch.reviewNotes = reviewNotes;
    await ctx.db.patch(id, patch);
  },
});

// ── Admin: estate managers ─────────────────────────────────────────────────
export const listManagers = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("PENDING"),
        v.literal("APPROVED"),
        v.literal("SUSPENDED"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.status) {
      return await ctx.db
        .query("estateManagers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(500);
    }
    const rows = await ctx.db.query("estateManagers").take(500);
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const reviewManagerApplication = auditedMutation(
  "partners:reviewManagerApplication",
)({
  args: {
    id: v.id("estateManagers"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("APPROVED"),
      v.literal("SUSPENDED"),
    ),
  },
  handler: async (ctx, { id, status }) => {
    const reviewerId = await requireAdmin(ctx);
    const application = await ctx.db.get(id);
    if (!application?.userId)
      throw new ConvexError(
        "Link the application to an authenticated account first",
      );
    const account = await ctx.db.get(application.userId);
    if (!account || account.role === "ADMIN")
      throw new ConvexError("Invalid applicant account");
    if (status === "APPROVED")
      await requireSubmittedNin(ctx, application.userId);
    await ctx.db.patch(application.userId, {
      role: status === "APPROVED" ? "ESTATE_MANAGER" : "CLIENT",
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: reviewerId,
      action: "MANAGER_APPLICATION_REVIEWED",
      entityType: "estateManagers",
      entityId: String(id),
      detail: status,
      createdAt: Date.now(),
    });
    const patch: Record<string, unknown> = { status, updatedAt: Date.now() };
    if (status === "APPROVED") patch.approvedAt = Date.now();
    await ctx.db.patch(id, patch);
  },
});
