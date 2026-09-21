// src/routes/about/+page.server.ts
import type { PageServerLoad } from './$types';
import { buildMeta, absoluteUrl } from '$lib/seo';
import { buildBreadcrumbSchema, buildOrganizationSchema, buildPersonSchema } from '$lib/schema/builders';
import { buildPageGraph } from '$lib/schema/graph';
import { PRIMARY_AUTHOR } from '$lib/data/organization';

const DATE_MODIFIED = '2026-09-21T00:00:00.000Z';

export const load: PageServerLoad = async () => {
  const seo = buildMeta({
    title: 'About Aliko Diamond Key | Verified Real Estate in Nigeria',
    description:
      "Aliko Diamond Key Realtors Ltd's mission, title-verification methodology, and leadership — led by CEO Ali Ahmed Ali Abubakar.",
    canonical: absoluteUrl('/about'),
    openGraph: { type: 'profile', image: absoluteUrl('/og/about.png') },
    dateModified: DATE_MODIFIED
  });

  seo.jsonLd = buildPageGraph([
    buildOrganizationSchema(),
    buildPersonSchema({
      name: PRIMARY_AUTHOR.name,
      role: PRIMARY_AUTHOR.role,
      url: absoluteUrl('/about'),
      image: PRIMARY_AUTHOR.image,
      sameAs: PRIMARY_AUTHOR.sameAs
    }),
    buildBreadcrumbSchema([
      { name: 'Home', url: absoluteUrl('/') },
      { name: 'About', url: absoluteUrl('/about') }
    ])
  ]);

  return { seo, author: PRIMARY_AUTHOR, dateModified: DATE_MODIFIED };
};
