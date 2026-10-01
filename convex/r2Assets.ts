import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function user(ctx: any) {
  const id = await getAuthUserId(ctx);
  if (!id) throw new Error("Unauthorized");
  const value = await ctx.db.get(id as Id<"users">);
  if (!value) throw new Error("User profile not found");
  return value;
}

function requireMaintenanceSecret(value: string) {
  const expected = process.env.MEDIA_MAINTENANCE_SECRET;
  if (!expected || value.length !== expected.length) throw new Error("Forbidden");
  let difference = 0;
  for (let index = 0; index < value.length; index++)
    difference |= value.charCodeAt(index) ^ expected.charCodeAt(index);
  if (difference !== 0) throw new Error("Forbidden");
}

export const register = mutation({
  args: {
    key: v.string(), collection: v.string(), fileName: v.string(),
    mimeType: v.string(), size: v.number(),
  },
  handler: async (ctx, args) => {
    const actor = await user(ctx);
    if (!['ADMIN', 'AGENT', 'ESTATE_MANAGER'].includes(actor.role))
      throw new Error("Forbidden");
    if (!/^[a-z0-9-]+\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+\.(jpg|png|webp|avif)$/.test(args.key))
      throw new Error("Invalid media key");
    const existing = await ctx.db.query("r2Assets")
      .withIndex("by_key", (q: any) => q.eq("key", args.key)).unique();
    if (existing) return existing._id;
    const now = Date.now();
    return ctx.db.insert("r2Assets", { ...args, ownerId: actor._id,
      status: "ACTIVE", createdAt: now, updatedAt: now });
  },
});

export const authorizeDelete = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const actor = await user(ctx);
    const asset = await ctx.db.query("r2Assets")
      .withIndex("by_key", (q: any) => q.eq("key", key)).unique();
    if (!asset || asset.status === "DELETED") return null;
    if (actor.role !== "ADMIN" && asset.ownerId !== actor._id)
      throw new Error("Forbidden");
    return { assetId: asset._id };
  },
});

export const markDeleted = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const actor = await user(ctx);
    const asset = await ctx.db.query("r2Assets")
      .withIndex("by_key", (q: any) => q.eq("key", key)).unique();
    if (!asset) throw new Error("Asset not found");
    if (actor.role !== "ADMIN" && asset.ownerId !== actor._id)
      throw new Error("Forbidden");
    const now = Date.now();
    await ctx.db.patch(asset._id, { status: "DELETED", deletedAt: now, updatedAt: now });
    await ctx.db.insert("adminAuditLog", { actorId: actor._id, actorEmail: actor.email,
      action: "R2_ASSET_DELETED", entityType: "r2Assets", entityId: String(asset._id),
      detail: key.slice(0, 300), createdAt: now });
  },
});

export const findRegisteredKeys = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, { keys }) => {
    const actor = await user(ctx);
    if (actor.role !== "ADMIN") throw new Error("Forbidden");
    if (keys.length > 100) throw new Error("At most 100 keys may be checked");
    const matches = await Promise.all(keys.map((key) => ctx.db.query("r2Assets")
      .withIndex("by_key", (q: any) => q.eq("key", key)).unique()));
    return matches.filter((asset) => asset && asset.status !== "DELETED").map((asset) => asset!.key);
  },
});

export const recordOrphanCleanup = mutation({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, { keys }) => {
    const actor = await user(ctx);
    if (actor.role !== "ADMIN") throw new Error("Forbidden");
    if (keys.length > 100) throw new Error("At most 100 keys may be recorded");
    await ctx.db.insert("adminAuditLog", {
      actorId: actor._id,
      actorEmail: actor.email,
      action: "R2_ORPHAN_CLEANUP",
      entityType: "r2Assets",
      detail: JSON.stringify({ count: keys.length, keys: keys.map((key) => key.slice(0, 220)) }).slice(0, 8_000),
      createdAt: Date.now(),
    });
    return { recorded: keys.length };
  },
});

/** Service-authenticated variants used only by the scheduled Cloudflare worker. */
export const findRegisteredKeysForMaintenance = query({
  args: { keys: v.array(v.string()), secret: v.string() },
  handler: async (ctx, { keys, secret }) => {
    requireMaintenanceSecret(secret);
    if (keys.length > 100) throw new Error("At most 100 keys may be checked");
    const matches = await Promise.all(keys.map((key) => ctx.db.query("r2Assets")
      .withIndex("by_key", (q: any) => q.eq("key", key)).unique()));
    return matches.filter((asset) => asset && asset.status !== "DELETED").map((asset) => asset!.key);
  },
});

export const recordScheduledOrphanCleanup = mutation({
  args: { keys: v.array(v.string()), secret: v.string() },
  handler: async (ctx, { keys, secret }) => {
    requireMaintenanceSecret(secret);
    if (keys.length > 100) throw new Error("At most 100 keys may be recorded");
    await ctx.db.insert("adminAuditLog", {
      action: "R2_SCHEDULED_ORPHAN_CLEANUP", entityType: "r2Assets",
      detail: JSON.stringify({ count: keys.length, keys: keys.map((key) => key.slice(0, 220)) }).slice(0, 8_000),
      createdAt: Date.now(),
    });
    return { recorded: keys.length };
  },
});

