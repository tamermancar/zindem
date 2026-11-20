"""Antrenman taslağı 2: gerçek uygulamaya çizer, telefon kontrolü kurallarıyla denetler, görüntü alır.
Kullanım: python3 -I cek2.py <port> <çıktı klasörü>"""
import asyncio, sys, os, re
from playwright.async_api import async_playwright
PORT = sys.argv[1]; OUT = sys.argv[2]
D = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(D, '../../test/telefon_kontrol.py'), encoding='utf-8').read()
KURALLAR = re.search(r'KURALLAR = r"""(.*?)"""', src, re.S).group(1)
CSS = open(os.path.join(D, 'antrenman.css'), encoding='utf-8').read() + open(os.path.join(D, 'antrenman2.css'), encoding='utf-8').read()
JS = open(os.path.join(D, 'antrenman2.js'), encoding='utf-8').read()
rapor = []
DURUMLAR = [
    ('01-bos-durum', "T2.bos()"), ('02-tanisma-ekipman', "T2.tanisma(2)"), ('03-tanisma-hareket', "T2.tanisma(3)"), ('04-tanisma-bolge', "T2.tanisma(4)"), ('04b-tanisma-uzuv', "T2.tanisma(5)"),
    ('05-hareketler', "T2.kapat(); T2.hareketler()"), ('05b-hareketler-uzuv', "T2.hareketlerUzuv()"), ('06-hareket-detay', "T2.detay()"), ('07-kendi-hareketin', "T2.kendiHareket()"),
    ('08-programim', "T2.kapat(); T2.programim()"), ('09-program-duzenle', "T2.programDuzenle()"), ('10-antrenman-duzenle', "T2.antrenmanDuzenle()"),
    ('11-hareket-ekle', "T2.hareketSec()"), ('12-hareket-ayari', "T2.hareketAyar()"),
    ('13-gunun-antrenmani', "T2.kapat(); T2.gun()"), ('14-gun-alt', "window.scrollTo(0, document.body.scrollHeight)"),
    ('14b-kisa-gun', "T2.kisaGun()"), ('15-bitir-yarim', "T2.yarim()"), ('16-haftanin-ozeti', "T2.kapat(); T2.haftaOzet()"), ('17-beslenme-durum', "T2.beslenme()"),
]

async def calis(b, W, H, koyu):
    k = f'{OUT}/{W}{"-koyu" if koyu else ""}'; os.makedirs(k, exist_ok=True)
    c = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR',
                            timezone_id='Europe/Istanbul', reduced_motion='reduce')
    pg = await c.new_page(); hata = []; pg.on('pageerror', lambda e: hata.append(str(e)))
    await pg.clock.set_fixed_time('2026-11-20T16:40:00+03:00')
    await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1300)
    if koyu: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
    await pg.add_style_tag(content=CSS); await pg.add_script_tag(content=JS); await pg.evaluate("T2.seritAl()")
    for ad, kod in DURUMLAR:
        await pg.evaluate(kod); await pg.wait_for_timeout(300)
        for isaret, tur, ayr in await pg.evaluate(KURALLAR): rapor.append(f'{isaret} [{W}{" koyu" if koyu else ""}] {ad} · {tur} · {ayr}')
        await pg.screenshot(path=f'{k}/{ad}.png')
    # Beslenme: gerçek uygulamanın Ekle ve tarif pencerelerine işaret
    await pg.evaluate("T2.kapat()"); await pg.reload(); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1000)
    if koyu: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
    await pg.add_style_tag(content=CSS); await pg.add_script_tag(content=JS)
    await pg.tap('.ogun-kart [data-ekle]'); await pg.wait_for_timeout(500); await pg.fill('#arama', 'yumurta'); await pg.wait_for_timeout(500)
    await pg.evaluate("T2.alerjenIsaretle()"); await pg.wait_for_timeout(200)
    for isaret, tur, ayr in await pg.evaluate(KURALLAR): rapor.append(f'{isaret} [{W}{" koyu" if koyu else ""}] 18-ekle-alerjen · {tur} · {ayr}')
    await pg.screenshot(path=f'{k}/18-ekle-alerjen.png')
    await pg.fill('#arama', 'mercimek çorbası'); await pg.wait_for_timeout(500)
    await pg.tap('#sonuclar [data-tarif-ac] >> nth=0'); await pg.wait_for_timeout(600); await pg.evaluate("T2.tuzUyari()"); await pg.wait_for_timeout(200)
    for isaret, tur, ayr in await pg.evaluate(KURALLAR): rapor.append(f'{isaret} [{W}{" koyu" if koyu else ""}] 19-tarif-tuz · {tur} · {ayr}')
    await pg.screenshot(path=f'{k}/19-tarif-tuz.png')
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
