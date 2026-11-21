// Cache hanya layar offline. Jangan menyimpan tautan personal atau respons API.
const CACHE = 'undangan-pwa-offline-1';
const OFFLINE = '/offline.html';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE, { cache: 'reload' }))));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith('undangan-pwa-offline-') && key !== CACHE)
    .map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== self.location.origin
      || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(request).catch(async () =>
    (await (await caches.open(CACHE)).match(OFFLINE)) || Response.error()));
});
