// ── KULLANICILAR ──
export const USERS = [
  { id:'gm', name:'Genel Müdür', email:'gm@otel.com', pass:'gm2024', role:'GM', av:'GM', color:'#f59e0b',
    p:{ dash:1, acente:1, proj:1, editor:1, ai:1, hedef:1, ciro:1, kom:1, admin:1, addac:1 }},
  { id:'sales', name:'Satış Müdürü', email:'satis@otel.com', pass:'satis2024', role:'Satış', av:'SM', color:'#00d4ff',
    p:{ dash:1, acente:1, proj:1, editor:1, ai:1, hedef:1, ciro:1, kom:1, admin:0, addac:1 }},
  { id:'revenue', name:'Revenue Manager', email:'revenue@otel.com', pass:'rev2024', role:'Revenue', av:'RM', color:'#a78bfa',
    p:{ dash:1, acente:1, proj:1, editor:1, ai:1, hedef:1, ciro:1, kom:1, admin:0, addac:0 }},
  { id:'rez', name:'Rezervasyon', email:'rez@otel.com', pass:'rez2024', role:'Rezervasyon', av:'RZ', color:'#10b981',
    p:{ dash:1, acente:1, proj:0, editor:0, ai:1, hedef:1, ciro:0, kom:0, admin:0, addac:0 }},
  { id:'front', name:'Önbüro Şefi', email:'onburo@otel.com', pass:'onburo2024', role:'Önbüro', av:'OB', color:'#34d399',
    p:{ dash:1, acente:0, proj:0, editor:0, ai:0, hedef:1, ciro:0, kom:0, admin:0, addac:0 }},
];

// ── AY İSİMLERİ ──
export const MS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
export const MF = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

// ── VARSAYILAN ACENTELER ──
export const DEFC = [
  { id:1, ad:'Tui Deutschland', tip:'TO', kom:18, ciro:2840000, hedef:3200000, ind:12, kontrat:185, eb:162, ay:[230,210,280,310,330,380,420,400,320,160,80,80].map(v=>v*1000) },
  { id:2, ad:'Thomas Cook', tip:'TO', kom:17, ciro:1920000, hedef:2400000, ind:10, kontrat:178, eb:155, ay:[160,150,220,260,290,330,380,350,250,120,60,30].map(v=>v*1000) },
  { id:3, ad:'Neckermann', tip:'TO', kom:16, ciro:1650000, hedef:1800000, ind:8, kontrat:172, eb:152, ay:[120,110,160,200,220,270,310,290,190,80,30,20].map(v=>v*1000) },
  { id:4, ad:'Anex Tour', tip:'TO', kom:15, ciro:980000, hedef:1000000, ind:6, kontrat:165, eb:148, ay:[60,55,90,110,130,150,180,160,110,50,20,10].map(v=>v*1000) },
  { id:5, ad:'Corendon', tip:'TO', kom:14, ciro:760000, hedef:1200000, ind:5, kontrat:158, eb:142, ay:[80,75,110,130,150,170,200,180,130,60,25,15].map(v=>v*1000) },
  { id:6, ad:'Booking.com', tip:'OTA', kom:15, ciro:1240000, hedef:1500000, ind:0, kontrat:null, eb:168, ay:[90,85,130,160,180,200,230,210,160,80,45,30].map(v=>v*1000) },
  { id:7, ad:'Expedia', tip:'OTA', kom:18, ciro:680000, hedef:800000, ind:0, kontrat:null, eb:172, ay:[45,40,70,85,95,110,130,120,85,35,20,10].map(v=>v*1000) },
  { id:8, ad:'Direkt', tip:'Direkt', kom:0, ciro:2100000, hedef:2500000, ind:0, kontrat:null, eb:195, ay:[165,155,230,270,300,350,400,380,280,130,65,40].map(v=>v*1000) },
];

// ── VARSAYILAN AYLIK HEDEFLER ──
export const DEFM = [
  { m:'Oca', g:820000,  h:950000,  o:62, a:185, py:740000,  po:58, pa:178 },
  { m:'Şub', g:740000,  h:880000,  o:56, a:179, py:660000,  po:52, pa:172 },
  { m:'Mar', g:1100000, h:1200000, o:74, a:198, py:980000,  po:70, pa:190 },
  { m:'Nis', g:1350000, h:1300000, o:81, a:215, py:1180000, po:76, pa:205 },
  { m:'May', g:1580000, h:1500000, o:88, a:228, py:1400000, po:84, pa:218 },
  { m:'Haz', g:1920000, h:1800000, o:94, a:245, py:1720000, po:91, pa:234 },
  { m:'Tem', g:2100000, h:2000000, o:98, a:262, py:1890000, po:96, pa:250 },
  { m:'Ağu', g:2050000, h:2000000, o:97, a:258, py:1840000, po:95, pa:245 },
  { m:'Eyl', g:1620000, h:1700000, o:85, a:238, py:1450000, po:81, pa:228 },
  { m:'Eki', g:null,    h:1400000, o:null, a:null, py:1200000, po:76, pa:210 },
  { m:'Kas', g:null,    h:1100000, o:null, a:null, py:920000,  po:65, pa:195 },
  { m:'Ara', g:null,    h:900000,  o:null, a:null, py:780000,  po:58, pa:182 },
];

// ── ODA TİPLERİ ──
export const ODALAR = [
  { tip:'Standart',  f:185, pp:85,  pax:2, top:120, bos:18 },
  { tip:'Superior',  f:215, pp:98,  pax:2, top:80,  bos:12 },
  { tip:'Deluxe SV', f:245, pp:115, pax:2, top:50,  bos:6 },
  { tip:'Suite',     f:380, pp:175, pax:3, top:20,  bos:4 },
  { tip:'Family',    f:290, pp:95,  pax:4, top:10,  bos:2 },
];

// ── PICK-UP VERİSİ ──
export const PICKUP_DATA = [
  { w:'H+1',  bk:42, ly:38, pace:10.5, occ:68, rev:186000 },
  { w:'H+2',  bk:38, ly:35, pace:8.6,  occ:65, rev:172000 },
  { w:'H+3',  bk:55, ly:48, pace:14.6, occ:74, rev:215000 },
  { w:'H+4',  bk:61, ly:52, pace:17.3, occ:80, rev:248000 },
  { w:'H+5',  bk:78, ly:71, pace:9.9,  occ:87, rev:295000 },
  { w:'H+6',  bk:82, ly:80, pace:2.5,  occ:89, rev:312000 },
  { w:'H+7',  bk:91, ly:88, pace:3.4,  occ:93, rev:348000 },
  { w:'H+8',  bk:88, ly:92, pace:-4.3, occ:91, rev:335000 },
  { w:'H+9',  bk:72, ly:76, pace:-5.3, occ:83, rev:278000 },
  { w:'H+10', bk:58, ly:61, pace:-4.9, occ:75, rev:228000 },
  { w:'H+11', bk:44, ly:42, pace:4.8,  occ:68, rev:192000 },
  { w:'H+12', bk:31, ly:28, pace:10.7, occ:55, rev:148000 },
];

// ── KANAL MİX ──
export const KANAL_MIX = {
  cur: { TO:52, OTA:22, Direkt:26 },
  tgt: { TO:45, OTA:25, Direkt:30 },
  pp:  { TO:185, OTA:195, Direkt:220 },
};

// ── SEZON ──
export const SEZON_OCC = [62,56,74,81,88,94,98,97,85,76,65,58];
export const SEZON_PP  = [185,179,198,215,228,245,262,258,238,210,195,182];

// ── ROL İKONLARI ──
export const RI = { GM:'👑', Satış:'🎯', Revenue:'📊', Rezervasyon:'📋', Önbüro:'🏨' };

// ── KULLANICI YÖNETİMİ ──
export const ROLES = ['GM','Satış','Revenue','Rezervasyon','Önbüro'];
export const COLORS = ['#f0b429','#4cc9f0','#06d6a0','#f72585','#c4b5fd','#ffd166','#67e8f9','#a78bfa'];
export const PERMS = [
  { k:'dash',   l:'Dashboard' },
  { k:'acente', l:'Acenteler' },
  { k:'proj',   l:'Projeksiyon' },
  { k:'editor', l:'Hedef Editörü' },
  { k:'ai',     l:'AI Asistan' },
  { k:'hedef',  l:'Hedef Görme' },
  { k:'ciro',   l:'Ciro Görme' },
  { k:'kom',    l:'Komisyon Görme' },
  { k:'admin',  l:'Admin' },
  { k:'addac',  l:'Acente Ekle/Sil' },
];
export const DEF_PERMS = { dash:1, acente:0, proj:0, editor:0, ai:0, hedef:1, ciro:0, kom:0, admin:0, addac:0 };
