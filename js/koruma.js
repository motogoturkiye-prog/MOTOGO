/* MotoGo Sözlük: sıradan kopyalamayı zorlaştırır. Arama kutusu ve bağlantılar normal çalışır. */
(function(){
  function izinli(e){ var t=e.target; return t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA'); }
  ['copy','cut','contextmenu','dragstart','selectstart'].forEach(function(ev){
    document.addEventListener(ev,function(e){ if(!izinli(e)) e.preventDefault(); });
  });
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&['c','x','a','s','p'].indexOf((e.key||'').toLowerCase())>=0&&!izinli(e)) e.preventDefault();
  });
})();

/* Ziyaret sayacı (v141): sözlük sayfaları da sayılır */
(function(){
  try {
    if (localStorage.getItem('mg_ben') === '1') return;
    if (navigator.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent)) return;
    var url = 'https://xdyrgiwastvwqgmpsihc.supabase.co', key = 'sb_publishable_wjEQ3JkigYiCIzLMyHCzdg_wCpkIkOT';
    var oturum = localStorage.getItem('mg_oturum');
    if (!oturum) { oturum = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem('mg_oturum', oturum); }
    fetch(url + '/rest/v1/ziyaretler', {
      method: 'POST', keepalive: true,
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ sayfa: location.pathname.slice(0, 120), oturum: oturum })
    }).catch(function(){});
  } catch(e){}
})();
