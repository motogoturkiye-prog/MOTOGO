// ============================================================================
// MotoGo Kokpit — Yayın Motoru (YouTube'dan otomatik çeken sürüm)
// ============================================================================

const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const nowPlayingSub = document.getElementById('nowPlayingSub');
const nextUpText = document.getElementById('nextUpText');
const gaugePlayBtn = document.getElementById('gaugePlayBtn');
const gaugeThumb = document.getElementById('gaugeThumb');
const roadStrip = document.getElementById('roadStrip');

const modal = document.getElementById('videoModal');
const modalFrame = document.getElementById('modalFrame');
const modalClose = document.getElementById('modalClose');

let videos = [];
let featuredVideo = null;

function playVideo(video) {
  if (!video) return;
  modalFrame.src = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`;
  modal.classList.add('open');
}

function closeModal() {
  modal.classList.remove('open');
  modalFrame.src = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
gaugePlayBtn.addEventListener('click', () => playVideo(featuredVideo));

function renderEmptyState(message) {
  nowPlayingSub.textContent = 'MOTOGO KOKPİT';
  nowPlayingTitle.textContent = message;
  nextUpText.textContent = 'Çok yakında burada olacak';
  gaugePlayBtn.disabled = true;
  roadStrip.innerHTML = `<div class="road-empty">Henüz video yok — yeni içerikler eklendikçe burada akacak.</div>`;
}

function renderVideos() {
  if (videos.length === 0) {
    renderEmptyState('İçerik hazırlanıyor');
    return;
  }

  featuredVideo = videos[0];
  nowPlayingSub.textContent = 'EN YENİ BÖLÜM';
  nowPlayingTitle.textContent = featuredVideo.title;
  nextUpText.textContent = videos.length > 1 ? `Sıradaki: ${videos[1].title}` : 'Tüm bölümler burada';
  gaugeThumb.style.backgroundImage = `url(${featuredVideo.thumb})`;
  gaugePlayBtn.disabled = false;

  roadStrip.innerHTML = '';
  videos.forEach(v => {
    const stop = document.createElement('button');
    stop.type = 'button';
    stop.className = 'road-stop';
    stop.addEventListener('click', () => playVideo(v));
    stop.innerHTML = `
      <span class="road-dot road-dot-video" style="background-image:url(${v.thumb})"></span>
      <span class="road-label">${v.title}</span>
    `;
    roadStrip.appendChild(stop);
  });
}

// ---------------------------------------------------------------------------
// YouTube'dan videoları çek
// ---------------------------------------------------------------------------
async function loadVideos() {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'BURAYA_API_ANAHTARI') {
    renderEmptyState('YouTube bağlantısı bekleniyor');
    return;
  }

  try {
    const listUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${YOUTUBE_UPLOADS_PLAYLIST}&maxResults=${YOUTUBE_MAX_RESULTS}&key=${YOUTUBE_API_KEY}`;
    const listRes = await fetch(listUrl);
    if (!listRes.ok) throw new Error('playlistItems isteği başarısız');
    const listData = await listRes.json();

    const items = (listData.items || []).map(it => ({
      id: it.snippet.resourceId.videoId,
      title: it.snippet.title,
      thumb: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url,
      publishedAt: it.snippet.publishedAt
    }));

    if (items.length === 0) { renderEmptyState('İçerik hazırlanıyor'); return; }

    // Süreye bakıp Shorts olanları filtrele
    const ids = items.map(i => i.id).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    const durations = {};
    (detailsData.items || []).forEach(d => { durations[d.id] = parseISODuration(d.contentDetails.duration); });

    videos = items
      .filter(i => (durations[i.id] ?? 0) > 0 && durations[i.id] <= SHORTS_MAX_DURATION_SEC)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    if (videos.length === 0) videos = items; // hiçbiri Shorts sayılmadıysa, hepsini göster

    renderVideos();
  } catch (err) {
    console.error('YouTube verisi çekilemedi:', err);
    renderEmptyState('Videolar yüklenemedi, birazdan tekrar dene');
  }
}

function parseISODuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || 0), min = parseInt(m[2] || 0), s = parseInt(m[3] || 0);
  return h * 3600 + min * 60 + s;
}

loadVideos();
