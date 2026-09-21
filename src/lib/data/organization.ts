/**
 * Single source of truth for brand, organization and author facts used by
 * the SEO layer, JSON-LD schema builders, the footer, and llms.txt content.
 * Change values here once — every schema/meta consumer picks it up.
 */

export const SITE_URL = 'https://alikodiamondkey.com';
export const SITE_NAME = 'Aliko Diamond Key';
export const SITE_TAGLINE =
  "Nigeria's government-verified real estate, land and property-services marketplace.";
export const SITE_LOCALE = 'en-NG';
export const SITE_LANGUAGE = 'en';

export const ORGANIZATION = {
  legalName: 'Aliko Diamond Key Realtors Ltd',
  displayName: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  // MANUAL STEP: confirm this is the correct public-facing support address
  // for alikodiamondkey.com (currently copied from the live footer).
  email: 'contact@adk.com',
  telephone: '+2347047669943',
  address: {
    addressLocality: 'Abuja',
    addressRegion: 'FCT',
    addressCountry: 'NG'
  },
  // Secondary office referenced site-wide (Lagos) — kept as a second
  // areaServed entry rather than a second postal address since only one
  // registered address is confirmed.
  areaServed: ['Abuja FCT', 'Lagos', 'Nigeria'],
  sameAs: [
    // MANUAL STEP: fill in verified social/profile URLs. Each one added here
    // strengthens the Organization entity graph for Knowledge Panel eligibility.
    // 'https://www.linkedin.com/company/aliko-diamond-key',
    // 'https://twitter.com/alikodiamondkey',
    // 'https://www.instagram.com/alikodiamondkey',
  ] as string[]
};

export const PRIMARY_AUTHOR = {
  name: 'Ali Ahmed Ali Abubakar',
  role: 'Chief Executive Officer',
  // MANUAL STEP: add a real headshot to static/authors/ali-ahmed-ali-abubakar.jpg
  // (min 400x400px) then set image below — a real photo materially
  // strengthens E-E-A-T. Left undefined so AuthorCard doesn't render a
  // broken-image placeholder for a file that doesn't exist yet.
  image: undefined as string | undefined,
  bio: 'Founder and CEO of Aliko Diamond Key Realtors Ltd, overseeing verified property, land and property-services delivery across Nigeria.',
  sameAs: [] as string[]
};

/** Core topics/entities the site is authoritative on — feeds llms.txt, the
 *  homepage schema, and internal-linking cluster guidance. */
export const CORE_TOPICS = [
  'Verified property & land listings in Nigeria',
  'Land title verification (C of O, Governor’s Consent, Deed of Assignment)',
  'Diaspora property purchase & remote onboarding',
  'Interior design, decoration & furnishing',
  'Building materials & Turkish tiles supply',
  'Smart-home installation',
  'Construction, renovation & general contracting',
  'Architectural design & space planning',
  'Property development & facility management',
  'Verified real-estate agent & estate-manager network'
];
