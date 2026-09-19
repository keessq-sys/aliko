<script lang="ts">
  import { toasts, removeToast } from '$lib/stores/ui';
  import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100',
    error: 'bg-rose-900/80 border-rose-500/50 text-rose-100',
    warning: 'bg-amber-900/80 border-amber-500/50 text-amber-100',
    info: 'bg-blue-900/80 border-blue-500/50 text-blue-100'
  };

  const iconColors = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    warning: 'text-amber-400',
    info: 'text-blue-400'
  };
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
  {#each $toasts as toast (toast.id)}
    <div 
      animate:flip={{duration: 250}}
      transition:fly={{x: 50, duration: 250}}
      class="pointer-events-auto relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg {colors[toast.type]}"
    >
      <svelte:component this={icons[toast.type]} class="w-5 h-5 shrink-0 {iconColors[toast.type]} mt-0.5" />
      
      <div class="flex-1 pr-6">
        <p class="text-sm font-medium">{toast.message}</p>
      </div>

      <button 
        class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        on:click={() => removeToast(toast.id)}
      >
        <X size={16} />
      </button>

      <!-- Progress bar -->
      {#if toast.duration}
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/20 overflow-hidden rounded-b-xl">
          <div 
            class="h-full bg-white/30 origin-left"
            style="animation: shrink {toast.duration}ms linear forwards;"
          ></div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  @keyframes shrink {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }
</style>
