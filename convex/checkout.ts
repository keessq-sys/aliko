import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  query,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import type { MutationCtx, QueryCtx, ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { requireUser, requireAdmin, requireSubmittedNin } from "./lib/access";
import { auditedMutation } from "./lib/auditedMutation";
import { rateLimiter } from "./lib/rateLimits";
import { assertCheckoutEnvironment } from "./lib/checkoutReadiness";
import { MANAGER_PLANS } from "./lib/managerPlans";
const kind = v.union(
  v.literal("PROPERTY"),
  v.literal("SERVICE"),
  v.literal("MANAGER"),
);
type Kind = "PROPERTY" | "SERVICE" | "MANAGER";
const planPrices = {
  STARTER: MANAGER_PLANS.STARTER.monthlyFeeNgn,
  PROFESSIONAL: MANAGER_PLANS.PROFESSIONAL.monthlyFeeNgn,
};
export const providers = query({
  args: {},
  handler: async () => {
    function status(provider: "KORAPAY" | "FLUTTERWAVE", secret?: string) {
      let available = false;
      if (secret) {
        try {
          assertCheckoutEnvironment(provider, secret);
          available = true;
        } catch {}
      }
      return {
        configured: Boolean(secret),
        available,
        sandbox:
          provider === "KORAPAY"
            ? (secret?.startsWith("sk_test_") ?? false)
            : /TEST/i.test(secret ?? ""),
      };
    }
    return {
      korapay: status("KORAPAY", process.env.KORAPAY_SECRET_KEY),
      flutterwave: status("FLUTTERWAVE", process.env.FLUTTERWAVE_SECRET_KEY),
    };
  },
});
export const managerPlans = query({
  args: {},
  handler: async () => planPrices,
});

// Resolve every payable amount from trusted records, never from the browser.
async function resolve(
  ctx: QueryCtx | MutationCtx,
  type: string,
  targetId: string,
  owner: Id<"users">,
): Promise<{ amount: number; title: string }> {
  let result: { amount: number; title: string };
  if (type === "PROPERTY") {
    const row = await ctx.db.get(targetId as Id<"properties">);
    if (
      !row ||
      !row.isActive ||
      row.verificationStatus !== "VERIFIED" ||
      row.status !== "AVAILABLE"
    )
      throw new Error("Property is not available for purchase.");
    result = { amount: row.price, title: row.title };
  } else if (type === "SERVICE") {
    const row = await ctx.db.get(targetId as Id<"serviceRequests">);
    if (!row || row.requesterId !== owner)
      throw new Error("Service request does not belong to your account.");
    if (
      !["QUOTED", "ACCEPTED", "IN_PROGRESS"].includes(row.status) ||
      !row.quoteAmount ||
      row.paidAmount
    )
      throw new Error("An unpaid approved service quote is required.");
    result = {
      amount: row.quoteAmount,
      title: `${row.serviceSlug} — ${row.reference}`,
    };
  } else if (type === "MANAGER") {
    const row = await ctx.db.get(targetId as Id<"estateManagers">);
    if (
      !row ||
      row.userId !== owner ||
      row.status === "SUSPENDED" ||
      row.plan === "ENTERPRISE"
    )
      throw new Error("Manager plan is not available.");
    if ((row.paidThrough ?? 0) > Date.now())
      throw new Error("This subscription period is already paid.");
    result = {
      amount: row.monthlyFeeNgn ?? planPrices[row.plan],
      title: `${row.plan} — ${row.companyName} (one month)`,
    };
  } else throw new Error("Unsupported payment type.");
  if (
    !Number.isFinite(result.amount) ||
    result.amount <= 0 ||
    Math.abs(result.amount * 100 - Math.round(result.amount * 100)) > 0.0001
  )
    throw new Error("A valid payable amount must be configured.");
  return result;
}
export const create = auditedMutation("checkout:create")({
  args: { kind, targetId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const price = await resolve(ctx, args.kind, args.targetId, user._id);
    const existing = await ctx.db
      .query("checkoutOrders")
      .withIndex("by_target", (q) =>
        q.eq("kind", args.kind).eq("targetId", args.targetId),
      )
      .take(100);
    const pending = await ctx.db
      .query("checkoutOrders")
      .withIndex("by_target_status", (q) =>
        q
          .eq("kind", args.kind)
          .eq("targetId", args.targetId)
          .eq("status", "PENDING"),
      )
      .first();
    if (pending && pending.ownerId !== user._id)
      throw new Error("A payment is already pending for this item.");
    const own = existing.find(
      (o) => o.ownerId === user._id && ["DRAFT", "PENDING"].includes(o.status),
    );
    if (own) return { reference: own.reference };
    const reference = `ADK-ORDER-${crypto.randomUUID()}`;
    await ctx.db.insert("checkoutOrders", {
      reference,
      ownerId: user._id,
      ...args,
      ...price,
      currency: "NGN",
      status: "DRAFT",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { reference };
  },
});
export const get = query({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const order = await ctx.db
      .query("checkoutOrders")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (!order || order.ownerId !== user._id) return null;
    if (order.status === "DRAFT") {
      try {
        const price = await resolve(ctx, order.kind, order.targetId, user._id);
        return { ...order, ...price, available: true, reason: "" };
      } catch (e) {
        return {
          ...order,
          available: false,
          reason: e instanceof Error ? e.message : "Item unavailable",
        };
      }
    }
    const latest = await ctx.db
      .query("checkoutAttempts")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .order("desc")
      .first();
    return {
      ...order,
      available: true,
      reason: "",
      checkoutUrl:
        latest?.status === "PENDING" ? latest.checkoutUrl : undefined,
    };
  },
});
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const u = await requireUser(ctx);
    return ctx.db
      .query("checkoutOrders")
      .withIndex("by_owner", (q) => q.eq("ownerId", u._id))
      .order("desc")
      .take(100);
  },
});
export const adminPage = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db
      .query("checkoutOrders")
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (order) => ({
          ...order,
          attempt: await ctx.db
            .query("checkoutAttempts")
            .withIndex("by_order", (q) => q.eq("orderId", order._id))
            .order("desc")
            .first(),
        })),
      ),
    };
  },
});
export const setManagerFee = auditedMutation("checkout:setManagerFee")({
  args: { managerId: v.id("estateManagers"), amount: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isFinite(args.amount) || args.amount <= 0)
      throw new Error("Fee must be positive.");
    await ctx.db.patch(args.managerId, {
      monthlyFeeNgn: args.amount,
      updatedAt: Date.now(),
    });
  },
});
export const prepare = internalMutation({
  args: {
    reference: v.string(),
    expectedAmount: v.number(),
    provider: v.optional(
      v.union(v.literal("FLUTTERWAVE"), v.literal("KORAPAY")),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "ADMIN") await requireSubmittedNin(ctx, user._id);
    if (user.role !== "ADMIN" && (user.address?.trim().length ?? 0) < 10)
      throw new Error(
        "Complete identity verification and legal address before checkout.",
      );
    await rateLimiter.limit(ctx, "checkout", {
      key: String(user._id),
      throws: true,
    });
    const order = await ctx.db
      .query("checkoutOrders")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (!order || order.ownerId !== user._id || order.status !== "DRAFT")
      throw new Error("This order is not eligible for a new payment.");
    const current = await resolve(ctx, order.kind, order.targetId, user._id);
    if (
      Math.round(current.amount * 100) !== Math.round(args.expectedAmount * 100)
    )
      throw new Error(
        "The price changed. Review the updated amount before paying.",
      );
    const others = await ctx.db
      .query("checkoutOrders")
      .withIndex("by_target", (q) =>
        q.eq("kind", order.kind).eq("targetId", order.targetId),
      )
      .take(100);
    const pending = await ctx.db
      .query("checkoutOrders")
      .withIndex("by_target_status", (q) =>
        q
          .eq("kind", order.kind)
          .eq("targetId", order.targetId)
          .eq("status", "PENDING"),
      )
      .first();
    if (pending && pending._id !== order._id)
      throw new Error("Another payment is pending for this item.");
    const provider = args.provider ?? "FLUTTERWAVE";
    // Korapay requires at most 50 characters; order ownership lives in the attempt row.
    const reference = `ADK-${provider === "KORAPAY" ? "KPY" : "FLW"}-${crypto.randomUUID()}`;
    await ctx.db.patch(order._id, {
      ...current,
      status: "PENDING",
      updatedAt: Date.now(),
    });
    await ctx.db.insert("checkoutAttempts", {
      orderId: order._id,
      provider,
      testMode:
        provider === "KORAPAY"
          ? (process.env.KORAPAY_SECRET_KEY?.startsWith("sk_test_") ?? false)
          : /TEST/i.test(process.env.FLUTTERWAVE_SECRET_KEY ?? ""),
      reference,
      amount: current.amount,
      currency: "NGN",
      status: "PENDING",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return {
      order: { ...order, ...current },
      reference,
      customer: { email: user.email, name: user.name, phonenumber: user.phone },
    };
  },
});
export const failed = internalMutation({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const a = await ctx.db
      .query("checkoutAttempts")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (a?.status === "PENDING") {
      await ctx.db.patch(a._id, { status: "FAILED", updatedAt: Date.now() });
      await ctx.db.patch(a.orderId, { status: "DRAFT", updatedAt: Date.now() });
    }
  },
});
export const attempt = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("checkoutAttempts")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    return attempt
      ? { attempt, order: await ctx.db.get(attempt.orderId) }
      : null;
  },
});
export const saveLink = internalMutation({
  args: { reference: v.string(), url: v.string() },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("checkoutAttempts")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (attempt?.status === "PENDING")
      await ctx.db.patch(attempt._id, {
        checkoutUrl: args.url,
        updatedAt: Date.now(),
      });
  },
});
export const administrator = internalQuery({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return true;
  },
});
export const settle = internalMutation({
  args: {
    reference: v.string(),
    providerId: v.string(),
    amount: v.number(),
    currency: v.string(),
    provider: v.optional(
      v.union(v.literal("FLUTTERWAVE"), v.literal("KORAPAY")),
    ),
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("checkoutAttempts")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (!attempt) throw new Error("Unknown payment reference.");
    if (
      (attempt.provider ?? "FLUTTERWAVE") !== (args.provider ?? "FLUTTERWAVE")
    )
      throw new Error("Payment provider mismatch.");
    if (
      attempt.testMode &&
      (process.env.DEPLOYMENT_ENVIRONMENT ?? "production") === "production"
    )
      throw new Error("Sandbox payments cannot fulfil production orders.");
    const order = await ctx.db.get(attempt.orderId);
    if (!order) throw new Error("Order not found.");
    if (
      !Number.isFinite(args.amount) ||
      args.amount <= 0 ||
      args.currency !== attempt.currency ||
      Math.abs(args.amount - attempt.amount) > 0.001
    )
      throw new Error("Payment amount or currency mismatch.");
    if (attempt.status === "SUCCESS")
      return { reference: order.reference, newlyConfirmed: false };
    if (attempt.status !== "PENDING" || order.status !== "PENDING")
      throw new Error("Payment needs administrator reconciliation.");
    const duplicate = await ctx.db
      .query("checkoutAttempts")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .unique();
    if (duplicate) throw new Error("Provider transaction already used.");
    await ctx.db.patch(attempt._id, {
      status: "SUCCESS",
      providerId: args.providerId,
      updatedAt: Date.now(),
    });
    await ctx.db.patch(order._id, {
      status: "PAID",
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });
    if (order.kind === "PROPERTY")
      await ctx.db.patch(order.targetId as Id<"properties">, {
        status: "RESERVED",
        updatedAt: Date.now(),
      });
    if (order.kind === "SERVICE")
      await ctx.db.patch(order.targetId as Id<"serviceRequests">, {
        paidAmount: attempt.amount,
        updatedAt: Date.now(),
      });
    if (order.kind === "MANAGER") {
      const manager = await ctx.db.get(order.targetId as Id<"estateManagers">);
      if (
        !manager ||
        manager.userId !== order.ownerId ||
        manager.plan === "ENTERPRISE"
      )
        throw new Error("Invalid subscription beneficiary.");
      const startsAt = Date.now(),
        endsAt = startsAt + 30 * 86400000;
      const subscriptionId = await ctx.db.insert("managerSubscriptions", {
        ownerId: order.ownerId,
        managerId: manager._id,
        orderId: order._id,
        plan: manager.plan,
        amount: attempt.amount,
        startsAt,
        endsAt,
        cancelAtPeriodEnd: false,
        status: "ACTIVE",
        createdAt: startsAt,
        updatedAt: startsAt,
      });
      await ctx.scheduler.runAt(endsAt, internal.subscriptions.expireOne, {
        id: subscriptionId,
      });
      await ctx.db.patch(order.targetId as Id<"estateManagers">, {
        paidThrough: endsAt,
        updatedAt: Date.now(),
      });
    }
    const owner = await ctx.db.get(order.ownerId);
    await ctx.db.insert("notificationLog", {
      channel: "EMAIL",
      recipient: owner?.email ?? "",
      subject: "Payment confirmed",
      message: `${order.title}: NGN ${attempt.amount}. Reference ${order.reference}.`,
      status: "QUEUED",
      relatedId: String(order._id),
      relatedType: "checkoutOrders",
      createdAt: Date.now(),
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: order.ownerId,
      action: "CHECKOUT_PAYMENT_VERIFIED",
      entityType: "checkoutOrders",
      entityId: String(order._id),
      createdAt: Date.now(),
    });
    return { reference: order.reference, newlyConfirmed: true };
  },
});
export const initialize = action({
  args: { reference: v.string(), expectedAmount: v.number() },
  handler: async (ctx, args): Promise<{ checkoutUrl: string }> => {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) throw new Error("Flutterwave is not configured");
    assertCheckoutEnvironment("FLUTTERWAVE", secret);
    const app = new URL(process.env.APP_URL ?? "https://alikodiamondkey.com");
    const prepared = await ctx.runMutation(internal.checkout.prepare, args);
    const redirect = new URL(
      `/checkout/${encodeURIComponent(prepared.order.reference)}`,
      app,
    ).href;
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: prepared.reference,
        amount: prepared.order.amount,
        currency: "NGN",
        redirect_url: redirect,
        customer: prepared.customer,
        customizations: {
          title: "Aliko Diamond Key",
          description: prepared.order.title,
          logo: new URL("/adk-logo.png", app).href,
        },
      }),
    });
    const body = await response.json();
    if (!response.ok || body.status !== "success" || !body.data?.link) {
      await ctx.runMutation(internal.checkout.failed, {
        reference: prepared.reference,
      });
      throw new Error("Could not start secure checkout.");
    }
    const url = new URL(body.data.link);
    if (
      url.protocol !== "https:" ||
      !(
        url.hostname === "checkout.flutterwave.com" ||
        url.hostname.endsWith(".flutterwave.com")
      )
    )
      throw new Error("Invalid payment provider URL.");
    await ctx.runMutation(internal.checkout.saveLink, {
      reference: prepared.reference,
      url: url.href,
    });
    // Ambiguous network failures retain the payment lock for reconciliation.
    return { checkoutUrl: url.href };
  },
});
async function verify(
  ctx: ActionCtx,
  args: { reference: string; transactionId: string },
): Promise<{ reference: string; newlyConfirmed: boolean }> {
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) throw new Error("Flutterwave is not configured");
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(args.transactionId)}/verify`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const body = await response.json(),
    tx = body.data;
  if (
    !response.ok ||
    body.status !== "success" ||
    !tx ||
    tx.tx_ref !== args.reference ||
    String(tx.id) !== args.transactionId
  )
    throw new Error("Payment verification failed.");
  if (["failed", "cancelled"].includes(tx.status)) {
    const attempt = await ctx.runQuery(internal.checkout.attempt, {
      reference: args.reference,
    });
    await ctx.runMutation(internal.checkout.failed, {
      reference: args.reference,
    });
    return {
      reference: attempt?.order?.reference ?? "",
      newlyConfirmed: false,
    };
  }
  if (tx.status !== "successful")
    throw new Error("Payment is still pending verification.");
  return ctx.runMutation(internal.checkout.settle, {
    reference: tx.tx_ref,
    providerId: String(tx.id),
    amount: tx.amount,
    currency: tx.currency,
  });
}
export const verifyPayment = action({
  args: { reference: v.string(), transactionId: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ reference: string; newlyConfirmed: boolean }> => {
    const user = await ctx.runQuery(api.users.getMyProfile, {});
    const row = await ctx.runQuery(internal.checkout.attempt, {
      reference: args.reference,
    });
    if (!user || row?.order?.ownerId !== user._id) throw new Error("Forbidden");
    return verify(ctx, args);
  },
});
export const processWebhook = internalAction({
  args: { reference: v.string(), transactionId: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ reference: string; newlyConfirmed: boolean }> =>
    verify(ctx, args),
});
export const reconcile = action({
  args: { reference: v.string(), transactionId: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ reference: string; newlyConfirmed: boolean }> => {
    await ctx.runQuery(internal.checkout.administrator, {});
    return verify(ctx, args);
  },
});
