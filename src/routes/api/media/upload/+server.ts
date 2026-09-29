import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 15_000_000;

export const POST: RequestHandler = async ({ request, platform, locals }) => {
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
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const key = `${collection}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { ownerId: locals.user._id, uploadedByRole: locals.user.role ?? 'UNKNOWN', originalName: file.name.slice(0, 180) }
  });
  return json({ key, url: `/api/media/${key}` }, { status: 201 });
};
