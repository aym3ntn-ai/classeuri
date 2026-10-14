// Service worker: keeps the installed app usable offline.
// - Hashed build assets (/_astro/) never change: served from the cache first.
// - Pages, catalog.json and PDFs can change: network first, cache as a fallback,
//   so a document opened once stays readable without a connection.

const SCOPE = new URL('./', self.location).pathname; // "/classeuri/"
const ASSETS = 'classeuri-assets-v1';
const PAGES = 'classeuri-pages-v1';
const FILES = 'classeuri-files-v1';
/** PDFs kept for offline reading; the oldest are dropped beyond this. */
const MAX_FILES = 80;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add(SCOPE))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const keep = [ASSETS, PAGES, FILES];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('classeuri-') && !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(ASSETS)).put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      if (cacheName === FILES) trim(FILES, MAX_FILES);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: cacheName === PAGES });
    if (cached) return cached;
    // An uncached page while offline: show the home page, which lists the courses.
    if (request.mode === 'navigate') {
      const home = await caches.match(SCOPE);
      if (home) return home;
    }
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  if (url.pathname.startsWith(`${SCOPE}_astro/`)) event.respondWith(cacheFirst(request));
  else if (url.pathname.startsWith(`${SCOPE}files/`)) event.respondWith(networkFirst(request, FILES));
  else event.respondWith(networkFirst(request, PAGES));
});
