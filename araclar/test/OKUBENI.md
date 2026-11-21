# Test araçları

Uygulama bu klasörü kullanmaz. Gizli bilgi yok; tablolar bellekte, sahte veriyle.

- `sahte.js`: Sahte Apps Script. `sunucu.js`'i Node `vm` ile bellekteki tablolarla çalıştırır ve depoyu sunar.
  `node araclar/test/sahte.js <depo klasörü> 8766` → `http://localhost:8766/#k=x`
- `arama_dene.py`: Playwright ile (390 × 800, `/usr/bin/google-chrome`) Ekle penceresinde örnek aramalar yapar, ekran görüntüsü alır.
- `yakala.py <port> <klasör> [koyu]`: 26 ekran durumunu gezer; her öğenin hesaplanan stilini (`stil.json`) ve ekran görüntüsünü kaydeder (saat sabit 19 Kasım 13:20).
- `fark.py önce/stil.json sonra/stil.json`: iki `yakala.py` çıktısını karşılaştırır (CSS değişikliği görünümü bozdu mu?).
- `ayar_test.py <port> <klasör>`: 1.7 Ayarlar, Mutfak, sıfırlama ve tarif akışlarını uçtan uca dener; tabloya yazılanları `/_tablo` ile kontrol eder. Her çalıştırmadan önce sunucuyu yeniden başlat (sonunda her şeyi sıfırlar).
- `agri_test.py <port> <klasör> [koyu]` (1.8): liste düzenindeki ağrı notu (sıradaki satır soluk, türe göre bölge, bölgeye göre taraf, "Diğer…" ile yeni bölge) ve yeni ev yemeklerini dener.
- `telefon_kontrol.py <port> <klasör> [koyu]` (1.8.1): **Tamer'e her sunuştan önce zorunlu.** Uygulamayı telefon gibi açar (dokunmatik, 412 × 915 ve 360 × 780), bütün ekranları ve pencereleri gezer (38 durum × 2 genişlik). Tamer'in yakaladığı hata türlerini kuralla arar:
  1. Gölge kesilmesi (saydam bir kutu kartın gölgesini kırpıyor)
  2. Yazı kesilmesi ("…" olmadan taşan yazı)
  3. Uzun açıklama yazısı (⚠, "commit mesajı gibi" kuralı)
  4. Sayfanın yana taşması
  5. Kaydırınca başlık/arama kayboluyor (sabit başlık kuralı)
  6. Yazı kutusuna dokununca liste kayıyor ya da kutu klavyenin altında kalıyor (klavye: ekran %55'e iner)
  7. Açılır grupta başlık dokunulan yerden kaçıyor
  8. Sayfa (JS) hatası
  9. (1.10.3) En alta kaydırınca son alan sabit alt çubuğun arkasında kalıyor
  10. (1.10.3) Klavye açıkken alt menü görünüyor
  11. (1.11) En alta kaydırınca Ekle listesinin son satırı sabit öğün çubuğunun arkasında kalıyor

  Çıktı: `rapor.txt`, her durumun görüntüsü, `kolaj-412.jpg` / `kolaj-360.jpg`. Hata varsa çıkış kodu 1.
  Sonra görüntüler **Evidence Collector** rolünde (agency-agents `testing/testing-evidence-collector.md`) gözle incelenir: kuralın yakalayamadığı görünüm hataları (hizasızlık, üst üste binen yazı, yanlış renk) için. Bu iki adım geçmeden Tamer'e ekran görüntüsü sunulmaz.
  Yeni bir hata türü bulunursa önce bu betiğe kural olarak eklenir, sonra düzeltilir.
- `surum1103_test.py <port> <klasör>` (1.10.3, `ORNEK_ANT=1` ile): yarım porsiyon, aşağı çekip kapatma, + düğmesi, klavyede alt menü, fazladan set, kısa ad, kaldığın yerden devam, sw.js önbelleği, İlerleme iskeleti, açılış süresi.
  ⚠ Testler saati sabitler (`clock.set_fixed_time`): Date.now() ve performance.now() akmaz. Süre ölçen kodda bunu hesaba kat (dokunma hızı için `e.timeStamp`).
- `surum1105_test.py <port>` (1.10.5, `ORNEK_ANT=1` ile; tarayıcısız): Google önbelleği — ikinci okuma önbellekten ve aynı, yazınca ve tablo elle değişince geçersizleşir, İlerleme de önbellekli, Ayarlar › Veri bilgisi önbelleksiz. `sahte.js` CacheService, Drive son değişme zamanı ve gzip'i taklit eder; `ONBELLEK=0` ile önbelleksiz çalışır; `/_onbellek` isabet sayısını verir.
- `surum111_test.py <port> <klasör>` (1.11, örneksiz sunucuyla; her çalıştırmadan önce yeniden başlat): Ekle ekranları — dokununca hemen öğüne yazma, "Kahvaltıda" bölümü, öğün çubuğu (boşken "Öğle · boş / 0 kcal · 0 g"), ölçü değişimi, art arda +'ların birleşmesi (≤ 2 istek), çubukta Geri al, Tamam, "Dünkü kahvaltıyı ekle" + Geri al, sola çekme (yavaş: Sil/Kaldır düğmesi, hızlı: hemen) Bugün'de, Ekle listesinde ve tarif malzemesinde; balonda × ve itip kapatma, Ayarlar › Geri al balonu (3/5/8 sn). 41 kontrol.
- `surum1112_test.py <port> <klasör>` (1.11.2, örneksiz sunucuyla; her çalıştırmadan önce yeniden başlat): çay/kahvenin şekeri ayrı kayıt ama `Bağlı` sütunuyla içeceğe bağlı — her içeceğin kendi şekeri, Bugün'de içeceğin altında, içecekle silinir/Geri al ile yeniden bağlanır, öğün değişince taşınır, düzenleme ekranında Şeker bölümü, Dünkü ekle bağı korur. 15 kontrol.
