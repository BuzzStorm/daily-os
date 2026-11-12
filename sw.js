// Daily OS service worker — cache-first app shell, refreshed in the background.
// Opening the app never waits on the network: the cached page paints at once
// while a fresh copy is fetched. If that copy differs (a new deploy), every open
// page is told so it can show "Update available"; the next launch runs it anyway.
// Sync API calls (Supabase, ESPN) are never intercepted.
const CACHE = 'dailyos-v4';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// A deploy changes the page's ETag / Last-Modified; compare to spot one.
const versionOf = (res) => res && (res.headers.get('etag') || res.headers.get('last-modified'));

// The page being launched may not exist as a client yet when the background
// fetch lands, so keep trying it by id for a few seconds; other open pages get
// told at once.
async function notifyUpdate(tag, launchingId) {
  const msg = { type: 'dailyos-update', tag };
  (await self.clients.matchAll({ type: 'window' })).forEach((c) => { if (c.id !== launchingId) c.postMessage(msg); });
  for (let i = 0; launchingId && i < 20; i++) {
    const c = await self.clients.get(launchingId);
    if (c) { c.postMessage(msg); return; }
    await new Promise((r) => setTimeout(r, 250));
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Google Fonts: CSS and font files are immutable per URL — cache-first, so
  // a slow or offline launch never waits on them.
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(CACHE).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        if (res.ok || res.type === 'opaque') c.put(e.request, res.clone());
        return res;
      })))
    );
    return;
  }
  if (url.origin !== location.origin) return;
  // The page's own update check (HEAD ?_v=…) must always hit the network.
  if (url.searchParams.has('_v')) return;
  // "Refresh" on the update toast: fetch the new page into the cache, then the
  // page reloads onto it.
  if (e.request.headers.get('x-dailyos-fresh')) {
    e.respondWith(fetch(url.href, { cache: 'no-store' }).then(async (res) => {
      if (res.ok) await caches.open(CACHE).then((c) => c.put(url.href, res.clone()));
      return res;
    }));
    return;
  }

  // Page/HTML navigations bypass the HTTP cache on the background refresh so a
  // new deploy is seen at once (GitHub Pages sets a 10-min max-age).
  const isNav = e.request.mode === 'navigate';
  const req = isNav ? new Request(url.href, { cache: 'no-store' }) : e.request;

  e.respondWith(caches.open(CACHE).then(async (c) => {
    const cached = await c.match(e.request, { ignoreSearch: isNav });
    let saved = Promise.resolve();
    const fresh = fetch(req).then((res) => {
      if (res.ok) {
        saved = c.put(e.request, res.clone());
        if (isNav && cached && versionOf(res) && versionOf(res) !== versionOf(cached)) {
          saved = saved.then(() => notifyUpdate(versionOf(res), e.resultingClientId));
        }
      }
      return res;
    });
    // Keep the worker alive until the copy is stored (and any update is announced).
    e.waitUntil(fresh.then(() => saved).catch(() => {}));
    return cached || fresh; // first visit: nothing cached yet
  }));
});
