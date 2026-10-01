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
    for (const row of ready)
      await ctx.db.patch(row._id, {
        attempts: (row.attempts ?? 0) + 1,
        leaseUntil: now + 120000,
      });
    return ready.map((row) => ({
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
