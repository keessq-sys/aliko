import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import type { DataModel } from "./_generated/dataModel";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import { publicSignupProfile } from "./lib/access";
import { rateLimiter } from "./lib/rateLimits";
import { ConvexError } from "convex/values";
import type { ConvexCredentialsUserConfig } from "@convex-dev/auth/providers/ConvexCredentials";

const passwordProvider = Password<DataModel>({
  reset: ResendOTPPasswordReset,
  profile: publicSignupProfile,
});
// Provider options are merged over the top-level defaults by Convex Auth.
// Wrap the actual Password callback, preserving its credential hashing and
// account/session writes, rather than replacing the unused provider default.
const passwordOptions = (
  passwordProvider as unknown as {
    options: ConvexCredentialsUserConfig<DataModel>;
  }
).options;
const authorizePassword = passwordOptions.authorize;
passwordOptions.authorize = async (params, ctx) => {
  if (
    (params.flow === "reset" || params.flow === "reset-verification") &&
    !process.env.RESEND_API_KEY
  )
    throw new ConvexError(
      "Password recovery email is not configured. Please contact support.",
    );
  try {
    return await authorizePassword(params, ctx);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (params.flow === "reset" && /InvalidAccountId/.test(message))
      return null;
    if (/InvalidAccountId|InvalidSecret|Invalid credentials/.test(message))
      throw new ConvexError("Email or password is incorrect.");
    if (/Accept the current Terms|Provide a valid name and email/.test(message))
      throw new ConvexError(message);
    if (/Invalid code/.test(message))
      throw new ConvexError("The recovery code is invalid or expired.");
    // Unexpected provider failures remain private in Convex logs.
    throw error;
  }
};

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
  signIn: { maxFailedAttempsPerHour: 8 },
  providers: [
    // Email + password for admin and agent accounts
    passwordProvider,
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      if (args.existingUserId === null) {
        const key =
          args.profile.email?.trim().toLowerCase() ?? String(args.userId);
        await rateLimiter.limit(ctx, "registration", { key, throws: true });
        const user = await ctx.db.get(args.userId);
        if (user?.registrationPolicyVersion)
          for (const policy of ["TERMS", "PRIVACY"] as const)
            await ctx.db.insert("policyAcceptances", {
              userId: args.userId,
              policy,
              version: user.registrationPolicyVersion,
              acceptedAt: Date.now(),
            });
        await ctx.db.insert("adminAuditLog", {
          actorId: args.userId,
          actorEmail: args.profile.email,
          action: "ACCOUNT_REGISTERED",
          entityType: "users",
          entityId: String(args.userId),
          createdAt: Date.now(),
        });
      }
    },
    async beforeSessionCreation(ctx, { userId }) {
      const user = await ctx.db.get(userId);
      if (user?.accountStatus === "SUSPENDED")
        throw new ConvexError("This account is suspended. Contact support.");
      if (!user) throw new Error("Account profile is missing");
      await ctx.db.patch(userId, { lastActiveAt: Date.now() });
      await ctx.db.insert("adminAuditLog", {
        actorId: userId,
        actorEmail: user.email,
        action: "ACCOUNT_SIGNED_IN",
        entityType: "users",
        entityId: String(userId),
        createdAt: Date.now(),
      });
    },
  },
});
