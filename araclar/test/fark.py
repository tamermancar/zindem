"""İki stil.json'ı karşılaştırır, farkları özetler. Kullanım: python3 -I fark.py once/stil.json sonra/stil.json"""
import json, sys, collections
a, b = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
toplam = 0; ozet = collections.Counter(); ornek = {}
for durum in a:
    if durum not in b: print('EKSİK DURUM', durum); continue
    A, B = a[durum], b[durum]
    for k in set(A) | set(B):
        if k not in A or k not in B:
            toplam += 1; anahtar = ('öğe var/yok', k.split('>')[-1][:60]); ozet[anahtar] += 1; ornek.setdefault(anahtar, (durum, k)); continue
        for p in A[k]:
            if A[k][p] != B[k].get(p):
                toplam += 1; anahtar = (p, k.split('>')[-1][:70], str(A[k][p])[:60], str(B[k].get(p))[:60]); ozet[anahtar] += 1; ornek.setdefault(anahtar, (durum, k))
print('toplam fark', toplam)
for k, n in ozet.most_common(60): print(n, k, '|', ornek[k][0])
