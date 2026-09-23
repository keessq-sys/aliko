import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { rateLimiter } from "./lib/rateLimits";

const purpose = v.union(
  v.literal("PROPERTY_IMAGE"),
  v.literal("PROJECT_MEDIA"),
  v.literal("SERVICE_ATTACHMENT"),
  v.literal("KYC_DOCUMENT"),
  v.literal("LEGAL_DOCUMENT"),
);

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const DOCUMENT_MIMES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function policy(
  uploadPurpose:
    | "PROPERTY_IMAGE"
    | "PROJECT_MEDIA"
    | "SERVICE_ATTACHMENT"
    | "KYC_DOCUMENT"
    | "LEGAL_DOCUMENT",
) {
  const image =
    uploadPurpose === "PROPERTY_IMAGE" || uploadPurpose === "PROJECT_MEDIA";
  return {
    allowed: image ? IMAGE_MIMES : DOCUMENT_MIMES,
    maxBytes: image ? 15_000_000 : 10_000_000,
  };
}

async function authenticatedUser(ctx: any) {
  const authId = await getAuthUserId(ctx);
  if (!authId) throw new Error("Unauthorized");
  const user = await ctx.db.get(authId as Id<"users">);
  if (!user) throw new Error("User profile not found");
  return user;
}

export const generateUploadUrl = mutation({
  args: {
    purpose,
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authenticatedUser(ctx);
    await rateLimiter.limit(ctx, "upload", {
      key: String(user._id),
      throws: true,
    });
    const rules = policy(args.purpose);
    if (!rules.allowed.has(args.mimeType.toLowerCase()))
      throw new Error("This file type is not allowed");
    if (
      !Number.isFinite(args.size) ||
      args.size <= 0 ||
      args.size > rules.maxBytes
    )
      throw new Error("File exceeds the upload size limit");
    if (args.fileName.trim().length < 1 || args.fileName.length > 180)
      throw new Error("Invalid file name");
    if (
      ["PROPERTY_IMAGE", "PROJECT_MEDIA", "LEGAL_DOCUMENT"].includes(
        args.purpose,
      ) &&
      !["ADMIN", "AGENT"].includes(user.role)
    ) {
      throw new Error("Forbidden for this upload purpose");
    }
    return ctx.storage.generateUploadUrl();
  },
});

export const registerUpload = mutation({
  args: {
    storageId: v.id("_storage"),
    purpose,
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authenticatedUser(ctx);
    const existing = await ctx.db
      .query("storedAssets")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .unique();
    if (existing) {
      if (existing.ownerId !== user._id)
        throw new Error("This file belongs to another account");
      return existing._id;
    }
    const metadata = await ctx.db.system.get(args.storageId);
    if (!metadata) throw new Error("Uploaded file was not found");
    const actualMime = metadata.contentType ?? args.mimeType;
    const rules = policy(args.purpose);
    if (!rules.allowed.has(actualMime.toLowerCase())) {
      await ctx.storage.delete(args.storageId);
      throw new Error("Uploaded content type is not allowed");
    }
    if (metadata.size > rules.maxBytes || metadata.size !== args.size) {
      await ctx.storage.delete(args.storageId);
      throw new Error(
        "Uploaded file metadata does not match the authorized upload",
      );
    }
    if (
      ["PROPERTY_IMAGE", "PROJECT_MEDIA", "LEGAL_DOCUMENT"].includes(
        args.purpose,
      ) &&
      !["ADMIN", "AGENT"].includes(user.role)
    ) {
      await ctx.storage.delete(args.storageId);
      throw new Error("Forbidden for this upload purpose");
    }
    const requiresScan = [
      "SERVICE_ATTACHMENT",
      "KYC_DOCUMENT",
      "LEGAL_DOCUMENT",
    ].includes(args.purpose);
    const now = Date.now();
    return ctx.db.insert("storedAssets", {
      storageId: args.storageId,
      ownerId: user._id,
      purpose: args.purpose,
      fileName: args.fileName.trim(),
      mimeType: actualMime,
      size: metadata.size,
      status: requiresScan ? "PENDING_SCAN" : "ACTIVE",
      expiresAt:
        args.purpose === "SERVICE_ATTACHMENT"
          ? now + 365 * 24 * 60 * 60 * 1000
          : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getAssetUrl = query({
  args: { assetId: v.id("storedAssets") },
  handler: async (ctx, { assetId }) => {
    const user = await authenticatedUser(ctx);
    const asset = await ctx.db.get(assetId);
    if (!asset || asset.status !== "ACTIVE") return null;
    if (asset.ownerId !== user._id && user.role !== "ADMIN")
      throw new Error("Forbidden");
    return ctx.storage.getUrl(asset.storageId);
  },
});

export const reviewAsset = mutation({
  args: {
    assetId: v.id("storedAssets"),
    status: v.union(v.literal("ACTIVE"), v.literal("QUARANTINED")),
  },
  handler: async (ctx, args) => {
    const user = await authenticatedUser(ctx);
    if (user.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.status === "DELETED")
      throw new Error("Asset not found");
    await ctx.db.patch(asset._id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: user._id,
      actorEmail: user.email,
      action: `ASSET_${args.status}`,
      entityType: "storedAssets",
      entityId: String(asset._id),
      createdAt: Date.now(),
    });
  },
});

export const purgeExpiredAssets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("storedAssets")
      .withIndex("by_expiry", (q) =>
        q.eq("status", "ACTIVE").lt("expiresAt", Date.now()),
      )
      .take(100);
    for (const asset of expired) {
      await ctx.storage.delete(asset.storageId);
      await ctx.db.patch(asset._id, {
        status: "DELETED",
        updatedAt: Date.now(),
      });
    }
    return { purged: expired.length };
  },
});
