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

  var DATA = { firma: {}, yardim: [], yakit: [], avantaj: [], kilavuz: {} };
  var ST = { kod: '', ad: '', garaj: null, acik: null, sekme: '', hosgeldin: false, onMarka: '' };

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
  function goster(id) {
    ['vYukle', 'vZiyaretci', 'vUyeOl', 'vFirma', 'vGaraj'].forEach(function (v) { $(v).hidden = (v !== id); });
    var ub = $('zUyeGiris'), uye = !!(ST.kod && ST.garaj && ST.garaj.marka);
    ub.textContent = uye ? 'Garajım' : 'Giriş yap';
    window.scrollTo(0, 0);
  }

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
    return Promise.all([oku('firmalar'), oku('yardim_firmalari'), oku('yakit_indirimleri'), oku('avantaj_kampanyalar'), oku('motor_kilavuzu')]).then(function (r) {
      r[0].forEach(function (x) {
        var key = x.marka + '_' + x.kategori;
        (DATA.firma[key] = DATA.firma[key] || []).push({ name: x.ad, whatsapp: x.whatsapp, phone: x.telefon, city: x.sehir, district: x.ilce, website: x.website, description: x.aciklama, address: x.adres, siraNo: x.sira_no });
      });
      DATA.yardim = r[1].map(function (x) { return { name: x.ad, region: x.bolge_metni, city: x.sehir, phone: x.telefon, whatsapp: x.whatsapp, categories: x.kategoriler || [], website: x.website, address: x.adres, siraNo: x.sira_no }; });
      DATA.yakit = r[2].map(function (x) { return { name: x.ad, city: x.sehir, district: x.ilce, whatsapp: x.whatsapp, phone: x.telefon, website: x.website, description: x.indirim_orani ? x.indirim_orani + ' indirim' : '', badge: 'İndirim', address: x.adres, siraNo: x.sira_no }; });
      DATA.avantaj = r[3].map(function (x) { return { name: x.firma_adi, kategori: x.kategori, city: x.sehir, description: x.baslik || x.aciklama, whatsapp: x.whatsapp, phone: x.telefon, website: x.website, badge: x.rozet || '', address: x.adres, siraNo: x.sira_no }; });
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
    var l = DATA.yardim.filter(function (f) { return f.city === g.sehir; }).sort(sirala);
    return l.length ? { firmalar: l, not: '' } : null;
  }

  // ---------- firma kartı ----------
  function acikMi() { var d = new Date(), gun = d.getDay(), s = d.getHours() + d.getMinutes() / 60; return gun !== 0 && s >= 9 && s < 19; }
  var YARDIM_AD = { cekici: 'Çekici', lastik: 'Lastik', aku: 'Akü / Marş', ariza: 'Genel arıza', marş: 'Akü / Marş' };
  function firmaKart(f, o) {
    o = o || {};
    var wa = temizTel(f.whatsapp);
    var msg = encodeURIComponent('Merhaba, MotoGo Garajım üzerinden ulaşıyorum. ' + (o.amac || 'Bilgi') + ' için bilgi almak istiyorum.');
    var sorgu = f.address ? f.address : (f.name + ' ' + (f.district || '') + ' ' + (f.city || '')).trim();
    var rozet = '';
    if (o.durum) rozet = acikMi() ? '<span class="g-rozet acik">Açık</span>' : '<span class="g-rozet kap">Kapalı</span>';
    else if (f.badge) rozet = '<span class="g-rozet ind">' + esc(f.badge) + '</span>';
    var meta = [f.district, f.city, f.region].filter(Boolean).join(' · ');
    var chips = '';
    if (f.categories && f.categories.length) chips = '<div class="g-ch">' + f.categories.map(function (c) { return '<span>' + esc(YARDIM_AD[c] || c) + '</span>'; }).join('') + '</div>';
    var d = '';
    if (f.phone) d += '<a class="k" href="tel:' + esc(f.phone) + '">Ara</a>';
    if (wa) d += '<a href="https://wa.me/' + wa + '?text=' + msg + '" target="_blank" rel="noopener">WhatsApp</a>';
    if (f.website) d += '<a href="' + esc(webUrl(f.website)) + '" target="_blank" rel="noopener">Web</a>';
    d += '<a href="https://www.google.com/maps/search/' + encodeURIComponent(sorgu) + '" target="_blank" rel="noopener">Konum</a>';
    return '<div class="g-firma"><div class="a"><div><b>' + esc(f.name) + '</b>' + (meta ? '<small>' + esc(meta) + '</small>' : '') + '</div>' + rozet + '</div>' +
      chips + (f.description ? '<p>' + esc(f.description) + '</p>' : '') + '<div class="g-d">' + d + '</div></div>';
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
    ['marka', 'model', 'yil', 'sehir', 'plaka', 'km', 'bakim_km', 'muayene', 'sigorta'].forEach(function (k) {
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
      d = d.slice().sort(function (a, b) { return (a.sira_no == null ? 9999 : a.sira_no) - (b.sira_no == null ? 9999 : b.sira_no); }).slice(0, 8);
      var id = function (raw) { raw = String(raw || '').trim(); if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw; var m = raw.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; };
      var h = d.map(function (v) { var y = id(v.youtube_id); return y ? '<a class="g-rl" href="app.html?ana=1#shorts"><img src="' + yt(y) + '" alt="" loading="lazy"><i class="pl"></i></a>' : ''; }).join('');
      if (h) { $('reelsListe').innerHTML = h; $('bReels').hidden = false; }
    }, function () {});
  }

  // ---------- ziyaretçi ekranı ----------
  function ziyaretci() {
    var kutu = $('zMarkalar');
    if (!kutu.getAttribute('data-ok')) {
      kutu.setAttribute('data-ok', '1');
      ['BMW', 'KTM', 'Ducati', 'Honda', 'Bajaj', 'Yamaha'].forEach(function (n) {
        var b = brandByName(n); if (!b) return;
        var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'g-marka'; bt.textContent = b.name;
        bt.addEventListener('click', function () { uyeOlGoster(b.name); });
        kutu.appendChild(bt);
      });
      var dg = document.createElement('button'); dg.type = 'button'; dg.className = 'g-marka'; dg.textContent = 'Diğer markalar…';
      dg.addEventListener('click', function () { uyeOlGoster(''); });
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
    var b = brandByName($('uMarka').value), model = $('uModel').value.trim(), yil = sayi($('uYil').value), sehir = $('uSehir').value;
    if (yeni && (!ad || !telRaw)) return hata('Ad soyad ve telefon zorunlu.');
    if (yeni && temizTel(telRaw).length < 12) return hata('Telefon numarasını başında 0 ile yaz: 05XX XXX XX XX');
    if (!b) return hata('Markayı listeden seç. Bulamazsan en yakın yazılışını dene.');
    if (!model) return hata('Motorunun modelini yaz.');
    if (!sehir) return hata('Şehrini seç.');
    if (yeni && !$('uOnay').checked) return hata('Devam etmek için sözleşmeyi onaylaman gerekiyor.');
    if (!SB) return hata('Bağlantı kurulamadı, tekrar dene.');
    var btn = $('uGonder'); btn.disabled = true; d.textContent = yeni ? 'Garajın hazırlanıyor...' : 'Kaydediliyor...'; d.className = 'g-durum';
    var motor = { marka: b.key, model: model, yil: yil, sehir: sehir };
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
        ST.kod = norm(x.kod); ST.ad = x.ad || ad;
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
    yol: function () { var m = yolVerisi(); return m ? '<p class="g-etk">' + esc(ST.garaj.sehir) + ' yol yardım firmaları</p>' + firmaListe(m, { amac: 'Yol yardım' }) : ''; },
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
        '<div class="g-iki"><div class="g-alan"><label for="dSehir">Şehir</label><select id="dSehir">' + so + '</select></div><div class="g-alan"><label for="dPlaka">Plaka</label><input type="text" id="dPlaka" value="' + esc(g.plaka || '') + '" maxlength="12" autocapitalize="characters"></div></div>' +
        '<button type="button" class="g-btn" id="dKaydet" style="margin-top:14px;">Kaydet</button><div class="g-durum" id="dDurum" role="status"></div>' +
        '<div class="g-kod">Üye kodum: <b>' + esc(ST.kod) + '</b><br>Başka telefondan girmek için bu kodu kullan, kimseyle paylaşma.<br><button type="button" id="kodKopya">Kodu kopyala</button></div>' +
        '<button type="button" class="g-cikis" id="cikisYap">Bu cihazdan çıkış yap</button>';
    },
    uyg: function () {
      var L = [
        ['E', 'Etkinlik takvimi', 'Motorcu buluşmaları', 'Aç', '', 'etkinlik'],
        ['R', 'Rota önerileri', 'Güzel yollar', 'Aç', '', 'rota'],
        ['F', 'Foto İmaj', 'Fotoğrafına MotoGo çerçevesi', 'Ücretsiz dene', 'g', 'foto'],
        ['M', 'Movi İmaj', 'Videoyu otomatik hazırlar', 'Ücretsiz dene', 'g', 'kurgu'],
        ['R', 'Rota İmaj', 'Rotandan paylaşım videosu', 'Paket', 'p', 'gun'],
        ['A', 'Aktivite Planım', 'Sürüş planı ve takvim', 'Aç', '', 'aktivite'],
        ['M', 'MARC O.S. 3.0', 'Motosiklet asistanı', 'Paket', 'p', 'marc']
      ];
      return L.map(function (u) {
        return '<a class="g-uyg" href="app.html?ac=' + u[5] + '"><span class="ik">' + u[0] + '</span><span><b>' + u[1] + '</b><small>' + u[2] + '</small></span><span class="d ' + u[4] + '">' + u[3] + '</span></a>';
      }).join('') + '<div class="g-paket"><b>Tek ödemede 4 uygulama.</b> Foto İmaj ve Movi İmaj ücretsiz denenir, çıktılarda MotoGo logosu olur. Rota İmaj ve MARC O.S. 3.0 ücretlidir. Ücretli üyelik dördünü de açar ve logoyu kaldırır.</div>';
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
    var bas = isim ? isim.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toLocaleUpperCase('tr') : 'M';
    var av = g.foto ? '<img src="' + esc(g.foto) + '" alt="Profil fotoğrafı">' : '<span class="bas">' + esc(bas) + '</span>';
    h += '<div class="g-kimlik g-profil"><div class="g-profil-ust">' +
      '<button type="button" class="g-av' + (g.foto ? ' var' : '') + '" id="gFoto" aria-label="Fotoğraf yükle">' + av + '<i class="kam">+</i></button>' +
      '<div class="g-pb">' +
      (isim ? '<div class="g-ad">' + esc(isim) + '</div>' : '<button type="button" class="g-adekle" id="gAdEkle">Adını ekle</button>') +
      '<div class="g-motor">' + esc((ad + ' ' + (g.model || '')).trim()) + (g.yil ? ' · ' + esc(g.yil) : '') + '</div>' +
      (g.sehir ? '<div class="g-konum">' + esc(g.sehir) + '</div>' : '') +
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
    h += '<div class="g-alt"><a href="app.html?ana=1&amp;yardim=1" class="g-btn kirmizi g-yol">Yolda mı kaldın? MotoGo Yol Yardım</a>' +
      '<div class="g-linkler"><a href="app.html?ana=1">Firma ara</a><a href="https://motogo.com.tr/prime/">MotoGo Prime</a><a href="https://www.motogoprime.com/category/all-products" target="_blank" rel="noopener">Store</a></div></div>';
    $('vGaraj').innerHTML = h;
  }

  // ---------- paylaşım kartı (hikâye boyutu) ----------
  function paylasKarti() {
    var g = ST.garaj, b = brandByKey(g.marka);
    var W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    var gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#171a1f'); gr.addColorStop(1, '#0b0c0e');
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.fillStyle = '#f9eb22'; x.fillRect(0, 0, 18, H);
    function bitir(logo) {
      if (logo) { var lw = 360, lh = lw * logo.height / logo.width; x.drawImage(logo, 90, 130, lw, lh); }
      function yaz(t, px, y, w, col, mx) {
        x.font = w + ' ' + px + 'px Inter, "Segoe UI", sans-serif'; x.fillStyle = col; x.textBaseline = 'alphabetic';
        var s = t; while (x.measureText(s).width > (mx || 900) && s.length > 3) s = s.slice(0, -2); if (s !== t) s += '…';
        x.fillText(s, 90, y);
      }
      var fy = 560;
      function son() {
        yaz((ST.ad || 'Motorcu'), 96, fy + 80, '800', '#f4f4f2');
        yaz(((b ? b.name : g.marka) + ' ' + (g.model || '')).trim(), 60, fy + 170, '600', '#f9eb22');
        yaz([g.yil, g.sehir].filter(Boolean).join(' · '), 40, fy + 240, '500', '#9aa0a8');
        yaz('Garajım', 44, H - 250, '700', '#f4f4f2');
        yaz('motogo.com.tr', 40, H - 190, '500', '#9aa0a8');
        c.toBlob(function (blob) {
          if (!blob) return toast('Kart oluşturulamadı');
          var f = new File([blob], 'motogo-garajim.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [f] }) && navigator.share) {
            navigator.share({ files: [f], title: 'MotoGo Garajım', text: 'Garajım: motogo.com.tr' }).catch(function () {});
          } else {
            var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'motogo-garajim.png';
            document.body.appendChild(a); a.click(); a.remove(); toast('Kart indirildi, hikâyene ekleyebilirsin');
          }
        }, 'image/png');
      }
      if (g.foto) {
        var im = new Image();
        im.onload = function () { x.save(); x.beginPath(); x.arc(W - 270, 380, 160, 0, Math.PI * 2); x.closePath(); x.clip(); var s = Math.max(320 / im.width, 320 / im.height); x.drawImage(im, W - 430 + (320 - im.width * s) / 2, 220 + (320 - im.height * s) / 2, im.width * s, im.height * s); x.restore(); x.lineWidth = 8; x.strokeStyle = '#f9eb22'; x.beginPath(); x.arc(W - 270, 380, 160, 0, Math.PI * 2); x.stroke(); son(); };
        im.onerror = son; im.src = g.foto;
      } else son();
    }
    var lg = new Image(); lg.onload = function () { bitir(lg); }; lg.onerror = function () { bitir(null); }; lg.src = 'img/logo.png';
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
    $('zAc').addEventListener('click', function () { uyeOlGoster(''); });
    $('zUyeGiris').addEventListener('click', function (e) {
      e.preventDefault();
      if (ST.kod && ST.garaj && ST.garaj.marka) { garajGoster(); return; }
      ziyaretci(); var k = $('zKodKutu'); k.open = true; $('zKod').focus();
    });
    $('zKodGiris').addEventListener('click', kodlaGiris);
    $('zKod').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); kodlaGiris(); } });
    $('uVazgec').addEventListener('click', function (e) { e.preventDefault(); if (ST.kod && ST.garaj) garajGoster(); else ziyaretci(); });
    $('uGonder').addEventListener('click', uyeOlGonder);
    var nl = document.querySelector('.g-nav-logo'); if (nl) nl.addEventListener('click', function (e) { e.preventDefault(); ziyaretci(); });
    function firmaAc(e) { e.preventDefault(); goster('vFirma'); }
    Array.prototype.forEach.call(document.querySelectorAll('[data-firma]'), function (el) { el.addEventListener('click', firmaAc); });
    $('fGeri').addEventListener('click', function (e) { e.preventDefault(); ziyaretci(); });
    $('gFotoDosya').addEventListener('change', function () { fotoSec(this.files && this.files[0]); this.value = ''; });

    $('vGaraj').addEventListener('click', function (e) {
      var t = e.target;
      var sec = t.closest && t.closest('[data-sec]');
      if (sec) { var id = sec.getAttribute('data-sec'); ST.acik = (ST.acik === id) ? null : id; renderGaraj(); var el = document.querySelector('.g-satir[data-sec="' + id + '"]'); if (el && ST.acik) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
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
        var pl = $('dPlaka').value.trim().toUpperCase();
        kaydet({ marka: b.key, model: $('dModel').value.trim(), yil: sayi($('dYil').value), sehir: $('dSehir').value, plaka: pl || null }, function (ok) {
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

  // ---------- başlangıç ----------
  function basla() {
    olaylar();
    var kayitli = null;
    try { kayitli = localStorage.getItem(LS_KOD); } catch (e) {}
    if (!kayitli) { ziyaretci(); return; }
    dogrulaVeAc(kayitli, function (ok, neden) {
      if (ok) { ST.hosgeldin = false; garajGoster(); }
      else if (neden === 'baglanti') { // internet yoksa ziyaretçi ekranı yerine dürüst mesaj
        $('vYukle').textContent = 'Bağlantı kurulamadı. İnternetini kontrol edip sayfayı yenile.'; goster('vYukle');
      } else ziyaretci();
    });
  }
  primeKur(); reelsKur();
  basla();
})();
