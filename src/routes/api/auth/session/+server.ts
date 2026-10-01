import { json } from "@sveltejs/kit";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { env } from "$env/dynamic/public";
import type { RequestHandler } from "./$types";
const ref = makeFunctionReference<"action">("auth:signIn");
const cookieOptions = { path: "/", httpOnly: true, sameSite: "lax" as const };
function client() {
  if (!env.PUBLIC_CONVEX_URL)
    throw new Error("Authentication is not configured");
  return new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
}
export const POST: RequestHandler = async ({ request, cookies, url }) => {
  if (request.headers.get("origin") !== url.origin)
    return json({ error: "Forbidden" }, { status: 403 });
  try {
    const args = await request.json();
    const convex = client();
    const current = cookies.get("__convexAuthJWT");
    if (current) convex.setAuth(current);
    const result: any = await convex.action(ref, args);
    if (result.tokens) {
      cookies.set("__convexAuthJWT", result.tokens.token, {
        ...cookieOptions,
        secure: url.protocol === "https:",
        maxAge: 3600,
      });
      cookies.set("__convexAuthRefresh", result.tokens.refreshToken, {
        ...cookieOptions,
        secure: url.protocol === "https:",
        maxAge: 30 * 86400,
      });
      convex.setAuth(result.tokens.token);
      const profile: any = await convex.query(
        makeFunctionReference<"query">("users:getMyProfile"),
        {},
      );
      return json({ signedIn: true, role: profile?.role });
    }
    return json({ signedIn: false });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Authentication failed",
      },
      { status: 400 },
    );
  }
};
export const GET: RequestHandler = async ({ cookies, url }) => {
  const refreshToken = cookies.get("__convexAuthRefresh");
  if (!refreshToken)
    return json({ token: null }, { headers: { "Cache-Control": "no-store" } });
  try {
    const result: any = await client().action(ref, { refreshToken });
    if (!result.tokens) throw new Error("Session expired");
    cookies.set("__convexAuthJWT", result.tokens.token, {
      ...cookieOptions,
      secure: url.protocol === "https:",
      maxAge: 3600,
    });
    cookies.set("__convexAuthRefresh", result.tokens.refreshToken, {
      ...cookieOptions,
      secure: url.protocol === "https:",
      maxAge: 30 * 86400,
    });
    return json(
      { token: result.tokens.token },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    cookies.delete("__convexAuthJWT", { path: "/" });
    cookies.delete("__convexAuthRefresh", { path: "/" });
    return json({ token: null }, { headers: { "Cache-Control": "no-store" } });
  }
};
export const DELETE: RequestHandler = async ({ request, cookies, url }) => {
  if (request.headers.get("origin") !== url.origin)
    return json({ error: "Forbidden" }, { status: 403 });
  const token = cookies.get("__convexAuthJWT");
  if (token) {
    const c = client();
    c.setAuth(token);
    await c
      .action(makeFunctionReference<"action">("auth:signOut"), {})
      .catch(() => {});
  }
  cookies.delete("__convexAuthJWT", { path: "/" });
  cookies.delete("__convexAuthRefresh", { path: "/" });
  return json({ signedIn: false });
};
