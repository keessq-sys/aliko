import { propertyAggregate } from "./aggregates";
import { paginationOptsValidator } from "convex/server";
import { assertNigeriaLocation } from "./lib/nigeriaLocations";
import { auditedMutation } from "./lib/auditedMutation";
import { requireAdmin } from "./lib/access";
import { requireUser } from "./lib/access";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { assertListingImageCount } from "./lib/listingMedia";
import { requireManagerSubscription } from "./lib/managerPlans";

// ── Self-service: how many listings are assigned to the signed-in agent ──
// Note: nothing in the admin UI currently assigns an agentId to a property
// (createProperty/upsertProperty don't take one), so this is honestly 0 for
// every agent today — real, not fabricated, until that assignment step is
// built. Better than the hardcoded "12" this dashboard used to show.
export const getMyPropertiesCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return propertyAggregate.count(ctx, {
      namespace: "properties",
      bounds: { prefix: [String(user._id)] },
    });
  },
});

async function requirePropertyManager(ctx: any) {
  const user = await requireUser(ctx);
  if (!user || !["ADMIN", "AGENT", "ESTATE_MANAGER"].includes(user.role))
    throw new Error("Forbidden — property team only");
  if (user.role === "ESTATE_MANAGER")
    await requireManagerSubscription(ctx, user);
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
    if (args.activeOnly === false) await requireAdmin(ctx);
    let rows =
      args.activeOnly === false
        ? await ctx.db.query("properties").take(500)
        : args.isFeatured != null
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

/** Cursor pagination uses publication index; filters are applied before pagination. */
export const browse = query({
  args: {
    paginationOpts: paginationOptsValidator,
    state: v.optional(v.string()),
    type: v.optional(PROPERTY_TYPE),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    radiusKm: v.optional(v.number()),
    search: v.optional(v.string()),
    lga: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    status: v.optional(v.string()),
    bedrooms: v.optional(v.number()),
    bedroomsExact: v.optional(v.boolean()),
    bathrooms: v.optional(v.number()),
    bathroomsExact: v.optional(v.boolean()),
    sort: v.optional(
      v.union(
        v.literal("NEWEST"),
        v.literal("PRICE_ASC"),
        v.literal("PRICE_DESC"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    if ((args.latitude === undefined) !== (args.longitude === undefined))
      throw new Error("Provide latitude and longitude together");
    if (
      args.latitude !== undefined &&
      (Math.abs(args.latitude) > 90 ||
        Math.abs(args.longitude!) > 180 ||
        !Number.isFinite(args.latitude) ||
        !Number.isFinite(args.longitude!))
    )
      throw new Error("Invalid coordinates");
    const radius = args.radiusKm ?? 50;
    if (!Number.isFinite(radius) || radius <= 0 || radius > 500)
      throw new Error("Radius must be between 0 and 500 km");
    const index = args.sort?.startsWith("PRICE")
      ? "by_publication_price"
      : "by_publication";
    if (args.search?.trim() && args.sort && args.sort !== "NEWEST")
      throw new Error(
        "Text searches use relevance ordering; clear search to sort by price",
      );
    if (args.search && args.search.length > 120)
      throw new Error("Search text is too long");
    const rows = args.search?.trim()
      ? ctx.db
          .query("properties")
          .withSearchIndex("search_catalog", (q) =>
            q
              .search("searchText", args.search!.trim())
              .eq("isActive", true)
              .eq("verificationStatus", "VERIFIED"),
          )
      : ctx.db
          .query("properties")
          .withIndex(index, (q) =>
            q.eq("isActive", true).eq("verificationStatus", "VERIFIED"),
          )
          .order(args.sort === "PRICE_ASC" ? "asc" : "desc");
    let filtered = rows.filter((q) =>
      q.and(
        ...[
          ...(args.state ? [q.eq(q.field("state"), args.state)] : []),
          ...(args.type ? [q.eq(q.field("type"), args.type)] : []),
          ...(args.lga ? [q.eq(q.field("lga"), args.lga)] : []),
          ...(args.minPrice !== undefined
            ? [q.gte(q.field("price"), args.minPrice)]
            : []),
          ...(args.maxPrice !== undefined
            ? [q.lte(q.field("price"), args.maxPrice)]
            : []),
          ...(args.status ? [q.eq(q.field("status"), args.status)] : []),
          ...(args.bathrooms !== undefined
            ? [
                args.bathroomsExact
                  ? q.eq(q.field("bathrooms"), args.bathrooms)
                  : q.gte(q.field("bathrooms"), args.bathrooms),
              ]
            : []),
          ...(args.bedrooms !== undefined
            ? [
                args.bedroomsExact
                  ? q.eq(q.field("bedrooms"), args.bedrooms)
                  : q.gte(q.field("bedrooms"), args.bedrooms),
              ]
            : []),
        ],
      ),
    );
    if (args.latitude !== undefined) {
      const latitudeDelta = radius / 111.195;
      filtered = filtered.filter((q) =>
        q.and(
          q.gte(
            q.field("latitude"),
            Math.max(-90, args.latitude! - latitudeDelta),
          ),
          q.lte(
            q.field("latitude"),
            Math.min(90, args.latitude! + latitudeDelta),
          ),
        ),
      );
    }
    const result = await filtered.paginate({
      ...args.paginationOpts,
      numItems: Math.min(100, Math.max(1, args.paginationOpts.numItems)),
    });
    const nearby =
      args.latitude === undefined
        ? result.page
        : result.page.filter((p) => {
            if (p.latitude === undefined || p.longitude === undefined)
              return false;
            const r = Math.PI / 180,
              dlat = (p.latitude - args.latitude!) * r,
              dlon = (p.longitude - args.longitude!) * r;
            const a =
              Math.sin(dlat / 2) ** 2 +
              Math.cos(args.latitude! * r) *
                Math.cos(p.latitude * r) *
                Math.sin(dlon / 2) ** 2;
            return (
              6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radius
            );
          });
    return {
      ...result,
      page: await Promise.all(
        nearby.map((row) => withResolvedImages(ctx, row)),
      ),
    };
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

export const addPropertyMedia = auditedMutation("properties:addPropertyMedia")({
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
    if (
      new Set(args.storageIds).size !== args.storageIds.length ||
      new Set(args.urls ?? []).size !== (args.urls?.length ?? 0) ||
      args.storageIds.some((id) => property.imageStorageIds?.includes(id)) ||
      args.urls?.some((url) => property.images.includes(url))
    )
      throw new Error("An image is already in this gallery.");
    assertListingImageCount(
      (property.imageStorageIds?.length ?? 0) +
        property.images.length +
        args.storageIds.length +
        (args.urls?.length ?? 0),
    );
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
        asset.collection !== "property" ||
        (asset.ownerId !== user._id && user.role !== "ADMIN")
      )
        throw new Error("Image is not ready or belongs to another account");
    }
    await ctx.db.patch(property._id, {
      imageStorageIds: [
        ...(property.imageStorageIds ?? []),
        ...args.storageIds,
      ],
      images: [...property.images, ...safeUrls],
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
export const createProperty = auditedMutation("properties:createProperty")({
  args: {
    slug: v.string(),
    title: v.string(),
    type: PROPERTY_TYPE,
    description: v.string(),
    price: v.number(),
    location: v.string(),
    state: v.string(),
    lga: v.optional(v.string()),
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
    assertNigeriaLocation(args.state, args.lga);
    if (user.role === "ESTATE_MANAGER") {
      const access = await requireManagerSubscription(ctx, user);
      const listings = await ctx.db
        .query("properties")
        .withIndex("by_manager", (q) => q.eq("managerId", user._id))
        .take(access.propertyLimit + 1);
      if (listings.length >= access.propertyLimit)
        throw new Error("Your plan's property limit has been reached.");
    }
    assertListingImageCount(args.images.length);
    if (args.images.length)
      throw new Error(
        "Create a draft, then use the registered gallery upload.",
      );
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

export const updateProperty = auditedMutation("properties:updateProperty")({
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
export const upsertProperty = auditedMutation("properties:upsertProperty")({
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
    assertListingImageCount(args.images.length);
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

export const reviewProperty = auditedMutation("properties:reviewProperty")({
  args: {
    propertyId: v.id("properties"),
    approve: v.boolean(),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const reviewer = await requireAdmin(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Listing not found");
    if (args.approve)
      assertListingImageCount(
        property.images.length + (property.imageStorageIds?.length ?? 0),
        true,
      );
    if (args.approve && args.reference.trim().length < 8)
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

export const deleteProperty = auditedMutation("properties:deleteProperty")({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, { propertyId }) => {
    const actor = await requireAdmin(ctx);
    const record = await ctx.db.get(propertyId);
    if (!record) return;
    if (record.status !== "AVAILABLE")
      throw new Error(
        "Reserved or sold properties cannot be deleted. Unpublish the listing instead.",
      );
    const order = await ctx.db
      .query("checkoutOrders")
      .withIndex("by_target_status", (q) =>
        q.eq("kind", "PROPERTY").eq("targetId", String(propertyId)),
      )
      .first();
    if (order)
      throw new Error(
        "This property has transaction history. Unpublish it instead.",
      );
    await ctx.db.insert("adminAuditLog", {
      actorId: actor,
      action: "PROPERTY_DELETED",
      entityType: "properties",
      entityId: String(propertyId),
      detail: record.title,
      createdAt: Date.now(),
    });
    await ctx.db.delete(propertyId);
  },
});
