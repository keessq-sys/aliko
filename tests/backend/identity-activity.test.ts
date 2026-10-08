import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import rateLimiter from "@convex-dev/rate-limiter/test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { normalizeNin, ninProblem } from "../../convex/lib/nin";
const modules = import.meta.glob("../../convex/**/*.ts");
beforeEach(() =>
  vi.stubEnv("NIN_ENCRYPTION_KEY", btoa("0123456789abcdef0123456789abcdef")),
);
afterEach(() => vi.unstubAllEnvs());
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}
async function account(
  t: ReturnType<typeof setup>,
  role: "CLIENT" | "ADMIN" = "CLIENT",
) {
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      name: "مستخدم تجريبي",
      email: `${crypto.randomUUID()}@example.com`,
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
describe("private NIN and administrator conversations", () => {
  it("accepts Arabic digits but rejects incomplete and nonnumeric identity numbers", () => {
    expect(normalizeNin("١٢٣٤٥٦٧٨٩٠١")).toBe("12345678901");
    expect(normalizeNin("۱۲۳۴۵۶۷۸۹۰۱")).toBe("12345678901");
    expect(ninProblem("١٢٣٤٥٦٧٨٩٠١")).toBeNull();
    for (const value of [
      "",
      "1234567890",
      "123456789012",
      "abcdefghijk",
      "1234 678901",
    ])
      expect(ninProblem(value)).not.toBeNull();
  });
  it("encrypts NIN, excludes it from profiles, prevents duplicates and requires consent", async () => {
    const t = setup(),
      a = await account(t),
      b = await account(t);
    await expect(
      a.session.action(api.identity.submit, {
        nin: "12345678901",
        consent: false,
      }),
    ).rejects.toThrow(/consent/);
    await a.session.action(api.identity.submit, {
      nin: "١٢٣٤٥٦٧٨٩٠١",
      consent: true,
    });
    const record = await t.run((ctx) => ctx.db.query("identities").first());
    expect(record?.ninCipher).not.toContain("12345678901");
    expect(record?.fingerprint).not.toContain("12345678901");
    expect(await a.session.query(api.identity.status, {})).toEqual({
      status: "PENDING",
      maskedNin: "•••••••8901",
      formatValid: true,
    });
    const profile = await a.session.query(api.users.getMyProfile, {});
    expect(JSON.stringify(profile)).not.toMatch(
      /ninCipher|fingerprint|12345678901/,
    );
    expect(profile?.kycVerified).toBe(false);
    await expect(
      b.session.action(api.identity.submit, {
        nin: "12345678901",
        consent: true,
      }),
    ).rejects.toThrow(/associated/);
    await expect(
      a.session.action(api.identity.reveal, { userId: a.id }),
    ).rejects.toThrow(/Forbidden/);
    await expect(a.session.query(api.users.listUsers, {})).rejects.toThrow(
      /Forbidden/,
    );
  });
  it("requires administrator MFA for NIN access and records reveals and review evidence", async () => {
    const t = setup(),
      a = await account(t),
      admin = await account(t, "ADMIN");
    await a.session.action(api.identity.submit, {
      nin: "12345678901",
      consent: true,
    });
    vi.stubEnv("ADMIN_MFA_REQUIRED", "true");
    await expect(
      admin.session.action(api.identity.reveal, { userId: a.id }),
    ).rejects.toThrow(/MFA/);
    vi.stubEnv("ADMIN_MFA_REQUIRED", "false");
    expect(
      await admin.session.action(api.identity.reveal, { userId: a.id }),
    ).toBe("12345678901");
    await expect(
      admin.session.mutation(api.identity.review, {
        userId: a.id,
        status: "VERIFIED",
        reason: "okay",
      }),
    ).rejects.toThrow(/evidence/);
    await admin.session.mutation(api.identity.review, {
      userId: a.id,
      status: "VERIFIED",
      reason: "Authorized verification evidence checked and matched.",
    });
    expect((await a.session.query(api.identity.status, {}))?.status).toBe(
      "VERIFIED",
    );
    const audit = await t.run((ctx) => ctx.db.query("adminAuditLog").collect());
    expect(audit.some((row) => row.action === "NIN_VIEWED")).toBe(true);
    expect(JSON.stringify(audit)).not.toContain("12345678901");
  });
  it("allows administrator-initiated Arabic conversations and owner replies only", async () => {
    const t = setup(),
      a = await account(t),
      b = await account(t),
      admin = await account(t, "ADMIN");
    await expect(
      a.session.mutation(api.messaging.create, {
        subject: "Private message",
        body: "Hello",
        recipientId: b.id,
      }),
    ).rejects.toThrow(/Forbidden/);
    const id = await admin.session.mutation(api.messaging.create, {
      subject: "مراجعة الهوية",
      body: "يرجى تأكيد بياناتك",
      recipientId: a.id,
    });
    const list = await a.session.query(api.messaging.list, {
      paginationOpts: { cursor: null, numItems: 20 },
    });
    expect(list.page[0]._id).toBe(id);
    await a.session.mutation(api.messaging.reply, {
      conversationId: id,
      body: "تم التأكيد، شكراً",
      attachmentIds: [],
      clientReference: "arabic-reply-001",
    });
    const messages = await admin.session.query(api.messaging.messages, {
      conversationId: id,
      paginationOpts: { cursor: null, numItems: 20 },
    });
    expect(messages.page.map((row) => row.body)).toContain("تم التأكيد، شكراً");
    await expect(
      b.session.query(api.messaging.messages, {
        conversationId: id,
        paginationOpts: { cursor: null, numItems: 20 },
      }),
    ).rejects.toThrow(/not found/);
    await expect(
      b.session.mutation(api.messaging.reply, {
        conversationId: id,
        body: "Unauthorized",
        attachmentIds: [],
        clientReference: "other-reply-001",
      }),
    ).rejects.toThrow(/not found/);
  });
  it("records successful writes and private navigation without form contents or query strings", async () => {
    const t = setup(),
      a = await account(t),
      admin = await account(t, "ADMIN");
    await a.session.mutation(api.users.updateMyProfile, { name: "اسم جديد" });
    await a.session.mutation(api.activity.record, {
      kind: "PAGE_VIEW",
      path: "/dashboard/account?nin=12345678901",
    });
    const result = await admin.session.query(api.activity.list, {
      userId: a.id,
      paginationOpts: { cursor: null, numItems: 30 },
    });
    expect(
      result.page.some(
        (row) =>
          row.entityId === "users:updateMyProfile" &&
          row.action === "OPERATION_COMPLETED",
      ),
    ).toBe(true);
    expect(
      result.page.some((row) => row.entityId === "/dashboard/account"),
    ).toBe(true);
    expect(JSON.stringify(result)).not.toContain("12345678901");
    await expect(
      a.session.query(api.activity.list, {
        paginationOpts: { cursor: null, numItems: 30 },
      }),
    ).rejects.toThrow(/Forbidden/);
    await expect(
      a.session.mutation(api.activity.record, {
        kind: "PAGE_VIEW",
        path: "https://example.com",
      }),
    ).rejects.toThrow(/Invalid activity/);
  });
});
