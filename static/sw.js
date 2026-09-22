// static/sw.js
// Minimal stub service worker. This app doesn't register a service worker
// itself (no `navigator.serviceWorker.register()` call anywhere in src/) —
// this file only exists so a browser or devtools probe for /sw.js at the
// root scope gets a real (empty) response instead of a 404. It installs
// and activates immediately, claims no clients, and intercepts nothing.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
