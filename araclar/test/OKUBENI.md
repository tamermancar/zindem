# Test araçları

Uygulama bu klasörü kullanmaz. Gizli bilgi yok; tablolar bellekte, sahte veriyle.

- `sahte.js`: Sahte Apps Script. `sunucu.js`'i Node `vm` ile bellekteki tablolarla çalıştırır ve depoyu sunar.
  `node araclar/test/sahte.js <depo klasörü> 8766` → `http://localhost:8766/#k=x`
- `arama_dene.py`: Playwright ile (390 × 800, `/usr/bin/google-chrome`) Ekle penceresinde örnek aramalar yapar, ekran görüntüsü alır.
- `yakala.py <port> <klasör> [koyu]`: 26 ekran durumunu gezer; her öğenin hesaplanan stilini (`stil.json`) ve ekran görüntüsünü kaydeder (saat sabit 19 Kasım 13:20).
- `fark.py önce/stil.json sonra/stil.json`: iki `yakala.py` çıktısını karşılaştırır (CSS değişikliği görünümü bozdu mu?).
- `ayar_test.py <port> <klasör>`: 1.7 Ayarlar, Mutfak, sıfırlama ve tarif akışlarını uçtan uca dener; tabloya yazılanları `/_tablo` ile kontrol eder. Her çalıştırmadan önce sunucuyu yeniden başlat (sonunda her şeyi sıfırlar).
- `agri_test.py <port> <klasör> [koyu]` (1.8): liste düzenindeki ağrı notu (sıradaki satır soluk, türe göre bölge, bölgeye göre taraf, "Diğer…" ile yeni bölge) ve yeni ev yemeklerini dener.
