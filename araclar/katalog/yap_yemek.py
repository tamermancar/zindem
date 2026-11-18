# Ev yemekleri: Türk tarif sitesindeki oranlar + USDA malzeme değerleri. Porsiyon başına (tarifin kişi sayısının ortası).
# Malzeme: (besin id, gram, açıklama). Gramlar katalogdaki USDA ölçülerinden; tuz, baharat ve su 0 kcal sayıldı.
import json
KAT = json.load(open('/home/claude/zindem/katalog.json'))
B = {b['id']: b for b in KAT['besinler']}
EK = {  # katalogda olmayan, sadece hesap ve 1.6 tarifleri için malzeme (Ekle listesinde görünmez)
 'n01125': {'id': 'n01125', 'ad': 'Yumurta sarısı, çiğ', 'kcal': 322, 'p': 15.9, 'y': 26.5, 'k': 3.6, 'olcu': [['1 adet (L)', 17]], 'kaynak': 'USDA SR28 NDB 01125 (Egg, yolk, raw, fresh)', 'g': 'Kahvaltılık', 'm': 1},
 'n06172': {'id': 'n06172', 'ad': 'Tavuk suyu (ev yapımı)', 'kcal': 36, 'p': 2.5, 'y': 1.2, 'k': 3.5, 'olcu': [['1 su bardağı', 202.9]], 'kaynak': 'USDA SR28 NDB 06172 (Soup, stock, chicken, home-prepared)', 'g': 'Çorbalar', 'm': 1},
 'n16049': {'id': 'n16049', 'ad': 'Kuru fasulye, kuru (çiğ)', 'kcal': 333, 'p': 23.4, 'y': 0.9, 'k': 60.3, 'olcu': [['1 su bardağı', 170.8], ['1 yemek kaşığı', 12.6]], 'kaynak': 'USDA SR28 NDB 16049 (Beans, white, mature seeds, raw)', 'g': 'Baklagiller', 'm': 1},
 'n11052': {'id': 'n11052', 'ad': 'Taze fasulye, çiğ', 'kcal': 31, 'p': 1.8, 'y': 0.2, 'k': 7.0, 'olcu': [['1 su bardağı', 84.5]], 'kaynak': 'USDA SR28 NDB 11052 (Beans, snap, green, raw)', 'g': 'Sebzeler', 'm': 1},
}
def deger(i):
    return B.get(i) or EK[i]
SIVRI = 45   # USDA 11670 "1 pepper" 45 g
SALATALIK_IRI = 301  # USDA 11205 "1 cucumber (8-1/4")"
YEMEKLER = [
 ('y-mercimek-corbasi', 'Mercimek çorbası', 'Çorbalar', 'https://www.nefisyemektarifleri.com/mercimek-corbasi-tarifi/', '6-8 kişilik', 7, [
   ('u174284', 2 * 162, '2 su bardağı kırmızı mercimek'), ('u170000', 110, '1 soğan (orta)'), ('u168894', 2 * 8, '2 yk un'),
   ('u170393', 61, '1 havuç (orta)'), ('u170459', 8, '½ yk salça'), ('u171025', 5 * 14, '5 yk sıvı yağ'), ('u173410', 2 * 14, '2 yk tereyağı (sos)')]),
 ('y-ezogelin-corbasi', 'Ezogelin çorbası', 'Çorbalar', 'https://www.nefisyemektarifleri.com/ezogelin-corbasi-tarifi/', '8-10 kişilik', 9, [
   ('u171025', 14, '1 yk sıvı yağ'), ('u173410', 14, '1 yk tereyağı'), ('u170000', 110, '1 soğan (orta)'), ('u169230', 2 * 3, '2 diş sarımsak'),
   ('u174284', 162, '1 su bardağı kırmızı mercimek'), ('u170688', 4 * 9, '4 yk bulgur'), ('u168877', 2 * 12, '2 yk pirinç'),
   ('u171025', 2 * 14, '2 yk sıvı yağ (sos)'), ('u168894', 8, '1 yk un'), ('u170459', 2 * 16, '2 yk salça')]),
 ('y-yayla-corbasi', 'Yayla çorbası', 'Çorbalar', 'https://www.nefisyemektarifleri.com/yayla-corbasi-tarifi/', '6-8 kişilik (suyu su sayıldı)', 7, [
   ('u168877', 156 / 2, '1 çay bardağı pirinç'), ('n01125', 17, '1 yumurta sarısı'), ('u171284', 1.5 * 207, '1,5 su bardağı yoğurt'),
   ('u168894', 8, '1 yk un'), ('u173410', 2 * 14, '2 yk tereyağı')]),
 ('y-bulgur-pilavi', 'Bulgur pilavı', 'Pilav ve makarna', 'https://www.nefisyemektarifleri.com/bulgur-pilavi-tarifi/', '4-6 kişilik', 5, [
   ('u170688', 2 * 118, '2 su bardağı bulgur'), ('u170457', 2 * 123, '2 domates (orta)'), ('u170000', 110, '1 soğan (orta)'),
   ('n11670', 2 * SIVRI, '2 sivri biber'), ('n06172', 202.9, '1 su bardağı tavuk suyu'), ('u171025', 4 * 14, '4 yk sıvı yağ')]),
 ('y-pirinc-pilavi', 'Pirinç pilavı', 'Pilav ve makarna', 'https://www.nefisyemektarifleri.com/pirinc-pilavi-tarifi/', '4-6 kişilik', 5, [
   ('u168877', 2 * 156, '2 su bardağı pirinç'), ('u173410', 3 * 14, '3 yk tereyağı'), ('u171025', 14, '1 yk sıvı yağ')]),
 ('y-etli-kuru-fasulye', 'Etli kuru fasulye', 'Baklagiller', 'https://www.nefisyemektarifleri.com/etli-kuru-fasulye-tarifi/', '4-6 kişilik (biber salçası domates salçası değeriyle)', 5, [
   ('n16049', 1.5 * 170.8, '1,5 su bardağı kuru fasulye'), ('u170000', 110, '1 soğan (orta)'), ('u170459', 2 * 16, '1 yk domates + 1 yk biber salçası'),
   ('u171757', 300, '300 g kuşbaşı dana'), ('u171025', 4.5 * 14, '4-5 yk sıvı yağ (4,5)')]),
 ('y-zeytinyagli-taze-fasulye', 'Zeytinyağlı taze fasulye', 'Sebze yemekleri', 'https://www.nefisyemektarifleri.com/zeytinyagli-taze-fasulye-tarifi/', '4-6 kişilik', 5, [
   ('n11052', 500, '500 g taze fasulye'), ('u170000', 110, '1 soğan (orta)'), ('u170457', 1.5 * 123, '1-2 domates (1,5)'), ('u170427', 119, '1 biber (orta)'),
   ('u170459', 16, '1 yk salça'), ('u169655', 1.5 * 2, '1,5 çay kaşığı şeker'), ('u171413', 45.5, '½ çay bardağı zeytinyağı (50 ml)')]),
 ('y-menemen', 'Menemen', 'Kahvaltılık', 'https://www.nefisyemektarifleri.com/menemen-tarifi/', '2-4 kişilik (peynirsiz)', 3, [
   ('u171025', 2 * 14, '2 yk sıvı yağ'), ('n11670', 3 * SIVRI, '3 yeşil biber'), ('u170457', 3 * 123, '3 domates (orta)'), ('u171287', 3 * 50, '3 yumurta (M)')]),
 ('y-cacik', 'Cacık', 'Salatalar', 'https://www.nefisyemektarifleri.com/cacik-tarifi/', '2-4 kişilik (üstündeki zeytinyağı hariç)', 3, [
   ('u168409', 4 * SALATALIK_IRI, '4 iri salatalık'), ('u171284', 2 * 207, '2 su bardağı yoğurt'), ('u169230', 2 * 3, '2 diş sarımsak')]),
 ('y-tavuk-sote', 'Tavuk sote', 'Et, tavuk, balık', 'https://www.nefisyemektarifleri.com/tavuk-sote-tarifi/', '2-4 kişilik', 3, [
   ('u171077', 500, '500 g tavuk göğsü'), ('u171025', 2 * 14, '2 yk sıvı yağ'), ('u170459', 5, '1 tatlı kaşığı salça'), ('n11670', 2 * SIVRI, '2 yeşil biber'),
   ('u170108', 119, '1 kırmızı biber (orta)'), ('u170000', 110, '1 soğan (orta)'), ('u169230', 2 * 3, '2 diş sarımsak'), ('u170457', 2 * 123, '2 domates (orta)')]),
 ('y-etli-nohut', 'Etli nohut', 'Baklagiller', 'https://yemek.com/tarif/etli-nohut-yemegi/', '4 kişilik (biber salçası domates salçası değeriyle)', 4, [
   ('u170000', 110, '1 soğan (orta)'), ('u173757', 1.5 * 139, '1,5 su bardağı haşlanmış nohut'), ('u171757', 350, '350 g dana kuşbaşı'),
   ('u170459', 1.5 * 16, '1,5 yk biber salçası'), ('u171413', 4 * 14, '4 yk zeytinyağı')]),
 ('y-coban-salatasi', 'Çoban salatası', 'Salatalar', 'https://yemek.com/tarif/klasik-coban-salatasi', '6 kişilik (nane ve tuz sayılmadı)', 6, [
   ('u168409', 2 * 158, '2 salatalık (soyulmuş, küçük boy)'), ('n11670', 4 * SIVRI, '4 sivri biber'), ('n11291', 7 * 15, '7 dal taze soğan'),
   ('u170457', 3 * 182, '3 domates (büyük)'), ('u170416', 2.5, '2-3 dal maydanoz'), ('u171413', 28, '30 ml zeytinyağı'), ('u167747', 30.5, '30 ml limon suyu')]),
]
OGUN = {'Çorbalar': [0, 3, 3, 0], 'Pilav ve makarna': [0, 2, 3, 0], 'Baklagiller': [0, 2, 3, 0], 'Sebze yemekleri': [0, 3, 3, 0],
        'Kahvaltılık': [3, 1, 0, 0], 'Salatalar': [0, 3, 3, 0], 'Et, tavuk, balık': [0, 2, 3, 0]}
def yemekler(ham_ek):
    for b in ham_ek: B[b['id']] = b
    out = []
    for id_, ad, g, url, kisi, n, malz in YEMEKLER:
        kcal = sum(deger(i)['kcal'] * gr / 100 for i, gr, _ in malz)
        p = sum(deger(i)['p'] * gr / 100 for i, gr, _ in malz)
        out.append({'id': id_, 'ad': ad, 'kat': '', 'porsiyon': True, 'kcal': round(kcal / n), 'p': round(p / n, 1), 'y': None, 'k': None,
                    'olcu': [['1 porsiyon', 1]], 'g': g, 'o': OGUN[g],
                    'kaynak': 'Tarif: ' + url + ' (' + kisi + '; 1 porsiyon = tarifin 1/' + str(n) + "'i). Malzeme değerleri USDA.",
                    'malzemeler': [[i, round(gr, 1), a] for i, gr, a in malz]})
    return out
