<script lang="ts">
  import { X } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  
  export let open = false;
  export let title = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  
  const sizeClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    'full': 'max-w-[95vw] h-[95vh]'
  };

  function close() {
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) close();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" transition:fade={{duration: 200}}>
    <!-- Backdrop -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" on:click={close}></div>
    
    <!-- Modal Card -->
    <div 
      class="relative flex flex-col w-full {sizeClasses[size]} bg-stone-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-l2"
      transition:scale={{duration: 250, start: 0.95, opacity: 0}}
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
        <h3 class="text-xl font-serif text-white">{title}</h3>
        <button on:click={close} class="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <!-- Body -->
      <div class="p-6 overflow-y-auto">
        <slot />
      </div>
      
      <!-- Footer -->
      {#if $$slots.footer}
        <div class="px-6 py-4 border-t border-white/10 bg-stone-900/50 flex justify-end gap-3">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}
