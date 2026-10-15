import { convexTest } from "convex-test";
import { describe, it, expect, vi, afterEach } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { emitAlert } from "../../convex/lib/alerts";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}
async function user(
  t: ReturnType<typeof setup>,
  role: "ADMIN" | "CLIENT" | "AGENT" = "CLIENT",
) {
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      name: "Test account",
      email: `${crypto.randomUUID()}@example.com`,
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
  return { id, session: t.withIdentity({ subject: `${id}|${session}` }) };
}
afterEach(() => vi.unstubAllEnvs());
describe("private notifications and reviewed broadcasts", () => {
  it("keeps alerts private, deduplicates event keys and defaults external channels off", async () => {
    const t = setup(),
      a = await user(t),
      b = await user(t);
    const id = await t.run((ctx) =>
      emitAlert(ctx, {
        userId: a.id,
        eventKey: "event-one",
        title: "Account update",
        message: "Private",
        href: "/dashboard/account",
        category: "TEST",
      }),
    );
    const repeat = await t.run((ctx) =>
      emitAlert(ctx, {
        userId: a.id,
        eventKey: "event-one",
        title: "Account update",
        message: "Private",
        href: "/dashboard/account",
        category: "TEST",
      }),
    );
    expect(repeat).toBe(id);
    expect(await a.session.query(api.engagement.unread, {})).toBe(1);
    expect(
      (
        await b.session.query(api.engagement.inbox, {
          paginationOpts: { numItems: 10, cursor: null },
        })
      ).page,
    ).toHaveLength(0);
    await expect(
      b.session.mutation(api.engagement.markRead, { id: id! }),
    ).rejects.toThrow();
    await a.session.mutation(api.engagement.markRead, { id: id! });
    expect(await a.session.query(api.engagement.unread, {})).toBe(0);
    expect(
      await t.run((ctx) => ctx.db.query("notificationLog").collect()),
    ).toHaveLength(0);
    expect(
      await t.run((ctx) => ctx.db.query("pushJobs").collect()),
    ).toHaveLength(0);
  });
  it("requires admin review, paginates broadcasts and makes repeated deliveries harmless", async () => {
    const t = setup(),
      admin = await user(t, "ADMIN"),
      a = await user(t),
      b = await user(t, "AGENT");
    await expect(
      a.session.mutation(api.engagement.draftBroadcast, {
        title: "Announcement",
        message: "Private update",
        audience: "ALL",
        email: true,
        device: true,
      }),
    ).rejects.toThrow();
    const id = await admin.session.mutation(api.engagement.draftBroadcast, {
      title: "Announcement",
      message: "Private update",
      audience: "CLIENT",
      email: true,
      device: true,
    });
    await expect(
      admin.session.mutation(api.engagement.sendBroadcast, { id }),
    ).rejects.toThrow();
    await admin.session.mutation(api.engagement.reviewBroadcast, {
      id,
      approve: true,
    });
    await admin.session.mutation(api.engagement.sendBroadcast, { id });
    await t.finishAllScheduledFunctions(() => {});
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.status).toBe("SENT");
    expect(row?.recipients).toBe(1);
    expect(
      (
        await a.session.query(api.engagement.inbox, {
          paginationOpts: { cursor: null, numItems: 10 },
        })
      ).page,
    ).toHaveLength(1);
    expect(
      (
        await b.session.query(api.engagement.inbox, {
          paginationOpts: { cursor: null, numItems: 10 },
        })
      ).page,
    ).toHaveLength(0);
    await t.mutation(internal.engagement.deliverBroadcast, {
      id,
      cursor: null,
    });
    expect((await t.run((ctx) => ctx.db.get(id)))?.recipients).toBe(1);
    expect(
      await t.run((ctx) => ctx.db.query("notificationLog").collect()),
    ).toHaveLength(0);
  });
  it("rechecks opt-in before delivering and prevents foreign device removal and SSRF endpoints", async () => {
    const t = setup(),
      a = await user(t),
      b = await user(t);
    await a.session.mutation(api.engagement.savePreferences, {
      email: true,
      device: true,
      broadcasts: true,
    });
    const endpoint = "https://fcm.googleapis.com/fcm/send/test-device";
    await a.session.mutation(api.engagement.subscribe, {
      endpoint,
      p256dh: "a".repeat(87),
      auth: "b".repeat(22),
    });
    await expect(
      a.session.mutation(api.engagement.subscribe, {
        endpoint: "https://127.0.0.1/private",
        p256dh: "a".repeat(87),
        auth: "b".repeat(22),
      }),
    ).rejects.toThrow();
    await b.session.mutation(api.engagement.removeDevice, { endpoint });
    expect(
      await t.run((ctx) => ctx.db.query("pushSubscriptions").collect()),
    ).toHaveLength(1);
    await a.session.mutation(api.engagement.testAlert, {});
    expect(
      await t.run((ctx) => ctx.db.query("pushJobs").collect()),
    ).toHaveLength(1);
    await a.session.mutation(api.engagement.savePreferences, {
      email: false,
      device: false,
      broadcasts: false,
    });
    expect(await t.mutation(internal.engagement.claimPush, {})).toHaveLength(0);
    expect(
      await t.mutation(internal.notifications.claimQueued, {}),
    ).toHaveLength(0);
    expect(
      (await t.run((ctx) => ctx.db.query("pushJobs").first()))?.status,
    ).toBe("FAILED");
  });
  it("allows recipients to reply to admin initiated messages and rejects unrelated accounts", async () => {
    const t = setup(),
      admin = await user(t, "ADMIN"),
      a = await user(t, "AGENT"),
      b = await user(t);
    const id = await admin.session.mutation(api.messaging.create, {
      recipientId: a.id,
      subject: "Private staff message",
      body: "Please review your workspace",
    });
    expect(
      (
        await a.session.query(api.messaging.list, {
          paginationOpts: { cursor: null, numItems: 10 },
        })
      ).page,
    ).toHaveLength(1);
    await a.session.mutation(api.messaging.reply, {
      conversationId: id,
      body: "Acknowledged",
      attachmentIds: [],
      clientReference: "reply-test-001",
    });
    await expect(
      b.session.query(api.messaging.messages, {
        conversationId: id,
        paginationOpts: { cursor: null, numItems: 10 },
      }),
    ).rejects.toThrow();
    await expect(
      b.session.mutation(api.messaging.create, {
        recipientId: a.id,
        subject: "Unauthorized",
        body: "No",
      }),
    ).rejects.toThrow();
    expect(
      (
        await admin.session.query(api.messaging.messages, {
          conversationId: id,
          paginationOpts: { cursor: null, numItems: 10 },
        })
      ).page,
    ).toHaveLength(2);
  });
  it("leases device jobs and does not log provider acceptance as confirmed display", async () => {
    const t = setup(),
      a = await user(t);
    await a.session.mutation(api.engagement.savePreferences, {
      email: false,
      device: true,
      broadcasts: false,
    });
    await a.session.mutation(api.engagement.subscribe, {
      endpoint: "https://fcm.googleapis.com/fcm/send/test",
      p256dh: "a".repeat(87),
      auth: "b".repeat(22),
    });
    await a.session.mutation(api.engagement.testAlert, {});
    const jobs = await t.mutation(internal.engagement.claimPush, {});
    expect(jobs).toHaveLength(1);
    expect(await t.mutation(internal.engagement.claimPush, {})).toHaveLength(0);
    await t.mutation(internal.engagement.finishPush, {
      id: jobs[0].id,
      leaseUntil: jobs[0].leaseUntil,
      ok: true,
      expired: false,
    });
    const log = await t.run((ctx) => ctx.db.query("notificationLog").first());
    expect(log?.status).toBe("SENT");
    expect(log?.message).toContain("display is not guaranteed");
  });
});
