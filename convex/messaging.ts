import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { requireUser, requireAdmin } from "./lib/access";
import { rateLimiter } from "./lib/rateLimits";
import { validateAttachments } from "./lib/attachments";

async function access(ctx: any, id: any) {
  const actor = await requireUser(ctx);
  if (actor.role === "ADMIN") await requireAdmin(ctx);
  const thread = await ctx.db.get(id);
  if (
    !thread ||
    (actor.role !== "ADMIN" &&
      thread.ownerId !== actor._id &&
      thread.assignedTo !== actor._id)
  )
    throw new Error("Conversation not found");
  return { actor, thread };
}
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    if (actor.role === "ADMIN") {
      await requireAdmin(ctx);
      return ctx.db
        .query("conversations")
        .withIndex("by_updated")
        .order("desc")
        .paginate(args.paginationOpts);
    }
    return ctx.db
      .query("conversations")
      .withIndex("by_owner", (q) => q.eq("ownerId", actor._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
export const thread = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => (await access(ctx, args.conversationId)).thread,
});
async function notify(ctx: any, id: any, recipient: string | undefined) {
  if (!recipient) return;
  await ctx.db.insert("notificationLog", {
    channel: "EMAIL",
    recipient,
    subject: "New message in your Aliko Diamond Key account",
    message:
      "Sign in to read and reply to your conversation. Message contents are not included in this email.",
    status: "QUEUED",
    relatedType: "conversation",
    relatedId: String(id),
    createdAt: Date.now(),
  });
}
export const messages = query({
  args: {
    conversationId: v.id("conversations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await access(ctx, args.conversationId);
    const result = await ctx.db
      .query("conversationMessages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (row) => ({
          ...row,
          attachments: await Promise.all(
            row.attachmentIds.map(async (id) => {
              const asset = await ctx.db.get(id);
              return asset?.status === "ACTIVE"
                ? {
                    name: asset.fileName,
                    url: await ctx.storage.getUrl(asset.storageId),
                  }
                : null;
            }),
          ),
        })),
      ),
    };
  },
});
export const create = mutation({
  args: { subject: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    if (actor.role === "ADMIN") await requireAdmin(ctx);
    if (
      args.subject.trim().length < 3 ||
      args.subject.length > 180 ||
      !args.body.trim() ||
      args.body.length > 10000
    )
      throw new Error("Provide a subject and message");
    await rateLimiter.limit(ctx, "enquiry", {
      key: String(actor._id),
      throws: true,
    });
    const now = Date.now();
    const id = await ctx.db.insert("conversations", {
      ownerId: actor._id,
      subject: args.subject.trim(),
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("conversationMessages", {
      conversationId: id,
      authorId: actor._id,
      authorRole: actor.role,
      body: args.body.trim(),
      attachmentIds: [],
      clientReference: crypto.randomUUID(),
      createdAt: now,
    });
    if (actor.role !== "ADMIN")
      await notify(ctx, id, process.env.ADMIN_ALERT_EMAIL);
    return id;
  },
});
export const reply = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
    attachmentIds: v.array(v.id("storedAssets")),
    clientReference: v.string(),
  },
  handler: async (ctx, args) => {
    const { actor, thread } = await access(ctx, args.conversationId);
    if (thread.status !== "OPEN")
      throw new Error("Reopen the conversation before replying");
    if (
      !args.body.trim() ||
      args.body.length > 10000 ||
      !/^[a-zA-Z0-9-]{8,80}$/.test(args.clientReference)
    )
      throw new Error("Invalid message");
    const previous = await ctx.db
      .query("conversationMessages")
      .withIndex("by_reference", (q) =>
        q
          .eq("conversationId", thread._id)
          .eq("authorId", actor._id)
          .eq("clientReference", args.clientReference),
      )
      .unique();
    if (previous) return previous._id;
    await rateLimiter.limit(ctx, "serviceMessage", {
      key: String(actor._id),
      throws: true,
    });
    await validateAttachments(ctx, actor._id, args.attachmentIds);
    const now = Date.now();
    const id = await ctx.db.insert("conversationMessages", {
      ...args,
      authorId: actor._id,
      authorRole: actor.role,
      body: args.body.trim(),
      createdAt: now,
    });
    await ctx.db.patch(thread._id, { updatedAt: now });
    const recipient = await ctx.db.get(
      (actor._id === thread.ownerId
        ? (thread.assignedTo ?? thread.ownerId)
        : thread.ownerId) as Id<"users">,
    );
    if (recipient && recipient._id !== actor._id)
      await notify(ctx, thread._id, recipient.email);
    else if (actor.role !== "ADMIN")
      await notify(ctx, thread._id, process.env.ADMIN_ALERT_EMAIL);
    return id;
  },
});
export const setStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    status: v.union(v.literal("OPEN"), v.literal("CLOSED")),
  },
  handler: async (ctx, args) => {
    const { actor, thread } = await access(ctx, args.conversationId);
    await ctx.db.patch(thread._id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: actor._id,
      action: `CONVERSATION_${args.status}`,
      entityType: "conversations",
      entityId: String(thread._id),
      createdAt: Date.now(),
    });
  },
});
