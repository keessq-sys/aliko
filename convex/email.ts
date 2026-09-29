import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));

export const getReceiptContext = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, { reference }) => {
    const prior = await ctx.db.query("notificationLog").withIndex("by_related", (q) => q.eq("relatedType", "payment_receipt").eq("relatedId", reference)).first();
    if (prior?.status === "SENT") return { alreadySent: true as const };
    const payment = await ctx.db.query("payments").withIndex("by_reference", (q) => q.eq("reference", reference)).unique();
    if (!payment || payment.status !== "SUCCESS") return null;
    const booking = await ctx.db.get(payment.bookingId); if (!booking) return null;
    const client = await ctx.db.get(booking.clientId); if (!client) return null;
    return { alreadySent: false as const, payment, booking, client };
  },
});

export const recordDelivery = internalMutation({
  args: { recipient: v.string(), subject: v.string(), templateName: v.string(), status: v.union(v.literal("SENT"), v.literal("FAILED"), v.literal("QUEUED")), relatedId: v.optional(v.string()), relatedType: v.optional(v.string()), providerId: v.optional(v.string()), message: v.string() },
  handler: async (ctx, args) => ctx.db.insert("notificationLog", {
    channel: "EMAIL", recipient: args.recipient, subject: args.subject, templateName: args.templateName,
    status: args.status, relatedId: args.relatedId, relatedType: args.relatedType, providerMessageId: args.providerId,
    message: args.message.slice(0, 500), createdAt: Date.now(),
  }),
});

export const updateDelivery = internalMutation({
  args: { providerId: v.string(), status: v.union(v.literal("SENT"), v.literal("FAILED")) },
  handler: async (ctx, args) => {
    const row = await ctx.db.query("notificationLog").withIndex("by_provider_message", (q) => q.eq("providerMessageId", args.providerId)).unique();
    if (row) await ctx.db.patch(row._id, { status: args.status });
  },
});

export const sendTransactional = internalAction({
  args: { to: v.string(), subject: v.string(), templateName: v.string(), html: v.string(), text: v.string(), relatedId: v.optional(v.string()), relatedType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) throw new Error("Resend is not fully configured");
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `${args.templateName}:${args.relatedId ?? args.to}`.slice(0, 256) }, body: JSON.stringify({ from, to: [args.to], subject: args.subject, html: args.html, text: args.text, tags: [{ name: "template", value: args.templateName }] }) });
    const body = await response.json() as { id?: string; message?: string };
    await ctx.runMutation(internal.email.recordDelivery, { recipient: args.to, subject: args.subject, templateName: args.templateName, status: response.ok ? "SENT" : "FAILED", relatedId: args.relatedId, relatedType: args.relatedType, providerId: body.id, message: response.ok ? "Accepted by Resend" : (body.message ?? "Email delivery failed") });
    if (!response.ok || !body.id) throw new Error(body.message ?? "Resend rejected the email");
    return { id: body.id };
  },
});

export const sendPaymentReceipt = internalAction({
  args: { reference: v.string() },
  handler: async (ctx, { reference }) => {
    const value = await ctx.runQuery(internal.email.getReceiptContext, { reference });
    if (!value || value.alreadySent) return { sent: false };
    const name = escapeHtml(value.client.name); const amount = value.payment.amount.toLocaleString("en-NG", { style: "currency", currency: value.payment.currency });
    await ctx.runAction(internal.email.sendTransactional, {
      to: value.client.email, subject: `Payment receipt ${value.payment.reference}`, templateName: "payment-receipt",
      relatedId: reference, relatedType: "payment_receipt",
      text: `Hello ${value.client.name}, we received ${amount}. Payment reference: ${value.payment.reference}. Booking: ${value.booking.reference}.`,
      html: `<h1>Payment received</h1><p>Hello ${name},</p><p>We received <strong>${escapeHtml(amount)}</strong>.</p><p>Payment reference: <strong>${escapeHtml(value.payment.reference)}</strong><br>Booking: ${escapeHtml(value.booking.reference)}</p><p>Aliko Diamond Key Realtors Ltd</p>`,
    });
    return { sent: true };
  },
});
