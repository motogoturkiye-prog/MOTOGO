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
      { data: yakit },
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
      sb.from('yakit_indirimleri').select('*'),
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

    if (yakit) {
      YAKIT_FIRMS = yakit.map(r => ({
        name: r.ad, city: r.sehir, district: r.ilce, whatsapp: r.whatsapp,
        phone: r.telefon, description: r.indirim_orani ? `${r.indirim_orani} indirim` : null,
        photo: r.foto_url, siraNo: r.sira_no, address: r.adres
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
      // Yol Yardım brandFree bir akış — kafa karışmasın diye, üstteki marka
      // seçimi varsa (BMW gibi) temizlenir, Yol Yardım'ın markadan bağımsız
      // olduğu net olsun diye.
      brandInput.value = "";
      brandInput.classList.remove('brand-selected');
      currentBrand = null;
      brandInfoLabel.textContent = "Motor Kılavuzu";
      brandInfoText.textContent = "";
      brandSuggestions.innerHTML = "";
      brandSuggestions.style.display = 'none';
      updateCursorPosition();

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
  // Marka yazmaya başlayınca, önceden seçilmiş bir Yol Yardım kategorisi
  // varsa temizlenir — iki akış birbirine karışmasın diye.
  if (currentSubcat && currentSubcat.isYardim) {
    currentSubcat = null;
    renderSubcatGrid();
    cityField.style.display = 'none';
    showResultsBtn.style.display = 'none';
    resultsSection.style.display = 'none';
  }
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
  } else if (currentSubcat.key === 'yakit') {
    source = YAKIT_FIRMS;
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

  const headBlock = `
    <div class="firm-info-head">
      <div>
        <p class="firm-name">${opts.nameLine}</p>
        ${opts.metaLine ? `<p class="firm-meta">${opts.metaLine}</p>` : ''}
      </div>
      ${opts.badge || ''}
    </div>
  `;

  card.innerHTML = `
    ${hasPhoto ? `<img class="firm-thumb-top photo-click" src="${firm.photo}" alt="${firm.name}">` : ''}
    <div class="firm-info">
      ${headBlock}
      ${opts.extraContent || ''}
      ${opts.description ? `<p class="firm-desc">${opts.description}</p>` : ''}
      ${bottomRow}
    </div>
  `;

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

  // Numarayı ne şekilde girilirse girilsin (boşluklu, tireli, +90'lı) temizler
  function cleanPhone(raw) {
    if (!raw) return '';
    let digits = raw.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) digits = '90' + digits.slice(1);
    if (!digits.startsWith('90') && digits.length === 10) digits = '90' + digits;
    return digits;
  }
  const cleanWhatsapp = cleanPhone(firm.whatsapp);

  const waBtn = cleanWhatsapp
    ? `<a class="action-btn action-btn-wa" href="https://wa.me/${cleanWhatsapp}?text=${waMsg}" target="_blank" title="WhatsApp'tan Ulaş">
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
    const socialLinks = SOCIAL_ICONS.map(s => {
      if (firm[s.key]) {
        return `<a class="social-btn" href="${firm[s.key]}" target="_blank" title="${s.title}">${s.svg}</a>`;
      }
      return `<span class="social-btn social-btn-disabled" title="${s.title} bağlantısı yok">${s.svg}</span>`;
    }).join('');

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
      socialLinks: socialLinks,
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
    const sourceFirms = currentSubcat.key === 'ekspertiz' ? EKSPERTIZ_FIRMS : YAKIT_FIRMS;
    const firms = sourceFirms
      .filter(f => f.city === city)
      .sort(sortBySira);
    const baseTitle = currentSubcat.label;
    const emptyText = currentSubcat.key === 'ekspertiz'
      ? "Bu şehirde henüz üye ekspertiz firması yok — yakında eklenecek."
      : "Bu şehirde henüz anlaşmalı yakıt bayimiz yok — yakında eklenecek.";
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
  var panel = document.getElementById('appScreenBody');
  var screenEl = document.getElementById('appScreen');
  var screenTitle = document.getElementById('appScreenTitle');
  var backBtn = document.getElementById('appScreenBack');
  if(!grid || !panel) return;

  var activePanel = null;

  var RENDERERS = {
    hava: renderHava,
    hatirlatici: renderHatirlatici,
    etkinlik: renderEtkinlik,
    rota: renderRota,
    ceza: renderCeza,
    guvenlik: renderGuvenlik,
    ariza: renderAriza,
    kart: renderKart,
    gun: renderGun,
    haber: renderHaber,
    konaklama: function(el){ renderDir('konaklama', el); },
    sigorta: function(el){ renderDir('sigorta', el); },
    ehliyet: function(el){ renderDir('ehliyet', el); },
    yakit: function(el){ renderDir('yakit', el); },
    market: function(el){ renderDir('market', el); },
    mola: function(el){ renderDir('mola', el); }
  };

  function closeScreen(){
    stopCard(); screenEl.hidden = true; document.body.style.overflow = ''; activePanel = null;
  }
  function openScreen(key, title){
    stopCard(); activePanel = key; screenTitle.textContent = title;
    screenEl.hidden = false; screenEl.scrollTop = 0; document.body.style.overflow = 'hidden';
    RENDERERS[key](panel);
  }
  grid.querySelectorAll('.app-hub-icon[data-panel]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var t = btn.querySelector('span:last-child');
      openScreen(btn.getAttribute('data-panel'), t ? t.textContent : '');
    });
  });
  backBtn.addEventListener('click', closeScreen);

  // --- Aksiyon ikonları (site özelliklerine kısayol) ---
  function clickById(id){ var el = document.getElementById(id); if(el) el.click(); }
  function scrollToId(id){ var el = document.getElementById(id); if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  var pager = document.getElementById('phonePager');
  var dots = document.querySelectorAll('#phoneDots span');
  var hint = document.getElementById('phoneHint');

  grid.querySelectorAll('.app-hub-icon[data-action]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var a = btn.getAttribute('data-action');
      if(a === 'shorts') clickById('shortsOpenBtn');
      else if(a === 'sozluk') clickById('kilavuzNavBtn');
      else if(a === 'profil') clickById('profilimNavBtn');
      else if(a === 'servis') scrollToId('mainForm');
      else if(a === 'yardim') scrollToId('yardimCatGrid');
      else if(a === 'avantaj'){
        scrollToId('mainForm');
        var chips = document.querySelectorAll('#subcatGrid .subcat-chip');
        for(var i=0;i<chips.length;i++){ if(/avantaj/i.test(chips[i].textContent)){ chips[i].click(); break; } }
      }
      else if(a === 'kurulum' && pager) pager.scrollTo({ left: pager.clientWidth, behavior: 'smooth' });
    });
  });

  // --- Sayfa noktaları ---
  if(pager && dots.length){
    pager.addEventListener('scroll', function(){
      var idx = Math.round(pager.scrollLeft / pager.clientWidth);
      dots.forEach(function(d, i){ d.classList.toggle('active', i === idx); });
      if(hint) hint.textContent = idx === 0 ? 'Sağa kaydır ›' : '‹ Uygulamalar';
    });
    dots.forEach(function(d, i){
      d.addEventListener('click', function(){ pager.scrollTo({ left: i * pager.clientWidth, behavior: 'smooth' }); });
    });
    if(hint) hint.addEventListener('click', function(){
      var idx = Math.round(pager.scrollLeft / pager.clientWidth);
      pager.scrollTo({ left: idx === 0 ? pager.clientWidth : 0, behavior: 'smooth' });
    });
  }

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


  // --- Arıza Tespiti: belirti rehberi + bölgendeki Yol Yardım firmaları (gerçek veri) ---
  var AZ_BELIRTI = {
    "Çalışmıyor": { sebep: ["Akü bitmiş olabilir","Yakıt bitmiş olabilir","Marş rölesi arızası"], yap: "Önce yakıtı ve ana şalteri kontrol et. Marş çalışıyorsa buji, hiç ses yoksa akü." },
    "Ses yapıyor": { sebep: ["Zincir ayarı","Rulman aşınması","Egzoz bağlantısı"], yap: "Sesin ne zaman geldiğine dikkat et: motor devriyle artıyorsa motor, hızla artıyorsa zincir ya da şanzıman olabilir." },
    "Duman": { sebep: ["Yağ yanması","Soğutma sıvısı kaçağı","Aşırı ısınma"], yap: "Motoru hemen durdur ve soğumasını bekle. Duman beyaz ve tatlı kokuyorsa soğutma sıvısı olabilir." },
    "Lastik": { sebep: ["Patlak","Basınç düşük","Jant hasarı"], yap: "Yavaşla, ani fren yapma. Güvenli bir yere çekil ve Yol Yardım'ı ara." },
    "Akü": { sebep: ["Akü ömrü bitmiş","Şarj sistemi arızası","Gevşek kutup başı"], yap: "Kutup başlarını kontrol et. Takviyeli çalıştırma yalnızca doğru kablo bağlantısıyla yapılır." }
  };
  var azState = { belirti: null, city: '', loc: '' };
  function azPhone(raw){
    if(!raw) return '';
    var d = String(raw).replace(/[^0-9]/g,'');
    if(d.indexOf('0') === 0) d = '90' + d.slice(1);
    if(d.indexOf('90') !== 0 && d.length === 10) d = '90' + d;
    return d;
  }
  function azLabel(id){
    var found = (typeof YARDIM_CATEGORIES !== 'undefined' ? YARDIM_CATEGORIES : []).filter(function(c){ return c.id === id; })[0];
    return found ? found.label : id;
  }
  function renderAriza(el){
    var html = '<h3>🛠️ Arıza Tespiti</h3>';
    html += '<p class="app-hub-sub" style="margin:0 0 6px;">Belirtiyi seç, olası sebepleri gör ve bölgendeki Yol Yardım firmasını ara.</p>';
    html += '<div class="az-chips">' + Object.keys(AZ_BELIRTI).map(function(k){
      return '<button type="button" class="az-chip" data-az="' + k + '" aria-pressed="' + (azState.belirti === k) + '">' + k + '</button>';
    }).join('') + '</div>';
    if(azState.belirti){
      var d = AZ_BELIRTI[azState.belirti];
      html += '<div class="az-box"><b>Olası sebepler</b>' + d.sebep.join(', ') + '.</div>';
      html += '<div class="az-box"><b>Ne yapmalı?</b>' + d.yap + '</div>';
    }
    html += '<p class="app-hub-sub" style="margin:10px 0 4px;">Can güvenliği tehlikedeyse önce 112\'yi ara. Bu bilgi genel yönlendirmedir, kesin teşhis için ustaya danış.</p>';
    html += '<button type="button" class="az-loc" id="azLoc">📍 Konumumu mesaja ekle</button>';
    var cities = (typeof CITIES !== 'undefined' ? CITIES : []);
    html += '<select id="azCity" class="az-loc" style="margin-top:0;"><option value="">Tüm şehirler</option>' + cities.map(function(c){
      return '<option' + (azState.city === c ? ' selected' : '') + '>' + c + '</option>';
    }).join('') + '</select>';
    var list = (typeof YARDIM_FIRMS !== 'undefined' ? YARDIM_FIRMS : []).filter(function(f){
      return !azState.city || f.city === azState.city;
    });
    if(!list.length){
      html += '<div class="az-box">Bu şehirde kayıtlı Yol Yardım firması şu an görünmüyor. Şehir seçimini değiştirmeyi dene.</div>';
    } else {
      var msg = 'Merhaba, yolda kaldım ve MotoGo üzerinden ulaşıyorum.' +
        (azState.belirti ? ' Sorun: ' + azState.belirti + '.' : '') +
        (azState.loc ? ' Konumum: ' + azState.loc : '');
      list.forEach(function(f){
        var tel = azPhone(f.phone), wa = azPhone(f.whatsapp);
        html += '<div class="az-firm"><b>' + f.name + '</b><small>' + (f.city || '') + ((f.categories || []).length ? ' · ' + f.categories.map(azLabel).join(', ') : '') + '</small><div class="az-btns">' +
          (tel ? '<a class="az-call" href="tel:+' + tel + '">Ara</a>' : '') +
          (wa ? '<a class="az-wa" target="_blank" rel="noopener" href="https://wa.me/' + wa + '?text=' + encodeURIComponent(msg) + '">WhatsApp</a>' : '') +
          '</div></div>';
      });
    }
    el.innerHTML = html;
    el.querySelectorAll('.az-chip').forEach(function(b){
      b.addEventListener('click', function(){ azState.belirti = (azState.belirti === b.getAttribute('data-az')) ? null : b.getAttribute('data-az'); renderAriza(el); });
    });
    var citySel = el.querySelector('#azCity');
    if(citySel) citySel.addEventListener('change', function(){ azState.city = citySel.value; renderAriza(el); });
    var locBtn = el.querySelector('#azLoc');
    if(locBtn) locBtn.addEventListener('click', function(){
      if(!navigator.geolocation){ locBtn.textContent = 'Bu cihaz konum vermiyor'; return; }
      locBtn.textContent = 'Konum alınıyor...';
      navigator.geolocation.getCurrentPosition(function(pos){
        azState.loc = 'https://maps.google.com/?q=' + pos.coords.latitude.toFixed(5) + ',' + pos.coords.longitude.toFixed(5);
        renderAriza(el);
        var b2 = el.querySelector('#azLoc'); if(b2) b2.textContent = '✅ Konum mesaja eklendi';
      }, function(){ locBtn.textContent = 'Konum izni verilmedi'; }, { enableHighAccuracy: true, timeout: 12000 });
    });
  }

  // ===== Yeni uygulamalar: ortak yardımcılar =====
  var WA_NUMARA = '905331509890';
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function uniqList(a){ return a.filter(function(v,i){ return v && a.indexOf(v) === i; }); }
  function lsGet(k, d){ try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch(e){ return d; } }
  function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }

  // Veri: firma profilleri ve haberler (tablo yoksa ya da boşsa boş durum gösterilir)
  var PROFILLER = [], HABERLER = [], VERI_HAZIR = false, VERI_BEKLEYEN = [];
  function veriYukle(cb){
    if(VERI_HAZIR){ cb(); return; }
    VERI_BEKLEYEN.push(cb);
    if(VERI_BEKLEYEN.length > 1) return;
    var bitir = function(){ VERI_HAZIR = true; var l = VERI_BEKLEYEN; VERI_BEKLEYEN = []; l.forEach(function(f){ f(); }); };
    var sb = window.motogoSupabase;
    if(!sb){ bitir(); return; }
    Promise.all([
      sb.from('uygulama_firmalari').select('*').eq('onayli', true).order('sira_no', { ascending: true }),
      sb.from('haberler').select('*').eq('yayinda', true).order('tarih', { ascending: false })
    ]).then(function(r){
      PROFILLER = (r[0] && r[0].data) || [];
      HABERLER = (r[1] && r[1].data) || [];
    }).catch(function(){}).then(bitir);
  }

  function bosDurum(ad){
    var msg = encodeURIComponent('Merhaba, MotoGo ' + ad + ' bölümünde firma olarak yer almak istiyorum.');
    return '<div class="as-empty"><div class="as-empty-ic">🏁</div><h4>Bu bölümde ilk firma siz olun</h4>' +
      '<p>' + esc(ad) + ' bölümüne henüz firma eklenmedi. MotoGo kullanıcılarına ilk görünen firma olmak için bize yazın.</p>' +
      '<a class="as-b p" target="_blank" rel="noopener" href="https://wa.me/' + WA_NUMARA + '?text=' + msg + '">Firma olarak yer almak istiyorum</a></div>';
  }

  function firmaKart(p){
    var tel = azPhone(p.telefon), wa = azPhone(p.whatsapp), feats = p.ozellikler || [];
    var harita = p.adres ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.adres + ' ' + (p.ilce || '') + ' ' + (p.il || '')) : '';
    var msg = encodeURIComponent('Merhaba, MotoGo üzerinden ulaşıyorum.');
    return '<div class="as-card"><div class="as-ct"><b>' + esc(p.ad) + '</b>' + (p.rozet ? '<span class="as-rozet">' + esc(p.rozet) + '</span>' : '') + '</div>' +
      '<div class="as-cm">' + esc(p.tur || '') + (p.il ? ((p.tur ? ' · ' : '') + esc(p.il) + (p.ilce ? ' / ' + esc(p.ilce) : '')) : '') + '</div>' +
      (feats.length ? '<div class="as-tags">' + feats.map(function(f){ return '<span>' + esc(f) + '</span>'; }).join('') + '</div>' : '') +
      (p.aciklama ? '<p class="as-desc">' + esc(p.aciklama) + '</p>' : '') +
      '<div class="as-btns">' +
        (tel ? '<a class="as-b p" href="tel:+' + tel + '">Ara</a>' : '') +
        (wa ? '<a class="as-b" target="_blank" rel="noopener" href="https://wa.me/' + wa + '?text=' + msg + '">WhatsApp</a>' : '') +
        (harita ? '<a class="as-b" target="_blank" rel="noopener" href="' + harita + '">Yol tarifi</a>' : '') +
      '</div></div>';
  }

  // ----- Firma profili uygulamaları (Konaklama, Sigorta, Ehliyet, Yakıt, Market, Mola Noktaları) -----
  var DIRS = {
    konaklama: { kat:'konaklama', ad:'Konaklama', turEtiket:'Tür', tur:['Otel','Butik Otel','Pansiyon','Bungalov','Kamp','Villa'],
                 oz:['Havuzlu','Kahvaltı dahil','Yarım pansiyon','Tam pansiyon','Denize yakın','Göl kenarı','Dağ ve yayla','Motor için kapalı park'], il:true },
    sigorta:   { kat:'sigorta', ad:'Sigorta', turEtiket:'Sigorta türü', tur:['Trafik Sigortası','Özel Sigorta'], il:false },
    ehliyet:   { kat:'ehliyet', ad:'Ehliyet', il:true, rehber:true },
    yakit:     { kat:'yakit', ad:'Yakıt', turEtiket:'İstasyon markası', turDinamik:true, il:true },
    market:    { kat:'market', ad:'Market', il:true },
    mola:      { kat:'mola', ad:'Mola Noktaları', turEtiket:'Tür', tur:['Kafe','Restoran'], il:true, park:'Motor için park yeri' }
  };
  var DS = {};
  function dsOf(k){ if(!DS[k]) DS[k] = { tur:'Tümü', oz:[], il:'Tümü', ilce:'Tümü', park:false }; return DS[k]; }
  function chipRow(opts, sel, key, multi){
    return '<div class="as-row">' + opts.map(function(o){
      var on = multi ? sel.indexOf(o) >= 0 : sel === o;
      return '<button type="button" class="as-chip" data-k="' + key + '" data-v="' + esc(o) + '" aria-pressed="' + on + '">' + esc(o) + '</button>';
    }).join('') + '</div>';
  }
  function selBox(label, key, opts, val){
    return '<div><label class="as-lab">' + label + '</label><select class="as-sel" data-s="' + key + '">' + opts.map(function(o){
      return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></div>';
  }
  function renderDir(key, el){
    el.innerHTML = '<p class="as-note">Yükleniyor...</p>';
    veriYukle(function(){
      var cfg = DIRS[key], st = dsOf(key);
      var all = PROFILLER.filter(function(p){ return p.kategori === cfg.kat; });
      var html = '';
      if(cfg.rehber) html += '<div class="as-card"><b>Motor ehliyeti rehberi</b><p class="as-desc" style="margin-top:6px">A1, A2 ve A sınıfları motorun hacmine ve gücüne göre ayrılır. Yaş ve koşullar için resmî kaynağı kontrol edin.</p></div>';
      var turler = cfg.tur || (cfg.turDinamik ? uniqList(all.map(function(p){ return p.tur; })) : null);
      html += '<div class="as-filters">';
      if(turler && turler.length) html += '<label class="as-lab">' + cfg.turEtiket + '</label>' + chipRow(['Tümü'].concat(turler), st.tur, 'tur', false);
      if(cfg.oz) html += '<label class="as-lab">Özellik</label>' + chipRow(cfg.oz, st.oz, 'oz', true);
      if(cfg.il){
        var ils = ['Tümü'].concat(uniqList(all.map(function(p){ return p.il; })));
        var ilces = ['Tümü'];
        if(st.il !== 'Tümü') ilces = ilces.concat(uniqList(all.filter(function(p){ return p.il === st.il; }).map(function(p){ return p.ilce; })));
        html += '<div class="as-two">' + selBox('İl', 'il', ils, st.il) + selBox('İlçe', 'ilce', ilces, st.ilce) + '</div>';
      }
      if(cfg.park) html += '<div class="as-row" style="margin-top:8px"><button type="button" class="as-chip" data-k="park" aria-pressed="' + st.park + '">' + cfg.park + '</button></div>';
      html += '</div>';
      var list = all.filter(function(p){
        if(turler && st.tur !== 'Tümü' && p.tur !== st.tur) return false;
        var f = p.ozellikler || [];
        for(var i = 0; i < st.oz.length; i++) if(f.indexOf(st.oz[i]) < 0) return false;
        if(cfg.il && st.il !== 'Tümü' && p.il !== st.il) return false;
        if(cfg.il && st.ilce !== 'Tümü' && p.ilce !== st.ilce) return false;
        if(cfg.park && st.park && f.indexOf(cfg.park) < 0) return false;
        return true;
      });
      html += all.length
        ? ('<p class="as-note">' + list.length + ' sonuç</p>' + (list.length ? list.map(firmaKart).join('') : '<div class="as-card">Bu filtrelerle sonuç yok. Bir filtreyi kaldırın.</div>'))
        : bosDurum(cfg.ad);
      el.innerHTML = html;
      el.querySelectorAll('[data-k]').forEach(function(b){
        b.addEventListener('click', function(){
          var k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
          if(k === 'tur') st.tur = v;
          else if(k === 'park') st.park = !st.park;
          else if(k === 'oz'){ var i = st.oz.indexOf(v); if(i >= 0) st.oz.splice(i, 1); else st.oz.push(v); }
          renderDir(key, el);
        });
      });
      el.querySelectorAll('select[data-s]').forEach(function(s){
        s.addEventListener('change', function(){
          if(s.getAttribute('data-s') === 'il'){ st.il = s.value; st.ilce = 'Tümü'; } else st.ilce = s.value;
          renderDir(key, el);
        });
      });
    });
  }

  // ----- Haber -----
  function renderHaber(el){
    el.innerHTML = '<p class="as-note">Yükleniyor...</p>';
    veriYukle(function(){
      if(!HABERLER.length){
        el.innerHTML = '<div class="as-empty"><div class="as-empty-ic">📰</div><h4>Henüz haber eklenmedi</h4><p>MotoGo haberleri, röportajlar ve rehber yazıları eklendikçe burada listelenir.</p></div>';
        return;
      }
      var acik = -1;
      function ciz(){
        el.innerHTML = HABERLER.map(function(h, i){
          var im = h.kapak_url ? ' style="background-image:url(\'' + encodeURI(h.kapak_url) + '\')"' : '';
          var ic = (i === acik && h.icerik) ? '<p style="margin-top:8px;color:#e8e8ea">' + esc(h.icerik).replace(/\n/g, '<br>') + '</p>' + (h.video_url ? '<p style="margin-top:8px"><a class="as-b p" target="_blank" rel="noopener" href="' + encodeURI(h.video_url) + '">Videoyu aç</a></p>' : '') : '';
          return '<div class="as-news"><div class="im"' + im + '>' + (h.kapak_url ? '' : '📰') + '</div><div class="tx"><small>' + esc(h.kategori || 'Haber') + '</small><h4>' + esc(h.baslik) + '</h4><p>' + esc(h.ozet || '') + '</p>' + ic +
            (h.icerik ? '<div class="as-btns" style="margin-top:8px"><button type="button" class="as-b" data-h="' + i + '">' + (i === acik ? 'Kapat' : 'Oku') + '</button></div>' : '') + '</div></div>';
        }).join('');
        el.querySelectorAll('[data-h]').forEach(function(b){
          b.addEventListener('click', function(){ var i = +b.getAttribute('data-h'); acik = (acik === i) ? -1 : i; ciz(); });
        });
      }
      ciz();
    });
  }

  // ----- MotoGo Card -----
  var cardTimer = 0;
  function stopCard(){ if(cardTimer){ clearInterval(cardTimer); cardTimer = 0; } }
  function newCode(){ var n = ''; for(var i = 0; i < 6; i++) n += Math.floor(Math.random() * 10); return n.slice(0, 3) + ' ' + n.slice(3); }
  function qrDraw(cv, code){
    if(!cv) return;
    var N = 25, sz = 8, x = cv.getContext('2d'), seed = 0;
    for(var i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) >>> 0;
    function rnd(){ seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967295; }
    x.fillStyle = '#fff'; x.fillRect(0, 0, N * sz, N * sz); x.fillStyle = '#111';
    for(var r = 0; r < N; r++) for(var c = 0; c < N; c++){
      var inF = (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
      if(inF) continue; if(rnd() > 0.52) x.fillRect(c * sz, r * sz, sz, sz);
    }
    [[0, 0], [0, N - 7], [N - 7, 0]].forEach(function(p){
      x.fillStyle = '#111'; x.fillRect(p[1] * sz, p[0] * sz, 7 * sz, 7 * sz);
      x.fillStyle = '#fff'; x.fillRect((p[1] + 1) * sz, (p[0] + 1) * sz, 5 * sz, 5 * sz);
      x.fillStyle = '#111'; x.fillRect((p[1] + 2) * sz, (p[0] + 2) * sz, 3 * sz, 3 * sz);
    });
  }
  function renderKart(el){
    stopCard();
    var p = lsGet('motogo_profilim', {});
    if(!p.adSoyad){
      el.innerHTML = '<div class="as-empty"><div class="as-empty-ic">💳</div><h4>Kartını oluştur</h4><p>MotoGo Card, Motorcu Profilini doldurunca oluşur. Profilinde adın ve telefon numaran yeterli.</p><button type="button" class="as-b p" id="kartProf">Profilimi doldur</button></div>';
      el.querySelector('#kartProf').addEventListener('click', function(){ closeScreen(); var b = document.getElementById('profilimNavBtn'); if(b) b.click(); });
      return;
    }
    var kod = newCode(), kalan = 30;
    var av = (typeof AVANTAJ_FIRMS !== 'undefined' ? AVANTAJ_FIRMS : []).slice(0, 5);
    el.innerHTML = '<div class="as-cardv"><div class="as-cv-nm">' + esc(p.adSoyad) + '</div><div class="as-cv-no">MotoGo Card' + (p.il ? ' · ' + esc(p.il) : '') + '</div>' +
      '<div class="as-qrw"><div class="as-qr"><canvas id="qr" width="200" height="200" style="width:176px;height:176px" aria-label="Kart kodu"></canvas></div></div>' +
      '<div class="as-code" id="kartKod">' + kod + '</div><div class="as-bar"><i id="kartBar" style="width:100%"></i></div>' +
      '<p class="as-note" style="text-align:center;margin:8px 0 0">Kod her 30 saniyede yenilenir.</p></div>' +
      '<p class="as-lab" style="margin-top:14px">Avantajlı firmalar</p>' +
      (av.length ? av.map(function(f){ return '<div class="as-card"><div class="as-ct"><b>' + esc(f.name) + '</b>' + (f.badge ? '<span class="as-rozet">' + esc(f.badge) + '</span>' : '') + '</div><div class="as-cm" style="margin-bottom:0">' + esc(f.title || f.category || '') + '</div></div>'; }).join('') : '<div class="as-card as-cm">Avantaj veren firmalar eklendikçe burada listelenir.</div>') +
      '<p class="as-note" style="margin-top:10px">Firmalarda okutma ve doğrulama, firma panelleri devreye alınınca açılır.</p>';
    qrDraw(el.querySelector('#qr'), kod);
    cardTimer = setInterval(function(){
      kalan--;
      if(kalan <= 0){ kalan = 30; kod = newCode(); var k = document.getElementById('kartKod'); if(k) k.textContent = kod; qrDraw(document.getElementById('qr'), kod); }
      var b = document.getElementById('kartBar'); if(b) b.style.width = (kalan / 30 * 100) + '%';
    }, 1000);
  }

  // ----- Rota İmaj -----
  var riTab = 'bugun';
  function renderGun(el){
    var tabs = [['bugun', 'Bugün Nereye'], ['surus', 'Sürüşlerim'], ['pas', 'Pasaport']];
    var html = '<div class="as-tabs">' + tabs.map(function(t){ return '<button type="button" data-t="' + t[0] + '" aria-pressed="' + (riTab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var list = lsGet('motogo_surusler', []), vis = lsGet('motogo_pasaport', []);
    if(riTab === 'bugun'){
      var r = (typeof ROTALAR !== 'undefined' ? ROTALAR : []);
      if(!r.length) html += '<div class="as-empty"><div class="as-empty-ic">🧭</div><h4>Bugünün önerisi hazırlanıyor</h4><p>Rota önerileri eklendikçe her gün biri burada öne çıkar.</p></div>';
      else {
        var pick = r[new Date().getDate() % r.length];
        html += '<div class="as-card"><p class="as-lab" style="margin-top:0">Bugünün rota önerisi</p><div class="as-ct"><b>' + esc(pick.ad) + '</b>' + (pick.bolge ? '<span class="as-rozet">' + esc(pick.bolge) + '</span>' : '') + '</div>' +
          (pick.not_ ? '<p class="as-desc" style="margin-top:6px">' + esc(pick.not_) + '</p>' : '') +
          '<div class="as-btns"><a class="as-b p" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(pick.q || pick.ad) + '">Haritada aç</a></div></div>';
      }
    } else if(riTab === 'surus'){
      var toplam = list.reduce(function(s, x){ return s + (+x.km || 0); }, 0);
      html += '<div class="as-card"><b>Yeni sürüş</b><div class="as-two" style="margin:8px 0"><input class="as-inp" id="rsNe" placeholder="Nereden" maxlength="40"><input class="as-inp" id="rsNa" placeholder="Nereye" maxlength="40"></div>' +
        '<input class="as-inp" id="rsKm" type="number" inputmode="numeric" placeholder="Kilometre (isteğe bağlı)" min="0" max="5000"><button type="button" class="as-b p" id="rsEkle" style="width:100%;margin-top:8px">Sürüşü kaydet</button></div>' +
        '<p class="as-note">' + list.length + ' sürüş, ' + toplam + ' km. Kayıtlar yalnızca bu telefonda saklanır.</p>';
      for(var i = list.length - 1; i >= 0; i--){
        html += '<div class="as-card"><div class="as-ct"><b>' + esc(list[i].ne) + ' - ' + esc(list[i].na) + '</b>' + (list[i].km ? '<span class="as-rozet">' + esc(list[i].km) + ' km</span>' : '') + '</div><div class="as-btns" style="margin-top:6px"><button type="button" class="as-b" data-del="' + i + '">Sil</button></div></div>';
      }
      html += '<p class="as-note" style="margin-top:12px">Rota videosu (harita, fotoğraf ve müzikle) harita lisansı netleşince bu bölüme eklenecek.</p>';
    } else {
      var cells = ''; for(var n = 1; n <= 81; n++) cells += '<button type="button" data-p="' + n + '" aria-pressed="' + (vis.indexOf(n) >= 0) + '">' + (n < 10 ? '0' + n : n) + '</button>';
      html += '<div class="as-card"><b>Motor pasaportum</b><p class="as-cm" style="margin:2px 0 0">' + vis.length + ' / 81 il</p><div class="as-pas">' + cells + '</div><p class="as-note" style="margin:0">Gittiğin ilin plaka koduna dokun, işaretlenir.</p></div>';
    }
    el.innerHTML = html;
    el.querySelectorAll('[data-t]').forEach(function(b){ b.addEventListener('click', function(){ riTab = b.getAttribute('data-t'); renderGun(el); }); });
    var ek = el.querySelector('#rsEkle');
    if(ek) ek.addEventListener('click', function(){
      var ne = el.querySelector('#rsNe').value.trim(), na = el.querySelector('#rsNa').value.trim(), km = el.querySelector('#rsKm').value.trim();
      if(!ne || !na){ ek.textContent = 'Nereden ve nereye yaz'; return; }
      list.push({ ne: ne, na: na, km: km, t: Date.now() }); lsSet('motogo_surusler', list); renderGun(el);
    });
    el.querySelectorAll('[data-del]').forEach(function(b){ b.addEventListener('click', function(){ list.splice(+b.getAttribute('data-del'), 1); lsSet('motogo_surusler', list); renderGun(el); }); });
    el.querySelectorAll('[data-p]').forEach(function(b){
      b.addEventListener('click', function(){ var n = +b.getAttribute('data-p'), i = vis.indexOf(n); if(i >= 0) vis.splice(i, 1); else vis.push(n); lsSet('motogo_pasaport', vis); renderGun(el); });
    });
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

  function cleanTelefonProfil(raw) {
    if (!raw) return '';
    let digits = raw.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) digits = '90' + digits.slice(1);
    if (!digits.startsWith('90') && digits.length === 10) digits = '90' + digits;
    return digits;
  }

  document.getElementById('profGetirBtn').addEventListener('click', async () => {
    const getirDurum = document.getElementById('profGetirDurum');
    const rawTel = document.getElementById('profSorguTel').value.trim();
    if (!rawTel) {
      getirDurum.textContent = '⚠️ Lütfen telefon numaranızı yazın.';
      getirDurum.style.color = '#f09595';
      return;
    }
    if (!window.motogoSupabase) {
      getirDurum.textContent = '⚠️ Şu an bağlantı kurulamadı, tekrar deneyin.';
      getirDurum.style.color = '#f09595';
      return;
    }
    getirDurum.textContent = 'Aranıyor...';
    getirDurum.style.color = '#9a9aa2';
    const cleanTel = cleanTelefonProfil(rawTel);
    const { data, error } = await window.motogoSupabase.rpc('profilimi_getir', { p_telefon: cleanTel });
    if (error || !data || data.length === 0) {
      getirDurum.textContent = '⚠️ Bu numarayla kayıtlı bir profil bulunamadı.';
      getirDurum.style.color = '#f09595';
      return;
    }
    const rec = data[0];
    document.getElementById('profAdSoyad').value = rec.ad_soyad || '';
    document.getElementById('profTelefon').value = rec.telefon || '';
    document.getElementById('profEmail').value = rec.email || '';
    document.getElementById('profKanGrubu').value = rec.kan_grubu || '';
    ilSelect.value = rec.il || '';
    getirDurum.textContent = '✅ Profiliniz getirildi.';
    getirDurum.style.color = '#9ad19a';
    checkReady();
  });

  function loadProfil() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem('motogo_profilim') || '{}'); } catch(e){}
    document.getElementById('profAdSoyad').value = p.adSoyad || '';
    document.getElementById('profTelefon').value = p.telefon || '';
    document.getElementById('profEmail').value = p.email || '';
    document.getElementById('profKanGrubu').value = p.kanGrubu || '';
    ilSelect.value = p.il || '';
    document.getElementById('profOnay').checked = false;
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
    const onay = document.getElementById('profOnay').checked;
    if (!adSoyad || !telefon) {
      durum.textContent = '⚠️ Ad Soyad ve Telefon zorunludur.';
      durum.style.color = '#f09595';
      return;
    }
    if (!onay) {
      durum.textContent = '⚠️ Devam etmek için üyelik formunu onaylamanız gerekiyor.';
      durum.style.color = '#f09595';
      return;
    }
    const p = {
      adSoyad,
      telefon: cleanTelefonProfil(telefon) || telefon,
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

// ===========================================================================
// MotoGo Shorts — dikey, kaydırmalı video akışı
// ===========================================================================
(function initShorts() {
  const openBtn = document.getElementById('shortsOpenBtn');
  const closeBtn = document.getElementById('shortsCloseBtn');
  const overlay = document.getElementById('shortsOverlay');
  const feed = document.getElementById('shortsFeed');
  if (!openBtn) return;

  const ICON_HEART = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
  const ICON_SAVE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>';
  const ICON_SHARE = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>';
  const ICON_DOTS = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
  const ICON_PLAY = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const ICON_MUTE_HINT = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M19 9a5 5 0 0 1 0 6M22 6a9 9 0 0 1 0 12" stroke-linecap="round"/></svg>';

  let ALL_SHORTS = [];
  let players = {}; // id -> YT.Player
  let soundOn = false; // kullanıcı bir kere sesi açınca, true kalır, yeni videolara da uygulanır
  let ytApiReady = false;
  let ytApiLoading = false;
  let pendingPlayerSetup = false;

  function shuffleShorts(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let liked = {};
  let saved = {};
  try { liked = JSON.parse(localStorage.getItem('motogo_shorts_liked') || '{}'); } catch(e){}
  try { saved = JSON.parse(localStorage.getItem('motogo_shorts_saved') || '{}'); } catch(e){}

  function loadYouTubeApi() {
    if (ytApiReady || ytApiLoading) return;
    ytApiLoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = function () {
      ytApiReady = true;
      if (pendingPlayerSetup) setupPlayers();
    };
  }

  function openShorts() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (location.hash !== '#shorts') history.pushState(null, '', '#shorts');
  }

  function closeShorts() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    Object.values(players).forEach(p => { try { p.pauseVideo(); } catch(e){} });
    if (location.hash === '#shorts') history.back();
  }

  openBtn.addEventListener('click', async () => {
    openShorts();
    if (ALL_SHORTS.length === 0) {
      await loadShortsVideos();
    } else {
      ALL_SHORTS = shuffleShorts(ALL_SHORTS);
      renderShortsFeed();
    }
  });

  closeBtn.addEventListener('click', closeShorts);

  window.addEventListener('popstate', () => {
    if (location.hash !== '#shorts' && overlay.classList.contains('open')) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      Object.values(players).forEach(p => { try { p.pauseVideo(); } catch(e){} });
    }
  });

  // Sayfa #shorts ile açıldıysa (yenileme sonrası), otomatik aç
  if (location.hash === '#shorts') {
    openShorts();
    loadShortsVideos();
  }

  async function loadShortsVideos() {
    feed.innerHTML = '<div class="shorts-item"><p style="color:#fff;">Yükleniyor...</p></div>';
    if (!window.motogoSupabase) return;
    try {
      const { data, error } = await window.motogoSupabase
        .from('shorts_videolar')
        .select('*')
        .order('sira_no', { ascending: true, nullsFirst: false });
      if (error || !data || data.length === 0) {
        feed.innerHTML = '<div class="shorts-item"><p style="color:#fff;">Henüz video eklenmedi.</p></div>';
        return;
      }
      ALL_SHORTS = shuffleShorts(data);
      renderShortsFeed();
    } catch (e) {
      feed.innerHTML = '<div class="shorts-item"><p style="color:#fff;">Yüklenemedi.</p></div>';
    }
  }

  function renderShortsFeed() {
    players = {};
    feed.innerHTML = ALL_SHORTS.map((v, i) => `
      <div class="shorts-item" data-id="${v.id}" data-yt="${v.youtube_id}">
        <div class="yt-target" id="ytplayer-${i}"></div>
        <div class="shorts-tap-layer"><div class="mute-hint">${ICON_MUTE_HINT}</div></div>
        <div class="shorts-actions">
          <button type="button" class="shorts-action-btn like-btn${liked[v.id] ? ' liked' : ''}">${ICON_HEART}<span class="like-count">${v.begeni_sayisi || 0}</span></button>
          <button type="button" class="shorts-action-btn save-btn${saved[v.id] ? ' saved' : ''}">${ICON_SAVE}<span>Kaydet</span></button>
          <button type="button" class="shorts-action-btn share-btn">${ICON_SHARE}<span>Paylaş</span></button>
          <button type="button" class="shorts-action-btn dots-btn">${ICON_DOTS}</button>
          <div class="shorts-dots-menu"><a href="https://motogo.com.tr/prime/" target="_blank">🏍️ MotoGo Prime'a Git</a></div>
        </div>
        <div class="shorts-info"><span class="shorts-info-icon">${ICON_PLAY}</span><p>${v.baslik || 'MotoGo Shorts'}</p></div>
      </div>
    `).join('');

    bindShortsActions();

    pendingPlayerSetup = true;
    if (!ytApiReady) {
      loadYouTubeApi();
    } else {
      setupPlayers();
    }
  }

  function setupPlayers() {
    pendingPlayerSetup = false;
    ALL_SHORTS.forEach((v, i) => {
      const target = document.getElementById(`ytplayer-${i}`);
      if (!target) return;
      const player = new YT.Player(`ytplayer-${i}`, {
        videoId: v.youtube_id,
        playerVars: {
          mute: 1, loop: 1, playlist: v.youtube_id, controls: 0,
          playsinline: 1, modestbranding: 1, rel: 0, iv_load_policy: 3, fs: 0
        },
        events: {
          onReady: (e) => {
            players[v.id] = e.target;
            if (soundOn) { e.target.unMute(); } else { e.target.mute(); }
            if (i === 0) { try { e.target.playVideo(); } catch(err){} }
          }
        }
      });
    });

    // Görünür olan videoyu oynat, diğerlerini durdur
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.dataset.id;
        const p = players[id];
        if (!p || typeof p.playVideo !== 'function') return;
        if (entry.isIntersecting) {
          try { p.playVideo(); } catch(e){}
        } else {
          try { p.pauseVideo(); } catch(e){}
        }
      });
    }, { threshold: 0.6 });
    feed.querySelectorAll('.shorts-item').forEach(item => io.observe(item));
  }

  function bindShortsActions() {
    feed.querySelectorAll('.shorts-tap-layer').forEach(layer => {
      layer.addEventListener('click', () => {
        const item = layer.closest('.shorts-item');
        const id = item.dataset.id;
        const p = players[id];
        if (!p) return;
        soundOn = !soundOn;
        // Tercihi, o an yüklü olan TÜM videolara uygula (sadece tıklanana değil)
        Object.values(players).forEach(pl => {
          try { if (soundOn) pl.unMute(); else pl.mute(); } catch(e){}
        });
        layer.querySelector('.mute-hint').classList.add('show');
        clearTimeout(layer._hintTimer);
        layer._hintTimer = setTimeout(() => layer.querySelector('.mute-hint').classList.remove('show'), 600);
      });
    });

    feed.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const item = btn.closest('.shorts-item');
        const id = item.dataset.id;
        if (liked[id]) return;
        liked[id] = true;
        localStorage.setItem('motogo_shorts_liked', JSON.stringify(liked));
        btn.classList.add('liked');
        const countEl = btn.querySelector('.like-count');
        countEl.textContent = (parseInt(countEl.textContent, 10) || 0) + 1;
        if (window.motogoSupabase) {
          window.motogoSupabase.rpc('shorts_begen', { p_id: id }).catch(()=>{});
        }
      });
    });

    feed.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = btn.closest('.shorts-item');
        const id = item.dataset.id;
        saved[id] = !saved[id];
        localStorage.setItem('motogo_shorts_saved', JSON.stringify(saved));
        btn.classList.toggle('saved', !!saved[id]);
      });
    });

    feed.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const item = btn.closest('.shorts-item');
        const ytId = item.dataset.yt;
        const url = `https://youtu.be/${ytId}`;
        if (navigator.share) {
          try { await navigator.share({ title: 'MotoGo Shorts', url }); } catch(e){}
        } else {
          try { await navigator.clipboard.writeText(url); alert('Link kopyalandı'); } catch(e){}
        }
      });
    });

    feed.querySelectorAll('.dots-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = btn.nextElementSibling;
        const isOpen = menu.classList.contains('show');
        feed.querySelectorAll('.shorts-dots-menu').forEach(m => m.classList.remove('show'));
        if (!isOpen) menu.classList.add('show');
      });
    });
  }
})();
