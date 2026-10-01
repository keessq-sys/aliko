# Audit remediation and production handoff — 1 October 2026

This records the remediation against APPLICATION_AUDIT_2026-10-01.md. It does not certify unrestricted live payments or enterprise readiness. Provider certification and authenticated staging acceptance remain release requirements.

## Implemented

- Public password registration always provisions CLIENT; application approval provisions AGENT/ESTATE_MANAGER only for the linked authenticated applicant. Anonymous submissions cannot claim another account's email. Private partner and notification queries require administrator access.
- Authentication uses signed Convex sessions and server-created HttpOnly cookies. Added the missing Convex auth configuration, HTTP routes, production signing keys and encrypted administrator authenticator enrollment. Administrator proof expires after 30 minutes; sensitive administrator actions require proof within five minutes. Session expiry/revocation and suspension are checked by the shared guard. Operator recovery is internal-only, explicitly disabled by default, and audited.
- Staging restore requires a dedicated matching staging key, exact deployment URL and explicit confirmation, rejects the known production deployment and aliases, and clears inherited deployment selectors. No destructive restore was executed.
- New properties start unpublished. Administrator review requires a verification evidence reference and gallery; manager media access is restricted to assigned properties. Public records require VERIFIED status. Legal documents require owner/admin access; supporting client/plot queries are internal.
- Synchronized authored service definitions can be inserted idempotently without creating fabricated properties or agents. Service attachments require authenticated ownership, approved purpose and ACTIVE scan state. Removed browser-controlled KYC provider-reference registration; consent requires the current version and provider references cannot overwrite another record.
- Durable fulfilment uses a saved legal address, waits for signature result and validates payment, client identity and signed document ownership before allocation. Decline/expiry events stop the workflow for review. Payment alone reserves rather than sells a plot. Refund uncertainty keeps funds reserved; confirmed refunds adjust booking balances once and flag allocation for review.
- Added owner-scoped persisted records for tenants, work orders, vendors, documents, expenses, referrals, commissions and messages; manager/agent workspaces and overview counts use those records. The follow-up implementation below expands these records into conversations, leases and a ledger; it does not constitute a full statutory accounting or external CRM system.
- Queued email has a scheduled consumer, transactional leases, provider idempotency, bounded retries and failure state. Missing provider credentials preserve the queue. Operator emails require ADMIN_ALERT_EMAIL.
- Storage checks publication/deletion status on R2 reads, records deletion before object removal, resumes orphan cleanup with saved cursors, and supports bounded scheduled scanning retries/dead-letter escalation. Convex uploads remain private pending scan. Profile photo upload now works through this scan path. R2 uploads require an HTTPS scanner and a clean result before storage/publication. A scanner outage or missing scanner configuration rejects upload safely; a Cloudmersive adapter and decoder have now been added; real-provider credentials and certification are still required.
- Cloudflare production and preview use separate MEDIA buckets. Preview backend connection is disabled with the placeholder until CONVEX_STAGING_URL is supplied. Updated WAF controls include the new authentication session endpoint and target write requests.
- Public headline counts now use live records; removed invented financial/satisfaction totals, city counts, villa price/ROI claims and fraud-history wording in the touched sections. Mobile map is visible; fallback map does not invent precise pins. Map popup content is escaped; provider-load failure displays the reference map.
- Restored query unsubscribe lifecycle, added visible data-load errors, implemented scenario PDF export with explicit assumptions, and made browser catalogue/detail fixtures opt-in in the isolated test server. The npm test command runs the full backend and Chromium suite. The prepared CI workflow update is saved in CI_FULL_SUITE.patch; GitHub rejected workflow modification because the available OAuth credential lacks workflow scope. The remote workflow retains preview-only coverage until an authorized operator applies the patch. Added dedicated Convex TypeScript configuration.

## Remaining application work — implementation closure

The seven application items in the original handoff have now received implementation and regression coverage. This closes the listed code changes; it does not replace provider certification or signed-in staging acceptance.

| Original item | Implemented application behavior | Acceptance still required |
| --- | --- | --- |
| Message threads | Private, paginated owner/admin conversations, real-time replies and status, idempotent reply references, scanned attachments, administrator desk and queued email notifications. Account and agent workspace links are connected. | Real Resend delivery and authenticated cross-role browser journeys. Inbound email replies remain a separate integration; the application inbox is the authoritative conversation. |
| Manager workflows | Assigned-property leases, overlap rejection, linked customer accounts, vendor assignment, edit/status/attachment forms, paginated records and immutable NGN ledger. Aggregates power monthly ledger charts, active lease counts and referral/commission totals. Manager activity and agent assignments use actual owned records; monthly CSV export is connected. | Business approval of accounting rules, authoritative tenant/lease records and signed-in staging acceptance. A manually recorded ledger is not bank settlement evidence. |
| Finance reconciliation | Refund initiation and disbursement are distinguished. Pending refunds rotate through scheduled reconciliation; uncertain outcomes remain reserved and block allocation. Existing provider refund IDs can be verified without initiating another refund. Settlement headers paginate; transactions match provider ID, reference, currency, gross, fees, refund and net. Only completed, balanced, fully matched batches reconcile. Finance records and transaction details paginate. | Provider sandbox success/failure/delayed/refund/settlement certification. Batches exceeding 1,000 transactions fail closed for finance review rather than being marked reconciled from partial evidence. Legal title reversal remains an explicit legal/finance procedure. |
| Signature automation/recovery | Durable deed → signature dispatch → callback → allocation, uncertain dispatch reconciliation, audited operator restart, decline/expiry review, registered-request/test-mode binding, terminal document protection and five-minute administrator proof on sensitive operations. Deed PDF uses NGN, validates the booking and reuses the canonical document on retry. | Real Dropbox Sign callbacks, legal-template approval and complete staging payment-to-allocation journey. Names/addresses unsupported by the current PDF font stop for legal review rather than being silently altered. |
| Account, consent and public content | Password-protected email change with new-email verification, hashed expiring codes, attempt limits, uniqueness checks and session revocation. Property-detail wishlist persists. All registration paths require versioned Terms/Privacy acceptance. Authentic testimonials require administrator review and recorded consent; the 3D section requires live model/coordinate records, removes invented roads and uses a plot-list fallback. Plot links now open the plot reservation page. | Verified sending domain, authentic production inventory/content, counsel-approved policies and a real account/security journey in staging. No fabricated approved records were inserted. |
| Media security | Both upload paths scan originals; images undergo full decoder/re-encoding and a second scan before release. A Cloudmersive adapter strictly checks CleanResult; the generic adapter remains available. R2 output is WebP. The authenticated Cloudflare Images decoder is provisioned and positively tested. Media version/scan evidence and an administrator legacy-media audit page are added. Missing scanner credentials/outages keep uploads private or reject publication. | A real malware-provider credential and clean/infected/outage certification for Convex AND R2. Legacy and unregistered physical objects still require an operator inventory/review; empty registry tables do not prove an empty storage bucket. |
| Browser/accessibility acceptance | Added measured WCAG axe checks for home, properties, map, services, auth, plots and agents in both themes at phone and desktop widths, overflow checks, keyboard focus and private-route protection. Fixed select/range labels, missing titles, footer/service/button contrast and light-mode mobile navigation. | Authenticated client/agent/manager/admin browser journeys in a genuine isolated staging deployment. Automated checks are not a complete manual accessibility certification. |

## Live-transaction release control

New production payment initialization is closed unless LIVE_TRANSACTIONS_ENABLED=true and LIVE_TRANSACTION_APPROVAL_REFERENCE identifies a recorded approval. Merely adding a provider key does not enable production charges. Test keys are accepted only in explicitly staging/development deployments; live keys are rejected there. Verification/reconciliation of existing payments remains available so closing checkout does not prevent financial recovery. The release reference is an operator control, not proof generated by the application.

Do not enable this control until the prerequisites and acceptance evidence below are complete. The current disposition is **HOLD — unrestricted live transactions are not certified**.

## Account and operational prerequisites

- Replace the exposed Convex deploy key and verify legacy Workers AI token revocation. Use protected operator/CI storage; do not paste replacement credentials into conversation.
- GitHub owner/admin must enable branch rules and protected preview/staging/production environments. Current authorization permits push but not repository administration. Install separate deployment credentials and create a genuine staging Convex deployment; preview must remain disconnected from production.
- Configure Flutterwave/Paystack, Resend sending domain, WhatsApp Business, Dropbox Sign, Maps, QoreID workflow, Sentry and scanner credentials. Scanner variables must also be set as Cloudflare secrets for the R2 upload handler. Existing keys for these providers were not available in this session.
- Verify automatic database AND file backups, independent R2 recovery copies, storage/spend alerts, operator alert delivery and a recorded staging restore with integrity checks and approved RPO/RTO.
- Obtain business/Nigerian counsel approval of published policies, consent/retention terms and marketing claims; name support, finance, security and privacy operators. No legal approval or staffing is implied by code changes.

## Administrator recovery procedure

A repository/deployment owner verifies the administrator's identity and records a recovery ticket. Temporarily enable ADMIN_MFA_RECOVERY_ENABLED in the trusted Convex deployment environment, invoke the internal adminSecurity:recoverEnrollment function with the exact user ID, operator identity and evidence, revoke that user's existing sessions using the trusted auth administration procedure, and immediately remove the recovery environment flag. The administrator signs in and enrolls a new authenticator. Review the audit entry and signing-key/session compromise risk. Never expose recovery through a public HTTP route. Quarterly access review and operator rehearsal remain outstanding.

## Validation and deployment evidence

Validation results and deployed revision are appended after final checks. Tests use isolated in-memory backend data and opt-in browser fixtures; no fake verified inventory, real payment, provider signature or customer account is inserted in production for testing. Provider webhook and authenticated administrator tests remain conditional on sandbox credentials/sessions.

### Confirmed results

- `npm test`: passed, frontend diagnostics 0 errors/0 warnings; 16 backend tests passed; Chromium 33 passed/7 skipped. The five live provider checks and two signed-in administrator checks are not certified.
- Dedicated Convex TypeScript check and Cloudflare production build: passed.
- Production Convex functions deployed successfully on 1 October 2026; schema validation completed. ADMIN_MFA_REQUIRED enabled in production.
- Idempotent service synchronization inserted 13 authored services. Public production summary still correctly reports zero approved listings, agents and projects; fabricated inventory was not inserted.
- Cloudflare setup completed, including isolated preview MEDIA storage and updated authentication write-rate controls. The scheduled maintenance worker deployed as version e8491901-2ffc-4d67-8a52-ff2b23b6d1a2, with the daily schedule retained.
- GitHub main was fetched and matched the starting revision before commit; no competing branch or new upstream commit required merging.

### Live verification

- Cloudflare Pages release succeeded at https://9ec58718.aliko-3f9.pages.dev and the production domain rendered the ADK logo and application.
- Read-only production browser checks: no browser exceptions; investment PDF downloaded successfully; mobile map displayed the Nigeria reference image at 390 px with no horizontal overflow; anonymous maintenance returned HTTP 403.
- Public Convex signing endpoint returned HTTP 200 with one public signing key. Anonymous partner/notification queries returned server errors; production logs contained the expected Unauthorized failures and no TypeError entries during the check. Sensitive error details are redacted publicly.
- Live visual inspection caught remaining hero demonstration statistics and unsupported guarantees; these were removed in the final source change. The final Pages release at https://8b6afa9f.aliko-3f9.pages.dev applies that change.
- Initial frontend publish attempt was rejected for duplicate PUBLIC_CONVEX_URL bindings. Removed the duplicate TOML declaration; Pages retains its configured public URL. The successful retry is recorded above.
- Production preview screenshots and downloaded scenario PDF are stored locally under .backups/verification and excluded from Git.

- Final hero content/contrast update: production build passed and all 10 targeted home/preview browser checks passed.


- Follow-up live inspection found a remaining Vision banner and SEO fraud guarantee; removed both. Rebuilt successfully, and all 10 home/preview checks passed again using the existing CI port (4173). Playwright now starts the isolated server on the requested local port. The full-suite workflow patch passes git apply --check.
- Application changes pushed successfully to GitHub main; workflow scope remains unavailable. Final frontend revisions are published through Cloudflare Pages; the report retains prior release URLs for traceability.

## Follow-up implementation validation

The final results, deployed backend, aggregate backfills, production media inventory and Pages release are recorded here after checks complete. Earlier validation/release entries above describe prior revisions and are retained as history.

- Final follow-up `npm test`: passed. Svelte diagnostics: 0 errors and 0 warnings; 34 backend tests passed; Chromium 62 passed and 7 skipped. The skipped five provider-webhook and two authenticated-administrator checks remain unverified.
- Measured axe WCAG matrix: 28 cases (seven public routes × two themes × 390 px / 1280 px), with no reported violations. Layout width and keyboard focus checks passed. This is automated public-page evidence, not a signed-in or manual accessibility certification.
- Dedicated Convex TypeScript check, final Cloudflare build, whitespace check and prepared CI patch applicability check: passed.
- Rechecked GitHub permissions: push=true, admin=false, maintain=false. Protected environments/branch rules remain an owner task; the workflow patch still needs a credential with workflow scope.
- Rechecked production configuration by variable names only: media decoder configured; Convex runtime deployment key absent. Flutterwave, Paystack, Resend, WhatsApp, Dropbox Sign, Maps, QoreID, scanner, Sentry and ADMIN_ALERT_EMAIL credentials/settings remain missing. No secret values were printed or committed.
- The authenticated media decoder rejected unauthorized input (403) and invalid image input (422); a real PNG decoded successfully to a 2,330-byte WebP (200). Worker version: 1c2d0028-7395-4fd8-b221-f99775608af9. The decoder service secret was generated and installed using protected operator storage; this does not certify the missing malware scanner.

- Production Convex deployment completed successfully with schema validation and canonical bindings. Installed managementAggregate and estateAggregate components. LIVE_TRANSACTIONS_ENABLED was explicitly set to false in production.
- Production management, lease and ledger aggregate backfills completed (one page each). Registered Convex media and R2 media tables both contain 0 rows; this does not inventory unregistered physical objects. Public summary remains 0 approved listings, 0 approved agents and 0 active projects, with capped=false.
