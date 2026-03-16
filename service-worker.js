const CACHE_NAME = 'whiteboard-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.skypack.dev/perfect-freehand',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // We use addAll but catch errors safely since some are cross-origin
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => {
            return fetch(new Request(url, { mode: 'no-cors' })).then(response => {
              if (response) {
                return cache.put(url, response);
              }
            });
          })
        );
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          // Cache successful responses extending beyond initial list
          if (!response || response.status !== 200 || response.type !== 'basic') {
             return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        }).catch(() => {
          // If offline and request fails, just return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
