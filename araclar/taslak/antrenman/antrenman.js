/* Antrenman taslağı: gerçek uygulamanın içine örnek veriyle çizilir (sadece görünüm, kayıt yok) */
window.TASLAK = (function () {
  const ik = (n, c) => '<svg class="ikon ' + (c || '') + '" aria-hidden="true"><use href="#t-' + n + '"/></svg>';
  const $ = s => document.querySelector(s);

  // Haftanın planı ve durumu (✅ yapıldı · 🟠 minimum · ↪️ kaydırıldı · ❌ yapılmadı · boş = bekliyor)
  function hafta(bugun, durum) {
    const g = [['Pt', 'Üst'], ['Sa', 'Rutin'], ['Ça', 'Alt'], ['Pe', 'Rutin'], ['Cu', 'Üst'], ['Ct', 'Alt'], ['Pz', 'Rutin']];
    return '<div class="an-hafta" role="group" aria-label="Bu haftanın planı">' + g.map((x, i) =>
      '<button class="an-gun' + (i === bugun ? ' bugun' : '') + (x[1] === 'Rutin' ? ' dinlen' : '') + '" aria-label="' + x[0] + ' ' + x[1] + '"><small>' + x[0] + '</small><b>' + x[1] + '</b><span class="d">' + (durum[i] || '') + '</span></button>').join('') + '</div>';
  }
  function ust(ad, alt, yapilan, toplam, kademe, birim) {
    return '<section class="kart an-ust"><h2>' + ad + '</h2><div class="an-ust-ust"><small>' + alt + '</small>' +
      '<div class="an-sayi"><b>' + yapilan + '</b><span> / ' + toplam + ' ' + (birim || 'set') + '</span></div></div>' +
      '<span class="an-cubuk" aria-hidden="true"><span style="width:' + Math.round(yapilan / toplam * 100) + '%"></span></span>' + (kademe || '') + '</section>';
  }
  // set: sayı = yapılan tekrar (dolu), {h:8} = hedef (boş)
  function hr(ad, meta, setler, o) {
    o = o || {};
    const s = setler.map((x, i) => typeof x === 'number'
      ? '<button class="an-set tamam' + (o.secili === i ? ' secili' : '') + '" aria-label="' + (i + 1) + '. set, ' + x + ' tekrar yapıldı">' + x + '</button>'
      : '<button class="an-set" aria-label="' + (i + 1) + '. set, hedef ' + x.h + '">' + x.h + '</button>').join('') +
      (o.tek ? '' : '<button class="an-set ekle" aria-label="Set ekle">' + ik('plus') + '</button>');
    if (o.tek) return '<div class="an-hr tek' + (o.ara ? ' ara' : '') + '"><div><button class="an-ad"><b>' + ad + '</b>' + ik('info-circle') + '</button><span class="an-meta">' + meta + '</span></div><div class="an-setler">' + s + '</div></div>';
    return '<div class="an-hr' + (o.ara ? ' ara' : '') + '"><button class="an-ad"><b>' + ad + '</b>' + ik('info-circle') + '</button>' +
      '<span class="an-meta">' + (o.uyari ? '<span class="an-etiket">⚠ ' + o.uyari + '</span> ' : '') + meta + '</span><div class="an-setler">' + s + '</div>' + (o.duzen || '') + '</div>';
  }
  const duzen = (n, v) => '<div class="an-duzen"><span>' + n + '. set</span><div class="adim" role="group" aria-label="Tekrar"><button aria-label="Azalt">' + ik('minus') + '</button><span class="adim-deger"><b>' + v + '</b></span><button aria-label="Artır">' + ik('plus') + '</button></div><button class="an-sil" aria-label="Seti sil">' + ik('trash') + '</button></div>';
  const bas = '<header class="ekran-ust"><h1>Antrenman</h1></header>';
  const altDugmeler = (bitir) => '<div class="an-alt"><button class="ikinci-dugme">' + ik('clock') + 'Minimum gün</button><button class="ikinci-dugme">' + ik('arrow-back-up') + 'Yarına kaydır</button></div>' +
    '<button class="ana-dugme ince">' + ik('flag') + bitir + '</button>';

  function menu(acik) {
    document.querySelectorAll('.alt-menu .sekme').forEach(b => { b.classList.remove('acik'); b.removeAttribute('aria-current'); });
    const b = document.querySelector('.alt-menu [data-yakinda="Antrenman"], .alt-menu [data-ekran="' + acik + '"]');
    if (acik === 'antrenman') { const a = document.querySelector('.alt-menu [data-yakinda="Antrenman"]'); a.classList.add('acik'); a.setAttribute('aria-current', 'page'); a.querySelector('use').setAttribute('href', '#t-barbell-dolu'); }
  }

  const UST = {
    ad: 'Üst vücut', alt: 'Cuma · 3 set dönemi',
    kademe: '<div class="kademe dikkat"><i aria-hidden="true"></i><span><b>Sağ dirsek 3</b> · zorlayan hareketleri hafiflet</span></div>',
    isinma: ['Çene içeri çekme|1 × 10|10', 'Kedi-deve|1 × 6|6', 'Duvar meleği|1 × 8|8', 'Kalça köprüsü, hafif|1 × 10|10'],
  };
  function ustGun(o) {
    o = o || {};
    let h = bas + hafta(4, ['✅', '✅', '✅', '✅', '', '', '']) + ust(UST.ad, UST.alt, 5, 14, UST.kademe);
    h += '<div class="bolum-baslik">Isınma · 4 / 4</div><section class="kart an-kart">' +
      UST.isinma.map(x => { const p = x.split('|'); return hr(p[0], p[1], [+p[2]], { tek: 1 }); }).join('') + '</section>';
    h += '<div class="bolum-baslik">Ana hareketler</div><section class="kart an-kart">' +
      hr('Eğimli şınav', '3 × 8–12 · 90 sn · Geçen: <i>12 · 10 · 8</i>', [12, 10, { h: 8 }], { secili: o.duzen ? 1 : -1, duzen: o.duzen ? duzen(2, 10) : '' }) +
      hr('Masa altı çekiş', '3 × 6–10 · 90 sn · Geçen: <i>10 · 8 · 6</i>', [8, { h: 6 }, { h: 6 }], { uyari: 'hafiflet' }) +
      hr('Diz üstü şınav', '2 × gücünün 2 eksiği · 90 sn · Geçen: <i>8 · 7</i>', [{ h: 8 }, { h: 7 }]) +
      hr('Dar eğimli şınav', '2 × 8–10 · 60 sn · Geçen: <i>10 · 10</i>', [{ h: 8 }, { h: 8 }], { uyari: 'hafiflet' }) +
      hr('Y-T kaldırma', '2 × 10 Y + 10 T · 60 sn', [{ h: 10 }, { h: 10 }]) +
      hr('Dış rotasyon, her kol', '2 × 12 · 60 sn · 0,5 L şişe', [{ h: 12 }, { h: 12 }]) + '</section>';
    h += altDugmeler('Antrenmanı bitir');
    $('#uygulama').innerHTML = h; menu('antrenman');
  }
  function altGun() {
    let h = bas + hafta(5, ['✅', '✅', '✅', '✅', '✅', '', '']) +
      ust('Alt vücut + gövde', 'Cumartesi · 2 set dönemi', 0, 8,
        '<div class="kademe ara"><i aria-hidden="true"></i><span><b>Sağ kasık 5</b> · bu bölgeye bugün ara</span></div>');
    h += '<div class="bolum-baslik">Ana hareketler</div><section class="kart an-kart">' +
      hr('Sandalyeye oturup kalkma', '2 × 10–12 · 90 sn · Geçen: <i>10 · 10</i>', [{ h: 10 }, { h: 10 }]) +
      hr('Basamak çıkma, her bacak', '2 × 8 · 90 sn', [{ h: 8 }, { h: 8 }], { ara: 1, uyari: 'bugün ara' }) +
      hr('Kalça köprüsü', '2 × 12–15 · 60 sn · Geçen: <i>12 · 12</i>', [{ h: 12 }, { h: 12 }]) +
      hr('Yan yatarak bacak kaldırma', '2 × 12 · 60 sn', [{ h: 12 }, { h: 12 }], { ara: 1, uyari: 'bugün ara' }) +
      hr('Kuş-köpek, her taraf', '2 × 6 · 60 sn', [{ h: 6 }, { h: 6 }], { ara: 1, uyari: 'bugün ara' }) +
      hr('Yan plank, dizden', '2 × 20–30 sn · 60 sn · Geçen: <i>20 · 20</i>', [{ h: 20 }, { h: 20 }], { sn: 1 }) +
      hr('Ölü böcek, her taraf', '2 × 6 · 60 sn', [{ h: 6 }, { h: 6 }]) + '</section>';
    h += altDugmeler('Antrenmanı bitir');
    $('#uygulama').innerHTML = h; menu('antrenman');
  }
  function rutin() {
    let h = bas + hafta(3, ['✅', '✅', '✅', '', '', '', '']) + ust('Günlük rutin', 'Perşembe · 10 dk', 3, 7, '', 'hareket');
    h += '<section class="kart an-kart" style="margin-top:12px">' +
      hr('Çene içeri çekme', '1 × 10', [10], { tek: 1 }) + hr('Kedi-deve', '1 × 6', [6], { tek: 1 }) + hr('Duvar meleği', '1 × 8', [8], { tek: 1 }) +
      hr('Kalça önü esnetme, her taraf', '30 sn', [{ h: 30 }], { tek: 1 }) + hr('Ölü böcek, her taraf', '1 × 6', [{ h: 6 }], { tek: 1 }) +
      hr('Kuş-köpek, her taraf', '1 × 6', [{ h: 6 }], { tek: 1 }) + hr('Kalça köprüsü', '1 × 10', [{ h: 10 }], { tek: 1 }) + '</section>';
    h += '<button class="ana-dugme ince">' + ik('flag') + 'Rutini bitir</button>';
    $('#uygulama').innerHTML = h; menu('antrenman');
  }
  function haftaOzet() {
    let h = bas + hafta(6, ['✅', '✅', '✅', '✅', '✅', '🟠', '']) +
      '<section class="kart hf-kart"><h3>Haftanın özeti</h3><small>16–22 Kasım</small><ul class="hf-liste">' +
      '<li><em>✅</em><span>Güç günü <b>4</b><small>en az 3</small></span></li>' +
      '<li><em>✅</em><span>Düşük gün <b>1</b><small>en fazla 2 · uyku ya da protein</small></span></li>' +
      '<li><em>✅</em><span><b>Üst vücut</b> → tekrar dönemine geç<small>en yüksek ağrı 3 · sınır 3</small></span></li>' +
      '<li><em>⚠️</em><span><b>Alt vücut</b> → aynı dönemde kal<small>sağ kasık 5 · sınır 3</small></span></li>' +
      '</ul><div class="hf-dugmeler"><button class="ikinci-dugme">Değiştir</button><button class="ana-dugme ince">Tamam</button></div></section>';
    h += ust('Günlük rutin', 'Pazar · 10 dk', 0, 7, '', 'hareket');
    $('#uygulama').innerHTML = h; menu('antrenman');
  }

  function pencere(baslik, ic, kucuk) {
    const p = $('#pencere');
    p.classList.toggle('sabit', !kucuk);
    p.innerHTML = '<div class="pencere-bas"><div class="tutamac" aria-hidden="true"></div><div class="pencere-ust"><h2 id="pencere-baslik">' + baslik + '</h2><button class="kapat" id="kapat" aria-label="Kapat">' + ik('x') + '</button></div></div><div id="pencere-ic">' + ic + '</div>';
    p.hidden = false; $('#perde').hidden = false; document.body.style.overflow = 'hidden'; p.scrollTop = 0;
  }
  function nasil() {
    pencere('Masa altı çekiş',
      '<div class="nasil"><p class="nasil-alt">Inverted Row · 3 × 6–10 · 90 sn</p><div class="nasil-bolge"><span class="etiket">sırt</span><span class="etiket">omuz</span><span class="etiket">dirsek</span></div><dl>' +
      '<dt>Başla</dt><dd>Önce masanın sağlam olduğunu kontrol et. Altına sırtüstü gir, göğsün masa kenarının altında olsun. Kenarı omuz genişliğinde tut, dizlerin bükük.</dd>' +
      '<dt>Yap</dt><dd>Önce kürek kemiklerini birbirine yaklaştır, sonra nefes vererek göğsünü masaya çek. Yavaşça in, kolların tam uzasın.</dd>' +
      '<dt>Hisset</dt><dd>Sırtının ortasında, kürek kemiklerinin arasında ve önkolunda.</dd>' +
      '<dt>Kolaylaştır</dt><dd>Ayaklarını kalçana yaklaştır. Yine zorsa yarım yol çek.</dd>' +
      '<dt>Dikkat</dt><dd class="dikkat-dd"><b>⚠ Açık not: sağ dirsek 3.</b> Kalçan sarkmasın. Çeneni uzatıp masaya ulaşmaya çalışma, göğsün yaklaşsın.</dd></dl></div>');
  }
  function bitir(evet, formHtml) {
    let ic = '<ul class="bitir-ozet"><li><span>Isınma</span><b>4 / 4</b></li><li><span>Ana hareketler</span><b>14 / 14 set</b></li></ul>' +
      '<p class="bitir-soru">Antrenmanda ağrı oldu mu?</p><div class="cipler"><button class="cip' + (evet ? '' : ' secili') + '">Hayır</button><button class="cip' + (evet ? ' secili' : '') + '">Evet</button></div>';
    if (evet) {
      ic += '<div class="bolum-baslik" style="margin-top:14px">Ağrı notu</div>' + formHtml.replace(/<h3[^>]*>Yeni not<\/h3>/, '');
    } else ic += '<div class="alt-dugme"><button class="ana-dugme">Bitir ve kaydet</button></div>';
    pencere('Antrenmanı bitir', ic, false);
    if (evet) {
      const t = $('#n-tur').closest('.secim-kutu'); t.outerHTML = '<b class="an-sabit">Antrenman kaynaklı</b>';
      $('#n-hareket').value = 'Masa altı çekiş';
      const r = $('#siddet'); r.value = 3;
      const y = r.closest('.surgu-yol'); y.style.setProperty('--o', .3); y.setAttribute('data-k', 'dikkat'); y.querySelector('.surgu-balon').textContent = '3';
      const k = $('#s-kademe'); k.className = 'kademe dikkat'; k.querySelector('span').textContent = 'Antrenman yapılabilir; bu bölgeyi zorlayan hareketleri hafiflet.';
      $('#n-kaydet').textContent = 'Bitir ve kaydet';
    }
  }
  function bugunGosterge() {
    const b = document.getElementById('antrenman-dugme'); if (!b) return;
    b.querySelector('small').innerHTML = '<i>8</i> / 14 set';
    if (!b.querySelector('.cubuk')) b.insertAdjacentHTML('beforeend', '<span class="cubuk" aria-hidden="true"><span style="width:57%;background:var(--antrenman)"></span></span>');
  }
  function kapat() { $('#pencere').hidden = true; $('#perde').hidden = true; document.body.style.overflow = ''; }
  return { ustGun, altGun, rutin, haftaOzet, nasil, bitir, bugunGosterge, kapat };
})();
