import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./lib/access";
import { paginationOptsValidator } from "convex/server";
export const testimonials = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("testimonials")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .order("desc")
      .take(12);
    return rows.map(({ author, quote, location, _id }) => ({
      _id,
      author,
      quote,
      location,
    }));
  },
});
export const reviewQueue = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("testimonials")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
export const saveTestimonial = mutation({
  args: {
    id: v.optional(v.id("testimonials")),
    author: v.string(),
    quote: v.string(),
    location: v.string(),
    consentReference: v.string(),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const reviewedBy = await requireAdmin(ctx);
    if (
      args.author.trim().length < 2 ||
      args.author.length > 120 ||
      args.quote.trim().length < 10 ||
      args.quote.length > 1500 ||
      args.location.length > 120 ||
      args.consentReference.trim().length < 5 ||
      args.consentReference.length > 300
    )
      throw new Error(
        "Provide authentic content and recorded publication consent",
      );
    if (args.id && !(await ctx.db.get(args.id)))
      throw new Error("Testimonial not found");
    const { id, ...data } = args,
      now = Date.now();
    const rowId = id
      ? (await ctx.db.patch(id, { ...data, reviewedBy, updatedAt: now }), id)
      : await ctx.db.insert("testimonials", {
          ...data,
          reviewedBy,
          createdAt: now,
          updatedAt: now,
        });
    await ctx.db.insert("adminAuditLog", {
      actorId: reviewedBy,
      action: args.approved
        ? "TESTIMONIAL_PUBLISHED"
        : "TESTIMONIAL_UNPUBLISHED",
      entityType: "testimonials",
      entityId: String(rowId),
      createdAt: now,
    });
    return rowId;
  },
});
