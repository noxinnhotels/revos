import React, { useState, useEffect } from 'react';
import { PieChartSVG } from './Charts';
import { fmt, fmtK } from '../utils/format';
import { getSupabase } from '../utils/supabase';

function Acente({user,ac,setAc}){
  const [f,setF]=useState('hepsi');
  const [modal,setModal]=useState(false);
  const [view,setView]=useState('liste'); // liste | kontrat
  const [delId,setDelId]=useState(null);
  const [saving,setSaving]=useState(false);
  const [saveMsg,setSaveMsg]=useState('');
  const [pendingDelete,setPendingDelete]=useState(null); // {id, name} — onay bekliyor
  const [localAc,setLocalAc]=useState(ac);
  const [dirty,setDirty]=useState(false); // kaydedilmemiş değişiklik var mı
  const [form,setForm]=useState({ad:'',tip:'TO',kom:15,hedef:500,ind:5});

  // ac prop değişince localAc'ı güncelle (ilk yüklemede)
  useEffect(()=>{ if(!dirty) setLocalAc(ac); },[ac]);

  const list=f==='hepsi'?localAc:localAc.filter(a=>a.tip===f);
  const tC=localAc.reduce((a,b)=>a+b.ciro,0),tH=localAc.reduce((a,b)=>a+b.hedef,0);
  const CLR=['#4cc9f0','#f0b429','#06d6a0','#f72585','#ffd166','#06b6d4','#c4b5fd','#67e8f9'];

  const handleAdd=()=>{
    if(!form.ad.trim())return;
    const newItem={
      id:Date.now(), ad:form.ad.trim(), tip:form.tip,
      kom:+form.kom, hedef:+form.hedef*1000, ind:+form.ind,
      ciro:0, ay:Array(12).fill(Math.round(+form.hedef*1000/12))
    };
    setLocalAc(prev=>[...prev,newItem]);
    setDirty(true);
    setForm({ad:'',tip:'TO',kom:15,hedef:500,ind:5});
    setModal(false);
  };

  const handleDelete=(id)=>{
    setLocalAc(prev=>prev.filter(a=>a.id!==id));
    setDirty(true);
    setPendingDelete(null);
    setDelId(null);
  };

  const saveAll=async()=>{
    const sb=getSupabase();
    setSaving(true); setSaveMsg('');
    try{
      if(sb){
        // 1. DB'deki mevcut acenteleri al
        const {data:dbAc}=await sb.from('agencies').select('id,name');
        const dbNames=(dbAc||[]).map(a=>a.name);
        const localNames=localAc.map(a=>a.ad);

        // 2. Silinenleri DB'den kaldır
        const toDelete=(dbAc||[]).filter(a=>!localNames.includes(a.name));
        for(const a of toDelete){
          await sb.from('agencies').delete().eq('id',a.id);
        }

        // 3. Yeni eklenenleri DBye yaz
        const toAdd=localAc.filter(a=>!dbNames.includes(a.ad));
        for(const a of toAdd){
          const {data:saved}=await sb.from('agencies').insert({
            name:a.ad, type:a.tip, commission:a.kom,
            annual_target:a.hedef, actual_revenue:a.ciro||0, discount:a.ind
          }).select().single();
          if(saved){
            const rows=a.ay.map((t,i)=>({agency_id:saved.id,month_index:i,target:t}));
            await sb.from('agency_monthly').insert(rows);
          }
        }
      }
      // State güncelle
      setAc(localAc);
      setDirty(false);
      setSaveMsg('✅ Kaydedildi!');
      setTimeout(()=>setSaveMsg(''),2500);
    }catch(e){
      console.error('Save error:',e);
      setSaveMsg('❌ Kayıt hatası: '+e.message);
    }
    setSaving(false);
  };

  const discardChanges=()=>{
    setLocalAc(ac);
    setDirty(false);
  };

  return(
    <>
    <div>
      <div className="kgrid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        {[{l:'Toplam Acente Cirosu',v:fmt(tC),d:`%${(tC/tH*100).toFixed(1)} hedefe ulaşıldı`,c:'#00d4ff'},{l:'Acente Hedef',v:fmt(tH),d:`Açık: ${fmt(tH-tC)}`,c:'#a78bfa'},{l:'En İyi',v:'Tui Deutschland',d:'€2.84M ciro',c:'#10b981'},{l:'Kritik',v:'Corendon',d:"Hedefin %63'ünde",c:'#ef4444',neg:true}].map((k,i)=>(
          <div key={i} className="kcard" style={{'--kc':k.c}}><div className="klbl">{k.l}</div><div className="kval" style={{color:k.c,fontSize:k.v.length>8?16:22}}>{k.v}</div><div className="kdelta" style={{color:k.neg?'#ef4444':'#10b981'}}>{k.d}</div></div>
        ))}
      </div>
      <div className="g65">
        <div className="panel">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div className="ptitle" style={{margin:0}}>🏢 Acente Performansı</div>
            <div style={{display:'flex',gap:5,alignItems:'center'}}>
              {['hepsi','TO','OTA','Direkt'].map(x=><button key={x} className={`btn ${f===x?'bp':'bg'}`} style={{padding:'4px 11px',fontSize:11}} onClick={()=>setF(x)}>{x}</button>)}
              <div style={{width:1,height:20,background:'var(--border)',margin:'0 4px'}}/>
              <button className={`btn ${view==='liste'?'bp':'bg'}`} style={{padding:'4px 11px',fontSize:11}} onClick={()=>setView('liste')}>📋 Liste</button>
              <button className={`btn ${view==='kontrat'?'bp':'bg'}`} style={{padding:'4px 11px',fontSize:11}} onClick={()=>setView('kontrat')}>💰 Kontrat vs EB</button>
              {user.p.addac&&<button className="btn bg" style={{padding:'4px 12px',fontSize:11,borderColor:'var(--teal)',color:'var(--teal)',marginLeft:6}} onClick={()=>setModal(true)}>+ Acente Ekle</button>}
            </div>
          </div>
          {dirty&&(
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,padding:'8px 12px',background:'rgba(240,180,41,0.08)',border:'1px solid rgba(240,180,41,0.3)',borderRadius:10}}>
              <span style={{flex:1,fontSize:12,color:'var(--gold)',fontFamily:'var(--mono)'}}>● Kaydedilmemiş değişiklik var</span>
              <button className="btn bg" style={{fontSize:11,padding:'4px 10px'}} onClick={discardChanges} disabled={saving}>↩ Geri Al</button>
              <button className="btn bp" style={{fontSize:12,padding:'5px 16px'}} onClick={saveAll} disabled={saving}>{saving?'⏳ Kaydediliyor…':'💾 Kaydet'}</button>
            </div>
          )}
          {saveMsg&&<div style={{marginBottom:10,padding:'7px 12px',borderRadius:8,fontSize:12,fontFamily:'var(--mono)',background:saveMsg.startsWith('✅')?'rgba(6,214,160,0.08)':'rgba(247,37,133,0.08)',border:`1px solid ${saveMsg.startsWith('✅')?'rgba(6,214,160,0.3)':'rgba(247,37,133,0.3)'}`,color:saveMsg.startsWith('✅')?'var(--teal)':'#ff6eb4'}}>{saveMsg}</div>}
          {view==='liste'&&(
          <table className="tbl">
            <thead><tr><th>Acente</th><th>Tip</th>{user.p.ciro&&<th>Ciro</th>}{user.p.hedef&&<th>Hedef</th>}<th>%</th>{user.p.kom&&<th>Kom</th>}{user.p.kom&&<th>İnd</th>}<th>Durum</th>{user.p.addac&&<th></th>}</tr></thead>
            <tbody>
              {list.map(a=>{const p=(a.ciro/a.hedef*100).toFixed(0);const d=p>=100?'iyi':p>=80?'geride':'kritik';return(
                <tr key={a.id}><td style={{fontWeight:600}}>{a.ad}</td><td><span className={`badge ${a.tip==='OTA'?'bb2':a.tip==='Direkt'?'bg2':'by2'}`}>{a.tip}</span></td>
                {user.p.ciro&&<td style={{fontFamily:'var(--mono)',fontSize:11}}>{fmtK(a.ciro)}</td>}
                {user.p.hedef&&<td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text2)'}}>{fmtK(a.hedef)}</td>}
                <td><div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:38,height:4,background:'rgba(255,255,255,0.04)',borderRadius:2}}><div style={{width:`${Math.min(p,100)}%`,height:'100%',background:p>=100?'var(--teal)':p>=80?'var(--gold)':'var(--rose)',borderRadius:2}}/></div><span style={{fontFamily:'var(--mono)',fontSize:10,color:p>=100?'var(--teal)':p>=80?'var(--gold)':'#ff6eb4'}}>%{p}</span></div></td>
                {user.p.kom&&<td style={{fontFamily:'var(--mono)',fontSize:11}}>%{a.kom}</td>}
                {user.p.kom&&<td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--gold)'}}>%{a.ind}</td>}
                <td><span className={`badge ${d==='iyi'?'bg2':d==='geride'?'by2':'br2'}`}>{d==='iyi'?'✓ İyi':d==='geride'?'⚡ Geride':'🚨 Kritik'}</span></td>
                {user.p.addac&&<td><button onClick={()=>{setPendingDelete({id:a.id,name:a.ad});setDelId(a.id);}} style={{background:'none',border:'1px solid rgba(247,37,133,0.25)',borderRadius:6,color:'#ff6eb4',cursor:'pointer',padding:'3px 8px',fontSize:11,transition:'all .2s'}} onMouseOver={e=>e.target.style.background='var(--rose-dim)'} onMouseOut={e=>e.target.style.background='none'}>✕</button></td>}
                </tr>
              );})}
            </tbody>
          </table>
          )}

          {view==='kontrat'&&(
          <div>
            <div className="notif nb" style={{marginBottom:14}}>
              💡 <strong>Kontrat fiyatı</strong> = Tur operatörüyle imzalanan sözleşme fiyatı (PP) &nbsp;|&nbsp;
              <strong>EB fiyatı</strong> = Erken rezervasyon / online fiyatı &nbsp;|&nbsp;
              <strong>Fark</strong> = Kontrat − EB
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Acente</th>
                  <th>Tip</th>
                  <th style={{textAlign:'center',color:'#4cc9f0'}}>Kontrat PP (€)</th>
                  <th style={{textAlign:'center',color:'var(--teal)'}}>EB Fiyatı (€)</th>
                  <th style={{textAlign:'center'}}>Fark</th>
                  <th style={{textAlign:'center'}}>Fark %</th>
                  <th style={{textAlign:'center'}}>Komisyon</th>
                  <th style={{textAlign:'center'}}>Net Kontrat PP</th>
                  <th>Değerlendirme</th>
                </tr>
              </thead>
              <tbody>
                {list.filter(a=>a.kontrat||a.eb).map(a=>{
                  const diff=a.kontrat&&a.eb?a.kontrat-a.eb:null;
                  const diffPct=diff&&a.eb?(diff/a.eb*100).toFixed(1):null;
                  const netKontrat=a.kontrat?Math.round(a.kontrat*(1-a.kom/100)):null;
                  const verdict=diff==null?'OTA — kontrat yok':
                    diff>15?'✅ Kontrat güçlü':
                    diff>0?'⚡ Makul':
                    diff===0?'→ Eşit':
                    '🚨 EB > Kontrat!';
                  const vc=diff==null?'var(--text3)':diff>15?'var(--teal)':diff>0?'var(--gold)':diff===0?'var(--text2)':'#ff6eb4';
                  return(
                    <tr key={a.id}>
                      <td style={{fontWeight:600}}>{a.ad}</td>
                      <td><span className={`badge ${a.tip==='OTA'?'bb2':a.tip==='Direkt'?'bg2':'by2'}`}>{a.tip}</span></td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',color:'#4cc9f0',fontWeight:600}}>
                        {a.kontrat?`€${a.kontrat}`:'—'}
                      </td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',color:'var(--teal)',fontWeight:600}}>
                        {a.eb?`€${a.eb}`:'—'}
                      </td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',fontWeight:700,
                        color:diff==null?'var(--text3)':diff>0?'var(--gold)':diff<0?'#ff6eb4':'var(--text2)'}}>
                        {diff!=null?(diff>0?`+€${diff}`:`-€${Math.abs(diff)}`):'—'}
                      </td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',fontSize:12,
                        color:diffPct==null?'var(--text3)':+diffPct>0?'var(--teal)':'#ff6eb4'}}>
                        {diffPct!=null?(+diffPct>0?`+%${diffPct}`:`%${diffPct}`):'—'}
                      </td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',color:'var(--text2)',fontSize:11}}>
                        %{a.kom}
                      </td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)'}}>
                        {netKontrat?`€${netKontrat}`:'—'}
                      </td>
                      <td><span style={{fontSize:11,fontWeight:600,color:vc}}>{verdict}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{marginTop:14,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[
                {l:'Ort. Kontrat PP',v:`€${Math.round(list.filter(a=>a.kontrat).reduce((s,a)=>s+a.kontrat,0)/Math.max(list.filter(a=>a.kontrat).length,1))}`,c:'#4cc9f0'},
                {l:'Ort. EB Fiyatı', v:`€${Math.round(list.filter(a=>a.eb).reduce((s,a)=>s+a.eb,0)/Math.max(list.filter(a=>a.eb).length,1))}`,c:'var(--teal)'},
                {l:'Kontrat > EB Olan',v:`${list.filter(a=>a.kontrat&&a.eb&&a.kontrat>a.eb).length}/${list.filter(a=>a.kontrat).length} acente`,c:'var(--gold)'},
              ].map((s,i)=>(
                <div key={i} style={{padding:'12px 16px',background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:10}}>
                  <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:6}}>{s.l}</div>
                  <div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="panel">
            <div className="ptitle">🥧 Ciro Dağılımı</div>
            <div style={{height:180}}>
              <PieChartSVG data={ac.map((a,i)=>({name:a.ad,value:a.ciro,fill:CLR[i]}))} size={170}/>
            </div>
          </div>
          <div className="panel">
            <div className="ptitle">💡 AI Öneri</div>
            {[{c:'rgba(247,37,133,.07)',bc:'rgba(247,37,133,.22)',tc:'#ff6eb4',t:'🚨 Corendon',x:" hedefin %63'ünde. +%3 komisyon önerin."},{c:'rgba(240,180,41,.08)',bc:'rgba(240,180,41,.22)',tc:'var(--gold2)',t:'⚡ Thomas Cook',x:' Q4 erken alım bonusu. €480K açık.'},{c:'rgba(0,212,255,.06)',bc:'rgba(0,212,255,.18)',tc:'var(--gold)',t:'💡 Direkt Satış',x:' en yüksek margin. +%2 büyütün.'}].map((n,i)=>(
              <div key={i} style={{padding:'8px 10px',background:n.c,border:`1px solid ${n.bc}`,borderRadius:8,color:n.tc,fontSize:11,lineHeight:1.5,marginBottom:7}}><strong>{n.t}</strong>{n.x}</div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {modal&&(
      <div className="overlay" onClick={()=>setModal(false)}>
        <div className="modal" style={{width:400}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>setModal(false)} style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text2)',cursor:'pointer',padding:'3px 8px',fontSize:13}}>✕</button>
          <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,marginBottom:20,color:'var(--text)'}}>+ Yeni Acente Ekle</div>
          <div className="mg">
            <label className="lbl">Acente Adı</label>
            <input className="inp" value={form.ad} onChange={e=>setForm({...form,ad:e.target.value})} placeholder="örn: Jet2holidays"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            <div>
              <label className="lbl">Tip</label>
              <select className="inp" value={form.tip} onChange={e=>setForm({...form,tip:e.target.value})}>
                <option value="TO">Tour Operatör (TO)</option>
                <option value="OTA">Online (OTA)</option>
                <option value="Direkt">Direkt</option>
              </select>
            </div>
            <div>
              <label className="lbl">Komisyon %</label>
              <input className="inp" type="number" min="0" max="30" value={form.kom} onChange={e=>setForm({...form,kom:e.target.value})}/>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
            <div>
              <label className="lbl">Yıllık Hedef (€K)</label>
              <input className="inp" type="number" min="0" value={form.hedef} onChange={e=>setForm({...form,hedef:e.target.value})} placeholder="500"/>
            </div>
            <div>
              <label className="lbl">İndirim %</label>
              <input className="inp" type="number" min="0" max="30" value={form.ind} onChange={e=>setForm({...form,ind:e.target.value})}/>
            </div>
          </div>
          {form.ad&&(
            <div style={{background:'rgba(240,180,41,0.06)',border:'1px solid rgba(240,180,41,0.2)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:12,color:'var(--text2)'}}>
              <span style={{color:'var(--gold)',fontWeight:600}}>{form.ad}</span> · {form.tip} · %{form.kom} komisyon · €{(+form.hedef).toLocaleString('tr-TR')}K hedef
            </div>
          )}
          <div style={{display:'flex',gap:10}}>
            <button className="btn bg" style={{flex:1}} onClick={()=>setModal(false)}>İptal</button>
            <button className="btn bp" style={{flex:2}} onClick={handleAdd} disabled={!form.ad.trim()}>✅ Acente Ekle</button>
          </div>
        </div>
      </div>
    )}


    {delId&&(
      <div className="overlay" onClick={()=>setDelId(null)}>
        <div className="modal" style={{width:360,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
          <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,marginBottom:8,color:'var(--text)'}}>Acenteyi Sil</div>
          <div style={{fontSize:13,color:'var(--text2)',marginBottom:6}}>
            <strong style={{color:'var(--gold)'}}>{localAc.find(a=>a.id===delId)?.ad}</strong>
          </div>
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:22}}>Bu işlem geri alınamaz. Tüm hedef verileri silinecektir.</div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn bg" style={{flex:1}} onClick={()=>setDelId(null)}>Vazgeç</button>
            <button className="btn" style={{flex:1,background:'var(--rose-dim)',border:'1px solid rgba(247,37,133,.3)',color:'#ff6eb4'}} onClick={()=>handleDelete(delId)}>Evet, Sil</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default Acente;
