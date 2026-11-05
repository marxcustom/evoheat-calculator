const CACHE = "evoheat-calc-v32";
// Core files are fetched network-first (bypassing the HTTP cache) so a new release always shows; images and icons are cache-first.
// On activate, every cache other than the current one is deleted (this clears all earlier versions, whatever their name).
const CORE = ["./", "index.html", "app.js", "app.css", "manifest.webmanifest"];
const STATIC = ["icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png", "img/fusion-i-pro.jpg", "img/force-ai.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE.concat(STATIC).map((u) =>
    fetch(new Request(u, { cache: "reload" })).then((r) => { if (!r.ok) throw new Error(u + " " + r.status); return c.put(u, r); })
  ))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  // After taking over, reload open windows once so pages still running an older release (whose code has no
  // update handler) switch to the new files straight away. It runs once per new service worker, so it cannot loop,
  // and it is not awaited: the reload's own requests must reach this worker after activation has finished.
  const ready = caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim());
  e.waitUntil(ready);
  ready.then(() => new Promise((r) => setTimeout(r, 50))).then(() => self.clients.matchAll({ type: "window" }))
    .then((cs) => Promise.all(cs.map((c) => c.navigate(c.url).catch(() => null))));
});
const scopePath = new URL(self.registration.scope).pathname;
const isCore = (req, url) => {
  if (req.mode === "navigate") return true;
  const rel = url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) : url.pathname;
  return rel === "" || rel === "index.html" || rel === "app.js" || rel === "app.css" || rel === "manifest.webmanifest" || rel === "sw.js";
};
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (isCore(req, url)) {
    // network first, no HTTP cache; keep the cache fresh for offline use
    e.respondWith(fetch(req.url, { cache: "no-store" }).then((r) => {
      if (r.ok) { const cp = r.clone(); const key = req.mode === "navigate" ? "index.html" : url.pathname.slice(scopePath.length) || "./"; caches.open(CACHE).then((c) => c.put(key, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; })));
});
