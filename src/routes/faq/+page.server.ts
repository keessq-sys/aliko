// src/routes/faq/+page.server.ts
import type { PageServerLoad } from './$types';
import { buildMeta, absoluteUrl } from '$lib/seo';
import { buildFAQSchema, buildBreadcrumbSchema } from '$lib/schema/builders';
import { buildPageGraph } from '$lib/schema/graph';
import { FAQS } from '$lib/data/faq';

export const load: PageServerLoad = async () => {
  const seo = buildMeta({
    title: 'Frequently Asked Questions | Aliko Diamond Key',
    description:
      'Answers to the questions clients most often ask about title verification, diaspora buying, payment plans, and becoming a verified agent or estate manager.',
    canonical: absoluteUrl('/faq'),
    openGraph: { type: 'website', image: absoluteUrl('/og/faq.png') }
  });

  seo.jsonLd = buildPageGraph([
    buildFAQSchema(FAQS.map((f) => ({ question: f.q, answer: f.a }))),
    buildBreadcrumbSchema([
      { name: 'Home', url: absoluteUrl('/') },
      { name: 'FAQ', url: absoluteUrl('/faq') }
    ])
  ]);

  return { seo, faqs: FAQS };
};
