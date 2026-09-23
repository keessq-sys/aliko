import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId as Id<"users">);
  if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
}

// ── Self-service: the signed-in user's own profile ──────────────────────
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db.get(userId as Id<"users">);
  },
});

export const updateMyProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    country: v.optional(v.string()),
    occupation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    // Note: email is intentionally not editable here — it's the account's
    // sign-in identifier and changing it needs its own re-verification
    // flow, which doesn't exist yet.
    const patch = Object.fromEntries(Object.entries(args).filter(([, val]) => val !== undefined));
    if (Object.keys(patch).length === 0) return;
    await ctx.db.patch(userId as Id<"users">, { ...patch, lastActiveAt: Date.now() });
  },
});

// ── Admin: full user roster, optionally filtered by role ───────────────────
export const listUsers = query({
  args: {
    role: v.optional(v.union(
      v.literal("ADMIN"),
      v.literal("AGENT"),
      v.literal("CLIENT"),
      v.literal("ESTATE_MANAGER"),
      v.literal("DIASPORA_CLIENT"),
      v.literal("TENANT"),
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let rows = args.role
      ? await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", args.role!)).collect()
      : await ctx.db.query("users").collect();

    rows = rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.slice(0, args.limit ?? 200);
  },
});

// ── Admin: quick role-distribution counters for dashboards ─────────────────
export const getRoleCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("users").collect();
    const counts: Record<string, number> = {
      ADMIN: 0, AGENT: 0, CLIENT: 0, ESTATE_MANAGER: 0, DIASPORA_CLIENT: 0, TENANT: 0,
    };
    for (const u of rows) counts[u.role] = (counts[u.role] ?? 0) + 1;
    return { counts, total: rows.length };
  },
});
