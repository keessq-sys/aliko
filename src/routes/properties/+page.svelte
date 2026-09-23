<script lang="ts">
  import type { Property } from '$lib/stores/properties';
  import { useQuery } from '$lib/convex/queries';
  import { api } from '$lib/convex/_generated/api';
  import { toDisplayProperty } from '$lib/utils/propertyAdapter';
  import PropertyCard from '$lib/components/properties/PropertyCard.svelte';
  import PropertyListItem from '$lib/components/properties/PropertyListItem.svelte';
  import PropertyMapView from '$lib/components/properties/PropertyMapView.svelte';
  import PropertyFilters from '$lib/components/properties/PropertyFilters.svelte';
  import { LayoutGrid, LayoutList, Map as MapIcon, SlidersHorizontal, X, ArrowUpDown, ChevronRight } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { SIGNATURE_DEVELOPMENTS } from '$lib/data/imagery';
  import { FALLBACK_PROPERTIES } from '$lib/data/fallbackCatalog';

  const bannerImage = SIGNATURE_DEVELOPMENTS[1].image;

  // Real Convex-backed catalog, adapted into the same `Property` shape this
  // page's filtering/sorting logic and PropertyCard/PropertyListItem/
  // PropertyMapView already expect (see $lib/utils/propertyAdapter.ts) —
  // this file previously read from a hardcoded 12-item mock store.
  const liveProperties = useQuery(api.properties.listProperties, { activeOnly: true, limit: 200 });
  $: allProperties = ($liveProperties?.length ? $liveProperties : FALLBACK_PROPERTIES).map(toDisplayProperty);

  // View state
  let currentView: 'grid' | 'list' | 'map' = 'grid';
  let isMobileFilterOpen = false;
  let selectedMapPropertyId: string | null = null;

  // Seed filters from the URL so links from the homepage search bar, city
  // explorer and signature developments carousel land pre-filtered.
  const params = $page.url.searchParams;
  const seedType = params.get('type');

  // Filter state
  let filters = {
    search: params.get('q') ?? '',
    type: seedType ? seedType.charAt(0).toUpperCase() + seedType.slice(1).toLowerCase() : 'All',
    status: 'All',
    minPrice: params.has('minPrice') ? Number(params.get('minPrice')) : 0,
    maxPrice: params.has('maxPrice') ? Number(params.get('maxPrice')) : 1000000000,
    bedrooms: params.get('bedrooms') ?? 'Any',
    bathrooms: 'Any',
    verifiedOnly: false,
    sortBy: 'Newest'
  };

  function clearFilters() {
    filters = {
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
  }

  // Reactive filtering
  $: filteredProperties = allProperties.filter((p: Property) => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        p.title.toLowerCase().includes(q) ||
        p.location.address.toLowerCase().includes(q) ||
        p.location.lga.toLowerCase().includes(q) ||
        p.location.state.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Type
    if (filters.type !== 'All' && p.type.toLowerCase() !== filters.type.toLowerCase()) {
      return false;
    }

    // Status
    if (filters.status !== 'All' && p.status.toLowerCase() !== filters.status.toLowerCase()) {
      return false;
    }

    // Bedrooms
    if (filters.bedrooms !== 'Any') {
      const req = parseInt(filters.bedrooms);
      if (filters.bedrooms.includes('+')) {
        if (p.bedrooms < req) return false;
      } else {
        if (p.bedrooms !== req) return false;
      }
    }

    // Bathrooms
    if (filters.bathrooms !== 'Any') {
      const req = parseInt(filters.bathrooms);
      if (filters.bathrooms.includes('+')) {
        if (p.bathrooms < req) return false;
      } else {
        if (p.bathrooms !== req) return false;
      }
    }

    // Price
    if (p.price < filters.minPrice || p.price > filters.maxPrice) {
      return false;
    }

    // Verified
    if (filters.verifiedOnly && !p.isVerified) {
      return false;
    }

    return true;
  }).sort((a: Property, b: Property) => {
    if (filters.sortBy === 'Price: Low to High') return a.price - b.price;
    if (filters.sortBy === 'Price: High to Low') return b.price - a.price;
    return b.id.localeCompare(a.id); // default newest
  });

  // Active filter count
  $: activeChips = [
    filters.search ? `Search: "${filters.search}"` : null,
    filters.type !== 'All' ? `Type: ${filters.type}` : null,
    filters.status !== 'All' ? `Status: ${filters.status}` : null,
    filters.bedrooms !== 'Any' ? `Beds: ${filters.bedrooms}` : null,
    filters.bathrooms !== 'Any' ? `Baths: ${filters.bathrooms}` : null,
    filters.verifiedOnly ? 'Verified Only' : null,
    filters.maxPrice < 1000000000 ? `Max: ₦${(filters.maxPrice / 1000000).toFixed(0)}M` : null
  ].filter(Boolean) as string[];

  function removeChip(chip: string) {
    if (chip.startsWith('Search:')) filters.search = '';
    else if (chip.startsWith('Type:')) filters.type = 'All';
    else if (chip.startsWith('Status:')) filters.status = 'All';
    else if (chip.startsWith('Beds:')) filters.bedrooms = 'Any';
    else if (chip.startsWith('Baths:')) filters.bathrooms = 'Any';
    else if (chip === 'Verified Only') filters.verifiedOnly = false;
    else if (chip.startsWith('Max:')) filters.maxPrice = 1000000000;
  }
</script>

<svelte:head>
  <title>Properties & Real Estate Listings — Aliko Diamond Key</title>
  <meta name="description" content="Explore verified houses, lands, penthouses, duplexes and commercial properties across Nigeria." />
</svelte:head>

<div class="min-h-screen bg-[#050A0E] text-white">
  <!-- Header / Breadcrumb banner -->
  <div class="relative overflow-hidden py-10 border-b border-white/5">
    <img src={bannerImage} alt="" class="absolute inset-0 h-full w-full object-cover opacity-25" loading="eager" />
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050A0E] via-[#050A0E]/90 to-[#050A0E]/60"></div>
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent"></div>
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-stone-400 mb-4">
        <a href="/" class="hover:text-emerald-400 transition-colors">Home</a>
        <ChevronRight size={12} />
        <span class="text-emerald-400">Properties</span>
      </nav>

      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl sm:text-4xl font-serif font-bold text-white mb-2">
            Verified Property Listings
          </h1>
          <p class="text-stone-400 text-sm max-w-xl">
            Showing <span class="text-emerald-400 font-semibold">{filteredProperties.length}</span> verified properties in Abuja, Lagos, and top Nigerian growth corridors.
          </p>
        </div>

        <!-- View Controls & Sort -->
        <div class="flex items-center gap-3">
          <!-- View Toggle -->
          <div class="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
            <button
              on:click={() => currentView = 'grid'}
              class="p-2 rounded-lg transition-colors {currentView === 'grid' ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}"
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              on:click={() => currentView = 'list'}
              class="p-2 rounded-lg transition-colors {currentView === 'list' ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}"
              title="List View"
            >
              <LayoutList size={18} />
            </button>
            <button
              on:click={() => currentView = 'map'}
              class="p-2 rounded-lg transition-colors {currentView === 'map' ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}"
              title="Map View"
            >
              <MapIcon size={18} />
            </button>
          </div>

          <!-- Sort Select -->
          <div class="relative">
            <select
              bind:value={filters.sortBy}
              class="appearance-none bg-white/5 border border-white/10 text-white text-xs sm:text-sm rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Newest" class="bg-[#0A1628]">Newest</option>
              <option value="Price: Low to High" class="bg-[#0A1628]">Price: Low to High</option>
              <option value="Price: High to Low" class="bg-[#0A1628]">Price: High to Low</option>
            </select>
            <ArrowUpDown size={14} class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>

          <!-- Mobile Filter Button -->
          <button
            on:click={() => isMobileFilterOpen = true}
            class="md:hidden flex items-center gap-2 px-3 py-2.5 bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-medium"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <!-- Active Filter Chips -->
      {#if activeChips.length > 0}
        <div class="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/5">
          <span class="text-xs text-stone-500 mr-1">Active filters:</span>
          {#each activeChips as chip}
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
              {chip}
              <button on:click={() => removeChip(chip)} class="hover:text-white" title="Remove">
                <X size={12} />
              </button>
            </span>
          {/each}
          <button on:click={clearFilters} class="text-xs text-stone-400 hover:text-white ml-2 underline">
            Clear all
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Main Content Layout -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col lg:flex-row gap-8">
      
      <!-- Desktop Sidebar Filters (hidden in map mode for full width experience) -->
      {#if currentView !== 'map'}
        <div class="hidden lg:block w-72 flex-shrink-0">
          <div class="sticky top-28">
            <PropertyFilters bind:filters onClear={clearFilters} />
          </div>
        </div>
      {/if}

      <!-- Listings Content Area -->
      <div class="flex-1 min-w-0">
        {#if currentView === 'map'}
          <!-- Map View Full Component -->
          <PropertyMapView properties={filteredProperties} bind:selectedId={selectedMapPropertyId} />
        {:else if filteredProperties.length === 0}
          <!-- Empty State -->
          <div class="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
            <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <SlidersHorizontal size={28} />
            </div>
            <h3 class="text-xl font-serif font-bold text-white mb-2">No matching properties found</h3>
            <p class="text-stone-400 text-sm max-w-md mb-6">
              We couldn't find any listings matching your current filter criteria. Try expanding your search or clearing active filters.
            </p>
            <button
              on:click={clearFilters}
              class="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-400 text-white shadow-lg hover:shadow-emerald-500/20"
            >
              Clear All Filters
            </button>
          </div>
        {:else if currentView === 'grid'}
          <!-- 3-Column Responsive Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {#each filteredProperties as property (property.id)}
              <PropertyCard {property} />
            {/each}
          </div>
        {:else if currentView === 'list'}
          <!-- Horizontal List Stack -->
          <div class="space-y-4">
            {#each filteredProperties as property (property.id)}
              <PropertyListItem {property} />
            {/each}
          </div>
        {/if}
      </div>

    </div>
  </div>
</div>

<!-- Mobile Filters Drawer -->
{#if isMobileFilterOpen}
  <div class="fixed inset-0 z-50 lg:hidden">
    <!-- Backdrop -->
    <div
      on:click={() => isMobileFilterOpen = false}
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
      role="presentation"
    ></div>

    <!-- Drawer Content -->
    <div class="absolute inset-y-0 right-0 w-full max-w-sm bg-[#050A0E] border-l border-white/10 shadow-2xl flex flex-col p-4">
      <div class="flex items-center justify-between pb-4 border-b border-white/10">
        <h3 class="text-lg font-serif font-bold text-white">Filter Properties</h3>
        <button on:click={() => isMobileFilterOpen = false} aria-label="Close filters" class="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 text-stone-400 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto py-4">
        <PropertyFilters bind:filters onClear={clearFilters} />
      </div>
      <div class="pt-4 border-t border-white/10">
        <button
          on:click={() => isMobileFilterOpen = false}
          class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg"
        >
          Show {filteredProperties.length} Properties
        </button>
      </div>
    </div>
  </div>
{/if}
