import { requireAdmin } from "./lib/access";
import { requireUser } from "./lib/access";
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
      .take(500);
    return rows.length;
  },
});

async function requirePropertyManager(ctx: any) {
  const user = await requireUser(ctx);
  if (!user || !["ADMIN", "AGENT", "ESTATE_MANAGER"].includes(user.role))
    throw new Error("Forbidden — property team only");
  return user;
}

async function withResolvedImages(ctx: any, property: any) {
  const stored = await Promise.all(
    (property.imageStorageIds ?? []).map((id: Id<"_storage">) =>
      ctx.storage.getUrl(id),
    ),
  );
  return {
    ...property,
    images: [...stored.filter(Boolean), ...(property.images ?? [])],
  };
}

const PROPERTY_TYPE = v.union(
  v.literal("RESIDENTIAL"),
  v.literal("APARTMENT"),
  v.literal("DUPLEX"),
  v.literal("PENTHOUSE"),
  v.literal("COMMERCIAL"),
  v.literal("LAND"),
);

// ── Public: browse catalog ───────────────────────────────────────────────
export const listProperties = query({
  args: {
    type: v.optional(PROPERTY_TYPE),
    isFeatured: v.optional(v.boolean()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let rows =
      args.isFeatured != null
        ? await ctx.db
            .query("properties")
            .withIndex("by_featured", (q) =>
              q.eq("isFeatured", args.isFeatured!),
            )
            .take(500)
        : args.type
          ? await ctx.db
              .query("properties")
              .withIndex("by_type", (q) => q.eq("type", args.type!))
              .take(500)
          : await ctx.db
              .query("properties")
              .withIndex("by_active", (q) => q.eq("isActive", true))
              .take(500);

    if (args.activeOnly === false) await requireAdmin(ctx);
    rows = rows.filter(
      (p) =>
        args.activeOnly === false ||
        (p.isActive && p.verificationStatus === "VERIFIED"),
    );
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return Promise.all(
      rows
        .slice(0, args.limit ?? 60)
        .map((row) => withResolvedImages(ctx, row)),
    );
  },
});

export const getProperty = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const property = await ctx.db
      .query("properties")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (
      !property ||
      !property.isActive ||
      property.verificationStatus !== "VERIFIED"
    )
      return null;
    const agent = property.agentId ? await ctx.db.get(property.agentId) : null;
    return {
      ...(await withResolvedImages(ctx, property)),
      agent: agent ? { name: agent.name, avatarUrl: agent.avatarUrl } : null,
    };
  },
});

export const getManageableProperties = query({
  args: {},
  handler: async (ctx) => {
    const user = await requirePropertyManager(ctx);
    const rows =
      user.role === "AGENT"
        ? await ctx.db
            .query("properties")
            .filter((q) => q.eq(q.field("agentId"), user._id))
            .take(500)
        : user.role === "ADMIN"
          ? await ctx.db.query("properties").take(500)
          : await ctx.db
              .query("properties")
              .withIndex("by_manager", (q) => q.eq("managerId", user._id))
              .take(500);
    return Promise.all(
      rows
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((row) => withResolvedImages(ctx, row)),
    );
  },
});

export const addPropertyMedia = mutation({
  args: {
    propertyId: v.id("properties"),
    storageIds: v.array(v.id("_storage")),
    urls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requirePropertyManager(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found");
    if (user.role === "AGENT" && property.agentId !== user._id)
      throw new Error("You can only edit your assigned listings");
    if (user.role === "ESTATE_MANAGER" && property.managerId !== user._id)
      throw new Error("You can only edit your managed listings");
    if (args.storageIds.length + (args.urls?.length ?? 0) < 1)
      throw new Error("Select at least one image");
    if ((property.imageStorageIds?.length ?? 0) + args.storageIds.length > 30)
      throw new Error("A property can contain at most 30 stored images");
    for (const storageId of args.storageIds) {
      const asset = await ctx.db
        .query("storedAssets")
        .withIndex("by_storage", (q) => q.eq("storageId", storageId))
        .unique();
      if (
        !asset ||
        asset.status !== "ACTIVE" ||
        asset.purpose !== "PROPERTY_IMAGE"
      )
        throw new Error("An uploaded image is not ready");
      if (asset.ownerId !== user._id && user.role !== "ADMIN")
        throw new Error("An uploaded image belongs to another account");
    }
    const safeUrls = args.urls ?? [];
    for (const url of safeUrls) {
      if (!url.startsWith("/api/media/"))
        throw new Error("Use a registered gallery upload");
      const asset = await ctx.db
        .query("r2Assets")
        .withIndex("by_key", (q) => q.eq("key", url.slice(11)))
        .unique();
      if (
        !asset ||
        asset.status !== "ACTIVE" ||
        (asset.ownerId !== user._id && user.role !== "ADMIN")
      )
        throw new Error("Image is not ready or belongs to another account");
    }
    await ctx.db.patch(property._id, {
      imageStorageIds: [
        ...(property.imageStorageIds ?? []),
        ...args.storageIds,
      ],
      images: [...property.images, ...safeUrls].slice(0, 30),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: user._id,
      actorEmail: user.email,
      action: "PROPERTY_MEDIA_ADDED",
      entityType: "properties",
      entityId: String(property._id),
      detail: `${args.storageIds.length + safeUrls.length} image(s)`,
      createdAt: Date.now(),
    });
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
    isFeatured: v.optional(v.boolean()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requirePropertyManager(ctx);
    const now = Date.now();
    if (
      !Number.isFinite(args.price) ||
      args.price <= 0 ||
      args.title.length > 160
    )
      throw new Error("Invalid listing details");
    if (
      await ctx.db
        .query("properties")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .first()
    )
      throw new Error("Listing URL already exists");
    return ctx.db.insert("properties", {
      ...args,
      isFeatured: args.isFeatured ?? false,
      isActive: false,
      verificationStatus: "DRAFT",
      managerId: user.role === "ESTATE_MANAGER" ? user._id : undefined,
      status: "AVAILABLE",
      agentId: user.role === "AGENT" ? user._id : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProperty = mutation({
  args: {
    propertyId: v.id("properties"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("AVAILABLE"), v.literal("RESERVED"), v.literal("SOLD")),
    ),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, { propertyId, ...updates }) => {
    await requireAdmin(ctx);
    const patch = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined),
    );
    await ctx.db.patch(propertyId, { ...patch, updatedAt: Date.now() });
  },
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
    isFeatured: v.optional(v.boolean()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
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
      isActive: false,
      verificationStatus: "DRAFT",
      status: "AVAILABLE",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reviewProperty = mutation({
  args: {
    propertyId: v.id("properties"),
    approve: v.boolean(),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const reviewer = await requireAdmin(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Listing not found");
    if (
      args.approve &&
      (args.reference.trim().length < 8 || property.images.length === 0)
    )
      throw new Error(
        "A title-review reference and gallery image are required",
      );
    await ctx.db.patch(property._id, {
      verificationStatus: args.approve ? "VERIFIED" : "REJECTED",
      verificationReference: args.reference.trim(),
      reviewedBy: reviewer,
      isActive: args.approve,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: reviewer,
      action: "PROPERTY_REVIEWED",
      entityType: "properties",
      entityId: String(property._id),
      detail: args.reference,
      createdAt: Date.now(),
    });
  },
});
