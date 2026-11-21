/* Paket 2 (1.11) Ekle ekranları taslağı. Gerçek uygulamanın içine, katalogdaki değerlerle çizilir (kişisel veri yok).
   Sadece görünüm: davranış kodda yazılacak. */
window.TE = (function () {
  const $ = s => document.querySelector(s);
  const ik = (n, c) => '<svg class="ikon ' + (c || '') + '" aria-hidden="true"><use href="#t-' + n + '"/></svg>';
  const bekle = ms => new Promise(r => setTimeout(r, ms));

  /* Katalogdan (katalog.json, USDA / etiket ortalaması) — taslak örnekleri */
  const B = {
    ayran: ['Ayran', '1 su bardağı', 72, '4'],
    peynir: ['Beyaz peynir, az yağlı', '1 kibrit kutusu', 32, '3,8'],
    bal: ['Bal', '1 yemek kaşığı', 64, '0,1'],
    peynirTam: ['Beyaz peynir, tam yağlı (feta tipi)', '1 kibrit kutusu', 80, '4,3'],
    peynirYarim: ['Beyaz peynir, yarım yağlı', '1 kibrit kutusu', 63, '7,4'],
    cedar: ['Çedar peyniri', '1 kibrit kutusu', 121, '6,9'],
    fistik: ['Fıstık ezmesi', '1 yemek kaşığı', 96, '3,6'],
    helva: ['Helva (tahin helvası)', '1 kibrit kutusu', 141, '3,8'],
    hindi: ['Hindi füme / hindi salam', '1 dilim', 17, '2,4'],
    domates: ['Domates', '1 orta boy', 22, '1,1'],
    zeytin: ['Siyah zeytin', '5 adet (küçük)', 17, '0,1'],
    yogTam: ['Yoğurt, tam yağlı', '1 kase', 122, '7'],
    yogAz: ['Yoğurt, az yağlı', '1 kase', 126, '10,4'],
    suzme: ['Süzme yoğurt, az yağlı', '1 kase', 146, '19,8'],
    yogYagsiz: ['Yoğurt, yağsız', '1 kase', 112, '11,4'],
    meyveli: ['Meyveli yoğurt, az yağlı', '1 kase', 198, '8'],
  };

  function adim(n, ad) {
    const sil = n <= 0.5 || n === 1 ? false : false;
    return '<div class="adim" role="group" aria-label="' + ad + ' miktarı"><button aria-label="' + ad + (n === 1 ? ' öğünden çıkar' : ' azalt') + '"' + (n === 1 ? ' class="sil"' : '') + '>' + ik(n === 1 ? 'trash' : 'minus') + '</button>' +
      '<span class="adim-deger"><b>' + String(n).replace('.', ',') + '</b></span><button aria-label="' + ad + ' artır">' + ik('plus') + '</button></div>';
  }
  // Listede öğünde olmayan besin: + düğmesi (satıra dokununca da eklenir)
  function satir(k) {
    const b = B[k];
    return '<div class="sofra-kutu"><div class="sonuc"><span class="bilgi"><b>' + b[0] + '</b><small>' + b[1] + ' · ' + b[2] + ' kcal · ' + b[3] + ' g</small></span>' +
      '<button class="sepet-ekle" aria-label="' + b[0] + ' öğüne ekle">' + ik('plus') + '</button></div></div>';
  }
  // Listede öğünde olan besin: ölçü ▾, değer, − n + ; sola çekince Kaldır
  function ogunde(k, n, o) {
    o = o || {}; const b = B[k];
    const miktar = (o.miktar || (String(n).replace('.', ',') + ' ' + b[1].replace(/^1 /, '')));
    let h = '<div class="sofra-kutu kaydir' + (o.kay ? ' taslak-' + o.kay : '') + '"><div class="sonuc sofrada"><div class="bilgi"><b>' + b[0] + '</b>' +
      '<button class="miktar-dugme" aria-expanded="' + !!o.olcu + '">' + miktar + ik(o.olcu ? 'chevron-up' : 'chevron-down') + '</button>' +
      '<small>' + (o.kcal || Math.round(b[2] * n)) + ' kcal · ' + (o.p || b[3]) + ' g protein</small></div>' + adim(n, b[0]) + '</div>';
    if (o.olcu) h += '<div class="cipler olcu-secim" role="group" aria-label="Ölçü seç"><button class="cip secili" aria-pressed="true">kibrit kutusu</button><button class="cip">dilim</button><button class="cip">yemek kaşığı</button><button class="cip">gram</button></div>';
    h += '<button class="kaydir-sil" tabindex="-1" aria-hidden="true">' + ik('trash') + 'Kaldır</button>';
    return h + '</div>';
  }
  function cubuk(d) {
    let sol;
    if (d.geri) sol = '<button class="oc-geri" aria-label="' + d.geri + ', geri al"><span class="oc-simge">' + ik('arrow-back-up') + '</span><span class="oc-yazi"><small>' + d.geri + '</small><b>Geri al</b></span></button>';
    else if (!d.n) sol = '<span class="oc-simge">' + ik('tools-kitchen-2') + '</span><span class="oc-yazi"><small>' + d.ogun + ' · boş</small><b>Dokununca eklenir</b></span>';
    else sol = '<span class="oc-simge">' + ik('tools-kitchen-2') + '<span class="sayac">' + d.n + '</span></span><span class="oc-yazi" aria-live="polite"><small>' + d.ogun + ' · ' + d.n + ' besin</small><b>' + d.kcal + ' kcal · ' + d.p + ' g</b></span>';
    return '<div class="ogun-cubuk">' + sol + '<button class="ana-dugme">Tamam</button></div>';
  }
  function bildirimGizle() { const b = $('#bildirim'); if (b) b.hidden = true; }
  async function ekleAc() {
    bildirimGizle();
    if ($('#pencere').hidden) { if (!$('[data-ekle="kahvalti"]')) { $('[data-ogun="ogle"]').click(); await bekle(150); } $('[data-ogun="kahvalti"]').click(); await bekle(150); $('[data-ekle="kahvalti"]').click(); await bekle(350); }
    $('#arama').value = ''; const s = $('#pencere .arama-sil'); if (s) s.hidden = true; $('#grup-cipler').hidden = false;
    $('#pencere').scrollTop = 0;
  }
  function sekme(ad) { document.querySelectorAll('#grup-cipler .sekme-ciz').forEach(b => { const on = b.textContent === ad; b.classList.toggle('secili', on); b.setAttribute('aria-selected', on); }); }
  function doldur(h, c) { $('#pencere-ic').innerHTML = h + '<div class="oc-bosluk"></div>' + c; }
  const tarifler = '<div class="bolum-baslik">Tarifler</div>' +
    '<div class="sofra-kutu"><button class="sonuc tarif-satir"><span class="bilgi"><b>' + ik('chef-hat', 'tarif-ikon') + 'Omlet</b><small>Malzemeleri sen gir</small></span>' + ik('chevron-right', 'tarif-ok') + '</button></div>' +
    '<div class="sofra-kutu"><button class="sonuc tarif-satir"><span class="bilgi"><b>' + ik('chef-hat', 'tarif-ikon') + 'Yağda yumurta</b><small>Malzemeleri sen gir</small></span>' + ik('chevron-right', 'tarif-ok') + '</button></div>';
  const oneriler = k => '<div class="bolum-baslik">Kahvaltı için öneriler</div>' + k.map(x => x.startsWith('<') ? x : satir(x)).join('');

  return {
    // 1) Boş öğün: çubuk baştan görünür, ne olacağını söyler
    async e1() {
      await ekleAc(); sekme('Önerilen');
      doldur(tarifler + '<div class="bolum-baslik">Kahvaltı için sık yediklerin</div>' + satir('ayran') + oneriler(['bal', 'peynir', 'peynirTam', 'peynirYarim', 'cedar', 'fistik', 'helva', 'hindi']),
        cubuk({ ogun: 'Kahvaltı' }));
    },
    // 2) Ayran öğündeydi (en üstte "Kahvaltıda"), peynir ve bal listede eklendi: yerlerinde kalır, − n + olur
    async e2() {
      await ekleAc(); sekme('Önerilen');
      doldur('<div class="bolum-baslik ogunde-baslik">Kahvaltıda</div>' + ogunde('ayran', 1) + tarifler +
        oneriler([ogunde('bal', 1), ogunde('peynir', 2, { kcal: 64, p: '7,6' }), 'peynirTam', 'peynirYarim', 'cedar', 'fistik', 'helva', 'hindi']),
        cubuk({ ogun: 'Kahvaltı', n: 3, kcal: 200, p: '11,7' }));
    },
    // 3) Ölçüye dokununca seçenekler açılır (kayıt hemen güncellenir)
    async e3() {
      await this.e2();
      const kutular = document.querySelectorAll('#pencere-ic .sofra-kutu.kaydir'); kutular[2].outerHTML = ogunde('peynir', 2, { kcal: 64, p: '7,6', olcu: 1 });
    },
    // 4) Yavaş sola çekme: Kaldır düğmesi görünür
    async e4() {
      await this.e2();
      const kutular = document.querySelectorAll('#pencere-ic .sofra-kutu.kaydir'); kutular[2].outerHTML = ogunde('peynir', 2, { kcal: 64, p: '7,6', kay: 'acik' });
    },
    // 5) Hızlı / sonuna kadar çekme: satır gidiyor (ara kare)
    async e5() {
      await this.e2();
      const kutular = document.querySelectorAll('#pencere-ic .sofra-kutu.kaydir'); kutular[2].outerHTML = ogunde('peynir', 2, { kcal: 64, p: '7,6', kay: 'yari' });
    },
    // 6) Kaldırıldı: satır + düğmesine döner, çubukta 5 sn "Geri al"
    async e6() {
      await ekleAc(); sekme('Önerilen');
      doldur('<div class="bolum-baslik ogunde-baslik">Kahvaltıda</div>' + ogunde('ayran', 1) + tarifler +
        oneriler([ogunde('bal', 1), 'peynir', 'peynirTam', 'peynirYarim', 'cedar', 'fistik', 'helva', 'hindi']),
        cubuk({ geri: 'Çıkarıldı · Beyaz peynir, az yağlı' }));
    },
    // 7) Grup sekmesinde de öğündekiler yerinde, miktarıyla
    async e7() {
      await ekleAc(); sekme('Kahvaltılık');
      doldur([ogunde('bal', 1), ogunde('peynir', 2, { kcal: 64, p: '7,6' }), 'peynirTam', 'peynirYarim', 'cedar', 'fistik', 'helva', 'hindi'].map(x => x.startsWith('<') ? x : satir(x)).join(''),
        cubuk({ ogun: 'Kahvaltı', n: 3, kcal: 200, p: '11,7' }));
      const el = $('#grup-cipler'), s = el.querySelector('.secili'); if (s) el.scrollLeft = s.offsetLeft - 40;
    },
    // 8) Arama
    async e8() {
      await ekleAc();
      $('#arama').value = 'yoğurt'; const s = $('#pencere .arama-sil'); if (s) s.hidden = false; $('#grup-cipler').hidden = true;
      doldur([ogunde('suzme', 1), 'yogAz', 'yogTam', 'yogYagsiz', 'meyveli'].map(x => x.startsWith('<') ? x : satir(x)).join('') +
        '<button class="ikinci-dugme">' + ik('pencil') + ' Bulamadın mı? Kendin ekle</button>',
        cubuk({ ogun: 'Kahvaltı', n: 2, kcal: 218, p: '23,8' }));
    },
    // 9) En alta kaydırınca son satır çubuğun üstünde kalır
    async e9() { await this.e2(); const p = $('#pencere'); p.scrollTop = p.scrollHeight; },

    // Bugün: kahvaltı boş, "Dünkü kahvaltıyı ekle"
    async b1() {
      if (!$('#pencere').hidden) { $('#kapat').click(); await bekle(300); }
      bildirimGizle(); window.scrollTo(0, 0);
      const k = $('#uygulama .ogun-kart');
      k.innerHTML = '<div class="ogun-ust"><span class="ogun-yazi"><span class="ogun-ad">Kahvaltı<span class="simdi-rozet">şimdi</span></span><span class="ogun-ozet">— kcal · — g protein</span></span>' +
        '<button class="ekle-dugme">' + ik('plus') + 'Ekle</button></div><div class="bos">Henüz bir şey eklemedin.</div>' +
        '<div class="ogun-alt"><button class="ikinci-dugme tekrar">' + ik('arrow-back-up') + 'Dünkü kahvaltıyı ekle</button></div>';
    },
    bugunSatir(k, n, kay) {
      const b = B[k];
      return '<div class="kaydir' + (kay ? ' taslak-acik' : '') + '"><div class="satir"><button class="bilgi bilgi-dugme"><b>' + b[0] + '</b><small>' + String(n).replace('.', ',') + ' ' + b[1].replace(/^1 /, '') + '</small><small>' +
        Math.round(b[2] * n) + ' kcal · ' + b[3] + ' g protein</small></button>' + adim(n, b[0]) + '</div><button class="kaydir-sil" tabindex="-1" aria-hidden="true">' + ik('trash') + 'Sil</button></div>';
    },
    // Dünkü eklendi: doğrudan kayda yazılır, üstte "4 besin eklendi · Geri al"
    async b2(kay) {
      await this.b1();
      const k = $('#uygulama .ogun-kart');
      k.innerHTML = '<div class="ogun-ust"><span class="ogun-yazi"><span class="ogun-ad">Kahvaltı<span class="simdi-rozet">şimdi</span></span><span class="ogun-ozet">143 kcal · 9 g protein</span></span>' +
        '<button class="ekle-dugme">' + ik('plus') + 'Ekle</button></div>' + this.bugunSatir('ayran', 1) + this.bugunSatir('peynir', 1, kay) + this.bugunSatir('domates', 1) + this.bugunSatir('zeytin', 1);
      if (!kay) { const b = $('#bildirim'); b.innerHTML = ik('circle-check', 'b-ikon') + '<span>4 besin kahvaltıya eklendi</span><button id="bildirim-dugme">Geri al</button>'; b.hidden = false; }
      k.scrollIntoView({ block: 'center' });
    },
    // Bugün'de yavaş sola çekme: Sil
    async b3() { await this.b2(true); },

    // Tarif malzemesi sola çekme: Kaldır (sadece bu tariften çıkar)
    async t1() {
      await ekleAc();
      const a = $('#arama'); a.value = 'taze fasulye'; a.dispatchEvent(new Event('input')); await bekle(250);
      const l = $('#pencere .malz-link'); if (l) { l.click(); await bekle(400); }
      const s = $('#pencere .tm-satir');
      if (s) { const w = document.createElement('div'); w.className = 'kaydir taslak-acik'; s.parentNode.insertBefore(w, s); w.appendChild(s);
        w.insertAdjacentHTML('beforeend', '<button class="kaydir-sil" tabindex="-1" aria-hidden="true">' + ik('trash') + 'Kaldır</button>'); }
    },
  };
})();
