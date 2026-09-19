<script lang="ts">
  import { Search, ChevronDown, ChevronUp, SlidersHorizontal, Check } from 'lucide-svelte';

  export let filters: any = {
    search: '',
    type: 'All',
    status: 'All',
    minPrice: 0,
    maxPrice: 1000000000,
    bedrooms: 'Any',
    bathrooms: 'Any',
    verifiedOnly: false,
    sortBy: 'Newest'
  };

  export let onClear = () => {};

  let expandedSections = {
    type: true,
    price: true,
    rooms: true,
    amenities: false
  };

  const types = ['All', 'Residential', 'Commercial', 'Apartment', 'Land', 'Duplex', 'Penthouse'];
  const statuses = ['All', 'Available', 'Reserved', 'Sold'];
  const bedBathOpts = ['Any', '1', '2', '3', '4', '5+'];
  
  const amenitiesList = ['Pool', 'Gym', 'CCTV', 'Generator', 'Solar', 'BQ', 'Smart Home', 'Security'];

  $: activeFilterCount = (filters.type !== 'All' ? 1 : 0) + 
                         (filters.status !== 'All' ? 1 : 0) + 
                         (filters.bedrooms !== 'Any' ? 1 : 0) + 
                         (filters.bathrooms !== 'Any' ? 1 : 0) + 
                         (filters.verifiedOnly ? 1 : 0) + 
                         (filters.search ? 1 : 0);

  function toggleSection(section: keyof typeof expandedSections) {
    expandedSections[section] = !expandedSections[section];
  }
</script>

<div class="bg-[#0A1118]/90 backdrop-blur-xl border border-emerald-900/30 rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl">
  <div class="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0A1118]/95 z-10">
    <div class="flex items-center gap-2">
      <SlidersHorizontal size={18} class="text-emerald-500" />
      <h2 class="text-lg font-semibold text-white">Filters</h2>
    </div>
    {#if activeFilterCount > 0}
      <button on:click={onClear} class="text-xs text-emerald-400 hover:text-emerald-300">
        Clear All ({activeFilterCount})
      </button>
    {/if}
  </div>

  <div class="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
    <!-- Quick Search -->
    <div>
      <div class="relative">
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text" 
          bind:value={filters.search}
          placeholder="Location, Estate, etc..." 
          class="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>
    </div>

    <!-- Verified Toggle -->
    <label class="flex items-center justify-between cursor-pointer group">
      <span class="text-sm text-gray-300 group-hover:text-white transition-colors">Verified Properties Only</span>
      <div class="relative">
        <input type="checkbox" bind:checked={filters.verifiedOnly} class="sr-only peer" />
        <div class="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
      </div>
    </label>

    <!-- Property Type -->
    <div class="border-t border-white/5 pt-4">
      <button class="w-full flex items-center justify-between text-sm font-medium text-gray-200 mb-3" on:click={() => toggleSection('type')}>
        Property Type
        {#if expandedSections.type}<ChevronUp size={16}/>{:else}<ChevronDown size={16}/>{/if}
      </button>
      {#if expandedSections.type}
        <div class="flex flex-wrap gap-2">
          {#each types as type}
            <button 
              on:click={() => filters.type = type}
              class="px-3 py-1.5 text-xs rounded-full border transition-colors {filters.type === type ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-200'}"
            >
              {type}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Price Range (Simplified for mockup) -->
    <div class="border-t border-white/5 pt-4">
      <button class="w-full flex items-center justify-between text-sm font-medium text-gray-200 mb-3" on:click={() => toggleSection('price')}>
        Price Range
        {#if expandedSections.price}<ChevronUp size={16}/>{:else}<ChevronDown size={16}/>{/if}
      </button>
      {#if expandedSections.price}
        <div class="space-y-4">
          <div class="flex items-center justify-between text-xs text-amber-400">
            <span>₦{(filters.minPrice/1000000).toFixed(0)}M</span>
            <span>₦{(filters.maxPrice/1000000).toFixed(0)}M+</span>
          </div>
          <input type="range" min="0" max="1000000000" step="10000000" bind:value={filters.maxPrice} class="w-full accent-emerald-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
        </div>
      {/if}
    </div>

    <!-- Rooms -->
    <div class="border-t border-white/5 pt-4">
      <button class="w-full flex items-center justify-between text-sm font-medium text-gray-200 mb-3" on:click={() => toggleSection('rooms')}>
        Rooms
        {#if expandedSections.rooms}<ChevronUp size={16}/>{:else}<ChevronDown size={16}/>{/if}
      </button>
      {#if expandedSections.rooms}
        <div class="space-y-4">
          <div>
            <div class="text-xs text-gray-400 mb-2">Bedrooms</div>
            <div class="flex gap-1">
              {#each bedBathOpts as opt}
                <button on:click={() => filters.bedrooms = opt} class="flex-1 py-1.5 text-xs rounded border text-center transition-colors {filters.bedrooms === opt ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-white/10 text-gray-400'}">{opt}</button>
              {/each}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-400 mb-2">Bathrooms</div>
            <div class="flex gap-1">
              {#each bedBathOpts as opt}
                <button on:click={() => filters.bathrooms = opt} class="flex-1 py-1.5 text-xs rounded border text-center transition-colors {filters.bathrooms === opt ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-white/10 text-gray-400'}">{opt}</button>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.1);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(5, 150, 105, 0.5);
    border-radius: 4px;
  }
</style>
