# Arabic, identity verification and activity monitoring — 3 October 2026

The application now offers English and Arabic interfaces, mandatory NIN submission during public signup, restricted identity review, a user activity desk, and administrator-initiated private conversations.

## Language and navigation

- The header and account workspace provide an English/Arabic selector. The choice is stored in a same-site language cookie and applied on the server as well as in the browser.
- Arabic uses right-to-left layout and an Arabic font. Form fields accept Unicode text; identifiers, email addresses and NIN numbers retain appropriate direction.
- The translation catalogue covers 2,690 extracted source strings across 124 Svelte components. Dates, relative times and prices follow the selected language.
- Each rendered application has its own i18next instance and locale store. A visitor's language does not change another server request's language.
- User names, private messages, identity notes and other customer-authored text are preserved. Customers can write messages and profile information in Arabic.
- The duplicate public desktop navigation row has been removed. Public route links remain in the hamburger menu.

The Arabic catalogue was generated from application-owned source text and important interface labels were reviewed. Translation does not send customer form entries or private messages to an external service. A qualified Arabic reviewer should approve the legal and specialized property wording before treating the Arabic policy text as legally authoritative. New interface copy should be extracted and translated through the included maintenance scripts; arbitrary future listing descriptions are not automatically sent for translation.

## NIN collection and access

- Buyer/renter, agent and manager signup forms require an 11-digit NIN and explicit consent. Arabic and Persian digits are normalized to ASCII without dropping leading zeroes.
- Signup still creates an ordinary customer account. A requested professional account type never grants administrator or professional privileges by itself.
- NINs are encrypted with AES-GCM in the separate `identities` table. A keyed HMAC fingerprint prevents duplicate identities. General profiles contain neither the raw NIN nor the encryption envelope.
- The temporary encrypted signup envelope is removed from the user record in the same registration transaction. Consent, identity and account records are committed together.
- The super administrator sees a masked NIN and verification status in Users & Roles. Revealing the full number requires the existing administrator role guard and a security check within five minutes, and creates an audit record.
- Manual approval requires recorded verification evidence. Submission and correct format leave the status pending; they do not establish identity.
- Existing users can submit their NIN from Account settings. Failed submissions can be corrected through that same interface.
- Land reservation and payment initialization require verified NIN status and the existing legal-address and KYC checks. New agent and manager approvals also require verified NIN status.
- Updated identity and privacy notices and new signup consent records use the policy date 2026-10-03. Existing consent history is retained.

`NIN_ENCRYPTION_KEY` is configured only in the production Convex environment. An encrypted operator copy is held outside the repository. It must be retained for disaster recovery and must not be replaced without a plan to re-encrypt existing records and update duplicate-detection fingerprints.

QoreID workflow initiation and signed result handling remain available, but provider credentials and the production workflow are an external requirement. A general provider KYC result is not assumed to verify the NIN captured at signup. Automatic approval of that NIN requires an authoritative provider result bound to the same submitted identity. Until then, the administrator can perform a documented review against authorized evidence.

## Activity and private conversations

- Registration and successful sign-in events are recorded by the Convex Auth lifecycle callbacks.
- Fifty-two public mutation definitions use a shared audit wrapper. Successful authenticated writes and their audit metadata commit in the same transaction; arguments and return values are not copied into the audit log.
- Profile changes, NIN submissions and reviews, NIN reveals, conversation creation and message sends also have explicit events.
- Authenticated sign-out requests are recorded. Actual session revocation continues through Convex Auth; a request event is not presented as proof that revocation completed.
- Signed-in page visits are reported by the browser with query strings removed, rate limits and repeated-visit suppression. Navigation events can be missing when the browser is offline or reporting is blocked.
- Users & Roles includes a paginated activity feed for all accounts or the selected account. Only the super administrator can query it.
- The administrator can choose a recipient in Conversations or open messaging for a selected user. The thread belongs to that recipient and is visible in their account.
- Replies and scanned attachments retain ownership checks, message limits and replay protection. Another customer cannot view or reply to the thread.
- In-app conversations work independently of an external email provider. Delivery of queued email notices still requires the configured email provider.

## Validation

- `npm test`: 52 backend tests passed; 96 Chromium browser tests passed; 7 conditional tests skipped.
- Svelte diagnostics: zero errors and zero warnings.
- Cloudflare production build succeeded.
- New backend tests cover Arabic digits, encryption, duplicate prevention, consent, administrator MFA boundaries, private Arabic conversations, mutation audit records and query-string removal.
- New browser tests cover Arabic server rendering, language persistence, Unicode form inputs, required NIN fields across signup types, mobile layout and the menu-only public navigation.
- Existing light/dark accessibility, media, authentication, route protection and public preview tests passed.

These checks establish the application behavior described here. They do not certify provider sandbox outcomes, legal approval, or unrestricted live transactions.
