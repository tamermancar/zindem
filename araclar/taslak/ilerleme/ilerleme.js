/* İlerleme taslağı (05 - İlerleme): herkes için baştan sona yolculuk. Gerçek uygulamanın içine genel örnek veriyle çizilir.
   Örnek kullanıcı: 1 Eylül'de başlamış, kilo + bel girmiş, hedef kilo koymuş. Kişisel veri yok. */
window.TI = (function () {
  const ik = (n, c) => '<svg class="ikon ' + (c || '') + '" aria-hidden="true"><use href="#t-' + n + '"/></svg>';
  const $ = s => document.querySelector(s);
  const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const AYK = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const GK = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const BUGUN = '2026-11-20';
  const f = (n, o) => isFinite(n) ? Number(n).toLocaleString('tr-TR', { minimumFractionDigits: o || 0, maximumFractionDigits: o || 0 }) : '—';
  const isaret = (n, o) => (n > 0 ? '+' : n < 0 ? '−' : '') + f(Math.abs(n), o);

  /* ---------- Taslak için yeni Tabler simgeleri (kodda index.html simge listesine eklenecek) ---------- */
  const YENI = __IKONLAR__;
  (function () {
    const ilk = document.querySelector('svg symbol'); if (!ilk) return;
    Object.keys(YENI).forEach(k => { if (document.getElementById('t-' + k)) return;
      ilk.parentNode.insertAdjacentHTML('beforeend', '<symbol id="t-' + k + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + YENI[k] + '</symbol>'); });
  })();

  /* ---------- Örnek veri (sabit tohumlu) ---------- */
  let tohum = 7; const rnd = () => (tohum = (tohum * 16807) % 2147483647) / 2147483647;
  const gk = (g, n) => { const p = g.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const hg = g => { const p = g.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]).getDay(); return d === 0 ? 7 : d; };
  const HEDEF = { kcal: 2000, p: 120, su: 2500, adim: 8000, kilo: 78 };
  const V = { gun: {}, olcum: [], ant: {}, agri: [] };
  (function uret() {
    let g = '2026-09-01', i = 0;
    while (g <= BUGUN) {
      const bos = rnd() < .05;
      if (!bos) V.gun[g] = {
        kcal: Math.round(1560 + rnd() * 600 + (hg(g) >= 6 ? 150 : 0)), p: Math.round(92 + rnd() * 48), su: Math.round((1500 + rnd() * 1500) / 50) * 50,
        adim: Math.round(3500 + rnd() * 7500), uyku: ['<6', '6-7', '7+', '7+', '6-7', '7+'][Math.floor(rnd() * 6)]
      };
      if ([1, 4, 6].includes(hg(g)) && rnd() > .12) V.olcum.push({ g, tur: 'kilo', v: Math.round((84 - i * 2.6 / 80 + (rnd() - .5) * 1.2) * 10) / 10 });
      if (hg(g) === 1 && i % 14 < 7) V.olcum.push({ g, tur: 'bel', v: Math.round((96 - i * 2.5 / 80 + (rnd() - .5) * .6) * 2) / 2 });
      if ([1, 3, 5].includes(hg(g)) && g < BUGUN) {
        const r = rnd(); V.ant[g] = r < .72 ? 'tamam' : r < .8 ? 'kisa' : r < .88 ? 'yarim' : r < .93 ? 'kaydirildi' : 'yapilmadi';
      }
      g = gk(g, 1); i++;
    }
    V.ant['2026-11-20'] = 'plan'; V.ant['2026-11-16'] = 'tamam'; V.ant['2026-11-18'] = 'yarim';
    V.agri = [
      { bolge: 'Diz', taraf: 'Sağ', tur: 'Antrenman kaynaklı', acilis: '2026-11-17', takip: [['2026-11-17', 5], ['2026-11-18', 4], ['2026-11-19', 3]], durum: 'açık' },
      { bolge: 'Bel', taraf: '', tur: 'Günlük hayat', acilis: '2026-10-20', takip: [['2026-10-20', 4], ['2026-10-22', 2], ['2026-10-24', 1]], durum: 'geçti', kapanis: '2026-10-24' }
    ];
  })();
  const kilolar = () => V.olcum.filter(o => o.tur === 'kilo');
  const beller = () => V.olcum.filter(o => o.tur === 'bel');
  // Eğilim: üstel hareketli ortalama (her ölçüm bir önceki eğilime %25 ağırlıkla katılır)
  function egilim(l) { let e = null; return l.map(o => (e = e == null ? o.v : e + .25 * (o.v - e), { g: o.g, v: Math.round(e * 10) / 10 })); }

  /* ---------- Dönem ---------- */
  const D = { tur: 'hafta' };
  function donemGunleri(tur, ref) {
    ref = ref || BUGUN; const l = [];
    if (tur === 'hafta') { const bas = gk(ref, 1 - hg(ref)); for (let i = 0; i < 7; i++) l.push(gk(bas, i)); }
    else if (tur === 'ay') { const p = ref.split('-'), son = new Date(+p[0], +p[1], 0).getDate(); for (let i = 1; i <= son; i++) l.push(p[0] + '-' + p[1] + '-' + String(i).padStart(2, '0')); }
    else if (tur === '3ay') { let g = gk(ref, -90); g = gk(g, 1 - hg(g)); while (g <= gk(ref, 7 - hg(ref))) { l.push(g); g = gk(g, 1); } }
    else { for (let i = 1; i <= 12; i++) { const p = ref.slice(0, 4) + '-' + String(i).padStart(2, '0'); const son = new Date(+ref.slice(0, 4), i, 0).getDate(); for (let j = 1; j <= son; j++) l.push(p + '-' + String(j).padStart(2, '0')); } }
    return l;
  }
  const tk = g => { const p = g.split('-'); return +p[2] + ' ' + AY[+p[1] - 1]; };
  function donemAdi(tur, ref) {
    ref = ref || BUGUN; const l = donemGunleri(tur, ref), a = l[0], b = l[l.length - 1];
    if (tur === 'hafta') return a.slice(5, 7) === b.slice(5, 7) ? (+a.slice(8)) + ' – ' + tk(b) : tk(a) + ' – ' + tk(b);
    if (tur === 'ay') return AY[+ref.slice(5, 7) - 1] + ' ' + ref.slice(0, 4);
    if (tur === '3ay') return AYK[+a.slice(5, 7) - 1] + ' – ' + AYK[+b.slice(5, 7) - 1] + ' ' + b.slice(0, 4);
    return ref.slice(0, 4);
  }
  // Grafik dilimleri: hafta/ay = gün, 3 ay = hafta, yıl = ay
  function dilimler(tur, ref) {
    const l = donemGunleri(tur, ref);
    if (tur === 'hafta' || tur === 'ay') return l.map((g, i) => ({ ad: tur === 'hafta' ? GK[i] : (+g.slice(8) % 5 === 1 || l.length - 1 === i ? String(+g.slice(8)) : ''), gunler: [g], uzun: tk(g) }));
    if (tur === '3ay') { const d = []; for (let i = 0; i < l.length; i += 7) { const w = l.slice(i, i + 7); d.push({ ad: i % 28 === 0 ? (+w[0].slice(8)) + ' ' + AYK[+w[0].slice(5, 7) - 1] : '', gunler: w, uzun: tk(w[0]) + ' haftası' }); } return d; }
    const d = []; for (let m = 0; m < 12; m++) { const w = l.filter(g => +g.slice(5, 7) === m + 1); d.push({ ad: AYK[m], gunler: w, uzun: AY[m] }); } return d;
  }
  const ort = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
  function deger(dl, k) { const v = dl.gunler.filter(g => g <= BUGUN && V.gun[g]).map(g => V.gun[g][k]); return v.length ? ort(v) : null; }
  function ozet(tur, k, ref) { const gl = donemGunleri(tur, ref).filter(g => g <= BUGUN && V.gun[g]); const v = gl.map(g => V.gun[g][k]); return { ort: ort(v), gun: gl.length, hedefte: gl.filter(g => k === 'kcal' ? V.gun[g][k] <= HEDEF[k] : V.gun[g][k] >= HEDEF[k]).length }; }

  /* ---------- Grafikler (SVG, genişlik çizimden sonra ölçülür) ---------- */
  const G = {}; let gs = 0;
  function yer(fn, yuk, etiket) { const id = 'g' + (++gs); G[id] = fn; return '<div class="il-grafik" data-g="' + id + '" style="height:' + yuk + 'px" role="img" aria-label="' + etiket + '"></div>'; }
  function grafikleriCiz() { document.querySelectorAll('[data-g]').forEach(el => { const fn = G[el.dataset.g]; if (fn) el.innerHTML = fn(el.clientWidth, el.clientHeight); }); }
  const temiz = (enb, adet) => { const ham = enb / adet, us = Math.pow(10, Math.floor(Math.log10(ham))), a = [1, 2, 2.5, 5, 10].find(x => x * us >= ham) * us; return a; };
  // Çubuk grafik: hedef çizgisi, aşan/ulaşan çubuk başka renk, seçili çubukta açıklama kutusu
  function cubuk(dl, k, o) {
    o = o || {};
    return (W, H) => {
      const alt = 20, ust = o.secili != null ? 34 : 8, sol = 0, sag = k === 'adim' ? 46 : k === 'kcal' ? 42 : 34, gW = W - sol - sag, gH = H - alt - ust;
      const vals = dl.map(d => deger(d, k));
      const enb = Math.max(HEDEF[k] * 1.15, ...vals.filter(v => v != null));
      const adim = temiz(enb, 3), tavan = Math.ceil(enb / adim) * adim;
      const y = v => ust + gH - v / tavan * gH, bw = Math.min(24, gW / dl.length * .62), aral = gW / dl.length;
      let s = '<svg width="' + W + '" height="' + H + '" aria-hidden="true">';
      for (let t = 0; t <= tavan; t += adim) s += '<line class="il-izgara" x1="0" x2="' + gW + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="il-eksen" x="' + (W - 2) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + kisa(t, k) + '</text>';
      dl.forEach((d, i) => {
        const v = vals[i], x = sol + i * aral + (aral - bw) / 2;
        if (v != null) {
          const h = Math.max(2, gH - (y(v) - ust)), as = k === 'kcal' ? v > HEDEF[k] : v >= HEDEF[k];
          const r = Math.min(4, bw / 2), yy = y(v);
          s += '<path class="il-cubuk ' + k + (as ? ' hedef-' + (k === 'kcal' ? 'asti' : 'tamam') : '') + (o.secili != null && o.secili !== i ? ' soluk' : '') + '" d="M' + x + ' ' + (ust + gH) + 'V' + (yy + r) + 'q0 -' + r + ' ' + r + ' -' + r + 'h' + (bw - 2 * r) + 'q' + r + ' 0 ' + r + ' ' + r + 'V' + (ust + gH) + 'z"/>';
        } else if (d.gunler[0] <= BUGUN && dl.length <= 31) s += '<circle class="il-bos-nokta" cx="' + (x + bw / 2) + '" cy="' + (ust + gH - 3) + '" r="2"/>';
        if (d.ad) s += '<text class="il-eksen' + (d.gunler.includes(BUGUN) && dl.length <= 7 ? ' bugun' : '') + '" x="' + (x + bw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + d.ad + '</text>';
      });
      s += '<line class="il-hedef ' + k + '" x1="0" x2="' + gW + '" y1="' + y(HEDEF[k]) + '" y2="' + y(HEDEF[k]) + '"/>';
      if (o.secili != null) {
        const i = o.secili, v = vals[i], cx = sol + i * aral + aral / 2, metin = dl[i].uzun + ' · ' + f(v) + ' ' + birim(k), w = metin.length * 6.6 + 16;
        const bx = Math.max(0, Math.min(gW - w, cx - w / 2));
        s += '<line class="il-imlec" x1="' + cx + '" x2="' + cx + '" y1="26" y2="' + y(v) + '"/><rect class="il-ipucu" x="' + bx + '" y="2" width="' + w + '" height="24" rx="8"/><text class="il-ipucu-yazi" x="' + (bx + w / 2) + '" y="18" text-anchor="middle">' + metin + '</text>';
      }
      return s + '</svg>';
    };
  }
  const birim = k => ({ kcal: 'kcal', p: 'g', su: 'ml', adim: 'adım' })[k];
  const kisa = (t, k) => k === 'su' ? f(t / 1000, t % 1000 ? 1 : 0) + ' L' : f(t);
  // Kilo/bel çizgisi: ölçümler nokta (soluk), eğilim 2 px çizgi, hedef ince çizgi
  function cizgi(tur, gunler, o) {
    o = o || {};
    return (W, H) => {
      const l = (tur === 'kilo' ? kilolar() : beller()), e = egilim(l);
      const a = gunler[0], b = gunler[gunler.length - 1];
      const ic = l.filter(x => x.g >= a && x.g <= b), ice = e.filter(x => x.g >= a && x.g <= b);
      if (!ic.length) return '<p class="il-grafik-bos">Bu dönemde ölçüm yok</p>';
      const hedef = tur === 'kilo' && o.hedef !== false ? HEDEF.kilo : null;
      let enk = Math.min(...ic.map(x => x.v)), enb = Math.max(...ic.map(x => x.v)); if (hedef) enk = Math.min(enk, hedef);
      const adim = temiz((enb - enk) || 1, 3), taban = Math.floor(enk / adim) * adim, tavan = Math.ceil(enb / adim) * adim + (Math.ceil(enb / adim) * adim === enb ? adim * 0 : 0);
      const alt = 20, ust = 8, sag = 36, gW = W - sag, gH = H - alt - ust, gs2 = gunler.length - 1 || 1;
      const x = g => gunler.indexOf(g) / gs2 * gW, y = v => ust + gH - (v - taban) / ((tavan - taban) || 1) * gH;
      let s = '<svg width="' + W + '" height="' + H + '" aria-hidden="true">';
      for (let t = taban; t <= tavan + 1e-9; t += adim) s += '<line class="il-izgara" x1="0" x2="' + gW + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="il-eksen" x="' + (W - 2) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + f(t, adim < 1 ? 1 : 0) + '</text>';
      if (hedef) s += '<line class="il-hedef kilo" x1="0" x2="' + gW + '" y1="' + y(hedef) + '" y2="' + y(hedef) + '"/><text class="il-hedef-yazi" x="4" y="' + (y(hedef) - 5) + '">Hedef ' + f(hedef) + '</text>';
      ic.forEach(p => { s += '<circle class="il-olcum" cx="' + x(p.g) + '" cy="' + y(p.v) + '" r="' + (gunler.length > 120 ? 2.5 : 4) + '"/>'; });
      s += '<path class="il-egilim ' + tur + '" d="' + ice.map((p, i) => (i ? 'L' : 'M') + x(p.g).toFixed(1) + ' ' + y(p.v).toFixed(1)).join('') + '"/>';
      const son = ice[ice.length - 1]; s += '<circle class="il-son ' + tur + '" cx="' + x(son.g) + '" cy="' + y(son.v) + '" r="5"/>';
      const etk = o.etiketler || [[a, tk(a)], [b, tk(b)]];
      etk.forEach(([g, t], i) => { s += '<text class="il-eksen" x="' + (i === 0 ? 0 : i === etk.length - 1 ? gW : x(g)) + '" y="' + (H - 4) + '" text-anchor="' + (i === 0 ? 'start' : i === etk.length - 1 ? 'end' : 'middle') + '">' + t + '</text>'; });
      return s + '</svg>';
    };
  }

  /* ---------- Çerçeve ---------- */
  function menu() {
    document.querySelectorAll('.alt-menu .sekme').forEach(b => { b.classList.remove('acik'); b.removeAttribute('aria-current'); const u = b.querySelector('use'); u.setAttribute('href', u.getAttribute('href').replace('-dolu', '')); });
    const a = document.querySelector('.alt-menu [aria-label^="İlerleme"]');
    a.classList.add('acik'); a.setAttribute('aria-current', 'page'); a.setAttribute('aria-label', 'İlerleme'); a.querySelector('use').setAttribute('href', '#t-chart-area-line-dolu');
  }
  const TURLER = [['hafta', 'Hafta'], ['ay', 'Ay'], ['3ay', '3 Ay'], ['yil', 'Yıl']];
  function ust(tur, ref, bosMu) {
    let h = '<div class="m-ust"><header class="ekran-ust"><h1>İlerleme</h1>' + '' + '</header>';
    if (!bosMu) {
      h += '<div class="grup-cipler m-sekmeler" role="tablist" aria-label="Dönem">' + TURLER.map(x => '<button class="sekme-ciz' + (x[0] === tur ? ' secili' : '') + '" role="tab" aria-selected="' + (x[0] === tur) + '">' + x[1] + '</button>').join('') + '</div>' +
        '<div class="il-gezgin"><button class="tn-ok" aria-label="Önceki dönem">' + ik('chevron-left') + '</button><b>' + donemAdi(tur, ref) + '</b>' +
        '<button class="tn-ok" aria-label="Sonraki dönem"' + ((ref || BUGUN) >= BUGUN.slice(0, 7) && (!ref || ref === BUGUN) ? ' disabled' : '') + '>' + ik('chevron-right') + '</button></div>';
    }
    return h + '</div>';
  }
  function ciz(h) { $('#uygulama').innerHTML = h; menu(); window.scrollTo(0, 0); grafikleriCiz(); }
  function pencere(baslik, ic, o) {
    o = o || {};
    const p = $('#pencere'); p.classList.toggle('sabit', !o.kucuk);
    p.innerHTML = '<div class="pencere-bas"><div class="tutamac" aria-hidden="true"></div>' + (o.geri ? '<button class="metin-dugme vurgu il-geri">' + ik('chevron-left') + o.geri + '</button>' : '') +
      '<div class="pencere-ust"><h2 id="pencere-baslik">' + baslik + '</h2><button class="kapat" aria-label="Kapat">' + ik('x') + '</button></div>' + (o.bas || '') + '</div><div id="pencere-ic">' + ic + '</div>';
    p.hidden = false; $('#perde').hidden = false; document.body.style.overflow = 'hidden'; p.scrollTop = 0; grafikleriCiz();
  }
  function kapat() { $('#pencere').hidden = true; $('#perde').hidden = true; document.body.style.overflow = ''; }
  const kartBas = (ikon, tur, baslik, sag) => '<div class="il-kart-bas"><span class="il-lk il-' + tur + '" aria-hidden="true">' + ik(ikon) + '</span><h2>' + baslik + '</h2>' + (sag || '<span class="il-ok" aria-hidden="true">' + ik('chevron-right') + '</span>') + '</div>';
  const deger2 = (v, b, alt) => '<p class="il-deger"><b>' + v + '</b> <span>' + b + '</span>' + (alt ? '<small>' + alt + '</small>' : '') + '</p>';
  const dipnot = (ikon, sinif, yazi) => '<p class="il-dip ' + sinif + '">' + ik(ikon) + '<span>' + yazi + '</span></p>';

  /* ---------- Kartlar ---------- */
  function kiloKarti(tur, ref) {
    const gl = donemGunleri(tur, ref), sonGun = gl[gl.length - 1] < BUGUN ? gl[gl.length - 1] : BUGUN, e = egilim(kilolar()).filter(x => x.g <= sonGun), son = e[e.length - 1], ilk = kilolar()[0];
    const once = e.filter(x => x.g < gl[0]).pop() || e[0], fark = son.v - once.v, son30 = []; for (let i = 29; i >= 0; i--) son30.push(gk(BUGUN, -i));
    const bel = beller().filter(x => x.g <= sonGun), bs = bel[bel.length - 1], bi = beller()[0];
    return '<section class="kart il-kart" aria-label="Kilo ve bel">' + kartBas('weight', 'kilo', 'Kilo ve bel', '<button class="il-ekle" aria-label="Ölçüm ekle">' + ik('plus') + 'Ölçüm</button>') +
      '<div class="il-iki"><div>' + deger2(f(son.v, 1), 'kg', 'eğilim · bu dönem ' + isaret(fark, 1) + ' kg') + '</div>' +
      '<div class="il-hedef-kutu"><small>Hedef</small><b>' + f(HEDEF.kilo) + ' kg</b><small>kalan ' + f(son.v - HEDEF.kilo, 1) + '</small></div></div>' +
      yer(cizgi('kilo', tur === 'hafta' ? son30 : tur === 'yil' ? gl.filter(g => g <= BUGUN) : gl, { etiketler: tur === 'yil' ? [['2026-01-01', 'Oca'], ['2026-11-20', 'Kas']] : null }), 128, 'Kilo eğilimi grafiği. Son eğilim ' + f(son.v, 1) + ' kilogram') +
      (tur === 'hafta' ? '<p class="il-grafik-not">Grafikte son 30 gün</p>' : '') +
      '<div class="il-satirlar"><div class="il-satir"><span>' + ik('ruler-measure') + 'Bel</span><b>' + f(bs.v, 1) + ' cm</b><small>başlangıçtan ' + isaret(bs.v - bi.v, 1) + '</small></div>' +
      '<div class="il-satir"><span>' + ik('flag') + 'Başlangıç</span><b>' + f(ilk.v, 1) + ' kg</b><small>' + tk(ilk.g) + '</small></div></div></section>';
  }
  function beslenmeKarti(tur, ref) {
    const dl = dilimler(tur, ref), k = ozet(tur, 'kcal', ref), p = ozet(tur, 'p', ref), gun = k.gun;
    return '<section class="kart il-kart" aria-label="Kalori ve protein">' + kartBas('flame', 'kalori', 'Kalori ve protein') +
      '<div class="il-iki"><div>' + deger2(f(k.ort), 'kcal', 'ortalama · sınır ' + f(HEDEF.kcal)) + '</div><div>' + deger2(f(p.ort), 'g protein', 'ortalama · hedef ' + f(HEDEF.p)) + '</div></div>' +
      '<div class="il-etiket-satir"><span><i class="il-anahtar kcal"></i>Kalori</span></div>' +
      yer(cubuk(dl, 'kcal'), 112, 'Günlük kalori çubuk grafiği, ortalama ' + f(k.ort) + ' kilokalori') +
      '<div class="il-etiket-satir"><span><i class="il-anahtar p"></i>Protein</span></div>' +
      yer(cubuk(dl, 'p'), 112, 'Günlük protein çubuk grafiği, ortalama ' + f(p.ort) + ' gram') +
      '<div class="il-dipler">' + dipnot('circle-check', 'ok', 'Kalori sınırında <b>' + k.hedefte + ' / ' + gun + '</b> gün') + dipnot('circle-check', 'ok', 'Protein hedefinde <b>' + p.hedefte + ' / ' + gun + '</b> gün') + '</div></section>';
  }
  function tekKart(k, ikon, tur, baslik, ref, dtur) {
    const dl = dilimler(dtur, ref), o = ozet(dtur, k, ref);
    const v = k === 'su' ? f(o.ort / 1000, 1) : f(o.ort), b = k === 'su' ? 'L' : 'adım', h = k === 'su' ? f(HEDEF.su / 1000, 1) + ' L' : f(HEDEF.adim);
    return '<section class="kart il-kart" aria-label="' + baslik + '">' + kartBas(ikon, tur, baslik) + deger2(v, b, 'günlük ortalama · hedef ' + h) +
      yer(cubuk(dl, k), 104, baslik + ' çubuk grafiği') + '<div class="il-dipler">' + dipnot('circle-check', 'ok', 'Hedefte <b>' + o.hedefte + ' / ' + o.gun + '</b> gün') + '</div></section>';
  }
  function uykuKarti(tur, ref) {
    const gl = donemGunleri(tur, ref).filter(g => g <= BUGUN && V.gun[g] && V.gun[g].uyku);
    const say = { '7+': 0, '6-7': 0, '<6': 0 }; gl.forEach(g => say[V.gun[g].uyku]++);
    const n = gl.length, parca = [['7+', '7 saat ve üstü', 'u3'], ['6-7', '6–7 saat', 'u2'], ['<6', '6 saatten az', 'u1']];
    return '<section class="kart il-kart" aria-label="Uyku">' + kartBas('moon', 'uyku', 'Uyku') +
      deger2(f(say['7+']), '/ ' + n + ' gece', '7 saat ve üstü uyudun') +
      '<div class="il-parcali" role="img" aria-label="' + parca.map(p => p[1] + ' ' + say[p[0]] + ' gece').join(', ') + '">' + parca.map(p => say[p[0]] ? '<span class="' + p[2] + '" style="flex:' + say[p[0]] + '"></span>' : '').join('') + '</div>' +
      '<ul class="il-lejant">' + parca.map(p => '<li><i class="' + p[2] + '"></i>' + p[1] + '<b>' + say[p[0]] + '</b></li>').join('') + '</ul></section>';
  }
  const ANT_D = { tamam: ['circle-check', 'Tamamlandı'], kisa: ['clock', 'Kısa yapıldı'], yarim: ['circle-half-2', 'Yarım kaldı'], kaydirildi: ['arrow-forward-up', 'Yarına kaydırıldı'], yapilmadi: ['circle-x', 'Yapılmadı'], plan: ['circle-dashed', 'Planlı'] };
  function antKarti(tur, ref) {
    const gl = donemGunleri(tur, ref), planli = gl.filter(g => V.ant[g]), yap = planli.filter(g => /tamam|kisa|yarim/.test(V.ant[g]));
    let ic = '';
    if (tur === 'hafta') ic = '<ol class="il-hafta-gun">' + gl.map((g, i) => { const d = V.ant[g]; return '<li><small>' + GK[i] + '</small><span class="il-ag ' + (d || 'yok') + '" aria-label="' + GK[i] + ': ' + (d ? ANT_D[d][1] : 'Dinlenme') + '">' + (d ? ik(ANT_D[d][0]) : '') + '</span></li>'; }).join('') + '</ol>';
    else if (tur === 'ay') { const bas = gk(gl[0], 1 - hg(gl[0])); ic = '<div class="il-ay-izgara" role="img" aria-label="Ayın antrenman günleri">' + GK.map(x => '<small>' + x + '</small>').join('');
      for (let g = bas; g <= gl[gl.length - 1] || hg(g) !== 1; g = gk(g, 1)) { const d = V.ant[g], ic2 = g.slice(0, 7) === gl[0].slice(0, 7); ic += '<i class="' + (ic2 ? (d || (g > BUGUN ? 'gelecek' : 'yok')) : 'dis') + '"></i>'; }
      ic += '</div>'; }
    else ic = yer(antIsi(gl), tur === 'yil' ? 56 : 84, 'Antrenman günleri ısı şeridi');
    const set = yap.length * 14 - planli.filter(g => V.ant[g] === 'yarim').length * 5;
    return '<section class="kart il-kart" aria-label="Antrenman">' + kartBas('barbell', 'antrenman', 'Antrenman') +
      '<div class="il-iki"><div>' + deger2(yap.length + ' / ' + planli.filter(g => g <= BUGUN && V.ant[g] !== 'plan').length, 'gün', 'yapılan / planlı') + '</div><div>' + deger2(f(set), 'set', 'toplam') + '</div></div>' + ic +
      '<ul class="il-lejant">' + ['tamam', 'kisa', 'yarim', 'yapilmadi', 'plan'].filter(d => tur === 'hafta' || d !== 'plan').map(d => '<li>' + (tur === 'hafta' ? '<span class="il-ag kucuk ' + d + '">' + ik(ANT_D[d][0]) + '</span>' : '<i class="il-kare-l ' + d + '"></i>') + ANT_D[d][1] + '</li>').join('') + '</ul></section>';
  }
  // Ay/3 ay/yıl: her hafta bir sütun, her gün bir kare (GitHub katkı şeridi gibi)
  function antIsi(gl) {
    return (W, H) => {
      const bas = gk(gl[0], 1 - hg(gl[0])), hafta = Math.ceil((gl.length + hg(gl[0]) - 1) / 7);
      const ara = W / hafta, kare = ara - (hafta > 30 ? 1 : 3), kH = (H - 6) / 7;
      let s = '<svg width="' + W + '" height="' + H + '" aria-hidden="true">';
      for (let w = 0; w < hafta; w++) for (let d = 0; d < 7; d++) {
        const g = gk(bas, w * 7 + d); if (g < gl[0] || g > gl[gl.length - 1]) continue;
        const durum = V.ant[g] || (g > BUGUN ? 'gelecek' : 'yok');
        s += '<rect class="il-kare ' + durum + '" x="' + (w * ara) + '" y="' + (d * (kH + 1)) + '" width="' + kare + '" height="' + (kH - 1) + '" rx="2"/>';
      }
      return s + '</svg>';
    };
  }
  function agriKarti(tur, ref) {
    const gl = donemGunleri(tur, ref), l = V.agri.filter(a => a.takip.some(t => t[0] >= gl[0] && t[0] <= gl[gl.length - 1]) || (a.durum === 'açık'));
    const ac = l.filter(a => a.durum === 'açık').length;
    return '<section class="kart il-kart" aria-label="Ağrı ve sağlık notları">' + kartBas('bandage', 'agri', 'Ağrı ve sağlık notları') +
      (l.length ? deger2(String(ac), 'açık not', l.length - ac ? (l.length - ac) + ' not geçti' : '') + '<ul class="il-agri-liste">' + l.map(agriSatir).join('') + '</ul>' : '<p class="il-bos-satir">Bu dönemde not yok</p>') + '</section>';
  }
  function agriSatir(a) {
    const s = a.takip[a.takip.length - 1][1], ilk = a.takip[0][1], kad = s >= 7 ? 'kirmizi' : s >= 5 ? 'turuncu' : s >= 3 ? 'sari' : 'yesil';
    return '<li><i class="il-siddet ' + kad + '" aria-hidden="true"></i><span><b>' + a.bolge + (a.taraf ? ' · ' + a.taraf : '') + '</b><small>' + a.tur + ' · ' + tk(a.acilis) + (a.durum === 'geçti' ? ' – ' + tk(a.kapanis) : '') + '</small></span>' +
      '<em>' + (a.durum === 'geçti' ? 'Geçti' : ilk + ' → ' + s) + '</em></li>';
  }
  function sorKarti() {
    return '<button class="kart il-sor"><span class="il-lk il-sor-ikon" aria-hidden="true">' + ik('message-chatbot') + '</span><span><b>Claude\'a sor</b><small>Son 7 günün özeti kopyalanır</small></span>' + ik('copy') + '</button>' +
      '<button class="metin-dugme il-duzenle">' + ik('adjustments-horizontal') + 'Kartları düzenle</button>';
  }
  function aylikOzetKarti() {
    const ref = '2026-10-15', k = ozet('ay', 'kcal', ref), p = ozet('ay', 'p', ref), a = donemGunleri('ay', ref).filter(g => /tamam|kisa|yarim/.test(V.ant[g] || '')).length;
    const e = egilim(kilolar()), ilk = e.filter(x => x.g < '2026-10-01').pop(), son = e.filter(x => x.g <= '2026-10-31').pop();
    return '<section class="kart il-ay-kart"><div class="il-ay-bas"><span class="il-lk il-kilo" aria-hidden="true">' + ik('calendar-event') + '</span><span><b>Ekim özetin hazır</b><small>1 – 31 Ekim</small></span><button class="kapat kucuk" aria-label="Özeti kapat">' + ik('x') + '</button></div>' +
      '<ul class="il-ay-liste"><li><small>Kilo</small><b>' + isaret(son.v - ilk.v, 1) + ' kg</b></li><li><small>Kalori</small><b>' + f(k.ort) + '</b></li><li><small>Protein</small><b>' + f(p.ort) + ' g</b></li><li><small>Antrenman</small><b>' + a + ' gün</b></li></ul>' +
      '<button class="ikinci-dugme">Ekim\'i aç</button></section>';
  }
  function ekran(tur, ref, ek) {
    D.tur = tur;
    const dt = tur;
    ciz(ust(tur, ref) + (ek || '') + kiloKarti(tur, ref) + beslenmeKarti(tur, ref) + tekKart('su', 'droplet', 'su', 'Su', ref, dt) + tekKart('adim', 'footsteps', 'adim', 'Adım', ref, dt) +
      uykuKarti(tur, ref) + antKarti(tur, ref) + agriKarti(tur, ref) + (tur === 'yil' ? gecmisAylar() : '') + sorKarti());
  }
  function gecmisAylar() {
    return '<div class="bolum-baslik">Geçmiş aylar</div><section class="kart il-liste-kart">' + ['2026-11-15', '2026-10-15', '2026-09-15'].map(ref => {
      const k = ozet('ay', 'kcal', ref), a = donemGunleri('ay', ref).filter(g => /tamam|kisa|yarim/.test(V.ant[g] || '')).length;
      const e = egilim(kilolar()), m = ref.slice(0, 7), ilk = e.filter(x => x.g < m + '-01').pop() || e[0], son = e.filter(x => x.g.slice(0, 7) <= m).pop();
      return '<button class="il-ay-satir"><span><b>' + AY[+ref.slice(5, 7) - 1] + (ref.slice(0, 7) === BUGUN.slice(0, 7) ? ' · sürüyor' : '') + '</b><small>' + isaret(son.v - ilk.v, 1) + ' kg · ' + f(k.ort) + ' kcal · ' + a + ' antrenman</small></span>' + ik('chevron-right') + '</button>';
    }).join('') + '</section>';
  }

  /* ---------- 1. Boş durum ve ilk ölçüm ---------- */
  function bos() {
    const bosKart = (ikon, tur, baslik, yazi) => '<section class="kart il-kart il-kart-bos">' + kartBas(ikon, tur, baslik, '') + '<p class="il-bos-satir">' + yazi + '</p></section>';
    ciz(ust('hafta', null, true) +
      '<section class="kart il-basla"><span class="il-basla-ikon">' + ik('chart-area-line') + '</span><h2>Gidişatını burada göreceksin</h2>' +
      '<p>Kilonu ve belini gir. Diğerleri kayıt ekledikçe gelir.</p>' +
      '<button class="ana-dugme">' + ik('plus') + 'İlk ölçümünü gir</button><button class="metin-dugme orta">Şimdilik geç</button></section>' +
      bosKart('flame', 'kalori', 'Kalori ve protein', 'Öğün ekledikçe görünür') + bosKart('droplet', 'su', 'Su', 'Su ekledikçe görünür') +
      bosKart('barbell', 'antrenman', 'Antrenman', 'Antrenman yaptıkça görünür'));
  }
  function sayiAlani(id, etiket, alt, deger, b) {
    return '<div class="ayar-satir"><label for="' + id + '"><b>' + etiket + '</b>' + (alt ? '<small>' + alt + '</small>' : '') + '</label><span class="birimli"><input id="' + id + '" type="text" inputmode="decimal" value="' + deger + '" placeholder="—"><small>' + b + '</small></span></div>';
  }
  const tarih = (et, d) => '<div class="form-alan"><label>' + et + '</label><span class="tarih-kutu"><span class="tk-yazi">' + d + '</span>' + ik('calendar') + '</span></div>';
  function olcum(ilk) {
    pencere(ilk ? 'İlk ölçümün' : 'Ölçüm ekle', tarih('Tarih', '20 Kasım 2026 Cuma') +
      sayiAlani('o-kilo', 'Kilo', ilk ? '' : 'Son ölçüm 81,6 kg · 18 Kasım', ilk ? '' : '81,2', 'kg') +
      sayiAlani('o-bel', 'Bel çevresi', 'İsteğe bağlı', '', 'cm') +
      (ilk ? sayiAlani('o-hedef', 'Hedef kilo', 'İsteğe bağlı', '', 'kg') : '') +
      '<div class="alt-dugme"><button class="ana-dugme">' + ik('check') + 'Kaydet</button></div>');
  }

  /* ---------- Detay pencereleri ---------- */
  const ciplerP = (sec) => '<div class="cipler il-p-cip">' + TURLER.map(x => '<button class="cip' + (x[0] === sec ? ' secili' : '') + '" aria-pressed="' + (x[0] === sec) + '">' + x[1] + '</button>').join('') + '</div>';
  const sekmeP = (l, sec) => '<div class="grup-cipler" role="tablist">' + l.map((x, i) => '<button class="sekme-ciz' + (i === sec ? ' secili' : '') + '" role="tab" aria-selected="' + (i === sec) + '">' + x + '</button>').join('') + '</div>';
  const ucluk = l => '<div class="il-ucluk">' + l.map(x => '<div><small>' + x[0] + '</small><b>' + x[1] + '</b>' + (x[2] ? '<small>' + x[2] + '</small>' : '') + '</div>').join('') + '</div>';
  function kiloDetay() {
    const k = kilolar(), e = egilim(k), son = e[e.length - 1], gl = donemGunleri('3ay');
    const liste = k.slice().reverse().slice(0, 8).map((o, i, a) => { const onc = a[i + 1]; return '<li><span><b>' + f(o.v, 1) + ' kg</b><small>' + tk(o.g) + '</small></span><em>' + (onc ? isaret(o.v - onc.v, 1) : '') + '</em></li>'; }).join('');
    pencere('Kilo ve bel', ciplerP('3ay') + '<div class="il-gezgin pencerede"><button class="tn-ok" aria-label="Önceki dönem">' + ik('chevron-left') + '</button><b>' + donemAdi('3ay') + '</b><button class="tn-ok" disabled aria-label="Sonraki dönem">' + ik('chevron-right') + '</button></div>' + ucluk([['Başlangıç', f(k[0].v, 1) + ' kg', tk(k[0].g)], ['Şimdi', f(son.v, 1) + ' kg', 'eğilim'], ['Hedef', f(HEDEF.kilo) + ' kg', 'kalan ' + f(son.v - HEDEF.kilo, 1)]]) +
      yer(cizgi('kilo', gl.filter(g => g <= BUGUN), { etiketler: [['', 'Ağu'], ['2026-09-28', 'Eyl'], ['2026-10-26', 'Eki'], ['', 'Kas']] }), 180, 'Son 3 ayın kilo grafiği') +
      '<ul class="il-lejant"><li><i class="il-l-nokta"></i>Ölçüm</li><li><i class="il-l-cizgi"></i>Eğilim</li><li><i class="il-l-hedef"></i>Hedef</li></ul>' +
      '<button class="il-hedef-satir"><span>' + ik('target') + 'Hedef kilo</span><b>' + f(HEDEF.kilo) + ' kg</b>' + ik('chevron-right') + '</button>' +
      '<div class="bolum-baslik">Ölçümler</div><ul class="il-olcum-liste">' + liste + '</ul>' +
      '<div class="alt-dugme"><button class="ana-dugme">' + ik('plus') + 'Ölçüm ekle</button></div>', { bas: sekmeP(['Kilo', 'Bel'], 0) });
  }
  function kaloriDetay() {
    const dl = dilimler('hafta'), k = ozet('hafta', 'kcal'), vals = dl.map(d => deger(d, 'kcal')).filter(v => v != null);
    const gunler = donemGunleri('hafta').filter(g => g <= BUGUN).reverse();
    pencere('Kalori ve protein', ciplerP('hafta') + '<div class="il-gezgin pencerede"><button class="tn-ok" aria-label="Önceki dönem">' + ik('chevron-left') + '</button><b>' + donemAdi('hafta') + '</b><button class="tn-ok" disabled aria-label="Sonraki dönem">' + ik('chevron-right') + '</button></div>' +
      ucluk([['Ortalama', f(k.ort) + ' kcal'], ['En yüksek', f(Math.max(...vals)) + ' kcal'], ['Sınırda', k.hedefte + ' / ' + k.gun + ' gün']]) +
      yer(cubuk(dl, 'kcal', { secili: 2 }), 190, 'Bu haftanın kalori grafiği, Çarşamba seçili') +
      '<ul class="il-lejant"><li><i class="il-l-kcal"></i>Sınırın altında</li><li><i class="il-l-asti"></i>Sınırı aştı</li><li><i class="il-l-hedef kcal"></i>Sınır ' + f(HEDEF.kcal) + '</li></ul>' +
      '<div class="bolum-baslik">Günler</div><ul class="il-gun-liste">' + gunler.map(g => { const v = V.gun[g]; return '<li><button><span><b>' + tk(g) + '</b><small>' + GK[hg(g) - 1] + '</small></span>' + (v ? '<em' + (v.kcal > HEDEF.kcal ? ' class="asti"' : '') + '>' + f(v.kcal) + ' kcal</em><em class="p">' + f(v.p) + ' g</em>' : '<em class="yok">Kayıt yok</em>') + ik('chevron-right') + '</button></li>'; }).join('') + '</ul>',
      { bas: sekmeP(['Kalori', 'Protein'], 0) });
  }
  function antDetay() {
    const gl = donemGunleri('ay'), bas = gk(gl[0], 1 - hg(gl[0])), planli = gl.filter(g => V.ant[g] && g < BUGUN), yap = planli.filter(g => /tamam|kisa|yarim/.test(V.ant[g]));
    let tak = '<div class="il-takvim" role="grid" aria-label="Kasım antrenman takvimi">' + GK.map(x => '<small>' + x.slice(0, 2) + '</small>').join('');
    for (let i = 0; i < 35; i++) { const g = gk(bas, i), ic = g.slice(5, 7) === '11', d = V.ant[g]; tak += '<span class="' + (ic ? '' : 'dis') + (g === BUGUN ? ' bugun' : '') + '"' + (d ? ' aria-label="' + (+g.slice(8)) + ': ' + ANT_D[d][1] + '"' : '') + '>' + (d && ic ? '<i class="il-ag kucuk ' + d + '">' + ik(ANT_D[d][0]) + '</i>' : '') + '<b>' + (+g.slice(8)) + '</b></span>'; }
    tak += '</div>';
    const har = [['Eğimli şınav', '8', '12', 'Üst gövde'], ['Sandalyeye oturup kalkma', '10', '15', 'Bacak'], ['Kalça köprüsü', '10', '15', 'Kalça'], ['Masa altı çekiş', '6', '9', 'Sırt']];
    pencere('Antrenman', ciplerP('ay') + '<div class="il-gezgin pencerede"><button class="tn-ok" aria-label="Önceki ay">' + ik('chevron-left') + '</button><b>Kasım 2026</b><button class="tn-ok" disabled aria-label="Sonraki ay">' + ik('chevron-right') + '</button></div>' +
      ucluk([['Yapılan', yap.length + ' / ' + planli.length + ' gün'], ['Kısa', planli.filter(g => V.ant[g] === 'kisa').length + ' gün'], ['Yarım', planli.filter(g => V.ant[g] === 'yarim').length + ' gün']]) + tak +
      '<ul class="il-lejant">' + ['tamam', 'kisa', 'yarim', 'kaydirildi', 'yapilmadi', 'plan'].map(d => '<li><span class="il-ag kucuk ' + d + '">' + ik(ANT_D[d][0]) + '</span>' + ANT_D[d][1] + '</li>').join('') + '</ul>' +
      '<div class="bolum-baslik">Hareketler · en iyi tekrar</div><ul class="il-har-liste">' + har.map(h => '<li><button><span><b>' + h[0] + '</b><small>' + h[3] + '</small></span><em>' + h[1] + ' → <b>' + h[2] + '</b></em>' + ik('chevron-right') + '</button></li>').join('') + '</ul>');
  }
  function hareketGidisat() {
    const ses = [['2026-09-01', 8], ['2026-09-08', 8], ['2026-09-15', 9], ['2026-09-22', 9], ['2026-09-29', 10], ['2026-10-06', 10], ['2026-10-13', 10], ['2026-10-20', 11], ['2026-10-27', 11], ['2026-11-03', 11], ['2026-11-10', 12], ['2026-11-16', 12]];
    const fn = (W, H) => {
      const alt = 20, ust = 10, sag = 28, gW = W - sag, gH = H - alt - ust, x = i => i / (ses.length - 1) * gW, y = v => ust + gH - (v - 6) / 8 * gH;
      let s = '<svg width="' + W + '" height="' + H + '" aria-hidden="true">';
      [6, 8, 10, 12, 14].forEach(t => { s += '<line class="il-izgara" x1="0" x2="' + gW + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="il-eksen" x="' + (W - 2) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + t + '</text>'; });
      s += '<line class="il-hedef antrenman" x1="0" x2="' + gW + '" y1="' + y(12) + '" y2="' + y(12) + '"/><text class="il-hedef-yazi" x="4" y="' + (y(12) - 5) + '">Üst sınır 12</text>';
      s += '<path class="il-egilim antrenman" d="' + ses.map((p, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(p[1])).join('') + '"/>';
      ses.forEach((p, i) => { s += '<circle class="il-son antrenman" cx="' + x(i) + '" cy="' + y(p[1]) + '" r="4"/>'; });
      s += '<text class="il-eksen" x="0" y="' + (H - 4) + '">1 Eyl</text><text class="il-eksen" x="' + gW + '" y="' + (H - 4) + '" text-anchor="end">16 Kas</text>';
      return s + '</svg>';
    };
    pencere('Eğimli şınav', ciplerP('3ay') + '<div class="il-gezgin pencerede"><button class="tn-ok" aria-label="Önceki dönem">' + ik('chevron-left') + '</button><b>' + donemAdi('3ay') + '</b><button class="tn-ok" disabled aria-label="Sonraki dönem">' + ik('chevron-right') + '</button></div>' + ucluk([['İlk', '8 tekrar', '1 Eylül'], ['En iyi', '12 tekrar', '16 Kasım'], ['Antrenman', '12 kez']]) +
      yer(fn, 180, 'Eğimli şınavda antrenman başına en iyi tekrar grafiği') +
      '<div class="bolum-baslik">Son antrenmanlar</div><ul class="il-olcum-liste">' + [['16 Kasım', '12 · 12 · 11'], ['10 Kasım', '12 · 11 · 11'], ['3 Kasım', '11 · 11 · 10'], ['27 Ekim', '11 · 10 · 10']].map(x => '<li><span><b>' + x[1] + '</b><small>' + x[0] + ' · 3 set</small></span></li>').join('') + '</ul>',
      { geri: 'Listeye dön' });
  }
  function agriDetay() {
    const gl = donemGunleri('ay', '2026-11-15').slice(0, 20).concat([]), gun0 = gk(BUGUN, -35);
    const gunler = []; for (let g = gun0; g <= BUGUN; g = gk(g, 1)) gunler.push(g);
    const fn = (W, H) => {
      const sol = 78, gW = W - sol - 6, x = g => sol + gunler.indexOf(g) / (gunler.length - 1) * gW, satir = [['Diz · Sağ', V.agri[0]], ['Bel', V.agri[1]]];
      let s = '<svg width="' + W + '" height="' + H + '" aria-hidden="true">';
      satir.forEach(([ad, a], i) => {
        const yy = 18 + i * 34; s += '<text class="il-eksen sol" x="0" y="' + (yy + 4) + '">' + ad + '</text><line class="il-izgara" x1="' + sol + '" x2="' + W + '" y1="' + yy + '" y2="' + yy + '"/>';
        a.takip.forEach(t => { const kd = t[1] >= 7 ? 'kirmizi' : t[1] >= 5 ? 'turuncu' : t[1] >= 3 ? 'sari' : 'yesil'; s += '<circle class="il-siddet-n ' + kd + '" cx="' + x(t[0]) + '" cy="' + yy + '" r="4.5"/>'; });
      });
      const ay = 18 + 2 * 34; s += '<text class="il-eksen sol" x="0" y="' + (ay + 4) + '">Antrenman</text>';
      gunler.forEach(g => { if (/tamam|kisa|yarim/.test(V.ant[g] || '')) s += '<rect class="il-ant-cizik" x="' + (x(g) - 1.5) + '" y="' + (ay - 7) + '" width="3" height="14" rx="1.5"/>'; });
      s += '<text class="il-eksen" x="' + sol + '" y="' + (H - 4) + '">' + tk(gun0).replace('Ekim', 'Eki') + '</text><text class="il-eksen" x="' + W + '" y="' + (H - 4) + '" text-anchor="end">20 Kas</text>';
      return s + '</svg>';
    };
    pencere('Ağrı ve sağlık notları', '<div class="bolum-baslik">Son 5 hafta</div>' + yer(fn, 128, 'Ağrı notlarının şiddeti ve antrenman günleri zaman çizelgesi') +
      '<ul class="il-lejant"><li><i class="il-siddet yesil"></i>0–2</li><li><i class="il-siddet sari"></i>3–4</li><li><i class="il-siddet turuncu"></i>5–6</li><li><i class="il-siddet kirmizi"></i>7+</li><li><i class="il-l-ant"></i>Antrenman günü</li></ul>' +
      '<div class="bolum-baslik">Notlar</div><ul class="il-agri-liste">' + V.agri.map(agriSatir).join('') + '</ul>', { bas: sekmeP(['Hepsi', 'Açık', 'Geçti'], 0) });
  }
  function sor() {
    const gl = donemGunleri('hafta').filter(g => g <= BUGUN); const son7 = []; for (let i = 6; i >= 0; i--) son7.push(gk(BUGUN, -i));
    const satir = g => { const v = V.gun[g]; return tk(g) + ' ' + GK[hg(g) - 1] + ': ' + (v ? f(v.kcal) + ' kcal, ' + f(v.p) + ' g protein, su ' + f(v.su / 1000, 1) + ' L, ' + f(v.adim) + ' adım, uyku ' + v.uyku.replace('<6', '6 saatten az').replace('6-7', '6–7 saat').replace('7+', '7+ saat') : 'kayıt yok') + (V.ant[g] && V.ant[g] !== 'plan' ? ', antrenman: ' + ANT_D[V.ant[g]][1].toLowerCase() : ''); };
    const e = egilim(kilolar()), metin = 'Zindem · son 7 gün (' + tk(son7[0]) + ' – ' + tk(BUGUN) + ')\nHedefler: kalori sınırı ' + f(HEDEF.kcal) + ' kcal, protein ' + HEDEF.p + ' g, su ' + f(HEDEF.su / 1000, 1) + ' L, ' + f(HEDEF.adim) + ' adım\n' +
      'Kilo: ' + f(e[e.length - 1].v, 1) + ' kg (eğilim), bel ' + f(beller().slice(-1)[0].v, 1) + ' cm\n\n' + son7.map(satir).join('\n') + '\n\nAçık ağrı notu: Diz sağ, şiddet 5 → 3 (17 Kasım\'dan beri)';
    pencere('Claude\'a sor', '<p class="il-sor-not">Bu özet kopyalanır. Claude\'a yapıştırıp sorunu yaz.</p><div class="il-onizleme">' + metin.split('\n').map(x => '<div>' + (x ? x.replace(/&/g, '&amp;').replace(/</g, '&lt;') : '&nbsp;') + '</div>').join('') + '</div>' +
      '<div class="alt-dugme"><button class="ana-dugme">' + ik('copy') + 'Özeti kopyala</button></div>');
  }
  function duzenle() {
    const k = [['weight', 'kilo', 'Kilo ve bel', 1], ['flame', 'kalori', 'Kalori ve protein', 1], ['droplet', 'su', 'Su', 1], ['footsteps', 'adim', 'Adım', 0], ['moon', 'uyku', 'Uyku', 1], ['barbell', 'antrenman', 'Antrenman', 1], ['bandage', 'agri', 'Ağrı ve sağlık notları', 1]];
    pencere('Kartları düzenle', '<ul class="il-duzen-liste">' + k.map((x, i) => '<li><span class="il-lk il-' + x[1] + '" aria-hidden="true">' + ik(x[0]) + '</span><span id="kd' + i + '">' + x[2] + '</span><button class="anahtar" role="switch" aria-checked="' + !!x[3] + '" aria-labelledby="kd' + i + '"><span></span></button></li>').join('') + '</ul>' +
      '<div class="alt-dugme"><button class="ana-dugme">' + ik('check') + 'Tamam</button></div>', { kucuk: true });
  }
  function bildirim(m) { const b = $('#bildirim'); b.innerHTML = m; b.hidden = false; }

  return {
    bos, ilkOlcum: () => olcum(true), olcum: () => olcum(false), kapat,
    hafta: () => ekran('hafta'), ay: () => ekran('ay'), uc: () => ekran('3ay'), yil: () => ekran('yil'), ekim: () => { ekran('ay', '2026-10-15'); },
    ozetli: () => ekran('hafta', null, aylikOzetKarti()), kiloDetay, kaloriDetay, antDetay, hareketGidisat, agriDetay, sor, duzenle,
    kopyalandi: () => { kapat(); ekran('hafta'); bildirim(ik('circle-check') + ' Özet kopyalandı · Claude\'a yapıştır'); },
    asagi: (n) => { const k = document.querySelectorAll('.il-kart, .il-sor')[n]; if (k) window.scrollTo(0, k.getBoundingClientRect().top + window.scrollY - 150); }
  };
})();
