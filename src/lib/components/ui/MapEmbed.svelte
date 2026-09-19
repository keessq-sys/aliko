<script lang="ts">
  import { MapPin } from 'lucide-svelte';
  import { getLeafletMapHTML } from '$lib/utils/mapHelpers';

  export let lat: number | undefined = undefined;
  export let lng: number | undefined = undefined;
  export let zoom: number = 14;
  export let height: string = '400px';
  export let markers: {lat: number, lng: number, title: string}[] = [];
  export let interactive: boolean = true;

  $: hasCoords = lat !== undefined && lng !== undefined;
  $: srcDoc = hasCoords ? getLeafletMapHTML(lat!, lng!, zoom, markers) : '';
</script>

<div class="map-container relative w-full" style="height: {height};">
  {#if hasCoords}
    {#if interactive}
      <iframe
        title="Map"
        srcdoc={srcDoc}
        class="w-full h-full border-0"
        loading="lazy"
      ></iframe>
    {:else}
      <div class="w-full h-full bg-stone-900 flex items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 bg-emerald-900/20 mix-blend-overlay"></div>
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at center, rgba(5,150,105,0.2) 0%, transparent 70%)"></div>
        <MapPin size={48} class="text-emerald-500 animate-pulse relative z-10" />
      </div>
    {/if}
  {:else}
    <div class="w-full h-full bg-stone-900 flex flex-col items-center justify-center relative overflow-hidden border border-white/5 rounded-xl">
      <div class="absolute inset-0 bg-stone-800/50"></div>
      <MapPin size={48} class="text-stone-600 mb-4 relative z-10" />
      <p class="text-stone-500 font-medium relative z-10">Location data unavailable</p>
    </div>
  {/if}
</div>
