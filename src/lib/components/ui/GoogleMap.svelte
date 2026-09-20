<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { MapPin, KeyRound } from 'lucide-svelte';

  /**
   * Google Maps JS API wrapper for ADK.
   * - Loads the Maps JS API lazily once per page (singleton loader).
   * - Applies a dark "ADK Obsidian" map style; falls back to a styled
   *   placeholder when PUBLIC_GOOGLE_MAPS_API_KEY is not configured.
   */
  export let center: { lat: number; lng: number } = { lat: 9.0574, lng: 7.4894 };
  export let zoom: number = 12;
  export let markers: { lat: number; lng: number; title: string; price?: string; status?: 'available' | 'reserved' | 'sold'; href?: string }[] = [];
  export let selectedMarkerTitle: string | null = null;
  export let height: string = '500px';
  export let markerClickHref: boolean = false;

  const DARK_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#0b1219' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#050a0e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#7c8b98' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1c2a36' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#0d2019' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#1d5c45' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#152029' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e2d3a' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#5f7180' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#233440' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#33475a' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060d13' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1d4e63' }] }
  ] as google.maps.MapOptions['styles'];

  const STATUS_COLORS: Record<string, string> = {
    available: '#10b981',
    reserved: '#f59e0b',
    sold: '#f43f5e'
  };

  let mapEl: HTMLDivElement;
  let map: google.maps.Map | null = null;
  let infoWindow: google.maps.InfoWindow | null = null;
  let advancedMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  let legacyMarkers: google.maps.Marker[] = [];
  let loaderPromise: Promise<void> | null = null;
  let destroyed = false;

  function apiKey(): string {
    try {
      // SvelteKit exposes PUBLIC_* env vars at build time
      return import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined ?? '';
    } catch {
      return '';
    }
  }

  function loadGoogleMaps(): Promise<void> {
    const key = apiKey();
    if (!key) return Promise.reject(new Error('NO_KEY'));
    if (window.google?.maps) return Promise.resolve();
    if (loaderPromise) return loaderPromise;

    loaderPromise = new Promise((resolve, reject) => {
      const cbName = `__adkMapsReady_${Date.now()}`;
      (window as any)[cbName] = () => resolve();
      const s = document.createElement('script');
      // Advanced markers need a mapId; classic markers don't. Use classic
      // markers + InfoWindow for zero-config operation without mapId.
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${cbName}`;
      s.async = true;
      s.onerror = () => reject(new Error('MAPS_LOAD_FAILED'));
      document.head.appendChild(s);
    });
    return loaderPromise;
  }

  function pinSvg(color: string): string {
    return (
      '<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="' + color + '"/>' +
      '<circle cx="14" cy="14" r="5.5" fill="#050a0e"/>' +
      '</svg>'
    );
  }

  function renderMarkers() {
    if (!map || destroyed) return;
    legacyMarkers.forEach((m) => m.setMap(null));
    legacyMarkers = [];

    for (const m of markers) {
      const color = STATUS_COLORS[m.status ?? 'available'] ?? '#10b981';
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: m.title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvg(color)),
          scaledSize: new google.maps.Size(28, 40)
        }
      });
      marker.addListener('click', () => {
        infoWindow?.close();
        infoWindow = new google.maps.InfoWindow({
          content:
            `<div style="font-family:Inter,sans-serif;min-width:180px;color:#0f172a">` +
            `<strong style="font-size:13px">${m.title}</strong>` +
            (m.price ? `<div style="color:#059669;font-weight:700;margin-top:4px">${m.price}</div>` : '') +
            (m.status ? `<div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-top:2px">${m.status}</div>` : '') +
            (markerClickHref && m.href ? `<a href="${m.href}" style="display:inline-block;margin-top:8px;font-size:12px;color:#0f766e;font-weight:600">View details →</a>` : '') +
            `</div>`
        });
        infoWindow.open({ anchor: marker, map });
      });
      if (selectedMarkerTitle && m.title === selectedMarkerTitle) {
        infoWindow = new google.maps.InfoWindow({ content: `<div style="font-family:Inter,sans-serif;color:#0f172a"><strong>${m.title}</strong></div>` });
        infoWindow.open({ anchor: marker, map });
      }
      legacyMarkers.push(marker);
    }
  }

  onMount(async () => {
    try {
      await loadGoogleMaps();
    } catch {
      return; // fallback UI shown reactively
    }
    if (destroyed || !mapEl) return;
    map = new google.maps.Map(mapEl, {
      center,
      zoom,
      styles: DARK_STYLE,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU, position: google.maps.ControlPosition.TOP_RIGHT },
      streetViewControl: true,
      fullscreenControl: true,
      gestureHandling: 'greedy'
    });
    infoWindow = new google.maps.InfoWindow();
    renderMarkers();
  });

  $: if (map && markers) renderMarkers();
  $: if (map && center) map.panTo(center);

  onDestroy(() => {
    destroyed = true;
    legacyMarkers.forEach((m) => m.setMap(null));
    legacyMarkers = [];
  });
</script>

<div class="relative w-full overflow-hidden rounded-2xl border border-white/10" style="height: {height}">
  <div bind:this={mapEl} class="absolute inset-0"></div>

  {#if !apiKey()}
    <!-- Graceful fallback: still shows pins over a branded map motif -->
    <div class="absolute inset-0 z-10 flex items-center justify-center bg-[#0b1219]">
      <div
        class="absolute inset-0 opacity-15"
        style="background-image: linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px); background-size: 44px 44px;"
      ></div>
      {#each markers as m, i}
        {@const top = 22 + ((i * 19) % 56)}
        {@const left = 18 + ((i * 27) % 64)}
        <a
          href={markerClickHref && m.href ? m.href : undefined}
          class="absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 {selectedMarkerTitle === m.title ? 'scale-125 z-20' : 'z-10'}"
          style="top: {top}%; left: {left}%;"
        >
          <svg viewBox="0 0 28 40" class="h-10 w-7 drop-shadow-lg" fill={STATUS_COLORS[m.status ?? 'available']}>
            <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" />
            <circle cx="14" cy="14" r="5.5" fill="#050a0e" />
          </svg>
        </a>
      {/each}
      <div class="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-500/30 bg-black/70 px-4 py-2 text-xs text-amber-300 backdrop-blur-md">
        <KeyRound size={14} />
        Set PUBLIC_GOOGLE_MAPS_API_KEY to enable live Google Maps — showing stylized preview
      </div>
      {#if markers.length === 0}
        <div class="relative z-10 flex flex-col items-center text-stone-500">
          <MapPin size={40} class="mb-2" />
          <p class="text-sm">No locations to display</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
