import { paginationOptsValidator } from "convex/server";
import { requireAdmin } from "./lib/access";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { rateLimiter } from "./lib/rateLimits";
export const subscribe = mutation({
  args: { email: v.string(), consent: v.boolean() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!args.consent)
      throw new Error("Please consent to receive listing emails");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Enter a valid email address");
    await rateLimiter.limit(ctx, "newsletterGlobal", {
      key: "all",
      throws: true,
    });
    await rateLimiter.limit(ctx, "newsletter", { key: email, throws: true });
    const prior = await ctx.db
      .query("newsletterSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    const data = {
      email,
      status: "SUBSCRIBED" as const,
      consentVersion: "2026-10-19",
      consentedAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (prior) await ctx.db.patch(prior._id, data);
    else await ctx.db.insert("newsletterSubscriptions", data);
    return { accepted: true };
  },
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("newsletterSubscriptions")
      .order("desc")
      .paginate({
        ...args.paginationOpts,
        numItems: Math.min(100, Math.max(1, args.paginationOpts.numItems)),
      });
  },
});
export const unsubscribe = mutation({
  args: { id: v.id("newsletterSubscriptions") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("Subscription not found");
    await ctx.db.patch(args.id, {
      status: "UNSUBSCRIBED",
      updatedAt: Date.now(),
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: admin,
      action: "NEWSLETTER_UNSUBSCRIBED",
      entityType: "newsletterSubscriptions",
      entityId: args.id,
      createdAt: Date.now(),
    });
  },
});
