# Testlerde uygulamanın gerçek yazı tipi (Plus Jakarta Sans, SIL OFL) kullanılsın diye Google Fonts istekleri yerel dosyadan cevaplanır.
# Telefonda bu yazı tipi var; test tarayıcısında yoksa yazılar daha dar görünür ve taşmalar yakalanmaz (1.10.1 alt menü dersi).
import os as _os
_YT = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)) if '__file__' in globals() else D, 'yazitipi', 'PlusJakartaSans[wght].ttf')
_CSS = "@font-face{font-family:'Plus Jakarta Sans';font-style:normal;font-weight:200 800;font-display:block;src:url(https://fonts.gstatic.com/zindem/pjs.ttf) format('truetype');}"
async def yazi_tipi(c):
    async def _css(r): await r.fulfill(status=200, content_type='text/css', body=_CSS, headers={'Access-Control-Allow-Origin': '*'})
    async def _ttf(r): await r.fulfill(status=200, content_type='font/ttf', path=_YT, headers={'Access-Control-Allow-Origin': '*'})
    await c.route('https://fonts.googleapis.com/**', _css); await c.route('https://fonts.gstatic.com/**', _ttf)
