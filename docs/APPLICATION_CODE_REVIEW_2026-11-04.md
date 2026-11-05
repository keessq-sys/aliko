# Application review and remediation — 4 November 2026

Review continued and dependency evidence refreshed on **5 November 2026**.

## Assessment and evidence boundaries

Product: Aliko Diamond Key, https://alikodiamondkey.com. Repository: keessq-sys/aliko. Production backend: gallant-husky-352. This report reconciles the conversation's requests with current source, tests and bounded production checks. It supersedes the current-state claims in the 1 October enterprise report; historical reports remain historical evidence. No completion percentage or unrestricted-transaction certification is asserted.

The review traced authentication/session guards, professional enrolment and approval, listing ownership/publication/deletion, image storage, checkout/settlement, provider callbacks, environment separation, notification integration, shared navigation and public forms. It is not an exhaustive proof of every possible account, browser, provider or concurrency state. No source scan alone proves an external provider delivered an email, settled money or verified a government identity.

## Confirmed findings and fixes

| ID | Severity | Finding | Remediation and acceptance |
|---|---|---|---|
| R01 | High | A fresh browser submission key could create another active agent or manager application and another fee obligation for the same account. | Resume the existing active application using its authenticated user ID. Distinct-tab regressions verify one application/reference; manager plan conflicts are rejected rather than silently creating another billing target. HTTP resumption sends already-paid/current-period applications and legacy no-fee agents to Account instead of attempting another checkout. |
| R02 | High | Rejecting an older application blindly wrote CLIENT to the account, revoking a separately approved professional role. Approval could also replace the other professional role. | Preserve an independently approved peer application, reject implicit agent/manager role replacement and retain unrelated roles when declining an application. Regression covers the old-application rejection. |
| R03 | Medium | getMyProfile spread the whole user record, including optional temporary encrypted NIN signup fields if present. Normal signup removes them atomically, so this is defense against transitional/legacy records, not proof of exposed production NINs. | Exclude the encrypted envelope, fingerprint and last-four temporary fields from browser profiles. Regression seeds those fields and checks their absence. |
| R04 | Medium | Agent ownership lookups used email equality, which can diverge from stored application casing or a verified email change. | Use the existing authenticated user-ID index for enrolment resumption and review peer checks. |
| R05 | High / operational | Initial dependency scan reported 18 affected package entries: 3 high, 7 moderate, 8 low. Counts include transitive/tool dependencies and are not 18 proven production exploits. | Updated Zod to 4.6.7, Vite to 6.4.5 and Wrangler to 4.158.0 (Undici 7.30.1). Final lockfile scan: **13 entries, 0 high/critical, 5 moderate, 8 low**. Remaining entries include Sentry/glob/minimatch and SvelteKit/adapter/Convex-Svelte dependency chains. No untested forced major migration was applied. |
| R06 | Medium / UX | Prior upload selection/destination failures and clicks accepted before event handlers were mounted. A browser run reproduced a header menu click being lost before hydration. | Listing upload fixes shipped in 0ccffe6. Existing-account portrait editors and the header menu now remain disabled until handlers are mounted. A no-JavaScript regression checks the menu guard; interactive tests check that it opens after readiness. Portrait tests verify decoded previews and oversized-file rejection. |
| R07 | Medium / maintenance | The current authentication stack is Convex Auth, not Better Auth. Its installation includes deprecated Lucia/Oslo packages. Deprecation is not itself proof of an exploitable vulnerability. | Plan a supported authentication-dependency migration with preserved account/session identity, rollback and complete registration/recovery/RBAC tests. No live authentication backend was silently replaced during this review. |
| R08 | High / production capability gap | Automated refund and settlement-import actions in paymentOperations are Flutterwave-specific. Korapay has charge verification/reconciliation, but that is not a Korapay refund or bank-settlement import workflow. | Open: implement provider-supported Korapay refund/settlement operations with idempotency, privileged authorization, audit records and real provider acceptance, or document a controlled merchant-dashboard process. Do not advertise automated Korapay refunds as completed. |

## Conversation reconciliation

| Request group | Current implementation / verification | Remaining acceptance or upgrade |
|---|---|---|
| Repository branches | GitHub lists only main and no open pull requests on 5 November. | No outstanding branch merge/deletion was found. |
| Correct application, branding and contact links | ADK deployment, logo, Facebook/TikTok/X/Instagram, Kano location, WhatsApp 09033333909 and mailto contact are present. | Content owner should keep links/photos and advertised claims current. |
| Header, dashboards and theme | Shared navigation, contained public menu, professional workspace navigation, theme styling and responsive controls exist. Browser suite exercises mobile/desktop and light/dark layouts. | Inspect uncommon populated/long-text dashboard states and actual low-memory mobile devices. No claim every screen has been visually certified. |
| Arabic and input integrity | Request-local translation, RTL, LTR credential fields and Arabic/Unicode form tests exist. Five Arabic checks passed in the preceding release verification. | New copy can fall back to English; review catalogue completeness and human translation quality. |
| Signup/login and profiles | Convex Auth, durable users, NIN format/consent, state/LGA, password controls, account update and session verification exist. | A complete real buyer/agent/manager registration and password-recovery delivery matrix needs approved test accounts; accepted email requests do not prove delivery. |
| Agent portrait | Session-authenticated server upload and existing-account editors share one path; storage ownership/content checks remain. | Production inspection found all three agent applications have no saved portrait. There is no existing image to re-upload. A selected account/photo/session is required for a genuine persisted agent-photo check. Do not impersonate an agent or invent a portrait. |
| Agent identity / BVN | Automated providers remain suspended. NIN length is labelled as format only. Manual physical identity/address confirmation reference is required for agent approval and verified-directory presence. | The administrator must actually examine identity/address evidence. Software cannot certify that physical examination occurred. BVN is not collected or claimed verified. |
| Agent fee | New application fee is ₦2,000, server-priced, owner-bound and payable with Korapay. Payment does not approve an agent. Legacy applications are not retroactively charged. | A real owner-controlled fee payment is still needed for funded acceptance. |
| Listings and land | Details, location/state/LGA, price, area, 1–7 images, draft submission, admin decisions, owner restrictions and deletion guards exist. Live private draft upload and cleanup passed. | Reserved/paid/history-bearing inventory is intentionally protected from destructive deletion. Use unpublication or administrator reconciliation. |
| Booking cancellation | Current code requires owner/admin and prevents repeated cancellation from releasing a successor reservation; pending/paid transactions block cancellation. | Keep concurrency/payment reconciliation regressions in CI. |
| Payments | Production reports Korapay configured in live mode and live transactions enabled; Flutterwave/Paystack report unconfigured. Initialization supplies dynamic server-owned amount; reconciliation re-queries provider and compares amount/currency/reference before settlement. | Funded success/failure/delay/duplicate/refund/settlement certification remains open. A configured flag is not acceptance. |
| Korapay callback | Production unsigned and forged-signature requests return 401. Callback processing re-verifies with Korapay; settlement is internal and retry-safe. | A successful real funded event has not been observed by this audit. Do not fabricate a success callback or mark an order paid manually. |
| Newsletter/catalogue/map/3D | Newsletter now calls a durable consent-based mutation. Catalogue has paged/filter paths and bounded geographic continuation; maps/3D have fallbacks. | Geographic scalability needs a spatial index at larger inventory volumes. Validate 3D availability against real inventory and do not present decorative/demo material as authoritative. |
| Messaging and alerts | Server-checked private conversations, in-app notifications, opt-in channel records and administrative broadcasts exist. The service worker caches only its public offline assets; authenticated navigation/API responses are not cached, and push text contains no customer details. | Production WhatsApp Business configuration is absent. Device delivery requires permission, valid push subscriptions and physical-device tests. |
| Email/scanning/geocoding | Production status reports Resend and scanner credentials present, server geocoding absent. Image external scanning remains intentionally disabled with local validation. | Confirm provider delivery/bounce and private-document scanner clean/infected/unavailable outcomes. Credential presence alone does not prove service operation. |
| Release automation | CI run 41885542829 completed successfully for 0ccffe6. Convex and Pages deployments completed. Preview endpoints are blank rather than production; preview R2 uses a separate bucket. On 5 November, GitHub returned no deployment environments; the current credential reports admin=false, maintain=false, push=true. | A repository administrator must create/protect preview, staging and production environments and provide scoped secrets. Provision isolated staging/preview backends before enabling them. |
| Recovery/security operations | Guarded export/restore scripts, runtime guards, audit logs and operational foundations exist. | Recorded staging restore, current credential revocation/rotation evidence, MFA/SSO/step-up choice, operator alert routing and legal approval are not certified by this audit. |

## Prioritized remaining work

1. Close funded payment acceptance with a nominated owner-controlled application and owner-authorized ₦2,000 payment. Record checkout reference, provider-confirmed amount/currency, signed callback, duplicate behavior and settlement/account credit. Korapay refund/settlement automation remains a code capability gap (R08), not only a missing test. Never put bank details or secrets in this report.
2. Supply a real agent's approved portrait and authenticate that agent, then update, reload, sign out/in and confirm its image in the admin detail and public approved directory. No saved agent portrait currently exists to re-upload.
3. Resolve the final dependency advisories with compatible upgrades first; major SvelteKit/adapter/Convex-Svelte migrations need their own build and browser acceptance. Keep lockfile and manifest changes together.
4. Provision isolated staging/preview and perform a timed database-plus-file restore; document RPO/RTO, operator and integrity results.
5. Obtain provider delivery and physical-device evidence for email, push and private-document scanning. Configure WhatsApp Business/geocoding only if those product capabilities are required.
6. Confirm protected release environments, credential revocation, monitoring/alert routing and administrator authentication policy. The user's earlier removal of the broken authenticator flow is not permission to claim MFA is active.
7. Have Nigerian counsel approve the actual legal/refund/retention/e-signature wording and the fee treatment for rejected applications.
8. Remove unreachable legacy dashboard demonstration markup, reduce heavy bundles/images, improve large-catalogue spatial indexing and complete human-reviewed Arabic copy. These are maintainability/performance upgrades rather than evidence that active server-backed workspaces use demo storage.

## Release evidence

Exact current-run tests, deployment revision and CI result must accompany the release handoff. Earlier local results remain useful evidence, but must not be relabelled as a new fully green npm test invocation. No real payment or personal portrait was fabricated or overwritten during this review.

### 5 November verification update

- Production build completed with the Cloudflare adapter.
- Type checking completed with zero errors and zero warnings; 140 backend tests passed.
- The combined npm test invocation stopped at the Playwright preview startup timeout before browser tests ran. A separate single-worker browser run is being recorded; this timeout is not reported as a passing npm test.
- Convex production deployment completed successfully for the reviewed functions.
- GitHub CI run 41885542829 is confirmed successful for the preceding release, closing the previously pending browser-install check. Current revision CI and hosted acceptance are tracked separately.

