import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ResendOTP } from "@convex-dev/auth/providers/ResendOTP";
import { DataModel } from "./_generated/dataModel";

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
    // OTP via Resend for client magic-link auth
    ResendOTP,
  ],
});
