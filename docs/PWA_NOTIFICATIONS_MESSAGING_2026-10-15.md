# PWA, private alerts and reviewed communications — 15 October 2026

## Connected interfaces

The shared public/workspace hamburger menus include Get the app. Native installation events are captured at root lifetime; browsers that cannot prompt receive platform-specific instructions. The manifest supports standalone launch and shortcuts to properties, profile and the private notification centre. The service worker caches only an explicit public offline screen, brand image and app icons. It never caches personal HTML, API responses, transactions or private data. Offline actions require reconnection.

The personal notification centre at /dashboard/notifications contains a paginated, owner-only inbox, unread state, channel preferences, device registration/revocation, test alerts and recent private delivery records. Email, device alerts and optional announcements default off. Consent changes are audited. Device permission is requested only after the user chooses Enable device alerts.

The admin notification page includes the reviewed broadcast desk. Broadcasts have separate draft, approval and send actions. Recipient fan-out is paginated with a cursor checkpoint and per-recipient event keys; replay cannot duplicate inbox alerts. A nominated super administrator can review and approve a draft explicitly; this is not a requirement for a second administrator. Audience membership and current account state are checked on the server. External announcements require the recipient’s channel and optional-announcement consent.

Existing private messaging continues to enforce conversation ownership/assignment and trusted-admin access on reads and writes. Administrators can initiate a conversation with a user or staff account, and the recipient can reply. The compose panel collapses after selection to make more room for the thread. Loading and query/action errors have visible feedback. New-message alerts do not include private message contents in email or device payloads.

## Event coverage

Successful authenticated writes through auditedMutation create a private activity alert for the actor and administrative activity alerts for trusted administrators. Sign-in creates a security alert. Professional application review sends a targeted alert to the applicant. Private messaging sends recipient alerts. Existing legacy workflow email completion also creates a deduplicated in-app update. Viewing pages, typing, failed attempts and every third-party event are not presented as completed actions. Audit records remain the authoritative detail of operations.

## Delivery

Web Push uses VAPID signing keys kept in production Convex and a DPAPI-protected operator credential file; no private keys are committed or sent to the browser. Subscription endpoints and keys are validated, owner-bound and limited per account. The retry queue uses leases, bounded attempts and backoff; expired subscriptions are removed. Device and email jobs recheck opt-in and account suspension immediately before dispatch.

PUSH SENT means the browser push service accepted the encrypted payload; it does not prove device display or reading. EMAIL SENT likewise means provider acceptance. Browser permission, installation requirements, operating-system restrictions and provider availability affect delivery. Actual device permission and physical-device background delivery still require the owner to enable and test on their own device. Unconfigured channels are shown honestly rather than claiming successful delivery.

## Visual system

The existing shared navigation, emoji accents, diamond/key favicon, professional workspace typography, larger targets, contained tables and reduced-motion SVG illustration remain in place. A compact landing feature banner uses an inspected existing licensed photograph of a house key, property models and calculator. It is illustrative and does not assert that the image is a specific available listing.

## Validation

Five isolated backend scenarios cover alert privacy/idempotency, broadcast review and replay, consent withdrawal, subscription endpoint/ownership checks, message access, delivery leases and provider-acceptance wording. The complete npm test command passed with 91 backend tests and 132 Chromium tests, with seven browser scenarios skipped. Svelte reported zero errors and warnings. A fresh Cloudflare production build passed. Authenticated checks against production Convex exercised an operator-only test alert and mark-read, confirmed configured email/Web Push without exposing private keys, and checked notification, broadcast and message interfaces at 390px and 1280px in both themes. Axe reported no serious or critical violations on those screens; no horizontal overflow was detected. No customer broadcast, private customer message or payment was sent during verification. A missing admin-message document title found by these checks was corrected. The push dispatch batch was limited to five sequential requests so its timeout budget fits the two-minute lease; focused backend tests passed again. The final regression rerun after both corrections again passed: 91 backend tests, 132 Chromium tests, seven skipped, and zero Svelte errors/warnings. Production Convex deployment completed with schema validation and generated bindings. Changed-file credential and whitespace checks passed. Pre-landing review checked ownership, consent, replay checkpoints, bounded queries, delivery leases and status wording; the sequential push batch lease budget was corrected and retested. Browser/OS permission and physical-device background delivery remain acceptance steps, not verified claims. The frontend release is published through Cloudflare Pages; GitHub workflow status is reported separately for the resulting commit.
