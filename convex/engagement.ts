import { v, ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser, requireAdmin } from "./lib/access";
import { emitAlert } from "./lib/alerts";
import { rateLimiter } from "./lib/rateLimits";
const roles = [
  "ALL",
  "CLIENT",
  "AGENT",
  "ESTATE_MANAGER",
  "ADMIN",
  "TENANT",
  "DIASPORA_CLIENT",
];
export const inbox = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("userAlerts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
export const unread = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("userAlerts")
      .withIndex("by_unread", (q) =>
        q.eq("userId", user._id).eq("readAt", undefined),
      )
      .take(100);
    return rows.length;
  },
});
export const markRead = mutation({
  args: { id: v.id("userAlerts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      row = await ctx.db.get(args.id);
    if (!row || row.userId !== user._id)
      throw new ConvexError("Notification not found");
    if (!row.readAt) await ctx.db.patch(row._id, { readAt: Date.now() });
  },
});
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("userAlerts")
      .withIndex("by_unread", (q) =>
        q.eq("userId", user._id).eq("readAt", undefined),
      )
      .take(100);
    for (const row of rows) await ctx.db.patch(row._id, { readAt: Date.now() });
    return rows.length;
  },
});
export const preferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const prefs = await ctx.db
      .query("alertPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return {
      email: prefs?.email ?? false,
      device: prefs?.device ?? false,
      broadcasts: prefs?.broadcasts ?? false,
      pushConfigured: !!(
        process.env.VAPID_PUBLIC_KEY &&
        process.env.VAPID_PRIVATE_KEY &&
        process.env.VAPID_SUBJECT
      ),
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? null,
      emailConfigured: !!(
        process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
      ),
    };
  },
});
export const savePreferences = mutation({
  args: { email: v.boolean(), device: v.boolean(), broadcasts: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const prefs = await ctx.db
      .query("alertPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (prefs)
      await ctx.db.patch(prefs._id, { ...args, updatedAt: Date.now() });
    else
      await ctx.db.insert("alertPreferences", {
        userId: user._id,
        ...args,
        updatedAt: Date.now(),
      });
    await ctx.db.insert("adminAuditLog", {
      actorId: user._id,
      action: "ALERT_PREFERENCES_UPDATED",
      entityType: "users",
      entityId: String(user._id),
      createdAt: Date.now(),
    });
  },
});
export const subscribe = mutation({
  args: { endpoint: v.string(), p256dh: v.string(), auth: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    let url: URL;
    try {
      url = new URL(args.endpoint);
    } catch {
      throw new ConvexError("Invalid device endpoint");
    }
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      args.endpoint.length > 2048 ||
      !(
        [
          "fcm.googleapis.com",
          "updates.push.services.mozilla.com",
          "web.push.apple.com",
        ].includes(url.hostname) || url.hostname.endsWith(".notify.windows.com")
      )
    )
      throw new ConvexError("Unsupported device endpoint");
    if (
      !/^[A-Za-z0-9_-]{80,120}$/.test(args.p256dh) ||
      !/^[A-Za-z0-9_-]{20,30}$/.test(args.auth)
    )
      throw new ConvexError("Invalid device keys");
    await rateLimiter.limit(ctx, "enquiry", {
      key: String(user._id),
      throws: true,
    });
    const old = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (old && old.userId !== user._id)
      throw new ConvexError(
        "This device is linked to a different account. Disable alerts in that account first.",
      );
    if (old && old.userId === user._id)
      await ctx.db.patch(old._id, { ...args, updatedAt: Date.now() });
    else {
      const rows = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .take(5);
      if (rows.length >= 5) await ctx.db.delete(rows[0]._id);
      await ctx.db.insert("pushSubscriptions", {
        userId: user._id,
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});
export const removeDevice = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (row && row.userId === user._id) await ctx.db.delete(row._id);
  },
});
export const broadcasts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("broadcasts")
      .withIndex("by_date")
      .order("desc")
      .take(50);
  },
});
export const draftBroadcast = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    audience: v.string(),
    email: v.boolean(),
    device: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actorId = await requireAdmin(ctx);
    if (
      args.title.trim().length < 3 ||
      args.title.length > 160 ||
      !args.message.trim() ||
      args.message.length > 3000 ||
      !roles.includes(args.audience)
    )
      throw new ConvexError("Provide a title, message and valid audience");
    await rateLimiter.limit(ctx, "enquiry", {
      key: String(actorId),
      throws: true,
    });
    const id = await ctx.db.insert("broadcasts", {
      ...args,
      title: args.title.trim(),
      message: args.message.trim(),
      authorId: actorId,
      status: "DRAFT",
      recipients: 0,
      createdAt: Date.now(),
    });
    await ctx.db.insert("adminAuditLog", {
      actorId,
      action: "BROADCAST_DRAFTED",
      entityType: "broadcasts",
      entityId: String(id),
      createdAt: Date.now(),
    });
    return id;
  },
});
export const reviewBroadcast = mutation({
  args: { id: v.id("broadcasts"), approve: v.boolean() },
  handler: async (ctx, args) => {
    const actorId = await requireAdmin(ctx);
    const row = await ctx.db.get(args.id);
    if (!row || row.status !== "DRAFT")
      throw new ConvexError("Only draft broadcasts can be reviewed");
    await ctx.db.patch(row._id, {
      status: args.approve ? "APPROVED" : "CANCELLED",
      reviewedBy: actorId,
      reviewedAt: Date.now(),
    });
    await ctx.db.insert("adminAuditLog", {
      actorId,
      action: args.approve ? "BROADCAST_APPROVED" : "BROADCAST_CANCELLED",
      entityType: "broadcasts",
      entityId: String(row._id),
      createdAt: Date.now(),
    });
  },
});
export const sendBroadcast = mutation({
  args: { id: v.id("broadcasts") },
  handler: async (ctx, args) => {
    const actorId = await requireAdmin(ctx);
    const row = await ctx.db.get(args.id);
    if (!row || row.status !== "APPROVED")
      throw new ConvexError("Review and approve the draft before sending");
    await ctx.db.patch(row._id, { status: "SENDING" });
    await ctx.scheduler.runAfter(0, internal.engagement.deliverBroadcast, {
      id: row._id,
      cursor: null,
    });
    await ctx.db.insert("adminAuditLog", {
      actorId,
      action: "BROADCAST_DISPATCHED",
      entityType: "broadcasts",
      entityId: String(row._id),
      createdAt: Date.now(),
    });
  },
});
export const deliverBroadcast = internalMutation({
  args: { id: v.id("broadcasts"), cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (
      !row ||
      row.status !== "SENDING" ||
      (row.cursor ?? null) !== args.cursor
    )
      return;
    const page = await ctx.db
      .query("users")
      .paginate({ cursor: args.cursor, numItems: 50 });
    let added = 0;
    for (const user of page.page) {
      if (
        user.accountStatus === "SUSPENDED" ||
        (row.audience !== "ALL" && user.role !== row.audience)
      )
        continue;
      const id = await emitAlert(ctx, {
        userId: user._id,
        eventKey: `broadcast:${row._id}`,
        title: row.title,
        message: row.message,
        href: "/dashboard/notifications",
        category: "BROADCAST",
        email: row.email,
        device: row.device,
        marketing: true,
      });
      if (id) added++;
    }
    await ctx.db.patch(row._id, {
      recipients: row.recipients + added,
      cursor: page.continueCursor,
      ...(page.isDone
        ? { status: "SENT" as const, completedAt: Date.now() }
        : {}),
    });
    if (!page.isDone)
      await ctx.scheduler.runAfter(0, internal.engagement.deliverBroadcast, {
        id: row._id,
        cursor: page.continueCursor,
      });
  },
});
export const testAlert = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    await rateLimiter.limit(ctx, "enquiry", {
      key: String(user._id),
      throws: true,
    });
    return emitAlert(ctx, {
      userId: user._id,
      eventKey: `test:${crypto.randomUUID()}`,
      title: "Notification test",
      message:
        "Your notification centre is working. External channel delivery status is recorded separately.",
      href: "/dashboard/notifications",
      category: "TEST",
    });
  },
});
export const claimPush = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now(),
      rows = await ctx.db
        .query("pushJobs")
        .withIndex("by_status", (q) =>
          q.eq("status", "QUEUED").lte("nextAttemptAt", now),
        )
        // Five sequential requests at a 15-second timeout fit the two-minute lease.
        .take(5);
    const result = [];
    for (const row of rows) {
      if ((row.leaseUntil ?? 0) > now) continue;
      const device = await ctx.db.get(row.subscriptionId),
        alert = await ctx.db.get(row.alertId);
      const prefs = device
        ? await ctx.db
            .query("alertPreferences")
            .withIndex("by_user", (q) => q.eq("userId", device.userId))
            .unique()
        : null;
      const user = device ? await ctx.db.get(device.userId) : null;
      if (
        !device ||
        !alert ||
        !prefs?.device ||
        (alert?.category === "BROADCAST" && !prefs?.broadcasts) ||
        !user ||
        user.accountStatus === "SUSPENDED"
      ) {
        await ctx.db.patch(row._id, {
          status: "FAILED",
          lastError: "Device unavailable or permission withdrawn",
        });
        continue;
      }
      await ctx.db.patch(row._id, {
        attempts: row.attempts + 1,
        leaseUntil: now + 120000,
      });
      result.push({ id: row._id, device, alert, leaseUntil: now + 120000 });
    }
    return result;
  },
});
export const finishPush = internalMutation({
  args: {
    id: v.id("pushJobs"),
    leaseUntil: v.number(),
    ok: v.boolean(),
    expired: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.status !== "QUEUED" || row.leaseUntil !== args.leaseUntil)
      return;
    const device = await ctx.db.get(row.subscriptionId);
    const terminal = args.ok || args.expired || row.attempts >= 5;
    await ctx.db.patch(row._id, {
      status: args.ok ? "SENT" : terminal ? "FAILED" : "QUEUED",
      leaseUntil: 0,
      nextAttemptAt: Date.now() + 60000 * 2 ** row.attempts,
      lastError: args.error?.slice(0, 200),
    });
    if (args.expired && device) await ctx.db.delete(device._id);
    if (terminal)
      await ctx.db.insert("notificationLog", {
        channel: "PUSH",
        recipient: device ? String(device.userId) : "removed-device",
        subject: "Account update",
        message: args.ok
          ? "Push service accepted notification; device display is not guaranteed."
          : "Device delivery failed or permission was withdrawn.",
        status: args.ok ? "SENT" : "FAILED",
        relatedType: "userAlert",
        relatedId: String(row.alertId),
        createdAt: Date.now(),
      });
  },
});

export const channelActivity = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const email = await ctx.db
      .query("notificationLog")
      .withIndex("by_recipient", (q) => q.eq("recipient", user.email))
      .order("desc")
      .take(20);
    const device = await ctx.db
      .query("notificationLog")
      .withIndex("by_recipient", (q) => q.eq("recipient", String(user._id)))
      .order("desc")
      .take(20);
    return [...email, ...device]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)
      .map((row) => ({
        id: row._id,
        channel: row.channel,
        status: row.status,
        createdAt: row.createdAt,
        subject: row.subject ?? "Account update",
      }));
  },
});
