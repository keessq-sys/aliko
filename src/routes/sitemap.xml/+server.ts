// src/routes/sitemap.xml/+server.ts
// Dynamic sitemap: SvelteKit +server.ts GET handler, not a static file, so
// it can be regenerated on every request from the site's real content
// sources without a build step. Static/marketing routes are hardcoded;
// per-service and per-glossary-term routes are pulled from their catalog
// modules (SERVICE_SLUGS, GLOSSARY_TERMS) so adding a service or glossary
// entry automatically adds it to the sitemap with no manual edit here.
import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/data/organization';
import { SERVICE_SLUGS } from '$lib/types/services';
import { GLOSSARY_TERMS } from '$lib/data/glossary';

type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

interface SitemapEntry {
  path: string;
  lastmod: string;
  changefreq: ChangeFreq;
  priority: number;
}

/** Evergreen content pages get a fixed, updated-on-deploy lastmod rather than
 *  "now" — a sitemap that claims every page changed at the moment it was
 *  requested is a well-known trust smell to crawlers. Bump this constant
 *  whenever homepage/about/faq/glossary copy actually changes. */
const CONTENT_LAST_MODIFIED = '2026-09-21T00:00:00.000Z';

function buildEntries(): SitemapEntry[] {
  const now = new Date().toISOString();

  const staticEntries: SitemapEntry[] = [
    { path: '/', lastmod: CONTENT_LAST_MODIFIED, changefreq: 'daily', priority: 1.0 },
    // Live listings — content changes continuously via the booking system.
    { path: '/properties', lastmod: now, changefreq: 'daily', priority: 0.9 },
    { path: '/plots', lastmod: now, changefreq: 'daily', priority: 0.9 },
    { path: '/services', lastmod: CONTENT_LAST_MODIFIED, changefreq: 'weekly', priority: 0.8 },
    { path: '/agents', lastmod: CONTENT_LAST_MODIFIED, changefreq: 'weekly', priority: 0.6 },
    { path: '/map', lastmod: CONTENT_LAST_MODIFIED, changefreq: 'weekly', priority: 0.6 },
    { path: '/faq', lastmod: CONTENT_LAST_MODIFIED, changefreq: 'monthly', priority: 0.6 },
    { path: '/about', lastmod: CONTENT_LAST_MODIFIED, changefreq: 'monthly', priority: 0.6 },
    { path: '/glossary', lastmod: CONTENT_LAST_MODIFIED, changefreq: 'monthly', priority: 0.5 },
    { path: '/register/agent', lastmod: CONTENT_LAST_MODIFIED, changefreq: 'monthly', priority: 0.4 },
    { path: '/register/manager', lastmod: CONTENT_LAST_MODIFIED, changefreq: 'monthly', priority: 0.4 }
  ];

  const serviceEntries: SitemapEntry[] = SERVICE_SLUGS.map((slug) => ({
    path: `/services/${slug}`,
    lastmod: CONTENT_LAST_MODIFIED,
    changefreq: 'monthly',
    priority: 0.7
  }));

  const glossaryEntries: SitemapEntry[] = GLOSSARY_TERMS.map((term) => ({
    path: `/glossary/${term.slug}`,
    lastmod: CONTENT_LAST_MODIFIED,
    changefreq: 'yearly',
    priority: 0.5
  }));

  return [...staticEntries, ...serviceEntries, ...glossaryEntries];
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const GET: RequestHandler = async () => {
  const entries = buildEntries();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(SITE_URL + entry.path)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      // Edge-cacheable: Cloudflare respects this and serves from cache
      // between requests, avoiding a full sitemap rebuild on every hit.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
};
