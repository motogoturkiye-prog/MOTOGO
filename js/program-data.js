// ============================================================================
// MotoGo Kokpit — Yayın Çizelgesi
// ============================================================================
// Bu dosya, kokpit ekranındaki "şimdi yayında / sıradaki" mantığını besler.
// Her program bir hafta içinde tekrar eden bir zaman dilimine sahiptir.
//
// Alanlar:
//   id         : benzersiz kısa kod (örn. "gece-suruz-01")
//   title      : ekranda görünecek başlık
//   category   : "garaj" | "reels" | "devami"  (yol yardım ayrı, sabit bir bağlantı)
//   youtubeId  : YouTube video ID'si (linkin /watch?v= kısmından sonrası,
//                Shorts linkleri de aynı ID'yi kullanır: youtube.com/shorts/BU_KISIM)
//   day        : 0=Pazar, 1=Pazartesi, 2=Salı, 3=Çarşamba, 4=Perşembe, 5=Cuma, 6=Cumartesi
//   hour, minute: başlangıç saati (24 saat formatı, ziyaretçinin kendi saatine göre)
//   durationMin: programın kaç dakika süreceği (bittiğinde sıradakine geçilir)
//
// Yeni bölüm eklemek için aşağıdaki örnek bloğu kopyala, YouTube ID'sini ve
// zamanını gir. Sıra önemli değil, sistem otomatik en yakın olanı bulur.

const PROGRAMS = [
  // ÖRNEK — gerçek videolarınla değiştir / çoğalt:
  // {
  //   id: "gece-suruz-01",
  //   title: "Gece Sürüşü",
  //   category: "garaj",
  //   youtubeId: "VIDEO_ID_BURAYA",
  //   day: 0,        // Pazar
  //   hour: 22,
  //   minute: 40,
  //   durationMin: 18
  // },
];

// Kategori bilgisi (yol boyunca şeridindeki sıra ve etiketler)
const CATEGORIES = [
  { id: "yardim", label: "Yol Yardım", href: "yardim/index.html", external: true },
  { id: "garaj",  label: "Garaj",      external: false },
  { id: "reels",  label: "Reels",      external: false },
  { id: "devami", label: "Devamı",     external: false },
];
