/**
 * Zindem – tablo kodu (sunucu tarafı)
 * Bu dosya telefonda ÇALIŞMAZ. Apps Script'teki Kod.gs onu GitHub'dan okuyup E-Tablolar'da çalıştırır.
 * Kodda kişisel bilgi ve anahtar yoktur.
 */
var SUNUCU_SURUM = '1.3.0';

var SAYFALAR = {
  'Ayarlar': ['Grup', 'Anahtar', 'Değer', 'Açıklama'],
  'Hedefler': ['Başlangıç', 'Tür', 'Değer', 'Not'],
  'Besinlerim': ['ID', 'Ad', 'Kategori', 'Katalog ID', 'Temel', 'kcal', 'Protein', 'Ölçüler', 'Kaynak', 'Not', 'Öğünler'],
  'Öğün Kayıtları': ['ID', 'Gün', 'Saat', 'Öğün', 'Besin ID', 'Ad', 'Miktar', 'Ölçü', 'Gram', 'kcal', 'Protein', 'Kayıt zamanı'],
  'Günlük': ['Gün', 'Su (ml)', 'Adım', 'Uyku'],
  'Ölçüler': ['Tarih', 'Tür', 'Değer', 'Birim', 'Not'],
  'Ağrı Notları': ['ID', 'Açılış', 'Tür', 'Bölge', 'Taraf', 'Şiddet', 'Hareket', 'Not', 'Durum', 'Kapanış'],
  'Ağrı Takibi': ['Not ID', 'Tarih', 'Şiddet', 'Cevap', 'Not']
};
var METIN_SUTUNLAR = ['ID', 'Gün', 'Tarih', 'Başlangıç', 'Açılış', 'Kapanış', 'Saat', 'Kayıt zamanı', 'Not ID', 'Besin ID', 'Katalog ID', 'Uyku'];

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
    var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    var saatli = v.getHours() || v.getMinutes();
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

/* ---------- Okuma ---------- */
function sunucuOku(p) {
  semaGuncelle_();
  var gun = p.gun || '';
  var ogunler = oku_('Öğün Kayıtları');
  var gunluk = oku_('Günlük');

  // Son yenenler (en yeni 40 farklı besin)
  var son = [], gorulen = {};
  for (var i = ogunler.length - 1; i >= 0 && son.length < 40; i--) {
    var o = ogunler[i];
    if (!o['Besin ID'] || gorulen[o['Besin ID']]) continue;
    gorulen[o['Besin ID']] = 1;
    son.push({ besinId: o['Besin ID'], ad: o['Ad'], olcu: o['Ölçü'], miktar: o['Miktar'], ogun: o['Öğün'] });
  }
  // Öğün başına seçilme sayıları (son 90 gün)
  var sinir = gunEkle_(gun || bugun_(), -90), sayim = {};
  ogunler.forEach(function (o) {
    if (!o['Besin ID'] || String(o['Gün']) < sinir) return;
    var k = o['Öğün'] + '|' + o['Besin ID'];
    sayim[k] = (sayim[k] || 0) + 1;
  });
  // Kayıt girilmiş günler (takvimdeki noktalar)
  var gunSet = {};
  ogunler.forEach(function (o) { if (o['Gün']) gunSet[o['Gün']] = 1; });
  gunluk.forEach(function (g) { if (g['Gün'] && (g['Su (ml)'] || g['Adım'] || g['Uyku'])) gunSet[g['Gün']] = 1; });
  // Her öğün için, bakılan günden önceki son kayıtlı gün ("Dünkü kahvaltıyı ekle")
  var onceki = {};
  for (var j = ogunler.length - 1; j >= 0; j--) {
    var x = ogunler[j], ad = x['Öğün'], g = String(x['Gün']);
    if (!ad || !g || g >= gun || !x['Besin ID']) continue;
    if (!onceki[ad]) onceki[ad] = { gun: g, kayitlar: [] };
    if (onceki[ad].gun === g) onceki[ad].kayitlar.unshift({ besinId: x['Besin ID'], ad: x['Ad'], miktar: x['Miktar'], olcu: x['Ölçü'] });
  }
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
    hedefler: oku_('Hedefler'),
    besinlerim: oku_('Besinlerim'),
    bugun: ogunler.filter(function (o) { return o['Gün'] === gun; }),
    gunluk: gunluk.filter(function (x) { return x['Gün'] === gun; })[0] || null,
    agri: agri,
    sonYenenler: son,
    sikYenenler: sayim,
    gunler: Object.keys(gunSet).sort(),
    oncekiOgun: onceki
  };
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
      throw new Error('bilinmeyen işlem: ' + is.tur);
  }
}
