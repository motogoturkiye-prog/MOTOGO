// ============================================================================
// MotoGo — Marka Arama Motoru (tek sayfa, hiçbir yere zıplamadan)
// ============================================================================

// Supabase'den canlı veri çekme — sayfa yüklenir yüklenmez arka planda başlar
let ROTALAR = [];
let GUVENLIK_IPUCLARI = [];
let ETKINLIKLER = [];

(async function loadMotoGoData(){
  if (!window.motogoSupabase) return;
  const sb = window.motogoSupabase;

  try {
    const [
      { data: firmalar },
      { data: kiralik },
      { data: ekspertiz },
      { data: avantaj },
      { data: yardim },
      { data: kilavuz },
      { data: rotalar },
      { data: ipuclari },
      { data: etkinlikler }
    ] = await Promise.all([
      sb.from('firmalar').select('*'),
      sb.from('kiralik_firmalar').select('*'),
      sb.from('ekspertiz_firmalari').select('*'),
      sb.from('avantaj_kampanyalar').select('*'),
      sb.from('yardim_firmalari').select('*'),
      sb.from('motor_kilavuzu').select('*'),
      sb.from('rotalar').select('*'),
      sb.from('guvenlik_ipuclari').select('*'),
      sb.from('etkinlikler').select('*')
    ]);

    if (firmalar) {
      const grouped = {};
      firmalar.forEach(r => {
        const key = `${r.marka}_${r.kategori}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          name: r.ad, whatsapp: r.whatsapp, phone: r.telefon,
          city: r.sehir, district: r.ilce, instagram: r.instagram,
          website: r.website, description: r.aciklama, photo: r.foto_url, siraNo: r.sira_no, address: r.adres
        });
      });
      BRAND_FIRMS = grouped;
    }

    if (kiralik) {
      KIRALIK_FIRMS = kiralik.map(r => ({
        name: r.ad, city: r.sehir, district: r.ilce, whatsapp: r.whatsapp,
        phone: r.telefon, instagram: r.instagram, description: r.aciklama, photo: r.foto_url, siraNo: r.sira_no, address: r.adres
      }));
    }

    if (ekspertiz) {
      EKSPERTIZ_FIRMS = ekspertiz.map(r => ({
        name: r.ad, city: r.sehir, district: r.ilce, whatsapp: r.whatsapp,
        phone: r.telefon, instagram: r.instagram, description: r.aciklama, photo: r.foto_url, siraNo: r.sira_no, address: r.adres
      }));
    }

    if (avantaj) {
      AVANTAJ_FIRMS = avantaj.map(r => ({
        name: r.firma_adi, category: r.kategori, city: r.sehir, badge: r.rozet,
        title: r.baslik, description: r.aciklama, bonus: r.odul,
        whatsapp: r.whatsapp, phone: r.telefon, photo: r.foto_url, siraNo: r.sira_no, address: r.adres
      }));
    }

    if (yardim) {
      YARDIM_FIRMS = yardim.map(r => ({
        name: r.ad, region: r.bolge_metni, city: r.sehir,
        phone: r.telefon, whatsapp: r.whatsapp, lat: r.lat, lng: r.lng,
        categories: r.kategoriler || [], website: r.website, instagram: r.instagram, photo: r.foto_url, siraNo: r.sira_no, address: r.adres
      }));
    }

    if (kilavuz) {
      kilavuz.forEach(r => {
        const brand = BRANDS.find(b => b.key === r.marka);
        if (brand) brand.info = r.bilgi;
      });
    }

    if (rotalar) {
      ROTALAR = rotalar.map(r => ({ ad: r.ad, bolge: r.bolge, not_: r.not_metni, q: r.arama_terimi }));
    }

    if (ipuclari) {
      GUVENLIK_IPUCLARI = ipuclari.map(r => r.ipucu);
    }

    if (etkinlikler) {
      ETKINLIKLER = etkinlikler.map(r => ({
        ad: r.ad, aciklama: r.aciklama, konum: r.konum, tarih: r.tarih_metni
      }));
    }
  } catch (e) {
    console.warn('MotoGo verisi yüklenemedi, site boş veriyle çalışıyor:', e);
  }
  motogoDataLoaded = true;
  // Veri geç geldiyse ve kullanıcı zaten bir kategori seçtiyse, şehir listesini tazele
  if (typeof refreshCityOptionsForSelection === 'function') {
    refreshCityOptionsForSelection();
  }
})();

const brandInput = document.getElementById('brandInput');
const blinkCursor = document.getElementById('blinkCursor');
const brandSuggestions = document.getElementById('brandSuggestions');
const brandInfoBox = document.getElementById('brandInfoBox');
const brandInfoToggle = document.getElementById('brandInfoToggle');
const brandInfoLabel = document.getElementById('brandInfoLabel');
const brandInfoText = document.getElementById('brandInfoText');
brandInfoToggle.addEventListener('click', () => brandInfoBox.classList.toggle('open'));
const subcatGrid = document.getElementById('subcatGrid');
const cityField = document.getElementById('cityField');
const citySelect = document.getElementById('citySelect');
const showResultsBtn = document.getElementById('showResultsBtn');
const resultsSection = document.getElementById('results');
const resultsList = document.getElementById('resultsList');
const yardimCatGrid = document.getElementById('yardimCatGrid');

let currentBrand = null;
let currentSubcat = null;
let motogoDataLoaded = false;
let userCoords = null;

// Şehir seçiciyi, verilen firma listesindeki gerçek şehirlerle doldurur
function populateCitySelect(firmList) {
  const cities = [...new Set(firmList.map(f => f.city || f.sehir).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'tr'));
  citySelect.innerHTML = '<option value="">Şehrinizi seçin</option>';
  cities.forEach(c => {
    const opt = document.createElement('option');
    opt.textContent = c;
    citySelect.appendChild(opt);
  });
  return cities.length;
}
citySelect.innerHTML = '<option value="">Şehrinizi seçin</option>';

// ---------------------------------------------------------------------------
// Kategori satırı — Servis / Bayi / Yedek Parça / Aksesuar / Kiralık Motor /
// Yol Yardım — hepsi tek satırda; Yol Yardım'a basınca altına Çekici/Lastik/
// Akü-Marş/Genel Arıza açılır (sayfa zıplamadan, doğal akışla)
// ---------------------------------------------------------------------------
renderSubcatGrid();
function renderSubcatGrid() {
  subcatGrid.innerHTML = "";

  function buildSubcatChip(sc) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'subcat-chip' + (currentSubcat && !currentSubcat.isYardim && currentSubcat.key === sc.key ? ' subcat-chip-active' : '');
    btn.textContent = sc.label;
    btn.addEventListener('click', () => {
      currentSubcat = sc;
      renderSubcatGrid();
      renderYardimCategories();
      cityField.style.display = 'block';
      showResultsBtn.style.display = 'block';
      showResultsBtn.textContent = 'Uygun Firmaları Göster';
      resultsSection.style.display = 'none';
      refreshCityOptionsForSelection();
    });
    return btn;
  }

  SUBCATS.forEach(sc => subcatGrid.appendChild(buildSubcatChip(sc)));
  renderYardimCategories();
}

function renderYardimCategories() {
  yardimCatGrid.innerHTML = '';
  YARDIM_CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'subcat-chip' + (currentSubcat && currentSubcat.isYardim && currentSubcat.key === cat.id ? ' subcat-chip-active' : '');
    btn.textContent = `${cat.icon} ${cat.label}`;
    btn.addEventListener('click', () => {
      currentSubcat = { key: cat.id, label: cat.label, isYardim: true };
      renderSubcatGrid();
      cityField.style.display = 'block';
      showResultsBtn.style.display = 'block';
      showResultsBtn.textContent = 'Uygun Firmaları Göster';
      resultsSection.style.display = 'none';
      filterResetBtn.style.display = 'block';
      refreshCityOptionsForSelection();
    });
    yardimCatGrid.appendChild(btn);
  });
}

// ---------------------------------------------------------------------------
// İmleç konumu — yazının bittiği yere göre hesaplanır
// ---------------------------------------------------------------------------
function measureTextWidth(text, inputEl) {
  const canvas = measureTextWidth._c || (measureTextWidth._c = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  const style = getComputedStyle(inputEl);
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  return ctx.measureText(text).width;
}
function updateCursorPosition() {
  blinkCursor.style.left = measureTextWidth(brandInput.value, brandInput) + 'px';
}
updateCursorPosition();
blinkCursor.classList.add('show');

// ---------------------------------------------------------------------------
// Marka arama
// ---------------------------------------------------------------------------
brandInput.addEventListener('input', () => {
  currentBrand = null;
  brandInfoLabel.textContent = "Motor Kılavuzu";
  brandInfoText.textContent = "";
  brandInput.classList.remove('brand-selected');
  filterResetBtn.style.display = 'none';
  updateCursorPosition();
  const q = brandInput.value.trim().toLocaleLowerCase('tr');
  brandSuggestions.innerHTML = "";

  if (!q) {
    brandSuggestions.style.display = 'none';
    resultsSection.style.display = 'none';
    resultsList.innerHTML = '';
    return;
  }

  const matches = BRANDS.filter(b => b.name.toLocaleLowerCase('tr').includes(q)).slice(0, 8);
  if (matches.length === 0) {
    brandSuggestions.innerHTML = `<div class="suggestion-empty">Bu markayı bulamadık — yakında eklenebilir.</div>`;
    brandSuggestions.style.display = 'block';
    return;
  }
  matches.forEach(b => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.textContent = b.name;
    item.addEventListener('click', () => selectBrand(b));
    brandSuggestions.appendChild(item);
  });
  brandSuggestions.style.display = 'block';
});

function refreshCityOptionsForSelection() {
  if (!currentSubcat) return;
  if (!motogoDataLoaded) {
    citySelect.innerHTML = '<option value="">Şehirler yükleniyor...</option>';
    return;
  }
  let source = [];
  if (currentSubcat.isYardim) {
    source = YARDIM_FIRMS.filter(f => (f.categories || []).includes(currentSubcat.key));
  } else if (currentSubcat.key === 'kiralik') {
    source = KIRALIK_FIRMS;
  } else if (currentSubcat.key === 'ekspertiz') {
    source = EKSPERTIZ_FIRMS;
  } else if (currentSubcat.key === 'avantaj') {
    source = AVANTAJ_FIRMS;
  } else if (currentBrand) {
    const key = `${currentBrand.key}_${currentSubcat.key}`;
    source = BRAND_FIRMS[key] || [];
  } else {
    // Marka henüz seçilmemiş: bu kategoride herhangi bir markada veri olan tüm şehirler
    Object.keys(BRAND_FIRMS).forEach(k => {
      if (k.endsWith('_' + currentSubcat.key)) source = source.concat(BRAND_FIRMS[k]);
    });
  }
  populateCitySelect(source);
}

function selectBrand(brand) {
  currentBrand = brand;
  brandInput.value = brand.name;
  brandInput.classList.add('brand-selected');
  updateCursorPosition();
  brandSuggestions.innerHTML = "";
  brandSuggestions.style.display = 'none';
  filterResetBtn.style.display = 'block';

  brandInfoLabel.textContent = `${brand.name} hakkında bilgi`;
  brandInfoText.textContent = brand.info && brand.info.trim()
    ? brand.info
    : "Bu marka hakkında bilgi yakında eklenecek.";
  refreshCityOptionsForSelection();
}

const filterResetBtn = document.getElementById('filterResetBtn');
filterResetBtn.addEventListener('click', () => {
  brandInput.value = "";
  brandInput.classList.remove('brand-selected');
  currentBrand = null;
  currentSubcat = null;
  brandInfoLabel.textContent = "Motor Kılavuzu";
  brandInfoText.textContent = "";
  brandSuggestions.innerHTML = "";
  brandSuggestions.style.display = 'none';
  resultsSection.style.display = 'none';
  citySelect.value = "";
  filterResetBtn.style.display = 'none';
  showResultsBtn.textContent = 'Uygun Firmaları Göster';
  updateCursorPosition();
  renderSubcatGrid();
});

// ---------------------------------------------------------------------------
// Sonuçları göster (Servis / Bayi / Yedek Parça / Aksesuar)
// ---------------------------------------------------------------------------
function sortBySira(a, b) {
  const sa = a.siraNo != null ? a.siraNo : 9999;
  const sb = b.siraNo != null ? b.siraNo : 9999;
  if (sa !== sb) return sa - sb;
  return a.name.localeCompare(b.name, 'tr');
}

// Tüm kartlarda kullanılan ortak ikon buton satırı (WhatsApp / Ara / Konum)
// Tüm kartlarda kullanılan tek, ortak kart oluşturucu
function buildFirmCard(firm, opts) {
  const hasPhoto = !!firm.photo;
  const hasSocial = opts.socialLinks != null;
  const card = document.createElement('div');
  card.className = hasPhoto ? 'firm-card firm-card-photo' : 'firm-card';

  const actionRow = buildActionRow(firm, opts.waMsg);
  const bottomRow = `
    <div class="firm-bottom-row">
      ${hasSocial ? `<button type="button" class="incele-btn">İncele</button>` : '<span></span>'}
      ${actionRow}
    </div>
    ${hasSocial ? `<div class="firm-social-panel"><div class="firm-social-icons">${opts.socialLinks}</div></div>` : ''}
  `;

  const infoText = `
    <div class="firm-info-head">
      <div>
        <p class="firm-name">${opts.nameLine}</p>
        ${opts.metaLine ? `<p class="firm-meta">${opts.metaLine}</p>` : ''}
      </div>
      ${opts.badge || ''}
    </div>
    ${opts.extraContent || ''}
    ${opts.description ? `<p class="firm-desc">${opts.description}</p>` : ''}
  `;

  if (hasPhoto) {
    card.innerHTML = `
      <div class="firm-card-top">
        <img class="firm-thumb-sq photo-click" src="${firm.photo}" alt="${firm.name}">
        <div class="firm-info-text">${infoText}</div>
      </div>
      ${bottomRow}
    `;
  } else {
    card.innerHTML = `
      <div class="firm-info">
        ${infoText}
        ${bottomRow}
      </div>
    `;
  }

  if (hasSocial) {
    card.querySelector('.incele-btn').addEventListener('click', () => {
      card.querySelector('.firm-social-panel').classList.toggle('open');
    });
  }
  if (hasPhoto) {
    card.querySelector('.photo-click').addEventListener('click', () => openPhotoLightbox(firm.photo));
  }
  return card;
}

function buildActionRow(firm, waMsg) {
  const mapsQuery = firm.address
    ? firm.address
    : `${firm.name} ${firm.district || ''} ${firm.city || ''}`.trim();

  const waBtn = firm.whatsapp
    ? `<a class="action-btn action-btn-wa" href="https://wa.me/${firm.whatsapp}?text=${waMsg}" target="_blank" title="WhatsApp'tan Ulaş">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.09-1.33A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.6 0-3.1-.43-4.4-1.18l-.31-.18-3.02.79.8-2.94-.2-.32A7.94 7.94 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.4-5.9c-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.42-1.33-1.66-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.46-.28z"/></svg>
      </a>`
    : '';
  const phoneBtn = firm.phone
    ? `<a class="action-btn" href="tel:${firm.phone}" title="Telefonla Ara">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.902.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.908.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </a>`
    : '';
  const locBtn = `<a class="action-btn" href="https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}" target="_blank" title="Konumu Göster">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    </a>`;

  return `<div class="firm-action-row">${waBtn}${phoneBtn}${locBtn}</div>`;
}

function openPhotoLightbox(src) {
  const box = document.createElement('div');
  box.className = 'photo-lightbox';
  box.innerHTML = `<img src="${src}">`;
  box.addEventListener('click', () => box.remove());
  document.body.appendChild(box);
}

const SOCIAL_ICONS = [
  { key: 'instagram', title: 'Instagram', svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c2.7 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.5.5.9 1.1 1.15 1.76.25.64.42 1.37.47 2.43.05 1.06.06 1.42.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43-.26.66-.6 1.21-1.15 1.76-.5.5-1.1.9-1.76 1.15-.64.25-1.37.42-2.43.47-1.06.05-1.42.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47-.66-.26-1.21-.6-1.76-1.15-.5-.5-.9-1.1-1.15-1.76-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.7 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76.5-.5 1.1-.9 1.76-1.15.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.3 2 12 2zm0 1.8c-2.65 0-2.99.01-4.04.06-.9.04-1.4.19-1.72.32-.43.17-.74.37-1.06.7-.32.32-.52.63-.7 1.06-.13.32-.28.82-.32 1.72C4.11 9.01 4.1 9.35 4.1 12s.01 2.99.06 4.04c.04.9.19 1.4.32 1.72.17.43.37.74.7 1.06.32.32.63.52 1.06.7.32.13.82.28 1.72.32 1.05.05 1.39.06 4.04.06s2.99-.01 4.04-.06c.9-.04 1.4-.19 1.72-.32.43-.17.74-.37 1.06-.7.32-.32.52-.63.7-1.06.13-.32.28-.82.32-1.72.05-1.05.06-1.39.06-4.04s-.01-2.99-.06-4.04c-.04-.9-.19-1.4-.32-1.72-.17-.43-.37-.74-.7-1.06-.32-.32-.63-.52-1.06-.7-.32-.13-.82-.28-1.72-.32C14.99 3.81 14.65 3.8 12 3.8zm0 3.05a5.15 5.15 0 1 1 0 10.3 5.15 5.15 0 0 1 0-10.3zm0 1.8a3.35 3.35 0 1 0 0 6.7 3.35 3.35 0 0 0 0-6.7zm5.35-1.98a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>` },
  { key: 'youtube', title: 'YouTube', svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.5 12 3.5 12 3.5s-7.51 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14C4.49 20.5 12 20.5 12 20.5s7.51 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z"/></svg>` },
  { key: 'website', title: 'Web Sitesi', svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.93 9h-3.4a15.6 15.6 0 0 0-1.3-5.7A8.03 8.03 0 0 1 19.93 11zM12 4.06c.9 1.16 1.95 3.1 2.4 6.94H9.6c.45-3.84 1.5-5.78 2.4-6.94zM9.6 13h4.8c-.45 3.84-1.5 5.78-2.4 6.94-.9-1.16-1.95-3.1-2.4-6.94zm-1.83-2H4.07a8.03 8.03 0 0 1 4.7-5.7A15.6 15.6 0 0 0 7.47 11zm0 2a15.6 15.6 0 0 0 1.3 5.7A8.03 8.03 0 0 1 4.07 13h3.4zm9.06 5.7a15.6 15.6 0 0 0 1.3-5.7h3.4a8.03 8.03 0 0 1-4.7 5.7z"/></svg>` }
];

function distanceKm(a, f) {
  if (f.lat == null || f.lng == null) return Infinity;
  const R = 6371;
  const dLat = (f.lat - a.lat) * Math.PI / 180;
  const dLng = (f.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180, lat2 = f.lat * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function renderAvantajResults(firms, city) {
  resultsList.innerHTML = "";

  const title = document.createElement('h3');
  title.className = 'cat-group-title';
  title.textContent = firms.length > 0 ? `Avantaj (${city})` : `Avantaj — Henüz Firma Yok`;
  resultsList.appendChild(title);

  if (firms.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = "Bu şehirde henüz üye avantajlı firma yok — yakında eklenecek.";
    resultsList.appendChild(empty);
    resultsSection.style.display = 'block';
    return;
  }

  firms.forEach(firm => {
    const waMsg = firm.whatsapp ? encodeURIComponent(
      `Merhaba, size MotoGo üzerinden ulaşıyorum. "${firm.title}" kampanyanız hakkında bilgi almak istiyorum.`
    ) : '';

    const extraContent = `
      ${firm.title ? `<p class="avantaj-card-title">${firm.title}</p>` : ''}
      ${firm.bonus ? `<p class="avantaj-card-bonus">🎁 ${firm.bonus}</p>` : ''}
    `;

    const card = buildFirmCard(firm, {
      nameLine: firm.name,
      metaLine: firm.category || '',
      badge: firm.badge ? `<span class="avantaj-card-badge">${firm.badge}</span>` : '',
      extraContent: extraContent,
      description: firm.description,
      socialLinks: null,
      waMsg: waMsg
    });
    resultsList.appendChild(card);
  });

  resultsSection.style.display = 'block';
}

function renderFirmResults(firms, baseTitle, city, emptyText, waPurpose, coords, showLocationBtn) {
  resultsList.innerHTML = "";

  const title = document.createElement('h3');
  title.className = 'cat-group-title';
  title.textContent = firms.length > 0 ? `${baseTitle} (${city})` : `${baseTitle} — Henüz Firma Yok`;
  resultsList.appendChild(title);

  if (firms.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = emptyText;
    resultsList.appendChild(empty);
  } else {
    firms.forEach(firm => {
      const socialLinks = SOCIAL_ICONS.map(s => {
        if (firm[s.key]) {
          return `<a class="social-btn" href="${firm[s.key]}" target="_blank" title="${s.title}">${s.svg}</a>`;
        }
        return `<span class="social-btn social-btn-disabled" title="${s.title} bağlantısı yok">${s.svg}</span>`;
      }).join('');

      const locLine = coords
        ? `\nKonumum: https://www.google.com/maps?q=${coords.lat},${coords.lng}`
        : '';
      const waMsg = encodeURIComponent(
        `Merhaba, size MotoGo üzerinden ulaşıyorum. ${waPurpose} için bilgi almak istiyorum.${locLine}`
      );

      const subtitle = firm.district ? firm.district : (firm.region || "");
      const distText = (coords && firm.lat != null) ? `${distanceKm(coords, firm).toFixed(1)} km · ` : '';

      const card = buildFirmCard(firm, {
        nameLine: firm.name,
        metaLine: `${distText}${subtitle ? `<b style="color:#fff;">${subtitle}</b> ` : ''}${firm.city || ""}`,
        description: firm.description,
        socialLinks: socialLinks,
        waMsg: waMsg
      });
      resultsList.appendChild(card);
    });
  }

  resultsSection.style.display = 'block';
}

showResultsBtn.addEventListener('click', () => {
  if (!currentSubcat) { alert("Lütfen ne aradığınızı seçin."); return; }
  const city = citySelect.value;
  if (!city) { alert("Lütfen şehrinizi seçin."); return; }

  if (currentSubcat.isYardim) {
    const firms = YARDIM_FIRMS
      .filter(f => f.categories.includes(currentSubcat.key) && f.city === city)
      .sort(sortBySira);
    const baseTitle = `Yol Yardım — ${currentSubcat.label}`;
    const emptyText = "Bu şehirde, bu Yol Yardım hizmetinde sistemde henüz üye firma yok — yakında eklenecek.";
    const waPurpose = `Yol Yardım — ${currentSubcat.label}`;
    renderFirmResults(firms, baseTitle, city, emptyText, waPurpose, null, true);
  } else if (currentSubcat.brandFree) {
    if (currentSubcat.key === 'avantaj') {
      const firms = AVANTAJ_FIRMS
        .filter(f => f.city === city)
        .sort(sortBySira);
      renderAvantajResults(firms, city);
      return;
    }
    const sourceFirms = currentSubcat.key === 'ekspertiz' ? EKSPERTIZ_FIRMS : KIRALIK_FIRMS;
    const firms = sourceFirms
      .filter(f => f.city === city)
      .sort(sortBySira);
    const baseTitle = currentSubcat.label;
    const emptyText = currentSubcat.key === 'ekspertiz'
      ? "Bu şehirde henüz üye ekspertiz firması yok — yakında eklenecek."
      : "Bu şehirde henüz üye kiralık motor firması yok — yakında eklenecek.";
    const waPurpose = currentSubcat.label;
    renderFirmResults(firms, baseTitle, city, emptyText, waPurpose, null);
  } else {
    if (!currentBrand) { alert("Lütfen motosiklet markanızı yazıp listeden seçin."); brandInput.focus(); return; }
    const dataKey = `${currentBrand.key}_${currentSubcat.key}`;
    const firms = (BRAND_FIRMS[dataKey] || [])
      .filter(f => !f.city || f.city === city)
      .sort(sortBySira);
    const baseTitle = `${currentBrand.name} — ${currentSubcat.label}`;
    const emptyText = "Bu markada, bu hizmette sistemde henüz üye firma yok — yakında eklenecek.";
    const waPurpose = `${currentBrand.name} — ${currentSubcat.label}`;
    renderFirmResults(firms, baseTitle, city, emptyText, waPurpose, null);
  }
});

// ---------------------------------------------------------------------------
// Alt menü — Kılavuz (MotoGo Sözlük araması) şimdilik hazır değil
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Kılavuz — MotoGo Sözlük arama motoru (siteye gömülü, indirilemez)
// ---------------------------------------------------------------------------
(function(){
  const overlay = document.getElementById('kilavuzOverlay');
  const openBtn = document.getElementById('kilavuzNavBtn');
  const closeBtn = document.getElementById('kilavuzCloseBtn');
  const input = document.getElementById('kilavuzArama');
  const sonuclar = document.getElementById('kilavuzSonuclar');
  if (sonuclar) sonuclar.addEventListener('contextmenu', (e) => e.preventDefault());
  if (!overlay || !openBtn) return;

  function renderResults(list) {
    sonuclar.innerHTML = '';
    if (list.length === 0) {
      sonuclar.innerHTML = '<div class="empty-state">Eşleşen terim bulunamadı.</div>';
      return;
    }
    list.forEach(e => {
      const card = document.createElement('div');
      card.className = 'kilavuz-term-card';
      card.innerHTML = `
        <p class="kilavuz-term-name">${e.term}</p>
        <span class="kilavuz-term-cat">${e.category}</span>
        <p class="kilavuz-term-def">${e.definition}</p>
      `;
      sonuclar.appendChild(card);
    });
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLocaleLowerCase('tr-TR');
    if (!q) { sonuclar.innerHTML = ''; return; }
    const filtered = SOZLUK_TERIMLERI.filter(e =>
      e.term.toLocaleLowerCase('tr-TR').includes(q) ||
      e.category.toLocaleLowerCase('tr-TR').includes(q)
    );
    renderResults(filtered.slice(0, 30));
  });

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    input.value = '';
    sonuclar.innerHTML = '';
    overlay.style.display = 'flex';
    setTimeout(() => input.focus(), 100);
  });
  closeBtn.addEventListener('click', () => { overlay.style.display = 'none'; });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
})();

// ---------------------------------------------------------------------------
// APP HUB — Mini Uygulamalar (Hava Durumu, Hatırlatıcılar, Etkinlik, Rota, Ceza, Güvenlik)
// ---------------------------------------------------------------------------
(function(){
  var grid = document.getElementById('appHubGrid');
  var panel = document.getElementById('appHubPanel');
  if(!grid || !panel) return;

  var activePanel = null;

  var RENDERERS = {
    hava: renderHava,
    hatirlatici: renderHatirlatici,
    etkinlik: renderEtkinlik,
    rota: renderRota,
    ceza: renderCeza,
    guvenlik: renderGuvenlik
  };

  grid.querySelectorAll('.app-hub-icon').forEach(function(btn){
    btn.addEventListener('click', function(){
      var key = btn.getAttribute('data-panel');
      if(activePanel === key){
        panel.style.display = 'none';
        activePanel = null;
        return;
      }
      activePanel = key;
      panel.style.display = 'block';
      RENDERERS[key](panel);
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  function renderHava(el){
    el.innerHTML = '<h3>☁️ Hava Durumu</h3><p>Konumunuz alınıyor...</p>';
    if(!navigator.geolocation){
      el.innerHTML = '<h3>☁️ Hava Durumu</h3><p>Tarayıcınız konum özelliğini desteklemiyor.</p>';
      return;
    }
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat = pos.coords.latitude, lon = pos.coords.longitude;
      fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weathercode,precipitation')
        .then(function(r){ return r.json(); })
        .then(function(data){
          var cur = data.current || {};
          var temp = Math.round(cur.temperature_2m);
          var code = cur.weathercode;
          var uygun = true;
          var mesaj = '☀️ Sürüş için uygun görünüyor.';
          if((code >= 51 && code <= 67) || (code >= 80 && code <= 99)){
            uygun = false;
            mesaj = '🌧️ Dikkatli sürün, yol ıslak/kaygan olabilir.';
          } else if(code >= 71 && code <= 77){
            uygun = false;
            mesaj = '❄️ Kar/buzlanma riski var, mümkünse sürüşü erteleyin.';
          } else if(code === 45 || code === 48){
            uygun = false;
            mesaj = '🌫️ Sis var, görüş mesafesi düşük olabilir.';
          }
          el.innerHTML = '<h3>☁️ Hava Durumu</h3>' +
            '<p style="font-size:22px;color:#fff;font-weight:700;margin:0 0 8px;">' + temp + '°C</p>' +
            '<p>' + mesaj + '</p>';
        })
        .catch(function(){
          el.innerHTML = '<h3>☁️ Hava Durumu</h3><p>Hava durumu şu an alınamadı, lütfen tekrar deneyin.</p>';
        });
    }, function(){
      el.innerHTML = '<h3>☁️ Hava Durumu</h3><p>Konum izni verilmedi. Tarayıcı ayarlarından konuma izin verip tekrar deneyin.</p>';
    });
  }

  function renderHatirlatici(el){
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('motogo_hatirlatici') || '{}'); } catch(e){}
    el.innerHTML =
      '<h3>🔧 Hatırlatıcılar</h3>' +
      '<label>Son Yağ Değişimi (km)</label>' +
      '<input type="number" id="hubYagKm" placeholder="örn. 42000" value="' + (saved.yagKm || '') + '">' +
      '<label>Güncel Kilometreniz</label>' +
      '<input type="number" id="hubGuncelKm" placeholder="örn. 44500" value="' + (saved.guncelKm || '') + '">' +
      '<label>Muayene Tarihi</label>' +
      '<input type="date" id="hubMuayene" value="' + (saved.muayene || '') + '">' +
      '<label>Sigorta Bitiş Tarihi</label>' +
      '<input type="date" id="hubSigorta" value="' + (saved.sigorta || '') + '">' +
      '<button type="button" class="hub-save" id="hubKaydet">Kaydet</button>' +
      '<div id="hubDurum" style="margin-top:12px;"></div>';

    var YAG_ARALIGI_KM = 5000;

    function gunFarki(tarihStr){
      if(!tarihStr) return null;
      var hedef = new Date(tarihStr);
      var bugun = new Date();
      bugun.setHours(0,0,0,0);
      return Math.round((hedef - bugun) / 86400000);
    }
    function durumYaz(){
      var d = {
        yagKm: document.getElementById('hubYagKm').value,
        guncelKm: document.getElementById('hubGuncelKm').value,
        muayene: document.getElementById('hubMuayene').value,
        sigorta: document.getElementById('hubSigorta').value
      };
      var lines = [];

      if(d.yagKm){
        var hedefKm = parseInt(d.yagKm, 10) + YAG_ARALIGI_KM;
        if(d.guncelKm){
          var kalanKm = hedefKm - parseInt(d.guncelKm, 10);
          if(kalanKm <= 0) lines.push('<p style="color:#f09595;">⚠️ Yağ değişimi ' + Math.abs(kalanKm) + ' km geçmiş.</p>');
          else if(kalanKm <= 500) lines.push('<p style="color:#e8c090;">⏰ Yağ değişimine ' + kalanKm + ' km kaldı.</p>');
          else lines.push('<p style="color:#9a9aa2;">✅ Yağ güncel (' + hedefKm.toLocaleString('tr-TR') + ' km\'de değişim zamanı).</p>');
        } else {
          lines.push('<p style="color:#9a9aa2;">ℹ️ Sonraki yağ değişimi hedefi: ' + hedefKm.toLocaleString('tr-TR') + ' km. Kalan mesafeyi görmek için güncel kilometrenizi girin.</p>');
        }
      }

      [['muayene','Muayene'], ['sigorta','Sigorta']].forEach(function(pair){
        var fark = gunFarki(d[pair[0]]);
        if(fark === null) return;
        if(fark < 0) lines.push('<p style="color:#f09595;">⚠️ ' + pair[1] + ' tarihi geçmiş.</p>');
        else if(fark <= 14) lines.push('<p style="color:#e8c090;">⏰ ' + pair[1] + ' ' + fark + ' gün sonra.</p>');
        else lines.push('<p style="color:#9a9aa2;">✅ ' + pair[1] + ' güncel (' + fark + ' gün var).</p>');
      });
      document.getElementById('hubDurum').innerHTML = lines.join('');
      return d;
    }
    document.getElementById('hubKaydet').addEventListener('click', function(){
      var d = durumYaz();
      localStorage.setItem('motogo_hatirlatici', JSON.stringify(d));
    });
    durumYaz();
  }

  function renderEtkinlik(el){
    if (!ETKINLIKLER || ETKINLIKLER.length === 0) {
      el.innerHTML = '<h3>📅 Etkinlik Takvimi</h3><p>Şu an listelenmiş bir etkinlik yok.</p>';
      return;
    }
    var html = '<h3>📅 Etkinlik Takvimi</h3>';
    ETKINLIKLER.forEach(function(e){
      html += '<div class="app-hub-route">' +
        '<strong>' + e.ad + '</strong>' +
        (e.aciklama ? '<span style="font-size:11.5px;">' + e.aciklama + '</span><br>' : '') +
        (e.konum ? '<span style="font-size:12px;">📍 ' + e.konum + '</span><br>' : '') +
        (e.tarih ? '<span style="font-size:12px;">🗓️ ' + e.tarih + '</span>' : '') +
      '</div>';
    });
    el.innerHTML = html;
  }

  function renderRota(el){
    var html = '<h3>🗺️ Rota Önerileri</h3>';
    if (!ROTALAR || ROTALAR.length === 0) {
      html += '<p>Şu an listelenmiş bir rota yok.</p>';
      el.innerHTML = html;
      return;
    }
    ROTALAR.forEach(function(r){
      html += '<div class="app-hub-route"><strong>' + r.ad + '</strong>' +
        '<span style="font-size:11.5px;">' + r.bolge + ' · ' + r.not_ + '</span><br>' +
        '<a href="https://www.google.com/maps/search/' + encodeURIComponent(r.q) + '" target="_blank">Google Haritada Aç →</a></div>';
    });
    el.innerHTML = html;
  }

  function renderCeza(el){
    var cezalar = [
      { ad: 'Kırmızı Işık İhlali', tutar: '5.000₺ (ilk ihlal) — tekrarda 80.000₺\'ye kadar artar' },
      { ad: 'Hız Sınırı Aşımı', tutar: '2.000₺ – 30.000₺ (aşım miktarına göre kademeli)' },
      { ad: 'Kasksız Sürüş (sürücü/yolcu)', tutar: '~1.246₺ + 15 ceza puanı' },
      { ad: 'Ehliyetsiz Araç Kullanma', tutar: '40.000₺\'den başlıyor' },
      { ad: 'Alkollü Araç Kullanma', tutar: '25.000₺ (ilk seferde) + 6 ay ehliyete el konulur' }
    ];
    var html = '<h3>🚨 Ceza Sorgulama</h3>' +
      '<p style="color:#e8c090;font-size:11.5px;">⚠️ Trafik cezaları 2026 başında yürürlüğe giren yeni düzenlemeyle değişti, tutarlar yaklaşıktır. Kesin tutar için aşağıdaki "Ceza Sorgulama"yı kullanın.</p>';
    cezalar.forEach(function(c){
      html += '<div class="app-hub-tip"><b style="color:#fff;">' + c.ad + '</b><br><span style="font-size:12px;color:var(--text-dim);">' + c.tutar + '</span></div>';
    });
    html += '<p style="margin-top:14px;">Kendi cezanızı sorgulamak için T.C. Cumhurbaşkanlığı e-Devlet Kapısı\'na girip "Araç Plakasına Yazılan Ceza Sorgulama" hizmetini seçin.</p>' +
      '<a href="https://www.turkiye.gov.tr/" target="_blank" style="color:var(--red);font-weight:700;font-size:13px;">e-Devlet Kapısı\'na Git →</a>';
    el.innerHTML = html;
  }

  function renderGuvenlik(el){
    var html = '<h3>🛡️ Sürüş Güvenliği İpuçları</h3>';
    if (!GUVENLIK_IPUCLARI || GUVENLIK_IPUCLARI.length === 0) {
      html += '<p>Şu an listelenmiş bir ipucu yok.</p>';
      el.innerHTML = html;
      return;
    }
    GUVENLIK_IPUCLARI.forEach(function(t){
      html += '<div class="app-hub-tip">' + t + '</div>';
    });
    el.innerHTML = html;
  }
})();

// ---------------------------------------------------------------------------
// Profilim — kullanıcının kendi telefonunda saklanan profil bilgisi
// (Supabase kurulunca buradaki kaydetme mantığı oraya taşınacak)
// ---------------------------------------------------------------------------
(function(){
  const overlay = document.getElementById('profilimOverlay');
  const openBtn = document.getElementById('profilimNavBtn');
  const closeBtn = document.getElementById('profilimCloseBtn');
  const ilSelect = document.getElementById('profIl');
  const saveBtn = document.getElementById('profKaydetBtn');
  const durum = document.getElementById('profDurum');
  if (!overlay || !openBtn) return;

  CITIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    ilSelect.appendChild(opt);
  });

  function checkReady() {
    const adSoyad = document.getElementById('profAdSoyad').value.trim();
    const telefonDigits = document.getElementById('profTelefon').value.replace(/\D/g, '');
    saveBtn.classList.toggle('ready', !!(adSoyad && telefonDigits.length >= 11));
  }
  document.getElementById('profAdSoyad').addEventListener('input', checkReady);
  document.getElementById('profTelefon').addEventListener('input', checkReady);

  function loadProfil() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem('motogo_profilim') || '{}'); } catch(e){}
    document.getElementById('profAdSoyad').value = p.adSoyad || '';
    document.getElementById('profTelefon').value = p.telefon || '';
    document.getElementById('profEmail').value = p.email || '';
    document.getElementById('profKanGrubu').value = p.kanGrubu || '';
    ilSelect.value = p.il || '';
    durum.textContent = '';
    checkReady();
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadProfil();
    overlay.style.display = 'flex';
  });
  closeBtn.addEventListener('click', () => { overlay.style.display = 'none'; });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  saveBtn.addEventListener('click', () => {
    const adSoyad = document.getElementById('profAdSoyad').value.trim();
    const telefon = document.getElementById('profTelefon').value.trim();
    if (!adSoyad || !telefon) {
      durum.textContent = '⚠️ Ad Soyad ve Telefon zorunludur.';
      durum.style.color = '#f09595';
      return;
    }
    const p = {
      adSoyad,
      telefon,
      email: document.getElementById('profEmail').value.trim(),
      kanGrubu: document.getElementById('profKanGrubu').value.trim(),
      il: ilSelect.value
    };
    localStorage.setItem('motogo_profilim', JSON.stringify(p));

    if (window.motogoSupabase) {
      durum.textContent = 'Kaydediliyor...';
      durum.style.color = '#9a9aa2';
      window.motogoSupabase.from('profiller').insert({
        ad_soyad: p.adSoyad,
        telefon: p.telefon,
        email: p.email || null,
        kan_grubu: p.kanGrubu || null,
        il: p.il || null
      }).then(({ error }) => {
        if (error) {
          durum.textContent = '⚠️ Kaydedildi (cihazınızda), ancak sunucuya gönderilemedi.';
          durum.style.color = '#e8c090';
        } else {
          durum.textContent = '✅ Kaydedildi.';
          durum.style.color = '#9a9aa2';
        }
      });
    } else {
      durum.textContent = '✅ Kaydedildi.';
      durum.style.color = '#9a9aa2';
    }
  });
})();

// ---------------------------------------------------------------------------
// Firma Girişi — Üyelik Talep Formu (kullanıcının kendi telefonunda saklanır,
// Supabase kurulunca kaydetme mantığı oraya taşınacak)
// ---------------------------------------------------------------------------
(function(){
  const overlay = document.getElementById('firmaGirisiOverlay');
  const openBtn = document.getElementById('firmaGirisiNavBtn');
  const closeBtn = document.getElementById('firmaGirisiCloseBtn');
  const saveBtn = document.getElementById('fgKaydetBtn');
  const durum = document.getElementById('fgDurum');
  if (!overlay || !openBtn) return;

  const fields = ['fgFirmaUnvani','fgMarkaIsmi','fgYetkiliAdSoyad','fgAdres','fgFirmaTelefon',
    'fgYetkiliGsm','fgEmail','fgWeb','fgVergiDairesi','fgVergiNo','fgTcKimlik','fgFaaliyetAlani',
    'fgFirmaOzellikleri','fgHizmetPaketleri','fgOdemePlani'];

  const paketOnay = document.getElementById('fgPaketOnay');
  const formAlani = document.getElementById('fgFormAlani');
  paketOnay.addEventListener('change', () => {
    const acik = paketOnay.checked;
    formAlani.style.opacity = acik ? '1' : '0.4';
    formAlani.style.pointerEvents = acik ? 'auto' : 'none';
  });

  function loadForm() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem('motogo_firma_basvuru') || '{}'); } catch(e){}
    fields.forEach(id => { document.getElementById(id).value = p[id] || ''; });
    document.getElementById('fgOnay').checked = false;
    document.getElementById('fgMesafeliSatis').checked = false;
    paketOnay.checked = false;
    formAlani.style.opacity = '0.4';
    formAlani.style.pointerEvents = 'none';
    document.getElementById('fgTarih').textContent = new Date().toLocaleDateString('tr-TR');
    durum.textContent = '';
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadForm();
    overlay.style.display = 'flex';
  });
  closeBtn.addEventListener('click', () => { overlay.style.display = 'none'; });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  saveBtn.addEventListener('click', () => {
    const unvan = document.getElementById('fgFirmaUnvani').value.trim();
    const yetkili = document.getElementById('fgYetkiliAdSoyad').value.trim();
    const gsm = document.getElementById('fgYetkiliGsm').value.trim();
    const onay = document.getElementById('fgOnay').checked;
    const mesafeliSatis = document.getElementById('fgMesafeliSatis').checked;

    if (!paketOnay.checked) {
      durum.textContent = '⚠️ Devam etmek için önce bir paket satın almanız ve kutuyu işaretlemeniz gerekiyor.';
      durum.style.color = '#f09595';
      return;
    }
    if (!unvan || !yetkili || !gsm) {
      durum.textContent = '⚠️ Firma Unvanı, Yetkili Adı Soyadı ve Yetkili GSM zorunludur.';
      durum.style.color = '#f09595';
      return;
    }
    if (!onay || !mesafeliSatis) {
      durum.textContent = '⚠️ Devam etmek için her iki onay kutusunu da işaretlemeniz gerekiyor.';
      durum.style.color = '#f09595';
      return;
    }

    const data = { tarih: new Date().toISOString() };
    fields.forEach(id => { data[id] = document.getElementById(id).value.trim(); });
    localStorage.setItem('motogo_firma_basvuru', JSON.stringify(data));

    if (window.motogoSupabase) {
      durum.textContent = 'Gönderiliyor...';
      durum.style.color = '#9a9aa2';
      window.motogoSupabase.from('firma_basvurulari').insert({
        firma_unvani: data.fgFirmaUnvani,
        marka_ismi: data.fgMarkaIsmi || null,
        yetkili_ad_soyad: data.fgYetkiliAdSoyad,
        adres: data.fgAdres || null,
        firma_telefon: data.fgFirmaTelefon || null,
        yetkili_gsm: data.fgYetkiliGsm,
        email: data.fgEmail || null,
        web: data.fgWeb || null,
        vergi_dairesi: data.fgVergiDairesi || null,
        vergi_no: data.fgVergiNo || null,
        tc_kimlik: data.fgTcKimlik || null,
        faaliyet_alani: data.fgFaaliyetAlani || null,
        firma_ozellikleri: data.fgFirmaOzellikleri || null,
        hizmet_paketleri: data.fgHizmetPaketleri || null,
        odeme_plani: data.fgOdemePlani || null,
        onay: true
      }).then(({ error }) => {
        if (error) {
          durum.textContent = '⚠️ Kaydedildi (cihazınızda), ancak sunucuya gönderilemedi.';
          durum.style.color = '#e8c090';
        } else {
          durum.textContent = '✅ Başvurunuz alındı.';
          durum.style.color = '#9a9aa2';
        }
      });
    } else {
      durum.textContent = '✅ Başvurunuz alındı.';
      durum.style.color = '#9a9aa2';
    }
  });
})();
