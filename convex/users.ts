import { v } from "convex/values";
import { query } from "./_generated/server";

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
    const rows = await ctx.db.query("users").collect();
    const counts: Record<string, number> = {
      ADMIN: 0, AGENT: 0, CLIENT: 0, ESTATE_MANAGER: 0, DIASPORA_CLIENT: 0, TENANT: 0,
    };
    for (const u of rows) counts[u.role] = (counts[u.role] ?? 0) + 1;
    return { counts, total: rows.length };
  },
});
