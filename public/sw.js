const CACHE_NAME = 'habitterminal-cache-v3';
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
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve cached assets when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for Supabase API, Auth API, and internal Next.js server actions/calls
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('_next') ||
    url.hostname.includes('supabase.co')
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset, fetch fresh in background to update cache
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background fetch failure (offline)
          });
        return cachedResponse;
      }

      // Fallback to network
      return fetch(request).catch(() => {
        // If navigation request and offline, return the cached /today page shell
        if (request.mode === 'navigate') {
          return caches.match('/today');
        }
        return new Response('Offline content not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});
