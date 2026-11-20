"""İlerleme ekranı testi (1.10). Sahte sunucu ORNEK_IL=1 ile açılır (80 günlük genel örnek kullanıcı).
Akışları dener, tabloya yazılanları /_tablo ile kontrol eder, telefon kontrolü kurallarını çalıştırır, görüntü alır.
Kullanım: ORNEK_IL=1 node sahte.js <depo> <port> ; python3 -I ilerleme_test.py <port> <klasör> [koyu]"""
import asyncio, sys, os, re, json, urllib.request
from playwright.async_api import async_playwright
PORT, OUT = sys.argv[1], sys.argv[2]; KOYU = len(sys.argv) > 3 and sys.argv[3] == 'koyu'
D = os.path.dirname(os.path.abspath(__file__))
KURALLAR = re.search(r'KURALLAR = r"""(.*?)"""', open(os.path.join(D, 'telefon_kontrol.py'), encoding='utf-8').read(), re.S).group(1)
sonuc, rapor = [], []
def tablo(ad): return json.loads(urllib.request.urlopen(f'http://localhost:{PORT}/_tablo?ad=' + urllib.parse.quote(ad)).read() or 'null')
def dogrula(ad, kosul): sonuc.append(('✅' if kosul else '❌') + ' ' + ad)
import urllib.parse

async def calis(b, W, H, ilk):
    k = f'{OUT}/{W}'; os.makedirs(k, exist_ok=True)
    c = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce')
    pg = await c.new_page(); hata = []; pg.on('pageerror', lambda e: hata.append(str(e)))
    await pg.clock.set_fixed_time('2026-11-20T16:40:00+03:00')
    await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1200)
    if KOYU: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
    n = [0]
    async def durum(ad, ms=400):
        await pg.wait_for_timeout(ms)
        for isaret, tur, ayr in await pg.evaluate(KURALLAR): rapor.append(f'{isaret} [{W}] {ad} · {tur} · {ayr}')
        n[0] += 1; await pg.screenshot(path=f'{k}/{n[0]:02d}-{ad}.png')
    async def kapat(): await pg.evaluate("(()=>{const k=document.getElementById('kapat'); if(k) k.click();})()"); await pg.wait_for_timeout(400)
    async def kart(sec):
        await pg.evaluate(f"(()=>{{const e=document.querySelector('{sec}'); window.scrollTo(0, e.closest('.kart').getBoundingClientRect().top + scrollY - 150);}})()"); await pg.wait_for_timeout(200)
    await pg.tap('[data-ekran=ilerleme]'); await pg.wait_for_selector('.il-kart'); await durum('hafta-ust')
    if ilk:
        dogrula('Kilo kartı eğilim değeri var', await pg.locator('.il-kart .il-deger b').first.inner_text() not in ('', '—'))
        dogrula('Haftada antrenman günleri 7 yuvarlak', await pg.locator('.il-hafta-gun li').count() == 7)
        dogrula('Tarihi Date olarak duran gün de işaretli (1.9.1)', await pg.evaluate("document.querySelectorAll('.il-hafta-gun .il-ag:not(.yok)').length") >= 1)
    await kart('.il-uyku'); await durum('hafta-orta')
    await pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); await durum('hafta-alt')
    await pg.evaluate("window.scrollTo(0,0)")
    for t in ['ay', '3ay', 'yil']:
        await pg.tap(f'[data-i-tur="{t}"]'); await durum(t)
    await pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); await durum('yil-alt')
    await pg.tap('[data-i-ay-ac] >> nth=1'); await durum('gecmis-ay')
    await pg.tap('[data-i-tur=hafta]'); await pg.wait_for_timeout(200)
    await pg.tap('[data-i-git="-1"]'); await durum('gecen-hafta')
    await pg.tap('[data-i-git="1"]'); await pg.wait_for_timeout(200)
    # Kilo detay + ölçüm ekle + düzenle
    await pg.tap('[data-i-detay=kilo]'); await durum('kilo-detay')
    await pg.tap('[data-od-tur="1"]'); await durum('bel-detay')
    await pg.tap('[data-od-tur="0"]'); await pg.wait_for_timeout(200)
    await pg.tap('#od-vki'); await durum('boy-gir'); await pg.fill('#td-v', '178'); await pg.tap('#td-kaydet'); await durum('vki')
    if ilk: dogrula('Boy ayarı yazıldı', any(r[1] == 'boy' for r in (tablo('Ayarlar') or [])))
    await pg.tap('#od-ekle'); await durum('olcum-ekle')
    await pg.fill('#o-kilo', '81,2')
    if await pg.locator('[data-o-ek=boyun]').count(): await pg.tap('[data-o-ek=boyun]')
    await pg.fill('#o-boyun', '39'); await durum('olcum-ekle-boyun')
    await pg.tap('#o-kaydet'); await pg.wait_for_timeout(1500)
    if ilk:
        o = tablo('Ölçüler') or []
        dogrula('Ölçüm tabloya yazıldı (kilo 81,2)', any(r[1] == 'kilo' and float(r[2]) == 81.2 and r[0] == '2026-11-20' for r in o[1:]))
        dogrula('Boyun ölçüsü yazıldı ve takip listesine eklendi', any(r[1] == 'boyun' for r in o[1:]) and any(r[1] == 'olcu_ek' and 'boyun' in str(r[2]) for r in (tablo('Ayarlar') or [])))
    await durum('olcum-sonrasi')
    await pg.tap('[data-i-detay=kilo]'); await pg.wait_for_timeout(300); await pg.tap('[data-od-sec] >> nth=0'); await durum('olcum-duzenle')
    await pg.tap('#oe-sil'); await pg.wait_for_timeout(1500)
    if ilk: dogrula('Ölçüm silindi', not any(r[1] == 'kilo' and r[0] == '2026-11-20' for r in (tablo('Ölçüler') or [])[1:]))
    await pg.evaluate("document.getElementById('bildirim-dugme') && document.getElementById('bildirim-dugme').click()"); await pg.wait_for_timeout(1500)
    if ilk: dogrula('Geri al: ölçüm geri geldi', any(r[1] == 'kilo' and r[0] == '2026-11-20' for r in (tablo('Ölçüler') or [])[1:]))
    await kapat()
    # Hedef kilo
    await pg.tap('[data-i-detay=kilo]'); await pg.wait_for_timeout(300); await pg.tap('#od-hedef'); await durum('hedef-kilo')
    await pg.fill('#td-v', '77,5'); await pg.tap('#td-kaydet'); await pg.wait_for_timeout(1500)
    if ilk: dogrula('Hedef kilo yazıldı', any(r[1] == 'kilo' and float(r[2]) == 77.5 for r in (tablo('Hedefler') or [])[1:]))
    await kapat()
    # Beslenme detay: çubuğa dokun
    await kart('[data-i-detay=beslenme]'); await pg.tap('[data-i-detay=beslenme]'); await durum('beslenme-detay')
    await pg.evaluate("(()=>{const r=document.querySelectorAll('#pencere .il-dokun'); r[1] && r[1].dispatchEvent(new MouseEvent('click',{bubbles:true}));})()"); await durum('beslenme-secili')
    await pg.tap('[data-md-tur="1"]'); await durum('protein-detay'); await kapat()
    await kart('[data-i-detay=su]'); await pg.tap('[data-i-detay=su]'); await durum('su-detay'); await kapat()
    await kart('[data-i-detay=antrenman]'); await pg.tap('[data-i-detay=antrenman]'); await durum('antrenman-detay')
    await pg.tap('[data-ad-har] >> nth=0'); await durum('hareket-gidisat')
    await pg.tap('#p-geri'); await pg.wait_for_timeout(300); await kapat()
    await kart('[data-i-detay=agri]'); await pg.tap('[data-i-detay=agri]'); await durum('agri-detay'); await kapat()
    await pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); await pg.wait_for_timeout(200)
    await pg.tap('[data-i-paylas]'); await durum('paylas')
    if ilk:
        m = await pg.locator('.il-onizleme').inner_text()
        dogrula('Paylaş önizlemesi 7 gün içeriyor', '20 Kasım' in m and '14 Kasım' in m and 'kcal' in m)
    await pg.tap('[data-py-ac=agri]'); await pg.tap('[data-py-gun="30"]'); await durum('paylas-30')
    await kapat()
    await pg.tap('[data-i-duzenle]'); await durum('duzenle'); await pg.tap('[data-kd=adim]'); await pg.wait_for_timeout(200); await pg.tap('#kd-tamam'); await pg.wait_for_timeout(400)
    if ilk: dogrula('Adım kartı gizlendi', await pg.locator('[data-i-detay=adim]').count() == 0)
    await pg.tap('[data-i-duzenle]'); await pg.tap('[data-kd=adim]'); await pg.tap('#kd-tamam'); await pg.wait_for_timeout(300)
    # Bugün'e dön, gün listesinden güne git
    await kart('[data-i-detay=beslenme]'); await pg.tap('[data-i-detay=beslenme]'); await pg.wait_for_timeout(300); await pg.tap('[data-md-gun] >> nth=2'); await pg.wait_for_timeout(600)
    if ilk: dogrula('Günler listesinden o güne gidildi', await pg.evaluate("document.querySelector('.alt-menu [data-ekran=bugun]').classList.contains('acik')"))
    for h in hata: rapor.append(f'❌ [{W}] sayfa hatası · {h[:160]}')
    await c.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        await calis(b, 412, 915, True); await calis(b, 360, 780, False)
        await b.close()
    print('\n'.join(sonuc)); print('\n'.join(rapor) if rapor else '✅ Kurallara takılan bir şey yok')
    print(f"{sum(1 for x in sonuc if x[0]=='✅')}/{len(sonuc)} geçti")
asyncio.run(main())
