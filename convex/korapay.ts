import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { assertCheckoutEnvironment } from "./lib/checkoutReadiness";

const endpoint = "https://api.korapay.com/merchant/api/v1/charges";
function key() {
  const secret = process.env.KORAPAY_SECRET_KEY;
  if (!secret) throw new Error("Korapay is not configured.");
  return secret;
}
export const initialize = action({
  args: { reference: v.string(), expectedAmount: v.number() },
  handler: async (ctx, args): Promise<{ checkoutUrl: string }> => {
    const secret = key();
    assertCheckoutEnvironment("KORAPAY", secret);
    const app = process.env.APP_URL ?? "https://alikodiamondkey.com";
    const http = process.env.CONVEX_HTTP_ACTIONS_URL;
    if (!http) throw new Error("Payment webhook endpoint is not configured.");
    const prepared = await ctx.runMutation(internal.checkout.prepare, {
      ...args,
      provider: "KORAPAY",
    });
    const response = await fetch(`${endpoint}/initialize`, {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: prepared.reference,
        amount: prepared.order.amount,
        currency: "NGN",
        customer: {
          email: prepared.customer.email,
          name: prepared.customer.name,
        },
        narration: prepared.order.title,
        redirect_url: new URL(
          `/checkout/${encodeURIComponent(args.reference)}`,
          app,
        ).href,
        notification_url: new URL("/webhooks/korapay", http).href,
      }),
    });
    const result = await response.json();
    // Network failures and ambiguous provider failures retain the lock for reconciliation.
    if (!response.ok || result.status !== true || !result.data?.checkout_url)
      throw new Error(
        "Korapay could not initialize checkout. Contact support before retrying.",
      );
    const url = new URL(result.data.checkout_url);
    if (
      url.protocol !== "https:" ||
      (url.hostname !== "checkout.korapay.com" &&
        !(
          secret.startsWith("sk_test_") &&
          url.hostname === "test-checkout.korapay.com"
        ))
    )
      throw new Error("Invalid Korapay checkout URL.");
    await ctx.runMutation(internal.checkout.saveLink, {
      reference: prepared.reference,
      url: url.href,
    });
    return { checkoutUrl: url.href };
  },
});

async function verify(ctx: ActionCtx, reference: string) {
  const row = await ctx.runQuery(internal.checkout.attempt, { reference });
  if (!row || row.attempt.provider !== "KORAPAY")
    throw new Error("Unknown Korapay payment.");
  const response = await fetch(`${endpoint}/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key()}` },
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  const tx = result.data;
  if (!response.ok || result.status !== true || tx?.reference !== reference)
    throw new Error("Korapay payment verification failed.");
  if (["failed", "cancelled"].includes(tx.status)) {
    await ctx.runMutation(internal.checkout.failed, { reference });
    throw new Error("Payment failed or was cancelled. You can retry checkout.");
  }
  if (tx.status !== "success")
    throw new Error("Payment has not been confirmed. Do not pay again.");
  // Namespace transaction references so providers cannot collide. Never trust a callback amount.
  return ctx.runMutation(internal.checkout.settle, {
    reference,
    providerId: `KORAPAY:${reference}`,
    provider: "KORAPAY",
    amount: Number(tx.amount_paid),
    currency: tx.currency,
  });
}
export const verifyPayment = action({
  args: { reference: v.string() },
  handler: async (
    ctx,
    { reference },
  ): Promise<{ reference: string; newlyConfirmed: boolean }> => {
    const user = await ctx.runQuery(api.users.getMyProfile, {});
    const row = await ctx.runQuery(internal.checkout.attempt, { reference });
    if (!user || !row || row.order?.ownerId !== user._id)
      throw new Error("Forbidden");
    return verify(ctx, reference);
  },
});
export const processWebhook = internalAction({
  args: { reference: v.string() },
  handler: async (
    ctx,
    { reference },
  ): Promise<{ reference: string; newlyConfirmed: boolean }> =>
    verify(ctx, reference),
});
export const reconcile = action({
  args: { reference: v.string() },
  handler: async (
    ctx,
    { reference },
  ): Promise<{ reference: string; newlyConfirmed: boolean }> => {
    await ctx.runQuery(internal.checkout.administrator, {});
    return verify(ctx, reference);
  },
});
