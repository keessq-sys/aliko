import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  internalAction,
  internalMutation,
  internalQuery,
  action,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./lib/access";
import { minor, refundState } from "./lib/providerPayments";
async function provider(path: string) {
  if (!process.env.FLUTTERWAVE_SECRET_KEY)
    throw new Error("Flutterwave is not configured");
  const response = await fetch(`https://api.flutterwave.com/v3/${path}`, {
    signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
  });
  const body = (await response.json()) as any;
  if (!response.ok || body.status !== "success" || !body.data)
    throw new Error("Provider reconciliation unavailable");
  return body.data;
}
export const pendingRefunds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("paymentRefunds")
      .withIndex("by_check", (q) => q.eq("status", "PENDING"))
      .take(50);
    return Promise.all(
      rows.map(async (row) => ({
        refund: row,
        payment: await ctx.db.get(row.paymentId),
      })),
    );
  },
});
export const reconcileRefunds = internalAction({
  args: {},
  handler: async (ctx) => {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) return;
    const rows = await ctx.runQuery(internal.reconciliation.pendingRefunds, {});
    for (const { refund, payment } of rows) {
      await ctx.runMutation(internal.reconciliation.markRefundChecked, {
        refundId: refund._id,
      });
      if (!refund.providerRefundId || !payment?.providerReference) continue;
      try {
        const data = await provider(
          `refunds/${encodeURIComponent(refund.providerRefundId)}`,
        );
        if (
          String(data.id) !== refund.providerRefundId ||
          String(data.tx_id ?? data.TransactionId) !==
            payment.providerReference ||
          minor(data.amount_refunded ?? data.AmountRefunded) !==
            minor(refund.amount)
        )
          throw new Error("Refund identity or amount mismatch");
        if (data.currency && data.currency !== payment.currency)
          throw new Error("Refund currency mismatch");
        await ctx.runMutation(internal.paymentOperations.finishRefund, {
          refundId: refund._id,
          providerRefundId: refund.providerRefundId,
          status: refundState(data),
        });
      } catch {
        await ctx.runMutation(internal.paymentOperations.finishRefund, {
          refundId: refund._id,
          providerRefundId: refund.providerRefundId,
          status: "PENDING",
          lastError:
            "Reconciliation unavailable or provider identity mismatch; refund remains reserved",
        });
      }
    }
  },
});
export const importDetail = internalMutation({
  args: { settlementId: v.id("paymentSettlements"), data: v.any() },
  handler: async (ctx, args) => {
    const settlement = await ctx.db.get(args.settlementId);
    if (
      !settlement ||
      String(args.data.id) !== settlement.providerSettlementId ||
      args.data.currency !== settlement.currency
    )
      throw new Error("Settlement identity mismatch");
    if (
      !Array.isArray(args.data.transactions) ||
      args.data.transactions.length > 1000 ||
      args.data.transactions.length !== Number(args.data.transaction_count)
    )
      throw new Error("Complete settlement transaction set is required");
    const old = await ctx.db
      .query("settlementTransactions")
      .withIndex("by_settlement", (q) => q.eq("settlementId", settlement._id))
      .collect();
    for (const row of old) await ctx.db.delete(row._id);
    let net = 0,
      unmatched = 0;
    const ids = new Set<string>();
    for (const row of args.data.transactions) {
      const id = String(row.id);
      if (!id || id === "undefined" || ids.has(id))
        throw new Error("Duplicate or missing provider transaction");
      ids.add(id);
      const payment = await ctx.db
        .query("payments")
        .withIndex("by_provider_reference", (q) =>
          q.eq("provider", "FLUTTERWAVE").eq("providerReference", id),
        )
        .unique();
      const gross = minor(row.charged_amount),
        fee =
          minor(row.app_fee ?? 0) +
          minor(row.merchant_fee ?? 0) +
          minor(row.stampduty_charge ?? 0),
        refund = minor(row.refund ?? 0),
        rowNet = minor(row.settlement_amount);
      const matched = Boolean(
        payment &&
        payment.status === "SUCCESS" &&
        payment.currency === row.currency &&
        payment.reference === row.tx_ref &&
        minor(payment.amount) === gross &&
        gross - fee - refund === rowNet,
      );
      const elsewhere = await ctx.db
        .query("settlementTransactions")
        .withIndex("by_provider_transaction", (q) =>
          q.eq("providerTransactionId", id),
        )
        .first();
      if (elsewhere && elsewhere.settlementId !== settlement._id)
        throw new Error(
          "Provider transaction already belongs to another settlement",
        );
      if (!matched) unmatched++;
      net += rowNet;
      await ctx.db.insert("settlementTransactions", {
        settlementId: settlement._id,
        providerTransactionId: id,
        paymentId: payment?._id,
        currency: String(row.currency),
        grossMinor: gross,
        feeMinor: fee,
        refundMinor: refund,
        netMinor: rowNet,
        matched,
        reason: matched
          ? undefined
          : "Payment reference, currency, amount or fee mismatch",
        createdAt: Date.now(),
      });
    }
    const discrepancy = minor(args.data.net_amount) - net;
    await ctx.db.patch(settlement._id, {
      amount: Number(args.data.net_amount),
      transactionCount: ids.size,
      discrepancyAmount: discrepancy / 100,
      status:
        discrepancy === 0 &&
        unmatched === 0 &&
        String(args.data.status).toLowerCase() === "completed"
          ? "RECONCILED"
          : "REVIEW",
      updatedAt: Date.now(),
    });
    return {
      matched: ids.size - unmatched,
      unmatched,
      discrepancyMinor: discrepancy,
    };
  },
});
export const settlementContext = internalQuery({
  args: { settlementId: v.id("paymentSettlements") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, 5 * 60000);
    const row = await ctx.db.get(args.settlementId);
    if (!row) throw new Error("Settlement not found");
    return row;
  },
});
export const reconcileSettlement = action({
  args: { settlementId: v.id("paymentSettlements") },
  handler: async (
    ctx,
    args,
  ): Promise<{
    matched: number;
    unmatched: number;
    discrepancyMinor: number;
  }> => {
    const settlement = await ctx.runQuery(
      internal.reconciliation.settlementContext,
      args,
    );
    const data = await provider(
      `settlements/${encodeURIComponent(settlement.providerSettlementId)}`,
    );
    return ctx.runMutation(internal.reconciliation.importDetail, {
      ...args,
      data,
    });
  },
});
export const runRefundReconciliation = action({
  args: {},
  handler: async (ctx): Promise<void> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.runQuery(internal.paymentOperations.requireAdmin, { userId });
    await ctx.runAction(internal.reconciliation.reconcileRefunds, {});
  },
});
export const transactions = query({
  args: {
    settlementId: v.id("paymentSettlements"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("settlementTransactions")
      .withIndex("by_settlement", (q) =>
        q.eq("settlementId", args.settlementId),
      )
      .paginate(args.paginationOpts);
  },
});

export const markRefundChecked = internalMutation({
  args: { refundId: v.id("paymentRefunds") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.refundId, { checkedAt: Date.now() });
  },
});
export const refundPage = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("paymentRefunds")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
export const settlementPage = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("paymentSettlements")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
export const reviewBookings = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("bookings")
      .withIndex("by_fulfillment", (q) => q.eq("fulfillmentStatus", "REVIEW"))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
export const documentPage = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("legalDocuments")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const refundContext = internalQuery({
  args: { refundId: v.id("paymentRefunds") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, 5 * 60000);
    const refund = await ctx.db.get(args.refundId);
    if (!refund || refund.status !== "PENDING")
      throw new Error("Only pending refunds can be reconciled");
    const payment = await ctx.db.get(refund.paymentId);
    if (!payment?.providerReference)
      throw new Error("Payment provider reference missing");
    return { refund, payment };
  },
});
export const reconcileRefundById = action({
  args: { refundId: v.id("paymentRefunds"), providerRefundId: v.string() },
  handler: async (ctx, args): Promise<string> => {
    const { refund, payment } = await ctx.runQuery(
      internal.reconciliation.refundContext,
      { refundId: args.refundId },
    );
    if (
      !/^[0-9]{1,30}$/.test(args.providerRefundId) ||
      (refund.providerRefundId &&
        refund.providerRefundId !== args.providerRefundId)
    )
      throw new Error("Invalid or conflicting refund ID");
    const data = await provider(`refunds/${args.providerRefundId}`);
    if (
      String(data.id) !== args.providerRefundId ||
      String(data.tx_id ?? data.TransactionId) !== payment.providerReference ||
      minor(data.amount_refunded ?? data.AmountRefunded) !==
        minor(refund.amount) ||
      (data.currency && data.currency !== payment.currency)
    )
      throw new Error("Refund identity or amount mismatch");
    const status = refundState(data);
    await ctx.runMutation(internal.paymentOperations.finishRefund, {
      refundId: refund._id,
      providerRefundId: args.providerRefundId,
      status,
    });
    return status;
  },
});
