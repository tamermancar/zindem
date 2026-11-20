/* Zindem – Antrenman ekranı (1.9)
 * uygulama.js bu dosyayı window.ZA(Z) ile çağırır; Z ortak yardımcıları verir (pencere, kayıt kuyruğu, ayarlar…).
 * Veri: E-Tablolar (Programlar, Antrenmanlar, Antrenman Kayıtları, Antrenman Günleri, Hareketlerim) + hareketler.json (genel liste).
 * Kodda kişisel bilgi yoktur. Uygulama teşhis koymaz; ağrıya göre sadece işaret gösterir, hiçbir hareketi engellemez.
 */
window.ZA = function (Z) {
  'use strict';
  var S = Z.S, $ = Z.$, esc = Z.esc, ik = Z.ik, sayi = Z.sayi, bicim = Z.bicim;
  var GUN_AD = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  var GUN_KISA = ['', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  var BOLGELER = ['göğüs', 'sırt', 'omuz', 'kol', 'gövde', 'kalça', 'bacak', 'baldır', 'boyun'];
  var POZLAR = ['ayakta', 'oturarak', 'sırtüstü', 'yüzüstü', 'dört ayak', 'yan yatarak', 'diz üstü', 'asılı'];
  var EKIPMAN = [['yok', 'Ekipman yok'], ['sandalye', 'Sandalye'], ['mat', 'Mat'], ['lastik', 'Direnç lastiği'], ['dambıl', 'Dambıl'], ['barfiks', 'Barfiks demiri'], ['basamak', 'Basamak / tabure']];
  var EVDE_VAR = ['duvar', 'havlu', 'masa', 'tezgah', 'su şişesi', 'mat']; // her evde bulunur sayılır (mat yoksa halı da olur)
  var HASSAS = ['boyun', 'omuz', 'kol', 'el / parmak', 'sırt', 'bel', 'kalça', 'kasık', 'bacak / ayak', 'diz', 'ayak bileği'];
  var UZUV = { 'kol': 'Kol', 'el / parmak': 'El / parmak', 'bacak / ayak': 'Bacak / ayak' };
  var HASSAS_ZORLAR = { 'kol': ['dirsek', 'omuz'], 'el / parmak': ['el bileği'], 'bacak / ayak': ['diz', 'ayak bileği'] };
  var HAREKET_DURUM = [['ayakta', 'Ayakta rahatım', 'Ayakta, yerde ve oturarak bütün hareketler'], ['destekli', 'Dengede zorlanıyorum', 'Ayakta hareketler duvar ya da sandalye desteğiyle'],
    ['oturarak', 'Oturarak', 'Sadece sandalyede ya da yatakta yapılan hareketler'], ['sandalye', 'Tekerlekli sandalye', 'Belden yukarısı ve oturarak yapılan hareketler']];
  // Hazır programlar: kişiye özel değil. Set/tekrar: NHS sayfalarındaki öneriler ya da genel başlangıç düzeyi.
  var HAZIR = [
    { id: 'hz-tum', ad: 'Yeni başlayan · tüm vücut', alt: 'Haftada 3 gün · ekipmansız · ~25 dk', kaynak: 'Zindem hazır programı', plan: { 1: 'a', 3: 'a', 5: 'a' },
      ant: [{ k: 'a', ad: 'Tüm vücut', h: [['h080', 'isinma', 1, 10, 10], ['h026', 'isinma', 1, 20, 20, 'süre'], ['h002', 'ana', 2, 8, 12], ['h053', 'ana', 2, 10, 12], ['h041', 'ana', 2, 6, 6], ['h050', 'ana', 2, 12, 15], ['h043', 'ana', 2, 20, 30, 'süre', 0], ['h040', 'ana', 2, 6, 6, '', 0]] }] },
    { id: 'hz-otur', ad: 'Oturarak güç', alt: 'Haftada 3 gün · sandalye · ~20 dk', kaynak: 'NHS oturarak egzersizleri temel alındı', plan: { 1: 'a', 3: 'a', 5: 'a' },
      ant: [{ k: 'a', ad: 'Oturarak', h: [['h027', 'isinma', 1, 10, 10], ['h081', 'isinma', 1, 3, 3], ['h085', 'ana', 1, 5, 5], ['h084', 'ana', 1, 5, 5], ['h064', 'ana', 2, 5, 8], ['h063', 'ana', 2, 10, 10], ['h030', 'ana', 2, 5, 10, 'ağırlık'], ['h086', 'ana', 2, 5, 5, '', 0]] }] },
    { id: 'hz-denge', ad: 'Güç ve denge', alt: 'Haftada 2 gün · destekli · ~20 dk · 65+', kaynak: 'NHS güç ve denge egzersizleri temel alındı', plan: { 2: 'a', 5: 'a' },
      ant: [{ k: 'a', ad: 'Güç ve denge', h: [['h052', 'ana', 1, 5, 5], ['h054', 'ana', 1, 5, 5], ['h062', 'ana', 1, 5, 5], ['h059', 'ana', 1, 5, 5], ['h060', 'ana', 1, 5, 5, '', 0], ['h001', 'ana', 3, 5, 10], ['h070', 'ana', 3, 5, 10, 'süre'], ['h071', 'ana', 1, 5, 5, '', 0], ['h072', 'ana', 1, 10, 10, '', 0]] }] },
    { id: 'hz-lastik', ad: 'Evde lastikle', alt: 'Haftada 3 gün · direnç lastiği · ~30 dk', kaynak: 'Zindem hazır programı', plan: { 1: 'a', 3: 'a', 5: 'a' },
      ant: [{ k: 'a', ad: 'Lastikle tüm vücut', h: [['h027', 'isinma', 1, 10, 10], ['h012', 'ana', 2, 12, 15], ['h011', 'ana', 3, 10, 15], ['h022', 'ana', 2, 12, 12], ['h023', 'ana', 2, 10, 15, '', 0], ['h053', 'ana', 3, 10, 12], ['h050', 'ana', 2, 12, 15], ['h040', 'ana', 2, 6, 6, '', 0]] }] }
  ];

  /* 1.10.1: Yaş ve deneyim. Kaynak: DSÖ 2020 (65+ için denge ve güç ağırlıklı çok yönlü hareket),
     ACSM 2009 ilerleme modelleri (yeni başlayan = hiç yapmamış ya da birkaç yıldır ara vermiş; orta = yaklaşık 6 aydır düzenli),
     ACSM 2011 (yeni başlayanlarda ve yaşlılarda tek set). Kurallar sadece hazır programın başlangıcını ve sırasını etkiler. */
  var DENEYIM = [['yeni', 'Yeni başlıyorum', 'Hiç yapmadım ya da birkaç yıldır ara verdim'], ['orta', 'Bir süredir yapıyorum', 'Yaklaşık 6 aydır düzenli'], ['ileri', 'Uzun süredir yapıyorum', 'Bir yıldan fazla, düzenli']];
  function yas() { var y = +Z.ayar('dogum_yili', ''); return y > 1900 ? +S.bugun.slice(0, 4) - y : null; }
  function hazirSirali() {
    var y = yas(), d = Z.ayar('ant_deneyim', '');
    return HAZIR.map(function (p, i) { var uy = (y != null && y >= 65 && p.id === 'hz-denge') || (d === 'yeni' && (y == null || y < 65) && p.id === 'hz-tum'); return { p: p, uygun: uy, i: i }; })
      .sort(function (a, b) { return (b.uygun - a.uygun) || (a.i - b.i); });
  }
  function hazirSatir(x, attr) {
    return '<button class="t2-satir" ' + attr + '="' + x.p.id + '"><span><b>' + esc(x.p.ad) + (x.uygun ? ' <span class="etiket">Sana uygun</span>' : '') + '</b><small>' + esc(x.p.alt) + '</small></span>' + ik('chevron-right') + '</button>';
  }
  function yeniBaslayanMi() { return Z.ayar('ant_deneyim', '') === 'yeni'; }

  var A = {
    sekme: 'bugun', programlar: [], antrenmanlar: [], hareketlerim: [], gunler: {}, kayitlar: [], katalog: null, katalogYukleniyor: false,
    gun: '', q: '', f: { uygun: true, bolge: '', poz: '', seviye: '' }, gizliGoster: false, ekstra: {}, acikSet: ''
  };

  /* ---------- Veri ---------- */
  function json(v, yedek) { try { var x = JSON.parse(v); return x == null ? yedek : x; } catch (e) { return yedek; } }
  function yukle(c) {
    c = c || {};
    A.programlar = (c.programlar || []).map(function (p) { return { id: String(p['ID']), ad: p['Ad'], etkin: String(p['Etkin']) === '1', plan: json(p['Plan'], {}), baslangic: p['Başlangıç'] }; });
    A.antrenmanlar = (c.antrenmanlar || []).map(function (a) { return { id: String(a['ID']), programId: String(a['Program ID']), ad: a['Ad'], kad: String(a['Kısa ad'] || ''), sira: +a['Sıra'] || 0, hareketler: json(a['Hareketler'], []) }; })
      .sort(function (a, b) { return a.sira - b.sira; });
    A.hareketlerim = (c.hareketlerim || []).map(function (h) {
      return { id: String(h['ID']), ad: h['Ad'], tur: h['Tür'] || 'tekrar', bolge: h['Bölge'] || '', ekipman: liste(h['Ekipman']), poz: h['Pozisyon'] || '',
        zorlar: liste(h['Zorlar']), uzuv: String(h['Uzuv'] || '').split(' ').filter(Boolean), benim: true, kaynak: 'Benim eklediğim', metin: { not: h['Not'] || '' } };
    });
    A.gunler = {}; (c.gunler || []).forEach(function (g) { g['Gün'] = String(g['Gün']).slice(0, 10); A.gunler[g['Gün']] = g; });
    A.kayitlar = (c.kayitlar || []).map(function (k) {
      return { id: String(k['ID']), gun: String(k['Gün']).slice(0, 10), antId: String(k['Antrenman ID']), hid: String(k['Hareket ID']), ad: k['Ad'], set: +k['Set'] || 1, tekrar: sayi(k['Tekrar']), agirlik: k['Ağırlık'] };
    });
    if (!A.gun) A.gun = S.bugun;
  }
  function liste(v) { return String(v || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); }
  function katalogGetir() {
    if (A.katalog || A.katalogYukleniyor) return;
    A.katalogYukleniyor = true;
    fetch('hareketler.json?v=1').then(function (r) { return r.json(); }).then(function (d) {
      A.katalog = d.hareketler || []; A.katalogYukleniyor = false;
      if (S.ekran === 'antrenman' || S.ekran === 'ilerleme') Z.ciz();
      if (!$('#pencere').hidden && A.pencereYenile) A.pencereYenile();
    }).catch(function () { A.katalogYukleniyor = false; Z.bildir('⚠ Hareket listesi yüklenemedi'); });
  }
  function hareketler() { return (A.katalog || []).concat(A.hareketlerim); }
  function hBul(id) { var l = hareketler(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function etkinProgram() { var p = A.programlar.filter(function (x) { return x.etkin; })[0]; return p || A.programlar[0] || null; }
  function antBul(id) { for (var i = 0; i < A.antrenmanlar.length; i++) if (A.antrenmanlar[i].id === id) return A.antrenmanlar[i]; return null; }
  function programAntrenmanlari(p) { return p ? A.antrenmanlar.filter(function (a) { return a.programId === p.id; }) : []; }
  function haftaGunu(gun) { var p = gun.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]).getDay(); return d === 0 ? 7 : d; }
  function gunEkle(gun, n) { return Z.gunKaydir(gun, n); }

  /* Günün planı: önce o günün satırı (kaydırılan / elle seçilen), sonra programın haftalık planı */
  function gunPlani(gun) {
    var g = A.gunler[gun], p = etkinProgram();
    if (g && g['Durum'] === 'kaydırıldı') return { kaydirildi: true, ant: antBul(String(g['Antrenman ID'])), satir: g };
    if (g && g['Antrenman ID']) return { ant: antBul(String(g['Antrenman ID'])), satir: g };
    if (!p) return { ant: null };
    var id = p.plan[haftaGunu(gun)];
    return { ant: id ? antBul(id) : null, satir: g || null };
  }
  function gunKayitlari(gun, antId) { return A.kayitlar.filter(function (k) { return k.gun === gun && (!antId || k.antId === antId); }); }
  function kisaMi(gun) { var g = A.gunler[gun]; return !!(g && String(g['Kısa']) === '1'); }
  // Antrenmanın o günkü hareketleri: kısa günde "kısa günde yok" olanlar çıkar, setler 1 azalır (en az 1)
  function gunHareketleri(ant, gun) {
    var kisa = kisaMi(gun);
    return (ant ? ant.hareketler : []).filter(function (x) { return !kisa || x.kisa !== 0; }).map(function (x) {
      var set = +x.set || 1; if (kisa) set = Math.max(1, set - 1);
      return { x: x, set: set };
    });
  }
  // 1.10.3: hedef = programdaki set sayısı; fazladan set ancak yapılınca hedefe eklenir (boş eklenen daire hedefi büyütmez)
  function hareketHedef(gun, ant, y) { var m = y.set; Object.keys(setler(gun, ant.id, y.x.h)).forEach(function (n) { if (+n > m) m = +n; }); return m; }
  function hedefSet(ant, gun) { return gunHareketleri(ant, gun).reduce(function (t, y) { return t + hareketHedef(gun, ant, y); }, 0); }
  function setler(gun, antId, hid) {
    var l = A.kayitlar.filter(function (k) { return k.gun === gun && k.antId === antId && k.hid === hid; });
    var o = {}; l.forEach(function (k) { o[k.set] = k; }); return o;
  }
  // 1.10: ısınma ile ana hareket ayrı tutulur (aynı hareket bir antrenmanda ısınma, başkasında ana olabilir)
  function kayitBolumu(k) { var a = antBul(k.antId), x = a && a.hareketler.filter(function (y) { return y.h === k.hid; })[0]; return (x && x.bolum) || 'ana'; }
  function gecenSefer(gun, hid, bolum) {
    var l = A.kayitlar.filter(function (k) { return k.hid === hid && k.gun < gun && kayitBolumu(k) === (bolum || 'ana'); });
    if (!l.length) return '';
    var son = l.reduce(function (m, k) { return k.gun > m ? k.gun : m; }, '');
    return l.filter(function (k) { return k.gun === son; }).sort(function (a, b) { return a.set - b.set; }).map(function (k) { return bicim(k.tekrar); }).join(' · ');
  }
  function yapilanSet(gun, ant) { return ant ? gunKayitlari(gun, ant.id).length : 0; }

  /* ---------- Uygunluk: tanışma cevapları + açık ağrı notları ---------- */
  function ayarJson(k, y) { return json(Z.ayar(k, ''), y); }
  function profil() {
    return { ekipman: ayarJson('ant_ekipman', null), durum: Z.ayar('ant_hareket', 'ayakta'), hassas: ayarJson('ant_hassas', []), uzuv: ayarJson('ant_uzuv', {}) };
  }
  var TARAF_AD = { sag: 'sağ', sol: 'sol', ikisi: 'iki' };
  function uygunluk(h, pr) {
    pr = pr || profil();
    var u = h.uzuv || [], sonuc = { gizli: '', uyari: [], bilgi: '' };
    if (pr.ekipman && pr.ekipman.length) {
      var eksik = (h.ekipman || []).filter(function (e) { return EVDE_VAR.indexOf(e) < 0 && pr.ekipman.indexOf(e) < 0; });
      if (eksik.length) sonuc.gizli = eksik[0] + ' gerektiriyor';
    }
    if (!sonuc.gizli && pr.durum === 'oturarak' && u.indexOf('o') < 0) sonuc.gizli = 'oturarak yapılmıyor';
    if (!sonuc.gizli && pr.durum === 'sandalye' && (u.indexOf('o') < 0 || u.indexOf('b1') >= 0 || u.indexOf('b2') >= 0)) sonuc.gizli = 'oturarak, bacaksız yapılmıyor';
    if (!sonuc.gizli && pr.durum === 'destekli' && u.indexOf('d') >= 0 && (h.ekipman || []).indexOf('sandalye') < 0 && (h.ekipman || []).indexOf('duvar') < 0) sonuc.gizli = 'ayakta denge gerektiriyor';
    Object.keys(pr.uzuv || {}).forEach(function (b) {
      var x = pr.uzuv[b] || {}, taraf = TARAF_AD[x.taraf] || '', iki = x.taraf === 'ikisi';
      if (sonuc.gizli || !x.durum) return;
      if (b === 'kol' || b === 'el / parmak') {
        var tutma = u.indexOf('t') >= 0, ikiKol = u.indexOf('k2') >= 0, kolGerek = u.indexOf('k0') < 0;
        if (x.durum === 'yok') {
          if ((b === 'kol' && (ikiKol || (iki && kolGerek))) || (b === 'el / parmak' && ((tutma && (ikiKol || iki)) || (ikiKol && iki))))
            sonuc.gizli = (iki ? 'iki ' : taraf + ' ') + (b === 'kol' ? 'kol' : 'el') + (b === 'el / parmak' && tutma ? 'le tutma' : '') + ' gerektiriyor';
          else if (kolGerek && u.indexOf('k1') >= 0) sonuc.bilgi = 'Tek elle yapılabilir';
        } else if (x.durum === 'zor' && tutma) sonuc.uyari.push('Tutma gerekir · kolay hali var');
      }
      if (b === 'bacak / ayak') {
        if (x.durum === 'yok' && (u.indexOf('b2') >= 0 || u.indexOf('d') >= 0 || (iki && u.indexOf('b1') >= 0))) sonuc.gizli = (iki ? 'iki bacak' : taraf + ' bacak') + ' gerektiriyor';
        else if (x.durum === 'zor' && u.indexOf('d') >= 0) sonuc.uyari.push('Denge gerekir · destekle yap');
      }
    });
    (pr.hassas || []).forEach(function (b) {
      var ux = (pr.uzuv || {})[b]; if (ux && (ux.durum === 'yok' || ux.durum === 'zor')) return; // uzuv durumu ayrıca işlendi
      (HASSAS_ZORLAR[b] || [b]).forEach(function (z) { var m = zorlarMetni(z); if ((h.zorlar || []).indexOf(z) >= 0 && sonuc.uyari.indexOf(m) < 0) sonuc.uyari.push(m); });
    });
    return sonuc;
  }
  function buyuk(x) { return x ? x.charAt(0).toLocaleUpperCase('tr-TR') + x.slice(1) : x; }
  // "Omzu zorlar", "Dizi zorlar"… (Türkçe belirtme hâli)
  var BELIRTME = { 'boyun': 'Boynu', 'omuz': 'Omzu', 'dirsek': 'Dirseği', 'el bileği': 'El bileğini', 'sırt': 'Sırtı', 'bel': 'Beli', 'kalça': 'Kalçayı', 'kasık': 'Kasığı', 'diz': 'Dizi', 'ayak bileği': 'Ayak bileğini' };
  function zorlarMetni(z) { return (BELIRTME[z] || buyuk(z)) + ' zorlar'; }
  // Açık ağrı notları → bölge başına en yüksek kademe
  function agriDurumu() {
    var o = {};
    (S.agri || []).forEach(function (a) {
      var b = String(a['Bölge'] || ''), s = Z.sonSiddet(a), k = Z.agriKademe(s);
      if (k.k === 'normal') return;
      var sira = { dikkat: 1, ara: 2, doktor: 3 };
      if (!o[b] || sira[k.k] > sira[o[b].k]) o[b] = { k: k.k, s: s, taraf: a['Taraf'] || '' };
    });
    return o;
  }
  function hareketAgri(h, ad) {
    var en = null, sira = { dikkat: 1, ara: 2, doktor: 3 };
    Object.keys(ad).forEach(function (b) { if ((h.zorlar || []).indexOf(b) >= 0 && (!en || sira[ad[b].k] > sira[en.k])) en = ad[b]; });
    return en;
  }

  /* ---------- Ortak parçalar ---------- */
  function ustBolum(sag, ek) {
    var s = [['bugun', 'Bugün'], ['program', 'Programım'], ['hareket', 'Hareketler']];
    return '<div class="m-ust"><header class="ekran-ust">' + Z.profilDugmesi() + '<h1>Antrenman</h1>' + (sag || '') + '</header>' +
      '<div class="grup-cipler m-sekmeler" role="tablist" aria-label="Antrenman">' + s.map(function (x) {
        var on = A.sekme === x[0];
        return '<button class="sekme-ciz' + (on ? ' secili' : '') + '" role="tab" aria-selected="' + on + '" data-a-sekme="' + x[0] + '">' + x[1] + '</button>';
      }).join('') + '</div>' + (ek ? '<div class="t2-ek">' + ek + '</div>' : '') + '</div>';
  }
  function aramaKutusu(id, q) {
    return '<div class="arama-kutu">' + ik('search', 'arama-ikon') + '<label class="gizli-yazi" for="' + id + '">Hareket ara</label><input id="' + id + '" class="arama" type="search" placeholder="Hareket ara" autocomplete="off" value="' + esc(q) + '">' + Z.aramaSil() + '</div>';
  }
  function filtreCipleri() {
    var f = A.f;
    function cip(k, ad, deger) { return '<button class="cip t2-acilir' + (deger ? ' secili' : '') + '" data-a-filtre="' + k + '">' + (deger ? buyuk(deger) : ad) + ' ' + ik('chevron-down') + '</button>'; }
    return '<div class="t2-filtre"><button class="cip' + (f.uygun ? ' secili' : '') + '" data-a-uygun aria-pressed="' + f.uygun + '">Bana uygun</button>' +
      cip('bolge', 'Bölge', f.bolge) + cip('poz', 'Pozisyon', f.poz) + cip('seviye', 'Seviye', f.seviye) + '</div>';
  }
  function aramaMetni(s) { return Z.sadelestir(s || ''); }
  // Liste: arama + filtre + uygunluk. Dönüş: { goster: [...], gizli: n, neden }
  function suz(q) {
    var pr = profil(), f = A.f, qs = aramaMetni(q), gizli = 0, neden = {};
    var l = hareketler().filter(function (h) {
      if (qs && aramaMetni(h.ad + ' ' + (h.bilinen || '') + ' ' + h.bolge).indexOf(qs) < 0) return false;
      if (f.bolge && h.bolge !== f.bolge) return false;
      if (f.poz && h.poz !== f.poz) return false;
      if (f.seviye && h.seviye !== f.seviye) return false;
      h._u = uygunluk(h, pr);
      if (f.uygun && h._u.gizli && !A.gizliGoster) { gizli += 1; neden[h._u.gizli] = (neden[h._u.gizli] || 0) + 1; return false; }
      return true;
    });
    var enCok = Object.keys(neden).sort(function (a, b) { return neden[b] - neden[a]; })[0] || '';
    return { l: l, gizli: gizli, neden: enCok };
  }
  function hareketSatiri(h, sag) {
    var u = h._u || uygunluk(h);
    return '<div class="t2-hr"><button class="t2-hr-bilgi" data-a-detay="' + esc(h.id) + '"><b>' + esc(h.ad) + '</b><small>' + esc(altBilgi(h)) + '</small>' +
      u.uyari.map(function (x) { return '<span class="an-etiket">' + ik('alert-triangle') + esc(x) + '</span>'; }).join(' ') +
      (u.bilgi ? '<span class="an-etiket bilgi">' + esc(u.bilgi) + '</span>' : '') + (u.gizli ? '<span class="an-etiket">' + ik('eye-off') + esc(buyuk(u.gizli)) + '</span>' : '') + '</button>' + (sag || '') + '</div>';
  }
  function altBilgi(h) {
    var e = (h.ekipman || []).filter(function (x) { return x !== 'mat'; });
    return [buyuk(h.bolge || ''), e.length ? e.join(', ') : 'ekipmansız', h.poz].filter(Boolean).join(' · ') + (h.benim ? ' · benim' : '');
  }

  /* ---------- Ekran ---------- */
  function ciz(ana) {
    if (!A.gun) A.gun = S.bugun;
    katalogGetir();
    var h;
    if (A.sekme === 'program') h = programEkrani();
    else if (A.sekme === 'hareket') h = hareketEkrani();
    else h = bugunEkrani();
    ana.innerHTML = h;
    bagla(ana);
  }
  function bos() {
    return '<section class="kart t2-bos"><span class="t2-bos-ikon">' + ik('barbell', 'capraz') + '</span><h2>Henüz bir programın yok</h2>' +
      '<p>Kendi programını kur ya da hazır bir programla başla.</p>' +
      '<button class="ana-dugme" data-a-olustur>' + ik('plus') + 'Kendi programını oluştur</button>' +
      '<button class="ikinci-dugme" data-a-hazir-liste>Hazır program seç</button>' +
      '<button class="metin-dugme orta" data-a-sekme-git="hareket">Hareketlere göz at ' + ik('chevron-right') + '</button></section>' +
      '<div class="bolum-baslik">Hazır programlar</div><section class="kart an-kart">' + hazirSirali().map(function (x) {
        return hazirSatir(x, 'data-a-hazir');
      }).join('') + '</section>';
  }
  function kayitliGun(g) { return !!(A.gunler[g] && /tamam|yarım/.test(A.gunler[g]['Durum'])) || gunKayitlari(g).length > 0; }
  function serit() { return Z.serit({ id: 'a-serit', secili: A.gun, kayitli: kayitliGun, veri: 'data-a-gun', takvim: 'data-a-takvim' }); }
  function gunSec(g) { A.gun = g; A.acikSet = ''; Z.ciz(); }
  function bugunEkrani() {
    var p = etkinProgram();
    if (!p) return ustBolum() + bos();
    var gun = A.gun, pl = gunPlani(gun), ant = pl.ant, h = ustBolum() + serit() + haftaOzetKarti();
    var gAd = GUN_AD[haftaGunu(gun)], ad = agriDurumu();
    if (pl.kaydirildi) {
      return h + '<section class="kart an-ust"><h2>' + esc(ant ? ant.ad : 'Antrenman') + '</h2><div class="an-ust-ust"><small>' + gAd + ' · yarına kaydırıldı</small></div>' +
        '<button class="ikinci-dugme" data-a-kaydirma-geri>' + ik('arrow-back-up') + 'Kaydırmayı geri al</button></section>';
    }
    if (!ant) {
      var l = programAntrenmanlari(p);
      return h + '<section class="kart an-ust"><h2>Dinlenme günü</h2><div class="an-ust-ust"><small>' + gAd + ' · ' + esc(p.ad) + '</small></div></section>' +
        (l.length ? '<div class="bolum-baslik">Yine de yapmak istersen</div><section class="kart an-kart">' + l.map(function (a) {
          return '<button class="t2-satir" data-a-sec-ant="' + a.id + '"><span><b>' + esc(a.ad) + '</b><small>' + a.hareketler.length + ' hareket</small></span>' + ik('chevron-right') + '</button>';
        }).join('') + '</section>' : '');
    }
    var hedef = hedefSet(ant, gun), yapilan = yapilanSet(gun, ant), satir = A.gunler[gun], durum = satir && satir['Antrenman ID'] === ant.id ? satir['Durum'] : '';
    var kisa = kisaMi(gun), kademeler = '';
    Object.keys(ad).forEach(function (b) {
      var k = ad[b];
      kademeler += '<div class="kademe ' + k.k + '"><i aria-hidden="true"></i><span><b>' + esc(buyuk((k.taraf && k.taraf !== 'genel' ? k.taraf + ' ' : '') + b)) + ' ' + bicim(k.s, 1) + '</b> · ' +
        (k.k === 'dikkat' ? 'bu bölgeyi zorlayan hareketleri hafif yap' : k.k === 'ara' ? 'bu bölgeye bugün ara ver' : 'antrenmana ara ver, bir doktora danış') + '</span></div>';
    });
    h += '<section class="kart an-ust"><h2>' + esc(ant.ad) + '</h2><div class="an-ust-ust"><small>' + gAd + ' · ' + (kisa ? 'Kısa gün' : esc(p.ad)) +
      (durum === 'tamam' ? ' · bitti' : durum === 'yarım' ? ' · yarım kaldı' : '') + '</small><div class="an-sayi"><b>' + yapilan + '</b><span> / ' + hedef + ' set</span></div></div>' +
      '<span class="an-cubuk" aria-hidden="true"><span style="width:' + (hedef ? Math.min(100, Math.round(yapilan / hedef * 100)) : 0) + '%"></span></span>' +
      (kisa ? '<div class="t2-kisa">' + ik('clock') + '<span>Kısa gün · 1’er set eksik</span><button class="metin-dugme" data-a-kisa="0">Tam antrenman</button></div>' : '') +
      kademeler + '</section>';
    var hl = gunHareketleri(ant, gun), bolumler = [['isinma', 'Isınma'], ['ana', 'Ana hareketler']];
    bolumler.forEach(function (b) {
      var l = hl.filter(function (y) { return (y.x.bolum || 'ana') === b[0]; });
      if (!l.length) return;
      var tek = b[0] === 'isinma';
      var bitti = l.filter(function (y) { var s = setler(gun, ant.id, y.x.h); return Object.keys(s).length >= y.set; }).length;
      h += '<div class="bolum-baslik">' + b[1] + (tek ? ' · ' + bitti + ' / ' + l.length : '') + '</div><section class="kart an-kart">' + l.map(function (y) { return hareketKarti(y, gun, ant, ad); }).join('') + '</section>';
    });
    if (kisa) {
      var yok = ant.hareketler.filter(function (x) { return x.kisa === 0; }).map(function (x) { var hh = hBul(x.h); return hh ? hh.ad : x.ad; });
      if (yok.length) h += '<p class="t2-not t2-orta">Kısa günde atlanan: ' + (yok.length === 1 ? esc(yok[0]) : yok.length + ' hareket') + '</p>';
    }
    if (durum !== 'tamam' && durum !== 'yarım') {
      h += '<div class="an-alt">' + (kisa ? '' : '<button class="ikinci-dugme" data-a-kisa="1">' + ik('clock') + 'Kısa yap</button>') +
        (gun === S.bugun ? '<button class="ikinci-dugme" data-a-kaydir>' + ik('arrow-back-up') + 'Yarına kaydır</button>' : '') + '</div>' +
        '<button class="ana-dugme ince" data-a-bitir>' + ik('flag') + 'Antrenmanı bitir</button>';
    } else h += '<button class="metin-dugme orta" data-a-bitir-geri>Antrenmanı yeniden aç</button>';
    return h;
  }
  function hareketKarti(y, gun, ant, ad) {
    var x = y.x, hh = hBul(x.h) || { ad: x.ad || 'Hareket', zorlar: [] }, s = setler(gun, ant.id, x.h), adet = y.set + (A.ekstra[gun + '|' + x.h] || 0);
    Object.keys(s).forEach(function (n) { if (+n > adet) adet = +n; });
    var ag = hareketAgri(hh, ad), ara = ag && ag.k !== 'dikkat', tek = (x.bolum === 'isinma') && adet === 1;
    var sure = x.tur === 'süre', hedefT = x.alt || x.ust || '', araliK = (x.alt && x.ust && x.alt !== x.ust ? x.alt + '–' + x.ust : (x.alt || x.ust || '')) + (sure ? ' sn' : '');
    var daireler = '';
    for (var i = 1; i <= adet; i++) {
      var k = s[i], anahtar = gun + '|' + x.h + '|' + i, secili = A.acikSet === anahtar;
      daireler += k ? '<button class="an-set tamam' + (secili ? ' secili' : '') + '" data-a-set="' + esc(x.h) + '" data-n="' + i + '" aria-label="' + i + '. set, ' + bicim(k.tekrar) + (sure ? ' saniye' : ' tekrar') + ' yapıldı. Düzenle">' + bicim(k.tekrar) + '</button>'
        : '<button class="an-set" data-a-set="' + esc(x.h) + '" data-n="' + i + '" aria-label="' + i + '. set, hedef ' + hedefT + (sure ? ' saniye' : ' tekrar') + '. Yaptım olarak işaretle">' + hedefT + '</button>';
    }
    if (!tek) daireler += '<button class="an-set ekle" data-a-set-ekle="' + esc(x.h) + '" aria-label="' + esc(hh.ad) + ' için set ekle">' + ik('plus') + '</button>';
    var gecen = gecenSefer(gun, x.h, x.bolum);
    var meta = (tek ? araliK + (sure ? '' : ' tekrar') : y.set + ' × ' + araliK) + (x.taraf || hh.taraf ? ', her taraf' : '') + (x.dinlenme && !tek ? ' · ' + x.dinlenme + ' sn' : '') + (gecen ? ' · Geçen: <i>' + gecen + '</i>' : '');
    var et = ag ? '<span class="an-etiket' + (ara ? ' ara' : '') + '">' + ik('alert-triangle') + (ag.k === 'dikkat' ? 'Hafif yap' : ag.k === 'ara' ? 'Bugün ara ver' : 'Antrenmana ara ver') + '</span> ' : '';
    var duzen = '';
    if (A.acikSet && A.acikSet.indexOf(gun + '|' + x.h + '|') === 0) {
      var n = +A.acikSet.split('|')[2], kk = s[n];
      if (kk) duzen = '<div class="an-duzen"><span>' + n + '. set</span><div class="adim" role="group" aria-label="' + (sure ? 'Saniye' : 'Tekrar') + '"><button data-a-tekrar="-1" aria-label="Azalt">' + ik('minus') + '</button><span class="adim-deger"><b>' + bicim(kk.tekrar) + '</b></span><button data-a-tekrar="1" aria-label="Artır">' + ik('plus') + '</button></div><button class="an-sil" data-a-set-sil aria-label="Seti sil">' + ik('trash') + '</button></div>';
    }
    if (tek) return '<div class="an-hr tek' + (ara ? ' ara' : '') + '"><div><button class="an-ad" data-a-detay="' + esc(x.h) + '"><b>' + esc(hh.ad) + '</b>' + ik('info-circle') + '</button><span class="an-meta">' + et + meta + '</span></div><div class="an-setler">' + daireler + '</div></div>' + (duzen ? '<div class="an-hr-duzen">' + duzen + '</div>' : '');
    return '<div class="an-hr' + (ara ? ' ara' : '') + '"><button class="an-ad" data-a-detay="' + esc(x.h) + '"><b>' + esc(hh.ad) + '</b>' + ik('info-circle') + '</button><span class="an-meta">' + et + meta + '</span><div class="an-setler">' + daireler + '</div>' + duzen + '</div>';
  }
  /* Haftanın özeti: haftanın son planlı antrenmanı bittikten sonra ya da Pazar günü, o hafta için bir kez */
  function haftaBasi(gun) { return gunEkle(gun, 1 - haftaGunu(gun)); }
  function haftaOzetKarti() {
    var p = etkinProgram(); if (!p || A.gun !== S.bugun) return '';
    var bas = haftaBasi(S.bugun), bitis = gunEkle(bas, 6), gunler = [], i;
    for (i = 0; i < 7; i++) gunler.push(gunEkle(bas, i));
    var planli = gunler.filter(function (g) { return !!p.plan[haftaGunu(g)]; });
    var sonPlanli = planli[planli.length - 1];
    var bitti = sonPlanli && A.gunler[sonPlanli] && /tamam|yarım/.test(A.gunler[sonPlanli]['Durum']);
    if (!(bitti && S.bugun >= sonPlanli) && haftaGunu(S.bugun) !== 7) return '';
    if (Z.ayar('ant_ozet_hafta', '') === bas) return '';
    var yapilan = gunler.filter(function (g) { var x = A.gunler[g]; return x && /tamam|yarım/.test(x['Durum']); });
    var yarim = gunler.filter(function (g) { var x = A.gunler[g]; return x && x['Durum'] === 'yarım'; });
    var esik = sayi(Z.ayar('agri_dikkat', 3));
    var notlar = (S.agri || []).filter(function (a) { var t = String(a['Açılış']).slice(0, 10); return t >= bas && t <= bitis && a['Tür'] === 'antrenman kaynaklı'; });
    var satirlar = '<li><em class="ok">' + ik('circle-check') + '</em><span>Antrenman günü <b>' + yapilan.length + '</b><small>planlı ' + planli.length + ' gün</small></span></li>';
    if (yarim.length) satirlar += '<li><em class="yarim">' + ik('alert-triangle') + '</em><span>Yarım kalan <b>' + yarim.length + '</b><small>' + yarim.map(function (g) { return GUN_AD[haftaGunu(g)]; }).join(', ') + '</small></span></li>';
    programAntrenmanlari(p).forEach(function (a) {
      var l = A.kayitlar.filter(function (k) { return k.antId === a.id && k.gun >= bas && k.gun <= bitis; });
      if (!l.length) return;
      var tavan = a.hareketler.every(function (x) { var ks = l.filter(function (k) { return k.hid === x.h; }); return ks.length && ks.every(function (k) { return k.tekrar >= (+x.ust || +x.alt || 0); }); });
      var agri = 0, bolge = '';
      notlar.forEach(function (n) { var hh = a.hareketler.map(function (x) { return hBul(x.h); }).filter(Boolean); if (hh.some(function (z) { return (z.zorlar || []).indexOf(n['Bölge']) >= 0; }) && +n['Şiddet'] > agri) { agri = +n['Şiddet']; bolge = n['Bölge']; } });
      var iyi = tavan && agri <= esik;
      satirlar += '<li><em class="' + (iyi ? 'ok' : 'yarim') + '">' + ik(iyi ? 'circle-check' : 'alert-triangle') + '</em><span><b>' + esc(a.ad) + '</b> · ' +
        (iyi ? 'tekrarları artırmaya hazırsın' : 'bir hafta daha aynı kal') + '<small>' + (agri > esik ? esc(bolge) + ' ağrısı ' + bicim(agri, 1) + ' · sınır ' + bicim(esik, 1) : tavan ? 'bütün setler hedefte' : 'setler henüz üst sınırda değil') + '</small></span></li>';
    });
    return '<section class="kart hf-kart"><h3>Haftanın özeti</h3><small>' + Z.tarihKisa(bas) + ' – ' + Z.tarihKisa(bitis) + '</small><ul class="hf-liste">' + satirlar + '</ul>' +
      '<div class="hf-dugmeler"><button class="ikinci-dugme" data-a-ozet-degistir>Programı düzenle</button><button class="ana-dugme ince" data-a-ozet-tamam="' + bas + '">Tamam</button></div></section>';
  }
  function programEkrani() {
    var p = etkinProgram();
    if (!p) return ustBolum() + bos();
    var l = programAntrenmanlari(p), gunSay = Object.keys(p.plan).filter(function (k) { return p.plan[k]; }).length;
    var h = ustBolum() + '<section class="kart an-ust"><h2>' + esc(p.ad) + '</h2><div class="an-ust-ust"><small>Haftada ' + gunSay + ' gün' + (p.baslangic ? ' · ' + Z.tarihKisa(String(p.baslangic).slice(0, 10)) + '’den beri' : '') + '</small></div>' +
      '<div class="t2-hafta">' + [1, 2, 3, 4, 5, 6, 7].map(function (g) {
        var a = antBul(p.plan[g] || '');
        return '<div class="' + (a ? '' : 'dinlen') + '"><small>' + GUN_KISA[g] + '</small><b>' + (a ? esc(a.kad || kisaAd(a.ad)) : '—') + '</b></div>';
      }).join('') + '</div><button class="ikinci-dugme" data-a-program-duzenle>' + ik('pencil') + 'Programı düzenle</button></section>' +
      '<div class="bolum-baslik">Antrenmanlar</div><section class="kart an-kart">' + l.map(function (a) {
        var gl = [1, 2, 3, 4, 5, 6, 7].filter(function (g) { return p.plan[g] === a.id; }).map(function (g) { return GUN_AD[g]; });
        var setT = a.hareketler.reduce(function (t, x) { return t + (+x.set || 0); }, 0);
        return '<button class="t2-satir" data-a-ant-duzenle="' + a.id + '"><span><b>' + esc(a.ad) + '</b><small>' + a.hareketler.length + ' hareket · ' + setT + ' set</small><small>' + (gl.length ? gl.join(', ') : 'planda yok') + '</small></span>' + ik('chevron-right') + '</button>';
      }).join('') + '</section>';
    if (A.programlar.length > 1) h += '<div class="bolum-baslik">Diğer programlarım</div><section class="kart an-kart">' + A.programlar.filter(function (x) { return x.id !== p.id; }).map(function (x) {
      return '<button class="t2-satir" data-a-etkin="' + x.id + '"><span><b>' + esc(x.ad) + '</b><small>Bu programa geç</small></span>' + ik('chevron-right') + '</button>';
    }).join('') + '</section>';
    h += '<button class="metin-dugme orta" data-a-yeni-program>' + ik('plus') + 'Yeni program</button>' +
      '<button class="metin-dugme orta" data-a-tanisma>Ekipman, bölgeler ve deneyim ' + ik('chevron-right') + '</button>';
    return h;
  }
  function kisaAd(ad) { var a = String(ad).split(' ')[0]; return a.length > 6 ? a.slice(0, 5) + '.' : a; }
  function hareketEkrani() {
    if (!A.katalog) return ustBolum() + '<p class="t2-not t2-orta">Hareketler yükleniyor…</p>';
    var r = suz(A.q);
    var h = ustBolum('<button class="ekle-dugme" data-a-kendi aria-label="Kendi hareketini ekle">' + ik('plus') + '<span class="dar-gizle">Kendi hareketin</span></button>', aramaKutusu('a-ara', A.q) + filtreCipleri());
    h += '<div id="a-liste">' + hareketListesiHtml(r) + '</div>';
    return h;
  }
  function hareketListesiHtml(r) {
    var h = '';
    if (r.gizli) h += '<div class="t2-gizli">' + ik('eye-off') + '<span><b>' + r.gizli + ' hareket gizlendi</b> · ' + esc(r.neden) + '</span><button class="metin-dugme" data-a-gizli-goster>Göster</button></div>';
    else if (A.gizliGoster && A.f.uygun) h += '<div class="t2-gizli">' + ik('eye-off') + '<span>Sana uymayanlar da gösteriliyor</span><button class="metin-dugme" data-a-gizli-goster>Gizle</button></div>';
    h += '<div class="bolum-baslik">' + r.l.length + ' hareket' + (A.f.uygun ? ' · sana uygun' : '') + '</div>';
    if (!r.l.length) return h + '<p class="t2-not t2-orta">Bu aramaya uyan hareket yok.</p>';
    return h + '<section class="kart an-kart">' + r.l.map(function (x) {
      var var_ = programdaMi(x.id);
      return hareketSatiri(x, '<button class="t2-ekle' + (var_ ? ' eklendi' : '') + '" data-a-programa="' + esc(x.id) + '" aria-label="' + esc(x.ad) + (var_ ? ', programında var. Başka antrenmana ekle' : ' programa ekle') + '">' + ik(var_ ? 'check' : 'plus') + '</button>');
    }).join('') + '</section>';
  }

  /* ---------- Bağlama ---------- */
  function bagla(ana) {
    ana.querySelectorAll('[data-a-sekme]').forEach(function (b) { b.onclick = function () { var y = b.getAttribute('data-a-sekme'); if (y === A.sekme) return; Z.sekmeGec('antrenman', A.sekme, y, function () { A.sekme = y; Z.ciz(); }); }; });
    ana.querySelectorAll('[data-a-sekme-git]').forEach(function (b) { b.onclick = function () { A.sekme = b.getAttribute('data-a-sekme-git'); Z.ciz(); window.scrollTo(0, 0); }; });
    ana.querySelectorAll('[data-a-olustur]').forEach(function (b) { b.onclick = function () { if (!Z.ayar('ant_tanisma', '')) tanisma(1, function () { programDuzenle(null); }); else programDuzenle(null); }; });
    ana.querySelectorAll('[data-a-hazir-liste]').forEach(function (b) { b.onclick = hazirListe; });
    ana.querySelectorAll('[data-a-hazir]').forEach(function (b) { b.onclick = function () { hazirOnizle(b.getAttribute('data-a-hazir')); }; });
    ana.querySelectorAll('[data-a-gun]').forEach(function (b) { b.onclick = function () { Z.titret(); gunSec(b.getAttribute('data-a-gun')); }; });
    var sr = $('#a-serit'); if (sr) { if (A.seritX == null) sr.scrollLeft = sr.scrollWidth; else sr.scrollLeft = A.seritX; sr.addEventListener('scroll', function () { A.seritX = sr.scrollLeft; }, { passive: true }); }
    ana.querySelectorAll('[data-a-takvim]').forEach(function (b) { b.onclick = function () { Z.takvimAc({ secili: A.gun, kayitli: kayitliGun, sec: gunSec }); }; });
    ana.querySelectorAll('[data-a-set]').forEach(function (b) { b.onclick = function () { setDokun(b.getAttribute('data-a-set'), +b.getAttribute('data-n')); }; });
    ana.querySelectorAll('[data-a-set-ekle]').forEach(function (b) { b.onclick = function () { var k = A.gun + '|' + b.getAttribute('data-a-set-ekle'); A.ekstra[k] = (A.ekstra[k] || 0) + 1; Z.ciz(); }; });
    ana.querySelectorAll('[data-a-tekrar]').forEach(function (b) { b.onclick = function () { tekrarDegis(+b.getAttribute('data-a-tekrar')); }; });
    ana.querySelectorAll('[data-a-set-sil]').forEach(function (b) { b.onclick = setSil; });
    ana.querySelectorAll('[data-a-detay]').forEach(function (b) { b.onclick = function () { detay(b.getAttribute('data-a-detay')); }; });
    ana.querySelectorAll('[data-a-kisa]').forEach(function (b) { b.onclick = function () { kisaYap(b.getAttribute('data-a-kisa') === '1'); }; });
    ana.querySelectorAll('[data-a-kaydir]').forEach(function (b) { b.onclick = yarinaKaydir; });
    ana.querySelectorAll('[data-a-kaydirma-geri]').forEach(function (b) { b.onclick = kaydirmaGeri; });
    ana.querySelectorAll('[data-a-bitir]').forEach(function (b) { b.onclick = bitir; });
    ana.querySelectorAll('[data-a-bitir-geri]').forEach(function (b) { b.onclick = function () { var pl = gunPlani(A.gun); gunYaz(A.gun, pl.ant, 'plan'); Z.ciz(); }; });
    ana.querySelectorAll('[data-a-sec-ant]').forEach(function (b) { b.onclick = function () { var a = antBul(b.getAttribute('data-a-sec-ant')); gunYaz(A.gun, a, 'plan'); Z.ciz(); }; });
    ana.querySelectorAll('[data-a-ozet-tamam]').forEach(function (b) { b.onclick = function () { Z.ayarYaz('ant_ozet_hafta', b.getAttribute('data-a-ozet-tamam')); Z.ciz(); }; });
    ana.querySelectorAll('[data-a-ozet-degistir],[data-a-program-duzenle]').forEach(function (b) { b.onclick = function () { programDuzenle(etkinProgram()); }; });
    ana.querySelectorAll('[data-a-ant-duzenle]').forEach(function (b) { b.onclick = function () { var p = etkinProgram(); var t = taslakYap(p); var a = t.antrenmanlar.filter(function (x) { return x.id === b.getAttribute('data-a-ant-duzenle'); })[0]; antrenmanDuzenle(t, a, true); }; });
    ana.querySelectorAll('[data-a-yeni-program]').forEach(function (b) { b.onclick = function () { programDuzenle(null); }; });
    ana.querySelectorAll('[data-a-etkin]').forEach(function (b) { b.onclick = function () { var p = A.programlar.filter(function (x) { return x.id === b.getAttribute('data-a-etkin'); })[0]; if (!p) return; var t = taslakYap(p); t.program.etkin = true; programKaydet(t); Z.bildir('✅ ' + p.ad + ' etkin'); }; });
    ana.querySelectorAll('[data-a-tanisma]').forEach(function (b) { b.onclick = function () { tanisma(1, function () { Z.pencereKapat(); Z.ciz(); }); }; });
    ana.querySelectorAll('[data-a-kendi]').forEach(function (b) { b.onclick = function () { kendiHareket(); }; });
    ana.querySelectorAll('[data-a-programa]').forEach(function (b) { b.onclick = function () { programaEkle(b.getAttribute('data-a-programa')); }; });
    var a = $('#a-ara');
    if (a) {
      a.oninput = function () { A.q = a.value; $('#a-liste').innerHTML = hareketListesiHtml(suz(A.q)); bagla($('#a-liste')); };
      Z.aramaSilBagla(a);
    }
    ana.querySelectorAll('[data-a-uygun]').forEach(function (b) { b.onclick = function () { A.f.uygun = !A.f.uygun; A.gizliGoster = false; Z.ciz(); }; });
    ana.querySelectorAll('[data-a-gizli-goster]').forEach(function (b) { b.onclick = function () { A.gizliGoster = !A.gizliGoster; $('#a-liste').innerHTML = hareketListesiHtml(suz(A.q)); bagla($('#a-liste')); }; });
    ana.querySelectorAll('[data-a-filtre]').forEach(function (b) { b.onclick = function () { filtreSec(b.getAttribute('data-a-filtre'), function () { Z.ciz(); }); }; });
  }
  function filtreSec(k, sonra) {
    var l = k === 'bolge' ? BOLGELER : k === 'poz' ? POZLAR : ['başlangıç', 'orta'];
    var ad = { bolge: 'Bölge', poz: 'Pozisyon', seviye: 'Seviye' }[k];
    Z.pencereAc(ad, '<div class="cipler t2-filtre-sec">' + ['', ].concat(l).map(function (x) {
      return '<button class="cip' + (A.f[k] === x ? ' secili' : '') + '" data-f="' + esc(x) + '">' + (x ? buyuk(x) : 'Hepsi') + '</button>';
    }).join('') + '</div>', function (p) {
      p.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { A.f[k] = b.getAttribute('data-f'); Z.pencereKapat(); sonra(); }; });
    }, true);
  }

  /* ---------- Set kaydı ---------- */
  function setDokun(hid, n) {
    var pl = gunPlani(A.gun), ant = pl.ant; if (!ant) return;
    var s = setler(A.gun, ant.id, hid), anahtar = A.gun + '|' + hid + '|' + n;
    if (s[n]) { A.acikSet = A.acikSet === anahtar ? '' : anahtar; Z.ciz(); return; }
    var x = ant.hareketler.filter(function (y) { return y.h === hid; })[0] || {}, hh = hBul(hid);
    var v = { id: Z.kimlik('S'), gun: A.gun, antId: ant.id, hareketId: hid, ad: hh ? hh.ad : x.ad || '', set: n, tekrar: +x.alt || +x.ust || 1, agirlik: '' };
    Z.islemEkle('set_kaydet', v); setYerel(v); Z.titret();
    if (!A.gunler[A.gun] || A.gunler[A.gun]['Antrenman ID'] !== ant.id) gunYaz(A.gun, ant, 'plan');
    A.acikSet = ''; Z.ciz();
  }
  function setYerel(v) {
    var k = A.kayitlar.filter(function (y) { return y.id === v.id; })[0];
    if (k) { k.tekrar = +v.tekrar; return; }
    A.kayitlar.push({ id: v.id, gun: v.gun, antId: v.antId, hid: v.hareketId, ad: v.ad, set: v.set, tekrar: +v.tekrar, agirlik: v.agirlik });
  }
  function acikKayit() {
    if (!A.acikSet) return null;
    var p = A.acikSet.split('|'), ant = gunPlani(p[0]).ant; if (!ant) return null;
    return setler(p[0], ant.id, p[1])[+p[2]] || null;
  }
  function tekrarDegis(f) {
    var k = acikKayit(); if (!k) return;
    k.tekrar = Math.max(1, (k.tekrar || 0) + f);
    Z.islemEkle('set_kaydet', { id: k.id, gun: k.gun, antId: k.antId, hareketId: k.hid, ad: k.ad, set: k.set, tekrar: k.tekrar, agirlik: k.agirlik || '' });
    Z.ciz();
  }
  function setSil() {
    var k = acikKayit(); if (!k) return;
    A.kayitlar = A.kayitlar.filter(function (y) { return y.id !== k.id; });
    // 1.10.3: programda olmayan (sonradan + ile eklenen) set silinince dairesi de kalkar
    var ant = antBul(k.antId), y = ant && gunHareketleri(ant, k.gun).filter(function (z) { return z.x.h === k.hid; })[0], ek = k.gun + '|' + k.hid;
    if (y && k.set > y.set && A.ekstra[ek]) A.ekstra[ek] -= 1;
    Z.islemEkle('set_sil', { id: k.id }); A.acikSet = ''; Z.ciz();
    Z.bildir('Set silindi', 'Geri al', function () {
      var v = { id: Z.kimlik('S'), gun: k.gun, antId: k.antId, hareketId: k.hid, ad: k.ad, set: k.set, tekrar: k.tekrar, agirlik: k.agirlik || '' };
      Z.islemEkle('set_kaydet', v); setYerel(v); Z.ciz();
    });
  }
  function gunYaz(gun, ant, durum, ek) {
    ek = ek || {};
    var v = { gun: gun, antId: ant ? ant.id : '', ad: ant ? ant.ad : '', durum: durum, kisa: ek.kisa !== undefined ? ek.kisa : kisaMi(gun), yapilan: ek.yapilan || 0, hedef: ek.hedef || 0, not: ek.not || '' };
    Z.islemEkle('ant_gun', v); gunYerel(v);
  }
  function gunYerel(v) { A.gunler[v.gun] = { 'Gün': v.gun, 'Antrenman ID': v.antId, 'Ad': v.ad, 'Durum': v.durum, 'Kısa': v.kisa ? 1 : 0, 'Yapılan': v.yapilan, 'Hedef': v.hedef, 'Not': v.not }; }
  function kisaYap(evet) {
    var ant = gunPlani(A.gun).ant; if (!ant) return;
    gunYaz(A.gun, ant, (A.gunler[A.gun] && A.gunler[A.gun]['Durum']) || 'plan', { kisa: evet });
    Z.ciz(); Z.bildir(evet ? 'Kısa gün: setler 1 azaldı' : 'Tam antrenmana dönüldü');
  }
  function yarinaKaydir() {
    var ant = gunPlani(A.gun).ant; if (!ant) return;
    var yarin = gunEkle(A.gun, 1);
    gunYaz(A.gun, ant, 'kaydırıldı'); gunYaz(yarin, ant, 'plan', { kisa: false });
    Z.ciz(); Z.bildir('✅ ' + ant.ad + ' yarına kaydırıldı');
  }
  function kaydirmaGeri() {
    var g = A.gunler[A.gun]; if (!g) return;
    var yarin = gunEkle(A.gun, 1), y = A.gunler[yarin];
    Z.islemEkle('ant_gun_sil', { gun: A.gun }); delete A.gunler[A.gun];
    if (y && y['Durum'] === 'plan' && y['Antrenman ID'] === g['Antrenman ID'] && !gunKayitlari(yarin).length) { Z.islemEkle('ant_gun_sil', { gun: yarin }); delete A.gunler[yarin]; }
    Z.ciz();
  }

  /* ---------- Bitir ---------- */
  function bitir() {
    var ant = gunPlani(A.gun).ant; if (!ant) return;
    var hedef = hedefSet(ant, A.gun), yapilan = yapilanSet(A.gun, ant), eksik = Math.max(0, hedef - yapilan), secim = eksik ? 'yarim' : 'tamam', agri = 'hayir';
    function icerik() {
      var h = '<div class="t2-yarim"><b>' + yapilan + ' / ' + hedef + ' set</b> işaretlendi</div>';
      if (eksik) {
        h += '<p class="t2-not t2-orta">' + eksik + ' set işaretlenmedi. Ne yapalım?</p><ul class="t2-secim">' +
          [['hepsi', 'Hepsini yaptım', 'İşaretlemeyi unuttum, kalan setler hedefle kaydedilsin'], ['yarim', 'Yarım kaldı', 'Sadece işaretlediğim ' + yapilan + ' set kaydedilsin'], ['don', 'Antrenmana dön', 'Devam edeceğim']]
            .map(function (x) { var on = secim === x[0]; return '<li><button class="' + (on ? 'secili' : '') + '" aria-pressed="' + on + '" data-b-sec="' + x[0] + '"><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span>' + (on ? ik('check') : '') + '</button></li>'; }).join('') + '</ul>';
      }
      h += '<p class="bitir-soru">Antrenmanda ağrı oldu mu?</p><div class="cipler"><button class="cip' + (agri === 'hayir' ? ' secili' : '') + '" data-b-agri="hayir">Hayır</button><button class="cip' + (agri === 'evet' ? ' secili' : '') + '" data-b-agri="evet">Evet</button></div>' +
        '<div class="alt-dugme"><button class="ana-dugme" id="b-tamam">' + (secim === 'don' ? 'Antrenmana dön' : agri === 'evet' ? 'Devam: ağrı notu' : 'Bitir ve kaydet') + '</button></div>';
      return h;
    }
    function bagla2(p) {
      p.querySelectorAll('[data-b-sec]').forEach(function (b) { b.onclick = function () { secim = b.getAttribute('data-b-sec'); Z.pencereIcerik(icerik(), bagla2, true); }; });
      p.querySelectorAll('[data-b-agri]').forEach(function (b) { b.onclick = function () { agri = b.getAttribute('data-b-agri'); Z.pencereIcerik(icerik(), bagla2, true); }; });
      $('#b-tamam').onclick = function () {
        if (secim === 'don') { Z.pencereKapat(); return; }
        if (secim === 'hepsi') eksikleriDoldur(ant);
        var y = yapilanSet(A.gun, ant);
        gunYaz(A.gun, ant, secim === 'yarim' && eksik ? 'yarım' : 'tamam', { yapilan: y, hedef: hedef });
        var mesaj = secim === 'yarim' && eksik ? '✅ Kaydedildi · yarım kaldı' : '✅ Antrenman bitti';
        if (agri === 'evet') {
          Z.pencereAc('Ağrı notu', '');
          Z.yeniNot({ tur: 'antrenman kaynaklı', sonra: function () { Z.pencereKapat(); Z.ciz(); Z.bildir(mesaj); } });
          return;
        }
        Z.pencereKapat(); Z.ciz(); Z.bildir(mesaj);
      };
    }
    Z.pencereAc('Antrenmanı bitir', icerik(), bagla2);
  }
  function eksikleriDoldur(ant) {
    gunHareketleri(ant, A.gun).forEach(function (y) {
      var s = setler(A.gun, ant.id, y.x.h), hh = hBul(y.x.h);
      for (var i = 1; i <= hareketHedef(A.gun, ant, y); i++) if (!s[i]) {
        var v = { id: Z.kimlik('S'), gun: A.gun, antId: ant.id, hareketId: y.x.h, ad: hh ? hh.ad : '', set: i, tekrar: +y.x.alt || +y.x.ust || 1, agirlik: '' };
        Z.islemEkle('set_kaydet', v); setYerel(v);
      }
    });
  }

  /* ---------- Hareket detayı ---------- */
  function detay(id) {
    var h = hBul(id); if (!h) { katalogGetir(); return; }
    var u = uygunluk(h), m = h.metin || {}, ag = hareketAgri(h, agriDurumu());
    var kaynak = h.benim ? 'Kendi eklediğin hareket' : /^fedb/.test(h.kaynak) ? 'Kaynak: free-exercise-db (kamu malı), Türkçeye çevrildi' : h.kaynak === 'nhs' ? 'Kaynak: NHS egzersiz önerileri' : 'Kaynak: Zindem';
    var uyarilar = (ag ? ['<b>Açık ağrı notu.</b> ' + (ag.k === 'dikkat' ? 'Bu hareketi hafif yap.' : 'Bu bölgeye bugün ara ver.')] : [])
      .concat(u.uyari.map(function (x) { return '<b>' + esc(x) + '.</b> Dikkat edilecek bölge olarak seçtin.'; }));
    var c = '<div class="nasil"><p class="nasil-alt">' + (h.bilinen ? 'Bilinen adı: ' + esc(h.bilinen) + ' · ' : '') + esc(buyuk(h.seviye || '')) + (h.hedef ? ' · önerilen ' + esc(h.hedef) : '') + '</p>' +
      '<div class="nasil-bolge">' + [h.bolge].concat(h.ekipman || [], [h.poz]).filter(Boolean).map(function (x) { return '<span class="etiket">' + esc(x) + '</span>'; }).join('') + '</div>' +
      uyarilar.map(function (x) { return '<div class="t2-uyari">' + ik('alert-triangle') + '<span>' + x + '</span></div>'; }).join('') + '<dl>' +
      [['basla', 'Başla'], ['yap', 'Yap'], ['hisset', 'Hisset'], ['kolay', 'Kolaylaştır'], ['zor', 'Zorlaştır'], ['dikkat', 'Dikkat'], ['not', 'Not']].map(function (x) {
        return m[x[0]] ? '<dt>' + x[1] + '</dt><dd>' + esc(m[x[0]]) + '</dd>' : '';
      }).join('') + '</dl><p class="t2-kaynak">' + kaynak + '</p></div>' +
      (programdaMi(h.id) ? '' : '<div class="alt-dugme"><button class="ana-dugme" id="d-ekle">' + ik('plus') + 'Programa ekle</button></div>');
    Z.pencereAc(esc(h.ad), c, function () { var d = $('#d-ekle'); if (d) d.onclick = function () { programaEkle(h.id); }; });
  }

  function programdaMi(id) { return programAntrenmanlari(etkinProgram()).some(function (a) { return a.hareketler.some(function (x) { return x.h === id; }); }); }
  /* ---------- Programa ekle (Hareketler listesinden) ---------- */
  function programaEkle(hid) {
    var p = etkinProgram();
    if (!p) { Z.pencereKapat(); Z.bildir('Önce bir program oluştur'); return; }
    var l = programAntrenmanlari(p);
    if (!l.length) { programDuzenle(p); return; }
    Z.pencereAc('Hangi antrenmana?', '<section class="an-kart t2-duz">' + l.map(function (a) {
      var var_ = a.hareketler.some(function (x) { return x.h === hid; });
      return '<button class="t2-satir" data-pe="' + a.id + '"' + (var_ ? ' disabled' : '') + '><span><b>' + esc(a.ad) + '</b><small>' + (var_ ? 'zaten var' : a.hareketler.length + ' hareket') + '</small></span>' + ik(var_ ? 'check' : 'plus') + '</button>';
    }).join('') + '</section>', function (pp) {
      pp.querySelectorAll('[data-pe]').forEach(function (b) {
        b.onclick = function () {
          var t = taslakYap(p), a = t.antrenmanlar.filter(function (x) { return x.id === b.getAttribute('data-pe'); })[0];
          a.hareketler.push(varsayilanOge(hBul(hid), 'ana'));
          programKaydet(t); Z.pencereKapat(); Z.bildir('✅ ' + a.ad + '’a eklendi');
        };
      });
    }, true);
  }
  function varsayilanOge(h, bolum) {
    var sure = h.tur === 'süre', m = /(\d+)\s*×\s*(\d+)(?:–(\d+))?/.exec(h.hedef || '');
    return { h: h.id, ad: h.ad, bolum: bolum || 'ana', set: m ? +m[1] : (bolum === 'isinma' ? 1 : 2), alt: m ? +m[2] : (sure ? 20 : 8), ust: m ? +(m[3] || m[2]) : (sure ? 30 : 12),
      tur: h.tur || 'tekrar', dinlenme: bolum === 'isinma' ? 0 : 60, kisa: 1, taraf: !!h.taraf };
  }

  /* ---------- Program düzenleme (taslak üzerinde; Kaydet'e kadar tabloya yazılmaz) ---------- */
  function taslakYap(p) {
    if (!p) return { yeni: true, program: { id: Z.kimlik('P'), ad: 'Programım', etkin: true, plan: {}, baslangic: S.bugun }, antrenmanlar: [{ id: Z.kimlik('N'), ad: '1. antrenman', hareketler: [] }] };
    return { program: { id: p.id, ad: p.ad, etkin: p.etkin || !A.programlar.some(function (x) { return x.etkin; }), plan: JSON.parse(JSON.stringify(p.plan || {})), baslangic: p.baslangic },
      antrenmanlar: programAntrenmanlari(p).map(function (a) { return { id: a.id, ad: a.ad, kad: a.kad || '', hareketler: JSON.parse(JSON.stringify(a.hareketler)) }; }) };
  }
  function programKaydet(t) {
    var v = { program: { id: t.program.id, ad: t.program.ad, etkin: !!t.program.etkin, plan: t.program.plan, baslangic: t.program.baslangic || S.bugun },
      antrenmanlar: t.antrenmanlar.map(function (a, i) { return { id: a.id, ad: a.ad, kad: a.kad || '', sira: i + 1, hareketler: a.hareketler }; }) };
    Z.islemEkle('program_kaydet', v); programYerel(v); Z.ciz();
  }
  function programYerel(v) {
    var p = v.program;
    if (p.etkin) A.programlar.forEach(function (x) { x.etkin = false; });
    var var_ = A.programlar.filter(function (x) { return x.id === p.id; })[0];
    if (var_) { var_.ad = p.ad; var_.plan = p.plan; var_.etkin = p.etkin; } else A.programlar.push({ id: p.id, ad: p.ad, etkin: p.etkin, plan: p.plan, baslangic: p.baslangic });
    A.antrenmanlar = A.antrenmanlar.filter(function (a) { return a.programId !== p.id; }).concat((v.antrenmanlar || []).map(function (a, i) { return { id: a.id, programId: p.id, ad: a.ad, kad: a.kad || '', sira: i + 1, hareketler: a.hareketler }; }));
  }
  function programDuzenle(p, t) {
    t = t || taslakYap(p);
    function icerik() {
      return '<div class="form-alan"><label for="p-ad">Programın adı</label><input id="p-ad" type="text" maxlength="40" value="' + esc(t.program.ad) + '"></div>' +
        '<div class="bolum-baslik">Antrenmanlar</div><div class="t2-liste">' + t.antrenmanlar.map(function (a, i) {
          return '<button class="t2-satir" data-p-ant="' + i + '"><span><b>' + esc(a.ad) + '</b><small>' + (a.hareketler.length ? a.hareketler.length + ' hareket · ' + a.hareketler.reduce(function (s, x) { return s + (+x.set || 0); }, 0) + ' set' : 'Hareket ekle') + '</small></span>' + ik('chevron-right') + '</button>';
        }).join('') + '<button class="metin-dugme vurgu" id="p-ant-ekle">' + ik('plus') + 'Antrenman ekle</button></div>' +
        '<div class="bolum-baslik">Haftalık plan</div><div class="not-liste">' + [1, 2, 3, 4, 5, 6, 7].map(function (g) {
          return '<div class="not-satir t2-plan"><label for="p-g' + g + '">' + GUN_AD[g] + '</label><div class="secim-kutu"><select id="p-g' + g + '" data-p-gun="' + g + '"><option value="">Dinlenme</option>' +
            t.antrenmanlar.map(function (a) { return '<option value="' + a.id + '"' + (t.program.plan[g] === a.id ? ' selected' : '') + '>' + esc(a.ad) + '</option>'; }).join('') + '</select>' + ik('chevron-down') + '</div></div>';
        }).join('') + '</div>' +
        (t.yeni ? '' : '<button class="metin-dugme tehlike orta" id="p-sil">' + ik('trash') + 'Programı sil</button>') +
        '<div class="alt-dugme"><button class="ana-dugme" id="p-kaydet">Kaydet</button></div>';
    }
    function oku() { var a = $('#p-ad'); if (a) t.program.ad = a.value.trim() || 'Programım'; document.querySelectorAll('[data-p-gun]').forEach(function (s) { t.program.plan[s.getAttribute('data-p-gun')] = s.value; }); }
    function bagla2() {
      document.querySelectorAll('[data-p-ant]').forEach(function (b) { b.onclick = function () { oku(); antrenmanDuzenle(t, t.antrenmanlar[+b.getAttribute('data-p-ant')]); }; });
      $('#p-ant-ekle').onclick = function () { oku(); var a = { id: Z.kimlik('N'), ad: (t.antrenmanlar.length + 1) + '. antrenman', hareketler: [] }; t.antrenmanlar.push(a); antrenmanDuzenle(t, a); };
      document.querySelectorAll('[data-p-gun]').forEach(function (s) { s.onchange = oku; });
      var sil = $('#p-sil'); if (sil) sil.onclick = function () {
        if (sil.getAttribute('data-onay') !== '1') { sil.setAttribute('data-onay', '1'); sil.lastChild.textContent = 'Silmek için tekrar dokun'; return; }
        Z.islemEkle('program_sil', { id: t.program.id });
        A.programlar = A.programlar.filter(function (x) { return x.id !== t.program.id; }); A.antrenmanlar = A.antrenmanlar.filter(function (x) { return x.programId !== t.program.id; });
        Z.pencereKapat(); Z.ciz(); Z.bildir('Program silindi');
      };
      $('#p-kaydet').onclick = function () {
        oku();
        if (!t.antrenmanlar.some(function (a) { return a.hareketler.length; })) { Z.bildir('⚠ En az bir antrenmana hareket ekle'); return; }
        if (!Object.keys(t.program.plan).some(function (k) { return t.program.plan[k]; })) { Z.bildir('⚠ Haftalık planda en az bir gün seç'); return; }
        t.program.etkin = true; programKaydet(t); Z.pencereKapat(); A.sekme = 'bugun'; Z.ciz(); Z.bildir('✅ Program kaydedildi');
      };
    }
    A.pencereYenile = function () { Z.pencereIcerik(icerik(), bagla2, true); };
    Z.pencereAc(t.yeni ? 'Yeni program' : 'Programı düzenle', icerik(), bagla2);
  }
  function antrenmanDuzenle(t, a, dogrudanKaydet) {
    function icerik() {
      var h = '<div class="form-alan"><label for="a-ad">Antrenmanın adı</label><input id="a-ad" type="text" maxlength="30" value="' + esc(a.ad) + '"></div>' +
        '<div class="form-alan"><label for="a-kad">Kısa ad (isteğe bağlı)</label><input id="a-kad" type="text" maxlength="6" autocomplete="off" placeholder="' + esc(kisaAd(a.ad)) + '" value="' + esc(a.kad || '') + '" aria-describedby="a-kad-not"><small class="alan-not" id="a-kad-not">Programım\'daki haftalık tabloda görünür. Boş kalırsa adın ilk kelimesi.</small></div>';
      [['isinma', 'Isınma'], ['ana', 'Ana hareketler']].forEach(function (b) {
        h += '<div class="bolum-baslik">' + b[1] + '</div>';
        a.hareketler.forEach(function (x, i) {
          if ((x.bolum || 'ana') !== b[0]) return;
          var hh = hBul(x.h), sure = x.tur === 'süre';
          h += '<div class="t2-duzen"><button class="t2-satir" data-a-oge="' + i + '"><span><b>' + esc(hh ? hh.ad : x.ad) + '</b><small>' + x.set + ' set × ' + (x.alt === x.ust ? x.alt : x.alt + '–' + x.ust) + (sure ? ' sn' : ' tekrar') +
            (x.dinlenme ? ' · ' + x.dinlenme + ' sn dinlenme' : '') + (x.kisa === 0 ? ' · kısa günde yok' : '') + '</small></span>' + ik('chevron-right') + '</button></div>';
        });
        h += '<button class="metin-dugme vurgu" data-a-ekle-bolum="' + b[0] + '">' + ik('plus') + (b[0] === 'isinma' ? 'Isınma hareketi ekle' : 'Hareket ekle') + '</button>';
      });
      if (!dogrudanKaydet) h += '<button class="metin-dugme tehlike orta" id="a-sil">' + ik('trash') + 'Antrenmanı sil</button>';
      return h + '<div class="alt-dugme"><button class="ana-dugme" id="a-tamam">' + (dogrudanKaydet ? 'Kaydet' : 'Tamam') + '</button></div>';
    }
    function oku() { var x = $('#a-ad'); if (x) a.ad = x.value.trim() || a.ad; var y = $('#a-kad'); if (y) a.kad = y.value.trim(); }
    function geri() { oku(); if (dogrudanKaydet) { Z.pencereKapat(); return; } programDuzenle(null, t); }
    function bagla2() {
      document.querySelectorAll('[data-a-oge]').forEach(function (b) { b.onclick = function () { oku(); hareketAyar(t, a, a.hareketler[+b.getAttribute('data-a-oge')], dogrudanKaydet); }; });
      document.querySelectorAll('[data-a-ekle-bolum]').forEach(function (b) { b.onclick = function () { oku(); hareketSec(t, a, b.getAttribute('data-a-ekle-bolum'), dogrudanKaydet); }; });
      var sil = $('#a-sil'); if (sil) sil.onclick = function () {
        t.antrenmanlar = t.antrenmanlar.filter(function (x) { return x !== a; });
        Object.keys(t.program.plan).forEach(function (k) { if (t.program.plan[k] === a.id) t.program.plan[k] = ''; });
        programDuzenle(null, t);
      };
      $('#a-tamam').onclick = function () { oku(); if (dogrudanKaydet) { programKaydet(t); Z.pencereKapat(); Z.bildir('✅ Kaydedildi'); } else programDuzenle(null, t); };
    }
    A.pencereYenile = function () { Z.pencereIcerik(icerik(), bagla2, true); };
    Z.pencereAc(esc(a.ad), icerik(), bagla2, false, '', dogrudanKaydet ? null : { ad: 'Program', fn: geri });
  }
  function hareketAyar(t, a, x, dogrudanKaydet) {
    var hh = hBul(x.h);
    function sayac(k, ad, deger, alt) { return '<div class="t2-sayac"><span>' + ad + (alt ? '<small>' + alt + '</small>' : '') + '</span><div class="adim" role="group" aria-label="' + ad + '"><button data-s="' + k + '" data-f="-1" aria-label="' + ad + ' azalt">' + ik('minus') + '</button><span class="adim-deger"><b>' + deger + '</b></span><button data-s="' + k + '" data-f="1" aria-label="' + ad + ' artır">' + ik('plus') + '</button></div></div>'; }
    function icerik() {
      var sure = x.tur === 'süre', birim = sure ? ' sn' : '';
      return '<div class="form-alan"><span class="etiket-yazi">Nasıl kaydedilsin?</span><div class="cipler">' + [['tekrar', 'Tekrar'], ['süre', 'Süre']].map(function (y) {
        return '<button class="cip' + ((x.tur === 'ağırlık' ? 'tekrar' : x.tur) === y[0] ? ' secili' : '') + '" data-tur="' + y[0] + '">' + y[1] + '</button>'; }).join('') + '</div></div>' +
        sayac('set', 'Set', x.set) + sayac('alt', sure ? 'Süre, en az' : 'Tekrar, en az', x.alt + birim) + sayac('ust', sure ? 'Süre, en çok' : 'Tekrar, en çok', x.ust + birim) +
        sayac('dinlenme', 'Dinlenme', x.dinlenme ? x.dinlenme + ' sn' : 'yok') +
        '<div class="t2-sayac"><span id="k-gun">Kısa günde de yap<small>Kısa günde 1 set eksik yapılır</small></span><button class="anahtar" role="switch" aria-checked="' + (x.kisa !== 0) + '" aria-labelledby="k-gun" id="h-kisa"><span></span></button></div>' +
        '<div class="form-alan"><label for="h-not">Not (isteğe bağlı)</label><input id="h-not" type="text" maxlength="60" placeholder="Ör. tezgahta yap" value="' + esc(x.not || '') + '"></div>' +
        '<button class="metin-dugme t2-sil" id="h-cikar">' + ik('trash') + 'Antrenmandan çıkar</button>' +
        '<div class="alt-dugme"><button class="ana-dugme" id="h-tamam">Tamam</button></div>';
    }
    var ADIM = { set: [1, 1, 10], alt: [1, 1, 300], ust: [1, 1, 300], dinlenme: [15, 0, 300] };
    function bagla2() {
      document.querySelectorAll('[data-tur]').forEach(function (b) { b.onclick = function () {
        var yeni = b.getAttribute('data-tur'); if (yeni === x.tur) return;
        x.tur = yeni; if (yeni === 'süre') { x.alt = 20; x.ust = 30; } else { x.alt = 8; x.ust = 12; } Z.pencereIcerik(icerik(), bagla2, true); }; });
      document.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () {
        var k = b.getAttribute('data-s'), f = +b.getAttribute('data-f'), ad = ADIM[k], adim = (k === 'alt' || k === 'ust') && x.tur === 'süre' ? 5 : ad[0];
        x[k] = Math.max(ad[1], Math.min(ad[2], (+x[k] || 0) + f * adim));
        if (k === 'alt' && x.ust < x.alt) x.ust = x.alt; if (k === 'ust' && x.alt > x.ust) x.alt = x.ust;
        Z.pencereIcerik(icerik(), bagla2, true); }; });
      $('#h-kisa').onclick = function () { x.kisa = x.kisa === 0 ? 1 : 0; this.setAttribute('aria-checked', String(x.kisa !== 0)); };
      $('#h-not').oninput = function () { x.not = this.value.trim(); };
      $('#h-cikar').onclick = function () { a.hareketler = a.hareketler.filter(function (y) { return y !== x; }); antrenmanDuzenle(t, a, dogrudanKaydet); };
      $('#h-tamam').onclick = function () { antrenmanDuzenle(t, a, dogrudanKaydet); };
    }
    A.pencereYenile = function () { Z.pencereIcerik(icerik(), bagla2, true); };
    Z.pencereAc(esc(hh ? hh.ad : x.ad), icerik(), bagla2, false, '', { ad: a.ad, fn: function () { antrenmanDuzenle(t, a, dogrudanKaydet); } });
  }
  function hareketSec(t, a, bolum, dogrudanKaydet) {
    var secilen = [], q = '';
    function liste() {
      if (!A.katalog) return '<p class="t2-not t2-orta">Hareketler yükleniyor…</p>';
      var r = suz(q);
      return hareketListesiHtmlSec(r) + '<button class="metin-dugme vurgu" id="hs-kendi">' + ik('plus') + 'Listede yok, kendim ekleyeceğim</button>' +
        '<div class="alt-sabit t2-sepet" id="hs-sepet"' + (secilen.length ? '' : ' hidden') + '><span><b>' + secilen.length + ' hareket</b> seçildi</span><button class="ana-dugme ince" id="hs-ekle">Ekle</button></div>';
    }
    function hareketListesiHtmlSec(r) {
      var h = r.gizli ? '<div class="t2-gizli">' + ik('eye-off') + '<span><b>' + r.gizli + ' hareket gizlendi</b> · ' + esc(r.neden) + '</span><button class="metin-dugme" data-a-gizli-goster>Göster</button></div>' : '';
      return h + '<section class="an-kart t2-duz">' + r.l.map(function (x) {
        var var_ = a.hareketler.some(function (y) { return y.h === x.id; }), sec = secilen.indexOf(x.id) >= 0;
        return hareketSatiri(x, '<button class="t2-ekle' + (sec || var_ ? ' eklendi' : '') + '" data-hs="' + esc(x.id) + '"' + (var_ ? ' disabled' : '') + ' aria-pressed="' + sec + '" aria-label="' + esc(x.ad) + (var_ ? ' zaten var' : ' seç') + '">' + ik(sec || var_ ? 'check' : 'plus') + '</button>');
      }).join('') + '</section>';
    }
    function bagla2(p) {
      p.querySelectorAll('[data-hs]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-hs'), i = secilen.indexOf(id); if (i >= 0) secilen.splice(i, 1); else secilen.push(id); Z.pencereIcerik(liste(), bagla2, true); }; });
      p.querySelectorAll('[data-a-detay]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-a-detay'); if (secilen.indexOf(id) < 0) secilen.push(id); Z.pencereIcerik(liste(), bagla2, true); }; });
      p.querySelectorAll('[data-a-gizli-goster]').forEach(function (b) { b.onclick = function () { A.gizliGoster = !A.gizliGoster; Z.pencereIcerik(liste(), bagla2, true); }; });
      p.querySelectorAll('[data-a-uygun]').forEach(function (b) { b.onclick = function () { A.f.uygun = !A.f.uygun; A.gizliGoster = false; hareketSec(t, a, bolum, dogrudanKaydet); }; });
      p.querySelectorAll('[data-a-filtre]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-a-filtre'); filtreSec(k, function () { hareketSec(t, a, bolum, dogrudanKaydet); }); }; });
      var ke = $('#hs-kendi'); if (ke) ke.onclick = function () { kendiHareket(function (h) { a.hareketler.push(varsayilanOge(h, bolum)); antrenmanDuzenle(t, a, dogrudanKaydet); }); };
      var ek = $('#hs-ekle'); if (ek) ek.onclick = function () {
        secilen.forEach(function (id) { var h = hBul(id); if (h) a.hareketler.push(varsayilanOge(h, bolum)); });
        antrenmanDuzenle(t, a, dogrudanKaydet);
      };
    }
    A.pencereYenile = function () { Z.pencereIcerik(liste(), bagla2, true); };
    Z.pencereAc(bolum === 'isinma' ? 'Isınma hareketi ekle' : 'Hareket ekle', liste(), bagla2, false, aramaKutusu('hs-ara', '') + filtreCipleri(), { ad: a.ad, fn: function () { antrenmanDuzenle(t, a, dogrudanKaydet); } });
    var k = $('#hs-ara'); if (k) { k.addEventListener('input', function () { q = k.value; Z.pencereIcerik(liste(), bagla2, false); }); Z.aramaSilBagla(k); }
  }

  /* ---------- Kendi hareketin ---------- */
  function kendiHareket(sonra) {
    var v = { ad: '', tur: 'tekrar', bolge: '', ekipman: [], poz: '', zorlar: [], not: '' };
    function ciple(k, liste, coklu) {
      return '<div class="cipler">' + liste.map(function (x) {
        var on = coklu ? v[k].indexOf(x[0]) >= 0 : v[k] === x[0];
        return '<button class="cip' + (on ? ' secili' : '') + '" data-k="' + k + '" data-d="' + esc(x[0]) + '"' + (coklu ? ' data-coklu' : '') + '>' + esc(x[1]) + '</button>';
      }).join('') + '</div>';
    }
    function icerik() {
      return '<div class="form-alan"><label for="k-ad">Hareketin adı</label><input id="k-ad" type="text" maxlength="40" value="' + esc(v.ad) + '" placeholder="Ör. lastikle kürek çekme"></div>' +
        '<div class="form-alan"><span class="etiket-yazi">Nasıl kaydedilsin?</span>' + ciple('tur', [['tekrar', 'Tekrar'], ['süre', 'Süre'], ['ağırlık', 'Ağırlık + tekrar']]) + '</div>' +
        '<div class="form-alan"><span class="etiket-yazi">Çalışan bölge</span>' + ciple('bolge', BOLGELER.map(function (x) { return [x, buyuk(x)]; })) + '</div>' +
        '<div class="form-alan"><span class="etiket-yazi">Ekipman</span>' + ciple('ekipman', EKIPMAN.filter(function (x) { return x[0] !== 'yok'; }), true) + '</div>' +
        '<div class="form-alan"><span class="etiket-yazi">Pozisyon</span>' + ciple('poz', [['ayakta', 'Ayakta'], ['oturarak', 'Oturarak'], ['sırtüstü', 'Sırtüstü'], ['yüzüstü', 'Yüzüstü'], ['dört ayak', 'Dört ayak']]) + '</div>' +
        '<div class="form-alan"><span class="etiket-yazi">Zorladığı bölge (isteğe bağlı)</span>' + ciple('zorlar', ['boyun', 'omuz', 'dirsek', 'el bileği', 'bel', 'kalça', 'kasık', 'diz', 'ayak bileği'].map(function (x) { return [x, buyuk(x)]; }), true) + '</div>' +
        '<div class="form-alan"><label for="k-not">Not ya da video bağlantısı (isteğe bağlı)</label><input id="k-not" type="text" maxlength="200" value="' + esc(v.not) + '" placeholder="Ör. fizyoterapistimin verdiği hareket"></div>' +
        '<div class="alt-dugme"><button class="ana-dugme" id="k-kaydet">Hareketlerime ekle</button></div>';
    }
    function bagla2() {
      $('#k-ad').oninput = function () { v.ad = this.value; };
      $('#k-not').oninput = function () { v.not = this.value; };
      document.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () {
        var k = b.getAttribute('data-k'), d = b.getAttribute('data-d');
        if (b.hasAttribute('data-coklu')) { var i = v[k].indexOf(d); if (i >= 0) v[k].splice(i, 1); else v[k].push(d); } else v[k] = v[k] === d ? '' : d;
        Z.pencereIcerik(icerik(), bagla2, true); }; });
      $('#k-kaydet').onclick = function () {
        v.ad = v.ad.trim();
        if (!v.ad) { Z.bildir('⚠ Hareketin adını yaz'); return; }
        if (!v.bolge) { Z.bildir('⚠ Çalışan bölgeyi seç'); return; }
        var uzuv = ['k1']; if (v.poz === 'oturarak') uzuv.push('o'); if (v.ekipman.indexOf('lastik') >= 0 || v.ekipman.indexOf('dambıl') >= 0 || v.ekipman.indexOf('barfiks') >= 0) uzuv.push('t');
        var h = { id: Z.kimlik('K'), ad: v.ad, tur: v.tur, bolge: v.bolge, ekipman: v.ekipman, poz: v.poz, zorlar: v.zorlar, uzuv: uzuv, not: v.not };
        Z.islemEkle('hareket_ekle', h);
        var yer = { id: h.id, ad: h.ad, tur: h.tur, bolge: h.bolge, ekipman: h.ekipman, poz: h.poz, zorlar: h.zorlar, uzuv: h.uzuv, benim: true, kaynak: 'Benim eklediğim', metin: { not: h.not } };
        A.hareketlerim.push(yer);
        if (sonra) sonra(yer); else { Z.pencereKapat(); Z.ciz(); Z.bildir('✅ Hareketlerine eklendi'); }
      };
    }
    Z.pencereAc('Kendi hareketin', icerik(), bagla2);
  }

  /* ---------- Seni tanıyalım (4 adım, atlanabilir) ---------- */
  function tanisma(adim, sonra) {
    var c = { yer: Z.ayar('ant_yer', ''), ekipman: ayarJson('ant_ekipman', []), durum: Z.ayar('ant_hareket', ''), hassas: ayarJson('ant_hassas', []), uzuv: ayarJson('ant_uzuv', {}),
      yil: Z.ayar('dogum_yili', ''), deneyim: Z.ayar('ant_deneyim', '') };
    function kaydet() {
      Z.ayarYaz('ant_yer', c.yer); Z.ayarYaz('ant_ekipman', JSON.stringify(c.ekipman)); Z.ayarYaz('ant_hareket', c.durum || 'ayakta');
      Z.ayarYaz('ant_hassas', JSON.stringify(c.hassas));
      var u = {}; Object.keys(c.uzuv).forEach(function (k) { if (c.hassas.indexOf(k) >= 0 && c.uzuv[k] && c.uzuv[k].durum) u[k] = c.uzuv[k]; });
      Z.ayarYaz('ant_uzuv', JSON.stringify(u)); Z.ayarYaz('ant_tanisma', '1');
      if (String(c.yil) !== String(Z.ayar('dogum_yili', ''))) Z.ayarYaz('dogum_yili', c.yil);
      if (c.deneyim !== Z.ayar('ant_deneyim', '')) Z.ayarYaz('ant_deneyim', c.deneyim);
    }
    function adimlar() { return '<div class="t2-adimlar" role="img" aria-label="' + adim + '. adım, 5 adımdan">' + [1, 2, 3, 4, 5].map(function (i) { return '<span class="' + (i <= adim ? 'dolu' : '') + '"></span>'; }).join('') + '</div>'; }
    function cip(k, d, ad, on) { return '<button class="cip' + (on ? ' secili' : '') + '" data-t="' + k + '" data-d="' + esc(d) + '" aria-pressed="' + !!on + '">' + esc(ad) + '</button>'; }
    function icerik() {
      var h = '';
      if (adim === 1) h = '<p class="t2-soru">Nerede antrenman yapacaksın?</p><ul class="t2-secim">' + [['ev', 'Evde'], ['salon', 'Spor salonunda'], ['ikisi', 'İkisinde de']].map(function (x) {
        var on = c.yer === x[0]; return '<li><button class="' + (on ? 'secili' : '') + '" aria-pressed="' + on + '" data-t="yer" data-d="' + x[0] + '"><span><b>' + x[1] + '</b></span>' + (on ? ik('check') : '') + '</button></li>'; }).join('') + '</ul>';
      if (adim === 2) h = '<p class="t2-soru">Elinde neler var?</p><p class="t2-not">Sadece bunlarla yapılabilen hareketler gösterilir.</p><div class="cipler">' +
        EKIPMAN.map(function (x) { return cip('ekipman', x[0], x[1], c.ekipman.indexOf(x[0]) >= 0); }).join('') + '</div>';
      if (adim === 3) h = '<p class="t2-soru">Nasıl hareket ediyorsun?</p><ul class="t2-secim">' + HAREKET_DURUM.map(function (x) {
        var on = c.durum === x[0]; return '<li><button class="' + (on ? 'secili' : '') + '" aria-pressed="' + on + '" data-t="durum" data-d="' + x[0] + '"><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span>' + (on ? ik('check') : '') + '</button></li>'; }).join('') + '</ul>';
      if (adim === 4) {
        h = '<p class="t2-soru">Dikkat etmen gereken bir bölge var mı?</p><p class="t2-not">Bu bölgeyi zorlayan hareketler listede işaretlenir.</p><div class="cipler">' +
          cip('hassas', 'yok', 'Yok', !c.hassas.length) + HASSAS.map(function (x) { return cip('hassas', x, UZUV[x] || buyuk(x), c.hassas.indexOf(x) >= 0); }).join('') + '</div>';
        Object.keys(UZUV).forEach(function (b) {
          if (c.hassas.indexOf(b) < 0) return;
          var u = c.uzuv[b] || (c.uzuv[b] = { taraf: '', durum: '' });
          h += '<div class="t2-alt-soru"><p class="t2-alt-baslik">' + UZUV[b] + ' için</p><div class="cipler">' +
            [['sag', 'Sağ'], ['sol', 'Sol'], ['ikisi', 'İkisi']].map(function (x) { return '<button class="cip' + (u.taraf === x[0] ? ' secili' : '') + '" data-u="' + b + '" data-ut="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
            '<ul class="t2-secim t2-kucuk">' + [['agri', 'Ağrı ya da hassasiyet var'], ['zor', b === 'bacak / ayak' ? 'Basmakta, dengede zorlanıyorum' : 'Tutmakta, kavramakta zorlanıyorum'], ['yok', 'Kullanamıyorum ya da yok']].map(function (x) {
              var on = u.durum === x[0]; return '<li><button class="' + (on ? 'secili' : '') + '" aria-pressed="' + on + '" data-u="' + b + '" data-ud="' + x[0] + '"><span><b>' + x[1] + '</b></span>' + (on ? ik('check') : '') + '</button></li>'; }).join('') + '</ul>' +
            '<p class="t2-not t2-sessiz">Sadece hareketleri sana uydurmak için sorulur.</p></div>';
        });
      }
      if (adim === 5) h = '<p class="t2-soru">Antrenman deneyimin?</p><ul class="t2-secim">' + DENEYIM.map(function (x) {
          var on = c.deneyim === x[0]; return '<li><button class="' + (on ? 'secili' : '') + '" aria-pressed="' + on + '" data-t="deneyim" data-d="' + x[0] + '"><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span>' + (on ? ik('check') : '') + '</button></li>'; }).join('') + '</ul>' +
        '<div class="ayar-satir t2-yil"><label for="t-yil"><b>Doğum yılın</b><small>İsteğe bağlı · 65 yaş ve üstüne denge hareketleri önerilir</small></label><span class="birimli"><input id="t-yil" type="text" inputmode="numeric" autocomplete="off" value="' + esc(c.yil) + '" placeholder="—"></span></div>';
      return h + '<div class="alt-dugme"><button class="ana-dugme" id="t-devam">' + (adim === 5 ? 'Kaydet' : 'Devam') + '</button></div>';
    }
    function bagla2(p) {
      p.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () {
        var k = b.getAttribute('data-t'), d = b.getAttribute('data-d');
        var yi = $('#t-yil'); if (yi) c.yil = yi.value.trim();
        if (k === 'yer' || k === 'durum') c[k] = d;
        else if (k === 'deneyim') c.deneyim = c.deneyim === d ? '' : d;
        else if (k === 'ekipman') { if (d === 'yok') c.ekipman = c.ekipman.indexOf('yok') >= 0 ? [] : ['yok']; else { c.ekipman = c.ekipman.filter(function (x) { return x !== 'yok'; }); var i = c.ekipman.indexOf(d); if (i >= 0) c.ekipman.splice(i, 1); else c.ekipman.push(d); } }
        else if (k === 'hassas') { if (d === 'yok') c.hassas = []; else { var j = c.hassas.indexOf(d); if (j >= 0) c.hassas.splice(j, 1); else c.hassas.push(d); } }
        Z.pencereIcerik(icerik(), bagla2, true); }; });
      p.querySelectorAll('[data-u]').forEach(function (b) { b.onclick = function () {
        var yi2 = $('#t-yil'); if (yi2) c.yil = yi2.value.trim();
        var u = c.uzuv[b.getAttribute('data-u')];
        if (b.hasAttribute('data-ut')) u.taraf = b.getAttribute('data-ut'); else u.durum = u.durum === b.getAttribute('data-ud') ? '' : b.getAttribute('data-ud');
        Z.pencereIcerik(icerik(), bagla2, true); }; });
      $('#t-devam').onclick = function () {
        if (adim === 4) {
          var eksik0 = Object.keys(UZUV).filter(function (b) { return c.hassas.indexOf(b) >= 0 && c.uzuv[b] && c.uzuv[b].durum && !c.uzuv[b].taraf; })[0];
          if (eksik0) { Z.bildir('⚠ ' + UZUV[eksik0] + ' için tarafı seç'); return; }
        }
        if (adim === 5) {
          var yv = $('#t-yil').value.trim(), yn = +yv, buYil = +S.bugun.slice(0, 4);
          if (yv && (!/^\d{4}$/.test(yv) || yn < 1900 || yn > buYil)) { Z.bildir('⚠ Doğum yılını 4 haneli yaz'); return; }
          c.yil = yv;
          var eksik = Object.keys(UZUV).filter(function (b) { return c.hassas.indexOf(b) >= 0 && c.uzuv[b] && c.uzuv[b].durum && !c.uzuv[b].taraf; })[0];
          if (eksik) { Z.bildir('⚠ ' + UZUV[eksik] + ' için tarafı seç'); return; }
          kaydet(); sonra(); return;
        }
        adim += 1; ac();
      };
      var at = $('#t-atla'); if (at) at.onclick = function () { if (!Z.ayar('ant_tanisma', '')) Z.ayarYaz('ant_tanisma', 'atla'); sonra(); };
    }
    function ac() { Z.pencereAc('Seni tanıyalım', icerik(), bagla2, false, adimlar(), adim > 1 ? { ad: 'Geri', fn: function () { adim -= 1; ac(); } } : null); ekleAtla(); }
    function ekleAtla() { var u = $('#pencere .pencere-ust'); if (u && !$('#t-atla')) { u.querySelector('#kapat').insertAdjacentHTML('beforebegin', '<button class="metin-dugme" id="t-atla">Atla</button>'); $('#t-atla').onclick = function () { if (!Z.ayar('ant_tanisma', '')) Z.ayarYaz('ant_tanisma', 'atla'); sonra(); }; } }
    ac();
  }

  /* ---------- Hazır programlar ---------- */
  function hazirListe() {
    Z.pencereAc('Hazır programlar', '<section class="an-kart t2-duz">' + hazirSirali().map(function (x) { return hazirSatir(x, 'data-hz'); }).join('') + '</section>', function (pp) { pp.querySelectorAll('[data-hz]').forEach(function (b) { b.onclick = function () { hazirOnizle(b.getAttribute('data-hz')); }; }); });
  }
  function setSay(x) { return yeniBaslayanMi() && x[1] === 'ana' ? 1 : x[2]; }
  function hazirOnizle(id) {
    var hz = HAZIR.filter(function (x) { return x.id === id; })[0]; if (!hz) return;
    if (!A.katalog) { katalogGetir(); Z.bildir('Hareketler yükleniyor…'); return; }
    var gunler = Object.keys(hz.plan).map(function (g) { return GUN_AD[g]; }).join(', ');
    var c = '<p class="nasil-alt">' + esc(hz.alt) + '</p><p class="t2-not">' + gunler + '</p>';
    hz.ant.forEach(function (a) {
      c += '<div class="bolum-baslik">' + esc(a.ad) + '</div><section class="an-kart t2-duz">' + a.h.map(function (x) {
        var hh = hBul(x[0]); if (!hh) return '';
        return '<div class="t2-hr"><button class="t2-hr-bilgi" data-a-detay="' + hh.id + '"><b>' + esc(hh.ad) + '</b><small>' + (x[1] === 'isinma' ? 'Isınma · ' : '') + setSay(x) + ' × ' + (x[3] === x[4] ? x[3] : x[3] + '–' + x[4]) + (x[5] === 'süre' ? ' sn' : '') + '</small></button></div>';
      }).join('') + '</section>';
    });
    if (yeniBaslayanMi()) c += '<p class="t2-not">Yeni başladığın için ana hareketler 1 set. Programım\'dan artırabilirsin.</p>';
    c += '<p class="t2-kaynak">' + esc(hz.kaynak) + (yeniBaslayanMi() ? ' · set sayısı: ACSM' : '') + '</p><div class="alt-dugme"><button class="ana-dugme" id="hz-kullan">Bu programla başla</button></div>';
    Z.pencereAc(esc(hz.ad), c, function (pp) {
      pp.querySelectorAll('[data-a-detay]').forEach(function (b) { b.onclick = function () { detay(b.getAttribute('data-a-detay')); }; });
      $('#hz-kullan').onclick = function () {
        var map = {}, t = { program: { id: Z.kimlik('P'), ad: hz.ad, etkin: true, plan: {}, baslangic: S.bugun }, antrenmanlar: [] };
        hz.ant.forEach(function (a) {
          var id = Z.kimlik('N'); map[a.k] = id;
          t.antrenmanlar.push({ id: id, ad: a.ad, hareketler: a.h.filter(function (x) { return hBul(x[0]); }).map(function (x) {
            var hh = hBul(x[0]); return { h: x[0], ad: hh.ad, bolum: x[1], set: setSay(x), alt: x[3], ust: x[4], tur: x[5] || (hh.tur === 'süre' ? 'süre' : 'tekrar'), dinlenme: x[1] === 'isinma' ? 0 : 60, kisa: x[6] === 0 ? 0 : 1, taraf: !!hh.taraf };
          }) });
        });
        Object.keys(hz.plan).forEach(function (g) { t.program.plan[g] = map[hz.plan[g]]; });
        programKaydet(t); Z.pencereKapat(); A.sekme = 'bugun'; Z.ciz(); Z.bildir('✅ ' + hz.ad + ' başladı');
        if (!Z.ayar('ant_tanisma', '')) setTimeout(function () { tanisma(1, function () { Z.pencereKapat(); Z.ciz(); }); }, 400);
      };
    });
  }

  /* ---------- Bugün ekranındaki özet kartı satırı ---------- */
  function ozet(gun) {
    var p = etkinProgram();
    if (!p) return { deger: 'Program yok', oran: -1, aria: 'Antrenman programı yok. Dokun: program oluştur' };
    var pl = gunPlani(gun), ant = pl.ant;
    if (pl.kaydirildi) return { deger: 'Yarına kaydı', oran: -1, aria: 'Antrenman yarına kaydırıldı' };
    if (!ant) return { deger: 'Dinlenme', oran: -1, aria: 'Bugün dinlenme günü' };
    var hd = hedefSet(ant, gun), y = yapilanSet(gun, ant), g = A.gunler[gun], d = g && g['Antrenman ID'] === ant.id ? g['Durum'] : '';
    if (d === 'tamam') return { deger: '<i>' + y + '</i> / ' + hd + ' set', oran: 1, aria: ant.ad + ' bitti' };
    return { deger: '<i>' + y + '</i> / ' + hd + ' set', oran: hd ? y / hd : 0, aria: ant.ad + ', ' + y + ' / ' + hd + ' set' + (d === 'yarım' ? ', yarım kaldı' : '') + '. Dokun: antrenmana git' };
  }
  /* Bekleyen (henüz gönderilmemiş) işlemler bellekte de uygulansın */
  function uygula(is) {
    var v = is.veri || {};
    if (is.tur === 'set_kaydet') setYerel(v);
    if (is.tur === 'set_sil') A.kayitlar = A.kayitlar.filter(function (k) { return k.id !== v.id; });
    if (is.tur === 'ant_gun') gunYerel(v);
    if (is.tur === 'ant_gun_sil') delete A.gunler[v.gun];
    if (is.tur === 'program_kaydet') programYerel(v);
    if (is.tur === 'program_sil') { A.programlar = A.programlar.filter(function (x) { return x.id !== v.id; }); A.antrenmanlar = A.antrenmanlar.filter(function (x) { return x.programId !== v.id; }); }
    if (is.tur === 'hareket_ekle' && !A.hareketlerim.some(function (h) { return h.id === v.id; })) A.hareketlerim.push({ id: v.id, ad: v.ad, tur: v.tur, bolge: v.bolge, ekipman: v.ekipman || [], poz: v.poz, zorlar: v.zorlar || [], uzuv: v.uzuv || [], benim: true, kaynak: 'Benim eklediğim', metin: { not: v.not } });
  }
  /* 1.10: İlerleme ekranı için: o günün planı, satırı, set var mı, hareket bilgisi */
  var ilerleme = {
    plan: function (g) {
      var p = etkinProgram(); if (!p) return null;
      if (p.baslangic && g < String(p.baslangic).slice(0, 10)) return null;
      var id = p.plan[haftaGunu(g)], a = id && antBul(id); return a ? { id: a.id, ad: a.ad } : null;
    },
    gunSatiri: function (g) { return A.gunler[g] || null; },
    setVar: function (g) { return A.kayitlar.some(function (k) { return k.gun === g; }); },
    katalog: katalogGetir,
    hareket: function (h) { var x = hBul(h); return x ? { ad: x.ad, tur: x.tur, bolge: x.bolge } : null; }
  };
  return { ciz: ciz, yukle: yukle, uygula: uygula, ozet: ozet, ilerleme: ilerleme, gunSec: function (g) { A.gun = g || S.bugun; A.sekme = 'bugun'; },
    sekme: function (y) { if (/^(bugun|program|hareket)$/.test(y || '')) A.sekme = y; return A.sekme; } }; // 1.10.3: kaldığın yerden devam
};
