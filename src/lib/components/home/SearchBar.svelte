<script lang="ts">
  import { MapPin, Home, Banknote, Bed, Search } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let location = 'All';
  let propertyType = 'All';
  let priceRange = 'Any';
  let bedrooms = 'Any';

  const PRICE_BRACKETS: Record<string, { min?: number; max?: number }> = {
    Under30M: { max: 30_000_000 },
    Under50M: { max: 50_000_000 },
    Under100M: { max: 100_000_000 },
    Under200M: { max: 200_000_000 },
    '500M+': { min: 500_000_000 }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location !== 'All') params.set('q', location === 'PortHarcourt' ? 'Port Harcourt' : location);
    if (propertyType !== 'All') params.set('type', propertyType);
    if (bedrooms !== 'Any') params.set('bedrooms', bedrooms);
    const bracket = PRICE_BRACKETS[priceRange];
    if (bracket?.min) params.set('minPrice', String(bracket.min));
    if (bracket?.max) params.set('maxPrice', String(bracket.max));
    goto(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  };
</script>

<style>
  .search-glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }
  
  select {
    background: transparent;
    color: white;
    border: none;
    outline: none;
    appearance: none;
    cursor: pointer;
  }
  
  select option {
    background: #0f172a; /* dark bg for dropdown items */
    color: white;
  }
</style>

<div class="search-glass rounded-2xl p-4 w-full flex flex-col md:flex-row gap-4 items-center">
  
  <!-- Location -->
  <div class="flex-1 w-full border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0 md:pr-4 flex flex-col">
    <label class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
      <MapPin size={12} class="text-emerald-400" /> Location
    </label>
    <select bind:value={location} class="w-full text-sm font-medium">
      <option value="All">All Locations</option>
      <option value="Abuja">Abuja, FCT</option>
      <option value="Lagos">Lagos State</option>
      <option value="PortHarcourt">Port Harcourt</option>
      <option value="Kano">Kano</option>
    </select>
  </div>

  <!-- Property Type -->
  <div class="flex-1 w-full border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0 md:pr-4 flex flex-col">
    <label class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
      <Home size={12} class="text-amber-400" /> Property Type
    </label>
    <select bind:value={propertyType} class="w-full text-sm font-medium">
      <option value="All">All Types</option>
      <option value="Residential">Residential</option>
      <option value="Commercial">Commercial</option>
      <option value="Apartment">Apartment</option>
      <option value="Land">Land / Plots</option>
      <option value="Duplex">Duplex</option>
      <option value="Penthouse">Penthouse</option>
    </select>
  </div>

  <!-- Price Range -->
  <div class="flex-1 w-full border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0 md:pr-4 flex flex-col">
    <label class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
      <Banknote size={12} class="text-emerald-400" /> Price Range
    </label>
    <select bind:value={priceRange} class="w-full text-sm font-medium">
      <option value="Any">Any Price</option>
      <option value="Under30M">Under ₦30M</option>
      <option value="Under50M">Under ₦50M</option>
      <option value="Under100M">Under ₦100M</option>
      <option value="Under200M">Under ₦200M</option>
      <option value="500M+">₦500M+</option>
    </select>
  </div>

  <!-- Bedrooms -->
  <div class="flex-1 w-full pb-2 md:pb-0 md:pr-4 flex flex-col">
    <label class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
      <Bed size={12} class="text-amber-400" /> Bedrooms
    </label>
    <select bind:value={bedrooms} class="w-full text-sm font-medium">
      <option value="Any">Any</option>
      <option value="1+">1+ Beds</option>
      <option value="2+">2+ Beds</option>
      <option value="3+">3+ Beds</option>
      <option value="4+">4+ Beds</option>
      <option value="5+">5+ Beds</option>
    </select>
  </div>

  <!-- Search Button -->
  <button 
    on:click={handleSearch}
    class="w-full md:w-auto h-12 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
  >
    <Search size={18} />
    <span class="md:hidden lg:inline">Search</span>
  </button>
</div>
