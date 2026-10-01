import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser, requireAdmin } from "./lib/access";
import type { Id } from "./_generated/dataModel";
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
export const myFinancialSummary = query({
  args: {},
  handler: async (ctx) => {
    const actor = await requireUser(ctx);
    const records = await ctx.db
      .query("managementRecords")
      .withIndex("by_owner_kind", (q) => q.eq("ownerId", actor._id))
      .take(500);
    return {
      commission: records
        .filter((r) => r.kind === "COMMISSION" && r.status === "COMPLETED")
        .reduce((a, r) => a + (r.amount ?? 0), 0),
      expenses: records
        .filter((r) => r.kind === "EXPENSE" && r.status === "COMPLETED")
        .reduce((a, r) => a + (r.amount ?? 0), 0),
      workOrders: records.filter(
        (r) =>
          r.kind === "WORK_ORDER" &&
          r.status !== "COMPLETED" &&
          r.status !== "CANCELLED",
      ).length,
      tenants: records.filter(
        (r) => r.kind === "TENANT" && r.status !== "CANCELLED",
      ).length,
    };
  },
});
