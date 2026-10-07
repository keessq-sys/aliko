import { auditedMutation } from "./lib/auditedMutation";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireUser, requireAdmin } from "./lib/access";
import { requireManagerSubscription } from "./lib/managerPlans";

async function user(ctx: any) {
  const value = await requireUser(ctx);
  if (value.role === "ADMIN") await requireAdmin(ctx);
  return value;
}

function requireMaintenanceSecret(value: string) {
  const expected = process.env.MEDIA_MAINTENANCE_SECRET;
  if (!expected || value.length !== expected.length)
    throw new Error("Forbidden");
  let difference = 0;
  for (let index = 0; index < value.length; index++)
    difference |= value.charCodeAt(index) ^ expected.charCodeAt(index);
  if (difference !== 0) throw new Error("Forbidden");
}

export const register = auditedMutation("r2Assets:register")({
  args: {
    key: v.string(),
    collection: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    requireMaintenanceSecret(args.secret);
    const actor = await user(ctx);
    if (actor.role === "ESTATE_MANAGER") await requireManagerSubscription(ctx, actor);
    if (!["ADMIN", "AGENT", "ESTATE_MANAGER"].includes(actor.role))
      throw new Error("Forbidden");
    if (
      !/^[a-z0-9-]+\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+\.(jpg|png|webp|avif)$/.test(
        args.key,
      )
    )
      throw new Error("Invalid media key");
    const existing = await ctx.db
      .query("r2Assets")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .unique();
    if (existing) return existing._id;
    const now = Date.now();
    const { secret, ...metadata } = args;
    return ctx.db.insert("r2Assets", {
      ...metadata,
      ownerId: actor._id,
      securityVersion: "2026-10-01-decode-scan-v1",
      scannedAt: now,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const authorizeDelete = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const actor = await user(ctx);
    const asset = await ctx.db
      .query("r2Assets")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .unique();
    if (!asset || asset.status === "DELETED") return null;
    if (actor.role !== "ADMIN" && asset.ownerId !== actor._id)
      throw new Error("Forbidden");
    return { assetId: asset._id };
  },
});

export const markDeleted = auditedMutation("r2Assets:markDeleted")({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const actor = await user(ctx);
    const asset = await ctx.db
      .query("r2Assets")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .unique();
    if (!asset) throw new Error("Asset not found");
    if (actor.role !== "ADMIN" && asset.ownerId !== actor._id)
      throw new Error("Forbidden");
    const now = Date.now();
    await ctx.db.patch(asset._id, {
      status: "DELETED",
      deletedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: actor._id,
      actorEmail: actor.email,
      action: "R2_ASSET_DELETED",
      entityType: "r2Assets",
      entityId: String(asset._id),
      detail: key.slice(0, 300),
      createdAt: now,
    });
  },
});

export const findRegisteredKeys = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, { keys }) => {
    const actor = await user(ctx);
    if (actor.role !== "ADMIN") throw new Error("Forbidden");
    if (keys.length > 100) throw new Error("At most 100 keys may be checked");
    const matches = await Promise.all(
      keys.map((key) =>
        ctx.db
          .query("r2Assets")
          .withIndex("by_key", (q: any) => q.eq("key", key))
          .unique(),
      ),
    );
    return matches
      .filter((asset) => asset && asset.status !== "DELETED")
      .map((asset) => asset!.key);
  },
});

export const recordOrphanCleanup = auditedMutation("r2Assets:recordOrphanCleanup")({
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
      detail: JSON.stringify({
        count: keys.length,
        keys: keys.map((key) => key.slice(0, 220)),
      }).slice(0, 8_000),
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
    const matches = await Promise.all(
      keys.map((key) =>
        ctx.db
          .query("r2Assets")
          .withIndex("by_key", (q: any) => q.eq("key", key))
          .unique(),
      ),
    );
    return matches
      .filter((asset) => asset && asset.status !== "DELETED")
      .map((asset) => asset!.key);
  },
});

export const recordScheduledOrphanCleanup = auditedMutation("r2Assets:recordScheduledOrphanCleanup")({
  args: { keys: v.array(v.string()), secret: v.string() },
  handler: async (ctx, { keys, secret }) => {
    requireMaintenanceSecret(secret);
    if (keys.length > 100) throw new Error("At most 100 keys may be recorded");
    await ctx.db.insert("adminAuditLog", {
      action: "R2_SCHEDULED_ORPHAN_CLEANUP",
      entityType: "r2Assets",
      detail: JSON.stringify({
        count: keys.length,
        keys: keys.map((key) => key.slice(0, 220)),
      }).slice(0, 8_000),
      createdAt: Date.now(),
    });
    return { recorded: keys.length };
  },
});

export const canRead = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const asset = await ctx.db
      .query("r2Assets")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!asset || asset.status !== "ACTIVE") return false;
    const actorId = await getAuthUserId(ctx);
    const actor = actorId ? await ctx.db.get(actorId) : null;
    if (
      actor &&
      actor.accountStatus !== "SUSPENDED" &&
      (actor.role === "ADMIN" || actor._id === asset.ownerId)
    )
      return true;
    const url = `/api/media/${key}`;
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(500);
    const services = await ctx.db
      .query("services")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(100);
    return (
      properties.some(
        (p) => p.verificationStatus === "VERIFIED" && p.images.includes(url),
      ) || services.some((s) => s.gallery?.includes(url))
    );
  },
});
