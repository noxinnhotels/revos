import React, { useState, useEffect, useRef } from 'react';
import { fmt, fmtK } from '../utils/format';

function AIAsistan({user,monthly,ac,simOcc,simAdr,groqKey}){
  const keySaved=!!groqKey;
  const [msgs,setMsgs]=useState([{r:'ai',t:`Merhaba ${user.name}! Revenue Asistanınım. Dashboard verilerini anlık olarak görüyorum — hedefler, Elektra doluluk/ADR, acente performansı hakkında soru sorabilirsiniz.`}]);
  const [inp,setInp]=useState('');
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');
  const endRef=useRef(null);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:'smooth'}),[msgs]);

  // ── DASHBOARD CONTEXT (canlı) ──
  const gT=monthly.filter(m=>m.g!=null).reduce((a,b)=>a+b.g,0);
  const hT=monthly.reduce((a,b)=>a+b.h,0);
  const pct=(gT/hT*100).toFixed(1);
  const kalan=monthly.filter(m=>m.g==null).length;
  const revpar=(simAdr*simOcc/100).toFixed(0);
  const pyRealT=monthly.filter(m=>m.g!=null).reduce((a,b)=>a+(b.py||0),0);
  const yoy=pyRealT>0?((gT-pyRealT)/pyRealT*100).toFixed(1):null;

  // Elektra verileri
  const elektraToken = localStorage.getItem('rv_elektra_token');
  const elektraWorker = localStorage.getItem('rv_elektra_worker');
  const elektraLastSync = localStorage.getItem('rv_elektra_last_sync');
  const elektraYearData = (() => {
    try { return JSON.parse(localStorage.getItem('rv_elektra_year_data') || '{}'); } catch { return {}; }
  })();
  const curYear = new Date().getFullYear();
  const elektraMonths = elektraYearData[curYear] || elektraYearData[curYear-1] || [];

  // Aylık kırılım özeti
  const aylikOzet = monthly.map((m,i) => {
    const elektraRow = elektraMonths.find(r=>r.month===i+1);
    return `${m.m}: hedef €${(m.h/1e3).toFixed(0)}K${m.g!=null?` gerçek €${(m.g/1e3).toFixed(0)}K (%${(m.g/m.h*100).toFixed(0)})`:' (henüz yok)'}${elektraRow?.occupancy>0?` OCC%${elektraRow.occupancy.toFixed(0)}`:''} ${elektraRow?.adr>0?`ADR€${elektraRow.adr}`:''}`;
  }).join('\n');

  // Elektra sezon özeti
  const elektraSezonOzet = elektraMonths.length > 0
    ? (() => {
        const sezonAylar = elektraMonths.filter(m=>m.occupancy>0);
        const avgOcc = sezonAylar.length ? (sezonAylar.reduce((a,b)=>a+b.occupancy,0)/sezonAylar.length).toFixed(0) : null;
        const avgAdr = elektraMonths.filter(m=>m.adr>0).length
          ? (elektraMonths.filter(m=>m.adr>0).reduce((a,b)=>a+b.adr,0)/elektraMonths.filter(m=>m.adr>0).length).toFixed(0) : null;
        const maxOcc = sezonAylar.reduce((max,m)=>m.occupancy>max.occ?{occ:m.occupancy,month:m.month}:max,{occ:0,month:0});
        const MFull=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
        return `Elektra PMS verileri (${curYear}): Ort.OCC %${avgOcc||'?'}, Ort.ADR €${avgAdr||'?'}, En yüksek doluluk: ${MFull[(maxOcc.month||1)-1]} %${maxOcc.occ.toFixed(0)}${elektraLastSync?`, Son sync: ${elektraLastSync}`:''}`;
      })()
    : 'Elektra verisi henüz senkronize edilmedi.';

  const ctx = `Sen deneyimli bir otel revenue management uzmanısın. Noxinn Deluxe Hotel, Konaklı/Antalya — 505 odalı 5 yıldızlı sezonluk otel (Nisan-Kasım).

CANLI DASHBOARD VERİLERİ:
━ Yıllık hedef: €${(hT/1e6).toFixed(2)}M
━ YTD Gerçekleşen: €${(gT/1e6).toFixed(2)}M (%${pct} tamamlandı, ${kalan} ay kaldı)
━ Simülasyon OCC: %${simOcc} | ADR: €${simAdr} | RevPAR: €${revpar}
${yoy!=null?`━ YoY değişim: %${yoy} (geçen yıla göre)\n`:''}
ELEKTRA PMS:
━ ${elektraSezonOzet}
━ Bağlantı: ${elektraToken?'Aktif':'Bağlı değil'}${elektraWorker?' (Worker proxy)':''}

AYLIK KIRILIM:
${aylikOzet}

ACENTE PERFORMANSI:
${ac.map(a=>`━ ${a.ad}: €${fmtK(a.ciro)} / €${fmtK(a.hedef)} — %${(a.ciro/a.hedef*100).toFixed(0)} gerçekleşme`).join('\n')}

Kullanıcı: ${user.name} (${user.role})
Tarih: ${new Date().toLocaleDateString('tr-TR')}

Türkçe yanıt ver. Net, kısa ve aksiyonel ol.`;

  const send = async () => {
    if(!inp.trim()||!keySaved) return;
    const txt=inp.trim(); setInp(''); setErr('');
    const nm=[...msgs,{r:'user',t:txt}];
    setMsgs(nm); setLoading(true);
    try{
      const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${groqKey}`},
        body:JSON.stringify({
          model:'llama-3.3-70b-versatile',
          max_tokens:1024,
          temperature:0.7,
          messages:[
            {role:'system',content:ctx},
            ...nm.filter((m,i)=>i>0).map(m=>({role:m.r==='user'?'user':'assistant',content:m.t}))
          ]
        })
      });
      const d=await res.json();
      if(d.error){setErr(`Hata: ${d.error.message}`);setMsgs(p=>p.slice(0,-1));}
      else setMsgs(p=>[...p,{r:'ai',t:d.choices?.[0]?.message?.content||'Yanıt alınamadı.'}]);
    }catch(e){
      setErr('Bağlantı hatası.');
      setMsgs(p=>p.slice(0,-1));
    }
    setLoading(false);
  };

  const qs=[
    'Bu ayın doluluk performansını yorumla',
    'Elektra verilerine göre en iyi sezon ayı hangisi?',
    'Corendon için aksiyon planı yaz',
    'Yüksek sezonda fiyat stratejisi öner',
    'Hedef açığını kapatmak için ne yapmalıyız?',
    'RevPAR nasıl optimize edilir',
  ];

  return(
    <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16}}>
      <div className="panel" style={{display:'flex',flexDirection:'column',height:'calc(100vh - 220px)'}}>
        <div className="ptitle">
          🤖 AI Revenue Asistanı
          <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:keySaved?'var(--teal)':'var(--text3)',display:'inline-block',boxShadow:keySaved?'0 0 6px var(--teal)':'none'}}/>
            <span style={{fontSize:10,color:keySaved?'var(--teal)':'var(--text3)',fontFamily:'var(--mono)',fontWeight:400}}>
              {keySaved?'Groq · Llama 3.3 70B':'Bağlı değil'}
            </span>
          </span>
        </div>

        {!keySaved?(
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:'0 20px',textAlign:'center'}}>
            <div style={{fontSize:44,marginBottom:4}}>🔑</div>
            <div style={{fontWeight:700,fontSize:16,fontFamily:'var(--ff)'}}>Groq API Key Gerekli</div>
            <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.8,maxWidth:320}}>
              <strong style={{color:'var(--gold)'}}>⚙ Ayarlar</strong> menüsünden Groq API key ekleyin.<br/>
              <a href="https://console.groq.com/keys" target="_blank" style={{color:'var(--gold)',textDecoration:'none',borderBottom:'1px solid rgba(240,180,41,0.3)'}}>console.groq.com/keys ↗</a> adresinden ücretsiz alabilirsiniz.
            </div>
          </div>
        ):(
          <>
            <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:10,marginBottom:12,paddingRight:4}}>
              {msgs.map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.r==='user'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'85%',padding:'11px 14px',fontSize:12.5,lineHeight:1.7,color:'var(--text)',
                    borderRadius:m.r==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',
                    background:m.r==='user'?'rgba(240,180,41,0.1)':'rgba(255,255,255,0.04)',
                    border:`1px solid ${m.r==='user'?'rgba(240,180,41,0.25)':'rgba(255,255,255,0.08)'}`}}>
                    {m.r==='ai'&&<div style={{fontSize:9,color:'var(--teal)',fontFamily:'var(--mono)',marginBottom:5,letterSpacing:'.08em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:5}}>
                      <span style={{width:4,height:4,borderRadius:'50%',background:'var(--teal)',display:'inline-block'}}/>Llama 3.3 · Groq</div>}
                    {m.t.split('\n').map((ln,j)=>ln?<div key={j} style={{marginBottom:ln.startsWith('-')||ln.startsWith('•')||ln.startsWith('━')?3:0}}>{ln}</div>:<br key={j}/>)}
                  </div>
                </div>
              ))}
              {loading&&(
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',borderRadius:14,width:'fit-content'}}>
                  <div style={{display:'flex',gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:'var(--teal)',animation:`pulse ${.4+i*.15}s ease infinite`}}/>)}</div>
                  <span style={{fontSize:11,color:'var(--text2)',fontFamily:'var(--mono)'}}>Yanıt hazırlanıyor…</span>
                </div>
              )}
              <div ref={endRef}/>
            </div>
            {err&&<div style={{marginBottom:8,padding:'8px 12px',background:'var(--rose-dim)',border:'1px solid rgba(247,37,133,.25)',borderRadius:8,fontSize:11,color:'#ff6eb4',fontFamily:'var(--mono)'}}>{err}</div>}
            <div style={{display:'flex',gap:8}}>
              <input className="inp" value={inp} onChange={e=>setInp(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
                placeholder="Soru sorun… (Enter)" style={{flex:1}}/>
              <button className="btn bp" style={{padding:'9px 18px',whiteSpace:'nowrap'}} onClick={send} disabled={loading||!inp.trim()}>Gönder ↑</button>
            </div>
          </>
        )}
      </div>

      {/* SAĞ PANEL */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div className="panel">
          <div className="ptitle">⚡ Hızlı Sorular</div>
          {qs.map((q,i)=>(
            <button key={i} className="btn bg"
              style={{width:'100%',textAlign:'left',fontSize:11.5,padding:'9px 12px',marginBottom:6,borderRadius:8,lineHeight:1.4}}
              onClick={()=>setInp(q)} disabled={!keySaved}>{q}</button>
          ))}
        </div>

        {/* Canlı bağlam özeti */}
        <div className="panel">
          <div className="ptitle">📊 AI'ın Gördükleri</div>
          <div style={{fontSize:11,fontFamily:'var(--mono)',lineHeight:2.2}}>
            {[
              ['👤', user.name],
              ['🎯', `€${(hT/1e6).toFixed(2)}M hedef`],
              ['✅', `${fmt(gT)} (%${pct})`],
              ['📊', `OCC %${simOcc}`],
              ['💰', `ADR €${simAdr}`],
              ['🏨', `RevPAR €${revpar}`],
              ...(elektraMonths.length>0 ? [
                ['⚡', `Elektra: ${elektraMonths.filter(m=>m.occupancy>0).length} ay veri`],
                ['📅', elektraLastSync ? `Son sync: ${elektraLastSync.split(' ')[0]}` : 'Sync yok'],
              ] : [['⚡','Elektra: bağlı değil']]),
              ['🏢', `${ac.length} acente`],
            ].map(([ic,v],i)=>(
              <div key={i} style={{display:'flex',gap:8,color:'var(--text2)',borderBottom:'1px solid rgba(255,255,255,0.04)',paddingBottom:2}}>
                <span>{ic}</span><span style={{color: ic==='⚡'&&elektraMonths.length>0?'var(--gold)':'var(--text2)'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {keySaved&&(
          <div className="panel" style={{padding:'12px 14px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'var(--teal)'}}>✓ Groq Bağlı</div>
                <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:2}}>Llama 3.3 70B Versatile</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAsistan;
