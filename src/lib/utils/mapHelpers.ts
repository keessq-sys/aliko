export function getLeafletMapHTML(lat: number, lng: number, zoom = 14, markers: {lat:number,lng:number,title:string}[] = []): string {
  const markersJS = markers.map(m => 
    `L.marker([${m.lat}, ${m.lng}]).addTo(map).bindPopup("${m.title}");`
  ).join('\n');
  
  return `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100vw; height: 100vh; background: #050A0E; }
    .leaflet-popup-content-wrapper { background: rgba(5, 10, 14, 0.9); color: #fff; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); }
    .leaflet-popup-tip { background: rgba(5, 10, 14, 0.9); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], ${zoom});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    ${markersJS}
    if(${markers.length} === 0) {
      L.marker([${lat}, ${lng}]).addTo(map);
    }
  </script>
</body>
</html>`;
}

export function buildGoogleMapsUrl(lat: number, lng: number, zoom = 15): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=800x400&key=YOUR_GOOGLE_MAPS_API_KEY`;
}

export function parseCoords(location: string): {lat: number, lng: number} | null {
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
