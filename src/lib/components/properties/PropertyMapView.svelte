<script lang="ts">
  import { onMount } from 'svelte';
  
  export let properties: any[] = [];
  export let selectedId: string | null = null;

  // Since we don't have Leaflet directly imported, we will use a mock map visual or an iframe.
  // For the sake of this test, we'll build a CSS/HTML-based mock map to avoid relying on external libraries that might not be loaded.
  // In a real app, you would initialize Leaflet here.
</script>

<div class="flex h-full min-h-[600px] bg-[#050A0E] rounded-2xl border border-white/10 overflow-hidden relative">
  <!-- Sidebar -->
  <div class="w-full md:w-1/3 border-r border-white/10 bg-[#0A1118]/90 backdrop-blur-md flex flex-col z-10">
    <div class="p-4 border-b border-white/10">
      <h3 class="text-lg font-semibold text-white">Map View</h3>
      <p class="text-sm text-gray-400">{properties.length} properties found</p>
    </div>
    <div class="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
      {#each properties as prop}
        <button 
          class="w-full text-left flex gap-3 p-2 rounded-lg transition-colors {selectedId === prop.id ? 'bg-emerald-900/40 border border-emerald-500/50' : 'hover:bg-white/5 border border-transparent'}"
          on:click={() => selectedId = prop.id}
        >
          <img src={prop.images[0]} class="w-16 h-16 rounded object-cover" alt="" />
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-medium text-white truncate">{prop.title}</h4>
            <div class="text-xs text-gray-400 truncate mt-1">{prop.location.address}</div>
            <div class="text-sm font-bold text-emerald-400 mt-1">₦{(prop.price/1000000).toFixed(0)}M</div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Map Area (Mock representation) -->
  <div class="hidden md:block w-2/3 bg-[#0f1722] relative overflow-hidden">
    <!-- Map grid pattern -->
    <div class="absolute inset-0 opacity-20" style="background-image: linear-gradient(#34D399 1px, transparent 1px), linear-gradient(90deg, #34D399 1px, transparent 1px); background-size: 50px 50px;"></div>
    
    <div class="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 flex gap-4 text-xs font-medium">
      <div class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-emerald-500"></span> Available</div>
      <div class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-amber-500"></span> Reserved</div>
      <div class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-rose-500"></span> Sold</div>
    </div>

    <!-- Randomly place pins for properties -->
    {#each properties as prop, i}
      {@const top = 20 + (i * 17) % 60}
      {@const left = 20 + (i * 23) % 60}
      <div class="absolute" style="top: {top}%; left: {left}%;">
        <button 
          on:click={() => selectedId = prop.id}
          class="relative w-8 h-8 -ml-4 -mt-8 flex items-center justify-center transform transition-transform hover:scale-110 {selectedId === prop.id ? 'scale-125 z-20' : 'z-10'}"
        >
          <svg viewBox="0 0 24 24" class="w-full h-full drop-shadow-lg {prop.status === 'available' ? 'text-emerald-500' : prop.status === 'reserved' ? 'text-amber-500' : 'text-rose-500'} fill-current">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
</style>
