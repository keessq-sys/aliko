import { requireAdmin } from "./lib/access";
import { TableAggregate } from "@convex-dev/aggregate";
import { getAuthUserId } from "@convex-dev/auth/server";
import { components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export const managementAggregate = new TableAggregate<{
  Key: [string, string, string, number];
  DataModel: DataModel;
  TableName: "managementRecords";
}>(components.managementAggregate, {
  sortKey: (doc) => [String(doc.ownerId), doc.kind, doc.status, doc.createdAt],
  sumValue: (doc) => doc.amount ?? 0,
});

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
    await requireAdmin(ctx);
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

export const estateAggregate = new TableAggregate<{
  Key: [string, string, string, string, number];
  DataModel: DataModel;
  TableName: "leases" | "ledgerEntries";
}>(components.estateAggregate, {
  sortKey: (doc) =>
    "direction" in doc
      ? [
          String(doc.ownerId),
          "LEDGER",
          new Date(doc.createdAt).toISOString().slice(0, 7),
          doc.direction,
          doc.createdAt,
        ]
      : [
          String(doc.ownerId),
          "LEASE",
          doc.status,
          doc.startDate,
          doc.createdAt,
        ],
  sumValue: (doc) =>
    "direction" in doc ? doc.amountMinor : Math.round(doc.rent * 100),
});
