# Enterprise Integration Assessment

This document separates launch requirements from optional enhancements for Aliko Diamond Key. A provider is only considered connected when its production credentials, callback URLs, alerts, and end-to-end tests are configured.

## Priority assessment

| Capability | Provider / Convex feature | Priority | Current application state | Production action |
| --- | --- | --- | --- | --- |
| Primary payments | Flutterwave | Required | Hosted checkout, server verification, signed webhook, idempotent payment records and realtime booking updates implemented | Add production secret key and webhook secret hash; register the webhook URL; run a real low-value payment and refund test |
| Authentication and roles | Convex Auth | Required | Email/password auth, profiles and server-side dashboard role checks implemented | Configure email delivery, password policy, MFA/enterprise SSO decision, session revocation and recovery runbook |
| Transactional email | Resend | Required | Password-reset integration and notification foundation exist | Verify sending domain, SPF/DKIM/DMARC, production API key, templates and delivery alerts |
| Customer messaging | WhatsApp Business Cloud API | High | Outbound messages, inbound webhook route and admin human-review queue exist | Create Meta app/WABA, register webhook, subscribe to messages, add permanent token and app-secret signature validation |
| Identity verification | QoreID or equivalent Nigerian KYC provider | High | KYC records and review flow exist | Add live NIN/BVN credentials, consent text, retention rules, webhook verification and manual-review SLA |
| Electronic signatures | Dropbox Sign | High for remote closings; optional for browsing and enquiries | Document records, deed generation and signed-event receiver exist | Decide whether agreements must be signed in-app; if yes, add approved API app, templates, signer identity checks and embedded signing UI |
| Maps and geocoding | Google Maps Platform | High | Map component and static Nigeria-map fallback exist | Restrict API key by production domain/API, enable billing alerts and add geocoding/address validation |
| File and media storage | Convex Storage; Cloudflare R2 for large public media | Required | Convex attachment storage and ownership checks exist | Define malware scanning, MIME/size rules, lifecycle/retention, private download authorization and R2 CDN policy |
| Error monitoring | Sentry or equivalent | Required | Not yet connected | Capture frontend, Cloudflare and Convex exceptions with release IDs and PII redaction |
| Product analytics | PostHog, Plausible or equivalent | Recommended | Not yet connected | Track consent-aware enquiry, reservation and checkout funnels; exclude KYC/payment PII |
| Customer support | Zendesk, Intercom, Freshdesk or CRM | Recommended | In-app service-request and conversation system exists | Integrate only if the operations team needs ticket SLAs, omnichannel history and escalation |
| Accounting/reconciliation | Xero, QuickBooks or ERP | Recommended before volume | Convex is the operational payment ledger | Export verified payments, fees, refunds and settlement references; reconcile against Flutterwave settlements daily |
| Search | Algolia/Typesense only if catalogue scale requires it | Later | Convex indexed queries cover the current catalogue | Add external search when typo tolerance, facets or catalogue volume exceed the native query design |
| Observability/security | Cloudflare analytics/WAF plus a log/SIEM destination | Required | Security headers and server logs exist | Add WAF/bot rules, rate alerts, audit-log retention, incident alerts and centralized log streaming |

## Flutterwave production setup

1. Create or verify the business in the Flutterwave dashboard and switch to live mode only after test-mode acceptance checks pass.
2. Add `FLUTTERWAVE_SECRET_KEY` and `FLUTTERWAVE_SECRET_HASH` to the **production Convex deployment**, never to browser-visible variables.
3. In Flutterwave **Settings → Webhooks**, set the webhook URL to:

   `https://gallant-husky-352.eu-west-1.convex.site/webhooks/flutterwave`

4. Use the same long, randomly generated value for the Flutterwave dashboard secret hash and the Convex `FLUTTERWAVE_SECRET_HASH` variable. Enable webhook retries.
5. Confirm the public application domain is the callback domain used by checkout.
6. Test success, cancellation, failure, delayed webhook, duplicate webhook, amount mismatch and a refund in test mode.
7. Perform settlement reconciliation independently of the customer-facing payment status.

The application never trusts the browser redirect or webhook payload alone. It verifies the transaction through Flutterwave's server API, compares transaction reference, amount and currency, and only then updates the booking and plot.

## What the WhatsApp webhook is

A webhook is the public HTTPS address Meta calls when an event occurs in the connected WhatsApp Business Account. For this application it receives inbound customer messages and sends them into the Convex conversation/session flow. It is not a downloadable key.

The existing callback URL is:

`https://gallant-husky-352.eu-west-1.convex.site/webhooks/whatsapp`

To activate it:

1. Create a Meta Business portfolio, Meta developer app, WhatsApp Business Account and business phone number.
2. Add the WhatsApp product in the Meta developer dashboard.
3. Create a private random verification token and store it as `WHATSAPP_VERIFY_TOKEN` in Convex.
4. Enter the callback URL and that token under WhatsApp **Configuration → Webhooks**. Meta sends a GET challenge; the existing route answers it.
5. Subscribe the app to the `messages` webhook field.
6. Store the phone-number ID, a production system-user access token and the Meta app secret as `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_APP_SECRET`.
7. Complete business verification, display-name review, approved message templates and opt-in/opt-out handling before production campaigns.

The verification token only proves ownership during setup. Production POST deliveries should also be checked against Meta's `X-Hub-Signature-256` using the app secret.

## Is Dropbox important?

Dropbox file storage is not required. **Dropbox Sign** is a separate e-signature product and is useful when clients must sign offers, deeds, allocation letters or other agreements remotely with an audit trail.

Use Dropbox Sign if the legal and operations teams accept electronic signatures for the relevant Nigerian property documents and want signing inside the client portal. Defer it if the business still requires wet signatures or lawyer-supervised execution. Before launch, counsel should approve document templates, signer authentication, evidence retention and the status of electronic execution for each document type.

## Convex enterprise configuration

### Required platform configuration

| Convex capability | Assessment | Required configuration |
| --- | --- | --- |
| Production, staging and developer deployments | Required | Keep production isolated; use a separate persistent staging project or preview deployments; never test payment webhooks against production data |
| Schema validators and indexes | Implemented, continue auditing | Keep runtime validators on every function and indexes for tenant/owner, status, reference and date access paths; avoid unbounded `.collect()` calls |
| Auth and authorization | Implemented foundation | Enforce ownership and roles in every query/mutation/action, configure identity provider domains and add MFA/SSO based on risk |
| Internal functions | Partially implemented | Keep provider verification, settlement and administrative mutations internal; expose only minimal client APIs |
| HTTP actions | Implemented foundation | Maintain signed Flutterwave, Paystack, WhatsApp and e-signature webhooks; add replay protection, payload limits and event audit records |
| Scheduled functions / crons | Implemented foundation | Payment reminders and stale-request escalation exist; add failed-job visibility and retry/dead-letter handling |
| File storage | Implemented foundation | Enforce attachment ownership, content type and size; add malware scanning and retention policies |
| Environment variables | Required | Declare expected variables with typed Convex project configuration, separate test/live credentials and rotate secrets on a schedule |
| Backups and restore | Must be configured in dashboard | Enable periodic backups including file storage; document and rehearse restore procedures |
| Usage limits and billing alerts | Must be configured in dashboard | Set daily/monthly limits and alerts before public launch |
| Logs, exception reporting and streaming export | Must be configured in dashboard | Send exceptions and audit logs to the selected monitoring/SIEM tool; redact PII and secrets |
| Deploy keys and team roles | Required | Use least-privilege production deploy keys, protected CI environments and separate admin/operator roles |
| Data migrations | Required process | Use versioned, restartable migrations for schema/data changes and record completion per deployment |

### Recommended Convex components

| Component | Use in this application | Priority |
| --- | --- | --- |
| Rate Limiter | Per-account, IP, email, phone, checkout, enquiry and webhook abuse controls | Required before broad public traffic |
| Workflow | Durable multi-step closing flow: payment → document generation → signatures → allocation → notifications, with retries and observable state | High |
| Action Retrier / Workpool | Retry and control concurrency for Flutterwave verification, email, WhatsApp, KYC and e-signature calls | High |
| Migrations | Backfill normalized listings, payment fields and future schema changes safely | High |
| Aggregate | Fast admin counts and financial/dashboard summaries once dataset volume makes direct queries expensive | Medium |
| Resend component | Durable transactional email state and delivery events if Resend remains the mail provider | Medium |
| Presence | Live support/agent availability indicators only if operations needs them | Low |
| Push Notifications | Mobile/web push for payment reminders and request responses | Later |
| Geospatial | Radius and map-bound property search when coordinates become complete | Later |

Components should be installed for a measured need. Enterprise readiness depends more on authorization, recovery, observability, reconciliation and operational ownership than on the number of packages installed.

## Launch acceptance checks

- Production secrets exist only in Convex/Cloudflare secret stores.
- A test user can register, verify identity, reserve a plot, pay, receive a receipt, see realtime status and access the generated document.
- Duplicate or modified webhook events cannot duplicate credit or allocation.
- Admins can reconcile transaction, settlement, booking and customer records.
- Backup restoration and key rotation have been rehearsed.
- Monitoring alerts reach a named on-call owner.
- Privacy notice, terms, refund policy, payment policy, KYC consent and data-retention policy are approved and published.
- Access reviews, audit-log reviews and incident response have assigned owners and schedules.
