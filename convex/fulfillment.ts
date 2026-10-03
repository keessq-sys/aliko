import { auditedMutation } from "./lib/auditedMutation";
import type { WorkflowId } from "@convex-dev/workflow";
import { requireAdmin } from "./lib/access";
import { WorkflowManager } from "@convex-dev/workflow";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { mutation, internalMutation, internalQuery } from "./_generated/server";

export const deedContext = internalQuery({
  args: { clientId: v.id("users") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client?.address || client.address.trim().length < 10)
      throw new Error(
        "Client must save a complete legal address before deed generation",
      );
    if (!client.kycVerified || client.accountStatus === "SUSPENDED")
      throw new Error("Current client identity verification is required");
    return { address: client.address };
  },
});

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: { maxParallelism: 8 },
});

/** Durable paid-booking sequence. Later e-signature/allocation steps can resume from this record. */
export const paymentFulfillment = workflow
  .define({
    args: {
      bookingId: v.id("bookings"),
      clientId: v.id("users"),
      plotId: v.id("plots"),
      considerationAmount: v.number(),
    },
  })
  .handler(async (step, args): Promise<void> => {
    try {
      const context = await step.runQuery(internal.fulfillment.deedContext, {
        clientId: args.clientId,
      });
      await step.runAction(
        internal.legalDocuments.generateDeedOfAssignment,
        {
          clientId: args.clientId,
          plotId: args.plotId,
          bookingId: args.bookingId,
          assigneeAddress: context.address,
          considerationAmount: args.considerationAmount,
        },
        { retry: { maxAttempts: 3, initialBackoffMs: 2_000, base: 2 } },
      );
      await step.runMutation(
        internal.fulfillment.recordAwaitingSignature,
        { bookingId: args.bookingId },
        { inline: true },
      );
      await step.runAction(
        internal.legalDocuments.dispatchBookingSignature,
        { bookingId: args.bookingId },
        { retry: false },
      );
      const signed = await step.runQuery(
        internal.legalDocuments.getDocumentByBookingInternal,
        { bookingId: args.bookingId },
      );
      const result =
        signed && ["SIGNED", "VERIFIED"].includes(signed.status)
          ? { documentId: signed._id, status: "SIGNED" }
          : await step.awaitEvent({
              name: "signature",
              validator: v.object({
                documentId: v.id("legalDocuments"),
                status: v.string(),
              }),
            });
      if (result.status !== "SIGNED")
        throw new Error(
          `Signature process ended: ${result.status}; administrator review required`,
        );
      await step.runMutation(internal.fulfillment.allocateSignedBooking, {
        bookingId: args.bookingId,
        documentId: result.documentId,
      });
    } catch (error) {
      await step.runMutation(internal.fulfillment.recordFailure, {
        bookingId: args.bookingId,
        error: error instanceof Error ? error.message : "Fulfilment failed",
      });
      throw error;
    }
  });

export const allocateSignedBooking = internalMutation({
  args: { bookingId: v.id("bookings"), documentId: v.id("legalDocuments") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId),
      document = await ctx.db.get(args.documentId);
    if (
      !booking ||
      !document ||
      document.bookingId !== booking._id ||
      document.clientId !== booking.clientId ||
      !["SIGNED", "VERIFIED"].includes(document.status) ||
      (document.status === "VERIFIED" && !document.signedAt) ||
      !document.externalSignatureId ||
      (document.signatureTestMode &&
        process.env.DEPLOYMENT_ENVIRONMENT !== "staging") ||
      booking.paymentStatus !== "SUCCESS" ||
      booking.paidAmount < booking.totalAmount
    )
      throw new Error("Verified payment and provider-signed deed are required");
    const client = await ctx.db.get(booking.clientId);
    if (!client?.kycVerified || client.accountStatus === "SUSPENDED")
      throw new Error("Current identity verification is required");
    if (booking.allocatedAt) return;
    const pendingRefund = await ctx.db
      .query("paymentRefunds")
      .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .first();
    if (pendingRefund)
      throw new Error(
        "Allocation is blocked while a refund outcome is pending",
      );
    const plot = await ctx.db.get(booking.plotId);
    if (
      !plot?.titleVerified ||
      plot.status !== "RESERVED" ||
      document.plotId !== plot._id
    )
      throw new Error("Matching verified reserved plot is required");
    const now = Date.now();
    await ctx.db.patch(booking._id, {
      allocatedAt: now,
      fulfillmentStatus: "ALLOCATED",
      fulfillmentError: undefined,
      updatedAt: now,
    });
    await ctx.db.patch(booking.plotId, { status: "SOLD", updatedAt: now });
    await ctx.db.insert("documentAuditLog", {
      documentId: document._id,
      action: "PLOT_ALLOCATED",
      actorRole: "SYSTEM",
      createdAt: now,
    });
    await ctx.db.insert("notificationLog", {
      channel: "EMAIL",
      recipient: client.email,
      subject: "Your plot allocation is complete",
      message: `Verified payment and signed deed have completed allocation for ${booking.reference}. View your documents in your dashboard.`,
      status: "QUEUED",
      relatedId: String(booking._id),
      relatedType: "allocation",
      createdAt: now,
    });
  },
});

export const recordAwaitingSignature = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking || booking.paymentStatus !== "SUCCESS")
      throw new Error("Booking is not fully paid");
    await ctx.db.patch(bookingId, {
      fulfillmentStatus: "AWAITING_SIGNATURE",
      fulfillmentError: undefined,
    });
    const existing = await ctx.db
      .query("notificationLog")
      .withIndex("by_channel_date", (q) => q.eq("channel", "EMAIL"))
      .filter((q) => q.eq(q.field("relatedId"), String(bookingId)))
      .first();
    if (!existing) {
      const client = await ctx.db.get(booking.clientId);
      if (client) {
        await ctx.db.insert("notificationLog", {
          channel: "EMAIL",
          recipient: client.email,
          subject: "Your deed is ready for review",
          message: `Payment for ${booking.reference} is verified. Your deed has been generated and is ready for the signature process.`,
          status: "QUEUED",
          relatedId: String(bookingId),
          relatedType: "bookings",
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const recordFailure = internalMutation({
  args: { bookingId: v.id("bookings"), error: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return;
    await ctx.db.patch(booking._id, {
      fulfillmentStatus: "REVIEW",
      fulfillmentError: args.error.slice(0, 500),
      updatedAt: Date.now(),
    });
    if (process.env.ADMIN_ALERT_EMAIL)
      await ctx.db.insert("notificationLog", {
        channel: "EMAIL",
        recipient: process.env.ADMIN_ALERT_EMAIL,
        subject: "Paid booking fulfilment needs review",
        message: `Booking ${booking.reference} requires review in the administrator console.`,
        status: "QUEUED",
        relatedType: "fulfillment",
        relatedId: String(booking._id),
        createdAt: Date.now(),
      });
  },
});
export const restartFulfillment = auditedMutation("fulfillment:restartFulfillment")({
  args: { bookingId: v.id("bookings"), reason: v.string() },
  handler: async (ctx, args) => {
    const actorId = await requireAdmin(ctx, 5 * 60000),
      booking = await ctx.db.get(args.bookingId);
    if (
      !booking?.fulfillmentWorkflowId ||
      booking.allocatedAt ||
      booking.paymentStatus !== "SUCCESS" ||
      booking.paidAmount < booking.totalAmount ||
      booking.fulfillmentStatus !== "REVIEW"
    )
      throw new Error("Only fully paid failed workflows can restart");
    if (args.reason.trim().length < 10 || args.reason.length > 500)
      throw new Error("Record the recovery reason");
    const doc = await ctx.db
      .query("legalDocuments")
      .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
      .first();
    if (doc && ["SENDING", "REVIEW"].includes(doc.signatureDispatchState ?? ""))
      throw new Error(
        "Reconcile the provider signature request before restarting",
      );
    if (doc && ["REJECTED", "EXPIRED"].includes(doc.status))
      throw new Error(
        "A declined or expired deed needs legal review before a new workflow",
      );
    await workflow.restart(ctx, booking.fulfillmentWorkflowId as WorkflowId, {
      from: 0,
    });
    await ctx.db.patch(booking._id, {
      fulfillmentStatus: "RESTARTING",
      fulfillmentError: undefined,
    });
    await ctx.db.insert("adminAuditLog", {
      actorId,
      action: "FULFILLMENT_RESTARTED",
      entityType: "bookings",
      entityId: String(booking._id),
      detail: args.reason,
      createdAt: Date.now(),
    });
  },
});
