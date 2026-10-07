import { json } from "@sveltejs/kit";
import { sessionToken, authClient } from "$lib/server/auth-session";
import { api } from "$lib/convex/_generated/api";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ cookies, url, locals }) => {
  const token = await sessionToken(cookies, url, false, locals).catch(() => null);
  if (!token) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const client = authClient(); client.setAuth(token);
    return json(await client.query(api.settings.health, {}), { headers: { "Cache-Control": "no-store" } });
  } catch { return json({ error: "Forbidden" }, { status: 403 }); }
};
