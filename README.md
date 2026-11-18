# Zindem

Telefonda çalışan kişisel sağlık takip uygulaması: yemek, kalori ve protein, su, adım, uyku ve ağrı notları.

- Ekranlar bu depodan GitHub Pages ile yayınlanır.
- Veriler kullanıcının kendi Google E-Tablolar dosyasında durur; bu depoda kişisel veri yoktur.
- Zindem teşhis koymaz, tedavi önermez. Kayıtlarını tutar, gösterir ve uyarır.

## Yapı

| Parça | Nerede | Ne yapar |
|---|---|---|
| Ekran | `index.html`, `stil.css`, `uygulama.js`, `katalog.json` | Telefonda açılan uygulama |
| Tablo kodu | `sunucu.js` | E-Tablolar'ı okuyan ve yazan kod. Telefonda çalışmaz; Apps Script'teki Kod.gs onu buradan okur. |
| Kapı | `apps-script/Kod.gs` (kopya) | E-Tablolar › Uzantılar › Apps Script'te durur. Anahtarı kontrol eder, aylık yedeği alır. Nadiren değişir. |

Güncellemeler sadece bu depodan yapılır. `sunucu.js` değişince içindeki `SUNUCU_SURUM` ile `uygulama.js`'teki `SUNUCU_SURUM` birlikte artırılır.

## Besin kataloğu kaynakları

- U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, SR Legacy (2018). fdc.nal.usda.gov — kamu malı (CC0 1.0).
- Türkiye'ye özgü ürünler: piyasadaki ürün etiketlerinin ortalaması, markasız.
- Pişmiş baklagillerde "çay bardağı (pişmiş)" ölçüsü: T.C. Sağlık Bakanlığı, Sağlıklı Beslenme Önerileri porsiyonu; gramı USDA su bardağı ölçüsünden.
- Değerler 100 g içindir. Ölçüler: su bardağı 200 ml, çay bardağı 100 ml, yemek kaşığı 15 ml, tatlı kaşığı 5 ml, çay kaşığı 2,5 ml (silme).

## Simgeler

- [Tabler Icons](https://tabler.io/icons), MIT Lisansı — Copyright (c) 2020-2026 Paweł Kuna. Kullanılan simgeler index.html içine gömülüdür.
