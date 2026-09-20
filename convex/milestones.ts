import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Public/Admin: milestones, optionally scoped to one project ─────────────
export const listMilestones = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let rows = args.projectId
      ? await ctx.db.query("milestones").withIndex("by_project", (q) => q.eq("projectId", args.projectId!)).collect()
      : await ctx.db.query("milestones").collect();

    rows = rows.sort((a, b) => b.publishedAt - a.publishedAt);
    const limited = rows.slice(0, args.limit ?? 50);

    return Promise.all(
      limited.map(async (m) => ({
        ...m,
        project: await ctx.db.get(m.projectId),
      }))
    );
  },
});

// ── Admin: publish a new construction milestone ─────────────────────────────
export const createMilestone = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    percentComplete: v.number(),
    phase: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in to publish a milestone.");

    return await ctx.db.insert("milestones", {
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      percentComplete: Math.max(0, Math.min(100, args.percentComplete)),
      phase: args.phase,
      publishedAt: Date.now(),
      createdBy: userId,
    });
  },
});
