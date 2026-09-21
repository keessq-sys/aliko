import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

// NOTE: this previously also registered `ResendOTP` imported from
// "@convex-dev/auth/providers/ResendOTP" — that subpath does not exist in
// @convex-dev/auth@0.0.95 (only Anonymous/ConvexCredentials/Email/Password/
// Phone ship as providers), so the import failed to resolve and would have
// crashed this entire module at Convex bundle/deploy time, taking down
// signIn/signOut/isAuthenticated for the whole app — i.e. all auth. Removed
// until a real custom OTP provider is built (see the password-reset flow,
// which implements its own Resend-based email step directly via a Convex
// action instead of depending on this provider shape).
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Email + password for admin and agent accounts
    Password<DataModel>({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
          role: (params.role as string | undefined) ?? "CLIENT",
          isDiaspora: false,
          kycVerified: false,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        };
      },
    }),
  ],
});
