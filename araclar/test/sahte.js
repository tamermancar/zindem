// Sahte Apps Script: sunucu.js'i bellekteki tablolarla çalıştırır. Kullanım: node sahte.js <depo> <port>
const fs = require('fs'), vm = require('vm'), http = require('http'), path = require('path'), url = require('url');
const depo = process.argv[2], port = +process.argv[3] || 8766;
const sayfalar = {}; // ad -> 2B dizi
function bugun(n) { const d = new Date(Date.now() + (n || 0) * 864e5); return d.toISOString().slice(0, 10); }
function sh(ad) {
  if (!sayfalar[ad]) return null;
  const v = sayfalar[ad];
  const r = (row, col, nr, nc) => ({
    getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const s = []; for (let j = 0; j < (nc || 1); j++) s.push(((v[row - 1 + i] || [])[col - 1 + j]) ?? ''); o.push(s); } return o; },
    setValues: (a) => a.forEach((s, i) => s.forEach((x, j) => { v[row - 1 + i] = v[row - 1 + i] || []; v[row - 1 + i][col - 1 + j] = x; })),
    setValue: (x) => { v[row - 1] = v[row - 1] || []; v[row - 1][col - 1] = x; },
    setNumberFormat: () => {}
  });
  return {
    getLastRow: () => v.length, getLastColumn: () => Math.max(0, ...v.map(x => x.length)),
    getRange: r, getDataRange: () => r(1, 1, v.length, Math.max(1, ...v.map(x => x.length))),
    deleteRow: (i) => v.splice(i - 1, 1), deleteRows: (i, n) => v.splice(i - 1, n), setFrozenRows: () => {}
  };
}
const ss = { getSheetByName: sh, insertSheet: (ad) => { sayfalar[ad] = []; return sh(ad); }, getSpreadsheetTimeZone: () => 'Europe/Istanbul' };
const props = {};
const ctx = {
  SpreadsheetApp: { getActive: () => ss },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, x) => { props[k] = x; } }) },
  Utilities: { formatDate: (d, tz, f) => { const p = n => String(n).padStart(2, '0'); const s = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); const h = p(d.getHours()) + ':' + p(d.getMinutes()); return f === 'HH:mm' ? h : f.includes('HH') ? s + ' ' + h : s; } }
};
const yedekTarih = [];
ctx.yedekle = () => { yedekTarih.push(new Date()); };
ctx.DriveApp = { getFoldersByName: () => { let v = yedekTarih.length > 0; return { hasNext: () => v, next: () => { v = false; let i = 0; const l = yedekTarih.slice(); return { getFiles: () => ({ hasNext: () => i < l.length, next: () => { const d = l[i++]; return { isTrashed: () => false, getDateCreated: () => d }; } }) }; } }; } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(depo, process.env.SUNUCU || 'sunucu.js'), 'utf8'), ctx);
// Örnek veri
sayfalar['Ayarlar'] = [['Grup', 'Anahtar', 'Değer', 'Açıklama'], ['', 'ad', 'Tamer', '']];
sayfalar['Hedefler'] = [['Başlangıç', 'Tür', 'Değer', 'Not'], ['2026-01-01', 'kalori', 2000, ''], ['2026-01-01', 'protein', 120, ''], ['2026-01-01', 'su_ml', 2500, ''], ['2026-01-01', 'adim', 8000, '']];
sayfalar['Besinlerim'] = [['ID', 'Ad', 'Kategori', 'Katalog ID', 'Temel', 'kcal', 'Protein', 'Ölçüler', 'Kaynak', 'Not', 'Öğünler'], ['B1', 'Tarhana çorbası (ev)', 'Çorbalar', '', '1 porsiyon', 70, 1.5, '', 'Elle eklendi', '', '']];
const ok = [['ID', 'Gün', 'Saat', 'Öğün', 'Besin ID', 'Ad', 'Miktar', 'Ölçü', 'Gram', 'kcal', 'Protein', 'Kayıt zamanı']];
let n = 0;
for (let g = 0; g <= 50; g += 1) {
  if (g % 3 === 2) continue;
  ok.push(['O' + (n++), bugun(-g), '08:10', 'Kahvaltı', 't-ayran', 'Ayran', 1, '1 su bardağı', 200, 72, 4]);
  if (g > 0) ok.push(['O' + (n++), bugun(-g), '13:00', 'Öğle', 't-ayran', 'Ayran', 2, '1 su bardağı', 400, 144, 8]);
}
ok.push(['F1', '2026-10-31', '09:00', 'Kahvaltı', 't-ayran', 'Ayran', 10, '1 su bardağı', 2000, 1500, 70]);
ok.push(['F2', '2026-10-31', '19:00', 'Akşam', 't-ayran', 'Ayran', 4, '1 su bardağı', 800, 680, 61]);
sayfalar['Öğün Kayıtları'] = ok;
sayfalar['Günlük'] = [['Gün', 'Su (ml)', 'Adım', 'Uyku'], [bugun(0), 400, 3200, ''], [bugun(-1), 2100, 9100, '7+']];
// ORNEK_ANT=1: genel bir örnek antrenman programı + geçmiş + açık ağrı notları (kişisel veri değil, sadece test için)
if (process.env.ORNEK_ANT) {
  // testler saati 19 Kasım 2026 Perşembe'ye sabitler; örnek tarihler ona göre
  const bugun = (n) => new Date(Date.UTC(2026, 10, 19) + (n || 0) * 864e5).toISOString().slice(0, 10);
  const hs = (l) => JSON.stringify(l.map(([h, ad, bolum, set, alt, ust, tur]) => ({ h, ad, bolum, set, alt, ust, tur: tur || 'tekrar', dinlenme: bolum === 'isinma' ? 0 : 60, kisa: 1 })));
  sayfalar['Programlar'] = [['ID', 'Ad', 'Etkin', 'Plan', 'Başlangıç', 'Güncelleme'], ['P1', 'Örnek program', 1, JSON.stringify({ 1: 'N1', 3: 'N2' }), bugun(-20), '']];
  sayfalar['Antrenmanlar'] = [['ID', 'Program ID', 'Ad', 'Sıra', 'Hareketler'],
    ['N1', 'P1', 'Üst vücut', 1, hs([['h080', 'Çene içeri çekme', 'isinma', 1, 10, 10], ['h002', 'Eğimli şınav', 'ana', 3, 8, 12], ['h053', 'x', 'ana', 2, 10, 12]])],
    ['N2', 'P1', 'Alt vücut', 2, hs([['h026', 'Kol çevirme', 'isinma', 1, 20, 20, 'süre'], ['h053', 'Sandalyeye oturup kalkma', 'ana', 3, 10, 12], ['h050', 'Köprü', 'ana', 2, 12, 15], ['h043', 'Dizden yan plank', 'ana', 2, 20, 30, 'süre']])]];
  const kay = [['ID', 'Gün', 'Antrenman ID', 'Hareket ID', 'Ad', 'Set', 'Tekrar', 'Ağırlık', 'Kayıt zamanı']];
  const gun = [['Gün', 'Antrenman ID', 'Ad', 'Durum', 'Kısa', 'Yapılan', 'Hedef', 'Not', 'Kayıt zamanı']];
  let k = 0;
  [[-10, 'N1', 'tamam'], [-8, 'N2', 'tamam'], [-3, 'N1', 'yarım'], [-1, 'N2', 'tamam']].forEach(([g, a, d]) => {
    const l = a === 'N1' ? [['h080', 1, 10], ['h002', 3, 12], ['h053', 2, 12]] : [['h026', 1, 20], ['h053', 3, 12], ['h050', 2, 15], ['h043', 2, 30]];
    let y = 0;
    l.forEach(([h, set, t]) => { for (let i = 1; i <= (d === 'yarım' ? 1 : set); i++) { kay.push(['K' + (k++), bugun(g), a, h, h, i, t - (g < -5 ? 2 : 0), '', '']); y++; } });
    gun.push([bugun(g), a, a === 'N1' ? 'Üst vücut' : 'Alt vücut', d, 0, y, 0, '', '']);
  });
  sayfalar['Antrenman Kayıtları'] = kay; sayfalar['Antrenman Günleri'] = gun;
  sayfalar['Ağrı Notları'] = [['ID', 'Açılış', 'Tür', 'Bölge', 'Taraf', 'Şiddet', 'Hareket', 'Not', 'Durum', 'Kapanış'],
    ['A1', bugun(-1) + ' 19:00', 'antrenman kaynaklı', 'diz', 'sağ', 4, '', '', 'açık', ''], ['A2', bugun(-2) + ' 08:00', 'gün içi kaza', 'omuz', 'sol', 6, '', '', 'açık', '']];
  sayfalar['Ayarlar'].push(['', 'ant_tanisma', '1', ''], ['', 'ant_ekipman', '["sandalye","mat"]', ''], ['', 'ant_hareket', 'ayakta', '']);
}
// ORNEK_IL=1 (1.10): İlerleme için 80 günlük genel örnek kullanıcı (kişisel veri değil). Bugün = 20 Kasım 2026.
if (process.env.ORNEK_IL) {
  let tohum = 7; const rnd = () => (tohum = (tohum * 16807) % 2147483647) / 2147483647;
  const G = (n) => new Date(Date.UTC(2026, 10, 20) + n * 864e5).toISOString().slice(0, 10);
  const hgun = (n) => { const d = new Date(Date.UTC(2026, 10, 20) + n * 864e5).getUTCDay(); return d === 0 ? 7 : d; };
  const ogun = [['ID', 'Gün', 'Saat', 'Öğün', 'Besin ID', 'Ad', 'Miktar', 'Ölçü', 'Gram', 'kcal', 'Protein', 'Kayıt zamanı']];
  const gunluk = [['Gün', 'Su (ml)', 'Adım', 'Uyku']], olc = [['Tarih', 'Tür', 'Değer', 'Birim', 'Not']];
  const kay = [['ID', 'Gün', 'Antrenman ID', 'Hareket ID', 'Ad', 'Set', 'Tekrar', 'Ağırlık', 'Kayıt zamanı']];
  const gun = [['Gün', 'Antrenman ID', 'Ad', 'Durum', 'Kısa', 'Yapılan', 'Hedef', 'Not', 'Kayıt zamanı']];
  let k = 0, sayac = 0;
  for (let n = -80; n <= 0; n++) {
    const i = n + 80, g = G(n), w = hgun(n);
    if (rnd() > 0.05) {
      ogun.push(['IO' + (k++), g, '09:00', 'Kahvaltı', '', 'Örnek kahvaltı', 1, 'porsiyon', 0, Math.round(500 + rnd() * 200), Math.round(25 + rnd() * 12)]);
      ogun.push(['IO' + (k++), g, '19:00', 'Akşam', '', 'Örnek akşam', 1, 'porsiyon', 0, Math.round(1050 + rnd() * 450 + (w >= 6 ? 150 : 0)), Math.round(65 + rnd() * 40)]);
      gunluk.push([g, Math.round((1500 + rnd() * 1500) / 50) * 50, n === 0 ? '' : Math.round(3500 + rnd() * 7500), ['<6', '6-7', '7+', '7+', '6-7', '7+'][Math.floor(rnd() * 6)]]);
    }
    if ([1, 4, 6].includes(w) && rnd() > 0.12) olc.push([g, 'kilo', Math.round((84 - i * 2.6 / 80 + (rnd() - 0.5) * 1.2) * 10) / 10, 'kg', '']);
    if (w === 1 && i % 14 < 7) olc.push([g, 'bel', Math.round((96 - i * 2.5 / 80 + (rnd() - 0.5) * 0.6) * 2) / 2, 'cm', '']);
    if ([1, 3, 5].includes(w) && n < 0) {
      const r = rnd(), d = r < 0.72 ? 'tamam' : r < 0.8 ? 'tamam' : r < 0.88 ? 'yarım' : r < 0.93 ? 'kaydırıldı' : 'yapılmadı', kisa = r >= 0.72 && r < 0.8 ? 1 : 0;
      const a = w === 3 ? 'IN2' : 'IN1', tek = 8 + Math.floor(i / 20);
      let y = 0;
      if (d === 'tamam' || d === 'yarım') {
        (a === 'IN1' ? [['h002', 3 - kisa, tek], ['h010', 3 - kisa, tek - 2]] : [['h053', 3 - kisa, tek + 2], ['h050', 2, 12]]).forEach(([h, set, t]) => {
          for (let s2 = 1; s2 <= (d === 'yarım' ? 1 : set); s2++) { kay.push(['IK' + (sayac++), g, a, h, { h002: 'Eğimli şınav', h010: 'Masa altında çekiş', h053: 'Sandalyeye oturup kalkma', h050: 'Köprü' }[h], s2, t - (s2 === 3 ? 1 : 0), '', '']); y++; } });
      }
      gun.push([i === 60 ? new Date(Date.UTC(2026, 10, 20) + n * 864e5) : g, a, a === 'IN1' ? 'Üst vücut' : 'Alt vücut', d, kisa, y, 10, '', '']);
    }
  }
  sayfalar['Öğün Kayıtları'] = ogun; sayfalar['Günlük'] = gunluk; sayfalar['Ölçüler'] = olc;
  sayfalar['Antrenman Kayıtları'] = kay; sayfalar['Antrenman Günleri'] = gun;
  const hs = (l) => JSON.stringify(l.map(([h, ad, set, alt, ust]) => ({ h, ad, bolum: 'ana', set, alt, ust, tur: 'tekrar', dinlenme: 60, kisa: 1 })));
  sayfalar['Programlar'] = [['ID', 'Ad', 'Etkin', 'Plan', 'Başlangıç', 'Güncelleme'], ['IP1', 'Örnek program', 1, JSON.stringify({ 1: 'IN1', 3: 'IN2', 5: 'IN1' }), G(-80), '']];
  sayfalar['Antrenmanlar'] = [['ID', 'Program ID', 'Ad', 'Sıra', 'Hareketler'],
    ['IN1', 'IP1', 'Üst vücut', 1, hs([['h002', 'Eğimli şınav', 3, 8, 12], ['h010', 'Masa altında çekiş', 3, 6, 10]])],
    ['IN2', 'IP1', 'Alt vücut', 2, hs([['h053', 'Sandalyeye oturup kalkma', 3, 10, 15], ['h050', 'Köprü', 2, 12, 15]])]];
  sayfalar['Ağrı Notları'] = [['ID', 'Açılış', 'Tür', 'Bölge', 'Taraf', 'Şiddet', 'Hareket', 'Not', 'Durum', 'Kapanış'],
    ['IA1', G(-3) + ' 19:00', 'antrenman kaynaklı', 'diz', 'sağ', 5, '', '', 'açık', ''], ['IA2', G(-31) + ' 08:00', 'gün içi kaza', 'bel', '', 4, '', '', 'geçti', G(-27)]];
  sayfalar['Ağrı Takibi'] = [['Not ID', 'Tarih', 'Şiddet', 'Cevap', 'Not'], ['IA1', G(-2), 4, 'azaldı', ''], ['IA1', G(-1), 3, 'azaldı', ''], ['IA2', G(-29), 2, 'azaldı', ''], ['IA2', G(-27), 0, 'geçti', '']];
  sayfalar['Hedefler'].push(['2026-09-01', 'kilo', 78, '']);
  sayfalar['Ayarlar'].push(['', 'ant_tanisma', '1', '']);
}
// BOS=1: hiç verisi olmayan yeni kullanıcı
if (process.env.BOS) { ['Öğün Kayıtları', 'Günlük', 'Hedefler'].forEach(k => { sayfalar[k] = sayfalar[k].slice(0, 1); }); }
let gecikme = +process.env.GECIKME || 0;
http.createServer((req, res) => {
  const u = url.parse(req.url, true);
  if (u.pathname === '/exec') {
    let govde = '';
    req.on('data', c => govde += c);
    req.on('end', () => {
      let c;
      try { c = req.method === 'POST' ? ctx.sunucuYaz(JSON.parse(govde).islemler) : ctx.sunucuOku(u.query); } catch (e) { c = { ok: false, hata: String(e) }; }
      setTimeout(() => { res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(c)); }, gecikme);
    });
    return;
  }
  // Antrenman testleri her ekran genişliğinde sıfırdan başlasın
  if (u.pathname === '/_ant_sifirla') { ['Programlar', 'Antrenmanlar', 'Antrenman Kayıtları', 'Antrenman Günleri', 'Hareketlerim'].forEach(k => { if (sayfalar[k]) sayfalar[k] = sayfalar[k].slice(0, 1); });
    if (sayfalar['Ayarlar']) sayfalar['Ayarlar'] = sayfalar['Ayarlar'].filter(r => !/^ant_/.test(r[1])); res.end('ok'); return; }
  if (u.pathname === '/_tablo') { res.end(JSON.stringify(sayfalar[u.query.ad])); return; }
  let f = path.join(depo, u.pathname === '/' ? 'index.html' : u.pathname);
  if (u.pathname === '/ayar.js') { res.end("window.ZINDEM_ADRES='http://localhost:" + port + "/exec';"); return; }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(f)] || 'text/plain' }); res.end(d); });
}).listen(port, () => console.log('hazır ' + port));
