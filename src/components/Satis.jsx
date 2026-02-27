import React, { useState } from 'react';
import { fmt, fmtK } from '../utils/format';
import { MF } from '../data/constants';

function Satis({user,ac,monthly,simOcc,simAdr}){
  const [sec,setSec]=useState('skor'); // skor | kotasyon | sozlesme
  const [kotAcente,setKotAcente]=useState(ac[0]?.id||1);
  const [kotOcc,setKotOcc]=useState(85);
  const [kotPP,setKotPP]=useState(185);
  const [kotDonem,setKotDonem]=useState(6); // ay sayısı

  const hT=monthly.reduce((a,b)=>a+b.h,0);
  const gT=monthly.filter(m=>m.g!=null).reduce((a,b)=>a+b.g,0);

  // ── ACENTE SKOR KARTI ──
  const skorAc=ac.map(a=>{
    const hedefPct=a.ciro/a.hedef*100;
    const pyData=monthly.filter(m=>m.py);
    const buyumePct=a.ciro>0?Math.min(((a.ciro/(a.hedef*0.75))-1)*100,30):0; // simüle büyüme
    const marginPct=100-a.kom-a.ind;
    const volumeScore=Math.min(a.ciro/500000*10,30);
    const skor=Math.round(
      (Math.min(hedefPct,120)/120*100)*0.35 +
      (Math.max(0,Math.min(buyumePct+10,20))/20*100)*0.20 +
      (marginPct/100*100)*0.25 +
      volumeScore*0.20
    );
    return {...a, hedefPct:hedefPct.toFixed(0), skor, marginPct};
  }).sort((a,b)=>b.skor-a.skor);

  // ── KOTASYON SİMÜLATÖRÜ ──
  const selAc=ac.find(a=>a.id===kotAcente)||ac[0];
  const totOda=280;
  const kotRevPerAy=Math.round(totOda*(kotOcc/100)*kotPP*30);
  const kotTopRev=kotRevPerAy*kotDonem;
  const kotNetPP=Math.round(kotPP*(1-(selAc?.kom||15)/100));
  const kotNetRev=Math.round(kotTopRev*(1-(selAc?.kom||15)/100));
  const hedefKatki=(kotNetRev/hT*100).toFixed(1);
  const sezonScore=monthly.slice(0,kotDonem).reduce((s,m)=>s+(m.o||simOcc),0)/kotDonem;

  return(
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[['skor','🏆 Acente Skor Kartı'],['kotasyon','💬 Kotasyon Simülatörü'],['sozlesme','📋 Sözleşme Takibi']].map(([k,l])=>(
          <button key={k} className={`btn ${sec===k?'bp':'bg'}`} style={{fontSize:12,padding:'7px 18px'}} onClick={()=>setSec(k)}>{l}</button>
        ))}
      </div>

      {sec==='skor'&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
            {[
              {l:'En İyi Skor',v:skorAc[0]?.ad,sub:`${skorAc[0]?.skor}/100`,c:'var(--teal)'},
              {l:'En Düşük Skor',v:skorAc[skorAc.length-1]?.ad,sub:`${skorAc[skorAc.length-1]?.skor}/100`,c:'#ff6eb4'},
              {l:'Ort. Skor',v:Math.round(skorAc.reduce((s,a)=>s+a.skor,0)/skorAc.length)+'/100',sub:'Tüm acenteler',c:'var(--gold)'},
              {l:'Kritik Acente',v:skorAc.filter(a=>a.skor<50).length+' acente',sub:'Skor < 50',c:'#ef4444'},
            ].map((k,i)=>(
              <div key={i} className="kcard" style={{'--kc':k.c}}>
                <div className="klbl">{k.l}</div>
                <div className="kval" style={{color:k.c,fontSize:15}}>{k.v}</div>
                <div className="kdelta">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="ptitle">🏆 Acente Performans Skor Kartı</div>
            <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:12}}>
              Ağırlık: Hedef Ulaşma %35 · Büyüme %20 · Margin %25 · Hacim %20
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th><th>Acente</th><th>Tip</th>
                  <th style={{textAlign:'center'}}>Hedef %</th>
                  <th style={{textAlign:'center'}}>Net Margin</th>
                  <th style={{textAlign:'center'}}>Ciro</th>
                  <th style={{textAlign:'center'}}>Skor</th>
                  <th style={{textAlign:'center'}}>Öncelik</th>
                </tr>
              </thead>
              <tbody>
                {skorAc.map((a,i)=>{
                  const grade=a.skor>=80?{l:'A',c:'var(--teal)'}:a.skor>=65?{l:'B',c:'var(--gold)'}:a.skor>=50?{l:'C',c:'#f59e0b'}:{l:'D',c:'#ff6eb4'};
                  const action=a.skor>=80?'✅ Koru & Büyüt':a.skor>=65?'⚡ Geliştir':a.skor>=50?'🎯 Aksiyon Gerekli':'🚨 Kritik Görüşme';
                  return(
                    <tr key={a.id}>
                      <td style={{fontFamily:'var(--mono)',color:'var(--text3)',fontWeight:700}}>{i+1}</td>
                      <td style={{fontWeight:700}}>{a.ad}</td>
                      <td><span className={`badge ${a.tip==='OTA'?'bb2':a.tip==='Direkt'?'bg2':'by2'}`}>{a.tip}</span></td>
                      <td style={{textAlign:'center'}}>
                        <span style={{fontFamily:'var(--mono)',fontWeight:700,
                          color:+a.hedefPct>=100?'var(--teal)':+a.hedefPct>=80?'var(--gold)':'#ff6eb4'}}>
                          %{a.hedefPct}
                        </span>
                      </td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',color:'var(--text2)'}}>%{a.marginPct}</td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',color:'var(--blue)'}}>{(a.ciro/1e6).toFixed(2)}M</td>
                      <td style={{textAlign:'center'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                          <div style={{width:50,height:5,background:'rgba(255,255,255,0.06)',borderRadius:3}}>
                            <div style={{width:`${a.skor}%`,height:'100%',borderRadius:3,background:grade.c}}/>
                          </div>
                          <span style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:12,color:grade.c}}>{a.skor}</span>
                          <span style={{fontSize:13,fontWeight:800,color:grade.c}}>{grade.l}</span>
                        </div>
                      </td>
                      <td style={{fontSize:11,fontWeight:600,
                        color:a.skor>=80?'var(--teal)':a.skor>=65?'var(--gold)':a.skor>=50?'#f59e0b':'#ff6eb4'}}>
                        {action}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sec==='kotasyon'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div className="panel">
            <div className="ptitle">💬 Kotasyon Simülatörü</div>
            <div className="notif nb" style={{marginBottom:14,fontSize:11}}>
              Bir acenteye fiyat teklifi hazırlarken hedef katkısını ve uygunluğunu hesaplayın.
            </div>
            <div className="mg">
              <label className="lbl">Acente</label>
              <select className="inp" value={kotAcente} onChange={e=>setKotAcente(+e.target.value)}>
                {ac.filter(a=>a.tip==='TO').map(a=><option key={a.id} value={a.id}>{a.ad}</option>)}
              </select>
            </div>
            <div className="mg">
              <label className="lbl">Teklif PP (€): €{kotPP}</label>
              <input type="range" className="slider" min="100" max="350" step="5" value={kotPP}
                onChange={e=>setKotPP(+e.target.value)}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:3}}>
                <span>Kontrat: €{selAc?.kontrat||'—'}</span>
                <span>EB: €{selAc?.eb||'—'}</span>
                <span style={{color:kotPP>=(selAc?.kontrat||0)?'var(--teal)':'#ff6eb4'}}>
                  {kotPP>=(selAc?.kontrat||0)?'✓ Kontrat üstü':'⚠ Kontrat altı'}
                </span>
              </div>
            </div>
            <div className="mg">
              <label className="lbl">Beklenen Doluluk: %{kotOcc}</label>
              <input type="range" className="slider" min="40" max="100" value={kotOcc}
                onChange={e=>setKotOcc(+e.target.value)}/>
            </div>
            <div className="mg">
              <label className="lbl">Dönem (Ay): {kotDonem} ay</label>
              <input type="range" className="slider" min="1" max="12" value={kotDonem}
                onChange={e=>setKotDonem(+e.target.value)}/>
              <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:3}}>
                {MF.slice(0,kotDonem).join(', ')}
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="ptitle">📊 Kotasyon Sonucu</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              {[
                {l:'Brüt Gelir/Ay',v:`€${(kotRevPerAy/1000).toFixed(0)}K`,c:'#4cc9f0'},
                {l:'Toplam Brüt',v:`€${(kotTopRev/1e6).toFixed(2)}M`,c:'var(--gold)'},
                {l:'Net PP (Komisyon Sonrası)',v:`€${kotNetPP}`,c:'var(--teal)'},
                {l:'Net Toplam Gelir',v:`€${(kotNetRev/1e6).toFixed(2)}M`,c:'var(--teal)'},
                {l:'Hedef Katkısı',v:`%${hedefKatki}`,c:+hedefKatki>=5?'var(--teal)':'var(--gold)'},
                {l:'Sezon Uyumu',v:`%${sezonScore.toFixed(0)}`,c:sezonScore>=85?'var(--teal)':'var(--gold)'},
              ].map(({l,v,c})=>(
                <div key={l} style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:4}}>{l}</div>
                  <div style={{fontSize:15,fontWeight:700,color:c}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{padding:'12px 14px',borderRadius:10,
              background:kotPP>=(selAc?.kontrat||0)?'rgba(6,214,160,0.07)':'rgba(247,37,133,0.07)',
              border:`1px solid ${kotPP>=(selAc?.kontrat||0)?'rgba(6,214,160,0.3)':'rgba(247,37,133,0.3)'}`}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:6,
                color:kotPP>=(selAc?.kontrat||0)?'var(--teal)':'#ff6eb4'}}>
                {kotPP>=(selAc?.kontrat||0)?'✅ Teklif Uygun':'⚠ Dikkat: Fiyat Revizyonu Önerilir'}
              </div>
              <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.8}}>
                {kotPP>=(selAc?.kontrat||0)
                  ? `${selAc?.ad} için €${kotPP} PP teklif edilebilir. Net gelir €${(kotNetRev/1e6).toFixed(2)}M, hedefte %${hedefKatki} katkı sağlar.`
                  : `€${kotPP} teklif kontrat fiyatının (€${selAc?.kontrat}) altında. En az €${selAc?.kontrat} önerilir.`
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {sec==='sozlesme'&&(
        <div>
          <div className="panel">
            <div className="ptitle">📋 Sözleşme Yenileme Takibi</div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Acente</th><th>Mevcut Kontrat PP</th><th>Sona Erme</th>
                  <th>Kalan Süre</th><th>Önerilen Yeni PP</th><th>Değişim</th><th>Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {id:1,sure:'31 Mar 2025',kalan:38,artis:5},
                  {id:2,sure:'28 Şub 2025',kalan:18,artis:4},
                  {id:3,sure:'30 Nis 2025',kalan:49,artis:3},
                  {id:4,sure:'31 May 2025',kalan:80,artis:4},
                  {id:5,sure:'30 Haz 2025',kalan:111,artis:3},
                ].map((r,i)=>{
                  const a=ac.find(x=>x.id===r.id);
                  if(!a||!a.kontrat) return null;
                  const yeniPP=Math.round(a.kontrat*(1+r.artis/100));
                  const urgent=r.kalan<30;
                  const soon=r.kalan<60;
                  return(
                    <tr key={i} style={{background:urgent?'rgba(247,37,133,0.04)':soon?'rgba(240,180,41,0.04)':'transparent'}}>
                      <td style={{fontWeight:700}}>{a.ad}</td>
                      <td style={{fontFamily:'var(--mono)',color:'#4cc9f0',fontWeight:600}}>€{a.kontrat}</td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{r.sure}</td>
                      <td>
                        <span style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:12,
                          color:urgent?'#ff6eb4':soon?'var(--gold)':'var(--teal)'}}>
                          {r.kalan} gün
                        </span>
                      </td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--teal)',fontWeight:700}}>€{yeniPP}</td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--gold)'}}>+%{r.artis} (+€{yeniPP-a.kontrat})</td>
                      <td>
                        <span className={`badge ${urgent?'br2':soon?'by2':'bg2'}`}>
                          {urgent?'🚨 Acil':'⚡ Yakın'}
                        </span>
                      </td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:14}}>
            <div className="panel">
              <div className="ptitle">💡 Yenileme Stratejisi</div>
              {[
                {t:'🔴 30 gün içinde (Acil)',d:'Thomas Cook — şimdi müzakere başlat. €155→€162 hedef. Erken imza bonusu teklif et.'},
                {t:'🟡 60 gün içinde',d:'Tui Deutschland — yüksek hacim, %5 artış makul. Paket anlaşma (TO+aktivite) değerlendirin.'},
                {t:'🟢 90+ gün',d:'Neckermann, Anex, Corendon — sezon analizine göre teklifleri hazırlayın.'},
              ].map((n,i)=>(
                <div key={i} style={{padding:'10px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8,marginBottom:8,borderLeft:'3px solid '+(i===0?'#ff6eb4':i===1?'var(--gold)':'var(--teal)') }}>
                  <div style={{fontWeight:600,fontSize:12,marginBottom:4}}>{n.t}</div>
                  <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.6}}>{n.d}</div>
                </div>
              ))}
            </div>
            <div className="panel">
              <div className="ptitle">📊 Kontrat Yenileme Özeti</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[
                  {l:'Toplam Yenilenecek',v:'5 kontrat',c:'var(--text)'},
                  {l:'Toplam Acil',v:'1 kontrat',c:'#ff6eb4'},
                  {l:'Ort. Artış Hedefi',v:'+%3.8',c:'var(--gold)'},
                  {l:'Beklenen Ek Gelir',v:'+€'+(ac.filter(a=>a.kontrat).reduce((s,a,i)=>s+a.kontrat*([5,4,3,4,3][i]||4)/100*a.ciro/a.kontrat,0)/1000|0)+'K',c:'var(--teal)'},
                ].map(({l,v,c})=>(
                  <div key={l} style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:4}}>{l}</div>
                    <div style={{fontSize:15,fontWeight:700,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



export default Satis;
