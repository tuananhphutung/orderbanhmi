
const CACHE_NAME = 'banhmi-pos-v15-fixed-bundle';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use loose caching - if one fails, don't crash the whole install
      return Promise.all(
        urlsToCache.map(url => 
          cache.add(url).catch(err => console.warn('Failed to cache:', url))
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Navigation requests (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return caches.match('index.html').then(cached => cached || response);
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });
            return response;
        })
        .catch(() => {
          return caches.match('index.html')
            .then(response => response || caches.match('./'));
        })
    );
    return;
  }

  // Asset requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
         // Network failed
      });
    })
  );
});
