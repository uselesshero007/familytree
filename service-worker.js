const CACHE_NAME = 'family-tree-cache-v5';
const APP_SHELL_URL = new URL('./index.html', self.registration.scope);
const ASSETS = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => (
          key.startsWith('family-tree-cache-') &&
          key !== CACHE_NAME
        ))
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (
    event.request.mode === 'navigate' ||
    requestUrl.pathname.endsWith('.html')
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        try {
          const response = await fetch(event.request);
          if (response.ok) {
            await cache.put(APP_SHELL_URL, response.clone());
          }
          return response;
        } catch (error) {
          const cached = await cache.match(APP_SHELL_URL);
          if (cached) return cached;
          throw error;
        }
      })()
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => cache.match(event.request)).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});
