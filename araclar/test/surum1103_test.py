"""1.10.3 işlev testi: fazladan set, kısa ad, yarım porsiyon, aşağı çekip kapatma, + düğmesi, İlerleme iskeleti,
kaldığın yerden devam, dosyaların telefonda saklanması (sw.js).
Çalıştırma: ORNEK_ANT=1 node araclar/test/sahte.js . 8771 &  →  python3 -I araclar/test/surum1103_test.py 8771 /tmp/t1103
"""
import asyncio, sys, os, re
from playwright.async_api import async_playwright
import os as _o; exec(open(_o.path.join(_o.path.dirname(_o.path.abspath(__file__)), 'yazitipi.py'), encoding='utf-8').read())
PORT, CIKTI = sys.argv[1], sys.argv[2]; os.makedirs(CIKTI, exist_ok=True)
sonuc = []
def kontrol(ad, kosul, ayr=''):
    sonuc.append(('✅' if kosul else '❌') + ' ' + ad + ('' if kosul else ' · ' + str(ayr)))

CEK = """(dy) => new Promise(son => {  // başlık bölgesinden parmakla aşağı çekme
  const p = document.getElementById('pencere'), el = p.querySelector('.pencere-bas h2') || p.querySelector('.tutamac');
  const r = el.getBoundingClientRect(), x = r.left + 20, y = r.top + 10;
  const t = yy => new Touch({ identifier: 1, target: el, clientX: x, clientY: yy });
  el.dispatchEvent(new TouchEvent('touchstart', { touches: [t(y)], bubbles: true, cancelable: true }));
  let i = 0; const adim = () => { i++; el.dispatchEvent(new TouchEvent('touchmove', { touches: [t(y + dy * i / 8)], bubbles: true, cancelable: true }));
    if (i < 8) setTimeout(adim, 40); else { el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(y + dy)], bubbles: true })); setTimeout(son, 450); } };
  setTimeout(adim, 40);
})"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        c = await b.new_context(viewport={'width': 360, 'height': 780}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce')
        await yazi_tipi(c)
        pg = await c.new_page(); hata = []; pg.on('pageerror', lambda e: hata.append(str(e)))
        await pg.clock.set_fixed_time('2026-11-19T13:20:00+03:00')
        await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1300)
        async def foto(ad): await pg.wait_for_timeout(350); await pg.screenshot(path=f'{CIKTI}/{ad}.png')
        async def bekle(ms=350): await pg.wait_for_timeout(ms)

        # 1) Yarım porsiyon: adet ölçüsü de 0,5 artar
        await pg.tap('.ogun-kart [data-ekle]'); await bekle(500)
        await pg.fill('#arama', 'yumurta'); await bekle(400)
        await pg.tap('#sonuclar [data-sec] >> nth=0'); await bekle(300)
        o1 = await pg.inner_text('#sonuclar .sofrada .adim-deger >> nth=0')
        await pg.tap('#sonuclar .sofrada [data-art] >> nth=0'); await bekle(200)
        o2 = await pg.inner_text('#sonuclar .sofrada .adim-deger >> nth=0')
        await pg.tap('#sonuclar .sofrada [data-az] >> nth=0'); await pg.tap('#sonuclar .sofrada [data-az] >> nth=0'); await bekle(200)
        o3 = await pg.inner_text('#sonuclar .sofrada .adim-deger >> nth=0')
        kontrol('Yarım porsiyon: adet 1 → 1,5 → 0,5', o1.strip() == '1' and o2.strip() == '1,5' and o3.strip() == '0,5', [o1, o2, o3])
        await foto('01-yarim')

        # 2) Aşağı çekip kapatma: azı yerine döner, 100 px üstü kapatır
        await pg.evaluate(CEK, 60); acik = await pg.evaluate("!document.getElementById('pencere').hidden")
        kontrol('Az çekince pencere yerine döner', acik)
        await pg.evaluate(CEK, 200); await bekle(300)
        kontrol('Aşağı çekince pencere kapanır', await pg.evaluate("document.getElementById('pencere').hidden"))
        kontrol('Kapanınca kayma stili temizlendi', await pg.evaluate("document.getElementById('pencere').style.transform === ''"))
        await pg.tap('#profil-dugme'); await bekle(500); await pg.evaluate(CEK, 200); await bekle(300)
        kontrol('Profil menüsü de aşağı çekilerek kapanır', await pg.evaluate("document.getElementById('pencere').hidden"))

        # 3) + düğmesi tam yuvarlak (360 px)
        await pg.tap('[data-ekran=mutfak]'); await bekle(500)
        r = await pg.evaluate("(()=>{const r=document.querySelector('#m-yeni').getBoundingClientRect(); return [r.width, r.height, getComputedStyle(document.querySelector('#m-yeni')).borderRadius];})()")
        kontrol('Mutfak + düğmesi 44 × 44 yuvarlak', abs(r[0] - 44) < 0.5 and abs(r[1] - 44) < 0.5, r)

        # 4) Klavye açıkken alt menü gizli (ana ekran araması)
        await pg.tap('#m-ara'); await bekle(300)
        kontrol('Mutfak aramasında alt menü gizli', await pg.evaluate("getComputedStyle(document.querySelector('.alt-menu')).display === 'none'"))
        await pg.evaluate("document.activeElement.blur()"); await bekle(300)
        kontrol('Kutudan çıkınca alt menü geri geldi', await pg.evaluate("getComputedStyle(document.querySelector('.alt-menu')).display !== 'none'"))

        # 5) Fazladan set: boş eklenen daire hedefi büyütmez, silinince daire de kalkar
        await pg.tap('[data-ekran=antrenman]'); await bekle(600)
        await pg.tap('[data-a-gun="2026-11-19"]'); await bekle(400)
        await pg.tap('[data-a-sec-ant] >> nth=0'); await bekle(500)
        def sayac(): return pg.inner_text('main .an-sayi')
        bas = await sayac()
        ilk = pg.locator('.an-hr').nth(1)
        daire = await ilk.locator('.an-set:not(.ekle)').count()
        await ilk.locator('.an-set.ekle').tap(); await bekle(250)
        s1 = await sayac(); d1 = await ilk.locator('.an-set:not(.ekle)').count()
        kontrol('Boş eklenen set hedefi büyütmez', s1 == bas and d1 == daire + 1, [bas, s1, daire, d1])
        await ilk.locator('.an-set:not(.ekle):not(.tamam)').last.tap(); await bekle(250)
        s2 = await sayac(); await foto('02-fazla-set')
        nb = [int(x) for x in re.findall(r'\d+', bas)]; n2 = [int(x) for x in re.findall(r'\d+', s2)]
        kontrol('Fazladan set yapılınca yapılan ve hedef birlikte artar', n2[0] == nb[0] + 1 and n2[1] == nb[1] + 1, [bas, s2])
        await ilk.locator('.an-set.tamam').last.tap(); await bekle(250)
        await pg.tap('[data-a-set-sil]'); await bekle(300)
        s3 = await sayac(); d3 = await ilk.locator('.an-set:not(.ekle)').count()
        kontrol('Fazladan set silinince daire de kalkar, sayaç eski haline döner', s3 == bas and d3 == daire, [bas, s3, daire, d3])
        await foto('03-set-silindi')

        # 6) Kısa ad
        await pg.tap('[data-a-sekme=program]'); await bekle(400)
        await pg.tap('[data-a-ant-duzenle] >> nth=0'); await bekle(400)
        kontrol('Antrenman düzenlemede Kısa ad alanı var', await pg.is_visible('#a-kad'))
        await pg.fill('#a-kad', 'Rutin'); await foto('04-kisa-ad')
        await pg.tap('#a-tamam'); await bekle(600)
        h = await pg.inner_text('.t2-hafta'); kontrol('Haftalık tabloda kısa ad görünür', 'Rutin' in h, h)
        await bekle(1500)
        import json
        t = json.loads(await pg.evaluate("fetch('/_tablo?ad=Antrenmanlar').then(r=>r.text())"))
        i = t[0].index('Kısa ad') if 'Kısa ad' in t[0] else -1
        kontrol('Kısa ad tabloya yazıldı', i >= 0 and any(len(r) > i and r[i] == 'Rutin' for r in t[1:]), t[:2])
        await foto('05-hafta-tablo')

        # 6b) 1.10.4: başka ekrana gidip dönünce iki sekme de en üstten başlar; aynı ekranda sekme değişirken kaldığı yer korunur
        await pg.tap('[data-ekran=mutfak]'); await bekle(500)
        await pg.tap('[data-m-sekme=tarif]'); await bekle(300); await pg.evaluate("window.scrollTo(0, 400)"); await bekle(200)
        await pg.tap('[data-m-sekme=besin]'); await bekle(300); await pg.evaluate("window.scrollTo(0, 900)"); await bekle(200)
        await pg.tap('[data-m-sekme=tarif]'); await bekle(300); y1 = await pg.evaluate('scrollY')
        kontrol('Aynı ekranda sekmeye dönünce kaldığı yer korunur', abs(y1 - 400) < 40 or not await pg.evaluate('document.body.scrollHeight > innerHeight + 400'), y1)
        await pg.tap('[data-ekran=antrenman]'); await bekle(500); await pg.tap('[data-ekran=mutfak]'); await bekle(500)
        y2 = await pg.evaluate('scrollY'); await pg.tap('[data-m-sekme=besin]'); await bekle(300); y3 = await pg.evaluate('scrollY')
        kontrol('Başka ekrandan dönünce iki sekme de en üstten başlar', y2 < 5 and y3 < 5, [y2, y3])
        await pg.tap('[data-ekran=antrenman]'); await bekle(500); await pg.tap('[data-a-sekme=program]'); await bekle(400)
        kontrol('Kaldığın yer doğru adla saklanıyor', await pg.evaluate("(window.dispatchEvent(new Event('pagehide')), !!localStorage.getItem('zindem-konum') && !localStorage.getItem('[object Object]'))"))

        # 7) Kaldığın yerden devam: Antrenman › Programım → yeniden aç
        await pg.evaluate("window.dispatchEvent(new Event('pagehide'))")
        await pg.reload(); await pg.wait_for_selector('.m-ust, .ozet-kart'); await bekle(1300)
        kontrol('Yeniden açınca Antrenman › Programım açık', await pg.is_visible('.t2-hafta') and await pg.evaluate("document.querySelector('.alt-menu .acik').getAttribute('data-ekran')") == 'antrenman')
        await foto('06-devam')

        # 8) Dosyalar telefonda (sw.js): ikinci açılışta stil ve kod telefondan
        await pg.evaluate("navigator.serviceWorker.ready"); await bekle(500)
        gelen = {}
        pg.on('response', lambda r: gelen.__setitem__(r.url.split('/')[-1], r.from_service_worker))
        await pg.reload(); await pg.wait_for_selector('.m-ust, .ozet-kart'); await bekle(1500)
        kontrol('Stil ve kod telefondan geldi', gelen.get('stil.css?v=31') and gelen.get('uygulama.js?v=28'), {k: v for k, v in gelen.items() if '?v=' in k})
        kontrol('Veri isteği telefondan gelmedi', not any(v for k, v in gelen.items() if 'gun=' in k), [k for k, v in gelen.items() if v])

        # 9) İlerleme iskeleti ve açılış ölçümü
        await pg.tap('[data-ekran=ilerleme]')
        kontrol('İlerleme yüklenirken iskelet görünür', await pg.is_visible('.iskelet'))
        await pg.wait_for_selector('.il-kart, .il-basla'); await bekle(300)
        await pg.tap('.ekran-ust [data-profil]'); await bekle(400); await pg.tap('#pm-ayarlar'); await bekle(400); await pg.tap('#a-veri'); await bekle(800)
        v = await pg.inner_text('#pencere'); kontrol('Veri ve hesap: son açılış süresi', 'Toplam' in v and 'sunucu' in v, v[-300:])
        await pg.evaluate("document.getElementById('pencere').scrollTop = 99999"); await foto('07-acilis-suresi')
        # 10) Aşağı çekince titreme yok: bırakınca açılış animasyonu yeniden oynamamalı (hareket azaltma kapalıyken)
        c2 = await b.new_context(viewport={'width': 360, 'height': 780}, is_mobile=True, has_touch=True, locale='tr-TR', timezone_id='Europe/Istanbul')
        p2 = await c2.new_page()
        await p2.goto(f'http://localhost:{PORT}/#k=x'); await p2.wait_for_selector('.ozet-kart'); await p2.wait_for_timeout(1300)
        IZLE = """() => { window.__anim = []; const p = document.getElementById('pencere');
          p.addEventListener('animationstart', e => window.__anim.push(e.animationName)); }"""
        for dy, ad in [(60, 'yerine dönerken'), (200, 'kapanırken')]:
            await p2.tap('.ogun-kart [data-ekle]'); await p2.wait_for_timeout(600)
            await p2.evaluate(IZLE); await p2.evaluate(CEK, dy); await p2.wait_for_timeout(300)
            a = await p2.evaluate('window.__anim')
            kontrol(f'Aşağı çekme {ad} pencere titremiyor', 'yukari' not in a, a)
            await p2.evaluate("(()=>{const k=document.getElementById('kapat'); if(k) k.click();})()"); await p2.wait_for_timeout(500)
        await c2.close()
        for x in hata: kontrol('JS hatası yok', False, x[:160])
        await b.close()
    print('\n'.join(sonuc)); print(f"{sum(1 for x in sonuc if x[0]=='✅')}/{len(sonuc)} geçti")
    sys.exit(0 if all(x[0] == '✅' for x in sonuc) else 1)
asyncio.run(main())
