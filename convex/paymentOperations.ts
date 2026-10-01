import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireAdmin as requireVerifiedAdmin } from "./lib/access";
import { bookingAggregate } from "./aggregates";
import { refundState, minor } from "./lib/providerPayments";

export const requireAdmin = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const actorId = await requireVerifiedAdmin(ctx, 5 * 60000);
    if (actorId !== userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Unauthorized");
    return user;
  },
});

export const reserveRefund = internalMutation({
  args: {
    paymentId: v.id("payments"),
    initiatedBy: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    if (!Number.isFinite(args.amount) || args.amount < 100)
      throw new Error("Refund amount must be at least NGN 100");
    minor(args.amount);
    if ((await requireVerifiedAdmin(ctx, 5 * 60000)) !== args.initiatedBy)
      throw new Error("Unauthorized");
    const payment = await ctx.db.get(args.paymentId);
    if (
      !payment ||
      payment.provider !== "FLUTTERWAVE" ||
      payment.status !== "SUCCESS"
    )
      throw new Error("Only successful Flutterwave payments can be refunded");
    const refunds = await ctx.db
      .query("paymentRefunds")
      .withIndex("by_payment", (q) => q.eq("paymentId", args.paymentId))
      .collect();
    const reserved = refunds
      .filter((r) => r.status !== "FAILED")
      .reduce((sum, r) => sum + minor(r.amount), 0);
    if (reserved + minor(args.amount) > minor(payment.amount))
      throw new Error("Refund exceeds the remaining refundable amount");
    const now = Date.now();
    const refundId = await ctx.db.insert("paymentRefunds", {
      paymentId: payment._id,
      bookingId: payment.bookingId,
      provider: "FLUTTERWAVE",
      amount: args.amount,
      reason: args.reason,
      status: "PENDING",
      initiatedBy: args.initiatedBy,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: args.initiatedBy,
      action: "FLUTTERWAVE_REFUND_INITIATED",
      entityType: "payments",
      entityId: String(args.paymentId),
      detail: `${args.amount} NGN · ${args.reason}`.slice(0, 500),
      createdAt: now,
    });
    return { payment, refundId };
  },
});

export const finishRefund = internalMutation({
  args: {
    refundId: v.id("paymentRefunds"),
    providerRefundId: v.optional(v.string()),
    status: v.union(
      v.literal("PENDING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
    ),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const refund = await ctx.db.get(args.refundId);
    if (!refund) throw new Error("Refund record not found");
    if (refund.status === "COMPLETED") return;
    if (args.providerRefundId) {
      if (
        refund.providerRefundId &&
        refund.providerRefundId !== args.providerRefundId
      )
        throw new Error("Refund provider ID conflict");
      const other = await ctx.db
        .query("paymentRefunds")
        .withIndex("by_provider_refund", (q) =>
          q.eq("providerRefundId", args.providerRefundId),
        )
        .first();
      if (other && other._id !== refund._id)
        throw new Error("Provider refund already linked to another operation");
    }
    if (args.status === "COMPLETED") {
      if (!args.providerRefundId)
        throw new Error("Provider refund confirmation is required");
      const booking = await ctx.db.get(refund.bookingId);
      if (!booking) throw new Error("Booking not found");
      const paidAmount = Math.max(0, booking.paidAmount - refund.amount);
      await ctx.db.patch(booking._id, {
        paidAmount,
        paymentStatus: paidAmount === 0 ? "REFUNDED" : "PARTIAL",
        updatedAt: Date.now(),
      });
      const updated = await ctx.db.get(booking._id);
      if (updated)
        await bookingAggregate.replaceOrInsert(ctx, booking, updated);
      await ctx.db.insert("adminAuditLog", {
        actorId: refund.initiatedBy,
        action: "REFUND_COMPLETED_REVIEW_ALLOCATION",
        entityType: "bookings",
        entityId: String(booking._id),
        createdAt: Date.now(),
      });
    }
    await ctx.db.patch(args.refundId, {
      providerRefundId: args.providerRefundId,
      status: args.status,
      lastError: args.lastError?.slice(0, 1000),
      updatedAt: Date.now(),
    });
  },
});

export const refundFlutterwavePayment = action({
  args: { paymentId: v.id("payments"), amount: v.number(), reason: v.string() },
  handler: async (ctx, args): Promise<{ refundId: string; status: string }> => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("Unauthorized");
    await ctx.runQuery(internal.paymentOperations.requireAdmin, { userId });
    if (!Number.isFinite(args.amount) || args.amount < 100)
      throw new Error("Refund amount must be positive");
    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 300)
      throw new Error("Provide a refund reason between 5 and 300 characters");
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) throw new Error("Flutterwave is not configured");
    const { payment, refundId } = await ctx.runMutation(
      internal.paymentOperations.reserveRefund,
      {
        paymentId: args.paymentId,
        initiatedBy: userId,
        amount: args.amount,
        reason,
      },
    );
    try {
      if (!payment.providerReference)
        throw new Error("Payment is missing its Flutterwave transaction ID");
      const response = await fetch(
        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(payment.providerReference)}/refund`,
        {
          signal: AbortSignal.timeout(20000),
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: args.amount,
            comments: reason,
            callbackurl: `${process.env.CONVEX_SITE_URL}/webhooks/flutterwave`,
          }),
        },
      );
      const body = (await response.json()) as {
        status?: string;
        message?: string;
        data?: { id?: number | string; status?: string; meta?: unknown };
      };
      if (!response.ok || body.status !== "success" || !body.data?.id)
        throw new Error(body.message ?? "Flutterwave rejected the refund");
      const status = refundState(body.data);
      await ctx.runMutation(internal.paymentOperations.finishRefund, {
        refundId,
        providerRefundId: String(body.data.id),
        status,
      });
      return { refundId: String(body.data.id), status };
    } catch (error) {
      // A timeout or malformed response can follow provider acceptance. Keep
      // the balance reserved until reconciliation proves the final outcome.
      await ctx.runMutation(internal.paymentOperations.finishRefund, {
        refundId,
        status: "PENDING",
        lastError:
          error instanceof Error
            ? error.message
            : "Refund outcome requires reconciliation",
      });
      throw error;
    }
  },
});

export const upsertSettlement = internalMutation({
  args: {
    importedBy: v.id("users"),
    providerSettlementId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    settledAt: v.optional(v.number()),
    transactionCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("paymentSettlements")
      .withIndex("by_provider_id", (q) =>
        q
          .eq("provider", "FLUTTERWAVE")
          .eq("providerSettlementId", args.providerSettlementId),
      )
      .unique();
    const values = {
      ...args,
      provider: "FLUTTERWAVE" as const,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, values);
      return existing._id;
    }
    return ctx.db.insert("paymentSettlements", {
      ...values,
      createdAt: Date.now(),
    });
  },
});

export const importFlutterwaveSettlements = action({
  args: { from: v.string(), to: v.string(), page: v.optional(v.number()) },
  handler: async (
    ctx,
    args,
  ): Promise<{ imported: number; nextPage: number | null }> => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("Unauthorized");
    await ctx.runQuery(internal.paymentOperations.requireAdmin, { userId });
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(args.from) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(args.to)
    )
      throw new Error("Dates must use YYYY-MM-DD");
    if (
      !Number.isFinite(Date.parse(args.from)) ||
      !Number.isFinite(Date.parse(args.to)) ||
      args.from > args.to
    )
      throw new Error("Invalid import date range");
    const page = args.page ?? 1;
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000)
      throw new Error("Invalid import page");
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) throw new Error("Flutterwave is not configured");
    const url = new URL("https://api.flutterwave.com/v3/settlements");
    url.searchParams.set("from", args.from);
    url.searchParams.set("to", args.to);
    url.searchParams.set("page_size", "100");
    url.searchParams.set("page", String(page));
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
    });
    const body = (await response.json()) as {
      status?: string;
      message?: string;
      data?: Array<Record<string, unknown>>;
    };
    if (!response.ok || body.status !== "success")
      throw new Error(body.message ?? "Settlement import failed");
    if (!Array.isArray(body.data) || body.data.length > 100)
      throw new Error("Invalid settlement page");
    let imported = 0;
    for (const row of body.data ?? []) {
      const id = row.id ?? row.settlement_id;
      if (id == null) continue;
      await ctx.runMutation(internal.paymentOperations.upsertSettlement, {
        importedBy: userId,
        providerSettlementId: String(id),
        amount: Number(row.net_amount ?? row.amount_settled ?? row.amount ?? 0),
        currency: String(row.currency ?? "NGN"),
        status: String(row.status ?? "unknown"),
        settledAt:
          typeof row.date_settled === "string"
            ? Date.parse(row.date_settled) || undefined
            : undefined,
        transactionCount:
          typeof (row.transaction_count ?? row.transactions_count) === "number"
            ? Number(row.transaction_count ?? row.transactions_count)
            : undefined,
      });
      imported++;
    }
    return { imported, nextPage: body.data.length === 100 ? page + 1 : null };
  },
});

export const listRefundsAndSettlements = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("Unauthorized");
    await requireVerifiedAdmin(ctx);
    const [refunds, settlements] = await Promise.all([
      ctx.db
        .query("paymentRefunds")
        .withIndex("by_status_date")
        .order("desc")
        .take(100),
      ctx.db
        .query("paymentSettlements")
        .withIndex("by_status_date")
        .order("desc")
        .take(100),
    ]);
    return { refunds, settlements };
  },
});
