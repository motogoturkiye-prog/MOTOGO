// ============================================================================
// MotoGo — Marka Arama Motoru (tek sayfa, hiçbir yere zıplamadan)
// ============================================================================

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

  function buildSubcatChip(sc) {
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
      resultsSection.style.display = 'none';
    });
    return btn;
  }

  function buildYardimChip() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'subcat-chip subcat-chip-yardim' + (yardimActive ? ' subcat-chip-active' : '');
    btn.textContent = 'Yol Yardım';
    btn.addEventListener('click', () => {
      yardimActive = true;
      currentSubcat = null;
      renderSubcatGrid();
      cityField.style.display = 'none';
      showResultsBtn.style.display = 'none';
      resultsSection.style.display = 'none';
      yardimSection.style.display = 'block';
      renderYardimCategories();
    });
    return btn;
  }

  // Sıra: Servis, Bayi, Yedek Parça, Aksesuar, Kiralık Motor, Yol Yardım (en sonda)
  SUBCATS.forEach(sc => subcatGrid.appendChild(buildSubcatChip(sc)));
  subcatGrid.appendChild(buildYardimChip());
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

  const acilBtn = document.createElement('a');
  acilBtn.href = 'tel:112';
  acilBtn.className = 'subcat-chip subcat-chip-yardim';
  acilBtn.style.display = 'flex';
  acilBtn.style.alignItems = 'center';
  acilBtn.style.justifyContent = 'center';
  acilBtn.textContent = '🚨 112\'yi Ara';
  yardimCatGrid.appendChild(acilBtn);
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

  brandInfoLabel.textContent = `${brand.name} hakkında bilgi`;
  brandInfoText.textContent = brand.info && brand.info.trim()
    ? brand.info
    : "Bu marka hakkında bilgi yakında eklenecek.";
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

      const panelContent = `
        ${firm.photo ? `<img class="firm-panel-photo" src="${firm.photo}" alt="${firm.name}">` : ''}
        <div class="firm-social-icons">${socialLinks}</div>
      `;

      const card = document.createElement('div');
      card.className = 'firm-card';
      card.innerHTML = `
        <div class="firm-info">
          <p class="firm-name">${firm.name}${firm.district ? ' - ' + firm.district : ''}</p>
          <p class="firm-meta">${firm.city || ""}</p>
          <button type="button" class="incele-btn">İncele</button>
          <div class="firm-social-panel">${panelContent}</div>
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
      const socialLinks = SOCIAL_ICONS.map(s => {
        if (f[s.key]) {
          return `<a class="social-btn" href="${f[s.key]}" target="_blank" title="${s.title}">${s.svg}</a>`;
        }
        return `<span class="social-btn social-btn-disabled" title="${s.title} bağlantısı yok">${s.svg}</span>`;
      }).join('');
      const panelContent = `
        ${f.photo ? `<img class="firm-panel-photo" src="${f.photo}" alt="${f.name}">` : ''}
        <div class="firm-social-icons">${socialLinks}</div>
      `;
      html += `
        <div class="firm-card">
          <div class="firm-info">
            <p class="firm-name">${f.name}${district ? ' - ' + district : ''}</p>
            <p class="firm-meta">${dist}${f.region}</p>
            <button type="button" class="incele-btn">İncele</button>
            <div class="firm-social-panel">${panelContent}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <a class="firm-whatsapp" href="${yardimWaLink(f, false)}" target="_blank">WhatsApp'tan Ulaş</a>
            ${f.phone ? `<a class="firm-whatsapp" style="background:var(--panel);border:1px solid var(--line);" href="tel:${f.phone}">📞 Ara</a>` : ''}
          </div>
        </div>`;
    });
    html += `<button type="button" class="cta-btn cta-btn-yardim" id="yardimLocationBtn">📍 Konumumu Paylaş ve En Yakına Ulaş</button>`;
  }

  yardimResults.innerHTML = html;
  yardimResults.querySelectorAll('.incele-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.currentTarget.nextElementSibling.classList.toggle('open');
    });
  });

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
      'Lastik basıncını ayda bir kontrol edin — düşük basınç tutuşu ve yakıtı etkiler.',
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
