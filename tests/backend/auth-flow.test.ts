import { convexTest } from "convex-test";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { generateKeyPair, exportPKCS8, decodeJwt, jwtVerify } from "jose";
import rateLimiter from "@convex-dev/rate-limiter/test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
const modules = import.meta.glob("../../convex/**/*.ts");
let verificationKey: CryptoKey;
beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  verificationKey = publicKey;
  vi.stubEnv("JWT_PRIVATE_KEY", await exportPKCS8(privateKey));
  vi.stubEnv("CONVEX_SITE_URL", "https://auth-test.convex.site");
});
afterAll(() => vi.unstubAllEnvs());
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}
const credentials = {
  email: "buyer@example.com",
  password: "Test-password-482!",
};
async function signup(t: ReturnType<typeof setup>) {
  return t.action(api.auth.signIn, {
    provider: "password",
    params: {
      ...credentials,
      flow: "signUp",
      name: "Test Buyer",
      isDiaspora: true,
      acceptPolicies: true,
      policyVersion: "2026-10-01",
      role: "ADMIN",
    },
  });
}
describe("real Convex password account lifecycle", () => {
  it("persists a safe profile, policies, hashed credentials and an accessible session", async () => {
    const t = setup();
    const result = await signup(t);
    expect(result.tokens?.token).toBeTruthy();
    await jwtVerify(result.tokens!.token, verificationKey, {
      issuer: "https://auth-test.convex.site",
      audience: "convex",
    });
    const subject = decodeJwt(result.tokens!.token).sub!;
    const authenticated = t.withIdentity({ subject });
    const profile = await authenticated.query(api.users.getMyProfile, {});
    expect(profile).toMatchObject({
      email: credentials.email,
      name: "Test Buyer",
      role: "CLIENT",
      isDiaspora: true,
    });
    const records = await t.run(async (ctx) => ({
      accounts: await ctx.db.query("authAccounts").collect(),
      policies: await ctx.db.query("policyAcceptances").collect(),
      audit: await ctx.db.query("adminAuditLog").collect(),
    }));
    expect(records.accounts).toHaveLength(1);
    expect(records.accounts[0].secret).not.toBe(credentials.password);
    expect(records.policies).toHaveLength(2);
    expect(records.audit.map((row) => row.action)).toContain(
      "ACCOUNT_SIGNED_IN",
    );
    await authenticated.mutation(api.users.updateMyProfile, {
      name: "Updated Buyer",
      phone: "+2348000000000",
    });
    expect(await authenticated.query(api.users.getMyProfile, {})).toMatchObject(
      { name: "Updated Buyer", phone: "+2348000000000" },
    );
    const login = await t.action(api.auth.signIn, {
      provider: "password",
      params: { ...credentials, flow: "signIn" },
    });
    expect(decodeJwt(login.tokens!.token).sub!.split("|")[0]).toBe(
      profile!._id,
    );
    await authenticated.action(api.auth.signOut, {});
    expect(await authenticated.query(api.users.getMyProfile, {})).toBeNull();
  });
  it("refreshes access and denies revoked or suspended sessions", async () => {
    const t = setup();
    const result = await signup(t);
    const refreshed = await t.action(api.auth.signIn, {
      refreshToken: result.tokens!.refreshToken,
    });
    expect(refreshed.tokens?.refreshToken).toBeTruthy();
    const authenticated = t.withIdentity({
      subject: decodeJwt(refreshed.tokens!.token).sub!,
    });
    const profile = await authenticated.query(api.users.getMyProfile, {});
    expect(profile?.email).toBe(credentials.email);
    await t.run((ctx) =>
      ctx.db.patch(profile!._id, { accountStatus: "SUSPENDED" }),
    );
    expect(await authenticated.query(api.users.getMyProfile, {})).toBeNull();
    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: { ...credentials, flow: "signIn" },
      }),
    ).rejects.toThrow(/suspended/);
  });
  it("stores professional onboarding against the account without granting roles", async () => {
    const t = setup();
    const result = await t.action(api.auth.signIn, {
      provider: "password",
      params: {
        ...credentials,
        flow: "signUp",
        name: "Agent Applicant",
        role: "AGENT",
        agencyName: "Test Agency",
        acceptPolicies: true,
        policyVersion: "2026-10-01",
      },
    });
    const authenticated = t.withIdentity({
      subject: decodeJwt(result.tokens!.token).sub!,
    });
    const profile = await authenticated.query(api.users.getMyProfile, {});
    expect(profile).toMatchObject({
      role: "CLIENT",
      requestedAccountType: "AGENT",
      agencyName: "Test Agency",
    });
    const application = await authenticated.mutation(
      api.partners.submitAgentApplication,
      {
        fullName: "Agent Applicant",
        email: credentials.email,
        phone: "+2348000000000",
        agencyName: "Test Agency",
      },
    );
    expect(await t.run((ctx) => ctx.db.get(application.id))).toMatchObject({
      userId: profile!._id,
      status: "PENDING",
    });
    await expect(
      authenticated.mutation(api.partners.submitAgentApplication, {
        fullName: "Other",
        email: "someone-else@example.com",
        phone: "+2348000000000",
      }),
    ).rejects.toThrow(/account email/);
  });
  it("rejects incorrect passwords and unaccepted policies without creating users", async () => {
    const t = setup();
    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: { ...credentials, flow: "signUp" },
      }),
    ).rejects.toThrow(/Accept the current Terms/);
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(
      0,
    );
    await signup(t);
    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: { ...credentials, password: "wrong-password", flow: "signIn" },
      }),
    ).rejects.toThrow(/Email or password is incorrect/);
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: { ...credentials, flow: "reset" },
      }),
    ).rejects.toThrow(/Password recovery email is not configured/);
    vi.stubEnv("RESEND_API_KEY", "test-configured-key");
    const unknownReset = await t.action(api.auth.signIn, {
      provider: "password",
      params: { flow: "reset", email: "unknown@example.com" },
    });
    expect(unknownReset.tokens).toBeNull();
  });
  it("links manager enrollment and company details to the signed-in account", async () => {
    const t = setup();
    const result = await t.action(api.auth.signIn, {
      provider: "password",
      params: {
        ...credentials,
        flow: "signUp",
        name: "Manager Applicant",
        role: "ESTATE_MANAGER",
        companyName: "Test Management",
        acceptPolicies: true,
        policyVersion: "2026-10-01",
      },
    });
    const authenticated = t.withIdentity({
      subject: decodeJwt(result.tokens!.token).sub!,
    });
    const profile = await authenticated.query(api.users.getMyProfile, {});
    expect(profile).toMatchObject({
      role: "CLIENT",
      requestedAccountType: "ESTATE_MANAGER",
      companyName: "Test Management",
    });
    const application = await authenticated.mutation(
      api.partners.submitManagerApplication,
      {
        companyName: "Test Management",
        contactName: "Manager Applicant",
        email: credentials.email,
        phone: "+2348000000000",
        statesOfOperation: ["Lagos"],
        plan: "STARTER",
      },
    );
    expect(await t.run((ctx) => ctx.db.get(application.id))).toMatchObject({
      userId: profile!._id,
      status: "PENDING",
    });
  });
});

describe("designated administrator and account isolation", () => {
  it("rejects weak passwords without persisting an account", async () => {
    const t = setup();
    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: {
          ...credentials,
          password: "weak",
          flow: "signUp",
          acceptPolicies: true,
          policyVersion: "2026-10-01",
        },
      }),
    ).rejects.toThrow(/12|uppercase/);
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(
      0,
    );
  });
  it("requires sign out before an authenticated account can sign up or sign in again", async () => {
    const t = setup();
    const result = await signup(t);
    const actor = t.withIdentity({
      subject: decodeJwt(result.tokens!.token).sub!,
    });
    for (const flow of ["signUp", "signIn", "email-verification"]) {
      await expect(
        actor.action(api.auth.signIn, {
          provider: "password",
          params: {
            ...credentials,
            flow,
            acceptPolicies: true,
            policyVersion: "2026-10-01",
          },
        }),
      ).rejects.toThrow(/Sign out/);
    }
  });
  it("provisions only the operator-designated administrator and reserves public signup", async () => {
    vi.stubEnv("SUPER_ADMIN_EMAIL", "owner@example.com");
    vi.stubEnv("SUPER_ADMIN_PASSWORD", "Administrator-482!Pass");
    try {
      const t = setup();
      await expect(
        t.action(api.auth.signIn, {
          provider: "password",
          params: {
            email: "owner@example.com",
            password: "Administrator-482!Pass",
            flow: "signUp",
            acceptPolicies: true,
            policyVersion: "2026-10-01",
          },
        }),
      ).rejects.toThrow(/reserved/);
      expect(await t.action(internal.superAdmin.provision, {})).toEqual({
        configured: true,
      });
      const login = await t.action(api.auth.signIn, {
        provider: "password",
        params: {
          email: "owner@example.com",
          password: "Administrator-482!Pass",
          flow: "signIn",
        },
      });
      const actor = t.withIdentity({
        subject: decodeJwt(login.tokens!.token).sub!,
      });
      expect(await actor.query(api.users.getMyProfile, {})).toMatchObject({
        role: "ADMIN",
        email: "owner@example.com",
      });
      const users = await t.run((ctx) => ctx.db.query("users").collect());
      expect(users).toHaveLength(1);
    } finally {
      delete process.env.SUPER_ADMIN_EMAIL;
      delete process.env.SUPER_ADMIN_PASSWORD;
    }
  });
});
