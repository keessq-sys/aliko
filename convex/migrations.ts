import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import schema from "./schema";
import {
  bookingAggregate,
  paymentAggregate,
  serviceRequestAggregate,
} from "./aggregates";

export const migrations = new Migrations(components.migrations, { schema });

export const backfillPaymentUpdatedAt = migrations.define({
  table: "payments",
  migrateOne: (_ctx, payment) =>
    payment.updatedAt === undefined
      ? { updatedAt: payment.createdAt }
      : undefined,
});

export const seedPaymentAggregate = migrations.define({
  table: "payments",
  migrateOne: async (ctx, payment) => {
    await paymentAggregate.insertIfDoesNotExist(ctx, payment);
  },
});

export const seedBookingAggregate = migrations.define({
  table: "bookings",
  migrateOne: async (ctx, booking) => {
    await bookingAggregate.insertIfDoesNotExist(ctx, booking);
  },
});

export const seedServiceRequestAggregate = migrations.define({
  table: "serviceRequests",
  migrateOne: async (ctx, request) => {
    await serviceRequestAggregate.insertIfDoesNotExist(ctx, request);
  },
});

export const runAll = migrations.runner([
  internal.migrations.backfillPaymentUpdatedAt,
  internal.migrations.seedPaymentAggregate,
  internal.migrations.seedBookingAggregate,
  internal.migrations.seedServiceRequestAggregate,
]);
