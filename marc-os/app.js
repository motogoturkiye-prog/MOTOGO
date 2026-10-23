(function(){
var C=window.MARC_CONFIG, FREE=3, FN='super-responder';
var sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);
var col=document.getElementById('col'),chat=document.getElementById('chat'),ttl=document.getElementById('ttl'),
    inp=document.getElementById('inp'),nav=document.getElementById('nav'),drawer=document.getElementById('drawer');
var mode='genel', history=[], busy=false, session=null, chatId=null, chats=[];

var SV=[
 {k:'genel',n:'Yeni sohbet',t:'Mark',s:'Mark’a her şeyi sor',ai:1,ph:'Motorunla ilgili bir şey sor…',
  hi:'Ben Mark. Rota, hava, arıza, bakım, sürüş… Motosikletle ilgili ne varsa yaz.',
  sg:['Yarın Ankara’dan İstanbul’a çıkıyorum','Rölantide tık tık sesi geliyor','Yağmurda nasıl sürmeliyim?'],
  ic:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'},
 {k:'yol',n:'Yol ve hava',s:'Rota boyunca durum',ai:1,ph:'Örn: Yarın Ankara’dan İstanbul’a çıkıyorum',
  hi:'Nereden nereye gideceksin? Rotandaki hava durumunu bakarım.',
  ic:'<path d="M4 20 9 4M20 20 15 4M12 6v3M12 12v3M12 18v2"/>'},
 {k:'servis',n:'Yakınımdaki servis',s:'Çok yakında',soon:1,
  ic:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'},
 {k:'kontrol',n:'Çıkış kontrolü',s:'Lastik, zincir, fren',
  ic:'<path d="M9 6h11M9 12h11M9 18h11M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17"/>'},
 {k:'motorum',n:'Motorum',s:'Bakım, sigorta',
  ic:'<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9 8 6H6"/>'},
 {k:'ses',n:'Arıza ve motor sesi',s:'Anlat (ses yakında)',ai:1,ph:'Örn: Rölantide tık tık sesi geliyor',
  hi:'Arızayı ya da sesi yazıyla anlat. Ne zaman, hangi devirde oluyor?',
  ic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'},
 {k:'ogren',n:'Öğren',s:'Viraj, yağmur, kış',ai:1,ph:'Örn: Yağmurda nasıl sürmeliyim?',
  hi:'Merak ettiğin sürüş konusunu yaz.',
  sg:['Yağmurda nasıl sürmeliyim?','Virajda nasıl eğilmeliyim?','Kışın lastik basıncı'],
  ic:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 8h6"/>'}
];
function svc(k){return SV.filter(function(x){return x.k===k})[0]}
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

/* Sohbet listesi */
function renderHist(){
  var targets=[histList,document.getElementById('histDrawer')];
  targets.forEach(function(t){
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
  var c=chats.filter(function(x){return x.id===id})[0];if(!c)return;
  var r=await sb.from('messages').select('role,content').eq('chat_id',id).order('id',{ascending:true});
  if(r.error)return;
  var m=svc(c.mode)&&svc(c.mode).ai?c.mode:'genel';
  mode=m;chatId=id;ttl.textContent=svc(m).t||svc(m).n;col.innerHTML='';history=[];
  document.querySelectorAll('.item').forEach(function(b){b.setAttribute('aria-current','false')});
  document.getElementById('f').style.display='';inp.placeholder=svc(m).ph;
  (r.data||[]).forEach(function(x){
    if(x.role==='user')add('me',esc(x.content));else add('bot',fmt(x.content));
    history.push({role:x.role,text:x.content});
  });
  renderHist();chat.scrollTop=chat.scrollHeight;
}

function open(k){
  mode=k;chatId=null;history=[];var v=svc(k);
  ttl.textContent=v.t||v.n;col.innerHTML='';
  document.querySelectorAll('.item').forEach(function(b){b.setAttribute('aria-current',b.dataset.k===k?'true':'false')});
  document.getElementById('f').style.display=v.ai?'':'none';
  renderHist();
  if(v.ai){inp.placeholder=v.ph;
    var h=add('bot','<p>'+esc(v.hi)+'</p>');
    if(v.sg){var s=document.createElement('div');s.className='sug';
      v.sg.forEach(function(q){var b=document.createElement('button');b.textContent=q;b.onclick=function(){inp.value=q;send()};s.appendChild(b)});
      h.querySelector('.bot').appendChild(s)}
    inp.focus();
  } else if(k==='kontrol') kontrol();
  else if(k==='motorum') motorum();
  else add('bot','<p>Bu hizmet çok yakında. Bölgendeki MotoGo onaylı ve diğer servisleri burada göstereceğim.</p>');
}

function kontrol(){
  var L=['Lastik havası (soğukta kontrol et)','Zincir gerginliği ve yağı','Ön ve arka fren','Stop, sinyal, far','Yağ ve soğutma seviyesi','Kask, eldiven, mont'];
  var h='<p>Çıkmadan önce 60 saniyede bak:</p><div class="cards"><div class="card">';
  L.forEach(function(x){h+='<div class="chk"><i></i>'+x+'</div>'});
  h+='</div></div><p class="small">Hava soğuksa lastik basıncının düşebileceğini unutma.</p>';
  add('bot',h);
  col.querySelectorAll('.chk').forEach(function(c){c.onclick=function(){c.classList.toggle('on')}});
}

async function motorum(){
  var d=add('bot','<p class="typing">Motorun yükleniyor…</p>');
  var r=await sb.from('bikes').select('*').limit(1).maybeSingle();
  var b=r.data||{};
  var h='<p>Motorunun bilgilerini gir. Zamanı gelince burada uyarırım.</p><form class="form" id="bf">'+
   '<label>Model<input name="model" value="'+esc(b.model||'')+'" placeholder="Örn: KTM 1390"></label>'+
   '<label>Yıl<input name="year" type="number" value="'+(b.year||'')+'"></label>'+
   '<label>Şu anki km<input name="km" type="number" value="'+(b.km||'')+'"></label>'+
   '<label>Sonraki bakım kaçıncı km’de<input name="next_service_km" type="number" value="'+(b.next_service_km||'')+'"></label>'+
   '<label>Sigorta bitiş tarihi<input name="insurance_end" type="date" value="'+(b.insurance_end||'')+'"></label>'+
   '<label>Muayene bitiş tarihi<input name="inspection_end" type="date" value="'+(b.inspection_end||'')+'"></label>'+
   '<button class="buy" type="submit">Kaydet</button></form><div id="bst"></div>';
  d.querySelector('.bot').innerHTML=h;
  var st=d.querySelector('#bst');
  function status(x){
    var o=[],t=new Date();
    if(x.next_service_km&&x.km){var k=x.next_service_km-x.km;o.push('<div class="row"><span>Bakım</span><span class="'+(k<1000?'warn':'ok')+'">'+(k>0?k+' km kaldı':'Zamanı geldi')+'</span></div>')}
    [['insurance_end','Sigorta'],['inspection_end','Muayene']].forEach(function(p){
      if(!x[p[0]])return;var g=Math.ceil((new Date(x[p[0]])-t)/864e5);
      o.push('<div class="row"><span>'+p[1]+'</span><span class="'+(g<30?'warn':'ok')+'">'+(g>=0?g+' gün kaldı':'Süresi geçmiş')+'</span></div>')});
    st.innerHTML=o.length?'<div class="card"><h4>Durum</h4>'+o.join('')+'</div>':'';
  }
  status(b);
  d.querySelector('#bf').onsubmit=async function(e){
    e.preventDefault();var f=new FormData(e.target),x={user_id:session.user.id,updated_at:new Date().toISOString()};
    ['model','year','km','next_service_km','insurance_end','inspection_end'].forEach(function(n){
      var v=f.get(n);x[n]=v===''?null:(['model','insurance_end','inspection_end'].indexOf(n)>-1?v:Number(v))});
    if(x.model==null)x.model='';
    var res=b.id?await sb.from('bikes').update(x).eq('id',b.id).select().single():await sb.from('bikes').insert(x).select().single();
    if(res.error){st.innerHTML='<p class="small warn">Kaydedilemedi, tekrar dene.</p>';return}
    b=res.data;status(b);
  };
}

async function persist(text,answer){
  try{
    var uid=session.user.id;
    if(!chatId){
      var c=await sb.from('chats').insert({user_id:uid,title:text.slice(0,48),mode:mode}).select('id').single();
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
  var v=svc(mode);
  var text=inp.value.trim();if(!text||busy||!v.ai)return;
  busy=true;inp.value='';add('me',esc(text));
  var w=add('bot','<span class="typing">Düşünüyorum…</span>');
  try{
    var s=(await sb.auth.getSession()).data.session;
    var r=await fetch(C.SUPABASE_URL+'/functions/v1/'+FN,{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.access_token,'apikey':C.SUPABASE_ANON_KEY},
      body:JSON.stringify({message:text,mode:mode,history:history})});
    var j=await r.json();
    if(r.status===402){w.remove();setQuota(0);paywall()}
    else if(!r.ok){w.querySelector('.bot').innerHTML='<p class="warn">'+esc(j.error||j.message||'Hata oluştu')+'</p><p class="small">Teknik not: kod '+r.status+'</p>'}
    else{
      w.querySelector('.bot').innerHTML=fmt(j.answer);
      history.push({role:'user',text:text},{role:'bot',text:j.answer});
      setQuota(j.left,j.paid);
      persist(text,j.answer);
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
