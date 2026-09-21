// src/routes/+page.server.ts
// Homepage SEO + structured data, resolved entirely server-side. The H1 in
// +page.svelte's HeroSection already carries the primary keyword ("verified
// real estate" / "land" in Nigeria); this load() supplies the matching
// title/description/OG/Twitter/JSON-LD so the answer engine reading the SSR
// HTML sees a consistent entity across <title>, meta, and schema.
import type { PageServerLoad } from './$types';
import { buildMeta, absoluteUrl } from '$lib/seo';
import { buildFAQSchema } from '$lib/schema/builders';
import { buildPageGraph } from '$lib/schema/graph';
import { FAQS } from '$lib/data/faq';

export const load: PageServerLoad = async () => {
  const seo = buildMeta({
    title: "Verified Real Estate, Land & Property Services in Nigeria | Aliko Diamond Key",
    description:
      "Buy government-verified property and land in Abuja and Lagos, or bundle a purchase with interior design, construction and smart-home services. Diaspora-friendly, title-checked, zero fraud.",
    canonical: absoluteUrl('/'),
    openGraph: {
      type: 'website',
      image: absoluteUrl('/og/homepage.png')
    }
  });

  // The homepage's FAQ accordion (src/lib/components/home/FAQSection.svelte)
  // renders these exact questions/answers — the schema below must match the
  // rendered text 1:1, since a mismatch between visible content and JSON-LD
  // is treated as a spam signal by Google and reduces AI-citation trust.
  seo.jsonLd = buildPageGraph([
    buildFAQSchema(FAQS.map((f) => ({ question: f.q, answer: f.a })))
  ]);

  return { seo };
};
