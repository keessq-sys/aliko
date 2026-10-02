import type { Cookies } from "@sveltejs/kit";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { env } from "$env/dynamic/public";

const options = { path: "/", httpOnly: true, sameSite: "lax" as const };
type Tokens = { token: string; refreshToken: string };
export function authClient() {
  if (
    !env.PUBLIC_CONVEX_URL ||
    env.PUBLIC_CONVEX_URL.includes("preview-placeholder")
  )
    throw new Error("Authentication is not configured");
  return new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
}
export function saveSession(cookies: Cookies, url: URL, tokens: Tokens) {
  cookies.set("__convexAuthJWT", tokens.token, {
    ...options,
    secure: url.protocol === "https:",
    maxAge: 3600,
  });
  cookies.set("__convexAuthRefresh", tokens.refreshToken, {
    ...options,
    secure: url.protocol === "https:",
    maxAge: 30 * 86400,
  });
}
export function clearSession(cookies: Cookies) {
  cookies.delete("__convexAuthJWT", { path: "/" });
  cookies.delete("__convexAuthRefresh", { path: "/" });
}
export async function sessionToken(
  cookies: Cookies,
  url: URL,
  force = false,
): Promise<string | null> {
  const token = cookies.get("__convexAuthJWT");
  if (token && !force) {
    try {
      const client = authClient();
      client.setAuth(token);
      const profile = await client.query(
        makeFunctionReference<"query">("users:getMyProfile"),
        {},
      );
      if (profile) return token;
    } catch {
      // An expired JWT can still have a valid refresh session. Convex verifies
      // every returned token; parsing a JWT locally never grants access.
    }
  }
  const refreshToken = cookies.get("__convexAuthRefresh");
  if (!refreshToken) {
    if (token) clearSession(cookies);
    return null;
  }
  if (refreshToken.length > 256 || refreshToken.split("|").length !== 2) {
    clearSession(cookies);
    return null;
  }
  // Convex Auth implements transactional refresh rotation and a reuse window
  // for concurrent requests across workers; do not cache session secrets here.
  const client = authClient();
  const result: any = await client.action(
    makeFunctionReference<"action">("auth:signIn"),
    { refreshToken },
  );
  const tokens: Tokens | null = result.tokens ?? null;
  if (!tokens) {
    clearSession(cookies);
    return null;
  }
  client.setAuth(tokens.token);
  const profile = await client.query(
    makeFunctionReference<"query">("users:getMyProfile"),
    {},
  );
  if (!profile) {
    clearSession(cookies);
    return null;
  }
  saveSession(cookies, url, tokens);
  return tokens.token;
}
