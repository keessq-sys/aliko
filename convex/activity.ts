import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib/access";
import { rateLimiter } from "./lib/rateLimits";
export const record = mutation({
  args: {
    kind: v.union(
      v.literal("PAGE_VIEW"),
      v.literal("SIGN_OUT_REQUESTED"),
      v.literal("LANGUAGE_CHANGED"),
    ),
    path: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    // This is client-reported navigation, not evidence that an operation succeeded.
    const path = args.path?.split(/[?#]/)[0];
    if (path && (!/^\/[a-zA-Z0-9/_-]*$/.test(path) || path.length > 200))
      throw new Error("Invalid activity path");
    await rateLimiter.limit(ctx, "activity", {
      key: String(user._id),
      throws: true,
    });
    const session = await import("@convex-dev/auth/server").then((m) =>
      m.getAuthSessionId(ctx),
    );
    const previous = await ctx.db
      .query("adminAuditLog")
      .withIndex("by_actor_date", (q) => q.eq("actorId", user._id))
      .order("desc")
      .first();
    if (
      args.kind === "PAGE_VIEW" &&
      previous?.action === "PAGE_VIEW" &&
      previous.entityId === path &&
      Date.now() - previous.createdAt < 30000
    )
      return;
    await ctx.db.insert("adminAuditLog", {
      actorId: user._id,
      action: args.kind,
      entityType: args.kind === "PAGE_VIEW" ? "navigation" : "session",
      entityId: path ?? String(session ?? ""),
      detail:
        args.kind === "SIGN_OUT_REQUESTED"
          ? "Authenticated sign-out request"
          : undefined,
      createdAt: Date.now(),
    });
    await ctx.db.patch(user._id, { lastActiveAt: Date.now() });
  },
});
export const list = query({
  args: {
    userId: v.optional(v.id("users")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const source = args.userId
      ? ctx.db
          .query("adminAuditLog")
          .withIndex("by_actor_date", (q) => q.eq("actorId", args.userId))
      : ctx.db.query("adminAuditLog").withIndex("by_date");
    const result = await source
      .order("desc")
      .paginate({
        ...args.paginationOpts,
        numItems: Math.min(args.paginationOpts.numItems, 100),
      });
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (row) => {
          const user = row.actorId ? await ctx.db.get(row.actorId) : null;
          return {
            _id: row._id,
            actorId: row.actorId,
            actorName: user?.name,
            actorEmail: user?.email,
            action: row.action,
            entityType: row.entityType,
            entityId: row.entityId,
            createdAt: row.createdAt,
          };
        }),
      ),
    };
  },
});
