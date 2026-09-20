<script lang="ts">
  import { Building2, CheckCircle, Shield, ArrowRight, Loader2, MapPin } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import { api } from '$lib/convex/_generated/api';
  import { runMutation } from '$lib/convex/queries';

  const NIGERIAN_STATES = ['Abia', 'Abuja', 'Lagos', 'Kano', 'Rivers', 'Oyo', 'Enugu', 'Kaduna'];
  const PLANS = [
    { id: 'starter', name: 'Starter', price: '₦25,000/mo', features: ['Up to 10 properties', '1 manager seat', 'Basic analytics'] },
    { id: 'professional', name: 'Professional', price: '₦75,000/mo', features: ['Up to 100 properties', '10 seats', 'Advanced analytics', 'Agent management'], recommended: true },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Unlimited properties', 'Unlimited seats', 'API access', 'Dedicated success manager'] }
  ];

  let selectedPlan = 'professional';
  let companyName = '';
  let contactName = '';
  let email = '';
  let phone = '';
  let cacRcNumber = '';
  let portfolioSize = '11-50';
  let states: string[] = [];

  let submitting = false;
  let submitted = false;
  let submitError = '';

  const submitManagerApplication = async (args: any) => runMutation(api.partners.submitManagerApplication, args);

  const toggleState = (s: string) => {
    states = states.includes(s) ? states.filter((x) => x !== s) : [...states, s];
  };

  const submitForm = async () => {
    submitError = '';
    if (!companyName.trim() || !contactName.trim() || !email.trim() || !phone.trim()) {
      submitError = 'Company, contact name, email and phone are required.';
      return;
    }
    submitting = true;
    try {
      await submitManagerApplication({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        cacRcNumber: cacRcNumber.trim() || undefined,
        statesOfOperation: states,
        portfolioSize,
        plan: (selectedPlan.toUpperCase() as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE')
      });
      submitted = true;
    } catch (err: any) {
      submitError = err?.message ?? 'Submission failed. Please try again.';
    } finally {
      submitting = false;
    }
  };
</script>

<div class="min-h-screen bg-[#050A0E] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
  <div class="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>

  {#if submitted}
    <div class="max-w-2xl mx-auto mt-20 text-center" in:fade>
      <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-500/20 mb-8">
        <CheckCircle class="h-12 w-12 text-blue-400" />
      </div>
      <h2 class="text-4xl font-bold mb-4">Registration Successful!</h2>
      <p class="text-gray-400 text-lg mb-8">Your estate manager enrolment is <span class="text-blue-400 font-bold">PENDING APPROVAL</span></p>

      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md mx-auto text-left">
        <h3 class="font-semibold text-lg mb-4 text-blue-400">Next Steps:</h3>
        <ul class="space-y-4 text-gray-300">
          <li class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">1</div>
            Compliance review within 48hrs
          </li>
          <li class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">2</div>
            Onboarding & verification call
          </li>
          <li class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">3</div>
            Dashboard access activated
          </li>
        </ul>
      </div>

      <a href="/" class="inline-block mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">Return to Home</a>
    </div>
  {:else}
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-10">
        <h1 class="text-3xl sm:text-4xl font-bold mb-2">Estate Manager Enrolment</h1>
        <p class="text-gray-400">Manage your portfolio, tenants and agents on the ADK platform.</p>
      </div>

      <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <h2 class="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2"><Building2 class="w-5 h-5" /> Company Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label class="block">
            <span class="mb-1 block text-sm text-gray-400">Company Name *</span>
            <input type="text" bind:value={companyName} class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="ADK Estates Ltd" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm text-gray-400">Contact Person *</span>
            <input type="text" bind:value={contactName} class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="Chidi Nwosu" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm text-gray-400">Corporate Email *</span>
            <input type="email" bind:value={email} class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="manager@company.com" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm text-gray-400">Phone Number *</span>
            <input type="tel" bind:value={phone} class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="801 234 5678" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm text-gray-400">CAC / RC Number</span>
            <input type="text" bind:value={cacRcNumber} class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="Optional" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm text-gray-400">Portfolio Size</span>
            <select bind:value={portfolioSize} class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500">
              <option>1-10</option><option>11-50</option><option>50+</option>
            </select>
          </label>
        </div>

        <div class="mt-6">
          <span class="mb-2 flex items-center gap-2 text-sm text-gray-400"><MapPin class="w-4 h-4" /> States of Operation</span>
          <div class="flex flex-wrap gap-2">
            {#each NIGERIAN_STATES as state}
              <button type="button" on:click={() => toggleState(state)} class="px-3 py-1 text-sm rounded-full border transition-colors {states.includes(state) ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'}">
                {state}
              </button>
            {/each}
          </div>
        </div>

        <h2 class="mt-10 text-xl font-bold text-blue-400 mb-4">Choose Your Plan</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each PLANS as plan}
            <button
              type="button"
              on:click={() => (selectedPlan = plan.id)}
              class="rounded-2xl border p-5 text-left transition-all {selectedPlan === plan.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-black/20 hover:border-white/30'}"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-bold text-white">{plan.name}</span>
                {#if plan.recommended}<span class="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">POPULAR</span>{/if}
              </div>
              <p class="text-lg font-bold text-blue-400">{plan.price}</p>
              <ul class="mt-3 space-y-1.5">
                {#each plan.features as f}
                  <li class="flex items-center gap-2 text-xs text-stone-400"><CheckCircle size={12} class="text-blue-400" /> {f}</li>
                {/each}
              </ul>
            </button>
          {/each}
        </div>

        {#if submitError}
          <p class="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{submitError}</p>
        {/if}

        <div class="mt-8 flex justify-end">
          <button
            on:click={submitForm}
            disabled={submitting}
            class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 px-8 py-3 font-medium text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
          >
            {#if submitting}
              <Loader2 class="w-4 h-4 animate-spin" /> Submitting…
            {:else}
              Submit Enrolment <ArrowRight class="w-4 h-4" />
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
