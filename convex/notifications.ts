import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { sendTemplate } from "./whatsapp";
import { Id } from "./_generated/dataModel";

export const sendWhatsAppTemplate = internalAction({
  args: {
    bookingId: v.id("bookings"),
    templateName: v.string(),
  },
  handler: async (ctx, { bookingId, templateName }) => {
    const booking = await ctx.runQuery(internal.bookings.getBookingInternal, { bookingId });
    if (!booking) return;
    const client = await ctx.runQuery(internal.legalDocuments.getClientInternal, { userId: booking.clientId as Id<"users"> });
    if (!client?.phone) return;
    const plot = await ctx.runQuery(internal.legalDocuments.getPlotWithProject, { plotId: booking.plotId });

    let status = "SENT";
    try {
      await sendTemplate(client.phone, templateName, [
        client.name,
        plot?.beaconNumber ?? "—",
        plot?.project?.name ?? "—",
        new Date().toLocaleDateString("en-GB"),
      ]);
    } catch {
      status = "FAILED";
    }

    await ctx.runMutation(internal.notifications.logNotification, {
      channel: "WHATSAPP",
      recipient: client.phone,
      templateName,
      message: `Template: ${templateName}`,
      status,
    });
  },
});

export const logNotification = internalMutation({
  args: {
    channel: v.union(v.literal("WHATSAPP"), v.literal("EMAIL"), v.literal("SMS"), v.literal("PUSH")),
    recipient: v.string(),
    subject: v.optional(v.string()),
    templateName: v.optional(v.string()),
    message: v.string(),
    status: v.union(v.literal("SENT"), v.literal("FAILED"), v.literal("QUEUED")),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notificationLog", { ...args, createdAt: Date.now() });
  },
});
