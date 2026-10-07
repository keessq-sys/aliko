import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { assertCheckoutEnvironment } from "../../convex/lib/checkoutReadiness";
import { publicSignupProfile } from "../../convex/lib/access";
import { createHash, createHmac } from "node:crypto";
const modules = import.meta.glob("../../convex/**/*.ts");
async function fixture() {
  const t = convexTest(schema, modules),
    now = Date.now();
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      name: "Manager",
      email: "manager@example.invalid",
      role: "ESTATE_MANAGER",
      isDiaspora: false,
      kycVerified: true,
      operatingState: "Lagos",
      operatingLga: "Ikeja",
      whatsapp: "+2348000000000",
      createdAt: now,
    });
    const session = await ctx.db.insert("authSessions", {
      userId,
      expirationTime: now + 3600000,
    });
    await ctx.db.insert("identities", {
      userId,
      ninCipher: "test",
      fingerprint: "test",
      lastFour: "0000",
      status: "VERIFIED",
      consentVersion: "test",
      consentedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const managerId = await ctx.db.insert("estateManagers", {
      userId,
      companyName: "Test",
      contactName: "Manager",
      email: "manager@example.invalid",
      phone: "08000000000",
      statesOfOperation: ["Lagos"],
      plan: "STARTER",
      status: "APPROVED",
      paidThrough: now + 86400000,
      createdAt: now,
      updatedAt: now,
    });
    const orderId = await ctx.db.insert("checkoutOrders", {
      reference: "ADK-ORDER-TEST",
      ownerId: userId,
      kind: "MANAGER",
      targetId: managerId,
      title: "Starter",
      amount: 25000,
      currency: "NGN",
      status: "PAID",
      createdAt: now,
      updatedAt: now,
    });
    const attemptId = await ctx.db.insert("checkoutAttempts", {
      orderId,
      reference: "ADK-ORDER-TEST-KPY",
      amount: 25000,
      currency: "NGN",
      provider: "KORAPAY",
      providerId: "KORAPAY:test",
      testMode: false,
      status: "SUCCESS",
      createdAt: now,
      updatedAt: now,
    });
    const subscriptionId = await ctx.db.insert("managerSubscriptions", {
      ownerId: userId,
      managerId,
      orderId,
      plan: "STARTER",
      amount: 25000,
      startsAt: now - 1000,
      endsAt: now + 86400000,
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });
    return { userId, session, managerId, orderId, attemptId, subscriptionId };
  });
  return {
    t,
    ids,
    client: t.withIdentity({ subject: `${ids.userId}|${ids.session}` }),
  };
}
describe("paid manager access and listing media", () => {
  it("verifies email ownership using an expiring single-use link without granting a role", async () => {
    const { t, ids } = await fixture(),
      token = "a".repeat(64);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await t.run((ctx) =>
      ctx.db.insert("accountVerifications", {
        userId: ids.userId,
        email: "manager@example.invalid",
        tokenHash,
        expiresAt: Date.now() + 60000,
        createdAt: Date.now(),
      }),
    );
    await expect(
      t.mutation(api.emailVerification.confirm, { token: "b".repeat(64) }),
    ).rejects.toThrow(/invalid/i);
    await t.mutation(api.emailVerification.confirm, { token });
    expect(await t.run((ctx) => ctx.db.get(ids.userId))).toMatchObject({
      role: "ESTATE_MANAGER",
      emailVerificationTime: expect.any(Number),
    });
    await expect(
      t.mutation(api.emailVerification.confirm, { token }),
    ).rejects.toThrow(/expired/i);
  });
  it("authenticates Korapay signatures against the data object and rejects invalid JSON", async () => {
    const { t } = await fixture();
    vi.stubEnv("KORAPAY_SECRET_KEY", "sk_test_fixture");
    try {
      const data = { reference: "unknown-test", status: "success" },
        body = JSON.stringify({ event: "charge.success", data });
      const bad = await t.fetch("/webhooks/korapay", {
        method: "POST",
        headers: { "x-korapay-signature": "forged" },
        body,
      });
      expect(bad.status).toBe(401);
      const invalid = await t.fetch("/webhooks/korapay", {
        method: "POST",
        body: "not-json",
      });
      expect(invalid.status).toBe(400);
      const signature = createHmac("sha256", "sk_test_fixture")
        .update(JSON.stringify(data))
        .digest("hex");
      const signed = await t.fetch("/webhooks/korapay", {
        method: "POST",
        headers: { "x-korapay-signature": signature },
        body,
      });
      expect(signed.status).toBe(400); // Valid signature still cannot settle an unknown order.
      expect(
        await t.run((ctx) => ctx.db.query("webhookEvents").first()),
      ).toMatchObject({ provider: "KORAPAY", status: "FAILED" });
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("rejects expired dates, stale roles, unpaid orders, sandbox settlement and wrong payment owners", async () => {
    const { t, ids, client } = await fixture();
    expect(
      (await client.query(api.subscriptions.mine, {})).access.allowed,
    ).toBe(true);
    for (const status of ["FAILED", "PENDING", "REFUNDED"] as const) {
      await t.run((ctx) => ctx.db.patch(ids.attemptId, { status }));
      expect(
        (await client.query(api.subscriptions.mine, {})).access.allowed,
      ).toBe(false);
    }
    await t.run((ctx) =>
      ctx.db.patch(ids.attemptId, { status: "SUCCESS", testMode: true }),
    );
    expect(
      (await client.query(api.subscriptions.mine, {})).access.allowed,
    ).toBe(false);
    await t.run((ctx) => ctx.db.patch(ids.attemptId, { testMode: false }));
    await t.run((ctx) => ctx.db.patch(ids.orderId, { status: "DRAFT" }));
    expect(
      (await client.query(api.subscriptions.mine, {})).access.allowed,
    ).toBe(false);
    await t.run((ctx) => ctx.db.patch(ids.orderId, { status: "PAID" }));
    await t.run(async (ctx) => {
      const other = await ctx.db.insert("users", {
        name: "Other",
        email: "other@example.invalid",
        role: "CLIENT",
        isDiaspora: false,
        kycVerified: false,
        createdAt: Date.now(),
      });
      await ctx.db.patch(ids.orderId, { ownerId: other });
    });
    expect(
      (await client.query(api.subscriptions.mine, {})).access.allowed,
    ).toBe(false);
    await t.run((ctx) => ctx.db.patch(ids.orderId, { ownerId: ids.userId }));
    await t.run((ctx) =>
      ctx.db.patch(ids.subscriptionId, { endsAt: Date.now() - 1 }),
    );
    expect(
      (await client.query(api.subscriptions.mine, {})).access.allowed,
    ).toBe(false);
    await t.mutation(internal.subscriptions.expire, {});
    expect(await t.run((ctx) => ctx.db.get(ids.subscriptionId))).toMatchObject({
      status: "EXPIRED",
    });
    await t.run((ctx) => ctx.db.patch(ids.userId, { role: "CLIENT" }));
    await expect(
      client.query(api.properties.getManageableProperties, {}),
    ).rejects.toThrow(/Forbidden/);
  });
  it("keeps paid time after cancellation and denies new operations with incomplete profiles", async () => {
    const { t, ids, client } = await fixture();
    await client.mutation(api.subscriptions.cancel, {});
    expect(
      (await client.query(api.subscriptions.mine, {})).access.allowed,
    ).toBe(true);
    await t.run((ctx) => ctx.db.patch(ids.userId, { whatsapp: undefined }));
    await expect(
      client.query(api.properties.getManageableProperties, {}),
    ).rejects.toThrow(/Complete/);
    await expect(
      client.mutation(api.subscriptions.revoke, {
        id: ids.subscriptionId,
        reason: "Unauthorized attempt",
      }),
    ).rejects.toThrow(/ADMIN/);
  });
  it("enforces the combined seven-image limit and rejects images registered for another category", async () => {
    const { t, ids, client } = await fixture();
    const propertyId = await t.run((ctx) =>
      ctx.db.insert("properties", {
        slug: "test",
        title: "Test",
        type: "LAND",
        description: "Test",
        price: 1000,
        location: "Lagos",
        state: "Lagos",
        amenities: [],
        images: [],
        managerId: ids.userId,
        isFeatured: false,
        isActive: false,
        verificationStatus: "DRAFT",
        status: "AVAILABLE",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    const urls = await t.run(async (ctx) => {
      const urls = [];
      for (let i = 0; i < 8; i++) {
        const key = `property/test-${i}.webp`;
        await ctx.db.insert("r2Assets", {
          key,
          collection: "property",
          fileName: "test.webp",
          mimeType: "image/webp",
          size: 10,
          ownerId: ids.userId,
          status: "ACTIVE",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        urls.push(`/api/media/${key}`);
      }
      return urls;
    });
    await expect(
      client.mutation(api.properties.addPropertyMedia, {
        propertyId,
        storageIds: [],
        urls,
      }),
    ).rejects.toThrow(/1 and 7/);
    await t.run(async (ctx) => {
      const asset = await ctx.db.query("r2Assets").withIndex("by_key", (q) => q.eq("key", "property/test-0.webp")).unique();
      await ctx.db.patch(asset!._id, { collection: "service" });
    });
    await expect(client.mutation(api.properties.addPropertyMedia, { propertyId, storageIds: [], urls: urls.slice(0, 1) })).rejects.toThrow();
    await t.run(async (ctx) => {
      const asset = await ctx.db.query("r2Assets").withIndex("by_key", (q) => q.eq("key", "property/test-0.webp")).unique();
      await ctx.db.patch(asset!._id, { collection: "property" });
    });
    await client.mutation(api.properties.addPropertyMedia, {
      propertyId,
      storageIds: [],
      urls: urls.slice(0, 7),
    });
    await expect(
      client.mutation(api.properties.addPropertyMedia, {
        propertyId,
        storageIds: [],
        urls: urls.slice(7),
      }),
    ).rejects.toThrow(/1 and 7/);
    expect(await t.run((ctx) => ctx.db.get(propertyId))).toMatchObject({
      images: urls.slice(0, 7),
    });
  });
  it("never enables production access using test Korapay credentials", () => {
    vi.stubEnv("DEPLOYMENT_ENVIRONMENT", "production");
    vi.stubEnv("LIVE_TRANSACTIONS_ENABLED", "true");
    vi.stubEnv("LIVE_TRANSACTION_APPROVAL_REFERENCE", "approved-reference");
    try {
      expect(() =>
        assertCheckoutEnvironment("KORAPAY", "sk_test_fixture"),
      ).toThrow(/unavailable/);
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("requires state, LGA and WhatsApp for public signup and cannot self-grant ADMIN", () => {
    const params = {
      flow: "signUp",
      email: "buyer@example.invalid",
      name: "Buyer",
      role: "ADMIN",
      acceptPolicies: true,
      policyVersion: "2026-10-03",
      operatingState: "Lagos",
      operatingLga: "Ikeja",
      whatsapp: "+2348000000000",
    };
    expect(publicSignupProfile(params).role).toBe("CLIENT");
    expect(() => publicSignupProfile({ ...params, whatsapp: "" })).toThrow(
      /WhatsApp/,
    );
    expect(() => publicSignupProfile({ ...params, operatingLga: "" })).toThrow(
      /LGA/,
    );
  });
});
