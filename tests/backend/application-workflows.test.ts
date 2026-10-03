import { convexTest } from "convex-test";
import { describe, it, expect, vi, afterEach } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import rateLimiter from "@convex-dev/rate-limiter/test";
import aggregate from "@convex-dev/aggregate/test";
import { refundState, minor } from "../../convex/lib/providerPayments";
import { publicSignupProfile } from "../../convex/lib/access";
import { scanFile, decodeImage } from "../../convex/lib/mediaSecurity";
import { assertCheckoutEnvironment } from "../../convex/lib/checkoutReadiness";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  aggregate.register(t, "managementAggregate");
  aggregate.register(t, "estateAggregate");
  return t;
}
async function user(
  t: ReturnType<typeof setup>,
  role: "CLIENT" | "AGENT" | "ADMIN" | "ESTATE_MANAGER" = "CLIENT",
) {
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      name: "Test account",
      email: `${crypto.randomUUID()}@example.com`,
      role,
      isDiaspora: false,
      kycVerified: true,
      createdAt: Date.now(),
    }),
  );
  await t.run(ctx => ctx.db.insert("identities", { userId: id, ninCipher: "test-fixture", fingerprint: String(id), lastFour: "8901", status: "VERIFIED", consentVersion: "2026-10-03", consentedAt: Date.now(), createdAt: Date.now(), updatedAt: Date.now() }));
  const sessionId = await t.run((ctx) =>
    ctx.db.insert("authSessions", {
      userId: id,
      expirationTime: Date.now() + 3600000,
    }),
  );
  return {
    id,
    sessionId,
    session: t.withIdentity({ subject: `${id}|${sessionId}` }),
  };
}
async function property(t: ReturnType<typeof setup>, managerId: any) {
  return t.run((ctx) =>
    ctx.db.insert("properties", {
      managerId,
      slug: crypto.randomUUID(),
      title: "Test property",
      type: "APARTMENT",
      description: "Test",
      price: 10000,
      location: "Abuja",
      state: "FCT",
      amenities: [],
      images: [],
      status: "AVAILABLE",
      isFeatured: false,
      isActive: true,
      verificationStatus: "VERIFIED",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("private conversations", () => {
  it("allows owner/admin replies while denying another agent and client", async () => {
    const t = setup(),
      a = await user(t, "AGENT"),
      b = await user(t),
      admin = await user(t, "ADMIN");
    const id = await a.session.mutation(api.messaging.create, {
      subject: "Private request",
      body: "Please review",
    });
    await expect(
      b.session.query(api.messaging.messages, {
        conversationId: id,
        paginationOpts: { numItems: 10, cursor: null },
      }),
    ).rejects.toThrow("Conversation not found");
    await expect(
      b.session.mutation(api.messaging.reply, {
        conversationId: id,
        body: "Unauthorized",
        attachmentIds: [],
        clientReference: "test-ref-1",
      }),
    ).rejects.toThrow("Conversation not found");
    await admin.session.mutation(api.messaging.reply, {
      conversationId: id,
      body: "Support reply",
      attachmentIds: [],
      clientReference: "test-ref-2",
    });
    expect(
      (
        await a.session.query(api.messaging.messages, {
          conversationId: id,
          paginationOpts: { numItems: 10, cursor: null },
        })
      ).page,
    ).toHaveLength(2);
  });
  it("deduplicates retries and blocks replies to closed threads", async () => {
    const t = setup(),
      a = await user(t);
    const id = await a.session.mutation(api.messaging.create, {
      subject: "Customer request",
      body: "Please review",
    });
    const args = {
      conversationId: id,
      body: "Reply",
      attachmentIds: [],
      clientReference: "retry-ref-123",
    };
    expect(await a.session.mutation(api.messaging.reply, args)).toEqual(
      await a.session.mutation(api.messaging.reply, args),
    );
    await a.session.mutation(api.messaging.setStatus, {
      conversationId: id,
      status: "CLOSED",
    });
    await expect(
      a.session.mutation(api.messaging.reply, {
        ...args,
        clientReference: "new-ref-123",
      }),
    ).rejects.toThrow("Reopen");
  });
  it("rejects unscanned/foreign attachments", async () => {
    const t = setup(),
      a = await user(t),
      b = await user(t);
    const id = await a.session.mutation(api.messaging.create, {
      subject: "Customer request",
      body: "Please review",
    });
    const assetId = await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(
        new Blob(["test"], { type: "application/pdf" }),
      );
      return ctx.db.insert("storedAssets", {
        storageId,
        ownerId: b.id,
        purpose: "SERVICE_ATTACHMENT",
        fileName: "test.pdf",
        mimeType: "application/pdf",
        size: 4,
        status: "PENDING_SCAN",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    await expect(
      a.session.mutation(api.messaging.reply, {
        conversationId: id,
        body: "Attached",
        attachmentIds: [assetId],
        clientReference: "test-ref-123",
      }),
    ).rejects.toThrow("Attachment");
  });
  it("paginates without omitting or leaking conversations", async () => {
    const t = setup(),
      a = await user(t),
      b = await user(t);
    await t.run(async (ctx) => {
      for (let i = 0; i < 35; i++)
        await ctx.db.insert("conversations", {
          ownerId: a.id,
          subject: `Thread ${i}`,
          status: "OPEN",
          createdAt: i,
          updatedAt: i,
        });
      await ctx.db.insert("conversations", {
        ownerId: b.id,
        subject: "Private",
        status: "OPEN",
        createdAt: 99,
        updatedAt: 99,
      });
    });
    const first = await a.session.query(api.messaging.list, {
      paginationOpts: { numItems: 20, cursor: null },
    });
    const second = await a.session.query(api.messaging.list, {
      paginationOpts: { numItems: 20, cursor: first.continueCursor },
    });
    expect(first.page.length + second.page.length).toBe(35);
    expect(second.isDone).toBe(true);
  });
});
describe("estate operations and ledger", () => {
  it("rejects overlapping active occupancy and cross-manager properties", async () => {
    const t = setup(),
      a = await user(t, "ESTATE_MANAGER"),
      b = await user(t, "ESTATE_MANAGER"),
      tenant = await user(t),
      propertyId = await property(t, a.id);
    const args = {
      propertyId,
      tenantId: tenant.id,
      unit: "A1",
      startDate: "2026-10-03",
      endDate: "2027-10-01",
      rent: 50000,
      deposit: 10000,
      status: "ACTIVE" as const,
      attachmentIds: [],
    };
    await a.session.mutation(api.estateOperations.saveLease, args);
    await expect(
      a.session.mutation(api.estateOperations.saveLease, {
        ...args,
        startDate: "2027-01-01",
      }),
    ).rejects.toThrow("already occupied");
    await expect(
      b.session.mutation(api.estateOperations.saveLease, {
        ...args,
        unit: "A2",
      }),
    ).rejects.toThrow("Invalid assigned");
  });
  it("enforces idempotent ledger references and rejects ownership violations", async () => {
    const t = setup(),
      a = await user(t, "ESTATE_MANAGER"),
      b = await user(t, "ESTATE_MANAGER"),
      tenant = await user(t),
      propertyId = await property(t, a.id);
    const leaseId = await a.session.mutation(api.estateOperations.saveLease, {
      propertyId,
      tenantId: tenant.id,
      unit: "A1",
      startDate: "2026-10-03",
      endDate: "2027-10-01",
      rent: 50000,
      deposit: 10000,
      status: "ACTIVE",
      attachmentIds: [],
    });
    const args = {
      leaseId,
      direction: "INCOME" as const,
      amountMinor: 100000,
      reference: "receipt-123",
      description: "Rental receipt",
    };
    const id = await a.session.mutation(api.estateOperations.postLedger, args);
    const summary = await a.session.query(api.estateOperations.summary, {});
    expect(summary.activeLeases).toBe(1);
    expect(summary.months.reduce((sum, row) => sum + row.revenue, 0)).toBe(
      1000,
    );
    expect(
      (await b.session.query(api.estateOperations.summary, {})).months.reduce(
        (sum, row) => sum + row.revenue,
        0,
      ),
    ).toBe(0);

    expect(
      await a.session.mutation(api.estateOperations.postLedger, args),
    ).toBe(id);
    await expect(
      a.session.mutation(api.estateOperations.postLedger, {
        ...args,
        amountMinor: 200000,
      }),
    ).rejects.toThrow("different entry");
    await expect(
      b.session.mutation(api.estateOperations.postLedger, args),
    ).rejects.toThrow("Lease not found");
    await expect(
      a.session.mutation(api.estateOperations.postLedger, {
        ...args,
        reference: "bad-receipt",
        amountMinor: 0.1,
      }),
    ).rejects.toThrow("Invalid ledger");
  });
  it("uses aggregate counts for more than the previous 500-record limit", async () => {
    const t = setup(),
      a = await user(t, "AGENT");
    await t.run(async (ctx) => {
      for (let i = 0; i < 510; i++)
        await ctx.db.insert("managementRecords", {
          ownerId: a.id,
          createdBy: a.id,
          kind: "REFERRAL",
          title: `Referral ${i}`,
          detail: "Test",
          status: "COMPLETED",
          createdAt: i,
          updatedAt: i,
        });
    });
    let cursor: string | null = null;
    while (true) {
      const result: { isDone: boolean; cursor: string } = await t.mutation(
        internal.management.backfillAggregate,
        { cursor },
      );
      if (result.isDone) break;
      cursor = result.cursor;
    }
    expect(
      (await a.session.query(api.management.myFinancialSummary, {}))
        .completedReferrals,
    ).toBe(510);
  }, 30000);
});
describe("provider financial validation", () => {
  it("does not mistake initiated refunds for disbursed refunds", () => {
    expect(refundState({ status: "completed" })).toBe("PENDING");
    expect(refundState({ status: "completed-mpgs" })).toBe("COMPLETED");
    expect(
      refundState({
        status: "completed",
        meta: JSON.stringify({ disburse_status: "failed" }),
      }),
    ).toBe("FAILED");
    expect(minor(98.6)).toBe(9860);
    expect(() => minor(undefined)).toThrow();
  });
  it("reconciles exact settlement references and fees idempotently", async () => {
    const t = setup(),
      a = await user(t, "ADMIN");
    const fixture = await t.run(async (ctx) => {
      const settlementId = await ctx.db.insert("paymentSettlements", {
        provider: "FLUTTERWAVE",
        providerSettlementId: "123",
        amount: 98.6,
        currency: "NGN",
        status: "completed",
        importedBy: a.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { settlementId };
    });
    const data = {
      id: 123,
      currency: "NGN",
      net_amount: 98.6,
      transaction_count: 1,
      transactions: [
        {
          id: 99,
          tx_ref: "unmatched",
          charged_amount: 100,
          app_fee: 1.4,
          merchant_fee: 0,
          stampduty_charge: 0,
          settlement_amount: 98.6,
          currency: "NGN",
        },
      ],
    };
    const result = await t.mutation(internal.reconciliation.importDetail, {
      ...fixture,
      data,
    });
    expect(result).toEqual({ matched: 0, unmatched: 1, discrepancyMinor: 0 });
    await t.mutation(internal.reconciliation.importDetail, {
      ...fixture,
      data,
    });
    expect(
      await t.run((ctx) => ctx.db.query("settlementTransactions").collect()),
    ).toHaveLength(1);
    await expect(
      t.mutation(internal.reconciliation.importDetail, {
        ...fixture,
        data: { ...data, currency: "USD" },
      }),
    ).rejects.toThrow("identity mismatch");
  });
});
describe("registration and account re-verification", () => {
  it("requires versioned policy acceptance during signup", () => {
    expect(() =>
      publicSignupProfile({
        flow: "signUp",
        name: "Test",
        email: "test@example.com",
      }),
    ).toThrow("Accept");
    expect(
      publicSignupProfile({
        flow: "signUp",
        name: "Test",
        email: "test@example.com",
        acceptPolicies: true,
        policyVersion: "2026-10-03",
      }).registrationPolicyVersion,
    ).toBe("2026-10-03");
  });
  it("persists failed code attempts and expires every session on verified email change", async () => {
    const t = setup(),
      a = await user(t);
    await t.run(async (ctx) => {
      const account = await ctx.db.get(a.id);
      await ctx.db.insert("authAccounts", {
        userId: a.id,
        provider: "password",
        providerAccountId: account!.email,
        secret: "test-secret",
      });
      await ctx.db.insert("emailChanges", {
        userId: a.id,
        email: "verified@example.com",
        codeHash: "verified-hash",
        expiresAt: Date.now() + 60000,
        attempts: 0,
        createdAt: Date.now(),
      });
    });
    expect(
      (
        await a.session.mutation(internal.accountSecurity.confirm, {
          codeHash: "wrong",
        })
      ).ok,
    ).toBe(false);
    expect(
      (await t.run((ctx) => ctx.db.query("emailChanges").first()))?.attempts,
    ).toBe(1);
    expect(
      (
        await a.session.mutation(internal.accountSecurity.confirm, {
          codeHash: "verified-hash",
        })
      ).ok,
    ).toBe(true);
    expect((await t.run((ctx) => ctx.db.get(a.id)))?.email).toBe(
      "verified@example.com",
    );
    await expect(
      a.session.query(api.messaging.list, {
        paginationOpts: { numItems: 10, cursor: null },
      }),
    ).rejects.toThrow("Unauthorized");
  });
});
describe("media provider contracts", () => {
  it("treats Cloudmersive infection and missing CleanResult as non-clean", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ CleanResult: false }), { status: 200 }),
        ),
    );
    expect(
      (
        await scanFile(new Blob(["test"]), "file.pdf", {
          provider: "CLOUDMERSIVE",
          key: "test",
        })
      ).clean,
    ).toBe(false);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    );
    await expect(
      scanFile(new Blob(["test"]), "file.pdf", {
        provider: "CLOUDMERSIVE",
        key: "test",
      }),
    ).rejects.toThrow("Invalid malware");
  });
  it("rejects decoding outages, wrong output type and missing decoder settings", async () => {
    await expect(decodeImage(new Blob(["test"]), {})).rejects.toThrow(
      "not configured",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("bad", { status: 422 })),
    );
    await expect(
      decodeImage(new Blob(["test"]), {
        url: "https://decoder.example.com",
        key: "test",
      }),
    ).rejects.toThrow("decoding failed");
  });
});

it("keeps new production charges closed until a recorded approval and separates sandbox keys", () => {
  expect(() =>
    assertCheckoutEnvironment("PAYSTACK", "sk_live_example"),
  ).toThrow("temporarily unavailable");
  vi.stubEnv("DEPLOYMENT_ENVIRONMENT", "staging");
  expect(() =>
    assertCheckoutEnvironment("PAYSTACK", "sk_test_example"),
  ).not.toThrow();
  expect(() =>
    assertCheckoutEnvironment("PAYSTACK", "sk_live_example"),
  ).toThrow("test payment credentials");
  vi.stubEnv("DEPLOYMENT_ENVIRONMENT", "production");
  vi.stubEnv("LIVE_TRANSACTIONS_ENABLED", "true");
  vi.stubEnv(
    "LIVE_TRANSACTION_APPROVAL_REFERENCE",
    "approved-release-ticket-123",
  );
  expect(() =>
    assertCheckoutEnvironment("PAYSTACK", "sk_live_example"),
  ).not.toThrow();
  expect(() =>
    assertCheckoutEnvironment("PAYSTACK", "sk_test_example"),
  ).toThrow("temporarily unavailable");
});
