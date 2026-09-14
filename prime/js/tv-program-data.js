// ============================================================================
// MotoGo Prime — Oynatma Listesi (Playlist)
// ============================================================================
// Buradaki videolar SIRAYLA otomatik oynar. Bir video bitince otomatik
// olarak bir sonrakine geçer, en sona gelince başa döner (döngü).
//
// Yeni video eklemek için aşağıya yeni bir satır ekle — sırası,
// listede yazdığın sıradır.

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
