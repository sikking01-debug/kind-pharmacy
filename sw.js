// Kind Pharmacy — service worker
// Caches the app shell so the suite still opens (with local/cached data)
// when there's no signal. Live data (sales, catalog, etc.) still needs a
// connection to reach the Google Sheets backend.
const CACHE_NAME = 'kind-pharmacy-v1';
const APP_SHELL = [
  './index.html',
  './POS.html',
  './Expiry_Check.html',
  './New_Stock_Expiry_Check.html',
  './Kind_Pharmacy_Demand_Creator.html',
  './Reports.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the actual pages (so you always get the latest
// version when online), falling back to cache when offline.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never intercept calls to the Apps Script backend or other origins —
  // those need to always go to the network.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
