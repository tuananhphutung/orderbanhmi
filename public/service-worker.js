
const CACHE_NAME = 'banhmi-pos-v20-fix-404';

// Danh sách file quan trọng BẮT BUỘC phải cache ngay khi cài đặt
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  // Kích hoạt SW mới ngay lập tức không cần đợi
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Chiếm quyền điều khiển ngay lập tức
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
  const request = event.request;
  
  // 1. Xử lý Navigation (HTML): Quan trọng nhất để chống 404
  // Nếu người dùng vào bất kỳ đường dẫn nào, cố gắng lấy mạng, nếu lỗi thì trả về index.html từ cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Nếu có mạng, clone và update cache file index.html mới nhất
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
              // Cache cho cả url hiện tại và root
              cache.put(request, responseClone);
              if (request.url.endsWith('index.html') || request.url.endsWith('/')) {
                  cache.put('./index.html', response.clone());
              }
          });
          return response;
        })
        .catch(() => {
          // MẤT MẠNG HOẶC LỖI: Trả về file index.html đã cache
          return caches.match('./index.html')
            .then(response => {
                if (response) return response;
                // Fallback cuối cùng nếu cache './index.html' bị lỗi
                return caches.match('./');
            });
        })
    );
    return;
  }

  // 2. Xử lý File tĩnh (JS, CSS, Images): Cache First -> Network
  const url = new URL(request.url);
  if (url.pathname.includes('/assets/') || 
      request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.svg')) {
      
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Default: Network Only (API calls, Firebase, etc.)
  return; 
});
