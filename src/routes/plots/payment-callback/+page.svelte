<script lang="ts">
  // Paystack redirects the browser here after checkout (success, failure or
  // abandon) with ?reference=<booking reference> on the query string. This
  // page never confirms payment itself — it only *displays* the booking's
  // current status, which becomes SUCCESS only once Paystack's webhook
  // (convex/http.ts -> bookings.confirmPayment) has actually verified the
  // charge server-side. useQuery is a live Convex subscription, so the
  // status here updates automatically the moment the webhook lands —
  // usually within a second or two of landing on this page — with no
  // polling loop needed.
  import { useQuery } from '$lib/convex/queries';
  import { api } from '$lib/convex/_generated/api';
  import { page } from '$app/stores';
  import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-svelte';
  import { formatNaira } from '$lib/utils/format';

  $: reference = $page.url.searchParams.get('reference') ?? '';
  $: booking = useQuery(api.bookings.getBookingByReference, { reference });
</script>

<svelte:head>
  <title>Payment Status — Aliko Diamond Key</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[#050A0E] px-4 text-white">
  <div class="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A1628] p-8 text-center">
    {#if !reference}
      <XCircle size={40} class="mx-auto mb-4 text-rose-400" />
      <h1 class="mb-2 text-xl font-bold">Missing payment reference</h1>
      <p class="text-sm text-stone-400">We couldn't find a booking reference in this link.</p>
    {:else if $booking === undefined}
      <Loader2 size={40} class="mx-auto mb-4 animate-spin text-stone-500" />
      <h1 class="text-xl font-bold">Checking payment status…</h1>
    {:else if $booking === null}
      <XCircle size={40} class="mx-auto mb-4 text-rose-400" />
      <h1 class="mb-2 text-xl font-bold">Booking not found</h1>
      <p class="text-sm text-stone-400">Reference <span class="font-mono text-stone-300">{reference}</span> doesn't match any booking.</p>
    {:else if $booking.paymentStatus === 'SUCCESS'}
      <CheckCircle2 size={40} class="mx-auto mb-4 text-emerald-400" />
      <h1 class="mb-2 text-xl font-bold">Payment confirmed</h1>
      <p class="mb-1 text-sm text-stone-400">{formatNaira($booking.paidAmount)} received for {$booking.plot?.beaconNumber}.</p>
      <p class="mb-6 font-mono text-xs text-stone-600">{$booking.reference}</p>
      <a href="/dashboard/client" class="btn-primary inline-flex min-h-[44px] w-full items-center justify-center py-3">Go to My Dashboard</a>
    {:else if $booking.paymentStatus === 'FAILED'}
      <XCircle size={40} class="mx-auto mb-4 text-rose-400" />
      <h1 class="mb-2 text-xl font-bold">Payment not completed</h1>
      <p class="mb-6 text-sm text-stone-400">Your reservation is still held as pending. You can retry payment from your dashboard.</p>
      <a href="/dashboard/client" class="btn-primary inline-flex min-h-[44px] w-full items-center justify-center py-3">Go to My Dashboard</a>
    {:else}
      <Clock size={40} class="mx-auto mb-4 animate-pulse text-amber-400" />
      <h1 class="mb-2 text-xl font-bold">Waiting for confirmation…</h1>
      <p class="mb-6 text-sm text-stone-400">
        If you completed payment on Paystack, this page will update automatically within a few seconds. It's safe to leave — your booking is saved.
      </p>
      <a href="/dashboard/client" class="text-sm text-emerald-400 hover:underline">Go to My Dashboard instead</a>
    {/if}
  </div>
</div>
