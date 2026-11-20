/* Zindem – İlerleme ekranı (1.10)
 * uygulama.js bu dosyayı window.ZI(Z) ile çağırır; Z ortak yardımcıları verir.
 * Veri: sunucudaki ilerleme_oku (gün başına toplamlar, ölçümler, antrenman günleri ve setler, ağrı notları).
 * Son 35 gün bellekteki güncel kayıtlardan (gönderilmemiş olanlar dahil) hesaplanır.
 * Kodda kişisel bilgi yoktur. Uygulama teşhis koymaz; sadece gösterir.
 */
window.ZI = function (Z) {
  'use strict';
  var S = Z.S, $ = Z.$, esc = Z.esc, ik = Z.ik, sayi = Z.sayi, bicim = Z.bicim, AYLAR = Z.AYLAR;
  var AYK = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var GK = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  var TURLER = [['hafta', 'Hafta'], ['ay', 'Ay'], ['3ay', '3 Ay'], ['yil', 'Yıl']];
  // Ölçüler: kilo ve bel her zaman; diğerleri kullanıcı eklerse (ihtiyaç olunca sorulur)
  var OLCU = { kilo: ['Kilo', 'kg'], bel: ['Bel', 'cm'], boyun: ['Boyun', 'cm'], gogus: ['Göğüs', 'cm'], pazu: ['Pazu', 'cm'], kalca: ['Kalça', 'cm'], uyluk: ['Uyluk', 'cm'], baldir: ['Baldır', 'cm'] };
  var EK_OLCU = ['boyun', 'gogus', 'pazu', 'kalca', 'uyluk', 'baldir'];
  var KARTLAR = [['kilo', 'weight', 'Kilo ve ölçüler'], ['beslenme', 'flame', 'Kalori ve protein'], ['su', 'droplet', 'Su'], ['adim', 'footsteps', 'Adım'],
    ['uyku', 'moon', 'Uyku'], ['antrenman', 'barbell', 'Antrenman'], ['agri', 'bandage', 'Ağrı ve sağlık notları']];
  var ANT_D = { tamam: ['circle-check', 'Tamamlandı'], kisa: ['clock', 'Kısa yapıldı'], yarim: ['circle-half-2', 'Yarım kaldı'], kaydirildi: ['arrow-forward-up', 'Yarına kaydırıldı'],
    yapilmadi: ['circle-x', 'Yapılmadı'], plan: ['circle-dashed', 'Planlı'] };
  var UYKU = [['7+', '7 saat ve üstü', 'u3'], ['6-7', '6–7 saat', 'u2'], ['<6', '6 saatten az', 'u1']];
  var I = { tur: 'hafta', ref: '', veri: null, yukleniyor: false, hata: '', gecildi: false };

  /* ---------- Yardımcılar ---------- */
  function gk(g, n) { return Z.gunKaydir(g, n); }
  function hg(g) { var p = g.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]).getDay(); return d === 0 ? 7 : d; }
  function tk(g) { var p = g.split('-'); return (+p[2]) + ' ' + AYLAR[+p[1] - 1]; }
  function tkk(g) { var p = g.split('-'); return (+p[2]) + ' ' + AYK[+p[1] - 1]; }
  function f(n, o) { return isFinite(n) && n !== null ? Number(n).toLocaleString('tr-TR', { minimumFractionDigits: o || 0, maximumFractionDigits: o || 0 }) : '—'; }
  function isaret(n, o) { return (n > 0 ? '+' : n < 0 ? '−' : '') + f(Math.abs(n), o); }
  function ort(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : NaN; }
  function bugun() { return S.bugun; }
  function ilkHarfBuyuk(s) { s = String(s || ''); return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1); }
  function gizli() { return String(Z.ayar('il_gizli', '')).split(',').filter(Boolean); }
  function ekOlculer() { return String(Z.ayar('olcu_ek', '')).split(',').filter(function (x) { return OLCU[x]; }); }

  /* ---------- Veri ---------- */
  function yukle(zorla) {
    if (I.yukleniyor || (I.veri && !zorla)) return;
    I.yukleniyor = true; I.hata = '';
    fetch(Z.istekAdresi({ ilerleme: '1' })).then(function (r) { return r.json(); }).then(function (c) {
      I.yukleniyor = false;
      if (!c.ok) { I.hata = c.hata || 'Sunucu hatası'; } else {
        I.veri = { g: c.g || {}, o: (c.o || []).map(function (x) { return { g: x[0], tur: x[1], v: +x[2] }; }), a: {}, k: [], n: c.n || [] };
        (c.a || []).forEach(function (x) { I.veri.a[x[0]] = { ant: x[1], ad: x[2], durum: x[3], kisa: x[4], yapilan: x[5], hedef: x[6] }; });
        I.veri.k = (c.k || []).map(function (x) { return { g: x[0], ant: x[1], h: x[2], ad: x[3], set: x[4], tekrar: x[5] }; });
        (I.bekleyen || []).forEach(uygula); I.bekleyen = [];
      }
      if (S.ekran === 'ilerleme') Z.ciz();
    }).catch(function () { I.yukleniyor = false; I.hata = 'internet'; if (S.ekran === 'ilerleme') Z.ciz(); });
  }
  // Gönderilmemiş ölçüm işlemleri de görünsün
  function uygula(is) {
    if (!I.veri) { if (/^olcum_/.test(is.tur)) (I.bekleyen = I.bekleyen || []).push(is); return; }
    var v = is.veri || {};
    if (is.tur === 'olcum_yaz') { I.veri.o = I.veri.o.filter(function (x) { return !(x.g === v.tarih && x.tur === v.tur); }); I.veri.o.push({ g: v.tarih, tur: v.tur, v: +v.deger }); }
    if (is.tur === 'olcum_sil') I.veri.o = I.veri.o.filter(function (x) { return !(x.g === v.tarih && x.tur === v.tur); });
  }
  // Gün değerleri: bellekteki son 35 gün güncel olanı, eskisi sunucunun toplamı
  function gunDeger(g) {
    var m = S.gv && S.gv[g];
    if (m && S.aralikBas && g >= S.aralikBas) {
      var kc = 0, p = 0; (m.kayitlar || []).forEach(function (k) { kc += sayi(k['kcal']) || 0; p += sayi(k['Protein']) || 0; });
      var gl = m.gunluk || {}, ad = sayi(gl.adim);
      if (!m.kayitlar.length && !gl.su && !isFinite(ad) && !gl.uyku) return null;
      return { kcal: m.kayitlar.length ? kc : null, p: m.kayitlar.length ? p : null, su: gl.su || null, adim: isFinite(ad) ? ad : null, uyku: gl.uyku || '' };
    }
    var r = I.veri && I.veri.g[g]; if (!r) return null;
    return { kcal: r[0] ? r[0] : null, p: r[0] ? r[1] : null, su: r[2] || null, adim: r[3] === '' || r[3] == null ? null : +r[3], uyku: r[4] || '' };
  }
  function olcumler(tur) { return (I.veri ? I.veri.o : []).filter(function (x) { return x.tur === tur; }).sort(function (a, b) { return a.g < b.g ? -1 : a.g > b.g ? 1 : 0; }); }
  // Eğilim: üstel ortalama; her yeni ölçüm %25 ağırlıkla katılır (tek tartının iniş çıkışı gidişatı bozmaz)
  function egilim(l) { var e = null; return l.map(function (o) { e = e == null ? o.v : e + 0.25 * (o.v - e); return { g: o.g, v: Math.round(e * 10) / 10 }; }); }
  // Çevre ölçüleri seyrek alınır: eğilim yerine ölçümün kendisi (çizgi ölçümleri birleştirir)
  function seri(tur, l) { return tur === 'kilo' ? egilim(l) : l.map(function (o) { return { g: o.g, v: o.v }; }); }
  function hedefKilo(g) { return Z.hedef('kilo', g || bugun()); }

  /* ---------- Dönem ---------- */
  function donemGunleri(tur, ref) {
    ref = ref || bugun(); var l = [], i, p;
    if (tur === 'hafta') { var bas = gk(ref, 1 - hg(ref)); for (i = 0; i < 7; i++) l.push(gk(bas, i)); }
    else if (tur === 'ay') { p = ref.split('-'); var son = new Date(+p[0], +p[1], 0).getDate(); for (i = 1; i <= son; i++) l.push(p[0] + '-' + p[1] + '-' + (i < 10 ? '0' : '') + i); }
    else if (tur === '3ay') { var g = gk(ref, -83); g = gk(g, 1 - hg(g)); var bit = gk(ref, 7 - hg(ref)); while (g <= bit) { l.push(g); g = gk(g, 1); } }
    else { var y = ref.slice(0, 4); for (var m = 1; m <= 12; m++) { var s2 = new Date(+y, m, 0).getDate(); for (i = 1; i <= s2; i++) l.push(y + '-' + (m < 10 ? '0' : '') + m + '-' + (i < 10 ? '0' : '') + i); } }
    return l;
  }
  function donemAdi(tur, ref) {
    ref = ref || bugun(); var l = donemGunleri(tur, ref), a = l[0], b = l[l.length - 1];
    if (tur === 'hafta') return a.slice(5, 7) === b.slice(5, 7) ? (+a.slice(8)) + ' – ' + tk(b) : tk(a) + ' – ' + tk(b);
    if (tur === 'ay') return AYLAR[+ref.slice(5, 7) - 1] + ' ' + ref.slice(0, 4);
    if (tur === '3ay') return AYK[+a.slice(5, 7) - 1] + ' – ' + AYK[+b.slice(5, 7) - 1] + ' ' + b.slice(0, 4);
    return ref.slice(0, 4);
  }
  function donemKaydir(tur, ref, yon) {
    ref = ref || bugun();
    if (tur === 'hafta') return gk(ref, 7 * yon);
    if (tur === '3ay') return gk(ref, 84 * yon);
    var p = ref.split('-'), d = tur === 'ay' ? new Date(+p[0], +p[1] - 1 + yon, 1) : new Date(+p[0] + yon, 0, 1);
    var s = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-01';
    return s > bugun() ? bugun() : s;
  }
  function sonrakiVar(tur, ref) { var l = donemGunleri(tur, ref); return l[l.length - 1] < bugun(); }
  function dilimler(tur, ref) {
    var l = donemGunleri(tur, ref), d = [], i;
    if (tur === 'hafta' || tur === 'ay') return l.map(function (g, j) { return { ad: tur === 'hafta' ? GK[j] : ((+g.slice(8)) % 5 === 1 || j === l.length - 1 ? String(+g.slice(8)) : ''), gunler: [g], uzun: tk(g) }; });
    if (tur === '3ay') { for (i = 0; i < l.length; i += 7) { var w = l.slice(i, i + 7); d.push({ ad: i % 28 === 0 ? tkk(w[0]) : '', gunler: w, uzun: tk(w[0]) + ' haftası' }); } return d; }
    for (i = 0; i < 12; i++) d.push({ ad: AYK[i], gunler: l.filter(function (g) { return +g.slice(5, 7) === i + 1; }), uzun: AYLAR[i] });
    return d;
  }
  function deger(dl, k) { var v = []; dl.gunler.forEach(function (g) { if (g > bugun()) return; var x = gunDeger(g); if (x && x[k] != null) v.push(x[k]); }); return v.length ? ort(v) : null; }
  var HEDEF_TUR = { kcal: 'kalori', p: 'protein', su: 'su_ml', adim: 'adim' };
  function ozet(tur, k, ref) {
    var v = [], hedefte = 0, hedefli = 0;
    donemGunleri(tur, ref).forEach(function (g) {
      if (g > bugun()) return; var x = gunDeger(g); if (!x || x[k] == null) return;
      v.push(x[k]); var h = Z.hedef(HEDEF_TUR[k], g);
      if (h != null) { hedefli++; if (k === 'kcal' ? x[k] <= h : x[k] >= h) hedefte++; }
    });
    return { ort: ort(v), gun: v.length, hedefte: hedefte, hedefli: hedefli };
  }

  /* ---------- Grafikler (SVG; genişlik çizildikten sonra ölçülür) ---------- */
  var G = {}, gs = 0;
  function yer(fn, yuk, etiket) { var id = 'ig' + (++gs); G[id] = fn; return '<div class="il-grafik" data-g="' + id + '" style="height:' + yuk + 'px" role="img" aria-label="' + esc(etiket) + '"></div>'; }
  function grafikleriCiz(kok) { (kok || document).querySelectorAll('[data-g]').forEach(function (el) { var fn = G[el.getAttribute('data-g')]; if (fn) el.innerHTML = fn(el.clientWidth, el.clientHeight); }); }
  function temiz(enb, adet) { var ham = enb / adet || 1, us = Math.pow(10, Math.floor(Math.log10(ham))); return [1, 2, 2.5, 5, 10].filter(function (x) { return x * us >= ham; })[0] * us; }
  function birim(k) { return { kcal: 'kcal', p: 'g', su: 'ml', adim: 'adım' }[k]; }
  function eksenYazi(t, k) { return k === 'su' ? f(t / 1000, t % 1000 ? 1 : 0) + ' L' : f(t); }
  // Çubuk grafik: sıfırdan başlar; hedef kesik çizgi; kalori sınırı aşan / diğerleri hedefe ulaşan çubuk koyu renkte
  function cubuk(dl, k, o) {
    o = o || {};
    return function (W, H) {
      var alt = 20, ust = o.secili != null ? 34 : 8, sag = k === 'adim' ? 46 : k === 'kcal' ? 42 : 36, gW = W - sag, gH = H - alt - ust;
      var vals = dl.map(function (d) { return deger(d, k); }), son = dl[dl.length - 1].gunler, hd = Z.hedef(HEDEF_TUR[k], son[son.length - 1] > bugun() ? bugun() : son[son.length - 1]);
      var enb = Math.max.apply(null, [hd ? hd * 1.15 : 1].concat(vals.filter(function (v) { return v != null; })));
      var adim = temiz(enb, 3), tavan = Math.ceil(enb / adim) * adim, aral = gW / dl.length, bw = Math.min(24, aral * 0.62), r;
      function y(v) { return ust + gH - v / tavan * gH; }
      var s = '<svg width="' + W + '" height="' + H + '" aria-hidden="true">', t;
      for (t = 0; t <= tavan + 1e-9; t += adim) s += '<line class="il-izgara" x1="0" x2="' + gW + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="il-eksen" x="' + (W - 2) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + eksenYazi(t, k) + '</text>';
      dl.forEach(function (d, i) {
        var v = vals[i], x = i * aral + (aral - bw) / 2;
        if (v != null) {
          var gh = d.gunler.filter(function (g) { return g <= bugun(); }), hh = Z.hedef(HEDEF_TUR[k], gh[gh.length - 1] || bugun());
          var as = hh != null && (k === 'kcal' ? v > hh : v >= hh), yy = Math.min(y(v), ust + gH - 2); r = Math.min(4, bw / 2);
          s += '<path class="il-cubuk ' + k + (as ? (k === 'kcal' ? ' asti' : ' tamam') : '') + (o.secili != null && o.secili !== i ? ' soluk' : '') + '" d="M' + x + ' ' + (ust + gH) + 'V' + (yy + r) + 'q0 -' + r + ' ' + r + ' -' + r + 'h' + (bw - 2 * r) + 'q' + r + ' 0 ' + r + ' ' + r + 'V' + (ust + gH) + 'z"/>';
          s += '<rect class="il-dokun" data-dilim="' + i + '" x="' + (i * aral) + '" y="0" width="' + aral + '" height="' + (H - alt) + '"/>';
        } else if (d.gunler[0] <= bugun() && dl.length <= 31) s += '<circle class="il-bos-nokta" cx="' + (x + bw / 2) + '" cy="' + (ust + gH - 3) + '" r="2"/>';
        if (d.ad) s += '<text class="il-eksen' + (d.gunler.indexOf(bugun()) >= 0 && dl.length <= 7 ? ' bugun' : '') + '" x="' + (x + bw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + d.ad + '</text>';
      });
      if (hd != null) s += '<line class="il-hedef" x1="0" x2="' + gW + '" y1="' + y(hd) + '" y2="' + y(hd) + '"/>';
      if (o.secili != null && vals[o.secili] != null) {
        var i2 = o.secili, v2 = vals[i2], cx = i2 * aral + aral / 2, metin = dl[i2].uzun + ' · ' + (k === 'su' ? f(v2 / 1000, 1) + ' L' : f(v2) + ' ' + birim(k)), w = metin.length * 6.6 + 16;
        var bx = Math.max(0, Math.min(gW - w, cx - w / 2));
        s += '<line class="il-imlec" x1="' + cx + '" x2="' + cx + '" y1="26" y2="' + y(v2) + '"/><rect class="il-ipucu" x="' + bx + '" y="2" width="' + w + '" height="24" rx="8"/><text class="il-ipucu-yazi" x="' + (bx + w / 2) + '" y="18" text-anchor="middle">' + esc(metin) + '</text>';
      }
      return s + '</svg>';
    };
  }
  // Ölçüm çizgisi: ölçümler soluk nokta, eğilim 2,5 px çizgi, hedef kesik çizgi
  function cizgi(tur, gunler, o) {
    o = o || {};
    return function (W, H) {
      var l = olcumler(tur), e = seri(tur, l), a = gunler[0], b = gunler[gunler.length - 1];
      var ic = l.filter(function (x) { return x.g >= a && x.g <= b; }), ice = e.filter(function (x) { return x.g >= a && x.g <= b; });
      if (!ic.length) return '<p class="il-grafik-bos">Bu dönemde ölçüm yok</p>';
      var hedef = tur === 'kilo' ? hedefKilo(b > bugun() ? bugun() : b) : null;
      var vs = ic.map(function (x) { return x.v; }), enk = Math.min.apply(null, vs), enb = Math.max.apply(null, vs);
      if (hedef != null && Math.abs(hedef - enk) < (enb - enk + 2) * 3) { enk = Math.min(enk, hedef); enb = Math.max(enb, hedef); } else hedef = null;
      var adim = temiz((enb - enk) || 1, 3), taban = Math.floor(enk / adim) * adim, tavan = Math.ceil(enb / adim) * adim; if (tavan === taban) tavan += adim;
      var alt = 20, ust = 10, sag = 36, gW = W - sag, gH = H - alt - ust, n = gunler.length - 1 || 1;
      function x(g) { return gunler.indexOf(g) / n * gW; }
      function y(v) { return ust + gH - (v - taban) / (tavan - taban) * gH; }
      var s = '<svg width="' + W + '" height="' + H + '" aria-hidden="true">', t;
      for (t = taban; t <= tavan + 1e-9; t += adim) s += '<line class="il-izgara" x1="0" x2="' + gW + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="il-eksen" x="' + (W - 2) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + f(t, adim < 1 ? 1 : 0) + '</text>';
      if (hedef != null) s += '<line class="il-hedef" x1="0" x2="' + gW + '" y1="' + y(hedef) + '" y2="' + y(hedef) + '"/><text class="il-hedef-yazi" x="4" y="' + (y(hedef) - 5) + '">Hedef ' + f(hedef, hedef % 1 ? 1 : 0) + '</text>';
      ic.forEach(function (p) { s += '<circle class="il-olcum" cx="' + x(p.g) + '" cy="' + y(p.v) + '" r="' + (gunler.length > 120 ? 3 : 4) + '"/>'; });
      if (ice.length > 1) s += '<path class="il-egilim" d="' + ice.map(function (p, i) { return (i ? 'L' : 'M') + x(p.g).toFixed(1) + ' ' + y(p.v).toFixed(1); }).join('') + '"/>';
      var sn = ice[ice.length - 1]; s += '<circle class="il-son" cx="' + x(sn.g) + '" cy="' + y(sn.v) + '" r="5"/>';
      var bb = b > bugun() ? bugun() : b;
      s += '<text class="il-eksen" x="0" y="' + (H - 4) + '">' + (gunler.length > 200 ? AYK[+a.slice(5, 7) - 1] : tkk(a)) + '</text><text class="il-eksen" x="' + x(bb) + '" y="' + (H - 4) + '" text-anchor="end">' + (gunler.length > 200 ? AYK[+bb.slice(5, 7) - 1] : tkk(bb)) + '</text>';
      return s + '</svg>';
    };
  }

  /* ---------- Antrenman durumu ---------- */
  function antDurum(g) {
    var A = Z.ANT && Z.ANT.ilerleme ? Z.ANT.ilerleme : null, r = I.veri && I.veri.a[g], setVar = I.veri && I.veri.k.some(function (k) { return k.g === g; });
    if (A && A.gunSatiri) { var yerel = A.gunSatiri(g); if (yerel) r = { ant: yerel['Antrenman ID'], durum: yerel['Durum'], kisa: String(yerel['Kısa']) === '1' ? 1 : 0 }; }
    if (A && A.setVar) setVar = setVar || A.setVar(g);
    if (r && r.durum) {
      if (r.durum === 'tamam') return r.kisa ? 'kisa' : 'tamam';
      if (r.durum === 'yarım') return 'yarim';
      if (r.durum === 'kaydırıldı') return 'kaydirildi';
      if (r.durum === 'yapılmadı') return 'yapilmadi';
      if (r.durum === 'plan') return g < bugun() ? (setVar ? 'yarim' : 'yapilmadi') : 'plan';
    }
    var plan = A && A.plan ? A.plan(g) : null;
    if (plan) return g < bugun() ? (setVar ? 'yarim' : 'yapilmadi') : 'plan';
    return setVar ? 'tamam' : '';
  }
  function yapildiMi(d) { return d === 'tamam' || d === 'kisa' || d === 'yarim'; }

  /* ---------- Çerçeve ---------- */
  function ust() {
    var t = I.tur, ref = I.ref || bugun();
    return '<div class="m-ust"><header class="ekran-ust"><h1>İlerleme</h1></header>' +
      '<div class="grup-cipler m-sekmeler" role="tablist" aria-label="Dönem">' + TURLER.map(function (x) {
        return '<button class="sekme-ciz' + (x[0] === t ? ' secili' : '') + '" role="tab" aria-selected="' + (x[0] === t) + '" data-i-tur="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="il-gezgin"><button class="tn-ok" data-i-git="-1" aria-label="Önceki dönem">' + ik('chevron-left') + '</button><b>' + donemAdi(t, ref) + '</b>' +
      '<button class="tn-ok" data-i-git="1" aria-label="Sonraki dönem"' + (sonrakiVar(t, ref) ? '' : ' disabled') + '>' + ik('chevron-right') + '</button></div></div>';
  }
  function kartBas(ikon, tur, baslik, sag) {
    return '<div class="il-kart-bas"><span class="il-lk il-' + tur + '" aria-hidden="true">' + ik(ikon, ikon === 'barbell' ? 'capraz' : '') + '</span><h2>' + baslik + '</h2>' +
      (sag === undefined ? '<span class="il-ok" aria-hidden="true">' + ik('chevron-right') + '</span>' : sag) + '</div>';
  }
  function deger2(v, b, alt) { return '<p class="il-deger"><b>' + v + '</b> <span>' + b + '</span>' + (alt ? '<small>' + alt + '</small>' : '') + '</p>'; }
  function dipnot(yazi) { return '<p class="il-dip">' + ik('target') + '<span>' + yazi + '</span></p>'; }
  function hedefYazi(o) { return o.hedefli ? dipnot('Hedefte <b>' + o.hedefte + ' / ' + o.hedefli + '</b> gün') : ''; }

  /* ---------- Kartlar ---------- */
  function kiloKarti(tur, ref) {
    var l = olcumler('kilo');
    if (!l.length) return '<section class="kart il-kart" aria-label="Kilo ve ölçüler">' + kartBas('weight', 'kilo', 'Kilo ve ölçüler', '') +
      '<p class="il-bos-satir">Henüz ölçüm yok</p><button class="ikinci-dugme" data-i-olcum>' + ik('plus') + 'İlk ölçümünü gir</button></section>';
    var gl = donemGunleri(tur, ref), sonGun = gl[gl.length - 1] < bugun() ? gl[gl.length - 1] : bugun(), e = egilim(l).filter(function (x) { return x.g <= sonGun; });
    if (!e.length) e = [egilim(l)[0]];
    var son = e[e.length - 1], once = e.filter(function (x) { return x.g < gl[0]; }).pop() || e[0], hk = hedefKilo(sonGun);
    var grafikGun = [], i;
    if (tur === 'hafta') for (i = 29; i >= 0; i--) grafikGun.push(gk(sonGun, -i)); else grafikGun = gl.filter(function (g) { return g <= bugun(); });
    var satirlar = ['bel'].concat(ekOlculer()).map(function (t) {
      var ol = olcumler(t).filter(function (x) { return x.g <= sonGun; }); if (!ol.length) return '';
      var s = ol[ol.length - 1], b = olcumler(t)[0];
      return '<div class="il-satir"><span>' + ik(t === 'bel' ? 'ruler-measure' : 'ruler-measure') + OLCU[t][0] + '</span><b>' + f(s.v, 1) + ' cm</b><small>' + (ol.length > 1 ? 'başlangıçtan ' + isaret(s.v - b.v, 1) : tk(s.g)) + '</small></div>';
    }).join('');
    return '<section class="kart il-kart" aria-label="Kilo ve ölçüler"><button class="il-kart-dokun" data-i-detay="kilo" aria-label="Kilo ve ölçüler ayrıntısı"></button>' +
      kartBas('weight', 'kilo', 'Kilo ve ölçüler', '<button class="il-ekle" data-i-olcum aria-label="Ölçüm ekle">' + ik('plus') + 'Ölçüm</button>') +
      '<div class="il-iki"><div>' + deger2(f(son.v, 1), 'kg', l.length < 2 ? tk(l[0].g) + ' · grafik ikinci ölçümle başlar' : (e.length > 1 ? 'eğilim · ' : '') + 'bu dönem ' + isaret(son.v - once.v, 1) + ' kg') + '</div>' +
      (hk != null ? '<div class="il-hedef-kutu"><small>Hedef</small><b>' + f(hk, hk % 1 ? 1 : 0) + ' kg</b><small>kalan ' + f(Math.abs(son.v - hk), 1) + '</small></div>' : '') + '</div>' +
      (l.length > 1 ? yer(cizgi('kilo', grafikGun), 128, 'Kilo grafiği. Son değer ' + f(son.v, 1) + ' kilogram') +
      (tur === 'hafta' ? '<p class="il-grafik-not">Grafikte son 30 gün</p>' : '') : '') +
      '<div class="il-satirlar">' + satirlar + (l.length > 1 ? '<div class="il-satir"><span>' + ik('flag') + 'Başlangıç</span><b>' + f(l[0].v, 1) + ' kg</b><small>' + tk(l[0].g) + '</small></div>' : '') + '</div></section>';
  }
  function bosKart(ikon, tur, baslik, yazi) { return '<section class="kart il-kart il-kart-bos">' + kartBas(ikon, tur, baslik, '') + '<p class="il-bos-satir">' + yazi + '</p></section>'; }
  function beslenmeKarti(tur, ref) {
    var k = ozet(tur, 'kcal', ref), p = ozet(tur, 'p', ref);
    if (!k.gun) return bosKart('flame', 'kalori', 'Kalori ve protein', 'Öğün ekledikçe görünür');
    var dl = dilimler(tur, ref), hk = Z.hedef('kalori', bugun()), hp = Z.hedef('protein', bugun());
    return '<section class="kart il-kart" aria-label="Kalori ve protein"><button class="il-kart-dokun" data-i-detay="beslenme" aria-label="Kalori ve protein ayrıntısı"></button>' + kartBas('flame', 'kalori', 'Kalori ve protein') +
      '<div class="il-iki"><div>' + deger2(f(k.ort), 'kcal', 'ortalama' + (hk != null ? ' · sınır ' + f(hk) : '')) + '</div><div>' + deger2(f(p.ort), 'g protein', 'ortalama' + (hp != null ? ' · hedef ' + f(hp) : '')) + '</div></div>' +
      '<div class="il-etiket-satir"><span><i class="il-anahtar kcal"></i>Kalori</span></div>' + yer(cubuk(dl, 'kcal'), 112, 'Günlük kalori grafiği, ortalama ' + f(k.ort) + ' kilokalori') +
      '<div class="il-etiket-satir"><span><i class="il-anahtar p"></i>Protein</span></div>' + yer(cubuk(dl, 'p'), 112, 'Günlük protein grafiği, ortalama ' + f(p.ort) + ' gram') +
      '<div class="il-dipler">' + (k.hedefli ? dipnot('Kalori sınırında <b>' + k.hedefte + ' / ' + k.hedefli + '</b> gün') : '') + (p.hedefli ? dipnot('Protein hedefinde <b>' + p.hedefte + ' / ' + p.hedefli + '</b> gün') : '') + '</div></section>';
  }
  function tekKart(k, ikon, tur, baslik, dtur, ref) {
    var o = ozet(dtur, k, ref);
    if (!o.gun) return bosKart(ikon, tur, baslik, k === 'su' ? 'Su ekledikçe görünür' : 'Adım girdikçe görünür');
    var h = Z.hedef(HEDEF_TUR[k], bugun());
    return '<section class="kart il-kart" aria-label="' + baslik + '"><button class="il-kart-dokun" data-i-detay="' + k + '" aria-label="' + baslik + ' ayrıntısı"></button>' + kartBas(ikon, tur, baslik) +
      deger2(k === 'su' ? f(o.ort / 1000, 1) : f(o.ort), k === 'su' ? 'L' : 'adım', 'günlük ortalama' + (h != null ? ' · hedef ' + (k === 'su' ? f(h / 1000, 1) + ' L' : f(h)) : '')) +
      yer(cubuk(dilimler(dtur, ref), k), 104, baslik + ' grafiği') + '<div class="il-dipler">' + hedefYazi(o) + '</div></section>';
  }
  function uykuSay(tur, ref) {
    var say = { '7+': 0, '6-7': 0, '<6': 0 }, n = 0;
    donemGunleri(tur, ref).forEach(function (g) { var x = g <= bugun() && gunDeger(g); if (x && say[x.uyku] !== undefined) { say[x.uyku]++; n++; } });
    return { say: say, n: n };
  }
  function uykuKarti(tur, ref) {
    var u = uykuSay(tur, ref);
    if (!u.n) return bosKart('moon', 'uyku', 'Uyku', 'Sabah uyku sorusunu cevapladıkça görünür');
    return '<section class="kart il-kart" aria-label="Uyku">' + kartBas('moon', 'uyku', 'Uyku', '') +
      deger2(f(u.say['7+']), '/ ' + u.n + ' gece', '7 saat ve üstü uyudun') +
      '<div class="il-parcali" role="img" aria-label="' + UYKU.map(function (p) { return p[1] + ' ' + u.say[p[0]] + ' gece'; }).join(', ') + '">' +
      UYKU.map(function (p) { return u.say[p[0]] ? '<span class="' + p[2] + '" style="flex:' + u.say[p[0]] + '"></span>' : ''; }).join('') + '</div>' +
      '<ul class="il-lejant">' + UYKU.map(function (p) { return '<li><i class="' + p[2] + '"></i>' + p[1] + '<b>' + u.say[p[0]] + '</b></li>'; }).join('') + '</ul></section>';
  }
  function antOzet(gl) {
    var d = {}, planli = 0, yap = 0, set = 0;
    gl.forEach(function (g) { var x = antDurum(g); d[g] = x; if (x && x !== 'plan') { planli++; if (yapildiMi(x)) yap++; } });
    if (I.veri) I.veri.k.forEach(function (k) { if (gl.indexOf(k.g) >= 0) set++; });
    return { d: d, planli: planli, yap: yap, set: set };
  }
  function lejant(liste, kare) {
    return '<ul class="il-lejant">' + liste.map(function (d) { return '<li>' + (kare ? '<i class="il-kare-l ' + d + '"></i>' : '<span class="il-ag kucuk ' + d + '">' + ik(ANT_D[d][0]) + '</span>') + ANT_D[d][1] + '</li>'; }).join('') + '</ul>';
  }
  function antKarti(tur, ref) {
    var gl = donemGunleri(tur, ref), o = antOzet(gl), ic = '', kullanilan = {};
    Object.keys(o.d).forEach(function (g) { if (o.d[g]) kullanilan[o.d[g]] = 1; });
    if (!o.planli && !kullanilan.plan) return bosKart('barbell', 'antrenman', 'Antrenman', 'Antrenman yaptıkça görünür');
    if (tur === 'hafta') ic = '<ol class="il-hafta-gun">' + gl.map(function (g, i) { var d = o.d[g]; return '<li><small>' + GK[i] + '</small><span class="il-ag ' + (d || 'yok') + '" role="img" aria-label="' + GK[i] + ': ' + (d ? ANT_D[d][1] : 'Dinlenme') + '">' + (d ? ik(ANT_D[d][0]) : '') + '</span></li>'; }).join('') + '</ol>';
    else if (tur === 'ay') {
      var bas = gk(gl[0], 1 - hg(gl[0])), g;
      ic = '<div class="il-ay-izgara" role="img" aria-label="Ayın antrenman günleri">' + GK.map(function (x) { return '<small>' + x + '</small>'; }).join('');
      for (g = bas; g <= gl[gl.length - 1] || hg(g) !== 1; g = gk(g, 1)) ic += '<i class="' + (g.slice(0, 7) === gl[0].slice(0, 7) ? (o.d[g] || (g > bugun() ? 'gelecek' : 'yok')) : 'dis') + '"></i>';
      ic += '</div>';
    } else ic = yer(antIsi(gl, o.d), tur === 'yil' ? 56 : 84, 'Antrenman günleri ısı şeridi');
    var lj = ['tamam', 'kisa', 'yarim', 'kaydirildi', 'yapilmadi', 'plan'].filter(function (d) { return kullanilan[d] && (tur === 'hafta' || d !== 'plan'); });
    return '<section class="kart il-kart" aria-label="Antrenman"><button class="il-kart-dokun" data-i-detay="antrenman" aria-label="Antrenman ayrıntısı"></button>' + kartBas('barbell', 'antrenman', 'Antrenman') +
      '<div class="il-iki"><div>' + deger2(o.yap + ' / ' + o.planli, 'gün', 'yapılan / planlı') + '</div><div>' + deger2(f(o.set), 'set', 'toplam') + '</div></div>' + ic + lejant(lj, tur !== 'hafta') + '</section>';
  }
  function antIsi(gl, d) {
    return function (W, H) {
      var bas = gk(gl[0], 1 - hg(gl[0])), hafta = Math.ceil((gl.length + hg(gl[0]) - 1) / 7), ara = W / hafta, kare = ara - (hafta > 30 ? 1 : 3), kH = (H - 6) / 7;
      var s = '<svg width="' + W + '" height="' + H + '" aria-hidden="true">';
      for (var w = 0; w < hafta; w++) for (var j = 0; j < 7; j++) {
        var g = gk(bas, w * 7 + j); if (g < gl[0] || g > gl[gl.length - 1]) continue;
        s += '<rect class="il-kare ' + (d[g] || (g > bugun() ? 'gelecek' : 'yok')) + '" x="' + (w * ara) + '" y="' + (j * (kH + 1)) + '" width="' + kare + '" height="' + (kH - 1) + '" rx="2"/>';
      }
      return s + '</svg>';
    };
  }
  function kademe(s) { var k = Z.agriKademe(s).k; return { normal: 'yesil', dikkat: 'sari', ara: 'turuncu', doktor: 'kirmizi' }[k]; }
  function notSiddet(n) { return n.takip.length ? n.takip[n.takip.length - 1][1] : n.siddet; }
  function agriSatir(n) {
    var s = notSiddet(n), gecti = n.durum === 'geçti', fs = function (x) { return f(x, x % 1 ? 1 : 0); };
    return '<li><i class="il-siddet ' + kademe(s) + '" aria-hidden="true"></i><span><b>' + esc(ilkHarfBuyuk(n.bolge)) + (n.taraf && n.taraf !== 'yok' ? ' · ' + esc(ilkHarfBuyuk(n.taraf)) : '') + '</b><small>' + esc(ilkHarfBuyuk(n.tur)) + ' · ' + tk(n.acilis) + (gecti && n.kapanis ? ' – ' + tk(n.kapanis) : '') + '</small></span>' +
      '<em>' + (gecti ? 'Geçti' : (n.takip.length ? fs(n.siddet) + ' → ' + fs(s) : 'Şiddet ' + fs(s))) + '</em></li>';
  }
  function notlar(gl) {
    var a = gl[0], b = gl[gl.length - 1];
    return (I.veri ? I.veri.n : []).filter(function (n) {
      var son = n.durum === 'geçti' ? (n.kapanis || n.acilis) : bugun();
      return n.acilis <= b && son >= a;
    });
  }
  function agriKarti(tur, ref) {
    var l = notlar(donemGunleri(tur, ref)), ac = l.filter(function (n) { return n.durum !== 'geçti'; }).length;
    if (!l.length) return bosKart('bandage', 'agri', 'Ağrı ve sağlık notları', 'Bu dönemde not yok');
    return '<section class="kart il-kart" aria-label="Ağrı ve sağlık notları"><button class="il-kart-dokun" data-i-detay="agri" aria-label="Ağrı notları ayrıntısı"></button>' + kartBas('bandage', 'agri', 'Ağrı ve sağlık notları') +
      deger2(String(ac), 'açık not', l.length - ac ? (l.length - ac) + ' not geçti' : '') + '<ul class="il-agri-liste">' + l.slice(0, 3).map(agriSatir).join('') + '</ul></section>';
  }
  function aylikOzetKarti() {
    var g = bugun(); if (+g.slice(8) > 7) return '';
    var onceki = donemKaydir('ay', g.slice(0, 8) + '01', -1), ay = onceki.slice(0, 7);
    if (Z.ayar('il_ozet_ay', '') === ay) return '';
    var k = ozet('ay', 'kcal', onceki), p = ozet('ay', 'p', onceki), gl = donemGunleri('ay', onceki), a = antOzet(gl).yap;
    var e = egilim(olcumler('kilo')), ilk = e.filter(function (x) { return x.g < ay + '-01'; }).pop(), son = e.filter(function (x) { return x.g.slice(0, 7) <= ay; }).pop();
    if (!k.gun && !a && !son) return '';
    var li = [];
    if (ilk && son) li.push(['Kilo', isaret(son.v - ilk.v, 1) + ' kg']);
    if (k.gun) li.push(['Kalori', f(k.ort)]);
    if (p.gun) li.push(['Protein', f(p.ort) + ' g']);
    if (a) li.push(['Antrenman', a + ' gün']);
    return '<section class="kart il-ay-kart"><div class="il-ay-bas"><span class="il-lk il-kilo" aria-hidden="true">' + ik('calendar-event') + '</span><span><b>' + AYLAR[+ay.slice(5) - 1] + ' özetin hazır</b><small>1 – ' + (+gl[gl.length - 1].slice(8)) + ' ' + AYLAR[+ay.slice(5) - 1] + '</small></span>' +
      '<button class="kapat kucuk" data-i-ozet-kapat="' + ay + '" aria-label="Özeti kapat">' + ik('x') + '</button></div>' +
      '<ul class="il-ay-liste">' + li.map(function (x) { return '<li><small>' + x[0] + '</small><b>' + x[1] + '</b></li>'; }).join('') + '</ul>' +
      '<button class="ikinci-dugme" data-i-ay-ac="' + onceki + '">' + AYLAR[+ay.slice(5) - 1] + '\'ı aç</button></section>';
  }
  function gecmisAylar(ref) {
    var y = (ref || bugun()).slice(0, 4), satirlar = '';
    for (var m = 12; m >= 1; m--) {
      var r = y + '-' + (m < 10 ? '0' : '') + m + '-15'; if (r.slice(0, 7) > bugun().slice(0, 7)) continue;
      var k = ozet('ay', 'kcal', r), gl = donemGunleri('ay', r), a = antOzet(gl).yap, e = egilim(olcumler('kilo')), ay = r.slice(0, 7);
      var ilk = e.filter(function (x) { return x.g < ay + '-01'; }).pop() || e.filter(function (x) { return x.g.slice(0, 7) === ay; })[0], son = e.filter(function (x) { return x.g.slice(0, 7) <= ay; }).pop();
      if (!k.gun && !a && !(son && son.g.slice(0, 7) === ay)) continue;
      var parca = []; if (ilk && son) parca.push(isaret(son.v - ilk.v, 1) + ' kg'); if (k.gun) parca.push(f(k.ort) + ' kcal'); if (a) parca.push(a + ' antrenman');
      satirlar += '<button class="il-ay-satir" data-i-ay-ac="' + r + '"><span><b>' + AYLAR[m - 1] + (ay === bugun().slice(0, 7) ? ' · sürüyor' : '') + '</b><small>' + parca.join(' · ') + '</small></span>' + ik('chevron-right') + '</button>';
    }
    return satirlar ? '<div class="bolum-baslik">Aylar</div><section class="kart il-liste-kart">' + satirlar + '</section>' : '';
  }
  function paylasKarti() {
    return '<button class="kart il-sor" data-i-paylas><span class="il-lk il-sor-ikon" aria-hidden="true">' + ik('share') + '</span><span><b>Verileri paylaş</b><small>Özetini bir uygulamaya ya da uzmana gönder</small></span>' + ik('chevron-right') + '</button>' +
      '<button class="metin-dugme il-duzenle" data-i-duzenle>' + ik('adjustments-horizontal') + 'Kartları düzenle</button>';
  }

  /* ---------- Ekran ---------- */
  function hicVeriYok() {
    if (!I.veri) return false;
    return !I.veri.o.length && !Object.keys(I.veri.g).length && !Object.keys(I.veri.a).length && !I.veri.n.length && !Object.keys(S.gv || {}).some(function (g) { return gunDeger(g); });
  }
  function ciz(ana) {
    if (!I.veri) {
      ana.innerHTML = '<div class="m-ust"><header class="ekran-ust"><h1>İlerleme</h1></header></div>' +
        (I.hata ? '<section class="kart"><b>Veriler alınamadı.</b><p class="il-bos-satir">' + (I.hata === 'internet' ? 'İnternet bağlantını kontrol et.' : esc(I.hata)) + '</p><button class="ana-dugme" id="il-tekrar">Tekrar dene</button></section>'
          : '<p class="yukleniyor">Gidişatın hazırlanıyor…</p>');
      var t = $('#il-tekrar'); if (t) t.onclick = function () { yukle(true); Z.ciz(); };
      yukle(); return;
    }
    var t2 = I.tur, ref = I.ref || bugun(), gz = gizli(), h;
    if (hicVeriYok() && !I.gecildi) {
      h = '<div class="m-ust"><header class="ekran-ust"><h1>İlerleme</h1></header></div>' +
        '<section class="kart il-basla"><span class="il-basla-ikon">' + ik('chart-area-line') + '</span><h2>Gidişatını burada göreceksin</h2>' +
        '<p>Kilonu ve belini gir. Diğerleri kayıt ekledikçe gelir.</p><button class="ana-dugme" data-i-olcum>' + ik('plus') + 'İlk ölçümünü gir</button>' +
        '<button class="metin-dugme orta" id="il-gec">Şimdilik geç</button></section>' +
        bosKart('flame', 'kalori', 'Kalori ve protein', 'Öğün ekledikçe görünür') + bosKart('droplet', 'su', 'Su', 'Su ekledikçe görünür') + bosKart('barbell', 'antrenman', 'Antrenman', 'Antrenman yaptıkça görünür');
    } else {
      h = ust() + (I.ref ? '' : aylikOzetKarti());
      if (gz.indexOf('kilo') < 0) h += kiloKarti(t2, ref);
      if (gz.indexOf('beslenme') < 0) h += beslenmeKarti(t2, ref);
      if (gz.indexOf('su') < 0) h += tekKart('su', 'droplet', 'su', 'Su', t2, ref);
      if (gz.indexOf('adim') < 0) h += tekKart('adim', 'footsteps', 'adim', 'Adım', t2, ref);
      if (gz.indexOf('uyku') < 0) h += uykuKarti(t2, ref);
      if (gz.indexOf('antrenman') < 0) h += antKarti(t2, ref);
      if (gz.indexOf('agri') < 0) h += agriKarti(t2, ref);
      if (t2 === 'yil') h += gecmisAylar(ref);
      h += paylasKarti();
    }
    ana.innerHTML = h;
    grafikleriCiz(ana);
    bagla(ana);
  }
  function bagla(ana) {
    ana.querySelectorAll('[data-i-tur]').forEach(function (b) { b.onclick = function () { I.tur = b.getAttribute('data-i-tur'); I.ref = ''; Z.titret(); Z.ciz(); window.scrollTo(0, 0); }; });
    ana.querySelectorAll('[data-i-git]').forEach(function (b) { b.onclick = function () { var r = donemKaydir(I.tur, I.ref || bugun(), +b.getAttribute('data-i-git')); I.ref = r >= bugun() || donemGunleri(I.tur, r).indexOf(bugun()) >= 0 ? '' : r; Z.ciz(); }; });
    ana.querySelectorAll('[data-i-olcum]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); olcumPenceresi(); }; });
    ana.querySelectorAll('[data-i-detay]').forEach(function (b) { b.onclick = function () { detayAc(b.getAttribute('data-i-detay')); }; });
    ana.querySelectorAll('[data-i-ay-ac]').forEach(function (b) { b.onclick = function () { I.tur = 'ay'; I.ref = b.getAttribute('data-i-ay-ac'); if (I.ref.slice(0, 7) === bugun().slice(0, 7)) I.ref = ''; Z.ciz(); window.scrollTo(0, 0); }; });
    ana.querySelectorAll('[data-i-ozet-kapat]').forEach(function (b) { b.onclick = function () { Z.ayarYaz('il_ozet_ay', b.getAttribute('data-i-ozet-kapat')); Z.ciz(); }; });
    var p = ana.querySelector('[data-i-paylas]'); if (p) p.onclick = paylas;
    var d = ana.querySelector('[data-i-duzenle]'); if (d) d.onclick = kartDuzenle;
    var gc = $('#il-gec'); if (gc) gc.onclick = function () { I.gecildi = true; Z.ciz(); };
  }
  function detayAc(t) {
    if (t === 'kilo') olcumDetay('kilo');
    else if (t === 'beslenme') metrikDetay(['kcal', 'p'], 0);
    else if (t === 'su' || t === 'adim') metrikDetay([t], 0);
    else if (t === 'antrenman') antDetay();
    else if (t === 'agri') agriDetay('hepsi');
  }

  /* ---------- Ölçüm ekle ---------- */
  function sayiAlani(id, etiket, alt, deger, b) {
    return '<div class="ayar-satir"><label for="' + id + '"><b>' + etiket + '</b>' + (alt ? '<small>' + alt + '</small>' : '') + '</label><span class="birimli"><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(deger) + '" placeholder="—"><small>' + b + '</small></span></div>';
  }
  function olcumPenceresi(onTur) {
    var ilk = !olcumler('kilo').length, ekler = ekOlculer(), F = { tarih: bugun(), acik: ekler.slice() };
    if (onTur && EK_OLCU.indexOf(onTur) >= 0 && F.acik.indexOf(onTur) < 0) F.acik.push(onTur);
    function sonOlcum(t) { var l = olcumler(t); return l.length ? 'Son: ' + f(l[l.length - 1].v, 1) + ' ' + OLCU[t][1] + ' · ' + tk(l[l.length - 1].g) : ''; }
    function icerik() {
      var kalan = EK_OLCU.filter(function (x) { return F.acik.indexOf(x) < 0; });
      return Z.tarihKutusu('o-tarih', 'Tarih', F.tarih, '2000-01-01') +
        sayiAlani('o-kilo', 'Kilo', sonOlcum('kilo'), '', 'kg') +
        sayiAlani('o-bel', 'Bel çevresi', sonOlcum('bel') || 'İsteğe bağlı', '', 'cm') +
        F.acik.map(function (t) { return sayiAlani('o-' + t, OLCU[t][0] + ' çevresi', sonOlcum(t) || 'İsteğe bağlı', '', 'cm'); }).join('') +
        (ilk && hedefKilo() == null ? sayiAlani('o-hedef', 'Hedef kilo', 'İsteğe bağlı', '', 'kg') : '') +
        (kalan.length ? '<div class="bolum-baslik">Başka ölçü ekle</div><div class="cipler">' + kalan.map(function (t) { return '<button class="cip" data-o-ek="' + t + '">' + ik('plus') + OLCU[t][0] + '</button>'; }).join('') + '</div>' : '') +
        '<div class="alt-dugme"><button class="ana-dugme" id="o-kaydet">' + ik('check') + 'Kaydet</button></div>';
    }
    function oku() { var o = {}; ['kilo', 'bel'].concat(F.acik, ['hedef']).forEach(function (t) { var e = $('#o-' + t); if (e) o[t] = e.value; }); return o; }
    function bagla2(p) {
      Z.tarihKutusuBagla('o-tarih', function (v) { F.tarih = v; });
      p.querySelectorAll('[data-o-ek]').forEach(function (b) { b.onclick = function () { var v = oku(); F.acik.push(b.getAttribute('data-o-ek')); Z.pencereIcerik(icerik(), bagla2, true); Object.keys(v).forEach(function (t) { var e = $('#o-' + t); if (e) e.value = v[t]; }); var y = $('#o-' + b.getAttribute('data-o-ek')); if (y) y.focus(); }; });
      $('#o-kaydet').onclick = function () {
        var v = oku(), yaz = [], hata = '';
        Object.keys(v).forEach(function (t) {
          if (!String(v[t]).trim()) return; var n = sayi(v[t]);
          var sinir = t === 'kilo' || t === 'hedef' ? [20, 400] : [10, 250];
          if (!isFinite(n) || n < sinir[0] || n > sinir[1]) { hata = (t === 'hedef' ? 'Hedef kilo' : OLCU[t][0]) + ' için geçerli bir sayı gir'; return; }
          yaz.push([t, Math.round(n * 10) / 10]);
        });
        if (hata) { Z.bildir('⚠ ' + hata); return; }
        if (!yaz.length) { Z.bildir('⚠ En az bir ölçü gir'); return; }
        if (F.tarih > bugun()) { Z.bildir('⚠ İleri bir tarih seçilemez'); return; }
        yaz.forEach(function (x) {
          if (x[0] === 'hedef') { hedefKaydet(x[1]); return; }
          var is = { tur: 'olcum_yaz', veri: { tarih: F.tarih, tur: x[0], deger: x[1], birim: OLCU[x[0]][1] } };
          Z.islemEkle(is.tur, is.veri); uygula(is);
        });
        var yeniEk = F.acik.filter(function (t) { return ekler.indexOf(t) < 0 && yaz.some(function (x) { return x[0] === t; }); });
        if (yeniEk.length) Z.ayarYaz('olcu_ek', ekler.concat(yeniEk).join(','));
        I.gecildi = true; Z.titret(); Z.pencereKapat(); Z.ciz(); Z.bildir('✅ Ölçüm kaydedildi');
      };
    }
    Z.pencereAc(ilk ? 'İlk ölçümün' : 'Ölçüm ekle', icerik(), bagla2);
  }
  function hedefKaydet(v) {
    var g = bugun(); S.hedefler = S.hedefler.filter(function (h) { return !(String(h['Başlangıç']) === g && h['Tür'] === 'kilo'); });
    if (v != null) { S.hedefler.push({ 'Başlangıç': g, 'Tür': 'kilo', 'Değer': v, 'Not': '' }); Z.islemEkle('hedef_ekle', { baslangic: g, tur: 'kilo', deger: v }); }
  }

  /* ---------- Detay pencereleri ---------- */
  var P = { tur: '3ay', ref: '' };
  function donemCipleri(sec) { return '<div class="cipler il-p-cip">' + TURLER.map(function (x) { return '<button class="cip' + (x[0] === sec ? ' secili' : '') + '" aria-pressed="' + (x[0] === sec) + '" data-p-tur="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>'; }
  function gezgin() { return '<div class="il-gezgin pencerede"><button class="tn-ok" data-p-git="-1" aria-label="Önceki dönem">' + ik('chevron-left') + '</button><b>' + donemAdi(P.tur, P.ref || bugun()) + '</b><button class="tn-ok" data-p-git="1" aria-label="Sonraki dönem"' + (sonrakiVar(P.tur, P.ref) ? '' : ' disabled') + '>' + ik('chevron-right') + '</button></div>'; }
  function donemBagla(p, yenile) {
    p.querySelectorAll('[data-p-tur]').forEach(function (b) { b.onclick = function () { P.tur = b.getAttribute('data-p-tur'); P.ref = ''; yenile(); }; });
    p.querySelectorAll('[data-p-git]').forEach(function (b) { b.onclick = function () { var r = donemKaydir(P.tur, P.ref || bugun(), +b.getAttribute('data-p-git')); P.ref = donemGunleri(P.tur, r).indexOf(bugun()) >= 0 ? '' : r; yenile(); }; });
  }
  function ucluk(l) { return '<div class="il-ucluk">' + l.map(function (x) { return '<div><small>' + x[0] + '</small><b>' + x[1] + '</b>' + (x[2] ? '<small>' + x[2] + '</small>' : '') + '</div>'; }).join('') + '</div>'; }
  function sekmeler(l, sec, attr) { return '<div class="grup-cipler" role="tablist">' + l.map(function (x, i) { return '<button class="sekme-ciz' + (i === sec ? ' secili' : '') + '" role="tab" aria-selected="' + (i === sec) + '" ' + attr + '="' + i + '">' + x + '</button>'; }).join('') + '</div>'; }
  function grafikGunleri() { var gl = donemGunleri(P.tur, P.ref), i, l = []; if (P.tur === 'hafta') { var son = gl[6] > bugun() ? bugun() : gl[6]; for (i = 29; i >= 0; i--) l.push(gk(son, -i)); return l; } return gl.filter(function (g) { return g <= bugun(); }); }

  // Kilo, bel ve diğer ölçüler
  function olcumDetay(tur, ilkAcilis) {
    if (ilkAcilis !== false) { P.tur = '3ay'; P.ref = ''; }
    var turlar = ['kilo', 'bel'].concat(ekOlculer()), si = Math.max(0, turlar.indexOf(tur));
    function icerik() {
      var t = turlar[si], l = olcumler(t), e = seri(t, l), gl = grafikGunleri(), h = '';
      if (!l.length) {
        h = '<p class="il-bos-satir">' + OLCU[t][0] + ' ölçümü yok</p>';
      } else {
        var son = e[e.length - 1], ic = l.filter(function (x) { return x.g >= gl[0] && x.g <= gl[gl.length - 1]; });
        var hk = t === 'kilo' ? hedefKilo() : null;
        h = donemCipleri(P.tur) + gezgin() +
          ucluk([['Başlangıç', f(l[0].v, 1) + ' ' + OLCU[t][1], tk(l[0].g)], ['Şimdi', f(son.v, 1) + ' ' + OLCU[t][1], t === 'kilo' && l.length > 1 ? 'eğilim' : tk(son.g)], hk != null ? ['Hedef', f(hk, hk % 1 ? 1 : 0) + ' kg', 'kalan ' + f(Math.abs(son.v - hk), 1)] : ['Değişim', isaret(son.v - l[0].v, 1), 'başlangıçtan']]) +
          (l.length < 2 ? '' : yer(cizgi(t, gl), 180, OLCU[t][0] + ' grafiği') +
          '<ul class="il-lejant"><li><i class="il-l-nokta"></i>Ölçüm</li>' + (t === 'kilo' ? '<li><i class="il-l-cizgi"></i>Eğilim</li>' : '') + (hk != null ? '<li><i class="il-l-hedef"></i>Hedef</li>' : '') + '</ul>');
      }
      if (t === 'kilo') {
        var hk2 = hedefKilo(), boy = sayi(Z.ayar('boy', '')), sk = l.length ? egilim(l).pop().v : NaN;
        h += '<button class="il-hedef-satir" id="od-hedef"><span>' + ik('target') + 'Hedef kilo</span><b>' + (hk2 != null ? f(hk2, hk2 % 1 ? 1 : 0) + ' kg' : 'Belirle') + '</b>' + ik('chevron-right') + '</button>';
        h += '<button class="il-hedef-satir alt" id="od-vki"><span>' + ik('info-circle') + 'Vücut kitle indeksi</span><b>' + (isFinite(boy) && isFinite(sk) ? f(sk / Math.pow(boy / 100, 2), 1) + ' · ' + vkiGrup(sk / Math.pow(boy / 100, 2)) : 'Boy gir') + '</b>' + ik('chevron-right') + '</button>';
      }
      if (l.length) h += '<div class="bolum-baslik">Ölçümler</div><ul class="il-olcum-liste">' + l.slice().reverse().map(function (o, i, a) {
        var onc = a[i + 1]; return '<li><button data-od-sec="' + o.g + '"><span><b>' + f(o.v, 1) + ' ' + OLCU[t][1] + '</b><small>' + tk(o.g) + '</small></span><em>' + (onc ? isaret(o.v - onc.v, 1) : '') + '</em>' + ik('pencil') + '</button></li>'; }).join('') + '</ul>';
      return h + '<div class="alt-dugme"><button class="ana-dugme" id="od-ekle">' + ik('plus') + 'Ölçüm ekle</button></div>';
    }
    function yenile() { Z.pencereIcerik(icerik(), bagla2, true); $('.pencere-bas .grup-cipler').outerHTML = sekmeler(turlar.map(function (x) { return OLCU[x][0]; }), si, 'data-od-tur'); baglaSekme(); }
    function baglaSekme() { document.querySelectorAll('[data-od-tur]').forEach(function (b) { b.onclick = function () { si = +b.getAttribute('data-od-tur'); yenile(); }; }); }
    function bagla2(p) {
      grafikleriCiz(p); donemBagla(p, yenile);
      var e = $('#od-ekle'); if (e) e.onclick = function () { olcumPenceresi(turlar[si]); };
      var hd = $('#od-hedef'); if (hd) hd.onclick = function () { tekDeger('Hedef kilo', 'kg', hedefKilo(), function (v) { hedefKaydet(v); }, function () { olcumDetay('kilo', false); }); };
      var vk = $('#od-vki'); if (vk) vk.onclick = function () { tekDeger('Boy', 'cm', sayi(Z.ayar('boy', '')), function (v) { Z.ayarYaz('boy', v == null ? '' : String(v)); }, function () { olcumDetay('kilo', false); }, [100, 250], 'Vücut kitle indeksi için'); };
      p.querySelectorAll('[data-od-sec]').forEach(function (b) { b.onclick = function () { olcumDuzenle(turlar[si], b.getAttribute('data-od-sec')); }; });
    }
    Z.pencereAc('Kilo ve ölçüler', icerik(), function (p) { bagla2(p); baglaSekme(); }, false, sekmeler(turlar.map(function (x) { return OLCU[x][0]; }), si, 'data-od-tur'));
  }
  // DSÖ yetişkin sınıflaması (sadece bilgi; teşhis değil)
  function vkiGrup(v) { return v < 18.5 ? 'zayıf' : v < 25 ? 'normal' : v < 30 ? 'fazla kilolu' : 'obez'; }
  function tekDeger(baslik, b, mevcut, kaydet, geri, sinir, alt) {
    sinir = sinir || [20, 400];
    Z.pencereAc(baslik, sayiAlani('td-v', baslik, alt || '', isFinite(mevcut) && mevcut != null ? String(mevcut).replace('.', ',') : '', b) +
      '<div class="il-iki-dugme">' + (isFinite(mevcut) && mevcut != null ? '<button class="ikinci-dugme tehlike" id="td-sil">Kaldır</button>' : '') + '<button class="ana-dugme" id="td-kaydet">' + ik('check') + 'Kaydet</button></div>', function () {
      $('#td-kaydet').onclick = function () {
        var n = sayi($('#td-v').value); if (!isFinite(n) || n < sinir[0] || n > sinir[1]) { Z.bildir('⚠ Geçerli bir sayı gir'); return; }
        kaydet(Math.round(n * 10) / 10); Z.titret(); Z.ciz(); geri();
      };
      var s = $('#td-sil'); if (s) s.onclick = function () { kaydet(null); Z.ciz(); geri(); };
    }, true, '', { ad: 'Listeye dön', fn: geri });
  }
  function olcumDuzenle(tur, tarih) {
    var o = olcumler(tur).filter(function (x) { return x.g === tarih; })[0]; if (!o) return;
    function geri() { olcumDetay(tur, false); }
    Z.pencereAc(OLCU[tur][0] + ' · ' + tk(tarih), sayiAlani('oe-v', OLCU[tur][0], '', String(o.v).replace('.', ','), OLCU[tur][1]) +
      '<div class="il-iki-dugme"><button class="ikinci-dugme tehlike" id="oe-sil">' + ik('trash') + 'Sil</button><button class="ana-dugme" id="oe-kaydet">' + ik('check') + 'Kaydet</button></div>', function () {
      $('#oe-kaydet').onclick = function () {
        var n = sayi($('#oe-v').value), sinir = tur === 'kilo' ? [20, 400] : [10, 250];
        if (!isFinite(n) || n < sinir[0] || n > sinir[1]) { Z.bildir('⚠ Geçerli bir sayı gir'); return; }
        var is = { tur: 'olcum_yaz', veri: { tarih: tarih, tur: tur, deger: Math.round(n * 10) / 10, birim: OLCU[tur][1] } }; Z.islemEkle(is.tur, is.veri); uygula(is);
        Z.ciz(); geri(); Z.bildir('✅ Ölçüm güncellendi');
      };
      $('#oe-sil').onclick = function () {
        var is = { tur: 'olcum_sil', veri: { tarih: tarih, tur: tur } }; Z.islemEkle(is.tur, is.veri); uygula(is); Z.ciz(); geri();
        Z.bildir('Ölçüm silindi', 'Geri al', function () { var g2 = { tur: 'olcum_yaz', veri: { tarih: tarih, tur: tur, deger: o.v, birim: OLCU[tur][1] } }; Z.islemEkle(g2.tur, g2.veri); uygula(g2); Z.ciz(); if (!$('#pencere').hidden) geri(); });
      };
    }, true, '', { ad: 'Listeye dön', fn: geri });
  }

  // Kalori / protein, su, adım
  function metrikDetay(turlar, si, sec) {
    P.tur = sec == null && P.son !== turlar.join() ? 'hafta' : P.tur; P.son = turlar.join();
    var ADLAR = { kcal: 'Kalori', p: 'Protein', su: 'Su', adim: 'Adım' }, secili = sec == null ? null : sec;
    function icerik() {
      var k = turlar[si], dl = dilimler(P.tur, P.ref), o = ozet(P.tur, k, P.ref), vals = dl.map(function (d) { return deger(d, k); }).filter(function (v) { return v != null; });
      var bic = function (v) { return k === 'su' ? f(v / 1000, 1) + ' L' : f(v) + ' ' + birim(k); };
      if (secili == null) { for (var i = dl.length - 1; i >= 0; i--) if (deger(dl[i], k) != null) { secili = i; break; } }
      var h = donemCipleri(P.tur) + gezgin() + (o.gun ? ucluk([['Ortalama', bic(o.ort)], [k === 'kcal' ? 'En düşük' : 'En yüksek', bic(k === 'kcal' ? Math.min.apply(null, vals) : Math.max.apply(null, vals))], o.hedefli ? [k === 'kcal' ? 'Sınırda' : 'Hedefte', o.hedefte + ' / ' + o.hedefli + ' gün'] : ['Kayıtlı', o.gun + ' gün']]) +
        yer(cubuk(dl, k, { secili: secili }), 190, ADLAR[k] + ' grafiği') : '<p class="il-bos-satir">Bu dönemde kayıt yok</p>');
      var hd = Z.hedef(HEDEF_TUR[k], bugun());
      if (o.gun && hd != null) h += '<ul class="il-lejant">' + (k === 'kcal' ? '<li><i class="il-l-kcal"></i>Sınırın altında</li><li><i class="il-l-asti"></i>Sınırı aştı</li><li><i class="il-l-hedef"></i>Sınır ' + f(hd) + '</li>' :
        '<li><i class="il-l-' + k + '"></i>Hedefin altında</li><li><i class="il-l-' + k + ' tamam"></i>Hedefte</li><li><i class="il-l-hedef"></i>Hedef ' + (k === 'su' ? f(hd / 1000, 1) + ' L' : f(hd)) + '</li>') + '</ul>';
      if (P.tur === 'hafta' || P.tur === 'ay') {
        var gunler = donemGunleri(P.tur, P.ref).filter(function (g) { return g <= bugun(); }).reverse();
        h += '<div class="bolum-baslik">Günler</div><ul class="il-gun-liste">' + gunler.map(function (g) {
          var x = gunDeger(g), v = x && x[k], hh = Z.hedef(HEDEF_TUR[k], g), as = v != null && hh != null && k === 'kcal' && v > hh;
          var ek = turlar.length > 1 && x ? (k === 'kcal' ? x.p : x.kcal) : null;
          return '<li><button data-md-gun="' + g + '"><span><b>' + tk(g) + '</b><small>' + GK[hg(g) - 1] + '</small></span>' +
            (v != null ? '<em' + (as ? ' class="asti"' : '') + '>' + bic(v) + '</em>' + (ek != null ? '<em class="p">' + (k === 'kcal' ? f(ek) + ' g' : f(ek) + ' kcal') + '</em>' : '') : '<em class="yok">Kayıt yok</em>') + ik('chevron-right') + '</button></li>';
        }).join('') + '</ul>';
      }
      return h;
    }
    function yenile() { secili = null; Z.pencereIcerik(icerik(), bagla2, true); }
    function bagla2(p) {
      grafikleriCiz(p); donemBagla(p, yenile);
      p.querySelectorAll('.il-dokun').forEach(function (r) { r.onclick = function () { secili = +r.getAttribute('data-dilim'); Z.pencereIcerik(icerik(), bagla2, true); }; });
      p.querySelectorAll('[data-md-gun]').forEach(function (b) { b.onclick = function () { Z.pencereKapat(); Z.bugunGit(b.getAttribute('data-md-gun')); }; });
      document.querySelectorAll('[data-md-tur]').forEach(function (b) { b.onclick = function () { si = +b.getAttribute('data-md-tur'); document.querySelectorAll('[data-md-tur]').forEach(function (x, j) { x.classList.toggle('secili', j === si); x.setAttribute('aria-selected', j === si); }); yenile(); }; });
    }
    var baslik = turlar.length > 1 ? 'Kalori ve protein' : ADLAR[turlar[0]];
    Z.pencereAc(baslik, icerik(), bagla2, false, turlar.length > 1 ? sekmeler(turlar.map(function (x) { return ADLAR[x]; }), si, 'data-md-tur') : '');
  }

  // Antrenman: ay takvimi + hareketler
  function antDetay(ilkAcilis) {
    if (ilkAcilis !== false) { P.tur = 'ay'; P.ref = ''; }
    function icerik() {
      var gl = donemGunleri(P.tur, P.ref), o = antOzet(gl), kisa = 0, yarim = 0, h;
      Object.keys(o.d).forEach(function (g) { if (o.d[g] === 'kisa') kisa++; if (o.d[g] === 'yarim') yarim++; });
      h = donemCipleri(P.tur) + gezgin() + ucluk([['Yapılan', o.yap + ' / ' + o.planli + ' gün'], ['Kısa', kisa + ' gün'], ['Yarım', yarim + ' gün']]);
      if (P.tur === 'ay' || P.tur === 'hafta') {
        var bas = gk(gl[0], 1 - hg(gl[0])), ayA = gl[0].slice(0, 7), g;
        h += '<div class="il-takvim" role="grid" aria-label="Antrenman takvimi">' + GK.map(function (x) { return '<small>' + x.slice(0, 2) + '</small>'; }).join('');
        for (g = bas; g <= gl[gl.length - 1] || hg(g) !== 1; g = gk(g, 1)) {
          var ic = P.tur === 'hafta' || g.slice(0, 7) === ayA, d = ic ? antDurum(g) : '';
          h += '<span class="' + (ic ? '' : 'dis') + (g === bugun() ? ' bugun' : '') + '"' + (d ? ' aria-label="' + tk(g) + ': ' + ANT_D[d][1] + '"' : '') + '>' + (d ? '<i class="il-ag kucuk ' + d + '">' + ik(ANT_D[d][0]) + '</i>' : '') + '<b>' + (+g.slice(8)) + '</b></span>';
        }
        h += '</div>' + lejant(['tamam', 'kisa', 'yarim', 'kaydirildi', 'yapilmadi', 'plan']);
      } else h += yer(antIsi(gl, o.d), P.tur === 'yil' ? 56 : 84, 'Antrenman günleri ısı şeridi') + lejant(['tamam', 'kisa', 'yarim', 'yapilmadi'], true);
      var har = hareketOzet(gl);
      if (har.length) h += '<div class="bolum-baslik">Hareketler · en iyi tekrar</div><ul class="il-har-liste">' + har.map(function (x) {
        return '<li><button data-ad-har="' + esc(x.h) + '"><span><b>' + esc(x.ad) + '</b><small>' + x.sayi + ' antrenman' + (x.bolge ? ' · ' + esc(ilkHarfBuyuk(x.bolge)) : '') + '</small></span><em>' + (x.ilk === x.enIyi ? '<b>' + x.enIyi + '</b>' : x.ilk + ' → <b>' + x.enIyi + '</b>') + (x.sure ? ' sn' : '') + '</em>' + ik('chevron-right') + '</button></li>';
      }).join('') + '</ul>';
      else h += '<p class="il-bos-satir">Bu dönemde set kaydı yok</p>';
      return h;
    }
    function bagla2(p) {
      grafikleriCiz(p); donemBagla(p, function () { Z.pencereIcerik(icerik(), bagla2, true); });
      p.querySelectorAll('[data-ad-har]').forEach(function (b) { b.onclick = function () { hareketGidisat(b.getAttribute('data-ad-har')); }; });
    }
    Z.pencereAc('Antrenman', icerik(), bagla2);
  }
  function hareketBilgi(h) { var A = Z.ANT && Z.ANT.ilerleme; if (A && A.katalog) A.katalog(); return (A && A.hareket && A.hareket(h)) || {}; }
  function oturumlar(h, gl) {
    var o = {};
    (I.veri ? I.veri.k : []).forEach(function (k) { if (k.h !== h || (gl && (k.g < gl[0] || k.g > gl[gl.length - 1]))) return; (o[k.g] = o[k.g] || []).push(k); });
    return Object.keys(o).sort().map(function (g) { var l = o[g].sort(function (a, b) { return a.set - b.set; }); return { g: g, setler: l.map(function (k) { return k.tekrar; }), enIyi: Math.max.apply(null, l.map(function (k) { return k.tekrar; })), ad: l[0].ad }; });
  }
  function hareketOzet(gl) {
    var ids = {}; (I.veri ? I.veri.k : []).forEach(function (k) { if (k.g >= gl[0] && k.g <= gl[gl.length - 1]) ids[k.h] = 1; });
    return Object.keys(ids).map(function (h) {
      var ot = oturumlar(h, gl), b = hareketBilgi(h);
      return { h: h, ad: b.ad || ot[0].ad || 'Hareket', bolge: b.bolge || '', sure: b.tur === 'süre', sayi: ot.length, ilk: ot[0].enIyi, enIyi: Math.max.apply(null, ot.map(function (x) { return x.enIyi; })) };
    }).sort(function (a, b) { return b.sayi - a.sayi || (a.ad < b.ad ? -1 : 1); });
  }
  function hareketGidisat(h) {
    P.tur = '3ay'; P.ref = '';
    function icerik() {
      var gl = donemGunleri(P.tur, P.ref), ot = oturumlar(h, gl), b = hareketBilgi(h), sure = b.tur === 'süre', br = sure ? ' sn' : ' tekrar';
      var hh = donemCipleri(P.tur) + gezgin();
      if (!ot.length) return hh + '<p class="il-bos-satir">Bu dönemde kayıt yok</p>';
      var enI = ot.reduce(function (m, x) { return x.enIyi >= m.enIyi ? x : m; }, ot[0]);
      hh += ucluk([['İlk', ot[0].enIyi + br, tk(ot[0].g)], ['En iyi', enI.enIyi + br, tk(enI.g)], ['Antrenman', ot.length + ' kez']]);
      if (ot.length > 1) hh += yer(function (W, H) {
        var vs = ot.map(function (x) { return x.enIyi; }), enk = Math.min.apply(null, vs), enb = Math.max.apply(null, vs), adim = temiz((enb - enk) || 2, 3);
        var taban = Math.max(0, Math.floor(enk / adim) * adim - adim), tavan = Math.ceil(enb / adim) * adim + (Math.ceil(enb / adim) * adim === enb ? adim : 0);
        var alt = 20, ust = 10, sag = 30, gW = W - sag, gH = H - alt - ust, n = gl.length - 1;
        function x(g) { return gl.indexOf(g) / n * gW; } function y(v) { return ust + gH - (v - taban) / (tavan - taban) * gH; }
        var s = '<svg width="' + W + '" height="' + H + '" aria-hidden="true">', t;
        for (t = taban; t <= tavan + 1e-9; t += adim) s += '<line class="il-izgara" x1="0" x2="' + gW + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="il-eksen" x="' + (W - 2) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + f(t) + '</text>';
        s += '<path class="il-egilim antrenman" d="' + ot.map(function (p, i) { return (i ? 'L' : 'M') + x(p.g).toFixed(1) + ' ' + y(p.enIyi).toFixed(1); }).join('') + '"/>';
        ot.forEach(function (p) { s += '<circle class="il-son antrenman" cx="' + x(p.g) + '" cy="' + y(p.enIyi) + '" r="4"/>'; });
        var son = gl[gl.length - 1] > bugun() ? bugun() : gl[gl.length - 1];
        return s + '<text class="il-eksen" x="0" y="' + (H - 4) + '">' + tkk(gl[0]) + '</text><text class="il-eksen" x="' + x(son) + '" y="' + (H - 4) + '" text-anchor="end">' + tkk(son) + '</text></svg>';
      }, 180, 'Antrenman başına en iyi ' + (sure ? 'süre' : 'tekrar') + ' grafiği');
      hh += '<div class="bolum-baslik">Antrenmanlar</div><ul class="il-olcum-liste">' + ot.slice().reverse().map(function (x) { return '<li><span><b>' + x.setler.join(' · ') + (sure ? ' sn' : '') + '</b><small>' + tk(x.g) + ' · ' + x.setler.length + ' set</small></span></li>'; }).join('') + '</ul>';
      return hh;
    }
    function bagla2(p) { grafikleriCiz(p); donemBagla(p, function () { Z.pencereIcerik(icerik(), bagla2, true); }); }
    var b = hareketBilgi(h), ot = oturumlar(h);
    Z.pencereAc(esc(b.ad || (ot[0] && ot[0].ad) || 'Hareket'), icerik(), bagla2, false, '', { ad: 'Listeye dön', fn: function () { antDetay(false); } });
  }

  // Ağrı notları: son 5 hafta zaman çizelgesi + liste
  function agriDetay(filtre) {
    var SEK = [['hepsi', 'Hepsi'], ['acik', 'Açık'], ['gecti', 'Geçti']], si = SEK.map(function (x) { return x[0]; }).indexOf(filtre);
    function icerik() {
      var l = (I.veri ? I.veri.n : []).filter(function (n) { return SEK[si][0] === 'hepsi' || (SEK[si][0] === 'acik' ? n.durum !== 'geçti' : n.durum === 'geçti'); }).sort(function (a, b) { return a.acilis < b.acilis ? 1 : -1; });
      var gun0 = gk(bugun(), -34), gunler = [], g; for (g = gun0; g <= bugun(); g = gk(g, 1)) gunler.push(g);
      var son5 = l.filter(function (n) { return (n.durum === 'geçti' ? (n.kapanis || n.acilis) : bugun()) >= gun0; }).slice(0, 4);
      var h = '';
      if (son5.length) h += '<div class="bolum-baslik">Son 5 hafta</div>' + yer(function (W, H) {
        var sol = 84, gW = W - sol - 6, n = gunler.length - 1;
        function x(d) { var i = gunler.indexOf(d); return sol + (i < 0 ? 0 : i) / n * gW; }
        var s = '<svg width="' + W + '" height="' + H + '" aria-hidden="true">';
        son5.forEach(function (nt, i) {
          var yy = 16 + i * 30, ad = ilkHarfBuyuk(nt.bolge) + (nt.taraf && nt.taraf !== 'yok' ? ' · ' + ilkHarfBuyuk(nt.taraf) : '');
          s += '<text class="il-eksen sol" x="0" y="' + (yy + 4) + '">' + esc(ad.length > 13 ? ad.slice(0, 12) + '…' : ad) + '</text><line class="il-izgara" x1="' + sol + '" x2="' + W + '" y1="' + yy + '" y2="' + yy + '"/>';
          [[nt.acilis, nt.siddet]].concat(nt.takip.map(function (t) { return [t[0], t[1]]; })).forEach(function (t) { if (t[0] >= gun0) s += '<circle class="il-siddet-n ' + kademe(t[1]) + '" cx="' + x(t[0]) + '" cy="' + yy + '" r="4.5"/>'; });
        });
        var ay = 16 + son5.length * 30; s += '<text class="il-eksen sol" x="0" y="' + (ay + 4) + '">Antrenman</text>';
        gunler.forEach(function (d) { if (yapildiMi(antDurum(d))) s += '<rect class="il-ant-cizik" x="' + (x(d) - 1.5) + '" y="' + (ay - 7) + '" width="3" height="14" rx="1.5"/>'; });
        return s + '<text class="il-eksen" x="' + sol + '" y="' + (H - 4) + '">' + tkk(gun0) + '</text><text class="il-eksen" x="' + W + '" y="' + (H - 4) + '" text-anchor="end">' + tkk(bugun()) + '</text></svg>';
      }, 46 + son5.length * 30 + 12, 'Ağrı notlarının şiddeti ve antrenman günleri') +
        '<ul class="il-lejant"><li><i class="il-siddet yesil"></i>Normal</li><li><i class="il-siddet sari"></i>Dikkat</li><li><i class="il-siddet turuncu"></i>Ara ver</li><li><i class="il-siddet kirmizi"></i>Doktor</li><li><i class="il-l-ant"></i>Antrenman günü</li></ul>';
      h += l.length ? '<div class="bolum-baslik">Notlar</div><ul class="il-agri-liste">' + l.map(agriSatir).join('') + '</ul>' : '<p class="il-bos-satir">Not yok</p>';
      return h;
    }
    function bagla2(p) {
      grafikleriCiz(p);
      document.querySelectorAll('[data-ag-sek]').forEach(function (b) { b.onclick = function () { si = +b.getAttribute('data-ag-sek'); document.querySelectorAll('[data-ag-sek]').forEach(function (x, j) { x.classList.toggle('secili', j === si); x.setAttribute('aria-selected', j === si); }); Z.pencereIcerik(icerik(), bagla2, true); }; });
    }
    Z.pencereAc('Ağrı ve sağlık notları', icerik(), bagla2, false, sekmeler(SEK.map(function (x) { return x[1]; }), si, 'data-ag-sek'));
  }

  /* ---------- Verileri paylaş ---------- */
  var PY = { gun: 7, ac: { beslenme: 1, gunluk: 1, uyku: 1, antrenman: 1, olcu: 1, agri: 1 } };
  var PY_AD = [['beslenme', 'Beslenme'], ['gunluk', 'Su ve adım'], ['uyku', 'Uyku'], ['antrenman', 'Antrenman'], ['olcu', 'Ölçüler'], ['agri', 'Ağrı ve sağlık notları']];
  function paylasMetni() {
    var bit = bugun(), bas = gk(bit, 1 - PY.gun), gunler = [], g, a = PY.ac, sat = [];
    for (g = bas; g <= bit; g = gk(g, 1)) gunler.push(g);
    sat.push('Zindem · son ' + PY.gun + ' gün (' + tk(bas) + ' – ' + tk(bit) + ')');
    var hd = [];
    if (a.beslenme) { var hk = Z.hedef('kalori', bit), hp = Z.hedef('protein', bit); if (hk != null) hd.push('kalori sınırı ' + f(hk) + ' kcal'); if (hp != null) hd.push('protein ' + f(hp) + ' g'); }
    if (a.gunluk) { var hs = Z.hedef('su_ml', bit), ha = Z.hedef('adim', bit); if (hs != null) hd.push('su ' + f(hs / 1000, 1) + ' L'); if (ha != null) hd.push(f(ha) + ' adım'); }
    if (hd.length) sat.push('Hedefler: ' + hd.join(', '));
    if (a.olcu) {
      var ol = ['kilo', 'bel'].concat(ekOlculer()).map(function (t) { var l = olcumler(t); if (!l.length) return ''; var s = l[l.length - 1], i = l.filter(function (x) { return x.g < bas; }).pop(); return OLCU[t][0] + ' ' + f(s.v, 1) + ' ' + OLCU[t][1] + ' (' + tk(s.g) + (i ? ', dönem başına göre ' + isaret(s.v - i.v, 1) : '') + ')'; }).filter(Boolean);
      var hkg = hedefKilo(); if (hkg != null) ol.push('hedef kilo ' + f(hkg, hkg % 1 ? 1 : 0) + ' kg');
      if (ol.length) sat.push('Ölçüler: ' + ol.join(', '));
    }
    sat.push('');
    gunler.forEach(function (d) {
      var x = gunDeger(d), p = [];
      if (x && a.beslenme && x.kcal != null) p.push(f(x.kcal) + ' kcal, ' + f(x.p) + ' g protein');
      if (x && a.gunluk) { if (x.su) p.push('su ' + f(x.su / 1000, 1) + ' L'); if (x.adim != null) p.push(f(x.adim) + ' adım'); }
      if (x && a.uyku && x.uyku) p.push('uyku ' + { '<6': '6 saatten az', '6-7': '6–7 saat', '7+': '7+ saat' }[x.uyku]);
      if (a.antrenman) { var ad = antDurum(d); if (ad && ad !== 'plan') p.push('antrenman: ' + ANT_D[ad][1].toLowerCase()); }
      sat.push(tk(d) + ' ' + GK[hg(d) - 1] + ': ' + (p.length ? p.join(', ') : 'kayıt yok'));
    });
    if (a.antrenman) {
      var har = hareketOzet(gunler); if (har.length) { sat.push(''); sat.push('Hareketler (en iyi tekrar): ' + har.map(function (x) { return x.ad + ' ' + (x.ilk === x.enIyi ? x.enIyi : x.ilk + '→' + x.enIyi) + (x.sure ? ' sn' : ''); }).join(', ')); }
    }
    if (a.agri) {
      var nl = notlar(gunler); if (nl.length) { sat.push(''); nl.forEach(function (n) { sat.push('Ağrı notu: ' + ilkHarfBuyuk(n.bolge) + (n.taraf && n.taraf !== 'yok' ? ' ' + n.taraf : '') + ' (' + n.tur + '), ' + tk(n.acilis) + (n.durum === 'geçti' ? ', geçti' : ', şiddet ' + n.siddet + ' → ' + notSiddet(n))); }); }
    }
    return sat.join('\n');
  }
  function paylas() {
    function icerik() {
      var m = paylasMetni();
      return '<div class="cipler il-p-cip">' + [[7, 'Son 7 gün'], [30, 'Son 30 gün']].map(function (x) { return '<button class="cip' + (PY.gun === x[0] ? ' secili' : '') + '" aria-pressed="' + (PY.gun === x[0]) + '" data-py-gun="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        '<div class="bolum-baslik">Neler girsin</div><ul class="il-duzen-liste">' + PY_AD.map(function (x, i) { return '<li><span id="py' + i + '">' + x[1] + '</span><button class="anahtar" role="switch" aria-checked="' + !!PY.ac[x[0]] + '" aria-labelledby="py' + i + '" data-py-ac="' + x[0] + '"><span></span></button></li>'; }).join('') + '</ul>' +
        '<div class="bolum-baslik">Önizleme</div><div class="il-onizleme">' + m.split('\n').map(function (x) { return '<div>' + (x ? esc(x) : '&nbsp;') + '</div>'; }).join('') + '</div>' +
        '<p class="il-uyari">' + ik('info-circle') + '<span>Yapay zekâ yanılabilir; sağlık kararını uzmana danış.</span></p>' +
        '<div class="alt-dugme il-iki-dugme"><button class="' + (navigator.share ? 'ikinci-dugme' : 'ana-dugme') + '" id="py-kopyala">' + ik('copy') + 'Kopyala</button>' + (navigator.share ? '<button class="ana-dugme" id="py-paylas">' + ik('share') + 'Paylaş</button>' : '') + '</div>';
    }
    function kopyala(m) {
      var bitti = function () { Z.titret(); Z.bildir('✅ Özet kopyalandı'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(m).then(bitti, function () { eskiKopya(m); bitti(); });
      else { eskiKopya(m); bitti(); }
    }
    function eskiKopya(m) { var t = document.createElement('textarea'); t.value = m; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { /* yok */ } document.body.removeChild(t); }
    function bagla2(p) {
      p.querySelectorAll('[data-py-gun]').forEach(function (b) { b.onclick = function () { PY.gun = +b.getAttribute('data-py-gun'); Z.pencereIcerik(icerik(), bagla2, true); }; });
      p.querySelectorAll('[data-py-ac]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-py-ac'); PY.ac[k] = PY.ac[k] ? 0 : 1; Z.pencereIcerik(icerik(), bagla2, true); }; });
      $('#py-kopyala').onclick = function () { kopyala(paylasMetni()); };
      var s = $('#py-paylas'); if (s) s.onclick = function () { navigator.share({ title: 'Zindem özeti', text: paylasMetni() }).catch(function () { /* vazgeçildi */ }); };
    }
    Z.pencereAc('Verileri paylaş', icerik(), bagla2);
  }

  /* ---------- Kartları düzenle ---------- */
  function kartDuzenle() {
    function icerik() {
      var gz = gizli();
      return '<ul class="il-duzen-liste">' + KARTLAR.map(function (x, i) { return '<li><span class="il-lk il-' + (x[0] === 'beslenme' ? 'kalori' : x[0]) + '" aria-hidden="true">' + ik(x[1], x[1] === 'barbell' ? 'capraz' : '') + '</span><span id="kd' + i + '">' + x[2] + '</span><button class="anahtar" role="switch" aria-checked="' + (gz.indexOf(x[0]) < 0) + '" aria-labelledby="kd' + i + '" data-kd="' + x[0] + '"><span></span></button></li>'; }).join('') + '</ul>' +
        '<div class="alt-dugme"><button class="ana-dugme" id="kd-tamam">' + ik('check') + 'Tamam</button></div>';
    }
    function bagla2(p) {
      p.querySelectorAll('[data-kd]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-kd'), gz = gizli(), i = gz.indexOf(k); if (i < 0) gz.push(k); else gz.splice(i, 1); Z.ayarYaz('il_gizli', gz.join(',')); Z.pencereIcerik(icerik(), bagla2, true); }; });
      $('#kd-tamam').onclick = function () { Z.pencereKapat(); Z.ciz(); };
    }
    Z.pencereAc('Kartları düzenle', icerik(), bagla2, true);
  }

  return { ciz: ciz, yukle: yukle, uygula: uygula, sifirla: function () { I.veri = null; } };
};
