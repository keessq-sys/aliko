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
  vi.stubEnv("NIN_ENCRYPTION_KEY", btoa("0123456789abcdef0123456789abcdef"));
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
  operatingState: "Lagos",
  operatingLga: "Ikeja",
  whatsapp: "+2348000000000",
  nin: "12345678901",
  acceptKycConsent: true,
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
      policyVersion: "2026-10-03",
      role: "ADMIN",
    },
  });
}
describe("real Convex password account lifecycle", () => {
  it("requires NIN and explicit identity consent for public signup and rejects duplicate identities", async () => {
    const t = setup();
    const params = {
      ...credentials,
      name: "مشتري تجريبي",
      flow: "signUp",
      acceptPolicies: true,
      policyVersion: "2026-10-03",
    };
    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: { ...params, nin: "" },
      }),
    ).rejects.toThrow(/11-digit/);
    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: { ...params, acceptKycConsent: false },
      }),
    ).rejects.toThrow(/consent/);
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(
      0,
    );
    await t.action(api.auth.signIn, { provider: "password", params });
    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: { ...params, email: "other@example.com" },
      }),
    ).rejects.toThrow(/associated/);
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(
      1,
    );
    const user = await t.run((ctx) => ctx.db.query("users").first());
    expect(user?.name).toBe("مشتري تجريبي");
    expect(user?.kycVerified).toBe(false);
    expect(user).not.toHaveProperty("registrationNinCipher");
  });
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
    expect(records.policies).toHaveLength(3);
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
        operatingState: "Lagos",
        operatingLga: "Ikeja",
        agencyName: "Test Agency",
        acceptPolicies: true,
        policyVersion: "2026-10-03",
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
        operatingState: "Lagos",
        operatingLga: "Ikeja",
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
        operatingState: "Lagos",
        operatingLga: "Ikeja",
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
        operatingState: "Lagos",
        operatingLga: "Ikeja",
        companyName: "Test Management",
        acceptPolicies: true,
        policyVersion: "2026-10-03",
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
        operatingState: "Lagos",
        operatingLga: "Ikeja",
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
          policyVersion: "2026-10-03",
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
            policyVersion: "2026-10-03",
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
      const legacy = await t.run(async (ctx) => {
        const id = await ctx.db.insert("users", {
          name: "Legacy administrator",
          email: "legacy@example.com",
          role: "ADMIN",
          isDiaspora: false,
          kycVerified: false,
          createdAt: Date.now(),
        });
        const session = await ctx.db.insert("authSessions", {
          userId: id,
          expirationTime: Date.now() + 3600000,
        });
        return { id, session };
      });
      await expect(
        t.action(api.auth.signIn, {
          provider: "password",
          params: {
            email: "owner@example.com",
            password: "Administrator-482!Pass",
            flow: "signUp",
            acceptPolicies: true,
            policyVersion: "2026-10-03",
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
      expect(users).toHaveLength(2);
      expect(users.filter((user) => user.role === "ADMIN")).toHaveLength(1);
      expect(await t.run((ctx) => ctx.db.get(legacy.id))).toMatchObject({
        role: "CLIENT",
      });
      expect(await t.run((ctx) => ctx.db.get(legacy.session))).toBeNull();
    } finally {
      delete process.env.SUPER_ADMIN_EMAIL;
      delete process.env.SUPER_ADMIN_PASSWORD;
    }
  });
});

describe("provider-independent onboarding and document consent", () => {
  async function admin(t: ReturnType<typeof setup>) {
    const id = await t.run((ctx) =>
      ctx.db.insert("users", {
        name: "Administrator",
        email: process.env.SUPER_ADMIN_EMAIL ?? "admin@example.invalid",
        role: "ADMIN",
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
    return t.withIdentity({ subject: `${id}|${sessionId}` });
  }
  it("stores signup and permits professional review with a submitted NIN without claiming verified identity", async () => {
    const t = setup(),
      result = await signup(t),
      client = t.withIdentity({
        subject: decodeJwt(result.tokens!.token).sub!,
      }),
      operator = await admin(t);
    const agent = await client.mutation(api.partners.submitAgentApplication, {
      fullName: "Test Buyer",
      email: credentials.email,
      phone: "08000000000",
      operatingState: "Lagos",
      operatingLga: "Ikeja",
    });
    await operator.mutation(api.partners.reviewAgentApplication, {
      id: agent.id,
      status: "APPROVED",
    });
    expect((await client.query(api.users.getMyProfile, {}))?.role).toBe(
      "AGENT",
    );
    await operator.mutation(api.partners.reviewAgentApplication, {
      id: agent.id,
      status: "REJECTED",
    });
    expect((await client.query(api.users.getMyProfile, {}))?.role).toBe(
      "CLIENT",
    );
    const manager = await client.mutation(
      api.partners.submitManagerApplication,
      {
        companyName: "Test company",
        contactName: "Test Buyer",
        email: credentials.email,
        phone: "08000000000",
        operatingState: "Lagos",
        operatingLga: "Ikeja",
        statesOfOperation: ["Lagos"],
        plan: "STARTER",
      },
    );
    await operator.mutation(api.partners.reviewManagerApplication, {
      id: manager.id,
      status: "APPROVED",
    });
    const profile = await client.query(api.users.getMyProfile, {});
    expect(profile?.role).toBe("ESTATE_MANAGER");
    expect(profile?.kycVerified).toBe(false);
    expect(await client.query(api.identity.status, {})).toMatchObject({
      status: "PENDING",
      formatValid: true,
    });
    await expect(
      client.mutation(api.partners.reviewManagerApplication, {
        id: manager.id,
        status: "APPROVED",
      }),
    ).rejects.toThrow(/ADMIN/);
    await operator.mutation(api.partners.reviewManagerApplication, {
      id: manager.id,
      status: "SUSPENDED",
    });
    expect((await client.query(api.users.getMyProfile, {}))?.role).toBe(
      "CLIENT",
    );
  });
  it("activates an owned image upload without configuring an external scanner", async () => {
    const t = setup(),
      operator = await admin(t);
    const bytes = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFv8AAAAASUVORK5CYII=",
      ),
      (ch) => ch.charCodeAt(0),
    );
    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob([bytes], { type: "image/png" })),
    );
    const assetId = await operator.mutation(api.storage.registerUpload, {
      storageId,
      purpose: "PROPERTY_IMAGE",
      fileName: "test.png",
      mimeType: "image/png",
      size: bytes.length,
    });
    expect(await t.run((ctx) => ctx.db.get(assetId))).toMatchObject({
      status: "ACTIVE",
      securityVersion: "2026-10-08-upload-metadata-v1",
    });
    expect(
      await operator.query(api.storage.getAssetUrl, { assetId }),
    ).toBeTruthy();
  });
  it("records owned typed consent and requires administrator review without a provider", async () => {
    const t = setup(),
      result = await signup(t),
      client = t.withIdentity({
        subject: decodeJwt(result.tokens!.token).sub!,
      }),
      operator = await admin(t);
    const profile = await client.query(api.users.getMyProfile, {});
    const id = await t.run((ctx) =>
      ctx.db.insert("legalDocuments", {
        type: "OFFER_LETTER",
        clientId: profile!._id,
        referenceCode: "CONSENT-TEST",
        status: "DRAFT",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    await operator.mutation(api.legalDocuments.requestTypedConsent, {
      documentId: id,
    });
    await expect(
      operator.mutation(api.legalDocuments.submitTypedConsent, {
        documentId: id,
        fullName: "Test Buyer",
        consent: true,
      }),
    ).rejects.toThrow(/Forbidden/);
    await expect(
      client.mutation(api.legalDocuments.submitTypedConsent, {
        documentId: id,
        fullName: "Someone else",
        consent: true,
      }),
    ).rejects.toThrow(/full name/);
    await client.mutation(api.legalDocuments.submitTypedConsent, {
      documentId: id,
      fullName: "Test Buyer",
      consent: true,
    });
    await client.mutation(api.legalDocuments.submitTypedConsent, {
      documentId: id,
      fullName: "Test Buyer",
      consent: true,
    });
    const doc = await t.run((ctx) => ctx.db.get(id));
    expect(doc).toMatchObject({
      status: "SIGNED",
      signatureMethod: "TYPED_CONSENT",
      typedConsentName: "Test Buyer",
      typedConsentBy: profile!._id,
    });
    expect(doc?.externalSignatureId).toBeUndefined();
    expect(
      await t.run((ctx) =>
        ctx.db
          .query("policyAcceptances")
          .filter((q) => q.eq(q.field("policy"), "E_SIGNATURE"))
          .collect(),
      ),
    ).toHaveLength(1);
    await expect(
      client.mutation(api.legalDocuments.reviewDocument, {
        documentId: id,
        decision: "VERIFIED",
      }),
    ).rejects.toThrow(/ADMIN/);
    await operator.mutation(api.legalDocuments.reviewDocument, {
      documentId: id,
      decision: "VERIFIED",
    });
    expect((await t.run((ctx) => ctx.db.get(id)))?.status).toBe("VERIFIED");
  });
});
