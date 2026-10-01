# Audit remediation and production handoff — 1 October 2026

This records the remediation against APPLICATION_AUDIT_2026-10-01.md. It does not certify unrestricted live payments or enterprise readiness. Provider certification and authenticated staging acceptance remain release requirements.

## Implemented

- Public password registration always provisions CLIENT; application approval provisions AGENT/ESTATE_MANAGER only for the linked authenticated applicant. Anonymous submissions cannot claim another account's email. Private partner and notification queries require administrator access.
- Authentication uses signed Convex sessions and server-created HttpOnly cookies. Added the missing Convex auth configuration, HTTP routes, production signing keys and encrypted administrator authenticator enrollment. Administrator proof expires after 30 minutes; sensitive administrator actions require proof within five minutes. Session expiry/revocation and suspension are checked by the shared guard. Operator recovery is internal-only, explicitly disabled by default, and audited.
- Staging restore requires a dedicated matching staging key, exact deployment URL and explicit confirmation, rejects the known production deployment and aliases, and clears inherited deployment selectors. No destructive restore was executed.
- New properties start unpublished. Administrator review requires a verification evidence reference and gallery; manager media access is restricted to assigned properties. Public records require VERIFIED status. Legal documents require owner/admin access; supporting client/plot queries are internal.
- Synchronized authored service definitions can be inserted idempotently without creating fabricated properties or agents. Service attachments require authenticated ownership, approved purpose and ACTIVE scan state. Removed browser-controlled KYC provider-reference registration; consent requires the current version and provider references cannot overwrite another record.
- Durable fulfilment uses a saved legal address, waits for signature result and validates payment, client identity and signed document ownership before allocation. Decline/expiry events stop the workflow for review. Payment alone reserves rather than sells a plot. Refund uncertainty keeps funds reserved; confirmed refunds adjust booking balances once and flag allocation for review.
- Added owner-scoped persisted records for tenants, work orders, vendors, documents, expenses, referrals, commissions and messages; manager/agent workspaces and overview counts use those records. These basic record workspaces are not a complete lease accounting, CRM or conversational messaging system.
- Queued email has a scheduled consumer, transactional leases, provider idempotency, bounded retries and failure state. Missing provider credentials preserve the queue. Operator emails require ADMIN_ALERT_EMAIL.
- Storage checks publication/deletion status on R2 reads, records deletion before object removal, resumes orphan cleanup with saved cursors, and supports bounded scheduled scanning retries/dead-letter escalation. Convex uploads remain private pending scan. Profile photo upload now works through this scan path. R2 uploads require an HTTPS scanner and a clean result before storage/publication. A scanner outage or missing scanner configuration rejects upload safely; the scanner contract still requires a selected provider adapter and certification.
- Cloudflare production and preview use separate MEDIA buckets. Preview backend connection is disabled with the placeholder until CONVEX_STAGING_URL is supplied. Updated WAF controls include the new authentication session endpoint and target write requests.
- Public headline counts now use live records; removed invented financial/satisfaction totals, city counts, villa price/ROI claims and fraud-history wording in the touched sections. Mobile map is visible; fallback map does not invent precise pins. Map popup content is escaped; provider-load failure displays the reference map.
- Restored query unsubscribe lifecycle, added visible data-load errors, implemented scenario PDF export with explicit assumptions, and made browser catalogue/detail fixtures opt-in in the isolated test server. The npm test command runs the full backend and Chromium suite. The prepared CI workflow update is saved in CI_FULL_SUITE.patch; GitHub rejected workflow modification because the available OAuth credential lacks workflow scope. The remote workflow retains preview-only coverage until an authorized operator applies the patch. Added dedicated Convex TypeScript configuration.

## Remaining application work

- Finish full agent/admin message threads and ownership-safe replies; the generic MESSAGE record is currently a support record, not an email conversation.
- Expand manager records into lease/occupancy, vendor assignment, financial ledger and agent analytics workflows; complete edit/attachment interfaces and scalable pagination rather than bounded initial batches.
- Add full provider refund reconciliation and settlement transaction/fee matching. Confirmed refund handling does not automatically reverse legal title/allocation; finance/legal review is required.
- Automate signature request initiation and operator restart after missing legal address/provider failure; current signature request is an authenticated administrator action. Certify the workflow through real sandbox callbacks before accepting live payments.
- Complete secure email-change reverification, persisted wishlist actions on property detail, policy-acceptance persistence for all registration paths, remaining marketing claims/content approval and production inventory publication.
- Certify image decoding and the real malware-provider contract across all upload paths; audit legacy media before release. Optional metadata stripping is present, but stripping is not a full image decoder.
- Run signed-in client/agent/manager/admin journeys in isolated staging and a measured theme/contrast/keyboard/accessibility matrix. Public smoke coverage does not establish these results.

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
