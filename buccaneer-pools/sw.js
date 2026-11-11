const CACHE = "evoheat-buccaneer-v3";
// This variant only deletes caches from its own namespace, so it never removes the root or Sapphire caches.
const PREFIX = "evoheat-buccaneer-";
// Core files are fetched network-first (bypassing the HTTP cache) so a new release always shows; images and icons are cache-first.
const CORE = ["./", "index.html", "app.js", "app.css", "manifest.webmanifest"];
const STATIC = ["icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png", "img/force-ai.png", "img/pools/amalfi.png", "img/pools/aquila.png", "img/pools/bellagio.png", "img/pools/bellino.png", "img/pools/caesar.png", "img/pools/capri.png", "img/pools/castello.png", "img/pools/catania.webp", "img/pools/cayman.png", "img/pools/cove.png", "img/pools/florentina.png", "img/pools/fontane-wader.png", "img/pools/fontane.png", "img/pools/malta.png", "img/pools/messina.png", "img/pools/napoleon.png", "img/pools/panama.png", "img/pools/portofino.png", "img/pools/positano-wader.png", "img/pools/positano.png", "img/pools/primo.png", "img/pools/revello.png", "img/pools/santa-fe.png", "img/pools/santorini.png", "img/pools/tasman.png", "img/pools/ultimo.png", "img/pools/verona.png"];
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
  return rel === "" || rel === "index.html" || rel === "app.js" || rel === "app.css" || rel === "manifest.webmanifest" || rel === "sw.js";
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
