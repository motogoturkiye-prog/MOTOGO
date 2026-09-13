# MotoGo Kokpit — Ana Sayfa + Yol Yardım

## Yapı

- **`index.html`** (kök) → YENİ kokpit ana ekranı. Artık ziyaretçi siteye girince
  ilk bunu görüyor.
- **`yardim/`** → eski Yol Yardım sitesi, hiçbir şey değişmeden buraya taşındı.
  Duran Motor, Bayhas Motors, tüm mantık aynen çalışıyor. Kokpit'teki sağ üst
  köşedeki nabız atan "YARDIM" rozetine basınca buraya gelinir.
- **`js/program-data.js`** → yayın çizelgesi. Firma eklerkenki mantığın birebir
  aynısı: yeni bir bölüm eklemek istediğinde bu dosyadaki `PROGRAMS` listesine
  bir blok eklersin (örnek blok dosyanın içinde, yorum satırı olarak duruyor).
- **`js/kokpit.js`** → çizelgeye bakıp "şimdi ne oynamalı"yı otomatik hesaplayan
  motor. Videoya tıklayınca YouTube videosunu bir pencerede (modal) açar.
- **`css/kokpit.css`** → kokpit ekranının görünümü.

## Şu an ne eksik (bilerek boş bıraktım)

1. **Gerçek videolar** — `js/program-data.js` içindeki `PROGRAMS` listesi şu an
   BOŞ (sadece örnek/yorum satırı var). Bana bir video YouTube ID'si + hangi
   gün/saat oynayacağını söylersin, ben ekleyip dosyayı sana veririm.
2. **MotoGo Store linki** — `index.html` içinde sol üstteki logo şu an hiçbir
   yere gitmiyor (`href="#"`). Store sayfasının linkini verdiğinde tek satır
   değişecek.
3. **Sahte/uydurma "izleyici sayısı" YOK** — bilerek eklemedim. Gerçek olmayan
   bir sayıyı ("318 izleyici" gibi) göstermek ziyaretçiyi yanıltır. İstersen
   ileride gerçek bir sayaç (örn. YouTube'un kendi canlı izleyici verisi)
   bağlarız, ama uydurma bir rakamla başlamak istemedim.

## Yükleme

Önceki gibi: bu klasördeki her şeyi GitHub'daki repo'ya (üzerine yazarak)
yükle. `yardim/` klasörü yeni, ilk seferinde onu da eklemen gerekiyor.
