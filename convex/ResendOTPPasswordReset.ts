// convex/ResendOTPPasswordReset.ts
// A custom Auth.js-shaped EmailConfig for the Password provider's `reset`
// flow (see convex/auth.ts). @convex-dev/auth@0.0.95 does NOT ship a
// ready-made "ResendOTP" provider under any package subpath — the previous
// code imported one that didn't exist, which crashed the whole auth module
// at deploy time (see the removal note in convex/auth.ts). This is the
// provider Convex Auth's own docs describe you author yourself: a 6-digit
// code, emailed via Resend's REST API directly (no SDK dependency — same
// raw-fetch approach convex/whatsapp.ts already uses for the WhatsApp
// Business API), and verified against what the user submits.
//
// MANUAL STEP: set RESEND_API_KEY via `npx convex env set RESEND_API_KEY ...`
// and verify a sending domain with Resend before this can send real email —
// until then, `requestPasswordReset` (convex/auth.ts callers) will fail with
// a clear "not configured" error rather than silently doing nothing.
//
// Deliberately not importing from src/lib/data/organization.ts here: Convex
// bundles only the convex/ directory (plus its own node_modules), so an
// import reaching into the SvelteKit app's src/ tree is exactly the kind of
// change that looks fine locally but can fail to bundle/deploy on Convex —
// the same class of bug already found and removed once in convex/auth.ts.
// These two constants are duplicated here on purpose to stay self-contained.
const SITE_NAME = "Aliko Diamond Key";
const SITE_HOSTNAME = "alikodiamondkey.com";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const ResendOTPPasswordReset = {
  id: "resend-otp-password-reset",
  type: "email" as const,
  name: "Reset password",
  maxAge: 60 * 15, // 15 minutes
  async generateVerificationToken() {
    return generateCode();
  },
  async sendVerificationRequest({
    identifier: email,
    token,
  }: {
    identifier: string;
    token: string;
  }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Password reset email is not configured — set RESEND_API_KEY (npx convex env set RESEND_API_KEY ...)."
      );
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // MANUAL STEP: replace with a domain verified in the Resend
        // dashboard once one exists; Resend's shared onboarding sender
        // works for testing but will not reliably deliver in production.
        from: `${SITE_NAME} <noreply@${SITE_HOSTNAME}>`,
        to: [email],
        subject: `Your ${SITE_NAME} password reset code`,
        text: `Your password reset code is ${token}. It expires in 15 minutes. If you didn't request this, you can ignore this email.`,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to send password reset email: ${body}`);
    }
  },
};
