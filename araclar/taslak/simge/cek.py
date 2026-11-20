"""Profil simgesi taslağı. Kullanım: python3 -I cek.py <port> <klasör> <simge.json>"""
import asyncio, sys, os, re
from playwright.async_api import async_playwright
PORT, OUT, VERI = sys.argv[1], sys.argv[2], sys.argv[3]
D = os.path.dirname(os.path.abspath(__file__))
KURALLAR = re.search(r'KURALLAR = r"""(.*?)"""', open(os.path.join(D, '../../test/telefon_kontrol.py'), encoding='utf-8').read(), re.S).group(1)
CSS = open(os.path.join(D, 'simge.css'), encoding='utf-8').read()
JS = open(os.path.join(D, 'simge.js'), encoding='utf-8').read().replace('__VERI__', open(VERI, encoding='utf-8').read())
DURUM = [('a1-bugun', 'TS.aBugun()'), ('a2-sec', 'TS.aSec()'), ('a3-profil', "TS.profilDuzenle('a')"), ('a4-ilerleme', "TS.ekran('a','ilerleme')"),
         ('b1-bugun', 'TS.bBugun()'), ('b2-sec', 'TS.bSec()'), ('b3-profil', "TS.profilDuzenle('b')"), ('b4-mutfak', "TS.ekran('b','mutfak')")]
rapor = []
async def calis(b, W, H, koyu):
    k = f'{OUT}/{W}{"-koyu" if koyu else ""}'; os.makedirs(k, exist_ok=True)
    c = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce')
    pg = await c.new_page(); hata = []; pg.on('pageerror', lambda e: hata.append(str(e)))
    await pg.clock.set_fixed_time('2026-11-20T16:40:00+03:00')
    await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1200)
    if koyu: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
    await pg.add_style_tag(content=CSS); await pg.add_script_tag(content=JS)
    for ad, kod in DURUM:
        await pg.evaluate(kod); await pg.wait_for_timeout(900 if ('ekran' in kod or 'bBugun' in kod) else 300)
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
