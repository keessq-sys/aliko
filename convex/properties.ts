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

const PROPERTY_TYPE = v.union(
  v.literal("RESIDENTIAL"),
  v.literal("APARTMENT"),
  v.literal("DUPLEX"),
  v.literal("PENTHOUSE"),
  v.literal("COMMERCIAL"),
  v.literal("LAND")
);

// ── Public: browse catalog ───────────────────────────────────────────────
export const listProperties = query({
  args: {
    type: v.optional(PROPERTY_TYPE),
    isFeatured: v.optional(v.boolean()),
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let rows = args.isFeatured != null
      ? await ctx.db.query("properties").withIndex("by_featured", (q) => q.eq("isFeatured", args.isFeatured!)).collect()
      : args.type
        ? await ctx.db.query("properties").withIndex("by_type", (q) => q.eq("type", args.type!)).collect()
        : await ctx.db.query("properties").collect();

    rows = rows.filter((p) => (args.activeOnly === false ? true : p.isActive));
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.slice(0, args.limit ?? 60);
  }
});

export const getProperty = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const property = await ctx.db
      .query("properties")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!property) return null;
    const agent = property.agentId ? await ctx.db.get(property.agentId) : null;
    return { ...property, agent };
  }
});

// ── Admin: catalog management ────────────────────────────────────────────
export const createProperty = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    type: PROPERTY_TYPE,
    description: v.string(),
    price: v.number(),
    location: v.string(),
    state: v.string(),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    parkingSpots: v.optional(v.number()),
    sizeSqm: v.optional(v.number()),
    yearBuilt: v.optional(v.number()),
    amenities: v.array(v.string()),
    images: v.array(v.string()),
    isFeatured: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    return ctx.db.insert("properties", {
      ...args,
      isFeatured: args.isFeatured ?? false,
      isActive: true,
      status: "AVAILABLE",
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateProperty = mutation({
  args: {
    propertyId: v.id("properties"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    status: v.optional(v.union(v.literal("AVAILABLE"), v.literal("RESERVED"), v.literal("SOLD"))),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean())
  },
  handler: async (ctx, { propertyId, ...updates }) => {
    await requireAdmin(ctx);
    const patch = Object.fromEntries(Object.entries(updates).filter(([, val]) => val !== undefined));
    await ctx.db.patch(propertyId, { ...patch, updatedAt: Date.now() });
  }
});

// ── Dev/seed helper: mirrors admin/services' "seed catalog" pattern so the
// static mock catalog (src/lib/stores/properties.ts) can be loaded into the
// real database once from the admin UI, instead of shipping a one-off
// migration script. Upserts by slug — safe to run more than once.
export const upsertProperty = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    type: PROPERTY_TYPE,
    description: v.string(),
    price: v.number(),
    location: v.string(),
    state: v.string(),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    parkingSpots: v.optional(v.number()),
    sizeSqm: v.optional(v.number()),
    yearBuilt: v.optional(v.number()),
    amenities: v.array(v.string()),
    images: v.array(v.string()),
    isFeatured: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("properties")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert("properties", {
      ...args,
      isFeatured: args.isFeatured ?? false,
      isActive: true,
      status: "AVAILABLE",
      createdAt: now,
      updatedAt: now
    });
  }
});
