import { requireAdmin } from "./lib/access";
import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
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
      korapay: isSet("KORAPAY_SECRET_KEY"),
      korapayMode: process.env.KORAPAY_SECRET_KEY?.startsWith("sk_test_")
        ? "sandbox"
        : "live",
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
export const health = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const database = Boolean(await ctx.db.get(admin));
    const delivery = await ctx.db
      .query("integrationChecks")
      .withIndex("by_check", (q) =>
        q.eq("check", "RESEND_VERIFICATION_DELIVERED"),
      )
      .order("desc")
      .first();
    const checks = await ctx.db
      .query("integrationChecks")
      .order("desc")
      .take(20);
    return {
      service: "aliko-diamond-key",
      timestamp: Date.now(),
      database: { reachable: database },
      ai: { configured: Boolean(process.env.WORKERS_AI_API_TOKEN) },
      email: {
        configured: Boolean(
          process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL,
        ),
        deliveryVerifiedAt: delivery?.passed ? delivery.checkedAt : null,
      },
      payments: {
        korapayConfigured: Boolean(process.env.KORAPAY_SECRET_KEY),
        korapayMode: process.env.KORAPAY_SECRET_KEY?.startsWith("sk_test_")
          ? "sandbox"
          : "live",
        liveTransactionsEnabled:
          process.env.LIVE_TRANSACTIONS_ENABLED === "true",
      },
      storage: {
        malwareScannerConfigured: Boolean(process.env.MALWARE_SCANNER_API_KEY),
      },
      checks,
    };
  },
});
// Operator-only evidence: browsers cannot label a provider as certified.
export const recordCheck = internalMutation({
  args: {
    check: v.string(),
    passed: v.boolean(),
    evidenceReference: v.string(),
  },
  handler: async (ctx, args) => {
    if (
      !/^[A-Z_]{5,80}$/.test(args.check) ||
      args.evidenceReference.length > 200
    )
      throw new Error("Invalid evidence reference.");
    return ctx.db.insert("integrationChecks", {
      ...args,
      checkedAt: Date.now(),
    });
  },
});
