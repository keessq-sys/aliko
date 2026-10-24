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
      expect(
        await owner.client.query(api.users.getMyProfile, {}),
      ).toMatchObject({ avatarStorageId: storageId });
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
});
