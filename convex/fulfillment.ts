import { WorkflowManager } from "@convex-dev/workflow";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalMutation, internalQuery } from "./_generated/server";

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
    const result = await step.awaitEvent({
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
      document.status !== "SIGNED" ||
      !document.externalSignatureId ||
      booking.paymentStatus !== "SUCCESS" ||
      booking.paidAmount < booking.totalAmount
    )
      throw new Error("Verified payment and provider-signed deed are required");
    const client = await ctx.db.get(booking.clientId);
    if (!client?.kycVerified || client.accountStatus === "SUSPENDED")
      throw new Error("Current identity verification is required");
    if (booking.allocatedAt) return;
    const now = Date.now();
    await ctx.db.patch(booking._id, { allocatedAt: now, updatedAt: now });
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
