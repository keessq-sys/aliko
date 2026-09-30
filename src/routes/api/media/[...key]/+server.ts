import type { RequestHandler } from './$types';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { env } from '$env/dynamic/public';

export const GET: RequestHandler = async ({ params, platform }) => {
  const bucket = platform?.env?.MEDIA;
  if (!bucket) return new Response('Media storage unavailable', { status: 503 });
  const key = params.key;
  if (!key || key.includes('..')) return new Response('Invalid media key', { status: 400 });
  const object = await bucket.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', object.httpMetadata?.cacheControl ?? 'public, max-age=86400');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(object.body, { headers });
};

export const DELETE: RequestHandler = async ({ params, platform, cookies }) => {
  const bucket = platform?.env?.MEDIA;
  if (!bucket) return new Response('Media storage unavailable', { status: 503 });
  const key = params.key;
  if (!key || key.includes('..')) return new Response('Invalid media key', { status: 400 });
  const token = cookies.get('__convexAuthJWT');
  if (!token || !env.PUBLIC_CONVEX_URL) return new Response('Unauthorized', { status: 401 });
  try {
    const client = new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
    client.setAuth(token);
    const allowed = await client.query(makeFunctionReference<'query'>('r2Assets:authorizeDelete'), { key });
    if (!allowed) return new Response('Not found', { status: 404 });
    await bucket.delete(key);
    await client.mutation(makeFunctionReference<'mutation'>('r2Assets:markDeleted'), { key });
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return new Response(message.includes('Forbidden') ? 'Forbidden' : 'Delete failed', {
      status: message.includes('Forbidden') ? 403 : 500
    });
  }
};
