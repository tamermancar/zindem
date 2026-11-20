"""Antrenman ekranı (1.9) işlev testi: örnek program, ağrı kademeleri, geçen sefer, haftanın özeti, kaydır, bitir.
Çalıştırma: ORNEK_ANT=1 node araclar/test/sahte.js . 8771 &  →  python3 araclar/test/antrenman_test.py 8771 /tmp/at
"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
import os as _o; exec(open(_o.path.join(_o.path.dirname(_o.path.abspath(__file__)), 'yazitipi.py'), encoding='utf-8').read())
PORT, CIKTI = sys.argv[1], sys.argv[2]; os.makedirs(CIKTI, exist_ok=True)
sonuc = []
def kontrol(ad, kosul, ayr=''):
    sonuc.append(('✅' if kosul else '❌') + ' ' + ad + ('' if kosul else ' · ' + str(ayr)))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        c = await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce')
        await yazi_tipi(c)
        pg = await c.new_page(); hata = []; pg.on('pageerror', lambda e: hata.append(str(e)))
        await pg.clock.set_fixed_time('2026-11-19T13:20:00+03:00')  # Perşembe
        await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1300)
        async def foto(ad): await pg.wait_for_timeout(350); await pg.screenshot(path=f'{CIKTI}/{ad}.png')
        async def tablo(ad): return json.loads(await pg.evaluate(f"fetch('/_tablo?ad={ad}').then(r=>r.text())"))
        t = await pg.inner_text('#antrenman-dugme'); kontrol('Özet kartı: dinlenme günü', 'Dinlenme' in t, t)
        await pg.tap('#antrenman-dugme'); await pg.wait_for_timeout(700); await foto('01-dinlenme-ozet')
        kontrol('Haftanın özeti görünüyor (Çarşamba bitti)', await pg.is_visible('.hf-kart'))
        o = await pg.inner_text('.hf-kart'); kontrol('Özette antrenman günü sayısı', 'Antrenman günü' in o and '2' in o, o[:120])
        kontrol('Özette diz ağrısı sınırı aşan antrenman "aynı kal"', 'aynı kal' in o, o)
        await pg.tap('[data-a-ozet-tamam]'); await pg.wait_for_timeout(400)
        kontrol('Özet Tamam ile kapanıyor', not await pg.is_visible('.hf-kart'))
        await pg.tap('[data-a-gun="2026-11-18"]'); await pg.wait_for_timeout(400); await foto('02-carsamba-bitti')
        u = await pg.inner_text('.an-ust'); kontrol('Bitmiş gün: "bitti" yazıyor', 'bitti' in u, u)
        await pg.tap('[data-a-gun="2026-11-16"]'); await pg.wait_for_timeout(400); await foto('03-yarim-gun')
        u = await pg.inner_text('.an-ust'); kontrol('Yarım gün: "yarım kaldı"', 'yarım kaldı' in u, u)
        kontrol('Ağrı kademesi: omuz 6 → ara ver', 'bu bölgeye bugün ara ver' in u, u)
        kontrol('Ağrı kademesi: diz 4 → hafif yap', 'hafif yap' in u, u)
        m = await pg.inner_text('main'); kontrol('Eğimli şınav: "Bugün ara ver" etiketi (omzu zorlar)', 'Bugün ara ver' in m)
        kontrol('Geçen sefer gösteriliyor', 'Geçen:' in m)
        # Bugün değil ama planlı gün: Pazartesi; bugünü planlı yapmak için dinlenme gününde "Yine de yap"
        await pg.tap('[data-a-gun="2026-11-19"]'); await pg.wait_for_timeout(400)
        await pg.tap('[data-a-sec-ant] >> nth=0'); await pg.wait_for_timeout(500); await foto('04-yine-de-yap')
        kontrol('Yine de yap: antrenman açıldı', await pg.is_visible('[data-a-bitir]'))
        await pg.tap('.an-set:not(.ekle):not(.tamam) >> nth=1'); await pg.wait_for_timeout(300)
        t = await pg.inner_text('main .an-sayi'); kontrol('Set dokununca sayaç 1', t.strip().startswith('1'), t)
        await pg.tap('[data-a-kaydir]'); await pg.wait_for_timeout(500); await foto('05-kaydirildi')
        u = await pg.inner_text('.an-ust'); kontrol('Yarına kaydır: bugün "yarına kaydırıldı"', 'yarına kaydırıldı' in u, u)
        gl = await tablo('Antrenman%20G%C3%BCnleri'); await pg.wait_for_timeout(1500); gl = await tablo('Antrenman%20G%C3%BCnleri')
        kontrol('Tabloya yarın planı yazıldı', any(r[0] == '2026-11-20' and r[3] == 'plan' for r in gl[1:]), gl[-2:])
        await pg.tap('[data-a-kaydirma-geri]'); await pg.wait_for_timeout(400)
        kontrol('Kaydırma geri alındı', await pg.is_visible('[data-a-bitir]') or await pg.is_visible('[data-a-sec-ant]'))
        if await pg.is_visible('[data-a-sec-ant]'): await pg.tap('[data-a-sec-ant] >> nth=0'); await pg.wait_for_timeout(400)
        await pg.tap('[data-a-bitir]'); await pg.wait_for_timeout(400)
        await pg.tap('[data-b-sec=hepsi]'); await pg.wait_for_timeout(200); await foto('06-bitir-hepsi')
        await pg.tap('#b-tamam'); await pg.wait_for_timeout(600); await foto('07-bitti')
        u = await pg.inner_text('.an-ust'); kontrol('Hepsini yaptım: bitti ve sayaç dolu', 'bitti' in u, u)
        await pg.wait_for_timeout(1500)
        k = await tablo('Antrenman%20Kay%C4%B1tlar%C4%B1'); bug = [r for r in k[1:] if r[1] == '2026-11-19']
        kontrol('Hepsini yaptım: bütün setler tabloya yazıldı', len(bug) >= 6, len(bug))
        await pg.tap('[data-ekran=bugun]'); await pg.wait_for_timeout(500)
        t = await pg.inner_text('#antrenman-dugme'); kontrol('Özet kartı: set sayısı', 'set' in t, t)
        await foto('08-bugun-ozet')
        for h in hata: kontrol('JS hatası yok', False, h[:160])
        await b.close()
    print('\n'.join(sonuc)); print(f"{sum(1 for x in sonuc if x[0]=='✅')}/{len(sonuc)} geçti")
    sys.exit(0 if all(x[0] == '✅' for x in sonuc) else 1)
asyncio.run(main())
