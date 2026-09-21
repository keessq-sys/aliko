// src/routes/glossary/[term]/+page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildMeta, absoluteUrl } from '$lib/seo';
import { buildBreadcrumbSchema, buildDefinedTermSchema } from '$lib/schema/builders';
import { buildPageGraph } from '$lib/schema/graph';
import { glossaryTermBySlug } from '$lib/data/glossary';

export const load: PageServerLoad = async ({ params }) => {
  const term = glossaryTermBySlug(params.term);
  if (!term) throw error(404, 'Glossary term not found');

  const canonical = absoluteUrl(`/glossary/${term.slug}`);
  const seo = buildMeta({
    title: `${term.term} — Definition | Aliko Diamond Key Glossary`,
    description: term.shortDefinition,
    canonical,
    openGraph: { type: 'article', image: absoluteUrl('/og/glossary.png') }
  });

  seo.jsonLd = buildPageGraph([
    buildDefinedTermSchema({
      name: term.term,
      description: term.definition,
      url: canonical,
      inDefinedTermSet: absoluteUrl('/glossary')
    }),
    buildBreadcrumbSchema([
      { name: 'Home', url: absoluteUrl('/') },
      { name: 'Glossary', url: absoluteUrl('/glossary') },
      { name: term.term, url: canonical }
    ])
  ]);

  return { seo, term };
};
