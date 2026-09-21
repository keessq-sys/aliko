/**
 * Structured glossary: definition-dense entries for Nigerian real-estate and
 * land-title terminology. Written to be directly quotable — each definition
 * is a single, self-contained, factually-grounded paragraph an AI answer
 * engine can extract without needing the rest of the page for context.
 * Powers /glossary (index) and /glossary/[term] (one DefinedTerm page each).
 */

export interface GlossaryTerm {
  slug: string;
  term: string;
  shortDefinition: string;
  definition: string;
  /** Plain-text citations/sources, rendered as <cite> links. */
  sources?: Array<{ label: string; href: string }>;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    slug: 'certificate-of-occupancy',
    term: 'Certificate of Occupancy (C of O)',
    shortDefinition:
      'A document issued by a Nigerian state government granting the holder a statutory right of occupancy over a specific parcel of land.',
    definition:
      "A Certificate of Occupancy (C of O) is the primary evidence of a statutory right of occupancy over land in Nigeria, issued under the Land Use Act 1978 by a State Governor (or the FCT Minister, for land in Abuja). It confirms who currently holds legal occupancy rights to a specific plot and is one of the documents Aliko Diamond Key's legal team verifies against the relevant State Ministry of Lands (or AGIS for FCT listings) before any plot is published on the platform."
    // MANUAL STEP: add a verified citation (e.g. the official Land Use Act
    // 1978 text or a State Ministry of Lands page) once a real URL is
    // confirmed — never ship a placeholder/guessed source URL.
  },
  {
    slug: 'governors-consent',
    term: "Governor's Consent",
    shortDefinition:
      "Statutory approval a State Governor must give before an interest in land under a Certificate of Occupancy can be validly transferred, mortgaged or sublet.",
    definition:
      "Governor's Consent is the approval a State Governor (or FCT Minister) must grant under Section 22 of the Land Use Act before an existing right of occupancy — typically evidenced by a C of O — can be validly assigned, mortgaged, transferred or sublet to a third party. A sale without Governor's Consent is void as against the Governor, which is why Aliko Diamond Key's title-verification step confirms consent status before a resale property is listed."
  },
  {
    slug: 'deed-of-assignment',
    term: 'Deed of Assignment',
    shortDefinition:
      'The legal document that formally transfers an interest in land from a seller (assignor) to a buyer (assignee) in Nigeria.',
    definition:
      "A Deed of Assignment is the legal instrument by which a seller (the assignor) transfers their interest in a parcel of land to a buyer (the assignee) in Nigeria. It records the parties, the property description, the consideration paid, and is typically stamped and registered at the relevant State Lands Registry. Aliko Diamond Key issues and verifies a Deed of Assignment as part of every completed plot or property purchase."
  },
  {
    slug: 'agis',
    term: 'AGIS (Abuja Geographic Information System)',
    shortDefinition:
      "The FCT Administration's land information and title-registry system for Abuja.",
    definition:
      'AGIS (Abuja Geographic Information System) is the Federal Capital Territory Administration\'s digital land-information and title-registry platform, used to record and verify land allocations, titles and cadastral data for land within Abuja. For every FCT-listed plot, Aliko Diamond Key cross-checks title information against AGIS records as part of its pre-listing verification process.'
  },
  {
    slug: 'diaspora-property-purchase',
    term: 'Diaspora Property Purchase',
    shortDefinition:
      'A remote property or land purchase process for Nigerians (or foreign buyers) living outside Nigeria, completed without a physical site visit.',
    definition:
      'A diaspora property purchase is a real-estate or land transaction completed by a buyer living outside Nigeria, using virtual site-visit scheduling, secure remote payment and digital-signature document verification in place of an in-person visit. Aliko Diamond Key runs a dedicated diaspora onboarding flow so a buyer never needs to be physically present in Nigeria to complete a purchase.'
  }
];

export function glossaryTermBySlug(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((t) => t.slug === slug);
}
