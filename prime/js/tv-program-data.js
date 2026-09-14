// ============================================================================
// MotoGo Prime — Oynatma Listesi (Playlist)
// ============================================================================
// Buradaki videolar SIRAYLA otomatik oynar. Bir video bitince otomatik
// olarak bir sonrakine geçer, en sona gelince başa döner (döngü).
//
// Yeni video eklemek için aşağıya yeni bir satır ekle — sırası,
// listede yazdığın sıradır.

const TV_PROGRAMS = [
  { title: "MotoGo TV", youtubeId: "KFERd5JfYSE" },
  { title: "MotoGo Video 2", youtubeId: "krvZ6AowbhI" },
  { title: "MotoGo Video 3", youtubeId: "C8I4odsI7r0" },
  { title: "MotoGo Video 4", youtubeId: "gKIIRHsk6f4" },
  { title: "MotoGo Video 5", youtubeId: "P545bpMAUzg" },
  { title: "MotoGo Video 6", youtubeId: "enVonxtu6uc" },
  { title: "MotoGo Video 7", youtubeId: "77YQi8DblE4" },
  { title: "MotoGo Video 8", youtubeId: "XvLjnMTNzRs" },

  // Yeni video eklerken bu formatta ekle:
  // { title: "Video Başlığı", youtubeId: "VIDEO_ID_BURAYA" },
];
