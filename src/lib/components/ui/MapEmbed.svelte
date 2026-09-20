<script lang="ts">
  /**
   * SSR-safe Google Maps <iframe> embed (no API key required).
   * Centered on lat/lng with a branded pin overlay.
   */
  import { MapPin } from 'lucide-svelte';

  export let lat: number | undefined = undefined;
  export let lng: number | undefined = undefined;
  export let zoom: number = 15;
  export let height: string = '400px';
  export let label: string = 'Property location';

  $: hasCoords = lat !== undefined && lng !== undefined;
  // Google Maps embed (pb param free-form): use the maps.google.com output=embed pattern
  $: embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed&hl=en`
    : '';
</script>

<div class="relative w-full overflow-hidden rounded-2xl border border-white/10" style="height: {height}">
  {#if hasCoords}
    <iframe
      title={label}
      src={embedSrc}
      class="absolute inset-0 h-full w-full border-0"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
    ></iframe>
    <div class="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur-md">
      <MapPin size={13} class="text-emerald-400" />
      {label}
    </div>
  {:else}
    <div class="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1219]">
      <div
        class="absolute inset-0 opacity-10"
        style="background-image: linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px); background-size: 44px 44px;"
      ></div>
      <MapPin size={40} class="relative z-10 mb-3 text-stone-600" />
      <p class="relative z-10 text-sm text-stone-500">Location coordinates unavailable</p>
    </div>
  {/if}
</div>
