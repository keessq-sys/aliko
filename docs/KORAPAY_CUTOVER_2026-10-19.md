# Korapay checkout cutover — 19 October 2026

The owner authorized Korapay live payments on 19 October 2026. The supplied live credentials were saved in the DPAPI-protected operator credential store and production Convex environment, never in repository source. A read-only Korapay Balance API request accepted the live secret and reported an NGN channel; account balances were not printed. A separately labeled, unpaid NGN 100 operator diagnostic checkout was also accepted by the live initialize API and returned the expected checkout.korapay.com domain. Its URL was not published and no payment was entered or funded. These are authentication and initialization evidence, not evidence of a funded transaction or settlement to a bank account.

## Payment policy

`ACTIVE_PAYMENT_PROVIDER=KORAPAY` prevents new Flutterwave and Paystack initialization on the server. Historical records, verification functions and webhooks remain available for reconciliation. Pending attempts on suspended providers do not expose a continue-payment link; they require reconciliation before another payment, rather than silently releasing a potentially funded order.

The production live gate is enabled only after deployment and regression checks, under `OWNER-KORAPAY-AUTHORIZATION-2026-10-19`. This records the owner's authorization, not a third-party production certification. Staging and development still require test keys.

## Dynamic amounts and ownership

- Property amounts come from the active, verified, available listing.
- Service amounts come from the customer's approved unpaid quote.
- Manager subscription amounts come from the configured plan or authorized fee override. Payment does not approve the manager application. A changed plan requires reconciliation rather than receiving a different entitlement for an old charge.
- Land amounts come from the owner's contracted booking balance. A previous pending payment blocks a second checkout. In-flight checkout also blocks booking cancellation. A verified settlement updates the booking, durable payment record and financial aggregates, and starts the existing fulfillment workflow once.

The browser displays the resolved amount and must confirm the current price again at initialization. Korapay receives NGN amounts from the server; users cannot substitute a browser amount. The merchant bears provider fees so the checkout order's gross amount remains the amount requested. Provider settlement fees and bank settlement schedules remain governed by the Korapay merchant account.

Settlement requires an authenticated provider lookup with the matching reference, currency and exact amount paid. Callback URL parameters alone cannot mark an order paid. Webhooks validate HMAC-SHA256 over the data object, maintain replay records and verify the provider transaction before changing payment state. Signed failure events also reconcile failed attempts. Replay cannot credit the booking or grant a subscription twice.

Hosted checkout keeps card entry with Korapay. Its encryption key is stored securely but is not used to collect raw card data in this application. The merchant account associated with the secret key receives the payment; the client ID alone does not direct funds to a bank account.

## Landing page and footer

The buyer/renter and professional call-to-action section follows Services. The trust banner follows the Investment ROI Calculator and precedes FAQ. The footer keeps branding, linked social icons, contact details and the existing newsletter form; repeated navigation groups were removed. This cutover does not add a newsletter delivery service.

## Acceptance boundary

Automated tests exercise provider suspension, trusted amount calculation, mismatch rejection, ownership, land balance settlement, cancellation locking and idempotency with isolated fixtures. Production checks verify configuration and reject unsigned webhooks without sending customer messages or moving funds. No real card charge, funded transfer, refund or bank settlement is asserted by these tests. An owner-funded payment and confirmation in Korapay's merchant dashboard remain the evidence needed to prove the complete money movement journey.

## Release validation

The final production build completed. Svelte reported zero errors and warnings. All 93 backend tests passed with one worker after a memory-pressure setup timeout in an existing enrolment suite; no assertions or timeout limits were relaxed. All 134 Chromium tests passed, with seven existing scenarios skipped. The browser suite includes the requested section order, simplified footer, public navigation, registration, accessibility and theme checks. Production Convex deployment completed with generated bindings and schema validation. The production webhook rejected an unsigned request with HTTP 401 and acknowledged a correctly signed unsupported diagnostic event with HTTP 200 without recording a payment.
