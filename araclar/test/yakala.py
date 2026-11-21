"""Zindem: durumları gezip her öğenin hesaplanan stilini ve ekran görüntüsünü kaydeder.
Kullanım: python3 -I yakala.py <port> <çıktı klasörü> [koyu]"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright

PORT, CIKTI = sys.argv[1], sys.argv[2]
KOYU = len(sys.argv) > 3 and sys.argv[3] == 'koyu'
os.makedirs(CIKTI, exist_ok=True)

PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
         'border-top-width', 'border-bottom-width', 'border-left-width', 'border-right-width', 'border-top-style', 'border-radius', 'box-shadow', 'outline-color',
         'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-shadow', 'opacity', 'fill', 'stroke',
         'width', 'height', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
         'display', 'position', 'top', 'bottom', 'gap', 'align-items', 'justify-content', 'flex-direction', 'white-space', 'text-align', 'z-index', 'overflow-x', 'overflow-y',
         'accent-color', 'mask-image', 'content', 'transform', 'stroke-width']

DOK = """(props) => {
  const out = {};
  const yol = (e) => { const p = []; while (e && e !== document.body) { let i = 0, s = e; while ((s = s.previousElementSibling)) i++; p.unshift(e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : '') + ':' + i); e = e.parentElement; } return p.join('>'); };
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('svg symbol') || e.tagName === 'SCRIPT') continue;
    const r = e.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    for (const ps of [null, '::before', '::after']) {
      const cs = getComputedStyle(e, ps);
      if (ps && (cs.content === 'none' || cs.content === 'normal')) continue;
      const o = {}; props.forEach(p => o[p] = cs.getPropertyValue(p));
      if (!ps) { o._x = Math.round(r.x); o._y = Math.round(r.y); o._w = Math.round(r.width); o._h = Math.round(r.height); }
      out[yol(e) + (ps || '')] = o;
    }
  }
  return out;
}"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        c = await b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=1, is_mobile=True, has_touch=True,
                                locale='tr-TR', timezone_id='Europe/Istanbul', reduced_motion='reduce')
        pg = await c.new_page(); hatalar = []
        pg.on('pageerror', lambda e: hatalar.append(str(e)))
        await pg.clock.set_fixed_time('2026-11-19T13:20:00+03:00')
        await pg.goto(f'http://localhost:{PORT}/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(1200)
        if KOYU: await pg.evaluate("document.documentElement.setAttribute('data-tema','koyu')")
        sonuc = {}

        async def kaydet(ad):
            await pg.wait_for_timeout(350)
            await pg.screenshot(path=f'{CIKTI}/{ad}.png', full_page=False)
            sonuc[ad] = await pg.evaluate(DOK, PROPS)
            # Pencerenin kaydırılmış alt kısmı
            alt = await pg.evaluate("(()=>{const p=document.getElementById('pencere'); if(!p||p.hidden) return false; if(p.scrollHeight<=p.clientHeight+4) return false; p.scrollTop=p.scrollHeight; return true;})()")
            if alt:
                await pg.wait_for_timeout(200)
                await pg.screenshot(path=f'{CIKTI}/{ad}-alt.png')
                await pg.evaluate("document.getElementById('pencere').scrollTop=0")

        async def kapat():
            await pg.evaluate("(()=>{const k=document.getElementById('kapat'); if(k) k.click();})()")
            await pg.wait_for_timeout(400)

        async def adim(ad, f):
            try: await f()
            except Exception as e: print('HATA', ad, str(e)[:200])

        await kaydet('01-bugun')
        await pg.evaluate("window.scrollTo(0, 400)"); await kaydet('02-bugun-asagi'); await pg.evaluate("window.scrollTo(0, 0)")

        async def kahvalti():
            await pg.click('.ogun-sekme >> nth=0'); await kaydet('03-kahvalti')
        await adim('kahvalti', kahvalti)
        async def aksam():
            await pg.click('.ogun-sekme >> nth=2'); await kaydet('04-aksam-gelecek'); await pg.click('.ogun-sekme >> nth=0')
        await adim('aksam', aksam)

        async def ekle():
            await pg.click('.ogun-kart [data-ekle]'); await kaydet('05-ekle-onerilen')
            await pg.fill('#arama', 'zeytin'); await kaydet('06-ekle-arama')
            await pg.click('#sonuclar .sonuc .bilgi >> nth=0'); await pg.wait_for_timeout(200)
            await pg.click('#sonuclar .sonuc .bilgi >> nth=1'); await kaydet('07-ekle-sofrada')
            await pg.click('#sonuclar [data-olcu-ac] >> nth=0'); await kaydet('08-ekle-olcu')
            await pg.click('#oc-tamam'); await pg.wait_for_timeout(600); await kaydet('09-tamam')  # 1.11: Sofra sayfası yok
        await adim('ekle', ekle); await kapat()

        async def tarif():
            await pg.click('.ogun-kart [data-ekle]'); await pg.wait_for_timeout(300)
            await pg.fill('#arama', 'omlet'); await pg.wait_for_timeout(300)
            await pg.click('#sonuclar [data-tarif-ac] >> nth=0'); await kaydet('11-tarif-omlet')
            await pg.click('[data-tm-olcu] >> nth=0'); await kaydet('12-tarif-olcu')
        await adim('tarif', tarif); await kapat()

        async def evyemegi():
            await pg.click('.ogun-kart [data-ekle]'); await pg.wait_for_timeout(300)
            await pg.fill('#arama', 'mercimek'); await kaydet('13-ekle-evyemegi')
        await adim('evyemegi', evyemegi); await kapat()

        async def elle():
            await pg.click('.ogun-kart [data-ekle]'); await pg.wait_for_timeout(300)
            await pg.fill('#arama', 'qqqq'); await pg.wait_for_timeout(200)
            await pg.click('#elle'); await kaydet('14-kendin-ekle')
        await adim('elle', elle); await kapat()

        async def duzenle():
            await pg.click('.ogun-kart [data-kayit-duzelt] >> nth=0'); await kaydet('15-kaydi-duzenle')
        await adim('duzenle', duzenle); await kapat()

        async def kaydir():
            r = await pg.evaluate("(()=>{const e=document.querySelector('.ogun-kart .kaydir .satir'); const b=e.getBoundingClientRect(); return [b.x+b.width-30, b.y+b.height/2];})()")
            x, y = r
            cdp = await c.new_cdp_session(pg)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
            for i in range(1, 11):
                await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x - i * 15, 'y': y}]}); await pg.wait_for_timeout(16)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
            await kaydet('16-sola-cek')
            await pg.click('body', position={'x': 200, 'y': 30})
        await adim('kaydir', kaydir)

        async def su():
            await pg.click('.ls-su'); await kaydet('17-su')
        await adim('su', su); await kapat()
        async def adimp():
            await pg.click('.ls-adim'); await kaydet('18-adim')
        await adim('adim', adimp); await kapat()

        async def agri():
            await pg.click('#agri-dugme'); await kaydet('19-agri')
            await pg.click('#yeni-not'); await kaydet('20-yeni-not')
            for i, v in enumerate([4, 6, 8]):
                await pg.evaluate(f"(()=>{{const r=document.querySelector('#pencere input[type=range]'); r.value={v}; r.dispatchEvent(new Event('input',{{bubbles:true}}));}})()")
                await kaydet(f'21-surgu-{v}')
        await adim('agri', agri); await kapat()

        async def takvim():
            await pg.click('[data-takvim]'); await kaydet('22-takvim')
            await pg.click('.tgun:not(:disabled) >> nth=3'); await pg.wait_for_timeout(800); await kaydet('23-gecmis-gun')
        await adim('takvim', takvim)
        await kapat()

        async def liste():
            await pg.click('[data-yakinda="Ayarlar"]'); await pg.wait_for_timeout(300)
            await pg.click('[data-lg] >> nth=2'); await kaydet('24-besin-listesi')
        await adim('liste', liste); await kapat()

        json.dump(sonuc, open(f'{CIKTI}/stil.json', 'w'), ensure_ascii=False)
        print('durum', len(sonuc), 'sayfa hatası', hatalar)
        await b.close()

asyncio.run(main())
