(function(){
var C=window.MARC_CONFIG, FN='super-responder', MAXB=4*1024*1024;
var sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);
var col=document.getElementById('col'),chat=document.getElementById('chat'),ttl=document.getElementById('ttl'),
    inp=document.getElementById('inp'),nav=document.getElementById('nav'),drawer=document.getElementById('drawer'),
    foot=document.querySelector('.foot'),FOOT=foot.textContent;
var history=[], busy=false, session=null, chatId=null, chats=[], att=null, curNav='genel';

var SV=[
 {k:'genel',n:'Yeni sohbet',s:'Marc’a her şeyi sor',
  ic:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'},
 {k:'kontrol',n:'Çıkış kontrolü',s:'Yola çıkmadan 60 saniye',
  ic:'<path d="M9 6h11M9 12h11M9 18h11M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17"/>'},
 {k:'guven',n:'Sürüş güvenliği',s:'Yağmur, viraj, kış, kontrol',
  ic:'<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/>'},
 {k:'kokpit',n:'Kokpit',s:'Motorun, sigorta, sürüş kaydı',
  ic:'<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/><circle cx="12" cy="17" r="1"/>'}
];
var TOPICS=['Yağmurda nasıl sürmeliyim?','Virajda nasıl eğilmeliyim?','Kışın lastik basıncı nasıl olmalı?','Gece sürüşünde nelere dikkat etmeliyim?','Grup sürüşünde nelere dikkat etmeliyim?'];
var CHECK=[
 ['Lastik ve fren',['Lastik havası yeterli mi?','Lastiklerde çivi, cam ya da başka bir cisim, yırtık veya çatlak var mı?','Frenler tutuyor mu?','Fren ve debriyaj manetinde bir anormallik var mı?']],
 ['Motor ve zincir',['Zincir gergin ve yağlı mı?','Yağ ve soğutma suyu seviyesi normal mi?','Motorun altında yağ ya da yakıt damlaması var mı?','Gaz kolu bıraktığında yerine tam dönüyor mu?','Yakıt yeterli mi?']],
 ['Işık ve görüş',['Far, stop, sinyal ve korna çalışıyor mu?','Aynalar ayarlı mı?']],
 ['Sen ve evrak',['Kask, eldiven, mont ve bot tamam mı?','Ehliyet, ruhsat ve sigorta yanında mı?']]
];

SV.forEach(function(v){
  var b=document.createElement('button');b.className='item';b.dataset.k=v.k;
  b.innerHTML='<svg viewBox="0 0 24 24">'+v.ic+'</svg><span>'+v.n+'<small>'+v.s+'</small></span>';
  nav.appendChild(b);
});
var dn=document.getElementById('drawerNav');
SV.forEach(function(v){
  var b=document.createElement('button');b.className='item';b.dataset.k=v.k;
  b.innerHTML='<svg viewBox="0 0 24 24">'+v.ic+'</svg><span>'+v.n+'<small>'+v.s+'</small></span>';
  dn.appendChild(b);
});
dn.addEventListener('click',function(e){var b=e.target.closest('.item');if(b){drawer.hidden=true;open(b.dataset.k)}});
var hh=document.createElement('h3');hh.textContent='Son yazışmalar';nav.appendChild(hh);
var histList=document.createElement('div');histList.id='histList';nav.appendChild(histList);
nav.addEventListener('click',function(e){var b=e.target.closest('.item');if(b)open(b.dataset.k)});

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(s){
  return esc(s).split('\n').map(function(l){return l.replace(/^\s*[*-]\s+/,'• ').replace(/^#+\s*/,'')}).join('\n')
    .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
}
function add(who,html){
  var d=document.createElement('div');d.className='msg'+(who==='me'?' me':'');
  d.innerHTML=who==='me'?'<div class="bubble">'+html+'</div>':'<div class="av">MG</div><div class="bot">'+html+'</div>';
  col.appendChild(d);chat.scrollTop=chat.scrollHeight;return d;
}
function note(t){foot.textContent=t;setTimeout(function(){foot.textContent=FOOT},5000)}
var KOTA=null,AYLAR=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function yenilenme(){var n=new Date(new Date().getFullYear(),new Date().getMonth()+1,1);return '1 '+AYLAR[n.getMonth()]}
function setKota(j){
  if(!j||j.soru==null)return;KOTA=j;
  var ks=Math.max(0,j.soru_limit-j.soru),km=Math.max(0,j.medya_limit-j.medya);
  var t1='<b>'+ks+'</b> soru kaldı <span class="small">(ayda '+j.soru_limit+')</span>';
  var t2='<b>'+km+'</b> fotoğraf/ses kaldı <span class="small">(ayda '+j.medya_limit+')</span>';
  var ren='Haklar '+yenilenme()+'’de yenilenir.';
  function set(id,h){var e=document.getElementById(id);if(e)e.innerHTML=h}
  set('qtext',t1);set('qtext2',t2);set('qren',ren);set('qtextD',t1);set('qtext2D',t2);set('qrenD',ren);
  document.getElementById('qbar').style.width=(ks/j.soru_limit*100)+'%';
  document.getElementById('qbar2').style.width=(km/j.medya_limit*100)+'%';
  document.getElementById('qchip').textContent=ks+' soru kaldı';
}
var WA='https://wa.me/905331509890?text='+encodeURIComponent('Merhaba, MotoGo ücretli uygulamalar için ücretli üyelik satın almak istiyorum.');
function lock(kind){
  var T,Pp,A;
  if(kind==='uye'){T='Önce MotoGo üyeliği gerekir';Pp='MARC O.S. 3.0, MotoGo ücretli üyelerine açıktır. Bireysel üyelik ücretsizdir. Önce MotoGo’da üye ol, sonra ücretli üyeliği al.';A='<a class="main" href="../">MotoGo’ya git</a><button id="lockR">Üye oldum, yenile</button>'}
  else if(kind==='ucretli'){T='MARC O.S. 3.0 ücretli üyelere açık';Pp='Ücretli üyelik Rota İmaj, Foto İmaj, Movi İmaj ve MARC O.S. 3.0’ı birlikte açar. Satın aldıysan “Durumu yenile”ye bas.';A='<a class="main" target="_blank" rel="noopener" href="'+WA+'">Ücretli üyelik satın al</a><button id="lockR">Satın aldım, durumu yenile</button><a href="../">‹ MotoGo’ya dön</a>'}
  else{T='Bağlanamadım';Pp='Üyeliğin şu an doğrulanamadı. İnternetini kontrol edip tekrar dene.';A='<button class="main" id="lockR">Tekrar dene</button><a href="../">‹ MotoGo’ya dön</a>'}
  document.getElementById('lockT').textContent=T;document.getElementById('lockP').textContent=Pp;
  document.getElementById('lockA').innerHTML=A;document.getElementById('lock').hidden=false;
  document.getElementById('lockR').onclick=function(){location.reload()};
}
function uyeBilgi(){var k='',c='';try{k=localStorage.getItem('motogo_uye_kod')||'';c=localStorage.getItem('motogo_cihaz')||''}catch(e){}return{kod:k,cihaz:c}}
function setNav(k){curNav=k;document.querySelectorAll('.item').forEach(function(b){b.setAttribute('aria-current',b.dataset.k===k?'true':'false')})}

/* Sohbet listesi */
function renderHist(){
  [histList,document.getElementById('histDrawer')].forEach(function(t){
    t.innerHTML='';
    if(!chats.length){t.innerHTML='<div class="empty">Henüz yazışma yok.</div>';return}
    chats.forEach(function(c){
      var r=document.createElement('div');r.className='hl';r.setAttribute('aria-current',c.id===chatId?'true':'false');
      r.innerHTML='<button class="ht" data-id="'+c.id+'" title="'+esc(c.title)+'">'+esc(c.title)+'</button><button class="hx" data-del="'+c.id+'" aria-label="Sohbeti sil">×</button>';
      t.appendChild(r);
    });
  });
}
async function loadChats(){
  var r=await sb.from('chats').select('id,title,mode,updated_at').order('updated_at',{ascending:false}).limit(30);
  if(!r.error){chats=r.data||[];renderHist()}
}
function histClick(e){
  var o=e.target.closest('[data-id]'),d=e.target.closest('[data-del]');
  if(o){drawer.hidden=true;openChat(o.dataset.id)}
  else if(d){delChat(d.dataset.del)}
}
histList.addEventListener('click',histClick);
document.getElementById('histDrawer').addEventListener('click',histClick);
document.getElementById('hbtn').addEventListener('click',function(){drawer.hidden=false});
drawer.addEventListener('click',function(e){if(e.target===drawer)drawer.hidden=true});

async function delChat(id){
  if(!window.confirm('Bu sohbet silinsin mi?'))return;
  await sb.from('chats').delete().eq('id',id);
  if(id===chatId)open('genel');
  loadChats();
}
async function openChat(id){
  var r=await sb.from('messages').select('role,content').eq('chat_id',id).order('id',{ascending:true});
  if(r.error)return;
  chatId=id;ttl.textContent='Marc';col.innerHTML='';history=[];setNav('');
  document.getElementById('f').style.display='';
  (r.data||[]).forEach(function(x){
    if(x.role==='user')add('me',esc(x.content));else add('bot',fmt(x.content));
    history.push({role:x.role,text:x.content});
  });
  renderHist();chat.scrollTop=chat.scrollHeight;
}

function chips(parent,list){
  var s=document.createElement('div');s.className='sug';
  list.forEach(function(q){var b=document.createElement('button');b.textContent=q[0];
    b.onclick=function(){inp.value=q[1];send()};s.appendChild(b)});
  parent.appendChild(s);
}

function open(k){
  if(k==='kokpit'){if(window.MarcKokpit)window.MarcKokpit.open(false);return}
  chatId=null;history=[];clearAtt();col.innerHTML='';setNav(k);renderHist();
  document.getElementById('f').style.display='';
  if(k==='kontrol'){kontrol();return}
  if(k==='guven'){ttl.textContent='Marc';guven();return}
  ttl.textContent='Marc';
  var W='Ben Marc, MotoGo’nun motosiklet asistanı. Yazarak, fotoğraf ya da ses kaydı ekleyerek sorabilirsin.\n\n'+
   '**Yapabildiklerim**\n'+
   '• Yol ve hava: rotandaki şehirlerin hava durumu, soğuk, yağmur ve rüzgâr uyarısı\n'+
   '• Arıza ve motor sesi: anlat ya da kaydı yükle, olası nedenleri ve servise ne söyleyeceğini yazarım\n'+
   '• Sürüş bilgisi: viraj, yağmur, kış, grup sürüşü\n'+
   '• Çıkış kontrolü: yola çıkmadan 60 saniyelik liste (menüde)\n'+
   '• Motosiklet bilgisi: bakım, ekipman, markalar\n'+
   '• Kokpit (menüde): motorunun bilgileri, sigorta ve muayene günü, sürüşünü kaydedip Rota İmaj videosu yapma\n'+
   '• Yakınımdaki servis: MotoGo onaylı ve diğer servisler\n'+
   '• Sesli öneriler: sürüşe eşlik eden kısa sesli mesajlar';
  add('bot',fmt(W));
  inp.focus();
}

function guven(){
  var h='<p>Bir konu seç, Marc anlatsın:</p><div class="topics">';
  TOPICS.forEach(function(t,i){h+='<button data-t="'+i+'">'+esc(t)+'</button>'});
  h+='</div>';
  var d=add('bot',h);
  d.querySelector('.topics').addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    var q=TOPICS[+b.dataset.t];open('genel');inp.value=q;send();
  });
}

function kontrol(){
  col.innerHTML='';chatId=null;history=[];ttl.textContent='Marc';setNav('kontrol');
  var h='<p>Çıkmadan önce 60 saniyede bak. Baktığın maddeye dokun, işaretlensin:</p><div class="cards"><div class="card">';
  CHECK.forEach(function(g){
    h+='<div class="chk-h">'+g[0]+'</div>';
    g[1].forEach(function(x){h+='<div class="chk"><i></i>'+esc(x)+'</div>'});
  });
  h+='</div></div><p class="small">Bu liste telefonuna bir şey kaydetmez ve soru hakkından düşmez.</p>';
  add('bot',h);
  col.querySelectorAll('.chk').forEach(function(c){c.onclick=function(){c.classList.toggle('on')}});
}

/* Ek (fotoğraf / ses) */
function clearAtt(){att=null;document.getElementById('att').hidden=true;document.getElementById('file').value=''}
function showAtt(a){att=a;document.getElementById('attn').textContent=a.name;document.getElementById('att').hidden=false}
function readB64(blob){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(String(r.result).split(',')[1])};r.onerror=no;r.readAsDataURL(blob)})}
function shrink(file){return new Promise(function(ok){
  var img=new Image(),u=URL.createObjectURL(file);
  img.onload=function(){
    var m=1280,s=Math.min(1,m/Math.max(img.width,img.height)),c=document.createElement('canvas');
    c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);
    ok(c.toDataURL('image/jpeg',0.8).split(',')[1]);
  };
  img.onerror=function(){URL.revokeObjectURL(u);ok(null)};
  img.src=u;
})}
document.getElementById('plus').addEventListener('click',function(){document.getElementById('file').click()});
document.getElementById('attx').addEventListener('click',clearAtt);
document.getElementById('file').addEventListener('change',async function(e){
  var f=e.target.files[0];if(!f)return;
  var isImg=f.type.indexOf('image/')===0,isAud=f.type.indexOf('audio/')===0;
  if(!isImg&&!isAud){note('Yalnızca fotoğraf ya da ses kaydı eklenebilir.');clearAtt();return}
  if(isImg){
    var d=await shrink(f);
    if(d){showAtt({name:f.name||'fotoğraf',mime:'image/jpeg',data:d});return}
  }
  if(f.size>MAXB){note('Dosya çok büyük. En fazla 4 MB olabilir, kaydı kısalt.');clearAtt();return}
  showAtt({name:f.name||'ses kaydı',mime:f.type,data:await readB64(f)});
});

/* Mikrofon (sesi yazıya çevirir) */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition,rec=null,micBtn=document.getElementById('mic');
micBtn.addEventListener('click',function(){
  if(!SR){note('Bu tarayıcı sesi yazıya çevirmiyor. Yazarak devam edebilirsin.');return}
  if(rec){rec.stop();return}
  rec=new SR();rec.lang='tr-TR';rec.interimResults=true;rec.continuous=false;
  var base=inp.value?inp.value+' ':'';
  rec.onresult=function(e){var t='';for(var i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;inp.value=(base+t).slice(0,800);grow()};
  rec.onend=function(){rec=null;micBtn.classList.remove('on');inp.focus()};
  rec.onerror=function(){note('Ses alınamadı. Mikrofon iznini kontrol et.')};
  micBtn.classList.add('on');rec.start();
});

async function persist(text,answer){
  try{
    var uid=session.user.id;
    if(!chatId){
      var c=await sb.from('chats').insert({user_id:uid,title:text.slice(0,48),mode:'genel'}).select('id').single();
      if(c.error)return;chatId=c.data.id;
    }else{
      await sb.from('chats').update({updated_at:new Date().toISOString()}).eq('id',chatId);
    }
    await sb.from('messages').insert([
      {chat_id:chatId,user_id:uid,role:'user',content:text},
      {chat_id:chatId,user_id:uid,role:'bot',content:answer}]);
    loadChats();
  }catch(e){}
}

function grow(){inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,150)+'px'}
inp.addEventListener('input',grow);
inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();document.getElementById('f').requestSubmit?document.getElementById('f').requestSubmit():send()}});
async function send(){
  var text=inp.value.trim();
  if((!text&&!att)||busy)return;
  if(rec)rec.stop();
  if(!text)text='Bu dosyayı incele.';
  var a=att,shown=esc(text)+(a?'<br><span class="small">Ek: '+esc(a.name)+'</span>':'');
  busy=true;inp.value='';grow();clearAtt();add('me',shown);
  var w=add('bot','<span class="typing">Düşünüyorum…</span>');
  var saved=text+(a?' [Ek: '+a.name+']':'');
  try{
    var s=(await sb.auth.getSession()).data.session;
    var r=await fetch(C.SUPABASE_URL+'/functions/v1/'+FN,{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.access_token,'apikey':C.SUPABASE_ANON_KEY},
      body:JSON.stringify({message:text,mode:'genel',history:history,uye_kod:uyeBilgi().kod,cihaz:uyeBilgi().cihaz,attachment:a?{mime:a.mime,data:a.data}:undefined})});
    var j=await r.json();
    if(r.status===402){w.remove();lock('ucretli')}
    else if(r.status===429){setKota(j);w.querySelector('.bot').innerHTML='<p class="warn">'+(j.tur==='medya'?'Bu ayki fotoğraf/ses hakkın bitti.':'Bu ayki soru hakkın bitti.')+'</p><p class="small">Haklar '+yenilenme()+'’de yenilenir.</p>'}
    else if(r.status===503){w.querySelector('.bot').innerHTML='<p class="warn">Üyeliğin doğrulanamadı.</p><p class="small">İnternetini kontrol edip tekrar dene.</p>'}
    else if(!r.ok){w.querySelector('.bot').innerHTML='<p class="warn">'+esc(j.error||j.message||'Hata oluştu')+'</p><p class="small">Teknik not: kod '+r.status+(j.detay?' · '+esc(j.detay):'')+'</p>'}
    else{
      w.querySelector('.bot').innerHTML=fmt(j.answer);
      history.push({role:'user',text:saved},{role:'bot',text:j.answer});
      setKota(j);
      persist(saved,j.answer);
    }
  }catch(e){w.querySelector('.bot').innerHTML='<p class="warn">Bağlantı kurulamadı. İnternetini kontrol et.</p><p class="small">Teknik not: '+esc(String(e&&e.message||e))+'</p>'}
  busy=false;chat.scrollTop=chat.scrollHeight;
}
document.getElementById('f').addEventListener('submit',function(e){e.preventDefault();send()});

async function gate(){
  var u=uyeBilgi();if(!u.kod){lock('uye');return false}
  try{
    var s2=(await sb.auth.getSession()).data.session;
    var r=await fetch(C.SUPABASE_URL+'/functions/v1/'+FN,{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+s2.access_token,'apikey':C.SUPABASE_ANON_KEY},
      body:JSON.stringify({action:'durum',uye_kod:u.kod,cihaz:u.cihaz})});
    var j={};try{j=await r.json()}catch(e){}
    if(r.status===402){lock('ucretli');return false}
    if(!r.ok){lock('baglanti');return false}
    setKota(j);return true;
  }catch(e){lock('baglanti');return false}
}
(async function init(){
  var DEMO=!!(window.MarcKokpit&&window.MarcKokpit.demo);
  var g=await sb.auth.getSession();session=g.data.session;
  if(!session){var a=await sb.auth.signInAnonymously();if(a.error){col.innerHTML='<div class="msg"><div class="av">MG</div><div class="bot"><p class="warn">Giriş başlatılamadı. Supabase’de “Anonymous sign-ins” açık mı?</p></div></div>';return}session=a.data.session}
  if(DEMO){setKota({soru:13,medya:2,soru_limit:60,medya_limit:10})}
  else if(!(await gate()))return;
  open('genel');loadChats();
  var ilk=true;try{ilk=!sessionStorage.getItem('marc_boot');sessionStorage.setItem('marc_boot','1')}catch(e){}
  if(ilk&&window.MarcKokpit)window.MarcKokpit.open(true);
})();
})();
