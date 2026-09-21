import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId as Id<"users">);
  if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
  return userId;
}

// ── Public: catalog listing ────────────────────────────────────────────────
export const listServices = query({
  args: {
    category: v.optional(v.union(
      v.literal("INTERIOR"),
      v.literal("SUPPLY"),
      v.literal("SMART_HOME"),
      v.literal("CONSTRUCTION"),
      v.literal("ARCHITECTURE"),
      v.literal("PROPERTY_SERVICES"),
      v.literal("CONSULTING"),
    )),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let rows;
    if (args.category) {
      rows = await ctx.db
        .query("services")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      rows = await ctx.db.query("services").collect();
    }
    return rows
      .filter((s) => (args.activeOnly === false ? true : s.isActive))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getService = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return (
      (await ctx.db.query("services").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()) ?? null
    );
  },
});

// ── Admin CRUD ─────────────────────────────────────────────────────────────
export const upsertService = mutation({
  args: {
    id: v.optional(v.id("services")),
    slug: v.string(),
    name: v.string(),
    tagline: v.string(),
    description: v.string(),
    longDescription: v.optional(v.string()),
    category: v.union(
      v.literal("INTERIOR"),
      v.literal("SUPPLY"),
      v.literal("SMART_HOME"),
      v.literal("CONSTRUCTION"),
      v.literal("ARCHITECTURE"),
      v.literal("PROPERTY_SERVICES"),
      v.literal("CONSULTING"),
    ),
    heroImage: v.optional(v.string()),
    features: v.array(v.string()),
    startingPrice: v.optional(v.number()),
    priceUnit: v.optional(v.string()),
    leadTimeDays: v.optional(v.number()),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const { id, ...data } = args;
    if (id) {
      await ctx.db.patch(id, { ...data, updatedAt: now });
      return id;
    }
    return await ctx.db.insert("services", { ...data, createdAt: now, updatedAt: now });
  },
});

export const setServiceActive = mutation({
  args: { id: v.id("services"), isActive: v.boolean() },
  handler: async (ctx, { id, isActive }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { isActive, updatedAt: Date.now() });
  },
});
