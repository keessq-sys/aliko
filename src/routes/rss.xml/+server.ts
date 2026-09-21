// src/routes/rss.xml/+server.ts
// AI-friendly RSS 2.0 feed. Several AI content aggregators and answer
// engines poll RSS as a lightweight "what's new / what's authoritative"
// signal distinct from crawling the sitemap. This app has no blog yet, so
// the feed currently surfaces the service catalog (real, stable content) —
// swap/extend the `items` builder for real blog entries the day one exists;
// never fabricate feed items for content that doesn't exist.
import type { RequestHandler } from './$types';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '$lib/data/organization';
import { SERVICES } from '$lib/types/services';

const CONTENT_LAST_MODIFIED = new Date('2026-09-21T00:00:00.000Z');

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async () => {
  const items = SERVICES.map((service) => ({
    title: service.name,
    link: `${SITE_URL}/services/${service.slug}`,
    description: service.tagline,
    pubDate: CONTENT_LAST_MODIFIED
  }));

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_TAGLINE)}</description>
    <language>en-NG</language>
    <lastBuildDate>${CONTENT_LAST_MODIFIED.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
};
