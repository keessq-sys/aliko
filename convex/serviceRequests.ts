import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function makeRef(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ADK-${prefix}-${year}-${rand}`;
}

// ── Public: submit a service request (guests allowed) ──────────────────────
export const submitServiceRequest = mutation({
  args: {
    serviceSlug: v.string(),
    requesterName: v.string(),
    requesterEmail: v.string(),
    requesterPhone: v.string(),
    company: v.optional(v.string()),
    requestType: v.union(
      v.literal("SUPPLY_CONTRACT"),
      v.literal("PURCHASE"),
      v.literal("SMART_HOME_INSTALL"),
      v.literal("INTERIOR_DESIGN"),
      v.literal("CONSTRUCTION_PROJECT"),
      v.literal("GENERAL_CONTRACT"),
    ),
    location: v.optional(v.string()),
    projectBrief: v.string(),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    timeline: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const service = await ctx.db
      .query("services")
      .withIndex("by_slug", (q) => q.eq("slug", args.serviceSlug))
      .unique();
    if (!service) throw new Error("Unknown service: " + args.serviceSlug);

    let userId: any = null;
    try {
      const id = await getAuthUserId(ctx);
      if (id) userId = id;
    } catch {
      /* guest submission */
    }

    const now = Date.now();
    const reference = makeRef("SVC");
    const id = await ctx.db.insert("serviceRequests", {
      reference,
      serviceId: service._id,
      serviceSlug: service.slug,
      requesterId: userId,
      requesterName: args.requesterName,
      requesterEmail: args.requesterEmail,
      requesterPhone: args.requesterPhone,
      company: args.company,
      requestType: args.requestType,
      location: args.location,
      projectBrief: args.projectBrief,
      budgetMin: args.budgetMin,
      budgetMax: args.budgetMax,
      timeline: args.timeline,
      attachments: args.attachments,
      status: "NEW",
      createdAt: now,
      updatedAt: now,
    });
    return { id, reference };
  },
});

// ── Public: track a request by reference ───────────────────────────────────
export const getByReference = query({
  args: { reference: v.string() },
  handler: async (ctx, { reference }) => {
    return await ctx.db
      .query("serviceRequests")
      .withIndex("by_reference", (q) => q.eq("reference", reference))
      .unique();
  },
});

// ── Admin: list requests (optionally filtered by status) ───────────────────
export const listRequests = query({
  args: {
    status: v.optional(v.union(
      v.literal("NEW"),
      v.literal("REVIEWING"),
      v.literal("QUOTED"),
      v.literal("ACCEPTED"),
      v.literal("REJECTED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
    )),
    serviceSlug: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let rows;
    if (args.status) {
      rows = await ctx.db
        .query("serviceRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      rows = await ctx.db.query("serviceRequests").collect();
    }
    rows = rows
      .filter((r) => !args.serviceSlug || r.serviceSlug === args.serviceSlug)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 100);
    return rows.map((r) => ({
      ...r,
      adminResponse: r.adminResponse ?? null,
    }));
  },
});

// ── Admin: pipeline counters for the sidebar/dashboard ─────────────────────
export const getStatusCounts = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("serviceRequests").collect();
    const counts: Record<string, number> = {
      NEW: 0, REVIEWING: 0, QUOTED: 0, ACCEPTED: 0, REJECTED: 0, IN_PROGRESS: 0, COMPLETED: 0,
    };
    let totalBudget = 0;
    for (const r of rows) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
      if (r.quoteAmount) totalBudget += r.quoteAmount;
    }
    return { counts, total: rows.length, totalQuotedValue: totalBudget };
  },
});

// ── Admin: update pipeline status / response / quote ───────────────────────
export const reviewServiceRequest = mutation({
  args: {
    id: v.id("serviceRequests"),
    status: v.union(
      v.literal("NEW"),
      v.literal("REVIEWING"),
      v.literal("QUOTED"),
      v.literal("ACCEPTED"),
      v.literal("REJECTED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
    ),
    adminResponse: v.optional(v.string()),
    quoteAmount: v.optional(v.number()),
  },
  handler: async (ctx, { id, status, adminResponse, quoteAmount }) => {
    const now = Date.now();
    const patch: Record<string, unknown> = { status, updatedAt: now };
    if (adminResponse !== undefined) {
      patch.adminResponse = adminResponse;
      patch.respondedAt = now;
    }
    if (quoteAmount !== undefined) {
      patch.quoteAmount = quoteAmount;
      patch.quotedAt = now;
    }
    if (status === "COMPLETED") patch.completedAt = now;
    await ctx.db.patch(id, patch);
    return id;
  },
});

// ── Client portal: my submitted requests ───────────────────────────────────
export const getMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("serviceRequests")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .collect();
  },
});
