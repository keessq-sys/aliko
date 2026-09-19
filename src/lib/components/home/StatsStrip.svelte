<script lang="ts">
  import { onMount } from 'svelte';
  import { Building2, Users, Wallet, Target } from 'lucide-svelte';

  const stats = [
    { label: 'Total Listings', value: 1247, suffix: '+', icon: Building2, color: 'text-emerald-400' },
    { label: 'Verified Agents', value: 86, suffix: '', icon: Users, color: 'text-amber-400' },
    { label: 'Transactions', value: 12, suffix: 'B+', prefix: '₦', icon: Wallet, color: 'text-emerald-400' },
    { label: 'Client Satisfaction', value: 98, suffix: '%', icon: Target, color: 'text-amber-400' }
  ];

  let displayValues = stats.map(() => 0);
  let sectionRef: HTMLElement;
  let hasAnimated = false;

  const animateValue = (index: number, start: number, end: number, duration: number) => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      displayValues[index] = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated) {
        hasAnimated = true;
        stats.forEach((stat, i) => {
          animateValue(i, 0, stat.value, 2000 + (i * 200));
        });
      }
    }, { threshold: 0.3 });

    if (sectionRef) observer.observe(sectionRef);
    return () => observer.disconnect();
  });
</script>

<style>
  .stats-banner {
    background: linear-gradient(90deg, rgba(5,150,105,0.05) 0%, rgba(217,119,6,0.05) 50%, rgba(5,150,105,0.05) 100%);
    border-top: 1px solid rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
</style>

<div bind:this={sectionRef} class="stats-banner py-12 relative z-10 w-full overflow-hidden bg-[#050A0E]">
  <div class="container mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-white/10">
      {#each stats as stat, i}
        <div class="flex flex-col items-center text-center px-4 group">
          <div class={`p-3 rounded-2xl bg-white/5 mb-4 group-hover:scale-110 transition-transform ${stat.color}`}>
            <svelte:component this={stat.icon} size={28} />
          </div>
          <h4 class="text-4xl font-extrabold text-white mb-2 flex items-center justify-center">
            {#if stat.prefix}<span class="text-2xl mr-1">{stat.prefix}</span>{/if}
            {displayValues[i]}
            {#if stat.suffix}<span class="text-2xl ml-1">{stat.suffix}</span>{/if}
          </h4>
          <p class="text-gray-400 text-sm uppercase tracking-wider font-semibold">{stat.label}</p>
        </div>
      {/each}
    </div>
  </div>
</div>
