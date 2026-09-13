# MotoGo Kokpit — Ana Sayfa + Yol Yardım

## Yapı

- **`index.html`** (kök) → kokpit ana ekranı. Sol üstteki logo artık
  https://www.motogo.tr/category/all-products (Store) adresine gidiyor.
- **`yardim/`** → Yol Yardım sitesi, değişmedi. Sağ üstteki nabız atan
  "YARDIM" rozetine basınca buraya gelinir.
- **`js/youtube-config.js`** → BURAYA senin YouTube API anahtarını
  yapıştırman gerekiyor (dosyanın içinde tam adım adım anlatım var).
  Kanal ID'n zaten bulunup dosyaya işlendi, ona dokunmana gerek yok.
- **`js/kokpit.js`** → API anahtarını kullanıp kanalındaki en son videoları
  otomatik çeker, en yeniden en eskiye sıralar, "Yol Boyunca" şeridinde
  gösterir. Elle video eklemene GEREK YOK artık — kanala yeni video
  yükledikçe site otomatik güncellenir.

## Şu an tek eksik: YouTube API anahtarı

Anahtar girilmeden site "YouTube bağlantısı bekleniyor" yazan boş bir
ekran gösterir (bu normal, hata değil). `js/youtube-config.js` dosyasının
içindeki adımları takip edip ücretsiz bir anahtar al, dosyaya yapıştır,
GitHub'a yükle — o an videolar otomatik akmaya başlar.

## Yükleme

Yine aynı yöntem: repo'yu boşalt, bu klasördeki her şeyi tek seferde
tekrar yükle.
