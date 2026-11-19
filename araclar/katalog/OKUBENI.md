# Katalog üretimi (1.5)

`katalog.json`a 1.5'te eklenen besinler bu betiklerle üretildi. Uygulama bu klasörü kullanmaz.

- `sr.py`: USDA SR28 ASCII dosyalarını okur (SR Legacy ile aynı veri, kamu malı). Dosyalar depoda yok; `K` yolunu SR28 klasörüne göster.
- `yeni_liste.py`: eklenen besinler (NDB, Türkçe ad, grup, ölçüler, öğün puanı) ve listede gizlenen çiğ/kuru tarif malzemeleri.
- `yap_ham.py`: USDA değerlerini ve porsiyon kayıtlarını (cup → su bardağı 200 ml) çevirir.
- `yap_yemek.py`: ev yemekleri; oranlar nefisyemektarifleri.com, malzeme değerleri USDA, 1 porsiyon = tarifin kişi sayısının ortası.
- `yap.py`: eski katalogun üstüne ekleyip `katalog.json`u yazar.
- `yap_ek.py`: 1.5.1'de eklenen yemekler (etli nohut, çoban salatası; yemek.com oranları) için yalnızca eksik yemekleri ekler.
- `yap_sablon.py` (1.6): ev yemeklerine porsiyon sayısı (`kisi`), tarif şablonları (Omlet, Yağda yumurta), hazır omlet/sahanda yumurtayı listeden kaldırma (`x`). `python3 araclar/katalog/yap_sablon.py katalog.json`
- `yap_oneri.py` (1.6.1): kahvaltı sebze puanları (domates/salatalık/sivri biber/kapya 2,5; dolmalık biber 0).
