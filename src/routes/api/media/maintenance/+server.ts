import { json } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { env } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

const GRACE_MS = 24 * 60 * 60 * 1000;

/** Admin-run, bounded orphan cleanup. Every deletion is recorded in Convex. */
export const POST: RequestHandler = async ({ platform, locals, cookies }) => {
  if (!locals.user?._id || locals.user.role !== 'ADMIN') return json({ error: 'Forbidden' }, { status: 403 });
  const bucket = platform?.env?.MEDIA;
  const token = cookies.get('__convexAuthJWT');
  if (!bucket || !token || !env.PUBLIC_CONVEX_URL) return json({ error: 'Storage is unavailable' }, { status: 503 });

  const listed = await bucket.list({ limit: 100 });
  const candidates = listed.objects
    .filter((object) => Date.now() - new Date(object.uploaded).getTime() >= GRACE_MS)
    .map((object) => object.key)
    .slice(0, 100);
  if (!candidates.length) return json({ inspected: listed.objects.length, deleted: 0, more: listed.truncated });

  const client = new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
  client.setAuth(token);
  const registered = new Set(await client.query(
    makeFunctionReference<'query'>('r2Assets:findRegisteredKeys'), { keys: candidates }
  ));
  const orphans = candidates.filter((key) => !registered.has(key));
  await Promise.all(orphans.map((key) => bucket.delete(key)));
  if (orphans.length) await client.mutation(
    makeFunctionReference<'mutation'>('r2Assets:recordOrphanCleanup'), { keys: orphans }
  );
  return json({ inspected: listed.objects.length, deleted: orphans.length, more: listed.truncated });
};
