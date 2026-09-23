import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { contactRateKey, rateLimiter } from "./lib/rateLimits";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId as Id<"users">);
  if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
  return userId;
}

// ── Public: submit an enquiry from a property/plot/project page ──────────
// No auth required — this is the lead-capture path for anonymous visitors.
export const submitEnquiry = mutation({
  args: {
    propertyId: v.optional(v.id("properties")),
    plotId: v.optional(v.id("plots")),
    projectId: v.optional(v.id("projects")),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    message: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.name.trim() || !args.email.trim() || !args.phone.trim()) {
      throw new Error("Name, email and phone are required.");
    }
    await rateLimiter.limit(ctx, "enquiry", {
      key: contactRateKey(args.email, args.phone),
      throws: true,
    });
    const now = Date.now();
    return ctx.db.insert("enquiries", {
      ...args,
      status: "NEW",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ── Admin: enquiry queue ──────────────────────────────────────────────────
export const listEnquiries = query({
  args: { status: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 200);
    const rows = args.status
      ? await ctx.db
          .query("enquiries")
          .withIndex("by_status_date", (q) =>
            q.eq("status", args.status as any),
          )
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("enquiries")
          .withIndex("by_date")
          .order("desc")
          .take(limit);

    return Promise.all(
      rows.map(async (e) => {
        const property = e.propertyId ? await ctx.db.get(e.propertyId) : null;
        const plot = e.plotId ? await ctx.db.get(e.plotId) : null;
        const project = e.projectId ? await ctx.db.get(e.projectId) : null;
        return { ...e, property, plot, project };
      }),
    );
  },
});

export const updateEnquiryStatus = mutation({
  args: {
    enquiryId: v.id("enquiries"),
    status: v.union(
      v.literal("NEW"),
      v.literal("CONTACTED"),
      v.literal("QUALIFIED"),
      v.literal("CONVERTED"),
      v.literal("LOST"),
    ),
  },
  handler: async (ctx, { enquiryId, status }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(enquiryId, { status, updatedAt: Date.now() });
  },
});
