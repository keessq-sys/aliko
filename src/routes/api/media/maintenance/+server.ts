import { json } from "@sveltejs/kit";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { env } from "$env/dynamic/public";
import type { RequestHandler } from "./$types";

const GRACE_MS = 24 * 60 * 60 * 1000;

/** Admin-run, bounded orphan cleanup. Every deletion is recorded in Convex. */
export const POST: RequestHandler = async ({
  request,
  platform,
  locals,
  cookies,
}) => {
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const maintenanceSecret = platform?.env?.MEDIA_MAINTENANCE_SECRET ?? "";
  const serviceAuthorized = Boolean(
    maintenanceSecret &&
    supplied.length === maintenanceSecret.length &&
    supplied
      .split("")
      .reduce(
        (difference, character, index) =>
          difference |
          (character.charCodeAt(0) ^ maintenanceSecret.charCodeAt(index)),
        0,
      ) === 0,
  );
  const adminAuthorized = Boolean(
    locals.user?._id && locals.user.role === "ADMIN",
  );
  if (!serviceAuthorized && !adminAuthorized)
    return json({ error: "Forbidden" }, { status: 403 });
  const bucket = platform?.env?.MEDIA;
  const token = cookies.get("__convexAuthJWT");
  if (!bucket || (!token && !serviceAuthorized) || !env.PUBLIC_CONVEX_URL)
    return json({ error: "Storage is unavailable" }, { status: 503 });

  const checkpoint = await bucket.get("system/maintenance-cursor.json");
  const saved: { cursor?: string } = checkpoint
    ? await new Response(checkpoint.body).json()
    : {};
  const listed = await bucket.list({ limit: 100, cursor: saved.cursor });
  const nextCursor = listed.truncated ? listed.cursor : undefined;
  const saveCheckpoint = () =>
    bucket.put(
      "system/maintenance-cursor.json",
      new TextEncoder().encode(
        JSON.stringify({ cursor: nextCursor, updatedAt: Date.now() }),
      ).buffer,
    );
  const candidates = listed.objects
    .filter(
      (object) =>
        !object.key.startsWith("system/") &&
        Date.now() - new Date(object.uploaded).getTime() >= GRACE_MS,
    )
    .map((object) => object.key)
    .slice(0, 100);
  if (!candidates.length) {
    await saveCheckpoint();
    return json({
      inspected: listed.objects.length,
      deleted: 0,
      more: listed.truncated,
    });
  }

  const client = new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
  if (token) client.setAuth(token);
  const registered = new Set(
    await client.query(
      makeFunctionReference<"query">(
        serviceAuthorized
          ? "r2Assets:findRegisteredKeysForMaintenance"
          : "r2Assets:findRegisteredKeys",
      ),
      serviceAuthorized
        ? { keys: candidates, secret: maintenanceSecret }
        : { keys: candidates },
    ),
  );
  const orphans = candidates.filter((key) => !registered.has(key));
  await Promise.all(orphans.map((key) => bucket.delete(key)));
  if (orphans.length)
    await client.mutation(
      makeFunctionReference<"mutation">(
        serviceAuthorized
          ? "r2Assets:recordScheduledOrphanCleanup"
          : "r2Assets:recordOrphanCleanup",
      ),
      serviceAuthorized
        ? { keys: orphans, secret: maintenanceSecret }
        : { keys: orphans },
    );
  await saveCheckpoint();
  return json({
    inspected: listed.objects.length,
    deleted: orphans.length,
    more: listed.truncated,
  });
};
