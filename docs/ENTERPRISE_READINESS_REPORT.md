# Enterprise readiness report

**Assessment date:** 30 September 2026
**Production application:** `https://alikodiamondkey.com`
**Reviewed revision:** production hardening deployment of 30 September 2026

## Executive assessment

Aliko Diamond Key has a strong enterprise-oriented application foundation, but it is not yet ready for unrestricted production payments or regulated identity processing. The code contains the required security boundaries and durable backend components for many enterprise workflows. Most external providers, operational controls, and recovery processes are not activated in the production accounts yet, and several user-facing dashboards still contain demonstration data.

- **Engineering foundation:** approximately 92% complete.
- **Verified production operational readiness:** approximately 55–60% complete.
- **Recommended release stage:** controlled internal or invited-user beta without live payment/KYC promises until the launch blockers below are closed.

The percentages distinguish code that exists from controls that have been configured, exercised, and assigned to an operational owner.

## Verified production controls

| Area | Status | Evidence |
| --- | --- | --- |
| Cloudflare Pages | Complete | Production deployment succeeded for the reviewed revision and the custom domain returns HTTP 200. |
| Cloudflare R2 | Complete | Bucket `aliko-diamond-key-media` exists; `MEDIA` is bound to production and preview; a remote write/read/delete round-trip passed. |
| Cloudflare WAF | Foundation complete | Sensitive-path probes are blocked and authentication/upload bursts are blocked after 10 matching requests in 10 seconds per IP. |
| Cloudflare credential scope | Complete for the main operator credential | The exposed broad Cloudflare/R2 credential was replaced with a 90-day least-privilege token, verified, encrypted for the local Windows operator, and revoked. The separately issued legacy Workers AI token still requires dashboard-owner revocation. |
| R2 lifecycle | Complete for managed prefixes | Temporary uploads expire after one day, quarantined objects after 30 days, and abandoned multipart uploads after one day. Existing unmanaged rules are preserved. |
| Declarative infrastructure | Complete for R2 | `wrangler.toml` declares `MEDIA` at the top level and in preview/production environments so later Wrangler deployments preserve the binding. |
| Continuous integration | Foundation complete | Main-branch CI installs dependencies, checks Svelte diagnostics, builds, installs Chromium, and runs the public preview smoke test. |
| Build quality | Complete with noted test gaps | Local browser automation completed with 29 passing and 7 credential-dependent tests skipped; three additional image-sanitization security tests passed. Strict Svelte diagnostics, production builds, Convex deployment, and Cloudflare deployment pass. |
| Recovery snapshot | Snapshot complete; restore pending | A production snapshot including Convex file storage was downloaded outside the repository with a SHA-256 manifest. A guarded staging restore command exists, but no dedicated staging deployment or staging key is available for the rehearsal. |
| Theme/accessibility foundation | Complete | Light/dark themes render across public routes; current Svelte diagnostics report no accessibility warnings. |

## Implemented application foundation

### Identity and authorization

- Convex Auth supports password registration, sign-in, password reset, profiles, and synchronized application users.
- Dashboard routes resolve the authenticated Convex identity on the server.
- Client, agent, estate-manager, and administrator role checks are implemented.
- Resource ownership checks exist for listings, service requests, documents, bookings, and private storage records.
- Administrators can suspend accounts; suspension revokes active sessions.
- Registration and failed-login abuse controls use the Convex Rate Limiter component.

### Data and realtime workflows

- Normalized Convex tables, validators, and indexes exist for users, listings, projects, plots, bookings, payments, service requests, conversations, documents, notifications, webhook events, jobs, and stored assets.
- Realtime catalogue, enquiry, service-request, profile, booking, project, plot, and administration queries are implemented.
- Rate Limiter, Workflow, Workpool, Migrations, and Aggregate components are installed and have generated bindings.
- Scheduled jobs cover reminders, stale-request escalation, stalled-job monitoring, and attachment retention.
- Failed asynchronous jobs are recorded in a dead-letter queue for administrator review.

### Payments and legal workflow code

- Flutterwave hosted checkout, independent server verification, signed webhook handling, replay protection, refunds, and settlement import are implemented.
- Paystack initialization and signed webhook handling remain available for the existing plot flow.
- Verified payments can start a durable fulfillment workflow that generates legal documents and notifications.
- Dropbox Sign request creation and signed callback processing are implemented.
- Payment, booking, and service-request aggregates support scalable administrator totals.

### Messaging and files

- Resend password recovery, transactional email, idempotent delivery records, and signed delivery-event callbacks are implemented.
- WhatsApp webhook verification, signed inbound events, outbound messages, bot state, workpool processing, and human escalation queues are implemented.
- Convex private storage enforces ownership, purpose, MIME and size rules, quarantine states, retention, and optional malware scanning.
- R2 public property-media uploads require an authenticated administrator, agent, or estate manager and accept only JPG, PNG, WebP, or AVIF files up to 15 MB.
- R2 uploads now verify JPG/PNG/WebP/AVIF file signatures, create Convex ownership records, and support owner or administrator deletion with an immutable administrator audit event.
- JPEG, PNG and WebP uploads have EXIF/XMP/IPTC metadata removed before storage. Metadata-bearing AVIF uploads are rejected until they are cleaned by a safe AVIF-aware tool.
- Administrators can run bounded orphan cleanup; only objects older than 24 hours without a live Convex ownership record are deleted, and each run is audited.
- QoreID webhook handling verifies the raw request with HMAC-SHA512, rejects replayed events, records explicit versioned KYC consent, and stores provider references/results without raw NIN or BVN values.
- QoreID workflow initiation now mints short-lived, single-use SDK sessions in a Convex action and launches the official Web SDK from the client profile. It activates when the client ID, secret and numeric workflow ID are supplied.
- Sentry's official SvelteKit SDK is integrated for browser and Cloudflare exceptions with release/environment tags and request-data redaction. It remains disabled until a production DSN is configured.
- Dedicated public pages now publish Terms, Privacy, KYC consent, payments/refunds, retention, electronic-signature and cookie notices. Nigerian counsel still needs to approve the final wording.
- Client saved properties, site visits, service requests and legal documents now use live Convex queries. Agent leads and assigned visits are live; unimplemented manager, referral, commission and vendor domains render without fabricated customer or financial records.

## Production configuration audit

The production Convex deployment currently exposes only these configured variable names:

- `APP_URL`
- `CONVEX_HTTP_ACTIONS_URL`
- `SITE_URL`
- `WORKERS_AI_API_TOKEN`

`CONVEX_DEPLOY_KEY` was removed from the Convex runtime. The exposed deployment key itself still must be revoked and replaced in the Convex dashboard, then stored in a protected GitHub production environment. The current browser is at the Convex sign-in screen and the GitHub account lacks repository administration rights.

Consequently, the following implemented integrations are **not active in production**:

- Flutterwave
- Paystack
- Resend transactional email and password recovery
- WhatsApp Business Cloud API
- Dropbox Sign
- Google Maps server geocoding
- Malware scanning

QoreID consent, server-side workflow session creation, official Web SDK launch, and signed callback processing are implemented. Activation still requires a QoreID production account, workflow ID and credentials.

No repository-level GitHub Actions secrets, GitHub deployment environments, or repository variables were returned by the current repository audit. The staging, preview, and production workflow files exist, but their required secrets and protected environments are not configured, so those workflows cannot be treated as an operational release pipeline yet.

`CONVEX_DEPLOY_KEY` should not be stored inside the Convex runtime environment. It is a deployment credential for CI or trusted operator machines. Remove it from runtime after rotating it and place the replacement only in protected GitHub deployment environments.

## Launch blockers

These items should be completed before accepting unrestricted customer payments or identity documents.

1. **Rotate every credential exposed during setup.** Rotate the Cloudflare API token, R2 S3 keys, Workers AI token, and Convex deploy key. Store replacements only in Cloudflare, Convex, protected GitHub environments, or an approved secrets manager.
2. **Activate provider credentials and callbacks.** Configure Flutterwave, Resend, WhatsApp, Dropbox Sign, Google Maps, and the selected malware scanner in separate staging and production accounts.
3. **Exercise real sandbox journeys.** Test registration, password recovery, enquiry, reservation, payment success/failure/cancellation, duplicate and delayed webhooks, refund, settlement reconciliation, email bounce, WhatsApp escalation, signature completion, and infected upload handling.
4. **Configure protected delivery environments.** Create GitHub `preview`, `staging`, and `production` environments, add the required secrets, require approval for production, protect `main`, and require the CI check before merge.
5. **Activate observability.** Supply the Sentry DSNs and release values for the implemented browser/Cloudflare connector; add Convex log streaming, alert routing and a named operator.
6. **Enable backups and rehearse restore.** Turn on automatic Convex database and file backups, document R2 recovery/versioning expectations, and restore the latest backup into staging with recorded recovery time and integrity checks.
7. **Set budgets and alerts.** Configure Cloudflare and Convex usage/spend alerts plus provider-specific payment, email, maps, and messaging limits.
8. **Seed authoritative production content.** Invented landing testimonials were removed. Agent, 3D plot, catalogue and map sections now use live Convex data; demo fallbacks are disabled unless `PUBLIC_ENABLE_DEMO_FALLBACKS=true`. Production still needs approved listings, positioned plots and verified agent records for complete content.
9. **Approve the published legal policies.** The required pages exist and are linked. Nigerian legal/privacy counsel must approve the wording, company contact details, retention periods and dispute terms before unrestricted onboarding.
10. **Complete identity controls.** Configure the QoreID account and workflow credentials, define a manual-review SLA, and implement MFA/SSO and administrator recovery.

## Important hardening work

| Area | Remaining control |
| --- | --- |
| R2 media lifecycle | File signatures, metadata removal, lifecycle rules, audited deletion and admin orphan cleanup are implemented. Add external malware scanning, an authenticated maintenance schedule and storage usage alerts with a named recipient. |
| Cloudflare security | Evaluate managed WAF rules, bot controls, stricter endpoint-specific limits, security-event alerts, and authenticated-origin controls after observing normal traffic. |
| Monitoring | Sentry browser/Cloudflare code and PII redaction exist. Add DSNs, Convex log streaming and named on-call recipients. |
| Authentication | Add MFA or an external identity provider for administrators, recovery codes/runbooks, quarterly access reviews, and privileged-action step-up authentication. |
| Payments | Complete sandbox and low-value live certification, daily settlement reconciliation, accounting export, chargeback handling, and an operator-approved refund runbook. |
| Testing | Add backend integration tests against isolated Convex preview deployments, provider contract fixtures, authenticated role/ownership tests, R2 upload authorization tests, and restore/migration tests. CI currently runs only the public preview smoke specification. |
| Data quality | Seed authoritative production listings, projects, plots, services, and verified agents; hide or clearly label demonstration fallbacks in production. |
| Business continuity | Define RTO/RPO, incident response, breach notification, provider outage behavior, and quarterly recovery exercises. |
| Privacy and compliance | Complete Nigerian legal/privacy review, NDPA-related processing records, data-subject request handling, retention/deletion schedules, and vendor agreements. |

## Recommended delivery order

### Phase 1 — Safe live transactions

Rotate secrets; configure protected CI environments; activate Flutterwave and Resend in staging; connect monitoring; configure backups; publish legal/payment policies; remove payment-path demo data; complete sandbox and low-value live transaction tests.

### Phase 2 — Verified service operations

Activate WhatsApp, KYC, Dropbox Sign, malware scanning, and Google Maps; establish manual-review and incident SLAs; test the complete payment-to-document-to-signature-to-allocation workflow.

### Phase 3 — Scale and governance

Replace remaining dashboard mocks, add accounting reconciliation and consent-aware analytics, introduce administrator MFA/SSO, strengthen Cloudflare managed protections, run restore and key-rotation exercises, and perform an independent penetration test.

## Enterprise completion definition

The application should be called enterprise-ready only when the code, provider accounts, secrets, monitoring, recovery procedures, legal policies, and operational owners are all in place and a complete staging rehearsal has passed. Installed packages and successful builds establish the technical foundation; they do not by themselves prove recoverability, financial correctness, identity compliance, or incident response readiness.
