/* 道具まつりレジ：オフライン用（一度開けば、電波が無くても再読み込みで開ける） */
const CACHE = "dougu-register-v1";
const CORE = ["./", "./index.html"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function withTimeout(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]); }
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 文字（Googleフォント）：手元にあれば手元を使う
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; }).catch(() => hit)));
    return;
  }
  if (url.origin !== location.origin) return;
  // ページ本体：電波があれば最新版、無ければ（4秒で諦めて）手元の版
  e.respondWith(
    withTimeout(fetch(req), 4000).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
