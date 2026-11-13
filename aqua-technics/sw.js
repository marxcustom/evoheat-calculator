const CACHE = "evoheat-aqua-technics-v7";
// This variant only deletes caches from its own namespace, so it never removes the root, Sapphire, or Buccaneer caches.
const PREFIX = "evoheat-aqua-technics-";
const CORE = ["./", "index.html", "app.js", "gate.js", "app.css", "manifest.webmanifest"];
const STATIC = ["icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png", "img/force-ai.png", "img/pools/allure.png", "img/pools/alto.png", "img/pools/aquarius.png", "img/pools/at-655.png", "img/pools/at-770.png", "img/pools/athena.png", "img/pools/avellino.png", "img/pools/caprice.png", "img/pools/capricorn.png", "img/pools/elysian.png", "img/pools/hamilton.png", "img/pools/harmony.png", "img/pools/istana.png", "img/pools/latina.png", "img/pools/milan.png", "img/pools/newport.png", "img/pools/omega.png", "img/pools/palazzo.png", "img/pools/pantheon.png", "img/pools/paradiso.png", "img/pools/rio.png", "img/pools/saint-azur.webp", "img/pools/saint-louis.png", "img/pools/saint-luxe.webp", "img/pools/saint-remy.png", "img/pools/sentosa.png", "img/pools/serenity.png", "img/pools/siena.png", "img/pools/terazza.png", "img/pools/torino.png", "img/pools/valentina.png"];
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
