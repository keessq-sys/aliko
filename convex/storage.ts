import { requireAdmin, requireUser } from "./lib/access";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { rateLimiter } from "./lib/rateLimits";
import { scanFile, decodeImage } from "./lib/mediaSecurity";
import { paginationOptsValidator } from "convex/server";

export const myAssets = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("storedAssets")
      .withIndex("by_owner_date", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

const purpose = v.union(
  v.literal("AVATAR_IMAGE"),
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
    | "AVATAR_IMAGE"
    | "PROPERTY_IMAGE"
    | "PROJECT_MEDIA"
    | "SERVICE_ATTACHMENT"
    | "KYC_DOCUMENT"
    | "LEGAL_DOCUMENT",
) {
  const image =
    uploadPurpose === "PROPERTY_IMAGE" ||
    uploadPurpose === "PROJECT_MEDIA" ||
    uploadPurpose === "AVATAR_IMAGE";
  return {
    allowed: image ? IMAGE_MIMES : DOCUMENT_MIMES,
    maxBytes: image ? 15_000_000 : 10_000_000,
  };
}

async function authenticatedUser(ctx: any) {
  return requireUser(ctx);
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
      !["ADMIN", "AGENT", "ESTATE_MANAGER"].includes(user.role)
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
      !["ADMIN", "AGENT", "ESTATE_MANAGER"].includes(user.role)
    ) {
      await ctx.storage.delete(args.storageId);
      throw new Error("Forbidden for this upload purpose");
    }
    const requiresScan = true;
    const now = Date.now();
    const assetId = await ctx.db.insert("storedAssets", {
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
    if (args.purpose === "AVATAR_IMAGE")
      await ctx.db.patch(user._id, { avatarStorageId: args.storageId });
    if (
      requiresScan &&
      (process.env.MALWARE_SCANNER_URL ||
        process.env.MALWARE_SCANNER_PROVIDER === "CLOUDMERSIVE") &&
      process.env.MALWARE_SCANNER_API_KEY
    ) {
      await ctx.scheduler.runAfter(0, internal.storage.scanAsset, { assetId });
    }
    return assetId;
  },
});

export const getAssetForScan = internalQuery({
  args: { assetId: v.id("storedAssets") },
  handler: async (ctx, { assetId }) => {
    const asset = await ctx.db.get(assetId);
    if (!asset || asset.status !== "PENDING_SCAN") return null;
    const url = await ctx.storage.getUrl(asset.storageId);
    return url ? { asset, url } : null;
  },
});

export const completeAssetScan = internalMutation({
  args: {
    assetId: v.id("storedAssets"),
    clean: v.boolean(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.status !== "PENDING_SCAN") return;
    await ctx.db.patch(asset._id, {
      status: args.clean ? "ACTIVE" : "QUARANTINED",
      securityVersion: args.clean ? "2026-10-01-decode-scan-v1" : undefined,
      scannedAt: Date.now(),
      updatedAt: Date.now(),
    });
    if (args.clean && asset.purpose === "AVATAR_IMAGE") {
      const owner = await ctx.db.get(asset.ownerId);
      if (owner?.avatarStorageId === asset.storageId)
        await ctx.db.patch(owner._id, {
          avatarUrl: (await ctx.storage.getUrl(asset.storageId)) ?? undefined,
        });
    }
    if (!args.clean)
      await ctx.db.insert("notificationLog", {
        channel: "EMAIL",
        recipient: process.env.ADMIN_ALERT_EMAIL ?? "unconfigured-operator",
        subject: "Uploaded file quarantined",
        templateName: "malware-alert",
        message: (args.detail ?? "Scanner marked an upload as unsafe").slice(
          0,
          500,
        ),
        status: "QUEUED",
        relatedId: String(asset._id),
        relatedType: "storedAssets",
        createdAt: Date.now(),
      });
  },
});

/** Provider-neutral scanner contract: multipart `file`; JSON `{ clean, threat? }`. */
export const scanAsset = internalAction({
  args: { assetId: v.id("storedAssets") },
  handler: async (ctx, { assetId }) => {
    const value = await ctx.runQuery(internal.storage.getAssetForScan, {
      assetId,
    });
    if (!value) return;
    const endpoint = process.env.MALWARE_SCANNER_URL;
    const apiKey = process.env.MALWARE_SCANNER_API_KEY;
    if (
      (!endpoint && process.env.MALWARE_SCANNER_PROVIDER !== "CLOUDMERSIVE") ||
      !apiKey
    )
      return;
    try {
      const download = await fetch(value.url);
      if (!download.ok)
        throw new Error("Could not retrieve upload for scanning");
      let file = await download.blob();
      const result = await scanFile(file, value.asset.fileName, {
        provider: process.env.MALWARE_SCANNER_PROVIDER,
        url: endpoint,
        key: apiKey,
      });
      if (result.clean && value.asset.mimeType.startsWith("image/")) {
        file = await decodeImage(file, {
          url: process.env.MEDIA_PROCESSOR_URL,
          key: process.env.MEDIA_PROCESSOR_KEY,
        });
        const decodedScan = await scanFile(file, value.asset.fileName, {
          provider: process.env.MALWARE_SCANNER_PROVIDER,
          url: endpoint,
          key: apiKey,
        });
        if (!decodedScan.clean)
          throw new Error("Decoded image failed security inspection");
        const storageId = await ctx.storage.store(file);
        await ctx.runMutation(internal.storage.replaceDecodedAsset, {
          assetId,
          storageId,
          size: file.size,
        });
      }
      await ctx.runMutation(internal.storage.completeAssetScan, {
        assetId,
        clean: result.clean,
        detail: result.threat,
      });
    } catch {
      await ctx.runMutation(internal.storage.recordScanFailure, { assetId });
    }
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
    await requireAdmin(ctx);
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.status === "DELETED")
      throw new Error("Asset not found");
    if (args.status === "ACTIVE" && asset.status !== "ACTIVE")
      throw new Error(
        "A successful security scan is required before releasing this file",
      );
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

export const recordScanFailure = internalMutation({
  args: { assetId: v.id("storedAssets") },
  handler: async (ctx, { assetId }) => {
    const asset = await ctx.db.get(assetId);
    if (!asset || asset.status !== "PENDING_SCAN") return;
    const attempts = (asset.scanAttempts ?? 0) + 1;
    await ctx.db.patch(assetId, {
      scanAttempts: attempts,
      nextScanAt: Date.now() + 60000 * 2 ** attempts,
      scanError:
        "Scanner unavailable or invalid response; file remains private",
    });
    if (attempts === 5)
      await ctx.db.insert("backgroundJobs", {
        jobType: "MALWARE_SCAN",
        relatedType: "storedAssets",
        relatedId: String(assetId),
        status: "DEAD_LETTER",
        attempts,
        maxAttempts: 5,
        lastError: "Scan retry limit reached; operator attention required",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
  },
});
export const retryPendingScans = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (
      (!process.env.MALWARE_SCANNER_URL &&
        process.env.MALWARE_SCANNER_PROVIDER !== "CLOUDMERSIVE") ||
      !process.env.MALWARE_SCANNER_API_KEY
    )
      return;
    const pending = await ctx.db
      .query("storedAssets")
      .withIndex("by_status_date", (q) => q.eq("status", "PENDING_SCAN"))
      .take(100);
    for (const asset of pending
      .filter(
        (row) =>
          (row.scanAttempts ?? 0) < 5 && (row.nextScanAt ?? 0) <= Date.now(),
      )
      .slice(0, 10)) {
      await ctx.db.patch(asset._id, { nextScanAt: Date.now() + 120000 });
      await ctx.scheduler.runAfter(0, internal.storage.scanAsset, {
        assetId: asset._id,
      });
    }
  },
});
export const retryAssetScan = mutation({
  args: { assetId: v.id("storedAssets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.status !== "PENDING_SCAN")
      throw new Error("No pending scan to retry");
    await ctx.db.patch(asset._id, { scanAttempts: 0, nextScanAt: 0 });
  },
});

export const replaceDecodedAsset = internalMutation({
  args: {
    assetId: v.id("storedAssets"),
    storageId: v.id("_storage"),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.status !== "PENDING_SCAN") {
      await ctx.storage.delete(args.storageId);
      return;
    }
    const previous = asset.storageId;
    await ctx.db.patch(asset._id, {
      storageId: args.storageId,
      size: args.size,
      mimeType: "image/webp",
      updatedAt: Date.now(),
    });
    if (asset.purpose === "AVATAR_IMAGE") {
      const user = await ctx.db.get(asset.ownerId);
      if (user?.avatarStorageId === previous)
        await ctx.db.patch(user._id, { avatarStorageId: args.storageId });
    }
    await ctx.storage.delete(previous);
  },
});
