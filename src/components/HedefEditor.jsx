import React, { useState } from 'react';
import { fmt, fmtK } from '../utils/format';
import { MS, MF } from '../data/constants';
import { getSupabase } from '../utils/supabase';

function HedefEditor({user,monthly,setMonthly,ac,setAc}){
  const [dm,setDm]=useState(monthly.map(m=>({...m})));
  const [da,setDa]=useState(ac.map(a=>({...a,ay:[...a.ay]})));
  const [chg,setChg]=useState(false);
  const [saved,setSaved]=useState(false);
  const [sec,setSec]=useState('aylik');
  const [modal,setModal]=useState(false);
  const [dT,setDT]=useState('');
  const [dM,setDM]=useState('seasonal');

  if(!user.p.editor)return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:380,gap:14,textAlign:'center'}}>
      <div style={{fontSize:40}}>🔒</div>
      <div style={{fontFamily:'var(--ff)',fontSize:17,fontWeight:700}}>Yetersiz Yetki</div>
      <div style={{fontSize:13,color:'var(--text2)'}}>GM, Satış Müdürü veya Revenue Manager rolü gereklidir.</div>
    </div>
  );

  const mark=()=>{setChg(true);setSaved(false);};
  const upH=(i,v)=>{const n=[...dm];n[i]={...n[i],h:+v*1000};setDm(n);mark();};
  const upO=(i,v)=>{const n=[...dm];n[i]={...n[i],o:+v};setDm(n);mark();};
  const upA=(i,v)=>{const n=[...dm];n[i]={...n[i],a:+v};setDm(n);mark();};
  const upAH=(id,v)=>{setDa(da.map(a=>a.id===id?{...a,hedef:+v*1000}:a));mark();};
  const upAK=(id,v)=>{setDa(da.map(a=>a.id===id?{...a,kom:+v}:a));mark();};
  const upAI=(id,v)=>{setDa(da.map(a=>a.id===id?{...a,ind:+v}:a));mark();};
  const upAL=(id,mi,v)=>{setDa(da.map(a=>{if(a.id!==id)return a;const ay=[...a.ay];ay[mi]=+v*1000;return{...a,ay};}));mark();};
  const save=async()=>{
    // State güncelle
    setMonthly(dm);
    setAc(da);
    setChg(false);
    setSaved(true);
    setTimeout(()=>setSaved(false),3000);
    // Supabase'e kaydet
    const sb = getSupabase();
    if (!sb) { console.warn('Supabase bağlı değil'); return; }
    try {
      // Aylık hedefleri kaydet
      const monthRows = dm.map((m,i) => ({ month_index: i, target: m.h, occ: m.o||null, adr: m.a||null }));
      const { error: mErr } = await sb.from('monthly_targets').upsert(monthRows, { onConflict: 'month_index' });
      if (mErr) console.error('monthly_targets error:', mErr);

      // Acente hedeflerini kaydet — id ile direkt güncelle
      for (const a of da) {
        const aId = typeof a.id === 'number' ? a.id : parseInt(a.id);
        if (!aId || isNaN(aId)) {
          console.warn('Geçersiz acente id:', a.id, a.ad);
          continue;
        }
        const { error: aErr } = await sb.from('agencies').update({
          annual_target: a.hedef,
          commission: a.kom,
          discount: a.ind || 0,
        }).eq('id', aId);
        if (aErr) console.error('agencies update error:', aErr, a.ad);

        // Aylık hedefleri güncelle
        const ayRows = a.ay.map((t,i) => ({ agency_id: aId, month_index: i, target: t || 0 }));
        const { error: ayErr } = await sb.from('agency_monthly')
          .upsert(ayRows, { onConflict: 'agency_id,month_index' });
        if (ayErr) console.error('agency_monthly error:', ayErr, a.ad);
      }
      console.log('✅ HedefEditor kayıt tamamlandı');
    } catch(e) { console.error('HedefEditor save error:', e); }
  };
  const reset=()=>{setDm(monthly.map(m=>({...m})));setDa(ac.map(a=>({...a,ay:[...a.ay]})));setChg(false);};
  const dist=()=>{
    const tot=+dT*1e6;if(!tot)return;
    const W={equal:Array(12).fill(1/12),seasonal:[.05,.05,.07,.09,.10,.12,.13,.13,.10,.07,.05,.04]}[dM]||Array(12).fill(1/12);
    setDm(dm.map((m,i)=>({...m,h:Math.round(tot*W[i])})));mark();setModal(false);
  };
  const tH=dm.reduce((a,b)=>a+b.h,0),tG=dm.filter(m=>m.g).reduce((a,b)=>a+b.g,0);
  const aH=da.reduce((a,b)=>a+b.hedef,0);
  const acAy=MS.map((_,mi)=>da.reduce((a,ac)=>a+(ac.ay[mi]||0),0));

  return(
    <div>
      {saved&&<div className="notif ng">✅ Değişiklikler kaydedildi. Tüm modüller güncellendi.</div>}
      <div className="kgrid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        {[{l:'Toplam Yıllık Hedef',v:fmt(tH),d:`Ort: ${fmtK(tH/12)}/ay`,c:'#a78bfa'},{l:'Gerçekleşen (Oca-Eyl)',v:fmt(tG),d:`%${(tG/tH*100).toFixed(1)} hedefe`,c:'#00d4ff'},{l:'Acente Hedef Toplamı',v:fmt(aH),d:aH>=tH?'✓ Karşılıyor':`▼ ${fmt(tH-aH)} eksik`,c:'#10b981',neg:aH<tH},{l:'Kalan Hedef',v:fmt(tH-tG),d:'3 ay içinde',c:'#f59e0b'}].map((k,i)=>(
          <div key={i} className="kcard" style={{'--kc':k.c}}><div className="klbl">{k.l}</div><div className="kval" style={{color:k.c,fontSize:k.v.length>7?18:22}}>{k.v}</div><div className="kdelta" style={{color:k.neg?'#ef4444':'#10b981'}}>{k.d}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        {[['aylik','📅 Aylık Hedefler'],['acente','🏢 Acente Hedefleri'],['odatip','🛏️ Oda Tipi']].map(([k,l])=>(<button key={k} className={`btn ${sec===k?'bp':'bg'}`} onClick={()=>setSec(k)}>{l}</button>))}
        <button className="btn bg" style={{marginLeft:'auto'}} onClick={()=>setModal(true)}>⚡ Otomatik Dağıt</button>
      </div>

      {sec==='aylik'&&(
        <div className="panel">
          <div className="ptitle">📅 Aylık Hedef Düzenleme</div>
          <div className="notif nb" style={{marginBottom:14}}>💡 Değerleri doğrudan düzenleyin. Sarı = değiştirilmiş. Kaydetmeden aktif olmaz.</div>
          <div style={{overflowX:'auto'}}>
            <table className="tbl">
              <thead><tr><th>Ay</th><th>Hedef (€K)</th><th>Gerçekleşen</th><th>Sapma</th><th>OCC %</th><th>ADR €</th><th>RevPAR</th><th>Durum</th></tr></thead>
              <tbody>
                {dm.map((m,i)=>{
                  const chH=m.h!==monthly[i].h;const p=m.g?(m.g/m.h*100):null;const rp=m.a&&m.o?(m.a*m.o/100).toFixed(0):'-';
                  return(<tr key={i}>
                    <td style={{fontFamily:'var(--ff)',fontWeight:700,color:'var(--gold)',fontSize:13}}>{MF[i]}</td>
                    <td><input className={`einput${chH?' chg':''}`} type="number" value={(m.h/1000).toFixed(0)} onChange={e=>upH(i,e.target.value)} style={{width:100}}/></td>
                    <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--gold)'}}>{m.g?fmtK(m.g):'—'}</td>
                    <td style={{fontFamily:'var(--mono)',fontSize:11,color:m.g?(m.g>=m.h?'var(--teal)':'#ff6eb4'):'var(--text3)'}}>{m.g?(m.g>=m.h?'+':'')+fmtK(m.g-m.h):'—'}</td>
                    <td><input className="einput" type="number" min="0" max="100" value={m.o||''} onChange={e=>upO(i,e.target.value)} style={{width:68}} placeholder="—"/></td>
                    <td><input className="einput" type="number" min="0" value={m.a||''} onChange={e=>upA(i,e.target.value)} style={{width:78}} placeholder="—"/></td>
                    <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--gold)'}}>€{rp}</td>
                    <td>{m.g?<span className={`badge ${p>=100?'bg2':p>=85?'by2':'br2'}`}>{p>=100?'✓ Aşıldı':p>=85?'⚡ Yakın':'▼ Geride'} %{p.toFixed(0)}</span>:<span className="badge bp2">📅 Bekliyor</span>}</td>
                  </tr>);
                })}
              </tbody>
              <tfoot><tr style={{borderTop:'2px solid var(--border)'}}><td style={{fontWeight:700,fontFamily:'var(--ff)',paddingTop:10}}>TOPLAM</td><td style={{fontFamily:'var(--mono)',fontWeight:600,color:'#a78bfa',paddingTop:10}}>{fmtK(tH)}</td><td style={{fontFamily:'var(--mono)',fontWeight:600,color:'var(--gold)',paddingTop:10}}>{fmtK(tG)}</td><td colSpan={5}/></tr></tfoot>
            </table>
          </div>
        </div>
      )}

      {sec==='acente'&&(
        <div>
          <div className="panel" style={{marginBottom:14}}>
            <div className="ptitle">🏢 Acente Yıllık Hedef & Koşullar</div>
            <table className="tbl">
              <thead><tr><th>Acente</th><th>Tip</th><th>Yıllık Hedef (€K)</th><th>Gerçekleşen</th><th>%</th><th>Kom %</th><th>İnd %</th><th>Fark</th></tr></thead>
              <tbody>
                {da.map(a=>{const orig=ac.find(x=>x.id===a.id);const chH=a.hedef!==orig.hedef;const p=(a.ciro/a.hedef*100).toFixed(0);return(
                  <tr key={a.id}><td style={{fontWeight:600}}>{a.ad}</td><td><span className={`badge ${a.tip==='OTA'?'bb2':a.tip==='Direkt'?'bg2':'by2'}`}>{a.tip}</span></td>
                  <td><input className={`einput${chH?' chg':''}`} type="number" value={(a.hedef/1000).toFixed(0)} onChange={e=>upAH(a.id,e.target.value)} style={{width:100}}/></td>
                  <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--gold)'}}>{fmtK(a.ciro)}</td>
                  <td><div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:34,height:4,background:'rgba(255,255,255,0.04)',borderRadius:2}}><div style={{width:`${Math.min(p,100)}%`,height:'100%',background:p>=100?'var(--teal)':p>=80?'var(--gold)':'#ff6eb4'}}/></div><span style={{fontFamily:'var(--mono)',fontSize:10,color:p>=100?'var(--teal)':p>=80?'var(--gold)':'#ff6eb4'}}>%{p}</span></div></td>
                  <td><input className="einput" type="number" min="0" max="30" value={a.kom} onChange={e=>upAK(a.id,e.target.value)} style={{width:60}}/></td>
                  <td><input className="einput" type="number" min="0" max="30" value={a.ind} onChange={e=>upAI(a.id,e.target.value)} style={{width:60}}/></td>
                  <td style={{fontFamily:'var(--mono)',fontSize:11,color:a.ciro>=a.hedef?'var(--teal)':'#ff6eb4'}}>{a.ciro>=a.hedef?'+':''}{fmtK(a.ciro-a.hedef)}</td></tr>
                );})}
              </tbody>
            </table>
          </div>
          <div className="panel">
            <div className="ptitle">📅 Aylık Dağılım Matrisi (€K)</div>
            <div style={{overflowX:'auto'}}>
              <table className="tbl" style={{minWidth:980}}>
                <thead><tr><th style={{minWidth:100}}>Acente</th>{MS.map(m=><th key={m} style={{textAlign:'center'}}>{m}</th>)}<th style={{textAlign:'center'}}>Toplam</th></tr></thead>
                <tbody>
                  {da.map(a=>(
                    <tr key={a.id}><td style={{fontWeight:600,fontSize:11}}>{a.ad}</td>
                    {a.ay.map((v,mi)=><td key={mi} style={{padding:'5px 3px'}}><input className="einput" type="number" value={(v/1000).toFixed(0)} onChange={e=>upAL(a.id,mi,e.target.value)} style={{width:62,textAlign:'center',fontSize:10,padding:'4px 4px'}}/></td>)}
                    <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--gold)',textAlign:'center',fontWeight:600}}>{fmtK(a.ay.reduce((s,v)=>s+v,0))}</td></tr>
                  ))}
                  <tr style={{background:'rgba(255,255,255,0.04)'}}><td style={{fontWeight:700,fontFamily:'var(--ff)',fontSize:12}}>TOPLAM</td>
                  {acAy.map((v,i)=><td key={i} style={{textAlign:'center',fontFamily:'var(--mono)',fontSize:10,color:'#a78bfa',fontWeight:600}}>{fmtK(v)}</td>)}
                  <td style={{textAlign:'center',fontFamily:'var(--mono)',fontSize:11,color:'#a78bfa',fontWeight:700}}>{fmtK(da.reduce((a,b)=>a+b.ay.reduce((s,v)=>s+v,0),0))}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {sec==='odatip'&&(
        <div className="panel">
          <div className="ptitle">🛏️ Oda Tipi Fiyat Planlaması</div>
          <div className="notif ny" style={{marginBottom:14}}>⚡ Bu fiyatlar simülasyon motoruna yansır. Elektra Web entegrasyonunda PMS'e aktarılacaktır.</div>
          <table className="tbl">
            <thead><tr><th>Oda Tipi</th><th>Toplam</th><th>Boş</th><th>%Dol</th><th>Pax</th><th>Per Room/Night</th><th>Per Person/Night</th><th>TRevPAR</th><th>Aylık Proj.</th><th>Öneri</th></tr></thead>
            <tbody>{ODALAR.map((o,i)=>{
              const d=o.top-o.bos;
              const p=(d/o.top*100).toFixed(0);
              const [rf,setRf]=useState(o.f);
              const [ppf,setPpf]=useState(o.pp);
              const [pax,setPax]=useState(o.pax);
              const trevpar=(rf*(+p/100));
              return(<tr key={i}>
                <td style={{fontWeight:600}}>{o.tip}</td>
                <td style={{fontFamily:'var(--mono)',fontSize:11}}>{o.top}</td>
                <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--rose)'}}>{o.bos}</td>
                <td><span style={{fontFamily:'var(--mono)',fontSize:11,color:p>=85?'var(--teal)':p>=70?'var(--gold)':'#ff6eb4'}}>%{p}</span></td>
                <td><input className="einput" type="number" value={pax} onChange={e=>setPax(+e.target.value)} style={{width:46,textAlign:'center'}}/></td>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    <input className="einput" type="number" value={rf} onChange={e=>{setRf(+e.target.value);setPpf(Math.round(+e.target.value/pax));}} style={{width:72}}/>
                    <span style={{fontSize:9,color:'var(--text3)'}}>€</span>
                  </div>
                </td>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    <input className="einput" type="number" value={ppf} onChange={e=>{setPpf(+e.target.value);setRf(Math.round(+e.target.value*pax));}} style={{width:72}}/>
                    <span style={{fontSize:9,color:'var(--text3)'}}>€</span>
                  </div>
                </td>
                <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--gold)'}}>€{trevpar.toFixed(0)}</td>
                <td style={{fontFamily:'var(--mono)',fontSize:11,color:'#00d4ff'}}>{fmtK(d*rf*30)}</td>
                <td>{o.bos>3?<span className="badge by2">📢 Doluluk artır</span>:<span className="badge bg2">💰 Fiyat artır</span>}</td>
              </tr>);})}
            </tbody>
          </table>
        </div>
      )}

      {chg&&<div className="savebar"><div style={{fontSize:12,color:'var(--gold2)',fontFamily:'var(--mono)',fontWeight:500}}>⚡ Kaydedilmemiş değişiklikler</div><button className="btn" style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',color:'var(--rose)'}} onClick={reset}>İptal</button><button className="btn bp" onClick={save}>✅ Kaydet & Uygula</button></div>}

      {modal&&(
        <div className="overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setModal(false)} style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text2)',cursor:'pointer',padding:'3px 8px'}}>✕</button>
            <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,marginBottom:18}}>⚡ Otomatik Hedef Dağılımı</div>
            <div className="mg"><label className="lbl">Yıllık Toplam Hedef (€M)</label><input className="inp" type="number" step="0.5" value={dT} onChange={e=>setDT(e.target.value)} placeholder="örn: 16.5"/></div>
            <div className="mg"><label className="lbl">Dağılım Yöntemi</label>
              {[['equal','Eşit Dağılım','Her ay aynı hedef'],['seasonal','Sezonsal','Yaz zirveli, kış düşük']].map(([k,l,d])=>(
                <div key={k} onClick={()=>setDM(k)} style={{padding:'12px 14px',borderRadius:10,border:`1px solid ${dM===k?'var(--gold)':'var(--border)'}`,background:dM===k?'var(--gold-dim)':'rgba(255,255,255,0.03)',cursor:'pointer',marginBottom:8,transition:'all .2s',boxShadow:dM===k?'var(--glow-gold)':'none'}}>
                  <div style={{fontSize:12,fontWeight:600,color:dM===k?'var(--gold)':'var(--text)'}}>{l}</div>
                  <div style={{fontSize:10,color:'var(--text2)',fontFamily:'var(--mono)',marginTop:2}}>{d}</div>
                </div>
              ))}
            </div>
            {dT&&<div style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:12,marginBottom:14}}><div style={{fontSize:9,color:'var(--text2)',fontFamily:'var(--mono)',marginBottom:6,textTransform:'uppercase'}}>Önizleme</div><div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:5}}>{MS.map((m,i)=>{const W={equal:Array(12).fill(1/12),seasonal:[.05,.05,.07,.09,.10,.12,.13,.13,.10,.07,.05,.04]}[dM];return<div key={i} style={{textAlign:'center'}}><div style={{fontSize:9,color:'var(--text2)',fontFamily:'var(--mono)'}}>{m}</div><div style={{fontSize:10,fontWeight:600,color:'var(--gold)',fontFamily:'var(--mono)'}}>{fmtK(+dT*1e6*W[i])}</div></div>;})}
            </div></div>}
            <div style={{display:'flex',gap:10}}><button className="btn bg" style={{flex:1}} onClick={()=>setModal(false)}>İptal</button><button className="btn bp" style={{flex:2}} onClick={dist} disabled={!dT}>✅ Uygula</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HedefEditor;
