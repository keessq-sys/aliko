import { convexTest } from "convex-test";
import { describe, it, expect, vi } from "vitest";
import { base32, totp } from "../../convex/lib/totp";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { publicSignupProfile } from "../../convex/lib/access";
import rateLimiter from "@convex-dev/rate-limiter/test";
import aggregate from "@convex-dev/aggregate/test";
import { validateRestoreTarget } from "../../scripts/lib/restore-target.mjs";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  aggregate.register(t, "bookingAggregate");
  aggregate.register(t, "managementAggregate");
  aggregate.register(t, "estateAggregate");
  return t;
}

async function paidBooking(t: ReturnType<typeof setup>) {
  const client = await user(t);
  return t.run(async (ctx) => {
    const now = Date.now();
    await ctx.db.patch(client.id, {
      kycVerified: true,
      address: "10 Test Street, Abuja, Nigeria",
    });
    const projectId = await ctx.db.insert("projects", {
      name: "Test Estate",
      slug: "test-estate",
      location: "Abuja",
      lga: "AMAC",
      state: "FCT",
      description: "Test estate",
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
      beaconNumber: "TEST-01",
      plotNumber: "1",
      sizeSqm: 500,
      price: 100000,
      status: "RESERVED",
      titleType: "C_OF_O",
      titleVerified: true,
      isCornerPlot: false,
      isPrimeLocation: false,
      isFeatured: false,
      createdAt: now,
      updatedAt: now,
    });
    const bookingId = await ctx.db.insert("bookings", {
      clientId: client.id,
      plotId,
      reference: "TEST-BOOKING",
      paymentStatus: "SUCCESS",
      totalAmount: 100000,
      paidAmount: 100000,
      createdAt: now,
      updatedAt: now,
    });
    const documentId = await ctx.db.insert("legalDocuments", {
      type: "DEED_OF_ASSIGNMENT",
      referenceCode: "TEST-DEED",
      status: "DRAFT",
      clientId: client.id,
      plotId,
      bookingId,
      externalSignatureId: "test-provider-request",
      createdAt: now,
      updatedAt: now,
    });
    const paymentId = await ctx.db.insert("payments", {
      bookingId,
      provider: "FLUTTERWAVE",
      reference: "TEST-PAYMENT",
      providerReference: "test-provider-payment",
      amount: 100000,
      currency: "NGN",
      status: "SUCCESS",
      createdAt: now,
    });
    return { bookingId, plotId, documentId, paymentId, clientId: client.id };
  });
}

describe("payment and allocation integrity", () => {
  it("allocates only a signed, fully paid deed and does so once", async () => {
    const t = setup(),
      fixture = await paidBooking(t);
    const args = {
      bookingId: fixture.bookingId,
      documentId: fixture.documentId,
    };
    await expect(
      t.mutation(internal.fulfillment.allocateSignedBooking, args),
    ).rejects.toThrow("provider-signed");
    await t.run((ctx) =>
      ctx.db.patch(fixture.documentId, { status: "SIGNED" }),
    );
    await t.mutation(internal.fulfillment.allocateSignedBooking, args);
    await t.mutation(internal.fulfillment.allocateSignedBooking, args);
    expect((await t.run((ctx) => ctx.db.get(fixture.plotId)))?.status).toBe(
      "SOLD",
    );
    expect(
      await t.run((ctx) => ctx.db.query("notificationLog").collect()),
    ).toHaveLength(1);
  });
  it("does not allocate after a refund removes full payment", async () => {
    const t = setup(),
      fixture = await paidBooking(t);
    await t.run(async (ctx) => {
      await ctx.db.patch(fixture.documentId, { status: "SIGNED" });
      await ctx.db.patch(fixture.bookingId, {
        paidAmount: 90000,
        paymentStatus: "PARTIAL",
      });
    });
    await expect(
      t.mutation(internal.fulfillment.allocateSignedBooking, {
        bookingId: fixture.bookingId,
        documentId: fixture.documentId,
      }),
    ).rejects.toThrow("Verified payment");
  });
  it("applies a confirmed refund to the booking only once", async () => {
    const t = setup(),
      fixture = await paidBooking(t);
    const admin = await user(t, "ADMIN");
    const refundId = await t.run((ctx) =>
      ctx.db.insert("paymentRefunds", {
        paymentId: fixture.paymentId,
        bookingId: fixture.bookingId,
        provider: "FLUTTERWAVE",
        amount: 10000,
        reason: "Test refund",
        status: "PENDING",
        initiatedBy: admin.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    const args = {
      refundId,
      providerRefundId: "test-provider-refund",
      status: "COMPLETED" as const,
    };
    await t.mutation(internal.paymentOperations.finishRefund, args);
    await t.mutation(internal.paymentOperations.finishRefund, args);
    expect(
      (await t.run((ctx) => ctx.db.get(fixture.bookingId)))?.paidAmount,
    ).toBe(90000);
  });
});
async function user(
  t: ReturnType<typeof setup>,
  role: "CLIENT" | "ADMIN" | "AGENT" = "CLIENT",
) {
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      name: "Test User",
      email: `${role}@example.com`,
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
  return { id, session: t.withIdentity({ subject: `${id}|${sessionId}` }) };
}
describe("production authorization", () => {
  it("ignores all public privileged role requests", () => {
    for (const role of ["ADMIN", "AGENT", "ESTATE_MANAGER"])
      expect(
        publicSignupProfile({ name: "Test", email: "test@example.com", role })
          .role,
      ).toBe("CLIENT");
  });
  it("denies anonymous administrative records", async () => {
    const t = setup();
    for (const query of [
      api.partners.listAgentApplications,
      api.partners.listManagers,
      api.notifications.getRecentNotifications,
    ])
      await expect(t.query(query, {})).rejects.toThrow("Unauthorized");
  });
  it("denies a customer the administrator queries", async () => {
    const t = setup();
    const { session } = await user(t);
    await expect(session.query(api.partners.listManagers, {})).rejects.toThrow(
      "Forbidden",
    );
  });
  it("approval provisions the linked agent account", async () => {
    const t = setup();
    const applicant = await user(t);
    const admin = await user(t, "ADMIN");
    const result = await applicant.session.mutation(
      api.partners.submitAgentApplication,
      {
        fullName: "Test User",
        email: "CLIENT@example.com",
        phone: "08012345678",
      },
    );
    await admin.session.mutation(api.partners.reviewAgentApplication, {
      id: result.id,
      status: "APPROVED",
    });
    const publicAgents = await t.query(api.partners.listApprovedAgents, {});
    expect(publicAgents).toHaveLength(1);
    expect(publicAgents[0]).not.toHaveProperty("phone");
    expect(publicAgents[0]).not.toHaveProperty("email");
    expect((await t.run((ctx) => ctx.db.get(applicant.id)))?.role).toBe(
      "AGENT",
    );
  });
  it("keeps a newly created listing out of the public catalogue", async () => {
    const t = setup();
    const { session } = await user(t, "AGENT");
    const id = await session.mutation(api.properties.createProperty, {
      slug: "test-property",
      title: "Test Property",
      type: "RESIDENTIAL",
      description: "Test description",
      price: 100000,
      location: "Abuja",
      state: "FCT",
      amenities: [],
      images: [],
    });
    expect(await t.query(api.properties.listProperties, {})).toEqual([]);
    expect((await t.run((ctx) => ctx.db.get(id)))?.verificationStatus).toBe(
      "DRAFT",
    );
  });
  it("does not replace the canonical services on repeat synchronization", async () => {
    const t = setup();
    await t.mutation(internal.catalog.synchronizeServices, {});
    const first = await t.query(api.services.listServices, {});
    expect(first).toHaveLength(13);
    expect(await t.mutation(internal.catalog.synchronizeServices, {})).toEqual({
      inserted: 0,
    });
  });
  it("isolates operational records between accounts", async () => {
    const t = setup();
    const a = await user(t, "AGENT");
    const b = await user(t, "AGENT");
    const id = await a.session.mutation(api.management.saveRecord, {
      kind: "REFERRAL",
      title: "Private referral",
      detail: "Private account record",
      status: "OPEN",
    });
    expect(
      await b.session.query(api.management.listRecords, { kind: "REFERRAL" }),
    ).toEqual([]);
    await expect(
      b.session.mutation(api.management.saveRecord, {
        id,
        kind: "REFERRAL",
        title: "Changed referral",
        detail: "Attempt",
        status: "COMPLETED",
      }),
    ).rejects.toThrow("Record not found");
  });
  it("does not publicly resolve another client legal document", async () => {
    const t = setup();
    const a = await user(t);
    const b = await user(t);
    await t.run((ctx) =>
      ctx.db.insert("legalDocuments", {
        type: "DEED_OF_ASSIGNMENT",
        referenceCode: "TEST-PRIVATE-DEED",
        status: "DRAFT",
        clientId: a.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    expect(
      await b.session.query(api.legalDocuments.getDocumentByReference, {
        referenceCode: "TEST-PRIVATE-DEED",
      }),
    ).toBeNull();
    await expect(
      t.query(api.legalDocuments.getDocumentByReference, {
        referenceCode: "TEST-PRIVATE-DEED",
      }),
    ).rejects.toThrow("Unauthorized");
  });
});

describe("queued notification delivery", () => {
  it("leases queued work once and preserves failed deliveries for retry", async () => {
    const t = setup();
    const id = await t.run((ctx) =>
      ctx.db.insert("notificationLog", {
        channel: "EMAIL",
        recipient: "test@example.com",
        subject: "Test",
        message: "Test message",
        status: "QUEUED",
        createdAt: Date.now(),
      }),
    );
    const rows = await t.mutation(internal.notifications.claimQueued, {});
    expect(rows).toHaveLength(1);
    expect(await t.mutation(internal.notifications.claimQueued, {})).toEqual(
      [],
    );
    await t.mutation(internal.notifications.finishQueued, {
      id,
      leaseUntil: rows[0].leaseUntil,
      error: "Provider unavailable",
    });
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.status).toBe("QUEUED");
    expect(row?.attempts).toBe(1);
    expect(row?.nextAttemptAt).toBeGreaterThan(Date.now());
  });
});
describe("restore isolation", () => {
  const env = {
    CONVEX_RESTORE_DEPLOYMENT: "gentle-mouse-123",
    CONVEX_STAGING_DEPLOY_KEY: "prod:gentle-mouse-123|test",
    CONVEX_STAGING_URL: "https://gentle-mouse-123.convex.cloud",
    CONFIRM_STAGING_RESTORE: "RESTORE_TO_STAGING",
  };
  it("accepts an exact isolated staging identity", () =>
    expect(validateRestoreTarget(env).deployment).toBe("gentle-mouse-123"));
  it("rejects production names, aliases and mismatched keys", () => {
    for (const name of [
      "prod",
      "production",
      "gallant-husky-352",
      "team:project:prod",
    ])
      expect(() =>
        validateRestoreTarget({ ...env, CONVEX_RESTORE_DEPLOYMENT: name }),
      ).toThrow();
    expect(() =>
      validateRestoreTarget({
        ...env,
        CONVEX_STAGING_DEPLOY_KEY: "prod:gallant-husky-352|test",
      }),
    ).toThrow();
  });
});

describe("administrator MFA", () => {
  it("matches the RFC 6238 SHA1 test vector", async () => {
    expect(
      await totp(
        base32(new TextEncoder().encode("12345678901234567890")),
        1,
        8,
      ),
    ).toBe("94287082");
  });
  it("requires a current session proof and rejects code replay", async () => {
    vi.stubEnv("MFA_ENCRYPTION_KEY", btoa("12345678901234567890123456789012"));
    vi.stubEnv("ADMIN_MFA_REQUIRED", "true");
    try {
      const t = setup();
      const actor = await user(t, "ADMIN");
      const sessionId = await t.run((ctx) =>
        ctx.db.insert("authSessions", {
          userId: actor.id,
          expirationTime: Date.now() + 3600000,
        }),
      );
      const session = t.withIdentity({ subject: `${actor.id}|${sessionId}` });
      await expect(
        session.query(api.partners.listManagers, {}),
      ).rejects.toThrow("ADMIN_MFA_REQUIRED");
      const { secret } = await session.mutation(
        api.adminSecurity.beginEnrollment,
        {},
      );
      const code = await totp(secret, Math.floor(Date.now() / 30000));
      await session.mutation(api.adminSecurity.verify, { code });
      expect(await session.query(api.partners.listManagers, {})).toEqual([]);
      await expect(
        session.mutation(api.adminSecurity.verify, { code }),
      ).rejects.toThrow("reused");
      await t.run((ctx) =>
        ctx.db.patch(sessionId, { expirationTime: Date.now() - 1 }),
      );
      await expect(
        session.query(api.partners.listManagers, {}),
      ).rejects.toThrow("Unauthorized");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("signature and pending refund safeguards", () => {
  it("blocks allocation while a provider refund is unresolved", async () => {
    const t = setup(),
      f = await paidBooking(t),
      admin = await user(t, "ADMIN");
    await t.run(async (ctx) => {
      await ctx.db.patch(f.documentId, { status: "SIGNED" });
      await ctx.db.insert("paymentRefunds", {
        paymentId: f.paymentId,
        bookingId: f.bookingId,
        provider: "FLUTTERWAVE",
        amount: 10000,
        reason: "Uncertain provider outcome",
        status: "PENDING",
        initiatedBy: admin.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    await expect(
      t.mutation(internal.fulfillment.allocateSignedBooking, {
        bookingId: f.bookingId,
        documentId: f.documentId,
      }),
    ).rejects.toThrow("pending");
    expect((await t.run((ctx) => ctx.db.get(f.plotId)))?.status).toBe(
      "RESERVED",
    );
  });
  it("binds signature outcomes to the request and preserves terminal documents", async () => {
    const t = setup(),
      f = await paidBooking(t);
    await expect(
      t.mutation(internal.legalDocuments.updateDocumentStatus, {
        referenceCode: "TEST-DEED",
        status: "SIGNED",
        providerRequestId: "wrong-request",
      }),
    ).rejects.toThrow("registered request");
    await expect(
      t.mutation(internal.legalDocuments.updateDocumentStatus, {
        referenceCode: "TEST-DEED",
        status: "SIGNED",
        providerRequestId: "test-provider-request",
        testMode: true,
      }),
    ).rejects.toThrow("registered request");
    await t.mutation(internal.legalDocuments.updateDocumentStatus, {
      referenceCode: "TEST-DEED",
      status: "SIGNED",
      providerRequestId: "test-provider-request",
      testMode: false,
    });
    await t.mutation(internal.legalDocuments.recordSignatureRequest, {
      documentId: f.documentId,
      requestId: "test-provider-request",
    });
    expect((await t.run((ctx) => ctx.db.get(f.documentId)))?.status).toBe(
      "SIGNED",
    );
    await expect(
      t.mutation(internal.legalDocuments.updateDocumentStatus, {
        referenceCode: "TEST-DEED",
        status: "EXPIRED",
      }),
    ).rejects.toThrow("Terminal");
  });
  it("generates a complete NGN deed PDF and reuses it on retry", async () => {
    const t = setup(),
      f = await paidBooking(t);
    await t.run((ctx) => ctx.db.delete(f.documentId));
    const args = {
      clientId: f.clientId,
      plotId: f.plotId,
      bookingId: f.bookingId,
      assigneeAddress: "10 Test Street, Abuja, Nigeria",
      considerationAmount: 100000,
    };
    const first = await t.action(
      internal.legalDocuments.generateDeedOfAssignment,
      args,
    );
    const second = await t.action(
      internal.legalDocuments.generateDeedOfAssignment,
      args,
    );
    expect(second).toEqual(first);
    const bytes = await t.run(async (ctx) =>
      (await ctx.storage.get(first.storageId!))!.arrayBuffer(),
    );
    expect(new TextDecoder().decode(bytes).startsWith("%PDF")).toBe(true);
    expect(
      await t.run((ctx) => ctx.db.query("legalDocuments").collect()),
    ).toHaveLength(1);
  }, 30000);
});

it("requires completed settlement disbursement and exact fees before reconciliation", async () => {
  const t = setup(),
    f = await paidBooking(t),
    a = await user(t, "ADMIN");
  const settlementId = await t.run((ctx) =>
    ctx.db.insert("paymentSettlements", {
      provider: "FLUTTERWAVE",
      providerSettlementId: "456",
      amount: 99900,
      currency: "NGN",
      status: "pending",
      importedBy: a.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );
  const data = {
    id: 456,
    status: "pending",
    currency: "NGN",
    net_amount: 99900,
    transaction_count: 1,
    transactions: [
      {
        id: "test-provider-payment",
        tx_ref: "TEST-PAYMENT",
        charged_amount: 100000,
        app_fee: 100,
        merchant_fee: 0,
        stampduty_charge: 0,
        refund: 0,
        settlement_amount: 99900,
        currency: "NGN",
      },
    ],
  };
  const result = await t.mutation(internal.reconciliation.importDetail, {
    settlementId,
    data,
  });
  expect(result).toEqual({ matched: 1, unmatched: 0, discrepancyMinor: 0 });
  expect((await t.run((ctx) => ctx.db.get(settlementId)))?.status).toBe(
    "REVIEW",
  );
  await t.mutation(internal.reconciliation.importDetail, {
    settlementId,
    data: { ...data, status: "completed" },
  });
  expect((await t.run((ctx) => ctx.db.get(settlementId)))?.status).toBe(
    "RECONCILED",
  );
  await t.mutation(internal.reconciliation.importDetail, {
    settlementId,
    data: { ...data, status: "completed", net_amount: 100000 },
  });
  expect((await t.run((ctx) => ctx.db.get(settlementId)))?.status).toBe(
    "REVIEW",
  );
});

describe("company-only customer contact access", () => {
  it("denies agents the full customer booking roster", async () => {
    const t = setup();
    const agent = await user(t, "AGENT");
    await expect(
      agent.session.query(api.bookings.getAllBookings, {}),
    ).rejects.toThrow(/ADMIN|Forbidden/);
  });
  it("removes customer contacts and free-text messages from assigned enquiry results", async () => {
    const t = setup();
    const agent = await user(t, "AGENT");
    await t.run((ctx) =>
      ctx.db.insert("enquiries", {
        name: "Private Customer",
        email: "private@example.com",
        phone: "08011111111",
        message: "My phone number is private",
        assignedAgentId: agent.id,
        status: "NEW",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    const rows = await agent.session.query(
      api.enquiries.listMyAssignedEnquiries,
      {},
    );
    expect(rows).toHaveLength(1);
    for (const key of ["name", "email", "phone", "message"])
      expect(rows[0]).not.toHaveProperty(key);
  });
});
