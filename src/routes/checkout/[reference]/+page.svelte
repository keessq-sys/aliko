<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { getTranslation } from "$lib/i18n";
  import OrderCheckout from "$lib/components/payments/OrderCheckout.svelte";
  const adkT = getTranslation();
  $: reference = $page.params.reference ?? "";
  $: isOrder = reference.startsWith("ADK-ORDER-");
  $: booking = useQuery(isOrder ? null : api.bookings.getBookingByReference, { reference });
  let converting = false, error = "";
  async function continueBooking() {
    if (!$booking) return;
    converting = true; error = "";
    try {
      const order = await runMutation(api.checkout.create, { kind: "LAND", targetId: $booking._id });
      await goto(`/checkout/${encodeURIComponent(order.reference)}`, { replaceState: true });
    } catch(e) { error = e instanceof Error ? e.message : "Could not prepare checkout."; }
    finally { converting = false; }
  }
</script>
<svelte:head><title>{$adkT("Secure Checkout — Aliko Diamond Key")}</title><meta name="robots" content="noindex,nofollow" /></svelte:head>
{#if isOrder}<OrderCheckout {reference} />{:else}
  <section class="theme-surface theme-text min-h-screen px-4 py-12">
    <div class="mx-auto max-w-3xl rounded-2xl border p-6 sm:p-10 space-y-6">
      <h1 class="text-3xl font-bold">{$adkT("Secure Checkout")}</h1>
      {#if $booking === undefined}<p role="status">{$adkT("Loading…")}</p>
      {:else if !$booking}<p role="alert">{$adkT("Booking not found")}</p>
      {:else if $booking.paymentStatus === "SUCCESS"}<p role="status">{$adkT("Payment confirmed")}</p>
      {:else}
        <h2 class="text-xl font-semibold">{$booking.project?.name} · {$booking.plot?.plotNumber}</h2>
        <p>{$adkT("Reference")}: {$booking.reference}</p>
        <button class="btn-primary min-h-[52px] w-full" on:click={continueBooking} disabled={converting}>{$adkT(converting ? "Preparing checkout…" : "Review and pay")}</button>
      {/if}
      {#if error}<p role="alert">{$adkT(error)}</p>{/if}
      <a class="underline" href="/dashboard/payments">{$adkT("My payments")}</a>
    </div>
  </section>
{/if}
