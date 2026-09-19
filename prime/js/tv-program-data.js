// ============================================================================
// MotoGo Prime — Yayın Verisi
// ============================================================================

// 1) NORMAL AKIŞ — sırayla otomatik oynar, biri bitince otomatik sıradakine
//    geçer, en sona gelince başa döner. Süre önemli değil, sistem otomatik
//    devam eder. Yeni video eklemek için aşağıya bir satır daha ekle.
const TV_PROGRAMS = [
  { title: "MotoGo Prime Sunar.. İleri Sürüşün Standartları..", youtubeId: "0hjy2AkI8Fw" },
  { title: "Şehir İçi İçin ADV Alınır mı?", youtubeId: "KFERd5JfYSE" },
  { title: "Motorcu Rotaları / Yol Hikayeleri", youtubeId: "krvZ6AowbhI" },
  { title: "Motosiklette Dikkat Hayat Kurtarır!", youtubeId: "C8I4odsI7r0" },
  { title: "MotoGo Prime Başlıyor!", youtubeId: "6CBadda6rtc" },
  { title: "İleri ve Güvenli Sürüş // Ankara Enduro Motosiklet Kulübünün Katkılarıyla", youtubeId: "gKIIRHsk6f4" },
  { title: "Motosiklet Ehliyetinizi Aldınız mı?", youtubeId: "enVonxtu6uc" },
  { title: "Yaprak Döner Yenimahalle Şubesinden MotoGo Üyelerine İndirimler Başladı..!", youtubeId: "P545bpMAUzg" },
  { title: "Motosiklet Ehliyeti Nasıl Alınır?", youtubeId: "77YQi8DblE4" },
  { title: "MotoGo İle Bayhas Motors Ankara'dayız!", youtubeId: "XvLjnMTNzRs" },

  // Yeni video eklerken bu formatta ekle:
  // { title: "Video Başlığı", youtubeId: "VIDEO_ID_BURAYA" },
];

// 2) ÖZEL YAYINLAR — gerçek gün/saate bağlı. O saat gelince normal akışı
//    KESER, bu videoyu oynatır, "🔴 CANLI" gösterir. Süre bitince otomatik
//    olarak normal akışa geri döner. Saat gelmeden bu program OYNATILMAZ,
//    sadece "Yakında" olarak bilgi amaçlı görünür.
//
//   day        : 0=Pazar, 1=Pazartesi, 2=Salı, 3=Çarşamba, 4=Perşembe, 5=Cuma, 6=Cumartesi
//   hour, minute: başlangıç saati (24 saat formatı, ziyaretçinin kendi saatine göre)
//   durationMin: yayının kaç dakika süreceği (bu süre sonunda normale döner)
const SPECIAL_PROGRAMS = [
  // ÖRNEK — gerçek bir özel yayın planladığında bu bloğu doldur:
  // {
  //   title: "Pazar Akşamı Özel Yayın",
  //   youtubeId: "VIDEO_ID_BURAYA",
  //   day: 0,        // Pazar
  //   hour: 20,
  //   minute: 30,
  //   durationMin: 25
  // },
];
