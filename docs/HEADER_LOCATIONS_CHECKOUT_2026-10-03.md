# Header, Nigerian locations and checkout — 3 October 2026

The logo remains physically on the left in English and Arabic. Language, theme and menu controls form one group on the right. Public account routes, administrator sign-in, history navigation and signed-in profile/payment/logout links are inside the hamburger menu. Private workspaces use the same compact arrangement.

## Location and registration data

The shared local catalogue contains all 36 Nigerian states, Abuja FCT and 774 LGAs/area councils. State changes clear incompatible LGA selections. It is used by home/property search, professional account creation and enrolment, service request forms, project creation and listing-management forms. The public agent state filter includes the entire state catalogue. Addresses and neighbourhood descriptions remain free-text alongside structured state/LGA selections.

Professional account creation requires state, LGA, NIN and explicit NIN consent. Account creation and enrolment are linked; saved account details seed the agent/manager forms. Enrolment verifies that the submitted state/LGA pair is valid and that a private identity record exists. Approval and payment continue to require a VERIFIED identity. A submitted NIN is not automatically government-verified. Full NIN data remains encrypted and protected by the existing administrator MFA/reveal audit.

Operating region and professional text fields are persisted in private application records. Professional contact phone updates are synchronized to the authenticated user profile. Public directories do not receive applicants' email, phone, NIN or private review details.

The Enterprise/Custom manager plan is removed from new enrolment and rejected by its public mutation. Legacy historical records remain intact. Starter and Professional remain available; administrator fee overrides are read at checkout.

## Payment routes and pricing

- Land bookings retain `/checkout/[booking-reference]` and their existing legal/allocation workflow. The payable amount is the outstanding contracted balance; settlement does not invent instalment percentages or due dates. Only one pending payment is permitted for a booking.
- Verified published property purchases create an owner-bound order and open the same checkout route.
- Services are paid against an approved, owner-bound service quote, rather than a marketing starting-price or budget estimate.
- Manager plans are paid against the enrolled manager record and its current configured fee. Payment does not approve the professional account. The paid period is recorded as 30 days; no automatic recurring card charge is enabled.
- `/dashboard/payments` lists the account's orders and land bookings and provides manager-plan payment entry after returning to the application.
- Administrator Finance displays the new property/service/plan orders with pagination and can recheck a known provider transaction. Manager approvals permit audited per-manager fee changes.

A draft checkout reads current pricing from Convex. Payment initiation recomputes it and rejects a stale displayed amount. Once a provider attempt starts, that attempt's amount is fixed for verification. The browser does not select the amount actually charged. Hosted payment links are validated and saved so an existing attempt can be resumed. Ambiguous network failures retain their lock for provider reconciliation, rather than creating another charge.

The existing signed/replay-protected Flutterwave webhook dispatcher routes the new order references to their verification handler. A transaction is credited only after server-side reference, transaction ID, amount, currency and successful-state checks. Settlement is idempotent and queues a receipt. Orders reserve purchased properties, record service quote payment or record a manager paid-through date. Legal transfer/approval is still a separate controlled process.

Provider pattern checked against [Flutterwave Standard](https://developer.flutterwave.com/docs/flutterwave-standard-1) and [Transaction Verification](https://developer.flutterwave.com/docs/transaction-verification).

## Verification

- `npm test`: 60 backend tests passed; 99 Chromium browser tests passed; 7 conditional provider/admin tests skipped.
- Final application diagnostics: 0 errors, 0 warnings.
- Final backend rerun after profile-field synchronization: 60 tests passed.
- Production build and remote deployment are verified separately in the task handoff.
- New coverage includes 37 regions/774 LGAs, state/LGA mismatch, state-change clearing, English/Arabic header positioning, mobile professional registration, changed pricing, wrong amount/currency, private order access, NIN restrictions, duplicate settlement and hosted checkout/provider verification with mocked provider responses.
- An existing unnamed toast-close button exposed by the first browser run was fixed. The final full browser run passed its light/dark accessibility checks.

## Operational limits

No real customer payment was charged for verification. Mocked provider responses do not certify a provider sandbox or production account. Existing payment credentials, production approval gates, verified identity, provider sandbox certification and legal/operational approvals remain required before unrestricted live transactions. Receipt email delivery also depends on the configured email provider.

The existing land refund/legal workflow is retained; the new property/service/plan ledger does not claim to extend every land-specific refund, deed or aggregate-reporting operation to non-land purchases. Administrator Finance exposes authoritative new order records for monitoring and provider reconciliation.

Location source and licensing are documented in [NIGERIA_LOCATION_DATA.md](NIGERIA_LOCATION_DATA.md).
