import { v } from "convex/values";
import { query } from "./_generated/server";

export const getRecentNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notificationLog")
      .withIndex("by_channel_date")
      .order("desc")
      .take(args.limit ?? 20);
  },
});
