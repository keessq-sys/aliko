import { convexTest } from "convex-test";
import { createHmac } from "node:crypto";
import { describe, it, expect, afterEach, vi } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
const modules = import.meta.glob("../../convex/**/*.ts");
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
async function setup() {
  const t = convexTest(schema, modules);
  const ownerId = await t.run((ctx) =>
    ctx.db.insert("users", {
      name: "Owner",
      email: "owner@example.invalid",
      role: "CLIENT",
      isDiaspora: false,
      kycVerified: false,
      createdAt: Date.now(),
    }),
  );
  const adminId = await t.run((ctx) =>
    ctx.db.insert("users", {
      name: "Admin",
      email: "admin@example.invalid",
      role: "ADMIN",
      isDiaspora: false,
      kycVerified: false,
      createdAt: Date.now(),
    }),
  );
  const sessionId = await t.run((ctx) =>
    ctx.db.insert("authSessions", {
      userId: adminId,
      expirationTime: Date.now() + 3600000,
    }),
  );
  const clientSession = await t.run((ctx) =>
    ctx.db.insert("authSessions", {
      userId: ownerId,
      expirationTime: Date.now() + 3600000,
    }),
  );
  const admin = t.withIdentity({ subject: `${adminId}|${sessionId}` }),
    client = t.withIdentity({ subject: `${ownerId}|${clientSession}` });
  const orderId = await t.run((ctx) =>
    ctx.db.insert("checkoutOrders", {
      reference: "ORDER-1",
      ownerId,
      kind: "PROPERTY",
      targetId: "fixture",
      title: "Fixture",
      amount: 2000,
      currency: "NGN",
      status: "PAID",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );
  const attemptId = await t.run((ctx) =>
    ctx.db.insert("checkoutAttempts", {
      orderId,
      reference: "CHARGE-1",
      provider: "KORAPAY",
      providerId: "KORAPAY:CHARGE-1",
      status: "SUCCESS",
      amount: 2000,
      currency: "NGN",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );
  return { t, admin, client, orderId, attemptId };
}
describe("Korapay operations", () => {
  it("requeries signed refund callbacks and makes duplicate events harmless", async () => {
    const { t, admin, orderId } = await setup();
    vi.stubEnv("KORAPAY_SECRET_KEY", "sk_live_fixture");
    const { row } = await admin.mutation(internal.korapayOperations.reserve, { orderId, reason: "Customer request" });
    const providerData = { reference: row.reference, payment_reference: row.paymentReference, amount: 2000, currency: "NGN", status: "success" };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: true, data: providerData }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const data = { reference: row.reference, amount: 1, status: "success" };
    const body = JSON.stringify({ event: "refund.success", data });
    const signature = createHmac("sha256", "sk_live_fixture").update(JSON.stringify(data)).digest("hex");
    expect((await t.fetch("/webhooks/korapay", { method: "POST", body, headers: { "x-korapay-signature": "forged" } })).status).toBe(401);
    const send = () => t.fetch("/webhooks/korapay", { method: "POST", body, headers: { "x-korapay-signature": signature } });
    expect((await send()).status).toBe(200); expect((await send()).status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await t.run(ctx => ctx.db.get(orderId)))?.status).toBe("REFUNDED");
  });
  it("rejects customers and unauthenticated refund and report calls", async () => {
    const { t, client, orderId } = await setup();
    await expect(
      t.action(api.korapayOperations.initiateRefund, {
        orderId,
        reason: "Customer request",
      }),
    ).rejects.toThrow();
    await expect(
      client.action(api.korapayOperations.initiateRefund, {
        orderId,
        reason: "Customer request",
      }),
    ).rejects.toThrow();
    await expect(
      client.mutation(api.korapayOperations.importSettlementReport, {
        batchReference: "B1",
        evidenceReference: "ticket-1",
        settledAt: Date.now(),
        rows: [
          { paymentReference: "CHARGE-1", gross: 2000, fees: 20, net: 1980 },
        ],
      }),
    ).rejects.toThrow();
  });
  it("reserves one refund across repeated requests and never retries an ambiguous provider POST", async () => {
    const { t, admin, orderId } = await setup();
    vi.stubEnv("KORAPAY_SECRET_KEY", "sk_live_fixture");
    vi.stubEnv("CONVEX_HTTP_ACTIONS_URL", "https://fixture.convex.site");
    const fetcher = vi.fn().mockRejectedValue(new Error("Timeout"));
    vi.stubGlobal("fetch", fetcher);
    const first = await admin.action(api.korapayOperations.initiateRefund, {
      orderId,
      reason: "Customer request",
    });
    const again = await admin.action(api.korapayOperations.initiateRefund, {
      orderId,
      reason: "Customer request again",
    });
    expect(again.reference).toBe(first.reference);
    expect(first.status).toBe("PENDING");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await t.run((ctx) => ctx.db.get(orderId)))?.refundPending).toBe(
      true,
    );
  });
  it("requires a matching live charge and valid minimum/refund reason", async () => {
    const { t, admin, orderId, attemptId } = await setup();
    await expect(
      admin.mutation(internal.korapayOperations.reserve, {
        orderId,
        reason: "x",
      }),
    ).rejects.toThrow();
    await t.run((ctx) => ctx.db.patch(attemptId, { testMode: true }));
    await expect(
      admin.mutation(internal.korapayOperations.reserve, {
        orderId,
        reason: "Customer request",
      }),
    ).rejects.toThrow("matching live");
  });
  it("does not mutate finances for wrong reference, amount or currency", async () => {
    const { t, admin, orderId } = await setup();
    const { row } = await admin.mutation(internal.korapayOperations.reserve, {
      orderId,
      reason: "Customer request",
    });
    for (const change of [
      { amount: 1 },
      { currency: "USD" },
      { payment_reference: "OTHER" },
      { reference: "OTHER" },
    ])
      await expect(
        t.mutation(internal.korapayOperations.finish, {
          reference: row.reference,
          data: {
            reference: row.reference,
            payment_reference: "CHARGE-1",
            amount: 2000,
            currency: "NGN",
            status: "success",
            ...change,
          },
        }),
      ).rejects.toThrow();
    expect((await t.run((ctx) => ctx.db.get(orderId)))?.status).toBe("PAID");
  });
  it("completes a full refund once and ignores stale terminal updates", async () => {
    const { t, admin, orderId, attemptId } = await setup();
    const { row } = await admin.mutation(internal.korapayOperations.reserve, {
      orderId,
      reason: "Customer request",
    });
    const args = {
      reference: row.reference,
      data: {
        reference: row.reference,
        payment_reference: "CHARGE-1",
        amount: "2000.00",
        currency: "NGN",
        status: "success",
      },
    };
    await t.mutation(internal.korapayOperations.finish, args);
    await t.mutation(internal.korapayOperations.finish, args);
    await t.mutation(internal.korapayOperations.finish, {
      ...args,
      data: { ...args.data, status: "failed" },
    });
    expect((await t.run((ctx) => ctx.db.get(orderId)))?.status).toBe(
      "REFUNDED",
    );
    expect((await t.run((ctx) => ctx.db.get(attemptId)))?.status).toBe(
      "REFUNDED",
    );
    expect(
      (await t.run((ctx) => ctx.db.query("adminAuditLog").collect())).filter(
        (r) => r.action === "KORAPAY_REFUND_COMPLETED_REVIEW_FULFILMENT",
      ),
    ).toHaveLength(1);
  });
  it("provider failure clears only the hold and leaves the paid order intact", async () => {
    const { t, admin, orderId } = await setup();
    const { row } = await admin.mutation(internal.korapayOperations.reserve, {
      orderId,
      reason: "Customer request",
    });
    await t.mutation(internal.korapayOperations.finish, {
      reference: row.reference,
      data: {
        reference: row.reference,
        payment_reference: "CHARGE-1",
        amount: 2000,
        currency: "NGN",
        status: "failed",
      },
    });
    const order = await t.run((ctx) => ctx.db.get(orderId));
    expect(order?.status).toBe("PAID");
    expect(order?.refundPending).toBe(false);
  });
  it("a refunded manager subscription is revoked and can be renewed instead of retaining stale paidThrough", async () => {
    const { t, admin, orderId } = await setup();
    const order = (await t.run((ctx) => ctx.db.get(orderId)))!;
    const managerId = await t.run((ctx) =>
      ctx.db.insert("estateManagers", {
        userId: order.ownerId,
        companyName: "Test",
        contactName: "Owner",
        email: "owner@example.invalid",
        phone: "08000000000",
        statesOfOperation: ["Lagos"],
        plan: "STARTER",
        status: "APPROVED",
        paidThrough: Date.now() + 86400000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    await t.run((ctx) =>
      ctx.db.patch(orderId, { kind: "MANAGER", targetId: managerId }),
    );
    const subId = await t.run((ctx) =>
      ctx.db.insert("managerSubscriptions", {
        ownerId: order.ownerId,
        managerId,
        orderId,
        plan: "STARTER",
        amount: 2000,
        startsAt: Date.now() - 1000,
        endsAt: Date.now() + 86400000,
        cancelAtPeriodEnd: false,
        status: "ACTIVE",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    const { row } = await admin.mutation(internal.korapayOperations.reserve, {
      orderId,
      reason: "Customer request",
    });
    await t.mutation(internal.korapayOperations.finish, {
      reference: row.reference,
      data: {
        reference: row.reference,
        payment_reference: "CHARGE-1",
        amount: 2000,
        currency: "NGN",
        status: "success",
      },
    });
    expect((await t.run((ctx) => ctx.db.get(subId)))?.status).toBe("REVOKED");
    expect((await t.run((ctx) => ctx.db.get(managerId)))?.paidThrough).toBe(0);
  });
  it("imports exact balanced batches idempotently and rejects duplicate/conflicting imports", async () => {
    const { t, admin } = await setup();
    const args = {
      batchReference: "BATCH-1",
      evidenceReference: "merchant-export-ticket-1",
      settledAt: Date.now() - 1000,
      rows: [
        { paymentReference: "CHARGE-1", gross: 2000, fees: 20, net: 1980 },
      ],
    };
    const id = await admin.mutation(
      api.korapayOperations.importSettlementReport,
      args,
    );
    expect(
      await admin.mutation(api.korapayOperations.importSettlementReport, args),
    ).toBe(id);
    expect((await t.run((ctx) => ctx.db.get(id)))?.status).toBe(
      "REPORTED_NOT_BANK_VERIFIED",
    );
    await expect(
      admin.mutation(api.korapayOperations.importSettlementReport, {
        ...args,
        batchReference: "BATCH-2",
      }),
    ).rejects.toThrow("already belongs");
    await expect(
      admin.mutation(api.korapayOperations.importSettlementReport, {
        ...args,
        rows: [args.rows[0], args.rows[0]],
      }),
    ).rejects.toThrow("Duplicate");
    await expect(
      admin.mutation(api.korapayOperations.importSettlementReport, {
        ...args,
        rows: [{ ...args.rows[0], net: 1990 }],
      }),
    ).rejects.toThrow("minus fees");
    await expect(
      admin.mutation(api.korapayOperations.importSettlementReport, {
        ...args,
        rows: [{ ...args.rows[0], paymentReference: "UNKNOWN" }],
      }),
    ).rejects.toThrow("does not match");
  });
});
