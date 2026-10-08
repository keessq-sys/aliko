import { convexTest } from "convex-test";
import { describe, it, expect, vi, afterEach } from "vitest";
import rateLimiter from "@convex-dev/rate-limiter/test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { bookingBalance } from "../../convex/lib/bookingBalance";
import {
  NIGERIAN_STATES,
  nigeriaLgas,
  assertNigeriaLocation,
} from "../../convex/lib/nigeriaLocations";
const modules = import.meta.glob("../../convex/**/*.ts");
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}
async function user(t: ReturnType<typeof setup>, verified = true) {
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      name: "Test customer",
      email: `${crypto.randomUUID()}@example.com`,
      role: "CLIENT",
      isDiaspora: false,
      kycVerified: verified,
      address: "10 Test Street, Lagos, Nigeria",
      createdAt: Date.now(),
    }),
  );
  if (verified)
    await t.run((ctx) =>
      ctx.db.insert("identities", {
        userId: id,
        ninCipher: "fixture",
        fingerprint: String(id),
        lastFour: "8901",
        status: "VERIFIED",
        consentVersion: "2026-10-03",
        consentedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
  const sessionId = await t.run((ctx) =>
    ctx.db.insert("authSessions", {
      userId: id,
      expirationTime: Date.now() + 3600000,
    }),
  );
  return { id, session: t.withIdentity({ subject: `${id}|${sessionId}` }) };
}
async function property(t: ReturnType<typeof setup>) {
  return t.run((ctx) =>
    ctx.db.insert("properties", {
      slug: crypto.randomUUID(),
      title: "Verified Lagos duplex",
      type: "DUPLEX",
      description: "Test",
      price: 10000,
      location: "Ikeja",
      state: "Lagos",
      lga: "Ikeja",
      amenities: [],
      images: [],
      status: "AVAILABLE",
      isActive: true,
      isFeatured: false,
      verificationStatus: "VERIFIED",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );
}
describe("Nigeria location catalogue", () => {
  it("contains 36 states, Abuja FCT and 774 matching LGAs", () => {
    expect(NIGERIAN_STATES).toHaveLength(37);
    expect(NIGERIAN_STATES.reduce((n, s) => n + nigeriaLgas(s).length, 0)).toBe(
      774,
    );
    expect(nigeriaLgas("FCT")).toHaveLength(6);
    expect(nigeriaLgas("Lagos")).toContain("Ikeja");
    expect(() => assertNigeriaLocation("Kano", "Ikeja")).toThrow(/belonging/);
    expect(() => assertNigeriaLocation("Unknown")).toThrow(/valid/);
  });
});
describe("dynamic checkout", () => {
  it("calculates only the remaining contracted land balance and rejects settled orders", () => {
    expect(
      bookingBalance({
        paymentStatus: "PENDING",
        totalAmount: 100000,
        paidAmount: 0,
      }),
    ).toBe(100000);
    expect(
      bookingBalance({
        paymentStatus: "PARTIAL",
        totalAmount: 100000,
        paidAmount: 35000,
      }),
    ).toBe(65000);
    expect(() =>
      bookingBalance({
        paymentStatus: "SUCCESS",
        totalAmount: 100000,
        paidAmount: 100000,
      }),
    ).toThrow(/no payable/);
  });
  it("initializes hosted checkout with the server price and verifies a provider callback", async () => {
    const t = setup(),
      buyer = await user(t),
      id = await property(t);
    const order = await buyer.session.mutation(api.checkout.create, {
      kind: "PROPERTY",
      targetId: id,
    });
    await t.run((ctx) => ctx.db.patch(id, { price: 12000 }));
    vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "FLWSECK_TEST_FIXTURE");
    vi.stubEnv("DEPLOYMENT_ENVIRONMENT", "staging");
    const provider = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "success",
          data: { link: "https://checkout.flutterwave.com/test" },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", provider);
    expect(
      await buyer.session.action(api.checkout.initialize, {
        ...order,
        expectedAmount: 12000,
      }),
    ).toEqual({ checkoutUrl: "https://checkout.flutterwave.com/test" });
    const request = JSON.parse(provider.mock.calls[0][1].body);
    expect(request.amount).toBe(12000);
    expect(request.currency).toBe("NGN");
    provider.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "success",
          data: {
            id: 1234,
            tx_ref: "WRONG",
            amount: 12000,
            currency: "NGN",
            status: "successful",
          },
        }),
        { status: 200 },
      ),
    );
    await expect(
      buyer.session.action(api.checkout.verifyPayment, {
        reference: request.tx_ref,
        transactionId: "1234",
      }),
    ).rejects.toThrow(/verification failed/);
    provider.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "success",
          data: {
            id: 1234,
            tx_ref: request.tx_ref,
            amount: 12000,
            currency: "NGN",
            status: "successful",
          },
        }),
        { status: 200 },
      ),
    );
    expect(
      (
        await buyer.session.action(api.checkout.verifyPayment, {
          reference: request.tx_ref,
          transactionId: "1234",
        })
      ).newlyConfirmed,
    ).toBe(true);
    expect((await buyer.session.query(api.checkout.get, order))?.status).toBe(
      "PAID",
    );
  });
  it("refreshes a draft price and rejects a stale browser amount", async () => {
    const t = setup(),
      buyer = await user(t),
      id = await property(t);
    const order = await buyer.session.mutation(api.checkout.create, {
      kind: "PROPERTY",
      targetId: id,
    });
    await t.run((ctx) => ctx.db.patch(id, { price: 20000 }));
    expect((await buyer.session.query(api.checkout.get, order))?.amount).toBe(
      20000,
    );
    await expect(
      buyer.session.mutation(internal.checkout.prepare, {
        ...order,
        expectedAmount: 10000,
      }),
    ).rejects.toThrow(/price changed/);
    expect((await buyer.session.query(api.checkout.get, order))?.status).toBe(
      "DRAFT",
    );
  });
  it("locks the approved amount, prevents a second buyer and settles a duplicate once", async () => {
    const t = setup(),
      buyer = await user(t),
      other = await user(t),
      id = await property(t);
    const order = await buyer.session.mutation(api.checkout.create, {
      kind: "PROPERTY",
      targetId: id,
    });
    const prepared = await buyer.session.mutation(internal.checkout.prepare, {
      ...order,
      expectedAmount: 10000,
    });
    await t.run((ctx) => ctx.db.patch(id, { price: 30000 }));
    expect((await buyer.session.query(api.checkout.get, order))?.amount).toBe(
      10000,
    );
    await expect(
      other.session.mutation(api.checkout.create, {
        kind: "PROPERTY",
        targetId: id,
      }),
    ).rejects.toThrow(/pending/);
    const settlement = {
      reference: prepared.reference,
      providerId: "12345",
      amount: 10000,
      currency: "NGN",
    };
    await expect(
      t.mutation(internal.checkout.settle, { ...settlement, amount: 1 }),
    ).rejects.toThrow(/mismatch/);
    await expect(
      t.mutation(internal.checkout.settle, { ...settlement, currency: "USD" }),
    ).rejects.toThrow(/mismatch/);
    expect(
      (await t.mutation(internal.checkout.settle, settlement)).newlyConfirmed,
    ).toBe(true);
    expect(
      (await t.mutation(internal.checkout.settle, settlement)).newlyConfirmed,
    ).toBe(false);
    expect((await t.run((ctx) => ctx.db.get(id)))?.status).toBe("RESERVED");
    expect(
      await t.run((ctx) => ctx.db.query("notificationLog").collect()),
    ).toHaveLength(1);
  });
  it("denies another account access and unverified identity payment", async () => {
    const t = setup(),
      buyer = await user(t, false),
      other = await user(t),
      id = await property(t);
    const order = await buyer.session.mutation(api.checkout.create, {
      kind: "PROPERTY",
      targetId: id,
    });
    expect(await other.session.query(api.checkout.get, order)).toBeNull();
    await expect(
      buyer.session.mutation(internal.checkout.prepare, {
        ...order,
        expectedAmount: 10000,
      }),
    ).rejects.toThrow(/11-digit NIN/);
  });
  it("uses the approved service quote and denies non-owners", async () => {
    const t = setup(),
      buyer = await user(t),
      other = await user(t);
    const id = await t.run(async (ctx) => {
      const service = await ctx.db.insert("services", {
        slug: "design",
        name: "Design",
        tagline: "Test",
        description: "Test",
        category: "INTERIOR",
        features: [],
        isActive: true,
        isFeatured: false,
        sortOrder: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return ctx.db.insert("serviceRequests", {
        reference: "TEST-QUOTE",
        serviceId: service,
        serviceSlug: "design",
        requesterId: buyer.id,
        requesterName: "Customer",
        requesterEmail: "buyer@example.com",
        requesterPhone: "+2348000000000",
        requestType: "INTERIOR_DESIGN",
        projectBrief: "Test",
        status: "QUOTED",
        quoteAmount: 75000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    await expect(
      other.session.mutation(api.checkout.create, {
        kind: "SERVICE",
        targetId: id,
      }),
    ).rejects.toThrow(/belong/);
    const order = await buyer.session.mutation(api.checkout.create, {
      kind: "SERVICE",
      targetId: id,
    });
    expect((await buyer.session.query(api.checkout.get, order))?.amount).toBe(
      75000,
    );
    await t.run((ctx) => ctx.db.patch(id, { quoteAmount: 90000 }));
    expect((await buyer.session.query(api.checkout.get, order))?.amount).toBe(
      90000,
    );
  });
  it("uses the manager fee override without approving the account", async () => {
    const t = setup(),
      buyer = await user(t);
    const id = await t.run((ctx) =>
      ctx.db.insert("estateManagers", {
        userId: buyer.id,
        companyName: "Test Estate",
        contactName: "Owner",
        email: "owner@example.com",
        phone: "+2348000000000",
        statesOfOperation: ["Lagos"],
        operatingState: "Lagos",
        operatingLga: "Ikeja",
        plan: "STARTER",
        monthlyFeeNgn: 32000,
        status: "PENDING",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    const order = await buyer.session.mutation(api.checkout.create, {
      kind: "MANAGER",
      targetId: id,
    });
    const prepared = await buyer.session.mutation(internal.checkout.prepare, {
      ...order,
      expectedAmount: 32000,
    });
    await t.mutation(internal.checkout.settle, {
      reference: prepared.reference,
      providerId: "manager-payment",
      amount: 32000,
      currency: "NGN",
    });
    expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
      status: "PENDING",
      monthlyFeeNgn: 32000,
    });
    await expect(
      buyer.session.mutation(api.checkout.create, {
        kind: "MANAGER",
        targetId: id,
      }),
    ).rejects.toThrow(/already paid/);
  });
});
