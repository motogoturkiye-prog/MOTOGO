/* MARC O.S. 3.0 — Yakınımdaki servis.
   Üyeler: MotoGo firma tablosundan (yeşil "MotoGo onaylı", WhatsApp'lı, en üstte).
   Diğerleri: OpenStreetMap'ten (rozetsiz, "MotoGo üyesi değil"). Kredi kartı / ücretli servis yok. */
(function(){
var C=window.MARC_CONFIG||{};
var NOMI='https://nominatim.openstreetmap.org';
var OVER=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];

var css=document.createElement('style');
css.textContent=
'.sv-wrap{display:flex;flex-direction:column;gap:10px;margin-top:6px}'+
'.sv-card{border:1px solid var(--line,#2a2e37);background:var(--panel2,#1b1e25);border-radius:12px;padding:12px 14px}'+
'.sv-card.on{border-color:#2ecc71;box-shadow:inset 3px 0 0 #2ecc71}'+
'.sv-h{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:3px}'+
'.sv-n{font-weight:700;font-size:15px}'+
'.sv-b{font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:99px;background:#16341f;color:#2ecc71;border:1px solid #2ecc71}'+
'.sv-x{font-size:11.5px;padding:2px 8px;border-radius:99px;background:#22252d;color:#9aa1ad;border:1px solid #2a2e37}'+
'.sv-m{font-size:13px;color:#9aa1ad;line-height:1.4}'+
'.sv-a{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px}'+
'.sv-a a,.sv-a button{display:inline-flex;align-items:center;min-height:40px;padding:0 14px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;border:1px solid #2a2e37;background:#22252d;color:#e8eaee;cursor:pointer;font-family:inherit}'+
'.sv-a a.wa{background:#1f7a42;border-color:#1f7a42;color:#fff}'+
'.sv-a a.call{background:var(--accent,#f9eb22);border-color:var(--accent,#f9eb22);color:var(--ink,#16130a)}'+
'.sv-t{margin:14px 0 2px;font-weight:700;font-size:13.5px;color:#c9ced6}'+
'.sv-note{font-size:12.5px;color:#9aa1ad;margin-top:8px;line-height:1.45}'+
'.sv-f{display:flex;gap:8px;margin-top:8px}'+
'.sv-f input{flex:1;min-width:0;background:#1b1e25;border:1px solid #2a2e37;color:inherit;border-radius:10px;padding:10px 12px;font:inherit}'+
'.sv-f button{min-height:42px;padding:0 16px;border-radius:10px;background:var(--accent,#f9eb22);color:var(--ink,#16130a);font-weight:700;border:0;font-family:inherit;cursor:pointer}';
document.head.appendChild(css);

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function fold(s){return String(s||'').toLocaleLowerCase('tr').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]/g,'')}
function cleanIl(s){return fold(String(s||'').replace(/\s+(Province|İli|Ili)$/i,''))}
function digits(s){return String(s||'').replace(/\D/g,'')}
function waNum(s){var d=digits(s);if(!d)return '';if(d.indexOf('90')===0&&d.length>=12)return d;if(d.charAt(0)==='0')return '9'+d;if(d.length===10)return '90'+d;return d}
function telHref(s){var t=String(s||'').replace(/[^0-9+]/g,'');return t?'tel:'+t:''}
function hav(a,b,c,d){var R=6371,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)*Math.sin(y/2);return 2*R*Math.asin(Math.sqrt(h))}
function tout(ms){var c=new AbortController();setTimeout(function(){c.abort()},ms);return c.signal}

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
  var r=await fetch(NOMI+'/search?format=jsonv2&accept-language=tr&countrycodes=tr&limit=1&q='+encodeURIComponent(q),{signal:tout(9000)});
  if(!r.ok)throw new Error('nom');
  var j=await r.json();if(!j.length)return null;
  return {lat:+j[0].lat,lon:+j[0].lon};
}
async function members(){
  var url=C.MG_URL+'/rest/v1/firmalar?select=ad,marka,kategori,sehir,ilce,adres,telefon,whatsapp,instagram&kategori=in.(ozelServis,yetkiliServis)&limit=2000';
  var r=await fetch(url,{headers:{apikey:C.MG_KEY,Authorization:'Bearer '+C.MG_KEY},signal:tout(10000)});
  if(!r.ok)throw new Error('mg');
  return await r.json();
}
async function osm(lat,lon){
  var q='[out:json][timeout:20];nwr["shop"="motorcycle"](around:25000,'+lat+','+lon+');out center 120;';
  for(var i=0;i<OVER.length;i++){
    try{
      var r=await fetch(OVER[i]+'?data='+encodeURIComponent(q),{signal:tout(16000)});
      if(!r.ok)continue;
      return (await r.json()).elements||[];
    }catch(e){}
  }
  throw new Error('osm');
}

var MARKA=['bmw','honda','yamaha','ktm','kawasaki','suzuki','ducati','triumph','cfmoto','harley','vespa','piaggio','aprilia','moto guzzi','royal enfield','husqvarna','benelli','kuba','mondial','bajaj','mv agusta','gasgas','sym','kymco','jawa','aurora','arora','rks','lifan','voge','zontes','keeway','cf moto'];
function yetkili(t){var x=(' '+(t.name||'')+' '+(t.brand||'')+' '+(t.operator||'')+' '+(t['brand:wikidata']?'':'')).toLocaleLowerCase('tr');return MARKA.some(function(m){return x.indexOf(m)>=0})}
function card(o){
  var h='<div class="sv-card'+(o.member?' on':'')+'"><div class="sv-h"><span class="sv-n">'+esc(o.ad)+'</span>'+
    (o.member?'<span class="sv-b">✓ MotoGo onaylı</span>':'<span class="sv-x">MotoGo üyesi değil</span>')+'</div>';
  var m=[];if(o.yer)m.push(esc(o.yer));if(o.km!=null)m.push(o.km.toFixed(1).replace('.',',')+' km');if(o.adres)m.push(esc(o.adres));
  if(m.length)h+='<div class="sv-m">'+m.join(' · ')+'</div>';
  var a='';
  if(o.tel&&telHref(o.tel))a+='<a class="call" href="'+telHref(o.tel)+'">📞 Ara</a>';
  if(o.member&&waNum(o.wa))a+='<a class="wa" href="https://wa.me/'+waNum(o.wa)+'" target="_blank" rel="noopener">WhatsApp</a>';
  if(o.lat!=null)a+='<a href="https://www.google.com/maps/dir/?api=1&destination='+o.lat+','+o.lon+'" target="_blank" rel="noopener">Yol tarifi</a>';
  if(o.member&&o.ig)a+='<a href="https://instagram.com/'+esc(String(o.ig).replace(/^.*instagram\.com\//,'').replace(/[@\/]/g,''))+'" target="_blank" rel="noopener">Instagram</a>';
  if(a)h+='<div class="sv-a">'+a+'</div>';
  return h+'</div>';
}

async function run(box,pos){
  box.innerHTML='<p class="small">Servisler aranıyor…</p>';
  var loc=null,mem=null,osmL=null,memErr=false,osmErr=false;
  try{loc=await whereIs(pos.lat,pos.lon)}catch(e){}
  var res=await Promise.allSettled([members(),osm(pos.lat,pos.lon)]);
  if(res[0].status==='fulfilled')mem=res[0].value;else memErr=true;
  if(res[1].status==='fulfilled')osmL=res[1].value;else osmErr=true;

  var il=loc?cleanIl(loc.il):'',ilce=loc?fold(loc.ilce):'';
  var mm=[];
  (mem||[]).forEach(function(r){
    if(il&&cleanIl(r.sehir)!==il)return;
    mm.push({member:1,ad:r.ad,yer:[r.ilce,r.sehir].filter(Boolean).join(' / '),adres:r.adres,tel:r.telefon,wa:r.whatsapp||r.telefon,ig:r.instagram,
      ayni:ilce&&fold(r.ilce)===ilce?0:1,tur:r.kategori==='yetkiliServis'?'Yetkili servis':'Özel servis'});
  });
  mm.sort(function(a,b){return a.ayni-b.ayni||String(a.ad).localeCompare(String(b.ad),'tr')});
  mm.forEach(function(o){if(o.tur)o.yer=o.tur+(o.yer?' · '+o.yer:'')});

  var names=mm.map(function(o){return fold(o.ad)});
  var oo=[];
  (osmL||[]).forEach(function(e){
    var t=e.tags||{},nm=t.name;if(!nm||!yetkili(t))return;
    var lat=e.lat!=null?e.lat:(e.center&&e.center.lat),lon=e.lon!=null?e.lon:(e.center&&e.center.lon);
    if(lat==null)return;
    var f=fold(nm);
    if(names.some(function(n){return n&&(n===f||(n.length>5&&f.indexOf(n)>=0)||(f.length>5&&n.indexOf(f)>=0))}))return;
    var ad=[t['addr:street'],t['addr:housenumber']].filter(Boolean).join(' ');
    oo.push({member:0,ad:nm,km:hav(pos.lat,pos.lon,lat,lon),lat:lat,lon:lon,tel:t.phone||t['contact:phone']||'',adres:ad,yer:t['addr:district']||t['addr:city']||''});
  });
  oo.sort(function(a,b){return a.km-b.km});oo=oo.slice(0,8);

  var h='';
  if(loc&&(loc.il||loc.ilce))h+='<p class="small">Konumun: '+esc([loc.ilce,loc.il].filter(Boolean).join(', '))+'</p>';
  if(mm.length){h+='<div class="sv-t">MotoGo onaylı servisler</div><div class="sv-wrap">'+mm.slice(0,12).map(card).join('')+'</div>'}
  else if(!memErr){h+='<div class="sv-t">MotoGo onaylı servisler</div><p class="sv-note">Bulunduğun ilde henüz MotoGo onaylı servis yok.</p>'}
  else h+='<p class="sv-note">MotoGo onaylı servis listesi şu an yüklenemedi. Biraz sonra tekrar dene.</p>';
  if(oo.length){h+='<div class="sv-t">Yakındaki yetkili servis ve bayiler</div><div class="sv-wrap">'+oo.map(card).join('')+'</div>'}
  else if(osmErr)h+='<p class="sv-note">Diğer servisler şu an yüklenemedi.</p>';
  else h+='<p class="sv-note">Yakınında kayıtlı yetkili servis bulunamadı.</p>';
  h+='<p class="sv-note">Üye olmayan yetkili servislerin bilgileri OpenStreetMap haritasından gelir, eksik ya da eski olabilir. Gitmeden önce aramanı öneririm.</p>';
  box.innerHTML=h;
}

function cityForm(box,msg){
  box.innerHTML='<p>'+esc(msg)+'</p><div class="sv-f"><input id="svCity" type="text" placeholder="Şehir ya da ilçe yaz, örn. Çankaya Ankara" aria-label="Şehir"><button id="svGo" type="button">Ara</button></div>';
  var go=async function(){
    var q=document.getElementById('svCity').value.trim();if(!q)return;
    box.innerHTML='<p class="small">Aranıyor…</p>';
    try{var p=await geocode(q);if(!p){cityForm(box,'Bu yeri bulamadım. Şehir adını biraz farklı yazar mısın?');return}run(box,p)}
    catch(e){cityForm(box,'Yer bulunamadı, bağlantını kontrol edip tekrar dene.')}
  };
  document.getElementById('svGo').onclick=go;
  document.getElementById('svCity').onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();go()}};
}

window.MarcServis={
  render:function(box){
    box.innerHTML='<p>Yakınındaki servisleri bulmak için konumuna ihtiyacım var. Konumun sadece bu arama için kullanılır, kaydedilmez.</p><div class="sv-a"><button class="call" id="svLoc" type="button" style="background:var(--accent,#f9eb22);color:var(--ink,#16130a);border-color:var(--accent,#f9eb22)">📍 Konumumu kullan</button><button id="svMan" type="button">Şehir yazayım</button></div>';
    document.getElementById('svLoc').onclick=async function(){
      box.innerHTML='<p class="small">Konum alınıyor…</p>';
      try{var p=await getPos();run(box,p)}catch(e){cityForm(box,'Konuma erişemedim. Şehrini yazarak da arayabilirsin.')}
    };
    document.getElementById('svMan').onclick=function(){cityForm(box,'Hangi şehir ya da ilçede servis arıyorsun?')};
  },
  _t:{fold:fold,cleanIl:cleanIl,waNum:waNum}
};
})();
