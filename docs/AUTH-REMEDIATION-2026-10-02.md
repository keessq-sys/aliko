# Authentication synchronization remediation — 2 October 2026

## Changes

The browser previously refreshed its session on every token lookup, could reuse
an anonymous lookup immediately after login, and navigated before Convex confirmed
authentication. Protected server routes only considered the access cookie and
could discard it during an outage. Fresh credential submissions also inherited
old access tokens.

The application now verifies existing sessions with Convex, refreshes expired
access through Convex Auth's transactional refresh mechanism, shares concurrent
browser lookups, and waits for the authenticated WebSocket state before navigating.
Fresh signup/login requests do not inherit another session's JWT. Cookies are
HTTP-only, use secure transport in production, and authentication responses are
private and non-cacheable. Protected routes retain their role, ownership, account
suspension, and administrator MFA checks. Sign-out confirms backend revocation.

Signup preserves the customer's name, normalized email, diaspora preference,
requested account type, and company/agency details. Agent and manager enrollment
forms prefill from that account and persist applications against its user ID.
Signup cannot assign administrator or professional privileges: new accounts have
client access, and professional access requires approval. Registration consent
records and registration/sign-in audit entries are stored in Convex. Sign-in and
profile updates refresh the account's last-active timestamp.

Expected password errors now reach the frontend safely through the actual
Password provider options used by Convex Auth. Recovery does not reveal whether
an unknown address has an account. Configuration/delivery failures no longer
claim that a recovery email was sent. Inactive Google sign-in and unused remember-me
controls were removed. Homepage fades now honor reduced-motion preferences; this
also resolves transient contrast failures during the accessibility audit.

## Verification

- Production build completed successfully.
- `npm test`: Svelte check has zero errors/warnings; all 41 backend tests passed;
  88 Chromium browser tests passed and seven credential-dependent tests were skipped.
- Backend tests exercise the real Password provider: signup, hashed credentials,
  signed JWT verification, stored profiles/consent, login, refresh, profile edits,
  logout, suspension, privilege protection, and account-linked agent/manager enrollment.
- Browser tests cover failed-session handling, cross-site reads, unsupported flows,
  payload limits, and unavailable password recovery without false delivery claims.
- The production private signing key matches the published JWKS; JWKS returns 200.
- Live production checks confirm anonymous-session privacy, failed-login feedback
  in the actual browser, required signup consent, and the unavailable-recovery message.
- Successful account creation was tested in isolated Convex databases. These checks
  did not create synthetic production customer accounts or send customer messages.

## Production locations and remaining dependency

Website: https://alikodiamondkey.com. Backend: production deployment
`gallant-husky-352`. Changes are committed to the repository's `main` branch.

Password recovery remains unavailable until a production `RESEND_API_KEY` and
a verified sender for `noreply@alikodiamondkey.com` are configured. Store the key
in Convex's protected environment configuration, not in source control or chat.
This report establishes the tested authentication behavior; it does not certify
payment providers, unrestricted live transactions, or external integrations.
