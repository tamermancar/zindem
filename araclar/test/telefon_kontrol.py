"""Zindem telefon kontrolü (1.8.1): Tamer'e sunmadan önce her sürümde çalıştırılır.
Uygulamayı telefon gibi açar (dokunmatik, 412 × 915 ve 360 × 780), bütün ekran ve pencereleri gezer,
Tamer'in daha önce yakaladığı hata türlerini kurallarla arar ve her durumun ekran görüntüsünü alır.
Görüntüler ayrıca Evidence Collector rolünde gözle incelenir (bkz. OKUBENI.md).

Kullanım: python3 -I telefon_kontrol.py <port> <çıktı klasörü> [koyu]
Çıktı: <klasör>/<genişlik>/*.png, kolaj-<genişlik>.jpg, rapor.txt · Hata varsa çıkış kodu 1.
"""
import urllib.request
import asyncio, sys, os
from playwright.async_api import async_playwright

PORT, CIKTI = sys.argv[1], sys.argv[2]
KOYU = len(sys.argv) > 3 and sys.argv[3] == 'koyu'
EKRANLAR = [(412, 915), (360, 780)]
rapor, hata_say = [], [0]

# Kural 1-3: ekranda görünen her şey için (her durumda çalışır)
KURALLAR = r"""() => {
  const out = [], W = innerWidth, H = innerHeight;
  const gorunur = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.bottom > 0 && r.top < H && !e.closest('[hidden]'); };
  const ad = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const golgeBoy = s => { if (!s || s === 'none') return 0; let m = 0;
    s.split(/,(?![^(]*\))/).forEach(p => { if (/inset/.test(p)) return; const n = (p.replace(/rgba?\([^)]*\)|#[0-9a-f]+/gi, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
      const [x = 0, y = 0, bl = 0, sp = 0] = n; m = Math.max(m, Math.max(Math.abs(x), Math.abs(y)) + bl * 0.6 + sp); }); return m; };
  const pen = document.getElementById('pencere'), penAcik = pen && !pen.hidden;
  const saydam = a => { const c = getComputedStyle(a); return c.backgroundImage === 'none' && /rgba\(.*,\s*0\)|transparent/.test(c.backgroundColor); };
  for (const e of document.querySelectorAll('body *')) {
    if (!gorunur(e) || e.closest('svg, .gizli-yazi')) continue;
    if (penAcik && !e.closest('#pencere, .bildirim')) continue; // pencere açıkken arkadaki sayfa perdenin altında
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    // 1) Gölge kesilmesi: gölgesi olan kutu, taşmayı kırpan bir üst kutunun kenarına dayanıyor
    const g = golgeBoy(cs.boxShadow);
    if (g >= 4) {
      for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
        const ac = getComputedStyle(a), ox = ac.overflowX, oy = ac.overflowY;
        if (ox === 'visible' && oy === 'visible') continue;
        const ar = a.getBoundingClientRect();
        const yatay = ox !== 'visible' && (r.left - g < ar.left - 0.5 || r.right + g > ar.right + 0.5);
        const dikey = (oy === 'clip' || oy === 'hidden') && (r.top - g < ar.top - 0.5 || r.bottom + g > ar.bottom + 0.5);
        // Saydam bir düzen kutusu kırpıyorsa kesik gölge sayfada görünür; kart/pencere zemini kırpıyorsa kenar doğaldır
        if ((yatay || dikey) && saydam(a)) { out.push(['❌', 'Gölge kesiliyor', ad(e) + ' gölgesi ' + ad(a) + ' tarafından kırpılıyor']); break; }
      }
    }
    // 2) Yazı taşması: tek satırlık yazı kutusundan taşıyor ama "…" yok
    // (1.8.1+ antrenman taslağı) taşma görünür olsa da sayılır: yazı kutusundan dışarı akıp başka öğenin altına giriyor
    if (e.children.length === 0 && e.textContent.trim() && e.clientWidth > 0 && cs.display !== 'inline' && cs.textOverflow !== 'ellipsis' && (() => { const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect().width > e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 1; })())
      out.push(['❌', 'Yazı kesiliyor', ad(e) + ': "' + e.textContent.trim().slice(0, 40) + '"']);
    // 2b) Stilsiz düğme: tarayıcının varsayılan düğmesi (gri zemin / kabarık kenar) — yanlış sınıf adı demek
    if (e.tagName === 'BUTTON' && (/outset/.test(cs.borderTopStyle) || cs.backgroundColor === 'rgb(239, 239, 239)' || cs.backgroundColor === 'rgb(240, 240, 240)'))
      out.push(['❌', 'Stilsiz düğme', ad(e) + ': "' + e.textContent.trim().slice(0, 30) + '"']);
    // 2c) Simge yazının üstünde/ayrı satırda: arama kutusunda simge ile kutu aynı satırda olmalı
    if (e.matches('.arama-kutu')) { const i = e.querySelector('.ikon'), k = e.querySelector('input');
      if (i && k) { const a = i.getBoundingClientRect(), bb = k.getBoundingClientRect(); if (a.bottom <= bb.top + 2) out.push(['❌', 'Arama simgesi kutunun dışında', ad(e)]); } }
    // 3) Uzun açıklama yazısı (Tamer kuralı: "commit mesajı gibi" açıklamalar gösterilmez)
    if (/^(P|SMALL|DIV|SPAN)$/.test(e.tagName) && e.matches('.ipucu, .aciklama, p') && !e.closest('.liste-satir, .satir, .sonuc, .bildirim, .not-kart, .alt-not, .menu-not, .yedek-kutu')) {
      const t = e.innerText.trim(); if (t.length > 70) out.push(['⚠', 'Uzun açıklama', ad(e) + ': "' + t.slice(0, 50) + '…" (' + t.length + ' harf)']);
    }
  }
  // 4) Sayfa yana taşıyor
  if (document.documentElement.scrollWidth > W + 1) out.push(['❌', 'Yana taşma', 'sayfa genişliği ' + document.documentElement.scrollWidth + ' > ' + W]);
  return out;
}"""


def yaz(gen, durum, isaret, tur, ayrinti):
    if isaret == '❌': hata_say[0] += 1
    rapor.append(f'{isaret} [{gen} px] {durum} · {tur} · {ayrinti}')


async def bir_ekran(b, W, H):
    klasor = f'{CIKTI}/{W}'; os.makedirs(klasor, exist_ok=True)
    c = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True,
                            locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce', color_scheme='dark' if KOYU else 'light')
    pg = await c.new_page(); sayfa_hata = []
    urllib.request.urlopen(f'http://localhost:{PORT}/_ant_sifirla').read()
    pg.on('pageerror', lambda e: sayfa_hata.append(str(e)))
    await pg.clock.set_fixed_time('2026-11-19T13:20:00+03:00')
    await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1300)
    if KOYU: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
    goruntu = []
    gorulen = set()

    async def bekle(ms=350): await pg.wait_for_timeout(ms)

    async def durum(ad):
        await bekle()
        for isaret, tur, ayr in await pg.evaluate(KURALLAR):
            anahtar = (tur, ayr)
            if anahtar in gorulen: continue  # aynı hata her durumda tekrar yazılmasın
            gorulen.add(anahtar); yaz(W, ad, isaret, tur, ayr)
        yol = f'{klasor}/{len(goruntu) + 1:02d}-{ad}.png'
        await pg.screenshot(path=yol); goruntu.append((ad, yol))

    async def kapat():
        await pg.evaluate("(()=>{const k=document.getElementById('kapat'); if(k) k.click();})()"); await bekle(450)

    async def adim(ad, f):
        try: await f()
        except Exception as e: yaz(W, ad, '❌', 'Test adımı çalışmadı', str(e).split('\n')[0][:160])

    async def kaydir_sabit_mi(ad, kap, baslik):
        """5) Sabit başlık: listeyi en alta kaydırınca başlık görünmeye devam etmeli."""
        if kap == 'pencere':
            await pg.evaluate("(()=>{const p=document.getElementById('pencere'); p.scrollTop=p.scrollHeight;})()")
        else:
            await pg.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await bekle(250)
        top = await pg.evaluate(f"(()=>{{const e=document.querySelector('{baslik}'); if(!e) return null; const r=e.getBoundingClientRect(); return r.top;}})()")
        kaydi = await pg.evaluate("document.getElementById('pencere').scrollTop" if kap == 'pencere' else "scrollY")
        if top is None or (kaydi > 20 and (top < -2 or top > H)):
            yaz(W, ad, '❌', 'Başlık sabit değil', f'{baslik} kaydırınca kayboluyor (top {top})')
        await durum(ad + '-alt')
        if kap == 'pencere': await pg.evaluate("document.getElementById('pencere').scrollTop=0")
        else: await pg.evaluate("window.scrollTo(0,0)")

    async def odak_kayiyor_mu(ad, kutu):
        """6) Yazı kutusuna dokununca liste kaymamalı, kutu görünür kalmalı (klavye açılışı: ekran yarıya iner)."""
        once = await pg.evaluate("(()=>{const p=document.getElementById('pencere'); return p&&!p.hidden ? p.scrollTop : scrollY;})()")
        r0 = await pg.evaluate(f"(()=>{{const r=document.querySelector('{kutu}').getBoundingClientRect(); return r.bottom;}})()")
        zaten_gorunur = r0 < H * 0.55 - 8  # klavye açılınca da görünecek yerde mi?
        await pg.tap(kutu); await bekle(150)
        await pg.set_viewport_size({'width': W, 'height': int(H * 0.55)}); await bekle(700)
        sonra = await pg.evaluate("(()=>{const p=document.getElementById('pencere'); return p&&!p.hidden ? p.scrollTop : scrollY;})()")
        r = await pg.evaluate(f"(()=>{{const r=document.querySelector('{kutu}').getBoundingClientRect(); return [r.top, r.bottom];}})()")
        if zaten_gorunur and abs(sonra - once) > 2: yaz(W, ad, '❌', 'Dokununca liste kaydı', f'{kutu}: kaydırma {once} → {sonra}, üstteki satırlar kayboldu')
        if r[0] < 0 or r[1] > H * 0.55: yaz(W, ad, '❌', 'Yazı kutusu klavyenin altında', f'{kutu} {r}')
        await durum(ad + '-klavye')
        await pg.evaluate("document.activeElement && document.activeElement.blur()")
        await pg.set_viewport_size({'width': W, 'height': H}); await bekle(300)

    async def akordeon(ad, ilk, son, ust):
        """7) Açılır grup: başlığa dokununca başlık ekranın tepesinde (sabit bölümün altında) kalmalı."""
        await pg.tap(f'[data-lg="{ilk}"]'); await bekle(300)
        await pg.evaluate(f"document.querySelector('[data-lg^=\"{son}\"]').scrollIntoView({{block:'end'}})"); await bekle(250)
        await pg.tap(f'[data-lg^="{son}"]'); await bekle(400)
        t = await pg.evaluate(f"document.querySelector('[data-lg^=\"{son}\"]').getBoundingClientRect().top")
        alt = await pg.evaluate(f"(()=>{{const e=document.querySelector('{ust}'); return e ? e.getBoundingClientRect().bottom : 0;}})()")
        if not (alt - 4 <= t <= alt + 60): yaz(W, ad, '❌', 'Açılan grup başlığı yerinde değil', f'başlık top {round(t)}, beklenen ≈ {round(alt)}')
        await durum(ad)

    # ---------- Bugün ----------
    await durum('bugun')
    async def bugun_alt():
        await pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); await durum('bugun-alt'); await pg.evaluate("window.scrollTo(0,0)")
    await adim('bugun-alt', bugun_alt)
    for i, ad in [(0, 'kahvalti'), (2, 'aksam-gelecek')]:
        async def s(i=i, ad=ad): await pg.tap(f'.ogun-sekme >> nth={i}'); await durum(ad)
        await adim(ad, s)
    await adim('ogle', lambda: pg.tap('.ogun-sekme >> nth=1'))

    # ---------- Ekle penceresi ----------
    async def ekle():
        await pg.tap('.ogun-kart [data-ekle]'); await durum('ekle')
        await kaydir_sabit_mi('ekle', 'pencere', '#pencere-baslik')
        await odak_kayiyor_mu('ekle-arama', '#arama')
        await pg.fill('#arama', 'zeytin'); await durum('ekle-arama-sonuc')
        await pg.tap('#sonuclar .sonuc .bilgi >> nth=0'); await durum('ekle-sofrada')
        await pg.fill('#arama', ''); await bekle(200)
        await pg.tap('.pencere-bas .sekme-ciz >> nth=2'); await durum('ekle-grup')
    await adim('ekle', ekle); await kapat()

    async def tarif():
        await pg.tap('.ogun-kart [data-ekle]'); await bekle(300); await pg.fill('#arama', 'omlet'); await bekle(300)
        await pg.tap('#sonuclar [data-tarif-ac] >> nth=0'); await durum('tarif')
        await kaydir_sabit_mi('tarif', 'pencere', '#pencere-baslik')
        miktar = await pg.query_selector('#pencere .tm-miktar')
        if miktar: await odak_kayiyor_mu('tarif-miktar', '#pencere .tm-miktar')
    await adim('tarif', tarif); await kapat()

    async def su(): await pg.tap('.ls-su'); await durum('su')
    await adim('su', su); await kapat()
    async def adm(): await pg.tap('.ls-adim'); await durum('adim')
    await adim('adim', adm); await kapat()

    async def agri():
        await pg.tap('#agri-dugme'); await durum('agri')
        await pg.tap('#yeni-not'); await durum('yeni-not')
        await pg.select_option('#n-tur', 'antrenman kaynaklı'); await pg.select_option('#n-bolge', 'omuz'); await pg.select_option('#n-taraf', 'sol')
        await durum('yeni-not-dolu')
        await odak_kayiyor_mu('yeni-not-hareket', '#n-hareket')
    await adim('agri', agri); await kapat()

    async def takvim(): await pg.tap('[data-takvim]'); await durum('takvim')
    await adim('takvim', takvim); await kapat()

    # ---------- Mutfak ----------
    async def mutfak():
        await pg.tap('[data-ekran=mutfak]'); await durum('mutfak-tarif')
        await kaydir_sabit_mi('mutfak-tarif', 'sayfa', '#m-ara')
        await pg.tap('[data-m-sekme=besin]'); await durum('mutfak-besin')
        await akordeon('mutfak-akordeon', 'Yağ, sos ve diğer', 'Tarif malzemeleri', '.m-ust')
        await kaydir_sabit_mi('mutfak-besin', 'sayfa', '#m-ara')
        await pg.evaluate("window.scrollTo(0,0)")
        await pg.tap('#m-yeni'); await durum('yeni-tarif'); await kapat()
    await adim('mutfak', mutfak)
    await adim('bugune', lambda: pg.tap('[data-ekran=bugun]')); await bekle()

    # ---------- Profil menüsü ve Ayarlar ----------
    async def ayarlar():
        await pg.tap('#profil-dugme'); await durum('profil-menu')
        await pg.tap('#pm-ayarlar'); await durum('ayarlar')
        for k in ['hedef', 'ogun', 'su', 'agri', 'veri']:
            await pg.tap(f'#a-{k}'); await durum(f'ayar-{k}')
            await kaydir_sabit_mi(f'ayar-{k}', 'pencere', '#pencere-baslik')
            geri = await pg.query_selector('#pencere .geri')
            if geri: await geri.tap(); await bekle()
    await adim('ayarlar', ayarlar); await kapat()

    # ---------- Antrenman (1.9): sıfırdan başlayan biri gibi ----------
    async def antrenman():
        await pg.tap('[data-ekran=antrenman]'); await durum('ant-bos')
        await pg.tap('[data-a-hazir=hz-tum]'); await durum('ant-hazir')
        await kaydir_sabit_mi('ant-hazir', 'pencere', '#pencere-baslik')
        await pg.tap('#hz-kullan'); await bekle(900); await durum('ant-tanisma-1')
        await pg.tap('[data-t=yer][data-d=ev]'); await pg.tap('#t-devam'); await durum('ant-tanisma-2')
        await pg.tap('[data-t=ekipman][data-d=sandalye]'); await pg.tap('#t-devam'); await durum('ant-tanisma-3')
        await pg.tap('[data-t=durum][data-d=ayakta]'); await pg.tap('#t-devam'); await durum('ant-tanisma-4')
        await pg.tap('[data-t=hassas][data-d="kol"]'); await durum('ant-tanisma-uzuv')
        await pg.tap('[data-u="kol"][data-ut=sol]'); await pg.tap('[data-u="kol"][data-ud=agri]'); await pg.tap('[data-t=hassas][data-d="diz"]')
        await pg.tap('#t-devam'); await bekle(500); await durum('ant-dinlenme')
        await pg.tap('[data-a-gun="2026-11-18"]'); await durum('ant-gun')
        for i in [0, 2, 3]: await pg.tap(f'.an-set:not(.ekle):not(.tamam) >> nth={i}'); await bekle(150)
        await pg.tap('.an-set.tamam >> nth=1'); await durum('ant-set-duzen')
        await pg.tap('[data-a-tekrar="1"]'); await bekle(150)
        await pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); await durum('ant-gun-alt'); await pg.evaluate("window.scrollTo(0,0)")
        await pg.tap('[data-a-kisa="1"]'); await durum('ant-kisa')
        await pg.tap('[data-a-kisa="0"]'); await bekle()
        await pg.tap('[data-a-detay] >> nth=2'); await durum('ant-detay')
        await kaydir_sabit_mi('ant-detay', 'pencere', '#pencere-baslik'); await kapat()
        await pg.tap('[data-a-bitir]'); await durum('ant-bitir')
        await pg.tap('[data-b-agri=evet]'); await durum('ant-bitir-agri'); await pg.tap('#b-tamam'); await durum('ant-agri-not'); await kapat()
        await pg.tap('[data-a-sekme=program]'); await durum('ant-program')
        await pg.tap('[data-a-program-duzenle]'); await durum('ant-program-duzenle')
        await kaydir_sabit_mi('ant-program-duzenle', 'pencere', '#pencere-baslik')
        await pg.tap('[data-p-ant] >> nth=0'); await durum('ant-antrenman-duzenle')
        await pg.tap('[data-a-oge] >> nth=2'); await durum('ant-hareket-ayar')
        await pg.tap('#h-tamam'); await bekle()
        await pg.tap('[data-a-ekle-bolum=ana]'); await durum('ant-hareket-sec')
        await odak_kayiyor_mu('ant-hareket-sec', '#hs-ara')
        await pg.tap('[data-hs] >> nth=0'); await durum('ant-hareket-sec-sepet'); await kapat()
        await pg.tap('[data-a-sekme=hareket]'); await bekle(600); await durum('ant-hareketler')
        await kaydir_sabit_mi('ant-hareketler', None, '.m-ust')
        await odak_kayiyor_mu('ant-hareketler', '#a-ara')
        await pg.tap('[data-a-filtre=bolge]'); await durum('ant-filtre'); await pg.tap('[data-f="bacak"]'); await durum('ant-filtre-bacak')
        await pg.tap('[data-a-kendi]'); await durum('ant-kendi'); await kapat()
        await pg.tap('[data-ekran=bugun]'); await bekle()
    await adim('antrenman', antrenman); await kapat()

    async def ilerleme():  # 1.10: boş başlayan kullanıcı (örnek veride ölçüm yok)
        await pg.tap('[data-ekran=ilerleme]'); await pg.wait_for_selector('.il-kart, .il-basla'); await durum('il-ilk')
        await pg.tap('[data-i-olcum] >> nth=0'); await durum('il-ilk-olcum')
        await odak_kayiyor_mu('il-ilk-olcum', '#o-bel')
        await pg.fill('#o-kilo', '82,4'); await pg.tap('[data-o-ek=pazu]'); await durum('il-ilk-olcum-pazu')
        await pg.tap('#o-kaydet'); await bekle(500); await durum('il-hafta')
        await kaydir_sabit_mi('il-hafta', None, '.m-ust')
        await pg.tap('[data-i-tur=ay]'); await durum('il-ay')
        await pg.tap('[data-i-detay=kilo]'); await durum('il-kilo-detay'); await kapat()
        await pg.tap('[data-i-detay=beslenme]'); await durum('il-beslenme-detay')
        await kaydir_sabit_mi('il-beslenme-detay', 'pencere', '#pencere-baslik'); await kapat()
        await pg.tap('[data-i-paylas]'); await durum('il-paylas')
        await kaydir_sabit_mi('il-paylas', 'pencere', '#pencere-baslik'); await kapat()
        await pg.tap('[data-i-duzenle]'); await durum('il-duzenle'); await kapat()
        await pg.tap('[data-ekran=bugun]'); await bekle()
    await adim('ilerleme', ilerleme); await kapat()

    for h in sayfa_hata: yaz(W, 'sayfa', '❌', 'Sayfa hatası (JS)', h[:160])

    # Kolaj: Tamer'e gösterilmeden önce gözle incelenir
    from PIL import Image, ImageDraw
    kucuk = []
    for ad, yol in goruntu:
        im = Image.open(yol); im.thumbnail((W, 10000)); kucuk.append((ad, im))
    sut = 6; gw = W; gh = max(i.size[1] for _, i in kucuk) + 22
    sat = (len(kucuk) + sut - 1) // sut
    kol = Image.new('RGB', (gw * sut, gh * sat), 'white'); d = ImageDraw.Draw(kol)
    for n, (ad, im) in enumerate(kucuk):
        x, y = (n % sut) * gw, (n // sut) * gh
        d.text((x + 6, y + 4), f'{n + 1:02d} {ad}', fill='black'); kol.paste(im, (x, y + 22))
    kol.save(f'{CIKTI}/kolaj-{W}.jpg', quality=78)
    await c.close()
    return len(goruntu)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        say = [await bir_ekran(b, W, H) for W, H in EKRANLAR]
        await b.close()
    bas = f'Telefon kontrolü · {"koyu" if KOYU else "açık"} tema · {sum(say)} durum · {hata_say[0]} hata'
    open(f'{CIKTI}/rapor.txt', 'w').write(bas + '\n' + '\n'.join(rapor) + '\n')
    print(bas); print('\n'.join(rapor) if rapor else '✅ Kurallara takılan bir şey yok')
    sys.exit(1 if hata_say[0] else 0)

asyncio.run(main())
