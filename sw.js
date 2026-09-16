/* GramSaarthi service worker — app-shell cache for low connectivity */
const CACHE = "gramsaarthi-v1";
const SHELL = [
  "./", "./index.html", "./manifest.json", "./css/styles.css",
  "./js/app.js", "./js/screens.js", "./js/engine.js", "./js/finance.js",
  "./js/ai.js", "./js/data.js", "./js/store.js", "./js/ui.js", "./js/adapters.js",
  "./icons/icon.svg"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
