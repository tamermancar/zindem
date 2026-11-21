"""Ekle ekranları taslağı (1.11). Gerçek uygulamanın içine çizer, telefon kontrolü kurallarıyla denetler, görüntü alır.
Kullanım: python3 -I cek.py <port> <çıktı klasörü>"""
import asyncio, sys, os, re
from playwright.async_api import async_playwright
PORT, OUT = sys.argv[1], sys.argv[2]
D = os.path.dirname(os.path.abspath(__file__))
KURALLAR = re.search(r'KURALLAR = r"""(.*?)"""', open(os.path.join(D, '../../test/telefon_kontrol.py'), encoding='utf-8').read(), re.S).group(1)
CSS = open(os.path.join(D, 'ekle.css'), encoding='utf-8').read()
JS = open(os.path.join(D, 'ekle.js'), encoding='utf-8').read()
DURUM = [('e1-bos-ogun', 'TE.e1()'), ('e2-eklendi', 'TE.e2()'), ('e3-olcu', 'TE.e3()'), ('e4-kaydir-yavas', 'TE.e4()'), ('e5-kaydir-hizli', 'TE.e5()'),
         ('e6-geri-al', 'TE.e6()'), ('e7-grup', 'TE.e7()'), ('e8-arama', 'TE.e8()'), ('e9-en-alt', 'TE.e9()'),
         ('b1-dunku', 'TE.b1()'), ('b2-dunku-eklendi', 'TE.b2()'), ('b3-bugun-sil', 'TE.b3()'), ('t1-tarif-kaldir', 'TE.t1()')]
rapor = []
async def calis(b, W, H, koyu):
    k = f'{OUT}/{W}{"-koyu" if koyu else ""}'; os.makedirs(k, exist_ok=True)
    c = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce')
    pg = await c.new_page(); hata = []; pg.on('pageerror', lambda e: hata.append(str(e)))
    await pg.clock.set_fixed_time('2026-11-21T08:10:00+03:00')
    await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1300)
    if koyu: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
    await pg.add_style_tag(content=CSS); await pg.add_script_tag(content=JS)
    for ad, kod in DURUM:
        await pg.evaluate(kod); await pg.wait_for_timeout(350)
        for i, t, a in await pg.evaluate(KURALLAR): rapor.append(f'{i} [{W}{" koyu" if koyu else ""}] {ad} · {t} · {a}')
        await pg.screenshot(path=f'{k}/{ad}.png')
    for h in hata: rapor.append(f'❌ [{W}] sayfa hatası · {h[:150]}')
    await c.close()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for W, H in [(412, 915), (360, 780)]:
            for koyu in (False, True): await calis(b, W, H, koyu)
        await b.close()
    print('\n'.join(rapor) if rapor else '✅ Kurallara takılan bir şey yok')
asyncio.run(main())
