<script lang="ts">
  import { Loader2, Send, Info } from 'lucide-svelte';
  import { api } from '$lib/convex/_generated/api';
  import { runMutation } from '$lib/convex/queries';
  import RequestFormShell from './RequestFormShell.svelte';

  export let serviceSlug: string;
  export let serviceLabel: string;
  export let requestType: string;

  const BUDGETS = [
    { value: [0, 1_000_000], label: 'Under ₦1M' },
    { value: [1_000_000, 5_000_000], label: '₦1M – ₦5M' },
    { value: [5_000_000, 20_000_000], label: '₦5M – ₦20M' },
    { value: [20_000_000, 100_000_000], label: '₦20M – ₦100M' },
    { value: [100_000_000, 0], label: '₦100M+' }
  ];
  const TIMELINES = ['Immediate', 'Within 1 month', '1–3 months', '3–6 months', '6+ months / Flexible'];

  let requesterName = '';
  let email = '';
  let phone = '';
  let company = '';
  let location = '';
  let projectBrief = '';
  let budgetIdx = -1;
  let timeline = TIMELINES[2];
  let submitting = false;
  let submitted = false;
  let reference = '';
  let error = '';

  const submitRequest = async (args: any) => runMutation(api.serviceRequests.submitServiceRequest, args);

  async function handleSubmit() {
    error = '';
    if (!requesterName.trim() || !email.trim() || !phone.trim() || !projectBrief.trim()) {
      error = 'Please fill in your name, email, phone and project brief.';
      return;
    }
    submitting = true;
    try {
      const budget = budgetIdx >= 0 ? BUDGETS[budgetIdx].value : undefined;
      const result = await submitRequest({
        serviceSlug,
        requesterName: requesterName.trim(),
        requesterEmail: email.trim(),
        requesterPhone: phone.trim(),
        company: company.trim() || undefined,
        requestType,
        location: location.trim() || undefined,
        projectBrief: projectBrief.trim(),
        budgetMin: budget ? budget[0] : undefined,
        budgetMax: budget && budget[1] > 0 ? budget[1] : undefined,
        timeline
      });
      reference = result?.reference ?? '';
      submitted = true;
    } catch (e: any) {
      error = e?.message ?? 'Submission failed. Please try again.';
    } finally {
      submitting = false;
    }
  }
</script>

<RequestFormShell bind:submitted bind:reference serviceLabel={serviceLabel} onReset={() => (submitted = false)}>
  <form
    on:submit|preventDefault={handleSubmit}
    class="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl"
  >
    <div class="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
      <span class="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">{serviceLabel}</span>
      <span class="text-xs text-stone-500">All fields marked * are required</span>
    </div>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <label class="block">
        <span class="mb-1 block text-sm text-stone-400">Full Name *</span>
        <input
          type="text"
          bind:value={requesterName}
          class="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-stone-600 outline-none focus:border-emerald-500"
          placeholder="e.g. Adaeze Okonkwo"
        />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm text-stone-400">Email Address *</span>
        <input
          type="email"
          bind:value={email}
          class="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-stone-600 outline-none focus:border-emerald-500"
          placeholder="you@example.com"
        />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm text-stone-400">Phone Number *</span>
        <div class="flex">
          <span class="inline-flex items-center rounded-l-lg border border-r-0 border-white/10 bg-black/60 px-3 text-stone-400">+234</span>
          <input
            type="tel"
            bind:value={phone}
            class="w-full rounded-r-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-stone-600 outline-none focus:border-emerald-500"
            placeholder="801 234 5678"
          />
        </div>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm text-stone-400">Company (optional)</span>
        <input
          type="text"
          bind:value={company}
          class="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-stone-600 outline-none focus:border-emerald-500"
          placeholder="Company / Organisation"
        />
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-sm text-stone-400">Project Location</span>
        <input
          type="text"
          bind:value={location}
          class="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-stone-600 outline-none focus:border-emerald-500"
          placeholder="e.g. Lekki Phase 1, Lagos"
        />
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 flex justify-between text-sm text-stone-400">
          <span>Project Brief *</span>
          <span class="text-xs text-stone-600">{projectBrief.length}/1500</span>
        </span>
        <textarea
          bind:value={projectBrief}
          maxlength="1500"
          rows="5"
          class="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-stone-600 outline-none focus:border-emerald-500"
          placeholder="Describe your project: scope, rooms/area, preferred styles or material specs, expected start date..."
        ></textarea>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm text-stone-400">Budget Range</span>
        <select bind:value={budgetIdx} class="w-full rounded-lg border border-white/10 bg-[#0A1628] px-4 py-2.5 text-white outline-none focus:border-emerald-500">
          <option value={-1}>Prefer not to say</option>
          {#each BUDGETS as b, i}
            <option value={i}>{b.label}</option>
          {/each}
        </select>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm text-stone-400">Expected Timeline</span>
        <select bind:value={timeline} class="w-full rounded-lg border border-white/10 bg-[#0A1628] px-4 py-2.5 text-white outline-none focus:border-emerald-500">
          {#each TIMELINES as t}
            <option value={t}>{t}</option>
          {/each}
        </select>
      </label>
    </div>

    {#if error}
      <p class="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</p>
    {/if}

    <div class="mt-6 flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-200">
      <Info size={14} class="mt-0.5 flex-shrink-0" />
      Your request goes directly to the ADK super-admin desk. You will receive a quote and a dedicated contact within 48 hours.
    </div>

    <button
      type="submit"
      disabled={submitting}
      class="btn-primary mt-6 w-full py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
    >
      {#if submitting}
        <Loader2 size={16} class="mr-2 animate-spin" /> Submitting…
      {:else}
        <Send size={16} class="mr-2" /> Submit {serviceLabel} Request
      {/if}
    </button>
  </form>
</RequestFormShell>
