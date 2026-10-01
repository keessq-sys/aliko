import { requireAdmin } from "./lib/access";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

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
    const isSet = (name: string) =>
      Boolean(process.env[name] && process.env[name]!.trim().length > 0);
    return {
      paystack: isSet("PAYSTACK_SECRET_KEY"),
      flutterwave:
        isSet("FLUTTERWAVE_SECRET_KEY") && isSet("FLUTTERWAVE_SECRET_HASH"),
      whatsapp:
        isSet("WHATSAPP_ACCESS_TOKEN") &&
        isSet("WHATSAPP_PHONE_NUMBER_ID") &&
        isSet("WHATSAPP_VERIFY_TOKEN") &&
        isSet("WHATSAPP_APP_SECRET"),
      dropboxSign: isSet("DROPBOX_SIGN_API_KEY"),
      qoreId: isSet("QOREID_CLIENT_ID"),
      resend:
        (isSet("RESEND_API_KEY") || isSet("AUTH_RESEND_KEY")) &&
        isSet("RESEND_FROM_EMAIL"),
      serverGeocoding: isSet("GOOGLE_MAPS_API_KEY"),
      malwareScanner:
        isSet("MALWARE_SCANNER_URL") && isSet("MALWARE_SCANNER_API_KEY"),
    };
  },
});
