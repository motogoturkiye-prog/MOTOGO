(function(){
var C=window.MARC_CONFIG, FREE=3, FN='super-responder', MAXB=4*1024*1024;
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
  ic:'<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/>'}
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
function setQuota(left,paid){
  var t=document.getElementById('qtext'),bar=document.getElementById('qbar'),chip=document.getElementById('qchip');
  if(paid){t.innerHTML='<b>Üyelik aktif</b>';bar.style.width='100%';chip.textContent='Üye';return}
  if(left==null)return;
  t.innerHTML='<b>'+FREE+' ücretsiz sorudan '+left+'’i kaldı</b>';
  bar.style.width=(left/FREE*100)+'%';chip.textContent=left+'/'+FREE+' ücretsiz';
}
function paywall(){
  add('bot','<div class="card paywall"><p><b>3 ücretsiz sorunu kullandın.</b></p><p class="small">Devam etmek için üyelik gerekir. Ödeme sistemi bağlanınca burada açılacak.</p></div>');
}
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
document.getElementById('newc').addEventListener('click',function(){drawer.hidden=true;open('genel')});

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
  list.forEach(function(q){var b=document.createElement('button');b.textContent=q;
    b.onclick=function(){if(q==='Çıkış kontrolü')kontrol();else{inp.value=q;send()}};s.appendChild(b)});
  parent.appendChild(s);
}

function open(k){
  chatId=null;history=[];clearAtt();col.innerHTML='';setNav(k);renderHist();
  document.getElementById('f').style.display='';
  if(k==='kontrol'){kontrol();return}
  if(k==='guven'){ttl.textContent='Sürüş güvenliği';guven();return}
  ttl.textContent='Marc';
  var h=add('bot','<p>Ben Marc. Rota, hava, arıza, bakım, sürüş… Motosikletle ilgili ne varsa yaz. Fotoğraf ya da motor sesi kaydı da ekleyebilirsin.</p>');
  chips(h.querySelector('.bot'),['Yarın Ankara’dan İstanbul’a çıkıyorum','Rölantide tık tık sesi geliyor','Yağmurda nasıl sürmeliyim?','Çıkış kontrolü']);
  inp.focus();
}

function guven(){
  var h='<p>Bir konu seç, Marc anlatsın:</p><div class="topics">';
  TOPICS.forEach(function(t,i){h+='<button data-t="'+i+'">'+esc(t)+'</button>'});
  h+='<button data-t="kontrol">Çıkış kontrolü</button></div>';
  var d=add('bot',h);
  d.querySelector('.topics').addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.dataset.t==='kontrol'){kontrol();return}
    var q=TOPICS[+b.dataset.t];open('genel');inp.value=q;send();
  });
}

function kontrol(){
  col.innerHTML='';chatId=null;history=[];ttl.textContent='Çıkış kontrolü';setNav('kontrol');
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
  rec.onresult=function(e){var t='';for(var i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;inp.value=(base+t).slice(0,800)};
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

async function send(){
  var text=inp.value.trim();
  if((!text&&!att)||busy)return;
  if(rec)rec.stop();
  if(!text)text='Bu dosyayı incele.';
  var a=att,shown=esc(text)+(a?'<br><span class="small">Ek: '+esc(a.name)+'</span>':'');
  busy=true;inp.value='';clearAtt();add('me',shown);
  var w=add('bot','<span class="typing">Düşünüyorum…</span>');
  var saved=text+(a?' [Ek: '+a.name+']':'');
  try{
    var s=(await sb.auth.getSession()).data.session;
    var r=await fetch(C.SUPABASE_URL+'/functions/v1/'+FN,{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.access_token,'apikey':C.SUPABASE_ANON_KEY},
      body:JSON.stringify({message:text,mode:'genel',history:history,attachment:a?{mime:a.mime,data:a.data}:undefined})});
    var j=await r.json();
    if(r.status===402){w.remove();setQuota(0);paywall()}
    else if(!r.ok){w.querySelector('.bot').innerHTML='<p class="warn">'+esc(j.error||j.message||'Hata oluştu')+'</p><p class="small">Teknik not: kod '+r.status+'</p>'}
    else{
      w.querySelector('.bot').innerHTML=fmt(j.answer);
      history.push({role:'user',text:saved},{role:'bot',text:j.answer});
      setQuota(j.left,j.paid);
      persist(saved,j.answer);
    }
  }catch(e){w.querySelector('.bot').innerHTML='<p class="warn">Bağlantı kurulamadı. İnternetini kontrol et.</p><p class="small">Teknik not: '+esc(String(e&&e.message||e))+'</p>'}
  busy=false;chat.scrollTop=chat.scrollHeight;
}
document.getElementById('f').addEventListener('submit',function(e){e.preventDefault();send()});
document.getElementById('buy').addEventListener('click',function(){window.alert('Üyelik yakında açılacak.')});

(async function init(){
  var g=await sb.auth.getSession();session=g.data.session;
  if(!session){var a=await sb.auth.signInAnonymously();if(a.error){col.innerHTML='<div class="msg"><div class="av">MG</div><div class="bot"><p class="warn">Giriş başlatılamadı. Supabase’de “Anonymous sign-ins” açık mı?</p></div></div>';return}session=a.data.session}
  var u=await sb.from('usage').select('used,paid').maybeSingle();
  if(u.data)setQuota(u.data.paid?null:Math.max(0,FREE-u.data.used),u.data.paid);else setQuota(FREE);
  open('genel');loadChats();
})();
})();
