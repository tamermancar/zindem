"""İlerleme taslağı: gerçek uygulamanın içine çizer, telefon kontrolü kurallarıyla denetler, görüntü alır.
Kullanım: python3 -I cek.py <port> <çıktı klasörü> <ikonlar.json>"""
import asyncio, sys, os, re, json
from playwright.async_api import async_playwright
PORT, OUT, IKON = sys.argv[1], sys.argv[2], sys.argv[3]
D = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(D, '../../test/telefon_kontrol.py'), encoding='utf-8').read()
KURALLAR = re.search(r'KURALLAR = r"""(.*?)"""', src, re.S).group(1)
CSS = open(os.path.join(D, 'ilerleme.css'), encoding='utf-8').read()
JS = open(os.path.join(D, 'ilerleme.js'), encoding='utf-8').read().replace('__IKONLAR__', open(IKON, encoding='utf-8').read())
rapor = []
DURUMLAR = [
    ('01-bos-durum', "TI.bos()"), ('02-ilk-olcum', "TI.ilkOlcum()"),
    ('03-hafta-ust', "TI.kapat(); TI.hafta()"), ('04-hafta-orta', "TI.asagi(2)"), ('05-hafta-alt', "window.scrollTo(0, document.body.scrollHeight)"),
    ('06-ay', "TI.ay()"), ('06b-ay-orta', "TI.asagi(5)"), ('07-3ay', "TI.uc()"), ('08-yil', "TI.yil()"), ('08b-yil-alt', "window.scrollTo(0, document.body.scrollHeight)"),
    ('09-aylik-ozet', "TI.ozetli()"), ('09b-ekim', "TI.ekim()"),
    ('10-kilo-detay', "TI.kiloDetay()"), ('11-olcum-ekle', "TI.olcum()"), ('12-kalori-detay', "TI.kaloriDetay()"),
    ('13-antrenman-detay', "TI.antDetay()"), ('14-hareket-gidisat', "TI.hareketGidisat()"), ('15-agri-detay', "TI.agriDetay()"),
    ('16-claude-sor', "TI.sor()"), ('16b-kopyalandi', "TI.kopyalandi()"), ('17-kartlari-duzenle', "TI.duzenle()"),
]
async def calis(b, W, H, koyu):
    k = f'{OUT}/{W}{"-koyu" if koyu else ""}'; os.makedirs(k, exist_ok=True)
    c = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR',
                            timezone_id='Europe/Istanbul', reduced_motion='reduce')
    pg = await c.new_page(); hata = []; pg.on('pageerror', lambda e: hata.append(str(e)))
    await pg.clock.set_fixed_time('2026-11-20T16:40:00+03:00')
    await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1300)
    if koyu: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
    await pg.add_style_tag(content=CSS); await pg.add_script_tag(content=JS)
    for ad, kod in DURUMLAR:
        await pg.evaluate(kod); await pg.wait_for_timeout(300)
        for isaret, tur, ayr in await pg.evaluate(KURALLAR): rapor.append(f'{isaret} [{W}{" koyu" if koyu else ""}] {ad} · {tur} · {ayr}')
        await pg.screenshot(path=f'{k}/{ad}.png')
        if ad == '16b-kopyalandi': await pg.evaluate("document.getElementById('bildirim').hidden = true")
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
