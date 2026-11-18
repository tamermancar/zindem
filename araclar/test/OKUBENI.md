# Test araçları

Uygulama bu klasörü kullanmaz. Gizli bilgi yok; tablolar bellekte, sahte veriyle.

- `sahte.js`: Sahte Apps Script. `sunucu.js`'i Node `vm` ile bellekteki tablolarla çalıştırır ve depoyu sunar.
  `node araclar/test/sahte.js <depo klasörü> 8766` → `http://localhost:8766/#k=x`
- `arama_dene.py`: Playwright ile (390 × 800, `/usr/bin/google-chrome`) Ekle penceresinde örnek aramalar yapar, ekran görüntüsü alır.
