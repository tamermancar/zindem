/**
 * Zindem – veri arka ucu (Google Apps Script)  ·  Kod.gs 2.0
 * Bu dosya E-Tablolar dosyasına bağlıdır: Uzantılar › Apps Script.
 *
 * Bu dosya küçüktür ve nadiren değişir: anahtarı kontrol eder, aylık yedeği alır.
 * Tabloyu okuyan ve yazan asıl kod GitHub'daki sunucu.js dosyasındadır; her istekte oradan okunur
 * (sürüm değişene kadar 6 saat önbellekte tutulur). Böylece güncellemeler sadece GitHub'dan yapılır.
 *
 * Güvenlik: sadece ilk bağlanılan GitHub Pages adresindeki sunucu.js kabul edilir.
 * Kodda kişisel bilgi ve anahtar YOKTUR. Gizli anahtar "Komut dosyası özellikleri"nde (ANAHTAR) durur.
 */

var YEDEK_KLASORU = 'Zindem Yedekleri';
var YEDEK_AY = 6;

/* ---------- Kurulum: bir kez, düzenleyiciden çalıştırılır (eski kurulumda tekrar gerekmez) ---------- */
function kurulum() {
  var ozellik = PropertiesService.getScriptProperties();
  if (!ozellik.getProperty('ANAHTAR')) ozellik.setProperty('ANAHTAR', Utilities.getUuid().replace(/-/g, ''));
  var tetikVar = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'yedekle'; });
  if (!tetikVar) ScriptApp.newTrigger('yedekle').timeBased().onMonthDay(1).atHour(3).create();
  Logger.log('Kurulum tamam. Gizli anahtarın: ' + ozellik.getProperty('ANAHTAR'));
  Logger.log('Sayfalar, uygulama ilk açıldığında sunucu.js tarafından kendiliğinden kurulur.');
}

/* ---------- Aylık yedek: 6 aydan eskileri siler (veriler silinmez, sadece eski kopyalar) ---------- */
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

/** GitHub'daki sunucu.js'i okuyup çalıştırır. url ve surum telefondaki uygulamadan gelir. */
function sunucuYukle_(url, surum) {
  var pr = PropertiesService.getScriptProperties();
  var kayitli = pr.getProperty('SUNUCU_URL');
  if (url) {
    if (!/^https:\/\/[\w-]+\.github\.io\/[^?#]*sunucu\.js$/.test(url)) throw new Error('Uygulama adresi geçersiz.');
    if (!kayitli) { kayitli = url; pr.setProperty('SUNUCU_URL', url); }
    else if (kayitli !== url) throw new Error('Bu tablo başka bir uygulama adresine bağlı.');
  }
  if (!kayitli) throw new Error('Uygulamayı güncelleyip yeniden aç.');
  surum = String(surum || pr.getProperty('SUNUCU_SURUM') || '');
  if (globalThis.__sunucuSurum !== undefined && globalThis.__sunucuSurum === surum) return;
  var onbellek = CacheService.getScriptCache();
  var metin = surum ? onbellek.get('sunucu_' + surum) : null;
  if (!metin) {
    var r = UrlFetchApp.fetch(kayitli + '?v=' + encodeURIComponent(surum || String(Date.now())), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) throw new Error('Sunucu kodu GitHub\'dan alınamadı (' + r.getResponseCode() + ').');
    metin = r.getContentText();
    var m = metin.match(/SUNUCU_SURUM\s*=\s*'([^']+)'/);
    if (!m) throw new Error('GitHub\'daki sunucu.js tanınmadı.');
    if (metin.length < 95000) onbellek.put('sunucu_' + m[1], metin, 21600);
    pr.setProperty('SUNUCU_SURUM', m[1]);
    surum = m[1];
  }
  (0, eval)(metin);
  globalThis.__sunucuSurum = surum;
}

/* ---------- Okuma: GET ?k=ANAHTAR&gun=YYYY-MM-DD&s=sunucu.js adresi&sv=sürüm ---------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!p.k) return ContentService.createTextOutput('Zindem bağlantı noktası çalışıyor.');
  if (!anahtarDogru_(p.k)) return cevap_({ ok: false, hata: 'yetkisiz' });
  try {
    sunucuYukle_(p.s, p.sv);
    return cevap_(sunucuOku(p));
  } catch (x) {
    return cevap_({ ok: false, hata: String((x && x.message) || x) });
  }
}

/* ---------- Yazma: POST {k, s, sv, islemler:[{tur, ...}]} ---------- */
function doPost(e) {
  var istek;
  try { istek = JSON.parse(e.postData.contents); } catch (x) { return cevap_({ ok: false, hata: 'bozuk istek' }); }
  if (!anahtarDogru_(istek.k)) return cevap_({ ok: false, hata: 'yetkisiz' });
  var kilit = LockService.getScriptLock();
  kilit.waitLock(20000);
  try {
    sunucuYukle_(istek.s, istek.sv);
    return cevap_(sunucuYaz(istek.islemler || []));
  } catch (x) {
    return cevap_({ ok: false, hata: String((x && x.message) || x) });
  } finally { kilit.releaseLock(); }
}
