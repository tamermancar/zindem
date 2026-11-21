"""1.10.5 sunucu önbelleği testi (Google önbelleği taklidi: araclar/test/sahte.js).
Çalıştırma: ORNEK_ANT=1 node araclar/test/sahte.js . 8771 &  →  python3 -I araclar/test/surum1105_test.py 8771
Denenen: ikinci okuma önbellekten gelir ve aynıdır · uygulamadan yazınca önbellek geçersizleşir ·
tablo elle değişince geçersizleşir · İlerleme okuması da önbelleğe alınır · önbellek yokken eskisi gibi çalışır.
"""
import sys, json, urllib.request
PORT = sys.argv[1]; A = f'http://localhost:{PORT}'
sonuc = []
def kontrol(ad, kosul, ayr=''): sonuc.append(('✅' if kosul else '❌') + ' ' + ad + ('' if kosul else ' · ' + str(ayr)[:200]))
def al(yol): return json.loads(urllib.request.urlopen(A + yol).read())
def yaz(islemler):
    r = urllib.request.Request(A + '/exec', data=json.dumps({'k': 'x', 'islemler': islemler}).encode(), method='POST', headers={'Content-Type': 'text/plain'})
    return json.loads(urllib.request.urlopen(r).read())
OKU = '/exec?k=x&gun=2026-11-19&bas=2026-10-16&bitis=2026-11-19'
def sade(r): r = dict(r); r.pop('sure', None); return r

r1 = al(OKU); r2 = al(OKU)
kontrol('İlk okuma tablodan', r1.get('ok') and r1['sure']['onbellek'] is False, r1.get('sure'))
kontrol('İkinci okuma önbellekten', r2['sure']['onbellek'] is True, r2.get('sure'))
kontrol('Önbellekten gelen veri tablodakiyle aynı', sade(r1) == sade(r2))
kontrol('Türkçe harfler bozulmadı', 'Öğle' in json.dumps(r2, ensure_ascii=False) or 'ğ' in json.dumps(r2, ensure_ascii=False))

y = yaz([{'islemId': 't1', 'tur': 'gunluk', 'veri': {'gun': '2026-11-19', 'alan': 'su', 'deger': 1234}}])
kontrol('Yazma başarılı', y.get('ok'), y)
r3 = al(OKU)
kontrol('Yazınca önbellek geçersizleşir', r3['sure']['onbellek'] is False, r3.get('sure'))
kontrol('Yazılan değer okunur', (r3.get('gunluk') or {}).get('Su (ml)') == 1234, r3.get('gunluk'))
kontrol('Sonraki okuma yine önbellekten', al(OKU)['sure']['onbellek'] is True)

urllib.request.urlopen(A + '/_ant_sifirla').read()  # tabloyu "elle" değiştirir (Drive'daki değişme zamanı ilerler)
r4 = al(OKU)
kontrol('Tablo elle değişince önbellek geçersizleşir', r4['sure']['onbellek'] is False and not r4['antrenman']['programlar'], r4.get('sure'))

i1 = al('/exec?k=x&ilerleme=1'); i2 = al('/exec?k=x&ilerleme=1')
kontrol('İlerleme ikinci okuma önbellekten', i1['sure']['onbellek'] is False and i2['sure']['onbellek'] is True, [i1.get('sure'), i2.get('sure')])
b1 = al('/exec?k=x&bilgi=1'); b2 = al('/exec?k=x&bilgi=1')
kontrol('Ayarlar › Veri bilgisi önbelleğe alınmaz', b1['sure']['onbellek'] is False and b2['sure']['onbellek'] is False)
kontrol('Farklı gün ayrı önbellek', al('/exec?k=x&gun=2026-11-18&bas=2026-10-16&bitis=2026-11-19')['sure']['onbellek'] is False)

print('\n'.join(sonuc)); print(f"{sum(1 for x in sonuc if x[0]=='✅')}/{len(sonuc)} geçti")
sys.exit(0 if all(x[0] == '✅' for x in sonuc) else 1)
