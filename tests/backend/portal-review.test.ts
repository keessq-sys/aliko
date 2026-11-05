import { convexTest } from "convex-test";
import { describe, it, expect, vi, afterEach } from "vitest";
import aggregate from "@convex-dev/aggregate/test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  aggregate.register(t, "managementAggregate");
  rateLimiter.register(t);
  return t;
}
async function actor(
  t: ReturnType<typeof setup>,
  role: "AGENT" | "ADMIN" | "CLIENT" = "AGENT",
) {
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      name: "Portal Test",
      email: crypto.randomUUID() + "@example.invalid",
      role,
      isDiaspora: false,
      kycVerified: false,
      createdAt: Date.now(),
    }),
  );
  const session = await t.run((ctx) =>
    ctx.db.insert("authSessions", {
      userId: id,
      expirationTime: Date.now() + 3600000,
    }),
  );
  return { id, client: t.withIdentity({ subject: `${id}|${session}` }) };
}
const details = () => ({
  slug: crypto.randomUUID(),
  title: "Land for sale",
  description: "A residential plot for review",
  type: "LAND" as const,
  price: 25000000,
  location: "Gwarinpa",
  state: "FCT Abuja",
  images: [],
  amenities: [],
  sizeSqm: 500,
});
async function image(t: ReturnType<typeof setup>, ownerId: any) {
  return t.run(async (ctx) => {
    const key = `property/2026-10-23/${crypto.randomUUID()}.png`;
    await ctx.db.insert("r2Assets", {
      key,
      collection: "property",
      ownerId,
      fileName: "land.png",
      mimeType: "image/png",
      size: 68,
      status: "ACTIVE",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return `/api/media/${key}`;
  });
}
afterEach(() => vi.unstubAllEnvs());
describe("professional and customer listing review", () => {
  for (const role of ["AGENT", "CLIENT"] as const)
    it(`${role} submits a private listing and only admin approval publishes it`, async () => {
      const t = setup(),
        owner = await actor(t, role),
        other = await actor(t),
        admin = await actor(t, "ADMIN");
      const id = await owner.client.mutation(
        api.properties.createProperty,
        details(),
      );
      await expect(
        owner.client.mutation(api.properties.submitForReview, {
          propertyId: id,
        }),
      ).rejects.toThrow(/1 and 7/);
      const url = await image(t, owner.id);
      await owner.client.mutation(api.properties.addPropertyMedia, {
        propertyId: id,
        storageIds: [],
        urls: [url],
      });
      await expect(
        other.client.mutation(api.properties.submitForReview, {
          propertyId: id,
        }),
      ).rejects.toThrow(/own/);
      expect(
        await other.client.query(api.properties.getManageableProperties, {}),
      ).toHaveLength(0);
      await owner.client.mutation(api.properties.submitForReview, {
        propertyId: id,
      });
      expect(await t.query(api.properties.listProperties, {})).toHaveLength(0);
      expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
        verificationStatus: "PENDING",
        isActive: false,
        price: 25000000,
        location: "Gwarinpa",
        sizeSqm: 500,
      });
      expect(
        await t.run((ctx) =>
          ctx.db
            .query("userAlerts")
            .filter((q) => q.eq(q.field("title"), "Listing awaiting approval"))
            .collect(),
        ),
      ).toHaveLength(1);
      await expect(
        owner.client.mutation(api.properties.reviewProperty, {
          propertyId: id,
          approve: true,
          reference: "title-review-proof",
        }),
      ).rejects.toThrow(/ADMIN/);
      await admin.client.mutation(api.properties.reviewProperty, {
        propertyId: id,
        approve: true,
        reference: "title-review-proof",
      });
      expect(
        await t.query(api.properties.listProperties, { type: "LAND" }),
      ).toHaveLength(1);
      const newUrl = await image(t, owner.id);
      await owner.client.mutation(api.properties.addPropertyMedia, {
        propertyId: id,
        storageIds: [],
        urls: [newUrl],
      });
      expect(await t.query(api.properties.listProperties, {})).toHaveLength(0);
      expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
        verificationStatus: "DRAFT",
        isActive: false,
      });
    });
  it("a customer cannot attach another account's media or publish service images", async () => {
    const t = setup(),
      owner = await actor(t, "CLIENT"),
      other = await actor(t);
    const id = await owner.client.mutation(
      api.properties.createProperty,
      details(),
    );
    await expect(
      owner.client.mutation(api.properties.addPropertyMedia, {
        propertyId: id,
        storageIds: [],
        urls: [await image(t, other.id)],
      }),
    ).rejects.toThrow(/another account/);
    vi.stubEnv("MEDIA_MAINTENANCE_SECRET", "test-only-secret");
    await expect(
      owner.client.mutation(api.r2Assets.register, {
        key: `service/2026-10-23/${crypto.randomUUID()}.png`,
        collection: "service",
        fileName: "x.png",
        mimeType: "image/png",
        size: 68,
        secret: "test-only-secret",
      }),
    ).rejects.toThrow(/property or land/);
  });
  it("an existing agent can replace the stored avatar twice", async () => {
    const t = setup(),
      owner = await actor(t);
    const bytes = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFv8AAAAASUVORK5CYII=",
      ),
      (c) => c.charCodeAt(0),
    );
    const sha256 = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    for (let i = 0; i < 2; i++) {
      const args = {
        purpose: "AVATAR_IMAGE" as const,
        fileName: `portrait-${i}.png`,
        mimeType: "image/png",
        size: bytes.length,
        sha256,
      };
      const { intentId } = await owner.client.mutation(
        api.storage.generateUploadUrl,
        args,
      );
      const storageId = await t.run((ctx) =>
        ctx.storage.store(new Blob([bytes], { type: "image/png" })),
      );
      await owner.client.action(api.storage.registerUpload, {
        ...args,
        intentId,
        storageId,
      });
      const profile = await owner.client.query(api.users.getMyProfile, {});
      expect(profile).toMatchObject({ avatarStorageId: storageId });
      expect(profile?.avatarUrl).toBe(
        await t.run((ctx) => ctx.storage.getUrl(storageId)),
      );
      expect(
        await t.run(async (ctx) => (await ctx.storage.get(storageId))?.size),
      ).toBe(bytes.length);
    }
  });
  it("only the assigned agent can update an enquiry", async () => {
    const t = setup(),
      owner = await actor(t),
      other = await actor(t);
    const enquiryId = await t.run((ctx) =>
      ctx.db.insert("enquiries", {
        name: "Private",
        email: "private@example.invalid",
        phone: "08000000000",
        assignedAgentId: owner.id,
        status: "NEW",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    await expect(
      other.client.mutation(api.enquiries.updateEnquiryStatus, {
        enquiryId,
        status: "CONTACTED",
      }),
    ).rejects.toThrow(/assigned agent/);
    await owner.client.mutation(api.enquiries.updateEnquiryStatus, {
      enquiryId,
      status: "CONTACTED",
    });
    expect(await t.run((ctx) => ctx.db.get(enquiryId))).toMatchObject({
      status: "CONTACTED",
    });
  });
  it("owners can edit draft location and price but cannot edit another listing", async () => {
    const t = setup(),
      owner = await actor(t),
      other = await actor(t);
    const values = details(),
      id = await owner.client.mutation(api.properties.createProperty, values);
    const { slug, images, amenities, ...editable } = values;
    await expect(
      other.client.mutation(api.properties.editMyListing, {
        ...editable,
        propertyId: id,
        price: 50000000,
      }),
    ).rejects.toThrow(/own/);
    await owner.client.mutation(api.properties.editMyListing, {
      ...editable,
      propertyId: id,
      price: 50000000,
      location: "Maitama",
    });
    expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
      price: 50000000,
      location: "Maitama",
      isActive: false,
    });
  });
  it("a revoked agent cannot use customer intake to modify old professional listings", async () => {
    const t = setup(),
      owner = await actor(t);
    const values = details(),
      id = await owner.client.mutation(api.properties.createProperty, values);
    await t.run((ctx) => ctx.db.patch(owner.id, { role: "CLIENT" }));
    expect(
      await owner.client.query(api.properties.getManageableProperties, {}),
    ).toEqual([]);
    await expect(
      owner.client.mutation(api.properties.submitForReview, { propertyId: id }),
    ).rejects.toThrow(/own/);
    const { slug, images, amenities, ...editable } = values;
    await expect(
      owner.client.mutation(api.properties.editMyListing, {
        ...editable,
        propertyId: id,
      }),
    ).rejects.toThrow(/own/);
  });
  it("requires physical confirmation and a settled fee before granting agent access", async () => {
    const t = setup(),
      owner = await actor(t, "CLIENT"),
      admin = await actor(t, "ADMIN");
    const applicationId = await t.run((ctx) =>
      ctx.db.insert("agentApplications", {
        reference: "ADK-TEST",
        userId: owner.id,
        fullName: "Applicant",
        email: "applicant@example.invalid",
        phone: "08000000000",
        status: "PENDING",
        registrationFeeNgn: 2000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    const order = await owner.client.mutation(api.checkout.create, {
      kind: "AGENT",
      targetId: applicationId,
    });
    const stored = await owner.client.query(api.checkout.get, {
      reference: order.reference,
    });
    expect(stored?.amount).toBe(2000);
    await expect(
      admin.client.mutation(api.partners.reviewAgentApplication, {
        id: applicationId,
        status: "APPROVED",
      }),
    ).rejects.toThrow(/physical identity/);
    await expect(
      admin.client.mutation(api.partners.reviewAgentApplication, {
        id: applicationId,
        status: "APPROVED",
        manualVerificationReference: "physical-fixture",
      }),
    ).rejects.toThrow(/settled/);
    await t.run(async (ctx) => {
      const paid = (await ctx.db
        .query("checkoutOrders")
        .withIndex("by_reference", (q) => q.eq("reference", order.reference))
        .unique())!;
      await ctx.db.patch(paid._id, { status: "PAID" });
      await ctx.db.insert("checkoutAttempts", {
        orderId: paid._id,
        reference: "fee-fixture",
        amount: 2000,
        currency: "NGN",
        provider: "KORAPAY",
        testMode: false,
        status: "SUCCESS",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    await admin.client.mutation(api.partners.reviewAgentApplication, {
      id: applicationId,
      status: "APPROVED",
      manualVerificationReference: "physical-fixture",
    });
    expect(await owner.client.query(api.users.getMyProfile, {})).toMatchObject({
      role: "AGENT",
    });
    const detail = await admin.client.query(
      api.partners.agentApplicationDetail,
      { id: applicationId },
    );
    expect(detail?.registrationPayment).toBe("PAID");
    expect(detail).not.toHaveProperty("nin");
    await expect(
      owner.client.query(api.partners.agentApplicationDetail, {
        id: applicationId,
      }),
    ).rejects.toThrow(/ADMIN/);
  });
});

describe("review consistency and profile privacy", () => {
  it("does not change a manager plan while money may be in flight", async () => {
    const t = setup(),
      owner = await actor(t, "CLIENT"),
      user = await t.run((ctx) => ctx.db.get(owner.id));
    const managerId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("estateManagers", {
        userId: owner.id,
        companyName: "Fixture",
        contactName: "Applicant",
        email: user!.email,
        phone: "08000000000",
        statesOfOperation: ["Lagos"],
        plan: "STARTER",
        status: "PENDING",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("checkoutOrders", {
        ownerId: owner.id,
        reference: "pending-manager",
        kind: "MANAGER",
        targetId: String(id),
        title: "STARTER — Fixture",
        amount: 75000,
        currency: "NGN",
        status: "PENDING",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    });
    await expect(
      owner.client.mutation(api.subscriptions.selectPlan, {
        managerId,
        plan: "PROFESSIONAL",
      }),
    ).rejects.toThrow(/pending payment/);
    expect(await t.run((ctx) => ctx.db.get(managerId))).toMatchObject({
      plan: "STARTER",
    });
  });
  it("resumes manager enrolment across tabs without another plan charge", async () => {
    const t = setup(),
      owner = await actor(t, "CLIENT"),
      user = await t.run((ctx) => ctx.db.get(owner.id));
    await t.run((ctx) =>
      ctx.db.insert("identities", {
        userId: owner.id,
        ninCipher: "fixture",
        fingerprint: crypto.randomUUID(),
        lastFour: "0000",
        status: "PENDING",
        consentVersion: "2026-10-03",
        consentedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    const args = {
      companyName: "Fixture Estates",
      contactName: "Applicant",
      email: user!.email,
      phone: "08000000000",
      operatingState: "Lagos",
      operatingLga: "Ikeja",
      statesOfOperation: ["Lagos"],
      plan: "STARTER" as const,
    };
    const first = await owner.client.mutation(
      api.partners.submitManagerApplication,
      { ...args, submissionKey: "manager-tab-one-001" },
    );
    expect(
      await owner.client.mutation(api.partners.submitManagerApplication, {
        ...args,
        submissionKey: "manager-tab-two-002",
      }),
    ).toEqual(first);
    await expect(
      owner.client.mutation(api.partners.submitManagerApplication, {
        ...args,
        plan: "PROFESSIONAL",
        submissionKey: "manager-tab-three-003",
      }),
    ).rejects.toThrow(/different plan/);
    expect(
      await t.run((ctx) => ctx.db.query("estateManagers").collect()),
    ).toHaveLength(1);
  });
  it("resumes an agent application across distinct browser submission keys", async () => {
    const t = setup(),
      owner = await actor(t, "CLIENT");
    const user = await t.run((ctx) => ctx.db.get(owner.id));
    await t.run((ctx) =>
      ctx.db.insert("identities", {
        userId: owner.id,
        ninCipher: "fixture-encrypted",
        fingerprint: crypto.randomUUID(),
        lastFour: "0000",
        status: "PENDING",
        consentVersion: "2026-10-03",
        consentedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    const data = {
      fullName: "Applicant",
      email: user!.email.toUpperCase(),
      phone: "08000000000",
      operatingState: "Lagos",
      operatingLga: "Ikeja",
    };
    const first = await owner.client.mutation(
      api.partners.submitAgentApplication,
      { ...data, submissionKey: "browser-one-request-001" },
    );
    const second = await owner.client.mutation(
      api.partners.submitAgentApplication,
      { ...data, submissionKey: "browser-two-request-002" },
    );
    expect(second).toEqual(first);
    expect(
      await owner.client.query(api.partners.myEnrolments, {}),
    ).toMatchObject({ agents: [{ _id: first.id }] });
    expect(
      await t.run((ctx) => ctx.db.query("agentApplications").collect()),
    ).toHaveLength(1);
  });
  it("reviewing an old rejected application cannot revoke a separately approved agent", async () => {
    const t = setup(),
      owner = await actor(t),
      admin = await actor(t, "ADMIN"),
      user = await t.run((ctx) => ctx.db.get(owner.id));
    const old = await t.run(async (ctx) => {
      const fields = {
        userId: owner.id,
        fullName: "Applicant",
        email: user!.email,
        phone: "08000000000",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await ctx.db.insert("agentApplications", {
        ...fields,
        reference: "CURRENT",
        status: "APPROVED",
        manualVerificationReference: "physical-verified",
      });
      return ctx.db.insert("agentApplications", {
        ...fields,
        reference: "OLD",
        status: "PENDING",
      });
    });
    await admin.client.mutation(api.partners.reviewAgentApplication, {
      id: old,
      status: "REJECTED",
    });
    expect(await owner.client.query(api.users.getMyProfile, {})).toMatchObject({
      role: "AGENT",
    });
  });
  it("never returns temporary encrypted identity envelopes in browser profiles", async () => {
    const t = setup(),
      owner = await actor(t, "CLIENT");
    await t.run((ctx) =>
      ctx.db.patch(owner.id, {
        registrationNinCipher: "private-envelope",
        registrationNinHash: "private-hash",
        registrationNinLastFour: "0000",
      }),
    );
    const profile = await owner.client.query(api.users.getMyProfile, {});
    expect(profile).not.toHaveProperty("registrationNinCipher");
    expect(profile).not.toHaveProperty("registrationNinHash");
    expect(profile).not.toHaveProperty("registrationNinLastFour");
  });
  it("declining a manager application preserves an existing agent role", async () => {
    const t = setup(),
      owner = await actor(t),
      admin = await actor(t, "ADMIN"),
      user = await t.run((ctx) => ctx.db.get(owner.id));
    const id = await t.run((ctx) =>
      ctx.db.insert("estateManagers", {
        userId: owner.id,
        companyName: "Fixture",
        contactName: "Applicant",
        email: user!.email,
        phone: "08000000000",
        statesOfOperation: ["Lagos"],
        plan: "STARTER",
        status: "PENDING",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    await admin.client.mutation(api.partners.reviewManagerApplication, {
      id,
      status: "SUSPENDED",
    });
    expect(await owner.client.query(api.users.getMyProfile, {})).toMatchObject({
      role: "AGENT",
    });
  });
});
