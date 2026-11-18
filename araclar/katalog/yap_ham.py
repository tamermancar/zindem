import sys, json, re
sys.path.insert(0, '.')
from sr import FOOD, NUT, W
from yeni_liste import L, MALZEME
SU = 200 / 236.6
def olcu_cevir(ndb):
    out = []
    for amt, desc, gm in W.get(ndb, []):
        d = desc.lower(); g = gm / amt if amt else gm
        if 'yield' in d or d.startswith('oz') or d.startswith('lb') or 'package' in d or 'serving' in d: continue
        if d.startswith('cup'):
            ek = ' (doğranmış)' if ('chopped' in d or 'diced' in d) else ' (dilimlenmiş)' if 'slice' in d else ''
            out.append(['1 su bardağı' + ek, round(g * SU, 1)])
        elif d.startswith('tbsp'): out.append(['1 yemek kaşığı', round(g, 1)])
        elif d.startswith('tsp'): out.append(['1 tatlı kaşığı', round(g, 1)])
        elif 'slice' in d: out.append(['1 dilim', round(g, 1)])
        elif d.startswith('small') or ', small' in d or d.endswith('small'): out.append(['1 küçük boy', round(g, 1)])
        elif d.startswith('medium') or ', medium' in d: out.append(['1 orta boy', round(g, 1)])
        elif d.startswith('large') or ', large' in d: out.append(['1 büyük boy', round(g, 1)])
        elif 'fillet' in d: out.append(['1 fileto', round(g, 1)])
        elif re.match(r'^(fruit|pepper|piece|each|whole|nut|berry|date|pancake|waffle|muffin|croissant|doughnut|bagel|cookie|cake|plant|stalk|spear|sprout|bulb|leaf)', d) or amt == 1 and len(d.split()) <= 2:
            out.append(['1 adet', round(g, 1)])
    # aynı adlı ölçüleri tekle
    seen = {}; res = []
    for o in out:
        if o[0] in seen: continue
        seen[o[0]] = 1; res.append(o)
    res = [o for o in res if o[0].startswith('1 su bardağı') or o[1] <= 350]
    return res[:3]
def ham():
    yeni = []
    for t in L:
        ndb, ad, grup, olcu = t[0], t[1], t[2], t[3]
        o = t[4] if len(t) > 4 else None
        n = NUT[ndb]
        olc = olcu_cevir(ndb) if olcu is None else olcu
        b = {'id': 'n' + ndb, 'ad': ad, 'kat': '', 'kcal': round(n.get('208', 0)), 'p': round(n.get('203', 0), 1),
             'y': round(n.get('204', 0), 1) if '204' in n else None, 'k': round(n.get('205', 0), 1) if '205' in n else None,
             'olcu': olc, 'kaynak': 'USDA SR28 NDB ' + ndb + ' (' + FOOD[ndb]['ad'][:60] + ')', 'g': grup}
        if o: b['o'] = o
        yeni.append(b)
    return yeni
if __name__ == '__main__':
    for b in ham(): print(b['id'], b['ad'], b['kcal'], b['p'], b['olcu'])
