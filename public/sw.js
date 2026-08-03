/**
 * Service worker: stale-while-revalidate cache for same-origin API data.
 *
 * GET /api/* responses are served instantly from cache on repeat visits while
 * the network response refreshes the cache in the background. This makes pages
 * feel instant (data within a second) without changing any application code.
 *
 * Safety:
 *  - Only same-origin GET requests are intercepted.
 *  - /api/auth/* is never cached (session must always be fresh).
 *  - Only successful JSON responses (2xx) are stored.
 *  - The cache is capped at MAX_ENTRIES (oldest entries evicted first).
 *  - Non-GET requests (POST/PUT/PATCH/DELETE) always go straight to the network.
 */
const CACHE_NAME = 'harir-api-cache-v1';
const MAX_ENTRIES = 150;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only cache same-origin GET requests.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip auth/session endpoints and uploads.
  if (url.pathname.startsWith('/api/auth')) return;
  if (!url.pathname.startsWith('/api')) return;

  event.respondWith(staleWhileRevalidate(request, url));
});

async function staleWhileRevalidate(request, url) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    // Serve instantly and refresh the cached copy in the background.
    revalidate(request, cache);
    return cached;
  }

  // No cache entry: wait for the network on the very first load.
  const network = await fetch(request);
  if (network.ok && isJson(network)) {
    await cache.put(request, withMeta(network));
    await evictIfNeeded(cache);
  }
  return network;
}

async function evictIfNeeded(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;

  const entries = await Promise.all(
    keys.map(async (key) => {
      const res = await cache.match(key);
      const meta = JSON.parse(res?.headers.get('x-harir-cache') || '{}');
      return { key, fetchedAt: meta.fetchedAt || 0 };
    })
  );

  entries.sort((a, b) => a.fetchedAt - b.fetchedAt);
  const toRemove = entries.slice(0, entries.length - MAX_ENTRIES);
  await Promise.all(toRemove.map(({ key }) => cache.delete(key)));
}

async function revalidate(request, cache) {
  try {
    const network = await fetch(request);
    if (network.ok && isJson(network)) {
      await cache.put(request, withMeta(network));
      await evictIfNeeded(cache);
    }
  } catch {
    // Keep serving the cached copy if the network fails.
  }
}

function isJson(response) {
  const type = response.headers.get('content-type') || '';
  return type.includes('application/json');
}

function withMeta(response) {
  const headers = new Headers(response.headers);
  headers.set('x-harir-cache', JSON.stringify({ fetchedAt: Date.now() }));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
