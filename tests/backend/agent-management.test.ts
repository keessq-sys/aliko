import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import aggregate from "@convex-dev/aggregate/test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  aggregate.register(t, "managementAggregate");
  aggregate.register(t, "bookingAggregate");
  rateLimiter.register(t);
  return t;
}
async function user(
  t: ReturnType<typeof setup>,
  role: "CLIENT" | "AGENT" | "ADMIN" = "CLIENT",
) {
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: crypto.randomUUID() + "@example.com",
      name: "Test",
      role,
      isDiaspora: false,
      kycVerified: false,
      createdAt: Date.now(),
    }),
  );
  const sessionId = await t.run((ctx) =>
    ctx.db.insert("authSessions", {
      userId: id,
      expirationTime: Date.now() + 3600000,
    }),
  );
  return {
    id,
    sessionId,
    auth: t.withIdentity({ subject: `${id}|${sessionId}` }),
  };
}
async function booking(t: ReturnType<typeof setup>, owner: any) {
  return t.run(async (ctx) => {
    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      name: "Test",
      slug: crypto.randomUUID(),
      location: "Kano",
      lga: "Dala",
      state: "Kano",
      description: "Test",
      amenities: [],
      infrastructure: [],
      isActive: true,
      isFeatured: false,
      totalPlots: 1,
      availablePlots: 0,
      createdAt: now,
      updatedAt: now,
    });
    const plotId = await ctx.db.insert("plots", {
      projectId,
      beaconNumber: "A",
      plotNumber: "1",
      sizeSqm: 500,
      price: 1000,
      status: "RESERVED",
      titleType: "C_OF_O",
      titleVerified: true,
      isCornerPlot: false,
      isPrimeLocation: false,
      isFeatured: false,
      createdAt: now,
      updatedAt: now,
    });
    const id = await ctx.db.insert("bookings", {
      clientId: owner,
      plotId,
      reference: crypto.randomUUID(),
      paymentStatus: "PENDING",
      paidAmount: 0,
      totalAmount: 1000,
      createdAt: now,
      updatedAt: now,
    });
    return { id, plotId };
  });
}

describe("administrator listing deletion", () => {
  it("deletes an unbooked plot, updates counts, and rejects other users", async () => {
    const t = setup(),
      owner = await user(t),
      admin = await user(t, "ADMIN"),
      b = await booking(t, owner.id);
    await expect(
      owner.auth.mutation(api.plots.deletePlot, { plotId: b.plotId }),
    ).rejects.toThrow();
    await expect(
      admin.auth.mutation(api.plots.deletePlot, { plotId: b.plotId }),
    ).rejects.toThrow(/Reserved/);
    await t.run(async (ctx) => {
      await ctx.db.patch(b.plotId, { status: "AVAILABLE" });
    });
    await expect(
      admin.auth.mutation(api.plots.deletePlot, { plotId: b.plotId }),
    ).rejects.toThrow(/booking history/);
    await t.run(async (ctx) => {
      await ctx.db.delete(b.id);
    });
    await admin.auth.mutation(api.plots.deletePlot, { plotId: b.plotId });
    expect(await t.run((ctx) => ctx.db.get(b.plotId))).toBeNull();
    expect(
      (await t.run((ctx) => ctx.db.query("adminAuditLog").collect())).some(
        (r) => r.action === "PLOT_DELETED",
      ),
    ).toBe(true);
  });
  it("deletes unpublished properties while requiring administrator access", async () => {
    const t = setup(),
      admin = await user(t, "ADMIN"),
      client = await user(t);
    const id = await admin.auth.mutation(api.properties.upsertProperty, {
      slug: "delete-test",
      title: "Delete test",
      type: "LAND",
      description: "Test",
      price: 100,
      location: "Ikeja",
      state: "Lagos",
      amenities: [],
      images: [],
    });
    expect(
      (
        await admin.auth.query(api.properties.listProperties, {
          activeOnly: false,
        })
      ).some((p) => p._id === id),
    ).toBe(true);
    await expect(
      client.auth.mutation(api.properties.deleteProperty, { propertyId: id }),
    ).rejects.toThrow();
    await admin.auth.mutation(api.properties.deleteProperty, {
      propertyId: id,
    });
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });
});
