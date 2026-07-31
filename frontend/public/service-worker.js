/**
 * Service Worker — offline cache and performance optimization.
 * Caches static assets and API responses for offline access.
 */

const CACHE_NAME = 'f1-analytics-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.jsx',
];

// Install: cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: caching assets');
      return cache.addAll(URLS_TO_CACHE).catch(err => {
        console.warn('Service Worker: cache add failed', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Service Worker: deleting old cache', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch: try network first, fall back to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fall back to cache on network error
        return caches.match(event.request);
      })
  );
});
