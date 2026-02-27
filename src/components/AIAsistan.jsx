import React, { useState, useEffect, useRef } from 'react';
import { fmt, fmtK } from '../utils/format';

function AIAsistan({user,monthly,ac,simOcc,simAdr,groqKey}){
  const [apiKey,setApiKey]=useState('');
  const keySaved=!!groqKey;
  const [msgs,setMsgs]=useState([{r:'ai',t:`Merhaba ${user.name}! Groq destekli Revenue Asistanınım. Hedefler, fiyatlama ve acente stratejileri hakkında yardımcı olabilirim.`}]);
  const [inp,setInp]=useState('');
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');
  const endRef=useRef(null);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:'smooth'}),[msgs]);

  const gT=monthly.filter(m=>m.g!=null).reduce((a,b)=>a+b.g,0);
  const hT=monthly.reduce((a,b)=>a+b.h,0);
  const ctx=`Sen deneyimli bir otel revenue management uzmanısın. Aşağıdaki gerçek verilerle çalışıyorsun:
- Yıllık hedef: €${(hT/1e6).toFixed(2)}M
- Gerçekleşen (Oca-Eyl): €${(gT/1e6).toFixed(2)}M (%${(gT/hT*100).toFixed(1)} hedefe ulaşıldı)
- Mevcut doluluk: %${simOcc} | ADR: €${simAdr} | RevPAR: €${(simAdr*simOcc/100).toFixed(0)}
- Toplam oda: 280
- Acenteler: ${ac.map(a=>`${a.ad} (ciro:${fmtK(a.ciro)}, hedef:${fmtK(a.hedef)}, %${(a.ciro/a.hedef*100).toFixed(0)})`).join(' | ')}
- Konuşan kullanıcı: ${user.name} (${user.role})
Türkçe yanıt ver. Kısa, net ve aksiyonel ol. Gerektiğinde madde madde listele.`;

  // Key yönetimi App'teki Ayarlar modalından yapılıyor

  const send=async()=>{
    if(!inp.trim()||!keySaved)return;
    const txt=inp.trim();setInp('');setErr('');
    const nm=[...msgs,{r:'user',t:txt}];
    setMsgs(nm);setLoading(true);
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
            ...nm.filter(m=>m.r!=='ai'||nm.indexOf(m)>0).map(m=>({role:m.r==='user'?'user':'assistant',content:m.t}))
          ]
        })
      });
      const d=await res.json();
      if(d.error){setErr(`Hata: ${d.error.message}`);setMsgs(p=>p.slice(0,-1));}
      else{setMsgs(p=>[...p,{r:'ai',t:d.choices?.[0]?.message?.content||'Yanıt alınamadı.'}]);}
    }catch(e){
      setErr('Bağlantı hatası. API key ve internet bağlantınızı kontrol edin.');
      setMsgs(p=>p.slice(0,-1));
    }
    setLoading(false);
  };

  const qs=['Corendon için aksiyon planı yaz','Yüksek sezonda fiyat stratejisi öner','Q4 doluluk artırma taktikleri','RevPAR nasıl optimize edilir','Bu ay hedef tutturmak için ne yapmalıyız'];

  return(
    <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:16}}>
      <div className="panel" style={{display:'flex',flexDirection:'column',height:'calc(100vh - 220px)'}}>
        <div className="ptitle">
          🤖 AI Revenue Asistanı
          <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:!!groqKey?'var(--teal)':'var(--text3)',display:'inline-block',boxShadow:keySaved?'0 0 6px var(--teal)':'none'}}/>
            <span style={{fontSize:10,color:!!groqKey?'var(--teal)':'var(--text3)',fontFamily:'var(--mono)',fontWeight:400}}>
              {!!groqKey?'Groq · Llama 3.3 70B':'Bağlı değil'}
            </span>
          </span>
        </div>

        {!keySaved?(
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:'0 20px',textAlign:'center'}}>
            <div style={{fontSize:44,marginBottom:4}}>🔑</div>
            <div style={{fontWeight:700,fontSize:16,fontFamily:'var(--ff)'}}>Groq API Key Gerekli</div>
            <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.8,maxWidth:320}}>
              Supabase bağlıysa key'i <strong style={{color:'var(--gold)'}}>⚙ Ayarlar</strong> menüsünden ekleyin — veritabanında güvenle saklanır.<br/>
              <a href="https://console.groq.com/keys" target="_blank" style={{color:'var(--gold)',textDecoration:'none',borderBottom:'1px solid rgba(240,180,41,0.3)'}}>console.groq.com/keys ↗</a> adresinden ücretsiz alabilirsiniz.
            </div>
            <div style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)',background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 16px',lineHeight:2}}>
              ✓ Ücretsiz &nbsp;·&nbsp; ✓ Supabase'de şifreli &nbsp;·&nbsp; ✓ Llama 3.3 70B
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
                    border:`1px solid ${m.r==='user'?'rgba(240,180,41,0.25)':'rgba(255,255,255,0.08)'}`
                  }}>
                    {m.r==='ai'&&<div style={{fontSize:9,color:'var(--teal)',fontFamily:'var(--mono)',marginBottom:5,letterSpacing:'.08em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:5}}>
                      <span style={{width:4,height:4,borderRadius:'50%',background:'var(--teal)',display:'inline-block'}}/>
                      Llama 3.3 · Groq
                    </div>}
                    {m.t.split('\n').map((ln,j)=>ln?<div key={j} style={{marginBottom:ln.startsWith('-')||ln.startsWith('•')?3:0}}>{ln}</div>:<br key={j}/>)}
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

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div className="panel">
          <div className="ptitle">⚡ Hızlı Sorular</div>
          {qs.map((q,i)=>(
            <button key={i} className="btn bg"
              style={{width:'100%',textAlign:'left',fontSize:11.5,padding:'9px 12px',marginBottom:6,borderRadius:8,lineHeight:1.4}}
              onClick={()=>{setInp(q);}}
              disabled={!keySaved}
            >{q}</button>
          ))}
        </div>

        <div className="panel">
          <div className="ptitle">📊 Canlı Bağlam</div>
          <div style={{fontSize:11,fontFamily:'var(--mono)',lineHeight:2.3}}>
            {[['👤',user.name],['🎯',`€${(hT/1e6).toFixed(2)}M hedef`],['✅',fmt(gT)],['📊',`OCC %${simOcc}`],['💰',`ADR €${simAdr}`],['🏨',`RevPAR €${(simAdr*simOcc/100).toFixed(0)}`],['🏢',`${ac.length} acente`]].map(([ic,v],i)=>(
              <div key={i} style={{display:'flex',gap:8,color:'var(--text2)',borderBottom:'1px solid rgba(255,255,255,0.04)',paddingBottom:2}}>
                <span>{ic}</span><span>{v}</span>
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
              <button className="btn bg" style={{fontSize:10,padding:'4px 10px',color:'var(--text3)'}} onClick={()=>{}}>⚙ Ayarlardan Yönet</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAsistan;
