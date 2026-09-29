const CACHE_NAME = 'habitterminal-cache-v4';
// Content-hashed Next.js build assets; kept in their own capped cache.
const STATIC_CACHE = 'habitterminal-static-v1';
const STATIC_CACHE_MAX_ENTRIES = 300;
const ASSETS_TO_CACHE = [
  '/today',
  '/dashboard',
  '/planner',
  '/recovery',
  '/goals',
  '/life-areas',
  '/habits',
  '/money',
  '/learning',
  '/weekly-review',
  '/achievements',
  '/ai-coach',
  '/settings',
  '/onboarding',
  '/login',
  '/manifest.json',
  '/logo.png'
];

// Install Event - Pre-cache critical pages/assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== STATIC_CACHE) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
//  - /_next/static/*   cache-first: file names are content hashes, so a cached
//                      copy is always correct and the app can boot offline.
//  - page navigations  network-first: always fresh HTML online (a stale page
//                      would reference chunks a redeploy has removed); the
//                      cached copy is only used offline.
//  - other same-origin GETs (manifest, icons): stale-while-revalidate.
//  - API calls, non-GETs and RSC payloads are never cached.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.searchParams.has('_rsc') ||
    request.headers.get('RSC') === '1'
  ) {
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith('/_next/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
    trimCache(STATIC_CACHE, STATIC_CACHE_MAX_ENTRIES);
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match('/today')) || offlineResponse();
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || (await network) || offlineResponse();
}

async function trimCache(name, maxEntries) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

function offlineResponse() {
  return new Response('Offline content not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({ 'Content-Type': 'text/plain' }),
  });
}
