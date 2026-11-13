const CACHE = "evoheat-active-i-pro-v38y";
// This variant only deletes caches from its own namespace, so it never removes the root app cache.
const PREFIX = "evoheat-active-i-pro-";
// Core files are fetched network-first (bypassing the HTTP cache) so a new release always shows; images and icons are cache-first.
const CORE = ["./", "index.html", "app.js", "gate.js", "app.css", "manifest.webmanifest"];
const STATIC = ["icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png", "img/force-ai.png", "img/pools/terrace-3-0.png", "img/pools/infinity-3-0.png", "img/pools/infinity-4-0.png", "img/pools/princeton.png", "img/pools/sovereign.png", "img/pools/windsor.png", "img/pools/empire.png", "img/pools/maxi-swim.png", "img/pools/chateau.png", "img/pools/provincial.png", "img/pools/oxford.png", "img/pools/imperial.png", "img/pools/cambridge.png", "img/pools/regency.png", "img/pools/sheffield.webp", "img/pools/conquest.png", "img/pools/somerset.webp", "img/pools/grandeur.png", "img/pools/bermuda.png", "img/pools/duchess.png", "img/pools/dynasty.png", "img/pools/westminster.png", "img/pools/regal.png", "img/pools/flamingo.png", "img/pools/aspen.png", "img/pools/duke.png", "img/pools/royale.png", "img/pools/kensington.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE.concat(STATIC).map((u) =>
    fetch(new Request(u, { cache: "reload" })).then((r) => { if (!r.ok) throw new Error(u + " " + r.status); return c.put(u, r); })
  ))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  const ready = caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim());
  e.waitUntil(ready);
  ready.then(() => new Promise((r) => setTimeout(r, 50))).then(() => self.clients.matchAll({ type: "window" }))
    .then((cs) => Promise.all(cs.map((c) => c.navigate(c.url).catch(() => null))));
});
const scopePath = new URL(self.registration.scope).pathname;
const isCore = (req, url) => {
  if (req.mode === "navigate") return true;
  const rel = url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) : url.pathname;
  return rel === "" || rel === "index.html" || rel === "app.js" || rel === "gate.js" || rel === "app.css" || rel === "manifest.webmanifest" || rel === "sw.js";
};
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (isCore(req, url)) {
    e.respondWith(fetch(req.url, { cache: "no-store" }).then((r) => {
      if (r.ok) { const cp = r.clone(); const key = req.mode === "navigate" ? "index.html" : url.pathname.slice(scopePath.length) || "./"; caches.open(CACHE).then((c) => c.put(key, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; })));
});
