import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
export async function emitAlert(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    eventKey: string;
    title: string;
    message: string;
    href: string;
    category: string;
    email?: boolean;
    device?: boolean;
    marketing?: boolean;
  },
) {
  const prior = await ctx.db
    .query("userAlerts")
    .withIndex("by_event", (q) =>
      q.eq("userId", args.userId).eq("eventKey", args.eventKey),
    )
    .unique();
  if (prior) return prior._id;
  const user = await ctx.db.get(args.userId);
  if (!user || user.accountStatus === "SUSPENDED") return null;
  const now = Date.now();
  const id = await ctx.db.insert("userAlerts", {
    userId: args.userId,
    eventKey: args.eventKey,
    title: args.title,
    message: args.message,
    href:
      args.href.startsWith("/") && !args.href.startsWith("//")
        ? args.href
        : "/dashboard/notifications",
    category: args.category,
    createdAt: now,
  });
  const prefs = await ctx.db
    .query("alertPreferences")
    .withIndex("by_user", (q) => q.eq("userId", args.userId))
    .unique();
  if (args.marketing && !prefs?.broadcasts) return id;
  if (args.email !== false && prefs?.email && user.email)
    await ctx.db.insert("notificationLog", {
      channel: "EMAIL",
      recipient: user.email,
      subject: args.title,
      message:
        "You have an update in your Aliko Diamond Key account. Sign in to your notification centre to read it. Do not share your password or payment details.",
      status: "QUEUED",
      relatedType: "userAlert",
      relatedId: String(id),
      createdAt: now,
    });
  if (args.device !== false && prefs?.device) {
    const devices = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(5);
    for (const device of devices)
      await ctx.db.insert("pushJobs", {
        subscriptionId: device._id,
        alertId: id,
        status: "QUEUED",
        attempts: 0,
        nextAttemptAt: now,
        createdAt: now,
      });
  }
  return id;
}
