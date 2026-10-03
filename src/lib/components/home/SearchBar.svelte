<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { MapPin, Home, Banknote, Bed, Search } from "lucide-svelte";
  import { goto } from "$app/navigation";

  let location = "All";
  let propertyType = "All";
  let priceRange = "Any";
  let bedrooms = "Any";

  const PRICE_BRACKETS: Record<string, { min?: number; max?: number }> = {
    Under30M: { max: 30_000_000 },
    Under50M: { max: 50_000_000 },
    Under100M: { max: 100_000_000 },
    Under200M: { max: 200_000_000 },
    "500M+": { min: 500_000_000 },
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location !== "All")
      params.set("q", location === "PortHarcourt" ? "Port Harcourt" : location);
    if (propertyType !== "All") params.set("type", propertyType);
    if (bedrooms !== "Any") params.set("bedrooms", bedrooms);
    const bracket = PRICE_BRACKETS[priceRange];
    if (bracket?.min) params.set("minPrice", String(bracket.min));
    if (bracket?.max) params.set("maxPrice", String(bracket.max));
    goto(`/properties${params.toString() ? `?${params.toString()}` : ""}`);
  };
</script>

<div
  class="search-glass rounded-2xl p-4 w-full flex flex-col md:flex-row gap-4 items-center"
>
  <!-- Location -->
  <div
    class="flex-1 w-full border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0 md:pr-4 flex flex-col"
  >
    <label
      class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"
    >
      <MapPin size={12} class="text-emerald-400" /> {$adkT("Location")} </label>
    <select
      aria-label={$adkT("Location")}
      bind:value={location}
      class="w-full text-sm font-medium"
    >
      <option value="All">{$adkT("All Locations")}</option>
      <option value="Abuja">{$adkT("Abuja, FCT")}</option>
      <option value="Lagos">{$adkT("Lagos State")}</option>
      <option value="PortHarcourt">{$adkT("Port Harcourt")}</option>
      <option value="Kano">{$adkT("Kano")}</option>
    </select>
  </div>

  <!-- Property Type -->
  <div
    class="flex-1 w-full border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0 md:pr-4 flex flex-col"
  >
    <label
      class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"
    >
      <Home size={12} class="text-amber-400" /> {$adkT("Property Type")} </label>
    <select
      aria-label={$adkT("Property type")}
      bind:value={propertyType}
      class="w-full text-sm font-medium"
    >
      <option value="All">{$adkT("All Types")}</option>
      <option value="Residential">{$adkT("Residential")}</option>
      <option value="Commercial">{$adkT("Commercial")}</option>
      <option value="Apartment">{$adkT("Apartment")}</option>
      <option value="Land">{$adkT("Land / Plots")}</option>
      <option value="Duplex">{$adkT("Duplex")}</option>
      <option value="Penthouse">{$adkT("Penthouse")}</option>
    </select>
  </div>

  <!-- Price Range -->
  <div
    class="flex-1 w-full border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0 md:pr-4 flex flex-col"
  >
    <label
      class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"
    >
      <Banknote size={12} class="text-emerald-400" /> {$adkT("Price Range")} </label>
    <select
      aria-label={$adkT("Price range")}
      bind:value={priceRange}
      class="w-full text-sm font-medium"
    >
      <option value="Any">{$adkT("Any Price")}</option>
      <option value="Under30M">{$adkT("Under ₦30M")}</option>
      <option value="Under50M">{$adkT("Under ₦50M")}</option>
      <option value="Under100M">{$adkT("Under ₦100M")}</option>
      <option value="Under200M">{$adkT("Under ₦200M")}</option>
      <option value="500M+">{$adkT("₦500M+")}</option>
    </select>
  </div>

  <!-- Bedrooms -->
  <div class="flex-1 w-full pb-2 md:pb-0 md:pr-4 flex flex-col">
    <label
      class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"
    >
      <Bed size={12} class="text-amber-400" /> {$adkT("Bedrooms")} </label>
    <select
      aria-label={$adkT("Bedrooms")}
      bind:value={bedrooms}
      class="w-full text-sm font-medium"
    >
      <option value="Any">{$adkT("Any")}</option>
      <option value="1+">{$adkT("1+ Beds")}</option>
      <option value="2+">{$adkT("2+ Beds")}</option>
      <option value="3+">{$adkT("3+ Beds")}</option>
      <option value="4+">{$adkT("4+ Beds")}</option>
      <option value="5+">{$adkT("5+ Beds")}</option>
    </select>
  </div>

  <!-- Search Button -->
  <button
    on:click={handleSearch}
    class="w-full md:w-auto h-12 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
  >
    <Search size={18} />
    <span class="md:hidden lg:inline">{$adkT("Search")}</span>
  </button>
</div>

<style>
  .search-glass {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
    gap: 16px;
    background: #101e28;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }

  .search-glass > div {
    padding: 0;
    border: 0;
  }
  .search-glass > button {
    grid-column: 1/-1;
    width: 100%;
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
