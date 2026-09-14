const idleState = document.getElementById('idleState');
const nowTitle = document.getElementById('nowTitle');
const nextText = document.getElementById('nextText');

let ytPlayer = null;
let currentIndex = 0;

function updateInfo() {
  const current = TV_PROGRAMS[currentIndex];
  const next = TV_PROGRAMS[(currentIndex + 1) % TV_PROGRAMS.length];
  nowTitle.textContent = current.title;
  nextText.textContent = TV_PROGRAMS.length > 1
    ? `Sıradaki: ${next.title}`
    : 'Bu video döngüde tekrar oynayacak.';
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    currentIndex = (currentIndex + 1) % TV_PROGRAMS.length;
    ytPlayer.loadVideoById(TV_PROGRAMS[currentIndex].youtubeId);
    updateInfo();
  }
}

function startPlayback() {
  idleState.style.display = 'none';
  currentIndex = 0;
  ytPlayer = new YT.Player('playerFrame', {
    videoId: TV_PROGRAMS[0].youtubeId,
    playerVars: { autoplay: 1, mute: 1, rel: 0, playsinline: 1 },
    events: {
      onReady: updateInfo,
      onStateChange: onPlayerStateChange
    }
  });
}

window.onYouTubeIframeAPIReady = function () {
  if (TV_PROGRAMS.length > 0) startPlayback();
};

if (TV_PROGRAMS.length === 0) {
  idleState.style.display = 'flex';
  nowTitle.textContent = 'Yayın molada';
  nextText.textContent = 'Çizelgeye henüz bölüm eklenmedi.';
} else {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}
