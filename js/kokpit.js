// ============================================================================
// MotoGo Kokpit — Yayın Motoru
// ============================================================================

const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const nowPlayingSub = document.getElementById('nowPlayingSub');
const nextUpText = document.getElementById('nextUpText');
const gaugePlayBtn = document.getElementById('gaugePlayBtn');
const roadStrip = document.getElementById('roadStrip');

const modal = document.getElementById('videoModal');
const modalFrame = document.getElementById('modalFrame');
const modalClose = document.getElementById('modalClose');

let activeProgram = null;

// ---------------------------------------------------------------------------
// Zamanlama mantığı
// ---------------------------------------------------------------------------
function nextOccurrence(p, from) {
  const d = new Date(from);
  d.setHours(p.hour, p.minute, 0, 0);
  const diff = (p.day - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  if (d < from) d.setDate(d.getDate() + 7);
  return d;
}

function prevOccurrence(p, from) {
  const next = nextOccurrence(p, from);
  const prev = new Date(next);
  prev.setDate(prev.getDate() - 7);
  return prev;
}

function getSchedule(programs, now) {
  let current = null;
  let next = null;

  programs.forEach(p => {
    const prevStart = prevOccurrence(p, now);
    const prevEnd = new Date(prevStart.getTime() + p.durationMin * 60000);
    if (now >= prevStart && now < prevEnd) {
      current = p;
    }
    const upcoming = nextOccurrence(p, now);
    if (!next || upcoming < next.time) {
      next = { program: p, time: upcoming };
    }
  });

  return { current, next };
}

function formatCountdown(target, now) {
  const diffMs = target - now;
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins}dk sonra`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}sa ${mins % 60}dk sonra`;
}

// ---------------------------------------------------------------------------
// Ekranı güncelle
// ---------------------------------------------------------------------------
function renderNowPlaying() {
  const now = new Date();
  const { current, next } = getSchedule(PROGRAMS, now);
  activeProgram = current;

  if (current) {
    nowPlayingTitle.textContent = current.title;
    nowPlayingSub.textContent = 'ŞİMDİ YAYINDA';
    gaugePlayBtn.disabled = false;
  } else {
    nowPlayingTitle.textContent = 'Yayın molada';
    nowPlayingSub.textContent = 'ARAMIZDA';
    gaugePlayBtn.disabled = !next;
  }

  if (next) {
    nextUpText.textContent = `Sıradaki: ${next.program.title} · ${formatCountdown(next.time, now)}`;
  } else {
    nextUpText.textContent = 'Çizelgeye henüz bölüm eklenmedi.';
  }
}

// ---------------------------------------------------------------------------
// Yol boyunca şeridi çiz
// ---------------------------------------------------------------------------
function renderRoad() {
  roadStrip.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const stop = document.createElement(cat.external ? 'a' : 'button');
    stop.className = 'road-stop';
    if (cat.external) {
      stop.href = cat.href;
    } else {
      stop.type = 'button';
      stop.addEventListener('click', () => openCategory(cat.id));
    }
    stop.innerHTML = `
      <span class="road-dot ${cat.id === 'yardim' ? 'road-dot-urgent' : ''}"></span>
      <span class="road-label">${cat.label}</span>
    `;
    roadStrip.appendChild(stop);
  });
}

function openCategory(categoryId) {
  const now = new Date();
  const items = PROGRAMS.filter(p => p.category === categoryId);
  if (items.length === 0) {
    alert('Bu kategoriye henüz içerik eklenmedi. Çok yakında burada olacak!');
    return;
  }
  // En yakın geçmiş / şu an geçerli olanı öne al, yoksa ilkini oynat
  const sorted = [...items].sort((a, b) => prevOccurrence(a, now) - prevOccurrence(b, now));
  playProgram(sorted[sorted.length - 1]);
}

// ---------------------------------------------------------------------------
// Video oynatıcı (modal)
// ---------------------------------------------------------------------------
function playProgram(program) {
  if (!program || !program.youtubeId) return;
  modalFrame.src = `https://www.youtube.com/embed/${program.youtubeId}?autoplay=1&rel=0`;
  modal.classList.add('open');
}

function closeModal() {
  modal.classList.remove('open');
  modalFrame.src = '';
}

gaugePlayBtn.addEventListener('click', () => {
  const now = new Date();
  const { current, next } = getSchedule(PROGRAMS, now);
  if (current) {
    playProgram(current);
  } else if (next) {
    alert(`Şu an yayında bir bölüm yok. Sıradaki: ${next.program.title} (${formatCountdown(next.time, now)})`);
  }
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// ---------------------------------------------------------------------------
// Başlat
// ---------------------------------------------------------------------------
renderRoad();
renderNowPlaying();
setInterval(renderNowPlaying, 30000); // her 30 saniyede bir çizelgeyi tazele
