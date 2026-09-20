import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function makeRef(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
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
    nin: v.optional(v.string()),
    documentUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let userId: any = null;
    try {
      const id = await getAuthUserId(ctx);
      if (id) userId = id;
    } catch {
      /* anonymous */
    }
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
    plan: v.union(v.literal("STARTER"), v.literal("PROFESSIONAL"), v.literal("ENTERPRISE")),
  },
  handler: async (ctx, args) => {
    let userId: any = null;
    try {
      const id = await getAuthUserId(ctx);
      if (id) userId = id;
    } catch {
      /* anonymous */
    }
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
  args: { status: v.optional(v.union(
    v.literal("PENDING"), v.literal("UNDER_REVIEW"), v.literal("APPROVED"), v.literal("REJECTED"),
  )) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("agentApplications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    const rows = await ctx.db.query("agentApplications").collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const reviewAgentApplication = mutation({
  args: {
    id: v.id("agentApplications"),
    status: v.union(v.literal("PENDING"), v.literal("UNDER_REVIEW"), v.literal("APPROVED"), v.literal("REJECTED")),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, reviewNotes }) => {
    const patch: Record<string, unknown> = { status, updatedAt: Date.now() };
    if (reviewNotes !== undefined) patch.reviewNotes = reviewNotes;
    await ctx.db.patch(id, patch);
  },
});

// ── Admin: estate managers ─────────────────────────────────────────────────
export const listManagers = query({
  args: { status: v.optional(v.union(v.literal("PENDING"), v.literal("APPROVED"), v.literal("SUSPENDED"))) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("estateManagers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    const rows = await ctx.db.query("estateManagers").collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const reviewManagerApplication = mutation({
  args: {
    id: v.id("estateManagers"),
    status: v.union(v.literal("PENDING"), v.literal("APPROVED"), v.literal("SUSPENDED")),
  },
  handler: async (ctx, { id, status }) => {
    const patch: Record<string, unknown> = { status, updatedAt: Date.now() };
    if (status === "APPROVED") patch.approvedAt = Date.now();
    await ctx.db.patch(id, patch);
  },
});
