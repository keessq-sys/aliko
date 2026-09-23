import { vOnCompleteArgs, Workpool } from "@convex-dev/workpool";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

const provider = v.union(
  v.literal("FLUTTERWAVE"),
  v.literal("PAYSTACK"),
  v.literal("WHATSAPP"),
  v.literal("DROPBOX_SIGN"),
);

export const integrationWorkpool = new Workpool(
  components.integrationWorkpool,
  {
    maxParallelism: 10,
    retryActionsByDefault: true,
    defaultRetryBehavior: { maxAttempts: 5, initialBackoffMs: 1_000, base: 2 },
  },
);

/** Atomically claims a verified webhook delivery. Duplicate event IDs are ignored. */
export const claimWebhookEvent = internalMutation({
  args: {
    provider,
    eventId: v.string(),
    eventType: v.string(),
    reference: v.optional(v.string()),
    payloadDigest: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_provider_event", (q) =>
        q.eq("provider", args.provider).eq("eventId", args.eventId),
      )
      .unique();
    if (existing)
      return { claimed: false, eventId: existing._id, status: existing.status };
    const now = Date.now();
    const eventId = await ctx.db.insert("webhookEvents", {
      ...args,
      status: "PROCESSING",
      attempts: 1,
      receivedAt: now,
      updatedAt: now,
    });
    return { claimed: true, eventId, status: "PROCESSING" as const };
  },
});

export const finishWebhookEvent = internalMutation({
  args: {
    eventId: v.id("webhookEvents"),
    status: v.union(
      v.literal("PROCESSED"),
      v.literal("IGNORED"),
      v.literal("FAILED"),
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      status: args.status,
      lastError: args.error?.slice(0, 1000),
      processedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const queueIncomingWhatsApp = internalMutation({
  args: { phone: v.string(), text: v.string(), eventId: v.id("webhookEvents") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const jobId = await ctx.db.insert("backgroundJobs", {
      jobType: "WHATSAPP_INCOMING",
      relatedType: "webhookEvents",
      relatedId: String(args.eventId),
      status: "QUEUED",
      attempts: 0,
      maxAttempts: 5,
      createdAt: now,
      updatedAt: now,
    });
    const workId = await integrationWorkpool.enqueueAction(
      ctx,
      internal.whatsapp.handleIncoming,
      { phone: args.phone, text: args.text },
      {
        onComplete: internal.operations.completeIntegrationJob,
        context: { jobId, eventId: args.eventId },
      },
    );
    await ctx.db.patch(jobId, {
      workId: String(workId),
      status: "RUNNING",
      attempts: 1,
      updatedAt: Date.now(),
    });
    return jobId;
  },
});

export const completeIntegrationJob = internalMutation({
  args: vOnCompleteArgs(
    v.object({
      jobId: v.id("backgroundJobs"),
      eventId: v.optional(v.id("webhookEvents")),
    }),
  ),
  handler: async (ctx, { context, result }) => {
    const now = Date.now();
    const success = result.kind === "success";
    const error =
      result.kind === "failed"
        ? result.error.slice(0, 1000)
        : result.kind === "canceled"
          ? "Canceled"
          : undefined;
    await ctx.db.patch(context.jobId, {
      status: success ? "SUCCEEDED" : "DEAD_LETTER",
      lastError: error,
      updatedAt: now,
      completedAt: now,
    });
    if (context.eventId) {
      await ctx.db.patch(context.eventId, {
        status: success ? "PROCESSED" : "FAILED",
        lastError: error,
        processedAt: now,
        updatedAt: now,
      });
    }
  },
});

/** Marks abandoned work for operator attention and emits a redacted alert record. */
export const monitorFailedJobs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    const stalled = await ctx.db
      .query("backgroundJobs")
      .withIndex("by_status_date", (q) =>
        q.eq("status", "RUNNING").lt("updatedAt", cutoff),
      )
      .take(100);
    for (const job of stalled) {
      await ctx.db.patch(job._id, {
        status: "DEAD_LETTER",
        lastError: "Job exceeded execution window",
        updatedAt: Date.now(),
      });
      await ctx.db.insert("notificationLog", {
        channel: "EMAIL",
        recipient: "admin",
        subject: "Background job requires attention",
        message: `${job.jobType} failed to finish and was moved to the dead-letter queue.`,
        status: "QUEUED",
        relatedId: String(job._id),
        relatedType: "backgroundJobs",
        createdAt: Date.now(),
      });
    }
    return { deadLettered: stalled.length };
  },
});

export const listDeadLetters = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthorized");
    const user = await ctx.db.get(authId as Id<"users">);
    if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
    return ctx.db
      .query("backgroundJobs")
      .withIndex("by_status_date", (q) => q.eq("status", "DEAD_LETTER"))
      .order("desc")
      .take(Math.min(Math.max(limit ?? 50, 1), 200));
  },
});
