const CACHE_STATIC = "cbd-static-v2";
const CACHE_PAGES = "cbd-pages-v1";
const FINANZAS_CACHE = "cbd-finanzas-v26";

// Archivos del shell estático (CSS, JS, fuentes, imágenes críticas)
const STATIC_SHELL = [
  "/css/tailwind.css",
  "/css/styles.css",
  "/js/main.js",
  "/fonts/inter-normal-400-latin.woff2",
  "/fonts/inter-normal-700-latin.woff2",
  "/fonts/playfair-display-normal-700-latin.woff2",
  "/images/cbdlogo-gold.svg",
  "/images/header.webp",
  "/vendor/phosphor/icons.css",
];

const FINANZAS_PATHS = [
  "/finanzas.html",
  "/finanzas-manifest.json",
  "/js/finance-engine.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(STATIC_SHELL)
      .then((cache) => cache.addAll(STATIC_SHELL))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  const keep = [CACHE_STATIC, CACHE_PAGES, FINANZAS_CACHE];
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  const url = new URL(e.request.url);
  const path = url.pathname;

  // Finanzas: network-first with cache fallback
  if (FINANZAS_PATHS.includes(path)) {
    e.respondWith(
      caches.open(FINANZAS_CACHE).then((cache) => {
        return fetch(e.request)
          .then((res) => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          })
          .catch(() => cache.match(e.request));
      }),
    );
    return;
  }

  // Recursos estáticos (CSS, JS, fonts, images): cache-first
  const isStatic = path !== "/sw.js" && /\.(css|js|woff2?|webp|svg|png|jpg|ico)$/.test(path);
  if (isStatic) {
    e.respondWith(
      caches.open(CACHE_STATIC).then((cache) => {
        return cache.match(e.request).then((cached) => {
          if (cached) return cached;
          return fetch(e.request).then((res) => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          });
        });
      }),
    );
    return;
  }

  // Páginas HTML: stale-while-revalidate
  if (path.endsWith(".html") || path === "/" || path.endsWith("/")) {
    e.respondWith(
      caches.open(CACHE_PAGES).then((cache) => {
        return cache.match(e.request).then((cached) => {
          const networkFetch = fetch(e.request)
            .then((res) => {
              if (res.ok) cache.put(e.request, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || networkFetch;
        });
      }),
    );
  }
});
