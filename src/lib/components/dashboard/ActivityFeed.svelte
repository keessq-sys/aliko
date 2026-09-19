<script lang="ts">
  import { onMount } from 'svelte';
  
  export let activities: any[] = [];
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
</script>

<div class="rounded-xl border border-white/5 bg-[#050A0E]/80 p-6 shadow-xl backdrop-blur-md">
  <h3 class="mb-6 text-lg font-semibold text-white">Recent Activity</h3>
  
  <div class="relative border-l border-white/10 pl-6 space-y-6">
    {#each activities as activity, i}
      <div 
        class="relative transition-all duration-500 ease-out {mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}"
        style="transition-delay: {i * 100}ms;"
      >
        <!-- Timeline dot -->
        <span class="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full bg-[#050A0E] border-2" style="border-color: {activity.color}">
        </span>
        
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <p class="text-sm text-stone-300">
              <span class="font-medium text-white">{activity.user}</span> 
              {activity.description}
            </p>
            <p class="text-xs text-stone-500">{activity.timestamp}</p>
          </div>
          
          {#if activity.icon}
            <div class="rounded-lg bg-white/5 p-2">
              <svelte:component this={activity.icon} class="h-4 w-4" style="color: {activity.color}" />
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
  
  <button class="mt-8 w-full rounded-lg border border-white/10 py-2 text-sm font-medium text-stone-400 hover:bg-white/5 hover:text-white transition-colors">
    Load More
  </button>
</div>
