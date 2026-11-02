// ============================================================================
// MotoGo Garajım — motorcunun kendi sayfası
// Üyelik: mevcut "üye kodu" sistemi (uye_ol / uye_dogrula). Garaj verisi: garaj_motor
// tablosu, yalnızca garaj_oku / garaj_kaydet fonksiyonlarıyla (bkz. motogo-garaj-kurulum.txt)
// ============================================================================
(function () {
  'use strict';

  var SB = window.motogoSupabase;
  var $ = function (id) { return document.getElementById(id); };
  var LS_KOD = 'motogo_uye_kod';

  var DATA = { firma: {}, yardim: [], yakit: [], avantaj: [], ekspertiz: [], kilavuz: {} };
  var ST = { yk: '', rota: false, geri: 'vZiyaretci', kod: '', ad: '', garaj: null, acik: null, sekme: '', hosgeldin: false, onMarka: '' };

  // ---------- yardımcılar ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(k) { return String(k || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function cihaz() {
    var c = null;
    try { c = localStorage.getItem('motogo_cihaz'); } catch (e) {}
    if (!c) {
      c = 'c' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { localStorage.setItem('motogo_cihaz', c); } catch (e) {}
    }
    return c;
  }
  function trKucuk(s) { return String(s || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr'); }
  function brandByKey(k) { for (var i = 0; i < BRANDS.length; i++) if (BRANDS[i].key === k) return BRANDS[i]; return null; }
  function brandByName(n) {
    var t = trKucuk(n).trim(); if (!t) return null;
    for (var i = 0; i < BRANDS.length; i++) if (trKucuk(BRANDS[i].name) === t) return BRANDS[i];
    return null;
  }
  function temizTel(raw) {
    if (!raw) return '';
    var d = String(raw).replace(/[^0-9]/g, '');
    if (d.indexOf('0') === 0) d = '90' + d.slice(1);
    if (d.indexOf('90') !== 0 && d.length === 10) d = '90' + d;
    return d;
  }
  function webUrl(u) { if (!u) return ''; u = String(u).trim(); return /^https?:\/\//i.test(u) ? u : 'https://' + u; }
  function sayi(v) { var n = parseInt(String(v == null ? '' : v).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? null : n; }
  function fmt(n) { return n == null ? '' : Number(n).toLocaleString('tr-TR'); }
  function gunFarki(t) {
    if (!t) return null;
    var h = new Date(t + 'T00:00:00'), b = new Date(); b.setHours(0, 0, 0, 0);
    return Math.round((h - b) / 86400000);
  }
  var toastT = null;
  function toast(m) {
    var e = document.querySelector('.g-toast'); if (e) e.remove();
    e = document.createElement('div'); e.className = 'g-toast'; e.setAttribute('role', 'status'); e.textContent = m;
    document.body.appendChild(e);
    clearTimeout(toastT); toastT = setTimeout(function () { if (e.parentNode) e.remove(); }, 2300);
  }
  var GOR = ['vYukle', 'vZiyaretci', 'vUyeOl', 'vFirma', 'vGaraj', 'vAra', 'vSoz', 'vBasvuru', 'vUyg'];
  var SIMDI = null;
  function uyeMi() { return !!(ST.kod && ST.garaj && ST.garaj.marka); }
  function goster(id, push) {
    if (SIMDI && SIMDI !== id && id !== 'vYukle' && SIMDI !== 'vYukle') ST.geri = SIMDI;
    SIMDI = id;
    GOR.forEach(function (v) { $(v).hidden = (v !== id); });
    $('zUyeGiris').textContent = 'Garajım';
    if (push !== false && id !== 'vYukle') { try { history.pushState({ v: id }, '', location.pathname); } catch (e) {} }
    window.scrollTo(0, 0);
  }
  window.addEventListener('popstate', function (e) {
    if (!$('gApp').hidden) { appKapat(false); }
    var v = e.state && e.state.v;
    if (!v || GOR.indexOf(v) < 0) return;
    if (v === 'vGaraj' && !uyeMi()) v = 'vZiyaretci';
    goster(v, false);
  });

  var IK = {
    motorum: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/></svg>',
    bayi: '<svg viewBox="0 0 24 24"><path d="M4 10l1-5h14l1 5M5 10v9h14v-9M9 19v-5h6v5"/></svg>',
    aksesuar: '<svg viewBox="0 0 24 24"><path d="M6 8h12l1 12H5L6 8zM9 8a3 3 0 016 0"/></svg>',
    yol: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/></svg>',
    hatir: '<svg viewBox="0 0 24 24"><path d="M6 16v-5a6 6 0 0112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0"/></svg>',
    duzenle: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
    uyg: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>'
  };

  // ---------- veri: firmalar (mevcut tablolar) ----------
  var veriHazir = (function () {
    if (!SB) return Promise.resolve();
    function oku(t) { return Promise.resolve(SB.from(t).select('*')).then(function (r) { return (r && r.data) || []; }, function () { return []; }); }
    return Promise.all([oku('firmalar'), oku('yardim_firmalari'), oku('yakit_indirimleri'), oku('avantaj_kampanyalar'), oku('motor_kilavuzu'), oku('ekspertiz_firmalari')]).then(function (r) {
      r[0].forEach(function (x) {
        var key = x.marka + '_' + x.kategori;
        (DATA.firma[key] = DATA.firma[key] || []).push({ name: x.ad, whatsapp: x.whatsapp, phone: x.telefon, city: x.sehir, district: x.ilce, website: x.website, instagram: x.instagram, photo: x.foto_url, description: x.aciklama, address: x.adres, siraNo: x.sira_no });
      });
      DATA.yardim = r[1].map(function (x) { return { name: x.ad, region: x.bolge_metni, city: x.sehir, phone: x.telefon, whatsapp: x.whatsapp, categories: x.kategoriler || [], website: x.website, instagram: x.instagram, photo: x.foto_url, address: x.adres, siraNo: x.sira_no }; });
      DATA.yakit = r[2].map(function (x) { return { name: x.ad, city: x.sehir, district: x.ilce, whatsapp: x.whatsapp, phone: x.telefon, website: x.website, instagram: x.instagram, photo: x.foto_url, description: x.indirim_orani ? x.indirim_orani + ' indirim' : '', badge: 'İndirim', address: x.adres, siraNo: x.sira_no }; });
      DATA.avantaj = r[3].map(function (x) { return { name: x.firma_adi, kategori: x.kategori, city: x.sehir, description: [x.baslik, x.aciklama, x.odul].filter(Boolean).join(' · '), whatsapp: x.whatsapp, phone: x.telefon, website: x.website, instagram: x.instagram, photo: x.foto_url, badge: x.rozet || '', address: x.adres, siraNo: x.sira_no }; });
      DATA.ekspertiz = r[5].map(function (x) { return { name: x.ad, city: x.sehir, district: x.ilce, whatsapp: x.whatsapp, phone: x.telefon, website: x.website, description: x.aciklama, address: x.adres, siraNo: x.sira_no }; });
      r[4].forEach(function (x) { if (x.marka) DATA.kilavuz[x.marka] = x.bilgi; });
    }).catch(function () {});
  })();

  function sirala(a, b) {
    var sa = a.siraNo != null ? a.siraNo : 9999, sb = b.siraNo != null ? b.siraNo : 9999;
    if (sa !== sb) return sa - sb;
    return String(a.name).localeCompare(String(b.name), 'tr');
  }

  // Şehrindeki firmalar; yoksa diğer illerdekiler + dürüst bir uyarı; hiç yoksa null (bölüm gizlenir)
  function eslestir(liste, sehir, etiket) {
    var l = (liste || []).slice().sort(sirala);
    if (!l.length) return null;
    var ic = l.filter(function (f) { return !f.city || f.city === sehir; });
    if (ic.length) return { firmalar: ic, not: '' };
    return { firmalar: l.slice(0, 6), not: sehir + ' şehrinde henüz ' + etiket + ' firmamız yok. Diğer illerdeki firmalar senin için listelendi.' };
  }
  function bayiVerisi() {
    var g = ST.garaj; if (!g || !g.marka) return {};
    var b = brandByKey(g.marka), ad = b ? b.name : g.marka, out = {};
    [['yetkiliServis', 'Yetkili servis'], ['ozelServis', 'Özel servis']].forEach(function (s) {
      var m = eslestir(DATA.firma[g.marka + '_' + s[0]], g.sehir, ad + ' ' + s[1].toLowerCase());
      if (m) { m.etiket = s[1]; out[s[0]] = m; }
    });
    return out;
  }
  function aksesuarVerisi() {
    var g = ST.garaj; if (!g) return null;
    var hepsi = DATA.avantaj.concat(DATA.yakit);
    return eslestir(hepsi, g.sehir, 'aksesuar ve avantaj');
  }
  function yolVerisi() {
    var g = ST.garaj; if (!g) return null;
    var kats = (typeof YARDIM_CATEGORIES !== 'undefined' ? YARDIM_CATEGORIES : []), out = {}, any = false;
    kats.forEach(function (c) {
      var l = DATA.yardim.filter(function (f) { return f.city === g.sehir && (f.categories || []).indexOf(c.id) >= 0; }).sort(sirala);
      if (l.length) { out[c.id] = { firmalar: l, not: '', etiket: c.label }; any = true; }
    });
    return any ? out : null;
  }

  // ---------- firma kartı ----------
  function acikMi() { var d = new Date(), gun = d.getDay(), s = d.getHours() + d.getMinutes() / 60; return gun !== 0 && s >= 9 && s < 19; }
  var YARDIM_AD = {}; (typeof YARDIM_CATEGORIES !== 'undefined' ? YARDIM_CATEGORIES : []).forEach(function (c) { YARDIM_AD[c.id] = c.label; });
  function igUrl(v) { v = String(v || '').trim(); if (!v) return ''; if (/^https?:\/\//i.test(v)) return v; return 'https://www.instagram.com/' + v.replace(/^@/, '').replace(/^instagram\.com\//i, ''); }
  function firmaKart(f, o) {
    o = o || {};
    var wa = temizTel(f.whatsapp);
    var msg = encodeURIComponent('Merhaba, MotoGo üzerinden ulaşıyorum. ' + (o.amac || 'Bilgi') + ' için bilgi almak istiyorum.');
    var sorgu = f.address ? f.address : (f.name + ' ' + (f.district || '') + ' ' + (f.city || '')).trim();
    var rozet = f.badge ? '<span class="g-rozet ind">' + esc(f.badge) + '</span>' : '';
    var meta = [f.district, f.city, f.region].filter(Boolean).join(' · ');
    var chips = '';
    if (f.categories && f.categories.length) chips = '<div class="g-ch">' + f.categories.map(function (c) { return '<span>' + esc(YARDIM_AD[c] || c) + '</span>'; }).join('') + '</div>';
    var d = '';
    if (f.phone) d += '<a class="k" href="tel:' + esc(f.phone) + '">Ara</a>';
    if (wa) d += '<a href="https://wa.me/' + wa + '?text=' + msg + '" target="_blank" rel="noopener">WhatsApp</a>';
    if (f.instagram) d += '<a href="' + esc(igUrl(f.instagram)) + '" target="_blank" rel="noopener">Instagram</a>';
    if (f.website) d += '<a href="' + esc(webUrl(f.website)) + '" target="_blank" rel="noopener">Web</a>';
    d += '<a href="https://www.google.com/maps/search/' + encodeURIComponent(sorgu) + '" target="_blank" rel="noopener">Konum</a>';
    var foto = false ? '<img class="g-fth" src="' + esc(f.photo) + '" alt="' + esc(f.name) + '" loading="lazy" data-lb="' + esc(f.photo) + '">' : '';
    return '<div class="g-firma' + '' + '">' + foto + '<div class="g-fic"><div class="a"><div><b>' + esc(f.name) + '</b>' + (meta ? '<small>' + esc(meta) + '</small>' : '') + '</div>' + rozet + '</div>' +
      chips + (f.description ? '<p>' + esc(f.description) + '</p>' : '') + (f.address ? '<small class="adr">' + esc(f.address) + '</small>' : '') + '<div class="g-d">' + d + '</div></div></div>';
  }
  function firmaListe(m, o) {
    return (m.not ? '<div class="g-uyari">' + esc(m.not) + '</div>' : '') + m.firmalar.slice(0, 12).map(function (f) { return firmaKart(f, o); }).join('');
  }

  // ---------- garaj verisi (sunucu) ----------
  function rpcOku(cb) {
    Promise.resolve(SB.rpc('garaj_oku', { p_kod: ST.kod, p_cihaz: cihaz() })).then(function (r) { cb(r && r.data); }, function () { cb(null); });
  }
  function kaydet(patch, cb) {
    var g = ST.garaj || {};
    var o = {};
    ['marka', 'model', 'yil', 'sehir', 'ilce', 'plaka', 'km', 'bakim_km', 'muayene', 'sigorta'].forEach(function (k) {
      o[k] = Object.prototype.hasOwnProperty.call(patch, k) ? patch[k] : (g[k] == null ? null : g[k]);
    });
    if (Object.prototype.hasOwnProperty.call(patch, 'foto')) o.foto = patch.foto;
    Promise.resolve(SB.rpc('garaj_kaydet', { p_kod: ST.kod, p_cihaz: cihaz(), p_veri: o })).then(function (r) {
      var d = r && r.data;
      if (d && d.ok) {
        ST.garaj = d.garaj || ST.garaj;
        cb(true);
      } else cb(false, d && d.neden);
    }, function () { cb(false, 'baglanti'); });
  }

  // ---------- Prime ve Reels (ana sayfa) ----------
  function yt(id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }
  var REEL_IDS = [];
  function primeKur() {
    var P = (typeof TV_PROGRAMS !== 'undefined' && TV_PROGRAMS) || [];
    if (!P.length) return;
    $('primeListe').innerHTML = P.slice(0, 3).map(function (v, i) {
      return '<a class="g-pv' + (i === 0 ? ' b' : '') + '" href="prime/"><span class="r"><img src="' + yt(v.youtubeId) + '" alt="" loading="lazy"><i class="pl"></i></span><b>' + esc(v.title) + '</b></a>';
    }).join('');
    $('bPrime').hidden = false;
  }
  function reelsKur() {
    if (!SB) return;
    Promise.resolve(SB.from('shorts_videolar').select('*')).then(function (r) {
      var d = (r && r.data) || [];
      d = d.slice().sort(function (a, b) { return (a.sira_no == null ? 9999 : a.sira_no) - (b.sira_no == null ? 9999 : b.sira_no); });
      var id = function (raw) { raw = String(raw || '').trim(); if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw; var m = raw.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; };
      REEL_IDS = d.map(function (v) { return id(v.youtube_id); }).filter(Boolean);
      if (!REEL_IDS.length) return;
      $('reelsListe').innerHTML = REEL_IDS.slice(0, 6).map(function (y, i) { return '<a class="g-rl" href="#" data-rl="' + i + '"><img src="' + yt(y) + '" alt="" loading="lazy"><i class="pl"></i></a>'; }).join('');
      $('bReels').hidden = false;
    }, function () {});
  }
  var rfGoz = null;
  function reelsAc(i) {
    var L = $('gRfListe');
    L.innerHTML = REEL_IDS.map(function (y, k) { return '<div class="g-rf-it" data-i="' + k + '" data-y="' + y + '"><div class="g-rf-kutu"><img src="' + yt(y) + '" alt=""><i class="pl"></i></div></div>'; }).join('');
    $('gReels').hidden = false; document.body.style.overflow = 'hidden';
    function aktif(it) {
      Array.prototype.forEach.call(L.querySelectorAll('iframe'), function (f) { f.parentNode.removeChild(f); });
      var kutu = it.querySelector('.g-rf-kutu'), y = it.getAttribute('data-y');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(y) + '?autoplay=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=' + encodeURIComponent(y);
      f.title = 'Reels'; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.setAttribute('allowfullscreen', '');
      kutu.appendChild(f);
    }
    if (rfGoz) rfGoz.disconnect();
    if ('IntersectionObserver' in window) {
      rfGoz = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio > 0.6) aktif(e.target); }); }, { root: L, threshold: [0.6] });
      Array.prototype.forEach.call(L.children, function (c) { rfGoz.observe(c); });
    }
    var hedef = L.children[i] || L.children[0];
    if (hedef) { L.scrollTop = hedef.offsetTop; if (!('IntersectionObserver' in window)) aktif(hedef); }
  }
  function reelsKapat() { if (rfGoz) rfGoz.disconnect(); $('gRfListe').innerHTML = ''; $('gReels').hidden = true; document.body.style.overflow = ''; }

  // Garajım düğmesi: üyeyse profil, değilse üye ol
  var HAZIR = Promise.resolve();
  function garajaGit(marka) {
    HAZIR.then(function () {
      if (!ST.kod) uyeOlGoster(marka || '');
      else if (ST.garaj && ST.garaj.marka) garajGoster();
      else uyeOlGoster(marka || '', 'motor');
    });
  }

  // ---------- ziyaretçi ekranı ----------
  function ziyaretci() {
    var kutu = $('zMarkalar');
    if (!kutu.getAttribute('data-ok')) {
      kutu.setAttribute('data-ok', '1');
      ['BMW', 'KTM', 'Ducati', 'Honda', 'Bajaj', 'Yamaha'].forEach(function (n) {
        var b = brandByName(n); if (!b) return;
        var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'g-marka'; bt.textContent = b.name;
        bt.addEventListener('click', function () { garajaGit(b.name); });
        kutu.appendChild(bt);
      });
      var dg = document.createElement('button'); dg.type = 'button'; dg.className = 'g-marka'; dg.textContent = 'Diğer markalar…';
      dg.addEventListener('click', function () { garajaGit(''); });
      kutu.appendChild(dg);
    }
    goster('vZiyaretci');
  }

  // ---------- üye ol ----------
  var formHazir = false;
  function formKur() {
    if (formHazir) return; formHazir = true;
    var dl = $('uMarkaListe'); BRANDS.forEach(function (b) { var o = document.createElement('option'); o.value = b.name; dl.appendChild(o); });
    var y = $('uYil'), yil = new Date().getFullYear() + 1;
    for (var i = yil; i >= 1970; i--) { var o = document.createElement('option'); o.value = i; o.textContent = i; y.appendChild(o); }
    var s = $('uSehir'); CITIES.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; s.appendChild(o); });
  }
  var uyeModu = 'yeni'; // yeni: kimlikle birlikte, motor: üye var, sadece motor
  function uyeOlGoster(marka, mod) {
    formKur(); uyeModu = mod || 'yeni';
    var yeni = uyeModu === 'yeni';
    $('uKimlik').hidden = !yeni; $('uOnayKutu').hidden = !yeni;
    $('uBaslik').textContent = 'Motorunu seç';
    $('uGonder').textContent = yeni ? 'Garajımı aç' : 'Kaydet';
    $('uDurum').textContent = ''; $('uDurum').className = 'g-durum';
    if (marka) $('uMarka').value = marka;
    goster('vUyeOl');
  }
  function uyeOlGonder() {
    var d = $('uDurum');
    function hata(m) { d.textContent = m; d.className = 'g-durum hata'; }
    var yeni = uyeModu === 'yeni';
    var ad = $('uAd').value.trim(), telRaw = $('uTel').value.trim(), mail = $('uMail').value.trim();
    var b = brandByName($('uMarka').value), model = $('uModel').value.trim(), yil = sayi($('uYil').value), sehir = $('uSehir').value, ilce = $('uIlce').value.trim();
    if (yeni && (!ad || !telRaw)) return hata('Ad soyad ve telefon zorunlu.');
    if (yeni && temizTel(telRaw).length < 12) return hata('Telefon numarasını başında 0 ile yaz: 05XX XXX XX XX');
    if (!b) return hata('Markayı listeden seç. Bulamazsan en yakın yazılışını dene.');
    if (!model) return hata('Motorunun modelini yaz.');
    if (!sehir) return hata('Şehrini seç.');
    if (!ilce) return hata('İlçeni ya da semtini yaz.');
    if (yeni && !$('uOnay').checked) return hata('Devam etmek için sözleşmeyi onaylaman gerekiyor.');
    if (!SB) return hata('Bağlantı kurulamadı, tekrar dene.');
    var btn = $('uGonder'); btn.disabled = true; d.textContent = yeni ? 'Garajın hazırlanıyor...' : 'Kaydediliyor...'; d.className = 'g-durum';
    var motor = { marka: b.key, model: model, yil: yil, sehir: sehir, ilce: ilce };
    function motoruYaz(sonra) {
      kaydet(motor, function (ok, neden) {
        btn.disabled = false;
        if (!ok) return hata('Garaj kaydedilemedi, tekrar dene.');
        sonra();
      });
    }
    if (!yeni) { motoruYaz(function () { ST.hosgeldin = false; garajGoster(); toast('Kaydedildi ✓'); }); return; }
    Promise.resolve(SB.rpc('uye_ol', { p_ad: ad, p_telefon: temizTel(telRaw) || telRaw, p_email: mail || null, p_il: sehir || null, p_sozlesme: true })).then(function (r) {
      var x = r && r.data;
      if (x && x.ok) {
        ST.kod = norm(x.kod); ST.ad = x.ad || ad; ST.rota = !!x.rota_imaj;
        try { localStorage.setItem(LS_KOD, ST.kod); } catch (e) {}
        motoruYaz(function () { ST.hosgeldin = true; garajGoster(); });
      } else if (x && x.neden === 'kayitli') {
        btn.disabled = false; hata('Bu telefon numarasıyla ücretli bir üyelik kayıtlı. Giriş için üye kodunu kullan ya da Asistan hattından bize yaz.');
      } else { btn.disabled = false; hata('Üyelik şu an oluşturulamadı. İnternetini kontrol edip tekrar dene.'); }
    }, function () { btn.disabled = false; hata('Üyelik şu an oluşturulamadı. İnternetini kontrol edip tekrar dene.'); });
  }

  // ---------- giriş (kayıtlı kod / üye kodu) ----------
  function dogrulaVeAc(kod, cb) {
    if (!SB) return cb(false, 'baglanti');
    ST.kod = norm(kod);
    rpcOku(function (d) {
      if (d && d.ok) {
        ST.ad = d.ad || ST.ad; ST.garaj = d.garaj || null;
        try { localStorage.setItem(LS_KOD, ST.kod); } catch (e) {}
        Promise.resolve(SB.rpc('uye_dogrula', { p_kod: ST.kod, p_cihaz: cihaz() })).then(function (r) { var x = r && r.data; ST.rota = !!(x && x.ok && x.rota_imaj); }, function () {});
        cb(true);
      } else {
        var n = d && d.neden;
        if (n === 'kod_yok' || n === 'suresi_doldu') { try { localStorage.removeItem(LS_KOD); } catch (e) {} }
        ST.kod = ''; cb(false, n || 'baglanti');
      }
    });
  }
  var MESAJ = {
    kod_yok: 'Bu kod geçerli değil. Kodu kontrol et.',
    suresi_doldu: 'Üyeliğinin süresi dolmuş. Yenilemek için bize yaz.',
    cihaz_siniri: 'Bu kod en fazla 5 cihazda kullanılabilir. Cihaz değiştirdiysen bize yaz.',
    baglanti: 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.'
  };
  function kodlaGiris() {
    var v = $('zKod').value, d = $('zKodDurum'), b = $('zKodGiris');
    if (!norm(v)) { d.textContent = 'Üye kodunu yaz.'; d.className = 'g-durum hata'; return; }
    b.disabled = true; d.textContent = 'Kontrol ediliyor...'; d.className = 'g-durum';
    dogrulaVeAc(v, function (ok, neden) {
      b.disabled = false;
      if (ok) { $('zKod').value = ''; d.textContent = ''; ST.hosgeldin = false; garajGoster(); }
      else { d.textContent = MESAJ[neden] || MESAJ.baglanti; d.className = 'g-durum hata'; }
    });
  }

  // ---------- garaj ekranı ----------
  function garajGoster() {
    if (!ST.garaj || !ST.garaj.marka) { uyeOlGoster('', 'motor'); return; }
    veriHazir.then(function () { ST.acik = null; renderGaraj(); goster('vGaraj'); });
  }
  function kmDurum(g) {
    var k = g.km, b = g.bakim_km;
    if (k == null || b == null) return null;
    var kalan = b - k;
    return { kalan: kalan, oran: Math.max(4, Math.min(100, Math.round(k / b * 100))) };
  }
  function hatirSatirlari(g) {
    var s = [], kd = kmDurum(g);
    if (kd) {
      if (kd.kalan <= 0) s.push(['k', 'Bakım ' + fmt(Math.abs(kd.kalan)) + ' km geçmiş.']);
      else if (kd.kalan <= 500) s.push(['t', 'Bakıma ' + fmt(kd.kalan) + ' km kaldı.']);
      else s.push(['y', 'Bakıma ' + fmt(kd.kalan) + ' km var.']);
    }
    [['muayene', 'Muayene'], ['sigorta', 'Sigorta']].forEach(function (p) {
      var f = gunFarki(g[p[0]]); if (f === null) return;
      if (f < 0) s.push(['k', p[1] + ' tarihi geçmiş.']);
      else if (f <= 14) s.push(['t', p[1] + ' ' + f + ' gün sonra.']);
      else s.push(['y', p[1] + ' güncel (' + f + ' gün var).']);
    });
    return s;
  }
  function satir(id, ik, baslik, ek) {
    var ac = ST.acik === id;
    return '<button type="button" class="g-satir' + (ac ? ' ac' : '') + '" data-sec="' + id + '" aria-expanded="' + ac + '">' + IK[ik] + '<span class="st">' + baslik + '</span>' + (ek ? '<span class="e">' + esc(ek) + '</span>' : '') + '<span class="o">' + (ac ? '⌃' : '›') + '</span></button>' +
      (ac ? '<div class="g-panel">' + PANEL[id]() + '</div>' : '');
  }

  var PANEL = {
    motorum: function () {
      var g = ST.garaj, b = brandByKey(g.marka), ad = b ? b.name : g.marka;
      var bilgi = (DATA.kilavuz[g.marka] || (b && b.info) || '').trim();
      return '<p class="g-etk">Motorunun kısa künyesi</p><div class="g-kunye">' +
        '<div><small>Marka</small><b>' + esc(ad) + '</b></div><div><small>Model</small><b>' + esc(g.model || '-') + '</b></div>' +
        '<div><small>Model yılı</small><b>' + esc(g.yil || '-') + '</b></div><div><small>Şehir</small><b>' + esc(g.sehir || '-') + '</b></div></div>' +
        (bilgi ? '<div class="g-hakkinda"><b>' + esc(ad) + ' hakkında</b><br>' + esc(bilgi) + '</div>' : '');
    },
    bayi: function () {
      var v = bayiVerisi(), ks = Object.keys(v); if (!ks.length) return '';
      if (!v[ST.sekme]) ST.sekme = ks[0];
      var tab = '<div class="g-sekme">' + ks.map(function (k) { return '<button type="button" data-tab="' + k + '" class="' + (k === ST.sekme ? 's' : '') + '">' + v[k].etiket + '</button>'; }).join('') + '</div>';
      var b = brandByKey(ST.garaj.marka);
      return tab + '<p class="g-etk">Sadece ' + esc(b ? b.name : '') + ' firmaları</p>' + firmaListe(v[ST.sekme], { durum: true, amac: (b ? b.name : '') + ' ' + v[ST.sekme].etiket });
    },
    aksesuar: function () { var m = aksesuarVerisi(); return m ? '<p class="g-etk">Tüm motorculara gösterilen firmalar</p>' + firmaListe(m, { amac: 'Aksesuar ve ekipman' }) : ''; },
    yol: function () {
      var v = yolVerisi(); if (!v) return '';
      var ks = Object.keys(v); if (!v[ST.yk]) ST.yk = v.cekici ? 'cekici' : ks[0];
      var tab = '<div class="g-sekme">' + ks.map(function (k) { return '<button type="button" data-yk="' + k + '" class="' + (k === ST.yk ? 's' : '') + '">' + esc(v[k].etiket) + '</button>'; }).join('') + '</div>';
      return tab + '<p class="g-etk">' + esc(ST.garaj.sehir) + ' · ' + esc(v[ST.yk].etiket) + '</p>' + firmaListe(v[ST.yk], { amac: 'Yol Yardım ' + v[ST.yk].etiket });
    },
    hatir: function () {
      var g = ST.garaj, s = hatirSatirlari(g);
      return (s.length ? s.map(function (x) { return '<p class="g-hat ' + x[0] + '">' + esc(x[1]) + '</p>'; }).join('') : '<p class="g-etk">Kilometreni, bakım kilometreni ve tarihleri gir, yaklaşınca burada görürsün.</p>') +
        '<div class="g-iki"><div class="g-alan"><label for="hKm">Güncel km</label><input type="text" inputmode="numeric" id="hKm" value="' + esc(g.km == null ? '' : g.km) + '"></div>' +
        '<div class="g-alan"><label for="hBakim">Bakım km</label><input type="text" inputmode="numeric" id="hBakim" value="' + esc(g.bakim_km == null ? '' : g.bakim_km) + '"></div></div>' +
        '<div class="g-iki"><div class="g-alan"><label for="hMuayene">Muayene tarihi</label><input type="date" id="hMuayene" value="' + esc(g.muayene || '') + '"></div>' +
        '<div class="g-alan"><label for="hSigorta">Sigorta bitiş</label><input type="date" id="hSigorta" value="' + esc(g.sigorta || '') + '"></div></div>' +
        '<button type="button" class="g-btn" id="hKaydet" style="margin-top:14px;">Kaydet</button><div class="g-durum" id="hDurum" role="status"></div>';
    },
    duzenle: function () {
      var g = ST.garaj, b = brandByKey(g.marka);
      var yil = new Date().getFullYear() + 1, yo = '<option value="">Seç</option>';
      for (var i = yil; i >= 1970; i--) yo += '<option value="' + i + '"' + (g.yil === i ? ' selected' : '') + '>' + i + '</option>';
      var so = '<option value="">Seç</option>' + CITIES.map(function (c) { return '<option' + (g.sehir === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
      return '<p class="g-etk">Motorunu sattın ve yenisini mi aldın? Marka ve modeli değiştir, listeler yeni motoruna göre değişir.</p>' +
        '<div class="g-alan"><label for="dMarka">Marka</label><input type="text" id="dMarka" list="dMarkaListe" value="' + esc(b ? b.name : '') + '" autocomplete="off"><datalist id="dMarkaListe">' + BRANDS.map(function (x) { return '<option value="' + esc(x.name) + '">'; }).join('') + '</datalist></div>' +
        '<div class="g-iki"><div class="g-alan"><label for="dModel">Model</label><input type="text" id="dModel" value="' + esc(g.model || '') + '"></div><div class="g-alan"><label for="dYil">Model yılı</label><select id="dYil">' + yo + '</select></div></div>' +
        '<div class="g-iki"><div class="g-alan"><label for="dSehir">Şehir</label><select id="dSehir">' + so + '</select></div><div class="g-alan"><label for="dIlce">İlçe / semt</label><input type="text" id="dIlce" value="' + esc(g.ilce || '') + '" maxlength="40"></div></div>' +
        '<div class="g-alan"><label for="dPlaka">Plaka</label><input type="text" id="dPlaka" value="' + esc(g.plaka || '') + '" maxlength="12" autocapitalize="characters"></div>' +
        '<button type="button" class="g-btn" id="dKaydet" style="margin-top:14px;">Kaydet</button><div class="g-durum" id="dDurum" role="status"></div>' +
        '<div class="g-kod">Üye kodum: <b>' + esc(ST.kod) + '</b><br>Başka telefondan girmek için bu kodu kullan, kimseyle paylaşma.<br><button type="button" id="kodKopya">Kodu kopyala</button></div>' +
        '<button type="button" class="g-cikis" id="cikisYap">Bu cihazdan çıkış yap</button>';
    },
    uyg: function () {
      var UC = [
        ['E', 'Etkinlik takvimi', 'Motorcu buluşmaları', 'Aç', '', 'etkinlik'],
        ['R', 'Rota önerileri', 'Güzel yollar', 'Aç', '', 'rota'],
        ['A', 'Aktivite Planım', 'Sürüş planı ve takvim', 'Aç', '', 'aktivite'],
        ['S', 'Sigorta', 'Trafik ve özel sigorta', 'Aç', '', 'sigorta'],
        ['K', 'Konaklama', 'Motorcuya uygun oteller', 'Aç', '', 'konaklama'],
        ['E', 'Ehliyet', 'Sürücü kursları', 'Aç', '', 'ehliyet'],
        ['S', 'Sürüş güvenliği', 'Eğitim ve güvenlik', 'Aç', '', 'guvenlik'],
        ['M', 'Mola noktaları', 'Kafe ve restoranlar', 'Aç', '', 'mola'],
        ['K', 'Kurye Ekspres', 'Kurye hizmeti', 'Aç', '', 'kurye'],
        ['Y', 'Yakıt', 'İstasyonlar ve indirimler', 'Aç', '', 'yakit'],
        ['M', 'Market', 'Motorcuya özel marketler', 'Aç', '', 'market'],
        ['E', 'Ekspertiz', 'Ekspertiz hizmetleri', 'Aç', '', 'ekspertiz'],
        ['S', 'Motor sözlüğü', 'Terimler ve açıklamaları', 'Aç', '', 'sozluk'],
        ['K', 'MotoGo Kart', 'Dijital üyelik kartı', 'Aç', '', 'kart']
      ];
      var UP = [
        ['F', 'Foto İmaj', 'Fotoğrafına MotoGo çerçevesi', 'Ücretsiz dene', 'g', 'foto'],
        ['M', 'Movi İmaj', 'Videoyu otomatik hazırlar', 'Ücretsiz dene', 'g', 'kurgu'],
        ['R', 'Rota İmaj', 'Rotandan paylaşım videosu', 'Paket', 'p', 'gun'],
        ['M', 'MARC O.S. 3.0', 'Motosiklet asistanı', 'Paket', 'p', 'marc']
      ];
      function sat(u) {
        return '<a class="g-uyg" href="#" data-uyg="' + u[5] + '"><span class="ik">' + u[0] + '</span><span><b>' + u[1] + '</b><small>' + u[2] + '</small></span><span class="d ' + u[4] + '">' + u[3] + '</span></a>';
      }
      return '<div class="g-grup">Ücretsiz uygulamalar</div>' + UC.map(sat).join('') +
        '<div class="g-grup">Ücretli uygulamalar</div>' + UP.map(sat).join('') +
        '<div class="g-paket"><b>Tek ödemede 4 uygulama.</b> Foto İmaj ve Movi İmaj ücretsiz denenir, çıktılarda MotoGo logosu olur. Rota İmaj ve MARC O.S. 3.0 ücretlidir. Ücretli üyelik dördünü de açar ve logoyu kaldırır.</div>';
    }
  };

  function renderGaraj() {
    var g = ST.garaj, b = brandByKey(g.marka), ad = b ? b.name : (g.marka || '');
    var kd = kmDurum(g), aktif = hatirSatirlari(g).length;
    var bayi = bayiVerisi(), aks = aksesuarVerisi(), yol = yolVerisi();
    var foto = g.foto ? '<img src="' + esc(g.foto) + '" alt="Motor fotoğrafı">' : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9aa0a8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>Fotoğraf';
    var h = '';
    h += '<div class="g-tepe"><h1 class="g-h1">Garajım</h1><button type="button" class="g-pil" id="gPaylas">Kartımı paylaş</button></div>';
    if (ST.hosgeldin) h += '<div class="g-karsila">Hoş geldin ' + esc((ST.ad || '').split(' ')[0]) + '. Garajın hazır. Üye kodun: <b>' + esc(ST.kod) + '</b>. Başka telefondan girmek için lazım olur, bir yere not et.</div>';
    var isim = (ST.ad || '').trim();
    if (!isim) { try { isim = (localStorage.getItem('motogo_garaj_ad') || '').trim(); } catch (e) {} }
    if (!isim) { try { isim = String((JSON.parse(localStorage.getItem('motogo_profilim') || '{}')).adSoyad || '').trim(); } catch (e) {} }
    var bas = isim ? isim.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toLocaleUpperCase('tr') : 'M';
    var av = g.foto ? '<img src="' + esc(g.foto) + '" alt="Profil fotoğrafı">' : '<span class="bas">' + esc(bas) + '</span>';
    h += '<div class="g-kimlik g-profil"><div class="g-profil-ust">' +
      '<button type="button" class="g-av' + (g.foto ? ' var' : '') + '" id="gFoto" aria-label="Fotoğraf yükle">' + av + '<i class="kam">+</i></button>' +
      '<div class="g-pb">' +
      (isim ? '<h2 class="g-ad" style="display:block;color:#f4f4f2;margin:0;">' + esc(isim) + '</h2>' : '<button type="button" class="g-adekle" id="gAdEkle">Adını ekle</button>') +
      '<div class="g-motor">' + esc((ad + ' ' + (g.model || '')).trim()) + (g.yil ? ' · ' + esc(g.yil) : '') + '</div>' +
      (g.sehir ? '<div class="g-konum">' + esc((g.ilce ? g.ilce + ', ' : '') + g.sehir) + '</div>' : '') +
      (g.plaka ? '<div class="g-plaka">' + esc(g.plaka) + '</div>' : '<button type="button" class="g-plaka bos" data-sec="duzenle">Plaka ekle</button>') +
      '</div></div>' +
      '<div class="g-km"><button type="button" data-sec="hatir"><small>Güncel km</small><b' + (g.km == null ? ' class="bos">Ekle' : '>' + fmt(g.km)) + '</b></button>' +
      '<button type="button" data-sec="hatir"><small>Bakım km</small><b' + (g.bakim_km == null ? ' class="bos">Ekle' : '>' + fmt(g.bakim_km)) + '</b></button></div>' +
      (kd ? '<div class="g-bar"><i style="width:' + kd.oran + '%"></i></div><div class="g-bar-not">' + (kd.kalan > 0 ? 'Bakıma ' + fmt(kd.kalan) + ' km kaldı' : 'Bakım zamanı geldi') + '</div>' : '') +
      '</div>';
    h += '<div class="g-liste">';
    h += satir('motorum', 'motorum', 'Motorum');
    if (Object.keys(bayi).length) h += satir('bayi', 'bayi', 'Bayiler ve servisler', ad);
    if (aks) h += satir('aksesuar', 'aksesuar', 'Aksesuar ve avantajlar');
    if (yol) h += satir('yol', 'yol', 'Yol Yardım');
    h += satir('hatir', 'hatir', 'Hatırlatıcılar', aktif ? aktif + ' aktif' : '');
    h += satir('duzenle', 'duzenle', 'Motorumu düzenle');
    h += satir('uyg', 'uyg', 'Diğer uygulamalar');
    h += '</div>';
    h += '<div class="g-alt"><a href="#" data-go="vAra" data-ara="yardim" class="g-btn kirmizi g-yol">Yolda mı kaldın? MotoGo Yol Yardım</a>' +
      '<div class="g-linkler"><a href="#" data-go="vAra">Firma ara</a><a href="https://motogo.com.tr/prime/">MotoGo Prime</a><a href="https://www.motogoprime.com/category/all-products" target="_blank" rel="noopener">Store</a></div></div>';
    $('vGaraj').innerHTML = h;
  }

  // ---------- paylaşım kartı (hikâye boyutu) ----------
  function paylasKarti() {
    var g = ST.garaj, b = brandByKey(g.marka);
    var isim = (ST.ad || '').trim();
    if (!isim) { try { isim = (localStorage.getItem('motogo_garaj_ad') || '').trim(); } catch (e) {} }
    if (!isim) { try { isim = String((JSON.parse(localStorage.getItem('motogo_profilim') || '{}')).adSoyad || '').trim(); } catch (e) {} }
    isim = isim || 'MotoGo Üyesi';
    var bas = isim.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toLocaleUpperCase('tr');
    var motor = ((b ? b.name : g.marka) + ' ' + (g.model || '')).trim();
    var konum = [g.ilce, g.sehir].filter(Boolean).join(', ');
    var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    function kutu(px, py, w, h, rr, fill) { x.beginPath(); x.moveTo(px + rr, py); x.arcTo(px + w, py, px + w, py + h, rr); x.arcTo(px + w, py + h, px, py + h, rr); x.arcTo(px, py + h, px, py, rr); x.arcTo(px, py, px + w, py, rr); x.closePath(); x.fillStyle = fill; x.fill(); }
    function yaz(t, px, py, size, w, col, mx, al) {
      x.font = w + ' ' + size + 'px Inter, "Segoe UI", sans-serif'; x.fillStyle = col; x.textBaseline = 'alphabetic'; x.textAlign = al || 'left';
      var s = t; while (x.measureText(s).width > (mx || 900) && s.length > 3) s = s.slice(0, -2); if (s !== t) s += '…';
      x.fillText(s, px, py);
    }
    function ciz(logo) {
      var gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#171a1f'); gr.addColorStop(1, '#0b0c0e');
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
      x.fillStyle = '#1d2026'; x.fillRect(0, 0, W, 330);
      x.fillStyle = '#f9eb22'; x.fillRect(0, 330, W, 12);
      if (logo) { var lw = 340, lh = lw * logo.height / logo.width; x.drawImage(logo, 70, 90, lw, lh); }
      // profil dairesi (fotoğraf paylaşılmaz, baş harfler)
      x.beginPath(); x.arc(210, 342, 142, 0, Math.PI * 2); x.fillStyle = '#0f1114'; x.fill();
      x.beginPath(); x.arc(210, 342, 128, 0, Math.PI * 2); x.fillStyle = '#23272e'; x.fill();
      x.lineWidth = 10; x.strokeStyle = '#f9eb22'; x.beginPath(); x.arc(210, 342, 128, 0, Math.PI * 2); x.stroke();
      yaz(bas, 210, 382, 104, '800', '#f9eb22', 200, 'center');
      // isim ve rozet
      yaz(isim, 70, 580, 78, '800', '#f4f4f2', 940);
      kutu(70, 618, 330, 62, 31, '#f9eb22'); yaz('MotoGo üyesi', 235, 661, 32, '800', '#14161b', 300, 'center');
      // motosiklet
      kutu(70, 730, 940, 270, 30, '#1b1e24');
      yaz('Motosiklet', 110, 790, 30, '500', '#9aa0a8', 860);
      yaz(motor, 110, 880, 76, '800', '#f4f4f2', 860);
      yaz((g.yil ? g.yil + ' model' : ''), 110, 950, 40, '600', '#f9eb22', 860);
      // konum
      kutu(70, 1030, 940, 150, 30, '#1b1e24');
      yaz('Konum', 110, 1090, 30, '500', '#9aa0a8', 860);
      yaz(konum || '-', 110, 1148, 54, '700', '#f4f4f2', 860);
      // alt
      yaz('Garajım', 70, 1268, 40, '800', '#f4f4f2', 400);
      yaz('motogo.com.tr', 1010, 1268, 40, '700', '#f9eb22', 500, 'right');
      c.toBlob(function (blob) {
        if (!blob) return toast('Kart oluşturulamadı');
        var f = new File([blob], 'motogo-garajim.png', { type: 'image/png' });
        var metin = 'MotoGo üyesi ' + isim + ': ' + motor + (g.yil ? ', ' + g.yil : '') + (konum ? ', ' + konum : '') + '. Garajım: https://motogo.com.tr';
        if (navigator.canShare && navigator.canShare({ files: [f] }) && navigator.share) {
          navigator.share({ files: [f], title: 'MotoGo Garajım', text: metin }).catch(function () {});
        } else {
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'motogo-garajim.png';
          document.body.appendChild(a); a.click(); a.remove(); toast('Kart indirildi, istediğin yerde paylaşabilirsin');
        }
      }, 'image/png');
    }
    var lg = new Image(); lg.onload = function () { ciz(lg); }; lg.onerror = function () { ciz(null); }; lg.src = 'img/logo.png';
  }

  // ---------- fotoğraf yükleme (küçültülmüş) ----------
  function fotoSec(file) {
    if (!file) return;
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var S = 320, s = Math.max(S / im.width, S / im.height), c = document.createElement('canvas'); c.width = S; c.height = S;
        var x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, S, S);
        x.drawImage(im, (S - im.width * s) / 2, (S - im.height * s) / 2, im.width * s, im.height * s);
        var data = c.toDataURL('image/jpeg', 0.82);
        kaydet({ foto: data }, function (ok) { if (ok) { renderGaraj(); toast('Kaydedildi ✓'); } else toast('Fotoğraf kaydedilemedi'); });
      };
      im.onerror = function () { toast('Fotoğraf okunamadı'); };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  // ---------- olaylar ----------
  function olaylar() {
    $('zAc').addEventListener('click', function () { garajaGit(''); });
    $('zUyeGiris').addEventListener('click', function (e) { e.preventDefault(); garajaGit(''); });
    $('uKodaGit').addEventListener('click', function (e) { e.preventDefault(); ziyaretci(); var k = $('zKodKutu'); k.open = true; $('zKod').focus(); });
    $('zKodGiris').addEventListener('click', kodlaGiris);
    $('zKod').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); kodlaGiris(); } });
    $('uVazgec').addEventListener('click', function (e) { e.preventDefault(); if (ST.kod && ST.garaj) garajGoster(); else ziyaretci(); });
    $('uGonder').addEventListener('click', uyeOlGonder);
    var nl = document.querySelector('.g-nav-logo'); if (nl) nl.addEventListener('click', function (e) { e.preventDefault(); ziyaretci(); });
    function firmaAc(e) { e.preventDefault(); goster('vFirma'); }
    Array.prototype.forEach.call(document.querySelectorAll('[data-firma]'), function (el) { el.addEventListener('click', firmaAc); });
    $('fGeri').addEventListener('click', function (e) { e.preventDefault(); ziyaretci(); });
    document.addEventListener('click', function (e) {
      var t = e.target; if (!t.closest) return;
      var g = t.closest('[data-go]');
      if (g) {
        e.preventDefault();
        var hedef = g.getAttribute('data-go');
        if (hedef === 'geri') { var gg = ST.geri || 'vZiyaretci'; if (gg === 'vGaraj' && !uyeMi()) gg = 'vZiyaretci'; if (gg === 'vYukle') gg = 'vZiyaretci'; goster(gg); }
        else if (hedef === 'vAra') araAc(g.getAttribute('data-ara') || '');
        else if (hedef === 'vBasvuru') basvuruAc();
        else goster(hedef);
        return;
      }
      var u = t.closest('[data-uyg]'); if (u) { e.preventDefault(); uygAc(u.getAttribute('data-uyg')); return; }
      var rl = t.closest('[data-rl]'); if (rl) { e.preventDefault(); reelsAc(parseInt(rl.getAttribute('data-rl'), 10) || 0); return; }
      var lb = t.closest('[data-lb]'); if (lb) { var kutu = document.createElement('div'); kutu.className = 'g-lb'; kutu.innerHTML = '<img src="' + esc(lb.getAttribute('data-lb')) + '" alt="">'; kutu.addEventListener('click', function () { kutu.remove(); }); document.body.appendChild(kutu); return; }
      var ak = t.closest('[data-ak]'); if (ak) { ARA.kat = ak.getAttribute('data-ak'); $('aSonuc').innerHTML = ''; araCiz(); return; }
      var ay = t.closest('[data-ay]'); if (ay) { ARA.yk = ay.getAttribute('data-ay'); araCiz(); return; }
      if (t.closest('#aAra')) { araSonuc(); return; }
      if (t.closest('#aUyeOl')) { uyeOlGoster(''); return; }
      if (t.closest('#fgKaydetBtn')) { basvuruGonder(); return; }
      if (t.closest('#gRx')) { reelsKapat(); return; }
      if (t.closest('#gAppGeri')) { appKapat(true); return; }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('gReels').hidden) reelsKapat(); });
    $('fgPaketOnay').addEventListener('change', function () { $('fgFormAlani').classList.toggle('g-kilitli', !this.checked); });
    $('gFotoDosya').addEventListener('change', function () { fotoSec(this.files && this.files[0]); this.value = ''; });

    $('vGaraj').addEventListener('click', function (e) {
      var t = e.target;
      var sec = t.closest && t.closest('[data-sec]');
      if (sec) { var id = sec.getAttribute('data-sec'); ST.acik = (ST.acik === id) ? null : id; renderGaraj(); var el = document.querySelector('.g-satir[data-sec="' + id + '"]'); if (el && ST.acik) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      var yk = t.closest && t.closest('[data-yk]');
      if (yk) { ST.yk = yk.getAttribute('data-yk'); renderGaraj(); return; }
      var tab = t.closest && t.closest('[data-tab]');
      if (tab) { ST.sekme = tab.getAttribute('data-tab'); renderGaraj(); return; }
      if (t.closest('#gFoto')) { $('gFotoDosya').click(); return; }
      if (t.closest('#gAdEkle')) {
        var n = (window.prompt('Adın soyadın') || '').trim();
        if (n) { ST.ad = n; try { localStorage.setItem('motogo_garaj_ad', n); } catch (er) {} renderGaraj(); }
        return;
      }
      if (t.closest('#gPaylas')) { paylasKarti(); return; }
      if (t.closest('#hKaydet')) {
        var km = sayi($('hKm').value), bk = sayi($('hBakim').value);
        var d = $('hDurum');
        if (km != null && bk != null && bk < km) { d.textContent = 'Bakım km, güncel km\'den küçük olamaz.'; d.className = 'g-durum hata'; return; }
        kaydet({ km: km, bakim_km: bk, muayene: $('hMuayene').value || null, sigorta: $('hSigorta').value || null }, function (ok) {
          if (ok) { renderGaraj(); toast('Kaydedildi ✓'); } else { d.textContent = 'Kaydedilemedi, tekrar dene.'; d.className = 'g-durum hata'; }
        });
        return;
      }
      if (t.closest('#dKaydet')) {
        var b = brandByName($('dMarka').value), d2 = $('dDurum');
        if (!b) { d2.textContent = 'Markayı listeden seç.'; d2.className = 'g-durum hata'; return; }
        if (!$('dModel').value.trim()) { d2.textContent = 'Modeli yaz.'; d2.className = 'g-durum hata'; return; }
        if (!$('dSehir').value) { d2.textContent = 'Şehrini seç.'; d2.className = 'g-durum hata'; return; }
        if (!$('dIlce').value.trim()) { d2.textContent = 'İlçeni ya da semtini yaz.'; d2.className = 'g-durum hata'; return; }
        var pl = $('dPlaka').value.trim().toUpperCase();
        kaydet({ marka: b.key, model: $('dModel').value.trim(), yil: sayi($('dYil').value), sehir: $('dSehir').value, ilce: $('dIlce').value.trim(), plaka: pl || null }, function (ok) {
          if (ok) { ST.sekme = ''; renderGaraj(); toast('Kaydedildi ✓'); } else { d2.textContent = 'Kaydedilemedi, tekrar dene.'; d2.className = 'g-durum hata'; }
        });
        return;
      }
      if (t.closest('#kodKopya')) {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ST.kod).then(function () { toast('Kod kopyalandı'); }, function () { toast(ST.kod); });
        else toast(ST.kod);
        return;
      }
      if (t.closest('#cikisYap')) {
        try { localStorage.removeItem(LS_KOD); } catch (er) {}
        ST.kod = ''; ST.garaj = null; ST.ad = ''; ziyaretci(); return;
      }
    });
  }

  // ---------- firma ara (kendi sitemizde) ----------
  var KATLAR = [['yetkiliServis', 'Yetkili servis'], ['ozelServis', 'Özel servis'], ['avantaj', 'Aksesuar ve ekipman'], ['yardim', 'Yol Yardım']];
  var ARA = { kat: 'yetkiliServis', yk: 'cekici', mod: 'tam', hazir: false };
  function araKur() {
    if (ARA.hazir) return; ARA.hazir = true;
    var dl = $('aMarkaListe'); BRANDS.forEach(function (b) { var o = document.createElement('option'); o.value = b.name; dl.appendChild(o); });
    var s = $('aSehir'); CITIES.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; s.appendChild(o); });
  }
  function araCiz() {
    $('aKat').innerHTML = KATLAR.map(function (k) { return '<button type="button" data-ak="' + k[0] + '" class="' + (k[0] === ARA.kat ? 's' : '') + '">' + k[1] + '</button>'; }).join('');
    var y = ARA.kat === 'yardim';
    var sade = ARA.mod === 'yardim';
    $('aKat').hidden = sade;
    $('aBaslik').textContent = sade ? 'Yol Yardım' : 'Firma ara';
    $('aMetin').textContent = sade ? 'Çekici, lastik ve genel arıza için şehrini seç, firmaları görüp hemen ara.' : 'Markana ve şehrine göre servis, aksesuar ve yol yardım firmalarını bul.';
    $('aYardimKat').hidden = !y;
    if (y) $('aYardimKat').innerHTML = (typeof YARDIM_CATEGORIES !== 'undefined' ? YARDIM_CATEGORIES : []).map(function (c) { return '<button type="button" data-ay="' + c.id + '" class="' + (c.id === ARA.yk ? 's' : '') + '">' + esc(c.label) + '</button>'; }).join('');
    $('aMarkaKutu').hidden = !(ARA.kat === 'yetkiliServis' || ARA.kat === 'ozelServis');
  }
  function araAc(kat) {
    araKur();
    ARA.mod = kat === 'yardim' ? 'yardim' : 'tam';
    if (kat) ARA.kat = kat;
    else if (ARA.kat === 'yardim' && ARA.mod === 'tam') ARA.kat = 'yetkiliServis';
    if (ST.garaj && !$('aMarka').value) { var b = brandByKey(ST.garaj.marka); if (b) $('aMarka').value = b.name; }
    if (ST.garaj && !$('aSehir').value && ST.garaj.sehir) $('aSehir').value = ST.garaj.sehir;
    $('aSonuc').innerHTML = ''; $('aDurum').textContent = '';
    araCiz(); goster('vAra');
  }
  function araSonuc() {
    var d = $('aDurum'); d.className = 'g-durum'; d.textContent = '';
    function hata(m) { d.textContent = m; d.className = 'g-durum hata'; }
    var kat = ARA.kat, sehir = $('aSehir').value;
    if (!sehir) return hata('Şehrini seç.');
    if (kat !== 'yardim' && !ST.kod) {
      $('aSonuc').innerHTML = '<div class="g-uyari g-uyari-b">Firmaları görmek için ücretsiz Garajım aç. Yol Yardım üye olmadan da açıktır.<button type="button" class="g-btn g-btn-k" id="aUyeOl">Garajımı aç</button></div>';
      return;
    }
    var b = null;
    if (kat === 'yetkiliServis' || kat === 'ozelServis') { b = brandByName($('aMarka').value); if (!b) return hata('Markayı listeden seç.'); }
    veriHazir.then(function () {
      var l = [], not = '', bos = '', amac = '', durum = false;
      var etik = KATLAR.filter(function (k) { return k[0] === kat; })[0][1];
      if (b) {
        var hepsi = (DATA.firma[b.key + '_' + kat] || []).slice().sort(sirala);
        l = hepsi.filter(function (f) { return !f.city || f.city === sehir; });
        if (!l.length && hepsi.length) { l = hepsi.slice(0, 9); not = sehir + ' şehrinde henüz ' + b.name + ' ' + etik.toLowerCase() + ' firmamız yok. Diğer illerdeki firmalar listelendi.'; }
        bos = b.name + ' ' + etik.toLowerCase() + ' firmamız henüz yok, yakında eklenecek.'; amac = b.name + ' ' + etik; durum = true;
      } else if (kat === 'yardim') {
        l = DATA.yardim.filter(function (f) { return (f.categories || []).indexOf(ARA.yk) >= 0 && f.city === sehir; }).sort(sirala);
        bos = 'Bu şehirde, bu Yol Yardım hizmetinde henüz üye firma yok, yakında eklenecek.'; amac = 'Yol Yardım'; durum = false;
      } else {
        var src = DATA.avantaj;
        l = src.filter(function (f) { return f.city === sehir; }).sort(sirala);
        bos = 'Bu şehirde henüz üye ' + etik.toLowerCase() + ' firması yok, yakında eklenecek.'; amac = etik;
      }
      var h = '';
      if (!l.length) h = '<div class="g-uyari g-uyari-b">' + esc(bos) + '</div>';
      else h = (not ? '<div class="g-uyari g-uyari-b">' + esc(not) + '</div>' : '') + '<div class="g-sonuc">' + l.slice(0, 30).map(function (f) { return firmaKart(f, { amac: amac }); }).join('') + '</div>';
      $('aSonuc').innerHTML = h;
    });
  }

  // ---------- uygulamalar (kendi sitemizde) ----------
  var UYG = {
    etkinlik: { ad: 'Etkinlik takvimi', tip: 'liste', tablo: 'etkinlikler' },
    rota: { ad: 'Rota önerileri', tip: 'liste', tablo: 'rotalar' },
    foto: { ad: 'Foto İmaj', tip: 'frame', src: function () { return 'foto.html?uye=' + (ST.rota ? 1 : 0); } },
    kurgu: { ad: 'Movi İmaj', tip: 'frame', src: function () { return 'kurgu.html?uye=' + (ST.rota ? 1 : 0); } },
    gun: { ad: 'Rota İmaj', tip: 'frame', src: function () { return 'rota.html'; }, ucretli: true },
    aktivite: { ad: 'Aktivite Planım', tip: 'frame', src: function () { return 'aktivite.html'; } },
    kurye: { ad: 'Kurye Ekspres', tip: 'frame', src: function () { return 'kurye.html'; } },
    sozluk: { ad: 'Motor sözlüğü', tip: 'link', src: function () { return 'sozluk/'; } },
    kart: { ad: 'MotoGo Kart', tip: 'kart' },
    ekspertiz: { ad: 'Ekspertiz', tip: 'ekspertiz' },
    guvenlik: { ad: 'Sürüş güvenliği', tip: 'guvenlik' },
    sigorta: { ad: 'Sigorta', tip: 'dir' },
    konaklama: { ad: 'Konaklama', tip: 'dir' },
    ehliyet: { ad: 'Ehliyet', tip: 'dir' },
    yakit: { ad: 'Yakıt', tip: 'dir' },
    market: { ad: 'Market', tip: 'dir' },
    mola: { ad: 'Mola noktaları', tip: 'dir' },
    marc: { ad: 'MARC O.S. 3.0', tip: 'link', src: function () { return 'marc-os/'; }, ucretli: true }
  };
  function uygAc(id) {
    var u = UYG[id]; if (!u) return;
    $('yBaslik').textContent = u.ad;
    var k = $('yIcerik');
    if (u.ucretli && !ST.rota) {
      k.innerHTML = '<div class="g-kutu"><h2>' + esc(u.ad) + ' ücretli üyelere açık</h2><p class="g-metin">Ücretli üyelik tek ödemeyle Foto İmaj, Movi İmaj, Rota İmaj ve MARC O.S. 3.0 uygulamalarını açar.</p><a class="g-btn" href="https://www.motogoprime.com/pricing-plans/plans-pricing" target="_blank" rel="noopener">Paketleri incele</a></div>';
      goster('vUyg'); return;
    }
    if (u.tip === 'link') { window.location.href = u.src(); return; }
    if (u.tip === 'dir') { dirAc(id); return; }
    if (u.tip === 'ekspertiz') { ekspAc(); return; }
    if (u.tip === 'kart') { kartAc(); return; }
    if (u.tip === 'guvenlik') {
      k.innerHTML = '<p class="g-metin">Yükleniyor...</p>'; goster('vUyg');
      Promise.resolve(SB.from('guvenlik_ipuclari').select('*')).then(function (r2) {
        var d = (r2 && r2.data) || [];
        $('yIcerik').innerHTML = d.length ? '<div class="g-sonuc">' + d.map(function (x) { return '<div class="g-firma"><p style="margin:0;font-size:14px;">' + esc(x.ipucu) + '</p></div>'; }).join('') + '</div>' : '<p class="g-metin">Şu an listelenmiş bir ipucu yok.</p>';
      }, function () { $('yIcerik').innerHTML = '<p class="g-metin">Yüklenemedi, tekrar dene.</p>'; });
      return;
    }
    if (u.tip === 'frame') { appAc(u.ad, u.src()); return; }
    k.innerHTML = '<p class="g-metin">Yükleniyor...</p>'; goster('vUyg');
    Promise.resolve(SB.from(u.tablo).select('*')).then(function (r) {
      var d = (r && r.data) || [], h = '';
      if (!d.length) h = '<p class="g-metin">Şu an listelenmiş bir kayıt yok.</p>';
      else if (id === 'etkinlik') h = '<div class="g-sonuc">' + d.map(function (e) { return '<div class="g-firma"><b>' + esc(e.ad) + '</b>' + (e.tarih_metni ? '<small>' + esc(e.tarih_metni) + '</small>' : '') + (e.konum ? '<small>' + esc(e.konum) + '</small>' : '') + (e.aciklama ? '<p>' + esc(e.aciklama) + '</p>' : '') + '</div>'; }).join('') + '</div>';
      else h = '<div class="g-sonuc">' + d.map(function (r2) { return '<div class="g-firma"><b>' + esc(r2.ad) + '</b><small>' + esc(r2.bolge || '') + '</small>' + (r2.not_metni ? '<p>' + esc(r2.not_metni) + '</p>' : '') + '<div class="g-d"><a class="k" href="https://www.google.com/maps/search/' + encodeURIComponent(r2.arama_terimi || r2.ad) + '" target="_blank" rel="noopener">Haritada aç</a></div></div>'; }).join('') + '</div>';
      $('yIcerik').innerHTML = h;
    }, function () { $('yIcerik').innerHTML = '<p class="g-metin">Yüklenemedi, tekrar dene.</p>'; });
  }

  // ---------- firma listeli uygulamalar (Sigorta, Konaklama, Ehliyet, Yakıt, Market, Mola) ----------
  var DIRC = {
    konaklama: { kat: 'konaklama', ad: 'Konaklama', turE: 'Tür', tur: ['Otel', 'Butik Otel', 'Pansiyon', 'Bungalov', 'Kamp', 'Villa'],
      oz: ['Havuzlu', 'Kahvaltı dahil', 'Yarım pansiyon', 'Tam pansiyon', 'Denize yakın', 'Göl kenarı', 'Dağ ve yayla', 'Motor için kapalı park'], il: true },
    sigorta: { kat: 'sigorta', ad: 'Sigorta', turE: 'Sigorta türü', tur: ['Trafik Sigortası', 'Özel Sigorta'], il: false },
    ehliyet: { kat: 'ehliyet', ad: 'Ehliyet', il: true, rehber: true },
    yakit: { kat: 'yakit', ad: 'Yakıt', turE: 'İstasyon markası', turDin: true, il: true },
    market: { kat: 'market', ad: 'Market', il: true },
    mola: { kat: 'mola', ad: 'Mola noktaları', turE: 'Tür', tur: ['Kafe', 'Restoran'], il: true, park: 'Motor için park yeri' }
  };
  var DIRS = {}, PROF = null;
  function liste(a) { var s = {}, o = []; a.forEach(function (x) { if (x && !s[x]) { s[x] = 1; o.push(x); } }); return o.sort(function (p, q) { return p.localeCompare(q, 'tr'); }); }
  function profilYukle(cb) {
    if (PROF) return cb();
    if (!SB || !ST.kod) { PROF = []; return cb(); }
    Promise.resolve(SB.rpc('uygulama_firmalari_oku', { p_kod: ST.kod })).then(function (r) { PROF = (r && r.data) || []; }, function () { PROF = []; }).then(cb);
  }
  function profKart(p, amac) {
    return firmaKart({ name: p.ad, city: p.il, district: p.ilce, phone: p.telefon, whatsapp: p.whatsapp, address: p.adres, badge: p.rozet, description: p.aciklama, categories: p.ozellikler || [], region: p.tur }, { amac: amac });
  }
  function chipSatir(opts, sel, key, coklu) {
    return '<div class="g-sekme">' + opts.map(function (o) { var s = coklu ? sel.indexOf(o) >= 0 : sel === o; return '<button type="button" data-dk="' + key + '" data-dv="' + esc(o) + '" class="' + (s ? 's' : '') + '">' + esc(o) + '</button>'; }).join('') + '</div>';
  }
  function secKutu(et, key, opts, val) {
    return '<div class="g-alan"><label>' + et + '</label><select data-ds="' + key + '">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></div>';
  }
  function dirAc(key) {
    $('yBaslik').textContent = DIRC[key].ad; $('yIcerik').innerHTML = '<p class="g-metin">Yükleniyor...</p>'; goster('vUyg');
    profilYukle(function () { dirCiz(key); });
  }
  function dirCiz(key) {
    var c = DIRC[key], st = DIRS[key] = DIRS[key] || { tur: 'Tümü', oz: [], il: 'Tümü', ilce: 'Tümü', park: false };
    var hepsi = PROF.filter(function (p) { return p.kategori === c.kat; });
    var h = '';
    if (c.rehber) h += '<div class="g-firma"><b>Motor ehliyeti rehberi</b><p>A1, A2 ve A sınıfları motorun hacmine ve gücüne göre ayrılır. Yaş ve koşullar için resmî kaynağı kontrol et.</p></div>';
    var turler = c.tur || (c.turDin ? liste(hepsi.map(function (p) { return p.tur; })) : null);
    if (hepsi.length) {
      if (turler && turler.length) h += '<label class="g-et">' + c.turE + '</label>' + chipSatir(['Tümü'].concat(turler), st.tur, 'tur', false);
      if (c.oz) h += '<label class="g-et">Özellik</label>' + chipSatir(c.oz, st.oz, 'oz', true);
      if (c.park) h += chipSatir([c.park], st.park ? [c.park] : [], 'park', true);
      if (c.il) {
        var ils = ['Tümü'].concat(liste(hepsi.map(function (p) { return p.il; })));
        var ilces = ['Tümü'];
        if (st.il !== 'Tümü') ilces = ilces.concat(liste(hepsi.filter(function (p) { return p.il === st.il; }).map(function (p) { return p.ilce; })));
        h += '<div class="g-iki">' + secKutu('İl', 'il', ils, st.il) + secKutu('İlçe', 'ilce', ilces, st.ilce) + '</div>';
      }
    }
    var sonuc = hepsi.filter(function (p) {
      if (turler && st.tur !== 'Tümü' && p.tur !== st.tur) return false;
      var f = p.ozellikler || [];
      for (var i = 0; i < st.oz.length; i++) if (f.indexOf(st.oz[i]) < 0) return false;
      if (c.il && st.il !== 'Tümü' && p.il !== st.il) return false;
      if (c.il && st.ilce !== 'Tümü' && p.ilce !== st.ilce) return false;
      if (c.park && st.park && f.indexOf(c.park) < 0) return false;
      return true;
    });
    if (hepsi.length) h += '<p class="g-etk">' + sonuc.length + ' sonuç</p><div class="g-sonuc">' + (sonuc.length ? sonuc.map(function (p) { return profKart(p, c.ad); }).join('') : '<p class="g-metin">Bu filtrelerle sonuç yok. Bir filtreyi kaldır.</p>') + '</div>';
    else h += '<div class="g-kutu"><h2>Burada henüz firma yok</h2><p class="g-metin">' + esc(c.ad) + ' bölümüne henüz firma eklenmedi. İlk firma sen olabilirsin.</p><a class="g-btn" href="#" data-go="vFirma">Firmalar için bilgi</a></div>';
    if (key === 'yakit' && DATA.yakit.length) h += '<div class="g-grup">Yakıt indirimleri</div><div class="g-sonuc">' + DATA.yakit.slice().sort(function (a, b) { return (a.siraNo == null ? 9999 : a.siraNo) - (b.siraNo == null ? 9999 : b.siraNo); }).map(function (f) { return firmaKart(f, { amac: 'Yakıt indirimi' }); }).join('') + '</div>';
    $('yIcerik').innerHTML = h;
    Array.prototype.forEach.call($('yIcerik').querySelectorAll('[data-dk]'), function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-dk'), v = b.getAttribute('data-dv');
        if (k === 'tur') st.tur = v; else if (k === 'park') st.park = !st.park;
        else { var i = st.oz.indexOf(v); if (i >= 0) st.oz.splice(i, 1); else st.oz.push(v); }
        dirCiz(key);
      });
    });
    Array.prototype.forEach.call($('yIcerik').querySelectorAll('select[data-ds]'), function (s) {
      s.addEventListener('change', function () { if (s.getAttribute('data-ds') === 'il') { st.il = s.value; st.ilce = 'Tümü'; } else st.ilce = s.value; dirCiz(key); });
    });
  }
  // ---------- ekspertiz ----------
  var EKS = { il: 'Tümü' };
  function ekspAc() { $('yBaslik').textContent = 'Ekspertiz'; goster('vUyg'); ekspCiz(); }
  function ekspCiz() {
    var d = DATA.ekspertiz.slice().sort(function (a, b) { return (a.siraNo == null ? 9999 : a.siraNo) - (b.siraNo == null ? 9999 : b.siraNo); });
    if (!d.length) { $('yIcerik').innerHTML = '<div class="g-kutu"><h2>Burada henüz firma yok</h2><p class="g-metin">Ekspertiz bölümüne henüz firma eklenmedi. İlk firma sen olabilirsin.</p><a class="g-btn" href="#" data-go="vFirma">Firmalar için bilgi</a></div>'; return; }
    var ils = ['Tümü'].concat(liste(d.map(function (f) { return f.city; })));
    var s = d.filter(function (f) { return EKS.il === 'Tümü' || f.city === EKS.il; });
    $('yIcerik').innerHTML = secKutu('İl', 'il', ils, EKS.il) + '<p class="g-etk">' + s.length + ' sonuç</p><div class="g-sonuc">' + s.map(function (f) { return firmaKart(f, { amac: 'Ekspertiz' }); }).join('') + '</div>';
    $('yIcerik').querySelector('select').addEventListener('change', function (e) { EKS.il = e.target.value; ekspCiz(); });
  }
  // ---------- MotoGo Kart ----------
  var KART_T = 0;
  function kartKod() { var n = ''; for (var i = 0; i < 6; i++) n += Math.floor(Math.random() * 10); return n.slice(0, 3) + ' ' + n.slice(3); }
  function qrCiz(cv, code) {
    if (!cv) return;
    var N = 25, sz = 8, x = cv.getContext('2d'), seed = 0;
    for (var i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) >>> 0;
    function rnd() { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967295; }
    x.fillStyle = '#fff'; x.fillRect(0, 0, N * sz, N * sz); x.fillStyle = '#111';
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var f = (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
      if (f) continue; if (rnd() > 0.52) x.fillRect(c * sz, r * sz, sz, sz);
    }
    [[0, 0], [0, N - 7], [N - 7, 0]].forEach(function (p) {
      x.fillStyle = '#111'; x.fillRect(p[1] * sz, p[0] * sz, 7 * sz, 7 * sz);
      x.fillStyle = '#fff'; x.fillRect((p[1] + 1) * sz, (p[0] + 1) * sz, 5 * sz, 5 * sz);
      x.fillStyle = '#111'; x.fillRect((p[1] + 2) * sz, (p[0] + 2) * sz, 3 * sz, 3 * sz);
    });
  }
  function kartAc() {
    $('yBaslik').textContent = 'MotoGo Kart'; goster('vUyg');
    if (KART_T) { clearInterval(KART_T); KART_T = 0; }
    var ad = (ST.ad || '').trim() || 'MotoGo Üyesi', kod = kartKod(), kalan = 30;
    var av = DATA.avantaj.slice().sort(function (a, b) { return (a.siraNo == null ? 9999 : a.siraNo) - (b.siraNo == null ? 9999 : b.siraNo); });
    $('yIcerik').innerHTML = '<div class="g-kartv"><div class="nm">' + esc(ad) + '</div><div class="no">MotoGo Kart</div><div class="qrw"><div class="qr"><canvas id="kQr" width="200" height="200" style="width:176px;height:176px" aria-label="Kart kodu"></canvas></div></div>' +
      '<div class="kod" id="kKod">' + kod + '</div><div class="kb"><i id="kBar" style="width:100%"></i></div><p class="g-etk" style="text-align:center;margin:8px 0 0">Kod her 30 saniyede yenilenir.</p></div>' +
      '<div class="g-grup">İndirimli firmalar (Aksesuar ve ekipman)</div>' +
      (av.length ? '<div class="g-sonuc">' + av.map(function (f) { return '<div class="g-firma"><div class="a"><div><b>' + esc(f.name) + '</b><small>' + esc((f.description || '') + (f.city ? ' · ' + f.city : '')) + '</small></div>' + (f.badge ? '<span class="g-rozet ind">' + esc(f.badge) + '</span>' : '') + '</div></div>'; }).join('') + '</div>' : '<p class="g-metin">İndirim veren firmalar eklendikçe burada listelenir.</p>') +
      '<p class="g-etk" style="margin-top:12px">Firmalarda okutma ve doğrulama, firma panelleri devreye alınınca açılır.</p>';
    qrCiz($('kQr'), kod);
    KART_T = setInterval(function () {
      if (!$('kKod')) { clearInterval(KART_T); KART_T = 0; return; }
      kalan--;
      if (kalan <= 0) { kalan = 30; kod = kartKod(); $('kKod').textContent = kod; qrCiz($('kQr'), kod); }
      $('kBar').style.width = (kalan / 30 * 100) + '%';
    }, 1000);
  }

  // ---------- uygulama: tam ekran ----------
  function appAc(ad, src) {
    $('gAppAd').textContent = ad; $('gAppFrame').src = src;
    $('gApp').hidden = false; document.body.style.overflow = 'hidden';
    try { history.pushState({ v: 'app' }, '', location.pathname); } catch (e) {}
  }
  function appKapat(geri) {
    if ($('gApp').hidden) return;
    $('gAppFrame').src = 'about:blank'; $('gApp').hidden = true; document.body.style.overflow = '';
    if (geri) { try { history.back(); } catch (e) {} }
  }

  // ---------- firma başvuru formu ----------
  var FG = ['fgFirmaUnvani', 'fgMarkaIsmi', 'fgYetkiliAdSoyad', 'fgAdres', 'fgFirmaTelefon', 'fgYetkiliGsm', 'fgEmail', 'fgWeb', 'fgVergiDairesi', 'fgVergiNo', 'fgTcKimlik', 'fgFaaliyetAlani', 'fgFirmaOzellikleri', 'fgHizmetPaketleri', 'fgOdemePlani'];
  function basvuruAc() {
    var p = {}; try { p = JSON.parse(localStorage.getItem('motogo_firma_basvuru') || '{}'); } catch (e) {}
    FG.forEach(function (id) { $(id).value = p[id] || ''; });
    $('fgOnay').checked = false; $('fgMesafeliSatis').checked = false; $('fgPaketOnay').checked = false;
    $('fgFormAlani').classList.add('g-kilitli');
    $('fgTarih').textContent = new Date().toLocaleDateString('tr-TR'); $('fgDurum').textContent = '';
    goster('vBasvuru');
  }
  function basvuruGonder() {
    var d = $('fgDurum');
    function m(t, c) { d.textContent = t; d.className = 'g-durum ' + (c || ''); }
    var v = {}; FG.forEach(function (id) { v[id] = $(id).value.trim(); });
    if (!$('fgPaketOnay').checked) return m('Devam etmek için önce paket satın alman ve kutuyu işaretlemen gerekiyor.', 'hata');
    if (!v.fgFirmaUnvani || !v.fgYetkiliAdSoyad || !v.fgYetkiliGsm) return m('Firma unvanı, yetkili adı soyadı ve yetkili GSM zorunlu.', 'hata');
    if (!$('fgOnay').checked || !$('fgMesafeliSatis').checked) return m('Devam etmek için iki onay kutusunu da işaretlemen gerekiyor.', 'hata');
    try { localStorage.setItem('motogo_firma_basvuru', JSON.stringify(v)); } catch (e) {}
    if (!SB) return m('Bağlantı kurulamadı, tekrar dene.', 'hata');
    m('Gönderiliyor...');
    Promise.resolve(SB.from('firma_basvurulari').insert({
      firma_unvani: v.fgFirmaUnvani, marka_ismi: v.fgMarkaIsmi || null, yetkili_ad_soyad: v.fgYetkiliAdSoyad, adres: v.fgAdres || null,
      firma_telefon: v.fgFirmaTelefon || null, yetkili_gsm: v.fgYetkiliGsm, email: v.fgEmail || null, web: v.fgWeb || null,
      vergi_dairesi: v.fgVergiDairesi || null, vergi_no: v.fgVergiNo || null, tc_kimlik: v.fgTcKimlik || null, faaliyet_alani: v.fgFaaliyetAlani || null,
      firma_ozellikleri: v.fgFirmaOzellikleri || null, hizmet_paketleri: v.fgHizmetPaketleri || null, odeme_plani: v.fgOdemePlani || null, onay: true
    })).then(function (r) {
      if (r && r.error) m('Gönderilemedi, tekrar dene. Bilgilerin bu cihazda saklandı.', 'hata');
      else m('Başvurun alındı. Teşekkürler.', 'ok');
    }, function () { m('Gönderilemedi, tekrar dene. Bilgilerin bu cihazda saklandı.', 'hata'); });
  }

  // ---------- başlangıç ----------
  function basla() {
    olaylar();
    var kayitli = null;
    try { kayitli = localStorage.getItem(LS_KOD); } catch (e) {}
    ziyaretci();
    if (!kayitli) return;
    HAZIR = new Promise(function (res) { dogrulaVeAc(kayitli, function () { res(); }); });
  }
  try { history.replaceState({ v: 'vZiyaretci' }, '', location.pathname); } catch (e) {}
  primeKur(); reelsKur();
  basla();
})();
