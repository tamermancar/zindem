import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        c = await b.new_context(viewport={'width':390,'height':800}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='tr-TR')
        pg = await c.new_page(); h=[]
        pg.on('pageerror', lambda e: h.append(str(e)))
        await pg.goto('http://localhost:8766/#k=x'); await pg.wait_for_selector('.ozet-kart'); await pg.wait_for_timeout(800)
        await pg.click('[data-ekle]'); await pg.wait_for_timeout(400)
        for q in ['nohut','çoban','salata']:
            await pg.fill('#arama', q); await pg.wait_for_timeout(250)
            print(q, '→', await pg.evaluate("[...document.querySelectorAll('#pencere .sonuc .bilgi b')].map(e=>e.textContent.trim()).slice(0,8)"))
        await pg.fill('#arama','etli nohut'); await pg.wait_for_timeout(250)
        await pg.screenshot(path='e1-nohut.png')
        print('hata', h)
        await b.close()
asyncio.run(main())
