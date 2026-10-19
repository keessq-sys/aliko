import { publicPropertyAggregate } from "./aggregates";
import { internalMutation, query } from "./_generated/server";
import services from "./data/serviceCatalog.json";

/** Synchronize the existing authored service catalogue, never mock properties. */
export const synchronizeServices = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    for (const service of services) {
      const existing = await ctx.db
        .query("services")
        .withIndex("by_slug", (q) => q.eq("slug", service.slug))
        .unique();
      if (!existing) {
        await ctx.db.insert("services", {
          ...service,
          category: service.category as any,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        inserted++;
      }
    }
    return { inserted };
  },
});
export const publicSummary = query({
  args: {},
  handler: async (ctx) => {
    const listings = await publicPropertyAggregate.sum(ctx, {
      namespace: "published-properties",
    });
    const agents = await ctx.db
      .query("agentApplications")
      .withIndex("by_status", (q) => q.eq("status", "APPROVED"))
      .take(500);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(500);
    return {
      listings,
      agents: agents.length,
      projects: projects.length,
      capped: agents.length === 500 || projects.length === 500,
      types: Object.fromEntries(
        await Promise.all(
          [
            "RESIDENTIAL",
            "COMMERCIAL",
            "LAND",
            "APARTMENT",
            "DUPLEX",
            "PENTHOUSE",
          ].map(async (type) => [
            type,
            await publicPropertyAggregate.sum(ctx, {
              namespace: "published-properties",
              bounds: { prefix: [type] },
            }),
          ]),
        ),
      ),
    };
  },
});
