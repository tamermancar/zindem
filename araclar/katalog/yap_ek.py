# 1.5.1: katalogda olmayan ev yemeklerini ekler (yap.py'yi yeniden çalıştırmadan).
import json, sys
sys.path.insert(0, '.')
from yap_yemek import yemekler
p = '/home/claude/zindem/katalog.json'
K = json.load(open(p))
var = {b['id'] for b in K['besinler']}
yeni = [y for y in yemekler([]) if y['id'] not in var]
K['besinler'] += yeni
K['surum'] = '2026-11-18c'
K['kaynaklar'] = K['kaynaklar'].replace('Ev yemekleri: nefisyemektarifleri.com', 'Ev yemekleri: nefisyemektarifleri.com ve yemek.com')
json.dump(K, open(p, 'w'), ensure_ascii=False, separators=(',', ':'))
for y in yeni: print(y['ad'], y['kcal'], 'kcal', y['p'], 'g protein / porsiyon')
print('toplam', len(K['besinler']))
