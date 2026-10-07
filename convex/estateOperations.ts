import { auditedMutation } from "./lib/auditedMutation";
import { estateAggregate } from "./aggregates";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireUser, requireAdmin } from "./lib/access";
import { validateAttachments } from "./lib/attachments";
import { rateLimiter } from "./lib/rateLimits";
import { requireManagerSubscription } from "./lib/managerPlans";
export const resolveTenant = auditedMutation("estateOperations:resolveTenant")({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await actor(ctx);
    await requireManagerSubscription(ctx, user);
    await rateLimiter.limit(ctx, "serviceMessage", {
      key: `tenant:${user._id}`,
      throws: true,
    });
    const tenant = await ctx.db
      .query("users")
      .withIndex("by_email", (q) =>
        q.eq("email", args.email.trim().toLowerCase()),
      )
      .unique();
    if (
      !tenant ||
      !["CLIENT", "TENANT", "DIASPORA_CLIENT"].includes(tenant.role) ||
      tenant.accountStatus === "SUSPENDED"
    )
      throw new Error("Tenant must have an active customer account");
    return { _id: tenant._id, name: tenant.name };
  },
});
async function actor(ctx: any) {
  const user = await requireUser(ctx);
  if (user.role === "ADMIN") await requireAdmin(ctx);
  else if (user.role !== "ESTATE_MANAGER") throw new Error("Forbidden");
  return user;
}
export const leases = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await actor(ctx);
    return ctx.db
      .query("leases")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
export const saveLease = auditedMutation("estateOperations:saveLease")({
  args: {
    id: v.optional(v.id("leases")),
    propertyId: v.id("properties"),
    tenantId: v.id("users"),
    unit: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    rent: v.number(),
    deposit: v.number(),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("ACTIVE"),
      v.literal("ENDED"),
    ),
    attachmentIds: v.array(v.id("storedAssets")),
  },
  handler: async (ctx, args) => {
    const user = await actor(ctx),
      property = await ctx.db.get(args.propertyId),
      tenant = await ctx.db.get(args.tenantId);
    if (!args.id || args.status !== "ENDED")
      await requireManagerSubscription(ctx, user);
    if (
      !property ||
      (user.role !== "ADMIN" && property.managerId !== user._id) ||
      !tenant ||
      !["CLIENT", "TENANT", "DIASPORA_CLIENT"].includes(tenant.role) ||
      tenant.accountStatus === "SUSPENDED"
    )
      throw new Error("Invalid assigned property or tenant");
    if (
      !args.unit.trim() ||
      args.unit.length > 80 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(args.startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(args.endDate) ||
      !Number.isFinite(Date.parse(args.startDate)) ||
      !Number.isFinite(Date.parse(args.endDate)) ||
      args.startDate >= args.endDate
    )
      throw new Error("Invalid unit or lease dates");
    if (
      [args.rent, args.deposit].some(
        (x) => !Number.isSafeInteger(Math.round(x * 100)) || x < 0,
      )
    )
      throw new Error("Invalid lease amount");
    const existing = args.id ? await ctx.db.get(args.id) : null;
    if (
      args.id &&
      (!existing || (user.role !== "ADMIN" && existing.ownerId !== user._id))
    )
      throw new Error("Lease not found");
    if (existing?.status === "ENDED" && args.status !== "ENDED")
      throw new Error("An ended lease cannot be reopened");
    await validateAttachments(ctx, user._id, args.attachmentIds);
    if (args.status === "ACTIVE") {
      const others = await ctx.db
        .query("leases")
        .withIndex("by_property_unit", (q) =>
          q.eq("propertyId", args.propertyId).eq("unit", args.unit.trim()),
        )
        .take(1001);
      if (others.length > 1000)
        throw new Error("Lease history requires administrator review");
      if (
        others.some(
          (x) =>
            x._id !== args.id &&
            x.status === "ACTIVE" &&
            x.startDate < args.endDate &&
            x.endDate > args.startDate,
        )
      )
        throw new Error("Unit is already occupied during these dates");
    }
    const { id, ...values } = args,
      now = Date.now();
    const leaseId = id
      ? (await ctx.db.patch(id, {
          ...values,
          unit: args.unit.trim(),
          updatedAt: now,
        }),
        id)
      : await ctx.db.insert("leases", {
          ...values,
          unit: args.unit.trim(),
          ownerId: user._id,
          createdAt: now,
          updatedAt: now,
        });
    await ctx.db.insert("adminAuditLog", {
      actorId: user._id,
      action: "LEASE_SAVED",
      entityType: "leases",
      entityId: String(leaseId),
      detail: args.status,
      createdAt: now,
    });
    const updated = await ctx.db.get(leaseId);
    if (updated) {
      if (existing)
        await estateAggregate.replaceOrInsert(ctx, existing, updated);
      else await estateAggregate.insertIfDoesNotExist(ctx, updated);
    }
    return leaseId;
  },
});
export const ledger = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await actor(ctx);
    return ctx.db
      .query("ledgerEntries")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
export const postLedger = auditedMutation("estateOperations:postLedger")({
  args: {
    leaseId: v.optional(v.id("leases")),
    recordId: v.optional(v.id("managementRecords")),
    direction: v.union(v.literal("INCOME"), v.literal("EXPENSE")),
    amountMinor: v.number(),
    reference: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await actor(ctx);
    if (
      !Number.isSafeInteger(args.amountMinor) ||
      args.amountMinor <= 0 ||
      args.amountMinor > 1e14 ||
      args.reference.trim().length < 3 ||
      args.reference.length > 120 ||
      !args.description.trim() ||
      args.description.length > 1000
    )
      throw new Error("Invalid ledger entry");
    if (!args.leaseId && !args.recordId)
      throw new Error("Link an entry to its lease or operational record");
    if (args.leaseId) {
      const lease = await ctx.db.get(args.leaseId);
      if (!lease || lease.ownerId !== user._id)
        throw new Error("Lease not found");
    }
    if (args.recordId) {
      const record = await ctx.db.get(args.recordId);
      if (!record || record.ownerId !== user._id)
        throw new Error("Record not found");
    }
    const previous = await ctx.db
      .query("ledgerEntries")
      .withIndex("by_owner_reference", (q) =>
        q.eq("ownerId", user._id).eq("reference", args.reference.trim()),
      )
      .unique();
    if (previous) {
      if (
        previous.amountMinor !== args.amountMinor ||
        previous.direction !== args.direction ||
        previous.leaseId !== args.leaseId ||
        previous.recordId !== args.recordId
      )
        throw new Error("Reference already used for a different entry");
      return previous._id;
    }
    const now = Date.now(),
      id = await ctx.db.insert("ledgerEntries", {
        ...args,
        reference: args.reference.trim(),
        currency: "NGN",
        ownerId: user._id,
        createdBy: user._id,
        createdAt: now,
      });
    const entry = await ctx.db.get(id);
    if (entry) await estateAggregate.insertIfDoesNotExist(ctx, entry);
    await ctx.db.insert("adminAuditLog", {
      actorId: user._id,
      action: "LEDGER_POSTED",
      entityType: "ledgerEntries",
      entityId: String(id),
      createdAt: now,
    });
    return id;
  },
});

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const user = await actor(ctx),
      owner = String(user._id),
      now = new Date();
    const months = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const month = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1),
        )
          .toISOString()
          .slice(0, 7);
        const revenue = await estateAggregate.sum(ctx, {
          bounds: { prefix: [owner, "LEDGER", month, "INCOME"] },
        });
        const expenses = await estateAggregate.sum(ctx, {
          bounds: { prefix: [owner, "LEDGER", month, "EXPENSE"] },
        });
        return { month, revenue: revenue / 100, expenses: expenses / 100 };
      }),
    );
    const activeLeases = await estateAggregate.count(ctx, {
      bounds: { prefix: [owner, "LEASE", "ACTIVE"] },
    });
    const latest = await ctx.db
      .query("ledgerEntries")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(10);
    const records = await ctx.db
      .query("managementRecords")
      .withIndex("by_owner_kind", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(10);
    return {
      months,
      activeLeases,
      recent: [
        ...latest.map((x) => ({
          description: `posted ${x.direction.toLowerCase()} entry ${x.reference}`,
          timestamp: new Date(x.createdAt).toISOString(),
          createdAt: x.createdAt,
        })),
        ...records.map((x) => ({
          description: `recorded ${x.kind.toLowerCase().replaceAll("_", " ")}: ${x.title}`,
          timestamp: new Date(x.updatedAt).toISOString(),
          createdAt: x.updatedAt,
        })),
      ]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10),
    };
  },
});
export const assignedAgents = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await actor(ctx);
    const access = await requireManagerSubscription(ctx, user);
    if (user.role !== "ADMIN" && access.plan !== "PROFESSIONAL")
      throw new Error("Agent management requires the Professional plan.");
    const result = await ctx.db
      .query("properties")
      .withIndex("by_manager", (q) => q.eq("managerId", user._id))
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: (
        await Promise.all(
          result.page.map(async (property) => {
            const agent = property.agentId
              ? await ctx.db.get(property.agentId)
              : null;
            return agent?.role === "AGENT" &&
              agent.accountStatus !== "SUSPENDED"
              ? {
                  propertyId: property._id,
                  property: property.title,
                  name: agent.name,
                  agentId: agent._id,
                }
              : null;
          }),
        )
      ).filter(Boolean),
    };
  },
});
export const backfillEstateAggregate = internalMutation({
  args: {
    table: v.union(v.literal("leases"), v.literal("ledgerEntries")),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query(args.table)
      .paginate({ numItems: 100, cursor: args.cursor });
    for (const doc of result.page)
      await estateAggregate.insertIfDoesNotExist(ctx, doc);
    return { isDone: result.isDone, cursor: result.continueCursor };
  },
});
