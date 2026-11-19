# 1.6.1: Kahvaltı önerileri için sebze puanları (Tamer'le konuşuldu, 19 Kasım).
# Kullanım: python3 araclar/katalog/yap_oneri.py katalog.json
# Puan: 3 = öğünün ana besini (yumurta, peynir, ekmek…) · 2,5 = kahvaltı sebzesi, ana besinlerin hemen altında
#       2 = önerilerde altlarda · 1 = sadece grup sekmesinde ve aramada · 0 = o öğünde önerilmez
# Sebzeler grubunun varsayılanı kahvaltıda 0 (uygulama.js GRUP_PUAN); pişmiş sebzeler kahvaltıda önerilmez.
import json, sys
yol = sys.argv[1]
k = json.load(open(yol, encoding='utf-8'))
B = {x['id']: x for x in k['besinler']}
KAHVALTI = {
    'u170457': 2.5, 'u168409': 2.5, 'n11670': 2.5, 'n11821': 2.5,          # domates, salatalık, sivri biber, kapya
    'u170416': 2, 'u169387': 2, 'n02065': 2, 'u172233': 2, 'n11591': 2,     # maydanoz, roka, nane, dereotu, tere
    'n11253': 2, 'n11252': 2, 'u169247': 2, 'u170393': 2, 'n11291': 2,     # kıvırcık, göbek, marul, havuç, taze soğan
    'n11339': 2, 'n11261': 2,                                               # kavrulmuş yeşil biber, pişmiş mantar
    'u169276': 1, 'n11937': 1, 'n11941': 1,                                 # turp, turşular
    'u170108': 0, 'u170427': 0,                                             # dolmalık biber: öğle ve akşam
}
for i, v in KAHVALTI.items():
    x = B[i]
    o = list(x.get('o') or [0, 2, 2, 0])
    o[0] = v
    x['o'] = o
k['surum'] = '2026-11-19b'
json.dump(k, open(yol, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('tamam', len(KAHVALTI))
