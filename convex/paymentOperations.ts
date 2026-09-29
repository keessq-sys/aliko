import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

export const requireAdmin = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
    return user;
  },
});

export const reserveRefund = internalMutation({
  args: { paymentId: v.id("payments"), initiatedBy: v.id("users"), amount: v.number(), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.initiatedBy);
    if (admin?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.provider !== "FLUTTERWAVE" || payment.status !== "SUCCESS")
      throw new Error("Only successful Flutterwave payments can be refunded");
    const refunds = await ctx.db.query("paymentRefunds")
      .withIndex("by_payment", (q) => q.eq("paymentId", args.paymentId)).collect();
    const reserved = refunds.filter((r) => r.status !== "FAILED").reduce((sum, r) => sum + r.amount, 0);
    if (reserved + args.amount > payment.amount) throw new Error("Refund exceeds the remaining refundable amount");
    const now = Date.now();
    const refundId = await ctx.db.insert("paymentRefunds", { paymentId: payment._id, bookingId: payment.bookingId, provider: "FLUTTERWAVE", amount: args.amount, reason: args.reason, status: "PENDING", initiatedBy: args.initiatedBy, createdAt: now, updatedAt: now });
    await ctx.db.insert("adminAuditLog", {
      actorId: args.initiatedBy, action: "FLUTTERWAVE_REFUND_INITIATED", entityType: "payments",
      entityId: String(args.paymentId), detail: `${args.amount} NGN · ${args.reason}`.slice(0, 500), createdAt: now,
    });
    return { payment, refundId };
  },
});

export const finishRefund = internalMutation({
  args: { refundId: v.id("paymentRefunds"), providerRefundId: v.optional(v.string()), status: v.union(v.literal("PENDING"), v.literal("COMPLETED"), v.literal("FAILED")), lastError: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.refundId, { providerRefundId: args.providerRefundId, status: args.status, lastError: args.lastError?.slice(0, 1000), updatedAt: Date.now() });
  },
});

export const refundFlutterwavePayment = action({
  args: { paymentId: v.id("payments"), amount: v.number(), reason: v.string() },
  handler: async (ctx, args): Promise<{ refundId: string; status: string }> => {
    const userId = await getAuthUserId(ctx) as Id<"users"> | null;
    if (!userId) throw new Error("Unauthorized");
    await ctx.runQuery(internal.paymentOperations.requireAdmin, { userId });
    if (!Number.isFinite(args.amount) || args.amount <= 0) throw new Error("Refund amount must be positive");
    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 300) throw new Error("Provide a refund reason between 5 and 300 characters");
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) throw new Error("Flutterwave is not configured");
    const { payment, refundId } = await ctx.runMutation(internal.paymentOperations.reserveRefund, { paymentId: args.paymentId, initiatedBy: userId, amount: args.amount, reason });
    try {
      if (!payment.providerReference) throw new Error("Payment is missing its Flutterwave transaction ID");
      const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(payment.providerReference)}/refund`, {
        method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: args.amount, comments: reason, callbackurl: `${process.env.CONVEX_SITE_URL}/webhooks/flutterwave` }),
      });
      const body = await response.json() as { status?: string; message?: string; data?: { id?: number | string; status?: string } };
      if (!response.ok || body.status !== "success" || !body.data?.id) throw new Error(body.message ?? "Flutterwave rejected the refund");
      const status = body.data.status === "completed" ? "COMPLETED" : "PENDING";
      await ctx.runMutation(internal.paymentOperations.finishRefund, { refundId, providerRefundId: String(body.data.id), status });
      return { refundId: String(body.data.id), status };
    } catch (error) {
      await ctx.runMutation(internal.paymentOperations.finishRefund, { refundId, status: "FAILED", lastError: error instanceof Error ? error.message : "Refund request failed" });
      throw error;
    }
  },
});

export const upsertSettlement = internalMutation({
  args: { importedBy: v.id("users"), providerSettlementId: v.string(), amount: v.number(), currency: v.string(), status: v.string(), settledAt: v.optional(v.number()), transactionCount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("paymentSettlements").withIndex("by_provider_id", (q) => q.eq("provider", "FLUTTERWAVE").eq("providerSettlementId", args.providerSettlementId)).unique();
    const values = { ...args, provider: "FLUTTERWAVE" as const, updatedAt: Date.now() };
    if (existing) { await ctx.db.patch(existing._id, values); return existing._id; }
    return ctx.db.insert("paymentSettlements", { ...values, createdAt: Date.now() });
  },
});

export const importFlutterwaveSettlements = action({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, args): Promise<{ imported: number }> => {
    const userId = await getAuthUserId(ctx) as Id<"users"> | null;
    if (!userId) throw new Error("Unauthorized");
    await ctx.runQuery(internal.paymentOperations.requireAdmin, { userId });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.from) || !/^\d{4}-\d{2}-\d{2}$/.test(args.to)) throw new Error("Dates must use YYYY-MM-DD");
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) throw new Error("Flutterwave is not configured");
    const url = new URL("https://api.flutterwave.com/v3/settlements");
    url.searchParams.set("from", args.from); url.searchParams.set("to", args.to); url.searchParams.set("page_size", "100");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" } });
    const body = await response.json() as { status?: string; message?: string; data?: Array<Record<string, unknown>> };
    if (!response.ok || body.status !== "success") throw new Error(body.message ?? "Settlement import failed");
    let imported = 0;
    for (const row of body.data ?? []) {
      const id = row.id ?? row.settlement_id;
      if (id == null) continue;
      await ctx.runMutation(internal.paymentOperations.upsertSettlement, {
        importedBy: userId, providerSettlementId: String(id), amount: Number(row.amount_settled ?? row.amount ?? 0),
        currency: String(row.currency ?? "NGN"), status: String(row.status ?? "unknown"),
        settledAt: typeof row.date_settled === "string" ? Date.parse(row.date_settled) || undefined : undefined,
        transactionCount: typeof row.transactions_count === "number" ? row.transactions_count : undefined,
      });
      imported++;
    }
    return { imported };
  },
});

export const listRefundsAndSettlements = query({
  args: {}, handler: async (ctx) => {
    const userId = await getAuthUserId(ctx) as Id<"users"> | null;
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId); if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
    const [refunds, settlements] = await Promise.all([
      ctx.db.query("paymentRefunds").withIndex("by_status_date").order("desc").take(100),
      ctx.db.query("paymentSettlements").withIndex("by_status_date").order("desc").take(100),
    ]);
    return { refunds, settlements };
  },
});
