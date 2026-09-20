/** Google Maps URL helpers (maps are rendered via GoogleMap.svelte / MapEmbed.svelte). */

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function googleMapsPlaceUrl(lat: number, lng: number, zoom = 16): string {
  return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
}

export function googleMapsStaticUrl(lat: number, lng: number, zoom = 15, size = '800x400', apiKeyEnv?: string): string {
  const key = apiKeyEnv ?? (typeof import.meta !== 'undefined' ? (import.meta.env?.PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined) : undefined);
  if (!key) return '';
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&markers=color:0x10b981%7C${lat},${lng}&key=${key}`;
}

export function parseCoords(location: string): { lat: number; lng: number } | null {
  const parts = location.split(',');
  if (parts.length === 2) {
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}
