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
