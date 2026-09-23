<script lang="ts">
  import { useQuery } from '$lib/convex/queries';
  import { api } from '$lib/convex/_generated/api';
  import { toDisplayProperty } from '$lib/utils/propertyAdapter';
  import PropertyMapView from '$lib/components/properties/PropertyMapView.svelte';
  import { ChevronRight, ArrowLeft } from 'lucide-svelte';
  import { FALLBACK_PROPERTIES } from '$lib/data/fallbackCatalog';

  const liveProperties = useQuery(api.properties.listProperties, { activeOnly: true, limit: 200 });
  $: mapProperties = ($liveProperties?.length ? $liveProperties : FALLBACK_PROPERTIES).map(toDisplayProperty);

  let selectedId: string | null = null;
</script>

<svelte:head>
  <title>Map Explorer — Aliko Diamond Key</title>
  <meta name="description" content="Explore real estate and property listings geographically with our interactive property map." />
</svelte:head>

<div class="min-h-screen bg-[#050A0E] text-white">
  <!-- Top Bar -->
  <div class="border-b border-white/5 bg-white/[0.02] py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/properties" class="flex items-center gap-1.5 text-xs text-stone-400 hover:text-emerald-400 transition-colors">
        <ArrowLeft size={14} /> Back to Grid
      </a>
      <div class="h-4 w-px bg-white/10"></div>
      <h1 class="text-base sm:text-lg font-serif font-bold text-white">Interactive Property Map</h1>
    </div>
    <div class="text-xs text-stone-400">
      <span class="text-emerald-400 font-semibold">{mapProperties.length}</span> properties on map
    </div>
  </div>

  <!-- Full Height Map View -->
  <div class="p-4 sm:p-6 max-w-[1600px] mx-auto h-[calc(100vh-140px)]">
    <PropertyMapView properties={mapProperties} bind:selectedId />
  </div>
</div>
