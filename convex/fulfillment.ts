import { WorkflowManager } from "@convex-dev/workflow";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

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
    await step.runAction(
      internal.legalDocuments.generateDeedOfAssignment,
      {
        clientId: args.clientId,
        plotId: args.plotId,
        bookingId: args.bookingId,
        assigneeAddress: "To be confirmed",
        considerationAmount: args.considerationAmount,
      },
      { retry: { maxAttempts: 3, initialBackoffMs: 2_000, base: 2 } },
    );
    await step.runMutation(
      internal.fulfillment.recordAwaitingSignature,
      { bookingId: args.bookingId },
      { inline: true },
    );
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
