import React, { useState } from 'react';
import { fmtK } from '../utils/format';

function Bildirim({user, monthly, ac, simOcc, simAdr}){
  const [sec,setSec]=useState('alerts');

  // ── GÖREVLER (localStorage) ──
  const loadTasks = () => {
    try{ return JSON.parse(localStorage.getItem('rv_tasks')||'[]'); }catch{ return []; }
  };
  const [tasks,setTasks]=useState(loadTasks);
  const [taskForm,setTaskForm]=useState({title:'',desc:'',due:'',priority:'orta',assignee:'',tag:'acente'});
  const [taskModal,setTaskModal]=useState(false);

  const saveTasks = (list) => {
    setTasks(list);
    localStorage.setItem('rv_tasks', JSON.stringify(list));
  };

  const addTask = () => {
    if(!taskForm.title) return;
    const t={...taskForm, id:Date.now(), done:false, created:new Date().toISOString().slice(0,10), creator:user.name};
    saveTasks([...tasks, t]);
    setTaskForm({title:'',desc:'',due:'',priority:'orta',assignee:'',tag:'acente'});
    setTaskModal(false);
  };

  const toggleTask = (id) => saveTasks(tasks.map(t=>t.id===id?{...t,done:!t.done}:t));
  const deleteTask = (id) => saveTasks(tasks.filter(t=>t.id!==id));

  // ── OTOMATİK ALERTLER ──
  const hT = monthly.reduce((a,b)=>a+b.h,0);
  const gT = monthly.filter(m=>m.g!=null).reduce((a,b)=>a+b.g,0);
  const pct = gT/hT*100;

  const alerts = [];

  // Hedef alertleri
  if(pct < 70) alerts.push({level:'kritik', icon:'🚨', title:'Kritik: Hedef Riski', msg:`Yıllık hedefin yalnızca %${pct.toFixed(1)}'ine ulaşıldı. Acil aksiyon gerekiyor.`, tag:'hedef', ts:'Bugün'});
  else if(pct < 85) alerts.push({level:'uyari', icon:'⚠️', title:'Uyarı: Hedef Geride', msg:`Hedefin %${pct.toFixed(1)}'inde. Kalan aylarda baskı artacak.`, tag:'hedef', ts:'Bugün'});

  // Acente alertleri
  ac.forEach(a=>{
    const ap = a.ciro/a.hedef*100;
    if(ap < 50) alerts.push({level:'kritik', icon:'🚨', title:`${a.ad} — Kritik`, msg:`Hedefin %${ap.toFixed(0)}'inde. Acil görüşme planlanmalı.`, tag:'acente', ts:'Bugün'});
    else if(ap < 70) alerts.push({level:'uyari', icon:'⚡', title:`${a.ad} — Geride`, msg:`Hedefin %${ap.toFixed(0)}'inde. Bu ay ek kampanya gerekebilir.`, tag:'acente', ts:'Bugün'});
  });

  // Doluluk alerti
  if(simOcc < 60) alerts.push({level:'uyari', icon:'🏨', title:'Düşük Doluluk', msg:`Simülasyon doluluk %${simOcc}. OTA kanallarında kampanya açın.`, tag:'operasyon', ts:'Bugün'});
  if(simOcc > 95) alerts.push({level:'bilgi', icon:'💡', title:'Yüksek Doluluk Fırsatı', msg:`Doluluk %${simOcc}. Fiyat artışı için ideal zaman.`, tag:'operasyon', ts:'Bugün'});

  // PP alerti
  if(simAdr < 180) alerts.push({level:'uyari', icon:'💰', title:'Düşük PP', msg:`Ortalama PP €${simAdr}. Hedef €200+ için upgrade teklifleri artırın.`, tag:'fiyat', ts:'Bugün'});

  // Sabit demo alertler
  alerts.push({level:'bilgi', icon:'📋', title:'Tui Deutschland Kontrat', msg:'Kontrat yenileme tarihi 38 gün sonra (31 Mart). Müzakere başlatın.', tag:'acente', ts:'Dün'});
  alerts.push({level:'bilgi', icon:'📅', title:'Q4 Pick-up', msg:'Kasım-Aralık pick-up hızı geçen yıla göre -%5. Erken rezervasyon kampanyası önerilebilir.', tag:'operasyon', ts:'2 gün önce'});

  // ── AKTİVİTE LOGU ──
  const log = [
    {ts:'15 Eki 14:32', user:'Genel Müdür',  action:'Simülasyon güncellendi', detail:'OCC: %82→%85, PP: €218→€225', icon:'📊'},
    {ts:'15 Eki 11:15', user:'Satış Müdürü', action:'Acente hedefi düzenlendi', detail:'Corendon hedef: €1.2M (değişmedi)', icon:'🎯'},
    {ts:'14 Eki 16:45', user:'Revenue Mgr',  action:'Blackout eklendi', detail:'20-25 Eki: Stop Sale (Özel Etkinlik)', icon:'🚫'},
    {ts:'14 Eki 09:20', user:'Genel Müdür',  action:'Yeni kullanıcı eklendi', detail:'Rezervasyon — yeni@otel.com', icon:'👤'},
    {ts:'13 Eki 17:05', user:'Satış Müdürü', action:'Kotasyon hazırlandı', detail:'Tui Deutschland — €185 PP, 6 ay', icon:'💬'},
    {ts:'13 Eki 10:30', user:'Revenue Mgr',  action:'Tema değiştirildi', detail:'Koyu Okyanus → Gece Mavisi', icon:'🎨'},
    {ts:'12 Eki 14:00', user:'Genel Müdür',  action:'Aylık hedef güncellendi', detail:'Kasım hedefi: €1.1M→€1.15M', icon:'📅'},
    {ts:'11 Eki 09:15', user:'Satış Müdürü', action:'Acente silindi', detail:'Test Acente (id:99) kaldırıldı', icon:'🗑'},
  ];

  const priorityColor = (p) => p==='yüksek'?'#ff6eb4':p==='düşük'?'var(--teal)':'var(--gold)';
  const tagColors = {acente:'var(--blue)',hedef:'var(--gold)',operasyon:'var(--teal)',fiyat:'#a78bfa'};
  const levelColor = (l) => l==='kritik'?'#ff6eb4':l==='uyari'?'var(--gold)':'var(--teal)';
  const levelBg = (l) => l==='kritik'?'rgba(247,37,133,0.06)':l==='uyari'?'rgba(240,180,41,0.06)':'rgba(6,214,160,0.05)';
  const levelBorder = (l) => l==='kritik'?'rgba(247,37,133,0.25)':l==='uyari'?'rgba(240,180,41,0.25)':'rgba(6,214,160,0.2)';

  const doneTasks = tasks.filter(t=>t.done).length;
  const overdueTasks = tasks.filter(t=>!t.done&&t.due&&t.due<new Date().toISOString().slice(0,10)).length;
  const criticalAlerts = alerts.filter(a=>a.level==='kritik').length;

  return(
    <div>
      {/* Özet bar */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        {[
          {l:'Kritik Alert', v:criticalAlerts, c:'#ff6eb4', icon:'🚨'},
          {l:'Toplam Alert', v:alerts.length, c:'var(--gold)', icon:'🔔'},
          {l:'Açık Görev', v:tasks.filter(t=>!t.done).length, c:'var(--blue)', icon:'📋'},
          {l:'Geciken Görev', v:overdueTasks, c:overdueTasks>0?'#ff6eb4':'var(--teal)', icon:'⏰'},
        ].map((k,i)=>(
          <div key={i} className="kcard" style={{'--kc':k.c,padding:'12px 14px',cursor:'pointer'}}
            onClick={()=>setSec(i<2?'alerts':'tasks')}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:18}}>{k.icon}</span>
              <div className="klbl">{k.l}</div>
            </div>
            <div style={{fontSize:24,fontWeight:800,color:k.c,fontFamily:'var(--ff)'}}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[['alerts','🔔 Otomatik Alertler'],['tasks','📋 Görevler & Hatırlatıcı'],['log','📜 Aktivite Logu']].map(([k,l])=>(
          <button key={k} className={`btn ${sec===k?'bp':'bg'}`} style={{fontSize:12,padding:'7px 18px'}} onClick={()=>setSec(k)}>{l}</button>
        ))}
      </div>

      {sec==='alerts'&&(
        <div>
          {['kritik','uyari','bilgi'].map(level=>{
            const levelAlerts = alerts.filter(a=>a.level===level);
            if(!levelAlerts.length) return null;
            return(
              <div key={level} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontFamily:'var(--mono)',fontWeight:700,color:levelColor(level),marginBottom:8,textTransform:'uppercase',letterSpacing:'.08em'}}>
                  {level==='kritik'?'🚨 KRİTİK':level==='uyari'?'⚠️ UYARI':'💡 BİLGİ'} — {levelAlerts.length} alert
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {levelAlerts.map((a,i)=>(
                    <div key={i} style={{
                      padding:'12px 16px', borderRadius:10,
                      background:levelBg(a.level),
                      border:`1px solid ${levelBorder(a.level)}`,
                      display:'flex', gap:12, alignItems:'flex-start'
                    }}>
                      <span style={{fontSize:20,flexShrink:0}}>{a.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontWeight:700,fontSize:13,color:levelColor(a.level)}}>{a.title}</span>
                          <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:tagColors[a.tag]+'22',color:tagColors[a.tag],fontFamily:'var(--mono)',border:`1px solid ${tagColors[a.tag]}44`}}>{a.tag}</span>
                          <span style={{marginLeft:'auto',fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{a.ts}</span>
                        </div>
                        <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>{a.msg}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sec==='tasks'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:12,color:'var(--text2)'}}>
              {tasks.filter(t=>!t.done).length} açık · {doneTasks} tamamlandı · {overdueTasks>0?<span style={{color:'#ff6eb4'}}>{overdueTasks} gecikmiş</span>:null}
            </div>
            <button className="btn bp" style={{fontSize:12,padding:'6px 16px'}} onClick={()=>setTaskModal(true)}>+ Görev Ekle</button>
          </div>

          {tasks.length===0&&(
            <div className="panel" style={{textAlign:'center',padding:'48px',color:'var(--text3)'}}>
              <div style={{fontSize:36,marginBottom:12}}>📋</div>
              <div style={{fontSize:14,fontWeight:600}}>Henüz görev yok</div>
              <div style={{fontSize:12,marginTop:6}}>Takip edilmesi gereken görevler ve hatırlatıcılar ekleyin.</div>
            </div>
          )}

          {['yüksek','orta','düşük'].map(pri=>{
            const priTasks = tasks.filter(t=>t.priority===pri);
            if(!priTasks.length) return null;
            return(
              <div key={pri} style={{marginBottom:14}}>
                <div style={{fontSize:11,fontFamily:'var(--mono)',fontWeight:700,color:priorityColor(pri),marginBottom:8,textTransform:'uppercase',letterSpacing:'.08em'}}>
                  {pri==='yüksek'?'🔴':pri==='orta'?'🟡':'🟢'} {pri.toUpperCase()} ÖNCELİK
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {priTasks.map(t=>{
                    const overdue = !t.done&&t.due&&t.due<new Date().toISOString().slice(0,10);
                    return(
                      <div key={t.id} style={{
                        display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',
                        borderRadius:10,background:'rgba(255,255,255,0.03)',
                        border:`1px solid ${t.done?'rgba(255,255,255,0.04)':overdue?'rgba(247,37,133,0.25)':'var(--border)'}`,
                        opacity:t.done?0.55:1, transition:'all .2s'
                      }}>
                        <input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)}
                          style={{marginTop:3,cursor:'pointer',accentColor:'var(--teal)',width:14,height:14}}/>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                            <span style={{fontWeight:600,fontSize:13,textDecoration:t.done?'line-through':'none',color:t.done?'var(--text3)':'var(--text)'}}>{t.title}</span>
                            <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:tagColors[t.tag]+'22',color:tagColors[t.tag]||'var(--text3)',fontFamily:'var(--mono)',border:`1px solid ${tagColors[t.tag]||'var(--border)'}44`}}>{t.tag}</span>
                            {overdue&&<span style={{fontSize:10,color:'#ff6eb4',fontFamily:'var(--mono)',fontWeight:700}}>GECİKMİŞ</span>}
                          </div>
                          {t.desc&&<div style={{fontSize:11,color:'var(--text2)',marginTop:3,lineHeight:1.5}}>{t.desc}</div>}
                          <div style={{display:'flex',gap:12,marginTop:5,fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>
                            {t.due&&<span style={{color:overdue?'#ff6eb4':'var(--text3)'}}>📅 {t.due}</span>}
                            {t.assignee&&<span>👤 {t.assignee}</span>}
                            <span>✍ {t.creator}</span>
                          </div>
                        </div>
                        <button onClick={()=>deleteTask(t.id)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:14,padding:'0 4px',opacity:0.5}} onMouseOver={e=>e.target.style.opacity='1'} onMouseOut={e=>e.target.style.opacity='0.5'}>✕</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {taskModal&&(
            <div className="overlay" onClick={()=>setTaskModal(false)}>
              <div className="modal" style={{width:460}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setTaskModal(false)} style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text2)',cursor:'pointer',padding:'3px 8px',fontSize:13}}>✕</button>
                <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,marginBottom:20}}>+ Yeni Görev</div>
                <div className="mg">
                  <label className="lbl">Görev Başlığı *</label>
                  <input className="inp" value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))} placeholder="örn: Corendon görüşmesi planla"/>
                </div>
                <div className="mg">
                  <label className="lbl">Açıklama</label>
                  <input className="inp" value={taskForm.desc} onChange={e=>setTaskForm(f=>({...f,desc:e.target.value}))} placeholder="Detay..."/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div className="mg">
                    <label className="lbl">Son Tarih</label>
                    <input type="date" className="inp" value={taskForm.due} onChange={e=>setTaskForm(f=>({...f,due:e.target.value}))}/>
                  </div>
                  <div className="mg">
                    <label className="lbl">Öncelik</label>
                    <select className="inp" value={taskForm.priority} onChange={e=>setTaskForm(f=>({...f,priority:e.target.value}))}>
                      <option value="yüksek">🔴 Yüksek</option>
                      <option value="orta">🟡 Orta</option>
                      <option value="düşük">🟢 Düşük</option>
                    </select>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div className="mg">
                    <label className="lbl">Atanan Kişi</label>
                    <input className="inp" value={taskForm.assignee} onChange={e=>setTaskForm(f=>({...f,assignee:e.target.value}))} placeholder="İsim..."/>
                  </div>
                  <div className="mg">
                    <label className="lbl">Etiket</label>
                    <select className="inp" value={taskForm.tag} onChange={e=>setTaskForm(f=>({...f,tag:e.target.value}))}>
                      <option value="acente">Acente</option>
                      <option value="hedef">Hedef</option>
                      <option value="operasyon">Operasyon</option>
                      <option value="fiyat">Fiyat</option>
                    </select>
                  </div>
                </div>
                <button className="btn bp bfull" style={{marginTop:8}} onClick={addTask} disabled={!taskForm.title}>
                  ✅ Görevi Ekle
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {sec==='log'&&(
        <div className="panel">
          <div className="ptitle">📜 Aktivite Logu</div>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:14,fontFamily:'var(--mono)'}}>
            Son 7 günün sistem aktiviteleri (demo verisi — Supabase ile gerçek log tutulabilir)
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            {log.map((l,i)=>(
              <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'10px 0',borderBottom:i<log.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>{l.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontWeight:600,fontSize:12,color:'var(--text)'}}>{l.action}</span>
                    <span style={{fontSize:10,color:'var(--teal)',fontFamily:'var(--mono)'}}>{l.user}</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{l.detail}</div>
                </div>
                <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',flexShrink:0,paddingTop:2}}>{l.ts}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



export default Bildirim;
