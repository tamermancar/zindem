"""1.11.2 işlev testi: çay/kahvenin şekeri ayrı kayıt ama içeceğe bağlı (Bağlı sütunu).
Ekle'de her içeceğin kendi şekeri, Bugün'de içeceğin altında, içecekle birlikte silinir/geri gelir/taşınır, düzenleme ekranında Şeker bölümü.
Çalıştırma: node araclar/test/sahte.js . 8775 &  →  python3 -I araclar/test/surum1112_test.py 8775 /tmp/t1112   (her çalıştırmadan önce sunucuyu yeniden başlat)
"""
import asyncio, sys, os, json, time, urllib.request, urllib.parse
from playwright.async_api import async_playwright
import os as _o; exec(open(_o.path.join(_o.path.dirname(_o.path.abspath(__file__)), 'yazitipi.py'), encoding='utf-8').read())
PORT, CIKTI = sys.argv[1], sys.argv[2]; os.makedirs(CIKTI, exist_ok=True)
sonuc = []
def kontrol(ad, kosul, ayr=''):
    sonuc.append(('✅' if kosul else '❌') + ' ' + ad + ('' if kosul else ' · ' + str(ayr)))
def bugun():
    time.sleep(1.3)
    with urllib.request.urlopen(f'http://localhost:{PORT}/_tablo?ad=' + urllib.parse.quote('Öğün Kayıtları')) as r: t = json.loads(r.read().decode())
    return [dict(zip(t[0], x)) for x in t[1:] if x[1] == '2026-11-21']
def ad(l, a): return [k for k in l if k['Ad'].startswith(a)]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        c = await b.new_context(viewport={'width': 360, 'height': 780}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce')
        await yazi_tipi(c)
        pg = await c.new_page(); hata = []; pg.on('pageerror', lambda e: hata.append(str(e)))
        await pg.clock.set_fixed_time('2026-11-21T08:10:00+03:00')
        await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1300)
        async def bekle(ms=350): await pg.wait_for_timeout(ms)
        async def foto(a): await bekle(); await pg.screenshot(path=f'{CIKTI}/{a}.png')
        async def ara(q): await pg.fill('#arama', q); await bekle(300)

        # 1) Ekle: çay (2 küp) ve kahve (1 küp) — her biri kendi şekeri
        await pg.tap('.ogun-kart [data-ekle]'); await bekle(500)
        await ara('çay'); await pg.tap('#sonuclar [data-sec] >> nth=0'); await bekle()
        await pg.tap('#sonuclar [data-seker]'); await bekle(); await pg.tap('#sonuclar .seker-satir [data-art]'); await bekle()
        await ara('kahve'); await pg.tap('#sonuclar [data-sec] >> nth=0'); await bekle()
        await pg.tap('#sonuclar [data-seker]'); await bekle()
        await ara('kahve')
        kontrol('Kahvenin şekeri ayrı: 1 küp (çayınki 1,5)', await pg.text_content('#sonuclar .seker-satir .adim-deger') == '1', await pg.text_content('#sonuclar .seker-satir .adim-deger'))
        t = bugun(); cay, kah, sek = ad(t, 'Çay')[0], ad(t, 'Türk kahvesi')[0], ad(t, 'Küp şeker')
        kontrol('Tabloda 2 küp şeker kaydı, her biri kendi içeceğine bağlı', len(sek) == 2 and {s.get('Bağlı') for s in sek} == {cay['ID'], kah['ID']}, [(s['Miktar'], s.get('Bağlı')) for s in sek])
        kontrol('Çayın şekeri 1,5 küp (1 + yarım adım)', any(s.get('Bağlı') == cay['ID'] and float(s['Miktar']) == 1.5 for s in sek))
        await ara('küp şeker')
        kontrol('Aramada "Küp şeker" bağlı şekerleri göstermez (+ ile ayrı eklenir)', await pg.locator('#sonuclar .sofrada').count() == 0)
        await pg.fill('#arama', ''); await pg.evaluate("document.activeElement.blur()"); await bekle()
        kontrol('Kahvaltıda bölümünde bağlı şeker yok', await pg.locator('#sonuclar [data-besin="t-kup-seker"]').count() == 0)
        await pg.tap('#oc-tamam'); await bekle(500)

        # 2) Bugün: şeker içeceğinin hemen altında, kesikli + içeriden
        sira = await pg.evaluate("[...document.querySelectorAll('.ogun-kart .kaydir')].map(k => (k.classList.contains('bagli') ? '>' : '') + k.querySelector('.bilgi b').textContent)")
        i = [x for x in sira if not x.startswith('>')]
        kontrol('Bugün: şeker kendi içeceğinin altında', all(sira[sira.index(n) + 1] == '>Küp şeker' for n in sira if n.startswith('Çay') or n.startswith('Türk kahvesi')), sira)
        await foto('01-bugun-bagli')

        # 3) Çayı hızlı sola çek → şekeri de silinir; Geri al ikisini getirir ve yeniden bağlar
        CEK = """(n) => new Promise(son => { const k = [...document.querySelectorAll('.ogun-kart .kaydir')].find(x => x.querySelector('.bilgi b').textContent.startsWith(n)).firstElementChild; k.scrollIntoView({ block: 'center' });
          const r = k.getBoundingClientRect(), x = r.right - 30, y = r.top + 20, h = document.elementFromPoint(x, y) || k;
          const ev = (t, xx) => h.dispatchEvent(new PointerEvent(t, { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: xx, clientY: y, bubbles: true, cancelable: true }));
          ev('pointerdown', x); let i = 0; const git = () => { i++; ev('pointermove', x - 300 * i / 3); if (i < 3) setTimeout(git, 12); else { ev('pointerup', x - 300); setTimeout(() => son(true), 600); } }; setTimeout(git, 12); })"""
        await pg.evaluate(CEK, 'Çay')
        t = bugun()
        kontrol('Çay silinince şekeri de silindi', not ad(t, 'Çay') and len(ad(t, 'Küp şeker')) == 1, [(k['Ad'], k.get('Bağlı')) for k in t])
        kontrol('Balon: "… ve şekeri silindi"', 've şekeri silindi' in await pg.inner_text('#bildirim'), await pg.inner_text('#bildirim'))
        await pg.tap('#bildirim-dugme'); await bekle(500)
        t = bugun(); cay = ad(t, 'Çay')
        kontrol('Geri al: çay ve şekeri döndü, şeker yeni çaya bağlı', cay and any(s.get('Bağlı') == cay[0]['ID'] and float(s['Miktar']) == 1.5 for s in ad(t, 'Küp şeker')), [(k['Ad'], k['Miktar'], k.get('Bağlı')) for k in t])

        # 4) Düzenleme ekranı: kahvede Şeker bölümü; kapat + kaydet → şeker silinir; Geri al geri getirir
        await pg.tap('.ogun-kart [data-kayit-duzelt]:has-text("Türk kahvesi")'); await bekle(500)
        kontrol('Düzenlemede Şeker bölümü, Şekerli seçili, 1 küp', await pg.get_attribute('#d-seker', 'aria-pressed') == 'true' and await pg.text_content('#pencere .seker-satir .adim-deger') == '1')
        await foto('02-duzenle-seker')
        await pg.tap('#pencere [data-art="d:seker"]'); await bekle()
        await pg.tap('#d-kaydet'); await bekle(600)
        t = bugun(); kah = ad(t, 'Türk kahvesi')[0]
        kontrol('Düzenle: şeker 1,5 küp oldu', any(s.get('Bağlı') == kah['ID'] and float(s['Miktar']) == 1.5 for s in ad(t, 'Küp şeker')), [(s['Miktar'], s.get('Bağlı')) for s in ad(t, 'Küp şeker')])
        await pg.tap('.ogun-kart [data-kayit-duzelt]:has-text("Türk kahvesi")'); await bekle(500)
        await pg.tap('#d-seker'); await bekle(); await pg.tap('#d-kaydet'); await bekle(600)
        t = bugun()
        kontrol('Düzenle: Şekerli kapatıldı → kahvenin şekeri silindi', not any(s.get('Bağlı') == kah['ID'] for s in ad(t, 'Küp şeker')))
        await pg.tap('#bildirim-dugme'); await bekle(600)
        t = bugun()
        kontrol('Geri al: kahvenin şekeri (1,5 küp) döndü', any(s.get('Bağlı') == kah['ID'] and float(s['Miktar']) == 1.5 for s in ad(t, 'Küp şeker')), [(s['Miktar'], s.get('Bağlı')) for s in ad(t, 'Küp şeker')])

        # 5) Düzenleme: düz çaya şeker ekle yoksa; öğün değişince şeker de taşınır
        await pg.tap('.ogun-kart [data-kayit-duzelt]:has-text("Türk kahvesi")'); await bekle(500)
        await pg.tap('[data-d-ogun="ogle"]'); await bekle(); await pg.tap('#d-kaydet'); await bekle(600)
        t = bugun(); kah = ad(t, 'Türk kahvesi')[0]; ks = [s for s in ad(t, 'Küp şeker') if s.get('Bağlı') == kah['ID']]
        kontrol('Öğle\'ye taşınan kahvenin şekeri de Öğle\'de', kah['Öğün'] == 'Öğle' and ks and ks[0]['Öğün'] == 'Öğle' and float(ks[0]['Miktar']) == 1.5, (kah['Öğün'], [(s['Öğün'], s['Miktar']) for s in ks]))

        # 6) Dünkü ekle: bağ korunur (sunucunun önceki gün verisi yerine bugünkü kopyayı yarın gibi deneriz: gün değiştir)
        await c.close()
        c = await b.new_context(viewport={'width': 360, 'height': 780}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce')
        await yazi_tipi(c); pg = await c.new_page(); pg.on('pageerror', lambda e: hata.append(str(e)))
        await pg.clock.set_fixed_time('2026-11-22T12:10:00+03:00')
        await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1300)
        await pg.tap('[data-ogun="ogle"]'); await bekle(1200)
        if await pg.locator('.ogun-kart [data-tekrar]').count():
            await pg.tap('.ogun-kart [data-tekrar]'); await bekle(1500)
            with urllib.request.urlopen(f'http://localhost:{PORT}/_tablo?ad=' + urllib.parse.quote('Öğün Kayıtları')) as r: tt = json.loads(r.read().decode())
            yarin = [dict(zip(tt[0], x)) for x in tt[1:] if x[1] == '2026-11-22']
            cy = ad(yarin, 'Türk kahvesi')
            kontrol('Dünkü öğle: kahvenin şekeri yeni kahveye bağlı', cy and any(s.get('Bağlı') == cy[0]['ID'] and float(s['Miktar']) == 1.5 for s in ad(yarin, 'Küp şeker')), [(k['Ad'], k.get('Bağlı')) for k in yarin])
        else: kontrol('Dünkü ekle düğmesi var', False, await pg.evaluate("[document.querySelector('.ogun-kart').innerText.slice(0,200), JSON.stringify(Object.keys(window))].join(' || ').slice(0,300)"))

        for h in hata: sonuc.append('❌ sayfa hatası · ' + h[:200])
        await b.close()
    print('\n'.join(sonuc)); print(f"\n{sum(1 for s in sonuc if s.startswith('✅'))}/{len(sonuc)}")
    sys.exit(0 if all(s.startswith('✅') for s in sonuc) else 1)
try: asyncio.run(main())
except SystemExit: raise
except Exception as e:
    print('\n'.join(sonuc)); print('❌ test durdu ·', str(e).split('\n')[0]); sys.exit(1)
