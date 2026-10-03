import { requireUser } from "./lib/access";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import {
  createAccount,
  modifyAccountCredentials,
  invalidateSessions,
} from "@convex-dev/auth/server";
import { v } from "convex/values";
import { passwordProblem } from "./lib/passwordPolicy";

// Deploy-key/operator functions only. Browsers cannot bootstrap administrator access.
export const account = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", email),
      )
      .unique();
    return account?.userId ?? null;
  },
});
export const promote = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (
      !user ||
      user.email.toLowerCase() !== process.env.SUPER_ADMIN_EMAIL?.toLowerCase()
    )
      throw new Error("Designated administrator only");
    await ctx.db.patch(userId, { role: "ADMIN", accountStatus: "ACTIVE" });
    await ctx.db.insert("adminAuditLog", {
      actorId: userId,
      action: "SUPER_ADMIN_PROVISIONED",
      entityType: "users",
      entityId: String(userId),
      createdAt: Date.now(),
    });
  },
});
export const provision = internalAction({
  args: {},
  handler: async (ctx): Promise<{ configured: boolean }> => {
    const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!email || !password || passwordProblem(password))
      throw new Error("Operator configuration is incomplete");
    let userId = await ctx.runQuery(internal.superAdmin.account, { email });
    if (!userId) {
      const result = await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret: password },
        profile: {
          name: "Aliko Diamond Key Super Administrator",
          email,
          role: "CLIENT",
          isDiaspora: false,
          kycVerified: false,
          accountStatus: "ACTIVE",
          createdAt: Date.now(),
        },
        shouldLinkViaEmail: false,
        shouldLinkViaPhone: false,
      });
      userId = result.user._id;
    } else {
      await modifyAccountCredentials(ctx, {
        provider: "password",
        account: { id: email, secret: password },
      });
      await invalidateSessions(ctx, { userId });
    }
    await ctx.runMutation(internal.superAdmin.promote, { userId });
    return { configured: true };
  },
});

export const currentUser = internalQuery({
  args: {},
  handler: async (ctx) => {
    try {
      return (await requireUser(ctx))._id;
    } catch {
      return null;
    }
  },
});
