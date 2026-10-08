import { json } from "@sveltejs/kit";
import { ConvexError } from "convex/values";
import { api } from "$lib/convex/_generated/api";
import {
  authClient,
  saveSession,
  sessionToken,
} from "$lib/server/auth-session";
import type { RequestHandler } from "./$types";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
export const POST: RequestHandler = async ({ request, cookies, url }) => {
  if (request.headers.get("origin") !== url.origin)
    return json({ error: "Forbidden" }, { status: 403, headers });
  let accountReady = false;
  try {
    const text = await request.text();
    if (text.length > 16384)
      return json({ error: "Request is too large" }, { status: 413, headers });
    const body = JSON.parse(text);
    if (
      !body ||
      !["AGENT", "MANAGER"].includes(body.kind) ||
      !body.application ||
      typeof body.submissionKey !== "string" ||
      !/^[a-zA-Z0-9-]{16,80}$/.test(body.submissionKey)
    )
      return json(
        { error: "Invalid enrolment request" },
        { status: 400, headers },
      );
    if (
      body.kind === "MANAGER" &&
      (typeof body.application.address !== "string" ||
        body.application.address.trim().length < 10)
    )
      return json(
        { error: "Provide your full legal address before checkout." },
        { status: 400, headers },
      );
    const client = authClient();
    let token = await sessionToken(cookies, url);
    if (!token) {
      const registration = body.registration;
      if (!registration || !["signUp", "signIn"].includes(registration.flow))
        return json(
          { error: "Provide your account access details." },
          { status: 400, headers },
        );
      const application = body.application;
      const result: any = await client.action(api.auth.signIn, {
        provider: "password",
        params: {
          flow: registration.flow,
          email: String(application.email ?? "")
            .trim()
            .toLowerCase(),
          name:
            body.kind === "MANAGER"
              ? application.contactName
              : application.fullName,
          companyName: application.companyName,
          role: body.kind === "MANAGER" ? "ESTATE_MANAGER" : "AGENT",
          agencyName: application.agencyName,
          operatingState: application.operatingState,
          operatingLga: application.operatingLga,
          whatsapp:
            body.kind === "MANAGER"
              ? application.phone
              : application.whatsapp || application.phone,
          password: registration.password,
          nin: registration.nin,
          acceptKycConsent: registration.acceptKycConsent,
          acceptPolicies: registration.acceptPolicies,
          policyVersion: "2026-10-03",
        },
      });
      if (!result.tokens)
        throw new Error("Account authentication was not completed.");
      token = result.tokens.token;
      client.setAuth(token!);
      const profile = await client.query(api.users.getMyProfile, {});
      if (!profile) throw new Error("Account profile is unavailable.");
      saveSession(cookies, url, result.tokens);
    } else client.setAuth(token);
    accountReady = true;
    const application = {
      ...body.application,
      email: String(body.application.email ?? "")
        .trim()
        .toLowerCase(),
      submissionKey: body.submissionKey,
    };
    if (body.kind === "MANAGER") {
      const saved = await client.mutation(
        api.partners.submitManagerApplication,
        application,
      );
      const order = await client.mutation(api.checkout.create, {
        kind: "MANAGER",
        targetId: saved.id,
      });
      return json(
        {
          accountReady,
          applicationId: saved.id,
          redirect: `/checkout/${encodeURIComponent(order.reference)}`,
        },
        { headers },
      );
    }
    const saved = await client.mutation(
      api.partners.submitAgentApplication,
      application,
    );
    return json(
      { accountReady, applicationId: saved.id, reference: saved.reference },
      { headers },
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return json(
        { error: "Invalid enrolment request" },
        { status: 400, headers },
      );
    const message =
      error instanceof ConvexError && typeof error.data === "string"
        ? error.data
        : error instanceof Error
          ? error.message
          : "";
    const safe =
      /password|NIN|consent|Terms|state|LGA|WhatsApp|account email|legal address|InvalidAccount|InvalidSecret|already exists|already associated|required|enrolment request|Provide a valid|different plan/i.test(
        message,
      );
    const invalidCredentials =
      /InvalidAccount|InvalidSecret|Invalid credentials/i.test(message);
    return json(
      {
        accountReady,
        error: invalidCredentials
          ? "Email or password is incorrect."
          : safe
            ? message
            : accountReady
              ? "Your account is ready. Enrolment or checkout could not be completed; please retry without refilling the form."
              : "Account creation could not be completed. Please retry.",
      },
      { status: safe ? 400 : 503, headers },
    );
  }
};
