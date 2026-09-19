import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const listProjects = query({
  args: {
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let projects = args.isFeatured != null
      ? await ctx.db.query("projects").withIndex("by_featured", q => q.eq("isFeatured", args.isFeatured!)).collect()
      : await ctx.db.query("projects").collect();

    if (args.isActive != null) projects = projects.filter(p => p.isActive === args.isActive);

    return Promise.all(
      projects.slice(0, args.limit ?? 20).map(async p => {
        const heroUrl = p.heroImageStorageId ? await ctx.storage.getUrl(p.heroImageStorageId) : null;
        return { ...p, heroImageUrl: heroUrl };
      })
    );
  },
});

export const getProject = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_slug", q => q.eq("slug", slug))
      .unique();
    if (!project) return null;

    const plots = await ctx.db
      .query("plots")
      .withIndex("by_project", q => q.eq("projectId", project._id))
      .collect();

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project_date", q => q.eq("projectId", project._id))
      .order("desc")
      .take(6);

    const heroUrl = project.heroImageStorageId ? await ctx.storage.getUrl(project.heroImageStorageId) : null;
    const milestoneUrls = await Promise.all(milestones.map(async m => ({
      ...m,
      mediaUrls: await Promise.all((m.mediaStorageIds ?? []).map(id => ctx.storage.getUrl(id))),
    })));

    const stats = {
      total: plots.length,
      available: plots.filter(p => p.status === "AVAILABLE").length,
      reserved: plots.filter(p => p.status === "RESERVED").length,
      sold: plots.filter(p => p.status === "SOLD").length,
    };

    return { ...project, heroImageUrl: heroUrl, plots, milestones: milestoneUrls, stats };
  },
});

export const createProject = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    location: v.string(),
    lga: v.string(),
    state: v.string(),
    description: v.string(),
    fullDescription: v.optional(v.string()),
    amenities: v.array(v.string()),
    infrastructure: v.array(v.string()),
    developerName: v.optional(v.string()),
    surveyPlanRef: v.optional(v.string()),
    agisRef: v.optional(v.string()),
    layoutApprovalRef: v.optional(v.string()),
    developerCacRc: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");

    const now = Date.now();
    return ctx.db.insert("projects", {
      ...args,
      isActive: true,
      isFeatured: false,
      totalPlots: 0,
      availablePlots: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    fullDescription: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    amenities: v.optional(v.array(v.string())),
    infrastructure: v.optional(v.array(v.string())),
    heroImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { projectId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
    // Remove undefined fields
    const patch = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await ctx.db.patch(projectId, { ...patch, updatedAt: Date.now() });
  },
});

export const getPlatformStats = query({
  handler: async (ctx) => {
    const [plots, projects, bookings, users] = await Promise.all([
      ctx.db.query("plots").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("bookings").collect(),
      ctx.db.query("users").collect(),
    ]);

    const totalTransactionValue = bookings
      .filter(b => b.paymentStatus === "SUCCESS")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      totalPlots: plots.length,
      availablePlots: plots.filter(p => p.status === "AVAILABLE").length,
      soldPlots: plots.filter(p => p.status === "SOLD").length,
      activeProjects: projects.filter(p => p.isActive).length,
      totalBookings: bookings.length,
      successfulBookings: bookings.filter(b => b.paymentStatus === "SUCCESS").length,
      totalClients: users.filter(u => u.role === "CLIENT" || u.role === "DIASPORA_CLIENT").length,
      totalTransactionValue,
      unverifiedPlots: plots.filter(p => !p.titleVerified).length,
    };
  },
});
