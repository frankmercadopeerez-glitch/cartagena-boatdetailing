const CACHE_STATIC = "cbd-static-v5";
const CACHE_PAGES = "cbd-pages-v2";
const FINANZAS_CACHE = "cbd-finanzas-v42";

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
  "/css/finanzas-tailwind.css",
  "/js/finance-engine.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE_STATIC)
      .then((cache) => cache.addAll(STATIC_SHELL))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  const keep = [CACHE_STATIC, CACHE_PAGES, FINANZAS_CACHE];
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
      await new Promise((resolve) => setTimeout(resolve, 750));

      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      await Promise.all(
        windows.map((client) => {
          const url = new URL(client.url);
          if (
            url.pathname !== "/finanzas.html" ||
            url.searchParams.get("_cbd_build") === "42"
          ) {
            return Promise.resolve();
          }
          url.searchParams.set("_cbd_build", "42");
          return client.navigate(url.href).catch(() => undefined);
        }),
      );
    })(),
  );
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
        return fetch(e.request, { cache: "no-store" })
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
