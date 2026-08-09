const CACHE = "session-v9";
const ASSETS = ["./", "./index.html", "./app.js", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

/* Network-first for our own app shell, cache as offline fallback.
   The old cache-first handler meant a committed app.js could never reach the
   phone until CACHE was renamed. This keeps the gym-offline behaviour but
   always takes fresh code when there's signal. */
self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  if (url.includes("raw.githubusercontent.com") || url.includes("api.github.com")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.ok && e.request.method === "GET") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || Response.error()))
  );
});
