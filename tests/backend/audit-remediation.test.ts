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
describe("audit booking remediation", () => {
  it("denies unrelated agents and suspended owners without releasing the plot", async () => {
    const t = setup(),
      owner = await user(t),
      agent = await user(t, "AGENT"),
      b = await booking(t, owner.id);
    await expect(
      agent.auth.mutation(api.bookings.cancelBooking, { bookingId: b.id }),
    ).rejects.toThrow(/Forbidden/);
    await t.run((ctx) =>
      ctx.db.patch(owner.id, { accountStatus: "SUSPENDED" }),
    );
    await expect(
      owner.auth.mutation(api.bookings.cancelBooking, { bookingId: b.id }),
    ).rejects.toThrow(/Unauthorized/);
    expect((await t.run((ctx) => ctx.db.get(b.plotId)))?.status).toBe(
      "RESERVED",
    );
  });
  it("cancels once and cannot release a successor reservation on replay", async () => {
    const t = setup(),
      owner = await user(t),
      next = await user(t),
      b = await booking(t, owner.id);
    await owner.auth.mutation(api.bookings.cancelBooking, { bookingId: b.id });
    await t.run(async (ctx) => {
      await ctx.db.patch(b.plotId, { status: "SOLD" });
      await ctx.db.insert("bookings", {
        clientId: next.id,
        plotId: b.plotId,
        reference: "successor",
        paymentStatus: "SUCCESS",
        paidAmount: 1000,
        totalAmount: 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    await owner.auth.mutation(api.bookings.cancelBooking, { bookingId: b.id });
    expect((await t.run((ctx) => ctx.db.get(b.plotId)))?.status).toBe("SOLD");
  });
  it("rejects a revoked session", async () => {
    const t = setup(),
      u = await user(t),
      b = await booking(t, u.id);
    await t.run((ctx) => ctx.db.delete(u.sessionId));
    await expect(
      u.auth.mutation(api.bookings.cancelBooking, { bookingId: b.id }),
    ).rejects.toThrow(/Unauthorized/);
  });
});
describe("durable newsletter consent", () => {
  it("requires consent and stores one normalized subscription", async () => {
    const t = setup();
    await expect(
      t.mutation(api.newsletter.subscribe, {
        email: "a@example.com",
        consent: false,
      }),
    ).rejects.toThrow(/consent/);
    await t.mutation(api.newsletter.subscribe, {
      email: " A@EXAMPLE.COM ",
      consent: true,
    });
    await t.mutation(api.newsletter.subscribe, {
      email: "a@example.com",
      consent: true,
    });
    const rows = await t.run((ctx) =>
      ctx.db.query("newsletterSubscriptions").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      email: "a@example.com",
      status: "SUBSCRIBED",
      consentVersion: "2026-10-19",
    });
  });
});
describe("published catalogue pagination", () => {
  it("reaches published records beyond the old 500-record cutoff and filters distance", async () => {
    const t = setup();
    await t.run(async (ctx) => {
      for (let i = 0; i < 505; i++)
        await ctx.db.insert("properties", {
          slug: `p-${i}`,
          title: `Property ${i}`,
          description: "Test",
          type: "DUPLEX",
          price: 1000,
          location: "Test",
          state: "Lagos",
          lga: "Ikeja",
          amenities: [],
          images: [],
          isActive: true,
          isFeatured: false,
          status: "AVAILABLE",
          verificationStatus: "VERIFIED",
          latitude: i === 504 ? 6.5 : 0,
          longitude: i === 504 ? 3.3 : 0,
          createdAt: i,
          updatedAt: i,
        });
    });
    let cursor: string | null = null,
      count = 0;
    for (let i = 0; i < 30; i++) {
      const result: { page: any[]; isDone: boolean; continueCursor: string } =
        await t.query(api.properties.browse, {
          paginationOpts: { numItems: 40, cursor },
        });
      count += result.page.length;
      if (result.isDone) break;
      cursor = result.continueCursor;
    }
    expect(count).toBe(505);
    const near = await t.query(api.properties.browse, {
      paginationOpts: { numItems: 40, cursor: null },
      latitude: 6.5,
      longitude: 3.3,
      radiusKm: 10,
    });
    expect(near.page).toHaveLength(1);
  });
});
