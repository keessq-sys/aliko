// src/lib/seo.ts
// buildMeta() merges layout-level defaults with a page's overrides into a
// complete, typed PageSEO. Call this inside a +layout.server.ts / +page.server.ts
// load() function — never in a component — so the result is available in the
// server-rendered HTML before any client JS runs.
import type { PageSEO, PageSEOOverride } from '$lib/types/seo';
import { ORGANIZATION, SITE_LOCALE, SITE_NAME, SITE_TAGLINE, SITE_URL } from '$lib/data/organization';

/** Site-wide fallback — every field a page doesn't override comes from here. */
export const defaultSEO: PageSEO = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description:
    "Browse government-verified property and land listings across Nigeria, bundle interior design, construction or smart-home services with your purchase, and buy remotely from anywhere in the world.",
  canonical: SITE_URL,
  robots: 'index, follow',
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      'Government-verified property, land and property-services marketplace across Nigeria.',
    image: `${SITE_URL}/og/default.png`,
    imageAlt: `${SITE_NAME} — verified Nigerian real estate`,
    url: SITE_URL,
    type: 'website',
    locale: SITE_LOCALE.replace('-', '_'),
    siteName: SITE_NAME
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      'Government-verified property, land and property-services marketplace across Nigeria.',
    image: `${SITE_URL}/og/default.png`,
    imageAlt: `${SITE_NAME} — verified Nigerian real estate`
  }
};

/**
 * Merge a page-level override on top of the cascaded defaults. OpenGraph and
 * Twitter are merged shallowly per-field so a page can override just `title`
 * without having to restate `image`/`url`/etc.
 */
export function buildMeta(overrides: PageSEOOverride = {}, base: PageSEO = defaultSEO): PageSEO {
  const canonical = overrides.canonical ?? base.canonical;
  const title = overrides.title ?? base.title;
  const description = overrides.description ?? base.description;

  return {
    ...base,
    ...overrides,
    title,
    description,
    canonical,
    openGraph: {
      ...base.openGraph,
      title,
      description,
      url: canonical,
      ...overrides.openGraph
    },
    twitter: {
      ...base.twitter,
      title,
      description,
      ...overrides.twitter
    }
  };
}

/** Convenience for building an absolute canonical/OG URL from a route path. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export { ORGANIZATION, SITE_NAME, SITE_URL, SITE_LOCALE };
