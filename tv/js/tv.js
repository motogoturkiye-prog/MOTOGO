// ============================================================================
// MotoGo TV — Yayın Motoru
// ============================================================================

const playerFrame = document.getElementById('playerFrame');
const idleState = document.getElementById('idleState');
const nowTitle = document.getElementById('nowTitle');
const nextText = document.getElementById('nextText');

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
    if (now >= prevStart && now < prevEnd) current = p;

    const upcoming = nextOccurrence(p, now);
    if (!next || upcoming < next.time) next = { program: p, time: upcoming };
  });

  return { current, next };
}

function formatCountdown(target, now) {
  const mins = Math.max(0, Math.round((target - now) / 60000));
  if (mins < 60) return `${mins} dk sonra`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} sa ${mins % 60} dk sonra`;
}

function render() {
  const now = new Date();

  const alwaysOn = TV_PROGRAMS.find(p => p.always);
  if (alwaysOn) {
    playerFrame.src = `https://www.youtube.com/embed/${alwaysOn.youtubeId}?rel=0`;
    playerFrame.style.display = 'block';
    idleState.style.display = 'none';
    nowTitle.textContent = alwaysOn.title;
    nextText.textContent = 'Çizelge yakında aktif olacak.';
    return;
  }

  const { current, next } = getSchedule(TV_PROGRAMS, now);

  if (current) {
    playerFrame.src = `https://www.youtube.com/embed/${current.youtubeId}?rel=0`;
    playerFrame.style.display = 'block';
    idleState.style.display = 'none';
    nowTitle.textContent = current.title;
  } else {
    playerFrame.style.display = 'none';
    idleState.style.display = 'flex';
    nowTitle.textContent = 'Yayın molada';
  }

  if (next) {
    nextText.textContent = `Sıradaki: ${next.program.title} · ${formatCountdown(next.time, now)}`;
  } else {
    nextText.textContent = 'Çizelgeye henüz bölüm eklenmedi.';
  }
}

render();
setInterval(render, 30000);
