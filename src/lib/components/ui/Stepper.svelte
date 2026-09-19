<script lang="ts">
  import { Check } from 'lucide-svelte';

  export let steps: string[] = [];
  export let currentStep: number = 0; // 0-indexed
</script>

<div class="w-full py-4">
  <div class="flex items-center justify-between relative">
    <!-- Background Track -->
    <div class="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-stone-800 rounded-full z-0"></div>
    
    <!-- Progress Fill -->
    <div 
      class="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-emerald-500 rounded-full z-0 transition-all duration-450 ease-in-out shadow-[0_0_10px_rgba(5,150,105,0.5)]"
      style="width: {(currentStep / (steps.length - 1)) * 100}%"
    ></div>

    {#each steps as step, i}
      <div class="relative z-10 flex flex-col items-center gap-2">
        <div class={i < currentStep ? 'wizard-step-complete' : i === currentStep ? 'wizard-step-active' : 'wizard-step-inactive'}>
          {#if i < currentStep}
            <Check size={16} />
          {:else}
            <span class="text-sm font-semibold">{i + 1}</span>
          {/if}
        </div>
        <span class="absolute top-10 text-xs font-medium whitespace-nowrap {i <= currentStep ? 'text-stone-200' : 'text-stone-500'}">
          {step}
        </span>
      </div>
    {/each}
  </div>
</div>
