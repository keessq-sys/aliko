import { requireAdmin } from "./lib/access";
import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { rateLimiter } from "./lib/rateLimits";

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
    const actorId = await getAuthUserId(ctx);
    const actor = actorId ? await ctx.db.get(actorId) : null;
    const admin = actor?.role === "ADMIN";
    if (admin) await requireAdmin(ctx);
    let source = args.projectId
      ? ctx.db
          .query("plots")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId!))
      : args.status
        ? ctx.db
            .query("plots")
            .withIndex("by_status", (q) =>
              q.eq("status", args.status as Doc<"plots">["status"]),
            )
        : ctx.db.query("plots");
    if (!admin)
      source = source.filter((q) => q.eq(q.field("titleVerified"), true));
    if (args.status)
      source = source.filter((q) => q.eq(q.field("status"), args.status));
    if (args.sizeSqm !== undefined)
      source = source.filter((q) => q.eq(q.field("sizeSqm"), args.sizeSqm));
    if (args.maxPrice !== undefined)
      source = source.filter((q) => q.lte(q.field("price"), args.maxPrice!));
    if (args.minPrice !== undefined)
      source = source.filter((q) => q.gte(q.field("price"), args.minPrice!));
    if (args.isFeatured !== undefined)
      source = source.filter((q) =>
        q.eq(q.field("isFeatured"), args.isFeatured),
      );
    const plots = await source.take(
      Math.max(1, Math.min(200, Math.floor(args.limit ?? 50))),
    );

    // Attach project info and signed image URLs
    const result = await Promise.all(
      plots.slice(0, args.limit ?? 50).map(async (plot) => {
        const project = await ctx.db.get(plot.projectId);
        if (!admin && !project?.isActive) return null;
        const heroUrl = project?.heroImageStorageId
          ? await ctx.storage.getUrl(project.heroImageStorageId)
          : null;
        return { ...plot, project, heroImageUrl: heroUrl };
      }),
    );

    return result.filter((row): row is NonNullable<typeof row> => row !== null);
  },
});

export const getPlot = query({
  args: { plotId: v.id("plots") },
  handler: async (ctx, { plotId }) => {
    const plot = await ctx.db.get(plotId);
    if (!plot) return null;
    const project = await ctx.db.get(plot.projectId);
    const actorId = await getAuthUserId(ctx),
      actor = actorId ? await ctx.db.get(actorId) : null;
    if (actor?.role === "ADMIN") await requireAdmin(ctx);
    else if (!plot.titleVerified || !project?.isActive) return null;

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project_date", (q) => q.eq("projectId", plot.projectId))
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
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    return plots;
  },
});

export const getAvailablePlotCount = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const available = await ctx.db
      .query("plots")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", projectId).eq("status", "AVAILABLE"),
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
    titleType: v.union(
      v.literal("C_OF_O"),
      v.literal("GOVERNORS_CONSENT"),
      v.literal("DEED_OF_ASSIGNMENT"),
      v.literal("R_OF_O"),
      v.literal("STATUTORY_OFFER"),
    ),
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
    if (!user || !["ADMIN", "AGENT"].includes(user.role))
      throw new Error("Forbidden");

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
    await requireAdmin(ctx);

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
    status: v.union(
      v.literal("AVAILABLE"),
      v.literal("RESERVED"),
      v.literal("SOLD"),
      v.literal("UNDER_DEVELOPMENT"),
      v.literal("OFF_PLAN"),
    ),
  },
  handler: async (ctx, { plotId, status }) => {
    await ctx.db.patch(plotId, { status, updatedAt: Date.now() });
  },
});

export const updatePlotPrice = mutation({
  args: {
    plotId: v.id("plots"),
    price: v.number(),
    serviceChargeAnnual: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    await requireAdmin(ctx);
    await ctx.db.patch(args.plotId, {
      price: args.price,
      serviceChargeAnnual: args.serviceChargeAnnual,
      updatedAt: Date.now(),
    });
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user || !["ADMIN", "AGENT"].includes(user.role))
      throw new Error("Forbidden");
    await rateLimiter.limit(ctx, "upload", {
      key: String(userId),
      throws: true,
    });
    return await ctx.storage.generateUploadUrl();
  },
});
