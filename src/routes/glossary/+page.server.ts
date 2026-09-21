// src/routes/glossary/+page.server.ts
import type { PageServerLoad } from './$types';
import { buildMeta, absoluteUrl } from '$lib/seo';
import { buildBreadcrumbSchema } from '$lib/schema/builders';
import { buildPageGraph } from '$lib/schema/graph';
import { GLOSSARY_TERMS } from '$lib/data/glossary';

export const load: PageServerLoad = async () => {
  const seo = buildMeta({
    title: 'Real Estate & Land-Title Glossary | Aliko Diamond Key',
    description:
      'Plain-language definitions of Nigerian real-estate and land-title terms: Certificate of Occupancy, Governor’s Consent, Deed of Assignment, AGIS and more.',
    canonical: absoluteUrl('/glossary'),
    openGraph: { type: 'website', image: absoluteUrl('/og/glossary.png') }
  });

  seo.jsonLd = buildPageGraph([
    buildBreadcrumbSchema([
      { name: 'Home', url: absoluteUrl('/') },
      { name: 'Glossary', url: absoluteUrl('/glossary') }
    ])
  ]);

  return { seo, terms: GLOSSARY_TERMS };
};
