import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { transform } from "esbuild";
import { convexTest } from "convex-test";
import { generateKeyPair, exportPKCS8, decodeJwt } from "jose";
import { ConvexError } from "convex/values";
import { getFunctionName } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
const modules = import.meta.glob("../../convex/**/*.ts");
let routeCode = "";
beforeAll(async () => {
  const source = readFileSync(
    new URL("../../src/routes/api/auth/enrolment/+server.ts", import.meta.url),
    "utf8",
  )
    .replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, "")
    .replace(/export /g, "");
  const compiled = await transform(source, { loader: "ts", target: "es2022" });
  routeCode = compiled.code;
  const { privateKey } = await generateKeyPair("RS256", { extractable: true });
  vi.stubEnv("JWT_PRIVATE_KEY", await exportPKCS8(privateKey));
  vi.stubEnv("CONVEX_SITE_URL", "https://test.convex.site");
  vi.stubEnv("NIN_ENCRYPTION_KEY", btoa("0123456789abcdef0123456789abcdef"));
});
afterAll(() => vi.unstubAllEnvs());
async function setup(failCheckoutOnce = false) {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  let actor: ReturnType<typeof t.withIdentity> = t;
  let token: string | null = null;
  const client = {
    setAuth: (jwt: string) => {
      actor = t.withIdentity({ subject: decodeJwt(jwt).sub! });
    },
    action: (ref: any, args: any) => actor.action(ref, args),
    query: (ref: any, args: any) => actor.query(ref, args),
    mutation: async (ref: any, args: any) => {
      if (failCheckoutOnce && getFunctionName(ref) === "checkout:create") {
        failCheckoutOnce = false;
        throw new Error("Simulated checkout interruption");
      }
      return actor.mutation(ref, args);
    },
  };
  const saved = vi.fn((_cookies: any, _url: any, tokens: any) => {
    token = tokens.token;
  });
  const post = new Function(
    "json",
    "ConvexError",
    "api",
    "authClient",
    "saveSession",
    "sessionToken",
    routeCode + ";return POST;",
  )(
    (body: any, init: any = {}) =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: { ...init.headers, "content-type": "application/json" },
      }),
    ConvexError,
    api,
    () => client,
    saved,
    async () => token,
  );
  const submit = async (body: any, origin = "https://app.example") =>
    post({
      request: new Request("https://app.example/api/auth/enrolment", {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      cookies: {},
      url: new URL("https://app.example/api/auth/enrolment"),
    });
  return { t, submit, saved, client };
}
const registration = {
  flow: "signUp",
  password: "Strong-test-password-482!",
  nin: "12345678901",
  acceptKycConsent: true,
  acceptPolicies: true,
};
const manager = {
  kind: "MANAGER",
  submissionKey: "test-manager-submission-001",
  registration,
  application: {
    companyName: "Test Management",
    contactName: "Manager Applicant",
    email: "manager@example.com",
    phone: "+2348000000000",
    address: "10 Test Road, Ikeja, Lagos",
    operatingState: "Lagos",
    operatingLga: "Ikeja",
    statesOfOperation: ["Lagos"],
    portfolioSize: "11-50",
    plan: "PROFESSIONAL",
  },
};
describe("single-form account, enrolment and checkout HTTP journey", () => {
  it("creates one manager account, encrypted identity, application and owned checkout, with safe retries", async () => {
    const { t, submit, saved } = await setup();
    const first = await submit(manager);
    expect(first.status).toBe(200);
    const result = await first.json();
    expect(result).toMatchObject({ accountReady: true });
    expect(result.redirect).toMatch(/^\/checkout\/ADK-ORDER-/);
    const retry = await submit({ ...manager, registration: undefined });
    expect(await retry.json()).toEqual(result);
    expect(saved).toHaveBeenCalledTimes(1);
    const rows = await t.run(async (ctx) => ({
      users: await ctx.db.query("users").collect(),
      identities: await ctx.db.query("identities").collect(),
      managers: await ctx.db.query("estateManagers").collect(),
      orders: await ctx.db.query("checkoutOrders").collect(),
    }));
    expect(rows.users).toHaveLength(1);
    expect(rows.users[0]).toMatchObject({
      role: "CLIENT",
      requestedAccountType: "ESTATE_MANAGER",
      address: manager.application.address,
    });
    expect(rows.identities).toHaveLength(1);
    expect(rows.identities[0].ninCipher).not.toContain(registration.nin);
    expect(rows.managers).toHaveLength(1);
    expect(rows.orders).toHaveLength(1);
    expect(rows.orders[0]).toMatchObject({
      ownerId: rows.users[0]._id,
      targetId: String(rows.managers[0]._id),
      amount: 75000,
      status: "DRAFT",
    });
  });
  it("keeps the account and submitted details when checkout fails, then resumes without another signup", async () => {
    const { t, submit, saved } = await setup(true);
    const failed = await submit(manager);
    expect(failed.status).toBe(503);
    expect(await failed.json()).toMatchObject({ accountReady: true });
    const retry = await submit({ ...manager, registration: undefined });
    expect(retry.status).toBe(200);
    expect(saved).toHaveBeenCalledTimes(1);
    expect(
      await t.run((ctx) => ctx.db.query("estateManagers").collect()),
    ).toHaveLength(1);
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(
      1,
    );
  });
  it("creates an agent account and application in one submission without granting an approved role", async () => {
    const { t, submit } = await setup();
    const body = {
      kind: "AGENT",
      submissionKey: "test-agent-submission-001",
      registration,
      application: {
        fullName: "Agent Applicant",
        email: "agent@example.com",
        phone: "+2348000000000",
        whatsapp: "+2348000000000",
        operatingState: "Lagos",
        operatingLga: "Ikeja",
        statesOfOperation: ["Lagos"],
        agencyName: "Test Agency",
        experience: "1-3",
        specializations: ["Residential Sales"],
      },
    };
    const response = await submit(body);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.reference).toMatch(/^ADK-AGT-/);
    expect(await (await submit(body)).json()).toEqual(result);
    const users = await t.run((ctx) => ctx.db.query("users").collect());
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      role: "CLIENT",
      requestedAccountType: "AGENT",
    });
    const applications = await t.run((ctx) =>
      ctx.db.query("agentApplications").collect(),
    );
    expect(applications).toHaveLength(1);
    expect(applications[0]).toMatchObject({
      userId: users[0]._id,
      status: "PENDING",
      agencyName: "Test Agency",
    });
  });
  it("rejects cross-origin calls, administrator enrolment, incomplete signup and foreign account details", async () => {
    const { t, submit } = await setup();
    expect((await submit(manager, "https://foreign.example")).status).toBe(403);
    expect((await submit({ ...manager, kind: "ADMIN" })).status).toBe(400);
    expect((await submit(null)).status).toBe(400);
    expect(
      (
        await submit({
          ...manager,
          application: { ...manager.application, address: "" },
        })
      ).status,
    ).toBe(400);
    expect(
      (await submit({ ...manager, registration: { ...registration, nin: "" } }))
        .status,
    ).toBe(400);
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(
      0,
    );
    expect((await submit(manager)).status).toBe(200);
    expect(
      (
        await submit({
          ...manager,
          application: { ...manager.application, email: "foreign@example.com" },
        })
      ).status,
    ).toBe(400);
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(
      1,
    );
  });
});
