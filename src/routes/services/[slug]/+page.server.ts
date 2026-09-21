// src/routes/services/[slug]/+page.server.ts
// Per-service SEO + Service/Breadcrumb schema, built from the same static
// SERVICES catalog the page component already renders from client-side
// (src/lib/types/services.ts) — no new data source, so this can never drift
// from what the page actually shows. serviceBySlug() returning undefined for
// an unknown slug 404s here rather than rendering a blank/misleading page.
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildMeta, absoluteUrl } from '$lib/seo';
import { buildBreadcrumbSchema, buildServiceSchema } from '$lib/schema/builders';
import { buildPageGraph } from '$lib/schema/graph';
import { SERVICE_CATEGORY_META, serviceBySlug } from '$lib/types/services';

export const load: PageServerLoad = async ({ params }) => {
  const service = serviceBySlug(params.slug);
  if (!service) throw error(404, 'Service not found');

  const canonical = absoluteUrl(`/services/${service.slug}`);
  const seo = buildMeta({
    title: `${service.name} Services in Nigeria | Aliko Diamond Key`,
    description: service.tagline,
    canonical,
    openGraph: { type: 'website', image: absoluteUrl(service.image) }
  });

  seo.jsonLd = buildPageGraph([
    buildServiceSchema({
      name: service.name,
      description: service.tagline,
      url: canonical,
      image: absoluteUrl(service.image),
      category: SERVICE_CATEGORY_META[service.category]?.label ?? service.category,
      areaServed: ['Abuja FCT', 'Lagos', 'Nigeria'],
      priceFrom: service.startingPrice,
      priceCurrency: 'NGN'
    }),
    buildBreadcrumbSchema([
      { name: 'Home', url: absoluteUrl('/') },
      { name: 'Services', url: absoluteUrl('/services') },
      { name: service.name, url: canonical }
    ])
  ]);

  return { seo };
};
