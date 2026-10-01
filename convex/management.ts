import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser, requireAdmin } from "./lib/access";
import type { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { validateAttachments } from "./lib/attachments";
import { managementAggregate } from "./aggregates";
import { internalMutation } from "./_generated/server";
const kind = v.union(
  v.literal("TENANT"),
  v.literal("WORK_ORDER"),
  v.literal("VENDOR"),
  v.literal("DOCUMENT"),
  v.literal("EXPENSE"),
  v.literal("REFERRAL"),
  v.literal("COMMISSION"),
  v.literal("MESSAGE"),
);
export const listRecords = query({
  args: { kind },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    if (actor.role === "ADMIN") await requireAdmin(ctx);
    const rows =
      actor.role === "ADMIN"
        ? await ctx.db
            .query("managementRecords")
            .withIndex("by_kind", (q) => q.eq("kind", args.kind))
            .order("desc")
            .take(200)
        : await ctx.db
            .query("managementRecords")
            .withIndex("by_owner_kind", (q) =>
              q.eq("ownerId", actor._id).eq("kind", args.kind),
            )
            .order("desc")
            .take(200);
    return rows;
  },
});
export const saveRecord = mutation({
  args: {
    id: v.optional(v.id("managementRecords")),
    kind,
    title: v.string(),
    detail: v.string(),
    amount: v.optional(v.number()),
    contact: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    paymentId: v.optional(v.id("payments")),
    propertyId: v.optional(v.id("properties")),
    vendorId: v.optional(v.id("managementRecords")),
    attachmentIds: v.optional(v.array(v.id("storedAssets"))),
    status: v.union(
      v.literal("OPEN"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED"),
    ),
  },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    if (!["ADMIN", "AGENT", "ESTATE_MANAGER"].includes(actor.role))
      throw new Error("Forbidden");
    if (actor.role === "ADMIN") await requireAdmin(ctx);
    if (
      args.title.trim().length < 3 ||
      args.title.length > 180 ||
      args.detail.length > 10000
    )
      throw new Error("Provide a title and a shorter description");
    if (
      args.amount !== undefined &&
      (!Number.isFinite(args.amount) || args.amount < 0)
    )
      throw new Error("Invalid amount");
    if (actor.role === "AGENT" && !["REFERRAL", "MESSAGE"].includes(args.kind))
      throw new Error("Agents can create referrals and messages");
    const existing = args.id ? await ctx.db.get(args.id) : null;
    if (
      args.id &&
      (!existing || (existing.ownerId !== actor._id && actor.role !== "ADMIN"))
    )
      throw new Error("Record not found");
    if (existing && existing.kind !== args.kind)
      throw new Error("Record type cannot change");
    await validateAttachments(ctx, actor._id, args.attachmentIds ?? []);
    if (args.propertyId) {
      const property = await ctx.db.get(args.propertyId);
      if (
        !property ||
        (actor.role !== "ADMIN" && property.managerId !== actor._id)
      )
        throw new Error("Property is not assigned to you");
    }
    if (args.vendorId) {
      const vendor = await ctx.db.get(args.vendorId);
      if (
        args.kind !== "WORK_ORDER" ||
        !vendor ||
        vendor.kind !== "VENDOR" ||
        vendor.status === "CANCELLED" ||
        (actor.role !== "ADMIN" && vendor.ownerId !== actor._id)
      )
        throw new Error("Choose an active vendor you manage");
    }
    if (args.kind === "COMMISSION") {
      if (actor.role !== "ADMIN" || !args.paymentId)
        throw new Error(
          "Commission must be approved against a verified payment",
        );
      const payment = await ctx.db.get(args.paymentId);
      if (
        !payment ||
        payment.status !== "SUCCESS" ||
        (args.amount ?? 0) > payment.amount
      )
        throw new Error("Invalid commission payment");
    }
    const ownerId: Id<"users"> =
      existing?.ownerId ??
      (actor.role === "ADMIN" && args.ownerId ? args.ownerId : actor._id);
    const owner = await ctx.db.get(ownerId);
    if (!owner) throw new Error("Owner account not found");
    if (args.kind === "COMMISSION" && owner.role !== "AGENT")
      throw new Error("Commission owner must be an approved agent");
    const { id, ...value } = args;
    const values = {
      ...value,
      ownerId,
      title: args.title.trim(),
      createdBy: existing?.createdBy ?? actor._id,
      updatedAt: Date.now(),
    };
    const recordId = id
      ? (await ctx.db.patch(id, values), id)
      : await ctx.db.insert("managementRecords", {
          ...values,
          createdAt: Date.now(),
        });
    const updated = await ctx.db.get(recordId);
    if (updated) {
      if (existing)
        await managementAggregate.replaceOrInsert(ctx, existing, updated);
      else await managementAggregate.insert(ctx, updated);
    }
    await ctx.db.insert("adminAuditLog", {
      actorId: actor._id,
      action: "MANAGEMENT_RECORD_SAVED",
      entityType: "managementRecords",
      entityId: String(recordId),
      detail: args.kind,
      createdAt: Date.now(),
    });
    return recordId;
  },
});
export const pageRecords = query({
  args: { kind, paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    if (actor.role === "ADMIN") {
      await requireAdmin(ctx);
      return ctx.db
        .query("managementRecords")
        .withIndex("by_kind", (q) => q.eq("kind", args.kind))
        .order("desc")
        .paginate(args.paginationOpts);
    }
    if (!["AGENT", "ESTATE_MANAGER"].includes(actor.role))
      throw new Error("Forbidden");
    return ctx.db
      .query("managementRecords")
      .withIndex("by_owner_kind", (q) =>
        q.eq("ownerId", actor._id).eq("kind", args.kind),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const attachmentLinks = query({
  args: { recordId: v.id("managementRecords") },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    if (actor.role === "ADMIN") await requireAdmin(ctx);
    const row = await ctx.db.get(args.recordId);
    if (!row || (actor.role !== "ADMIN" && row.ownerId !== actor._id))
      throw new Error("Record not found");
    return Promise.all(
      (row.attachmentIds ?? []).map(async (id) => {
        const asset = await ctx.db.get(id);
        return asset?.status === "ACTIVE"
          ? {
              name: asset.fileName,
              url: await ctx.storage.getUrl(asset.storageId),
            }
          : null;
      }),
    );
  },
});
export const myFinancialSummary = query({
  args: {},
  handler: async (ctx) => {
    const actor = await requireUser(ctx);
    const owner = String(actor._id);
    const sum = (kind: string, status: string) =>
      managementAggregate.sum(ctx, {
        bounds: { prefix: [owner, kind, status] },
      });
    const count = (kind: string, status: string) =>
      managementAggregate.count(ctx, {
        bounds: { prefix: [owner, kind, status] },
      });
    return {
      commission: await sum("COMMISSION", "COMPLETED"),
      expenses: await sum("EXPENSE", "COMPLETED"),
      workOrders:
        (await count("WORK_ORDER", "OPEN")) +
        (await count("WORK_ORDER", "IN_PROGRESS")),
      tenants:
        (await count("TENANT", "OPEN")) +
        (await count("TENANT", "IN_PROGRESS")) +
        (await count("TENANT", "COMPLETED")),
      referrals:
        (await count("REFERRAL", "OPEN")) +
        (await count("REFERRAL", "IN_PROGRESS")) +
        (await count("REFERRAL", "COMPLETED")),
      completedReferrals: await count("REFERRAL", "COMPLETED"),
    };
  },
});
export const backfillAggregate = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("managementRecords")
      .paginate({ cursor: args.cursor, numItems: 100 });
    for (const row of rows.page)
      await managementAggregate.insertIfDoesNotExist(ctx, row);
    return { isDone: rows.isDone, cursor: rows.continueCursor };
  },
});
