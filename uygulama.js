/* Zindem – Bugün ekranı (1. sürüm)
 * Veri: Google E-Tablolar + Apps Script (ayar.js'deki adres). Gizli anahtar adresteki #k=… kısmından okunur.
 * Tarayıcıda kalıcı veri tutulmaz; sadece gönderilemeyen kayıtlar gönderilene kadar geçici olarak bekler.
 */
(function () {
  'use strict';

  var OGUNLER = [
    { k: 'kahvalti', ad: 'Kahvaltı', simge: '🍳' },
    { k: 'ogle', ad: 'Öğle', simge: '🥪' },
    { k: 'aksam', ad: 'Akşam', simge: '🍲' },
    { k: 'cay', ad: 'Çay saati', simge: '☕' }
  ];
  var VARSAYILAN_SAAT = { kahvalti: '06:00-11:59', ogle: '12:00-15:59', aksam: '16:00-19:59', cay: '20:00-22:59' };
  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var BEKLEYEN_ANAHTARI = 'zindem-bekleyen';
  var ADRES = window.ZINDEM_ADRES;

  var S = {
    anahtar: '', ayar: {}, hedefler: [], besinlerim: [], katalog: { besinler: [], kategoriler: [] },
    besinler: {}, kayitlar: [], gunluk: { su: 0, adim: '', uyku: '' }, agri: [], son: [], sik: {},
    gun: '', seciliOgun: '', yuklendi: false, hata: '', gonderiliyor: false, sonYukleme: 0
  };

  /* ---------- Yardımcılar ---------- */
  function $(s, k) { return (k || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sayi(v) { if (v === '' || v == null) return NaN; return parseFloat(String(v).replace(',', '.')); }
  function bicim(n, ondalik) {
    if (!isFinite(n)) return '—';
    return Number(n).toLocaleString('tr-TR', { maximumFractionDigits: ondalik == null ? 0 : ondalik });
  }
  function iki(n) { return (n < 10 ? '0' : '') + n; }
  function tarihMetni(d) { return d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate()); }
  function saatMetni(d) { return iki(d.getHours()) + ':' + iki(d.getMinutes()); }
  function dakika(hhmm) { var p = String(hhmm).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function kimlik(on) { return on + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function sadelestir(s) {
    return String(s).toLocaleLowerCase('tr-TR').replace(/[çğıöşüâî]/g, function (c) {
      return { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i' }[c];
    });
  }
  function ayar(anahtar, varsayilan) { var v = S.ayar[anahtar]; return v === undefined || v === '' ? varsayilan : v; }

  /* ---------- Gün ve öğün ---------- */
  function gunBul(simdi) {
    var bas = dakika(ayar('gun_baslangic', '06:00'));
    var d = new Date(simdi);
    if (d.getHours() * 60 + d.getMinutes() < bas) d.setDate(d.getDate() - 1);
    return tarihMetni(d);
  }
  function ogunAraliklari() {
    return OGUNLER.map(function (o) {
      var a = String(ayar(o.k, VARSAYILAN_SAAT[o.k])).split('-');
      return { k: o.k, bas: dakika(a[0]), bit: dakika(a[1] || a[0]), acik: String(ayar(o.k + '_acik', 'evet')).toLowerCase() !== 'hayır' };
    });
  }
  function ogunBul(simdi) {
    var d = new Date(simdi), m = d.getHours() * 60 + d.getMinutes();
    var ar = ogunAraliklari(), bulunan = 'cay';
    for (var i = 0; i < ar.length; i++) { if (m >= ar[i].bas && m <= ar[i].bit) { bulunan = ar[i].k; break; } }
    // 23:00–05:59 çay saatine yazılır (bulunan = 'cay'). Kapalı öğünün saatleri bir sonraki açık öğüne eklenir.
    var idx = OGUNLER.map(function (o) { return o.k; }).indexOf(bulunan);
    for (var j = 0; j < 4; j++) { var o = ar[(idx + j) % 4]; if (o.acik) return o.k; }
    return bulunan;
  }
  var YONELME = { kahvalti: 'Kahvaltıya', ogle: 'Öğleye', aksam: 'Akşama', cay: 'Çay saatine' };
  function ogunAdi(k) { for (var i = 0; i < OGUNLER.length; i++) if (OGUNLER[i].k === k) return OGUNLER[i].ad; return k; }
  function ogunKodu(ad) { for (var i = 0; i < OGUNLER.length; i++) if (OGUNLER[i].ad === ad) return OGUNLER[i].k; return 'cay'; }

  function hedef(tur) {
    var en = null;
    S.hedefler.forEach(function (h) {
      if (h['Tür'] !== tur || !h['Başlangıç'] || h['Başlangıç'] > S.gun) return;
      if (!en || h['Başlangıç'] >= en['Başlangıç']) en = h;
    });
    var v = en ? sayi(en['Değer']) : NaN;
    return isFinite(v) ? v : null;
  }

  /* ---------- Besinler ---------- */
  function olcuCoz(metin) {
    if (!metin) return [];
    return String(metin).split(';').map(function (p) {
      var i = p.lastIndexOf('='); if (i < 0) return null;
      var g = sayi(p.slice(i + 1)); var ad = p.slice(0, i).trim();
      return ad && isFinite(g) ? [ad, g] : null;
    }).filter(Boolean);
  }
  function besinleriKur() {
    var b = {}, ortulen = {};
    S.katalog.besinler.forEach(function (x) {
      b[x.id] = { id: x.id, ad: x.ad, kat: x.kat, porsiyon: false, kcal: x.kcal, p: x.p, olcu: x.olcu.slice(), kaynak: x.kaynak, benim: false };
    });
    S.besinlerim.forEach(function (r) {
      var id = r['ID']; if (!id) return;
      var kat = r['Katalog ID'] ? b[r['Katalog ID']] : null;
      var kcal = sayi(r['kcal']), p = sayi(r['Protein']);
      var porsiyon = String(r['Temel']).indexOf('porsiyon') >= 0;
      var x = {
        id: id, ad: r['Ad'] || (kat && kat.ad) || id, kat: r['Kategori'] || (kat && kat.kat) || '',
        porsiyon: porsiyon,
        kcal: isFinite(kcal) ? kcal : (kat ? kat.kcal : 0), p: isFinite(p) ? p : (kat ? kat.p : 0),
        olcu: olcuCoz(r['Ölçüler']).concat(kat && !porsiyon ? kat.olcu : []),
        kaynak: r['Kaynak'] || (kat && kat.kaynak) || '', not: r['Not'] || '', benim: true
      };
      if (porsiyon) x.olcu = [['1 porsiyon', 1]];
      if (kat) ortulen[kat.id] = id;
      b[id] = x;
    });
    S.besinler = b; S.ortulen = ortulen;
  }
  function deger(besin, olcuAd, miktar) {
    if (besin.porsiyon) return { gram: '', kcal: besin.kcal * miktar, p: besin.p * miktar };
    var g = olcuAd === 'gram' ? miktar : gramOlcu(besin, olcuAd) * miktar;
    return { gram: g, kcal: besin.kcal * g / 100, p: besin.p * g / 100 };
  }
  function gramOlcu(besin, olcuAd) {
    for (var i = 0; i < besin.olcu.length; i++) if (besin.olcu[i][0] === olcuAd) return besin.olcu[i][1];
    return 100;
  }
  function miktarMetni(k) {
    var m = sayi(k['Miktar']);
    if (k['Ölçü'] === 'gram') return bicim(m) + ' g';
    return (m === 1 ? '' : bicim(m, 2) + ' × ') + (k['Ölçü'] || '');
  }

  /* ---------- Sunucu ---------- */
  function bekleyenler() {
    try { return JSON.parse(localStorage.getItem(BEKLEYEN_ANAHTARI) || '[]'); } catch (e) { return []; }
  }
  function bekleyenYaz(l) {
    try { if (l.length) localStorage.setItem(BEKLEYEN_ANAHTARI, JSON.stringify(l)); else localStorage.removeItem(BEKLEYEN_ANAHTARI); } catch (e) { /* depolama kapalı olabilir */ }
    durumGoster();
  }
  function islemEkle(tur, veri) {
    var l = bekleyenler();
    l.push({ islemId: kimlik('i'), tur: tur, veri: veri });
    bekleyenYaz(l);
    gonder();
  }
  function gonder() {
    var l = bekleyenler();
    if (S.gonderiliyor || !l.length || !S.anahtar) return;
    S.gonderiliyor = true; durumGoster();
    var parti = l.slice(0, 25);
    fetch(ADRES, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ k: S.anahtar, islemler: parti }) })
      .then(function (r) { return r.json(); })
      .then(function (c) {
        if (!c.ok) throw new Error(c.hata || 'hata');
        var tamam = {}; var hatali = [];
        (c.sonuc || []).forEach(function (s) { tamam[s.id] = 1; if (!s.ok) hatali.push(s.hata); });
        bekleyenYaz(bekleyenler().filter(function (x) { return !tamam[x.islemId]; }));
        if (hatali.length) bildir('⚠ Bir kayıt yazılamadı: ' + hatali[0]);
        S.gonderiliyor = false; S.kaydedildi = Date.now(); durumGoster();
        if (bekleyenler().length) gonder();
      })
      .catch(function () { S.gonderiliyor = false; durumGoster(); });
  }
  function yukle() {
    S.gun = gunBul(Date.now());
    var url = ADRES + '?k=' + encodeURIComponent(S.anahtar) + '&gun=' + encodeURIComponent(S.gun);
    return Promise.all([
      fetch(url).then(function (r) { return r.json(); }),
      S.katalog.besinler.length ? Promise.resolve(S.katalog) : fetch('katalog.json?v=1').then(function (r) { return r.json(); })
    ]).then(function (sonuc) {
      var c = sonuc[0];
      if (!c.ok) { S.hata = c.hata === 'yetkisiz' ? 'yetkisiz' : 'Sunucu hatası: ' + c.hata; return; }
      S.katalog = sonuc[1];
      S.ayar = {}; (c.ayarlar || []).forEach(function (a) { S.ayar[a['Anahtar']] = a['Değer']; });
      S.hedefler = c.hedefler || []; S.besinlerim = c.besinlerim || [];
      S.kayitlar = c.bugun || []; S.agri = c.agri || []; S.son = c.sonYenenler || []; S.sik = c.sikYenenler || {};
      var g = c.gunluk || {};
      S.gunluk = { su: sayi(g['Su (ml)']) || 0, adim: g['Adım'] === undefined ? '' : String(g['Adım']), uyku: g['Uyku'] || '' };
      besinleriKur();
      bekleyenleriUygula();
      S.gun = gunBul(Date.now());
      if (!S.seciliOgun) S.seciliOgun = ogunBul(Date.now());
      S.yuklendi = true; S.hata = ''; S.sonYukleme = Date.now();
    }).catch(function () { S.hata = 'baglanti'; });
  }
  // Sunucuya henüz gitmemiş kayıtlar ekranda görünsün
  function bekleyenleriUygula() {
    bekleyenler().forEach(function (is) {
      var v = is.veri;
      if (is.tur === 'ogun_ekle' && v.gun === S.gun && !kayitBul(v.id)) S.kayitlar.push(kayitNesnesi(v));
      if (is.tur === 'ogun_guncelle') { var k = kayitBul(v.id); if (k) { k['Miktar'] = v.miktar; k['Gram'] = v.gram; k['kcal'] = v.kcal; k['Protein'] = v.p; } }
      if (is.tur === 'ogun_sil') S.kayitlar = S.kayitlar.filter(function (k) { return k['ID'] !== v.id; });
      if (is.tur === 'gunluk' && v.gun === S.gun) {
        if (v.alan === 'su') S.gunluk.su = +v.deger; if (v.alan === 'adim') S.gunluk.adim = String(v.deger); if (v.alan === 'uyku') S.gunluk.uyku = v.deger;
      }
      if (is.tur === 'besin_ekle' && !S.besinler[v.id]) {
        S.besinlerim.push({ 'ID': v.id, 'Ad': v.ad, 'Kategori': v.kategori, 'Katalog ID': '', 'Temel': v.temel, 'kcal': v.kcal, 'Protein': v.p, 'Ölçüler': v.olculer, 'Kaynak': 'Elle eklendi' });
        besinleriKur();
      }
    });
  }

  /* ---------- Kayıt işlemleri ---------- */
  function kayitBul(id) { for (var i = 0; i < S.kayitlar.length; i++) if (S.kayitlar[i]['ID'] === id) return S.kayitlar[i]; return null; }
  function kayitNesnesi(v) {
    return { 'ID': v.id, 'Gün': v.gun, 'Saat': v.saat, 'Öğün': v.ogun, 'Besin ID': v.besinId, 'Ad': v.ad, 'Miktar': v.miktar, 'Ölçü': v.olcu, 'Gram': v.gram, 'kcal': v.kcal, 'Protein': v.p };
  }
  function yuvarla(n) { return Math.round(n * 10) / 10; }
  function kayitEkle(besin, olcuAd, miktar, ogunK) {
    var d = deger(besin, olcuAd, miktar), simdi = new Date();
    var v = {
      id: kimlik('O'), gun: S.gun, saat: saatMetni(simdi), ogun: ogunAdi(ogunK), besinId: besin.id, ad: besin.ad,
      miktar: miktar, olcu: besin.porsiyon ? '1 porsiyon' : olcuAd, gram: d.gram === '' ? '' : yuvarla(d.gram), kcal: Math.round(d.kcal), p: yuvarla(d.p)
    };
    S.kayitlar.push(kayitNesnesi(v));
    islemEkle('ogun_ekle', v);
    ciz();
  }
  function kayitMiktar(id, yeni) {
    var k = kayitBul(id); if (!k) return;
    if (yeni <= 0) {
      var eski = JSON.parse(JSON.stringify(k));
      S.kayitlar = S.kayitlar.filter(function (x) { return x['ID'] !== id; });
      islemEkle('ogun_sil', { id: id });
      ciz();
      bildir(eski['Ad'] + ' silindi', 'Geri al', function () {
        var b = S.besinler[eski['Besin ID']];
        if (b) kayitEkle(b, eski['Ölçü'] === '1 porsiyon' ? '1 porsiyon' : eski['Ölçü'], sayi(eski['Miktar']), ogunKodu(eski['Öğün']));
      });
      return;
    }
    var b = S.besinler[k['Besin ID']]; if (!b) return;
    var d = deger(b, k['Ölçü'], yeni);
    k['Miktar'] = yeni; k['Gram'] = d.gram === '' ? '' : yuvarla(d.gram); k['kcal'] = Math.round(d.kcal); k['Protein'] = yuvarla(d.p);
    islemEkle('ogun_guncelle', { id: id, miktar: yeni, gram: k['Gram'], kcal: k['kcal'], p: k['Protein'] });
    ciz();
  }
  function adimMiktar(k) { return k['Ölçü'] === 'gram' ? 10 : 0.5; }
  function suDegistir(fark) {
    S.gunluk.su = Math.max(0, (S.gunluk.su || 0) + fark);
    islemEkle('gunluk', { gun: S.gun, alan: 'su', deger: S.gunluk.su });
    ciz();
  }

  /* ---------- Ekran ---------- */
  function halka(oran, renk, ust, alt, ad) {
    var r = 42, c = 2 * Math.PI * r, o = Math.max(0, Math.min(1, oran || 0));
    return '<div><div class="halka" role="img" aria-label="' + esc(ad + ': ' + ust + ' ' + alt) + '"><svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle class="iz" cx="50" cy="50" r="' + r + '" fill="none" stroke-width="10"/>' +
      '<circle class="dolu" cx="50" cy="50" r="' + r + '" fill="none" stroke="' + renk + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - o)) + '"/>' +
      '</svg><div class="ic" aria-hidden="true"><b>' + ust + '</b><small>' + alt + '</small></div></div><div class="halka-ad" aria-hidden="true">' + ad + '</div></div>';
  }
  function toplamlar(liste) {
    return liste.reduce(function (t, k) { t.kcal += sayi(k['kcal']) || 0; t.p += sayi(k['Protein']) || 0; return t; }, { kcal: 0, p: 0 });
  }
  function selam() {
    var h = new Date().getHours();
    var s = h >= 5 && h < 12 ? 'Günaydın' : h < 18 && h >= 12 ? 'İyi günler' : h >= 18 && h < 23 ? 'İyi akşamlar' : 'İyi geceler';
    var ad = ayar('ad', '');
    return s + (ad ? ', ' + esc(ad) : '');
  }
  function gunBasligi() {
    var p = S.gun.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + GUNLER[d.getDay()];
  }
  function durumGoster() {
    var el = $('#durum'); if (!el) return;
    var n = bekleyenler().length;
    if (S.gonderiliyor) { el.className = 'durum'; el.textContent = '⏳ Kaydediliyor…'; }
    else if (n) { el.className = 'durum bekliyor'; el.textContent = '🟠 ' + n + ' kayıt bekliyor'; }
    else if (Date.now() - (S.kaydedildi || 0) < 3000) {
      el.className = 'durum'; el.textContent = '✅ Kaydedildi';
      clearTimeout(durumZaman);
      durumZaman = setTimeout(function () { var e = $('#durum'); if (e) e.className = 'durum gizle'; }, 3000 - (Date.now() - S.kaydedildi));
    } else { el.className = 'durum gizle'; el.textContent = '✅ Kaydedildi'; }
  }
  var durumZaman = null;

  function ciz() {
    var ana = $('#uygulama');
    if (!S.anahtar) { anahtarEkrani(ana); return; }
    if (S.hata === 'yetkisiz') { anahtarEkrani(ana, true); return; }
    if (!S.yuklendi) {
      ana.innerHTML = S.hata
        ? '<div class="kart"><b>❌ Bağlantı kurulamadı.</b><p>İnternet bağlantını kontrol et.</p><button class="ana-dugme" id="tekrar">Tekrar dene</button></div>'
        : '';
      var t = $('#tekrar'); if (t) t.onclick = baslat;
      if (S.hata) acilisKapat();
      return;
    }
    var hk = hedef('kalori'), hp = hedef('protein'), hs = hedef('su_ml');
    var t = toplamlar(S.kayitlar), su = S.gunluk.su || 0;
    var h = '';
    h += '<header class="ust-satir"><div class="selam"><h1>' + selam() + '</h1><div class="tarih">' + gunBasligi() + '</div><div id="durum" class="durum"></div></div>' +
      '<button class="yuvarlak-dugme" id="agri-dugme" aria-label="Ağrı ve sağlık notu' + (S.agri.length ? ' (' + S.agri.length + ' açık not)' : '') + '"><svg class="ikon" style="--r:#F9A8D4" aria-hidden="true"><use href="#i-agri"/></svg>' + (S.agri.length ? '<span class="nokta" aria-hidden="true"></span>' : '') + '</button></header>';

    // Üst kart
    h += '<section class="ust-kart" aria-label="Günün toplamı"><div class="halkalar">' +
      halka(hk ? t.kcal / hk : 0, 'var(--halka-kalori)', bicim(t.kcal), hk ? '/ ' + bicim(hk) + ' kcal' : 'kcal', 'Kalori') +
      halka(hp ? t.p / hp : 0, 'var(--halka-protein)', bicim(t.p), hp ? '/ ' + bicim(hp) + ' g' : 'g', 'Protein') +
      halka(hs ? su / hs : 0, 'var(--halka-su)', bicim(su / 1000, 2) + ' L', hs ? '/ ' + bicim(hs / 1000, 2) + ' L' : 'su', 'Su') +
      '</div>';
    var duz = sayi(ayar('duzeltme_ml', 50)) || 50;
    var hizli = String(ayar('hizli_ekle_ml', '200,500,1000')).split(',').map(sayi).filter(isFinite);
    h += '<div class="su-kontrol" role="group" aria-label="Su ekle">' +
      '<button class="kucuk" data-su="' + (-duz) + '" aria-label="' + duz + ' ml su çıkar">−</button><span class="su-adim">' + duz + ' ml</span>' +
      '<button class="kucuk" data-su="' + duz + '" aria-label="' + duz + ' ml su ekle">＋</button></div><div class="su-kontrol">' +
      hizli.map(function (m) { return '<button data-su="' + m + '" aria-label="' + m + ' ml su ekle">+' + (m >= 1000 ? bicim(m / 1000, 1) + ' L' : m + ' ml') + '</button>'; }).join('') +
      '</div>';
    if (hk || hp) {
      var kalanP = hp ? hp - t.p : 0, parcalar = [], cumle = '';
      if (hk && t.kcal > hk) cumle = 'Hedefin ' + bicim(t.kcal - hk) + ' kcal üstü';
      else if (hk) parcalar.push(bicim(hk - t.kcal) + ' kcal');
      if (hp && kalanP > 0) parcalar.push(bicim(kalanP) + ' g protein');
      if (parcalar.length) cumle += (cumle ? ' · ' : '') + parcalar.join(' ve ') + ' kaldı';
      if (hp && kalanP <= 0) cumle += (cumle ? ' · ' : '') + '✅ Protein hedefi tamam';
      h += '<div class="kalan">' + cumle + '</div>';
    }
    h += '</section>';

    // Günlük soru
    h += soruKarti();

    // Öğün çizgisi
    var simdiOgun = ogunBul(Date.now()), simdiIdx = OGUNLER.map(function (o) { return o.k; }).indexOf(simdiOgun);
    var ar = ogunAraliklari();
    h += '<nav class="ogun-cizgi" aria-label="Öğünler">';
    OGUNLER.forEach(function (o, i) {
      if (!ar[i].acik) return;
      var liste = S.kayitlar.filter(function (k) { return k['Öğün'] === o.ad; });
      var tt = toplamlar(liste);
      var sinif = liste.length ? 'dolu' : (i > simdiIdx ? 'gelecek' : '');
      if (o.k === simdiOgun) sinif += ' simdi';
      if (o.k === S.seciliOgun) sinif += ' secili';
      var bas = String(ayar(o.k, VARSAYILAN_SAAT[o.k])).split('-')[0];
      h += '<button class="ogun-cip ' + sinif + '" data-ogun="' + o.k + '" aria-pressed="' + (o.k === S.seciliOgun) + '" aria-label="' + o.ad + (o.k === simdiOgun ? ' (şimdi)' : '') + (liste.length ? ', ' + bicim(tt.kcal) + ' kcal' : '') + '">' +
        '<span class="top" aria-hidden="true">' + o.simge + '</span><span class="ad">' + o.ad + (o.k === simdiOgun ? '<i class="simdi-nokta" title="Şimdi"></i>' : '') + '</span>' +
        '<span class="alt">' + (liste.length ? bicim(tt.kcal) + ' kcal' : (i > simdiIdx ? bas : '—')) + '</span></button>';
    });
    h += '</nav>';

    // Öğün kutusu
    h += ogunKutusu(S.seciliOgun);
    h += '<p class="alt-not">Zindem teşhis koymaz, tedavi önermez. Kayıtlarını tutar, gösterir ve uyarır.</p>';
    ana.innerHTML = h;
    durumGoster();
    baglaAna();
    acilisKapat();
  }
  function acilisKapat() {
    var a = $('#acilis'); if (!a || a.classList.contains('kapaniyor')) return;
    a.classList.add('kapaniyor');
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 400);
  }

  function soruKarti() {
    var simdi = new Date(), ogun = ogunBul(simdi);
    if (!S.gunluk.uyku && ogun === 'kahvalti' && !sonraDendi('uyku')) {
      return '<section class="kart soru-kart" aria-label="Günlük soru"><span class="soru">😴 Dün gece uyku?</span>' +
        ['6\'dan az', '6–7', '7+'].map(function (s, i) { return '<button class="cip" data-uyku="' + ['<6', '6-7', '7+'][i] + '">' + s + '</button>'; }).join('') +
        '<button class="cip duz" data-sonra="uyku">Sonra</button></section>';
    }
    if (S.gunluk.adim === '' && simdi.getHours() >= 20 && !sonraDendi('adim')) {
      return '<section class="kart soru-kart" aria-label="Günlük soru"><label class="soru" for="adim-kutu">👟 Bugün kaç adım attın?</label>' +
        '<input id="adim-kutu" class="sayi-kutu" type="number" inputmode="numeric" min="0" step="100" placeholder="8000">' +
        '<button class="cip secili" id="adim-kaydet">Kaydet</button><button class="cip duz" data-sonra="adim">Sonra</button></section>';
    }
    return '';
  }
  function sonraDendi(tur) { try { return localStorage.getItem('zindem-sonra-' + S.gun + '-' + tur) === '1'; } catch (e) { return false; } }
  function sonraDe(tur) { try { localStorage.setItem('zindem-sonra-' + S.gun + '-' + tur, '1'); } catch (e) { /* önemli değil */ } }

  function ogunKutusu(ogunK) {
    var ad = ogunAdi(ogunK);
    var liste = S.kayitlar.filter(function (k) { return k['Öğün'] === ad; });
    var tt = toplamlar(liste);
    var h = '<section class="kart ogun-kutu ' + (S.gecis || '') + '" aria-labelledby="ogun-baslik"><div class="ogun-baslik"><h2 id="ogun-baslik">' + ad +
      '<span class="toplam">' + (liste.length ? bicim(tt.kcal) + ' kcal · ' + bicim(tt.p) + ' g protein' : 'Henüz kayıt yok') + '</span></h2>' +
      '<button class="ekle-dugme" id="ekle">＋ Ekle</button></div>';
    liste.forEach(function (k) {
      var besinVar = !!S.besinler[k['Besin ID']];
      h += '<div class="satir"><span class="tik dolu" aria-hidden="true">✓</span><div class="bilgi"><b>' + esc(k['Ad']) + '</b><small>' +
        esc(besinVar ? miktarMetni(k) + ' · ' : '') + bicim(sayi(k['kcal'])) + ' kcal · ' + bicim(sayi(k['Protein']), 1) + ' g</small></div>';
      if (besinVar) {
        var m = sayi(k['Miktar']), a = adimMiktar(k);
        h += '<div class="adim"><button data-azalt="' + esc(k['ID']) + '" aria-label="' + esc(k['Ad']) + ' azalt">−</button><span aria-label="miktar">' + bicim(m, 2) + '</span>' +
          '<button data-artir="' + esc(k['ID']) + '" aria-label="' + esc(k['Ad']) + ' artır">＋</button></div>';
      }
      h += '</div>';
    });
    // Sık yenenler (bu öğün için, bugün henüz girilmemiş)
    var girilen = {}; liste.forEach(function (k) { girilen[k['Besin ID']] = 1; });
    var sik = Object.keys(S.sik).filter(function (x) { return x.indexOf(ad + '|') === 0; })
      .map(function (x) { return { id: x.split('|')[1], n: S.sik[x] }; })
      .filter(function (x) { return S.besinler[x.id] && !girilen[x.id]; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 6);
    sik.forEach(function (x) {
      var b = S.besinler[x.id], o = sonOlcu(b);
      var d = deger(b, o.olcu, o.miktar);
      h += '<div class="satir"><button class="tik" data-hizli="' + esc(b.id) + '" aria-label="' + esc(b.ad) + ' ekle"></button><div class="bilgi"><b>' + esc(b.ad) + '</b><small>' +
        esc((o.miktar === 1 ? '' : bicim(o.miktar, 2) + ' × ') + (o.olcu === 'gram' ? 'g' : o.olcu)) + ' · ' + bicim(d.kcal) + ' kcal · ' + bicim(d.p, 1) + ' g</small></div></div>';
    });
    if (!liste.length && !sik.length) h += '<div class="bos">Bu öğüne bir şey eklemek için ＋ Ekle\'ye dokun.</div>';
    return h + '</section>';
  }
  function sonOlcu(b) {
    for (var i = 0; i < S.son.length; i++) {
      if (S.son[i].besinId === b.id) {
        var m = sayi(S.son[i].miktar);
        var o = S.son[i].olcu;
        if (b.porsiyon) o = '1 porsiyon';
        else if (o !== 'gram' && !b.olcu.some(function (x) { return x[0] === o; })) o = b.olcu.length ? b.olcu[0][0] : 'gram';
        return { olcu: o, miktar: isFinite(m) && m > 0 ? m : (o === 'gram' ? 100 : 1) };
      }
    }
    return b.porsiyon ? { olcu: '1 porsiyon', miktar: 1 } : b.olcu.length ? { olcu: b.olcu[0][0], miktar: 1 } : { olcu: 'gram', miktar: 100 };
  }

  function baglaAna() {
    document.querySelectorAll('[data-su]').forEach(function (b) { b.onclick = function () { suDegistir(+b.getAttribute('data-su')); }; });
    document.querySelectorAll('[data-ogun]').forEach(function (b) {
      b.onclick = function () {
        var yeni = b.getAttribute('data-ogun'); if (yeni === S.seciliOgun) return;
        var sira = OGUNLER.map(function (o) { return o.k; });
        S.gecis = sira.indexOf(yeni) > sira.indexOf(S.seciliOgun) ? 'gecis-sag' : 'gecis-sol';
        S.seciliOgun = yeni; ciz(); S.gecis = '';
        if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) { /* yok */ }
      };
    });
    document.querySelectorAll('[data-artir]').forEach(function (b) {
      b.onclick = function () { var k = kayitBul(b.getAttribute('data-artir')); kayitMiktar(k['ID'], sayi(k['Miktar']) + adimMiktar(k)); };
    });
    document.querySelectorAll('[data-azalt]').forEach(function (b) {
      b.onclick = function () { var k = kayitBul(b.getAttribute('data-azalt')); kayitMiktar(k['ID'], Math.round((sayi(k['Miktar']) - adimMiktar(k)) * 100) / 100); };
    });
    document.querySelectorAll('[data-sil]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-sil');
        S.kayitlar = S.kayitlar.filter(function (x) { return x['ID'] !== id; });
        islemEkle('ogun_sil', { id: id }); ciz(); bildir('Kayıt silindi');
      };
    });
    document.querySelectorAll('[data-hizli]').forEach(function (b) {
      b.onclick = function () { var be = S.besinler[b.getAttribute('data-hizli')]; var o = sonOlcu(be); kayitEkle(be, o.olcu, o.miktar, S.seciliOgun || ogunBul(Date.now())); };
    });
    document.querySelectorAll('[data-uyku]').forEach(function (b) {
      b.onclick = function () { S.gunluk.uyku = b.getAttribute('data-uyku'); islemEkle('gunluk', { gun: S.gun, alan: 'uyku', deger: S.gunluk.uyku }); ciz(); bildir('✅ Uyku kaydedildi'); };
    });
    document.querySelectorAll('[data-sonra]').forEach(function (b) { b.onclick = function () { sonraDe(b.getAttribute('data-sonra')); ciz(); }; });
    var ak = $('#adim-kaydet');
    if (ak) ak.onclick = function () {
      var v = Math.round(sayi($('#adim-kutu').value));
      if (!isFinite(v) || v < 0) { bildir('Adım sayısını yaz'); return; }
      S.gunluk.adim = String(v); islemEkle('gunluk', { gun: S.gun, alan: 'adim', deger: v }); ciz(); bildir('✅ Adım kaydedildi');
    };
    $('#ekle').onclick = function () { ekleAc(S.seciliOgun); };
    $('#agri-dugme').onclick = function () { agriAc(); };
  }

  /* ---------- Alttan açılan pencere ---------- */
  var oncekiOdak = null;
  function pencereAc(baslik, icerik, bagla) {
    oncekiOdak = document.activeElement;
    var p = $('#pencere');
    p.innerHTML = '<div class="tutamac" aria-hidden="true"></div><div class="pencere-ust"><h2 id="pencere-baslik">' + baslik + '</h2><button class="kapat" id="kapat" aria-label="Kapat">✕</button></div><div id="pencere-ic">' + icerik + '</div>';
    p.hidden = false; $('#perde').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#kapat').onclick = pencereKapat; $('#perde').onclick = pencereKapat;
    if (bagla) bagla(p);
  }
  function pencereIcerik(icerik, bagla) { $('#pencere-ic').innerHTML = icerik; if (bagla) bagla($('#pencere')); $('#pencere').scrollTop = 0; }
  function pencereKapat() {
    $('#pencere').hidden = true; $('#perde').hidden = true; $('#pencere').innerHTML = '';
    document.body.style.overflow = '';
    if (oncekiOdak && oncekiOdak.focus) try { oncekiOdak.focus(); } catch (e) { /* yok */ }
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#pencere').hidden) pencereKapat(); });

  /* ---------- ＋ Ekle ---------- */
  var penOgun = '';
  function ekleAc(ogunK) {
    penOgun = ogunK || S.seciliOgun || ogunBul(Date.now());
    pencereAc(YONELME[penOgun] + ' ekle',
      '<label class="gizli-yazi" for="arama">Besin ara</label><input id="arama" class="arama" type="search" placeholder="Besin ara: yoğurt, tavuk, elma…" autocomplete="off"><div id="sonuclar"></div>',
      function () {
        var a = $('#arama');
        a.oninput = function () { sonuclariGoster(a.value); };
        sonuclariGoster('');
        setTimeout(function () { a.focus(); }, 50);
      });
  }
  function sonucSatiri(b, etiket) {
    var alt = b.porsiyon ? bicim(b.kcal) + ' kcal · ' + bicim(b.p, 1) + ' g / porsiyon' : bicim(b.kcal) + ' kcal · ' + bicim(b.p, 1) + ' g / 100 g';
    return '<button class="sonuc" data-sec="' + esc(b.id) + '"><span class="bilgi"><b>' + esc(b.ad) + '</b><small>' + alt + '</small></span>' + (etiket ? '<span class="etiket">' + etiket + '</span>' : '') + '</button>';
  }
  function sonuclariGoster(q) {
    var h = '';
    var qs = sadelestir(q.trim()).split(/\s+/).filter(Boolean);
    if (!qs.length) {
      var son = S.son.map(function (x) { return S.besinler[x.besinId]; }).filter(Boolean).slice(0, 10);
      if (son.length) h += '<div class="bolum-baslik">Son yenenler</div>' + son.map(function (b) { return sonucSatiri(b, b.benim ? 'Benim' : ''); }).join('');
      var benim = Object.keys(S.besinler).map(function (k) { return S.besinler[k]; }).filter(function (b) { return b.benim; })
        .sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); });
      if (benim.length) h += '<div class="bolum-baslik">Besinlerim</div>' + benim.map(function (b) { return sonucSatiri(b, ''); }).join('');
    } else {
      var hepsi = Object.keys(S.besinler).map(function (k) { return S.besinler[k]; })
        .filter(function (b) { return !(S.ortulen[b.id]); })
        .filter(function (b) { var t = sadelestir(b.ad + ' ' + b.kat); return qs.every(function (x) { return t.indexOf(x) >= 0; }); })
        .sort(function (a, b) {
          var ab = sadelestir(a.ad).indexOf(qs[0]) === 0 ? 0 : 1, bb = sadelestir(b.ad).indexOf(qs[0]) === 0 ? 0 : 1;
          return (b.benim - a.benim) || (ab - bb) || a.ad.localeCompare(b.ad, 'tr');
        }).slice(0, 40);
      h += hepsi.length ? hepsi.map(function (b) { return sonucSatiri(b, b.benim ? 'Benim' : ''); }).join('') : '<div class="bos">"' + esc(q) + '" bulunamadı.</div>';
    }
    h += '<button class="ikinci-dugme" id="elle">✍ Listede yok mu? Elle ekle</button>';
    $('#sonuclar').innerHTML = h;
    document.querySelectorAll('[data-sec]').forEach(function (b) { b.onclick = function () { besinDetay(S.besinler[b.getAttribute('data-sec')]); }; });
    $('#elle').onclick = function () { elleEkle(q); };
  }
  function besinDetay(b) {
    var o = sonOlcu(b), sec = { olcu: o.olcu, miktar: o.miktar };
    function ciz2() {
      var olcular = b.porsiyon ? [['1 porsiyon', 1]] : b.olcu.concat([['gram', 1]]);
      var d = deger(b, sec.olcu, sec.miktar);
      var h = '<p><small>' + esc(b.kat) + (b.kaynak ? ' · Kaynak: ' + esc(b.kaynak) : '') + '</small></p>' + (b.not ? '<p class="uyari">' + esc(b.not) + '</p>' : '');
      if (!b.porsiyon) {
        h += '<div class="form-alan"><span class="etiket-yazi">Ölçü</span><div class="cipler">' + olcular.map(function (x) {
          return '<button class="cip' + (x[0] === sec.olcu ? ' secili' : '') + '" data-olcu="' + esc(x[0]) + '">' + esc(x[0] === 'gram' ? 'Gram' : x[0] + ' (' + bicim(x[1], 1) + ' g)') + '</button>';
        }).join('') + '</div></div>';
      }
      if (sec.olcu === 'gram') {
        h += '<div class="form-alan"><label for="gram-kutu">Kaç gram?</label><input id="gram-kutu" type="number" inputmode="decimal" min="1" value="' + sec.miktar + '"></div>';
      } else {
        h += '<div class="form-alan"><span class="etiket-yazi">Miktar</span><div class="adim"><button id="m-az" aria-label="Azalt">−</button><span>' + bicim(sec.miktar, 2) + '</span><button id="m-art" aria-label="Artır">＋</button></div></div>';
      }
      h += '<div class="ozet-kutu" aria-live="polite">' + bicim(d.kcal) + ' kcal · ' + bicim(d.p, 1) + ' g protein' + (d.gram !== '' && sec.olcu !== 'gram' ? ' · ' + bicim(d.gram) + ' g' : '') + '</div>' +
        '<button class="ana-dugme" id="ekle-onay">' + YONELME[penOgun] + ' ekle</button><button class="ikinci-dugme" id="geri">← Aramaya dön</button>';
      pencereIcerik('<h3 style="margin:8px 0 0">' + esc(b.ad) + '</h3>' + h, function () {
        document.querySelectorAll('[data-olcu]').forEach(function (x) {
          x.onclick = function () { sec.olcu = x.getAttribute('data-olcu'); sec.miktar = sec.olcu === 'gram' ? 100 : 1; ciz2(); };
        });
        var az = $('#m-az'), art = $('#m-art'), gk = $('#gram-kutu');
        if (az) az.onclick = function () { sec.miktar = Math.max(0.5, sec.miktar - 0.5); ciz2(); };
        if (art) art.onclick = function () { sec.miktar = sec.miktar + 0.5; ciz2(); };
        if (gk) gk.onchange = function () { var v = sayi(gk.value); if (isFinite(v) && v > 0) { sec.miktar = v; ciz2(); } };
        $('#ekle-onay').onclick = function () {
          if (gk) { var v = sayi(gk.value); if (!isFinite(v) || v <= 0) { bildir('Gramı yaz'); return; } sec.miktar = v; }
          kayitEkle(b, sec.olcu, sec.miktar, penOgun); pencereKapat(); bildir('✅ ' + b.ad + ' eklendi');
        };
        $('#geri').onclick = function () { ekleAc(penOgun); };
      });
    }
    ciz2();
  }
  function elleEkle(onAd) {
    var kats = ['Hazır ürünler', 'Ev yemekleri'].concat(S.katalog.kategoriler || []);
    var h = '<div class="form-alan"><label for="e-ad">Besinin adı</label><input id="e-ad" type="text" value="' + esc(onAd || '') + '" placeholder="Ör. Tavuk döner dürüm"></div>' +
      '<div class="form-alan"><label for="e-kat">Kategori</label><select id="e-kat">' + kats.map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-alan"><span class="etiket-yazi">Değerler neye göre?</span><div class="cipler"><button class="cip secili" data-temel="100 g">100 g için (etiketteki gibi)</button><button class="cip" data-temel="1 porsiyon">1 porsiyon için</button></div></div>' +
      '<div class="form-alan"><label for="e-kcal">Kalori (kcal)</label><input id="e-kcal" type="number" inputmode="decimal" min="0"></div>' +
      '<div class="form-alan"><label for="e-p">Protein (g)</label><input id="e-p" type="number" inputmode="decimal" min="0"></div>' +
      '<div class="form-alan" id="e-olcu-alan"><label for="e-olcu">Ölçü adı (isteğe bağlı)</label><input id="e-olcu" type="text" placeholder="Ör. 1 paket, 1 dilim"><label for="e-gram" style="margin-top:8px">Bu ölçü kaç gram?</label><input id="e-gram" type="number" inputmode="decimal" min="0"></div>' +
      '<button class="ana-dugme" id="e-kaydet">Besinlerim\'e kaydet ve ekle</button><button class="ikinci-dugme" id="geri">← Aramaya dön</button>';
    var temel = '100 g';
    pencereIcerik('<h3 style="margin:8px 0 0">Elle ekle</h3>' + h, function () {
      document.querySelectorAll('[data-temel]').forEach(function (x) {
        x.onclick = function () {
          temel = x.getAttribute('data-temel');
          document.querySelectorAll('[data-temel]').forEach(function (y) { y.classList.toggle('secili', y === x); });
          $('#e-olcu-alan').hidden = temel !== '100 g';
        };
      });
      $('#geri').onclick = function () { ekleAc(penOgun); };
      $('#e-kaydet').onclick = function () {
        var ad = $('#e-ad').value.trim(), kcal = sayi($('#e-kcal').value), p = sayi($('#e-p').value);
        if (!ad || !isFinite(kcal) || !isFinite(p)) { bildir('Ad, kalori ve protein gerekli (etikette protein yoksa 0 yaz)'); return; }
        var olcuAd = $('#e-olcu').value.trim(), olcuG = sayi($('#e-gram').value);
        var olculer = temel === '100 g' && olcuAd && isFinite(olcuG) && olcuG > 0 ? olcuAd + '=' + olcuG : '';
        var v = { id: kimlik('B'), ad: ad, kategori: $('#e-kat').value, temel: temel, kcal: kcal, p: p, olculer: olculer };
        islemEkle('besin_ekle', v);
        S.besinlerim.push({ 'ID': v.id, 'Ad': ad, 'Kategori': v.kategori, 'Katalog ID': '', 'Temel': temel, 'kcal': kcal, 'Protein': p, 'Ölçüler': olculer, 'Kaynak': 'Elle eklendi' });
        besinleriKur();
        besinDetay(S.besinler[v.id]);
      };
    });
  }

  /* ---------- Ağrı / sağlık notu ---------- */
  var TURLER = ['antrenman kaynaklı', 'hastalık', 'gün içi kaza', 'diğer'];
  var BOLGELER = ['omuz', 'diz', 'bel', 'kasık', 'boyun', 'ayak bileği', 'diğer'];
  var TARAFLAR = ['sağ', 'sol', 'ikisi', 'yok'];
  function gunFarki(tarih) { var p = String(tarih).slice(0, 10).split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); return Math.floor((Date.now() - d) / 864e5); }
  function kisaTarih(t) { var p = String(t).slice(0, 10).split('-'); return +p[2] + ' ' + AYLAR[+p[1] - 1].slice(0, 3); }
  function agriAc() {
    var h = '';
    if (S.agri.length) {
      h += '<div class="bolum-baslik">Açık notlar</div>';
      S.agri.forEach(function (a) {
        var s = sayi(a['Şiddet']), gun = gunFarki(a['Açılış']);
        h += '<div class="not-kart"><b>' + esc(a['Bölge']) + (a['Taraf'] && a['Taraf'] !== 'yok' ? ' · ' + esc(a['Taraf']) : '') + '</b><small>' + esc(a['Tür']) + ' · ' + gun + ' gündür açık · ilk şiddet ' + bicim(s, 1) + (a['Son tarih'] ? ' · son ' + bicim(sayi(a['Son şiddet']), 1) + ' (' + kisaTarih(a['Son tarih']) + ')' : '') + '</small>' +
          (a['Not'] ? '<div><small>' + esc(a['Not']) + '</small></div>' : '') +
          ((s >= 7 || gun > 14) ? '<div class="uyari">⚠ Şiddet yüksek ya da 2 haftadan uzun sürüyor: bir doktora danış.</div>' : '') +
          '<div class="form-alan"><span class="etiket-yazi">Bugün nasıl?</span><div class="cipler">' +
          ['azaldı', 'aynı', 'arttı', 'geçti'].map(function (c) { return '<button class="cip" data-takip="' + esc(a['ID']) + '" data-cevap="' + c + '">' + c + '</button>'; }).join('') + '</div></div></div>';
      });
    }
    h += '<button class="ana-dugme" id="yeni-not">＋ Yeni not</button>';
    pencereAc('Ağrı ve sağlık notları', h, function () {
      document.querySelectorAll('[data-takip]').forEach(function (b) {
        b.onclick = function () { takipFormu(b.getAttribute('data-takip'), b.getAttribute('data-cevap')); };
      });
      $('#yeni-not').onclick = yeniNot;
    });
  }
  function siddetAlani(ilk) {
    return '<div class="form-alan"><label for="siddet">Şiddet (0–10)</label><div class="siddet"><button class="cip" id="s-az" aria-label="Azalt">−</button>' +
      '<input id="siddet" type="range" min="0" max="10" step="0.5" value="' + ilk + '"><output id="s-deger" for="siddet">' + bicim(ilk, 1) + '</output><button class="cip" id="s-art" aria-label="Artır">＋</button></div></div>';
  }
  function siddetBagla() {
    var r = $('#siddet'), o = $('#s-deger');
    function guncelle() { o.textContent = bicim(+r.value, 1); var u = $('#s-uyari'); if (u) u.hidden = +r.value < 7; }
    r.oninput = guncelle;
    $('#s-az').onclick = function () { r.value = Math.max(0, +r.value - 0.5); guncelle(); };
    $('#s-art').onclick = function () { r.value = Math.min(10, +r.value + 0.5); guncelle(); };
    guncelle();
  }
  function takipFormu(notId, cevap) {
    var a = S.agri.filter(function (x) { return x['ID'] === notId; })[0];
    if (cevap === 'geçti') {
      islemEkle('agri_takip', { notId: notId, tarih: S.gun, siddet: 0, cevap: 'geçti' });
      S.agri = S.agri.filter(function (x) { return x['ID'] !== notId; });
      pencereKapat(); ciz(); bildir('✅ ' + a['Bölge'] + ' notu kapatıldı'); return;
    }
    pencereIcerik('<h3 style="margin:8px 0 0">' + esc(a['Bölge']) + ' · ' + esc(cevap) + '</h3>' + siddetAlani(isFinite(sayi(a['Şiddet'])) ? sayi(a['Şiddet']) : 0) +
      '<div id="s-uyari" class="uyari" hidden>⚠ Şiddet 7 ve üstü: bir doktora danış.</div>' +
      '<div class="form-alan"><label for="t-not">Kısa not (isteğe bağlı)</label><input id="t-not" type="text"></div>' +
      '<button class="ana-dugme" id="t-kaydet">Kaydet</button>', function () {
        siddetBagla();
        $('#t-kaydet').onclick = function () {
          islemEkle('agri_takip', { notId: notId, tarih: S.gun, siddet: +$('#siddet').value, cevap: cevap, not: $('#t-not').value.trim() });
          a['Son şiddet'] = +$('#siddet').value; a['Son tarih'] = S.gun; a['Son cevap'] = cevap;
          pencereKapat(); bildir('✅ Kaydedildi');
        };
      });
  }
  function yeniNot() {
    var sec = { tur: 'antrenman kaynaklı', bolge: '', taraf: 'sağ' };
    function grup(ad, liste, alan) {
      return '<div class="form-alan"><span class="etiket-yazi">' + ad + '</span><div class="cipler" role="group" aria-label="' + ad + '">' +
        liste.map(function (x) { return '<button class="cip' + (sec[alan] === x ? ' secili' : '') + '" data-alan="' + alan + '" data-deger="' + esc(x) + '" aria-pressed="' + (sec[alan] === x) + '">' + esc(x) + '</button>'; }).join('') + '</div></div>';
    }
    function ciz3() {
      pencereIcerik('<h3 style="margin:8px 0 0">Yeni not</h3>' + grup('Tür', TURLER, 'tur') + grup('Bölge', BOLGELER, 'bolge') + grup('Taraf', TARAFLAR, 'taraf') +
        siddetAlani(2) + '<div id="s-uyari" class="uyari" hidden>⚠ Şiddet 7 ve üstü: bir doktora danış.</div>' +
        (sec.tur === 'antrenman kaynaklı' ? '<div class="form-alan"><label for="n-hareket">Hangi hareket? (isteğe bağlı)</label><input id="n-hareket" type="text"></div>' : '') +
        '<div class="form-alan"><label for="n-not">Kısa not (isteğe bağlı)</label><input id="n-not" type="text" placeholder="Ör. sabah tutulmayla uyandım"></div>' +
        '<button class="ana-dugme" id="n-kaydet">Kaydet</button>', function () {
          siddetBagla();
          document.querySelectorAll('[data-alan]').forEach(function (b) {
            b.onclick = function () {
              var s = $('#siddet').value; sec[b.getAttribute('data-alan')] = b.getAttribute('data-deger'); ciz3(); $('#siddet').value = s; $('#s-deger').textContent = bicim(+s, 1);
            };
          });
          $('#n-kaydet').onclick = function () {
            if (!sec.bolge) { bildir('Bölge seç'); return; }
            var simdi = new Date();
            var v = { id: kimlik('A'), acilis: S.gun + ' ' + saatMetni(simdi), tur: sec.tur, bolge: sec.bolge, taraf: sec.taraf, siddet: +$('#siddet').value,
              hareket: $('#n-hareket') ? $('#n-hareket').value.trim() : '', not: $('#n-not').value.trim() };
            islemEkle('agri_ekle', v);
            S.agri.push({ 'ID': v.id, 'Açılış': v.acilis, 'Tür': v.tur, 'Bölge': v.bolge, 'Taraf': v.taraf, 'Şiddet': v.siddet, 'Hareket': v.hareket, 'Not': v.not, 'Durum': 'açık' });
            pencereKapat(); ciz(); bildir('✅ Not kaydedildi');
          };
        });
    }
    ciz3();
  }

  /* ---------- Anahtar ekranı ---------- */
  function anahtarEkrani(ana, yanlis) {
    acilisKapat();
    ana.innerHTML = '<section class="kart"><h1 style="margin-top:0">Zindem</h1>' +
      (yanlis ? '<p class="uyari">⚠ Anahtar kabul edilmedi. Apps Script › Proje Ayarları › Komut dosyası özellikleri › ANAHTAR değerini kontrol et.</p>' : '') +
      '<p>Gizli anahtarını yapıştır. Anahtar bu adresin sonuna eklenir; ana ekran kısayolunu bundan sonra oluştur.</p>' +
      '<div class="form-alan"><label for="anahtar-kutu">Gizli anahtar</label><input id="anahtar-kutu" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
      '<button class="ana-dugme" id="anahtar-kaydet">Devam</button></section>';
    $('#anahtar-kaydet').onclick = function () {
      var v = $('#anahtar-kutu').value.trim(); if (!v) return;
      location.hash = 'k=' + encodeURIComponent(v);
      S.anahtar = v; S.hata = ''; S.yuklendi = false; baslat();
    };
  }

  /* ---------- Bildirim ---------- */
  var bildirimZaman = null;
  function bildir(metin, dugme, fn) {
    var b = $('#bildirim');
    b.innerHTML = '<span>' + esc(metin) + '</span>' + (dugme ? '<button id="bildirim-dugme">' + esc(dugme) + '</button>' : '');
    b.hidden = false;
    if (dugme) $('#bildirim-dugme').onclick = function () { b.hidden = true; fn(); };
    clearTimeout(bildirimZaman);
    bildirimZaman = setTimeout(function () { b.hidden = true; }, dugme ? 5000 : 2500);
  }

  /* ---------- Başlat ---------- */
  function anahtarOku() {
    var m = /(?:^|[#&])k=([^&]+)/.exec(location.hash);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function baslat() {
    S.anahtar = anahtarOku();
    if (!S.anahtar) { ciz(); return; }
    ciz();
    yukle().then(function () { ciz(); gonder(); });
  }
  document.querySelectorAll('[data-yakinda]').forEach(function (b) {
    b.onclick = function () { bildir(b.getAttribute('data-yakinda') + ' ekranı yakında geliyor'); };
  });
  window.addEventListener('online', gonder);
  setInterval(gonder, 30000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !S.anahtar) return;
    // Gün değiştiyse ya da 5 dakikadan uzun süre arka plandaysa yeniden yükle
    if (gunBul(Date.now()) !== S.gun || Date.now() - S.sonYukleme > 300000) {
      if (gunBul(Date.now()) !== S.gun) S.seciliOgun = ogunBul(Date.now());
      yukle().then(function () { if ($('#pencere').hidden) ciz(); gonder(); });
    } else gonder();
  });
  baslat();
})();
