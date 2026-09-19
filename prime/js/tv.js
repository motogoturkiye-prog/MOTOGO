// ============================================================================
// MotoGo TV — Yayın Motoru (normal akış + gün/saate bağlı özel yayın)
// ============================================================================

const idleState = document.getElementById('idleState');
const nowTitle = document.getElementById('nowTitle');
const nextText = document.getElementById('nextText');
const unmuteBtn = document.getElementById('unmuteBtn');
const nextBtn = document.getElementById('nextBtn');
const liveBadge = document.getElementById('liveBadge');

let ytPlayer = null;
let currentIndex = 0;
let inSpecialMode = false;

unmuteBtn.addEventListener('click', () => {
  if (ytPlayer && ytPlayer.unMute) {
    ytPlayer.unMute();
    ytPlayer.setVolume(100);
    unmuteBtn.style.display = 'none';
  }
});

// ---------------------------------------------------------------------------
// Gün/saat hesaplama (özel yayınlar için)
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
function getActiveSpecial(now) {
  for (const p of SPECIAL_PROGRAMS) {
    const start = prevOccurrence(p, now);
    const end = new Date(start.getTime() + p.durationMin * 60000);
    if (now >= start && now < end) return p;
  }
  return null;
}
function getNextSpecial(now) {
  let best = null;
  for (const p of SPECIAL_PROGRAMS) {
    const t = nextOccurrence(p, now);
    if (!best || t < best.time) best = { program: p, time: t };
  }
  return best;
}
const GUNLER = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
function formatGunSaat(d) {
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${GUNLER[d.getDay()]} ${hh}:${mm}`;
}

// ---------------------------------------------------------------------------
// Bilgi metnini güncelle
// ---------------------------------------------------------------------------
function updateInfo() {
  if (inSpecialMode) {
    const special = getActiveSpecial(new Date());
    nowTitle.textContent = special ? special.title : nowTitle.textContent;
    liveBadge.style.display = 'inline-block';
    nextText.textContent = 'Bu bir özel yayın — bitince normal akışa dönülecek.';
    return;
  }
  liveBadge.style.display = 'none';
  const current = TV_PROGRAMS[currentIndex];
  const next = TV_PROGRAMS[(currentIndex + 1) % TV_PROGRAMS.length];
  nowTitle.textContent = current.title;
  let msg = TV_PROGRAMS.length > 1 ? `Sıradaki: ${next.title}` : 'Bu video döngüde tekrar oynayacak.';
  const upcoming = getNextSpecial(new Date());
  if (upcoming) msg += `  ·  Özel yayın: ${upcoming.program.title} — ${formatGunSaat(upcoming.time)}`;
  nextText.textContent = msg;
}

// ---------------------------------------------------------------------------
// Normal akışta ilerleme
// ---------------------------------------------------------------------------
function goToVideo(index) {
  currentIndex = ((index % TV_PROGRAMS.length) + TV_PROGRAMS.length) % TV_PROGRAMS.length;
  ytPlayer.loadVideoById(TV_PROGRAMS[currentIndex].youtubeId);
  updateInfo();
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    if (inSpecialMode) {
      // Özel yayın bitti, normal akışa dön
      inSpecialMode = false;
      ytPlayer.loadVideoById(TV_PROGRAMS[currentIndex].youtubeId);
      updateInfo();
    } else {
      goToVideo(currentIndex + 1);
    }
  }
}

nextBtn.addEventListener('click', () => {
  if (!ytPlayer || inSpecialMode) return; // özel yayın sırasında atlama kapalı
  goToVideo(currentIndex + 1);
});

// ---------------------------------------------------------------------------
// Her 20 saniyede bir: özel yayın zamanı geldi mi / bitti mi kontrol et
// ---------------------------------------------------------------------------
function checkSchedule() {
  if (!ytPlayer) return;
  const active = getActiveSpecial(new Date());

  if (active && !inSpecialMode) {
    // Normal akışı kes, özel yayına geç
    inSpecialMode = true;
    ytPlayer.loadVideoById(active.youtubeId);
    updateInfo();
  } else if (!active && inSpecialMode) {
    // Süre doldu ama video henüz bitmediyse bile normale dön
    inSpecialMode = false;
    ytPlayer.loadVideoById(TV_PROGRAMS[currentIndex].youtubeId);
    updateInfo();
  } else {
    updateInfo(); // sadece "sıradaki özel yayın" metnini tazele
  }
}

// ---------------------------------------------------------------------------
// Başlat
// ---------------------------------------------------------------------------
function startPlayback() {
  idleState.style.display = 'none';
  currentIndex = 0;

  const active = getActiveSpecial(new Date());
  inSpecialMode = !!active;
  const startId = active ? active.youtubeId : TV_PROGRAMS[0].youtubeId;

  ytPlayer = new YT.Player('playerFrame', {
    videoId: startId,
    playerVars: { autoplay: 1, mute: 1, rel: 0, playsinline: 1 },
    events: {
      onReady: () => { updateInfo(); unmuteBtn.style.display = 'block'; },
      onStateChange: onPlayerStateChange
    }
  });

  setInterval(checkSchedule, 20000);
}

window.onYouTubeIframeAPIReady = function () {
  if (TV_PROGRAMS.length > 0) startPlayback();
};

if (TV_PROGRAMS.length === 0) {
  idleState.style.display = 'flex';
  nowTitle.textContent = 'İçerik hazırlanıyor';
  nextText.textContent = 'Henüz içerik eklenmedi.';
} else {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}
