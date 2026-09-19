const CACHE_NAME = "motogo-v1";
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
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
