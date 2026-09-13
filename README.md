# MotoGo Yol Yardım — Basit Sürüm (giriş ekranı / veritabanı YOK)

## Ne değişti?

Önceki sürümde Firebase ile bir "Yönetim Paneli" (giriş ekranı + firma
ekleme formu) vardı. Bu, gereksiz bir karmaşıklık ve kurulum yükü
getiriyordu. Şimdi tamamen kaldırıldı.

Artık sistem şöyle çalışıyor:

- **`index.html`** → tek ve gerçek site. Ziyaretçi girince doğrudan arıza
  türü seçme ekranını görür, hiçbir login yok.
- **`js/firms-data.js`** → üye firmaların listesi burada, düz bir liste
  olarak duruyor. Firma eklemek/çıkarmak/güncellemek istediğinde:
  - Bu dosyayı bana gönderip "şu firmayı ekle/güncelle" diyebilirsin,
    ben düzenleyip sana yeniden veririm, ya da
  - Dosyanın içindeki örnek bloğu kopyalayıp kendin de elle
    düzenleyebilirsin (bilgisayarda herhangi bir metin düzenleyiciyle).
- **`js/app.js`** → sitenin mantığı (kategori seçimi, en yakın firmayı
  bulma, WhatsApp linki açma) — Firebase yok, hepsi `firms-data.js`
  içindeki listeden çalışıyor.
- `css/style.css` → görsel stil, değişmedi.

## Yayına alma

1. Netlify hesabına gir → sitenin "Deploys" ekranına git.
2. Bu klasördeki **her şeyi** (index.html, css/, js/) sürükle-bırak ile
   yükle (eski deploy'un yerini alır).
3. Site birkaç saniyede güncellenir. Ana adres artık doğrudan siteyi
   gösterir, giriş ekranı falan çıkmaz.

## Firma eklemek istediğinde

`js/firms-data.js` dosyasını aç, `FIRMS` listesinin içine şu şekilde bir
blok ekle (birden fazla firma varsa aralarına virgül koyarak alt alta
ekleyebilirsin):

```js
{
  name: "Anadolu Moto Çekici",
  region: "Ankara / Kızılcahamam hattı",
  phone: "+905551234567",
  whatsapp: "905551234567",
  lat: 40.1234,
  lng: 32.6789,
  status: "acik",
  active: true,
  categories: ["cekici", "genel_ariza"]
},
```

Sonra dosyayı kaydedip Netlify'a tekrar sürükle-bırak yapman yeterli.
(Bana da gönderirsen ben ekleyip hazır dosyayı sana geri veririm.)
