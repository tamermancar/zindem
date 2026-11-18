/**
 * Zindem – veri arka ucu (Google Apps Script)
 * Bu dosya E-Tablolar dosyasına bağlıdır: Uzantılar › Apps Script.
 * Kodda kişisel bilgi ve anahtar YOKTUR. Gizli anahtar "Komut dosyası özellikleri"nde (ANAHTAR) durur.
 */

var SAYFALAR = {
  'Ayarlar': ['Grup', 'Anahtar', 'Değer', 'Açıklama'],
  'Hedefler': ['Başlangıç', 'Tür', 'Değer', 'Not'],
  'Besinlerim': ['ID', 'Ad', 'Kategori', 'Katalog ID', 'Temel', 'kcal', 'Protein', 'Ölçüler', 'Kaynak', 'Not'],
  'Öğün Kayıtları': ['ID', 'Gün', 'Saat', 'Öğün', 'Besin ID', 'Ad', 'Miktar', 'Ölçü', 'Gram', 'kcal', 'Protein', 'Kayıt zamanı'],
  'Günlük': ['Gün', 'Su (ml)', 'Adım', 'Uyku'],
  'Ölçüler': ['Tarih', 'Tür', 'Değer', 'Birim', 'Not'],
  'Ağrı Notları': ['ID', 'Açılış', 'Tür', 'Bölge', 'Taraf', 'Şiddet', 'Hareket', 'Not', 'Durum', 'Kapanış'],
  'Ağrı Takibi': ['Not ID', 'Tarih', 'Şiddet', 'Cevap', 'Not']
};
var YEDEK_KLASORU = 'Zindem Yedekleri';
var YEDEK_AY = 6;

/* ---------- Kurulum: bir kez, düzenleyiciden çalıştırılır ---------- */
function kurulum() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(SAYFALAR).forEach(function (ad) {
    var sh = ss.getSheetByName(ad);
    if (!sh) {
      sh = ss.insertSheet(ad);
      sh.getRange(1, 1, 1, SAYFALAR[ad].length).setValues([SAYFALAR[ad]]);
      sh.setFrozenRows(1);
    }
  });
  var ozellik = PropertiesService.getScriptProperties();
  if (!ozellik.getProperty('ANAHTAR')) {
    ozellik.setProperty('ANAHTAR', Utilities.getUuid().replace(/-/g, ''));
  }
  var tetikVar = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'yedekle'; });
  if (!tetikVar) ScriptApp.newTrigger('yedekle').timeBased().onMonthDay(1).atHour(3).create();
  Logger.log('Kurulum tamam. Gizli anahtarın: ' + ozellik.getProperty('ANAHTAR'));
  Logger.log('Bu anahtarı kimseyle paylaşma; sadece ana ekran kısayolunun adresine yazacağız.');
}

/* ---------- Aylık yedek: 6 aydan eskileri siler ---------- */
function yedekle() {
  var dosya = DriveApp.getFileById(SpreadsheetApp.getActive().getId());
  var it = DriveApp.getFoldersByName(YEDEK_KLASORU);
  var klasor = it.hasNext() ? it.next() : DriveApp.createFolder(YEDEK_KLASORU);
  var tarih = Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  dosya.makeCopy(dosya.getName() + ' – yedek ' + tarih, klasor);
  var sinir = new Date(); sinir.setMonth(sinir.getMonth() - YEDEK_AY);
  var dosyalar = klasor.getFiles();
  while (dosyalar.hasNext()) {
    var f = dosyalar.next();
    if (f.getDateCreated() < sinir) f.setTrashed(true);
  }
}

/* ---------- Yardımcılar ---------- */
function cevap_(nesne) {
  return ContentService.createTextOutput(JSON.stringify(nesne)).setMimeType(ContentService.MimeType.JSON);
}
function anahtarDogru_(k) {
  var a = PropertiesService.getScriptProperties().getProperty('ANAHTAR');
  return !!a && k === a;
}
function sayfa_(ad) { return SpreadsheetApp.getActive().getSheetByName(ad); }
function hucre_(v) {
  if (v instanceof Date) {
    var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    var saatli = v.getHours() || v.getMinutes();
    return Utilities.formatDate(v, tz, saatli ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd');
  }
  return v;
}
function oku_(ad) {
  var sh = sayfa_(ad);
  var veri = sh.getDataRange().getValues();
  var baslik = veri.shift();
  return veri.filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    var o = {};
    baslik.forEach(function (b, i) { o[b] = hucre_(r[i]); });
    return o;
  });
}
var METIN_SUTUNLAR = ['ID', 'Gün', 'Tarih', 'Başlangıç', 'Açılış', 'Kapanış', 'Saat', 'Kayıt zamanı', 'Not ID', 'Besin ID', 'Katalog ID', 'Uyku'];
function deger_(v) {
  if (v === '' || v === null || v === undefined) return '';
  return typeof v === 'number' ? v : String(v);
}
function satirEkle_(ad, nesne) {
  var sh = sayfa_(ad);
  var baslik = SAYFALAR[ad];
  var r = sh.getLastRow() + 1;
  baslik.forEach(function (b, i) { if (METIN_SUTUNLAR.indexOf(b) >= 0) sh.getRange(r, i + 1).setNumberFormat('@'); }); // tarihler metin kalsın
  sh.getRange(r, 1, 1, baslik.length).setValues([baslik.map(function (b) { return deger_(nesne[b]); })]);
}
function satirBul_(ad, sutun, deger) {
  var sh = sayfa_(ad);
  var baslik = SAYFALAR[ad];
  var i = baslik.indexOf(sutun);
  var degerler = sh.getRange(1, i + 1, sh.getLastRow(), 1).getValues();
  for (var r = degerler.length - 1; r >= 1; r--) {
    if (String(hucre_(degerler[r][0])) === String(deger)) return r + 1;
  }
  return 0;
}
function hucreYaz_(ad, satir, sutun, deger) {
  var c = sayfa_(ad).getRange(satir, SAYFALAR[ad].indexOf(sutun) + 1);
  if (METIN_SUTUNLAR.indexOf(sutun) >= 0) c.setNumberFormat('@');
  c.setValue(deger_(deger));
}

/* ---------- Okuma: GET ?k=ANAHTAR&gun=YYYY-MM-DD ---------- */
function doGet(e) {
  var p = e.parameter || {};
  if (!anahtarDogru_(p.k)) return cevap_({ ok: false, hata: 'yetkisiz' });
  var gun = p.gun || '';
  var ogunler = oku_('Öğün Kayıtları');
  var son = []; var gorulen = {};
  for (var i = ogunler.length - 1; i >= 0 && son.length < 40; i--) {
    var o = ogunler[i];
    var anahtar = o['Besin ID'] || ('ad:' + o['Ad']);
    if (!o['Besin ID'] || gorulen[anahtar]) continue;
    gorulen[anahtar] = 1;
    son.push({ besinId: o['Besin ID'], ad: o['Ad'], olcu: o['Ölçü'], miktar: o['Miktar'], ogun: o['Öğün'] });
  }
  var sayim = {};
  ogunler.forEach(function (o) {
    if (!o['Besin ID']) return;
    var k = o['Öğün'] + '|' + o['Besin ID'];
    sayim[k] = (sayim[k] || 0) + 1;
  });
  var sonTakip = {};
  oku_('Ağrı Takibi').forEach(function (t) { sonTakip[t['Not ID']] = t; }); // en son satır kalır
  var agri = oku_('Ağrı Notları').filter(function (a) { return a['Durum'] !== 'geçti'; }).map(function (a) {
    var t = sonTakip[a['ID']];
    if (t) { a['Son şiddet'] = t['Şiddet']; a['Son tarih'] = t['Tarih']; a['Son cevap'] = t['Cevap']; }
    return a;
  });
  return cevap_({
    ok: true,
    ayarlar: oku_('Ayarlar'),
    hedefler: oku_('Hedefler'),
    besinlerim: oku_('Besinlerim'),
    bugun: ogunler.filter(function (o) { return o['Gün'] === gun; }),
    gunluk: oku_('Günlük').filter(function (g) { return g['Gün'] === gun; })[0] || null,
    agri: agri,
    sonYenenler: son,
    sikYenenler: sayim
  });
}

/* ---------- Yazma: POST {k, islemler:[{tur, ...}]} ---------- */
function doPost(e) {
  var istek;
  try { istek = JSON.parse(e.postData.contents); } catch (x) { return cevap_({ ok: false, hata: 'bozuk istek' }); }
  if (!anahtarDogru_(istek.k)) return cevap_({ ok: false, hata: 'yetkisiz' });
  var kilit = LockService.getScriptLock();
  kilit.waitLock(20000);
  var sonuc = [];
  try {
    (istek.islemler || []).forEach(function (is) {
      try { islemYap_(is); sonuc.push({ id: is.islemId, ok: true }); }
      catch (x) { sonuc.push({ id: is.islemId, ok: false, hata: String(x) }); }
    });
  } finally { kilit.releaseLock(); }
  return cevap_({ ok: true, sonuc: sonuc });
}

function islemYap_(is) {
  var v = is.veri || {};
  switch (is.tur) {
    case 'ogun_ekle':
      if (satirBul_('Öğün Kayıtları', 'ID', v.id)) return; // aynı kayıt iki kez gelmesin
      satirEkle_('Öğün Kayıtları', {
        'ID': v.id, 'Gün': v.gun, 'Saat': v.saat, 'Öğün': v.ogun, 'Besin ID': v.besinId, 'Ad': v.ad,
        'Miktar': v.miktar, 'Ölçü': v.olcu, 'Gram': v.gram, 'kcal': v.kcal, 'Protein': v.p,
        'Kayıt zamanı': Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm')
      });
      return;
    case 'ogun_guncelle':
      var r = satirBul_('Öğün Kayıtları', 'ID', v.id);
      if (!r) return;
      ['Miktar', 'Gram', 'kcal', 'Protein'].forEach(function (s, i) {
        hucreYaz_('Öğün Kayıtları', r, s, [v.miktar, v.gram, v.kcal, v.p][i]);
      });
      return;
    case 'ogun_sil':
      var rs = satirBul_('Öğün Kayıtları', 'ID', v.id);
      if (rs) sayfa_('Öğün Kayıtları').deleteRow(rs);
      return;
    case 'gunluk':
      var alan = { su: 'Su (ml)', adim: 'Adım', uyku: 'Uyku' }[v.alan];
      if (!alan) throw 'bilinmeyen alan';
      var rg = satirBul_('Günlük', 'Gün', v.gun);
      if (!rg) { satirEkle_('Günlük', { 'Gün': v.gun }); rg = sayfa_('Günlük').getLastRow(); }
      hucreYaz_('Günlük', rg, alan, v.deger);
      return;
    case 'besin_ekle':
      if (satirBul_('Besinlerim', 'ID', v.id)) return;
      satirEkle_('Besinlerim', {
        'ID': v.id, 'Ad': v.ad, 'Kategori': v.kategori, 'Katalog ID': v.katalogId || '', 'Temel': v.temel,
        'kcal': v.kcal, 'Protein': v.p, 'Ölçüler': v.olculer || '', 'Kaynak': v.kaynak || 'Elle eklendi', 'Not': v.not || ''
      });
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
    default:
      throw 'bilinmeyen işlem: ' + is.tur;
  }
}
