/**
 * Zindem – tablo kodu (sunucu tarafı)
 * Bu dosya telefonda ÇALIŞMAZ. Apps Script'teki Kod.gs onu GitHub'dan okuyup E-Tablolar'da çalıştırır.
 * Kodda kişisel bilgi ve anahtar yoktur.
 */
var SUNUCU_SURUM = '1.10.0';

var SAYFALAR = {
  'Ayarlar': ['Grup', 'Anahtar', 'Değer', 'Açıklama'],
  'Hedefler': ['Başlangıç', 'Tür', 'Değer', 'Not'],
  'Besinlerim': ['ID', 'Ad', 'Kategori', 'Katalog ID', 'Temel', 'kcal', 'Protein', 'Ölçüler', 'Kaynak', 'Not', 'Öğünler'],
  'Öğün Kayıtları': ['ID', 'Gün', 'Saat', 'Öğün', 'Besin ID', 'Ad', 'Miktar', 'Ölçü', 'Gram', 'kcal', 'Protein', 'Kayıt zamanı', 'Malzemeler'],
  // 1.6: kaydedilen tarifler ("Benim tariflerim"). Porsiyon: tarifin kaç porsiyon çıkardığı.
  'Tarifler': ['ID', 'Ad', 'Porsiyon', 'Öğün', 'Güncelleme'],
  'Tarif Malzemeleri': ['Tarif ID', 'Sıra', 'Besin ID', 'Ad', 'Miktar', 'Ölçü', 'Gram'],
  'Günlük': ['Gün', 'Su (ml)', 'Adım', 'Uyku'],
  'Ölçüler': ['Tarih', 'Tür', 'Değer', 'Birim', 'Not'],
  'Ağrı Notları': ['ID', 'Açılış', 'Tür', 'Bölge', 'Taraf', 'Şiddet', 'Hareket', 'Not', 'Durum', 'Kapanış'],
  'Ağrı Takibi': ['Not ID', 'Tarih', 'Şiddet', 'Cevap', 'Not'],
  // 1.9: Antrenman. Plan = haftanın günü (1 Pzt … 7 Paz) → antrenman ID (JSON). Hareketler = antrenmanın hareket listesi (JSON).
  'Programlar': ['ID', 'Ad', 'Etkin', 'Plan', 'Başlangıç', 'Güncelleme'],
  'Antrenmanlar': ['ID', 'Program ID', 'Ad', 'Sıra', 'Hareketler'],
  'Antrenman Kayıtları': ['ID', 'Gün', 'Antrenman ID', 'Hareket ID', 'Ad', 'Set', 'Tekrar', 'Ağırlık', 'Kayıt zamanı'],
  // Durum: tamam · yarım · kaydırıldı · yapılmadı · plan (başka günden kaydırılan ya da elle seçilen antrenman). Kısa: 1 = kısa gün
  'Antrenman Günleri': ['Gün', 'Antrenman ID', 'Ad', 'Durum', 'Kısa', 'Yapılan', 'Hedef', 'Not', 'Kayıt zamanı'],
  'Hareketlerim': ['ID', 'Ad', 'Tür', 'Bölge', 'Ekipman', 'Pozisyon', 'Zorlar', 'Uzuv', 'Not']
};
var METIN_SUTUNLAR = ['Program ID', 'Antrenman ID', 'Hareket ID', 'Plan', 'Hareketler', 'ID', 'Gün', 'Tarih', 'Başlangıç', 'Açılış', 'Kapanış', 'Saat', 'Kayıt zamanı', 'Not ID', 'Besin ID', 'Katalog ID', 'Uyku', 'Tarif ID', 'Güncelleme', 'Malzemeler'];

/* ---------- Tablo yapısı: eksik sayfa ve sütunları tamamlar (her sürümde bir kez) ---------- */
function semaGuncelle_() {
  var pr = PropertiesService.getScriptProperties();
  if (pr.getProperty('SEMA_SURUM') === SUNUCU_SURUM) return;
  var ss = SpreadsheetApp.getActive();
  Object.keys(SAYFALAR).forEach(function (ad) {
    var sh = ss.getSheetByName(ad);
    if (!sh) {
      sh = ss.insertSheet(ad);
      sh.getRange(1, 1, 1, SAYFALAR[ad].length).setValues([SAYFALAR[ad]]);
      sh.setFrozenRows(1);
      return;
    }
    var son = Math.max(sh.getLastColumn(), 1);
    var mevcut = sh.getRange(1, 1, 1, son).getValues()[0].map(String);
    SAYFALAR[ad].forEach(function (b) {
      if (mevcut.indexOf(b) < 0) { mevcut.push(b); sh.getRange(1, mevcut.length).setValue(b); }
    });
  });
  if (!pr.getProperty('GRUP_GOCU')) { grupGocu_(); pr.setProperty('GRUP_GOCU', '1'); }
  ayarGrupDoldur_(); // 1.7: Ayarlar › Grup ve Açıklama sütunları (boş olanlar doldurulur)
  pr.setProperty('SEMA_SURUM', SUNUCU_SURUM);
}

/* ---------- 1.3: Besinlerim › Kategori sütunu yeni besin gruplarına çevrilir (bir kez) ---------- */
var GRUPLAR = ['Kahvaltılık', 'Süt ve yoğurt', 'Ekmek ve tahıl', 'Hamur işleri', 'Et, tavuk, balık', 'Baklagiller', 'Çorbalar',
  'Sebze yemekleri', 'Salatalar', 'Sebzeler', 'Pilav ve makarna', 'Meyve', 'Kuruyemiş ve tohumlar', 'Tatlılar',
  'Paketli atıştırmalık', 'İçecekler', 'Yağ, sos ve diğer'];
function grupBul_(kategori, ad) {
  kategori = String(kategori || ''); var a = String(ad || '').toLocaleLowerCase('tr-TR');
  if (GRUPLAR.indexOf(kategori) >= 0) return kategori;
  var v = function (re) { return re.test(a); };
  if (v(/çorba/)) return 'Çorbalar';
  if (v(/salata/)) return 'Salatalar';
  if (v(/pilav|makarna|erişte|mantı|kuskus/)) return 'Pilav ve makarna';
  if (v(/börek|poğaça|simit|açma|kek|kurabiye|pide|gözleme|çörek/)) return 'Hamur işleri';
  if (v(/bisküvi|gofret|çikolata|cips|browni|kraker|bar\b|kraker/)) return 'Paketli atıştırmalık';
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
  return kategori;
}
function grupGocu_() {
  var sh = sayfa_('Besinlerim'); if (!sh || sh.getLastRow() < 2) return;
  var b = basliklar_('Besinlerim'), ik = b.indexOf('Kategori'), ia = b.indexOf('Ad');
  if (ik < 0 || ia < 0) return;
  var aralik = sh.getRange(2, 1, sh.getLastRow() - 1, b.length), v = aralik.getValues();
  var degisti = false;
  v.forEach(function (r) { var y = grupBul_(r[ik], r[ia]); if (y !== r[ik]) { r[ik] = y; degisti = true; } });
  if (degisti) sh.getRange(2, ik + 1, v.length, 1).setValues(v.map(function (r) { return [r[ik]]; }));
}

/* ---------- 1.7: Ayarlar sayfası grupları (sıfırlama grup grup çalışır) ---------- */
var AYAR_BILGI = {
  ad: ['profil', 'Selamlamada görünen ad'],
  gun_baslangic: ['ogunler', 'Yeni günün başladığı saat (öncesi önceki güne yazılır)'],
  kahvalti: ['ogunler', 'Kahvaltı saatleri'], ogle: ['ogunler', 'Öğle saatleri'], aksam: ['ogunler', 'Akşam saatleri'], cay: ['ogunler', 'Çay saati saatleri'],
  kahvalti_acik: ['ogunler', 'Kahvaltı açık mı (evet/hayır)'], ogle_acik: ['ogunler', 'Öğle açık mı'], aksam_acik: ['ogunler', 'Akşam açık mı'], cay_acik: ['ogunler', 'Çay saati açık mı'],
  hizli_ekle_ml: ['su', 'Su hızlı ekleme miktarları (ml, virgülle; ilki 1 bardak)'], duzeltme_ml: ['su', 'Su düzeltme adımı (ml)'],
  agri_dikkat: ['agri', 'Bu şiddetten itibaren: dikkat'], agri_ara: ['agri', 'Bu şiddetten itibaren: bölgeye ara'], agri_doktor: ['agri', 'Bu şiddetten itibaren: doktora danış'],
  tema: ['gorunum', 'Tema: acik / koyu / telefon'], ipucu_sil: ['ipucu', 'Sola çekip sil ipucu gösterildi'],
  ant_tanisma: ['antrenman', 'Antrenman tanışma soruları cevaplandı'], ant_yer: ['antrenman', 'Nerede: ev / salon / ikisi'],
  ant_ekipman: ['antrenman', 'Ekipman (JSON liste)'], ant_hareket: ['antrenman', 'Hareket durumu: ayakta / destekli / oturarak / sandalye'],
  ant_hassas: ['antrenman', 'Dikkat edilecek bölgeler (JSON)'], ant_uzuv: ['antrenman', 'Uzuv durumu (JSON)'], ant_ozet_hafta: ['antrenman', 'Haftanın özeti en son hangi hafta kapatıldı'],
  boy: ['profil', 'Boy (cm) · vücut kitle indeksi için'],
  olcu_ek: ['ilerleme', 'Takip edilen ek ölçüler (virgülle: boyun, omuz, gogus, pazu, kalca, uyluk, baldir)'],
  il_gizli: ['ilerleme', 'İlerleme\'de gizlenen kartlar (virgülle)'], il_ozet_ay: ['ilerleme', 'Aylık özet kartı en son hangi ay kapatıldı']
};
function ayarGrupDoldur_() {
  var sh = sayfa_('Ayarlar'); if (!sh || sh.getLastRow() < 2) return;
  var b = basliklar_('Ayarlar'), ig = b.indexOf('Grup'), ia = b.indexOf('Anahtar'), ic = b.indexOf('Açıklama');
  if (ig < 0 || ia < 0) return;
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, b.length).getValues(), degisti = false;
  v.forEach(function (r) {
    var bil = AYAR_BILGI[String(r[ia])]; if (!bil) return;
    if (!r[ig]) { r[ig] = bil[0]; degisti = true; }
    if (ic >= 0 && !r[ic]) { r[ic] = bil[1]; degisti = true; }
  });
  if (degisti) sh.getRange(2, 1, v.length, b.length).setValues(v);
}
/* Sıfırlama grupları → sayfalar */
var SIFIR_GRUP = {
  besinlerim: ['Besinlerim'], tarifler: ['Tarifler', 'Tarif Malzemeleri'], kayitlar: ['Öğün Kayıtları', 'Günlük'],
  olculer: ['Ölçüler'], agri: ['Ağrı Notları', 'Ağrı Takibi'], hedefler: ['Hedefler'],
  antrenman: ['Antrenman Günleri', 'Antrenman Kayıtları'], programlar: ['Programlar', 'Antrenmanlar', 'Hareketlerim']
};
function satirSayisi_(ad) { var sh = sayfa_(ad); return sh ? Math.max(0, sh.getLastRow() - 1) : 0; }
function ayarSatirlari_(profil) { // Ayarlar sayfasında satır numaraları: profil = sadece ad satırı, değilse ad dışındakiler
  var sh = sayfa_('Ayarlar'); if (!sh || sh.getLastRow() < 2) return [];
  var ia = basliklar_('Ayarlar').indexOf('Anahtar') + 1;
  var v = sh.getRange(2, ia, sh.getLastRow() - 1, 1).getValues(), l = [];
  v.forEach(function (r, i) { var ad = String(r[0]) === 'ad'; if (String(r[0]) && (profil ? ad : !ad)) l.push(i + 2); });
  return l;
}
function sayilar_() {
  var o = {};
  Object.keys(SIFIR_GRUP).forEach(function (g) { o[g] = satirSayisi_(SIFIR_GRUP[g][0]); });
  o.ayarlar = ayarSatirlari_(false).length;
  return o;
}
function yedekler_() { // Drive'daki yedek klasöründeki son 5 kopya (en yeni önce)
  try {
    if (typeof DriveApp === 'undefined') return [];
    var it = DriveApp.getFoldersByName(typeof YEDEK_KLASORU !== 'undefined' ? YEDEK_KLASORU : 'Zindem Yedekleri');
    if (!it.hasNext()) return [];
    var f = it.next().getFiles(), l = [], tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    while (f.hasNext()) { var x = f.next(); if (!x.isTrashed()) l.push(x.getDateCreated()); }
    l.sort(function (a, b) { return b - a; });
    return l.slice(0, 5).map(function (d) { return Utilities.formatDate(d, tz, 'yyyy-MM-dd HH:mm'); });
  } catch (x) { return []; }
}
function yedekAl_() {
  if (typeof yedekle !== 'function') throw new Error('Yedek alınamadı: Kod.gs içinde yedekle bulunamadı.');
  yedekle();
}

/* ---------- Yardımcılar ---------- */
function sayfa_(ad) { return SpreadsheetApp.getActive().getSheetByName(ad); }
var BASLIK_ONBELLEK_ = {};
function basliklar_(ad) {
  if (BASLIK_ONBELLEK_[ad]) return BASLIK_ONBELLEK_[ad];
  var sh = sayfa_(ad);
  var b = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
  BASLIK_ONBELLEK_[ad] = b;
  return b;
}
function hucre_(v) {
  if (v instanceof Date) {
    // 1.9.1: saat, betiğin değil tablonun saat dilimine göre okunur (elle yapıştırılan tarihler "… 00:00" olmasın)
    var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    var saatli = Utilities.formatDate(v, tz, 'HH:mm') !== '00:00';
    return Utilities.formatDate(v, tz, saatli ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd');
  }
  return v;
}
function oku_(ad) {
  var sh = sayfa_(ad);
  var veri = sh.getDataRange().getValues();
  var baslik = veri.shift().map(String);
  return veri.filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    var o = {};
    baslik.forEach(function (b, i) { if (b) o[b] = hucre_(r[i]); });
    return o;
  });
}
function deger_(v) {
  if (v === '' || v === null || v === undefined) return '';
  return typeof v === 'number' ? v : String(v);
}
function satirEkle_(ad, nesne) {
  var sh = sayfa_(ad);
  var baslik = basliklar_(ad);
  var r = sh.getLastRow() + 1;
  baslik.forEach(function (b, i) { if (METIN_SUTUNLAR.indexOf(b) >= 0) sh.getRange(r, i + 1).setNumberFormat('@'); }); // tarihler metin kalsın
  sh.getRange(r, 1, 1, baslik.length).setValues([baslik.map(function (b) { return deger_(nesne[b]); })]);
}
function satirBul_(ad, sutun, deger) {
  var sh = sayfa_(ad);
  var i = basliklar_(ad).indexOf(sutun);
  if (i < 0 || sh.getLastRow() < 2) return 0;
  var degerler = sh.getRange(1, i + 1, sh.getLastRow(), 1).getValues();
  for (var r = degerler.length - 1; r >= 1; r--) {
    if (String(hucre_(degerler[r][0])) === String(deger)) return r + 1;
  }
  return 0;
}
function hucreYaz_(ad, satir, sutun, deger) {
  var c = sayfa_(ad).getRange(satir, basliklar_(ad).indexOf(sutun) + 1);
  if (METIN_SUTUNLAR.indexOf(sutun) >= 0) c.setNumberFormat('@');
  c.setValue(deger_(deger));
}

function hedefSatiri_(bas, tur) {
  var sh = sayfa_('Hedefler'); if (!sh || sh.getLastRow() < 2) return 0;
  var b = basliklar_('Hedefler'), ib = b.indexOf('Başlangıç'), it = b.indexOf('Tür');
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, b.length).getValues();
  for (var i = v.length - 1; i >= 0; i--) if (String(hucre_(v[i][ib])) === String(bas) && String(v[i][it]) === String(tur)) return i + 2;
  return 0;
}
function olcumSatiri_(tarih, tur) {
  var sh = sayfa_('Ölçüler'); if (!sh || sh.getLastRow() < 2) return 0;
  var b = basliklar_('Ölçüler'), it = b.indexOf('Tarih'), iu = b.indexOf('Tür');
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, b.length).getValues();
  for (var i = v.length - 1; i >= 0; i--) if (String(hucre_(v[i][it])).slice(0, 10) === String(tarih) && String(v[i][iu]) === String(tur)) return i + 2;
  return 0;
}
function tarifMalzemeSil_(id) {
  var sh = sayfa_('Tarif Malzemeleri'); if (!sh || sh.getLastRow() < 2) return;
  var col = basliklar_('Tarif Malzemeleri').indexOf('Tarif ID') + 1;
  var v = sh.getRange(2, col, sh.getLastRow() - 1, 1).getValues();
  for (var i = v.length - 1; i >= 0; i--) if (String(v[i][0]) === String(id)) sh.deleteRow(i + 2);
}

/* ---------- Okuma ----------
 * p.gun: ekranda açılacak gün · p.bas / p.bitis: bu aralıktaki bütün günler tek seferde gelir (1.3.1)
 * p.sade = '1': sadece gün verileri (eski bir aya geçerken) */
function sunucuOku(p) {
  semaGuncelle_();
  if (p.ilerleme === '1') return ilerlemeOku_(); // 1.10: İlerleme ekranı
  if (p.bilgi === '1') { var y = yedekler_(); return { ok: true, surum: SUNUCU_SURUM, sayilar: sayilar_(), yedekler: y, sonYedek: y[0] || '' }; } // 1.7: Ayarlar › Veri
  var gun = p.gun || '', bas = p.bas || gun, bitis = p.bitis || gun;
  if (bas > bitis) { var t = bas; bas = bitis; bitis = t; }
  var ogunler = oku_('Öğün Kayıtları');
  var gunluk = oku_('Günlük');

  // Aralıktaki günlerin kayıtları
  var gunVeri = {};
  function gv(g) { return gunVeri[g] || (gunVeri[g] = { kayitlar: [], gunluk: null }); }
  ogunler.forEach(function (o) { var g = String(o['Gün']); if (g >= bas && g <= bitis) gv(g).kayitlar.push(o); });
  gunluk.forEach(function (x) { var g = String(x['Gün']); if (g >= bas && g <= bitis) gv(g).gunluk = x; });
  var oncekiBas = oncekiOgun_(ogunler, bas);
  if (p.sade === '1') return { ok: true, surum: SUNUCU_SURUM, bas: bas, bitis: bitis, gunVeri: gunVeri, oncekiBas: oncekiBas };

  // Son yenenler (en yeni 40 farklı besin)
  var son = [], gorulen = {};
  for (var i = ogunler.length - 1; i >= 0 && son.length < 40; i--) {
    var o = ogunler[i];
    if (!o['Besin ID'] || gorulen[o['Besin ID']]) continue;
    gorulen[o['Besin ID']] = 1;
    son.push({ besinId: o['Besin ID'], ad: o['Ad'], olcu: o['Ölçü'], miktar: o['Miktar'], ogun: o['Öğün'] });
  }
  // Öğün başına seçilme sayıları (son 90 gün)
  var sinir = gunEkle_(bitis || bugun_(), -90), sayim = {};
  ogunler.forEach(function (o) {
    if (!o['Besin ID'] || String(o['Gün']) < sinir) return;
    var k = o['Öğün'] + '|' + o['Besin ID'];
    sayim[k] = (sayim[k] || 0) + 1;
  });
  // Kayıt girilmiş günler (takvimdeki noktalar)
  var gunSet = {};
  ogunler.forEach(function (o) { if (o['Gün']) gunSet[o['Gün']] = 1; });
  gunluk.forEach(function (g) { if (g['Gün'] && (g['Su (ml)'] || g['Adım'] || g['Uyku'])) gunSet[g['Gün']] = 1; });
  var sonTakip = {};
  oku_('Ağrı Takibi').forEach(function (t) { sonTakip[t['Not ID']] = t; }); // en son satır kalır
  var agri = oku_('Ağrı Notları').filter(function (a) { return a['Durum'] !== 'geçti'; }).map(function (a) {
    var t = sonTakip[a['ID']];
    if (t) { a['Son şiddet'] = t['Şiddet']; a['Son tarih'] = t['Tarih']; a['Son cevap'] = t['Cevap']; }
    return a;
  });
  return {
    ok: true,
    surum: SUNUCU_SURUM,
    ayarlar: oku_('Ayarlar'),
    tarifler: tarifleriOku_(),
    hedefler: oku_('Hedefler'),
    besinlerim: oku_('Besinlerim'),
    bugun: ogunler.filter(function (o) { return o['Gün'] === gun; }),
    gunluk: gunluk.filter(function (x) { return x['Gün'] === gun; })[0] || null,
    agri: agri,
    sonYenenler: son,
    sikYenenler: sayim,
    gunler: Object.keys(gunSet).sort(),
    oncekiOgun: oncekiOgun_(ogunler, gun),
    bas: bas, bitis: bitis, gunVeri: gunVeri, oncekiBas: oncekiBas,
    antrenman: antrenmanOku_(bitis || gun)
  };
}
/* 1.10: İlerleme. Bütün geçmiş, ama satırlar değil gün başına toplamlar (az veri gider):
 * g: { gün: [kcal, protein, su ml, adım, uyku] } · o: ölçümler [tarih, tür, değer] ·
 * a: antrenman günleri [gün, antrenman ID, ad, durum, kısa, yapılan, hedef] · k: setler [gün, antrenman ID, hareket ID, ad, set, tekrar] ·
 * n: ağrı notları (geçenler dahil) + takip */
function ilerlemeOku_() {
  semaGuncelle_();
  var g = {};
  function gun(x) { return g[x] || (g[x] = [0, 0, 0, '', '']); }
  oku_('Öğün Kayıtları').forEach(function (o) { var d = String(o['Gün']).slice(0, 10); if (!d) return; var r = gun(d); r[0] += +o['kcal'] || 0; r[1] += +o['Protein'] || 0; });
  oku_('Günlük').forEach(function (x) { var d = String(x['Gün']).slice(0, 10); if (!d) return; var r = gun(d); r[2] = +x['Su (ml)'] || 0; r[3] = x['Adım'] === '' ? '' : +x['Adım']; r[4] = x['Uyku'] || ''; });
  Object.keys(g).forEach(function (d) { g[d][0] = Math.round(g[d][0]); g[d][1] = Math.round(g[d][1] * 10) / 10; });
  var takip = {};
  oku_('Ağrı Takibi').forEach(function (t) { (takip[t['Not ID']] = takip[t['Not ID']] || []).push([String(t['Tarih']).slice(0, 10), +t['Şiddet'] || 0, t['Cevap'] || '']); });
  return {
    ok: true, surum: SUNUCU_SURUM, g: g,
    o: oku_('Ölçüler').map(function (x) { return [String(x['Tarih']).slice(0, 10), String(x['Tür']), +x['Değer']]; }).filter(function (x) { return x[0] && x[2]; }),
    a: oku_('Antrenman Günleri').map(function (x) { return [String(x['Gün']).slice(0, 10), String(x['Antrenman ID']), x['Ad'], x['Durum'], String(x['Kısa']) === '1' ? 1 : 0, +x['Yapılan'] || 0, +x['Hedef'] || 0]; }),
    k: oku_('Antrenman Kayıtları').map(function (x) { return [String(x['Gün']).slice(0, 10), String(x['Antrenman ID']), String(x['Hareket ID']), x['Ad'], +x['Set'] || 1, +x['Tekrar'] || 0]; }),
    n: oku_('Ağrı Notları').map(function (x) { return { id: x['ID'], acilis: String(x['Açılış']).slice(0, 10), tur: x['Tür'], bolge: x['Bölge'], taraf: x['Taraf'], siddet: +x['Şiddet'] || 0, durum: x['Durum'], kapanis: String(x['Kapanış'] || '').slice(0, 10), takip: takip[x['ID']] || [] }; })
  };
}
/* 1.9: Programlar ve son 120 günün antrenman günleri + kayıtları */
function antrenmanOku_(gun) {
  var sinir = gunEkle_(gun || bugun_(), -120);
  return {
    programlar: oku_('Programlar'), antrenmanlar: oku_('Antrenmanlar'), hareketlerim: oku_('Hareketlerim'),
    gunler: oku_('Antrenman Günleri').filter(function (x) { return String(x['Gün']) >= sinir; }),
    kayitlar: oku_('Antrenman Kayıtları').filter(function (x) { return String(x['Gün']) >= sinir; })
  };
}
function satirlariSil_(ad, sutun, deger) {
  var sh = sayfa_(ad); if (!sh || sh.getLastRow() < 2) return;
  var col = basliklar_(ad).indexOf(sutun) + 1;
  var v = sh.getRange(2, col, sh.getLastRow() - 1, 1).getValues();
  for (var i = v.length - 1; i >= 0; i--) if (String(hucre_(v[i][0])) === String(deger)) sh.deleteRow(i + 2);
}
function zaman_() { return Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm'); }
/* Her öğün için, verilen günden önceki son kayıtlı gün ("Dünkü kahvaltıyı ekle") */
function tarifleriOku_() {
  var malz = {};
  oku_('Tarif Malzemeleri').forEach(function (m) {
    var id = String(m['Tarif ID']); (malz[id] = malz[id] || []).push(m);
  });
  return oku_('Tarifler').map(function (t) {
    var l = (malz[String(t['ID'])] || []).sort(function (a, b) { return (+a['Sıra'] || 0) - (+b['Sıra'] || 0); });
    return { id: t['ID'], ad: t['Ad'], porsiyon: t['Porsiyon'], ogun: t['Öğün'],
      malzemeler: l.map(function (m) { return { id: m['Besin ID'], ad: m['Ad'], miktar: m['Miktar'], olcu: m['Ölçü'] }; }) };
  });
}
function oncekiOgun_(ogunler, gun) {
  var onceki = {};
  for (var j = ogunler.length - 1; j >= 0; j--) {
    var x = ogunler[j], ad = x['Öğün'], g = String(x['Gün']);
    if (!ad || !g || g >= gun || !x['Besin ID']) continue;
    if (onceki[ad] && onceki[ad].gun > g) continue;
    if (!onceki[ad] || onceki[ad].gun < g) onceki[ad] = { gun: g, kayitlar: [] };
    onceki[ad].kayitlar.unshift({ besinId: x['Besin ID'], ad: x['Ad'], miktar: x['Miktar'], olcu: x['Ölçü'], kcal: x['kcal'], p: x['Protein'], gram: x['Gram'], malzemeler: x['Malzemeler'] || '' });
  }
  return onceki;
}
function bugun_() { return Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd'); }
function gunEkle_(gun, n) {
  var p = String(gun).split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

/* ---------- Yazma ---------- */
function sunucuYaz(islemler) {
  semaGuncelle_();
  var sonuc = [];
  islemler.forEach(function (is) {
    try { islemYap_(is); sonuc.push({ id: is.islemId, ok: true }); }
    catch (x) { sonuc.push({ id: is.islemId, ok: false, hata: String((x && x.message) || x) }); }
  });
  return { ok: true, sonuc: sonuc };
}
function islemYap_(is) {
  var v = is.veri || {};
  switch (is.tur) {
    case 'ogun_ekle':
      if (satirBul_('Öğün Kayıtları', 'ID', v.id)) return; // aynı kayıt iki kez gelmesin
      satirEkle_('Öğün Kayıtları', {
        'ID': v.id, 'Gün': v.gun, 'Saat': v.saat, 'Öğün': v.ogun, 'Besin ID': v.besinId, 'Ad': v.ad,
        'Miktar': v.miktar, 'Ölçü': v.olcu, 'Gram': v.gram, 'kcal': v.kcal, 'Protein': v.p,
        'Kayıt zamanı': Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm'),
        'Malzemeler': v.malzemeler || ''
      });
      return;
    case 'ogun_guncelle':
      var r = satirBul_('Öğün Kayıtları', 'ID', v.id);
      if (!r) return;
      ['Miktar', 'Gram', 'kcal', 'Protein'].forEach(function (s, i) {
        hucreYaz_('Öğün Kayıtları', r, s, [v.miktar, v.gram, v.kcal, v.p][i]);
      });
      // 1.6: tarif penceresinden düzeltilen kayıt
      if (v.malzemeler !== undefined) hucreYaz_('Öğün Kayıtları', r, 'Malzemeler', v.malzemeler);
      if (v.besinId) { hucreYaz_('Öğün Kayıtları', r, 'Besin ID', v.besinId); hucreYaz_('Öğün Kayıtları', r, 'Ad', v.ad); }
      // 1.6.2: Kaydı düzenle: ölçü ve öğün değişebilir
      if (v.olcu) hucreYaz_('Öğün Kayıtları', r, 'Ölçü', v.olcu);
      if (v.ogun) hucreYaz_('Öğün Kayıtları', r, 'Öğün', v.ogun);
      return;
    case 'ogun_sil':
      var rs = satirBul_('Öğün Kayıtları', 'ID', v.id);
      if (rs) sayfa_('Öğün Kayıtları').deleteRow(rs);
      return;
    case 'gunluk':
      var alan = { su: 'Su (ml)', adim: 'Adım', uyku: 'Uyku' }[v.alan];
      if (!alan) throw new Error('bilinmeyen alan');
      var rg = satirBul_('Günlük', 'Gün', v.gun);
      if (!rg) { satirEkle_('Günlük', { 'Gün': v.gun }); rg = sayfa_('Günlük').getLastRow(); }
      hucreYaz_('Günlük', rg, alan, v.deger);
      return;
    case 'besin_ekle':
      if (satirBul_('Besinlerim', 'ID', v.id)) return;
      satirEkle_('Besinlerim', {
        'ID': v.id, 'Ad': v.ad, 'Kategori': v.kategori, 'Katalog ID': v.katalogId || '', 'Temel': v.temel,
        'kcal': v.kcal, 'Protein': v.p, 'Ölçüler': v.olculer || '', 'Kaynak': v.kaynak || 'Elle eklendi', 'Not': v.not || '', 'Öğünler': v.ogunler || ''
      });
      return;
    case 'tarif_kaydet': // varsa günceller: malzeme satırları silinip yeniden yazılır
      var zaman = Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm');
      var rt = satirBul_('Tarifler', 'ID', v.id);
      if (rt) { hucreYaz_('Tarifler', rt, 'Ad', v.ad); hucreYaz_('Tarifler', rt, 'Porsiyon', v.porsiyon); hucreYaz_('Tarifler', rt, 'Öğün', v.ogun); hucreYaz_('Tarifler', rt, 'Güncelleme', zaman); }
      else satirEkle_('Tarifler', { 'ID': v.id, 'Ad': v.ad, 'Porsiyon': v.porsiyon, 'Öğün': v.ogun, 'Güncelleme': zaman });
      tarifMalzemeSil_(v.id);
      (v.malzemeler || []).forEach(function (m, i) {
        satirEkle_('Tarif Malzemeleri', { 'Tarif ID': v.id, 'Sıra': i + 1, 'Besin ID': m.id, 'Ad': m.ad, 'Miktar': m.miktar, 'Ölçü': m.olcu, 'Gram': m.gram });
      });
      return;
    case 'tarif_sil':
      var rts = satirBul_('Tarifler', 'ID', v.id);
      if (rts) sayfa_('Tarifler').deleteRow(rts);
      tarifMalzemeSil_(v.id);
      return;
    case 'agri_ekle':
      if (satirBul_('Ağrı Notları', 'ID', v.id)) return;
      satirEkle_('Ağrı Notları', {
        'ID': v.id, 'Açılış': v.acilis, 'Tür': v.tur, 'Bölge': v.bolge, 'Taraf': v.taraf, 'Şiddet': v.siddet,
        'Hareket': v.hareket || '', 'Not': v.not || '', 'Durum': 'açık', 'Kapanış': ''
      });
      return;
    case 'agri_takip':
      satirEkle_('Ağrı Takibi', { 'Not ID': v.notId, 'Tarih': v.tarih, 'Şiddet': v.siddet, 'Cevap': v.cevap || '', 'Not': v.not || '' });
      if (v.cevap === 'geçti') {
        var ra = satirBul_('Ağrı Notları', 'ID', v.notId);
        if (ra) { hucreYaz_('Ağrı Notları', ra, 'Durum', 'geçti'); hucreYaz_('Ağrı Notları', ra, 'Kapanış', v.tarih); }
      }
      return;
    case 'ayar_yaz': // 1.7: varsa değeri değişir, yoksa eklenir
      var ra2 = satirBul_('Ayarlar', 'Anahtar', v.anahtar), bil = AYAR_BILGI[v.anahtar] || [v.grup || '', ''];
      if (ra2) { hucreYaz_('Ayarlar', ra2, 'Değer', v.deger); if (bil[0]) hucreYaz_('Ayarlar', ra2, 'Grup', bil[0]); }
      else satirEkle_('Ayarlar', { 'Grup': bil[0], 'Anahtar': v.anahtar, 'Değer': v.deger, 'Açıklama': bil[1] });
      return;
    case 'hedef_ekle': // aynı gün ve türde hedef varsa değeri değişir
      var rh = hedefSatiri_(v.baslangic, v.tur);
      if (rh) hucreYaz_('Hedefler', rh, 'Değer', v.deger);
      else satirEkle_('Hedefler', { 'Başlangıç': v.baslangic, 'Tür': v.tur, 'Değer': v.deger, 'Not': '' });
      return;
    case 'hedef_sil':
      var rhs = hedefSatiri_(v.baslangic, v.tur);
      if (rhs) sayfa_('Hedefler').deleteRow(rhs);
      return;
    case 'olcum_yaz': // 1.10: günde her türden tek ölçüm; varsa değeri değişir
      var ro = olcumSatiri_(v.tarih, v.tur);
      if (ro) hucreYaz_('Ölçüler', ro, 'Değer', v.deger);
      else satirEkle_('Ölçüler', { 'Tarih': v.tarih, 'Tür': v.tur, 'Değer': v.deger, 'Birim': v.birim || '', 'Not': '' });
      return;
    case 'olcum_sil':
      var ros = olcumSatiri_(v.tarih, v.tur);
      if (ros) sayfa_('Ölçüler').deleteRow(ros);
      return;
    case 'yedekle':
      yedekAl_();
      return;
    case 'sifirla': // önce Drive'a yedek; sonra seçilen gruplar silinir
      yedekAl_();
      (v.gruplar || []).forEach(function (g) {
        if (g === 'ayarlar' || g === 'profil') {
          var l = ayarSatirlari_(g === 'profil');
          for (var i = l.length - 1; i >= 0; i--) sayfa_('Ayarlar').deleteRow(l[i]);
          return;
        }
        (SIFIR_GRUP[g] || []).forEach(function (ad) { var sh = sayfa_(ad); if (sh && sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1); });
      });
      return;
    /* ---------- 1.9: Antrenman ---------- */
    case 'program_kaydet': // program + antrenmanları birlikte; antrenman satırları silinip yeniden yazılır
      var pg = v.program || {}, rp = satirBul_('Programlar', 'ID', pg.id), plan = JSON.stringify(pg.plan || {});
      if (pg.etkin) { // tek etkin program
        var shp = sayfa_('Programlar'), ie = basliklar_('Programlar').indexOf('Etkin') + 1;
        if (shp.getLastRow() > 1) shp.getRange(2, ie, shp.getLastRow() - 1, 1).setValue(0);
      }
      if (rp) { hucreYaz_('Programlar', rp, 'Ad', pg.ad); hucreYaz_('Programlar', rp, 'Plan', plan); hucreYaz_('Programlar', rp, 'Etkin', pg.etkin ? 1 : 0); hucreYaz_('Programlar', rp, 'Güncelleme', zaman_()); }
      else satirEkle_('Programlar', { 'ID': pg.id, 'Ad': pg.ad, 'Etkin': pg.etkin ? 1 : 0, 'Plan': plan, 'Başlangıç': pg.baslangic || bugun_(), 'Güncelleme': zaman_() });
      satirlariSil_('Antrenmanlar', 'Program ID', pg.id);
      (v.antrenmanlar || []).forEach(function (a, i) {
        satirEkle_('Antrenmanlar', { 'ID': a.id, 'Program ID': pg.id, 'Ad': a.ad, 'Sıra': i + 1, 'Hareketler': JSON.stringify(a.hareketler || []) });
      });
      return;
    case 'program_sil':
      var rps = satirBul_('Programlar', 'ID', v.id);
      if (rps) sayfa_('Programlar').deleteRow(rps);
      satirlariSil_('Antrenmanlar', 'Program ID', v.id);
      return;
    case 'set_kaydet': // varsa tekrar/ağırlık değişir
      var rs2 = satirBul_('Antrenman Kayıtları', 'ID', v.id);
      if (rs2) { hucreYaz_('Antrenman Kayıtları', rs2, 'Tekrar', v.tekrar); hucreYaz_('Antrenman Kayıtları', rs2, 'Ağırlık', v.agirlik || ''); return; }
      satirEkle_('Antrenman Kayıtları', { 'ID': v.id, 'Gün': v.gun, 'Antrenman ID': v.antId, 'Hareket ID': v.hareketId, 'Ad': v.ad,
        'Set': v.set, 'Tekrar': v.tekrar, 'Ağırlık': v.agirlik || '', 'Kayıt zamanı': zaman_() });
      return;
    case 'set_sil':
      var rss = satirBul_('Antrenman Kayıtları', 'ID', v.id);
      if (rss) sayfa_('Antrenman Kayıtları').deleteRow(rss);
      return;
    case 'ant_gun': // günde tek satır: varsa güncellenir
      var rg2 = satirBul_('Antrenman Günleri', 'Gün', v.gun), o2 = { 'Gün': v.gun, 'Antrenman ID': v.antId || '', 'Ad': v.ad || '', 'Durum': v.durum || '',
        'Kısa': v.kisa ? 1 : 0, 'Yapılan': v.yapilan || 0, 'Hedef': v.hedef || 0, 'Not': v.not || '', 'Kayıt zamanı': zaman_() };
      if (rg2) Object.keys(o2).forEach(function (k) { hucreYaz_('Antrenman Günleri', rg2, k, o2[k]); });
      else satirEkle_('Antrenman Günleri', o2);
      return;
    case 'ant_gun_sil':
      var rgs = satirBul_('Antrenman Günleri', 'Gün', v.gun);
      if (rgs) sayfa_('Antrenman Günleri').deleteRow(rgs);
      return;
    case 'hareket_ekle': // Hareketlerim: varsa güncellenir
      var rh2 = satirBul_('Hareketlerim', 'ID', v.id), o3 = { 'ID': v.id, 'Ad': v.ad, 'Tür': v.tur, 'Bölge': v.bolge, 'Ekipman': (v.ekipman || []).join(', '),
        'Pozisyon': v.poz || '', 'Zorlar': (v.zorlar || []).join(', '), 'Uzuv': (v.uzuv || []).join(' '), 'Not': v.not || '' };
      if (rh2) Object.keys(o3).forEach(function (k) { hucreYaz_('Hareketlerim', rh2, k, o3[k]); });
      else satirEkle_('Hareketlerim', o3);
      return;
    default:
      throw new Error('bilinmeyen işlem: ' + is.tur);
  }
}
