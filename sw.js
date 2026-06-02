const CACHE_NAME = "cbd-finanzas-v5";
const APP_SHELL = [
  "/finanzas.html",
  "/finanzas-manifest.json",
];

// Solo archivos directamente relacionados con finanzas
const FINANZAS_PATHS = ["/finanzas.html", "/finanzas-manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Solo interceptar peticiones de finanzas.html y su manifest
  // Todo lo demas (CSS, JS del sitio principal, imagenes) pasa directo a la red
  const isFinanzas = FINANZAS_PATHS.includes(url.pathname);
  if (!isFinanzas) return;

  // Skip cross-origin
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const networkFetch = fetch(e.request)
        .then((res) => {
          if (res.ok && e.request.method === "GET") {
            const clone = res.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    }),
  );
});
