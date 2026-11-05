import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./lib/access";
import { minor } from "./lib/providerPayments";
import { bookingAggregate } from "./aggregates";
import type { ActionCtx } from "./_generated/server";

const root = "https://api.korapay.com/merchant/api/v1";
async function provider(path: string, body?: unknown) {
  const key = process.env.KORAPAY_SECRET_KEY;
  if (!key) throw new Error("Korapay is not configured.");
  const r = await fetch(`${root}/${path}`, {
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await r.json();
  if (!r.ok || result.status !== true || !result.data)
    throw new Error(
      "Korapay response could not be verified. Reconcile before retrying.",
    );
  return result.data;
}
export const administrator = internalQuery({
  args: {},
  handler: async (ctx) => requireAdmin(ctx, 5 * 60000),
});
export const reserve = internalMutation({
  args: { orderId: v.id("checkoutOrders"), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, 5 * 60000);
    const existing = await ctx.db
      .query("korapayRefunds")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
    // One full refund per order. Repeated clicks never issue another provider POST.
    if (existing) return { row: existing, created: false };
    const order = await ctx.db.get(args.orderId);
    if (!order || order.status !== "PAID" || minor(order.amount) < 10000)
      throw new Error("A paid order of at least NGN 100 is required.");
    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 200)
      throw new Error("Provide a refund reason of 5–200 characters.");
    const attempts = await ctx.db
      .query("checkoutAttempts")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .collect();
    const attempt = attempts.find(
      (a) => a.status === "SUCCESS" && a.provider === "KORAPAY" && !a.testMode,
    );
    if (
      !attempt ||
      attempt.amount !== order.amount ||
      order.currency !== "NGN" ||
      attempt.currency !== "NGN" ||
      !attempt.providerId
    )
      throw new Error("A matching live Korapay payment is required.");
    if (order.kind === "LAND") {
      const booking = await ctx.db.get(
        ctx.db.normalizeId("bookings", order.targetId)!,
      );
      if (
        !booking ||
        booking.clientId !== order.ownerId ||
        booking.allocatedAt ||
        booking.refundPending
      )
        throw new Error("Land allocation or refund requires manual review.");
      const legacy = await ctx.db
        .query("paymentRefunds")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .filter((q) => q.neq(q.field("status"), "FAILED"))
        .first();
      if (legacy)
        throw new Error("Another booking refund exists; reconcile it first.");
      await ctx.db.patch(booking._id, {
        refundPending: true,
        updatedAt: Date.now(),
      });
    }
    const now = Date.now(),
      reference = `ADK-R-${crypto.randomUUID()}`;
    const id = await ctx.db.insert("korapayRefunds", {
      orderId: order._id,
      attemptId: attempt._id,
      reference,
      paymentReference: attempt.reference,
      amount: order.amount,
      currency: "NGN",
      reason,
      status: "PENDING",
      initiatedBy: admin,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(order._id, { refundPending: true, updatedAt: now });
    await ctx.db.insert("adminAuditLog", {
      actorId: admin,
      action: "KORAPAY_REFUND_RESERVED",
      entityType: "checkoutOrders",
      entityId: String(order._id),
      detail: reason,
      createdAt: now,
    });
    return { row: (await ctx.db.get(id))!, created: true };
  },
});
export const getRefund = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, args) =>
    ctx.db
      .query("korapayRefunds")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique(),
});
export const finish = internalMutation({
  args: { reference: v.string(), data: v.any() },
  handler: async (ctx, { reference, data }) => {
    const row = await ctx.db
      .query("korapayRefunds")
      .withIndex("by_reference", (q) => q.eq("reference", reference))
      .unique();
    if (!row) throw new Error("Unknown refund.");
    if (
      data.reference !== row.reference ||
      data.payment_reference !== row.paymentReference ||
      data.currency !== row.currency ||
      minor(data.amount) !== minor(row.amount)
    )
      throw new Error("Refund identity, currency or amount mismatch.");
    if (!["processing", "success", "failed"].includes(data.status))
      throw new Error("Unknown refund status.");
    if (row.status !== "PENDING") return row.status;
    const status =
      data.status === "success"
        ? "COMPLETED"
        : data.status === "failed"
          ? "FAILED"
          : "PENDING";
    const order = await ctx.db.get(row.orderId),
      attempt = await ctx.db.get(row.attemptId);
    if (!order || !attempt || attempt.orderId !== order._id)
      throw new Error("Refund order identity mismatch.");
    const now = Date.now();
    if (status === "COMPLETED") {
      await ctx.db.patch(order._id, {
        status: "REFUNDED",
        refundPending: false,
        updatedAt: now,
      });
      await ctx.db.patch(attempt._id, { status: "REFUNDED", updatedAt: now });
      if (order.kind === "MANAGER") {
        for (const sub of await ctx.db
          .query("managerSubscriptions")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect())
          await ctx.db.patch(sub._id, {
            status: "REVOKED",
            reason: "Provider-confirmed full refund",
            updatedAt: now,
          });
        const subscriptions = await ctx.db
          .query("managerSubscriptions")
          .withIndex("by_owner", (q) => q.eq("ownerId", order.ownerId))
          .collect();
        let paidThrough = 0;
        for (const sub of subscriptions) {
          if (
            sub.status !== "ACTIVE" ||
            sub.endsAt <= now ||
            sub.startsAt > now ||
            sub.orderId === order._id
          )
            continue;
          const otherOrder = await ctx.db.get(sub.orderId);
          if (
            otherOrder?.status === "PAID" &&
            !otherOrder.refundPending &&
            otherOrder.targetId === order.targetId
          )
            paidThrough = Math.max(paidThrough, sub.endsAt);
        }
        const managerId = ctx.db.normalizeId("estateManagers", order.targetId);
        if (managerId && (await ctx.db.get(managerId)))
          await ctx.db.patch(managerId, { paidThrough, updatedAt: now });
      }
      if (order.kind === "AGENT") {
        const id = ctx.db.normalizeId("agentApplications", order.targetId);
        if (id && (await ctx.db.get(id)))
          await ctx.db.patch(id, { status: "UNDER_REVIEW", updatedAt: now });
        const owner = await ctx.db.get(order.ownerId);
        const peers = await ctx.db
          .query("agentApplications")
          .withIndex("by_submission", (q) => q.eq("userId", order.ownerId))
          .collect();
        if (
          owner?.role === "AGENT" &&
          !peers.some(
            (p) =>
              p._id !== id &&
              p.status === "APPROVED" &&
              p.manualVerificationReference,
          )
        )
          await ctx.db.patch(owner._id, { role: "CLIENT" });
      }
      if (order.kind === "SERVICE") {
        const id = ctx.db.normalizeId("serviceRequests", order.targetId);
        if (id && (await ctx.db.get(id)))
          await ctx.db.patch(id, { paidAmount: 0, updatedAt: now });
      }
      if (order.kind === "LAND") {
        const booking = await ctx.db.get(
          ctx.db.normalizeId("bookings", order.targetId)!,
        );
        if (!booking) throw new Error("Refund booking not found.");
        const paidAmount = Math.max(0, booking.paidAmount - row.amount);
        await ctx.db.patch(booking._id, {
          paidAmount,
          paymentStatus: paidAmount === 0 ? "REFUNDED" : "PARTIAL",
          refundPending: false,
          fulfillmentStatus: "REVIEW",
          fulfillmentError:
            "Payment refunded; legal documents and allocation require administrator review",
          updatedAt: now,
        });
        await bookingAggregate.replaceOrInsert(
          ctx,
          booking,
          (await ctx.db.get(booking._id))!,
        );
      }
      // Never release a property/plot or reverse legal title automatically.
      await ctx.db.insert("adminAuditLog", {
        actorId: row.initiatedBy,
        action: "KORAPAY_REFUND_COMPLETED_REVIEW_FULFILMENT",
        entityType: "checkoutOrders",
        entityId: String(order._id),
        createdAt: now,
      });
    } else if (status === "FAILED") {
      await ctx.db.patch(order._id, { refundPending: false, updatedAt: now });
      if (order.kind === "LAND") {
        const id = ctx.db.normalizeId("bookings", order.targetId);
        if (id && (await ctx.db.get(id)))
          await ctx.db.patch(id, { refundPending: false, updatedAt: now });
      }
    }
    await ctx.db.patch(row._id, {
      status,
      checkedAt: now,
      updatedAt: now,
      lastError: undefined,
    });
    return status;
  },
});
export const noteCheck = internalMutation({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("korapayRefunds")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (row?.status === "PENDING")
      await ctx.db.patch(row._id, {
        checkedAt: Date.now(),
        lastError:
          "Awaiting provider confirmation; do not initiate a replacement refund.",
      });
  },
});
async function verifyRefund(
  ctx: ActionCtx,
  reference: string,
): Promise<string> {
  const row = await ctx.runQuery(internal.korapayOperations.getRefund, {
    reference,
  });
  if (!row) throw new Error("Unknown refund.");
  if (row.status !== "PENDING") return row.status;
  await ctx.runMutation(internal.korapayOperations.noteCheck, { reference });
  const data = await provider(`refunds/${encodeURIComponent(reference)}`);
  return ctx.runMutation(internal.korapayOperations.finish, {
    reference,
    data,
  });
}
export const initiateRefund = action({
  args: { orderId: v.id("checkoutOrders"), reason: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ reference: string; status: string }> => {
    await ctx.runQuery(internal.korapayOperations.administrator, {});
    if (!process.env.KORAPAY_SECRET_KEY?.startsWith("sk_live_"))
      throw new Error("Live Korapay credentials are required.");
    const { row, created } = await ctx.runMutation(
      internal.korapayOperations.reserve,
      args,
    );
    if (!created) return { reference: row.reference, status: row.status };
    try {
      await provider("refunds/initiate", {
        reference: row.reference,
        payment_reference: row.paymentReference,
        amount: row.amount,
        reason: row.reason,
        webhook_url: new URL(
          "/webhooks/korapay",
          process.env.CONVEX_HTTP_ACTIONS_URL!,
        ).href,
      });
      // POST acceptance is not proof of refund delivery. Always requery by our durable reference.
      const status = await verifyRefund(ctx, row.reference);
      return { reference: row.reference, status };
    } catch {
      await ctx.runMutation(internal.korapayOperations.noteCheck, {
        reference: row.reference,
      });
      return { reference: row.reference, status: "PENDING" };
    }
  },
});
export const reconcileRefund = action({
  args: { reference: v.string() },
  handler: async (ctx, args): Promise<string> => {
    await ctx.runQuery(internal.korapayOperations.administrator, {});
    return verifyRefund(ctx, args.reference);
  },
});
export const refundWebhook = internalAction({
  args: { reference: v.string() },
  handler: (ctx, args): Promise<string> => verifyRefund(ctx, args.reference),
});
export const pending = internalQuery({
  args: {},
  handler: (ctx) =>
    ctx.db
      .query("korapayRefunds")
      .withIndex("by_status_check", (q) => q.eq("status", "PENDING"))
      .take(25),
});
export const reconcilePending = internalAction({
  args: {},
  handler: async (ctx) => {
    if (!process.env.KORAPAY_SECRET_KEY) return;
    const rows = await ctx.runQuery(internal.korapayOperations.pending, {});
    for (const row of rows) {
      try {
        await verifyRefund(ctx, row.reference);
      } catch {
        /* Keep reservation and rotate checkedAt for the next bounded run. */
      }
    }
  },
});
export const refunds = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("korapayRefunds")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

const settlementRow = v.object({
  paymentReference: v.string(),
  gross: v.number(),
  fees: v.number(),
  net: v.number(),
});
export const importSettlementReport = mutation({
  args: {
    batchReference: v.string(),
    evidenceReference: v.string(),
    settledAt: v.number(),
    rows: v.array(settlementRow),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, 5 * 60000);
    if (
      !/^[\w.-]{1,100}$/.test(args.batchReference) ||
      args.evidenceReference.trim().length < 5 ||
      args.evidenceReference.length > 300 ||
      !Number.isFinite(args.settledAt) ||
      args.settledAt > Date.now() ||
      args.settledAt < 1577836800000 ||
      args.rows.length < 1 ||
      args.rows.length > 100
    )
      throw new Error(
        "Provide a dated settlement report, evidence reference and 1–100 transactions.",
      );
    const existing = await ctx.db
      .query("korapaySettlementReports")
      .withIndex("by_batch", (q) => q.eq("batchReference", args.batchReference))
      .unique();
    const prepared = [],
      seen = new Set<string>();
    let grossMinor = 0,
      feesMinor = 0,
      netMinor = 0;
    for (const row of args.rows) {
      if (seen.has(row.paymentReference))
        throw new Error("Duplicate transaction in report.");
      seen.add(row.paymentReference);
      const gross = minor(row.gross),
        fees = minor(row.fees),
        net = minor(row.net);
      if (!gross || gross - fees !== net)
        throw new Error("Settlement gross minus fees must equal net.");
      const attempt = await ctx.db
        .query("checkoutAttempts")
        .withIndex("by_reference", (q) =>
          q.eq("reference", row.paymentReference),
        )
        .unique();
      if (
        !attempt ||
        attempt.provider !== "KORAPAY" ||
        attempt.testMode ||
        attempt.status !== "SUCCESS" ||
        !attempt.providerId ||
        attempt.currency !== "NGN" ||
        minor(attempt.amount) !== gross
      )
        throw new Error(
          "Report transaction does not match a successful live Korapay charge.",
        );
      const previous = await ctx.db
        .query("korapaySettlementItems")
        .withIndex("by_payment", (q) =>
          q.eq("paymentReference", row.paymentReference),
        )
        .first();
      if (existing && !previous)
        throw new Error(
          "Report transaction set differs from the existing import.",
        );
      if (
        previous &&
        (!existing ||
          previous.reportId !== existing._id ||
          previous.grossMinor !== gross ||
          previous.feesMinor !== fees ||
          previous.netMinor !== net)
      )
        throw new Error(
          "Transaction already belongs to another report or differs from the existing import.",
        );
      prepared.push({
        attemptId: attempt._id,
        paymentReference: row.paymentReference,
        grossMinor: gross,
        feesMinor: fees,
        netMinor: net,
      });
      grossMinor += gross;
      feesMinor += fees;
      netMinor += net;
    }
    if (![grossMinor, feesMinor, netMinor].every(Number.isSafeInteger))
      throw new Error("Report totals exceed supported precision.");
    if (existing) {
      if (
        existing.transactionCount !== prepared.length ||
        existing.grossMinor !== grossMinor ||
        existing.feesMinor !== feesMinor ||
        existing.netMinor !== netMinor ||
        existing.settledAt !== args.settledAt ||
        existing.evidenceReference !== args.evidenceReference
      )
        throw new Error("Settlement report conflicts with an existing import.");
      return existing._id;
    }
    const id = await ctx.db.insert("korapaySettlementReports", {
      batchReference: args.batchReference,
      evidenceReference: args.evidenceReference,
      settledAt: args.settledAt,
      currency: "NGN",
      grossMinor,
      feesMinor,
      netMinor,
      transactionCount: prepared.length,
      status: "REPORTED_NOT_BANK_VERIFIED",
      importedBy: admin,
      createdAt: Date.now(),
    });
    for (const item of prepared)
      await ctx.db.insert("korapaySettlementItems", { ...item, reportId: id });
    await ctx.db.insert("adminAuditLog", {
      actorId: admin,
      action: "KORAPAY_SETTLEMENT_REPORT_IMPORTED",
      entityType: "korapaySettlementReports",
      entityId: String(id),
      detail: args.evidenceReference,
      createdAt: Date.now(),
    });
    return id;
  },
});
export const settlementReports = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("korapaySettlementReports")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
