import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId as Id<"users">);
  if (user?.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
  return userId;
}

/**
 * Reports whether each server-side integration secret is actually set in
 * this Convex deployment's environment (`npx convex env set ...`) — never
 * returns the secret value itself, only a boolean, so this is safe to
 * expose to admin users. Backs the admin/settings integration checklist,
 * which previously hardcoded every integration as "not connected"
 * regardless of what was actually configured.
 */
export const getIntegrationStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const isSet = (name: string) => Boolean(process.env[name] && process.env[name]!.trim().length > 0);
    return {
      paystack: isSet("PAYSTACK_SECRET_KEY"),
      whatsapp: isSet("WHATSAPP_ACCESS_TOKEN") && isSet("WHATSAPP_PHONE_NUMBER_ID") && isSet("WHATSAPP_VERIFY_TOKEN"),
      dropboxSign: isSet("DROPBOX_SIGN_API_KEY"),
      qoreId: isSet("QOREID_CLIENT_ID"),
      resend: isSet("RESEND_API_KEY") || isSet("AUTH_RESEND_KEY")
    };
  }
});
