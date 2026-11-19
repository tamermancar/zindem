"""Antrenman taslağı: gerçek uygulamaya çizip telefon kontrolü kurallarıyla denetler ve ekran görüntüsü alır."""
import asyncio, sys, os, re
from playwright.async_api import async_playwright
PORT = sys.argv[1]; OUT = sys.argv[2]
src = open('/home/claude/zindem/araclar/test/telefon_kontrol.py', encoding='utf-8').read()
KURALLAR = re.search(r'KURALLAR = r"""(.*?)"""', src, re.S).group(1)
CSS = open('/home/claude/zindem/araclar/taslak/antrenman/antrenman.css', encoding='utf-8').read()
JS = open('/home/claude/zindem/araclar/taslak/antrenman/antrenman.js', encoding='utf-8').read()
FORM = open('/home/claude/zindem/araclar/taslak/antrenman/form.html', encoding='utf-8').read()
rapor = []

async def calis(b, W, H, koyu):
    k = f'{OUT}/{W}{"-koyu" if koyu else ""}'; os.makedirs(k, exist_ok=True)
    c = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR',
                            timezone_id='Europe/Istanbul', reduced_motion='reduce')
    pg = await c.new_page(); hata = []; pg.on('pageerror', lambda e: hata.append(str(e)))
    await pg.clock.set_fixed_time('2026-11-20T16:40:00+03:00')
    await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1300)
    if koyu: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
    await pg.add_style_tag(content=CSS); await pg.add_script_tag(content=JS)
    n = [0]
    async def foto(ad, alt=False):
        await pg.wait_for_timeout(300)
        for isaret, tur, ayr in await pg.evaluate(KURALLAR): rapor.append(f'{isaret} [{W}{" koyu" if koyu else ""}] {ad} · {tur} · {ayr}')
        n[0] += 1; await pg.screenshot(path=f'{k}/{n[0]:02d}-{ad}.png')
    async def asagi(ad):
        await pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); await foto(ad); await pg.evaluate("window.scrollTo(0,0)")
    await pg.evaluate("TASLAK.ustGun()"); await foto('1-ust-gun')
    await pg.evaluate("window.scrollTo(0, 560)"); await foto('2-ust-gun-orta'); await asagi('3-ust-gun-alt')
    await pg.evaluate("TASLAK.ustGun({duzen:1})"); await pg.evaluate("document.querySelectorAll('.an-kart')[1].scrollIntoView({block:'start'}); scrollBy(0,-90)"); await foto('4-set-duzenle')
    await pg.evaluate("window.scrollTo(0,0); TASLAK.nasil()"); await foto('5-nasil-yapilir')
    await pg.evaluate("TASLAK.bitir(false)"); await foto('6-bitir-hayir')
    await pg.evaluate("f => TASLAK.bitir(true, f)", FORM); await foto('7-bitir-evet')
    await pg.evaluate("document.getElementById('pencere').scrollTop=9999"); await foto('8-bitir-evet-alt')
    await pg.evaluate("TASLAK.kapat(); TASLAK.altGun()"); await foto('9-alt-gun-kasik-ara'); await asagi('10-alt-gun-alt')
    await pg.evaluate("TASLAK.rutin()"); await foto('11-rutin-gunu')
    await pg.evaluate("TASLAK.haftaOzet()"); await foto('12-haftanin-ozeti')
    await pg.reload(); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1200)
    if koyu: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
    await pg.add_style_tag(content=CSS); await pg.add_script_tag(content=JS)
    await pg.evaluate("TASLAK.bugunGosterge()"); await foto('13-bugun-gosterge')
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
