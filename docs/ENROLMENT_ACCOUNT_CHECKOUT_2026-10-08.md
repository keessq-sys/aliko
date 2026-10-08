# Unified professional enrolment — 8 October 2026

Agent and manager signup entry points now lead to the corresponding professional enrolment form before any details are entered. Each form collects account password, NIN and consent alongside the existing application fields. Existing account holders can sign in within the same form.

The same-origin enrolment endpoint authenticates the account, stores signed session cookies and submits the application using that verified session. Manager applications also prepare an owned checkout order from the backend plan catalogue and redirect directly to its checkout page. Agent applications retain their submission reference and pending-review confirmation; no agent fee has been invented.

A per-form submission key is indexed by account owner. Repeating a submission reuses the application and checkout order. If checkout fails after account creation, the account session and entered application remain available for retry. A changed manager plan on an already saved submission is rejected and directs the applicant to review their payments.

The backend copies company/agency, phone, WhatsApp, state/LGA and available legal address into the profile. NIN is handled by the existing encrypted identity submission flow. New accounts remain CLIENT with a requested professional account type until trusted administrator approval. Current subscription and settlement checks continue to control paid access.

## Validation

- Cloudflare production build completed successfully.
- Svelte diagnostics: zero errors and zero warnings.
- Backend suite: 83 tests passed, including the actual enrolment HTTP handler with real Convex Auth and database functions in an isolated Convex test database.
- Production Convex schema validation and function deployment succeeded; the two submission indexes were added without deleting existing indexes.
- Cloudflare Pages deployed successfully: https://490ae4f1.aliko-3f9.pages.dev.
- Live mobile checks confirmed both signup entry points lead to the corresponding single enrolment form, required account fields are visible, no horizontal overflow or browser exceptions occur, and the HTTP endpoint rejects invalid roles and cross-origin requests.
- Final `npm test` passed: zero Svelte errors/warnings, 83 backend tests passed, 122 Chromium tests passed and 7 skipped.

The regression run also identified and corrected light-theme state/LGA label contrast on the landing search panel. Language and professional-signup tests now follow the current hamburger-menu and single-form layouts.

## Limits

Payment credentials remain sandbox credentials; this change does not activate live payment fulfillment. No fake accounts or NIN submissions were inserted into production for testing. Professional role approval is still required. NIN format validation does not establish government identity verification.
