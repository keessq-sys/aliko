import { auditedMutation } from "./lib/auditedMutation";
import { requireUser } from "./lib/access";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

async function clientId(ctx: any) {
  const user = await requireUser(ctx);
  const id = user._id;
  if (!id) throw new Error("Unauthorized");
  return id as Id<"users">;
}

export const listSavedProperties = query({
  args: {},
  handler: async (ctx) => {
    const userId = await clientId(ctx);
    const saved = await ctx.db
      .query("savedProperties")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return Promise.all(
      saved.map(async (row: any) => {
        const property = (await ctx.db.get(
          row.propertyId,
        )) as Doc<"properties"> | null;
        if (
          !property ||
          !property.isActive ||
          property.verificationStatus !== "VERIFIED"
        )
          return null;
        const stored = await Promise.all(
          (property.imageStorageIds ?? []).map((id: Id<"_storage">) =>
            ctx.storage.getUrl(id),
          ),
        );
        return {
          ...row,
          property: {
            ...property,
            images: [...stored.filter(Boolean), ...(property.images ?? [])],
          },
        };
      }),
    ).then((rows) => rows.filter(Boolean));
  },
});

export const toggleSavedProperty = auditedMutation("clientPortal:toggleSavedProperty")({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, { propertyId }) => {
    const userId = await clientId(ctx);
    const property = await ctx.db.get(propertyId);
    if (
      !property ||
      !property.isActive ||
      property.verificationStatus !== "VERIFIED"
    )
      throw new Error("Published property not found");
    const existing = await ctx.db
      .query("savedProperties")
      .withIndex("by_user_property", (q: any) =>
        q.eq("userId", userId).eq("propertyId", propertyId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }
    await ctx.db.insert("savedProperties", {
      userId,
      propertyId,
      createdAt: Date.now(),
    });
    return { saved: true };
  },
});

export const getMySiteVisits = query({
  args: {},
  handler: async (ctx) => {
    const userId = await clientId(ctx);
    const rows = await ctx.db
      .query("siteVisitRequests")
      .withIndex("by_client", (q: any) => q.eq("clientId", userId))
      .order("desc")
      .collect();
    return Promise.all(
      rows.map(async (row: any) => {
        const [property, project, agent] = await Promise.all([
          row.propertyId ? ctx.db.get(row.propertyId) : null,
          row.projectId ? ctx.db.get(row.projectId) : null,
          row.agentId ? ctx.db.get(row.agentId as Id<"users">) : null,
        ]);
        return {
          ...row,
          property,
          project,
          agent: agent
            ? { _id: agent._id, name: agent.name, avatarUrl: agent.avatarUrl }
            : null,
        };
      }),
    );
  },
});

export const cancelMySiteVisit = auditedMutation("clientPortal:cancelMySiteVisit")({
  args: { visitId: v.id("siteVisitRequests") },
  handler: async (ctx, { visitId }) => {
    const userId = await clientId(ctx);
    const visit = await ctx.db.get(visitId);
    if (!visit || visit.clientId !== userId) throw new Error("Visit not found");
    if (visit.status === "COMPLETED")
      throw new Error("Completed visits cannot be cancelled");
    await ctx.db.patch(visitId, { status: "CANCELLED" });
  },
});

export const getMyAssignedSiteVisits = query({
  args: {},
  handler: async (ctx) => {
    const userId = await clientId(ctx);
    const actor = await ctx.db.get(userId);
    if (actor?.role !== "AGENT") throw new Error("Forbidden — AGENT only");
    const rows = await ctx.db
      .query("siteVisitRequests")
      .filter((q: any) => q.eq(q.field("agentId"), userId))
      .collect();
    return Promise.all(
      rows
        .sort((a: any, b: any) => a.requestedAt - b.requestedAt)
        .map(async (row: any) => {
          const [client, property, project] = await Promise.all([
            ctx.db.get(row.clientId as Id<"users">),
            row.propertyId ? ctx.db.get(row.propertyId) : null,
            row.projectId ? ctx.db.get(row.projectId) : null,
          ]);
          const { notes, ...visit } = row;
          return {
            ...visit,
            client: client ? { _id: client._id, name: client.name } : null,
            property,
            project,
          };
        }),
    );
  },
});

export const isSaved = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const id = await getAuthUserId(ctx);
    if (!id) return false;
    await requireUser(ctx);
    return Boolean(
      await ctx.db
        .query("savedProperties")
        .withIndex("by_user_property", (q) =>
          q.eq("userId", id).eq("propertyId", args.propertyId),
        )
        .unique(),
    );
  },
});
