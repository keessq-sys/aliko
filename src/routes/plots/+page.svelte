<script lang="ts">
  import { useQuery, runMutation, runAction } from '$lib/convex/queries';
  import { api } from '$lib/convex/_generated/api';
  import { formatNaira, formatSqm } from '$lib/utils/format';
  import { ShieldCheck, MapPin, Loader2, X, CheckCircle2, LogIn } from 'lucide-svelte';
  import { reveal, revealStagger } from '$lib/actions/reveal';
  import { tilt } from '$lib/actions/tilt';
  import { page } from '$app/stores';

  let projectFilter = '';
  let statusFilter = 'AVAILABLE';

  const projects = useQuery(api.projects.listProjects, { isActive: true, limit: 100 });
  $: plots = useQuery(api.plots.listPlots, {
    projectId: (projectFilter || undefined) as any,
    status: statusFilter || undefined,
    limit: 60
  });

  let selectedPlot: any = null;
  let installmentPlan = 'OUTRIGHT';
  let booking = false;
  let bookingError = '';
  let bookingResult: { bookingId: string; reference: string } | null = null;
  let payEmail = '';

  $: sessionEmail = $page.data?.session?.user?.email ?? '';
  $: if (sessionEmail && !payEmail) payEmail = sessionEmail;

  // `initializePaystackPayment` charges the plot's full `totalAmount` — there
  // is no per-installment amount calculation anywhere in the backend (no
  // deposit percentage, no schedule cadence), so auto-charging a fraction of
  // the price for a 6/12-month plan would mean guessing a number nobody
  // configured. OUTRIGHT goes through real Paystack checkout for the full
  // price; installment plans keep the existing "reserve now, our team
  // follows up with the payment schedule" flow until a real installment
  // billing design (deposit %, recurring charge cadence) exists to automate.
  async function reserve() {
    if (!selectedPlot) return;
    if (installmentPlan === 'OUTRIGHT' && !payEmail.trim()) {
      bookingError = 'An email address is required to receive your payment receipt.';
      return;
    }
    booking = true;
    bookingError = '';
    try {
      bookingResult = await runMutation(api.bookings.createBooking, {
        plotId: selectedPlot._id,
        installmentPlan
      });

      if (installmentPlan === 'OUTRIGHT') {
        const callbackUrl = `${window.location.origin}/plots/payment-callback?reference=${encodeURIComponent(bookingResult!.reference)}`;
        const checkout = await runAction(api.bookings.initializePaystackPayment, {
          bookingId: bookingResult!.bookingId as any,
          email: payEmail.trim(),
          callbackUrl
        });
        window.location.href = checkout.authorization_url;
        // Redirecting away — no further state updates needed here.
      }
    } catch (err: any) {
      bookingError = err?.message?.includes('Unauthorized')
        ? 'Please sign in to reserve a plot.'
        : (err?.message ?? 'Reservation failed. Please try again.');
    } finally {
      booking = false;
    }
  }

  function closeModal() {
    selectedPlot = null;
    bookingResult = null;
    bookingError = '';
    installmentPlan = 'OUTRIGHT';
  }

  const STATUS_FILTERS = ['AVAILABLE', 'RESERVED', 'SOLD', 'UNDER_DEVELOPMENT', 'OFF_PLAN', ''] as const;
</script>

<svelte:head>
  <title>Available Land Plots — Aliko Diamond Key</title>
  <meta name="description" content="Browse verified, title-checked land plots across our estates and reserve one directly — live from our plot registry." />
</svelte:head>

<div class="min-h-screen bg-[#050A0E] text-white">
  <section class="relative overflow-hidden border-b border-white/5 py-20" use:reveal>
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-transparent"></div>
    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl">
        <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 font-mono text-xs text-emerald-400">
          <ShieldCheck size={13} /> LIVE PLOT REGISTRY
        </div>
        <h1 class="mb-4 font-serif text-4xl font-bold leading-tight sm:text-5xl">
          Reserve a <span class="text-gradient-gold">Verified</span> <span class="text-gradient-emerald">Land Plot</span>
        </h1>
        <p class="text-base leading-relaxed text-stone-400">
          Every plot below is queried directly from our registry — real beacon numbers, real title status,
          real availability. Reserving a plot creates a real booking against it.
        </p>
      </div>
    </div>
  </section>

  <section class="border-b border-white/5 bg-white/[0.02] py-4">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4">
      <select bind:value={projectFilter} class="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500">
        <option value="">All Projects</option>
        {#each $projects ?? [] as p}
          <option value={p._id}>{p.name}</option>
        {/each}
      </select>
      <div class="flex flex-wrap gap-2">
        {#each STATUS_FILTERS as s}
          <button
            on:click={() => (statusFilter = s)}
            class="rounded-full px-3.5 py-1.5 text-xs font-medium transition-all {statusFilter === s
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-white/5 text-stone-400 border border-white/10 hover:text-white'}"
          >
            {s ? s.replace(/_/g, ' ') : 'All Statuses'}
          </button>
        {/each}
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    {#if $plots === undefined}
      <div class="flex items-center justify-center py-24 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if $plots.length === 0}
      <div class="rounded-2xl border border-dashed border-white/10 py-24 text-center">
        <p class="text-sm text-stone-500">No plots match this view yet — plots created via the admin suite will appear here instantly.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" use:revealStagger={{ step: 60 }}>
        {#each $plots as plot (plot._id)}
          <button
            type="button"
            on:click={() => (selectedPlot = plot)}
            use:tilt={{ max: 5 }}
            class="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] text-left transition-colors hover:border-emerald-500/40"
          >
            {#if plot.heroImageUrl}
              <div class="h-40 overflow-hidden">
                <img src={plot.heroImageUrl} alt={plot.project?.name ?? 'Plot'} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            {/if}
            <div class="flex flex-1 flex-col p-5">
              <div class="mb-2 flex items-center justify-between">
                <p class="text-xs text-stone-500">Beacon</p>
                <span class="rounded-full px-2 py-0.5 text-[10px] font-bold {plot.status === 'AVAILABLE' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : plot.status === 'RESERVED' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-stone-500/15 text-stone-400 border border-stone-500/30'}">
                  {plot.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h3 class="mb-1 font-serif text-xl font-bold text-white">{plot.beaconNumber}</h3>
              <p class="mb-3 flex items-center gap-1 text-xs text-stone-500"><MapPin size={12} /> {plot.project?.name ?? 'Unknown project'}, {plot.project?.state ?? ''}</p>
              <div class="mt-auto flex items-end justify-between border-t border-white/5 pt-3">
                <div>
                  <p class="text-lg font-bold text-amber-400">{formatNaira(plot.price)}</p>
                  <p class="text-xs text-stone-500">{formatSqm(plot.sizeSqm)}</p>
                </div>
                {#if plot.titleVerified}
                  <span class="flex items-center gap-1 text-xs text-emerald-400"><ShieldCheck size={13} /> Verified</span>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </section>
</div>

{#if selectedPlot}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="presentation" on:click={closeModal}>
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A1628] p-6" role="dialog" aria-modal="true" tabindex="-1" on:click|stopPropagation on:keydown|stopPropagation>
      {#if bookingResult}
        <div class="text-center">
          <CheckCircle2 size={40} class="mx-auto mb-3 text-emerald-400" />
          <h3 class="mb-1 text-lg font-bold text-white">Plot Reserved</h3>
          <p class="mb-4 text-sm text-stone-400">Your booking reference is</p>
          <p class="mb-4 rounded-lg bg-black/40 py-2 font-mono text-sm text-emerald-300">{bookingResult.reference}</p>
          <p class="mb-6 text-xs text-stone-500">Our team will reach out with payment instructions to complete your purchase.</p>
          <button on:click={closeModal} class="btn-primary w-full py-2.5">Done</button>
        </div>
      {:else}
        <div class="mb-4 flex items-start justify-between">
          <div>
            <h3 class="text-lg font-bold text-white">Reserve {selectedPlot.beaconNumber}</h3>
            <p class="text-xs text-stone-500">{selectedPlot.project?.name} &middot; {formatSqm(selectedPlot.sizeSqm)}</p>
          </div>
          <button on:click={closeModal} aria-label="Close" class="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 -mt-2 rounded-full text-stone-500 hover:bg-white/10 hover:text-white"><X size={16} /></button>
        </div>
        <p class="mb-4 text-2xl font-bold text-amber-400">{formatNaira(selectedPlot.price)}</p>

        {#if bookingError}
          <div class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {bookingError}
            {#if bookingError.includes('sign in')}
              <a href="/auth?tab=signin" class="ml-1 inline-flex items-center gap-1 font-semibold text-emerald-300 hover:underline"><LogIn size={12} /> Sign in</a>
            {/if}
          </div>
        {/if}

        <label class="mb-5 block">
          <span class="mb-1.5 block text-xs text-stone-500">Payment plan</span>
          <select bind:value={installmentPlan} class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500">
            <option value="OUTRIGHT">Outright payment</option>
            <option value="6-MONTHS">6-month installments</option>
            <option value="12-MONTHS">12-month installments</option>
          </select>
        </label>

        {#if installmentPlan === 'OUTRIGHT'}
          <label class="mb-5 block">
            <span class="mb-1.5 block text-xs text-stone-500">Email for payment receipt</span>
            <input
              type="email"
              bind:value={payEmail}
              placeholder="you@example.com"
              class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
            />
          </label>
        {/if}

        <button on:click={reserve} disabled={booking} class="btn-primary flex w-full min-h-[44px] items-center justify-center gap-2 py-3 disabled:opacity-50">
          {#if booking}<Loader2 size={16} class="animate-spin" />{/if}
          {installmentPlan === 'OUTRIGHT' ? 'Reserve & Pay Now' : 'Reserve This Plot'}
        </button>
        {#if installmentPlan === 'OUTRIGHT'}
          <p class="mt-3 text-center text-[11px] text-stone-600">You'll be redirected to Paystack to complete a secure payment for {formatNaira(selectedPlot.price)}.</p>
        {:else}
          <p class="mt-3 text-center text-[11px] text-stone-600">This reserves the plot. Our team will contact you with the {installmentPlan} payment schedule.</p>
        {/if}
      {/if}
    </div>
  </div>
{/if}
