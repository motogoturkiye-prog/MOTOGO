// Her site güncellemesinde bu numarayı artır (v1 -> v2 -> v3...) — telefonlardaki
// PWA, bunu görünce eski önbelleği atıp yeni dosyaları otomatik indirir.
const CACHE_NAME = "motogo-v49";
const ASSETS = [
  "./index.html",
  "./css/style.css",
  "./js/brands-data.js",
  "./js/app.js",
  "./img/logo.png",
  "./img/icon-192.png",
  "./img/icon-512.png"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
