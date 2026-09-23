import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";

// ── Queries ────────────────────────────────────────────────────────────────

export const listPlots = query({
  args: {
    projectId: v.optional(v.id("projects")),
    status: v.optional(v.string()),
    sizeSqm: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    minPrice: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let plots = args.projectId
      ? await ctx.db
          .query("plots")
          .withIndex("by_project", q => q.eq("projectId", args.projectId!))
          .collect()
      : args.status
      ? await ctx.db
          .query("plots")
          .withIndex("by_status", q => q.eq("status", args.status as Doc<"plots">["status"]))
          .collect()
      : await ctx.db.query("plots").collect();

    if (args.status) plots = plots.filter(p => p.status === args.status);
    if (args.sizeSqm) plots = plots.filter(p => p.sizeSqm === args.sizeSqm);
    if (args.maxPrice != null) plots = plots.filter(p => p.price <= args.maxPrice!);
    if (args.minPrice != null) plots = plots.filter(p => p.price >= args.minPrice!);
    if (args.isFeatured != null) plots = plots.filter(p => p.isFeatured === args.isFeatured);

    // Attach project info and signed image URLs
    const result = await Promise.all(
      plots.slice(0, args.limit ?? 50).map(async plot => {
        const project = await ctx.db.get(plot.projectId);
        const heroUrl = project?.heroImageStorageId
          ? await ctx.storage.getUrl(project.heroImageStorageId)
          : null;
        return { ...plot, project, heroImageUrl: heroUrl };
      })
    );

    return result;
  },
});

export const getPlot = query({
  args: { plotId: v.id("plots") },
  handler: async (ctx, { plotId }) => {
    const plot = await ctx.db.get(plotId);
    if (!plot) return null;
    const project = await ctx.db.get(plot.projectId);
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project_date", q => q.eq("projectId", plot.projectId))
      .order("desc")
      .take(4);
    const heroUrl = project?.heroImageStorageId
      ? await ctx.storage.getUrl(project.heroImageStorageId)
      : null;
    return { ...plot, project, milestones, heroImageUrl: heroUrl };
  },
});

export const getPlotsByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const plots = await ctx.db
      .query("plots")
      .withIndex("by_project", q => q.eq("projectId", projectId))
      .collect();
    return plots;
  },
});

export const getAvailablePlotCount = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const available = await ctx.db
      .query("plots")
      .withIndex("by_project_status", q =>
        q.eq("projectId", projectId).eq("status", "AVAILABLE")
      )
      .collect();
    return available.length;
  },
});

// ── Admin Mutations ────────────────────────────────────────────────────────

export const createPlot = mutation({
  args: {
    projectId: v.id("projects"),
    beaconNumber: v.string(),
    plotNumber: v.string(),
    sizeSqm: v.number(),
    price: v.number(),
    titleType: v.union(v.literal("C_OF_O"), v.literal("GOVERNORS_CONSENT"), v.literal("DEED_OF_ASSIGNMENT"), v.literal("R_OF_O"), v.literal("STATUTORY_OFFER")),
    positionX: v.optional(v.number()),
    positionY: v.optional(v.number()),
    positionZ: v.optional(v.number()),
    isCornerPlot: v.optional(v.boolean()),
    isPrimeLocation: v.optional(v.boolean()),
    serviceChargeAnnual: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user || !["ADMIN", "AGENT"].includes(user.role)) throw new Error("Forbidden");

    const now = Date.now();
    const plotId = await ctx.db.insert("plots", {
      ...args,
      status: "AVAILABLE",
      titleVerified: false,
      isCornerPlot: args.isCornerPlot ?? false,
      isPrimeLocation: args.isPrimeLocation ?? false,
      isFeatured: false,
      createdAt: now,
      updatedAt: now,
    });

    // Update project available count
    const project = await ctx.db.get(args.projectId);
    if (project) {
      await ctx.db.patch(args.projectId, {
        totalPlots: project.totalPlots + 1,
        availablePlots: project.availablePlots + 1,
        updatedAt: now,
      });
    }

    return plotId;
  },
});

export const verifyPlotTitle = mutation({
  args: {
    plotId: v.id("plots"),
    verificationDocsUrls: v.array(v.string()),
    agisNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");

    await ctx.db.patch(args.plotId, {
      titleVerified: true,
      verificationDocsUrls: args.verificationDocsUrls,
      agisNumber: args.agisNumber,
      updatedAt: Date.now(),
    });
  },
});

export const updatePlotStatus = internalMutation({
  args: {
    plotId: v.id("plots"),
    status: v.union(v.literal("AVAILABLE"), v.literal("RESERVED"), v.literal("SOLD"), v.literal("UNDER_DEVELOPMENT"), v.literal("OFF_PLAN")),
  },
  handler: async (ctx, { plotId, status }) => {
    await ctx.db.patch(plotId, { status, updatedAt: Date.now() });
  },
});

export const updatePlotPrice = mutation({
  args: { plotId: v.id("plots"), price: v.number(), serviceChargeAnnual: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
    await ctx.db.patch(args.plotId, { price: args.price, serviceChargeAnnual: args.serviceChargeAnnual, updatedAt: Date.now() });
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
  },
});
