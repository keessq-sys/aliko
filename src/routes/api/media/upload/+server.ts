import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { env } from '$env/dynamic/public';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 15_000_000;

function detectedImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.slice(0, 8).every((b, i) => b === [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][i])) return 'image/png';
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(4, 8)) === 'ftyp' && ['avif', 'avis'].includes(new TextDecoder().decode(bytes.slice(8, 12)))) return 'image/avif';
  return null;
}

export const POST: RequestHandler = async ({ request, platform, locals, cookies }) => {
  if (!locals.user?._id || !['ADMIN', 'AGENT', 'ESTATE_MANAGER'].includes(locals.user.role ?? '')) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const bucket = platform?.env?.MEDIA;
  if (!bucket) return json({ error: 'R2 media binding is not configured' }, { status: 503 });
  const form = await request.formData();
  const file = form.get('file');
  const collection = String(form.get('collection') ?? 'property').replace(/[^a-z0-9-]/gi, '').toLowerCase();
  if (!(file instanceof File)) return json({ error: 'Image file is required' }, { status: 400 });
  if (!ALLOWED.has(file.type) || file.size < 1 || file.size > MAX_BYTES) {
    return json({ error: 'Use a JPG, PNG, WebP or AVIF image no larger than 15 MB' }, { status: 400 });
  }
  const data = await file.arrayBuffer();
  const actualType = detectedImageType(new Uint8Array(data).slice(0, 32));
  if (!actualType || actualType !== file.type.toLowerCase()) {
    return json({ error: 'The file contents do not match the declared image type' }, { status: 400 });
  }
  const extension = actualType === 'image/jpeg' ? 'jpg' : actualType.split('/')[1];
  const key = `${collection}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  await bucket.put(key, data, {
    httpMetadata: { contentType: actualType, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { ownerId: locals.user._id, uploadedByRole: locals.user.role ?? 'UNKNOWN', originalName: file.name.slice(0, 180) }
  });
  try {
    const token = cookies.get('__convexAuthJWT');
    if (!token || !env.PUBLIC_CONVEX_URL) throw new Error('Missing authenticated Convex session');
    const client = new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
    client.setAuth(token);
    await client.mutation(makeFunctionReference<'mutation'>('r2Assets:register'), {
      key, collection, fileName: file.name.slice(0, 180), mimeType: actualType, size: file.size
    });
  } catch (error) {
    await bucket.delete(key);
    console.error('R2 ownership registration failed', error instanceof Error ? error.message : 'unknown error');
    return json({ error: 'The upload could not be registered safely' }, { status: 500 });
  }
  return json({ key, url: `/api/media/${key}` }, { status: 201 });
};
