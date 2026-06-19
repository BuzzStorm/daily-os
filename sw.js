// Daily OS service worker — network-first with cache fallback.
// Always serves fresh code when online; works offline from cache.
// Sync API calls (different origin) are never intercepted.
const CACHE = 'dailyos-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // Page/HTML navigations: bypass the HTTP cache entirely so a new deploy is
  // picked up on the very next load (GitHub Pages sets a 10-min max-age that
  // otherwise keeps serving a stale shell). Falls back to cache when offline.
  const isNav = e.request.mode === 'navigate';
  const req = isNav ? new Request(url.href, { cache: 'no-store' }) : e.request;

  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: isNav }))
  );
});
