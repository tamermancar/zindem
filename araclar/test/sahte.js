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
    deleteRow: (i) => v.splice(i - 1, 1), setFrozenRows: () => {}
  };
}
const ss = { getSheetByName: sh, insertSheet: (ad) => { sayfalar[ad] = []; return sh(ad); }, getSpreadsheetTimeZone: () => 'Europe/Istanbul' };
const props = {};
const ctx = {
  SpreadsheetApp: { getActive: () => ss },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, x) => { props[k] = x; } }) },
  Utilities: { formatDate: (d, tz, f) => { const p = n => String(n).padStart(2, '0'); const s = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); return f.includes('HH') ? s + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) : s; } }
};
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
  if (u.pathname === '/_tablo') { res.end(JSON.stringify(sayfalar[u.query.ad])); return; }
  let f = path.join(depo, u.pathname === '/' ? 'index.html' : u.pathname);
  if (u.pathname === '/ayar.js') { res.end("window.ZINDEM_ADRES='http://localhost:" + port + "/exec';"); return; }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png' }[path.extname(f)] || 'text/plain' }); res.end(d); });
}).listen(port, () => console.log('hazır ' + port));
