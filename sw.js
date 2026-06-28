const CACHE_NAME = 'wordbook-cache-v3';
const urlsToCache = [
  self.location.href.replace(/[?#].*$/, ''), // 页面自身
  self.location.href.replace(/sw\.js$/, 'index.html'), // 确保缓存 index.html
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(urlsToCache.map(url =>
        cache.add(url).catch(() => fetch(url).then(r => {
          if (r.ok) return cache.put(url, r);
        }))
      ));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Skip API calls and external requests
  if (event.request.url.includes('api.mymemory.translated.net')) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
