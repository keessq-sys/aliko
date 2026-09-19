<script lang="ts">
  import { Star } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  export let value: number = 0;
  export let max: number = 5;
  export let interactive: boolean = false;
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const dispatch = createEventDispatcher();
  let hoverValue: number | null = null;

  const sizeClasses = {
    'sm': 14,
    'md': 20,
    'lg': 28
  };

  $: displayValue = hoverValue !== null ? hoverValue : value;

  function handleClick(val: number) {
    if (!interactive) return;
    value = val;
    dispatch('change', { value });
  }
</script>

<div class="flex items-center gap-1" on:mouseleave={() => hoverValue = null}>
  {#each Array(max) as _, i}
    {@const starValue = i + 1}
    {@const fill = displayValue >= starValue ? 1 : displayValue >= starValue - 0.5 ? 0.5 : 0}
    
    <button 
      class="relative {interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform focus:outline-none"
      on:mouseenter={() => interactive && (hoverValue = starValue)}
      on:click={() => handleClick(starValue)}
      type="button"
    >
      <!-- Background star (empty) -->
      <Star 
        size={sizeClasses[size]} 
        class="text-stone-700" 
      />
      
      <!-- Foreground star (filled) -->
      <div 
        class="absolute top-0 left-0 overflow-hidden" 
        style="width: {fill * 100}%;"
      >
        <Star 
          size={sizeClasses[size]} 
          class="text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" 
        />
      </div>
    </button>
  {/each}
</div>
