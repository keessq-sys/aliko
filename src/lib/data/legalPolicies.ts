export const POLICY_VERSION = "2026-10-03";

export type LegalPolicy = {
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
};

export const legalPolicies: Record<string, LegalPolicy> = {
  terms: {
    title: "Terms of Service",
    summary:
      "Rules for using the Aliko Diamond Key platform and requesting property or professional services.",
    sections: [
      {
        heading: "Using the platform",
        body: [
          "You must provide accurate account and transaction information, protect your sign-in credentials, and use the platform only for lawful property and service transactions.",
          "Listings, availability and prices may change until a written offer, reservation or contract is accepted. Verification badges describe checks completed by ADK; they are not a substitute for independent legal and technical advice.",
        ],
      },
      {
        heading: "Accounts and acceptable use",
        body: [
          "We may restrict or suspend accounts used for fraud, impersonation, abuse, unauthorized access, scraping or attempts to bypass payment, identity or security controls.",
          "Agents and managers may access customer information only for assigned work and must comply with confidentiality and data-protection duties.",
        ],
      },
      {
        heading: "Liability and disputes",
        body: [
          "Contracts, allocation documents and provider-specific terms govern completed transactions. Nigerian law applies, subject to any dispute process stated in the signed transaction document.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    summary:
      "How ADK collects, uses, shares, secures and deletes personal information.",
    sections: [
      {
        heading: "Information we process",
        body: [
          "We process account and contact details, property and service activity, payment references, support messages, security logs, and identity-verification results. We do not intentionally store full card data. We collect your NIN with explicit consent during registration. It is encrypted in a restricted identity record; general profiles and account lists show only a masked number. Only the super administrator can reveal it after a recent security check, and every reveal is audited.",
        ],
      },
      {
        heading: "Purposes and sharing",
        body: [
          "We use information to operate accounts, verify identity and title, fulfil requests, prevent fraud, process payments, prepare documents and meet legal duties.",
          "We share the minimum required information with contracted payment, messaging, identity, e-signature, hosting and professional-service providers. We do not sell personal information.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You may request access, correction or deletion, subject to transaction, anti-fraud, tax and property-record retention duties. Contact support from your signed-in account so we can verify the request.",
        ],
      },
    ],
  },
  "kyc-consent": {
    title: "KYC Consent",
    summary:
      "Consent and notices for identity checks used in property and regulated transactions.",
    sections: [
      {
        heading: "Your authorization",
        body: [
          "By submitting your NIN, you authorize ADK to collect and encrypt it for account records and administrator review. The application checks the 11-digit format only; it does not perform government identity verification or send your NIN to QoreID.",
          "Consent is recorded with this policy version. You can withdraw before processing begins; completed checks and transaction evidence may be retained where law, fraud prevention or a legal claim requires it.",
        ],
      },
      {
        heading: "Possible outcomes",
        body: [
          "A result may be verified, pending, failed or inconclusive. Automated results do not by themselves deny a customer a service. Failed or inconclusive results are referred for manual review and you may provide corrected evidence.",
        ],
      },
      {
        heading: "Data minimisation",
        body: [
          "ADK stores your encrypted NIN, a keyed duplicate-detection fingerprint, verification evidence, consent version and timestamps in restricted records. Raw NINs are excluded from application logs and general profile records. An administrator may separately review authorized identity evidence. A green format indicator is not proof of identity.",
        ],
      },
    ],
  },
  "payments-refunds": {
    title: "Payment and Refund Policy",
    summary:
      "Payment confirmation, reservation, refunds and chargeback handling.",
    sections: [
      {
        heading: "Payment confirmation",
        body: [
          "A checkout redirect or bank debit is not final confirmation. ADK marks a payment successful only after server-side verification with the payment provider. Duplicate callbacks are ignored.",
          "Property reservation and allocation remain subject to availability, verified identity, cleared funds and the signed transaction documents.",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "Refund eligibility depends on the signed offer, service stage, statutory charges and work already performed. Approved refunds return through the original provider where possible and may take the provider or bank processing period.",
          "Report an unknown or incorrect transaction promptly from your account. ADK records refund authorization and reconciliation for audit.",
        ],
      },
    ],
  },
  "data-retention": {
    title: "Data Retention Policy",
    summary:
      "Retention categories and deletion controls for customer, transaction and uploaded records.",
    sections: [
      {
        heading: "Retention approach",
        body: [
          "Account preferences and inactive drafts are retained only while operationally useful. Service attachments have a configured expiry and are deleted by scheduled processing. Property, payment, legal and audit evidence is retained for the applicable contractual and statutory period.",
          "KYC evidence is restricted and retained only for the verification, legal and fraud-prevention period. Quarantined or rejected uploads are removed under the security retention schedule.",
        ],
      },
      {
        heading: "Deletion and backups",
        body: [
          "Deletion removes active records and marks the action in an audit trail. Encrypted backups expire on their own schedule, and deleted data is not restored into active use except during documented disaster recovery.",
        ],
      },
    ],
  },
  "e-signature": {
    title: "Electronic Signature Disclosure",
    summary:
      "Consent to receive, review and sign transaction documents electronically.",
    sections: [
      {
        heading: "Electronic records",
        body: [
          "You agree that offer letters, deeds, payment schedules and notices may be delivered and signed electronically. Typing your profile name with explicit consent records your account, name, timestamp and document version. This is an acknowledgement for administrator review and does not replace any witnessing, registration or signature formalities required for a property transfer.",
          "You may request a downloadable copy. If you withdraw electronic consent before signing, contact support for the available paper process; this may delay completion.",
        ],
      },
      {
        heading: "Requirements",
        body: [
          "You need a current email address, internet access and software capable of displaying PDF documents. Keep your contact details current and review every document before signing.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie and Analytics Notice",
    summary: "Essential session storage and optional measurement technologies.",
    sections: [
      {
        heading: "Essential storage",
        body: [
          "ADK uses essential cookies or local storage for authentication, security, theme preferences and transaction continuity. These are required for the requested service.",
          "Optional analytics or advertising storage will require a consent choice before activation. ADK does not currently treat acceptance of essential storage as consent to optional tracking.",
        ],
      },
    ],
  },
};
