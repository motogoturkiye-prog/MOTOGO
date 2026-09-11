// ============================================================================
// MotoGo Yol Yardım — Genel Site Mantığı
// (Firebase yok — firma listesi js/firms-data.js dosyasından okunuyor)
// ============================================================================

let firms = FIRMS.slice();  // js/firms-data.js dosyasından gelen firmalar
let selectedCategory = null;
let userCoords = null;    // { lat, lng }

const catGrid = document.getElementById('catGrid');
const firmList = document.getElementById('firmList');
const firmSectionTitle = document.getElementById('firmSectionTitle');
const ctaBtn = document.getElementById('ctaBtn');
const ctaNote = document.getElementById('ctaNote');
const locPill = document.getElementById('locPill');
const locPillText = document.getElementById('locPillText');
const toastEl = document.getElementById('toast');

function renderCategories(){
  catGrid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const card = document.createElement('button');
    card.className = 'cat-card' + (selectedCategory === cat.id ? ' selected' : '');
    card.type = 'button';
    card.innerHTML = `
      <span class="icon">${cat.icon}</span>
      <div class="title">${cat.label}</div>
      <div class="sub">${cat.sub}</div>
    `;
    card.addEventListener('click', () => {
      selectedCategory = cat.id;
      renderCategories();
      renderFirms();
      updateCta();
    });
    catGrid.appendChild(card);
  });
}

function distanceKm(a, b){
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI/180;
  const dLng = (b.lng - a.lng) * Math.PI/180;
  const lat1 = a.lat * Math.PI/180, lat2 = b.lat * Math.PI/180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function firmsForCategory(catId){
  return firms.filter(f => f.active !== false && Array.isArray(f.categories) && f.categories.includes(catId));
}

function sortedByDistance(list){
  if (!userCoords) return list;
  return [...list].sort((a,b) => {
    if (typeof a.lat !== 'number' || typeof a.lng !== 'number') return 1;
    if (typeof b.lat !== 'number' || typeof b.lng !== 'number') return -1;
    return distanceKm(userCoords, a) - distanceKm(userCoords, b);
  });
}

function statusLabel(s){
  return 'MotoGo Üyesi';
}

function renderFirms(){
  if (!selectedCategory){
    firmSectionTitle.textContent = 'En yakın üye firmalar';
    firmList.innerHTML = `<div class="empty-note">Önce yukarıdan bir arıza türü seç, o kategorideki üye firmaları burada göreceksin.</div>`;
    return;
  }
  const cat = CATEGORIES.find(c => c.id === selectedCategory);
  firmSectionTitle.textContent = `${cat.label} hizmeti veren firmalar`;

  const list = sortedByDistance(firmsForCategory(selectedCategory));

  if (list.length === 0){
    firmList.innerHTML = `<div class="empty-note">Bu kategori için henüz üye firma eklenmedi. js/firms-data.js dosyasına firma ekleyince burada otomatik görünecek.</div>`;
    return;
  }

  firmList.innerHTML = '';
  list.forEach(f => {
    const dist = (userCoords && typeof f.lat === 'number' && typeof f.lng === 'number')
      ? `${distanceKm(userCoords, f).toFixed(1)} km` : null;
    const district = (f.region || '').split(',')[0].trim();
    const row = document.createElement('div');
    row.className = 'firm-card';
    row.innerHTML = `
      <div class="firm-info">
        <div>
          <div class="firm-name">${f.name}${district ? ` <span class="firm-district">- ${district}</span>` : ''}</div>
          <div class="firm-meta">
            <span>${f.region || ''}</span>
            <span class="badge member">${dist ? dist + ' · ' : ''}${statusLabel(f.status)}</span>
          </div>
        </div>
      </div>
      <div class="firm-actions">
        ${f.phone ? `<a class="icon-btn call" href="tel:${f.phone}" title="Ara"><svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>` : ''}
        ${f.whatsapp ? `<a class="icon-btn" href="${waLink(f, false)}" target="_blank" rel="noopener" title="WhatsApp"><svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></a>` : ''}
        ${f.website ? `<a class="icon-btn" href="${f.website}" target="_blank" rel="noopener" title="Web sitesi"><svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></a>` : ''}
      </div>
    `;
    firmList.appendChild(row);
  });
}

function waLink(firm, withLocation){
  const base = `Merhaba, MotoGo Yol Yardım üzerinden yazıyorum.\nArıza türü: ${CATEGORIES.find(c=>c.id===selectedCategory)?.label || ''}`;
  let msg = base;
  if (withLocation && userCoords){
    msg += `\nKonumum: https://maps.google.com/?q=${userCoords.lat},${userCoords.lng}`;
  }
  msg += `\nYardımınızı rica ederim.`;
  return `https://wa.me/${firm.whatsapp}?text=${encodeURIComponent(msg)}`;
}

function updateCta(){
  const hasFirms = selectedCategory && firmsForCategory(selectedCategory).length > 0;
  ctaBtn.disabled = !hasFirms;
  ctaNote.textContent = !selectedCategory
    ? 'Önce bir arıza türü seç.'
    : !hasFirms
      ? 'Bu kategori için üye firma bulunmuyor.'
      : 'Seçili kategoriye göre en yakın üyeye WhatsApp\'tan konumun ve talebin iletilir.';
}

function showToast(msg, isError){
  toastEl.textContent = msg;
  toastEl.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => toastEl.classList.remove('show'), 4200);
}

ctaBtn.addEventListener('click', () => {
  if (!selectedCategory) return;
  if (!navigator.geolocation){
    showToast('Tarayıcın konum paylaşımını desteklemiyor.', true);
    return;
  }
  ctaBtn.disabled = true;
  ctaBtn.textContent = '📍 Konum alınıyor...';

  navigator.geolocation.getCurrentPosition(
    pos => {
      userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      locPill.className = 'status-pill on';
      locPillText.textContent = 'Konum açık';

      const list = sortedByDistance(firmsForCategory(selectedCategory));
      renderFirms();
      ctaBtn.disabled = false;
      ctaBtn.textContent = '📍 Konumumu Paylaş ve Yardım İste';

      if (list.length === 0){
        showToast('Bu kategori için üye firma bulunamadı.', true);
        return;
      }
      const nearest = list[0];
      if (!nearest.whatsapp){
        showToast(`${nearest.name} için WhatsApp numarası tanımlı değil, lütfen telefonla ara.`, true);
        return;
      }
      window.open(waLink(nearest, true), '_blank');
    },
    err => {
      ctaBtn.disabled = false;
      ctaBtn.textContent = '📍 Konumumu Paylaş ve Yardım İste';
      locPill.className = 'status-pill off';
      locPillText.textContent = 'Konum kapalı';
      showToast('Konum izni verilmedi. Listeden bir firmayı doğrudan arayabilir veya mesaj gönderebilirsin.', true);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

renderCategories();
renderFirms();
updateCta();
