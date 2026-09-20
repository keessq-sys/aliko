<script lang="ts">
  import GoogleMap from '$lib/components/ui/GoogleMap.svelte';

  export let properties: any[] = [];
  export let selectedId: string | null = null;

  $: selected = properties.find((p) => p.id === selectedId) ?? null;

  $: markers = properties
    .filter((p) => p.location?.lat && p.location?.lng)
    .map((p) => ({
      lat: p.location.lat,
      lng: p.location.lng,
      title: p.title,
      price: `₦${(p.price / 1_000_000).toFixed(0)}M`,
      status: p.status,
      href: `/properties/${p.id}`
    }));

  $: center = selected?.location
    ? { lat: selected.location.lat, lng: selected.location.lng }
    : markers.length > 0
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : { lat: 6.4531, lng: 3.4655 };

  function selectNearby(id: string) {
    selectedId = id;
  }
</script>

<div class="flex h-full min-h-[600px] rounded-2xl border border-white/10 bg-[#050A0E]">
  <!-- Sidebar list -->
  <div class="z-10 flex w-full flex-col border-r border-white/10 bg-[#0A1118]/90 backdrop-blur-md md:w-1/3">
    <div class="border-b border-white/10 p-4">
      <h3 class="text-lg font-semibold text-white">Map View</h3>
      <p class="text-sm text-gray-400">{properties.length} properties found</p>
    </div>
    <div class="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-2">
      {#each properties as prop (prop.id)}
        <button
          class="w-full rounded-lg border p-2 text-left transition-colors {selectedId === prop.id
            ? 'border-emerald-500/50 bg-emerald-900/40'
            : 'border-transparent hover:bg-white/5'}"
          on:click={() => (selectedId = prop.id)}
        >
          <div class="flex gap-3">
            <img src={prop.images[0]} class="h-16 w-16 rounded object-cover" alt="" />
            <div class="min-w-0 flex-1">
              <h4 class="truncate text-sm font-medium text-white">{prop.title}</h4>
              <div class="mt-1 truncate text-xs text-gray-400">{prop.location.address}</div>
              <div class="mt-1 text-sm font-bold text-emerald-400">₦{(prop.price / 1_000_000).toFixed(0)}M</div>
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Live Google Map -->
  <div class="relative hidden w-2/3 md:block">
    <GoogleMap
      {center}
      zoom={12}
      {markers}
      height="100%"
      markerClickHref={true}
      selectedMarkerTitle={selected?.title ?? null}
    />
    <!-- Legend -->
    <div class="absolute left-4 top-4 z-20 flex gap-4 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-medium backdrop-blur-md">
      <div class="flex items-center gap-1"><span class="h-3 w-3 rounded-full bg-emerald-500"></span> Available</div>
      <div class="flex items-center gap-1"><span class="h-3 w-3 rounded-full bg-amber-500"></span> Reserved</div>
      <div class="flex items-center gap-1"><span class="h-3 w-3 rounded-full bg-rose-500"></span> Sold</div>
    </div>
  </div>

  <!-- Mobile: show GoogleMap fallback/pins stacked under list -->
  <div class="hidden"></div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
</style>
