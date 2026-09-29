import type { RequestHandler } from './$types';

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
