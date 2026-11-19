# 1.8: Ev yemekleri havuzu genişletildi (tarhana, sebze yemekleri, köfteler) ve eski tariflerde yağ ölçülü azaltıldı.
# Kullanım: python3 araclar/katalog/yap_yemek2.py katalog.json
# Oranlar yemek.com tariflerinden; malzeme değerleri USDA SR28 (tarhana: paket etiketi).
# Kural: yağ/tereyağı lezzeti bozmayacak kadar azaltıldı (yaklaşık kişi başı ½–1 yk), krema yok, et/tavuk suyu yerine su.
# Adet ağırlıkları USDA ölçülerinden; USDA'da Türk boyuna uymayan patlıcan için 250 g varsayıldı (sebze payı küçük, porsiyona etkisi birkaç kcal).
import json, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from sr import FOOD, NUT

yol = sys.argv[1]
K = json.load(open(yol, encoding='utf-8'))
B = {b['id']: b for b in K['besinler']}

def sr(ndb, ad, g, olcu):
    n = NUT[ndb]
    return {'id': 'n' + ndb, 'ad': ad, 'kat': '', 'kcal': round(n['208']), 'p': round(n['203'], 1), 'y': round(n['204'], 1), 'k': round(n['205'], 1),
            'olcu': olcu, 'kaynak': 'USDA SR28 NDB ' + ndb + ' (' + FOOD[ndb]['ad'] + ')', 'g': g, 'o': [0, 0, 0, 0], 'm': 1}

EK = [
    sr('11352', 'Patates, çiğ', 'Sebzeler', [['1 küçük boy', 170], ['1 orta boy', 213], ['1 büyük boy', 369]]),
    sr('11278', 'Bamya, çiğ', 'Sebzeler', [['1 su bardağı', 83]]),
    sr('18079', 'Galeta unu', 'Ekmek ve tahıl', [['1 yemek kaşığı', 7], ['1 su bardağı', 90]]),
    sr('14411', 'Su', 'İçecekler', [['1 su bardağı', 200], ['1 çay bardağı', 100]]),
    {'id': 't-tarhana', 'ad': 'Tarhana (kuru, toz)', 'kat': '', 'kcal': 377, 'p': 14.8, 'y': 3.2, 'k': 71.3, 'olcu': [['1 yemek kaşığı', 20]],
     'kaynak': 'Paket etiketi: Trakya Ev Tarhanası (Migros), 100 g. 1 yk = 20 g (Yayla tarhana etiketi: 3 yk = 60 g). Dergipark çalışmasıyla uyumlu (protein %14,5–18,1).',
     'g': 'Çorbalar', 'o': [0, 0, 0, 0], 'm': 1},
]
for e in EK:
    if e['id'] not in B:
        K['besinler'].append(e); B[e['id']] = e

# Kısaltmalar (gram)
YK_YAG, YK_TEREYAG, YK_SALCA, TK_SALCA = 14, 14, 16, 5
SOGAN, SOGAN_B, DIS, SB_SU = 110, 150, 3, 200
KIYMA10, KIYMA15 = 'u174030', 'u171796'   # dana kıyma %10 (az yağlı, tencere yemekleri) · %15 (orta yağlı, köfte)
SU, ZY, SIVI, TY = 'n14411', 'u171413', 'u171025', 'u173410'
PAT, PATLICAN = 'n11352', 250

YENI = [
 # id, ad, grup, öğün puanı, url, kişi notu, porsiyon sayısı, yağ notu, malzemeler
 ('y-tarhana-corbasi', 'Tarhana çorbası', 'Çorbalar', [0, 3, 3, 0], 'https://yemek.com/tarif/tarhana-corbasi/', '6 kişilik', 6, '', [
   (ZY, YK_YAG, '1 yk zeytinyağı veya sıvı yağ'), (TY, YK_TEREYAG, '1 yk tereyağı'), ('u169230', DIS, '1 diş sarımsak'),
   ('u170459', YK_SALCA, '1 yk domates salçası'), ('t-tarhana', 4 * 20, '4 yk toz tarhana'), (SU, 7 * SB_SU, '7 su bardağı su')]),
 ('y-kiymali-ispanak', 'Kıymalı ıspanak', 'Sebze yemekleri', [0, 3, 3, 0], 'https://yemek.com/tarif/kiymali-ispanak-yemegi/', '2 kişilik; 1 bağ = 340 g (USDA)', 2, 'yağ 3 yk → 2 yk', [
   (SIVI, 2 * YK_YAG, '2 yk sıvı yağ'), ('u170000', SOGAN, '1 soğan (orta)'), (KIYMA10, 200, '200 g kıyma (az yağlı)'), ('u169230', 2 * DIS, '2 diş sarımsak'),
   ('u170459', YK_SALCA, '1 yk salça'), ('u168462', 3 * 340, '3 bağ ıspanak')]),
 ('y-zeytinyagli-pirasa', 'Zeytinyağlı pırasa', 'Sebze yemekleri', [0, 3, 3, 0], 'https://yemek.com/tarif/zeytinyagli-pirasa-4/', '2 kişilik (biber salçası domates salçası değeriyle)', 2, '', [
   (ZY, 2 * YK_YAG, '2 yk zeytinyağı'), ('u169230', 2 * DIS, '2 diş sarımsak'), ('u170393', 2 * 50, '2 havuç (küçük)'), ('u169246', 500, '½ kg pırasa'),
   ('u170459', YK_SALCA, '1 yk biber salçası'), ('u168877', 2 * 12, '2 yk pirinç'), (SU, SB_SU, '1 su bardağı su')]),
 ('y-kiymali-kabak', 'Kıymalı kabak', 'Sebze yemekleri', [0, 3, 3, 0], 'https://yemek.com/tarif/kiymali-kabak-yemegi/', '4 kişilik', 4, 'zeytinyağı 4 yk → 2 yk', [
   (ZY, 2 * YK_YAG, '2 yk zeytinyağı'), ('u170000', SOGAN, '1 soğan (orta)'), ('u169230', DIS, '1 diş sarımsak'), (KIYMA10, 250, '250 g kıyma (az yağlı)'),
   ('u170459', YK_SALCA, '1 yk domates salçası'), ('u170457', 123, '1 domates (orta)'), ('u169291', 3 * 196, '3 kabak (orta)'), (SU, 1.75 * SB_SU, '1,5–2 su bardağı su')]),
 ('y-karnabahar', 'Zeytinyağlı karnabahar', 'Sebze yemekleri', [0, 3, 3, 0], 'https://yemek.com/tarif/karnabahar-yemegi/', '5 kişilik', 5, 'zeytinyağı 1 çay bardağı → 3 yk', [
   (ZY, 3 * YK_YAG, '3 yk zeytinyağı'), ('u170000', SOGAN, '1 soğan (orta)'), ('n11670', 45, '1 yeşil biber'), ('u170459', TK_SALCA, '1 tatlı kaşığı domates salçası'),
   ('u170457', 123, '1 domates (orta)'), ('n11135', 588, '1 karnabahar (orta)'), ('u168877', 39, '½ çay bardağı pirinç'), (SU, 3 * SB_SU, '3 su bardağı sıcak su')]),
 ('y-kiymali-bezelye', 'Kıymalı bezelye', 'Sebze yemekleri', [0, 3, 3, 0], 'https://yemek.com/tarif/bezelye-yemegi/', '5 kişilik', 5, 'zeytinyağı 3 yk → 2 yk', [
   (ZY, 2 * YK_YAG, '2 yk zeytinyağı'), ('u170000', SOGAN, '1 soğan (orta)'), (KIYMA10, 200, '200 g kıyma (az yağlı)'), ('u170393', 2 * 61, '2 havuç (orta)'),
   (PAT, 369, '1 patates (büyük)'), ('u170459', TK_SALCA, '1 tatlı kaşığı domates salçası'), ('n11304', 1000, '1 kg bezelye (taze veya dondurulmuş)'), (SU, 1.5 * SB_SU, '1,5 su bardağı sıcak su')]),
 ('y-kiymali-patates', 'Kıymalı patates', 'Sebze yemekleri', [0, 3, 3, 0], 'https://yemek.com/tarif/kiymali-patates-yemegi/', '3 kişilik', 3, 'zeytinyağı 3 yk → 2 yk', [
   (ZY, 2 * YK_YAG, '2 yk zeytinyağı'), ('u170000', SOGAN, '1 soğan (orta)'), ('u169230', 3 * DIS, '3 diş sarımsak'), (KIYMA10, 250, '250 g kıyma (az yağlı)'),
   ('u170459', YK_SALCA, '1 yk domates salçası'), (PAT, 4 * 213, '4 patates (orta)'), (SU, 2 * SB_SU, '2 su bardağı sıcak su')]),
 ('y-kiymali-taze-fasulye', 'Kıymalı taze fasulye', 'Sebze yemekleri', [0, 3, 3, 0], 'https://yemek.com/tarif/kiymali-taze-fasulye/', '4 kişilik', 4, 'yağ 3 yk → 2 yk', [
   (SIVI, 2 * YK_YAG, '2 yk sıvı yağ'), ('u170000', SOGAN, '1 soğan (orta)'), (KIYMA10, 175, '150–200 g kıyma (az yağlı)'), ('u170459', YK_SALCA, '1 yk domates salçası'),
   ('n11052', 1000, '1 kg taze fasulye'), ('u169655', 3, '1 küp şeker'), (SU, 100, '1 çay bardağı sıcak su')]),
 ('y-etli-turlu', 'Etli türlü', 'Sebze yemekleri', [0, 3, 3, 0], 'https://yemek.com/tarif/etli-turlu/', '6 kişilik; patlıcan 250 g varsayıldı', 6, '', [
   (SIVI, 2 * YK_YAG, '2 yk sıvı yağ'), ('u171757', 300, '300 g kuşbaşı et'), ('u170000', SOGAN, '1 soğan (orta)'), ('u170459', YK_SALCA, '1 yk salça'),
   ('u169228', 2 * PATLICAN, '2 patlıcan'), (PAT, 2 * 213, '2 patates (orta)'), ('u169291', 196, '1 kabak (orta)'), ('u170393', 61, '1 havuç (orta)'),
   ('u170108', 119, '1 kapya biber'), ('n11670', 2 * 45, '2 yeşil biber'), (SU, 2 * SB_SU, '2 su bardağı sıcak su')]),
 ('y-nohutlu-bamya', 'Nohutlu bamya', 'Sebze yemekleri', [0, 3, 3, 0], 'https://yemek.com/tarif/bamya-yemegi/', '4 kişilik (biber salçası domates salçası değeriyle)', 4, 'zeytinyağı ½ çay bardağı → 2 yk', [
   (ZY, 2 * YK_YAG, '2 yk zeytinyağı'), ('u170000', SOGAN_B, '1 soğan (büyük)'), ('u170459', YK_SALCA, '1 yk biber salçası'), ('u170457', 3 * 123, '3 domates (orta)'),
   ('n11278', 400, '400 g bamya'), ('u173757', 139, '1 su bardağı haşlanmış nohut'), ('u167747', 24, '½ limonun suyu'), (SU, SB_SU, '1 su bardağı sıcak su')]),
 ('y-kiymali-lahana', 'Kıymalı lahana', 'Sebze yemekleri', [0, 3, 3, 0], 'https://yemek.com/tarif/kiymali-lahana-yemegi/', '4 kişilik', 4, 'zeytinyağı 2 yk → 1 yk (tereyağı 1 yk kaldı)', [
   (ZY, YK_YAG, '1 yk zeytinyağı'), (TY, YK_TEREYAG, '1 yk tereyağı'), (KIYMA10, 250, '250 g kıyma (az yağlı)'), ('u170459', YK_SALCA, '1 yk domates salçası'),
   ('u169975', 500, '500 g lahana'), (SU, SB_SU, '1 su bardağı su')]),
 ('y-tavuklu-mantar-sote', 'Tavuklu mantar sote', 'Et, tavuk, balık', [0, 2, 3, 0], 'https://yemek.com/tarif/tavuklu-mantar-sote/', '2 kişilik', 2, 'zeytinyağı 3 yk → 2 yk', [
   (ZY, 2 * YK_YAG, '2 yk zeytinyağı'), ('u173627', 500, '500 g tavuk but (kuşbaşı)'), ('u170000', SOGAN, '1 soğan (orta)'), ('u169251', 400, '400 g mantar'),
   ('n11670', 45, '1 yeşil biber'), ('u170108', 119, '1 kırmızı biber'), ('u170457', 123, '1 domates (orta)')]),
 ('y-firinda-mucver', 'Fırında mücver (unsuz)', 'Sebze yemekleri', [2, 3, 3, 1], 'https://yemek.com/tarif/firinda-unsuz-mucver-2/', '8 dilim; 1 porsiyon = 2 dilim', 4, '', [
   (PAT, 3 * 213, '3 patates (orta)'), ('u170393', 2 * 61, '2 havuç (orta)'), ('u169291', 3 * 196, '3 kabak (orta)'), ('u171287', 3 * 50, '3 yumurta'),
   ('t-lor-peyniri', 2 * 205, '2 su bardağı lor peyniri'), ('u170894', 207, '1 su bardağı süzme yoğurt'), ('u172233', 10, '¼ demet dereotu')]),
 ('y-izgara-kofte', 'Izgara / tavada köfte', 'Et, tavuk, balık', [0, 2, 3, 0], 'https://yemek.com/tarif/tavada-kofte', '4 kişilik; yağsız tavada veya ızgarada', 4, '', [
   (KIYMA15, 400, '400 g kıyma (orta yağlı)'), ('n18079', 3 * 7, '3 yk galeta unu'), ('u170000', SOGAN, '1 soğan (orta, rendelenmiş)')]),
 ('y-firinda-kofte-sebze', 'Fırında sebzeli köfte', 'Et, tavuk, balık', [0, 2, 3, 0], 'https://yemek.com/tarif/firinda-kofte-sebze-yemegi/', '2 kişilik', 2, 'zeytinyağı 3 yk → 2 yk', [
   (KIYMA15, 300, '300 g kıyma (orta yağlı)'), ('u171287', 50, '1 yumurta'), ('n18079', 3 * 7, '3 yk galeta unu'), ('u170000', 70, '1 soğan (küçük)'),
   ('u170000', SOGAN_B, '1 mor soğan (büyük)'), (PAT, 369, '1 patates (büyük)'), ('u170393', 72, '1 havuç (büyük)'), ('u170457', 123, '1 domates (orta)'),
   ('n11670', 2 * 45, '2 yeşil biber'), ('u170459', YK_SALCA, '1 yk domates salçası'), (ZY, 2 * YK_YAG, '2 yk zeytinyağı'), (SU, 150, '1,5 çay bardağı sıcak su')]),
 ('y-eksili-kofte', 'Ekşili köfte', 'Et, tavuk, balık', [0, 3, 3, 0], 'https://yemek.com/tarif/eksili-kofte/', '6 kişilik; köftelerin bulandığı unun hepsi sayıldı', 6, '', [
   (KIYMA15, 500, '500 g kıyma (orta yağlı)'), ('u170000', SOGAN, '1 soğan (orta)'), ('u168877', 39, '½ çay bardağı pirinç'), ('u168894', 52, '½ su bardağı un (bulamak için)'),
   (SIVI, 2 * YK_YAG, '2 yk sıvı yağ'), (PAT, 213, '1 patates (orta)'), ('u170393', 61, '1 havuç (orta)'), ('u169230', DIS, '1 diş sarımsak'),
   ('u170459', YK_SALCA, '1 yk domates salçası'), (SU, 7 * SB_SU, '7 su bardağı su'), ('n01125', 17, '1 yumurta sarısı (terbiye)'),
   ('u167747', 48, '1 limonun suyu (terbiye)'), ('u171284', 3 * 16, '3 yk yoğurt (terbiye)')]),
 ('y-tavuk-kofte', 'Fırında tavuk köfte', 'Et, tavuk, balık', [0, 2, 3, 0], 'https://yemek.com/tarif/tavuk-koftesi/', '16 adet; 1 porsiyon = 4 adet; kızartma yerine fırında', 4,
   'kızartma yağı 1–1,5 çay bardağı → fırında 1 yk zeytinyağı', [
   ('u171077', 500, '500 g tavuk göğsü (kıyılmış)'), ('u174924', 75, '2 su bardağı bayat ekmek kırıntısı'), ('u170000', SOGAN, '1 soğan (orta)'),
   ('u169291', 196, '1 kabak (orta, rendelenmiş)'), ('u171287', 50, '1 yumurta'), ('u170416', 6, '5–6 dal maydanoz'), (ZY, YK_YAG, '1 yk zeytinyağı (tepsiye)')]),
 ('y-mercimek-koftesi', 'Mercimek köftesi', 'Baklagiller', [0, 2, 2, 3], 'https://yemek.com/tarif/tam-kivaminda-mercimek-koftesi', '6 kişilik (biber salçası domates salçası değeriyle)', 6,
   'zeytinyağı 1 çay bardağı → ½ çay bardağı', [
   ('u174284', 1.5 * 162, '1,5 su bardağı kırmızı mercimek'), (SU, 3 * SB_SU, '3 su bardağı sıcak su'), ('u170688', 1.5 * 118, '1,5 su bardağı ince bulgur'),
   ('u170000', 2 * SOGAN, '2 soğan (orta)'), (ZY, 45.5, '½ çay bardağı zeytinyağı'), ('u170459', 2 * YK_SALCA, '1 yk biber + 1 yk domates salçası'),
   ('n11291', 5 * 15, '5 taze soğan'), ('u170416', 25, '½ demet maydanoz')]),
]

# Eski ev yemekleri: yağ ölçülü azaltıldı, tavuk suyu yerine su (malzeme listesi tamamen yenilenir)
ESKI = {
 'y-mercimek-corbasi': ('sıvı yağ 5 yk → 3 yk, tereyağı 2 yk → 1 yk', [
   ('u174284', 2 * 162, '2 su bardağı kırmızı mercimek'), ('u170000', 110, '1 soğan (orta)'), ('u168894', 2 * 8, '2 yk un'),
   ('u170393', 61, '1 havuç (orta)'), ('u170459', 8, '½ yk salça'), (SIVI, 3 * 14, '3 yk sıvı yağ'), (TY, 14, '1 yk tereyağı (sos)')]),
 'y-ezogelin-corbasi': ('sos yağı 2 yk → 1 yk', [
   (SIVI, 14, '1 yk sıvı yağ'), (TY, 14, '1 yk tereyağı'), ('u170000', 110, '1 soğan (orta)'), ('u169230', 2 * 3, '2 diş sarımsak'),
   ('u174284', 162, '1 su bardağı kırmızı mercimek'), ('u170688', 4 * 9, '4 yk bulgur'), ('u168877', 2 * 12, '2 yk pirinç'),
   (SIVI, 14, '1 yk sıvı yağ (sos)'), ('u168894', 8, '1 yk un'), ('u170459', 2 * 16, '2 yk salça')]),
 'y-bulgur-pilavi': ('sıvı yağ 4 yk → 3 yk; tavuk suyu yerine su', [
   ('u170688', 2 * 118, '2 su bardağı bulgur'), ('u170457', 2 * 123, '2 domates (orta)'), ('u170000', 110, '1 soğan (orta)'),
   ('n11670', 2 * 45, '2 sivri biber'), (SU, 200, '1 su bardağı su (veya tavuk suyu)'), (SIVI, 3 * 14, '3 yk sıvı yağ')]),
 'y-pirinc-pilavi': ('tereyağı 3 yk → 2 yk', [
   ('u168877', 2 * 156, '2 su bardağı pirinç'), (TY, 2 * 14, '2 yk tereyağı'), (SIVI, 14, '1 yk sıvı yağ'), (SU, 3 * 200, '3 su bardağı sıcak su')]),
 'y-etli-kuru-fasulye': ('sıvı yağ 4–5 yk → 3 yk', [
   ('n16049', 1.5 * 170.8, '1,5 su bardağı kuru fasulye'), ('u170000', 110, '1 soğan (orta)'), ('u170459', 2 * 16, '1 yk domates + 1 yk biber salçası'),
   ('u171757', 300, '300 g kuşbaşı dana'), (SIVI, 3 * 14, '3 yk sıvı yağ')]),
 'y-etli-nohut': ('zeytinyağı 4 yk → 3 yk', [
   ('u170000', 110, '1 soğan (orta)'), ('u173757', 1.5 * 139, '1,5 su bardağı haşlanmış nohut'), ('u171757', 350, '350 g dana kuşbaşı'),
   ('u170459', 1.5 * 16, '1,5 yk biber salçası'), (ZY, 3 * 14, '3 yk zeytinyağı')]),
}

def hesap(malz):
    for i, _, _ in malz:
        assert i in B, i
    kcal = sum(B[i]['kcal'] * g / 100 for i, g, _ in malz)
    p = sum(B[i]['p'] * g / 100 for i, g, _ in malz)
    return kcal, p

eklenen = []
for id_, ad, g, o, url, kisi, n, yag, malz in YENI:
    kcal, p = hesap(malz)
    k = {'id': id_, 'ad': ad, 'kat': '', 'porsiyon': True, 'kcal': round(kcal / n), 'p': round(p / n, 1), 'y': None, 'k': None,
         'olcu': [['1 porsiyon', 1]], 'g': g, 'o': o, 'kisi': n,
         'kaynak': 'Tarif: ' + url + ' (' + kisi + '; 1 porsiyon = tarifin 1/' + str(n) + "'i)." + (' Yağ azaltıldı: ' + yag + '.' if yag else '') + ' Malzeme değerleri USDA.',
         'malzemeler': [[i, round(gr, 1), a] for i, gr, a in malz]}
    if id_ in B:
        K['besinler'][K['besinler'].index(B[id_])] = k
    else:
        K['besinler'].append(k)
    B[id_] = k
    eklenen.append(k)

for id_, (yag, malz) in ESKI.items():
    x = B[id_]
    kcal, p = hesap(malz)
    n = x['kisi']
    eski = x['kcal']
    x['kcal'], x['p'] = round(kcal / n), round(p / n, 1)
    x['malzemeler'] = [[i, round(gr, 1), a] for i, gr, a in malz]
    if 'Yağ azaltıldı' not in x['kaynak']:
        x['kaynak'] = x['kaynak'].replace(' Malzeme değerleri USDA.', ' Yağ azaltıldı: ' + yag + '. Malzeme değerleri USDA.')
    print('güncellendi', x['ad'], eski, '→', x['kcal'], 'kcal', x['p'], 'g')

K['surum'] = '2026-11-19c'
json.dump(K, open(yol, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for k in eklenen:
    print('%-26s %4d kcal %5.1f g  (%d porsiyon)' % (k['ad'], k['kcal'], k['p'], k['kisi']))
print('toplam', len(K['besinler']), 'ev yemeği', sum(1 for b in K['besinler'] if b['id'].startswith('y-')))
