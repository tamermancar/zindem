/* Antrenman taslağı 2: herkes için baştan sona yolculuk. Gerçek uygulamanın içine örnek veriyle çizilir. */
window.T2 = (function () {
  const ik = (n, c) => '<svg class="ikon ' + (c || '') + '" aria-hidden="true"><use href="#t-' + n + '"/></svg>';
  const $ = s => document.querySelector(s);
  let SERIT = '';
  function seritAl() { const s = document.getElementById('serit'); if (s) SERIT = s.outerHTML; }

  function menu() {
    document.querySelectorAll('.alt-menu .sekme').forEach(b => { b.classList.remove('acik'); b.removeAttribute('aria-current'); });
    const a = document.querySelector('.alt-menu [data-yakinda="Antrenman"]');
    a.classList.add('acik'); a.setAttribute('aria-current', 'page'); a.querySelector('use').setAttribute('href', '#t-barbell-dolu');
  }
  function ust(sekme, sag, ek) {
    const s = ['Bugün', 'Programım', 'Hareketler'];
    return '<div class="m-ust"><header class="ekran-ust"><h1>Antrenman</h1>' + (sag || '') + '</header>' +
      '<div class="grup-cipler m-sekmeler" role="tablist" aria-label="Antrenman">' + s.map((x, i) => '<button class="sekme-ciz' + (i === sekme ? ' secili' : '') + '" role="tab" aria-selected="' + (i === sekme) + '">' + x + '</button>').join('') + '</div>' + (ek ? '<div class="t2-ek">' + ek + '</div>' : '') + '</div>';
  }
  function ciz(h) { $('#uygulama').innerHTML = h; menu(); window.scrollTo(0, 0); }
  function pencere(baslik, ic, o) {
    o = o || {};
    const p = $('#pencere');
    p.classList.toggle('sabit', !o.kucuk);
    p.innerHTML = '<div class="pencere-bas"><div class="tutamac" aria-hidden="true"></div><div class="pencere-ust">' + (o.geri ? '<button class="geri">' + ik('chevron-left') + o.geri + '</button>' : '') +
      '<h2 id="pencere-baslik">' + baslik + '</h2>' + (o.sag || '') + '<button class="kapat" id="kapat" aria-label="Kapat">' + ik('x') + '</button></div>' + (o.bas || '') + '</div><div id="pencere-ic">' + ic + '</div>';
    p.hidden = false; $('#perde').hidden = false; document.body.style.overflow = 'hidden'; p.scrollTop = 0;
  }
  function kapat() { $('#pencere').hidden = true; $('#perde').hidden = true; document.body.style.overflow = ''; }

  // ---------- 1. Boş durum ----------
  function bos() {
    ciz(ust(0) + '<section class="kart t2-bos">' +
      '<span class="t2-bos-ikon">' + ik('barbell') + '</span>' +
      '<h2>Henüz bir programın yok</h2>' +
      '<p>Kendi programını kur ya da hazır bir programla başla.</p>' +
      '<button class="ana-dugme">' + ik('plus') + 'Kendi programını oluştur</button>' +
      '<button class="ikinci-dugme">Hazır program seç</button>' +
      '<button class="metin-dugme orta">Hareketlere göz at ' + ik('chevron-right') + '</button></section>' +
      '<div class="bolum-baslik">Hazır programlar</div><section class="kart an-kart">' +
      hazir('Yeni başlayan · tüm vücut', 'Haftada 3 gün · ekipmansız · 25 dk') +
      hazir('Oturarak güç', 'Haftada 3 gün · sandalye · 20 dk') +
      hazir('Güç ve denge', 'Haftada 2 gün · destekli · 20 dk · 65+') +
      hazir('Evde lastikle', 'Haftada 3 gün · direnç lastiği · 30 dk') + '</section>');
  }
  const hazir = (a, b) => '<button class="t2-satir"><span><b>' + a + '</b><small>' + b + '</small></span>' + ik('chevron-right') + '</button>';

  // ---------- 2. Tanışma ----------
  function tanisma(adim) {
    const bas = '<div class="t2-adimlar" aria-label="' + adim + '. adım, 4 adımdan">' + [1, 2, 3, 4].map(i => '<span class="' + (i <= adim ? 'dolu' : '') + '"></span>').join('') + '</div>';
    let ic = '';
    if (adim === 2) {
      ic = '<p class="t2-soru">Elinde neler var?</p><p class="t2-not">Sadece bunlarla yapılabilen hareketler gösterilir.</p><div class="cipler">' +
        ['Ekipman yok|1', 'Sandalye|1', 'Mat|1', 'Direnç lastiği', 'Dambıl', 'Barfiks demiri', 'Basamak / tabure|1', 'Salon makineleri'].map(x => { const p = x.split('|'); return '<button class="cip' + (p[1] ? ' secili' : '') + '">' + p[0] + '</button>'; }).join('') + '</div>';
    } else if (adim === 3) {
      ic = '<p class="t2-soru">Nasıl hareket ediyorsun?</p><ul class="t2-secim">' +
        [['Ayakta rahatım', 'Ayakta, yerde ve oturarak bütün hareketler', 1], ['Dengede zorlanıyorum', 'Ayakta hareketler duvar ya da sandalye desteğiyle'],
         ['Oturarak', 'Sadece sandalyede ya da yatakta yapılan hareketler'], ['Tekerlekli sandalye', 'Belden yukarısı ve oturarak yapılan hareketler']]
          .map(x => '<li><button class="' + (x[2] ? 'secili' : '') + '" aria-pressed="' + !!x[2] + '"><span><b>' + x[0] + '</b><small>' + x[1] + '</small></span>' + (x[2] ? ik('check') : '') + '</button></li>').join('') + '</ul>';
    } else if (adim === 4) {
      ic = '<p class="t2-soru">Dikkat etmen gereken bir bölge var mı?</p><p class="t2-not">Bu bölgeyi zorlayan hareketler listede işaretlenir.</p><div class="cipler">' +
        ['Yok', 'Boyun', 'Omuz|1', 'Dirsek', 'El bileği', 'Sırt', 'Bel|1', 'Kalça', 'Kasık|1', 'Diz|1', 'Ayak bileği'].map(x => { const p = x.split('|'); return '<button class="cip' + (p[1] ? ' secili' : '') + '">' + p[0] + '</button>'; }).join('') + '</div>';
    }
    pencere('Seni tanıyalım', ic + '<div class="alt-dugme"><button class="ana-dugme">' + (adim === 4 ? 'Hareketleri göster' : 'Devam') + '</button></div>',
      { bas: bas, sag: '<button class="metin-dugme">Atla</button>' });
  }

  // ---------- 3. Hareketler ----------
  const HR = [
    ['Duvar şınavı', 'Göğüs · ekipmansız · ayakta', 'Başlangıç'],
    ['Eğimli şınav', 'Göğüs · tezgah ya da koltuk · ayakta', 'Başlangıç', 'Omuzu zorlar'],
    ['Masa altında çekiş', 'Sırt · sağlam masa · sırtüstü', 'Orta', 'Omuzu zorlar'],
    ['Sandalyeden kalkma', 'Bacak · sandalye · ayakta', 'Başlangıç', 'Dizi zorlar'],
    ['Köprü', 'Kalça · mat · sırtüstü', 'Başlangıç'],
    ['Kuş-köpek', 'Gövde · mat · dört ayak', 'Başlangıç'],
    ['Oturarak diz uzatma', 'Bacak · sandalye · oturarak', 'Başlangıç'],
    ['Destekli topuk kaldırma', 'Baldır · sandalye · ayakta', 'Başlangıç'],
    ['Sırt esnetme', 'Sırt · mat · dört ayak', 'Başlangıç', '', 'kedi-deve'],
  ];
  function hrSatir(x, ekle) {
    return '<div class="t2-hr"><button class="t2-hr-bilgi"><b>' + x[0] + '</b><small>' + (x[4] ? x[4] + ' · ' : '') + x[1] + '</small>' +
      (x[3] ? '<span class="an-etiket">' + ik('alert-triangle') + x[3] + '</span>' : '') + '</button>' +
      (ekle === 'var' ? '<button class="t2-ekle eklendi" aria-label="' + x[0] + ' eklendi">' + ik('check') + '</button>' : '<button class="t2-ekle" aria-label="' + x[0] + ' ekle">' + ik('plus') + '</button>') + '</div>';
  }
  function filtreler() {
    return '<div class="t2-filtre"><button class="cip secili">Bana uygun</button><button class="cip t2-acilir">Bölge ' + ik('chevron-down') + '</button><button class="cip t2-acilir">Pozisyon ' + ik('chevron-down') + '</button><button class="cip t2-acilir">Seviye ' + ik('chevron-down') + '</button></div>';
  }
const ara = (y) => '<div class="arama-kutu">' + ik('search', 'arama-ikon') + '<label class="gizli-yazi" for="h-ara">Hareket ara</label><input id="h-ara" class="arama" type="search" placeholder="' + y + '" autocomplete="off"></div>';
  function hareketler() {
    ciz(ust(2, '<button class="ekle-dugme">' + ik('plus') + 'Kendi hareketin</button>', ara('Hareket ara') + filtreler()) +
      '<div class="bolum-baslik">124 hareket · sana uygun</div><section class="kart an-kart">' + HR.map(x => hrSatir(x)).join('') + '</section>');
  }
  function detay() {
    pencere('Sandalyeden kalkma',
      '<div class="nasil"><p class="nasil-alt">Bilinen adı: chair squat · Başlangıç</p><div class="nasil-bolge"><span class="etiket">bacak</span><span class="etiket">kalça</span><span class="etiket">sandalye</span><span class="etiket">ayakta</span></div>' +
      '<div class="t2-uyari">' + ik('alert-triangle') + '<span><b>Dizi zorlar.</b> Diz bölgesini dikkat edilecek bölge olarak seçtin.</span></div><dl>' +
      '<dt>Başla</dt><dd>Sandalyenin önünde dur. Ayakların omuz genişliğinde, parmak uçların hafif dışa baksın.</dd>' +
      '<dt>Yap</dt><dd>Kalçanı geriye göndererek 3 saniyede otur. Topuklarından basarak kalk, tepede kalçanı sık.</dd>' +
      '<dt>Hisset</dt><dd>Uyluğunun önünde ve kalçanda.</dd>' +
      '<dt>Kolaylaştır</dt><dd>Sandalyeye yastık koy ya da kalkarken ellerinle dizlerinden destek al.</dd>' +
      '<dt>Zorlaştır</dt><dd>Elinde iki dolu su şişesi tut ya da inişi 4 saniyeye çıkar.</dd>' +
      '<dt>Dikkat</dt><dd>Dizlerin içe kapanmasın, ayak parmaklarınla aynı yöne baksın.</dd></dl>' +
      '<p class="t2-kaynak">Kaynak: free-exercise-db · NHS</p></div><div class="alt-dugme"><button class="ana-dugme">' + ik('plus') + 'Programa ekle</button></div>');
  }
  function kendiHareket() {
    pencere('Kendi hareketin',
      '<div class="form-alan"><label for="k-ad">Hareketin adı</label><input id="k-ad" type="text" value="Lastikle kürek çekme"></div>' +
      '<div class="form-alan"><span class="etiket-yazi">Nasıl kaydedilsin?</span><div class="cipler"><button class="cip secili">Tekrar</button><button class="cip">Süre</button><button class="cip">Ağırlık + tekrar</button></div></div>' +
      '<div class="form-alan"><span class="etiket-yazi">Çalışan bölge</span><div class="cipler"><button class="cip">Göğüs</button><button class="cip secili">Sırt</button><button class="cip">Omuz</button><button class="cip">Kol</button><button class="cip">Gövde</button><button class="cip">Kalça</button><button class="cip">Bacak</button></div></div>' +
      '<div class="form-alan"><span class="etiket-yazi">Ekipman</span><div class="cipler"><button class="cip">Yok</button><button class="cip secili">Direnç lastiği</button><button class="cip">Dambıl</button><button class="cip">Sandalye</button><button class="cip">Diğer</button></div></div>' +
      '<div class="form-alan"><span class="etiket-yazi">Pozisyon</span><div class="cipler"><button class="cip">Ayakta</button><button class="cip secili">Oturarak</button><button class="cip">Yerde</button></div></div>' +
      '<div class="form-alan"><span class="etiket-yazi">Zorladığı bölge (isteğe bağlı)</span><div class="cipler"><button class="cip secili">Omuz</button><button class="cip">Bel</button><button class="cip">Diz</button><button class="cip duz">Diğer…</button></div></div>' +
      '<div class="form-alan"><label for="k-not">Not ya da video bağlantısı (isteğe bağlı)</label><input id="k-not" type="text" placeholder="Ör. fizyoterapistimin verdiği hareket"></div>' +
      '<div class="alt-dugme"><button class="ana-dugme">Hareketlerime ekle</button></div>');
  }

  // ---------- 4. Program ----------
  const PLAN = [['Pzt', 'Üst vücut'], ['Sal', 'Rutin'], ['Çar', 'Alt vücut'], ['Per', 'Rutin'], ['Cum', 'Üst vücut'], ['Cmt', 'Alt vücut'], ['Paz', 'Dinlenme']];
  function programim() {
    ciz(ust(1) + '<section class="kart an-ust"><h2>Evde güç programım</h2><div class="an-ust-ust"><small>Haftada 4 gün · 5 Kasım\'dan beri</small></div>' +
      '<div class="t2-hafta">' + PLAN.map(x => '<div class="' + (x[1] === 'Dinlenme' ? 'dinlen' : '') + '"><small>' + x[0] + '</small><b>' + (x[1] === 'Dinlenme' ? '—' : x[1].split(' ')[0]) + '</b></div>').join('') + '</div>' +
      '<button class="ikinci-dugme">' + ik('pencil') + 'Programı düzenle</button></section>' +
      '<div class="bolum-baslik">Antrenmanlar</div><section class="kart an-kart">' +
      prSatir('Üst vücut', '6 hareket · 14 set · ~30 dk', 'Pazartesi, Cuma') + prSatir('Alt vücut', '7 hareket · 16 set · ~30 dk', 'Çarşamba, Cumartesi') +
      prSatir('Günlük rutin', '7 hareket · ~10 dk', 'Salı, Perşembe, Pazar') + '</section>' +
      '<button class="metin-dugme orta">' + ik('plus') + 'Yeni program</button>');
  }
  const prSatir = (a, b, c) => '<button class="t2-satir"><span><b>' + a + '</b><small>' + b + '</small><small>' + c + '</small></span>' + ik('chevron-right') + '</button>';
  function programDuzenle() {
    pencere('Programı düzenle',
      '<div class="form-alan"><label for="p-ad">Programın adı</label><input id="p-ad" type="text" value="Evde güç programım"></div>' +
      '<div class="bolum-baslik">Antrenmanlar</div><div class="t2-liste">' +
      ['Üst vücut|6 hareket · 14 set', 'Alt vücut|7 hareket · 16 set', 'Günlük rutin|7 hareket'].map(x => { const p = x.split('|'); return '<button class="t2-satir"><span><b>' + p[0] + '</b><small>' + p[1] + '</small></span>' + ik('chevron-right') + '</button>'; }).join('') +
      '<button class="metin-dugme vurgu">' + ik('plus') + 'Antrenman ekle</button></div>' +
      '<div class="bolum-baslik">Haftalık plan</div><div class="not-liste">' +
      [['Pazartesi', 'Üst vücut'], ['Salı', 'Günlük rutin'], ['Çarşamba', 'Alt vücut'], ['Perşembe', 'Günlük rutin'], ['Cuma', 'Üst vücut'], ['Cumartesi', 'Alt vücut'], ['Pazar', 'Dinlenme']]
        .map(x => '<div class="not-satir t2-plan"><label>' + x[0] + '</label><div class="secim-kutu"><select><option>' + x[1] + '</option></select>' + ik('chevron-down') + '</div></div>').join('') + '</div>' +
      '<div class="alt-dugme"><button class="ana-dugme">Kaydet</button></div>');
  }
  function antrenmanDuzenle() {
    const s = [['Isınma', ''], ['Çene içeri çekme', '1 set × 10 tekrar'], ['Kedi-deve', '1 set × 6 tekrar'], ['Ana hareketler', ''],
      ['Eğimli şınav', '3 set × 8–12 tekrar · 90 sn dinlenme'], ['Masa altında çekiş', '3 set × 6–10 tekrar · 90 sn dinlenme'], ['Diz üstü şınav', '2 set × 8 tekrar · 90 sn dinlenme'], ['Yan yatarak omuz döndürme', '2 set × 12 tekrar, her kol · 60 sn dinlenme']];
    pencere('Üst vücut',
      '<div class="form-alan"><label for="a-ad">Antrenmanın adı</label><input id="a-ad" type="text" value="Üst vücut"></div>' +
      s.map(x => x[1] ? '<div class="t2-duzen"><button class="t2-satir"><span><b>' + x[0] + '</b><small>' + x[1] + '</small></span>' + ik('chevron-right') + '</button></div>'
        : '<div class="bolum-baslik">' + x[0] + '</div>').join('') +
      '<button class="metin-dugme vurgu">' + ik('plus') + 'Hareket ekle</button>' +
      '<div class="alt-dugme"><button class="ana-dugme">Kaydet</button></div>', { geri: 'Program' });
  }
  function hareketAyar() {
    pencere('Eğimli şınav',
      '<div class="form-alan"><span class="etiket-yazi">Nasıl kaydedilsin?</span><div class="cipler"><button class="cip secili">Tekrar</button><button class="cip">Süre</button></div></div>' +
      sayac('Set', '3') + sayac('Tekrar, en az', '8') + sayac('Tekrar, en çok', '12') + sayac('Dinlenme', '90 sn') +
      '<div class="form-alan"><label for="h-not">Not (isteğe bağlı)</label><input id="h-not" type="text" placeholder="Ör. tezgahta yap"></div>' +
      '<button class="metin-dugme t2-sil">' + ik('trash') + 'Antrenmandan çıkar</button>' +
      '<div class="alt-dugme"><button class="ana-dugme">Tamam</button></div>', { geri: 'Üst vücut', kucuk: false });
  }
  const sayac = (a, v) => '<div class="t2-sayac"><span>' + a + '</span><div class="adim" role="group" aria-label="' + a + '"><button aria-label="Azalt">' + ik('minus') + '</button><span class="adim-deger"><b>' + v + '</b></span><button aria-label="Artır">' + ik('plus') + '</button></div></div>';
  function hareketSec() {
    pencere('Hareket ekle',
      '<section class="an-kart t2-duz">' + HR.slice(0, 7).map((x, i) => hrSatir(x, i === 1 ? 'var' : '')).join('') + '</section>' +
      '<button class="metin-dugme vurgu">' + ik('plus') + 'Listede yok, kendim ekleyeceğim</button>' +
      '<div class="alt-sabit t2-sepet"><span><b>1 hareket</b> seçildi</span><button class="ana-dugme ince">Ekle</button></div>',
      { geri: 'Üst vücut', bas: ara('Hareket ara') + filtreler() });
  }

  // ---------- 5. Gün ----------
  function hr(ad, meta, setler, o) {
    o = o || {};
    const s = setler.map((x, i) => typeof x === 'number'
      ? '<button class="an-set tamam' + (o.secili === i ? ' secili' : '') + '" aria-label="' + (i + 1) + '. set, ' + x + ' tekrar yapıldı">' + x + '</button>'
      : '<button class="an-set" aria-label="' + (i + 1) + '. set, hedef ' + x.h + '">' + x.h + '</button>').join('') +
      (o.tek ? '' : '<button class="an-set ekle" aria-label="Set ekle">' + ik('plus') + '</button>');
    const et = o.uyari ? '<span class="an-etiket">' + ik('alert-triangle') + o.uyari + '</span> ' : '';
    if (o.tek) return '<div class="an-hr tek"><div><button class="an-ad"><b>' + ad + '</b>' + ik('info-circle') + '</button><span class="an-meta">' + meta + '</span></div><div class="an-setler">' + s + '</div></div>';
    return '<div class="an-hr' + (o.ara ? ' ara' : '') + '"><button class="an-ad"><b>' + ad + '</b>' + ik('info-circle') + '</button><span class="an-meta">' + et + meta + '</span><div class="an-setler">' + s + '</div></div>';
  }
  function gun() {
    ciz(ust(0) + SERIT +
      '<section class="kart an-ust"><h2>Üst vücut</h2><div class="an-ust-ust"><small>Cuma · Evde güç programım</small><div class="an-sayi"><b>5</b><span> / 12 set</span></div></div>' +
      '<span class="an-cubuk" aria-hidden="true"><span style="width:42%"></span></span>' +
      '<div class="kademe dikkat"><i aria-hidden="true"></i><span><b>Sağ dirsek 3</b> · bu bölgeyi zorlayan hareketleri hafif yap</span></div>' +
      '<div class="kademe ara"><i aria-hidden="true"></i><span><b>Sağ el bileği 5</b> · bu bölgeye bugün ara ver</span></div></section>' +
      '<div class="bolum-baslik">Isınma · 2 / 2</div><section class="kart an-kart">' + hr('Çene içeri çekme', '1 × 10', [10], { tek: 1 }) + hr('Sırt esnetme', '1 × 6', [6], { tek: 1 }) + '</section>' +
      '<div class="bolum-baslik">Ana hareketler</div><section class="kart an-kart">' +
      hr('Eğimli şınav', '3 × 8–12 · 90 sn · Geçen: <i>12 · 10 · 8</i>', [12, 10, { h: 8 }]) +
      hr('Masa altında çekiş', '3 × 6–10 · 90 sn · Geçen: <i>10 · 8 · 6</i>', [8, { h: 6 }, { h: 6 }], { uyari: 'Hafif yap' }) +
      hr('Diz üstü şınav', '2 × 8 · 90 sn · Geçen: <i>8 · 7</i>', [{ h: 8 }, { h: 8 }], { uyari: 'Bugün ara ver', ara: 1 }) +
      hr('Yan yatarak omuz döndürme', '2 × 12, her kol · 60 sn', [{ h: 12 }, { h: 12 }]) + '</section>' +
      '<div class="an-alt"><button class="ikinci-dugme">' + ik('clock') + 'Kısa yap</button><button class="ikinci-dugme">' + ik('arrow-back-up') + 'Yarına kaydır</button></div>' +
      '<button class="ana-dugme ince">' + ik('flag') + 'Antrenmanı bitir</button>');
    seritSon();
  }
  function seritSon() { const s = document.getElementById('serit'); if (s) s.scrollLeft = s.scrollWidth; }
  function yarim() {
    pencere('Antrenmanı bitir',
      '<div class="t2-yarim"><b>7 / 12 set</b> işaretlendi</div><p class="t2-not" style="text-align:center">5 set işaretlenmedi. Ne yapalım?</p>' +
      '<ul class="t2-secim">' +
      '<li><button><span><b>Hepsini yaptım</b><small>İşaretlemeyi unuttum, kalan setler hedefle kaydedilsin</small></span></button></li>' +
      '<li><button class="secili" aria-pressed="true"><span><b>Yarım kaldı</b><small>Sadece işaretlediğim 7 set kaydedilsin</small></span>' + ik('check') + '</button></li>' +
      '<li><button><span><b>Antrenmana dön</b><small>Devam edeceğim</small></span></button></li></ul>' +
      '<p class="bitir-soru">Antrenmanda ağrı oldu mu?</p><div class="cipler"><button class="cip secili">Hayır</button><button class="cip">Evet</button></div>' +
      '<div class="alt-dugme"><button class="ana-dugme">Bitir ve kaydet</button></div>');
  }
  function haftaOzet() {
    ciz(ust(0) + SERIT + '<section class="kart hf-kart"><h3>Haftanın özeti</h3><small>16–22 Kasım</small><ul class="hf-liste">' +
      '<li><em class="ok">' + ik('circle-check') + '</em><span>Antrenman günü <b>4</b><small>hedef en az 3</small></span></li>' +
      '<li><em class="yarim">' + ik('alert-triangle') + '</em><span>Yarım kalan <b>1</b><small>Cumartesi · 9 / 16 set</small></span></li>' +
      '<li><em class="ok">' + ik('circle-check') + '</em><span><b>Üst vücut</b> · tekrarları artırmaya hazırsın<small>bütün setler hedefte · en yüksek ağrı 2</small></span></li>' +
      '<li><em class="yarim">' + ik('alert-triangle') + '</em><span><b>Alt vücut</b> · bir hafta daha aynı kal<small>sağ kasık ağrısı 5 · sınır 3</small></span></li>' +
      '</ul><div class="hf-dugmeler"><button class="ikinci-dugme">Değiştir</button><button class="ana-dugme ince">Tamam</button></div></section>'); seritSon();
  }
  return { seritAl, bos, tanisma, hareketler, detay, kendiHareket, programim, programDuzenle, antrenmanDuzenle, hareketAyar, hareketSec, gun, yarim, haftaOzet, kapat };
})();
