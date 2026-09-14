// ============================================================================
// MotoGo TV — Yayın Çizelgesi
// ============================================================================
// Her bölüm, hafta içinde tekrar eden bir zaman dilimine sahiptir.
// Sistem ziyaretçinin kendi saatine bakıp "şimdi ne oynamalı"yı
// otomatik hesaplar — sen sadece aşağıdaki listeye bölüm eklersin.
//
// Alanlar:
//   title      : ekranda görünecek başlık
//   youtubeId  : YouTube video ID'si (linkin /watch?v= kısmından sonrası)
//   day        : 0=Pazar, 1=Pazartesi, 2=Salı, 3=Çarşamba, 4=Perşembe, 5=Cuma, 6=Cumartesi
//   hour, minute: başlangıç saati (24 saat formatı)
//   durationMin: bölümün kaç dakika süreceği
//
// Yeni bölüm eklemek için örnek bloğu kopyala/çoğalt, gerçek bilgilerle
// doldur. Sıra önemli değil, sistem otomatik en yakın olanı bulur.

const TV_PROGRAMS = [
  // ÖRNEK — gerçek videonla değiştir:
  // {
  //   title: "Gece Sürüşü",
  //   youtubeId: "VIDEO_ID_BURAYA",
  //   day: 0,        // Pazar
  //   hour: 22,
  //   minute: 40,
  //   durationMin: 18
  // },
];
