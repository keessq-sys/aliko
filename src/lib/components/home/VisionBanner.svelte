<script lang="ts">
  import { ShieldCheck, Leaf, Users2 } from 'lucide-svelte';
  import { VISION_BANNER_IMAGE } from '$lib/data/imagery';
  import { reveal } from '$lib/actions/reveal';

  const pillars = [
    { icon: ShieldCheck, label: 'Zero-fraud, government-verified titles' },
    { icon: Leaf, label: 'Sustainable, master-planned developments' },
    { icon: Users2, label: 'End-to-end service, from land to move-in' }
  ];
</script>

<section class="relative isolate overflow-hidden py-28 text-white" use:reveal>
  <img src={VISION_BANNER_IMAGE} alt="" class="absolute inset-0 h-full w-full object-cover" loading="lazy" />
  <div class="absolute inset-0 bg-gradient-to-b from-[#050A0E]/85 via-[#050A0E]/70 to-[#050A0E]"></div>

  <div class="container relative mx-auto px-6 text-center">
    <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">Our Promise</p>
    <h2 class="mx-auto max-w-3xl font-serif text-3xl font-bold leading-tight sm:text-5xl">
      Live. Build. Invest. <span class="text-gradient-emerald">With Total Confidence.</span>
    </h2>
    <p class="mx-auto mt-5 max-w-2xl text-stone-300">
      Every plot, property and project on Aliko Diamond Key is verified, documented and delivered
      by one accountable partner &mdash; from the first site visit to the final handover.
    </p>

    <div class="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
      {#each pillars as p}
        <div class="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <svelte:component this={p.icon} size={28} class="text-emerald-400" />
          <p class="text-sm text-stone-200">{p.label}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
