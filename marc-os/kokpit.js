/* MARC O.S. 3.0 — Kokpit: açılış ekranı, motor bilgileri, sürüş kaydı, Rota İmaj aktarımı.
   Konum izi yalnızca üyenin telefonunda durur, sunucuya gönderilmez. */
(function(){
'use strict';
var DEMO=/[?&]demo=1/.test(location.search);
var KEY='marc_kokpit_v1', RIDE_KEY='marc_son_surus';
var BRANDS=['BMW','KTM','Honda','Yamaha','Suzuki','Kawasaki','Ducati','Triumph','CFMoto','Jawa','Aurora','Royal Enfield','Harley-Davidson','Vespa','Diğer'];

var P={brand:'',model:'',year:'',km:'',sig:'',mua:'',tf:'',tr:'',srvN:'',srvT:''};
if(DEMO){P={brand:'BMW',model:'F800GS',year:2016,km:48200,sig:'2027-03-14',mua:'2027-09-02',tf:'2,5',tr:'2,9',srvN:'',srvT:''}}
else{try{var sv=localStorage.getItem(KEY);if(sv)P=Object.assign(P,JSON.parse(sv))}catch(e){}}
function save(){if(DEMO)return;try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}}

/* ---------- DOM ---------- */
var host=document.createElement('div');
host.innerHTML=
'<section id="kCock" aria-label="Kokpit" hidden>'+
 '<div class="k-stage"><div class="k-tft">'+
  '<div class="k-strip k-t"><span id="kClock">--:--</span><span id="kName">—</span><span id="kGps">Hazır</span></div>'+
  '<div class="k-body">'+
   '<div class="k-side">'+
    '<div class="k-it"><small>Kilometre</small><b id="kKm">—</b><em>girdiğin değer</em></div>'+
    '<div class="k-it" id="kCSig"><small>Sigorta</small><b id="kSig">—</b><em id="kSigD"></em></div>'+
   '</div>'+
   '<svg class="k-gauge" viewBox="0 0 300 275" preserveAspectRatio="xMidYMid meet" aria-label="Hız göstergesi">'+
    '<defs><linearGradient id="kGrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffcb2e"/><stop offset="1" stop-color="#ff7a00"/></linearGradient></defs>'+
    '<path d="M 54.7 185 A 110 110 0 1 1 245.3 185" fill="none" stroke="#141a22" stroke-width="14" stroke-linecap="round"/>'+
    '<path id="kArc" d="M 54.7 185 A 110 110 0 1 1 245.3 185" fill="none" stroke="url(#kGrad)" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100"/>'+
    '<g id="kTicks"></g>'+
    '<text id="kSpd" x="150" y="138" text-anchor="middle" font-size="74" font-weight="800">0</text>'+
    '<text id="kUnit" x="150" y="160" text-anchor="middle" font-size="14" style="fill:#8793a3">km/sa</text>'+
    '<text id="kBrand" x="150" y="140" text-anchor="middle" font-size="30" font-weight="800" opacity="0">MARC <tspan fill="#ffcb2e">O.S.</tspan> 3.0</text>'+
   '</svg>'+
   '<div class="k-side">'+
    '<div class="k-it" id="kCMua"><small>Muayene</small><b id="kMua">—</b><em id="kMuaD"></em></div>'+
    '<div class="k-it"><small>Lastik · fabrika değeri</small><b id="kTire">—</b><em>bar · mevcut basınç değil</em></div>'+
   '</div>'+
  '</div>'+
  '<div class="k-strip k-bt">'+
   '<div><small>Yol</small><b id="kTrip">0,0 km</b></div>'+
   '<div><small>En yüksek</small><b id="kMx">0</b></div>'+
   '<div><small>Ortalama</small><b id="kAvg">0</b></div>'+
   '<div><small>Süre</small><b id="kDur">00:00</b></div>'+
  '</div>'+
 '</div></div>'+
 '<div id="kBar"><i></i></div>'+
 '<div>'+
  '<div class="k-bot">'+
   '<button class="k-main" id="kRide">▶ Sürüşü başlat</button>'+
   '<button id="kSrv">📞 Beni servisime bağla</button>'+
   '<button id="kEditBtn">Motorumu düzenle</button>'+
   '<button id="kClose">Geç ›</button>'+
  '</div>'+
  '<div class="k-cap" id="kCap"></div>'+
 '</div>'+
'</section>'+
'<button id="kPill" hidden>● Sürüş kaydı açık</button>'+
'<div class="k-modal" id="kEdit" hidden><div class="k-form" role="dialog" aria-label="Motorumu tanıt">'+
 '<h3>Motorumu tanıt</h3>'+
 '<div class="k-row"><label>Marka<select id="kfBrand"></select></label><label>Model<input id="kfModel" type="text" placeholder="Örn. F800GS"></label></div>'+
 '<div class="k-row"><label>Kilometre (şu an)<input id="kfKm" type="number" inputmode="numeric" min="0"></label><label>Model yılı<input id="kfYear" type="number" inputmode="numeric" min="1980" max="2035"></label></div>'+
 '<div class="k-row"><label>Sigorta bitişi<input id="kfSig" type="date"></label><label>Muayene tarihi<input id="kfMua" type="date"></label></div>'+
 '<div class="k-row"><label>Ön lastik (bar)<input id="kfTf" type="text" inputmode="decimal" placeholder="2,5"></label><label>Arka lastik (bar)<input id="kfTr" type="text" inputmode="decimal" placeholder="2,9"></label></div>'+
 '<p>Lastik değerlerini motorunun kullanım kılavuzundan gir. Marc bunları kontrol etmez.</p>'+
 '<label>Servisim<input id="kfSrvN" type="text" placeholder="Servis adı"></label>'+
 '<label>Servis telefonu<input id="kfSrvT" type="tel" placeholder="0 5xx xxx xx xx"></label>'+
 '<div class="k-act"><button id="kfCancel">Vazgeç</button><button class="k-ok" id="kfSave">Kaydet</button></div>'+
'</div></div>'+
'<div class="k-modal" id="kSumM" hidden><div class="k-form" role="dialog" aria-label="Sürüş özeti">'+
 '<h3 id="kSumT">Sürüş bitti</h3>'+
 '<div class="k-sum" id="kSumG"></div>'+
 '<p id="kSumP"></p>'+
 '<div class="k-act" id="kSumA"></div>'+
'</div></div>';
while(host.firstChild)document.body.appendChild(host.firstChild);

var $=function(i){return document.getElementById(i)};
var BIND={};
(function ticks(){
  var tk='';
  for(var i=0;i<=10;i++){var a=(150+i*24)*Math.PI/180;
    tk+='<line x1="'+(150+92*Math.cos(a)).toFixed(1)+'" y1="'+(130+92*Math.sin(a)).toFixed(1)+'" x2="'+(150+99*Math.cos(a)).toFixed(1)+'" y2="'+(130+99*Math.sin(a)).toFixed(1)+'" stroke="#3a4452" stroke-width="2"/>';
  }
  $('kTicks').innerHTML=tk;
})();
BRANDS.forEach(function(b){var o=document.createElement('option');o.value=b;o.textContent=b;$('kfBrand').appendChild(o)});

/* ---------- Yardımcılar ---------- */
function f1(n){return n.toFixed(1).replace('.',',')}
function days(s){if(!s)return null;var d=new Date(s+'T00:00:00'),t=new Date();t.setHours(0,0,0,0);return Math.round((d-t)/864e5)}
function dtr(s){if(!s)return '';return new Date(s+'T00:00:00').toLocaleDateString('tr-TR')}
function hav(a,b){
  var R=6371000,r=Math.PI/180,dLa=(b[0]-a[0])*r,dLo=(b[1]-a[1])*r;
  var x=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLo/2)*Math.sin(dLo/2);
  return 2*R*Math.asin(Math.sqrt(x));
}
function dateCard(card,val,sub,s){
  var n=days(s);card.className='k-it';
  if(n===null){$(val).textContent='—';$(sub).textContent='tarih gir';return}
  if(n<0){$(val).textContent='Süresi geçti';card.className='k-it k-bad'}
  else{$(val).textContent=n+' gün';if(n<=14)card.className='k-it k-bad';else if(n<=60)card.className='k-it k-warn'}
  $(sub).textContent=dtr(s);
}
function fillProfile(){
  var nm=((P.brand||'')+' '+(P.model||'')).trim();
  $('kName').textContent=nm?(nm+(P.year?' · '+P.year:'')):'Motorunu tanıt';
  $('kKm').textContent=(P.km!==''&&P.km!=null)?Number(P.km).toLocaleString('tr-TR')+' km':'—';
  dateCard($('kCSig'),'kSig','kSigD',P.sig);
  dateCard($('kCMua'),'kMua','kMuaD',P.mua);
  $('kTire').textContent=(P.tf&&P.tr)?'Ön '+P.tf+' · Arka '+P.tr:'—';
}

/* ---------- Sürüş durumu ---------- */
var S={v:0,max:0,dist:0,t0:0,movMs:0,active:false,boot:false,wid:null,pts:[],last:null,lastT:0,wake:null};
function resetRide(){S.v=0;S.max=0;S.dist=0;S.t0=Date.now();S.movMs=0;S.pts=[];S.last=null;S.lastT=0;S.tickT=0}
var demoT=0;

function caption(){
  var lock=S.active&&S.v>10, c;
  if(lock)c='Hareket halinde düzenleme kilitli. Sürüş sırasında ekrana bakma.';
  else if(!nm())c='Motorunu tanıtmak için “Motorumu düzenle”ye dokun. Sürüş sırasında ekrana bakma.';
  else c='Sürüş sırasında ekrana bakma. Lastik değerleri senin girdiğin fabrika değeridir.';
  $('kCap').textContent=c;
  $('kEditBtn').disabled=lock;
  function nm(){return (P.brand||P.model)}
}
function render(){
  var v=Math.round(S.v);
  if(!S.boot){
    $('kSpd').textContent=v;
    $('kArc').setAttribute('stroke-dasharray',Math.min(100,v/200*100).toFixed(1)+' 100');
  }
  $('kMx').textContent=Math.round(S.max);
  $('kTrip').textContent=f1(S.dist/1000)+' km';
  var s=S.t0?Math.floor((Date.now()-S.t0)/1000):0;
  if(!S.active&&!DEMO)s=S.endSec||0;
  $('kDur').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  var hrs=S.movMs/3.6e6;
  $('kAvg').textContent=hrs>0.0005?Math.round((S.dist/1000)/hrs):0;
  var d=new Date();$('kClock').textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  caption();
}
setInterval(function(){
  if($('kCock').hidden&&!S.active)return;
  if(DEMO&&!S.boot){demoT+=.25;S.v=Math.max(0,62+34*Math.sin(demoT/5)+10*Math.sin(demoT/1.7));S.max=Math.max(S.max,S.v);S.dist+=S.v/3.6*.25;S.movMs+=250;S.t0=S.t0||Date.now()}
  if(!$('kCock').hidden)render();
},250);

/* ---------- Açılış: ibre süpürür, sonra veriler ---------- */
var autoT=null;
function sweep(){
  S.boot=true;$('kBrand').setAttribute('opacity','1');$('kSpd').setAttribute('opacity','0');$('kUnit').setAttribute('opacity','0');
  var t0=performance.now(),DUR=2600;
  (function step(now){
    var p=Math.min(1,(now-t0)/DUR),k=p<.5?p*2:(1-p)*2;
    $('kArc').setAttribute('stroke-dasharray',(k*100).toFixed(1)+' 100');
    if(p<1){requestAnimationFrame(step)}
    else{S.boot=false;$('kBrand').setAttribute('opacity','0');$('kSpd').setAttribute('opacity','1');$('kUnit').setAttribute('opacity','1');render()}
  })(t0);
}
function openCock(auto){
  var c=$('kCock');c.hidden=false;c.classList.remove('k-out');
  fillProfile();render();sweep();
  clearTimeout(autoT);
  var bar=$('kBar');bar.classList.remove('k-go');bar.style.visibility=auto?'visible':'hidden';
  $('kClose').textContent=auto?'Geç ›':'Kapat';
  if(auto){void bar.offsetWidth;bar.classList.add('k-go');autoT=setTimeout(closeCock,13000)}
  syncRideBtn();
}
function closeCock(){
  clearTimeout(autoT);var c=$('kCock');c.classList.add('k-out');
  setTimeout(function(){c.hidden=true},500);
}
$('kCock').addEventListener('pointerdown',function(e){
  if(e.target.id!=='kClose'){clearTimeout(autoT);$('kBar').style.visibility='hidden';$('kClose').textContent='Kapat'}
});
$('kClose').onclick=closeCock;
$('kPill').onclick=function(){openCock(false)};

/* ---------- Servis ---------- */
$('kSrv').onclick=function(){
  if(P.srvT){window.location.href='tel:'+String(P.srvT).replace(/[^0-9+]/g,'')}
  else openEdit(true);
};

/* ---------- Motorumu düzenle ---------- */
function openEdit(focusTel){
  $('kfBrand').value=P.brand||'BMW';$('kfModel').value=P.model||'';$('kfKm').value=P.km;$('kfYear').value=P.year||'';
  $('kfSig').value=P.sig||'';$('kfMua').value=P.mua||'';$('kfTf').value=P.tf||'';$('kfTr').value=P.tr||'';
  $('kfSrvN').value=P.srvN||'';$('kfSrvT').value=P.srvT||'';
  $('kEdit').hidden=false;if(focusTel)$('kfSrvT').focus();
}
$('kEditBtn').onclick=function(){openEdit(false)};
$('kfCancel').onclick=function(){$('kEdit').hidden=true};
$('kfSave').onclick=function(){
  P.brand=$('kfBrand').value;P.model=$('kfModel').value.trim();P.km=$('kfKm').value;P.year=$('kfYear').value;
  P.sig=$('kfSig').value;P.mua=$('kfMua').value;P.tf=$('kfTf').value.trim();P.tr=$('kfTr').value.trim();
  P.srvN=$('kfSrvN').value.trim();P.srvT=$('kfSrvT').value.trim();
  save();$('kEdit').hidden=true;fillProfile();render();
};

/* ---------- Sürüş kaydı ---------- */
function syncRideBtn(){
  var b=$('kRide');
  b.textContent=S.active?'■ Sürüşü bitir':'▶ Sürüşü başlat';
  b.className=S.active?'k-rec-btn':'k-main';
  $('kGps').textContent=S.active?'● Kayıt':'Hazır';
  $('kGps').className=S.active?'k-rec':'';
  $('kPill').hidden=!S.active||!$('kCock').hidden;
}
setInterval(function(){$('kPill').hidden=!S.active||!$('kCock').hidden},500);

function onPos(p){
  var c=p.coords,now=Date.now();
  if(c.accuracy!=null&&c.accuracy>60)return;
  var pt=[c.latitude,c.longitude];
  var rep=(c.speed!=null&&isFinite(c.speed))?c.speed*3.6:null;   // telefonun bildirdiği hız (km/sa), yoksa null
  var tick=S.tickT?Math.min(10000,now-S.tickT):0;S.tickT=now;
  var v=rep||0;
  if(S.last){
    var d=hav(S.last,pt),dt=Math.max(1,now-S.lastT);
    var moved=d>=Math.max(12,c.accuracy||0)||(rep!==null&&rep>=3&&d>=6);   // durağan GPS oynamasını sayma
    if(moved){
      var comp=(d/(dt/1000))*3.6;
      if(comp>300)return;   // GPS sıçraması: bu noktayı yok say
      if(rep===null||rep<1)v=comp;
      S.dist+=d;S.pts.push(pt);S.last=pt;S.lastT=now;
    }
    if(v>=3)S.movMs+=tick;
  }else{S.last=pt;S.lastT=now;S.pts.push(pt)}
  S.v=Math.max(0,v);S.max=Math.max(S.max,S.v);
  $('kGps').textContent='● Kayıt';
  render();
}
function onPosErr(e){
  if(e&&e.code===1){   // izin verilmedi: kaydı durdur
    stopWatch();S.active=false;$('kCap').textContent='Konum izni verilmedi. Telefon ayarlarından Marc’a konum izni ver.';syncRideBtn();return;
  }
  // sinyal zayıf / zaman aşımı: kaydı bozma, beklemeye devam et
  $('kGps').textContent='Sinyal zayıf…';
}
function stopWatch(){
  if(S.wid!=null&&navigator.geolocation)navigator.geolocation.clearWatch(S.wid);S.wid=null;
  try{if(S.wake){S.wake.release();S.wake=null}}catch(e){}
}
async function takeWake(){try{if('wakeLock' in navigator)S.wake=await navigator.wakeLock.request('screen')}catch(e){}}
document.addEventListener('visibilitychange',function(){if(S.active&&document.visibilityState==='visible')takeWake()});

function startRide(){
  if(DEMO){S.active=true;resetRide();syncRideBtn();return}
  if(!navigator.geolocation){$('kCap').textContent='Bu cihaz konumu desteklemiyor.';return}
  resetRide();S.active=true;S.endSec=0;
  $('kGps').textContent='Aranıyor…';
  S.wid=navigator.geolocation.watchPosition(onPos,onPosErr,{enableHighAccuracy:true,maximumAge:0,timeout:30000});
  takeWake();syncRideBtn();
}
function endRide(){
  var sec=Math.floor((Date.now()-S.t0)/1000);S.endSec=sec;
  stopWatch();S.active=false;S.v=0;syncRideBtn();render();
  showSummary(sec);
}
$('kRide').onclick=function(){if(S.active)endRide();else startRide()};

function fmtSure(s){if(s<60)return s+' sn';var h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?h+' sa '+m+' dk':m+' dk'}
function showSummary(sec){
  var km=S.dist/1000,hrs=S.movMs/3.6e6,avg=hrs>0.0005?Math.round(km/hrs):0;
  var g=$('kSumG'),a=$('kSumA'),p=$('kSumP');a.innerHTML='';
  if(km<0.3||S.pts.length<2){
    $('kSumT').textContent='Sürüş çok kısa';
    g.innerHTML='';p.textContent='0,3 km’den kısa sürüşler kaydedilmez.';
    var k=document.createElement('button');k.textContent='Tamam';k.onclick=function(){$('kSumM').hidden=true};a.appendChild(k);
    $('kSumM').hidden=false;return;
  }
  $('kSumT').textContent='Sürüş bitti';
  g.innerHTML='<div><small>Yol</small><b>'+f1(km)+' km</b></div><div><small>Süre</small><b>'+fmtSure(sec)+'</b></div>'+
    '<div><small>En yüksek</small><b>'+Math.round(S.max)+' km/sa</b></div><div><small>Ortalama</small><b>'+avg+' km/sa</b></div>';
  p.textContent='Konum izi yalnızca bu telefonda durur. Rota İmaj’a aktarırsan sürüş haritaya çizilir, videoyu sen hazırlayıp paylaşırsın.';
  var b1=document.createElement('button');b1.className='k-ok';b1.textContent='Rota İmaj videosu yap';
  b1.onclick=function(){
    try{
      var step=Math.max(1,Math.ceil(S.pts.length/1500)),out=[];
      for(var i=0;i<S.pts.length;i+=step)out.push([+S.pts[i][0].toFixed(5),+S.pts[i][1].toFixed(5)]);
      var l=S.pts[S.pts.length-1];out.push([+l[0].toFixed(5),+l[1].toFixed(5)]);
      localStorage.setItem(RIDE_KEY,JSON.stringify({pts:out,km:+km.toFixed(1),sure:sec,t:Date.now()}));
      window.location.href='../rota.html?marc=1';
    }catch(e){p.textContent='Sürüş kaydı aktarılamadı. Tarayıcı depolama alanı dolu olabilir.'}
  };
  var b2=document.createElement('button');
  var kmAdd=Math.round(km);
  b2.textContent='Km’me ekle (+'+kmAdd+')';
  b2.onclick=function(){
    if(P.km===''||P.km==null){p.textContent='Önce “Motorumu düzenle”den motorunun şu anki km’sini gir.';return}
    P.km=Number(P.km)+kmAdd;save();fillProfile();b2.disabled=true;b2.textContent='Eklendi ✓';
  };
  var b3=document.createElement('button');b3.textContent='Kapat';b3.onclick=function(){$('kSumM').hidden=true};
  a.appendChild(b1);a.appendChild(b2);a.appendChild(b3);
  $('kSumM').hidden=false;
}

window.MarcKokpit={open:openCock,close:closeCock,demo:DEMO};
})();
