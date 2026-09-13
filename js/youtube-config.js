// ============================================================================
// MotoGo Kokpit — YouTube Bağlantı Ayarları
// ============================================================================
// Videolar artık elle bir listeye eklenmiyor — kanaldaki en son yüklenen
// videoları OTOMATİK çekiyoruz. Bunun çalışması için ücretsiz bir "API
// anahtarı" gerekiyor (Google hesabınla, kredi kartı istemeden alınır).
//
// ANAHTARI NASIL ALIRSIN (tek seferlik, ~5 dakika):
// 1. https://console.cloud.google.com adresine gir, ücretsiz yeni bir proje aç.
// 2. Sol menü > "APIs & Services" > "Library" > ara: "YouTube Data API v3" > Enable.
// 3. Sol menü > "APIs & Services" > "Credentials" > "Create Credentials"
//    > "API key". Oluşan anahtarı kopyala, aşağıya yapıştır.
// 4. (Güvenlik için önerilir) Az önce oluşturduğun anahtara tıkla,
//    "Application restrictions" > "Websites" seç, şu adresi ekle:
//    motogoturkiye-prog.github.io/*
//    Bu, anahtarını sadece senin sitenin kullanabilmesini sağlar.
//
// Anahtarı aldıktan sonra aşağıdaki "BURAYA_API_ANAHTARI" yazan yeri
// değiştir, dosyayı kaydet, GitHub'a yükle. Başka hiçbir şeye dokunma.

const YOUTUBE_API_KEY = "BURAYA_API_ANAHTARI";

// Kanal ID'si zaten senin için bulundu, dokunmana gerek yok:
const YOUTUBE_CHANNEL_ID = "UCvuOPijhOtmnLTtGM7HLcIw";
// Kanalın "yüklemeler" listesi (uploads playlist) — YouTube'da her kanalın
// otomatik oluşan, "UC" yerine "UU" ile başlayan bir listesi vardır:
const YOUTUBE_UPLOADS_PLAYLIST = "UU" + YOUTUBE_CHANNEL_ID.slice(2);

// Kaç video gösterilsin (en yeniden en eskiye doğru)
const YOUTUBE_MAX_RESULTS = 12;

// "Shorts" sayılması için üst sınır (saniye). YouTube API bir videonun
// "Shorts" olup olmadığını doğrudan söylemiyor, süresine bakarak tahmin
// ediyoruz. Kanalın Shorts'ları genelde 60 saniyenin altında olur.
const SHORTS_MAX_DURATION_SEC = 180;
