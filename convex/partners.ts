import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin, requireUser } from "./lib/access";
import { rateLimiter, contactRateKey } from "./lib/rateLimits";

function makeRef(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomUUID();
  return `ADK-${prefix}-${year}-${rand}`;
}

// ── Public: agent application (5-step wizard) ──────────────────────────────
export const submitAgentApplication = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
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
      throw new Error("Use your account email");
    await rateLimiter.limit(ctx, "registration", {
      key: String(userId),
      throws: true,
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
export const submitManagerApplication = mutation({
  args: {
    companyName: v.string(),
    contactName: v.string(),
    email: v.string(),
    phone: v.string(),
    cacRcNumber: v.optional(v.string()),
    statesOfOperation: v.array(v.string()),
    portfolioSize: v.optional(v.string()),
    plan: v.union(
      v.literal("STARTER"),
      v.literal("PROFESSIONAL"),
      v.literal("ENTERPRISE"),
    ),
  },
  handler: async (ctx, args) => {
    const applicant = await requireUser(ctx);
    const userId = applicant._id;
    if (args.email.trim().toLowerCase() !== applicant.email.toLowerCase())
      throw new Error("Use your account email");
    await rateLimiter.limit(ctx, "registration", {
      key: String(userId),
      throws: true,
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

export const reviewAgentApplication = mutation({
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
      throw new Error("Link the application to an authenticated account first");
    const account = await ctx.db.get(application.userId);
    if (!account || account.role === "ADMIN")
      throw new Error("Invalid applicant account");
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

export const reviewManagerApplication = mutation({
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
      throw new Error("Link the application to an authenticated account first");
    const account = await ctx.db.get(application.userId);
    if (!account || account.role === "ADMIN")
      throw new Error("Invalid applicant account");
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
