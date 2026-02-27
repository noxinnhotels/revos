import React, { useState } from 'react';
import { BarChartSVG, Legend } from './Charts';
import { fmt, fmtK } from '../utils/format';
import { ODALAR, MF, MS } from '../data/constants';

function Projeksiyon({simOcc,simAdr,monthly}){
  const [s,setS]=useState(0);const [e,setE]=useState(11);const [sc,setSc]=useState('base');
  const [view,setView]=useState('projeksiyon'); // projeksiyon | perPerson | elektra
  const [ppMode,setPpMode]=useState('Oda Başı');
  const [ppVal,setPpVal]=useState(95);
  const [paxVal,setPaxVal]=useState(2.0);
  const effAdr = ppMode==='Oda Başı' ? simAdr : ppVal*paxVal;
  const mult={pessimist:.85,base:1,optimist:1.15}[sc];
  const data=monthly.map((m,i)=>({m:m.m,hedef:m.h,gercek:i<=8?m.g:null,projeksiyon:i>8?Math.round(280*(simOcc/100)*effAdr*30*mult*(0.82+i*.018)):null}));
  const filt=data.slice(s,e+1);
  const pT=filt.reduce((a,b)=>a+(b.gercek||b.projeksiyon||0),0),hT=filt.reduce((a,b)=>a+b.hedef,0);
  return(
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {[['projeksiyon','📈 Projeksiyon'],['perPerson','👤 Per Person'],['elektra','🔌 Elektra Web']].map(([k,l])=>(
          <button key={k} className={`btn ${view===k?'bp':'bg'}`} style={{fontSize:12,padding:'7px 16px'}} onClick={()=>setView(k)}>{l}</button>
        ))}
      </div>

      {view==='perPerson'&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:16}}>
            {ODALAR.map((o,i)=>{
              const d=o.top-o.bos;
              const occ=(d/o.top*100).toFixed(0);
              const revRoom=o.f*d;
              const revPP=o.pp*o.pax*d;
              return(
                <div key={i} className="panel" style={{padding:'16px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                    <div style={{fontWeight:700,fontSize:14,fontFamily:'var(--ff)'}}>{o.tip}</div>
                    <span style={{fontSize:10,fontFamily:'var(--mono)',padding:'2px 8px',background:'rgba(255,255,255,0.05)',borderRadius:6,color:'var(--text2)'}}>{o.top} oda</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                    {[
                      ['Doluluk','%'+occ, occ>=85?'var(--teal)':occ>=70?'var(--gold)':'#ff6eb4'],
                      ['Pax/Oda', o.pax+' kişi','var(--blue)'],
                    ].map(([l,v,c])=>(
                      <div key={l} style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'8px 10px'}}>
                        <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:3}}>{l}</div>
                        <div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                    <div style={{background:'rgba(76,201,240,0.07)',border:'1px solid rgba(76,201,240,0.2)',borderRadius:8,padding:'10px'}}>
                      <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:4}}>PER ROOM/NIGHT</div>
                      <div style={{fontSize:18,fontWeight:700,color:'#4cc9f0'}}>€{o.f}</div>
                      <div style={{fontSize:10,color:'var(--text2)',marginTop:2}}>Günlük: €{(o.f*d).toLocaleString('tr-TR')}</div>
                    </div>
                    <div style={{background:'rgba(6,214,160,0.07)',border:'1px solid rgba(6,214,160,0.2)',borderRadius:8,padding:'10px'}}>
                      <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:4}}>PER PERSON/NIGHT</div>
                      <div style={{fontSize:18,fontWeight:700,color:'var(--teal)'}}>€{o.pp}</div>
                      <div style={{fontSize:10,color:'var(--text2)',marginTop:2}}>= €{o.f} ÷ {o.pax} pax</div>
                    </div>
                  </div>
                  <div style={{background:'rgba(240,180,41,0.06)',border:'1px solid rgba(240,180,41,0.2)',borderRadius:8,padding:'10px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:2}}>AYLIK PROJEKSİYON</div>
                        <div style={{fontSize:16,fontWeight:700,color:'var(--gold)'}}>{fmtK(o.f*d*30)}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:2}}>TRevPAR</div>
                        <div style={{fontSize:14,fontWeight:700,color:'#a78bfa'}}>€{(o.f*(+occ/100)).toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="panel">
            <div className="ptitle">📊 Fiyatlandırma Modu Karşılaştırması</div>
            <table className="tbl">
              <thead><tr><th>Oda Tipi</th><th>Per Room/Night</th><th>Per Person/Night</th><th>Std Pax</th><th>ADR</th><th>RevPAR</th><th>Aylık Gelir</th></tr></thead>
              <tbody>
                {ODALAR.map((o,i)=>{
                  const d=o.top-o.bos;
                  const occ=d/o.top;
                  return(
                    <tr key={i}>
                      <td style={{fontWeight:600}}>{o.tip}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12,color:'#4cc9f0'}}>€{o.f}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--teal)'}}>€{o.pp}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12}}>{o.pax} kişi</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--gold)'}}>€{(o.pp*o.pax).toFixed(0)}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12,color:'#a78bfa'}}>€{(o.f*occ).toFixed(0)}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12}}>{fmtK(o.f*d*30)}</td>
                    </tr>
                  );
                })}
                <tr style={{background:'rgba(255,255,255,0.04)',fontWeight:700}}>
                  <td>TOPLAM</td>
                  <td colSpan={4} style={{color:'var(--text3)',fontFamily:'var(--mono)',fontSize:11}}>Ağırlıklı ortalama</td>
                  <td style={{fontFamily:'var(--mono)',color:'var(--gold)'}}>€{(ODALAR.reduce((a,o)=>a+(o.f*(o.top-o.bos)),0)/280).toFixed(0)}</td>
                  <td style={{fontFamily:'var(--mono)',color:'#4cc9f0'}}>{fmtK(ODALAR.reduce((a,o)=>a+o.f*(o.top-o.bos)*30,0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view==='elektra'&&(
        <div>
          <div className="panel" style={{marginBottom:14}}>
            <div className="ptitle">🔌 Elektra Web PMS Entegrasyonu</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
              {[
                {ic:'📡',t:'API Durumu',v:'Beklemede',c:'var(--text3)',bc:'var(--border)',desc:'Elektra Web API bağlantısı henüz kurulmadı'},
                {ic:'🔄',t:'Son Senkronizasyon',v:'—',c:'var(--text3)',bc:'var(--border)',desc:'Hiç veri çekilmedi'},
                {ic:'📊',t:'Aktarılacak Veri',v:'3 tablo',c:'var(--gold)',bc:'rgba(240,180,41,0.3)',desc:'monthly_targets, agencies, app_settings'},
              ].map((s,i)=>(
                <div key={i} style={{padding:'14px',background:'rgba(255,255,255,0.03)',border:`1px solid ${s.bc}`,borderRadius:10}}>
                  <div style={{fontSize:20,marginBottom:6}}>{s.ic}</div>
                  <div style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:4}}>{s.t}</div>
                  <div style={{fontSize:15,fontWeight:700,color:s.c,marginBottom:4}}>{s.v}</div>
                  <div style={{fontSize:10,color:'var(--text3)',lineHeight:1.5}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div className="panel">
              <div className="ptitle">⚙ API Konfigürasyonu</div>
              <div className="mg">
                <label className="lbl">Elektra Web API URL</label>
                <input className="inp" placeholder="https://api.elektraweb.com/v1" style={{fontFamily:'var(--mono)',fontSize:12}}/>
              </div>
              <div className="mg">
                <label className="lbl">API Token</label>
                <input className="inp" type="password" placeholder="Bearer ey..."/>
              </div>
              <div className="mg">
                <label className="lbl">Otel Kodu</label>
                <input className="inp" placeholder="örn: ANTALYA_001" style={{fontFamily:'var(--mono)'}}/>
              </div>
              <button className="btn bp" style={{width:'100%',marginTop:6}} disabled>
                🔌 Bağlan (Yakında)
              </button>
              <div style={{marginTop:8,fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',textAlign:'center'}}>
                Elektra Web API erişimi için destek ekibinizle iletişime geçin
              </div>
            </div>

            <div className="panel">
              <div className="ptitle">📋 Entegrasyon Planı</div>
              {[
                {st:'OK',c:'var(--teal)', t:'Veri Modeli Hazir',d:'monthly_targets, agencies, app_settings tablolari Supabase DB hazir'},
                {st:'OK',c:'var(--teal)', t:'Per Room & Per Person',d:'Fiyatlandirma modeli her iki metrigi destekliyor'},
                {st:'...',c:'var(--gold)', t:'Elektra API Baglantisi',d:'API key alindiktan sonra otomatik veri cekimi aktif edilecek'},
                {st:'...',c:'var(--text3)',t:'Gercek Zamanli Doluluk',d:'PMS den anlik OCC verisi dashboarda yansitilacak'},
                {st:'...',c:'var(--text3)',t:'Rezervasyon Bazli ADR',d:'Oda tipi bazli gercek ADR Elektra dan cekilecek'},
                {st:'...',c:'var(--text3)',t:'Acente Ciro Senkronu',d:'Folio kapatildiginda otomatik ciro guncellemesi'},
              ].map((r,i)=>(
                <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <span style={{fontSize:14,flexShrink:0}}>{r.st}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:r.c}}>{r.t}</div>
                    <div style={{fontSize:10,color:'var(--text3)',marginTop:2,lineHeight:1.5}}>{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{marginTop:14}}>
            <div className="ptitle">📡 Elektra Web API — Beklenen Endpoint'ler</div>
            <table className="tbl" style={{fontSize:11}}>
              <thead><tr><th>Endpoint</th><th>Metod</th><th>Dönen Veri</th><th>Kullanım</th><th>Durum</th></tr></thead>
              <tbody>
                {[
                  ['GET /occupancy/daily','GET','occ, rooms_sold, rooms_avail','Dashboard doluluk','⏳'],
                  ['GET /revenue/monthly','GET','total_rev, room_rev, adr','Aylık gerçekleşen','⏳'],
                  ['GET /rates/roomtype','GET','room_type, rate_per_room, rate_pp','Fiyat planlaması','⏳'],
                  ['GET /agencies/production','GET','agency_id, name, revenue, nights','Acente ciro','⏳'],
                  ['POST /rates/update','POST','room_type_id, new_rate','Fiyat güncelleme','⏳'],
                ].map(([ep,m,d,u,st],i)=>(
                  <tr key={i}>
                    <td style={{fontFamily:'var(--mono)',color:'var(--teal)'}}>{ep}</td>
                    <td><span className="badge bg2" style={{fontSize:9}}>{m}</span></td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--text2)',fontSize:10}}>{d}</td>
                    <td style={{color:'var(--text2)'}}>{u}</td>
                    <td>{st}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view==='projeksiyon'&&(
      <div>
      <div className="notif nb" style={{marginBottom:14}}>⚡ Elektra Web PMS entegrasyonu hazır olduğunda veriler otomatik güncellenir.</div>
      <div className="g3">
        <div className="panel"><div className="ptitle">📅 Tarih Aralığı</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><label className="lbl">Başlangıç</label><select className="inp" value={s} onChange={x=>setS(+x.target.value)}>{MF.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>
            <div><label className="lbl">Bitiş</label><select className="inp" value={e} onChange={x=>setE(+x.target.value)}>{MF.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>
          </div>
        </div>
        <div className="panel"><div className="ptitle">🎭 Senaryo</div>
          <div style={{display:'flex',gap:6,marginTop:4}}>{[['pessimist','😟 Kötümser'],['base','📊 Baz'],['optimist','🚀 İyimser']].map(([k,l])=><button key={k} className={`btn ${sc===k?'bp':'bg'}`} style={{flex:1,fontSize:11,padding:'8px 4px'}} onClick={()=>setSc(k)}>{l}</button>)}</div>
          <div style={{marginTop:8,fontSize:10,color:'var(--text2)',fontFamily:'var(--mono)',textAlign:'center'}}>Çarpan: x{mult}</div>
        </div>
        <div className="panel"><div className="ptitle">📊 Dönem Özeti</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><div style={{fontSize:9,color:'var(--text2)',fontFamily:'var(--mono)',marginBottom:3}}>TAHMİNİ</div><div style={{fontSize:18,fontWeight:700,fontFamily:'var(--ff)',color:'var(--teal)'}}>{fmt(pT)}</div></div>
            <div><div style={{fontSize:9,color:'var(--text2)',fontFamily:'var(--mono)',marginBottom:3}}>HEDEF</div><div style={{fontSize:18,fontWeight:700,fontFamily:'var(--ff)',color:'#c4b5fd'}}>{fmt(hT)}</div></div>
          </div>
          <div className="prog"><div className="pf" style={{width:`${Math.min(pT/hT*100,100)}%`,background:'linear-gradient(90deg,#10b981,#00d4ff)'}}/></div>
          <div style={{fontSize:9,color:'var(--text2)',fontFamily:'var(--mono)',marginTop:4,textAlign:'right'}}>%{(pT/hT*100).toFixed(1)} hedefe ulaşılır</div>
        </div>
      </div>
      <div className="panel" style={{marginBottom:16}}>
        <div className="ptitle">📈 Projeksiyon Grafiği</div>
        <div style={{height:250}}>
          <BarChartSVG data={filt} keys={['hedef','gercek','projeksiyon']} colors={['rgba(240,180,41,0.5)','#4cc9f0','#06d6a0']} height={240}/>
          <Legend keys={['hedef','gercek','projeksiyon']} colors={['rgba(240,180,41,0.8)','#4cc9f0','#06d6a0']} labels={['Hedef','Gerçekleşen','Projeksiyon']}/>
        </div>
      </div>
    </div>
      )}
    </div>
  );
}


export default Projeksiyon;
