
const CACHE_NAME = 'bami-pos-v2';

// Install event - clean up old caches
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    clients.claim()
  );
});

// Fetch event - Network First, falling back to Cache
// This ensures the app is always up to date when online
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like firebase/google fonts) from caching logic for simplicity
  // or handle them with specific strategies if needed.
  if (!event.request.url.startsWith(self.location.origin)) {
     return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, clone it and cache it
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});
