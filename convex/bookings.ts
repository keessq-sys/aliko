import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
  internalAction,
  action,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { Doc } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { rateLimiter } from "./lib/rateLimits";
import { start } from "@convex-dev/workflow";
import { bookingAggregate, paymentAggregate } from "./aggregates";

type PaymentSettlementResult = {
  booking: Doc<"bookings">;
  isFullyPaid: boolean;
  newlyConfirmed: boolean;
};

// ── Queries ────────────────────────────────────────────────────────────────

export const getMyBookings = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_client", (q) => q.eq("clientId", userId as Id<"users">))
      .order("desc")
      .collect();
    return Promise.all(
      bookings.map(async (b) => {
        const plot = await ctx.db.get(b.plotId);
        const project = plot ? await ctx.db.get(plot.projectId) : null;
        const payments = await ctx.db
          .query("payments")
          .withIndex("by_booking", (q) => q.eq("bookingId", b._id))
          .collect();
        return { ...b, plot, project, payments };
      }),
    );
  },
});

export const getAllBookings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user || !["ADMIN", "AGENT"].includes(user.role))
      throw new Error("Forbidden");

    const bookings = await ctx.db
      .query("bookings")
      .order("desc")
      .take(limit ?? 50);

    return Promise.all(
      bookings.map(async (b) => {
        const [client, plot, payments] = await Promise.all([
          ctx.db.get(b.clientId),
          ctx.db.get(b.plotId),
          ctx.db
            .query("payments")
            .withIndex("by_booking", (q) => q.eq("bookingId", b._id))
            .order("desc")
            .collect(),
        ]);
        const project = plot ? await ctx.db.get(plot.projectId) : null;
        return { ...b, client, plot, project, payments };
      }),
    );
  },
});

export const getBookingByReference = query({
  args: { reference: v.string() },
  handler: async (ctx, { reference }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_reference", (q) => q.eq("reference", reference))
      .unique();
    if (!booking) return null;
    const viewer = await ctx.db.get(userId as Id<"users">);
    if (
      booking.clientId !== userId &&
      !viewer?.role?.match(/^(ADMIN|AGENT)$/)
    ) {
      throw new Error("Forbidden — not your booking");
    }
    const [client, plot] = await Promise.all([
      ctx.db.get(booking.clientId),
      ctx.db.get(booking.plotId),
    ]);
    const project = plot ? await ctx.db.get(plot.projectId) : null;
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
      .collect();
    const documents = await ctx.db
      .query("legalDocuments")
      .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
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
    if (plot.status !== "AVAILABLE")
      throw new Error(
        `This plot is ${plot.status.toLowerCase().replace("_", " ")} and cannot be booked`,
      );

    // Check for existing pending booking by this user
    const existing = await ctx.db
      .query("bookings")
      .withIndex("by_plot", (q) => q.eq("plotId", args.plotId))
      .filter((q) => q.neq(q.field("paymentStatus"), "FAILED"))
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
    const insertedBooking = await ctx.db.get(bookingId);
    if (insertedBooking)
      await bookingAggregate.insertIfDoesNotExist(ctx, insertedBooking);

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
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (!booking) throw new Error(`Booking ${args.reference} not found`);

    const duplicate = await ctx.db
      .query("payments")
      .withIndex("by_provider_reference", (q) =>
        q
          .eq("provider", "PAYSTACK")
          .eq("providerReference", args.providerReference),
      )
      .first();
    if (duplicate?.status === "SUCCESS")
      return {
        booking,
        isFullyPaid: booking.paymentStatus === "SUCCESS",
        newlyConfirmed: false,
      };

    const newPaid = booking.paidAmount + args.amount;
    const isFullyPaid = newPaid >= booking.totalAmount;

    const paymentId = await ctx.db.insert("payments", {
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
      updatedAt: Date.now(),
    });

    const insertedPayment = await ctx.db.get(paymentId);
    if (insertedPayment)
      await paymentAggregate.insertIfDoesNotExist(ctx, insertedPayment);

    const previousBooking = booking;
    await ctx.db.patch(booking._id, {
      paymentStatus: isFullyPaid ? "SUCCESS" : "PARTIAL",
      paidAmount: newPaid,
      updatedAt: Date.now(),
    });
    const updatedBooking = await ctx.db.get(booking._id);
    if (updatedBooking)
      await bookingAggregate.replaceOrInsert(
        ctx,
        previousBooking,
        updatedBooking,
      );

    if (isFullyPaid) {
      await ctx.db.patch(booking.plotId, {
        status: "SOLD",
        updatedAt: Date.now(),
      });
      await start(
        ctx,
        internal.fulfillment.paymentFulfillment,
        {
          bookingId: booking._id,
          clientId: booking.clientId,
          plotId: booking.plotId,
          considerationAmount: booking.totalAmount,
        },
        { startAsync: true },
      );
    }

    return { booking, isFullyPaid, newlyConfirmed: true };
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
      if (!user || !["ADMIN", "AGENT"].includes(user.role))
        throw new Error("Forbidden — not your booking");
    }
    if (booking.paidAmount > 0)
      throw new Error("Cannot cancel a paid booking — contact support");
    const recentPendingPayment = await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .first();
    if (
      recentPendingPayment &&
      recentPendingPayment.createdAt > Date.now() - 60 * 60 * 1000
    ) {
      throw new Error(
        "Checkout is in progress — wait one hour or contact support before cancelling",
      );
    }

    await ctx.db.patch(args.bookingId, {
      paymentStatus: "FAILED",
      updatedAt: Date.now(),
    });
    const updatedBooking = await ctx.db.get(args.bookingId);
    if (updatedBooking)
      await bookingAggregate.replaceOrInsert(ctx, booking, updatedBooking);
    await ctx.db.patch(booking.plotId, {
      status: "AVAILABLE",
      updatedAt: Date.now(),
    });
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await rateLimiter.limit(ctx, "checkout", {
      key: String(userId),
      throws: true,
    });
    const booking = await ctx.runQuery(internal.bookings.getBookingInternal, {
      bookingId: args.bookingId,
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.clientId !== userId)
      throw new Error("Forbidden — not your booking");
    if (booking.paymentStatus !== "PENDING" || booking.paidAmount !== 0)
      throw new Error("This booking is not eligible for a full payment");
    if (!process.env.PAYSTACK_SECRET_KEY)
      throw new Error("Paystack is not configured");

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

    const json = (await res.json()) as {
      status: boolean;
      message: string;
      data: { authorization_url: string; reference: string };
    };
    if (!json.status) throw new Error(json.message);
    return json.data;
  },
});

export const getBookingInternal = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => ctx.db.get(bookingId),
  // This query is called from actions via internal references
});

// ── Flutterwave Checkout ─────────────────────────────────────────────────

export const createFlutterwaveAttempt = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    reference: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.paymentStatus !== "PENDING" || booking.paidAmount !== 0) {
      throw new Error("This booking is not eligible for a full payment");
    }
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (existing) return existing._id;
    const now = Date.now();
    const paymentId = await ctx.db.insert("payments", {
      bookingId: args.bookingId,
      provider: "FLUTTERWAVE",
      amount: args.amount,
      reference: args.reference,
      status: "PENDING",
      currency: args.currency,
      createdAt: now,
      updatedAt: now,
    });
    const inserted = await ctx.db.get(paymentId);
    if (inserted) await paymentAggregate.insertIfDoesNotExist(ctx, inserted);
    return paymentId;
  },
});

export const failFlutterwaveAttempt = internalMutation({
  args: { reference: v.string(), metadata: v.optional(v.any()) },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (payment && payment.status === "PENDING") {
      await ctx.db.patch(payment._id, {
        status: "FAILED",
        metadata: args.metadata,
        updatedAt: Date.now(),
      });
      const updated = await ctx.db.get(payment._id);
      if (updated)
        await paymentAggregate.replaceOrInsert(ctx, payment, updated);
    }
  },
});

export const getFlutterwaveAttempt = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, { reference }) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("reference", reference))
      .unique();
    if (!payment || payment.provider !== "FLUTTERWAVE") return null;
    const booking = await ctx.db.get(payment.bookingId);
    return booking ? { payment, booking } : null;
  },
});

export const settleFlutterwavePayment = internalMutation({
  args: {
    reference: v.string(),
    providerReference: v.string(),
    amount: v.number(),
    currency: v.string(),
    channel: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (!payment || payment.provider !== "FLUTTERWAVE")
      throw new Error("Unknown Flutterwave payment reference");
    const booking = await ctx.db.get(payment.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (payment.status === "SUCCESS") {
      return {
        booking,
        isFullyPaid: booking.paymentStatus === "SUCCESS",
        newlyConfirmed: false,
      };
    }
    const duplicate = await ctx.db
      .query("payments")
      .withIndex("by_provider_reference", (q) =>
        q
          .eq("provider", "FLUTTERWAVE")
          .eq("providerReference", args.providerReference),
      )
      .first();
    if (duplicate && duplicate._id !== payment._id)
      throw new Error("Flutterwave transaction already processed");
    if (
      args.currency !== payment.currency ||
      Math.abs(args.amount - payment.amount) > 0.01
    ) {
      throw new Error(
        "Verified payment amount or currency does not match checkout",
      );
    }

    const newPaid = booking.paidAmount + payment.amount;
    const isFullyPaid = newPaid >= booking.totalAmount;
    const now = Date.now();
    await ctx.db.patch(payment._id, {
      providerReference: args.providerReference,
      status: "SUCCESS",
      channel: args.channel,
      metadata: args.metadata,
      updatedAt: now,
    });
    const updatedPayment = await ctx.db.get(payment._id);
    if (updatedPayment)
      await paymentAggregate.replaceOrInsert(ctx, payment, updatedPayment);
    await ctx.db.patch(booking._id, {
      paymentStatus: isFullyPaid ? "SUCCESS" : "PARTIAL",
      paidAmount: Math.min(newPaid, booking.totalAmount),
      updatedAt: now,
    });
    const updatedBooking = await ctx.db.get(booking._id);
    if (updatedBooking)
      await bookingAggregate.replaceOrInsert(ctx, booking, updatedBooking);
    if (isFullyPaid) {
      await ctx.db.patch(booking.plotId, { status: "SOLD", updatedAt: now });
      await start(
        ctx,
        internal.fulfillment.paymentFulfillment,
        {
          bookingId: booking._id,
          clientId: booking.clientId,
          plotId: booking.plotId,
          considerationAmount: booking.totalAmount,
        },
        { startAsync: true },
      );
    }
    return { booking, isFullyPaid, newlyConfirmed: true };
  },
});

async function verifyFlutterwave(
  ctx: ActionCtx,
  transactionId: string,
  expectedReference?: string,
): Promise<PaymentSettlementResult> {
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) throw new Error("Flutterwave is not configured");
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
    },
  );
  const body = (await response.json()) as {
    status?: string;
    message?: string;
    data?: {
      id: number;
      tx_ref: string;
      flw_ref?: string;
      amount: number;
      charged_amount?: number;
      currency: string;
      status: string;
      payment_type?: string;
    };
  };
  if (!response.ok || body.status !== "success" || !body.data)
    throw new Error(body.message || "Flutterwave verification failed");
  const transaction = body.data;
  if (transaction.status !== "successful")
    throw new Error("Flutterwave transaction is not successful");
  if (expectedReference && transaction.tx_ref !== expectedReference)
    throw new Error("Flutterwave transaction reference mismatch");
  const attempt: { payment: Doc<"payments">; booking: Doc<"bookings"> } | null =
    await ctx.runQuery(internal.bookings.getFlutterwaveAttempt, {
      reference: transaction.tx_ref,
    });
  if (!attempt) throw new Error("Payment attempt not found");
  if (
    transaction.currency !== attempt.payment.currency ||
    Math.abs(transaction.amount - attempt.payment.amount) > 0.01
  ) {
    throw new Error("Flutterwave transaction amount or currency mismatch");
  }
  const result: PaymentSettlementResult = await ctx.runMutation(
    internal.bookings.settleFlutterwavePayment,
    {
      reference: transaction.tx_ref,
      providerReference: String(transaction.id),
      amount: transaction.amount,
      currency: transaction.currency,
      channel: transaction.payment_type,
      metadata: transaction,
    },
  );
  return result;
}

export const initializeFlutterwavePayment = action({
  args: {
    bookingId: v.id("bookings"),
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    redirectUrl: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ checkoutUrl: string; transactionReference: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await rateLimiter.limit(ctx, "checkout", {
      key: String(userId),
      throws: true,
    });
    const booking: Doc<"bookings"> | null = await ctx.runQuery(
      internal.bookings.getBookingInternal,
      { bookingId: args.bookingId },
    );
    if (!booking) throw new Error("Booking not found");
    if (booking.clientId !== userId)
      throw new Error("Forbidden — not your booking");
    if (booking.paymentStatus !== "PENDING" || booking.paidAmount !== 0)
      throw new Error("This booking is not eligible for a full payment");
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) throw new Error("Flutterwave is not configured");
    if (!/^\S+@\S+\.\S+$/.test(args.email))
      throw new Error("A valid receipt email is required");
    const redirect = new URL(args.redirectUrl);
    const isLocal =
      redirect.hostname === "localhost" || redirect.hostname === "127.0.0.1";
    if (redirect.protocol !== "https:" && !isLocal)
      throw new Error("Invalid checkout redirect URL");
    const configuredAppUrl = process.env.APP_URL
      ? new URL(process.env.APP_URL)
      : null;
    if (
      configuredAppUrl &&
      !isLocal &&
      redirect.origin !== configuredAppUrl.origin
    ) {
      throw new Error(
        "Checkout redirect URL is not an approved application origin",
      );
    }
    const txRef: string = `${booking.reference}-FLW-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    await ctx.runMutation(internal.bookings.createFlutterwaveAttempt, {
      bookingId: args.bookingId,
      reference: txRef,
      amount: booking.totalAmount,
      currency: "NGN",
    });
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: booking.totalAmount,
        currency: "NGN",
        redirect_url: args.redirectUrl,
        customer: {
          email: args.email,
          name: args.name,
          phonenumber: args.phone,
        },
        customizations: {
          title: "Aliko Diamond Key",
          description: `Payment for land booking ${booking.reference}`,
          logo: `${new URL(args.redirectUrl).origin}/images/logo.png`,
        },
        meta: {
          bookingId: String(booking._id),
          bookingReference: booking.reference,
        },
      }),
    });
    const body = (await response.json()) as {
      status?: string;
      message?: string;
      data?: { link?: string };
    };
    if (!response.ok || body.status !== "success" || !body.data?.link) {
      await ctx.runMutation(internal.bookings.failFlutterwaveAttempt, {
        reference: txRef,
        metadata: body,
      });
      throw new Error(body.message || "Could not create Flutterwave checkout");
    }
    return { checkoutUrl: body.data.link, transactionReference: txRef };
  },
});

export const verifyFlutterwavePayment = action({
  args: { transactionId: v.string(), reference: v.string() },
  handler: async (ctx, args): Promise<PaymentSettlementResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const attempt = await ctx.runQuery(
      internal.bookings.getFlutterwaveAttempt,
      { reference: args.reference },
    );
    if (!attempt || attempt.booking.clientId !== userId)
      throw new Error("Payment attempt not found");
    return verifyFlutterwave(ctx, args.transactionId, args.reference);
  },
});

export const processFlutterwaveWebhook = internalAction({
  args: { transactionId: v.string(), reference: v.string() },
  handler: async (ctx, args) =>
    verifyFlutterwave(ctx, args.transactionId, args.reference),
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
      .take(500);
    const upcoming = due.filter(
      (b) =>
        b.nextPaymentDate !== undefined &&
        b.nextPaymentDate >= now &&
        b.nextPaymentDate <= window,
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
