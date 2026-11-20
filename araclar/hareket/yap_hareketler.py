"""hareketler.json üretir (Zindem hareket kütüphanesi, 1. parti).

Kaynaklar:
- fedb: free-exercise-db (yuhonas, Unlicense / kamu malı). Talimatlar kaynaktan Türkçeye kısaltılarak çevrildi.
- nhs: NHS "Sitting / Strength / Balance exercises" sayfaları (© Crown copyright). Hareket fikri alındı,
  metin kendi cümlelerimizle yazıldı, kaynak gösterildi.
- zindem: kaynaklarda olmayan, yaygın rehabilitasyon/ısınma hareketleri; metin bizim.
  ⚠ "zorlar" ve uzuv etiketleri ilk etiketlemedir, fizyoterapist kontrolünden geçmedi (uygulamada "kaynak" satırında yazar).

Uzuv kodları (liste):
  k2 = iki kol gerekir · k1 = tek kolla yapılabilir · k0 = kol gerekmez
  t  = elle tutma / kavrama gerekir
  b2 = iki bacak gerekir · b1 = tek bacakla yapılabilir · b0 = bacak gerekmez
  d  = ayakta denge gerekir · o = oturarak yapılır
Kullanım: python3 yap_hareketler.py <depo>/hareketler.json
"""
import json, sys

H = []
def h(id, ad, bilinen, kaynak, bolge, ekipman, poz, seviye, tur, hedef, zorlar, uzuv, basla, yap, hisset, kolay='', zor='', dikkat='', taraf=False):
    H.append({'id': id, 'ad': ad, 'bilinen': bilinen, 'kaynak': kaynak, 'bolge': bolge, 'ekipman': ekipman, 'poz': poz,
              'seviye': seviye, 'tur': tur, 'hedef': hedef, 'zorlar': zorlar, 'uzuv': uzuv, 'taraf': taraf,
              'metin': {'basla': basla, 'yap': yap, 'hisset': hisset, 'kolay': kolay, 'zor': zor, 'dikkat': dikkat}})

# ---------- Göğüs / itme ----------
h('h001', 'Duvar şınavı', 'wall push-up', 'nhs', 'göğüs', [], 'ayakta', 'başlangıç', 'tekrar', '3 × 5–10', ['omuz', 'el bileği'], ['k2', 'b2'],
  'Duvara bir kol boyu uzakta dur. Ellerini göğüs hizasında, omuz genişliğinde duvara koy.',
  'Sırtın düz kalsın; dirseklerini gövdene yakın bükerek göğsünü duvara yaklaştır, sonra yavaşça it.',
  'Göğsünde ve kolunun arkasında.', 'Duvara biraz daha yaklaş.', 'Ayaklarını duvardan uzaklaştır ya da eğimli şınava geç.',
  'Belin çukurlaşmasın, kalçan geride kalmasın.')
h('h002', 'Eğimli şınav', 'incline push-up', 'fedb:Incline_Push-Up', 'göğüs', ['tezgah'], 'ayakta', 'başlangıç', 'tekrar', '3 × 8–12', ['omuz', 'el bileği'], ['k2', 'b2'],
  'Ellerini sağlam bir tezgahın ya da koltuğun kenarına, omuz genişliğinden biraz geniş koy. Ayaklarını geriye at, vücudun düz bir çizgi olsun.',
  'Kollarını bükerek göğsünü kenara yaklaştır, sonra kollarını uzatarak geri it.',
  'Göğsünde, omzunun önünde ve kolunun arkasında.', 'Daha yüksek bir yüzey kullan (tezgah).', 'Daha alçak bir yüzey kullan, sonra yerden şınava geç.',
  'Dirseklerin yana T gibi açılmasın; gövdeye yaklaşık 45 derece dursun. Kalçan sarkmasın.')
h('h003', 'Dar eğimli şınav', 'close-grip incline push-up', 'fedb:Incline_Push-Up_Close-Grip', 'kol', ['tezgah'], 'ayakta', 'başlangıç', 'tekrar', '2 × 8–10', ['omuz', 'dirsek', 'el bileği'], ['k2', 'b2'],
  'Ellerini tezgahın kenarına yan yana, omuz genişliğinden dar koy. Ayaklarını geriye at, vücudun düz olsun.',
  'Dirseklerin gövdene yapışık kalarak geriye doğru bükülsün; göğsünü kenara yaklaştır ve geri it.',
  'Kolunun arkasında.', 'Daha yüksek bir yüzey kullan.', 'Daha alçak bir yüzey kullan.', 'Dirseklerin yana açılmasın.')
h('h004', 'Diz üstü şınav', 'knee push-up', 'zindem', 'göğüs', ['mat'], 'dört ayak', 'başlangıç', 'tekrar', '2 × 6–10', ['omuz', 'el bileği', 'diz'], ['k2'],
  'Dizlerin matta, ellerin omuzlarının altından biraz geniş dursun. Dizinden başına kadar düz bir çizgi olsun.',
  'Göğsünü yere yaklaştır, nefes vererek it.', 'Göğsünde ve kolunun arkasında.',
  'Eğimli şınava dön.', 'Yerden şınava geç.', 'Kalçan kırılmasın; dizinin altına dizlik ya da katlanmış havlu koy.')
h('h005', 'Şınav', 'push-up', 'fedb:Pushups', 'göğüs', [], 'yüzüstü', 'orta', 'tekrar', '3 × 6–12', ['omuz', 'el bileği'], ['k2'],
  'Ellerin omuzlarının biraz dışında, ayak parmaklarının üstünde düz bir tahta gibi dur.',
  'Nefes alarak göğsün yere yaklaşana kadar in; nefes vererek it.', 'Göğsünde, omzunun önünde ve kolunun arkasında.',
  'Diz üstü ya da eğimli şınav yap.', 'Ayaklarını alçak bir basamağa koy.', 'Kalçan sarkmasın, dirseklerin yana açılmasın.')
h('h006', 'Geniş şınav', 'wide push-up', 'fedb:Push-Up_Wide', 'göğüs', [], 'yüzüstü', 'orta', 'tekrar', '3 × 6–10', ['omuz', 'el bileği'], ['k2'],
  'Ellerini omuz genişliğinden geniş koy, ayak parmaklarının üstünde düz bir tahta gibi dur.',
  'Dirseklerini bükerek göğsünü yere yaklaştır, nefes vererek it.', 'Göğsünde.', 'Diz üstü yap.', '', 'Omzunda sızı olursa elleri daralt.')

# ---------- Sırt / çekme ----------
h('h010', 'Masa altında çekiş', 'inverted row', 'fedb:Inverted_Row', 'sırt', ['masa'], 'sırtüstü', 'orta', 'tekrar', '3 × 6–10', ['omuz', 'dirsek'], ['k2', 't'],
  'Önce masanın sağlam olduğunu ve devrilmeyeceğini kontrol et. Altına sırtüstü gir, kenarı omuz genişliğinde tut; dizlerin bükük, ayakların yerde.',
  'Önce kürek kemiklerini birbirine yaklaştır, sonra nefes vererek göğsünü masaya çek. Yavaşça in.',
  'Sırtının ortasında ve kürek kemiklerinin arasında.', 'Ayaklarını kalçana yaklaştır ya da yarım yol çek.', 'Bacaklarını uzat.',
  'Kalçan sarkmasın; çeneni uzatma, göğsün yaklaşsın.')
h('h011', 'Lastikle kürek çekme', 'seated band row', 'zindem', 'sırt', ['lastik'], 'oturarak', 'başlangıç', 'tekrar', '3 × 10–15', ['omuz', 'dirsek'], ['k1', 't', 'o'],
  'Yere otur, bacaklarını uzat. Lastiği ayak tabanlarından geçir, iki ucunu tut.',
  'Kürek kemiklerini sıkıştırarak dirseklerini geriye çek, yavaşça bırak.', 'Sırtının ortasında.',
  'Daha hafif bir lastik kullan; tutmak zorsa lastiği bileğine dola.', 'Daha sert bir lastik kullan.', 'Sırtını yuvarlama, omuzlarını kulaklarına kaldırma.', True)
h('h012', 'Lastik açma', 'band pull apart', 'fedb:Band_Pull_Apart', 'omuz', ['lastik'], 'ayakta', 'başlangıç', 'tekrar', '2 × 12–15', ['omuz'], ['k2', 't', 'o'],
  'Lastiği iki elinle tut, kollarını göğüs hizasında öne uzat.',
  'Kollarını düz tutarak lastiği yanlara aç, göğsüne getir; kontrollü geri dön.', 'Omzunun arkasında ve kürek kemiklerinin arasında.',
  'Lastiği daha geniş tut.', 'Lastiği daha dar tut.', 'Omuzlarını geride tut, kulaklarına kaldırma. Oturarak da yapılabilir.')
h('h013', 'Tek kol dambıl çekiş', 'one-arm dumbbell row', 'fedb:One-Arm_Dumbbell_Row', 'sırt', ['dambıl', 'sandalye'], 'ayakta', 'başlangıç', 'ağırlık', '3 × 8–12', ['bel', 'omuz'], ['k1', 't'],
  'Bir elini ve aynı taraftaki dizini sandalyeye koy, sırtın düz olsun. Diğer elinle dambılı tut.',
  'Dambılı göğsünün yanına doğru çek, dirseğin gövdene yakın kalsın; yavaşça indir.', 'Sırtında ve kolunun önünde.',
  'Hafif ağırlık ya da dolu su şişesi kullan.', 'Ağırlığı artır.', 'Belini yuvarlama.', True)
h('h014', 'Barfiks', 'pull-up', 'fedb:Pullups', 'sırt', ['barfiks'], 'asılı', 'orta', 'tekrar', '3 × 3–8', ['omuz', 'dirsek'], ['k2', 't'],
  'Barı avuçların öne bakacak şekilde, omuz genişliğinde tut ve asıl.',
  'Göğsünü öne vererek kendini çeneni barın üstüne kadar çek; yavaşça in.', 'Sırtının yanlarında ve kolunun önünde.',
  'Lastik destekli barfiks ya da kürek kemiği barfiksi yap.', '', 'Sallanma; omzunda ağrı olursa bırak.')
h('h015', 'Kürek kemiği barfiksi', 'scapular pull-up', 'fedb:Scapular_Pull-Up', 'sırt', ['barfiks'], 'asılı', 'başlangıç', 'tekrar', '2 × 6–10', ['omuz'], ['k2', 't'],
  'Barı avuçların öne bakacak şekilde tut ve asıl.',
  'Kollarını bükmeden omuzlarını aşağı çekerek kendini birkaç santim kaldır; yavaşça bırak.', 'Kürek kemiklerinin çevresinde.',
  'Ayaklarını bir basamağa koyarak yükünü azalt.', '', '')

# ---------- Omuz ----------
h('h020', 'Yüzüstü Y-T kaldırma', 'prone Y-T raise', 'zindem', 'omuz', ['mat'], 'yüzüstü', 'başlangıç', 'tekrar', '2 × 10', ['omuz', 'boyun'], ['k1'],
  'Yüzüstü yat, alnını mata ya da katlanmış havluya koy.',
  'Kollarını Y harfi gibi uzatıp başparmakların tavana bakacak şekilde birkaç santim kaldır, indir. Sonra kolları T gibi yana açıp aynısını yap.',
  'Kürek kemiklerinin çevresinde ve omuzlarının arkasında.', 'Hareketi daha küçük yap.', 'Eline hafif bir su şişesi al.',
  'Başını ve göğsünü kaldırma; omuzların kulaklarına kalkmasın.')
h('h021', 'Yan yatarak omuz döndürme', 'side-lying external rotation', 'fedb:External_Rotation', 'omuz', ['su şişesi'], 'yan yatarak', 'başlangıç', 'tekrar', '2 × 12', ['omuz'], ['k1', 't'],
  'Yan yat, başını yastığa koy. Üstteki kolunun dirseği beline yapışık ve 90 derece bükük, önkolun karnının önünde olsun.',
  'Dirseğini belinden ayırmadan önkolunu tavana doğru döndür, yavaşça indir.', 'Omzunun arkasında.',
  'Ağırlıksız yap.', 'Su şişesini doldur ya da hafif dambıl kullan.', 'Sadece ağrısız açıda dön; gövdeni geriye devirme.', True)
h('h022', 'Lastikle omuz döndürme', 'external rotation with band', 'fedb:External_Rotation_with_Band', 'omuz', ['lastik'], 'ayakta', 'başlangıç', 'tekrar', '2 × 12', ['omuz'], ['k1', 't', 'o'],
  'Lastiği dirsek hizasında sabit bir yere bağla, yan dur. Dirseğini 90 derece bük ve beline yapıştır.',
  'Dirseğin yerinde kalarak elini dışarı doğru döndür, kontrollü geri getir.', 'Omzunun arkasında.',
  'Daha hafif lastik kullan.', 'Daha sert lastik kullan.', 'Dirseğini belinden ayırma. Oturarak da yapılabilir.', True)
h('h023', 'Lastikle yana kaldırma', 'lateral raise with band', 'fedb:Lateral_Raise_-_With_Bands', 'omuz', ['lastik'], 'ayakta', 'başlangıç', 'tekrar', '2 × 10–15', ['omuz'], ['k1', 't'],
  'Lastiğin ortasına bas, uçlarını kalçanın yanında tut; dirseklerin hafif bükük.',
  'Kollarını yana, omuz hizasının hemen altına kadar kaldır; yavaşça indir.', 'Omzunun yanında.',
  'Lastiği daha uzun tut.', 'Lastiği daha kısa tut.', 'Omuzlarını kulaklarına kaldırma.')
h('h024', 'Oturarak omuz pres', 'seated dumbbell press', 'fedb:Seated_Dumbbell_Press', 'omuz', ['dambıl', 'sandalye'], 'oturarak', 'orta', 'ağırlık', '3 × 8–12', ['omuz', 'boyun'], ['k1', 't', 'o'],
  'Sırtı dik bir sandalyeye otur, dambılları omuz hizasında, avuçlar öne bakacak şekilde tut.',
  'Nefes vererek dambılları yukarı it, yavaşça omuz hizasına indir.', 'Omzunda ve kolunun arkasında.',
  'Hafif ağırlık ya da su şişesi kullan.', 'Ağırlığı artır.', 'Belini çukurlaştırma.')
h('h025', 'Ters açış', 'reverse fly', 'fedb:Reverse_Flyes', 'omuz', ['dambıl'], 'ayakta', 'orta', 'ağırlık', '2 × 10–12', ['omuz', 'bel'], ['k1', 't'],
  'Dizlerin hafif bükük, gövdeni öne eğ, sırtın düz olsun. Dambılları avuçlar birbirine bakacak şekilde aşağıda tut.',
  'Dirseklerin hafif bükük, kollarını yana açarak kürek kemiklerini sıkıştır; yavaşça indir.', 'Omzunun arkasında.',
  'Oturarak öne eğilerek yap.', '', 'Belini yuvarlama.')
h('h026', 'Kol çevirme', 'arm circles', 'fedb:Arm_Circles', 'omuz', [], 'ayakta', 'başlangıç', 'süre', '1 × 20 sn', ['omuz'], ['k1', 'o'],
  'Kollarını yana, yere paralel uzat.', 'Kollarınla küçük daireler çiz; 10 saniye sonra yönü değiştir.', 'Omuzlarında.',
  'Daireleri küçült.', '', 'Oturarak da yapılabilir.')
h('h027', 'Omuz çevirme', 'shoulder circles', 'fedb:Shoulder_Circles', 'omuz', [], 'oturarak', 'başlangıç', 'tekrar', '1 × 10', [], ['k0', 'o'],
  'Omuzların gevşek, kolların yanında ya da kucağında olsun.', 'Omuzlarını öne, yukarı, geriye ve aşağı yuvarla; sonra ters yöne.', 'Omuz ve ense çevresinde.')
h('h028', 'Duvar meleği', 'wall angel', 'zindem', 'omuz', ['duvar'], 'ayakta', 'başlangıç', 'tekrar', '1 × 8', ['omuz', 'boyun'], ['k1', 'b2'],
  'Topukların duvardan bir ayak boyu önde, kalçan, sırtın ve başının arkası duvarda olsun. Kollarını dirsekten 90 derece bükerek duvara yasla.',
  'Kollarını duvarda yukarı kaydır, sonra dirseklerini belinin yanına indir.', 'Kürek kemiklerinin arasında.',
  'Kolları daha az kaldır.', '', 'Belin ya da bileklerin duvardan kopuyorsa o noktadan sonra kaldırma.')

# ---------- Kol ----------
h('h030', 'Dambıl ile kol bükme', 'dumbbell biceps curl', 'fedb:Dumbbell_Bicep_Curl', 'kol', ['dambıl'], 'ayakta', 'başlangıç', 'ağırlık', '3 × 8–12', ['dirsek', 'el bileği'], ['k1', 't', 'o'],
  'Dik dur ya da otur; dambıllar yanında, avuçların öne baksın.', 'Üst kolun sabit, dambılları omuz hizasına kadar bük, yavaşça indir.',
  'Kolunun önünde.', 'Dolu su şişesi kullan.', 'Ağırlığı artır.', 'Gövdeni sallama.')
h('h031', 'Çekiç tutuşla kol bükme', 'hammer curl', 'fedb:Hammer_Curls', 'kol', ['dambıl'], 'ayakta', 'başlangıç', 'ağırlık', '3 × 8–12', ['dirsek', 'el bileği'], ['k1', 't', 'o'],
  'Dambılları avuçların gövdene bakacak şekilde yanında tut.', 'Dirseğin sabit, dambılı omuza doğru bük, yavaşça indir.',
  'Kolunun önünde ve önkolunda.', 'Su şişesi kullan.', 'Ağırlığı artır.', '')
h('h032', 'Havluyla kol arkası', 'towel triceps extension', 'fedb:Standing_Towel_Triceps_Extension', 'kol', ['havlu'], 'ayakta', 'başlangıç', 'tekrar', '2 × 10–12', ['dirsek', 'omuz'], ['k1', 't', 'o'],
  'Bir havlunun ucunu iki elinle başının üstünde tut; diğer ucu bir yardımcı tutsun ya da diğer elinle sırtından çek.',
  'Dirseklerin başına yakın, havluyu başının arkasına indir ve kollarını uzatarak geri kaldır.', 'Kolunun arkasında.',
  'Direnci azalt.', 'Direnci artır.', 'Dirseklerin yana açılmasın.')

# ---------- Gövde ----------
h('h040', 'Ölü böcek', 'dead bug', 'fedb:Dead_Bug', 'gövde', ['mat'], 'sırtüstü', 'başlangıç', 'tekrar', '2 × 6', ['bel'], ['k1', 'b1'],
  'Sırtüstü yat; kolların tavana, dizlerin 90 derece bükük ve havada olsun. Belini hafifçe yere bastır.',
  'Nefes vererek bir kolunu başının üstüne, karşı bacağını ileri uzat; geri gel, diğer çaprazla tekrarla.', 'Karnında.',
  'Sadece bacakları uzat ya da dizi bükük tut.', 'Hareketi yavaşlat.', 'Belin yerden kalkıyorsa hareketi küçült.', True)
h('h041', 'Kuş-köpek', 'bird dog', 'zindem', 'gövde', ['mat'], 'dört ayak', 'başlangıç', 'tekrar', '2 × 6', ['bel', 'diz', 'el bileği'], ['k1', 'b1'],
  'Dört ayak üstüne gel; ellerin omuzlarının, dizlerin kalçanın altında, sırtın masa gibi düz olsun.',
  'Karnını hafif sık, bir kolunu öne, karşı bacağını arkaya uzat; 5 saniye tut, geri gel, diğer çaprazla tekrarla.', 'Karnında, sırtında ve kalçanda.',
  'Sadece kolu ya da sadece bacağı uzat.', 'Tutma süresini uzat.', 'Belin çukurlaşmasın, kalçan yana dönmesin.', True)
h('h042', 'Plank', 'plank', 'fedb:Plank', 'gövde', ['mat'], 'yüzüstü', 'orta', 'süre', '2 × 20–40 sn', ['omuz', 'bel'], ['k2'],
  'Önkolların omuzlarının altında, ayak parmaklarının üstünde düz bir tahta gibi dur.', 'Vücudunu düz tutarak bekle, normal nefes al.',
  'Karnında.', 'Dizlerini yere koy.', 'Bir bacağını hafif kaldır.', 'Kalçan sarkmasın, havaya da kalkmasın.')
h('h043', 'Dizden yan plank', 'side plank from knees', 'fedb:Side_Bridge', 'gövde', ['mat'], 'yan yatarak', 'başlangıç', 'süre', '2 × 20–30 sn', ['omuz', 'kasık'], ['k1'],
  'Yan yat; dirseğin tam omzunun altında, dizlerin 90 derece bükük olsun.', 'Kalçanı kaldır, başından dizine kadar düz bir çizgi olsun; normal nefesle bekle.',
  'Karnının yere yakın yanında.', 'Süreyi kısalt.', 'Dizlerini düz uzatarak yap.', 'Omzun kulağına doğru gömülmesin.', True)
h('h044', 'Ters mekik', 'reverse crunch', 'fedb:Reverse_Crunch', 'gövde', ['mat'], 'sırtüstü', 'orta', 'tekrar', '2 × 8–12', ['bel'], ['k0', 'b2'],
  'Sırtüstü yat, kolların yanında. Dizlerini bük, uyluğun yere dik olsun.', 'Kalçanı hafifçe yerden kaldırarak dizlerini göğsüne çek, yavaşça geri indir.',
  'Alt karnında.', 'Hareketi küçült.', '', 'Bel fıtığı ya da bel ağrısı olanlar için uygun olmayabilir.')
h('h045', 'Süpermen', 'superman', 'fedb:Superman', 'sırt', ['mat'], 'yüzüstü', 'orta', 'tekrar', '2 × 8–10', ['bel', 'boyun'], ['k1', 'b1'],
  'Yüzüstü yat, kollarını öne uzat.', 'Kollarını, bacaklarını ve göğsünü birlikte hafifçe kaldır, 2 saniye tut, indir.', 'Belinde ve kalçanda.',
  'Sadece kolları ya da sadece bacakları kaldır.', '', 'Başını geriye atma.')

# ---------- Kalça / bacak ----------
h('h050', 'Köprü', 'glute bridge', 'fedb:Butt_Lift_Bridge', 'kalça', ['mat'], 'sırtüstü', 'başlangıç', 'tekrar', '3 × 12–15', ['bel'], ['k0', 'b2'],
  'Sırtüstü yat, dizlerin bükük, ayakların kalça genişliğinde yerde olsun.', 'Topuklarından basarak kalçanı kaldır, tepede 1–2 saniye sık, yavaşça in.',
  'Kalçanda.', 'Daha az yükseğe kalk.', 'Tek bacakla yap.', 'Tepede belini kavislendirme; başının altına katlanmış havlu koyabilirsin.')
h('h051', 'Tek bacak köprü', 'single leg glute bridge', 'fedb:Single_Leg_Glute_Bridge', 'kalça', ['mat'], 'sırtüstü', 'orta', 'tekrar', '2 × 8–10', ['bel', 'kalça'], ['k0', 'b1'],
  'Sırtüstü yat, dizlerin bükük. Bir dizini göğsüne çek.', 'Yerdeki topuğundan basarak kalçanı kaldır, bekle, yavaşça in.', 'Kalçanda.',
  'İki bacakla köprü yap.', '', '', True)
h('h052', 'Sandalyeden kalkma', 'sit-to-stand', 'nhs', 'bacak', ['sandalye'], 'oturarak', 'başlangıç', 'tekrar', '2 × 5–10', ['diz', 'kalça'], ['k0', 'b2'],
  'Sağlam, tekerleksiz bir sandalyenin ucuna otur; ayakların kalça genişliğinde, gövden hafif öne eğik.',
  'Kollarını kullanmadan, bacaklarınla yavaşça kalk; dik dur, sonra yavaşça otur.', 'Uyluğunun önünde ve kalçanda.',
  'Ellerinle dizlerinden destek al ya da sandalyeye yastık koy.', 'İnişi 3–4 saniyeye çıkar ya da elinde su şişesi tut.',
  'Aşağı bakma; dizlerin içe kapanmasın.')
h('h053', 'Sandalyeye oturup kalkma', 'box squat', 'zindem', 'bacak', ['sandalye'], 'ayakta', 'başlangıç', 'tekrar', '3 × 10–12', ['diz', 'kalça', 'bel'], ['k0', 'b2'],
  'Sandalyenin önünde dur; ayakların omuz genişliğinde, parmak uçların hafif dışa baksın.',
  'Kalçanı geriye göndererek 3 saniyede otur, 1 saniye bekle; topuklarından basarak kalk.', 'Uyluğunun önünde ve kalçanda.',
  'Sandalyeye yastık koy.', 'Elinde iki dolu su şişesi tut.', 'Dizlerin içe kapanmasın; sandalyeye çökme.')
h('h054', 'Mini çömelme', 'mini squat', 'nhs', 'bacak', ['sandalye'], 'ayakta', 'başlangıç', 'tekrar', '2 × 5–10', ['diz'], ['k0', 'b2'],
  'Bir sandalyenin arkasında dur, ellerini sandalyenin sırtına koy; ayakların kalça genişliğinde.',
  'Dizlerini rahat edebildiğin kadar bük; dizlerin ayak başparmaklarının üstünde öne baksın. Kalçanı sıkarak yavaşça kalk.',
  'Uyluğunun önünde.', 'Daha az bük.', 'Sandalyeyi bırak.', 'Sırtın düz kalsın.')
h('h055', 'Vücut ağırlığıyla çömelme', 'bodyweight squat', 'fedb:Bodyweight_Squat', 'bacak', [], 'ayakta', 'orta', 'tekrar', '3 × 10–15', ['diz', 'kalça', 'bel'], ['k0', 'b2', 'd'],
  'Ayakların omuz genişliğinde dur.', 'Dizlerini ve kalçanı bükerek kalçanı geriye gönder; göğsün dik, dizlerin dışa doğru. Kalk.',
  'Uyluğunda ve kalçanda.', 'Sandalyeye oturup kalkma yap.', 'İnişi yavaşlat.', 'Dizlerin içe kapanmasın; topukların yerden kalkmasın.')
h('h056', 'Basamak çıkma', 'step-up', 'nhs', 'bacak', ['basamak'], 'ayakta', 'başlangıç', 'tekrar', '2 × 5–8', ['diz', 'kalça', 'ayak bileği'], ['k0', 'b2', 'd'],
  'Alçak, sağlam bir basamağın önünde, mümkünse bir duvar ya da tırabzan yanında dur.',
  'Bir ayağınla basamağa çık, diğerini yanına getir; sonra yavaşça in.', 'Uyluğunda ve kalçanda.',
  'Tırabzana tutun, alçak basamak kullan.', 'İnişi 3 saniyeye çıkar.', 'Yerdeki ayağınla zıplayıp itme.', True)
h('h057', 'Geri adım hamle', 'reverse lunge', 'zindem', 'bacak', [], 'ayakta', 'orta', 'tekrar', '2 × 8', ['diz', 'kalça'], ['k0', 'b2', 'd'],
  'Ayakların omuz genişliğinde, ellerin belinde dur.', 'Bir ayağınla geriye adım at, iki dizini bükerek kalçanı indir; ön topuğundan basarak geri gel.',
  'Uyluğunda ve kalçanda.', 'Bir duvara tutun, daha az in.', '', 'Ön dizin ayağının üstünde kalsın.', True)
h('h058', 'Yan yatarak bacak kaldırma', 'side-lying hip abduction', 'zindem', 'kalça', ['mat'], 'yan yatarak', 'başlangıç', 'tekrar', '2 × 12', ['kalça'], ['k0', 'b1'],
  'Yan yat; alttaki bacağın hafif bükük, üstteki bacağın düz ve gövdenle aynı çizgide olsun.',
  'Üstteki bacağı 30–40 cm kaldır, 1 saniye tut, 2 saniyede indir.', 'Kalçanın yanında.', 'Daha az kaldır.', '',
  'Bacağı öne getirme, gövdeni geriye devirme.', True)
h('h059', 'Ayakta yana bacak kaldırma', 'standing side leg raise', 'nhs', 'kalça', ['sandalye'], 'ayakta', 'başlangıç', 'tekrar', '2 × 5–10', ['kalça'], ['k0', 'b1', 'd'],
  'Bir sandalyenin arkasında dur, ellerini sandalyeye koy.', 'Bir bacağını rahat edebildiğin kadar yana kaldır, indir; diğer bacakla tekrarla.',
  'Kalçanın yanında.', 'Daha az kaldır.', '', 'Sırtın ve kalçan düz kalsın, yana yatma.', True)
h('h060', 'Ayakta geriye bacak uzatma', 'standing leg extension', 'nhs', 'kalça', ['sandalye'], 'ayakta', 'başlangıç', 'tekrar', '2 × 5', ['bel'], ['k0', 'b1', 'd'],
  'Bir sandalyenin arkasında dur, ellerini sandalyeye koy.', 'Bir bacağını düz olarak geriye kaldır, 5 saniyeye kadar tut, indir.',
  'Uyluğunun arkasında ve kalçanda.', '', '', 'Belini çukurlaştırma.', True)
h('h061', 'Dört ayak geri tekme', 'glute kickback', 'fedb:Glute_Kickback', 'kalça', ['mat'], 'dört ayak', 'başlangıç', 'tekrar', '2 × 10–12', ['bel', 'diz', 'el bileği'], ['k2', 'b1'],
  'Dört ayak üstüne gel, ellerin omuz genişliğinde.', 'Dizi 90 derece bükük kalarak bir bacağını uyluk sırtınla aynı hizaya kadar kaldır, sık, indir.',
  'Kalçanda.', '', '', 'Belini çukurlaştırma.', True)
h('h062', 'Destekli topuk kaldırma', 'calf raise', 'nhs', 'baldır', ['sandalye'], 'ayakta', 'başlangıç', 'tekrar', '2 × 10', ['ayak bileği'], ['k0', 'b2'],
  'Bir sandalyenin arkasında dur, ellerini sandalyeye koy; ayakların yerde.', 'Topuklarını rahat edebildiğin kadar kaldır, kontrollü indir.',
  'Baldırında.', '', 'Sandalyeyi bırak ya da tek ayakla yap.', '')
h('h063', 'Oturarak diz uzatma', 'seated knee extension', 'zindem', 'bacak', ['sandalye'], 'oturarak', 'başlangıç', 'tekrar', '2 × 10', ['diz'], ['k0', 'b1', 'o'],
  'Sandalyede dik otur, ellerinle sandalyenin yanlarını tut.', 'Bir bacağını dizden düzleştirip 2 saniye tut, yavaşça indir.',
  'Uyluğunun önünde.', '', 'Ayak bileğine hafif ağırlık bağla.', '', True)
h('h064', 'Oturarak diz kaldırma', 'seated hip marching', 'nhs', 'kalça', ['sandalye'], 'oturarak', 'başlangıç', 'tekrar', '2 × 5', ['kalça'], ['k0', 'b1', 'o'],
  'Sandalyede, sırtını yaslamadan dik otur; ellerinle sandalyenin yanlarını tut.', 'Bir dizini bükük olarak rahat edebildiğin kadar kaldır, ayağını kontrollü indir; diğer bacakla tekrarla.',
  'Kalçanın önünde ve uyluğunda.', '', '', '', True)

# ---------- Denge ----------
h('h070', 'Tek ayak üstünde durma', 'one-leg stand', 'nhs', 'bacak', ['duvar'], 'ayakta', 'başlangıç', 'süre', '3 × 5–10 sn', ['ayak bileği'], ['k0', 'b1', 'd'],
  'Duvara dönük dur, kollarını uzatıp parmak uçlarını duvara değdir.', 'Kalçanı düz tutarak bir bacağını kaldır, 5–10 saniye bekle, yavaşça indir.',
  'Duran bacağında.', 'Parmak uçların duvarda kalsın.', 'Duvardan uzaklaş.', 'Duran dizin hafif bükük olsun.', True)
h('h071', 'Topuk-burun yürüyüş', 'heel-to-toe walk', 'nhs', 'bacak', ['duvar'], 'ayakta', 'başlangıç', 'tekrar', '1 × 5–10 adım', ['ayak bileği'], ['k0', 'b2', 'd'],
  'Bir duvarın yanında dik dur.', 'Bir topuğunu diğer ayağının burnunun hemen önüne koyarak yürü.', 'Bacaklarında ve gövdende.',
  'Duvara tutun.', 'Duvardan uzaklaş.', 'Hep önüne bak.')
h('h072', 'Yana yürüyüş', 'sideways walking', 'nhs', 'kalça', [], 'ayakta', 'başlangıç', 'tekrar', '1 × 10 adım', [], ['k0', 'b2', 'd'],
  'Ayakların bitişik, dizlerin hafif bükük dur.', 'Bir ayağınla yana adım at, diğerini yanına getir; yavaş ve kontrollü ilerle.', 'Kalçanın yanında.',
  'Duvara yakın yürü.', 'Ayak bileklerine lastik tak.', 'Kalçanı düşürme.')

# ---------- Esneme / hareketlilik ----------
h('h080', 'Çene içeri çekme', 'chin tuck', 'zindem', 'boyun', [], 'oturarak', 'başlangıç', 'tekrar', '1 × 10', ['boyun'], ['k0', 'o'],
  'Dik otur ya da ayakta dur, omuzların gevşek, karşıya bak.', 'Başını eğmeden çeneni düz bir çizgide geriye it, 2 saniye tut, bırak.',
  'Ensenin üstünde hafif bir gerilme.', '', '', 'Başını aşağı eğme, yukarı kaldırma.')
h('h081', 'Boyun döndürme', 'neck rotation', 'nhs', 'boyun', [], 'oturarak', 'başlangıç', 'tekrar', '1 × 3', ['boyun'], ['k0', 'o'],
  'Dik otur, omuzların gevşek, karşıya bak.', 'Başını rahat edebildiğin kadar bir omzuna doğru çevir, 5 saniye bekle, geri dön; diğer tarafa tekrarla.',
  'Boynunun yanında.', '', '', 'Yavaş yap; baş dönmesi olursa dur.')
h('h082', 'Yana boyun esnetme', 'side neck stretch', 'fedb:Side_Neck_Stretch', 'boyun', [], 'oturarak', 'başlangıç', 'süre', '1 × 15 sn', ['boyun'], ['k0', 'o'],
  'Omuzların gevşek otur.', 'Başını yavaşça bir omzuna doğru yatır; istersen elinle hafifçe destekle.', 'Boynunun yanında.', '', '', 'Zorlamadan, ağrısız yap.', True)
h('h083', 'Sırt esnetme', 'cat-camel', 'zindem', 'sırt', ['mat'], 'dört ayak', 'başlangıç', 'tekrar', '1 × 6', ['bel', 'diz', 'el bileği'], ['k2'],
  'Dört ayak üstüne gel; ellerin omuzlarının, dizlerin kalçanın altında.', 'Nefes verirken sırtını yukarı yuvarla, başını içeri al; nefes alırken hafifçe çukurlaştır.',
  'Omurgan boyunca.', 'Oturarak sırt döndürme yap.', '', 'Çukurlaştırırken belini zorlama, yarım yol yeter.')
h('h084', 'Oturarak gövde döndürme', 'seated upper-body twist', 'nhs', 'sırt', ['sandalye'], 'oturarak', 'başlangıç', 'tekrar', '1 × 5', ['bel'], ['k0', 'o'],
  'Dik otur, ayakların yerde, kollarını göğsünde çaprazla.', 'Kalçanı sabit tutarak üst gövdeni rahat edebildiğin kadar bir yana çevir, 5 saniye tut; diğer yana tekrarla.',
  'Sırtının üstünde.', '', '', '', True)
h('h085', 'Göğüs esnetme', 'chest stretch', 'nhs', 'göğüs', ['sandalye'], 'oturarak', 'başlangıç', 'tekrar', '1 × 5', ['omuz'], ['k1', 'o'],
  'Sandalyenin sırtından uzakta dik otur.', 'Omuzlarını geri ve aşağı çek, kollarını yana aç; göğsünü hafifçe öne ve yukarı it, 5–10 saniye tut.',
  'Göğsünün önünde.', '', '', '')
h('h086', 'Ayak bileği esnetme', 'ankle stretch', 'nhs', 'baldır', ['sandalye'], 'oturarak', 'başlangıç', 'tekrar', '2 × 5', ['ayak bileği'], ['k0', 'b1', 'o'],
  'Dik otur, sandalyenin yanını tut. Bir bacağını düzleştirip ayağını yerden kaldır.', 'Ayak parmaklarını önce ileri uzat, sonra kendine doğru çek.',
  'Baldırında ve ayak bileğinde.', '', '', '', True)
h('h087', 'Yarım diz kalça önü esnetme', 'half-kneeling hip flexor stretch', 'fedb:Kneeling_Hip_Flexor', 'kalça', ['mat'], 'diz üstü', 'başlangıç', 'süre', '1 × 30 sn', ['diz', 'kasık', 'bel'], ['k0', 'b2'],
  'Bir dizini mata koy, diğer ayağın önde yere bassın; iki dizin de 90 derece bükük.', 'Yerdeki dizinin tarafındaki kalçanı sık, kalçanı birkaç santim öne it, bekle.',
  'Yerdeki bacağının kasık önünde ve uyluğunun üstünde.', 'Daha az öne it.', '', 'Belini çukurlaştırma; dizinin altına kalın bir havlu koy.', True)
h('h088', 'Arka bacak esnetme', 'hamstring stretch', 'fedb:Hamstring_Stretch', 'bacak', ['havlu'], 'sırtüstü', 'başlangıç', 'süre', '1 × 20–30 sn', ['bel'], ['k1', 'b1'],
  'Sırtüstü yat, bir bacağını yukarı kaldır; havluyu ayak tabanından geçirip uçlarını tut.', 'Havluyu hafifçe çekerek bacağının arkasında gerilme hisset, bekle.',
  'Bacağının arkasında.', 'Dizini hafif bük.', '', '', True)
h('h089', 'Dizleri göğse çekme', 'knees to chest', 'fedb:Hug_Knees_To_Chest', 'sırt', ['mat'], 'sırtüstü', 'başlangıç', 'süre', '1 × 20 sn', ['diz', 'kalça'], ['k1', 'b2'],
  'Sırtüstü yat, iki dizini göğsüne çek.', 'Kollarını dizlerinin altından geçirip dizlerini yavaşça omuzlarına doğru çek, bekle.',
  'Belinde ve kalçanda.', 'Tek dizle yap.', '', 'Kollarını dizin üstünden değil altından tut.')
h('h090', 'Çocuk pozu', "child's pose", 'fedb:Childs_Pose', 'sırt', ['mat'], 'diz üstü', 'başlangıç', 'süre', '1 × 30 sn', ['diz'], ['k0'],
  'Dört ayak üstüne gel, ellerini öne doğru yürüt.', 'Kalçanı topuklarına doğru indir, alnını yere koy ve sırtına doğru nefes al.',
  'Omurgan boyunca.', 'Kalçanın altına yastık koy.', '', 'Diz sorunun varsa yapma.')
h('h091', 'Baldır esnetme', 'calf stretch', 'fedb:Calf_Stretch_Hands_Against_Wall', 'baldır', ['duvar'], 'ayakta', 'başlangıç', 'süre', '1 × 20 sn', ['ayak bileği'], ['k1', 'b2'],
  'Ellerini duvara koy, bir ayağını geriye at; arka bacağın düz, topuğun yerde.', 'Ön dizini bükerek duvara doğru eğil, baldırında gerilme hisset, bekle.',
  'Arka bacağının baldırında.', '', '', '', True)

def kontrol():
    ids = [x['id'] for x in H]; assert len(ids) == len(set(ids)), 'yinelenen id'
    adlar = [x['ad'] for x in H]; assert len(adlar) == len(set(adlar)), 'yinelenen ad'
    BOLGE = {'göğüs', 'sırt', 'omuz', 'kol', 'gövde', 'kalça', 'bacak', 'baldır', 'boyun'}
    AGRI = {'boyun', 'omuz', 'dirsek', 'el bileği', 'sırt', 'bel', 'kalça', 'kasık', 'diz', 'ayak bileği'}
    for x in H:
        assert x['bolge'] in BOLGE, x['id']
        assert set(x['zorlar']) <= AGRI, (x['id'], x['zorlar'])
        assert x['tur'] in ('tekrar', 'süre', 'ağırlık'), x['id']
        assert any(u in x['uzuv'] for u in ('k0', 'k1', 'k2')), x['id']

if __name__ == '__main__':
    kontrol()
    veri = {'surum': 1, 'kaynaklar': {
        'fedb': 'free-exercise-db (github.com/yuhonas/free-exercise-db), kamu malı (Unlicense); Türkçeye çevrildi',
        'nhs': 'NHS Strength, Balance ve Sitting exercises sayfaları; metin kendi cümlelerimizle',
        'zindem': 'Zindem; yaygın ısınma ve rehabilitasyon hareketleri'}, 'hareketler': H}
    json.dump(veri, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(len(H), 'hareket')
