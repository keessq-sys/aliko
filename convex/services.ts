import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

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
    const sorted = rows
      .filter((s) => (args.activeOnly === false ? true : s.isActive))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return Promise.all(sorted.map(async (service) => {
      const stored = await Promise.all((service.galleryStorageIds ?? []).map((id) => ctx.storage.getUrl(id)));
      return { ...service, gallery: [...stored.filter((url): url is string => Boolean(url)), ...(service.gallery ?? [])] };
    }));
  },
});

export const getService = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const service = await ctx.db.query("services").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!service) return null;
    const stored = await Promise.all((service.galleryStorageIds ?? []).map((id) => ctx.storage.getUrl(id)));
    return { ...service, gallery: [...stored.filter((url): url is string => Boolean(url)), ...(service.gallery ?? [])] };
  },
});

export const addServiceMedia = mutation({
  args: { id: v.id("services"), storageIds: v.array(v.id("_storage")), urls: v.optional(v.array(v.string())) },
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);
    const service = await ctx.db.get(args.id); if (!service) throw new Error("Service not found");
    for (const storageId of args.storageIds) {
      const asset = await ctx.db.query("storedAssets").withIndex("by_storage", (q) => q.eq("storageId", storageId)).unique();
      if (!asset || asset.status !== "ACTIVE" || asset.purpose !== "PROPERTY_IMAGE") throw new Error("An uploaded image is not ready");
    }
    const urls = (args.urls ?? []).filter((url) => url.startsWith("/api/media/") || url.startsWith("https://"));
    await ctx.db.patch(service._id, { galleryStorageIds: [...(service.galleryStorageIds ?? []), ...args.storageIds].slice(0, 40), gallery: [...(service.gallery ?? []), ...urls].slice(0, 40), updatedAt: Date.now() });
    await ctx.db.insert("adminAuditLog", { actorId: userId, action: "SERVICE_MEDIA_ADDED", entityType: "services", entityId: String(service._id), detail: `${args.storageIds.length + urls.length} image(s)`, createdAt: Date.now() });
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
