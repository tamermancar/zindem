import json, sys
sys.path.insert(0, '.')
from yap_ham import ham
from yap_yemek import yemekler, EK
from yeni_liste import MALZEME
p = '/home/claude/zindem/katalog.json'
K = json.load(open(p))
var = {b['id'] for b in K['besinler']}
adlar = {b['ad'].lower() for b in K['besinler']}
yeni = [b for b in ham() if b['id'] not in var]
for b in yeni:
    if b['ad'].lower() in adlar: print('⚠ aynı ad', b['ad'])
for b in K['besinler']:
    if b['id'] in MALZEME: b['m'] = 1
ek = [v for v in EK.values() if v['id'] not in var]
yem = yemekler(yeni + ek)
K['besinler'] += yeni + ek + yem
K['surum'] = '2026-11-18b'
K['kaynaklar'] += ' 1.5 eklemeleri: USDA SR28 (SR Legacy ile aynı veri; NDB numarasıyla). Ev yemekleri: nefisyemektarifleri.com oranları + USDA malzeme değerleri, porsiyon = tarifin kişi sayısının ortası.'
K['malzeme_notu'] = 'm=1 olan besinler çiğ/kuru tarif malzemesidir; Ekle listesinde ve aramada görünmez, tariflerde kullanılır.'
json.dump(K, open(p, 'w'), ensure_ascii=False, separators=(',', ':'))
print('toplam', len(K['besinler']), 'yeni ham', len(yeni), 'malzeme', sum(1 for b in K['besinler'] if b.get('m')), 'yemek', len(yem))
for y in yem: print(y['ad'], y['kcal'], 'kcal', y['p'], 'g protein / porsiyon')
