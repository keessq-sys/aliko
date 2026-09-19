<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowUpRight, ArrowDownRight } from 'lucide-svelte';

  export let title: string;
  export let value: string | number;
  export let change: string;
  export let changeType: 'up' | 'down' = 'up';
  export let icon: any = null;
  export let iconBg: string = 'bg-emerald-500/20';
  export let prefix: string = '';
  export let suffix: string = '';

  let displayValue: number = 0;
  let targetValue: number = typeof value === 'string' ? parseFloat(value.toString().replace(/[^0-9.-]+/g,"")) : value;
  let isNumber = !isNaN(targetValue);

  onMount(() => {
    if (isNumber) {
      const duration = 1000;
      const steps = 30;
      const stepTime = Math.abs(Math.floor(duration / steps));
      const stepValue = targetValue / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        displayValue = Math.min(targetValue, displayValue + stepValue);
        if (currentStep >= steps) {
          displayValue = targetValue;
          clearInterval(timer);
        }
      }, stepTime);
    }
  });
</script>

<div class="relative overflow-hidden rounded-xl border border-white/5 bg-[#050A0E]/80 p-6 shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-emerald-500/10 group">
  <!-- Top Section -->
  <div class="flex items-start justify-between">
    <div>
      <p class="text-sm font-medium text-stone-400">{title}</p>
      <div class="mt-2 flex items-baseline gap-1">
        {#if prefix}<span class="text-xl text-stone-300">{prefix}</span>{/if}
        <h3 class="text-3xl font-bold text-white">
          {isNumber ? (displayValue % 1 === 0 ? displayValue : displayValue.toFixed(1)) : value}
        </h3>
        {#if suffix}<span class="text-xl text-stone-300">{suffix}</span>{/if}
      </div>
    </div>
    
    {#if icon}
      <div class={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBg}`}>
        <svelte:component this={icon} class="h-6 w-6 text-emerald-400" />
      </div>
    {/if}
  </div>

  <!-- Bottom Section -->
  <div class="mt-4 flex items-center justify-between">
    <div class={`flex items-center gap-1 text-sm font-medium ${changeType === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
      {#if changeType === 'up'}
        <ArrowUpRight class="h-4 w-4" />
      {:else}
        <ArrowDownRight class="h-4 w-4" />
      {/if}
      <span>{change}</span>
    </div>

    <!-- Mini Sparkline -->
    <div class="flex items-end gap-1 h-4 opacity-50 group-hover:opacity-100 transition-opacity">
      <div class={`w-1.5 rounded-t-sm ${changeType === 'up' ? 'bg-emerald-500/40 h-2' : 'bg-rose-500/40 h-4'}`}></div>
      <div class={`w-1.5 rounded-t-sm ${changeType === 'up' ? 'bg-emerald-500/60 h-3' : 'bg-rose-500/60 h-3'}`}></div>
      <div class={`w-1.5 rounded-t-sm ${changeType === 'up' ? 'bg-emerald-500 h-4' : 'bg-rose-500 h-2'}`}></div>
    </div>
  </div>
</div>
