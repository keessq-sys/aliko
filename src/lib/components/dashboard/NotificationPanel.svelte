<script lang="ts">
  import { Bell, CheckCircle2, X, XCircle, Info, AlertTriangle } from 'lucide-svelte';

  export let notifications: any[] = [];
  
  let currentFilter = 'All';
  const filters = ['All', 'Leads', 'Properties', 'Payments', 'System'];
  
  $: filteredNotifs = currentFilter === 'All' 
    ? notifications 
    : notifications.filter(n => n.type === currentFilter.toLowerCase());

  function getIcon(type: string) {
    switch(type) {
      case 'success': return CheckCircle2;
      case 'error': return XCircle;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  }

  function getColorClass(type: string, read: boolean) {
    const base = read ? 'text-stone-500' : 'text-emerald-400';
    if (!read) {
      switch(type) {
        case 'error': return 'text-rose-400';
        case 'warning': return 'text-amber-400';
      }
    }
    return base;
  }
</script>

<div class="flex h-full flex-col bg-[#0A1017] border-l border-white/10 w-80 sm:w-96">
  <!-- Header -->
  <div class="flex items-center justify-between border-b border-white/10 px-6 py-4">
    <div class="flex items-center gap-2">
      <Bell class="h-5 w-5 text-emerald-500" />
      <h2 class="text-lg font-semibold text-white">Notifications</h2>
    </div>
    <button class="text-xs font-medium text-emerald-500 hover:text-emerald-400">
      Mark all as read
    </button>
  </div>

  <!-- Filters -->
  <div class="flex gap-2 overflow-x-auto border-b border-white/5 px-4 py-3 hide-scrollbar">
    {#each filters as filter}
      <button 
        on:click={() => currentFilter = filter}
        class="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors {currentFilter === filter ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-stone-400 hover:bg-white/10'}"
      >
        {filter}
      </button>
    {/each}
  </div>

  <!-- List -->
  <div class="flex-1 overflow-y-auto">
    {#if filteredNotifs.length > 0}
      <div class="divide-y divide-white/5">
        {#each filteredNotifs as notif}
          <div class="relative cursor-pointer p-4 transition-colors hover:bg-white/5 {notif.read ? 'opacity-75' : 'bg-white/[0.02]'}">
            {#if !notif.read}
              <div class="absolute left-0 top-0 h-full w-1 bg-emerald-500"></div>
            {/if}
            
            <div class="flex gap-3">
              <div class="mt-1 flex-shrink-0">
                <svelte:component this={getIcon(notif.iconType)} class="h-5 w-5 {getColorClass(notif.iconType, notif.read)}" />
              </div>
              <div class="flex-1 space-y-1">
                <p class="text-sm font-medium {notif.read ? 'text-stone-300' : 'text-white'}">
                  {notif.title}
                </p>
                <p class="text-xs text-stone-400">{notif.message}</p>
                <p class="text-xs text-stone-500 mt-2">{notif.timestamp}</p>
              </div>
              {#if !notif.read}
                <button type="button" aria-label="Mark notification as read" class="h-6 w-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all">
                  <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="flex h-full flex-col items-center justify-center p-8 text-center">
        <div class="mb-4 rounded-full bg-white/5 p-4">
          <Bell class="h-8 w-8 text-stone-600" />
        </div>
        <p class="text-sm font-medium text-stone-300">No notifications</p>
        <p class="mt-1 text-xs text-stone-500">You're all caught up!</p>
      </div>
    {/if}
  </div>
</div>
