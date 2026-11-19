"""1.8 Adım adım ağrı notu + yeni ev yemekleri testi (sahte tablo). Kullanım: python3 -I agri_test.py <port> <çıktı> [koyu]"""
import asyncio, json, sys, os, urllib.request, urllib.parse
from playwright.async_api import async_playwright
PORT, OUT = sys.argv[1], sys.argv[2]
KOYU = len(sys.argv) > 3
os.makedirs(OUT, exist_ok=True)
def tablo(ad):
    return json.loads(urllib.request.urlopen(f'http://localhost:{PORT}/_tablo?ad=' + urllib.parse.quote(ad)).read() or 'null')
sonuc = []
def kontrol(ad, kosul, ek=''):
    sonuc.append(('✅' if kosul else '❌') + ' ' + ad + (' · ' + str(ek) if ek else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        c = await b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR',
                                timezone_id='Europe/Istanbul', reduced_motion='reduce', color_scheme='dark' if KOYU else 'light')
        pg = await c.new_page(); hata = []
        pg.on('pageerror', lambda e: hata.append(str(e)))
        await pg.clock.set_fixed_time('2026-11-19T13:20:00+03:00')
        await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1200)
        if KOYU: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
        async def bekle(ms=350): await pg.wait_for_timeout(ms)
        async def foto(ad): await bekle(); await pg.screenshot(path=f'{OUT}/{ad}.png')
        async def bos_kuyruk():
            for _ in range(40):
                if await pg.evaluate("JSON.parse(localStorage.getItem('zindem-bekleyen')||'[]').length") == 0: return
                await bekle(150)
        async def sec(q, deger): await pg.select_option(q, deger); await bekle(200)
        async def pasif(q): return await pg.evaluate(f"document.querySelector('{q}').disabled")
        # 1) Antrenman kaynaklı · omuz · sol
        await pg.click('#agri-dugme'); await bekle(); await pg.click('#yeni-not'); await foto('a1-bos')
        kontrol('4 satır görünür; bölge, taraf, şiddet, Kaydet kapalı', await pg.is_visible('#n-taraf') and await pasif('#n-bolge') and await pasif('#n-taraf') and await pasif('#siddet') and await pasif('#n-kaydet'))
        await sec('#n-tur', 'antrenman kaynaklı'); await foto('a2-tur')
        kontrol('Tür seçilince bölge açıldı, taraf kapalı', not await pasif('#n-bolge') and await pasif('#n-taraf'))
        kontrol('Antrenman bölgelerinde el bileği var', 'el bileği' in await pg.evaluate("[...document.querySelectorAll('#n-bolge option')].map(o=>o.value).join('|')"))
        await sec('#n-bolge', 'omuz'); await foto('a3-bolge')
        kontrol('Omuz → taraf boş, seçilmeli; şiddet kapalı', not await pasif('#n-taraf') and await pg.input_value('#n-taraf') == '' and await pasif('#siddet'))
        await sec('#n-taraf', 'sol'); await foto('a4-hazir')
        kontrol('Taraf seçilince şiddet + hareket + Kaydet açık', not await pasif('#siddet') and await pg.is_visible('#n-hareket') and not await pasif('#n-kaydet'))
        await pg.fill('#n-hareket', 'Bulgarian split squat')
        await sec('#n-tur', 'diğer')
        kontrol('Tür değişti, omuz yeni listede de var → kaldı', await pg.input_value('#n-bolge') == 'omuz' and await pg.input_value('#n-taraf') == 'sol')
        await sec('#n-tur', 'antrenman kaynaklı')
        await sec('#n-bolge', 'diz'); await sec('#n-taraf', 'sol')
        await pg.click('#s-art'); await pg.click('#s-art')
        await pg.click('#n-kaydet'); await bekle(); await bos_kuyruk()
        son = tablo('Ağrı Notları')[-1]
        kontrol('Tabloya diz/sol/3 yazıldı', 'diz' in son and 'sol' in son and 3 in son, son)
        # 2) Bel → genel gelir, değiştirilebilir; hastalık · boğaz → genel kilitli
        await pg.click('#agri-dugme'); await bekle(); await pg.click('#yeni-not'); await bekle()
        await sec('#n-tur', 'antrenman kaynaklı'); await sec('#n-bolge', 'bel'); await foto('b1-bel-genel')
        kontrol('Bel → taraf "genel", açık ve değişebilir; şiddet açık', await pg.input_value('#n-taraf') == 'genel' and not await pasif('#n-taraf') and not await pasif('#siddet'))
        await sec('#n-tur', 'hastalık')
        kontrol('Hastalığa geçince bel silindi, taraf kapandı', await pg.input_value('#n-bolge') == '' and await pasif('#n-taraf') and await pasif('#siddet'))
        await sec('#n-bolge', 'boğaz'); await foto('b2-bogaz-kilitli')
        kontrol('Boğaz → taraf "genel" kilitli, şiddet açık', await pg.input_value('#n-taraf') == 'genel' and await pasif('#n-taraf') and not await pasif('#siddet'))
        kontrol('Hastalıkta hareket alanı yok', not await pg.is_visible('#n-hareket'))
        await pg.click('#n-kaydet'); await bekle(); await bos_kuyruk()
        son = tablo('Ağrı Notları')[-1]
        kontrol('Boğaz notu taraf=genel', 'boğaz' in son and 'genel' in son, son)
        # 3) Diğer… → yeni bölge → sonraki notta listede
        await pg.click('#agri-dugme'); await bekle(); await pg.click('#yeni-not'); await bekle()
        await sec('#n-tur', 'gün içi kaza'); await sec('#n-bolge', '__diger'); await foto('c1-diger')
        await pg.fill('#n-bolge-yaz', 'Ön kol'); await pg.click('#n-bolge-tamam'); await foto('c2-ek-taraf')
        kontrol('Yeni bölge seçili, taraf seçilecek (genel seçeneği var)', await pg.input_value('#n-bolge') == 'ön kol' and 'genel' in await pg.evaluate("[...document.querySelectorAll('#n-taraf option')].map(o=>o.value).join('|')"))
        await sec('#n-taraf', 'sağ'); await pg.click('#n-kaydet'); await bekle(); await bos_kuyruk()
        ay = {r[1]: r for r in tablo('Ayarlar')[1:]}
        kontrol('Ek bölge ayara yazıldı', 'ön kol' in str(ay.get('agri_ek_bolge')), ay.get('agri_ek_bolge'))
        await pg.click('#agri-dugme'); await bekle(); await pg.click('#yeni-not'); await bekle(); await sec('#n-tur', 'antrenman kaynaklı')
        kontrol('Ön kol artık listede', 'ön kol' in await pg.evaluate("[...document.querySelectorAll('#n-bolge option')].map(o=>o.value).join('|')"))
        await pg.click('#kapat'); await bekle(500)
        await pg.click('#agri-dugme'); await foto('d1-acik-notlar'); await pg.click('#kapat'); await bekle(500)
        # 4) Yeni yemekler Mutfak'ta / Ekle'de
        kat = await pg.evaluate("fetch('katalog.json?v=7').then(r=>r.json()).then(k=>k.besinler.filter(b=>b.id.startsWith('y-')).length)")
        kontrol('Katalogda 30 ev yemeği', kat == 30, kat)
        await pg.click('[data-ekran=mutfak]'); await bekle(600); await foto('e1-mutfak')
        txt = await pg.text_content('main')
        kontrol('Mutfak önerilerinde tarhana ve ekşili köfte', 'Tarhana çorbası' in txt and 'Ekşili köfte' in txt)
        kontrol('JS hatası yok', not hata, hata)
        await b.close()
    print('\n'.join(sonuc))
asyncio.run(main())
