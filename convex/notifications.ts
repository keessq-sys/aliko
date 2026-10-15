import { emitAlert } from "./lib/alerts";
import { v } from "convex/values";
import { query, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

import { requireAdmin } from "./lib/access";

export const getRecentNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("notificationLog")
      .withIndex("by_channel_date")
      .order("desc")
      .take(Math.min(100, Math.max(1, args.limit ?? 20)));
  },
});

export const claimQueued = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("notificationLog")
      .withIndex("by_status_date", (q) => q.eq("status", "QUEUED"))
      .take(100);
    const ready = rows
      .filter(
        (row) =>
          row.channel === "EMAIL" &&
          (row.leaseUntil ?? 0) < now &&
          (row.nextAttemptAt ?? 0) <= now &&
          (row.attempts ?? 0) < 5,
      )
      .slice(0, 10);
    const permitted = [];
    for (const row of ready) {
      if (row.relatedType === "userAlert" && row.relatedId) {
        const alert = await ctx.db.get(
          row.relatedId as import("./_generated/dataModel").Id<"userAlerts">,
        );
        const prefs = alert
          ? await ctx.db
              .query("alertPreferences")
              .withIndex("by_user", (q) => q.eq("userId", alert.userId))
              .unique()
          : null;
        const user = alert ? await ctx.db.get(alert.userId) : null;
        if (
          !prefs?.email ||
          !user ||
          user.accountStatus === "SUSPENDED" ||
          (alert?.category === "BROADCAST" && !prefs.broadcasts)
        ) {
          await ctx.db.patch(row._id, {
            status: "FAILED",
            lastError: "Email permission withdrawn or account unavailable",
          });
          continue;
        }
      }
      await ctx.db.patch(row._id, {
        attempts: (row.attempts ?? 0) + 1,
        leaseUntil: now + 120000,
      });
      permitted.push(row);
    }
    return permitted.map((row) => ({
      ...row,
      attempts: (row.attempts ?? 0) + 1,
      leaseUntil: now + 120000,
    }));
  },
});
export const finishQueued = internalMutation({
  args: {
    id: v.id("notificationLog"),
    leaseUntil: v.number(),
    providerId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.status !== "QUEUED" || row.leaseUntil !== args.leaseUntil)
      return;
    if (args.providerId && row.relatedType !== "userAlert") {
      const email =
        row.recipient === "admin"
          ? process.env.ADMIN_ALERT_EMAIL
          : row.recipient;
      if (email) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
          .unique();
        if (user)
          await emitAlert(ctx, {
            userId: user._id,
            eventKey: `channel:${row._id}`,
            title: row.subject ?? "Account update",
            message:
              "An update was recorded for your account. Open the relevant workspace for details.",
            href: "/dashboard/notifications",
            category: "WORKFLOW",
            email: false,
          });
      }
    }
    await ctx.db.patch(row._id, {
      status: args.providerId
        ? "SENT"
        : (row.attempts ?? 0) >= 5
          ? "FAILED"
          : "QUEUED",
      providerMessageId: args.providerId,
      lastError: args.error?.slice(0, 300),
      leaseUntil: 0,
      nextAttemptAt: Date.now() + 60000 * 2 ** (row.attempts ?? 1),
    });
  },
});
export const deliverQueued = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const key = process.env.RESEND_API_KEY,
      from = process.env.RESEND_FROM_EMAIL;
    // Missing credentials leave the queue intact and visible to administrators.
    if (!key || !from) return;
    const rows = await ctx.runMutation(internal.notifications.claimQueued, {});
    for (const row of rows) {
      try {
        const recipient =
          row.recipient === "admin"
            ? process.env.ADMIN_ALERT_EMAIL
            : row.recipient;
        if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))
          throw new Error("Notification recipient needs configuration");
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `adk-notification-${row._id}`,
          },
          body: JSON.stringify({
            from,
            to: [recipient],
            subject: row.subject ?? "Aliko Diamond Key update",
            text: row.message,
          }),
        });
        const result = (await response.json()) as { id?: string };
        if (!response.ok || !result.id)
          throw new Error(`Email provider returned ${response.status}`);
        await ctx.runMutation(internal.notifications.finishQueued, {
          id: row._id,
          leaseUntil: row.leaseUntil,
          providerId: result.id,
        });
      } catch (error) {
        await ctx.runMutation(internal.notifications.finishQueued, {
          id: row._id,
          leaseUntil: row.leaseUntil,
          error:
            error instanceof Error ? error.message : "Email delivery failed",
        });
      }
    }
  },
});
