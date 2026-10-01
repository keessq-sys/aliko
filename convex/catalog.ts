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
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(500);
    const published = properties.filter(
      (p) => p.verificationStatus === "VERIFIED",
    );
    const agents = await ctx.db
      .query("agentApplications")
      .withIndex("by_status", (q) => q.eq("status", "APPROVED"))
      .take(500);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(500);
    return {
      listings: published.length,
      agents: agents.length,
      projects: projects.length,
      capped: properties.length === 500 || agents.length === 500,
      types: Object.fromEntries(
        [
          "RESIDENTIAL",
          "COMMERCIAL",
          "LAND",
          "APARTMENT",
          "DUPLEX",
          "PENTHOUSE",
        ].map((type) => [
          type,
          published.filter((p) => p.type === type).length,
        ]),
      ),
    };
  },
});
