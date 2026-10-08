// Her site güncellemesinde bu numarayı artır — telefondaki uygulama eski hafızayı atıp yenisini alır.
const CACHE_NAME = "motogo-v119";
const ASSETS = [
  "./index.html",
  "./css/style.css",
  "./js/brands-data.js",
  "./js/app.js",
  "./img/logo.png",
  "./img/icon-192.png",
  "./img/icon-512.png"
];
const CACHELENEN = /\.(html|css|js|png|jpg|jpeg|svg|ico|json|webp|woff2)$/i;

self.addEventListener("install", e => {
  self.skipWaiting();
  // "reload": tarayıcının eski kopyasını atlayıp sunucudan taze dosya al
  e.waitUntil(caches.open(CACHE_NAME).then(cache =>
    cache.addAll(ASSETS.map(u => new Request(u, { cache: "reload" })))
  ));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Önce internetten taze dosya, internet yoksa hafızadaki kopya
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: "no-cache" }).then(res => {
      if (res && res.status === 200 && (req.mode === "navigate" || CACHELENEN.test(url.pathname))) {
        const kopya = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, kopya));
      }
      return res;
    }).catch(() =>
      caches.match(req).then(c => c || caches.match("./index.html"))
    )
  );
});
