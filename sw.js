/* Zindem — uygulama dosyaları için önbellek (1.10.3).
   Sadece uygulamanın kendi dosyaları saklanır (sayfa, stil, kod, besin ve hareket listeleri, simgeler, yazı tipi).
   Senin verilerin (Google tablosundan gelenler) burada SAKLANMAZ; o istekler bu dosyaya hiç uğramaz.
   - Sayfa (index.html): önce internet; internet yoksa saklanan kopya.
   - Sürüm numaralı dosyalar (stil.css?v=29 gibi): telefondan; yeni sürümde adres değiştiği için kendiliğinden yenilenir.
   - Diğer dosyalar: telefondaki kopya hemen açılır, arkadan güncellenir. */
var ONBELLEK = 'zindem-1';

self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (l) {
    return Promise.all(l.filter(function (k) { return k !== ONBELLEK; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function sakla(istek, cevap) {
  if (!cevap || !(cevap.ok || cevap.type === 'opaque')) return;
  var kopya = cevap.clone(), u = new URL(istek.url);
  caches.open(ONBELLEK).then(function (c) {
    // Aynı dosyanın eski sürümlerini sil (stil.css?v=28 → ?v=29)
    if (u.search) c.keys().then(function (l) { l.forEach(function (r) { var x = new URL(r.url); if (x.origin === u.origin && x.pathname === u.pathname && x.search !== u.search) c.delete(r); }); });
    c.put(istek, kopya);
  });
}

self.addEventListener('fetch', function (e) {
  var istek = e.request; if (istek.method !== 'GET') return;
  var u = new URL(istek.url);
  var yaziTipi = /^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== self.location.origin && !yaziTipi) return; // Google tablosu istekleri: dokunulmaz
  if (u.pathname.slice(-10) === '/sunucu.js') return; // tablo kodu: her zaman GitHub'dan

  if (istek.mode === 'navigate') {
    e.respondWith(fetch(istek, { cache: 'no-cache' }).then(function (c) { if (c.ok) sakla(new Request(u.origin + u.pathname), c); return c; })
      .catch(function () { return caches.match(u.origin + u.pathname).then(function (r) { return r || Response.error(); }); }));
    return;
  }
  if (u.search && !/^\?v=[\w.-]+$/.test(u.search)) return; // başka sorgulu istekler (veri vb.): dokunulmaz
  if (u.search || yaziTipi) { // sürüm numaralı dosya ya da yazı tipi: telefondan
    e.respondWith(caches.match(istek).then(function (r) { return r || fetch(istek).then(function (c) { sakla(istek, c); return c; }); }));
    return;
  }
  e.respondWith(caches.match(istek).then(function (r) { // diğerleri: hemen telefondan, arkadan güncelle
    var ag = fetch(istek).then(function (c) { sakla(istek, c); return c; }).catch(function () { return r || Response.error(); });
    return r || ag;
  }));
});
