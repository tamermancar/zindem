# SR28 okuyucu: ~ ile ayrılmış, ^ ayırıcı
import re, os
K='/home/claude/veri/sr28/'
def satirlar(f):
    with open(K+f, encoding='latin-1') as fh:
        for l in fh:
            yield [x.strip('~') for x in l.rstrip('\r\n').split('^')]
FOOD={r[0]:{'ndb':r[0],'grp':r[1],'ad':r[2]} for r in satirlar('FOOD_DES.txt')}
NUT={}
for r in satirlar('NUT_DATA.txt'):
    if r[1] in ('208','203','204','205','291','307'):
        NUT.setdefault(r[0],{})[r[1]]=float(r[2])
W={}
for r in satirlar('WEIGHT.txt'):
    W.setdefault(r[0],[]).append((float(r[2]), r[3], float(r[4])))
def ara(*kel, grp=None):
    out=[]
    for n,f in FOOD.items():
        a=f['ad'].lower()
        if all(k.lower() in a for k in kel) and (grp is None or f['grp']==grp): out.append((n,f['ad'],NUT.get(n,{}).get('208'),NUT.get(n,{}).get('203')))
    return out
