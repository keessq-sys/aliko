import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Nudge admin on service requests that have sat unreviewed for 48h+.
crons.interval(
  "flag stale service requests",
  { hours: 6 },
  internal.serviceRequests.flagStaleRequests,
  {},
);

// Remind clients with an installment payment due in the next 3 days.
crons.daily(
  "remind upcoming payments",
  { hourUTC: 8, minuteUTC: 0 },
  internal.bookings.remindUpcomingPayments,
  {},
);

crons.interval(
  "monitor failed background jobs",
  { minutes: 15 },
  internal.operations.monitorFailedJobs,
  {},
);

crons.daily(
  "purge expired stored assets",
  { hourUTC: 2, minuteUTC: 30 },
  internal.storage.purgeExpiredAssets,
  {},
);

export default crons;
