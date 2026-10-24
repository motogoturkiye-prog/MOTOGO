/* MARC O.S. 3.0 — Servis ve Yol Yardım.
   Sadece MotoGo'daki firmalar gösterilir: üye servisler (firmalar tablosu) ve yol yardım firmaları (yardim_firmalari).
   Sohbette "İzmir Buca BMW servisi" ya da "Ankara'da çekici lazım" yazılınca açılır. */
(function(){
var C=window.MARC_CONFIG||{};
var NOMI='https://nominatim.openstreetmap.org';

var css=document.createElement('style');
css.textContent=
'.sv{display:flex;flex-direction:column;gap:12px;width:100%}'+
'.sv-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}'+
'.sv-title{font-size:16px;font-weight:800;letter-spacing:-.01em}'+
'.sv-count{font-size:12.5px;color:#9aa1ad}'+
'.sv-chips{display:flex;gap:7px;flex-wrap:wrap}'+
'.sv-chip{min-height:36px;padding:0 13px;border-radius:99px;border:1px solid #2a2e37;background:#14161b;color:#cfd4dc;font:inherit;font-size:13px;font-weight:600;cursor:pointer}'+
'.sv-chip[aria-pressed="true"]{background:var(--accent,#f9eb22);border-color:var(--accent,#f9eb22);color:var(--ink,#16130a)}'+
'.sv-c{position:relative;border:1px solid #2a2e37;background:linear-gradient(180deg,#191c22,#15171c);border-radius:16px;padding:14px 14px 12px 17px;overflow:hidden}'+
'.sv-c:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#2ecc71}'+
'.sv-c.yy:before{background:var(--accent,#f9eb22)}'+
'.sv-top{display:flex;gap:11px;align-items:center}'+
'.sv-mono{flex:none;width:42px;height:42px;border-radius:12px;background:#22262e;display:grid;place-items:center;font-weight:800;font-size:15px;color:#e8eaee;letter-spacing:.02em}'+
'.sv-tt{min-width:0;flex:1}'+
'.sv-n{font-weight:800;font-size:15.5px;line-height:1.25;overflow-wrap:anywhere}'+
'.sv-sub{font-size:12.5px;color:#9aa1ad;margin-top:2px}'+
'.sv-b{display:inline-block;margin-top:7px;font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:99px;background:#12301d;color:#43d982;border:1px solid #1f6b3c;white-space:nowrap}'+
'.sv-c.yy .sv-b{background:#33300c;color:var(--accent,#f9eb22);border-color:#6b6414}'+
'.sv-loc{display:flex;gap:7px;align-items:flex-start;margin:11px 0 0;font-size:13px;color:#b4bac4;line-height:1.4}'+
'.sv-loc svg{flex:none;width:15px;height:15px;margin-top:1px;stroke:#7d8592;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'+
'.sv-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}'+
'.sv-tag{font-size:11.5px;padding:2px 8px;border-radius:7px;background:#20242c;color:#b4bac4}'+
'.sv-btns{display:grid;grid-template-columns:1.4fr 1fr;gap:8px;margin-top:12px}'+
'.sv-btns a{display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;border:1px solid #2f343e;color:#e8eaee;background:#20242c}'+
'.sv-btns a svg{width:17px;height:17px;fill:currentColor;flex:none}'+
'.sv-btns a.wa{background:#25d366;border-color:#25d366;color:#07240f}'+
'.sv-btns a.only{grid-column:1/-1}'+
'.sv-map{display:block;text-align:center;margin-top:8px;font-size:12.5px;color:#8f97a4;text-decoration:none}'+
'.sv-empty{border:1px dashed #343944;border-radius:16px;padding:18px 16px;text-align:center;color:#b4bac4;font-size:14px;line-height:1.5}'+
'.sv-empty b{display:block;color:#e8eaee;font-size:15px;margin-bottom:4px}'+
'.sv-ask{display:flex;flex-direction:column;gap:10px}'+
'.sv-ask p{margin:0}'+
'.sv-row{display:flex;gap:8px;flex-wrap:wrap}'+
'.sv-btn{min-height:44px;padding:0 18px;border-radius:12px;border:1px solid #2f343e;background:#20242c;color:#e8eaee;font:inherit;font-weight:700;font-size:14px;cursor:pointer}'+
'.sv-btn.p{background:var(--accent,#f9eb22);border-color:var(--accent,#f9eb22);color:var(--ink,#16130a)}'+
'.sv-f{display:flex;gap:8px}'+
'.sv-f input{flex:1;min-width:0;background:#14161b;border:1px solid #2a2e37;color:inherit;border-radius:12px;padding:0 13px;min-height:44px;font:inherit}'+
'.sv-note{font-size:12px;color:#7d8592;line-height:1.45}'+
'@media(max-width:380px){.sv-btns{grid-template-columns:1fr}}';
document.head.appendChild(css);

var IC={
 pin:'<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
 wa:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.300 2.4 1.500.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.400z"/></svg>',
 tel:'<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.100.4 2.300.6 3.600.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.500c.6 0 1 .4 1 1 0 1.300.2 2.500.6 3.600.1.300 0 .7-.2 1l-2.300 2.200z"/></svg>'
};

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function fold(s){return String(s||'').toLocaleLowerCase('tr').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]/g,'')}
function cleanIl(s){return fold(String(s||'').replace(/\s+(Province|İli|Ili)$/i,''))}
function digits(s){return String(s||'').replace(/\D/g,'')}
function waNum(s){var d=digits(s);if(!d)return '';if(d.indexOf('90')===0&&d.length>=12)return d;if(d.charAt(0)==='0')return '9'+d;if(d.length===10)return '90'+d;return d}
function telHref(s){var t=String(s||'').replace(/[^0-9+]/g,'');return t?'tel:'+t:''}
function hav(a,b,c,d){var R=6371,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)*Math.sin(y/2);return 2*R*Math.asin(Math.sqrt(h))}
function tout(ms){var c=new AbortController();setTimeout(function(){c.abort()},ms);return c.signal}
function mono(n){var w=String(n||'').trim().split(/\s+/).filter(Boolean);return ((w[0]||'?').charAt(0)+(w[1]||'').charAt(0)).toLocaleUpperCase('tr')}
function brandName(k){if(BR&&BR[k])return BR[k];var s=String(k||'').replace(/[_-]+/g,' ').trim();if(!s)return '';return s.length<=3?s.toUpperCase():s.replace(/\b\w/g,function(c){return c.toLocaleUpperCase('tr')})}

function getPos(){return new Promise(function(ok,no){
  if(!navigator.geolocation){no(new Error('yok'));return}
  navigator.geolocation.getCurrentPosition(function(p){ok({lat:p.coords.latitude,lon:p.coords.longitude})},function(e){no(e)},{enableHighAccuracy:false,timeout:12000,maximumAge:120000});
})}
async function whereIs(lat,lon){
  var r=await fetch(NOMI+'/reverse?format=jsonv2&accept-language=tr&zoom=12&lat='+lat+'&lon='+lon,{signal:tout(9000)});
  if(!r.ok)throw new Error('nom');
  var a=(await r.json()).address||{};
  return {il:a.province||a.state||a.city||'',ilce:a.county||a.city_district||a.suburb||a.town||''};
}
async function geocode(q){
  var r=await fetch(NOMI+'/search?format=jsonv2&accept-language=tr&countrycodes=tr&limit=1&addressdetails=1&q='+encodeURIComponent(q),{signal:tout(9000)});
  if(!r.ok)throw new Error('nom');
  var j=await r.json();if(!j.length)return null;
  var a=j[0].address||{};
  return {lat:+j[0].lat,lon:+j[0].lon,il:a.province||a.state||'',ilce:a.county||a.city_district||a.suburb||''};
}
function mg(path){
  return fetch(C.MG_URL+'/rest/v1/'+path,{headers:{apikey:C.MG_KEY,Authorization:'Bearer '+C.MG_KEY},signal:tout(10000)}).then(function(r){if(!r.ok)throw new Error('mg');return r.json()});
}
function servisFirmalari(){return mg('firmalar?select=ad,marka,kategori,sehir,ilce,adres,telefon,whatsapp&kategori=in.(ozelServis,yetkiliServis)&limit=2000')}
function yardimFirmalari(){return mg('yardim_firmalari?select=ad,sehir,bolge_metni,telefon,whatsapp,lat,lng,kategoriler&limit=1000')}

var YCAT={cekici:'Çekici / Transfer',lastik:'Lastik',genel_ariza:'Genel arıza'};

function card(o){
  var h='<article class="sv-c'+(o.yy?' yy':'')+'"><div class="sv-top"><div class="sv-mono">'+esc(mono(o.ad))+'</div><div class="sv-tt"><div class="sv-n">'+esc(o.ad)+'</div>'+(o.sub?'<div class="sv-sub">'+esc(o.sub)+'</div>':'')+'<span class="sv-b">'+(o.yy?'MotoGo yol yardım':'✓ MotoGo onaylı')+'</span></div></div>';
  var loc=[];if(o.yer)loc.push(esc(o.yer));if(o.km!=null)loc.push(o.km<1?'1 km’den yakın':Math.round(o.km)+' km uzakta');
  if(loc.length||o.adres)h+='<div class="sv-loc">'+IC.pin+'<span>'+loc.join(' · ')+(o.adres?(loc.length?'<br>':'')+esc(o.adres):'')+'</span></div>';
  if(o.tags&&o.tags.length)h+='<div class="sv-tags">'+o.tags.map(function(t){return '<span class="sv-tag">'+esc(t)+'</span>'}).join('')+'</div>';
  var wa=waNum(o.wa||o.tel);if(!/^905\d{9}$/.test(wa))wa='';var tel=telHref(o.tel||o.wa);
  var b='';
  if(wa)b+='<a class="wa'+(tel?'':' only')+'" href="https://wa.me/'+wa+'" target="_blank" rel="noopener">'+IC.wa+'WhatsApp</a>';
  if(tel)b+='<a'+(wa?'':' class="only"')+' href="'+tel+'">'+IC.tel+'Ara</a>';
  if(b)h+='<div class="sv-btns">'+b+'</div>';
  if(o.lat!=null&&o.lng!=null)h+='<a class="sv-map" href="https://www.google.com/maps/dir/?api=1&destination='+o.lat+','+o.lng+'" target="_blank" rel="noopener">Yol tarifi al</a>';
  return h+'</article>';
}

function emptyCard(title,msg){return '<div class="sv-empty"><b>'+esc(title)+'</b>'+esc(msg)+'</div>'}

var BR=null;
async function brands(){
  if(BR)return BR;BR={};
  try{
    var t=await (await fetch('../js/brands-data.js',{signal:tout(6000)})).text(),re=/key:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"/g,m;
    while((m=re.exec(t)))BR[m[1]]=m[2];
  }catch(e){}
  return BR;
}
function detectBrand(text,keys){
  var ws=String(text||'').toLocaleLowerCase('tr').split(/[^a-z0-9çğıöşü]+/).filter(Boolean).map(fold),g={};
  for(var i=0;i<ws.length;i++){g[ws[i]]=1;if(i+1<ws.length)g[ws[i]+ws[i+1]]=1;if(i+2<ws.length)g[ws[i]+ws[i+1]+ws[i+2]]=1}
  var best=null;keys.forEach(function(k){var f=fold(k);if(f.length>=3&&g[f]&&(!best||fold(best).length<f.length))best=k});
  return best;
}
async function runServis(box,y){
  box.innerHTML='<p class="sv-note">MotoGo onaylı servisler aranıyor…</p>';
  var mem=null;try{mem=await servisFirmalari()}catch(e){}
  if(!mem){box.innerHTML=emptyCard('Liste şu an yüklenemedi','Bağlantını kontrol edip birkaç saniye sonra tekrar yaz.');return}
  var il=cleanIl(y.il),ilce=fold(y.ilce);
  var keys=[];mem.forEach(function(r){if(r.marka&&keys.indexOf(r.marka)<0)keys.push(r.marka)});
  var bm=await brands();Object.keys(bm).forEach(function(k){if(keys.indexOf(k)<0)keys.push(k)});
  var mk=y.hepsi?null:detectBrand(y.text,keys);
  var rows=[];
  mem.forEach(function(r){
    if(il&&cleanIl(r.sehir)!==il)return;
    if(mk&&r.marka!==mk)return;
    var brandOk=!!mk;
    rows.push({ad:r.ad,yer:[r.ilce,r.sehir].filter(Boolean).join(', '),adres:r.adres,tel:r.telefon,wa:r.whatsapp||r.telefon,
      sub:(r.kategori==='yetkiliServis'?'Yetkili servis':'Özel servis')+(r.marka?' · '+brandName(r.marka):''),
      s:(brandOk?0:2)+(ilce&&fold(r.ilce)===ilce?0:1)});
  });
  rows.sort(function(a,b){return a.s-b.s||String(a.ad).localeCompare(String(b.ad),'tr')});
  var yer=[y.ilce,y.il].filter(Boolean).join(', ')||'Bulunduğun yer';
  if(mk)yer+=' · '+brandName(mk);
  if(!rows.length){
    var ttl=mk?((y.il?y.il+'’da ':'')+brandName(mk)+' için henüz MotoGo onaylı servis yok'):(y.il?y.il+' için henüz MotoGo onaylı servis yok':'Bu bölgede servis yok');
    box.innerHTML='<div class="sv"><div class="sv-head"><span class="sv-title">'+esc(yer)+'</span></div>'+emptyCard(ttl,'MotoGo’ya katılan servisler burada görünecek.')+'<div class="sv-row">'+(mk?'<button class="sv-btn p" id="svAll" type="button">'+esc(y.il||'Bu şehir')+'’daki tüm servisleri göster</button>':'')+'<button class="sv-btn" id="svOther" type="button">Başka şehir ara</button></div></div>';
    var al=box.querySelector('#svAll');if(al)al.onclick=function(){var z={}; for(var k in y)z[k]=y[k]; z.hepsi=true; runServis(box,z)};
    var o=box.querySelector('#svOther');if(o)o.onclick=function(){cityForm(box,'servis','Hangi şehirde arayalım?')};return}
  var h='<div class="sv"><div class="sv-head"><span class="sv-title">'+esc(yer)+'</span><span class="sv-count">'+rows.length+' MotoGo onaylı servis</span></div>';
  h+=rows.slice(0,15).map(card).join('');
  h+='</div>';
  box.innerHTML=h;
}

async function runYardim(box,pos,y){
  box.innerHTML='<p class="sv-note">MotoGo yol yardım firmaları aranıyor…</p>';
  var all=null;try{all=await yardimFirmalari()}catch(e){}
  if(!all){box.innerHTML=emptyCard('Liste şu an yüklenemedi','Bağlantını kontrol edip birkaç saniye sonra tekrar yaz.');return}
  var rows=all.map(function(r){
    var km=(pos&&r.lat!=null&&r.lng!=null)?hav(pos.lat,pos.lon,+r.lat,+r.lng):null;
    return {yy:1,ad:r.ad,yer:r.bolge_metni||r.sehir||'',tel:r.telefon,wa:r.whatsapp||r.telefon,lat:r.lat,lng:r.lng,km:km,cats:r.kategoriler||[],
      tags:(r.kategoriler||[]).map(function(c){return YCAT[c]||c}),sub:'Yol yardım'};
  });
  rows.sort(function(a,b){return (a.km==null?1e9:a.km)-(b.km==null?1e9:b.km)});
  if(pos){var yakin=rows.filter(function(r){return r.km!=null&&r.km<=150});rows=yakin.length?yakin:rows.slice(0,3)}
  var cur='';
  function draw(){
    var list=rows.filter(function(r){return !cur||r.cats.indexOf(cur)>=0}).slice(0,10);
    var h='<div class="sv"><div class="sv-head"><span class="sv-title">Yol yardım</span><span class="sv-count">'+(pos?'Sana en yakın '+list.length+' firma':list.length+' firma')+'</span></div>';
    h+='<div class="sv-chips">'+[['','Hepsi']].concat(Object.keys(YCAT).map(function(k){return [k,YCAT[k]]})).map(function(c){return '<button class="sv-chip" type="button" data-c="'+c[0]+'" aria-pressed="'+(cur===c[0])+'">'+esc(c[1])+'</button>'}).join('')+'</div>';
    h+=list.length?list.map(card).join(''):emptyCard('Bu başlıkta firma yok','Başka bir başlık seçmeyi dene.');
    h+='</div>';box.innerHTML=h;
    box.querySelectorAll('.sv-chip').forEach(function(b){b.onclick=function(){cur=b.dataset.c;draw()}});
  }
  draw();
}

function cityForm(box,mode,msg){
  box.innerHTML='<div class="sv-ask"><p>'+esc(msg)+'</p><div class="sv-f"><input id="svCity" type="text" placeholder="Şehir ya da ilçe, örn. Buca İzmir" aria-label="Şehir"><button class="sv-btn p" id="svGo" type="button">Ara</button></div></div>';
  var go=async function(){
    var q=document.getElementById('svCity').value.trim();if(!q)return;
    box.innerHTML='<p class="sv-note">Aranıyor…</p>';
    try{var p=await geocode(q);if(!p){cityForm(box,mode,'Bu yeri bulamadım. Şehir adını biraz farklı yazar mısın?');return}start(box,mode,p,{il:p.il,ilce:p.ilce,marka:null})}
    catch(e){cityForm(box,mode,'Yer bulunamadı. Bağlantını kontrol edip tekrar dene.')}
  };
  document.getElementById('svGo').onclick=go;
  document.getElementById('svCity').onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();go()}};
}
function askLocation(box,mode){
  box.innerHTML='<div class="sv-ask"><p>'+(mode==='yardim'?'Sana en yakın yol yardım firmalarını bulmak için konumuna ihtiyacım var.':'Servisleri bulmak için bulunduğun yeri öğrenmem gerekiyor.')+'</p><div class="sv-row"><button class="sv-btn p" id="svLoc" type="button">Konumumu kullan</button><button class="sv-btn" id="svMan" type="button">Şehir yazayım</button></div><p class="sv-note">Konumun sadece bu arama için kullanılır, kaydedilmez.</p></div>';
  document.getElementById('svLoc').onclick=async function(){
    box.innerHTML='<p class="sv-note">Konum alınıyor…</p>';
    try{var p=await getPos();var loc=null;try{loc=await whereIs(p.lat,p.lon)}catch(e){}
      start(box,mode,p,{il:loc&&loc.il,ilce:loc&&loc.ilce,marka:null})}
    catch(e){cityForm(box,mode,'Konuma erişemedim. Şehrini yazarak arayabilirsin.')}
  };
  document.getElementById('svMan').onclick=function(){cityForm(box,mode,'Hangi şehir ya da ilçede arayalım?')};
}
function start(box,mode,pos,y){if(mode==='yardim')runYardim(box,pos,y);else runServis(box,y)}

var MARKA=['bmw','honda','yamaha','ktm','kawasaki','suzuki','ducati','triumph','cfmoto','harley','vespa','piaggio','aprilia','moto guzzi','royal enfield','husqvarna','benelli','kuba','mondial','bajaj','mv agusta','gasgas','sym','kymco','jawa','aurora','arora','rks','voge','zontes','keeway','cf moto'];
var ILLER=['Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin','Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Isparta','Mersin','İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir','Kocaeli','Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş','Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas','Tekirdağ','Tokat','Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak','Aksaray','Bayburt','Karaman','Kırıkkale','Batman','Şırnak','Bartın','Ardahan','Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce'];
var SKIP={bana:1,bir:1,bmw:1,honda:1,yamaha:1,ktm:1,motosiklet:1,motor:1,servis:1,servisi:1,yetkili:1,ozel:1,oner:1,onerir:1,misin:1,var:1,mi:1,en:1,yakin:1,tamirci:1,usta:1,bayi:1,suzuki:1,kawasaki:1,ducati:1,triumph:1,cfmoto:1,vespa:1,cekici:1,yol:1,yardim:1,lazim:1,ariyorum:1};
function parseYer(text){
  var tk=String(text).split(/[\s,.'’]+/).filter(Boolean),il=null,ix=-1;
  for(var i=0;i<tk.length&&!il;i++){var f=fold(tk[i]);
    for(var j=0;j<ILLER.length;j++){var n=fold(ILLER[j]);
      if(f===n||(f.indexOf(n)===0&&f.length<=n.length+4&&/^(da|de|ta|te|dan|den|daki|deki|nin|nun|un)$/.test(f.slice(n.length)))){il=ILLER[j];ix=i;break}}}
  var marka=null;MARKA.forEach(function(m){if(!marka&&fold(text).indexOf(fold(m))>=0)marka=fold(m)});
  if(!il)return {il:'',ilce:'',marka:marka};
  var ilce='';
  [ix-1,ix+1].forEach(function(k){
    if(ilce||k<0||k>=tk.length)return;var t=tk[k];
    if(/^[A-ZÇĞİÖŞÜ]/.test(t)&&!SKIP[fold(t)]&&!ILLER.some(function(x){return fold(x)===fold(t)}))ilce=t.replace(/(da|de|ta|te)$/i,function(m){return t.length>4?'':m});
  });
  return {il:il,ilce:ilce,marka:marka};
}
function modeOf(text){return /(yol yardım|yolda kal|çekici|cekici|akü|marş|patlak|lastik patla|yolda kaldım|benzinim bitti)/i.test(String(text).toLocaleLowerCase('tr'))?'yardim':'servis'}

async function fromText(box,text){
  var mode=modeOf(text),y=parseYer(text);
  if(!y.il){askLocation(box,mode);return}
  box.innerHTML='<p class="sv-note">Aranıyor…</p>';
  var pos=null;
  if(mode==='yardim'){
    try{if(y.ilce)pos=await geocode(y.ilce+', '+y.il)}catch(e){}
    try{if(!pos)pos=await geocode(y.il)}catch(e){}
  }
  y.text=text;
  start(box,mode,pos,y);
}

window.MarcServis={fromText:fromText,parseYer:parseYer,modeOf:modeOf};
})();
