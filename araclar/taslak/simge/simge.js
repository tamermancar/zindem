/* Profil simgesi taslağı: A = Fluent Emoji Flat (Microsoft, MIT), B = Tabler simgesi renkli dairede. Gerçek uygulamanın içine çizilir. */
window.TS = (function () {
  var V = __VERI__;
  var $ = function (s) { return document.querySelector(s); };
  var FL = ['flexed_biceps', 'running_shoe', 'trophy', 'sports_medal', 'fire', 'high_voltage', 'stopwatch', 'red_apple', 'avocado', 'broccoli', 'carrot', 'droplet', 'herb', 'sun', 'rocket'];
  var FL_AD = { flexed_biceps: 'Pazu', running_shoe: 'Koşu ayakkabısı', trophy: 'Kupa', sports_medal: 'Madalya', fire: 'Ateş', high_voltage: 'Şimşek', mountain: 'Dağ', stopwatch: 'Kronometre', red_apple: 'Elma', avocado: 'Avokado', broccoli: 'Brokoli', carrot: 'Havuç', droplet: 'Su damlası', herb: 'Yaprak', sun: 'Güneş', rocket: 'Roket' };
  var TB = [['barbell', '--antrenman', 'Halter'], ['shoe', '--adim', 'Ayakkabı'], ['trophy', '--sari', 'Kupa'], ['medal', '--turuncu', 'Madalya'], ['flame', '--kirmizi', 'Ateş'], ['bolt', '--sari', 'Şimşek'], ['mountain', '--uyku', 'Dağ'], ['stopwatch', '--ana', 'Kronometre'],
    ['apple', '--kirmizi', 'Elma'], ['carrot', '--turuncu', 'Havuç'], ['leaf', '--yesil', 'Yaprak'], ['plant', '--yesil', 'Fide'], ['droplet', '--su', 'Su damlası'], ['sun', '--sari', 'Güneş'], ['heartbeat', '--adim', 'Nabız']];
  function ikT(n) { if (!V.t[n]) return '<svg class="ikon" aria-hidden="true"><use href="#t-' + n + '"/></svg>'; return '<svg class="ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + V.t[n] + '</svg>'; }
  function fl(n) { return '<img src="data:image/svg+xml;utf8,' + encodeURIComponent(V.f[n]) + '" alt="">'; }
  function avA(n, cls) { return '<span class="sg-av sg-a ' + (cls || '') + '">' + fl(n) + '</span>'; }
  function avB(x, cls) { return '<span class="sg-av sg-b ' + (cls || '') + '" style="--sg-renk: var(' + x[1] + ')">' + ikT(x[0]) + '</span>'; }
  function profilDugme(html) { var b = $('#profil-dugme'); if (b) { b.innerHTML = html; b.classList.add('sg-dolu'); } }
  function pencere(baslik, ic) {
    var p = $('#pencere'); p.classList.remove('sabit');
    p.innerHTML = '<div class="pencere-bas"><div class="tutamac" aria-hidden="true"></div><button class="metin-dugme vurgu geri">' + ikT('chevron-left') + 'Profili düzenle</button>' +
      '<div class="pencere-ust"><h2 id="pencere-baslik">' + baslik + '</h2><button class="kapat" id="kapat" aria-label="Kapat">' + ikT('x') + '</button></div></div><div id="pencere-ic">' + ic + '</div>';
    p.hidden = false; $('#perde').hidden = false; document.body.style.overflow = 'hidden';
  }
  function kapat() { $('#pencere').hidden = true; $('#perde').hidden = true; document.body.style.overflow = ''; }
  function izgara(liste, sec) {
    return '<div class="sg-izgara" role="radiogroup" aria-label="Profil simgesi">' +
      '<button class="sg-sec' + (sec === -1 ? ' secili' : '') + '" role="radio" aria-checked="' + (sec === -1) + '" aria-label="Baş harfler"><span class="sg-av sg-harf">TM</span></button>' +
      liste.map(function (h, i) { return '<button class="sg-sec' + (sec === i ? ' secili' : '') + '" role="radio" aria-checked="' + (sec === i) + '" aria-label="' + h.ad + '">' + h.html + '</button>'; }).join('') + '</div>' +
      '<div class="alt-dugme"><button class="ana-dugme">Kaydet</button></div>';
  }
  return {
    aBugun: function () { kapat(); profilDugme(avA('flexed_biceps', 'sg-ust')); window.scrollTo(0, 0); },
    bBugun: function () { kapat(); var bg = document.querySelector('.alt-menu [data-ekran="bugun"]'); if (bg) bg.click(); setTimeout(function () { profilDugme(avB(TB[0], 'sg-ust')); window.scrollTo(0, 0); }, 400); },
    aSec: function () { pencere('Profil simgesi', izgara(FL.map(function (n) { return { ad: FL_AD[n], html: avA(n) }; }), 0)); },
    bSec: function () { pencere('Profil simgesi', izgara(TB.map(function (x) { return { ad: x[2], html: avB(x) }; }), 0)); },
    profilDuzenle: function (tur) {
      var av = tur === 'a' ? avA('flexed_biceps', 'sg-buyuk') : avB(TB[0], 'sg-buyuk');
      pencere('Profili düzenle', '<div class="sg-profil">' + av + '<button class="metin-dugme vurgu">Simgeyi değiştir</button></div>' +
        '<div class="form-alan"><label for="p-ad">Adın</label><input id="p-ad" type="text" value="Tamer Mancar"></div>' +
        '<div class="ayar-satir"><label for="p-boy"><b>Boy</b><small>İsteğe bağlı · vücut kitle indeksi için</small></label><span class="birimli"><input id="p-boy" type="text" inputmode="numeric" value=""  placeholder="—"><small>cm</small></span></div>' +
        '<div class="ayar-satir"><label for="p-yil"><b>Doğum yılı</b><small>İsteğe bağlı · hareket önerileri için</small></label><span class="birimli"><input id="p-yil" type="text" inputmode="numeric" value="" placeholder="—"><small></small></span></div>' +
        '<button class="il-hedef-satir"><span>' + ikT('weight') + 'Kilo</span><b>Ölçüm yok</b>' + ikT('chevron-right') + '</button>' +
        '<div class="alt-dugme"><button class="ana-dugme">Kaydet</button></div>');
      var g = $('#pencere .geri'); if (g) g.innerHTML = ikT('chevron-left') + 'Menü';
    },
    ekran: function (tur, ad) {
      kapat();
      var b = document.querySelector('.alt-menu [data-ekran="' + ad + '"]'); if (b) b.click();
      setTimeout(function () {
        var h = document.querySelector('.ekran-ust'); if (!h || h.querySelector('.sg-av')) return;
        h.insertAdjacentHTML('afterbegin', '<button class="profil sg-dolu sg-kucuk" aria-label="Profil ve ayarlar menüsü">' + (tur === 'a' ? avA('flexed_biceps', 'sg-ust') : avB(TB[0], 'sg-ust')) + '</button>');
      }, 500);
    },
    kapat: kapat
  };
})();
