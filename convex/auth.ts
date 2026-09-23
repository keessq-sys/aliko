import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import type { DataModel } from "./_generated/dataModel";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";

// NOTE: this previously also registered a top-level `ResendOTP` provider
// imported from "@convex-dev/auth/providers/ResendOTP" — that subpath does
// not exist in @convex-dev/auth@0.0.95 (only Anonymous/ConvexCredentials/
// Email/Password/Phone ship as providers), so the import failed to resolve
// and would have crashed this entire module at Convex bundle/deploy time,
// taking down signIn/signOut/isAuthenticated for the whole app. Removed.
// Password reset is wired the way this provider actually supports it: via
// Password's own `reset`/`reset-verification` flows (see
// ResendOTPPasswordReset.ts), not a separate top-level provider.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Email + password for admin and agent accounts
    Password<DataModel>({
      reset: ResendOTPPasswordReset,
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
          role: ((params.role as "ADMIN" | "AGENT" | "ESTATE_MANAGER" | "CLIENT" | "DIASPORA_CLIENT" | "TENANT" | undefined) ?? "CLIENT"),
          isDiaspora: false,
          kycVerified: false,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        };
      },
    }),
  ],
});
