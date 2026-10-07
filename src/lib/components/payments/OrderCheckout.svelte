<script lang="ts">
  import { getI18n } from "$lib/i18n";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { api } from "$lib/convex/_generated/api";
  import { runAction, useQuery } from "$lib/convex/queries";
  import { formatNaira } from "$lib/utils/format";
  const { t: adkT, locale } = getI18n();
  export let reference: string;
  $: order = useQuery(api.checkout.get, { reference });
  let error = "",
    busy = false;
  const providers = useQuery(api.checkout.providers, {});
  let provider: "FLUTTERWAVE" | "KORAPAY" = "KORAPAY";
  async function pay() {
    if (!$order) return;
    busy = true;
    error = "";
    try {
      const result = await runAction(
        provider === "KORAPAY"
          ? api.korapay.initialize
          : api.checkout.initialize,
        {
          reference,
          expectedAmount: $order.amount,
        },
      );
      window.location.assign(result.checkoutUrl);
    } catch (e) {
      error =
        e instanceof Error ? e.message : "Could not start secure checkout.";
    } finally {
      busy = false;
    }
  }
  onMount(async () => {
    const params = $page.url.searchParams,
      transactionId = params.get("transaction_id"),
      tx = params.get("tx_ref");
    const korapayReference = params.get("reference");
    if (korapayReference) {
      busy = true;
      try {
        await runAction(api.korapay.verifyPayment, {
          reference: korapayReference,
        });
        history.replaceState(
          {},
          "",
          `/checkout/${encodeURIComponent(reference)}`,
        );
      } catch (e) {
        error = e instanceof Error ? e.message : "Payment verification failed.";
      } finally {
        busy = false;
      }
      return;
    }
    if (transactionId && tx) {
      busy = true;
      try {
        await runAction(api.checkout.verifyPayment, {
          transactionId,
          reference: tx,
        });
        history.replaceState(
          {},
          "",
          `/checkout/${encodeURIComponent(reference)}`,
        );
      } catch (e) {
        error = e instanceof Error ? e.message : "Payment verification failed.";
      } finally {
        busy = false;
      }
    }
  });
</script>

<div class="theme-surface theme-text min-h-screen px-4 py-12">
  <section class="mx-auto max-w-3xl rounded-2xl border p-6 sm:p-10 space-y-6">
    <h1 class="text-3xl font-bold">{$adkT("Secure Checkout")}</h1>
    <a class="underline" href="/dashboard/payments">{$adkT("My payments")}</a>
    {#if $order === undefined}<p>{$adkT("Loading…")}</p>
    {:else if !$order}<p>{$adkT("Order not found or access denied.")}</p>
    {:else}
      <h2 dir="auto" class="text-xl font-semibold">{$order.title}</h2>
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <dt>{$adkT("Reference")}</dt>
          <dd class="break-all" dir="ltr">{$order.reference}</dd>
        </div>
        <div>
          <dt>{$adkT("Status")}</dt>
          <dd>{$adkT($order.status)}</dd>
        </div>
        <div>
          <dt>{$adkT("Amount to pay")}</dt>
          <dd class="text-3xl font-bold">
            {formatNaira($order.amount, $locale)}
          </dd>
        </div>
      </dl>
      {#if $order.status === "REFUNDED"}<p role="status">{$adkT("This payment was refunded. Paid access from this order is no longer active.")}</p>
      {:else if $order.status === "PAID"}<p role="status">
          {$adkT(
            "Payment confirmed. Your payment has been recorded in your account.",
          )}
        </p>
      {:else if !$order.available}<p role="alert">{$adkT($order.reason)}</p>
      {:else if $order.status === "PENDING"}{#if "checkoutUrl" in $order && $order.checkoutUrl}<a
            class="btn-primary block text-center"
            href={$order.checkoutUrl}>{$adkT("Continue existing payment")}</a
          >{/if}
        <p>
          {$adkT(
            "Payment verification is pending. Do not make another payment. Contact support if you need help.",
          )}
        </p>
      {:else}<p>
          {$adkT(
            "This amount reflects the current approved price. A price change requires another review before payment. Your card details stay with the payment provider.",
          )}
        </p>
        <label for="payment-provider">{$adkT("Payment provider")}</label>
        <select
          id="payment-provider"
          bind:value={provider}
          class="theme-input block min-h-[44px] w-full rounded-lg border px-3"
        >
          <option value="KORAPAY"
            >Korapay {$providers?.korapay.sandbox ? "(test mode)" : ""}</option
          >
          <option value="FLUTTERWAVE">Flutterwave</option>
        </select>
        {#if $providers && !$providers[provider === "KORAPAY" ? "korapay" : "flutterwave"].available}
          <p role="status">
            {$adkT(
              "This payment provider is not available for production payments. Contact support.",
            )}
          </p>
        {/if}
        <button
          class="btn-primary w-full min-h-[52px]"
          disabled={busy ||
            !$providers ||
            !$providers[provider === "KORAPAY" ? "korapay" : "flutterwave"]
              .available}
          on:click={pay}
          >{$adkT(
            busy
              ? "Verifying…"
              : provider === "KORAPAY"
                ? "Pay securely with Korapay"
                : "Pay securely with Flutterwave",
          )}</button
        >
      {/if}
    {/if}
    {#if error}<p role="alert">{$adkT(error)}</p>{/if}
    <a class="underline" href="/dashboard/account"
      >{$adkT("Complete identity verification and profile")}</a
    >
  </section>
</div>
