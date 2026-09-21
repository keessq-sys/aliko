// src/lib/types/seo.ts
// Typed contract for every per-page SEO payload in the app. A +page.server.ts
// (or +layout.server.ts) returns a `PageSEO` from its load() function; the
// SEO.svelte component renders it into <svelte:head> server-side, so this
// type is the single thing every route author needs to get right.

export interface OpenGraphMeta {
  title: string;
  description: string;
  /** Absolute URL, 1200x630px recommended. */
  image: string;
  imageAlt?: string;
  url: string;
  type: 'website' | 'article' | 'profile' | 'product';
  locale: string;
  siteName: string;
}

export interface TwitterMeta {
  card: 'summary' | 'summary_large_image';
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
  /** MANUAL STEP: set once a verified @handle exists. */
  site?: string;
  creator?: string;
}

export type RobotsDirective =
  | 'index, follow'
  | 'noindex, nofollow'
  | 'noindex, follow'
  | 'index, nofollow';

export interface PageSEO {
  title: string;
  description: string;
  /** Absolute canonical URL for this exact page. */
  canonical: string;
  robots: RobotsDirective;
  openGraph: OpenGraphMeta;
  twitter: TwitterMeta;
  /** Pre-serialized JSON-LD `@graph` document (see src/lib/schema/graph.ts).
   *  Built and stringified inside a server load() so it ships in the initial
   *  HTML response — never assembled client-side. */
  jsonLd?: string;
  /** ISO 8601. Drives both the visible "Last updated" UI and dateModified
   *  in any Article/Service/DefinedTerm schema on the page. */
  datePublished?: string;
  dateModified?: string;
  /** Alternate-language URLs for hreflang, keyed by locale (e.g. "en-NG"). */
  alternates?: Record<string, string>;
}

/** Minimal shape a route's load() can return when it only wants to override
 *  a few fields on top of the layout defaults (see src/lib/seo.ts#buildMeta). */
export type PageSEOOverride = Partial<Omit<PageSEO, 'openGraph' | 'twitter'>> & {
  openGraph?: Partial<OpenGraphMeta>;
  twitter?: Partial<TwitterMeta>;
};

export interface SchemaBase {
  '@context': 'https://schema.org';
}
