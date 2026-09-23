import { v } from "convex/values";
import { query, mutation, internalMutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ── Queries ────────────────────────────────────────────────────────────────

export const getMyBookings = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_client", q => q.eq("clientId", userId as Id<"users">))
      .order("desc")
      .collect();
    return Promise.all(
      bookings.map(async b => {
        const plot = await ctx.db.get(b.plotId);
        const project = plot ? await ctx.db.get(plot.projectId) : null;
        const payments = await ctx.db
          .query("payments")
          .withIndex("by_booking", q => q.eq("bookingId", b._id))
          .collect();
        return { ...b, plot, project, payments };
      })
    );
  },
});

export const getAllBookings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user || !["ADMIN", "AGENT"].includes(user.role)) throw new Error("Forbidden");

    const bookings = await ctx.db
      .query("bookings")
      .order("desc")
      .take(limit ?? 50);

    return Promise.all(
      bookings.map(async b => {
        const [client, plot] = await Promise.all([
          ctx.db.get(b.clientId),
          ctx.db.get(b.plotId),
        ]);
        const project = plot ? await ctx.db.get(plot.projectId) : null;
        return { ...b, client, plot, project };
      })
    );
  },
});

export const getBookingByReference = query({
  args: { reference: v.string() },
  handler: async (ctx, { reference }) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_reference", q => q.eq("reference", reference))
      .unique();
    if (!booking) return null;
    const [client, plot] = await Promise.all([
      ctx.db.get(booking.clientId),
      ctx.db.get(booking.plotId),
    ]);
    const project = plot ? await ctx.db.get(plot.projectId) : null;
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_booking", q => q.eq("bookingId", booking._id))
      .collect();
    const documents = await ctx.db
      .query("legalDocuments")
      .withIndex("by_booking", q => q.eq("bookingId", booking._id))
      .collect();
    return { ...booking, client, plot, project, payments, documents };
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────

export const createBooking = mutation({
  args: {
    plotId: v.id("plots"),
    installmentPlan: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized — please sign in to book");

    const plot = await ctx.db.get(args.plotId);
    if (!plot) throw new Error("Plot not found");
    if (plot.status !== "AVAILABLE") throw new Error(`This plot is ${plot.status.toLowerCase().replace("_", " ")} and cannot be booked`);

    // Check for existing pending booking by this user
    const existing = await ctx.db
      .query("bookings")
      .withIndex("by_plot", q => q.eq("plotId", args.plotId))
      .filter(q => q.neq(q.field("paymentStatus"), "FAILED"))
      .first();
    if (existing) throw new Error("This plot already has a pending booking");

    const now = Date.now();
    const reference = `ADK-${plot.beaconNumber}-${now.toString(36).toUpperCase()}`;

    const bookingId = await ctx.db.insert("bookings", {
      clientId: userId as Id<"users">,
      plotId: args.plotId,
      reference,
      paymentStatus: "PENDING",
      totalAmount: plot.price,
      paidAmount: 0,
      installmentPlan: args.installmentPlan,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    // Reserve the plot to prevent double-booking
    await ctx.db.patch(args.plotId, { status: "RESERVED", updatedAt: now });

    return { bookingId, reference };
  },
});

export const confirmPayment = internalMutation({
  args: {
    reference: v.string(),
    providerReference: v.string(),
    amount: v.number(),
    channel: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_reference", q => q.eq("reference", args.reference))
      .unique();
    if (!booking) throw new Error(`Booking ${args.reference} not found`);

    const newPaid = booking.paidAmount + args.amount;
    const isFullyPaid = newPaid >= booking.totalAmount;

    await ctx.db.insert("payments", {
      bookingId: booking._id,
      provider: "PAYSTACK",
      amount: args.amount,
      reference: args.reference,
      providerReference: args.providerReference,
      status: "SUCCESS",
      channel: args.channel,
      currency: "NGN",
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    await ctx.db.patch(booking._id, {
      paymentStatus: isFullyPaid ? "SUCCESS" : "PARTIAL",
      paidAmount: newPaid,
      updatedAt: Date.now(),
    });

    if (isFullyPaid) {
      await ctx.db.patch(booking.plotId, { status: "SOLD", updatedAt: Date.now() });
    }

    return { booking, isFullyPaid };
  },
});

export const cancelBooking = mutation({
  args: { bookingId: v.id("bookings"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.clientId !== userId) {
      const user = await ctx.db.get(userId as Id<"users">);
      if (!user || !["ADMIN", "AGENT"].includes(user.role)) throw new Error("Forbidden — not your booking");
    }
    if (booking.paidAmount > 0) throw new Error("Cannot cancel a paid booking — contact support");

    await ctx.db.patch(args.bookingId, { paymentStatus: "FAILED", updatedAt: Date.now() });
    await ctx.db.patch(booking.plotId, { status: "AVAILABLE", updatedAt: Date.now() });
  },
});

// ── Paystack Action ────────────────────────────────────────────────────────

export const initializePaystackPayment = action({
  args: {
    bookingId: v.id("bookings"),
    email: v.string(),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.runQuery(api.bookings.getBookingInternal, { bookingId: args.bookingId });
    if (!booking) throw new Error("Booking not found");

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: args.email,
        amount: booking.totalAmount * 100, // kobo
        reference: booking.reference,
        callback_url: args.callbackUrl,
        metadata: { bookingId: args.bookingId },
      }),
    });

    const json = await res.json() as { status: boolean; message: string; data: { authorization_url: string; reference: string } };
    if (!json.status) throw new Error(json.message);
    return json.data;
  },
});

export const getBookingInternal = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => ctx.db.get(bookingId),
  // This query is called from actions via internal references
});

// ── Cron: remind clients with an installment due in the next 3 days ────────
export const remindUpcomingPayments = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const window = now + 3 * 24 * 60 * 60 * 1000;
    const due = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("paymentStatus", "PARTIAL"))
      .collect();
    const upcoming = due.filter(
      (b) => b.nextPaymentDate !== undefined && b.nextPaymentDate >= now && b.nextPaymentDate <= window
    );
    for (const b of upcoming) {
      const client = await ctx.db.get(b.clientId);
      if (!client) continue;
      await ctx.db.insert("notificationLog", {
        channel: "WHATSAPP",
        recipient: client.phone ?? client.email,
        subject: "Upcoming installment due",
        message: `Reminder: your next installment of ${b.nextPaymentAmount ?? ""} for booking ${b.reference} is due on ${new Date(b.nextPaymentDate!).toDateString()}.`,
        status: "QUEUED",
        relatedId: b._id,
        relatedType: "bookings",
        createdAt: now,
      });
    }
    return { reminded: upcoming.length };
  },
});
