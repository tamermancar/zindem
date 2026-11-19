"""1.7 Ayarlar / Mutfak uçtan uca testi (sahte tablo). Kullanım: python3 -I ayar_test.py <port> <çıktı>"""
import asyncio, json, sys, os, urllib.request
from playwright.async_api import async_playwright
PORT, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
def tablo(ad):
    return json.loads(urllib.request.urlopen(f'http://localhost:{PORT}/_tablo?ad=' + urllib.parse.quote(ad)).read() or 'null')
import urllib.parse
sonuc = []
def kontrol(ad, kosul, ek=''):
    sonuc.append(('✅' if kosul else '❌') + ' ' + ad + (' · ' + str(ek) if ek else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        c = await b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce')
        pg = await c.new_page(); hata = []
        pg.on('pageerror', lambda e: hata.append(str(e)))
        await pg.clock.set_fixed_time('2026-11-19T13:20:00+03:00')
        await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1200)
        async def bekle(ms=350): await pg.wait_for_timeout(ms)
        async def foto(ad): await bekle(); await pg.screenshot(path=f'{OUT}/{ad}.png')
        async def bos_kuyruk():
            for _ in range(40):
                n = await pg.evaluate("JSON.parse(localStorage.getItem('zindem-bekleyen')||'[]').length")
                if n == 0: return
                await bekle(150)
        # theme-color
        kontrol('Çubuk rengi açılıştan sonra zemin', (await pg.evaluate("document.querySelector('meta[name=theme-color]').content")).upper() == '#ECE8F4')
        await foto('01-bugun')
        # gelecek sekme
        kontrol('Akşam sekmesi soluk', await pg.evaluate("document.querySelector('.ogun-sekme[data-ogun=aksam]').classList.contains('gelecek')"))
        # profil menü
        await pg.click('#profil-dugme'); await foto('02-profil-menu')
        kontrol('Profil menüsü açıldı', await pg.is_visible('#pm-ayarlar'))
        await pg.click('#pm-yedek'); await bekle(800)
        kontrol('Yedek alındı', 'bugün' in (await pg.text_content('#pm-yedek-alt')), await pg.text_content('#pm-yedek-alt'))
        await pg.click('#pm-profil'); await bekle()
        await pg.fill('#p-ad', 'Deneme Kişi'); await pg.click('#p-kaydet'); await bekle(); await bos_kuyruk()
        ay = {r[1]: r for r in tablo('Ayarlar')[1:]}
        kontrol('Ad tabloya yazıldı + grup', ay.get('ad', [0, 0, ''])[2] == 'Deneme Kişi' and ay['ad'][0] == 'profil', ay.get('ad'))
        kontrol('Baş harfler DK', (await pg.text_content('#profil-dugme')).strip() == 'DK')
        # Ayarlar
        await pg.click('#pm-ayarlar'); await foto('03-ayarlar')
        await pg.click('#a-hedef'); await foto('04-hedefler')
        await pg.fill('#h-kalori', '1900'); await pg.click('#h-kaydet'); await bekle(); await bos_kuyruk()
        hd = tablo('Hedefler')
        kontrol('Kalori hedefi bugünden 1900', any(r[1] == 'kalori' and r[2] == 1900 for r in hd[1:]), hd[-1])
        kontrol('Bugün ekranı yeni hedefi kullanıyor', '1.900' in (await pg.text_content('.halka-alt')))
        await pg.click('#a-hedef'); await bekle()
        await pg.click('[data-h-tarih=baska]'); await bekle()
        await pg.fill('#h-tarih', '2026-12-01'); await pg.fill('#h-su_ml', '2750'); await pg.click('#h-kaydet'); await bekle(); await bos_kuyruk()
        hd = tablo('Hedefler')
        kontrol('Planlı su hedefi 1 Aralık', any(r[0] == '2026-12-01' and r[1] == 'su_ml' and r[2] == 2750 for r in hd[1:]), hd[-1])
        await pg.click('#a-hedef'); await foto('05-hedefler-planli')
        kontrol('Planlı listede görünüyor', await pg.is_visible('[data-h-sil]'))
        await pg.click('#p-geri'); await bekle()
        # Öğünler
        await pg.click('#a-ogun'); await foto('06-ogunler')
        await pg.click('[data-o-ac=cay]'); await bekle()
        await pg.fill('#o-ogle-b', '12:30')
        await pg.click('#o-kaydet'); await bekle(); await bos_kuyruk()
        ay = {r[1]: r for r in tablo('Ayarlar')[1:]}
        kontrol('Öğle 12:30 ve çay kapalı yazıldı', ay.get('ogle', [0, 0, ''])[2] == '12:30-15:59' and ay.get('cay_acik', [0, 0, ''])[2] == 'hayır', (ay.get('ogle'), ay.get('cay_acik')))
        kontrol('Bugün ekranında 3 öğün sekmesi', await pg.evaluate("document.querySelectorAll('.ogun-sekme').length") == 3)
        # hatalı saat
        await pg.click('#a-ogun'); await bekle(); await pg.fill('#o-aksam-b', '15:00'); await pg.click('#o-kaydet'); await bekle()
        kontrol('Çakışan saat reddedildi', 'bitmeden' in (await pg.text_content('#bildirim')))
        await pg.click('#o-varsayilan'); await pg.click('#o-kaydet'); await bekle(); await bos_kuyruk()
        # Su
        await pg.click('#a-su'); await foto('07-su')
        await pg.fill('#su-1', '250'); await pg.click('#su-kaydet'); await bekle(); await bos_kuyruk()
        ay = {r[1]: r for r in tablo('Ayarlar')[1:]}
        kontrol('Su düğmeleri 250,500,1000', str(ay.get('hizli_ekle_ml', [0, 0, ''])[2]) == '250,500,1000')
        # Ağrı
        await pg.click('#a-agri'); await foto('08-agri')
        await pg.fill('#k-0', '4'); await pg.click('#k-kaydet'); await bekle(); await bos_kuyruk()
        ay = {r[1]: r for r in tablo('Ayarlar')[1:]}
        kontrol('Dikkat eşiği 4', ay.get('agri_dikkat', [0, 0, ''])[2] == 4)
        # Tema
        await pg.click('[data-tema=koyu]'); await bekle()
        kontrol('Koyu tema', await pg.evaluate("document.documentElement.getAttribute('data-tema')") == 'koyu')
        kontrol('Koyu çubuk rengi', (await pg.evaluate("document.querySelector('meta[name=theme-color]').content")).upper() == '#100C1F')
        await foto('09-ayarlar-koyu')
        await pg.click('[data-tema=acik]'); await bekle(); await bos_kuyruk()
        # Veri
        await pg.click('#a-veri'); await bekle(700); await foto('10-veri')
        kontrol('Sayılar geldi', '…' not in (await pg.text_content('#pencere-ic')))
        await pg.check('[data-v-sec=hedefler]'); await pg.click('#v-secilen'); await foto('11-onay')
        kontrol('Onay düğmesi kapalı', await pg.is_disabled('#s-tamam'))
        await pg.fill('#s-onay', 'sıfırla'); await bekle(100)
        kontrol('SIFIRLA yazınca açık', not await pg.is_disabled('#s-tamam'))
        await pg.click('#s-tamam'); await bekle(1500)
        kontrol('Hedefler sıfırlandı', len(tablo('Hedefler')) == 1, len(tablo('Hedefler')))
        kontrol('Öğün kayıtları duruyor', len(tablo('Öğün Kayıtları')) > 5)
        # Mutfak
        await pg.click('[data-ekran=mutfak]'); await foto('12-mutfak')
        kontrol('Mutfak açıldı, hazır tarifler var', await pg.evaluate("document.querySelectorAll('[data-m-tarif]').length") >= 3)
        await pg.click('#m-yeni'); await bekle()
        await pg.fill('#tm-ara', 'yumurta'); await bekle()
        await pg.click('#tm-sonuc [data-tm-ekle] >> nth=0'); await bekle()
        await pg.fill('#tm-m-0', '2'); await pg.fill('#tm-ad', 'Test tarifi'); await foto('13-yeni-tarif')
        await pg.click('#tm-tamam'); await bekle(); await bos_kuyruk()
        kontrol('Tarif kaydedildi', any(r[1] == 'Test tarifi' for r in tablo('Tarifler')[1:]))
        kontrol('Öğün kaydı eklenmedi', not any(r[5] == 'Test tarifi' for r in tablo('Öğün Kayıtları')[1:]))
        await foto('14-mutfak-tarifim')
        await pg.click('[data-m-sekme=besin]'); await bekle(); await pg.click('[data-lg] >> nth=1'); await foto('15-mutfak-besin')
        # Bugün'e dön, tarif kaydı + öğün taşı + ipucu
        await pg.click('[data-ekran=bugun]'); await bekle()
        await pg.click('.ogun-sekme[data-ogun=kahvalti]'); await bekle()
        await pg.click('.ogun-kart [data-ekle]'); await bekle()
        await pg.fill('#arama', 'test tarifi'); await bekle()
        await pg.click('#sonuclar [data-tarif-ac] >> nth=0'); await bekle()
        await pg.click('#tm-tamam'); await bekle(); await bos_kuyruk()
        await pg.wait_for_timeout(3000)
        kontrol('İpucu gösterildi', 'sola çekerek' in (await pg.text_content('#bildirim')), await pg.text_content('#bildirim'))
        await pg.click('.ogun-kart [data-tarif-duzelt] >> nth=0'); await foto('16-tarif-kayit-ogun')
        await pg.click('[data-t-ogun=ogle]'); await pg.click('#tm-tamam'); await bekle(); await bos_kuyruk()
        ok = [r for r in tablo('Öğün Kayıtları')[1:] if r[5] == 'Test tarifi']
        kontrol('Tarif kaydı öğleye taşındı', ok and ok[-1][3] == 'Öğle', ok[-1][3] if ok else '')
        # tümünü sıfırla
        await pg.click('#profil-dugme'); await bekle(); await pg.click('#pm-ayarlar'); await bekle(); await pg.click('#a-veri'); await bekle(700)
        await pg.click('#v-tumu'); await bekle(); await pg.fill('#s-onay', 'SIFIRLA'); await pg.click('#s-tamam'); await bekle(1800)
        kontrol('Tümü: öğün kayıtları boş', len(tablo('Öğün Kayıtları')) == 1)
        kontrol('Tümü: Ayarlar boş (ad dahil)', len(tablo('Ayarlar')) == 1, tablo('Ayarlar'))
        kontrol('Tümü: tarifler boş', len(tablo('Tarifler')) == 1)
        await foto('17-sifir')
        kontrol('Sayfa hatası yok', not hata, hata)
        await b.close()
    print('\n'.join(sonuc))
asyncio.run(main())
