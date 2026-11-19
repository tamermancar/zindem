# 1.6: Tarif şablonları ve ev yemeklerinin kişi sayısı.
# Kullanım: python3 araclar/katalog/yap_sablon.py katalog.json
# - Ev yemeklerine (malzemeler alanı olanlara) "kisi" eklenir: tarifin kaç porsiyon çıkardığı
#   (malzemelerin toplam kalorisi / 1 porsiyon kalorisi, yuvarlanmış; kaynak açıklamasındaki 1/n ile aynı).
# - Hazır "Omlet, sade" ve "Yumurta, tavada" listeden kaldırılır ("x": 1). Eski kayıtlar bozulmaz.
# - Şablon tarifler eklenir: sadece malzeme seçimi var, miktarları kullanıcı girer.
import json, sys

yol = sys.argv[1]
k = json.load(open(yol, encoding='utf-8'))
B = {x['id']: x for x in k['besinler']}

for x in k['besinler']:
    if x.get('malzemeler'):
        t = sum(B[m[0]]['kcal'] * m[1] / 100 for m in x['malzemeler'])
        x['kisi'] = round(t / x['kcal'])

for i in ('u172185', 'u173423'):  # Omlet, sade · Yumurta, tavada (sahanda)
    B[i]['x'] = 1

SABLON = [
    ('s-omlet', 'Omlet', ['u171287', 't-lor-peyniri', 'u170416', 'u173410']),
    ('s-yagda-yumurta', 'Yağda yumurta', ['u171287', 'u173410']),
]
k['besinler'] = [x for x in k['besinler'] if not x.get('sablon')]
for id_, ad, malz in SABLON:
    for m in malz:
        assert m in B, m
    k['besinler'].append({'id': id_, 'ad': ad, 'kat': '', 'kcal': 0, 'p': 0, 'olcu': [], 'g': 'Kahvaltılık',
                          'o': [3, 0, 0, 0], 'sablon': malz,
                          'kaynak': 'Şablon: malzemeleri ve miktarlarını sen girersin; değerler malzemelerden hesaplanır.'})

k['sablon_notu'] = 'sablon: malzeme seçimi hazır, miktarlar elle girilir. x=1: listeden kaldırıldı (eski kayıtlar için durur). kisi: ev yemeğinin kaç porsiyon çıkardığı.'
k['surum'] = '2026-11-19a'
json.dump(k, open(yol, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('tamam', len(k['besinler']))
