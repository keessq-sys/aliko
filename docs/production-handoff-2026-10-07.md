# Aliko Diamond Key — production handoff, 7 October 2026

This release improves the application and verified infrastructure. It does **not** certify unrestricted live transactions. Production fulfilment remains disabled, and the supplied Korapay credentials are sandbox credentials.

## Implemented

- Korapay hosted checkout for the shared property, service and manager order checkout, server-side charge verification, signed webhook validation, replay protection and administrator reconciliation. Provider amounts, currencies and ownership are validated by the backend. Sandbox payments cannot fulfil production orders or unlock subscriptions.
- Manager subscription catalog and durable records: Starter ₦25,000/month with 10 properties; Professional ₦75,000/month with 100 properties. Backend checks approval, verified identity, profile completion, payment ownership, settled payment and subscription dates. Cancellation preserves the paid period, expiration removes paid access, and administrator revocation records a reason. Free buyer and approved agent features remain free. Paid operations are protected even if navigation is bypassed; existing records and completion of funded work remain available.
- Property and land galleries accept up to seven registered images, require at least one for publication, and reject foreign owners, wrong asset categories, duplicates and excess files. Dashboard selectors enforce the limit before upload. R2 remains the durable public-image store; uploads use server bindings and the existing decoding, scanning and metadata stripping pipeline.
- Signup and profile interfaces synchronize NIN submission, Nigerian state/LGA and WhatsApp contact to Convex. Public registration cannot grant ADMIN. The designated trusted administrator can access the Admin Console and other role dashboards.
- `/admin-login` redirects to the administrator login interface. Signed session access and the administrator health endpoint are verified. Account management includes email verification links with hashed, expiring, single-use tokens.
- Subscription management pages for members and administrators, navigation links, safe integration status reporting and operator-only verification evidence.
- Convex and HTTP Actions URLs are consistent in Wrangler environments, with production and preview R2 bindings. Prepared workflow changes remove an unsupported Wrangler argument and add backend tests to CI. GitHub rejected workflow updates because its OAuth credential lacks the workflow scope; the unapplied changes are preserved in `deployment-workflows-2026-10-07.patch`.
- Arabic translations for the added interfaces were reviewed and corrected. Existing translations were preserved.

## Verified operations

- Convex functions and schema deployed successfully to gallant-husky-352.
- Cloudflare setup completed: R2 buckets/bindings, temporary/quarantine lifecycle controls, sensitive-path WAF controls and authentication/upload rate controls. A narrowly scoped exception prevents the existing Under Attack challenge from blocking application authentication, private routes and static JavaScript/image/font assets; it does not skip the rate controls or managed WAF.
- The replacement credentials were stored in protected local operator storage and the appropriate provider runtime environments, without adding them to Git. The Convex deployment key is not stored in the Convex runtime.
- The Resend sending domain is verified. Resend reported delivery of both the owner verification email and password recovery email, independently of API acceptance. Evidence references: `01a1105b-5cf6-7e9c-9cec-e375f04d2840` and `01a1105b-613d-7e9d-8e24-0048c9661933`.
- Administrator sign-in and session retrieval returned HTTP 200 with the trusted ADMIN role. The Admin Console returned HTTP 200.
- Cloudmersive scanned a synthetic clean file successfully (HTTP 200, CleanResult true). No customer identity documents were submitted to VirusTotal.
- Workers AI model access returned HTTP 200.
- Korapay accepted a sandbox hosted checkout and returned test-checkout.korapay.com. No payment was made or customer order fulfilled by this probe.
- `npm test`: 120 browser tests passed, 7 skipped; check returned zero Svelte errors/warnings. The expanded backend suite subsequently passed 76 tests. Final checks and build are recorded in the operator logs.

## Remaining work before unrestricted live transactions

1. Obtain live payment credentials and complete provider sandbox certification: success, failure, cancellation, delayed/duplicate webhook, refund and settlement reconciliation. Korapay is added to the shared order checkout; the legacy land-booking payment flow still uses Flutterwave. Automated Korapay refunds and full settlement reconciliation are not yet implemented.
2. Configure the missing production accounts and verify delivery/workflows for WhatsApp, QoreID, Dropbox Sign, Google Maps and monitoring. Scanner clean-file access is verified; infected-file and unavailable-provider certification remain required.
3. Establish protected GitHub preview, staging and production environments with environment-scoped secrets and production approval. The available GitHub credential has push rights but no repository administration rights or workflow scope. Apply the preserved workflow patch with a properly scoped credential. Dedicated staging/preview Convex deployments are still required; using the same public deployment URL is not data isolation.
4. Revoke superseded exposed credentials in the issuing provider accounts. Replacement configuration is verified, but revocation of every old credential has not been verified.
5. Enable and verify automatic backups, perform a recorded staging restore, and assign recovery and incident operators. Complete storage usage alerts and orphan-object cleanup certification.
6. Complete administrator MFA/SSO and sensitive-action step-up authentication with a working recovery procedure. The application currently uses Convex Auth; Better Auth migration has not been completed.
7. Implement team-seat administration before advertising the Professional plan's ten seats as operational. Review all remaining authoritative catalogue/marketing records; do not replace empty production collections with fabricated live records.
8. Obtain Nigerian legal/privacy approval, establish support and KYC review SLAs, and complete the payment-to-deed-to-signature-to-allocation staging journey.
9. The owner must personally open the delivered verification link; sending and delivery do not prove that the owner completed verification.

Production release approval must be based on these recorded checks and provider certifications, not an estimated completion percentage.

## Release follow-up

GitHub CI identified an optional-public-environment typing error in the media upload route; the route now uses the guarded server authentication client. CI passed on commit fa18089. Live browser testing also identified HTTP 403 HTML challenges on JavaScript modules; the Cloudflare exception was extended to static assets while retaining WAF and rate controls.

The final live browser check passed administrator login, session retrieval, health evidence, both subscription pages, profile fields, mobile sidebar and logout with zero browser exceptions. Korapay callback initialization succeeded after correcting the 50-character provider reference limit; a regression test protects this contract. The frontend release is available at https://53e1dbfc.aliko-3f9.pages.dev and the primary domain.
