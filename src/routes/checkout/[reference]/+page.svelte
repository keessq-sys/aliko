<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$lib/convex/_generated/api';
  import { runAction, useQuery } from '$lib/convex/queries';
  import CheckoutSummary from '$lib/components/payments/CheckoutSummary.svelte';
  import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard, Loader2, LockKeyhole, RotateCcw, XCircle } from 'lucide-svelte';

  const reference = $page.params.reference ?? '';
  const booking = useQuery(api.bookings.getBookingByReference, { reference });

  let starting = false;
  let verifying = false;
  let verified = false;
  let error = '';
  let returnStatus = '';

  async function startFlutterwaveCheckout() {
    if (!$booking) return;
    const email = $booking.client?.email ?? $page.data?.session?.user?.email;
    if (!email) {
      error = 'Your profile needs an email address before payment can begin.';
      return;
    }
    starting = true;
    error = '';
    try {
      const result = await runAction(api.bookings.initializeFlutterwavePayment, {
        bookingId: $booking._id,
        email,
        name: $booking.client?.name,
        phone: $booking.client?.phone,
        redirectUrl: `${window.location.origin}/checkout/${encodeURIComponent(reference)}`
      });
      window.location.assign(result.checkoutUrl);
    } catch (err) {
      error = (err as Error).message || 'Could not start secure checkout.';
      starting = false;
    }
  }

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    returnStatus = params.get('status') ?? '';
    const transactionId = params.get('transaction_id');
    const transactionReference = params.get('tx_ref');
    if (returnStatus === 'successful' && transactionId && transactionReference) {
      verifying = true;
      try {
        await runAction(api.bookings.verifyFlutterwavePayment, {
          transactionId,
          reference: transactionReference
        });
        verified = true;
        history.replaceState({}, '', `/checkout/${encodeURIComponent(reference)}?verified=1`);
      } catch (err) {
        error = (err as Error).message || 'We could not verify this transaction yet.';
      } finally {
        verifying = false;
      }
    }
  });
</script>

<svelte:head>
  <title>Secure Checkout — Aliko Diamond Key</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="min-h-screen bg-[#050A0E] px-4 py-10 text-white sm:py-16">
  <div class="mx-auto max-w-5xl">
    <a href="/dashboard/client" class="mb-7 inline-flex min-h-[44px] items-center gap-2 text-sm text-stone-400 transition-colors hover:text-white"><ArrowLeft size={16} /> Back to dashboard</a>

    {#if $booking === undefined}
      <div class="flex min-h-[50vh] items-center justify-center"><Loader2 class="h-7 w-7 animate-spin text-emerald-400" /></div>
    {:else if !$booking}
      <div class="mx-auto max-w-lg rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center">
        <AlertCircle class="mx-auto mb-3 text-rose-400" size={36} />
        <h1 class="text-xl font-bold">Booking not found</h1>
        <p class="mt-2 text-sm text-stone-400">This checkout link is invalid or the booking does not belong to your account.</p>
      </div>
    {:else}
      <div class="mb-8">
        <p class="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-emerald-400">Secure property payment</p>
        <h1 class="font-serif text-4xl font-bold sm:text-5xl">Complete your <span class="text-gradient-gold">checkout</span></h1>
        <p class="mt-3 max-w-2xl text-stone-400">Review the booking and continue to Flutterwave. Your plot is only marked paid after Aliko Diamond Key independently verifies the transaction.</p>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <CheckoutSummary booking={$booking} />

        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          {#if verifying}
            <div class="flex min-h-[320px] flex-col items-center justify-center text-center">
              <Loader2 class="mb-4 h-10 w-10 animate-spin text-emerald-400" />
              <h2 class="text-xl font-bold">Verifying your payment</h2>
              <p class="mt-2 max-w-sm text-sm text-stone-400">We are confirming the amount, currency and transaction directly with Flutterwave.</p>
            </div>
          {:else if verified || $booking.paymentStatus === 'SUCCESS'}
            <div class="flex min-h-[320px] flex-col items-center justify-center text-center">
              <div class="mb-4 rounded-full bg-emerald-500/10 p-4"><CheckCircle2 class="h-10 w-10 text-emerald-400" /></div>
              <h2 class="text-2xl font-bold">Payment confirmed</h2>
              <p class="mt-2 max-w-sm text-sm text-stone-400">Your payment is recorded and the plot allocation process has started.</p>
              <a href="/dashboard/client" class="btn-primary mt-6 px-6 py-3">View booking</a>
            </div>
          {:else if returnStatus === 'cancelled'}
            <div class="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              <p class="flex items-center gap-2 font-semibold"><XCircle size={17} /> Checkout was cancelled</p>
              <p class="mt-1 text-xs text-amber-100/70">No payment was recorded. Your pending booking remains available for another attempt.</p>
            </div>
          {/if}

          {#if !verifying && !verified && $booking.paymentStatus !== 'SUCCESS'}
            <div class="mb-6 flex items-center gap-3">
              <div class="rounded-xl bg-[#F5A623]/10 p-3 text-[#F5A623]"><CreditCard size={22} /></div>
              <div><h2 class="font-bold">Flutterwave Checkout</h2><p class="text-xs text-stone-500">Card, bank transfer, USSD and supported mobile payment methods</p></div>
            </div>

            {#if error}
              <div class="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                <p class="flex items-start gap-2"><AlertCircle class="mt-0.5 flex-none" size={16} /> {error}</p>
              </div>
            {/if}

            <button type="button" on:click={startFlutterwaveCheckout} disabled={starting} class="btn-primary flex min-h-[52px] w-full items-center justify-center gap-2 text-base disabled:opacity-50">
              {#if starting}<Loader2 size={18} class="animate-spin" /> Opening secure checkout…{:else if returnStatus === 'cancelled'}<RotateCcw size={18} /> Try payment again{:else}<LockKeyhole size={18} /> Pay securely with Flutterwave{/if}
            </button>
            <p class="mt-4 text-center text-[11px] leading-relaxed text-stone-600">You will complete payment on Flutterwave's hosted checkout and return here for server-side verification. Aliko Diamond Key never receives or stores your card details.</p>
          {/if}
        </section>
      </div>
    {/if}
  </div>
</div>
