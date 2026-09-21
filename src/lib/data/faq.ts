/**
 * Canonical FAQ dataset. This is the single source of truth consumed by:
 *  - the homepage FAQ accordion (src/lib/components/home/FAQSection.svelte)
 *  - the dedicated /faq page
 *  - the server-rendered FAQPage JSON-LD schema (src/lib/schema/builders.ts)
 * Keeping one array means the visible answer text and the schema answer
 * text can never drift apart — a common AEO/GEO trust failure.
 */

export interface FaqItem {
  id: string;
  category: 'Buying & Titles' | 'Payments & Diaspora' | 'Agents & Partners' | 'Services';
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    id: 'title-verification',
    category: 'Buying & Titles',
    q: 'How does Aliko Diamond Key verify property and land titles?',
    a: "Every plot and property is cross-checked against CAC company records, AGIS land registry data (for FCT listings) and the relevant State Ministry of Lands before it goes live, and title documents (C of O, Governor's Consent, Deed of Assignment) are verified by our legal team ahead of any booking."
  },
  {
    id: 'bundled-services',
    category: 'Services',
    q: 'Can I bundle a property purchase with interior design or renovation services?',
    a: 'Yes. From any property or land listing you can request a bundled quote that combines the purchase with interior design, furnishing, smart-home installation, renovation or construction — delivered under one contract with one point of contact.'
  },
  {
    id: 'diaspora-buying',
    category: 'Payments & Diaspora',
    q: 'How do diaspora clients buy property remotely?',
    a: 'Diaspora clients get a dedicated onboarding flow, virtual site-visit scheduling, secure remote payments, and document verification with digital signature — you never need to be in Nigeria to complete a purchase.'
  },
  {
    id: 'payment-plans',
    category: 'Payments & Diaspora',
    q: 'What payment plans are available?',
    a: 'Most plots and properties support outright payment or installment plans (typically 6 or 12 months), tracked in your client portal with automatic reminders before each due date.'
  },
  {
    id: 'become-agent',
    category: 'Agents & Partners',
    q: 'How do I become a verified agent or estate manager on the platform?',
    a: 'Agents apply through a 5-step verification wizard (identity, agency details, coverage area, documents, review); estate management companies apply through a separate enrolment flow reviewed by our admin team before activation.'
  },
  {
    id: 'facility-management',
    category: 'Services',
    q: 'Does Aliko Diamond Key offer facility and property management services?',
    a: 'Yes — beyond brokerage, our property development and facility management division handles ongoing maintenance, vendor coordination and estate operations for both individual owners and estate managers.'
  },
  {
    id: 'is-it-safe',
    category: 'Buying & Titles',
    q: 'Is it safe to buy land in Nigeria through Aliko Diamond Key?',
    a: 'Yes. Aliko Diamond Key only lists plots and properties that have passed title verification against government land registries, and every booking is logged with a reference number you can track from your client dashboard.'
  },
  {
    id: 'response-time',
    category: 'Services',
    q: 'How fast do I get a quote after submitting a service request?',
    a: 'Service requests (interior design, supply, construction, smart-home, brokerage) go directly to the super-admin desk, and you receive a quote and a dedicated contact within 48 hours.'
  }
];

export function faqsByCategory(): Record<string, FaqItem[]> {
  return FAQS.reduce<Record<string, FaqItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});
}
