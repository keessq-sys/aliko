import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { contactRateKey, rateLimiter } from "./lib/rateLimits";
import { serviceRequestAggregate } from "./aggregates";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId as Id<"users">);
  if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
  return userId;
}

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
      v.literal("ARCHITECTURAL_DESIGN"),
      v.literal("SPACE_PLANNING"),
      v.literal("PROPERTY_DEVELOPMENT"),
      v.literal("BROKERAGE_DEAL"),
    ),
    location: v.optional(v.string()),
    projectBrief: v.string(),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    timeline: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "serviceRequest", {
      key: contactRateKey(args.requesterEmail, args.requesterPhone),
      throws: true,
    });
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
    const inserted = await ctx.db.get(id);
    if (inserted)
      await serviceRequestAggregate.insertIfDoesNotExist(ctx, inserted);
    return { id, reference };
  },
});

// ── Public: track a request by reference ───────────────────────────────────
export const getByReference = query({
  args: { reference: v.string() },
  handler: async (ctx, { reference }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const request = await ctx.db
      .query("serviceRequests")
      .withIndex("by_reference", (q) => q.eq("reference", reference))
      .unique();
    if (!request) return null;
    const user = await ctx.db.get(userId as Id<"users">);
    if (user?.role !== "ADMIN" && request.requesterId !== userId)
      throw new Error("Forbidden");
    return request;
  },
});

// ── Admin: list requests (optionally filtered by status) ───────────────────
export const listRequests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("NEW"),
        v.literal("REVIEWING"),
        v.literal("QUOTED"),
        v.literal("ACCEPTED"),
        v.literal("REJECTED"),
        v.literal("IN_PROGRESS"),
        v.literal("COMPLETED"),
      ),
    ),
    serviceSlug: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 200);
    let rows;
    if (args.status) {
      rows = await ctx.db
        .query("serviceRequests")
        .withIndex("by_status_date", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else {
      rows = await ctx.db
        .query("serviceRequests")
        .withIndex("by_date")
        .order("desc")
        .take(limit);
    }
    rows = rows
      .filter((r) => !args.serviceSlug || r.serviceSlug === args.serviceSlug)
      .sort((a, b) => b.createdAt - a.createdAt);
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
    await requireAdmin(ctx);
    const statuses = [
      "NEW",
      "REVIEWING",
      "QUOTED",
      "ACCEPTED",
      "REJECTED",
      "IN_PROGRESS",
      "COMPLETED",
    ] as const;
    const counts: Record<string, number> = {
      NEW: 0,
      REVIEWING: 0,
      QUOTED: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };
    const values = await Promise.all(
      statuses.map((status) =>
        serviceRequestAggregate.count(ctx, { bounds: { prefix: [status] } }),
      ),
    );
    statuses.forEach((status, index) => {
      counts[status] = values[index];
    });
    return {
      counts,
      total: values.reduce((sum, value) => sum + value, 0),
      totalQuotedValue: await serviceRequestAggregate.sum(ctx),
    };
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
    const adminId = await requireAdmin(ctx);
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
    const previous = await ctx.db.get(id);
    if (!previous) throw new Error("Service request not found");
    await ctx.db.patch(id, patch);
    const updated = await ctx.db.get(id);
    if (updated)
      await serviceRequestAggregate.replaceOrInsert(ctx, previous, updated);
    if (adminResponse?.trim()) {
      await ctx.db.insert("serviceRequestMessages", {
        requestId: id,
        senderId: adminId as Id<"users">,
        senderRole: "ADMIN",
        body: adminResponse.trim(),
        createdAt: now,
      });
    }
    return id;
  },
});

// ── Cron: nudge admin on service requests sitting unreviewed >48h ──────────
export const flagStaleRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const stale = await ctx.db
      .query("serviceRequests")
      .withIndex("by_status_date", (q) => q.eq("status", "NEW"))
      .take(500);
    const overdue = stale.filter((r) => r.createdAt < cutoff);
    for (const r of overdue) {
      await ctx.db.insert("notificationLog", {
        channel: "EMAIL",
        recipient: "admin",
        subject: "Service request awaiting review",
        message: `Request ${r.reference} (${r.serviceSlug}) from ${r.requesterName} has been unreviewed for over 48 hours.`,
        status: "QUEUED",
        relatedId: r._id,
        relatedType: "serviceRequests",
        createdAt: Date.now(),
      });
    }
    return { flagged: overdue.length };
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
      .order("desc")
      .take(200);
  },
});

async function requireConversationAccess(
  ctx: any,
  requestId: Id<"serviceRequests">,
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const [user, request] = await Promise.all([
    ctx.db.get(userId as Id<"users">),
    ctx.db.get(requestId),
  ]);
  if (!request) throw new Error("Request not found");
  if (user?.role !== "ADMIN" && request.requesterId !== userId)
    throw new Error("Forbidden");
  return { userId: userId as Id<"users">, user, request };
}

export const listMessages = query({
  args: { requestId: v.id("serviceRequests") },
  handler: async (ctx, { requestId }) => {
    await requireConversationAccess(ctx, requestId);
    return ctx.db
      .query("serviceRequestMessages")
      .withIndex("by_request_date", (q) => q.eq("requestId", requestId))
      .take(500);
  },
});

export const sendMessage = mutation({
  args: { requestId: v.id("serviceRequests"), body: v.string() },
  handler: async (ctx, { requestId, body }) => {
    const access = await requireConversationAccess(ctx, requestId);
    await rateLimiter.limit(ctx, "serviceMessage", {
      key: String(access.userId),
      throws: true,
    });
    const clean = body.trim();
    if (!clean || clean.length > 4000)
      throw new Error("Message must contain 1–4000 characters");
    const now = Date.now();
    const senderRole = access.user?.role === "ADMIN" ? "ADMIN" : "CLIENT";
    const id = await ctx.db.insert("serviceRequestMessages", {
      requestId,
      senderId: access.userId,
      senderRole,
      body: clean,
      createdAt: now,
    });
    await ctx.db.patch(requestId, { updatedAt: now });
    return id;
  },
});
