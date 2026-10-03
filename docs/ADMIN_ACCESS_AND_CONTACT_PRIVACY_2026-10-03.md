# Administrator access and contact privacy — 3 October 2026

The application has a separate administrator sign-in at `/auth/admin`, linked from the public header and its solid navigation drawer. Production uses the designated company account `alikodiamondkey@gmail.com`.

## Access boundary

Public registration always creates a customer account. Agent and manager selections record onboarding intent; approval grants their professional role. Public signup cannot create the designated administrator account or grant ADMIN privileges.

An operator-only Convex internal action, `superAdmin:provision`, creates or updates the designated password account, hashes its password through Convex Auth, promotes the matching user and audits provisioning. Existing sessions are revoked when credentials are updated. Existing MFA enrollment is preserved. The temporary `SUPER_ADMIN_PASSWORD` environment variable was removed after production provisioning. No administrator password or session secret is embedded in the frontend or committed source.

`SUPER_ADMIN_EMAIL` binds administrator authorization to that account. Protected backend access checks account status and the active Convex session, in addition to the role. Administrator console routes retain MFA verification. Production has `ADMIN_MFA_REQUIRED=true`; first-time users must set up their own authenticator, and subsequent sessions must verify it. Ordinary signed-in users cannot open the administrator console.

Sessions use the existing cryptographically verified Convex authentication keys and HTTP-only cookies. The supplied `ADMIN_SESSION_SECRET` is not required by this architecture and was not installed as a separate authentication method.

## Account lifecycle

A signed-in browser cannot create another account or complete another credential sign-in until it logs out. This applies to registration, login and verification flows that would replace the current account. Browser Web Locks serialize authentication changes across tabs; session-change events refresh other tabs. Account ownership comes from the backend, never from the local role preference.

Logout is visible on public signed-in headers and the common dashboard navigation. It revokes the backend session before clearing browser cookies. One bounded retry handles a lost response; a persistent failure remains visible and does not falsely report successful logout. Login and signup pages redirect authenticated users to their own dashboard.

All password fields have show/hide controls. Registration and new-password recovery use the shared strength meter and server-enforced policy: 12–128 characters, including uppercase, lowercase, a digit and a symbol. Existing passwords can still be used for sign-in.

## Contact privacy

Public agent responses omit telephone and email fields. Property agent summaries contain only display identity. Site-visit responses project minimal user summaries rather than whole profiles; assigned visit notes and enquiry contact/message fields are not returned to agents. The complete booking roster is administrator-only; booking lookup requires ownership or verified administrator access. Service-request tracking and conversation access enforce current ownership or verified administrator access.

Customers can view their own profiles and requests. Other registered users' contact records remain available to the verified super-admin desk. Public property and agent contact buttons use the company telephone, email and WhatsApp. The public email is `alikodiamondkey@gmail.com`, including footer, policy pages, organization metadata and site text for search assistants.

## Navigation and presentation

Private workspaces have a common header with the company logo, solid menu, back/forward navigation, theme control and logout. Headers and fixed sidebars reserve space below it. Public navigation has a hamburger menu at every screen size and history controls in the header or drawer.

The hero uses a two-column search panel with larger dark native selectors, readable labels and a full-width search action. The property, map and WhatsApp links beneath it have solid backgrounds and readable text in both themes.

## Operator sign-in

1. Open `/auth/admin` on the production website.
2. Enter the supplied administrator email and password.
3. Set up an authenticator if prompted, or enter its current six-digit code.
4. After verification, the application opens `/admin`.
5. Use Logout before signing into another account in that browser.

Administrator MFA recovery remains an explicit operator procedure; provisioning a password does not bypass it. Password-recovery email still requires the separately configured transactional email provider.

## Validation

- `npm test`: application check passed with zero errors and zero warnings; 46 backend tests passed; 91 Chromium tests passed; seven conditional provider/administrator-session tests skipped.
- Production frontend build and Convex deployment completed successfully.
- Live verification exercised the actual administrator form against production Convex, realtime session synchronization, the administrator MFA gate, rejection of account switching, and the visible logout control.
- Desktop and mobile browser coverage includes both themes, navigation, search and registration password controls.
- Source diff passed whitespace checks and a check against the actual protected administrator password.

These checks cover this authentication, privacy and interface release. They do not certify payment providers or unrelated external enterprise integrations.
