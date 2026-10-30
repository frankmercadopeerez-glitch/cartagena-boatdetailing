const CACHE_STATIC = "cbd-static-v6";
const CACHE_PAGES = "cbd-pages-v3";
const FINANZAS_CACHE = "cbd-private-apps-v83";

// Archivos del shell estático (CSS, JS, fuentes, imágenes críticas)
const STATIC_SHELL = [
  "/css/tailwind.css?v=20260813-2",
  "/css/styles.css?v=20260813-2",
  "/js/main.js?v=20260813-3",
  "/fonts/inter-normal-400-latin.woff2",
  "/fonts/playfair-display-normal-400-latin.woff2",
  "/images/cbdlogo-gold.svg",
  "/images/header.webp",
  "/vendor/phosphor/icons.css",
];

const FINANZAS_PATHS = [
  "/finanzas.html",
  "/finanzas-manifest.json",
  "/css/finanzas-tailwind.css",
  "/js/finance-engine.js",
  "/operaciones.html",
  "/operaciones-manifest.json",
  "/css/operaciones.css",
  "/js/operations-engine.js",
  "/js/operaciones.js",
  "/images/operations-icon.svg",
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
            url.searchParams.get("_cbd_build") === "52"
          ) {
            return Promise.resolve();
          }
          url.searchParams.set("_cbd_build", "52");
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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/operaciones.html";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const targetUrl = new URL(target, self.location.origin);
      const existing = clients.find((client) => new URL(client.url).pathname === targetUrl.pathname);
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl.href);
    }),
  );
});

// El servidor envía estas notificaciones mediante Web Push. Este listener se
// ejecuta incluso cuando la PWA y el navegador están cerrados.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { body: event.data ? event.data.text() : "Tienes una tarea pendiente." };
  }
  event.waitUntil(self.registration.showNotification(payload.title || "CBD Operaciones", {
    body: payload.body || "Tienes una tarea pendiente.",
    icon: "/images/operations-icon.svg?v=1",
    badge: "/images/operations-icon.svg?v=1",
    tag: payload.tag || "cbd-operaciones",
    renotify: true,
    data: { url: payload.url || "/operaciones.html" },
  }));
});
