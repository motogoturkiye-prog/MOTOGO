// ============================================================================
// MotoGo — Marka Arama Motoru
// ============================================================================

const brandInput = document.getElementById('brandInput');
const brandSuggestions = document.getElementById('brandSuggestions');
const stepSearch = document.getElementById('step-search');
const stepBrand = document.getElementById('step-brand');
const stepCity = document.getElementById('step-city');
const resultsSection = document.getElementById('results');
const resultsList = document.getElementById('resultsList');

const selectedBrandName = document.getElementById('selectedBrandName');
const brandInfoBox = document.getElementById('brandInfo');
const subcatGrid = document.getElementById('subcatGrid');
const changeBrandBtn = document.getElementById('changeBrandBtn');

const selectedSubcatName = document.getElementById('selectedSubcatName');
const changeSubcatBtn = document.getElementById('changeSubcatBtn');
const citySelect = document.getElementById('citySelect');
const showResultsBtn = document.getElementById('showResultsBtn');

let currentBrand = null;
let currentSubcat = null;

// Şehirleri doldur
CITIES.forEach(c => {
  const opt = document.createElement('option');
  opt.textContent = c;
  citySelect.appendChild(opt);
});

// ---------------------------------------------------------------------------
// Adım 1: Marka arama
// ---------------------------------------------------------------------------
brandInput.addEventListener('input', () => {
  const q = brandInput.value.trim().toLocaleLowerCase('tr');
  brandSuggestions.innerHTML = "";
  if (!q) { brandSuggestions.style.display = 'none'; return; }

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
  brandInput.value = "";
  brandSuggestions.innerHTML = "";
  brandSuggestions.style.display = 'none';

  selectedBrandName.textContent = brand.name;
  brandInfoBox.textContent = brand.info && brand.info.trim()
    ? brand.info
    : "Bu marka hakkında bilgi yakında eklenecek.";

  subcatGrid.innerHTML = "";
  SUBCATS.forEach(sc => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'subcat-chip';
    btn.textContent = sc.label;
    btn.addEventListener('click', () => selectSubcat(sc));
    subcatGrid.appendChild(btn);
  });

  stepSearch.style.display = 'none';
  stepBrand.style.display = 'block';
  stepCity.style.display = 'none';
  resultsSection.style.display = 'none';
  stepBrand.scrollIntoView({ behavior: 'smooth' });
}

changeBrandBtn.addEventListener('click', () => {
  currentBrand = null;
  stepBrand.style.display = 'none';
  stepSearch.style.display = 'block';
});

// ---------------------------------------------------------------------------
// Adım 2: Alt kategori seçimi (Yol Yardım hariç, o direkt yönlendiriyor)
// ---------------------------------------------------------------------------
function selectSubcat(subcat) {
  currentSubcat = subcat;
  selectedSubcatName.textContent = `${currentBrand.name} — ${subcat.label}`;
  stepBrand.style.display = 'none';
  stepCity.style.display = 'block';
  resultsSection.style.display = 'none';
  stepCity.scrollIntoView({ behavior: 'smooth' });
}

changeSubcatBtn.addEventListener('click', () => {
  stepCity.style.display = 'none';
  stepBrand.style.display = 'block';
});

// ---------------------------------------------------------------------------
// Adım 3: Şehir seç, sonuçları göster
// ---------------------------------------------------------------------------
const SOCIAL_ICONS = [
  { key: 'instagram', title: 'Instagram', svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c2.7 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.5.5.9 1.1 1.15 1.76.25.64.42 1.37.47 2.43.05 1.06.06 1.42.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43-.26.66-.6 1.21-1.15 1.76-.5.5-1.1.9-1.76 1.15-.64.25-1.37.42-2.43.47-1.06.05-1.42.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47-.66-.26-1.21-.6-1.76-1.15-.5-.5-.9-1.1-1.15-1.76-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.7 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76.5-.5 1.1-.9 1.76-1.15.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.3 2 12 2zm0 1.8c-2.65 0-2.99.01-4.04.06-.9.04-1.4.19-1.72.32-.43.17-.74.37-1.06.7-.32.32-.52.63-.7 1.06-.13.32-.28.82-.32 1.72C4.11 9.01 4.1 9.35 4.1 12s.01 2.99.06 4.04c.04.9.19 1.4.32 1.72.17.43.37.74.7 1.06.32.32.63.52 1.06.7.32.13.82.28 1.72.32 1.05.05 1.39.06 4.04.06s2.99-.01 4.04-.06c.9-.04 1.4-.19 1.72-.32.43-.17.74-.37 1.06-.7.32-.32.52-.63.7-1.06.13-.32.28-.82.32-1.72.05-1.05.06-1.39.06-4.04s-.01-2.99-.06-4.04c-.04-.9-.19-1.4-.32-1.72-.17-.43-.37-.74-.7-1.06-.32-.32-.63-.52-1.06-.7-.32-.13-.82-.28-1.72-.32C14.99 3.81 14.65 3.8 12 3.8zm0 3.05a5.15 5.15 0 1 1 0 10.3 5.15 5.15 0 0 1 0-10.3zm0 1.8a3.35 3.35 0 1 0 0 6.7 3.35 3.35 0 0 0 0-6.7zm5.35-1.98a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>` },
  { key: 'youtube', title: 'YouTube', svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.5 12 3.5 12 3.5s-7.51 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14C4.49 20.5 12 20.5 12 20.5s7.51 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z"/></svg>` },
  { key: 'website', title: 'Web Sitesi', svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.93 9h-3.4a15.6 15.6 0 0 0-1.3-5.7A8.03 8.03 0 0 1 19.93 11zM12 4.06c.9 1.16 1.95 3.1 2.4 6.94H9.6c.45-3.84 1.5-5.78 2.4-6.94zM9.6 13h4.8c-.45 3.84-1.5 5.78-2.4 6.94-.9-1.16-1.95-3.1-2.4-6.94zm-1.83-2H4.07a8.03 8.03 0 0 1 4.7-5.7A15.6 15.6 0 0 0 7.47 11zm0 2a15.6 15.6 0 0 0 1.3 5.7A8.03 8.03 0 0 1 4.07 13h3.4zm9.06 5.7a15.6 15.6 0 0 0 1.3-5.7h3.4a8.03 8.03 0 0 1-4.7 5.7z"/></svg>` }
];

showResultsBtn.addEventListener('click', () => {
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
      const socialLinks = SOCIAL_ICONS.map(s =>
