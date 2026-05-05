const CACHE_NAME = "cbd-finanzas-v1";
const APP_SHELL = [
  "/finanzas.html",
  "/finanzas-manifest.json",
  "/css/styles.css",
  "/js/main.js",
];

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
  // Skip cross-origin requests and Firestore/Firebase network calls
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (
    e.request.url.includes("firestore") ||
    e.request.url.includes("firebase") ||
    e.request.url.includes("googleapis") ||
    e.request.url.includes("groq")
  )
    return;

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
