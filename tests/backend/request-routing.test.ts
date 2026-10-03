import { convexTest } from "convex-test";
import { describe, it, expect, vi } from "vitest";
import rateLimiter from "@convex-dev/rate-limiter/test";
import aggregate from "@convex-dev/aggregate/test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { SERVICES, servicesWithFallback } from "../../src/lib/types/services";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  aggregate.register(t, "serviceRequestAggregate");
  return t;
}
async function actor(t: ReturnType<typeof setup>, role: "ADMIN" | "CLIENT") {
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      name: "Verification",
      email: `${role.toLowerCase()}@example.invalid`,
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
  return { id, client: t.withIdentity({ subject: `${id}|${sessionId}` }) };
}
describe("service and enquiry routing", () => {
  it("accepts the exact request payload for every published service and exposes it to the admin", async () => {
    const t = setup();
    await t.mutation(internal.catalog.synchronizeServices, {});
    vi.stubEnv("ADMIN_MFA_REQUIRED", "false");
    try {
      const admin = await actor(t, "ADMIN"),
        customer = await actor(t, "CLIENT");
      for (const service of SERVICES) {
        const result = await customer.client.mutation(
          api.serviceRequests.submitServiceRequest,
          {
            serviceSlug: service.slug,
            requestType: service.requestType as any,
            requesterName: "Test requester",
            requesterEmail: `${service.slug}@example.invalid`,
            requesterPhone: "08000000000",
            projectBrief: "Automated isolated verification only.",
            state: "Lagos",
            lga: "Ikeja",
            timeline: "Within 1 month",
          },
        );
        const record = await admin.client.query(
          api.serviceRequests.getByReference,
          { reference: result.reference },
        );
        expect(record).toMatchObject({
          serviceSlug: service.slug,
          requesterId: customer.id,
          status: "NEW",
        });
        await admin.client.mutation(api.serviceRequests.reviewServiceRequest, {
          id: result.id,
          status: "REVIEWING",
        });
      }
      expect(
        await customer.client.query(api.serviceRequests.getMyRequests, {}),
      ).toHaveLength(13);
      await expect(
        customer.client.query(api.serviceRequests.listRequests, {}),
      ).rejects.toThrow(/ADMIN/);
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("rejects inactive services and invalid contact/location input without creating requests", async () => {
    const t = setup();
    await t.mutation(internal.catalog.synchronizeServices, {});
    const args = {
      serviceSlug: "interior-design",
      requestType: "INTERIOR_DESIGN" as const,
      requesterName: "Test",
      requesterEmail: "qa@example.invalid",
      requesterPhone: "08000000000",
      projectBrief: "Test brief",
    };
    await expect(
      t.mutation(api.serviceRequests.submitServiceRequest, {
        ...args,
        requesterEmail: "invalid",
      }),
    ).rejects.toThrow(/valid email/);
    await expect(
      t.mutation(api.serviceRequests.submitServiceRequest, {
        ...args,
        state: "Lagos",
        lga: "Abaji",
      }),
    ).rejects.toThrow(/LGA/);
    await t.run(async (ctx) => {
      const service = await ctx.db
        .query("services")
        .withIndex("by_slug", (q) => q.eq("slug", args.serviceSlug))
        .unique();
      await ctx.db.patch(service!._id, { isActive: false });
    });
    await expect(
      t.mutation(api.serviceRequests.submitServiceRequest, args),
    ).rejects.toThrow(/unavailable/);
    expect(
      await t.run((ctx) => ctx.db.query("serviceRequests").collect()),
    ).toHaveLength(0);
  });
  it("stores general catalogue enquiries and validated live listing enquiries", async () => {
    const t = setup();
    const now = Date.now();
    const propertyId = await t.run((ctx) =>
      ctx.db.insert("properties", {
        slug: "test-property",
        title: "Test home",
        type: "RESIDENTIAL",
        description: "Test only",
        status: "AVAILABLE",
        price: 1000000,
        location: "10 Test Street, Lagos",
        state: "Lagos",
        bedrooms: 2,
        bathrooms: 2,
        sizeSqm: 100,
        images: [],
        amenities: [],
        isActive: true,
        isFeatured: false,
        verificationStatus: "VERIFIED",
        createdAt: now,
        updatedAt: now,
      }),
    );
    const args = {
      name: "Test",
      email: "qa@example.invalid",
      phone: "08000000000",
      message: "Verification only",
      source: "website",
    };
    const live = await t.mutation(api.enquiries.submitEnquiry, {
      ...args,
      propertyId,
    });
    const general = await t.mutation(api.enquiries.submitEnquiry, {
      ...args,
      email: "general@example.invalid",
    });
    expect(await t.run((ctx) => ctx.db.get(live))).toMatchObject({
      propertyId,
      status: "NEW",
    });
    expect(await t.run((ctx) => ctx.db.get(general))).toMatchObject({
      status: "NEW",
    });
    await t.run((ctx) => ctx.db.patch(propertyId, { isActive: false }));
    await expect(
      t.mutation(api.enquiries.submitEnquiry, { ...args, propertyId }),
    ).rejects.toThrow(/unavailable/);
  });
  it("maps stored hero/gallery data without losing canonical request types and respects an empty catalogue", () => {
    expect(
      servicesWithFallback([
        {
          slug: "interior-design",
          name: "Updated service",
          heroImage: "/new.jpg",
          gallery: ["/new.jpg"],
          isActive: true,
        },
      ])[0],
    ).toMatchObject({
      name: "Updated service",
      image: "/new.jpg",
      requestType: "INTERIOR_DESIGN",
    });
    expect(servicesWithFallback([])).toEqual([]);
    expect(
      servicesWithFallback([{ slug: "interior-design", isActive: false }]),
    ).toEqual([]);
  });
});
