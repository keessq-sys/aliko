import { json } from "@sveltejs/kit";
import { makeFunctionReference } from "convex/server";
import { ConvexError } from "convex/values";
import {
  authClient,
  saveSession,
  clearSession,
  sessionToken,
} from "$lib/server/auth-session";
import type { RequestHandler } from "./$types";
const ref = makeFunctionReference<"action">("auth:signIn");
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
export const POST: RequestHandler = async ({ request, cookies, url }) => {
  if (request.headers.get("origin") !== url.origin)
    return json({ error: "Forbidden" }, { status: 403, headers });
  try {
    const body = await request.text();
    if (body.length > 16384)
      return json({ error: "Request is too large" }, { status: 413, headers });
    const args = JSON.parse(body);
    const flows = [
      "signUp",
      "signIn",
      "reset",
      "reset-verification",
      "email-verification",
    ];
    if (
      args.provider !== "password" ||
      !args.params ||
      !flows.includes(args.params.flow)
    )
      return json(
        { error: "Invalid authentication request" },
        { status: 400, headers },
      );
    args.params.email = String(args.params.email ?? "")
      .trim()
      .toLowerCase();
    // Fresh credentials must not inherit an expired or different account JWT.
    const convex = authClient();
    const result: any = await convex.action(ref, {
      provider: "password",
      params: args.params,
    });
    if (result.tokens) {
      convex.setAuth(result.tokens.token);
      const profile: any = await convex.query(
        makeFunctionReference<"query">("users:getMyProfile"),
        {},
      );
      if (!profile) throw new Error("PROFILE_UNAVAILABLE");
      saveSession(cookies, url, result.tokens);
      return json({ signedIn: true, role: profile.role }, { headers });
    }
    return json({ signedIn: false }, { headers });
  } catch (error) {
    const message =
      error instanceof ConvexError && typeof error.data === "string"
        ? error.data
        : error instanceof Error
          ? error.message
          : "";
    const safeMessage =
      /InvalidAccountId|InvalidSecret|Invalid credentials/i.test(message)
        ? "Email or password is incorrect."
        : /already exists|AccountAlreadyExists/i.test(message)
          ? "An account with this email already exists. Please sign in."
          : /Accept the current Terms/i.test(message)
            ? "Accept the current Terms and Privacy Policy before registration."
            : "Authentication could not be completed. Check your details and try again. If this continues, contact support.";
    const knownMessages = [
      "Email or password is incorrect.",
      "Password recovery email is not configured. Please contact support.",
      "The recovery code is invalid or expired.",
      "This account is suspended. Contact support.",
      "Provide a valid name and email",
    ];
    return json(
      { error: knownMessages.includes(message) ? message : safeMessage },
      { status: 400, headers },
    );
  }
};
export const GET: RequestHandler = async ({ request, cookies, url }) => {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return json({ error: "Forbidden" }, { status: 403, headers });
  try {
    return json(
      {
        token: await sessionToken(
          cookies,
          url,
          url.searchParams.get("refresh") === "1",
        ),
      },
      { headers },
    );
  } catch {
    // A network outage must not delete a customer's refresh session.
    return json(
      { error: "Session verification is temporarily unavailable" },
      { status: 503, headers },
    );
  }
};
export const DELETE: RequestHandler = async ({ request, cookies, url }) => {
  if (request.headers.get("origin") !== url.origin)
    return json({ error: "Forbidden" }, { status: 403, headers });
  try {
    const token = await sessionToken(cookies, url);
    if (token) {
      const client = authClient();
      client.setAuth(token);
      await client.action(makeFunctionReference<"action">("auth:signOut"), {});
    }
  } catch {
    return json(
      { error: "Sign out could not be confirmed. Please retry." },
      { status: 503, headers },
    );
  }
  clearSession(cookies);
  return json({ signedIn: false }, { headers });
};
