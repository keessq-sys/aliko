import { TableAggregate } from "@convex-dev/aggregate";
import { getAuthUserId } from "@convex-dev/auth/server";
import { components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export const paymentAggregate = new TableAggregate<{
  Key: [string, number];
  DataModel: DataModel;
  TableName: "payments";
}>(components.paymentAggregate, {
  sortKey: (doc) => [doc.status, doc.createdAt],
  sumValue: (doc) => doc.amount,
});

export const bookingAggregate = new TableAggregate<{
  Key: [string, number];
  DataModel: DataModel;
  TableName: "bookings";
}>(components.bookingAggregate, {
  sortKey: (doc) => [doc.paymentStatus, doc.createdAt],
  sumValue: (doc) => doc.totalAmount,
});

export const serviceRequestAggregate = new TableAggregate<{
  Key: [string, number];
  DataModel: DataModel;
  TableName: "serviceRequests";
}>(components.serviceRequestAggregate, {
  sortKey: (doc) => [doc.status, doc.createdAt],
  sumValue: (doc) => doc.quoteAmount ?? 0,
});

export const getFinancialTotals = query({
  args: {},
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthorized");
    const user = await ctx.db.get(authId as Id<"users">);
    if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
    const [
      successfulPayments,
      successfulValue,
      paidBookings,
      paidBookingValue,
      serviceRequests,
      quotedServiceValue,
    ] = await Promise.all([
      paymentAggregate.count(ctx, { bounds: { prefix: ["SUCCESS"] } }),
      paymentAggregate.sum(ctx, { bounds: { prefix: ["SUCCESS"] } }),
      bookingAggregate.count(ctx, { bounds: { prefix: ["SUCCESS"] } }),
      bookingAggregate.sum(ctx, { bounds: { prefix: ["SUCCESS"] } }),
      serviceRequestAggregate.count(ctx),
      serviceRequestAggregate.sum(ctx),
    ]);
    return {
      successfulPayments,
      successfulValue,
      paidBookings,
      paidBookingValue,
      serviceRequests,
      quotedServiceValue,
    };
  },
});
