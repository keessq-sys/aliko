<script lang="ts">
  import { CheckCircle2 } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  export let submitted = false;
  export let reference = '';
  export let serviceLabel = 'Request';
  export let onReset: () => void = () => {};
  export let homeHref = '/';

  const STEPS = [
    { title: 'Submitted', desc: `Your ${serviceLabel.toLowerCase()} has been received.` },
    { title: 'Admin Review', desc: 'Our team reviews your brief within 48 hours.' },
    { title: 'Quote & Response', desc: 'You receive an official quote and next steps.' }
  ];
</script>

{#if submitted}
  <div class="mx-auto max-w-xl text-center" in:fade={{ duration: 300 }}>
    <div class="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15">
      <CheckCircle2 class="h-12 w-12 text-emerald-400" />
    </div>
    <h2 class="mb-4 text-3xl font-bold text-white">Request Submitted Successfully!</h2>
    <p class="mb-8 text-lg text-stone-400">
      Your reference number is
      <span class="font-mono font-bold text-amber-400">{reference || 'ADK-SVC-2026-0000'}</span>
    </p>

    <div class="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
      <h3 class="mb-4 text-lg font-semibold text-emerald-400">What happens next</h3>
      <ol class="space-y-4 text-stone-300">
        {#each STEPS as step, i}
          <li class="flex items-start gap-3">
            <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
              {i + 1}
            </span>
            <span>
              <span class="font-medium text-white">{step.title}</span>
              <span class="block text-sm text-stone-400">{step.desc}</span>
            </span>
          </li>
        {/each}
      </ol>
    </div>

    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <a href="/" class="rounded-lg bg-white/10 px-6 py-3 transition-colors hover:bg-white/20">Return Home</a>
      <a href="/dashboard/client" class="btn-primary px-6 py-3">Track in Client Portal</a>
    </div>
  </div>
{:else}
  <slot />
{/if}
