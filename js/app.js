// ============================================================================
// MotoGo — Marka Arama Motoru (tek sayfa, hiçbir yere zıplamadan)
// ============================================================================

// Supabase'den canlı veri çekme — sayfa yüklenir yüklenmez arka planda başlar
(async function loadMotoGoData(){
  if (!window.motogoSupabase) return;
  const sb = window.motogoSupabase;

  try {
    const { data: firmalar } = await sb.from('firmalar').select('*');
    if (firmalar) {
      const grouped = {};
      firmalar.forEach(r => {
        const key = `${r.marka}_${r.kategori}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          name: r.ad, whatsapp: r.whatsapp, phone: r.telefon,
          city: r.sehir, district: r.ilce, instagram: r.instagram,
          website: r.website, description: r.aciklama
        });
      });
      BRAND_FIRMS = grouped;
    }

    const { data: kiralik } = await sb.from('kiralik_firmalar').select('*');
    if (kiralik) {
      KIRALIK_FIRMS = kiralik.map(r => ({
        name: r.ad, city: r.sehir, district: r.ilce, whatsapp: r.whatsapp,
        phone: r.telefon, instagram: r.instagram, description: r.aciklama
      }));
    }

    const { data: avantaj } = await sb.from('avantaj_kampanyalar').select('*');
    if (avantaj) {
      AVANTAJ_FIRMS = avantaj.map(r => ({
        name: r.firma_adi, category: r.kategori, city: r.sehir, badge: r.rozet,
        title: r.baslik, description: r.aciklama, bonus: r.odul,
        whatsapp: r.whatsapp, phone: r.telefon
      }));
    }

    const { data: yardim } = await sb.from('yardim_firmalari').select('*');
    if (yardim) {
      YARDIM_FIRMS = yardim.map(r => ({
        name: r.ad, region: r.bolge_metni, city: r.sehir,
        phone: r.telefon, whatsapp: r.whatsapp, lat: r.lat, lng: r.lng,
        categories: r.kategoriler || [], website: r.website, instagram: r.instagram
      }));
    }

    const { data: kilavuz } = await sb.from('motor_kilavuzu').select('*');
    if (kilavuz) {
      kilavuz.forEach(r => {
        const brand = BRANDS.find(b => b.key === r.marka);
        if (brand) brand.info = r.bilgi;
      });
    }
  } catch (e) {
    console.warn('MotoGo verisi yüklenemedi, site boş veriyle çalışıyor:', e);
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
    const card = document.createElement('div');
    card.className = 'avantaj-card';
    const waMsg = firm.whatsapp ? encodeURIComponent(
      `Merhaba, size MotoGo üzerinden ulaşıyorum. "${firm.title}" kampanyanız hakkında bilgi almak istiyorum.`
    ) : '';
    card.innerHTML = `
      <div class="avantaj-card-head">
        <div>
          <p class="avantaj-card-name">${firm.name}</p>
          ${firm.category ? `<span class="avantaj-card-cat">${firm.category}</span>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          ${firm.badge ? `<span class="avantaj-card-badge">${firm.badge}</span>` : ''}
          ${firm.whatsapp ? `<a class="firm-whatsapp" href="https://wa.me/${firm.whatsapp}?text=${waMsg}" target="_blank">WhatsApp'tan Ulaş</a>` : ''}
        </div>
      </div>
      <p class="avantaj-card-title">${firm.title}</p>
      ${firm.description ? `<p class="avantaj-card-desc">${firm.description}</p>` : ''}
      ${firm.bonus ? `<p class="avantaj-card-bonus">🎁 ${firm.bonus}</p>` : ''}
    `;
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

      const panelContent = `
        ${firm.photo ? `<img class="firm-panel-photo" src="${firm.photo}" alt="${firm.name}">` : ''}
        <div class="firm-social-icons">${socialLinks}</div>
      `;

      const subtitle = firm.district ? firm.district : (firm.region || "");
      const distText = (coords && firm.lat != null) ? `${distanceKm(coords, firm).toFixed(1)} km · ` : '';

      const card = document.createElement('div');
      card.className = 'firm-card';
      card.innerHTML = `
        <div class="firm-info">
          <p class="firm-name">${firm.name}${subtitle ? ' - ' + subtitle : ''}</p>
          <p class="firm-meta">${distText}${firm.city || ""}</p>
          <button type="button" class="incele-btn">İncele</button>
          <div class="firm-social-panel">${panelContent}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <a class="firm-whatsapp" href="https://wa.me/${firm.whatsapp}?text=${waMsg}" target="_blank">WhatsApp'tan Ulaş</a>
          ${firm.phone ? `<a class="firm-whatsapp" style="background:var(--panel);border:1px solid var(--line);" href="tel:${firm.phone}">📞 Ara</a>` : ''}
          ${showLocationBtn ? `<button type="button" class="firm-whatsapp firm-loc-btn" style="background:var(--panel);border:1px solid var(--line);cursor:pointer;font-family:inherit;" data-whatsapp="${firm.whatsapp}" data-purpose="${waPurpose}">📍 Konumumu Paylaş</button>` : ''}
        </div>
      `;
      card.querySelector('.incele-btn').addEventListener('click', (e) => {
        e.currentTarget.nextElementSibling.classList.toggle('open');
      });
      const locBtn = card.querySelector('.firm-loc-btn');
      if (locBtn) {
        locBtn.addEventListener('click', () => {
          if (!navigator.geolocation) { alert("Tarayıcınız konum paylaşmayı desteklemiyor."); return; }
          locBtn.textContent = "Konum alınıyor...";
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const loc = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
              const msg = encodeURIComponent(
                `Merhaba, size MotoGo üzerinden ulaşıyorum. ${locBtn.dataset.purpose} için yardıma ihtiyacım var.\nKonumum: ${loc}`
              );
              window.open(`https://wa.me/${locBtn.dataset.whatsapp}?text=${msg}`, '_blank');
              locBtn.textContent = "📍 Konumumu Paylaş";
            },
            () => {
              alert("Konum izni verilmedi.");
              locBtn.textContent = "📍 Konumumu Paylaş";
            }
          );
        });
      }
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
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    const baseTitle = `Yol Yardım — ${currentSubcat.label}`;
    const emptyText = "Bu şehirde, bu Yol Yardım hizmetinde sistemde henüz üye firma yok — yakında eklenecek.";
    const waPurpose = `Yol Yardım — ${currentSubcat.label}`;
    renderFirmResults(firms, baseTitle, city, emptyText, waPurpose, null, true);
  } else if (currentSubcat.brandFree) {
    if (currentSubcat.key === 'avantaj') {
      const firms = AVANTAJ_FIRMS
        .filter(f => f.city === city)
        .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      renderAvantajResults(firms, city);
      return;
    }
    const firms = KIRALIK_FIRMS
      .filter(f => f.city === city)
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    const baseTitle = currentSubcat.label;
    const emptyText = "Bu şehirde henüz üye kiralık motor firması yok — yakında eklenecek.";
    const waPurpose = currentSubcat.label;
    renderFirmResults(firms, baseTitle, city, emptyText, waPurpose, null);
  } else {
    if (!currentBrand) { alert("Lütfen motosiklet markanızı yazıp listeden seçin."); brandInput.focus(); return; }
    const dataKey = `${currentBrand.key}_${currentSubcat.key}`;
    const firms = (BRAND_FIRMS[dataKey] || [])
      .filter(f => !f.city || f.city === city)
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    const baseTitle = `${currentBrand.name} — ${currentSubcat.label}`;
    const emptyText = "Bu markada, bu hizmette sistemde henüz üye firma yok — yakında eklenecek.";
    const waPurpose = `${currentBrand.name} — ${currentSubcat.label}`;
    renderFirmResults(firms, baseTitle, city, emptyText, waPurpose, null);
  }
});

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
    el.innerHTML =
      '<h3>📅 Etkinlik Takvimi</h3>' +
      '<div class="app-hub-route">' +
        '<strong>4. Datça Motofest</strong>' +
        '<span style="font-size:11.5px;">3 gece 4 gün, kendi çadırınızda konaklama</span><br>' +
        '<span style="font-size:12px;">📍 Akçabük Camping, Akçabük, Palamutbükü, Datça, Muğla</span><br>' +
        '<span style="font-size:12px;">🗓️ 01 Ekim 2026 Perşembe 09:00 — 04 Ekim 2026 Pazar 15:00</span>' +
      '</div>';
  }

  function renderRota(el){
    var rotalar = [
      { bolge: 'Akdeniz', ad: 'D-400 Sahil Yolu (Antalya - Kaş)', not_: 'Deniz manzaralı, virajlı kıyı yolu', q: 'D-400 Karayolu Antalya Kaş' },
      { bolge: 'Akdeniz', ad: 'Alanya - Taşkent Yaylası', not_: 'Kıyıdan yaylaya dik tırmanış', q: 'Alanya Taşkent Yaylası yolu' },
      { bolge: 'Ege', ad: 'Bozcaada - Assos Sahil Hattı', not_: 'Zeytinlik ve sahil manzarası', q: 'Assos Behramkale yolu' },
      { bolge: 'Ege', ad: 'Datça Yarımadası', not_: 'Dar, virajlı, iki taraflı deniz manzarası', q: 'Marmaris Datça yolu' },
      { bolge: 'Karadeniz', ad: 'Uzungöl - Çaykara', not_: 'Yeşillik, sisli yayla yolları', q: 'Trabzon Uzungöl yolu' },
      { bolge: 'Karadeniz', ad: 'Ilgaz Dağı Geçidi', not_: 'Ormanlık, virajlı dağ yolu', q: 'Ilgaz Dağı Geçidi' },
      { bolge: 'Doğu Anadolu', ad: 'Erzurum - Kars Yaylaları', not_: 'Geniş, uzun düz yaylalar', q: 'Erzurum Kars karayolu' },
      { bolge: 'İç Anadolu', ad: 'Kapadokya Vadi Turu', not_: 'Peribacaları arası kısa rotalar', q: 'Göreme Ürgüp yolu' },
      { bolge: 'Ankara', ad: 'Ankara - Beypazarı', not_: 'Kısa, popüler hafta sonu rotası', q: 'Ankara Beypazarı yolu' },
      { bolge: 'Ankara', ad: 'Ankara - Kızılcahamam Ormanları', not_: 'Ormanlık, serin bir rota', q: 'Ankara Kızılcahamam yolu' }
    ];
    var html = '<h3>🗺️ Rota Önerileri</h3>';
    rotalar.forEach(function(r){
      html += '<div class="app-hub-route"><strong>' + r.ad + '</strong>' +
        '<span style="font-size:11.5px;">' + r.bolge + ' · ' + r.not_ + '</span><br>' +
        '<a href="https://www.google.com/maps/search/' + encodeURIComponent(r.q) + '" target="_blank">Google Haritada Aç →</a></div>';
    });
    el.innerHTML = html;
  }

  function renderCeza(el){
    el.innerHTML =
      '<h3>🚨 Ceza Sorgulama</h3>' +
      '<p>Trafik cezası sorgulama, T.C. Cumhurbaşkanlığı e-Devlet Kapısı üzerinden yapılır. Aşağıdaki bağlantıdan giriş yapıp "Araç Plakasına Yazılan Ceza Sorgulama" hizmetini seçin.</p>' +
      '<a href="https://www.turkiye.gov.tr/" target="_blank" style="color:var(--red);font-weight:700;font-size:13px;">e-Devlet Kapısı\'na Git →</a>';
  }

  function renderGuvenlik(el){
    var ipuclari = [
      'Yağmurda fren mesafesi ikiye katlanabilir — ani değil, kademeli fren yapın.',
      'Kör noktada kalmayın; bir aracın hemen yan-arkasında sürmek yerine görünür bir konumda kalın.',
      'Gece görünürlüğünüzü reflektörlü yelek/bantla artırın.',
      'Lastik basıncını haftada bir kontrol edin — düşük basınç tutuşu ve yakıtı etkiler.',
      'Uzun yolda her 1.5-2 saatte bir mola verin, yorgunluk dikkat kaybına yol açar.',
      'Viraja girerken hız kesin, virajın içinde değil girişte frenleyin.',
      'Her sürüşten önce lastik, fren ve ışıkları hızlıca kontrol edin.'
    ];
    var html = '<h3>🛡️ Sürüş Güvenliği İpuçları</h3>';
    ipuclari.forEach(function(t){
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
    'fgFirmaOzellikleri','fgHizmetPaketleri','fgOdemePlani','fgIndirimTalebi'];

  function loadForm() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem('motogo_firma_basvuru') || '{}'); } catch(e){}
    fields.forEach(id => { document.getElementById(id).value = p[id] || ''; });
    document.getElementById('fgOnay').checked = false;
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

    if (!unvan || !yetkili || !gsm) {
      durum.textContent = '⚠️ Firma Unvanı, Yetkili Adı Soyadı ve Yetkili GSM zorunludur.';
      durum.style.color = '#f09595';
      return;
    }
    if (!onay) {
      durum.textContent = '⚠️ Devam etmek için onay kutusunu işaretlemeniz gerekiyor.';
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
        indirim_talebi: data.fgIndirimTalebi || null,
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
