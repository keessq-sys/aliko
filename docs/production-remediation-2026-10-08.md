# Production remediation — 8 October 2026

## Application changes

- Authentication treats a verified server session as successful without waiting for the browser WebSocket connection. Profile creation and signed cookies remain backend operations. Login, signup, session retrieval, partner submission, and role review are covered by tests.
- Agent and manager approval requires a stored, encrypted NIN submission rather than an unavailable QoreID verification. Only administrators can approve roles; an eleven-digit value does not establish government identity verification.
- Image uploads no longer require external malware scanning or image-decoder services. R2 retains signed-session authorization, role and manager-subscription checks, file-size limits, MIME/signature inspection, metadata sanitation, and audited ownership registration. Private document scanning remains separate.
- Convex image uploads become active without waiting for scanner configuration. Previously pending images are released by the existing retry path. Existing rejected assets are not silently reclassified.
- Typed-name consent replaces active Dropbox Sign dispatch and webhook integration. Consent requires the document owner, matching profile full name, and an explicit declaration. The name, account, document reference, source-file reference, and timestamp are recorded. Administrator review remains required before allocation. Historical provider records are retained.
- QoreID browser initiation and webhook handling are removed. NIN fields display a progress meter and green tick for eleven digits, with wording that explicitly describes format validation.
- Duplicate query-error notifications are suppressed and capped. Provider outages and connection failures receive useful explanations instead of instructions to repeatedly refresh.
- Integration settings and policy disclosures describe the current first-party NIN submission and consent flows.

## Validation

- `npm test`: Svelte diagnostics reported zero errors and zero warnings; 79 backend tests passed; 120 Chromium tests passed and 7 were skipped.
- `npm run build`: Cloudflare production bundle completed successfully.
- Production Convex schema validation and function deployment completed successfully. Canonical TypeScript bindings were generated during deployment.
- Production and preview Pages media authorization was configured from the existing Convex maintenance secret using a partial environment update.

## Scope and operational limits

The old quota-disabled screenshot does not describe the current deployment: live Convex queries and deployment work now. Eleven-digit NIN formatting is not authority verification, and typed consent is not a substitute for required legal formalities. Live payment fulfillment remains disabled while configured payment credentials are sandbox credentials. No customer application was approved or rejected solely for testing, and no customer records were deleted. Skipped browser tests and provider certification remain separate from the checks above.
