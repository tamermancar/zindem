# Katalog üretimi (1.5)

`katalog.json`a 1.5'te eklenen besinler bu betiklerle üretildi. Uygulama bu klasörü kullanmaz.

- `sr.py`: USDA SR28 ASCII dosyalarını okur (SR Legacy ile aynı veri, kamu malı). Dosyalar depoda yok; `K` yolunu SR28 klasörüne göster.
- `yeni_liste.py`: eklenen besinler (NDB, Türkçe ad, grup, ölçüler, öğün puanı) ve listede gizlenen çiğ/kuru tarif malzemeleri.
- `yap_ham.py`: USDA değerlerini ve porsiyon kayıtlarını (cup → su bardağı 200 ml) çevirir.
- `yap_yemek.py`: ev yemekleri; oranlar nefisyemektarifleri.com, malzeme değerleri USDA, 1 porsiyon = tarifin kişi sayısının ortası.
- `yap.py`: eski katalogun üstüne ekleyip `katalog.json`u yazar.
