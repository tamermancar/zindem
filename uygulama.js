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
  // Apps Script'teki Kod.gs, tablo kodunu bu dosyadan okur (Ev Bütçesi düzeni). Sürüm, sunucu.js içindekiyle aynı olmalı.
  var SUNUCU_SURUM = '1.5.0';
  var SUNUCU_ADRES = location.origin + location.pathname.replace(/[^/]*$/, '') + 'sunucu.js';

  var S = {
    anahtar: '', ayar: {}, hedefler: [], besinlerim: [], katalog: { besinler: [], kategoriler: [] },
    besinler: {}, kayitlar: [], gunluk: { su: 0, adim: '', uyku: '' }, agri: [], son: [], sik: {},
    gun: '', bugun: '', gunler: {}, onceki: {}, sonGiden: [], gv: {}, aralikBas: '', oncekiBas: {}, oncekiSunucu: {}, yukleniyor: false, seciliOgun: '', yuklendi: false, hata: '', gonderiliyor: false, sonYukleme: 0
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
      // 1.5: porsiyon = ev yemeği (değerler 1 porsiyon için); malzeme = çiğ/kuru tarif malzemesi (listede görünmez)
      b[x.id] = { id: x.id, ad: x.ad, kat: x.g || x.kat, grup: x.g || grupBul(x.kat, x.ad), o: x.o || null, porsiyon: !!x.porsiyon, kcal: x.kcal, p: x.p,
        olcu: x.porsiyon ? [['1 porsiyon', 1]] : x.olcu.slice(), kaynak: x.kaynak, benim: false, malzeme: !!x.m, malzemeler: x.malzemeler || null };
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
        kaynak: r['Kaynak'] || (kat && kat.kaynak) || '', not: r['Not'] || '', benim: true,
        pYok: !isFinite(p) && !kat
      };
      x.grup = kat && !r['Kategori'] ? kat.grup : grupBul(r['Kategori'], x.ad);
      x.o = ogunPuaniCoz(r['Öğünler']) || (kat ? kat.o : null);
      if (porsiyon) x.olcu = [['1 porsiyon', 1]];
      if (kat) ortulen[kat.id] = id;
      b[id] = x;
    });
    S.besinler = b; S.ortulen = ortulen;
  }
  /* Besin grupları ve öğün puanları (0: o öğünde listelenmez, sadece aramada · 3: en üstte) */
  var GRUPLAR = ['Kahvaltılık', 'Süt ve yoğurt', 'Ekmek ve tahıl', 'Hamur işleri', 'Et, tavuk, balık', 'Baklagiller', 'Çorbalar',
    'Sebze yemekleri', 'Salatalar', 'Sebzeler', 'Pilav ve makarna', 'Meyve', 'Kuruyemiş ve tohumlar', 'Tatlılar',
    'Paketli atıştırmalık', 'İçecekler', 'Yağ, sos ve diğer'];
  var GRUP_PUAN = { // kahvaltı, öğle, akşam, çay
    'Kahvaltılık': [3, 1, 0, 1], 'Süt ve yoğurt': [1, 2, 2, 1], 'Ekmek ve tahıl': [3, 2, 2, 1], 'Hamur işleri': [2, 1, 0, 3],
    'Et, tavuk, balık': [0, 2, 3, 0], 'Baklagiller': [0, 2, 3, 0], 'Çorbalar': [0, 3, 3, 0], 'Sebze yemekleri': [0, 3, 3, 0],
    'Salatalar': [0, 3, 3, 0], 'Sebzeler': [2, 2, 2, 0], 'Pilav ve makarna': [0, 2, 3, 0], 'Meyve': [1, 1, 0, 3],
    'Kuruyemiş ve tohumlar': [1, 0, 0, 3], 'Tatlılar': [0, 0, 1, 3], 'Paketli atıştırmalık': [0, 0, 0, 3], 'İçecekler': [2, 1, 1, 2],
    'Yağ, sos ve diğer': [0, 0, 0, 0]
  };
  var OGUN_SIRA = { kahvalti: 0, ogle: 1, aksam: 2, cay: 3 };
  function grupBul(kategori, ad) { // sunucu.js'teki grupBul_ ile aynı
    kategori = String(kategori || ''); var a = String(ad || '').toLocaleLowerCase('tr-TR');
    if (GRUPLAR.indexOf(kategori) >= 0) return kategori;
    var v = function (re) { return re.test(a); };
    if (v(/çorba/)) return 'Çorbalar';
    if (v(/salata/)) return 'Salatalar';
    if (v(/pilav|makarna|erişte|mantı|kuskus/)) return 'Pilav ve makarna';
    if (v(/börek|poğaça|simit|açma|kek|kurabiye|pide|gözleme|çörek/)) return 'Hamur işleri';
    if (v(/bisküvi|gofret|çikolata|cips|browni|kraker|bar\b/)) return 'Paketli atıştırmalık';
    if (v(/tatlı|kadayıf|baklava|sütlaç|muhallebi|puding|helva|dondurma|revani|kazandibi/)) return 'Tatlılar';
    if (v(/fasulye|nohut|mercimek|barbunya|börülce|humus/)) return 'Baklagiller';
    if (v(/omlet|menemen|yumurta|peynir|labne|lor|zeytin|pekmez|bal\b|reçel|tahin|kaymak/)) return 'Kahvaltılık';
    var esle = {
      'Süt ürünleri': 'Süt ve yoğurt', 'Yumurta': 'Kahvaltılık', 'Et, tavuk, balık': 'Et, tavuk, balık',
      'Kurubaklagiller': 'Baklagiller', 'Kuruyemiş ve yağlı tohumlar': 'Kuruyemiş ve tohumlar', 'Ekmek ve tahıllar': 'Ekmek ve tahıl',
      'Sebzeler': 'Sebzeler', 'Meyveler': 'Meyve', 'Yağlar': 'Yağ, sos ve diğer', 'Soslar ve diğer': 'Yağ, sos ve diğer',
      'Şeker ve tatlılar': 'Tatlılar', 'İçecekler': 'İçecekler'
    };
    if (esle[kategori]) return esle[kategori];
    if (/\(ev\)/.test(a)) return 'Sebze yemekleri';
    return 'Yağ, sos ve diğer';
  }
  function ogunPuaniCoz(metin) { // "kahvalti:3; aksam:0"
    if (!metin) return null;
    var p = [null, null, null, null], var_ = false;
    String(metin).split(';').forEach(function (x) { var m = /(\w+)\s*:\s*(\d)/.exec(x.trim()); if (m && OGUN_SIRA[m[1]] !== undefined) { p[OGUN_SIRA[m[1]]] = +m[2]; var_ = true; } });
    return var_ ? p : null;
  }
  function ogunPuani(b, ogunK) {
    var i = OGUN_SIRA[ogunK], v = b.o && b.o[i] != null ? b.o[i] : (GRUP_PUAN[b.grup] || [1, 1, 1, 1])[i];
    return v;
  }
  function siraPuani(b, ogunK) { return (S.sik[ogunAdi(ogunK) + '|' + b.id] || 0) * 3 + ogunPuani(b, ogunK); }
  function deger(besin, olcuAd, miktar) {
    if (besin.porsiyon) return { gram: '', kcal: besin.kcal * miktar, p: besin.p * miktar };
    var g = olcuAd === 'gram' ? miktar : gramOlcu(besin, olcuAd) * miktar;
    return { gram: g, kcal: besin.kcal * g / 100, p: besin.p * g / 100 };
  }
  function gramOlcu(besin, olcuAd) {
    for (var i = 0; i < besin.olcu.length; i++) if (besin.olcu[i][0] === olcuAd) return besin.olcu[i][1];
    return 100;
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
    fetch(ADRES, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ k: S.anahtar, s: SUNUCU_ADRES, sv: SUNUCU_SURUM, islemler: parti }) })
      .then(function (r) { return r.json(); })
      .then(function (c) {
        if (!c.ok) throw new Error(c.hata || 'hata');
        var tamam = {}; var hatali = [];
        (c.sonuc || []).forEach(function (s) { tamam[s.id] = 1; if (!s.ok) hatali.push(s.hata); });
        var simdi = Date.now();
        parti.forEach(function (x) { if (tamam[x.islemId]) S.sonGiden.push({ t: simdi, is: x }); });
        S.sonGiden = S.sonGiden.filter(function (x) { return simdi - x.t < 300000; });
        bekleyenYaz(bekleyenler().filter(function (x) { return !tamam[x.islemId]; }));
        if (hatali.length) bildir('⚠ Bir kayıt yazılamadı: ' + hatali[0]);
        S.gonderiliyor = false; S.gonderHata = false; durumGoster();
        if (bekleyenler().length) gonder();
      })
      .catch(function () { S.gonderiliyor = false; S.gonderHata = true; durumGoster(); });
  }
  /* 1.4: Açılışta son 35 gün tek istekte gelir ve sadece bellekte durur (tarayıcıya yazılmaz).
     Böylece önceki günlere ve Bugüne dön'e geçiş beklemeden olur. */
  var ARALIK_GUN = 35;
  function istekAdresi(prm) {
    var u = ADRES + '?k=' + encodeURIComponent(S.anahtar) + '&s=' + encodeURIComponent(SUNUCU_ADRES) + '&sv=' + encodeURIComponent(SUNUCU_SURUM);
    Object.keys(prm).forEach(function (k) { u += '&' + k + '=' + encodeURIComponent(prm[k]); });
    return u;
  }
  function gunlukNesnesi(g) {
    g = g || {};
    return { su: sayi(g['Su (ml)']) || 0, adim: g['Adım'] === undefined || g['Adım'] === null ? '' : String(g['Adım']), uyku: g['Uyku'] || '' };
  }
  // Sunucudan gelen gün verilerini belleğe yerleştirir. Eski sunucu (aralık bilmeyen) gelirse sadece istenen gün yazılır.
  function gunVerisiYaz(c, istenen, bas, bitis) {
    if (c.gunVeri && c.bas) {
      for (var g = c.bas; g <= c.bitis; g = gunKaydir(g, 1)) {
        var x = c.gunVeri[g] || {};
        S.gv[g] = { kayitlar: x.kayitlar || [], gunluk: gunlukNesnesi(x.gunluk) };
      }
      if (!S.aralikBas || c.bas < S.aralikBas) { S.aralikBas = c.bas; S.oncekiBas = c.oncekiBas || {}; }
    } else {
      S.gv[istenen] = { kayitlar: c.bugun || [], gunluk: gunlukNesnesi(c.gunluk) };
      S.oncekiSunucu[istenen] = c.oncekiOgun || {};
    }
  }
  // Ekranda gösterilecek günü seçer (bellekten, beklemeden)
  function gunGoster(g) {
    S.gun = g;
    var v = S.gv[g] || (S.gv[g] = { kayitlar: [], gunluk: gunlukNesnesi() });
    S.kayitlar = v.kayitlar; S.gunluk = v.gunluk;
    S.onceki = oncekiHesapla(g);
  }
  // Her öğün için bu günden önceki son kayıtlı gün ("Dünkü kahvaltıyı ekle")
  function oncekiHesapla(g) {
    if (!S.aralikBas || g < S.aralikBas) return S.oncekiSunucu[g] || {};
    var sonuc = {};
    OGUNLER.forEach(function (o) {
      for (var d = gunKaydir(g, -1); d >= S.aralikBas; d = gunKaydir(d, -1)) {
        var l = ((S.gv[d] || {}).kayitlar || []).filter(function (k) { return k['Öğün'] === o.ad && k['Besin ID']; });
        if (l.length) { sonuc[o.ad] = { gun: d, kayitlar: l.map(function (k) { return { besinId: k['Besin ID'], ad: k['Ad'], miktar: k['Miktar'], olcu: k['Ölçü'] }; }) }; return; }
      }
      if (S.oncekiBas[o.ad]) sonuc[o.ad] = S.oncekiBas[o.ad];
    });
    return sonuc;
  }
  function yukle(gun) {
    S.bugun = gunBul(Date.now());
    if (gun) S.gun = gun;
    if (!S.gun || S.gun > S.bugun) S.gun = S.bugun;
    var istenen = S.gun, bas = gunKaydir(S.bugun, -(ARALIK_GUN - 1)), basladi = Date.now();
    if (istenen < bas) bas = istenen.slice(0, 8) + '01';
    return Promise.all([
      fetch(istekAdresi({ gun: istenen, bas: bas, bitis: S.bugun })).then(function (r) { return r.json(); }),
      S.katalog.besinler.length ? Promise.resolve(S.katalog) : fetch('katalog.json?v=3').then(function (r) { return r.json(); })
    ]).then(function (sonuc) {
      var c = sonuc[0];
      if (!c.ok) { S.hata = c.hata === 'yetkisiz' ? 'yetkisiz' : 'Sunucu hatası: ' + c.hata; return; }
      S.katalog = sonuc[1];
      S.ayar = {}; (c.ayarlar || []).forEach(function (a) { S.ayar[a['Anahtar']] = a['Değer']; });
      S.hedefler = c.hedefler || []; S.besinlerim = c.besinlerim || [];
      S.agri = c.agri || []; S.son = c.sonYenenler || []; S.sik = c.sikYenenler || {};
      S.gunler = {}; (c.gunler || []).forEach(function (g) { S.gunler[g] = 1; });
      S.gv = {}; S.aralikBas = ''; S.oncekiBas = {}; S.oncekiSunucu = {};
      gunVerisiYaz(c, istenen);
      besinleriKur();
      // Okuma sürerken tabloya gönderilen kayıtlar okunan veride olmayabilir: onları da yeniden uygula
      islemleriUygula(S.sonGiden.filter(function (x) { return x.t >= basladi - 2000; }).map(function (x) { return x.is; }));
      bekleyenleriUygula();
      gunGoster(S.gv[S.gun] ? S.gun : istenen);
      if (!S.seciliOgun) S.seciliOgun = ogunBul(Date.now());
      S.yuklendi = true; S.yukleniyor = false; S.hata = ''; S.sonYukleme = Date.now();
    }).catch(function () { S.hata = 'baglanti'; S.yukleniyor = false; });
  }
  // Bellekte olmayan eski bir güne geçerken: o ayın başından bellekteki ilk güne kadar tek istek
  function eskiYukle(g) {
    var bas = S.aralikBas ? g.slice(0, 8) + '01' : g, bitis = S.aralikBas ? gunKaydir(S.aralikBas, -1) : g;
    return fetch(istekAdresi({ gun: g, bas: bas, bitis: bitis, sade: '1' })).then(function (r) { return r.json(); }).then(function (c) {
      if (!c.ok) throw new Error(c.hata);
      gunVerisiYaz(c, g);
      bekleyenleriUygula();
    });
  }
  // Sunucuya henüz gitmemiş kayıtlar ekranda görünsün
  function bekleyenleriUygula() { islemleriUygula(bekleyenler()); }
  function islemleriUygula(liste) {
    liste.forEach(function (is) {
      var v = is.veri, gun;
      if (is.tur === 'ogun_ekle' && S.gv[v.gun] && !kayitBul(v.id)) S.gv[v.gun].kayitlar.push(kayitNesnesi(v));
      if (is.tur === 'ogun_guncelle') { var k = kayitBul(v.id); if (k) { k['Miktar'] = v.miktar; k['Gram'] = v.gram; k['kcal'] = v.kcal; k['Protein'] = v.p; } }
      if (is.tur === 'ogun_sil') kayitCikar(v.id);
      if (is.tur === 'gunluk' && (gun = S.gv[v.gun])) {
        if (v.alan === 'su') gun.gunluk.su = +v.deger; if (v.alan === 'adim') gun.gunluk.adim = String(v.deger); if (v.alan === 'uyku') gun.gunluk.uyku = v.deger;
      }
      if (is.tur === 'besin_ekle' && !S.besinler[v.id]) {
        S.besinlerim.push({ 'ID': v.id, 'Ad': v.ad, 'Kategori': v.kategori, 'Katalog ID': '', 'Temel': v.temel, 'kcal': v.kcal, 'Protein': v.p, 'Ölçüler': v.olculer, 'Kaynak': 'Elle eklendi' });
        besinleriKur();
      }
    });
  }

  /* ---------- Kayıt işlemleri ---------- */
  // Kayıt, bellekteki bütün günlerde aranır (bekleyen işlemler başka güne ait olabilir)
  function kayitBul(id) {
    for (var g in S.gv) { var l = S.gv[g].kayitlar; for (var i = 0; i < l.length; i++) if (l[i]['ID'] === id) return l[i]; }
    return null;
  }
  function kayitCikar(id) {
    for (var g in S.gv) { var l = S.gv[g].kayitlar; for (var i = l.length - 1; i >= 0; i--) if (l[i]['ID'] === id) l.splice(i, 1); }
  }
  function kayitNesnesi(v) {
    return { 'ID': v.id, 'Gün': v.gun, 'Saat': v.saat, 'Öğün': v.ogun, 'Besin ID': v.besinId, 'Ad': v.ad, 'Miktar': v.miktar, 'Ölçü': v.olcu, 'Gram': v.gram, 'kcal': v.kcal, 'Protein': v.p };
  }
  function yuvarla(n) { return Math.round(n * 10) / 10; }
  function kayitEkle(besin, olcuAd, miktar, ogunK, sessiz) {
    var d = deger(besin, olcuAd, miktar), simdi = new Date();
    var v = {
      id: kimlik('O'), gun: S.gun, saat: saatMetni(simdi), ogun: ogunAdi(ogunK), besinId: besin.id, ad: besin.ad,
      miktar: miktar, olcu: besin.porsiyon ? '1 porsiyon' : olcuAd, gram: d.gram === '' ? '' : yuvarla(d.gram), kcal: Math.round(d.kcal), p: besin.pYok ? '' : yuvarla(d.p)
    };
    S.kayitlar.push(kayitNesnesi(v)); S.gunler[S.gun] = 1;
    islemEkle('ogun_ekle', v);
    if (!sessiz) ciz();
  }
  function kayitMiktar(id, yeni) {
    var k = kayitBul(id); if (!k) return;
    if (yeni <= 0) {
      var eski = JSON.parse(JSON.stringify(k));
      kayitCikar(id);
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
    k['Miktar'] = yeni; k['Gram'] = d.gram === '' ? '' : yuvarla(d.gram); k['kcal'] = Math.round(d.kcal); k['Protein'] = b.pYok ? '' : yuvarla(d.p);
    islemEkle('ogun_guncelle', { id: id, miktar: yeni, gram: k['Gram'], kcal: k['kcal'], p: k['Protein'] });
    ciz();
  }
  function suDegistir(fark) {
    S.gunluk.su = Math.max(0, (S.gunluk.su || 0) + fark);
    islemEkle('gunluk', { gun: S.gun, alan: 'su', deger: S.gunluk.su });
    ciz();
  }

  /* ---------- Ekran ---------- */
  function ik(ad, ek) { return '<svg class="ikon' + (ek ? ' ' + ek : '') + '" aria-hidden="true"><use href="#t-' + ad + '"/></svg>'; }
  var TEKRAR_AD = { kahvalti: ['kahvaltıyı', 'kahvaltısını'], ogle: ['öğle yemeğini', 'öğle yemeğini'], aksam: ['akşam yemeğini', 'akşam yemeğini'], cay: ['çay saatini', 'çay saatini'] };
  var OGUN_IKON = { kahvalti: 'egg-fried', ogle: 'salad', aksam: 'soup', cay: 'coffee' };
  var YONELME = { kahvalti: 'Kahvaltıya', ogle: 'Öğleye', aksam: 'Akşama', cay: 'Çay saatine' };
  /* ---------- 1.4 Bugün üst bölümü ---------- */
  // Profil alanı: şimdilik adın baş harfleri (fotoğraf ileride Ayarlar'dan, sadece kendi tablona yazılacak)
  function basHarfler() {
    var ad = String(ayar('ad', '') || '').trim(); if (!ad) return '';
    return ad.split(/\s+/).slice(0, 2).map(function (x) { return x.charAt(0).toLocaleUpperCase('tr-TR'); }).join('');
  }
  function selamKisa() {
    var h = new Date().getHours();
    return h >= 5 && h < 12 ? 'Günaydın' : h < 18 && h >= 12 ? 'İyi günler' : h >= 18 && h < 23 ? 'İyi akşamlar' : 'İyi geceler';
  }
  // Geçmiş günde selamlama yerine tarih ve "Bugüne dön" gelir; satır yüksekliği değişmez
  function ustSatir() {
    var bh = basHarfler(), bugun = bugunMu();
    var pg = S.gun.split('-'), dg = new Date(+pg[0], +pg[1] - 1, +pg[2]);
    var ust = bugun ? selamKisa() : (gunKaydir(S.bugun, -1) === S.gun ? 'Dün · ' : '') + GUNLER[dg.getDay()];
    var alt = bugun ? esc(ayar('ad', '') || 'Zindem') : dg.getDate() + ' ' + AYLAR[dg.getMonth()] + (dg.getFullYear() !== new Date().getFullYear() ? ' ' + dg.getFullYear() : '');
    return '<header class="ust-satir" id="ust-satir"><span class="profil" aria-hidden="true">' + (bh || ik('user')) + '</span>' +
      '<div class="selam"><small>' + ust + '</small><h1>' + alt + '</h1></div><button id="durum" class="senk" hidden></button>' +
      (bugun ? '' : '<button class="bugune-don" data-bugune>Bugüne dön</button>') +
      '<button class="yuvarlak-dugme" id="agri-dugme" aria-label="Ağrı ve sağlık notu' + (S.agri.length ? ' (' + S.agri.length + ' açık not)' : '') + '">' + ik('bandage') +
      (S.agri.length ? '<span class="nokta" aria-hidden="true"></span>' : '') + '</button></header>';
  }
  var SERIT_GUN = 35, AY_KISA = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];
  var GUN_KISA = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
  // Kayan tarih şeridi: başta takvim, sonra son 35 gün; en sağda bugün. Ayın 1'inde gün adı yerine ay adı ve solunda ayırıcı.
  function serit() {
    var h = '<div class="serit" id="serit" role="group" aria-label="Gün seç"><button class="sg takvim-sg" data-takvim aria-label="Takvimi aç">' + ik('calendar') + '</button>';
    for (var i = SERIT_GUN - 1; i >= 0; i--) {
      var g = gunKaydir(S.bugun, -i), p = g.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
      var ayBasi = d.getDate() === 1, c = 'sg' + (g === S.bugun ? ' bugun' : '') + (g === S.gun ? ' secili' : '') + (S.gunler[g] ? ' kayitli' : '') + (ayBasi ? ' ay-basi' : '');
      if (ayBasi && i < SERIT_GUN - 1) h += '<span class="ay-ayrac" aria-hidden="true"></span>';
      h += '<button class="' + c + '" data-gun-sec="' + g + '" aria-label="' + d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + GUNLER[d.getDay()] + (S.gunler[g] ? ', kayıt var' : '') + '"' + (g === S.gun ? ' aria-current="date"' : '') + '>' +
        '<small>' + (g === S.bugun ? 'Bugün' : ayBasi ? AY_KISA[d.getMonth()] : GUN_KISA[d.getDay()]) + '</small><b>' + d.getDate() + '</b></button>';
    }
    return h + '</div>';
  }
  // Şerit yeniden çizilince kaydırma yeri korunur; seçili gün görünmüyorsa görünür yapılır
  function seritKonum() {
    var el = $('#serit'); if (!el) return;
    if (S.seritX == null) el.scrollLeft = el.scrollWidth; else el.scrollLeft = S.seritX;
    var s = el.querySelector('.secili');
    if (s) { var sol = s.offsetLeft - el.offsetLeft, sag = sol + s.offsetWidth; if (sol < el.scrollLeft || sag > el.scrollLeft + el.clientWidth) el.scrollLeft = sag - el.clientWidth + 8; }
    S.seritX = el.scrollLeft;
  }
  function seritBagla() {
    var el = $('#serit'); if (!el) return;
    el.addEventListener('scroll', function () { S.seritX = el.scrollLeft; }, { passive: true });
    el.querySelectorAll('[data-gun-sec]').forEach(function (b) { b.onclick = function () { gunDegistir(b.getAttribute('data-gun-sec')); }; });
  }
  /* İç içe halka: dış kalori, iç protein. Hedef aşılınca aşan kısım aynı halkada başlangıçtan itibaren başka renkte; ucunda küçük top. */
  var R = { kal: 'var(--h-kal)', kalAs: 'var(--h-kal-as)', pro: 'var(--h-pro)', proTamam: 'var(--h-pro-tamam)', proAs: 'var(--h-pro-as)' };
  function yay(r, w, oran, renk, asRenk) {
    var c = 2 * Math.PI * r, o = Math.max(0, Math.min(1, oran || 0)), a = Math.max(0, Math.min(1, (oran || 0) - 1));
    var t = '<circle class="iz' + (r < 60 ? ' iz-p' : '') + '" cx="82" cy="82" r="' + r + '" fill="none" stroke-width="' + w + '"/>';
    if (o > 0) t += '<circle class="dolu" cx="82" cy="82" r="' + r + '" fill="none" style="stroke:' + renk + '" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - o)) + '" transform="rotate(-90 82 82)"/>';
    if (a > 0) t += '<circle class="dolu" cx="82" cy="82" r="' + r + '" fill="none" style="stroke:' + asRenk + '" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - a)) + '" transform="rotate(-90 82 82)"/>';
    if (o >= 0.04) {
      var u = a > 0 ? a : o, aci = (u * 360 - 90) * Math.PI / 180;
      t += '<circle class="top" cx="' + (82 + r * Math.cos(aci)).toFixed(1) + '" cy="' + (82 + r * Math.sin(aci)).toFixed(1) + '" r="' + (w / 2 + 2.5) + '" style="fill:' + (a > 0 ? asRenk : renk) + '"/>';
    }
    return t;
  }
  function ozetKarti(t, hk, hp, hs, ha, su, adim) {
    var kO = hk ? t.kcal / hk : 0, pT = Math.round(t.p), pO = hp ? t.p / hp : 0;
    var kFazla = hk && t.kcal > hk, pTamam = hp && pT >= hp;
    var kB = hk ? (kFazla ? '+' + bicim(t.kcal - hk) : bicim(hk - t.kcal)) : bicim(t.kcal), kA = hk ? (kFazla ? 'kcal fazla' : 'kcal kaldı') : 'kcal';
    var pB = hp ? (pT > hp ? '+' + bicim(pT - hp) + ' g' : pT === hp ? '✓' : bicim(hp - pT) + ' g') : bicim(pT) + ' g';
    var pA = hp ? (pT > hp ? 'protein fazla' : pT === hp ? 'protein tamam' : 'protein kaldı') : 'protein';
    var aria = 'Kalori ' + bicim(t.kcal) + (hk ? ' / ' + bicim(hk) + ', ' + (kFazla ? bicim(t.kcal - hk) + ' fazla' : bicim(hk - t.kcal) + ' kaldı') : '') +
      '. Protein ' + bicim(pT) + ' gram' + (hp ? ' / ' + bicim(hp) + ', ' + (pT >= hp ? 'hedef tamam' : bicim(hp - pT) + ' gram kaldı') : '') + (t.pYok ? ', bazı besinlerin proteini bilinmiyor' : '');
    var h = '<section class="ozet-kart' + (bugunMu() ? '' : ' gecmis') + '" aria-label="Günün özeti"><div class="ozet-sol">' +
      '<div class="halka2" role="img" aria-label="' + esc(aria) + '"><svg viewBox="0 0 164 164" aria-hidden="true">' +
      yay(70, 14, kO, R.kal, R.kalAs) + yay(51, 12, pO, pTamam ? R.proTamam : R.pro, R.proAs) + '</svg>' +
      '<div class="halka-ic" aria-hidden="true"><b class="k' + (kFazla ? ' fazla' : '') + '">' + kB + '</b><small>' + kA + '</small><i></i>' +
      '<b class="p' + (pTamam ? ' tamam' : '') + '">' + pB + '</b><small>' + pA + (t.pYok ? ' ⚠' : '') + '</small></div></div>' +
      '<div class="halka-alt" aria-hidden="true"><span class="k' + (kFazla ? ' fazla' : '') + '">' + bicim(t.kcal) + '</span>' + (hk ? '/' + bicim(hk) : '') + ' kcal · <span class="p' + (pTamam ? ' tamam' : '') + '">' + bicim(pT) + '</span>' + (hp ? '/' + bicim(hp) : '') + ' g</div></div>' +
      '<div class="ozet-liste">' +
      listeSatir('su-dugme', 'droplet', 'su', 'Su', '<i>' + (su ? bicim(su / 1000, 2) : '0') + '</i>' + (hs ? ' / ' + bicim(hs / 1000, 2) : '') + ' L', hs ? su / hs : 0,
        'Su ' + bicim(su / 1000, 2) + ' litre' + (hs ? ', hedef ' + bicim(hs / 1000, 2) : '') + '. Dokun: su ekle') +
      listeSatir('adim-dugme', 'footsteps', 'adim', 'Adım', '<i>' + (isFinite(adim) ? bicim(adim) : '—') + '</i>' + (ha ? ' / ' + bicim(ha) : ''), ha && isFinite(adim) ? adim / ha : 0,
        'Adım ' + (isFinite(adim) ? bicim(adim) : 'girilmedi') + (ha ? ', hedef ' + bicim(ha) : '') + '. Dokun: adım gir') +
      listeSatir('antrenman-dugme', 'barbell', 'antrenman', 'Antrenman', '2. sürümde', -1, 'Antrenman, 2. sürümde geliyor') +
      '</div></section>';
    return h;
  }
  function listeSatir(id, ikon, tur, ad, deger, oran, aria) {
    return '<button class="ls ls-' + tur + '" id="' + id + '" aria-label="' + esc(aria) + '"><span class="lk" aria-hidden="true">' + ik(ikon, ikon === 'barbell' ? 'capraz' : '') + '</span>' +
      '<b>' + ad + '</b><small>' + deger + '</small>' +
      (oran >= 0 ? '<span class="cubuk" aria-hidden="true"><span style="width:' + Math.round(Math.max(0, Math.min(1, oran)) * 100) + '%"></span></span>' : '') + '</button>';
  }
  function toplamlar(liste) {
    return liste.reduce(function (t, k) { t.kcal += sayi(k['kcal']) || 0; t.p += sayi(k['Protein']) || 0; if (k['Protein'] === '' || k['Protein'] == null) t.pYok = true; return t; }, { kcal: 0, p: 0, pYok: false });
  }
  function bugunMu() { return S.gun === S.bugun; }
  function gunKaydir(gun, n) {
    var p = gun.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n);
    return tarihMetni(d);
  }
  function gunAdiKisa(gun) {
    if (gun === S.bugun) return 'Bugün';
    if (gun === gunKaydir(S.bugun, -1)) return 'Dün';
    var p = gun.split('-'); return (+p[2]) + ' ' + AYLAR[+p[1] - 1];
  }
  function gunDegistir(yeni) {
    if (yeni > S.bugun || yeni === S.gun) return;
    var eski = S.gun;
    S.acikOgun = ''; titret();
    if (S.gv[yeni]) { S.yukleniyor = false; gunGoster(yeni); ciz(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    // Bellekte yok: o ay bir kez çekilir, bu sırada ekran soluk bekler
    S.gun = yeni; S.kayitlar = []; S.gunluk = gunlukNesnesi(); S.onceki = {}; S.yukleniyor = true;
    ciz(); window.scrollTo({ top: 0, behavior: 'smooth' });
    eskiYukle(yeni).then(function () {
      if (S.gun !== yeni) return; // bu arada başka güne geçildi
      S.yukleniyor = false; gunGoster(yeni); ciz();
    }).catch(function () {
      if (S.gun !== yeni) return;
      S.yukleniyor = false; gunGoster(S.gv[eski] ? eski : S.bugun);
      ciz(); bildir('⚠ O gün açılamadı, internet bağlantını kontrol et');
    });
  }
  function takvimAc() {
    var ay = S.gun.slice(0, 7);
    function icerik() {
      var p = ay.split('-'), y = +p[0], m = +p[1] - 1;
      var ilk = new Date(y, m, 1), gunSay = new Date(y, m + 1, 0).getDate(), bas = (ilk.getDay() + 6) % 7;
      var h = '<div class="takvim-ust"><button class="tn-ok" data-ay="-1" aria-label="Önceki ay">' + ik('chevron-left') + '</button><b>' + AYLAR[m] + ' ' + y + '</b>' +
        '<button class="tn-ok" data-ay="1" aria-label="Sonraki ay"' + (ay >= S.bugun.slice(0, 7) ? ' disabled' : '') + '>' + ik('chevron-right') + '</button></div>' +
        '<div class="takvim" role="grid">' + ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(function (g) { return '<span class="tg">' + g + '</span>'; }).join('');
      for (var i = 0; i < bas; i++) h += '<span></span>';
      for (var d = 1; d <= gunSay; d++) {
        var g = ay + '-' + iki(d), gelecek = g > S.bugun;
        h += '<button class="tgun' + (g === S.gun ? ' secili' : '') + (g === S.bugun ? ' bugun' : '') + (S.gunler[g] ? ' kayitli' : '') + '" data-gun="' + g + '"' +
          (gelecek ? ' disabled' : '') + ' aria-label="' + d + ' ' + AYLAR[m] + (S.gunler[g] ? ', kayıt var' : '') + '">' + d + '</button>';
      }
      h += '</div><p class="ipucu">Noktalı günlerde kayıt var.</p>';
      if (!bugunMu()) h += '<button class="ana-dugme" data-bugune>Bugüne dön</button>';
      return h;
    }
    function bagla() {
      document.querySelectorAll('#pencere [data-ay]').forEach(function (b) {
        b.onclick = function () { var p = ay.split('-'); ay = tarihMetni(new Date(+p[0], +p[1] - 1 + (+b.getAttribute('data-ay')), 1)).slice(0, 7); pencereIcerik(icerik(), bagla, true); };
      });
      document.querySelectorAll('#pencere [data-gun]').forEach(function (b) { b.onclick = function () { pencereKapat(); gunDegistir(b.getAttribute('data-gun')); }; });
      document.querySelectorAll('#pencere [data-bugune]').forEach(function (b) { b.onclick = function () { pencereKapat(); gunDegistir(S.bugun); }; });
    }
    pencereAc('Gün seç', icerik(), bagla, true);
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
  var DURUM_SVG = {
    yuk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18.004h-5.343c-2.572 -.004 -4.657 -2.011 -4.657 -4.487c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.38 0 2.57 .811 3.128 1.986"/><g class="ok"><path d="M19 22v-6"/><path d="M22 19l-3 -3l-3 3"/></g></svg>',
    tamam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 18.004h-4.343c-2.572 -.004 -4.657 -2.011 -4.657 -4.487c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.388 0 2.585 .82 3.138 2.007"/><path d="M15 19l2 2l4 -4" stroke-width="2.4"/></svg>',
    uyari: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0"/><path d="M12 16h.01"/></svg>'
  };
  var durumZaman = null, D = { animBas: 0, tamamBitis: 0 };
  /* Tarihin yanındaki küçük simge (Ev Bütçesi düzeni):
     gönderilecek kayıt varken bulut içinde yukarı kayan ok (en az 1 sn), kaydedilince tikli bulut 1,5 sn, sorun varsa turuncu üçgen. */
  function durumGoster() {
    var el = $('#durum'); if (!el) return;
    clearTimeout(durumZaman);
    var n = bekleyenler().length;
    function goster(tur, etiket) {
      if (el.getAttribute('data-d') !== tur) { el.className = 'senk ' + tur; el.innerHTML = DURUM_SVG[tur]; el.setAttribute('data-d', tur); }
      el.setAttribute('aria-label', etiket); el.hidden = false;
    }
    if (S.gonderHata && n) { D.animBas = 0; goster('uyari', n + ' kayıt gönderilemedi, tekrar denenecek'); return; }
    if (n || S.gonderiliyor) { if (!D.animBas) D.animBas = Date.now(); goster('yuk', 'Kaydediliyor'); return; }
    if (D.animBas) {
      var kalan = 1000 - (Date.now() - D.animBas);
      if (kalan > 0) { goster('yuk', 'Kaydediliyor'); durumZaman = setTimeout(durumGoster, kalan); return; }
      D.animBas = 0; D.tamamBitis = Date.now() + 1500;
    }
    if (Date.now() < D.tamamBitis) { goster('tamam', 'Kaydedildi'); durumZaman = setTimeout(durumGoster, D.tamamBitis - Date.now()); return; }
    el.hidden = true; el.setAttribute('data-d', '');
  }
  function titret() { if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) { /* yok */ } }

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
    var hk = hedef('kalori'), hp = hedef('protein'), hs = hedef('su_ml'), ha = hedef('adim');
    var t = toplamlar(S.kayitlar), su = S.gunluk.su || 0, adim = sayi(S.gunluk.adim);
    var h = '';
    h += ustSatir() + serit() + ozetKarti(t, hk, hp, hs, ha, su, adim);

    if (bugunMu()) h += soruKarti();

    // Öğün sekmeleri: dördü yan yana, seçili olan dolu; altında seçili öğünün içeriği
    var simdiOgun = bugunMu() ? ogunBul(Date.now()) : '', ar = ogunAraliklari();
    var aciklar = OGUNLER.filter(function (o, i) { return ar[i].acik; });
    if (!S.acikOgun || !aciklar.some(function (o) { return o.k === S.acikOgun; })) {
      var dolu = aciklar.filter(function (o) { return S.kayitlar.some(function (k) { return k['Öğün'] === o.ad; }); })[0];
      S.acikOgun = simdiOgun || (dolu ? dolu.k : aciklar[0].k);
    }
    var sec = aciklar.map(function (o) { return o.k; }).indexOf(S.acikOgun);
    var oncekiSec = S.sonSec == null ? sec : S.sonSec; S.sonSec = sec;
    h += '<div class="ogunler"><div class="ogun-sekmeler" role="tablist" aria-label="Öğünler" style="--adet:' + aciklar.length + ';--sec:' + oncekiSec + '" data-sec="' + sec + '"><span class="sekme-isaret" aria-hidden="true"></span>' +
      aciklar.map(function (o) {
        var tt = toplamlar(S.kayitlar.filter(function (k) { return k['Öğün'] === o.ad; })), on = o.k === S.acikOgun;
        return '<button class="ogun-sekme' + (on ? ' on' : '') + '" role="tab" aria-selected="' + on + '" data-ogun="' + o.k + '">' +
          (o.k === simdiOgun ? '<i class="simdi-nokta" aria-label="şimdi"></i>' : '') + ik(OGUN_IKON[o.k]) +
          '<b>' + o.ad + '</b><small>' + (tt.kcal ? bicim(tt.kcal) + ' kcal' : (o.k === simdiOgun ? 'şimdi' : '—')) + '</small></button>';
      }).join('') + '</div>';
    var secili = aciklar[sec];
    h += ogunIcerik(secili, secili.k === simdiOgun);
    h += '</div><p class="alt-not">Zindem teşhis koymaz, tedavi önermez. Kayıtlarını tutar, gösterir ve uyarır.</p>';
    ana.innerHTML = h;
    ana.classList.toggle('yukleniyor-gun', !!S.yukleniyor);
    var sk = $('.ogun-sekmeler'); if (sk) requestAnimationFrame(function () { requestAnimationFrame(function () { sk.style.setProperty('--sec', sk.getAttribute('data-sec')); }); });
    seritKonum();
    durumGoster();
    baglaAna();
    acilisKapat();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-takvim],[data-bugune]');
    if (!t || t.closest('#pencere')) return;
    if (t.hasAttribute('data-takvim')) takvimAc();
    else gunDegistir(S.bugun);
  });
  function acilisKapat() {
    var a = $('#acilis'); if (!a || a.classList.contains('kapaniyor')) return;
    a.classList.add('kapaniyor');
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 400);
  }
  function soruKarti() {
    if (!S.gunluk.uyku && ogunBul(new Date()) === 'kahvalti' && !sonraDendi('uyku')) {
      return '<section class="kart soru-kart" aria-label="Günlük soru"><span class="soru">Dün gece uyku?</span>' +
        ['6\'dan az', '6–7', '7+'].map(function (s, i) { return '<button class="cip" data-uyku="' + ['<6', '6-7', '7+'][i] + '">' + s + '</button>'; }).join('') +
        '<button class="cip duz" data-sonra="uyku">Sonra</button></section>';
    }
    return '';
  }
  function sonraDendi(tur) { try { return localStorage.getItem('zindem-sonra-' + S.gun + '-' + tur) === '1'; } catch (e) { return false; } }
  function sonraDe(tur) { try { localStorage.setItem('zindem-sonra-' + S.gun + '-' + tur, '1'); } catch (e) { /* önemli değil */ } }

  /* Ölçü ve miktar */
  function birimAdi(olcu) {
    if (olcu === 'gram') return 'g';
    return String(olcu || '').replace(/^1\s+/, '').replace(/\s*\(.*\)\s*$/, '');
  }
  function miktarAdimi(besin, olcu) {
    if (olcu === 'gram') return besin && besin.kcal >= 400 ? 5 : 10;
    return /adet|boy|dilim|avuç|kutu/.test(olcu) ? 1 : 0.5;
  }
  function miktarYaz(m) { return bicim(m, 2); }
  function miktarMetni(miktar, olcu) {
    if (olcu === 'gram') return miktarYaz(miktar) + ' g';
    return miktarYaz(miktar) + ' ' + String(olcu || '').replace(/^1\s+/, '');
  }
  // Artı/eksi (1.4.1): ortada dolgulu kare içinde miktar; eksi son adımda çöp kutusuna döner (basınca siler)
  function adimSatiri(veri, ad, miktar, olcu, adimMiktari) {
    var sil = adimMiktari && miktar - adimMiktari <= 0;
    return '<div class="adim" role="group" aria-label="' + esc(ad) + ' miktarı: ' + esc(miktarMetni(miktar, olcu)) + '"><button data-az="' + esc(veri) + '"' + (sil ? ' class="sil"' : '') + ' aria-label="' + esc(ad) + (sil ? ' sil' : ' azalt') + '">' + ik(sil ? 'trash' : 'minus') + '</button>' +
      '<span class="adim-deger"><b>' + miktarYaz(miktar) + (olcu === 'gram' ? ' g' : '') + '</b></span>' +
      '<button data-art="' + esc(veri) + '" aria-label="' + esc(ad) + ' artır">' + ik('plus') + '</button></div>';
  }

  function ogunIcerik(o, simdi) {
    var liste = S.kayitlar.filter(function (k) { return k['Öğün'] === o.ad; });
    var tt = toplamlar(liste);
    var ozet = liste.length ? bicim(tt.kcal) + ' kcal · ' + bicim(tt.p, 1) + ' g protein' + (tt.pYok ? ' ⚠' : '') : '— kcal · — g protein';
    var h = '<section class="kart ogun-kart ' + (S.gecis || '') + '" role="tabpanel" aria-label="' + o.ad + '" data-kart="' + o.k + '">' +
      '<div class="ogun-ust"><span class="ogun-yazi"><span class="ogun-ad">' + o.ad + (simdi ? '<span class="simdi-rozet">şimdi</span>' : '') + '</span><span class="ogun-ozet">' + ozet + '</span></span>' +
      '<button class="ekle-dugme" data-ekle="' + o.k + '" aria-label="' + YONELME[o.k] + ' ekle">' + ik('plus') + 'Ekle</button></div>';
    liste.forEach(function (k) {
      var besinVar = !!S.besinler[k['Besin ID']];
      var pYok = k['Protein'] === '' || k['Protein'] == null;
      h += '<div class="satir"><div class="bilgi"><b>' + esc(k['Ad']) + '</b><small>' + esc(miktarMetni(sayi(k['Miktar']), k['Ölçü'])) + '</small><small>' + bicim(sayi(k['kcal'])) + ' kcal · ' +
        (pYok ? '<span class="uyari-yazi">⚠ protein bilinmiyor</span>' : bicim(sayi(k['Protein']), 1) + ' g protein') + '</small></div>';
      if (besinVar) h += adimSatiri('k:' + k['ID'], k['Ad'], sayi(k['Miktar']), k['Ölçü'], miktarAdimi(S.besinler[k['Besin ID']], k['Ölçü']));
      h += '</div>';
    });
    if (!liste.length) h += '<div class="bos">Henüz bir şey eklemedin.</div>';
    var onc = S.onceki[o.ad];
    var tekrar = !liste.length && onc && onc.kayitlar.some(function (x) { return S.besinler[x.besinId]; })
      ? '<button class="ikinci-dugme tekrar" data-tekrar="' + o.k + '">' + ik('arrow-back-up') +
        (bugunMu() && onc.gun === gunKaydir(S.gun, -1) ? 'Dünkü ' + TEKRAR_AD[o.k][0] : gunAdiKisa(onc.gun) + ' ' + TEKRAR_AD[o.k][1]) + ' ekle</button>' : '';
    if (tekrar) h += '<div class="ogun-alt">' + tekrar + '</div>';
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

  /* Sekme değişince sadece sekme işareti ve öğün kartı yenilenir; üst bölüm ve alt menü yerinde kalır (1.4) */
  function ogunSec(k) {
    if (k === S.acikOgun) return;
    var sira = OGUNLER.map(function (o) { return o.k; });
    var gecis = sira.indexOf(k) > sira.indexOf(S.acikOgun) ? 'gecis-sag' : 'gecis-sol';
    S.acikOgun = k; S.seciliOgun = k; titret();
    var sk = $('.ogun-sekmeler'), eski = $('#uygulama .ogun-kart');
    if (!sk || !eski) { ciz(); return; }
    var sec = 0;
    sk.querySelectorAll('.ogun-sekme').forEach(function (d, i) { var on = d.getAttribute('data-ogun') === k; d.classList.toggle('on', on); d.setAttribute('aria-selected', on); if (on) sec = i; });
    sk.setAttribute('data-sec', sec); sk.style.setProperty('--sec', sec); S.sonSec = sec;
    S.gecis = gecis; kartYenile(k); S.gecis = '';
  }
  function kartYenile(k) {
    var eski = $('#uygulama .ogun-kart'); if (!eski) { ciz(); return; }
    k = k || eski.getAttribute('data-kart');
    var tmp = document.createElement('div');
    tmp.innerHTML = ogunIcerik({ k: k, ad: ogunAdi(k) }, bugunMu() && ogunBul(Date.now()) === k);
    var yeni = tmp.firstChild; eski.parentNode.replaceChild(yeni, eski); baglaKart(yeni);
  }
  function baglaKart(kart) {
    kart.querySelectorAll('[data-ekle]').forEach(function (b) { b.onclick = function () { ekleAc(b.getAttribute('data-ekle')); }; });
    kart.querySelectorAll('[data-tekrar]').forEach(function (b) {
      b.onclick = function () {
        var k = b.getAttribute('data-tekrar'), onc = S.onceki[ogunAdi(k)];
        penOgun = k; S.sepet = [];
        onc.kayitlar.forEach(function (x) {
          var be = S.besinler[x.besinId]; if (!be) return;
          var o = be.porsiyon ? '1 porsiyon' : x.olcu;
          if (!be.porsiyon && o !== 'gram' && !be.olcu.some(function (z) { return z[0] === o; })) o = sonOlcu(be).olcu;
          var m = sayi(x.miktar);
          S.sepet.push({ besin: be, olcu: o, miktar: isFinite(m) && m > 0 ? m : 1 });
        });
        titret(); sepetAc();
      };
    });
    kart.querySelectorAll('[data-art],[data-az]').forEach(function (b) {
      b.onclick = function () {
        var art = b.hasAttribute('data-art'), id = (b.getAttribute('data-art') || b.getAttribute('data-az')).slice(2);
        var k = kayitBul(id); if (!k) return;
        var a = miktarAdimi(S.besinler[k['Besin ID']], k['Ölçü']);
        kayitMiktar(id, Math.round((sayi(k['Miktar']) + (art ? a : -a)) * 100) / 100);
      };
    });
  }
  function baglaAna() {
    document.querySelectorAll('[data-ogun]').forEach(function (b) { b.onclick = function () { ogunSec(b.getAttribute('data-ogun')); }; });
    var kart = $('#uygulama .ogun-kart'); if (kart) baglaKart(kart);
    seritBagla();
    document.querySelectorAll('[data-uyku]').forEach(function (b) {
      b.onclick = function () { S.gunluk.uyku = b.getAttribute('data-uyku'); islemEkle('gunluk', { gun: S.gun, alan: 'uyku', deger: S.gunluk.uyku }); ciz(); bildir('✅ Uyku kaydedildi'); };
    });
    document.querySelectorAll('[data-sonra]').forEach(function (b) { b.onclick = function () { sonraDe(b.getAttribute('data-sonra')); ciz(); }; });
    $('#su-dugme').onclick = suAc;
    $('#adim-dugme').onclick = adimAc;
    $('#antrenman-dugme').onclick = function () { bildir('Antrenman ekranı 2. sürümde geliyor'); };
    $('#agri-dugme').onclick = function () { agriAc(); };
    $('#durum').onclick = function () {
      var n = bekleyenler().length;
      if (S.gonderHata && n) { bildir(n + ' kayıt telefonda bekliyor, internet gelince gönderilecek', 'Şimdi dene', function () { S.gonderHata = false; gonder(); }); }
      else if (n) bildir('Kaydediliyor…'); else bildir('✅ Bütün kayıtlar kaydedildi');
    };
  }

  /* ---------- Su ve adım pencereleri ---------- */
  function suAc() {
    var duz = sayi(ayar('duzeltme_ml', 50)) || 50;
    var hizli = String(ayar('hizli_ekle_ml', '200,500,1000')).split(',').map(sayi).filter(isFinite);
    var hs = hedef('su_ml');
    function icerik() {
      var su = S.gunluk.su || 0;
      return '<div class="buyuk-deger" aria-live="polite">' + bicim(su / 1000, 2) + ' L' + (hs ? '<small> / ' + bicim(hs / 1000, 2) + ' L</small>' : '') + '</div>' +
        '<div class="su-izgara">' + hizli.map(function (m, i) { return '<button class="' + (i === 0 ? 'ana' : '') + '" data-su="' + m + '">+' + (m >= 1000 ? bicim(m / 1000, 1) + ' L' : m + ' ml') + '</button>'; }).join('') + '</div>' +
        '<div class="duzelt"><span>Yanlış mı girdin? Düzelt:</span><div class="adim"><button data-su="' + (-duz) + '" aria-label="' + duz + ' ml azalt">' + ik('minus') + '</button>' +
        '<span class="adim-deger"><b>' + duz + '</b><small>ml</small></span><button data-su="' + duz + '" aria-label="' + duz + ' ml artır">' + ik('plus') + '</button></div></div>' +
        '<p class="ipucu">Pencere açık kalır, art arda ekleyebilirsin. Dışına dokununca kapanır.</p>';
    }
    function bagla() {
      document.querySelectorAll('#pencere [data-su]').forEach(function (b) {
        b.onclick = function () { suDegistir(+b.getAttribute('data-su')); titret(); pencereIcerik(icerik(), bagla); };
      });
    }
    pencereAc(ik('droplet', 'su-renk') + 'Su', icerik(), bagla);
  }
  function adimAc() {
    var v = S.gunluk.adim;
    pencereAc(ik('footsteps', 'adim-renk') + 'Adım',
      '<div class="form-alan"><label for="adim-kutu">Bugünkü adım sayısı</label><div class="satir-form"><input id="adim-kutu" type="number" inputmode="numeric" min="0" step="1" value="' + esc(v) + '" placeholder="8000">' +
      '<button class="ana-dugme dar" id="adim-kaydet">Kaydet</button></div></div><p class="ipucu">Gün içinde istediğin kadar güncelleyebilirsin; son yazdığın sayı geçerli olur.</p>',
      function () {
        var k = $('#adim-kutu'); setTimeout(function () { k.focus(); }, 80);
        $('#adim-kaydet').onclick = function () {
          var n = Math.round(sayi(k.value));
          if (!isFinite(n) || n < 0) { bildir('Adım sayısını yaz'); return; }
          S.gunluk.adim = String(n); islemEkle('gunluk', { gun: S.gun, alan: 'adim', deger: n });
          pencereKapat(); ciz(); bildir('✅ Adım kaydedildi');
        };
      });
  }

  /* ---------- Alttan açılan pencere ---------- */
  var oncekiOdak = null;
  // Kaydırmalı ve klavyeli pencereler sabit yükseklikte açılır; içerik ya da klavye değişince pencere oynamaz (1.4.1)
  function pencereAc(baslik, icerik, bagla, kucuk) {
    oncekiOdak = document.activeElement;
    var p = $('#pencere');
    p.classList.toggle('sabit', !kucuk);
    p.innerHTML = '<div class="tutamac" aria-hidden="true"></div><div class="pencere-ust"><h2 id="pencere-baslik">' + baslik + '</h2><button class="kapat" id="kapat" aria-label="Kapat">✕</button></div><div id="pencere-ic">' + icerik + '</div>';
    p.hidden = false; $('#perde').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#kapat').onclick = pencereKapat; $('#perde').onclick = pencereKapat;
    if (bagla) bagla(p);
  }
  function pencereIcerik(icerik, bagla, konumuKoru) {
    var p = $('#pencere'), y = p.scrollTop;
    $('#pencere-ic').innerHTML = icerik; if (bagla) bagla(p); p.scrollTop = konumuKoru ? y : 0;
  }
  function pencereKapat() {
    $('#pencere').hidden = true; $('#perde').hidden = true; $('#pencere').innerHTML = '';
    document.body.style.overflow = '';
    if (oncekiOdak && oncekiOdak.focus) try { oncekiOdak.focus(); } catch (e) { /* yok */ }
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#pencere').hidden) pencereKapat(); });

  /* ---------- ＋ Ekle ve sepet ---------- */
  var penOgun = '';
  S.sepet = [];
  var grupSec = 'oneri';
  function ekleAc(ogunK) {
    penOgun = ogunK || S.seciliOgun || ogunBul(Date.now());
    pencereAc(YONELME[penOgun] + ' ekle',
      '<div class="arama-kutu">' + ik('search', 'arama-ikon') + '<label class="gizli-yazi" for="arama">Besin ara</label><input id="arama" class="arama" type="search" placeholder="Besin ara: yoğurt, tavuk, elma…" autocomplete="off">' + aramaSil() + '</div>' +
      '<div class="grup-cipler" id="grup-cipler" role="group" aria-label="Besin grupları"></div><div id="sonuclar"></div><div id="sepet-cubuk"></div>',
      function () {
        var a = $('#arama');
        a.oninput = function () { sonuclariGoster(a.value); };
        aramaSilBagla(a);
        grupCipleri();
        sonuclariGoster('');
        sepetCubugu();
      });
  }
  /* Arama kutusundaki silme düğmesi (tarayıcının küçük mavi çarpısı yerine). Sadece yazı varken görünür. */
  function aramaSil() { return '<button type="button" class="arama-sil" hidden aria-label="Aramayı temizle">' + ik('x') + '</button>'; }
  function aramaSilBagla(a) {
    var d = a.parentNode.querySelector('.arama-sil');
    function goster() { d.hidden = !a.value; }
    a.addEventListener('input', goster);
    d.onpointerdown = function (e) { e.preventDefault(); }; // klavye kapanmasın
    d.onclick = function () { a.value = ''; a.dispatchEvent(new Event('input')); a.focus(); };
    goster();
  }
  function grupCipleri() {
    var dolu = {};
    gorunurBesinler().forEach(function (b) { if (!b.benim) dolu[b.grup] = 1; });
    var liste = [['oneri', 'Önerilen'], ['benim', 'Benim eklediklerim']].concat(GRUPLAR.filter(function (g) { return dolu[g]; }).map(function (g) { return [g, g]; }));
    var el = $('#grup-cipler'); if (!el) return;
    el.innerHTML = liste.map(function (x) {
      return '<button class="cip' + (grupSec === x[0] ? ' secili' : '') + '" aria-pressed="' + (grupSec === x[0]) + '" data-grup="' + esc(x[0]) + '">' + esc(x[1]) + '</button>';
    }).join('');
    el.querySelectorAll('[data-grup]').forEach(function (b) {
      b.onclick = function () {
        grupSec = b.getAttribute('data-grup'); $('#arama').value = ''; var sil = $('#pencere .arama-sil'); if (sil) sil.hidden = true;
        grupCipleri(); sonuclariGoster(''); $('#pencere').scrollTop = 0;
        var s = el.querySelector('.secili'); if (s && s.scrollIntoView) s.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      };
    });
  }
  function gorunurBesinler() { return Object.keys(S.besinler).map(function (k) { return S.besinler[k]; }).filter(function (b) { return !S.ortulen[b.id] && !b.malzeme; }); }
  function sonuclariGoster(q) {
    var h = '';
    var qs = sadelestir(q.trim()).split(/\s+/).filter(Boolean);
    var ad = ogunAdi(penOgun);
    var cipler = $('#grup-cipler'); if (cipler) cipler.hidden = !!qs.length;
    if (!qs.length && grupSec === 'oneri') {
      var gorulen = {};
      var sik = gorunurBesinler().filter(function (b) { return S.sik[ad + '|' + b.id]; })
        .sort(function (a, b) { return siraPuani(b, penOgun) - siraPuani(a, penOgun); }).slice(0, 8);
      sik.forEach(function (b) { gorulen[b.id] = 1; });
      if (sik.length) h += '<div class="bolum-baslik">' + esc(ad) + ' için sık yediklerin</div>' + sik.map(sonucSatiri).join('');
      var son = S.son.map(function (x) { return S.besinler[x.besinId]; })
        .filter(function (b) { return b && !S.ortulen[b.id] && !gorulen[b.id] && ogunPuani(b, penOgun) > 0 && (gorulen[b.id] = 1); }).slice(0, 6);
      if (son.length) h += '<div class="bolum-baslik">Son yenenler</div>' + son.map(sonucSatiri).join('');
      var oneri = gorunurBesinler().filter(function (b) { return !gorulen[b.id] && !b.benim && ogunPuani(b, penOgun) >= 2; })
        .sort(function (a, b) { return (siraPuani(b, penOgun) - siraPuani(a, penOgun)) || (b.benim - a.benim) || a.ad.localeCompare(b.ad, 'tr'); }).slice(0, 25);
      if (oneri.length) h += '<div class="bolum-baslik">' + esc(ad) + ' için öneriler</div>' + oneri.map(sonucSatiri).join('');
    } else if (!qs.length) {
      var grup = gorunurBesinler().filter(function (b) { return grupSec === 'benim' ? b.benim : b.grup === grupSec && !b.benim; })
        .sort(function (a, b) { return (siraPuani(b, penOgun) - siraPuani(a, penOgun)) || (b.benim - a.benim) || a.ad.localeCompare(b.ad, 'tr'); });
      h += grup.length ? grup.map(sonucSatiri).join('') : '<div class="bos">' + (grupSec === 'benim' ? 'Henüz kendi eklediğin bir besin yok. Aşağıdan "Elle ekle" ile ekleyebilirsin.' : 'Bu grupta besin yok.') + '</div>';
    } else {
      var hepsi = gorunurBesinler()
        .filter(function (b) { var t = sadelestir(b.ad + ' ' + b.grup); return qs.every(function (x) { return t.indexOf(x) >= 0; }); })
        .sort(function (a, b) {
          var ab = sadelestir(a.ad).indexOf(qs[0]) === 0 ? 0 : 1, bb = sadelestir(b.ad).indexOf(qs[0]) === 0 ? 0 : 1;
          return (ab - bb) || (siraPuani(b, penOgun) - siraPuani(a, penOgun)) || (b.benim - a.benim) || a.ad.localeCompare(b.ad, 'tr');
        }).slice(0, 40);
      h += hepsi.length ? hepsi.map(sonucSatiri).join('') : '<div class="bos">"' + esc(q) + '" bulunamadı.</div>';
    }
    h += '<button class="ikinci-dugme" id="elle">' + ik('pencil') + ' Listede yok mu? Elle ekle</button><div class="sepet-bosluk"></div>';
    $('#sonuclar').innerHTML = h;
    document.querySelectorAll('#sonuclar [data-sec]').forEach(function (b) {
      b.onclick = function () {
        var be = S.besinler[b.getAttribute('data-sec')];
        if (sepetIndex(be.id) >= 0) return;
        var o = sonOlcu(be);
        S.sepet.push({ besin: be, olcu: o.olcu, miktar: o.miktar });
        titret(); sofraYenile = listeYenile; listeYenile(be.id);
      };
    });
    sofraYenile = listeYenile;
    $('#elle').onclick = function () { elleEkle(q); };
  }
  // Listede sadece değişen besinin satırı yenilenir; biri sofradan çıkınca (sıra numaraları kaydığı için) liste baştan çizilir, kaydırma yeri korunur
  function listeYenile(id, silindi) {
    var p = $('#pencere'), y = p.scrollTop;
    if (silindi) sonuclariGoster($('#arama').value);
    else document.querySelectorAll('#sonuclar .sofra-kutu[data-besin="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]').forEach(function (k) {
      var b = S.besinler[id], tmp = document.createElement('div'); tmp.innerHTML = sonucSatiri(b);
      var yeni = tmp.firstChild; k.parentNode.replaceChild(yeni, k);
      yeni.querySelectorAll('[data-sec]').forEach(function (d) { d.onclick = function () { var o = sonOlcu(b); S.sepet.push({ besin: b, olcu: o.olcu, miktar: o.miktar }); titret(); listeYenile(b.id); }; });
    });
    p.scrollTop = y; sepetCubugu();
  }
  function sepetteKac(id) { var n = 0; S.sepet.forEach(function (x) { if (x.besin.id === id) n += 1; }); return n; }
  function sepetToplam() {
    return S.sepet.reduce(function (t, x) { var d = deger(x.besin, x.olcu, x.miktar); t.kcal += d.kcal; t.p += d.p; return t; }, { kcal: 0, p: 0 });
  }
  function sepetIndex(id) { for (var i = 0; i < S.sepet.length; i++) if (S.sepet[i].besin.id === id) return i; return -1; }
  // Listedeki satır: sofrada değilse + düğmesi; sofradaysa ad · miktar ▾ · değerler ve artı/eksi (1.4.2)
  function sonucSatiri(b) {
    var i = sepetIndex(b.id);
    if (i >= 0) return sofraKutusu(S.sepet[i], i, 'sonuc sofrada');
    var o = sonOlcu(b), d = deger(b, o.olcu, o.miktar);
    var alt = miktarYaz(o.miktar) + ' ' + esc(birimAdi(o.olcu)) + ' · ' + bicim(d.kcal) + ' kcal · ' + (b.pYok ? '<span class="uyari-yazi">⚠ protein ?</span>' : bicim(d.p, 1) + ' g');
    return '<div class="sofra-kutu" data-besin="' + esc(b.id) + '"><div class="sonuc"><span class="bilgi"><b>' + esc(b.ad) + (b.benim ? ' <span class="etiket">Benim</span>' : '') + '</b><small>' + alt + '</small></span>' +
      '<button class="sepet-ekle" data-sec="' + esc(b.id) + '" aria-label="' + esc(b.ad) + ' sofraya ekle">' + ik('plus') + '</button></div></div>';
  }
  // Sofradaki bir besin: hem listede hem Sofra sayfasında aynı görünüm
  function sofraKutusu(x, i, sinif) {
    var d = deger(x.besin, x.olcu, x.miktar), anahtar = 's:' + i, acik = S.olcuAcik === anahtar;
    var miktar = x.besin.porsiyon ? '<small>' + esc(miktarMetni(x.miktar, x.olcu)) + '</small>'
      : '<button class="miktar-dugme" data-olcu-ac="' + anahtar + '" aria-expanded="' + acik + '" aria-label="Ölçü: ' + esc(miktarMetni(x.miktar, x.olcu)) + '. Dokun: ölçüyü değiştir">' + esc(miktarMetni(x.miktar, x.olcu)) + ik(acik ? 'chevron-up' : 'chevron-down') + '</button>';
    var h = '<div class="sofra-kutu" data-besin="' + esc(x.besin.id) + '"><div class="' + sinif + '"><div class="bilgi"><b>' + esc(x.besin.ad) + (x.besin.benim ? ' <span class="etiket">Benim</span>' : '') + '</b>' + miktar +
      '<small>' + bicim(d.kcal) + ' kcal · ' + (x.besin.pYok ? '<span class="uyari-yazi">⚠ protein bilinmiyor</span>' : bicim(d.p, 1) + ' g protein') + '</small></div>' +
      adimSatiri(anahtar, x.besin.ad, x.miktar, x.olcu, miktarAdimi(x.besin, x.olcu)) + '</div>';
    if (acik) h += '<div class="cipler olcu-secim" role="group" aria-label="Ölçü seç">' + olcuSecenekleri(x.besin).map(function (o) {
      return '<button class="cip' + (o === x.olcu ? ' secili' : '') + '" aria-pressed="' + (o === x.olcu) + '" data-olcu-sec="' + anahtar + '" data-olcu="' + esc(o) + '">' + esc(o === 'gram' ? 'gram' : birimAdi(o)) + '</button>';
    }).join('') + (x.olcu === 'gram' ? '<span class="ipucu">artış ' + miktarAdimi(x.besin, 'gram') + ' g</span>' : '') + '</div>';
    return h + '</div>';
  }
  /* Sofradaki besinlerin artı/eksi ve ölçü düğmeleri tek yerden yönetilir (pencere içinde, liste ve Sofra sayfası için ortak) */
  var sofraYenile = null;
  S.olcuAcik = '';
  $('#pencere').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-art^="s:"],[data-az^="s:"],[data-olcu-ac^="s:"],[data-olcu-sec^="s:"]');
    if (!b) return;
    var anahtar = b.getAttribute('data-art') || b.getAttribute('data-az') || b.getAttribute('data-olcu-ac') || b.getAttribute('data-olcu-sec');
    var i = +anahtar.slice(2), x = S.sepet[i]; if (!x) return;
    var id = x.besin.id, silindi = false;
    if (b.hasAttribute('data-art') || b.hasAttribute('data-az')) {
      var a = miktarAdimi(x.besin, x.olcu), yeni = Math.round((x.miktar + (b.hasAttribute('data-art') ? a : -a)) * 100) / 100;
      if (yeni <= 0) { S.sepet.splice(i, 1); S.olcuAcik = ''; silindi = true; } else x.miktar = yeni;
      titret();
    } else if (b.hasAttribute('data-olcu-ac')) {
      S.olcuAcik = S.olcuAcik === anahtar ? '' : anahtar;
    } else {
      var yeniO = b.getAttribute('data-olcu'); if (yeniO === x.olcu) return;
      // Gram karşılığını koru: ölçü değişince aynı miktara en yakın değeri öner
      var g = deger(x.besin, x.olcu, x.miktar).gram;
      if (yeniO === 'gram') x.miktar = Math.max(5, Math.round(g / 5) * 5);
      else { var bir = gramOlcu(x.besin, yeniO); x.miktar = Math.max(0.5, Math.round(g / bir * 2) / 2); }
      x.olcu = yeniO; S.olcuAcik = '';
    }
    if (sofraYenile) sofraYenile(id, silindi);
  });
  function sepetCubugu() {
    var el = $('#sepet-cubuk'); if (!el) return;
    if (!S.sepet.length) { el.innerHTML = ''; return; }
    var t = sepetToplam();
    if (el.querySelector('.sepet-cubuk')) { // çubuk zaten açık: yeniden kaydırmadan sadece sayıları güncelle
      el.querySelector('.sayac').textContent = S.sepet.length;
      el.querySelector('.sepet-yazi b').textContent = bicim(t.kcal) + ' kcal · ' + bicim(t.p, 1) + ' g';
      el.querySelector('#sepet-gor').setAttribute('aria-label', 'Sofrayı gör: ' + S.sepet.length + ' besin');
      return;
    }
    el.innerHTML = '<div class="sepet-cubuk"><button class="sepet-gor" id="sepet-gor" aria-label="Sofrayı gör: ' + S.sepet.length + ' besin">' +
      '<span class="sepet-simge">' + ik('tools-kitchen-2') + '<span class="sayac">' + S.sepet.length + '</span></span>' +
      '<span class="sepet-yazi"><b>' + bicim(t.kcal) + ' kcal · ' + bicim(t.p, 1) + ' g</b><small>Sofrayı gör ve düzenle ›</small></span></button>' +
      '<button class="ana-dugme dar" id="sepet-kaydet">Kaydet</button></div>';
    $('#sepet-gor').onclick = sepetAc;
    $('#sepet-kaydet').onclick = sepetKaydet;
  }
  function sepetKaydet() {
    if (!S.sepet.length) return;
    var n = S.sepet.length;
    S.sepet.forEach(function (x) { kayitEkle(x.besin, x.olcu, x.miktar, penOgun, true); });
    S.sepet = []; S.acikOgun = penOgun;
    pencereKapat(); titret(); ciz();
    bildir('✅ ' + n + ' besin ' + ogunAdi(penOgun).toLocaleLowerCase('tr-TR') + ' öğününe eklendi');
  }
  function olcuSecenekleri(b) { return b.porsiyon ? ['1 porsiyon'] : b.olcu.map(function (x) { return x[0]; }).concat(['gram']); }
  function sepetAc() {
    S.olcuAcik = '';
    function icerik() {
      if (!S.sepet.length) return '<div class="bos">Sofra boş.</div><button class="ikinci-dugme" id="geri">← Aramaya dön</button>';
      var h = '<p class="ipucu">Seçtiklerin burada alt alta. Miktara dokunarak ölçüyü değiştirebilirsin.</p>';
      S.sepet.forEach(function (x, i) { h += sofraKutusu(x, i, 'satir sepet-satir'); });
      var t = sepetToplam();
      h += '<button class="metin-dugme vurgu" id="geri">' + ik('plus') + ' Başka bir şey ekle</button>' +
        '<div class="sepet-toplam"><span>Toplam · ' + S.sepet.length + ' besin</span><b>' + bicim(t.kcal) + ' kcal · ' + bicim(t.p, 1) + ' g protein</b></div>' +
        '<button class="ana-dugme" id="sepet-kaydet2">' + YONELME[penOgun] + ' kaydet</button>';
      return h;
    }
    function bagla() {
      var g = $('#geri'); if (g) g.onclick = function () { ekleAc(penOgun); };
      var k = $('#sepet-kaydet2'); if (k) k.onclick = sepetKaydet;
    }
    function yenile() { pencereIcerik(icerik(), bagla, true); }
    sofraYenile = yenile;
    pencereAc('Sofra · ' + ogunAdi(penOgun), icerik(), bagla);
  }
  function elleEkle(onAd) {
    var kats = GRUPLAR.slice();
    var h = '<div class="form-alan"><label for="e-ad">Besinin adı</label><input id="e-ad" type="text" value="' + esc(onAd || '') + '" placeholder="Ör. Tavuk döner dürüm"></div>' +
      '<div class="form-alan"><label for="e-kat">Besin grubu</label><select id="e-kat">' + kats.map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('') + '</select></div>' +
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
        var yb = S.besinler[v.id], yo = sonOlcu(yb);
        S.sepet.push({ besin: yb, olcu: yo.olcu, miktar: yo.miktar });
        ekleAc(penOgun); bildir('✅ ' + ad + ' sofraya eklendi');
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
          (gun > 14 ? '<div class="uyari">⚠ 2 haftadan uzun sürüyor: bir doktora danış.</div>' : '') +
          takipAlani(a) + '</div>';
      });
    }
    h += '<button class="ana-dugme" id="yeni-not">＋ Yeni not</button>';
    pencereAc('Ağrı ve sağlık notları', h, function () {
      takipBagla();
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
  function agriKademe(s) {
    var d = sayi(ayar('agri_dikkat', 3)), ar = sayi(ayar('agri_ara', 5)), dr = sayi(ayar('agri_doktor', 7));
    if (s >= dr) return { k: 'doktor', m: 'Antrenmana ara ver, zorlama yok. Bir doktora danış.' };
    if (s >= ar) return { k: 'ara', m: 'Bu bölgeye bugün ara ver. İlgili hareketler çıkarılır, diğerlerine devam.' };
    if (s >= d) return { k: 'dikkat', m: 'Antrenman yapılabilir; bu bölgeyi zorlayan hareketleri hafiflet.' };
    return { k: 'normal', m: 'Antrenmana normal devam edebilirsin.' };
  }
  function sonSiddet(a) { var s = sayi(a['Son şiddet']); if (!isFinite(s)) s = sayi(a['Şiddet']); return isFinite(s) ? s : 0; }
  function takipAlani(a) {
    var id = esc(a['ID']), s = sonSiddet(a), bugun = a['Son tarih'] === S.bugun;
    return '<div class="takip" data-not="' + id + '"><span class="etiket-yazi">Bugün nasıl?' + (bugun ? ' <small>(bugün girildi)</small>' : '') + '</span>' +
      '<div class="siddet"><button class="cip" data-s-az="' + id + '" aria-label="Şiddeti azalt">' + ik('minus') + '</button>' +
      '<input type="range" min="0" max="10" step="0.5" value="' + s + '" data-s="' + id + '" aria-label="Bugünkü şiddet, 0 ile 10 arası">' +
      '<output data-s-deger="' + id + '">' + bicim(s, 1) + '</output><button class="cip" data-s-art="' + id + '" aria-label="Şiddeti artır">' + ik('plus') + '</button></div>' +
      '<div class="kademe ' + agriKademe(s).k + '" data-s-kademe="' + id + '" aria-live="polite"><i aria-hidden="true"></i><span>' + agriKademe(s).m + '</span></div>' +
      '<div class="takip-alt"><button class="ikinci-dugme dar" data-gecti="' + id + '">İyileştim</button>' +
      '<button class="ana-dugme dar" data-s-kaydet="' + id + '">Kaydet</button></div></div>';
  }
  function takipBagla() {
    document.querySelectorAll('[data-s]').forEach(function (r) {
      var id = r.getAttribute('data-s'), a = S.agri.filter(function (x) { return x['ID'] === id; })[0], ilk = sonSiddet(a);
      function sec(q) { return document.querySelector('[' + q + '="' + id + '"]'); }
      function guncelle() {
        var v = +r.value;
        sec('data-s-deger').textContent = bicim(v, 1);
        var kd = agriKademe(v), el = sec('data-s-kademe');
        el.className = 'kademe ' + kd.k; el.querySelector('span').textContent = kd.m;
      }
      r.oninput = guncelle;
      sec('data-s-az').onclick = function () { r.value = Math.max(0, +r.value - 0.5); guncelle(); };
      sec('data-s-art').onclick = function () { r.value = Math.min(10, +r.value + 0.5); guncelle(); };
      sec('data-s-kaydet').onclick = function () {
        var v = +r.value, cevap = v < ilk ? 'azaldı' : v > ilk ? 'arttı' : 'aynı';
        islemEkle('agri_takip', { notId: id, tarih: S.bugun, siddet: v, cevap: cevap, not: '' });
        a['Son şiddet'] = v; a['Son tarih'] = S.bugun; a['Son cevap'] = cevap;
        titret(); pencereKapat(); bildir('✅ ' + a['Bölge'] + ' kaydedildi (' + bicim(v, 1) + ')');
      };
      sec('data-gecti').onclick = function () {
        // 5 sn içinde "Geri al" denebilir; kayıt ancak sonra gönderilir
        var yedek = S.agri.slice(), iptal = false;
        S.agri = S.agri.filter(function (x) { return x['ID'] !== id; });
        pencereKapat(); ciz();
        var t = setTimeout(function () { if (!iptal) islemEkle('agri_takip', { notId: id, tarih: S.bugun, siddet: 0, cevap: 'geçti' }); }, 5200);
        bildir(a['Bölge'] + ' notu kapatıldı', 'Geri al', function () { iptal = true; clearTimeout(t); S.agri = yedek; ciz(); });
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
            var v = { id: kimlik('A'), acilis: S.bugun + ' ' + saatMetni(simdi), tur: sec.tur, bolge: sec.bolge, taraf: sec.taraf, siddet: +$('#siddet').value,
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
    b.onclick = function () {
      if (b.getAttribute('data-yakinda') === 'Ayarlar' && S.yuklendi) { besinListesi(); return; }
      bildir(b.getAttribute('data-yakinda') + ' ekranı yakında geliyor');
    };
  });
  /* Ayarlar › Besin listesi (şimdilik Ayarlar'da sadece bu var) */
  function besinListesi() {
    var acik = '';
    function icerik(q) {
      var qs = sadelestir((q || '').trim()).split(/\s+/).filter(Boolean);
      var tum = Object.keys(S.besinler).map(function (k) { return S.besinler[k]; }).filter(function (b) { return !S.ortulen[b.id]; });
      var liste = tum.filter(function (b) { var t = sadelestir(b.ad + ' ' + b.grup); return qs.every(function (x) { return t.indexOf(x) >= 0; }); });
      var h = '';
      ['Benim eklediklerim'].concat(GRUPLAR, ['Tarif malzemeleri (listede görünmez)']).forEach(function (g) {
        var l = liste.filter(function (b) {
          return g === 'Benim eklediklerim' ? b.benim : g.indexOf('Tarif malzemeleri') === 0 ? b.malzeme && !b.benim : b.grup === g && !b.benim && !b.malzeme;
        }).sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); });
        if (!l.length) return;
        var ac = !!qs.length || acik === g;
        h += '<section class="liste-grup"><button class="liste-baslik" data-lg="' + esc(g) + '" aria-expanded="' + ac + '"><b>' + esc(g) + '</b><small>' + l.length + ' besin</small>' + ik(ac ? 'chevron-up' : 'chevron-down', 'kucuk-ok') + '</button>';
        if (ac) h += l.map(function (b) {
          var temel = b.porsiyon ? '1 porsiyon' : '100 g';
          var olc = b.porsiyon ? '' : b.olcu.map(function (x) { return esc(x[0]) + ' = ' + bicim(x[1], 1) + ' g'; }).join(' · ');
          return '<div class="liste-satir"><b>' + esc(b.ad) + (b.benim ? ' <span class="etiket">Benim</span>' : '') + '</b>' +
            '<span>' + temel + ': ' + bicim(b.kcal) + ' kcal · ' + (b.pYok ? '⚠ protein ?' : bicim(b.p, 1) + ' g protein') + '</span>' +
            (olc ? '<small>' + olc + '</small>' : '') +
            (b.malzemeler ? '<small>Tarif: ' + b.malzemeler.map(function (m) { return esc(m[2]); }).join(', ') + '</small>' : '') +
            (b.kaynak ? '<small class="kaynak">Kaynak: ' + esc(b.kaynak) + '</small>' : '') + '</div>';
        }).join('');
        h += '</section>';
      });
      return h || '<div class="bos">Bulunamadı.</div>';
    }
    pencereAc('Besin listesi', '<p class="ipucu" style="margin-top:0">Değerler 100 g ya da 1 porsiyon içindir. Kendi eklediklerin "Benim" etiketiyle görünür.</p>' +
      '<div class="arama-kutu">' + ik('search', 'arama-ikon') + '<label class="gizli-yazi" for="l-ara">Besin ara</label><input id="l-ara" class="arama" type="search" placeholder="Besin ara" autocomplete="off">' + aramaSil() + '</div><div id="liste-ic">' + icerik('') + '</div>',
      function () {
        var a = $('#l-ara');
        function bagla() {
          document.querySelectorAll('[data-lg]').forEach(function (b) { b.onclick = function () { var g = b.getAttribute('data-lg'); acik = acik === g ? '' : g; $('#liste-ic').innerHTML = icerik(a.value); bagla(); }; });
        }
        a.oninput = function () { $('#liste-ic').innerHTML = icerik(a.value); bagla(); };
        aramaSilBagla(a);
        bagla();
      });
  }
  window.addEventListener('online', gonder);
  setInterval(gonder, 30000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !S.anahtar) return;
    // Gün değiştiyse ya da 5 dakikadan uzun süre arka plandaysa yeniden yükle
    if (gunBul(Date.now()) !== S.bugun || Date.now() - S.sonYukleme > 300000) {
      if (gunBul(Date.now()) !== S.bugun) { S.seciliOgun = ogunBul(Date.now()); S.acikOgun = ''; if (S.gun === S.bugun) S.gun = gunBul(Date.now()); }
      yukle().then(function () { if ($('#pencere').hidden) { var y = window.scrollY; ciz(); window.scrollTo(0, y); } gonder(); });
    } else gonder();
  });
  baslat();
})();
