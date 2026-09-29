import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// ── Self-service: how many listings are assigned to the signed-in agent ──
// Note: nothing in the admin UI currently assigns an agentId to a property
// (createProperty/upsertProperty don't take one), so this is honestly 0 for
// every agent today — real, not fabricated, until that assignment step is
// built. Better than the hardcoded "12" this dashboard used to show.
export const getMyPropertiesCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const rows = await ctx.db
      .query("properties")
      .filter((q) => q.eq(q.field("agentId"), userId))
      .collect();
    return rows.length;
  }
});

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId as Id<"users">);
  if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
  return userId;
}

async function requirePropertyManager(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId as Id<"users">);
  if (!user || !["ADMIN", "AGENT", "ESTATE_MANAGER"].includes(user.role))
    throw new Error("Forbidden — property team only");
  return user;
}

async function withResolvedImages(ctx: any, property: any) {
  const stored = await Promise.all((property.imageStorageIds ?? []).map((id: Id<"_storage">) => ctx.storage.getUrl(id)));
  return { ...property, images: [...stored.filter(Boolean), ...(property.images ?? [])] };
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
    return Promise.all(rows.slice(0, args.limit ?? 60).map((row) => withResolvedImages(ctx, row)));
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
    return { ...(await withResolvedImages(ctx, property)), agent };
  }
});

export const getManageableProperties = query({
  args: {},
  handler: async (ctx) => {
    const user = await requirePropertyManager(ctx);
    const rows = user.role === "AGENT"
      ? await ctx.db.query("properties").filter((q) => q.eq(q.field("agentId"), user._id)).collect()
      : await ctx.db.query("properties").collect();
    return Promise.all(rows.sort((a, b) => b.updatedAt - a.updatedAt).map((row) => withResolvedImages(ctx, row)));
  },
});

export const addPropertyMedia = mutation({
  args: { propertyId: v.id("properties"), storageIds: v.array(v.id("_storage")), urls: v.optional(v.array(v.string())) },
  handler: async (ctx, args) => {
    const user = await requirePropertyManager(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found");
    if (user.role === "AGENT" && property.agentId !== user._id) throw new Error("You can only edit your assigned listings");
    if (args.storageIds.length + (args.urls?.length ?? 0) < 1) throw new Error("Select at least one image");
    if ((property.imageStorageIds?.length ?? 0) + args.storageIds.length > 30) throw new Error("A property can contain at most 30 stored images");
    for (const storageId of args.storageIds) {
      const asset = await ctx.db.query("storedAssets").withIndex("by_storage", (q) => q.eq("storageId", storageId)).unique();
      if (!asset || asset.status !== "ACTIVE" || asset.purpose !== "PROPERTY_IMAGE") throw new Error("An uploaded image is not ready");
      if (asset.ownerId !== user._id && user.role !== "ADMIN" && user.role !== "ESTATE_MANAGER") throw new Error("An uploaded image belongs to another account");
    }
    const safeUrls = (args.urls ?? []).filter((url) => url.startsWith("/api/media/") || url.startsWith("https://"));
    await ctx.db.patch(property._id, {
      imageStorageIds: [...(property.imageStorageIds ?? []), ...args.storageIds],
      images: [...property.images, ...safeUrls].slice(0, 30),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("adminAuditLog", { actorId: user._id, actorEmail: user.email, action: "PROPERTY_MEDIA_ADDED", entityType: "properties", entityId: String(property._id), detail: `${args.storageIds.length + safeUrls.length} image(s)`, createdAt: Date.now() });
  },
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
    const user = await requirePropertyManager(ctx);
    const now = Date.now();
    return ctx.db.insert("properties", {
      ...args,
      isFeatured: args.isFeatured ?? false,
      isActive: true,
      status: "AVAILABLE",
      agentId: user.role === "AGENT" ? user._id : undefined,
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
