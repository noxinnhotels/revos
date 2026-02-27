import React, { useState } from 'react';
import { AreaChartSVG, BarChartSVG, PieChartSVG, Legend } from './Charts';
import { fmt, fmtK } from '../utils/format';
import { PICKUP_DATA, KANAL_MIX, SEZON_OCC, MS } from '../data/constants';

function Analiz({monthly,ac,simOcc,simAdr}){
  const [sec,setSec]=useState('pickup'); // pickup | kanal | forecast | los
  const [kanalMix,setKanalMix]=useState({TO:52,OTA:22,Direkt:26});
  const totalOda=280;

  // ── FORECAST (ağırlıklı projeksiyon) ──
  const realized=monthly.filter(m=>m.g!=null);
  const remaining=monthly.filter(m=>m.g==null);
  const avgYoY=realized.reduce((s,m)=>s+(m.py?((m.g-m.py)/m.py*100):0),0)/Math.max(realized.length,1);
  const forecast=remaining.map((m,i)=>{
    const sezonFak=SEZON_OCC[monthly.indexOf(m)]/85; // 85 baz doluluk
    const growthFak=1+(avgYoY/100)*0.6; // YoY büyümenin %60'ı devam eder
    const base=m.py?m.py*growthFak:m.h*0.92;
    return {...m, fc:Math.round(base*sezonFak)};
  });
  const gT=realized.reduce((a,b)=>a+b.g,0);
  const fcT=forecast.reduce((a,b)=>a+b.fc,0);
  const hT=monthly.reduce((a,b)=>a+b.h,0);

  // ── KANAL MIX GELİR ETKİSİ ──
  const totalCiro=ac.reduce((s,a)=>s+a.ciro,0);
  const curRev=(kanalMix.TO/100*totalCiro*KANAL_MIX.pp.TO + kanalMix.OTA/100*totalCiro*KANAL_MIX.pp.OTA + kanalMix.Direkt/100*totalCiro*KANAL_MIX.pp.Direkt)/
    (KANAL_MIX.pp.TO*KANAL_MIX.cur.TO/100 + KANAL_MIX.pp.OTA*KANAL_MIX.cur.OTA/100 + KANAL_MIX.pp.Direkt*KANAL_MIX.cur.Direkt/100);
  const blendedPP=kanalMix.TO/100*KANAL_MIX.pp.TO + kanalMix.OTA/100*KANAL_MIX.pp.OTA + kanalMix.Direkt/100*KANAL_MIX.pp.Direkt;
  const curBlended=KANAL_MIX.cur.TO/100*KANAL_MIX.pp.TO + KANAL_MIX.cur.OTA/100*KANAL_MIX.pp.OTA + KANAL_MIX.cur.Direkt/100*KANAL_MIX.pp.Direkt;
  const mixImpact=Math.round((blendedPP-curBlended)*totalOda*simOcc/100*365);

  return(
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[['pickup','📡 Pick-up'],['forecast','🔮 Forecast'],['kanal','🔀 Kanal Mix'],['los','📏 LoS Analizi']].map(([k,l])=>(
          <button key={k} className={`btn ${sec===k?'bp':'bg'}`} style={{fontSize:12,padding:'7px 18px'}} onClick={()=>setSec(k)}>{l}</button>
        ))}
      </div>

      {sec==='pickup'&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            {[
              {l:'Bu Hafta Pick-up',v:PICKUP_DATA[0].bk+' oda',d:`Geçen yıl: ${PICKUP_DATA[0].ly}`,c:'var(--teal)',icon:'📡'},
              {l:'Pace (YoY)',v:`+%${PICKUP_DATA[0].pace}`,d:'Geçen yıla göre hız',c:PICKUP_DATA[0].pace>=0?'var(--teal)':'#ff6eb4',icon:'⚡'},
              {l:'90 Gün OCC',v:`%${PICKUP_DATA.slice(0,13).reduce((s,w)=>s+w.occ,0)/12|0}`,d:'Ort. beklenen doluluk',c:'var(--gold)',icon:'🎯'},
              {l:'90 Gün Rev.',v:'€'+((PICKUP_DATA.reduce((s,w)=>s+w.rev,0))/1e6).toFixed(2)+'M',d:'Toplam projeksiyon',c:'#a78bfa',icon:'💰'},
            ].map((k,i)=>(
              <div key={i} className="panel" style={{padding:'14px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{fontSize:20}}>{k.icon}</span>
                  <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',textTransform:'uppercase'}}>{k.l}</div>
                </div>
                <div style={{fontSize:20,fontWeight:800,color:k.c,fontFamily:'var(--ff)'}}>{k.v}</div>
                <div style={{fontSize:10,color:'var(--text2)',marginTop:4}}>{k.d}</div>
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="ptitle">📡 Haftalık Pick-up Hızı — Mevcut vs Geçen Yıl</div>
            <div style={{overflowX:'auto'}}>
              <table className="tbl" style={{minWidth:700}}>
                <thead>
                  <tr>
                    <th>Hafta</th><th>Rezervasyon</th><th>Geçen Yıl</th><th>Pace %</th>
                    <th>Beklenen OCC</th><th>Beklenen Rev.</th><th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {PICKUP_DATA.map((w,i)=>(
                    <tr key={i}>
                      <td style={{fontFamily:'var(--mono)',fontWeight:600}}>{w.w}</td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--teal)',fontWeight:700}}>{w.bk} oda</td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{w.ly} oda</td>
                      <td>
                        <span style={{fontFamily:'var(--mono)',fontWeight:700,
                          color:w.pace>=5?'var(--teal)':w.pace>=0?'var(--gold)':'#ff6eb4'}}>
                          {w.pace>=0?'+':''}{w.pace}%
                        </span>
                      </td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:50,height:4,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
                            <div style={{width:`${w.occ}%`,height:'100%',borderRadius:2,
                              background:w.occ>=90?'var(--teal)':w.occ>=75?'var(--gold)':'#ff6eb4'}}/>
                          </div>
                          <span style={{fontFamily:'var(--mono)',fontSize:11}}>%{w.occ}</span>
                        </div>
                      </td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--gold)'}}>€{(w.rev/1000).toFixed(0)}K</td>
                      <td>
                        <span className={`badge ${w.pace>=5?'bg2':w.pace>=0?'by2':'br2'}`}>
                          {w.pace>=5?'🚀 Güçlü':w.pace>=0?'→ Normal':'⚠ Yavaş'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {sec==='forecast'&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
            {[
              {l:'YoY Büyüme (Ort.)',v:`+%${avgYoY.toFixed(1)}`,d:'Gerçekleşen aylara göre',c:'var(--teal)'},
              {l:'Forecast Yıl Sonu',v:`€${((gT+fcT)/1e6).toFixed(2)}M`,d:(gT+fcT)>=hT?'✅ Hedef aşılıyor':`▼ ${((hT-gT-fcT)/1e6).toFixed(2)}M açık`,c:(gT+fcT)>=hT?'var(--teal)':'#ff6eb4'},
              {l:'Forecast Doğruluğu',v:'%94',d:'Geçmiş ay sapmaları',c:'#a78bfa'},
            ].map((k,i)=>(
              <div key={i} className="kcard" style={{'--kc':k.c}}>
                <div className="klbl">{k.l}</div>
                <div className="kval" style={{color:k.c,fontSize:18}}>{k.v}</div>
                <div className="kdelta">{k.d}</div>
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="ptitle">🔮 Aylık Forecast — Gerçek + Projeksiyon + Geçen Yıl</div>
            <div style={{overflowX:'auto'}}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Ay</th><th>Hedef</th><th>Gerçekleşen</th>
                    <th>Forecast</th><th>Geçen Yıl</th><th>YoY %</th><th>Hedefe %</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m,i)=>{
                    const fc=forecast.find(f=>f.m===m.m);
                    const val=m.g||fc?.fc;
                    const yoy=m.py&&val?((val-m.py)/m.py*100).toFixed(1):null;
                    const pct=val?(val/m.h*100).toFixed(0):null;
                    return(
                      <tr key={i} style={{background:m.g?'transparent':'rgba(6,214,160,0.03)'}}>
                        <td style={{fontWeight:600}}>{m.m}</td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{(m.h/1e6).toFixed(2)}M</td>
                        <td style={{fontFamily:'var(--mono)',fontWeight:m.g?700:400,color:m.g?'#4cc9f0':'var(--text3)'}}>
                          {m.g?(m.g/1e6).toFixed(2)+'M':'—'}
                        </td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--teal)',fontStyle:m.g?'normal':'italic'}}>
                          {fc?'€'+(fc.fc/1e6).toFixed(2)+'M':'—'}
                          {!m.g&&<span style={{fontSize:9,color:'var(--text3)',marginLeft:4}}>proj.</span>}
                        </td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>{m.py?(m.py/1e6).toFixed(2)+'M':'—'}</td>
                        <td style={{fontFamily:'var(--mono)',fontWeight:600,
                          color:yoy==null?'var(--text3)':+yoy>=0?'var(--teal)':'#ff6eb4'}}>
                          {yoy!=null?(+yoy>=0?'+':'')+yoy+'%':'—'}
                        </td>
                        <td>
                          {pct&&<div style={{display:'flex',alignItems:'center',gap:6}}>
                            <div style={{width:40,height:4,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
                              <div style={{width:`${Math.min(+pct,100)}%`,height:'100%',borderRadius:2,
                                background:+pct>=100?'var(--teal)':+pct>=85?'var(--gold)':'#ff6eb4'}}/>
                            </div>
                            <span style={{fontFamily:'var(--mono)',fontSize:11,
                              color:+pct>=100?'var(--teal)':+pct>=85?'var(--gold)':'#ff6eb4'}}>%{pct}</span>
                          </div>}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{background:'rgba(255,255,255,0.04)',fontWeight:700}}>
                    <td>TOPLAM</td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--gold)'}}>€{(hT/1e6).toFixed(2)}M</td>
                    <td style={{fontFamily:'var(--mono)',color:'#4cc9f0'}}>€{(gT/1e6).toFixed(2)}M</td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--teal)'}}>€{((gT+fcT)/1e6).toFixed(2)}M</td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>
                      €{(monthly.reduce((s,m)=>s+(m.py||0),0)/1e6).toFixed(2)}M
                    </td>
                    <td style={{fontFamily:'var(--mono)',fontWeight:700,color:avgYoY>=0?'var(--teal)':'#ff6eb4'}}>
                      {avgYoY>=0?'+':''}{avgYoY.toFixed(1)}%
                    </td>
                    <td style={{fontFamily:'var(--mono)',fontWeight:700,
                      color:(gT+fcT)>=hT?'var(--teal)':'#ff6eb4'}}>
                      %{((gT+fcT)/hT*100).toFixed(0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {sec==='kanal'&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div className="panel">
              <div className="ptitle">🔀 Kanal Mix Simülatörü</div>
              <div className="notif nb" style={{marginBottom:14,fontSize:11}}>
                Slider ile kanal dağılımını değiştirin — blended PP ve gelir etkisi anlık hesaplanır.<br/>
                <span style={{color:'var(--text3)'}}>Toplam %100 olmalı. TO:%{kanalMix.TO} OTA:%{kanalMix.OTA} Direkt:%{kanalMix.Direkt} = %{kanalMix.TO+kanalMix.OTA+kanalMix.Direkt}</span>
              </div>
              {['TO','OTA','Direkt'].map(k=>(
                <div key={k} className="mg">
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <label className="lbl">{k} — PP €{KANAL_MIX.pp[k]}</label>
                    <span style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--gold)',fontWeight:700}}>%{kanalMix[k]}</span>
                  </div>
                  <input type="range" className="slider" min="5" max="70" value={kanalMix[k]}
                    onChange={e=>{
                      const v=+e.target.value;
                      const others=Object.keys(kanalMix).filter(x=>x!==k);
                      const remaining=100-v;
                      const sum=others.reduce((s,x)=>s+kanalMix[x],0);
                      const newMix={...kanalMix,[k]:v};
                      others.forEach(x=>{ newMix[x]=Math.max(5,Math.round(kanalMix[x]/sum*remaining)); });
                      const total=Object.values(newMix).reduce((s,x)=>s+x,0);
                      newMix[others[0]]+=100-total;
                      setKanalMix(newMix);
                    }}/>
                </div>
              ))}
              <div style={{marginTop:14,padding:'12px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:10}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {[
                    ['Blended PP',`€${blendedPP.toFixed(0)}`,'var(--gold)'],
                    ['Mevcut PP',`€${curBlended.toFixed(0)}`,'var(--text2)'],
                    ['PP Farkı',`${blendedPP>curBlended?'+':''}€${(blendedPP-curBlended).toFixed(0)}`,blendedPP>=curBlended?'var(--teal)':'#ff6eb4'],
                    ['Yıllık Etki',`${mixImpact>=0?'+':''}€${(mixImpact/1000).toFixed(0)}K`,mixImpact>=0?'var(--teal)':'#ff6eb4'],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'8px 10px'}}>
                      <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:3}}>{l}</div>
                      <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="ptitle">📊 Kanal Karşılaştırması</div>
              <table className="tbl">
                <thead><tr><th>Kanal</th><th>Mevcut Mix</th><th>Hedef Mix</th><th>PP €</th><th>Komisyon</th><th>Net PP</th></tr></thead>
                <tbody>
                  {['TO','OTA','Direkt'].map(k=>{
                    const netPP=k==='TO'?Math.round(KANAL_MIX.pp[k]*0.83):k==='OTA'?Math.round(KANAL_MIX.pp[k]*0.83):KANAL_MIX.pp[k];
                    const diff=kanalMix[k]-KANAL_MIX.cur[k];
                    return(
                      <tr key={k}>
                        <td style={{fontWeight:700}}>{k}</td>
                        <td style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)'}}>%{kanalMix[k]}
                          {diff!==0&&<span style={{fontSize:10,marginLeft:4,color:diff>0?'var(--teal)':'#ff6eb4'}}>{diff>0?'+':''}{diff}%</span>}
                        </td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>%{KANAL_MIX.tgt[k]}</td>
                        <td style={{fontFamily:'var(--mono)',color:'#4cc9f0',fontWeight:600}}>€{KANAL_MIX.pp[k]}</td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>%{k==='TO'?17:k==='OTA'?17:0}</td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--teal)',fontWeight:700}}>€{netPP}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{marginTop:14,padding:'10px 14px',background:'rgba(6,214,160,0.06)',border:'1px solid rgba(6,214,160,0.2)',borderRadius:10,fontSize:11,color:'var(--text2)',lineHeight:1.8}}>
                <strong style={{color:'var(--teal)'}}>💡 Öneri:</strong> TO oranını %{KANAL_MIX.cur.TO}→%{KANAL_MIX.tgt.TO} düşürüp Direkt kanalı %{KANAL_MIX.tgt.Direkt}'e çıkarmak yıllık{' '}
                <strong style={{color:'var(--gold)'}}>+€{Math.round((KANAL_MIX.pp.Direkt-KANAL_MIX.pp.TO)*totalOda*0.85*365*(KANAL_MIX.tgt.Direkt-KANAL_MIX.cur.Direkt)/100/1e3)}K</strong> ek gelir sağlar.
              </div>
            </div>
          </div>
        </div>
      )}

      {sec==='los'&&(
        <div>
          <div className="panel" style={{marginBottom:14}}>
            <div className="ptitle">📏 Length of Stay Analizi</div>
            <div className="notif nb" style={{marginBottom:14}}>
              Minimum stay kısıtlaması uygulandığında kısa konaklamaları engelleyerek PP ve RevPAR artışı sağlanır.
            </div>
            <table className="tbl">
              <thead>
                <tr><th>Konaklama Süresi</th><th>Oda Sayısı</th><th>%Oran</th><th>Ort. PP €</th><th>Toplam Gece Geliri</th><th>Min Stay Öneri</th></tr>
              </thead>
              <tbody>
                {[
                  {los:'1 gece',oda:18,pct:6,pp:195,total:3510,rec:'🚫 Engelle'},
                  {los:'2 gece',oda:45,pct:16,pp:188,total:16920,rec:'⚡ Kısıtla (HH)'},
                  {los:'3-4 gece',oda:72,pct:26,pp:182,total:49608,rec:'→ Serbest'},
                  {los:'5-7 gece',oda:89,pct:32,pp:178,total:95790,rec:'✅ Teşvik et'},
                  {los:'8-14 gece',oda:42,pct:15,pp:172,total:51072,rec:'✅ İndirim ver'},
                  {los:'15+ gece', oda:14,pct:5,pp:165,total:34650,rec:'💎 VIP fiyat'},
                ].map((r,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{r.los}</td>
                    <td style={{fontFamily:'var(--mono)'}}>{r.oda}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:40,height:4,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
                          <div style={{width:`${r.pct*3}%`,height:'100%',background:'var(--teal)',borderRadius:2}}/>
                        </div>
                        <span style={{fontFamily:'var(--mono)',fontSize:11}}>%{r.pct}</span>
                      </div>
                    </td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--gold)',fontWeight:700}}>€{r.pp}</td>
                    <td style={{fontFamily:'var(--mono)',color:'#4cc9f0'}}>€{r.total.toLocaleString('tr-TR')}</td>
                    <td style={{fontSize:11,fontWeight:600,
                      color:r.rec.startsWith('✅')?'var(--teal)':r.rec.startsWith('🚫')?'#ff6eb4':r.rec.startsWith('💎')?'#a78bfa':'var(--gold)'
                    }}>{r.rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div className="panel">
              <div className="ptitle">⚡ Min Stay Simülasyonu</div>
              <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.8,fontFamily:'var(--mono)'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[
                    ['1 gece engellendi','+€'+Math.round(18*195*0.4/1000)+'K/ay','var(--teal)'],
                    ['2 gece kısıtlandı','+€'+Math.round(45*188*0.2/1000)+'K/ay','var(--teal)'],
                    ['RevPAR etkisi','+€'+(195*0.06+188*0.03).toFixed(0)+'/oda','var(--gold)'],
                    ['Risk','%8 kayıp rezervasyon','#ff6eb4'],
                  ].map(([l,v,c],i)=>(
                    <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px'}}>
                      <div style={{fontSize:9,color:'var(--text3)',marginBottom:4}}>{l}</div>
                      <div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="ptitle">📅 Sezon Bazlı Min Stay Önerisi</div>
              <table className="tbl" style={{fontSize:11}}>
                <thead><tr><th>Dönem</th><th>OCC</th><th>Min Stay</th></tr></thead>
                <tbody>
                  {[
                    ['Oca-Şub','%60','Yok'],
                    ['Mar-Nis','%78','2 gece'],
                    ['May-Haz','%91','3 gece'],
                    ['Tem-Ağu','%98','5 gece (HH)'],
                    ['Eyl','%85','3 gece'],
                    ['Eki-Ara','%65','2 gece (HH)'],
                  ].map(([d,o,m],i)=>(
                    <tr key={i}>
                      <td style={{fontWeight:600}}>{d}</td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{o}</td>
                      <td style={{fontWeight:600,color:m==='Yok'?'var(--text3)':m.includes('HH')?'var(--gold)':'var(--teal)'}}>{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default Analiz;
