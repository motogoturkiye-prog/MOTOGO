// ============================================================================
// FİRMA LİSTESİ — bu dosyayı düzenleyerek üye firma ekler/çıkarır/güncellersin.
// Giriş ekranı, veritabanı, şifre YOK — sadece bu dosyayı değiştirip
// Netlify'a yeniden yüklüyorsun (sürükle-bırak), site anında güncellenir.
// ============================================================================

// Kategoriler — istersen isim/emoji değiştirebilirsin.
const CATEGORIES = [
  { id: "cekici",      label: "Çekici / Transfer", sub: "Motor çalışmıyor / kaza", icon: "🚛" },
  { id: "lastik",      label: "Lastik",      sub: "Patlak / hava kaybı",     icon: "🛞" },
  { id: "aku_mars",    label: "Akü / Marş",  sub: "Çalışmıyor, kontak yok",  icon: "🔋" },
  { id: "genel_ariza", label: "Genel Arıza", sub: "Diğer teknik sorun",      icon: "🔧" }
];

// Üye firmalar — her firma bir { ... } bloğu. Yeni firma eklemek için
// aşağıdaki bloklardan birini kopyala, virgülle ayırıp altına yapıştır,
// bilgileri kendi firmanla değiştir.
//
// Alanlar:
//   name       : Firma adı
//   region     : Bölge / hat bilgisi
//   phone      : "Ara" butonu için telefon, örn: "+905551234567"
//   whatsapp   : WhatsApp numarası, ülke koduyla, boşluksuz, başında + YOK
//                örn: "905551234567"
//   lat, lng   : Google Haritalar'da firmaya sağ tıkla, üstteki koordinatlara
//                tıkla (kopyalanır), ilk sayı lat, ikinci sayı lng.
//                Bilmiyorsan null bırak, firma listede en sonda görünür.
//   status     : "acik" | "mesai_disi" | "kapali"
//   active     : true  → sitede görünsün,  false → sitede gizle (silmeden kaldır)
//   categories : yukarıdaki CATEGORIES id'lerinden (birden fazla olabilir)
//   website    : (opsiyonel) firmanın web sitesi, örn: "https://ornek.com"

const FIRMS = [
  {
    name: "Duran Motor",
    region: "Etimesgut, Ankara · Tüm Marka & BMW Özel Servis · SYM Yetkili Bayi",
    phone: "+905433551273",
    whatsapp: "905433551273",
    lat: 39.948151,
    lng: 32.645496,
    status: "acik",
    active: true,
    categories: ["aku_mars", "genel_ariza"],
    website: "https://duranmotor.com"
  },
  {
    name: "Bayhas Motors",
    region: "Yenimahalle, Ankara · CF Moto Yetkili Servis",
    phone: "+905076045923",
    whatsapp: "905076045923",
    lat: 39.988424,
    lng: 32.663031,
    status: "acik",
    active: true,
    categories: ["aku_mars", "genel_ariza"],
    website: "https://www.bayhasmotors.com.tr"
  },

  // ÖRNEK — kendi firmalarını eklerken bu bloğu kopyala/çoğalt, gerekirse sil:
  // {
  //   name: "Anadolu Moto Çekici",
  //   region: "Ankara / Kızılcahamam hattı",
  //   phone: "+905551234567",
  //   whatsapp: "905551234567",
  //   lat: 40.1234,
  //   lng: 32.6789,
  //   status: "acik",
  //   active: true,
  //   categories: ["cekici", "genel_ariza"]
  // },
];
