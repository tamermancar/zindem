"""1.11 işlev testi (Ekle ekranları): listede dokununca hemen öğüne yazılır, öğün çubuğu, "Kahvaltıda" bölümü, ölçü değişimi,
çıkarınca çubukta Geri al, Tamam, art arda basışların birleşmesi, "Dünkü kahvaltıyı ekle" + Geri al, sola çekme (yavaş: düğme, hızlı: hemen)
Bugün'de / Ekle listesinde / tarif malzemesinde.
Çalıştırma: node araclar/test/sahte.js . 8772 &  →  python3 -I araclar/test/surum111_test.py 8772 /tmp/t111   (her çalıştırmadan önce sunucuyu yeniden başlat)
"""
import asyncio, sys, os, json, time, urllib.request, urllib.parse
from playwright.async_api import async_playwright
import os as _o; exec(open(_o.path.join(_o.path.dirname(_o.path.abspath(__file__)), 'yazitipi.py'), encoding='utf-8').read())
PORT, CIKTI = sys.argv[1], sys.argv[2]; os.makedirs(CIKTI, exist_ok=True)
sonuc = []
def kontrol(ad, kosul, ayr=''):
    sonuc.append(('✅' if kosul else '❌') + ' ' + ad + ('' if kosul else ' · ' + str(ayr)))
def tablo(ad):
    with urllib.request.urlopen(f'http://localhost:{PORT}/_tablo?ad=' + urllib.parse.quote(ad)) as r: return json.loads(r.read().decode())
def bugun(gun='2026-11-21'):
    time.sleep(1.3)  # öğün kayıtları 0,8 sn bekleyip birlikte gider
    t = tablo('Öğün Kayıtları'); bas = t[0]; return [dict(zip(bas, x)) for x in t[1:] if x[1] == gun]

# Sola çekme: satırın içinden pointer olaylarıyla (adim sayısı × bekleme = hız)
CEK = """([sec, dx, adim, ms]) => new Promise(son => {
  const el = document.querySelector(sec); if (!el) { son(false); return; }
  const r = el.getBoundingClientRect(), x = r.right - 30, y = r.top + Math.min(20, r.height / 2), h = document.elementFromPoint(x, y) || el;
  const ev = (t, xx) => h.dispatchEvent(new PointerEvent(t, { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: xx, clientY: y, bubbles: true, cancelable: true }));
  ev('pointerdown', x); let i = 0;
  const git = () => { i++; ev('pointermove', x - dx * i / adim); if (i < adim) setTimeout(git, ms); else { ev('pointerup', x - dx); setTimeout(() => son(true), 450); } };
  setTimeout(git, ms);
})"""

# Balonu it: dx yatay, dy dikey (yukarı negatif)
BALON = """([dx, dy]) => new Promise(son => {
  const b = document.getElementById('bildirim'), r = b.getBoundingClientRect(), x = r.left + 30, y = r.top + r.height / 2;
  const ev = (t, xx, yy) => b.dispatchEvent(new PointerEvent(t, { pointerId: 2, pointerType: 'touch', isPrimary: true, clientX: xx, clientY: yy, bubbles: true }));
  ev('pointerdown', x, y); let i = 0;
  const git = () => { i++; ev('pointermove', x + dx * i / 6, y + dy * i / 6); if (i < 6) setTimeout(git, 30); else { ev('pointerup', x + dx, y + dy); setTimeout(() => son(b.hidden), 400); } };
  setTimeout(git, 30);
})"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        c = await b.new_context(viewport={'width': 360, 'height': 780}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce')
        await yazi_tipi(c)
        pg = await c.new_page(); hata = []; pg.on('pageerror', lambda e: hata.append(str(e)))
        istek = []; pg.on('request', lambda r: istek.append(r) if r.method == 'POST' else None)
        await pg.clock.set_fixed_time('2026-11-21T08:10:00+03:00')
        await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1300)
        async def foto(ad): await pg.wait_for_timeout(350); await pg.screenshot(path=f'{CIKTI}/{ad}.png')
        async def bekle(ms=350): await pg.wait_for_timeout(ms)
        async def cubuk(): return await pg.evaluate("[...document.querySelectorAll('.ogun-cubuk small, .ogun-cubuk b, .ogun-cubuk .ana-dugme')].map(e => e.textContent.trim()).join(' | ')")

        # 0) Kahvaltı boşalt (örnekte Ayran var) → "Dünkü kahvaltıyı ekle" düğmesi
        await pg.tap('.ogun-kart [data-az]'); await pg.tap('.ogun-kart [data-az]'); await bekle(500)
        await pg.evaluate("document.getElementById('bildirim').hidden = true")
        kontrol('Boş kahvaltıda "Dünkü kahvaltıyı ekle" var', await pg.locator('.ogun-kart [data-tekrar]').count() == 1)

        # 1) Dünkü ekle: doğrudan kayda + Geri al
        await pg.tap('.ogun-kart [data-tekrar]'); await bekle(900)
        b1 = await pg.inner_text('#bildirim')
        kontrol('Dünkü ekle: "1 besin kahvaltıya eklendi · Geri al" balonu', 'kahvaltıya eklendi' in b1 and 'Geri al' in b1, b1)
        kontrol('Dünkü ekle: kayıt tabloya yazıldı', any(k['Öğün'] == 'Kahvaltı' and k['Ad'] == 'Ayran' for k in bugun()), bugun())
        await foto('01-dunku')
        await pg.tap('#bildirim-dugme'); await bekle(900)
        kontrol('Dünkü ekle Geri al: kayıt silindi', not any(k['Öğün'] == 'Kahvaltı' for k in bugun()), bugun())
        await pg.tap('.ogun-kart [data-tekrar]'); await bekle(600)
        kontrol('Geri al balonunda × var', await pg.locator('#bildirim #bildirim-kapat').count() == 1)
        kontrol('Balon sola itince kapandı', await pg.evaluate(BALON, [-140, 0]))

        # 2) Ekle: Kahvaltıda bölümü, çubuk, dokununca hemen ekleme
        await pg.tap('.ogun-kart [data-ekle]'); await bekle(500)
        bas = await pg.text_content('#sonuclar .bolum-baslik >> nth=0')
        kontrol('Önerilen en üstte "Kahvaltıda" bölümü (öğünde olan Ayran)', bas.strip() == 'Kahvaltıda' and await pg.locator('#sonuclar [data-kayit]').count() == 1, bas)
        kontrol('Çubuk: "Kahvaltı · 1 besin | 72 kcal · 4 g | Tamam"', await cubuk() == 'Kahvaltı · 1 besin | 72 kcal · 4 g | Tamam', await cubuk())
        n0 = len(bugun())
        await pg.tap('#sonuclar [data-sec] >> nth=0'); await bekle(500)
        kontrol('+ ile hemen tabloya yazıldı', len(bugun()) == n0 + 1, len(bugun()))
        kontrol('Eklenen satır yerinde "− n +" oldu', await pg.locator('#sonuclar .sofrada').count() == 2)
        kontrol('Çubuk 2 besin', '2 besin' in await cubuk(), await cubuk())
        ad2 = await pg.text_content('#sonuclar .sonuc:has([data-sec]) .bilgi b >> nth=0')
        await pg.tap('#sonuclar .sonuc:has([data-sec]) .bilgi >> nth=0'); await bekle(500)
        kontrol('Satırın adına dokununca da eklenir', any(k['Ad'] == ad2.replace(' Benim', '').strip() for k in bugun()), ad2)
        await foto('02-eklendi')

        # 3) Art arda + basışları birleşir (az istek)
        await bekle(800); once = len(istek)
        for _ in range(4): await pg.tap('#sonuclar .sofrada [data-art] >> nth=1')
        await bekle(1200)
        kontrol('4 hızlı + basışı ≤ 2 istekle gitti', len(istek) - once <= 2, len(istek) - once)
        m = [k for k in bugun() if k['Öğün'] == 'Kahvaltı']
        kontrol('Son miktar tabloda doğru (+4 adım)', any(float(k['Miktar']) >= 3 for k in m), [(k['Ad'], k['Miktar']) for k in m])

        # 4) Ölçü değişimi tabloya yazılır
        await pg.tap('#sonuclar .sofrada .miktar-dugme >> nth=1'); await bekle(300)
        kontrol('Ölçü seçenekleri açıldı', await pg.locator('#sonuclar .olcu-secim').count() == 1)
        await foto('03-olcu')
        sec = pg.locator('#sonuclar .olcu-secim .cip:not(.secili)').first; yeni = (await sec.inner_text()).strip()
        await sec.tap(); await bekle(900)
        kontrol('Ölçü değişti: tabloda yeni ölçü', any(yeni.split(' ·')[0] in str(k['Ölçü']) or (yeni == 'gram' and k['Ölçü'] == 'gram') for k in bugun()), (yeni, [k['Ölçü'] for k in bugun()]))
        kontrol('Kaldır düğmesi kapalıyken görünmüyor', await pg.evaluate("[...document.querySelectorAll('#sonuclar .kaydir-sil')].every(d => getComputedStyle(d).visibility === 'hidden')"))

        # 5) Yavaş sola çekme → Kaldır düğmesi; dokununca çıkar, çubukta Geri al
        await pg.evaluate(CEK, ['#sonuclar .kaydir .sonuc', 70, 8, 60]);
        kontrol('Ekle: yavaş çekince Kaldır düğmesi açıldı', await pg.locator('#sonuclar .kaydir.acik').count() == 1)
        await foto('04-kaldir')
        n1 = len(bugun()); await pg.tap('#sonuclar .kaydir.acik .kaydir-sil'); await bekle(800)
        kontrol('Kaldır: tablodan silindi', len(bugun()) == n1 - 1, len(bugun()))
        kontrol('Çubukta "Çıkarıldı · … | Geri al"', (await cubuk()).startswith('Çıkarıldı · ') and 'Geri al' in await cubuk(), await cubuk())
        await foto('05-geri-al')
        await pg.tap('#oc-geri'); await bekle(800)
        kontrol('Çubuktan Geri al: kayıt döndü', len(bugun()) == n1, len(bugun()))
        # 6) Hızlı çekme → hemen
        n2 = len(bugun()); await pg.evaluate(CEK, ['#sonuclar .kaydir .sonuc', 260, 3, 12]); await bekle(500)
        kontrol('Ekle: sonuna kadar/hızlı çekince hemen çıkar', len(bugun()) == n2 - 1, len(bugun()))
        await pg.tap('#oc-geri'); await bekle(1500)
        # 7) − ile 0 → çıkar + Geri al
        n3 = len(bugun())
        for _ in range(12):
            if await pg.locator('#sonuclar .sofrada [data-az] >> nth=0').count() == 0: break
            await pg.tap('#sonuclar .sofrada [data-az] >> nth=0'); await bekle(150)
            if 'Çıkarıldı' in await cubuk(): break
        await bekle(1500)
        kontrol('− ile sıfıra inince çıkar ve Geri al çıkar', len(bugun()) == n3 - 1 and 'Geri al' in await cubuk(), (len(bugun()), await cubuk()))
        # 8) Arama + grup sekmesi: öğündekiler yerinde
        ara = (await pg.text_content('#sonuclar .sofrada .bilgi b >> nth=0')).split(',')[0].split(' (')[0].strip()
        await pg.fill('#arama', ara); await bekle(400)
        kontrol('Aramada öğündeki besin "− n +" ile', await pg.locator('#sonuclar .sofrada').count() >= 1)
        kontrol('Klavye açıkken çubuk gizli (klavyenin arkasında kalmasın)', await pg.evaluate("getComputedStyle(document.querySelector('.ogun-cubuk')).display === 'none'"))
        await pg.fill('#arama', ''); await pg.evaluate("document.activeElement.blur()"); await bekle(400)
        # 9) Tamam: pencere kapanır, Bugün'de aynı öğün kartı
        n4 = len([k for k in bugun() if k['Öğün'] == 'Kahvaltı'])
        await pg.tap('#oc-tamam'); await bekle(500)
        kontrol('Tamam: pencere kapandı', await pg.evaluate("document.getElementById('pencere').hidden"))
        kontrol('Bugün kartında öğündekiler', await pg.locator('.ogun-kart .kaydir').count() == n4, (await pg.locator('.ogun-kart .kaydir').count(), n4))

        # 10) Bugün: yavaş çek → Sil; hızlı çek → hemen + Geri al balonu
        await pg.evaluate(CEK, ['.ogun-kart .kaydir .satir', 70, 8, 60])
        kontrol('Bugün: yavaş çekince Sil düğmesi', await pg.locator('.ogun-kart .kaydir.acik').count() == 1 and 'Sil' in await pg.inner_text('.ogun-kart .kaydir.acik .kaydir-sil'))
        await foto('06-bugun-sil')
        await pg.tap('.ogun-kart .ogun-yazi'); await bekle(300)
        n5 = len(bugun()); await pg.evaluate(CEK, ['.ogun-kart .kaydir .satir', 300, 3, 12]); await bekle(600)
        b5 = await pg.inner_text('#bildirim'); g5 = await pg.evaluate("!document.getElementById('bildirim').hidden"); kontrol('Bugün: hızlı çekince hemen silindi + Geri al', len(bugun()) == n5 - 1 and g5 and 'silindi' in b5, (n5, len(bugun()), b5, g5))
        await pg.tap('#bildirim-dugme'); await bekle(700)
        kontrol('Bugün Geri al: kayıt döndü', len(bugun()) == n5, len(bugun()))

        # 11) Tarif malzemesi: yavaş çek → Kaldır; Geri al aynı yerine
        await pg.tap('.ogun-kart [data-ekle]'); await bekle(500)
        await pg.fill('#arama', 'taze fasulye'); await bekle(400)
        await pg.tap('#pencere .malz-link >> nth=0'); await bekle(600)
        say = await pg.locator('#pencere .tm-satir').count(); ilk = await pg.inner_text('#pencere .tm-satir .bilgi b >> nth=0')
        await pg.evaluate(CEK, ['#pencere .kaydir .tm-satir', 70, 8, 60])
        kontrol('Tarif: yavaş çekince Kaldır', await pg.locator('#pencere .kaydir.acik').count() == 1 and 'Kaldır' in await pg.inner_text('#pencere .kaydir.acik .kaydir-sil'))
        await foto('07-tarif-kaldir')
        await pg.tap('#pencere .kaydir.acik .kaydir-sil'); await bekle(400)
        kontrol('Tarif: malzeme kaldırıldı + Geri al', await pg.locator('#pencere .tm-satir').count() == say - 1 and 'Geri al' in await pg.inner_text('#bildirim'))
        await pg.tap('#bildirim-dugme'); await bekle(400)
        kontrol('Tarif Geri al: malzeme aynı yerinde', await pg.locator('#pencere .tm-satir').count() == say and await pg.inner_text('#pencere .tm-satir .bilgi b >> nth=0') == ilk)
        await pg.tap('#pencere [data-tm-sil] >> nth=0'); await bekle(300)
        await pg.tap('#bildirim-kapat'); await bekle(300)
        kontrol('× balonu kapattı, malzeme kaldırılmış kaldı', await pg.evaluate("document.getElementById('bildirim').hidden") and await pg.locator('#pencere .tm-satir').count() == say - 1)

        # 12) Boş öğünde çubuk: "Öğle · boş | 0 kcal · 0 g"
        await pg.evaluate("document.getElementById('kapat').click()"); await bekle(400)
        await pg.tap('[data-ogun="ogle"]'); await bekle(300); await pg.tap('.ogun-kart [data-ekle]'); await bekle(500)
        kontrol('Boş öğün çubuğu: "Öğle · boş | 0 kcal · 0 g | Tamam"', await cubuk() == 'Öğle · boş | 0 kcal · 0 g | Tamam', await cubuk())
        await foto('08-bos-ogun')

        # 13) Düğmesiz balon: × yok, yukarı itince kapanır
        await pg.evaluate("document.getElementById('kapat').click()"); await bekle(400)
        await pg.evaluate("document.querySelector('[data-ekran=mutfak]').click()"); await bekle(300)
        await pg.evaluate("document.querySelector('[data-ekran=bugun]').click()"); await bekle(300)
        await pg.tap('.ogun-kart [data-ekle]'); await bekle(400)
        await pg.fill('#arama', 'zzqx'); await bekle(300)
        await pg.click('#elle'); await bekle(400)
        await pg.fill('#e-ad', 'Deneme besini'); await pg.fill('#e-kcal', '100'); await pg.fill('#e-p', '5')
        await pg.click('#e-kaydet'); await bekle(400)
        kontrol('Düğmesiz balonda × yok', not await pg.evaluate("document.getElementById('bildirim').hidden") and await pg.locator('#bildirim-kapat').count() == 0, await pg.inner_text('#bildirim'))
        kontrol('Balon yukarı itince kapandı', await pg.evaluate(BALON, [0, -90]))
        kontrol('Kendin ekle: doğrudan öğüne yazıldı', any(k['Ad'] == 'Deneme besini' for k in bugun()))

        # 14) Ayar: Geri al balonu 3 / 5 / 8 sn
        await pg.evaluate("document.getElementById('kapat').click()"); await bekle(400)
        await pg.click('#profil-dugme'); await bekle(); await pg.click('#pm-ayarlar'); await bekle(500)
        kontrol('Ayarlar: varsayılan 5 sn seçili', await pg.get_attribute('[data-geri-sn="5"]', 'aria-pressed') == 'true')
        await foto('09-ayar-geri-al')
        await pg.tap('[data-geri-sn="3"]'); await bekle(300)
        time.sleep(1.3)
        ay = {r[1]: r[2] for r in tablo('Ayarlar')[1:]}
        kontrol('Ayar tabloya yazıldı: geri_al_sn = 3', str(ay.get('geri_al_sn')) == '3', ay.get('geri_al_sn'))
        kontrol('3 sn seçili görünüyor', await pg.get_attribute('[data-geri-sn="3"]', 'aria-pressed') == 'true')

        for h in hata: sonuc.append('❌ sayfa hatası · ' + h[:200])
        await b.close()
    print('\n'.join(sonuc)); print(f"\n{sum(1 for s in sonuc if s.startswith('✅'))}/{len(sonuc)}")
    sys.exit(0 if all(s.startswith('✅') for s in sonuc) else 1)
try: asyncio.run(main())
except SystemExit: raise
except Exception as e:
    print('\n'.join(sonuc)); print('❌ test durdu ·', str(e).split('\n')[0]); sys.exit(1)
