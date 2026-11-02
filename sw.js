const CACHE_NAME = 'app-guru-v1.41-cache';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './js/config.js',
  './js/auth.js',
  './js/app.js',
  './js/ui.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => caches.match('./index.html'));
    })
  );
});