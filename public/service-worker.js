
const CACHE_NAME = 'banhmi-pos-v14-robust';
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
  // Strategy: Network First -> Cache -> /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return caches.match('index.html').then(cached => cached || response);
            }
            // Update cache with new version
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
                // Also update index.html key explicitly just in case
                cache.put('index.html', responseToCache.clone());
            });
            return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          // Try exact match, then index.html, then ./
          return caches.match(event.request)
            .then(response => response || caches.match('index.html'))
            .then(response => response || caches.match('./'));
        })
    );
    return;
  }

  // Asset requests (JS, CSS, Images)
  // Strategy: Cache First -> Network -> Cache Update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response immediately if found
      if (cachedResponse) {
        // Optional: Update cache in background (Stale-while-revalidate logic could go here)
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Cache valid responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
         // Network failed and no cache - nothing we can do for assets
      });
    })
  );
});
