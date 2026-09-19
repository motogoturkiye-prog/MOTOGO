// ============================================================================
// MotoGo — Marka Arama Motoru (tek sayfa, hiçbir yere zıplamadan)
// ============================================================================

const brandInput = document.getElementById('brandInput');
const blinkCursor = document.getElementById('blinkCursor');
const brandSuggestions = document.getElementById('brandSuggestions');
const brandInfoBox = document.getElementById('brandInfo');
const subcatGrid = document.getElementById('subcatGrid');
const cityField = document.getElementById('cityField');
const citySelect = document.getElementById('citySelect');
const showResultsBtn = document.getElementById('showResultsBtn');
const resultsSection = document.getElementById('results');
const resultsList = document.getElementById('resultsList');
const yardimSection = document.getElementById('yardimSection');
const yardimCatGrid = document.getElementById('yardimCatGrid');
const yardimResults = document.getElementById('yardimResults');

let currentBrand = null;
let currentSubcat = null;
let yardimActive = false;
let selectedYardimCat = null;
let userCoords = null;

// Şehirleri doldur
CITIES.forEach(c => {
  const opt = document.createElement('option');
  opt.textContent = c;
  citySelect.appendChild(opt);
});

// ---------------------------------------------------------------------------
// Kategori satırı — Servis / Bayi / Yedek Parça / Aksesuar / Kiralık Motor /
// Yol Yardım — hepsi tek satırda; Yol Yardım'a basınca altına Çekici/Lastik/
// Akü-Marş/Genel Arıza açılır (sayfa zıplamadan, doğal akışla)
// ---------------------------------------------------------------------------
renderSubcatGrid();
function renderSubcatGrid() {
  subcatGrid.innerHTML = "";

  SUBCATS.forEach(sc => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'subcat-chip' + (!yardimActive && currentSubcat && currentSubcat.key === sc.key ? ' subcat-chip-active' : '');
    btn.textContent = sc.label;
    btn.addEventListener('click', () => {
      yardimActive = false;
      currentSubcat = sc;
      renderSubcatGrid();
      cityField.style.display = 'block';
      showResultsBtn.style.display = 'block';
      yardimSection.style.display = 'none';
    });
    subcatGrid.appendChild(btn);
  });

  const yardimBtn = document.createElement('button');
  yardimBtn.type = 'button';
  yardimBtn.className = 'subcat-chip subcat-chip-yardim' + (yardimActive ? ' subcat-chip-active' : '');
  yardimBtn.textContent = 'Yol Yardım';
  yardimBtn.addEventListener('click', () => {
    yardimActive = true;
    currentSubcat = null;
    renderSubcatGrid();
    cityField.style.display = 'none';
    showResultsBtn.style.display = 'none';
    resultsSection.style.display = 'none';
    yardimSection.style.display = 'block';
    renderYardimCategories();
  });
  subcatGrid.appendChild(yardimBtn);
}

function renderYardimCategories() {
  yardimCatGrid.innerHTML = '';
  YARDIM_CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'subcat-chip' + (selectedYardimCat === cat.id ? ' subcat-chip-active' : '');
    btn.textContent = `${cat.icon} ${cat.label}`;
    btn.addEventListener('click', () => {
      selectedYardimCat = cat.id;
      renderYardimCategories();
      renderYardimResults();
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
  brandInfoBox.style.display = 'none';
  brandInput.classList.remove('brand-selected');
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

function selectBrand(brand) {
  currentBrand = brand;
  brandInput.value = brand.name;
  brandInput.classList.add('brand-selected');
  updateCursorPosition();
  brandSuggestions.innerHTML = "";
  brandSuggestions.style.display = 'none';

  brandInfoBox.textContent = brand.info && brand.info.trim()
    ? brand.info
    : "Bu marka hakkında bilgi yakında eklenecek.";
  brandInfoBox.style.display = 'block';
}

// ---------------------------------------------------------------------------
// Sonuçları göster (Servis / Bayi / Yedek Parça / Aksesuar)
// ---------------------------------------------------------------------------
const SOCIAL_ICONS = [
  { key: 'instagram', title: 'Instagram', svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c2.7 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.5.5.9 1.1 1.15 1.76.25.64.42 1.37.47 2.43.05 1.06.06 1.42.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43-.26.66-.6 1.21-1.15 1.76-.5.5-1.1.9-1.76 1.15-.64.25-1.37.42-2.43.47-1.06.05-1.42.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47-.66-.26-1.21-.6-1.76-1.15-.5-.5-.9-1.1-1.15-1.76-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.7 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76.5-.5 1.1-.9 1.76-1.15.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.3 2 12 2zm0 1.8c-2.65 0-2.99.01-4.04.06-.9.04-1.4.19-1.72.32-.43.17-.74.37-1.06.7-.32.32-.52.63-.7 1.06-.13.32-.28.82-.32 1.72C4.11 9.01 4.1 9.35 4.1 12s.01 2.99.06 4.04c.04.9.19 1.4.32 1.72.17.43.37.74.7 1.06.32.32.63.52 1.06.7.32.13.82.28 1.72.32 1.05.05 1.39.06 4.04.06s2.99-.01 4.04-.06c.9-.04 1.4-.19 1.72-.32.43-.17.74-.37 1.06-.7.32-.32.52-.63.7-1.06.13-.32.28-.82.32-1.72.05-1.05.06-1.39.06-4.04s-.01-2.99-.06-4.04c-.04-.9-.19-1.4-.32-1.72-.17-.43-.37-.74-.7-1.06-.32-.32-.63-.52-1.06-.7-.32-.13-.82-.28-1.72-.32C14.99 3.81 14.65 3.8 12 3.8zm0 3.05a5.15 5.15 0 1 1 0 10.3 5.15 5.15 0 0 1 0-10.3zm0 1.8a3.35 3.35 0 1 0 0 6.7 3.35 3.35 0 0 0 0-6.7zm5.35-1.98a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>` },
  { key: 'youtube', title: 'YouTube', svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.5 12 3.5 12 3.5s-7.51 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14C4.49 20.5 12 20.5 12 20.5s7.51 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z"/></svg>` },
  { key: 'website', title: 'Web Sitesi', svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.93 9h-3.4a15.6 15.6 0 0 0-1.3-5.7A8.03 8.03 0 0 1 19.93 11zM12 4.06c.9 1.16 1.95 3.1 2.4 6.94H9.6c.45-3.84 1.5-5.78 2.4-6.94zM9.6 13h4.8c-.45 3.84-1.5 5.78-2.4 6.94-.9-1.16-1.95-3.1-2.4-6.94zm-1.83-2H4.07a8.03 8.03 0 0 1 4.7-5.7A15.6 15.6 0 0 0 7.47 11zm0 2a15.6 15.6 0 0 0 1.3 5.7A8.03 8.03 0 0 1 4.07 13h3.4zm9.06 5.7a15.6 15.6 0 0 0 1.3-5.7h3.4a8.03 8.03 0 0 1-4.7 5.7z"/></svg>` }
];

showResultsBtn.addEventListener('click', () => {
  if (!currentBrand) { alert("Lütfen motosiklet markanızı yazıp listeden seçin."); brandInput.focus(); return; }
  if (!currentSubcat) { alert("Lütfen ne aradığınızı (Servis / Bayi / Yedek Parça / Aksesuar) seçin."); return; }
  const city = citySelect.value;
  if (!city) { alert("Lütfen şehrinizi seçin."); return; }

  const dataKey = `${currentBrand.key}_${currentSubcat.key}`;
  const firms = (BRAND_FIRMS[dataKey] || [])
    .filter(f => !f.city || f.city === city)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  resultsList.innerHTML = "";

  const title = document.createElement('h3');
  title.className = 'cat-group-title';
  title.textContent = firms.length > 0
    ? `${currentBrand.name} — ${currentSubcat.label} (${city})`
    : `${currentBrand.name} — ${currentSubcat.label} — Henüz Firma Yok`;
  resultsList.appendChild(title);

  if (firms.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = "Bu markada, bu hizmette sistemde henüz üye firma yok — yakında eklenecek.";
    resultsList.appendChild(empty);
  } else {
    firms.forEach(firm => {
      const socialLinks = SOCIAL_ICONS.map(s => {
        if (firm[s.key]) {
          return `<a class="social-btn" href="${firm[s.key]}" target="_blank" title="${s.title}">${s.svg}</a>`;
        }
        return `<span class="social-btn social-btn-disabled" title="${s.title} bağlantısı yok">${s.svg}</span>`;
      }).join('');

      const waMsg = encodeURIComponent(
        `Merhaba, size MotoGo üzerinden ulaşıyorum. ${currentBrand.name} — ${currentSubcat.label} için bilgi almak istiyorum.`
      );

      const card = document.createElement('div');
      card.className = 'firm-card';
      card.innerHTML = `
        <div class="firm-info">
          <p class="firm-name">${firm.name}${firm.district ? ' - ' + firm.district : ''}</p>
          <p class="firm-meta">${firm.city || ""}</p>
          <button type="button" class="incele-btn">İncele</button>
          <div class="firm-social-panel">${socialLinks}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <a class="firm-whatsapp" href="https://wa.me/${firm.whatsapp}?text=${waMsg}" target="_blank">WhatsApp'tan Ulaş</a>
          ${firm.phone ? `<a class="firm-whatsapp" style="background:var(--panel);border:1px solid var(--line);" href="tel:${firm.phone}">📞 Ara</a>` : ''}
        </div>
      `;
      card.querySelector('.incele-btn').addEventListener('click', (e) => {
        e.currentTarget.nextElementSibling.classList.toggle('open');
      });
      resultsList.appendChild(card);
    });
  }

  resultsSection.style.display = 'block';
});

// ============================================================================
// MotoGo Yol Yardım — aynı sayfada, subcat satırının hemen altında açılır
// ============================================================================

function distanceKmYardim(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180, lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function yardimFirmsForCategory(catId) {
  return YARDIM_FIRMS.filter(f => f.categories.includes(catId));
}

function yardimSortedByDistance(list) {
  const alphabetical = [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  if (!userCoords) return alphabetical;
  return alphabetical.sort((a, b) => distanceKmYardim(userCoords, a) - distanceKmYardim(userCoords, b));
}

function yardimWaLink(firm, withLocation) {
  const cat = YARDIM_CATEGORIES.find(c => c.id === selectedYardimCat);
  let msg = `Merhaba, MotoGo Yol Yardım üzerinden yazıyorum.\nArıza türü: ${cat ? cat.label : ''}`;
  if (withLocation && userCoords) {
    msg += `\nKonumum: https://maps.google.com/?q=${userCoords.lat},${userCoords.lng}`;
  }
  msg += `\nYardımınızı rica ederim.`;
  return `https://wa.me/${firm.whatsapp}?text=${encodeURIComponent(msg)}`;
}

function renderYardimResults() {
  const cat = YARDIM_CATEGORIES.find(c => c.id === selectedYardimCat);
  const list = yardimSortedByDistance(yardimFirmsForCategory(selectedYardimCat));

  let html = `<p class="field-title" style="margin-top:20px;">${cat.label} hizmeti veren firmalar</p>`;

  if (list.length === 0) {
    html += `<div class="empty-state">Bu kategori için henüz üye firma yok.</div>`;
  } else {
    list.forEach(f => {
      const dist = (userCoords) ? `${distanceKmYardim(userCoords, f).toFixed(1)} km · ` : '';
      const district = (f.region || '').split(',')[0].trim();
      html += `
        <div class="firm-card">
          <div class="firm-info">
            <p class="firm-name">${f.name}${district ? ' - ' + district : ''}</p>
            <p class="firm-meta">${dist}${f.region}</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <a class="firm-whatsapp" href="${yardimWaLink(f, false)}" target="_blank">WhatsApp'tan Ulaş</a>
            ${f.phone ? `<a class="firm-whatsapp" style="background:var(--panel);border:1px solid var(--line);" href="tel:${f.phone}">📞 Ara</a>` : ''}
          </div>
        </div>`;
    });
    html += `<button type="button" class="cta-btn" id="yardimLocationBtn">📍 Konumumu Paylaş ve En Yakına Ulaş</button>`;
  }

  yardimResults.innerHTML = html;

  const locBtn = document.getElementById('yardimLocationBtn');
  if (locBtn) {
    locBtn.addEventListener('click', () => {
      if (!navigator.geolocation) { alert("Tarayıcınız konum paylaşımını desteklemiyor."); return; }
      locBtn.disabled = true;
      locBtn.textContent = '📍 Konum alınıyor...';
      navigator.geolocation.getCurrentPosition(
        pos => {
          userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          renderYardimResults();
          const nearest = yardimSortedByDistance(yardimFirmsForCategory(selectedYardimCat))[0];
          if (nearest) window.open(yardimWaLink(nearest, true), '_blank');
        },
        () => {
          locBtn.disabled = false;
          locBtn.textContent = '📍 Konumumu Paylaş ve En Yakına Ulaş';
          alert("Konum izni verilmedi. Listeden bir firmaya doğrudan WhatsApp'tan ya da telefonla ulaşabilirsiniz.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
}

// ---------------------------------------------------------------------------
// Alt menü — Kılavuz (MotoGo Sözlük araması) şimdilik hazır değil
// ---------------------------------------------------------------------------
const kilavuzNavBtn = document.getElementById('kilavuzNavBtn');
if (kilavuzNavBtn) {
  kilavuzNavBtn.addEventListener('click', (e) => {
    e.preventDefault();
    alert("MotoGo Sözlük arama motoru yakında burada olacak.");
  });
}
