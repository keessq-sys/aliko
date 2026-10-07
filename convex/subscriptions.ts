import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { auditedMutation } from "./lib/auditedMutation";
import { requireUser, requireAdmin } from "./lib/access";
import { MANAGER_PLANS, managerEntitlement } from "./lib/managerPlans";
export const expireOne = internalMutation({
  args: { id: v.id("managerSubscriptions") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.status !== "ACTIVE" || row.endsAt > Date.now()) return;
    await ctx.db.patch(row._id, { status: "EXPIRED", updatedAt: Date.now() });
    await ctx.db.insert("adminAuditLog", {
      actorId: row.ownerId,
      action: "SUBSCRIPTION_EXPIRED",
      entityType: "managerSubscriptions",
      entityId: String(row._id),
      createdAt: Date.now(),
    });
  },
});
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return {
      access: await managerEntitlement(ctx, user),
      plans: MANAGER_PLANS,
      subscriptions: await ctx.db
        .query("managerSubscriptions")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .order("desc")
        .take(50),
    };
  },
});
export const cancel = auditedMutation("subscriptions:cancel")({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const row = await ctx.db
      .query("managerSubscriptions")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .first();
    if (!row) throw new Error("Subscription not found.");
    // No recurring debit is issued: cancellation prevents renewal, preserves the paid period.
    await ctx.db.patch(row._id, {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });
  },
});
export const selectPlan = auditedMutation("subscriptions:selectPlan")({
  args: {
    managerId: v.id("estateManagers"),
    plan: v.union(v.literal("STARTER"), v.literal("PROFESSIONAL")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      manager = await ctx.db.get(args.managerId);
    if (!manager || manager.userId !== user._id) throw new Error("Forbidden");
    if ((manager.paidThrough ?? 0) > Date.now())
      throw new Error(
        "Plan changes take effect after the current paid period ends.",
      );
    const pending = await ctx.db
      .query("checkoutOrders")
      .withIndex("by_target_status", (q) =>
        q
          .eq("kind", "MANAGER")
          .eq("targetId", String(manager._id))
          .eq("status", "PENDING"),
      )
      .first();
    if (pending)
      throw new Error("Resolve the pending payment before changing plan.");
    await ctx.db.patch(manager._id, {
      plan: args.plan,
      monthlyFeeNgn: MANAGER_PLANS[args.plan].monthlyFeeNgn,
      updatedAt: Date.now(),
    });
  },
});
export const revoke = auditedMutation("subscriptions:revoke")({
  args: { id: v.id("managerSubscriptions"), reason: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.reason.trim().length < 5)
      throw new Error("Provide a revocation reason.");
    await ctx.db.patch(args.id, {
      status: "REVOKED",
      reason: args.reason.slice(0, 500),
      updatedAt: Date.now(),
    });
  },
});
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("managerSubscriptions").order("desc").take(200);
  },
});
export const expire = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("managerSubscriptions")
      .withIndex("by_status_end", (q) =>
        q.eq("status", "ACTIVE").lte("endsAt", Date.now()),
      )
      .take(200);
    for (const row of expired) {
      await ctx.db.patch(row._id, { status: "EXPIRED", updatedAt: Date.now() });
      await ctx.db.insert("adminAuditLog", {
        actorId: row.ownerId,
        action: "SUBSCRIPTION_EXPIRED",
        entityType: "managerSubscriptions",
        entityId: String(row._id),
        createdAt: Date.now(),
      });
    }
  },
});
