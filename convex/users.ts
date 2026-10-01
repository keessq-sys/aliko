import { requireAdmin, requireUser } from "./lib/access";
import { v } from "convex/values";
import {
  query,
  mutation,
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { getAuthUserId, invalidateSessions } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ── Self-service: the signed-in user's own profile ──────────────────────
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    try {
      return await requireUser(ctx);
    } catch {
      return null;
    }
  },
});

export const updateMyProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    country: v.optional(v.string()),
    occupation: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    if (
      Object.values(args).some(
        (value) => value !== undefined && value.length > 500,
      )
    )
      throw new Error("Profile field is too long");
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    // Note: email is intentionally not editable here — it's the account's
    // sign-in identifier and changing it needs its own re-verification
    // flow, which doesn't exist yet.
    const patch = Object.fromEntries(
      Object.entries(args).filter(([, val]) => val !== undefined),
    );
    if (Object.keys(patch).length === 0) return;
    await ctx.db.patch(userId as Id<"users">, {
      ...patch,
      lastActiveAt: Date.now(),
    });
  },
});

// ── Admin: full user roster, optionally filtered by role ───────────────────
export const listUsers = query({
  args: {
    role: v.optional(
      v.union(
        v.literal("ADMIN"),
        v.literal("AGENT"),
        v.literal("CLIENT"),
        v.literal("ESTATE_MANAGER"),
        v.literal("DIASPORA_CLIENT"),
        v.literal("TENANT"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(Math.max(args.limit ?? 200, 1), 500);
    return args.role
      ? ctx.db
          .query("users")
          .withIndex("by_role_created", (q) => q.eq("role", args.role!))
          .order("desc")
          .take(limit)
      : ctx.db.query("users").order("desc").take(limit);
  },
});

// ── Admin: quick role-distribution counters for dashboards ─────────────────
export const getRoleCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const roles = [
      "ADMIN",
      "AGENT",
      "CLIENT",
      "ESTATE_MANAGER",
      "DIASPORA_CLIENT",
      "TENANT",
    ] as const;
    const rowsByRole = await Promise.all(
      roles.map((role) =>
        ctx.db
          .query("users")
          .withIndex("by_role_created", (q) => q.eq("role", role))
          .take(10_000),
      ),
    );
    const counts: Record<string, number> = {
      ADMIN: 0,
      AGENT: 0,
      CLIENT: 0,
      ESTATE_MANAGER: 0,
      DIASPORA_CLIENT: 0,
      TENANT: 0,
    };
    roles.forEach((role, index) => {
      counts[role] = rowsByRole[index].length;
    });
    return {
      counts,
      total: rowsByRole.reduce((sum, rows) => sum + rows.length, 0),
    };
  },
});

export const getUserInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => ctx.db.get(userId),
});

export const setAccountStatusInternal = internalMutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("ACTIVE"), v.literal("SUSPENDED")),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      accountStatus: args.status,
      suspendedAt: args.status === "SUSPENDED" ? Date.now() : undefined,
    });
    await ctx.db.insert("adminAuditLog", {
      actorId: args.actorId,
      action:
        args.status === "SUSPENDED" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_RESTORED",
      entityType: "users",
      entityId: String(args.userId),
      createdAt: Date.now(),
    });
  },
});

/** Admin recovery control: suspending an account revokes every active session. */
export const setAccountStatus = action({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("ACTIVE"), v.literal("SUSPENDED")),
  },
  handler: async (ctx, args) => {
    const actorId = await getAuthUserId(ctx);
    if (!actorId) throw new Error("Unauthorized");
    const actor = await ctx.runQuery(internal.paymentOperations.requireAdmin, {
      userId: actorId as Id<"users">,
    });
    if (!actor) throw new Error("Unauthorized");
    await ctx.runMutation(internal.users.setAccountStatusInternal, {
      ...args,
      actorId: actorId as Id<"users">,
    });
    if (args.status === "SUSPENDED")
      await invalidateSessions(ctx, { userId: args.userId });
  },
});
