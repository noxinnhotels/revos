import React, { useState } from 'react';
import { MF, MS, ODALAR } from '../data/constants';

function Operasyonel({user, monthly, simOcc, simAdr}){
  const [sec,setSec]=useState('takvim');

  // ── TAKVİM VERİSİ ──
  // Her ay için günlük doluluk simülasyonu
  const today = new Date(2024,9,15); // Ekim 2024 (demo)
  const year = 2024;

  // Aylık OCC verisinden günlük simüle et
  const occByMonth = monthly.map(m=>m.o||simOcc);
  const blackouts = JSON.parse(localStorage.getItem('rv_blackouts')||'[]');
  const [blk, setBlk] = useState(blackouts);
  const [blkModal, setBlkModal] = useState(false);
  const [blkForm, setBlkForm] = useState({start:'',end:'',reason:'',type:'stop_sale'});
  const [calMonth, setCalMonth] = useState(9); // Ekim = index 9

  // Günlük OCC hesapla — sezonsal dalgalanma + rastgele varyasyon
  const getDayOcc = (monthIdx, day) => {
    const base = occByMonth[monthIdx] || 70;
    const seed = (monthIdx * 31 + day) % 17;
    const variation = [-8,-5,-3,0,0,2,3,5,8,10,3,-2,-5,-3,0,2,4][seed];
    return Math.min(100, Math.max(20, base + variation));
  };

  const isBlackout = (monthIdx, day) => {
    const dateStr = `${year}-${String(monthIdx+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return blk.find(b => dateStr >= b.start && dateStr <= b.end);
  };

  const saveBlackout = () => {
    if(!blkForm.start||!blkForm.end) return;
    const newBlk = [...blk, {...blkForm, id: Date.now()}];
    setBlk(newBlk);
    localStorage.setItem('rv_blackouts', JSON.stringify(newBlk));
    setBlkModal(false);
    setBlkForm({start:'',end:'',reason:'',type:'stop_sale'});
  };

  const removeBlackout = (id) => {
    const next = blk.filter(b=>b.id!==id);
    setBlk(next);
    localStorage.setItem('rv_blackouts', JSON.stringify(next));
  };

  // Takvim ızgara
  const getDaysInMonth = (m) => new Date(year, m+1, 0).getDate();
  const getFirstDay = (m) => new Date(year, m, 1).getDay();

  const occColor = (occ, isBlk) => {
    if(isBlk) return isBlk.type==='stop_sale'?'#ef4444':'#f59e0b';
    if(occ>=95) return '#06d6a0';
    if(occ>=85) return '#10b981';
    if(occ>=70) return '#f59e0b';
    if(occ>=50) return '#fb923c';
    return '#ef4444';
  };

  // ── UPGRADE MATRİSİ ──
  const upgradeData = [
    {from:'Standart',    to:'Superior',   fark:30,  pp_from:85,  pp_to:98,  mevcut:18, potGelir:18*30*0.7},
    {from:'Standart',    to:'Deluxe SV',  fark:60,  pp_from:85,  pp_to:115, mevcut:18, potGelir:18*60*0.4},
    {from:'Superior',    to:'Deluxe SV',  fark:30,  pp_from:98,  pp_to:115, mevcut:12, potGelir:12*30*0.6},
    {from:'Superior',    to:'Suite',      fark:165, pp_from:98,  pp_to:175, mevcut:12, potGelir:12*165*0.2},
    {from:'Deluxe SV',   to:'Suite',      fark:135, pp_from:115, pp_to:175, mevcut:6,  potGelir:6*135*0.3},
    {from:'Standart',    to:'Family',     fark:105, pp_from:85,  pp_to:95,  mevcut:18, potGelir:18*105*0.15},
  ];

  return(
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[['takvim','📅 Doluluk Takvimi'],['upgrade','⬆ Upgrade Matrisi'],['blackout','🚫 Blackout / Stop Sale']].map(([k,l])=>(
          <button key={k} className={`btn ${sec===k?'bp':'bg'}`} style={{fontSize:12,padding:'7px 18px'}} onClick={()=>setSec(k)}>{l}</button>
        ))}
      </div>

      {sec==='takvim'&&(
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
            <button className="btn bg" style={{padding:'5px 12px',fontSize:13}} onClick={()=>setCalMonth(m=>Math.max(0,m-1))}>◀</button>
            <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,minWidth:160,textAlign:'center'}}>
              {MF[calMonth]} {year}
            </div>
            <button className="btn bg" style={{padding:'5px 12px',fontSize:13}} onClick={()=>setCalMonth(m=>Math.min(11,m+1))}>▶</button>
            <div style={{marginLeft:'auto',display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
              {[['#06d6a0','%95+'],['#10b981','%85+'],['#f59e0b','%70+'],['#fb923c','%50+'],['#ef4444','<%50'],['#ef4444','Stop Sale'],['#f59e0b','Kısıt']].map(([c,l],i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'var(--text2)',fontFamily:'var(--mono)'}}>
                  <div style={{width:10,height:10,borderRadius:2,background:c,opacity:i>=5?1:1,border:i>=5?'2px solid '+c:'none'}}/>
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{padding:'14px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:6}}>
              {['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'].map(d=>(
                <div key={d} style={{textAlign:'center',fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',padding:'4px 0',fontWeight:600}}>{d}</div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
              {Array((getFirstDay(calMonth)||7)%7).fill(null).map((_,i)=>(
                <div key={'e'+i}/>
              ))}
              {Array(getDaysInMonth(calMonth)).fill(null).map((_,i)=>{
                const day=i+1;
                const occ=getDayOcc(calMonth,day);
                const blkEntry=isBlackout(calMonth,day);
                const c=occColor(occ,blkEntry);
                const isToday=calMonth===9&&day===15;
                return(
                  <div key={day} style={{
                    borderRadius:6, padding:'6px 4px', textAlign:'center', cursor:'pointer',
                    background: blkEntry?'rgba(239,68,68,0.15)':occ>=85?'rgba(6,214,160,0.12)':occ>=70?'rgba(240,180,41,0.12)':'rgba(239,68,68,0.1)',
                    border: isToday?`2px solid ${c}`:`1px solid ${blkEntry?'rgba(239,68,68,0.4)':occ>=85?'rgba(6,214,160,0.25)':'rgba(255,255,255,0.06)'}`,
                    transition:'all .15s',
                    position:'relative'
                  }}>
                    <div style={{fontSize:11,fontWeight:isToday?700:400,color:'var(--text2)',marginBottom:2}}>{day}</div>
                    <div style={{fontSize:10,fontWeight:700,color:c,fontFamily:'var(--mono)'}}>
                      {blkEntry?blkEntry.type==='stop_sale'?'STOP':'KIST':`%${occ}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{marginTop:14,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {[
              {l:'Bu Ay Ort. OCC', v:`%${occByMonth[calMonth]||simOcc}`, c:'var(--teal)'},
              {l:'Yüksek Gün (>%90)', v:`${Array(getDaysInMonth(calMonth)).fill(0).map((_,i)=>getDayOcc(calMonth,i+1)).filter(o=>o>=90).length} gün`, c:'var(--gold)'},
              {l:'Düşük Gün (<%60)', v:`${Array(getDaysInMonth(calMonth)).fill(0).map((_,i)=>getDayOcc(calMonth,i+1)).filter(o=>o<60).length} gün`, c:'#ff6eb4'},
              {l:'Blackout Gün', v:`${blk.filter(b=>b.start.startsWith(`${year}-${String(calMonth+1).padStart(2,'0')}`)).length>0?'Var':'Yok'}`, c:'var(--text2)'},
            ].map((k,i)=>(
              <div key={i} className="kcard" style={{'--kc':k.c,padding:'10px 14px'}}>
                <div className="klbl">{k.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:k.c,fontFamily:'var(--ff)',marginTop:4}}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sec==='upgrade'&&(
        <div>
          <div className="notif nb" style={{marginBottom:14}}>
            <strong>⬆ Upgrade Stratejisi:</strong> Boş odaları doldurmak yerine mevcut rezervasyonları üst kategoriye yükselt — hem müşteri memnuniyeti hem gelir artar.
          </div>
          <div className="panel">
            <div className="ptitle">⬆ Oda Tipi Upgrade Matrisi</div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Mevcut Oda</th><th>Upgrade Tipi</th>
                  <th style={{textAlign:'center'}}>PP Farkı</th>
                  <th style={{textAlign:'center'}}>Boş Oda</th>
                  <th style={{textAlign:'center'}}>Kabul Oranı</th>
                  <th style={{textAlign:'center'}}>Pot. Ek Gelir/Gün</th>
                  <th style={{textAlign:'center'}}>Strateji</th>
                </tr>
              </thead>
              <tbody>
                {upgradeData.map((r,i)=>{
                  const accept=r.fark<=30?0.7:r.fark<=60?0.5:r.fark<=100?0.3:0.15;
                  const strategy=r.fark<=20?'🎁 Ücretsiz Upgrade':r.fark<=50?'💰 İndirimli Teklif':'⭐ Prestij Teklifi';
                  return(
                    <tr key={i}>
                      <td style={{fontWeight:600}}>{r.from}</td>
                      <td><span style={{color:'var(--teal)',fontWeight:600}}>→ {r.to}</span></td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)'}}>+€{r.fark} PP</td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',color:'var(--text2)'}}>{r.mevcut}</td>
                      <td style={{textAlign:'center'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                          <div style={{width:40,height:4,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
                            <div style={{width:`${accept*100}%`,height:'100%',background:'var(--teal)',borderRadius:2}}/>
                          </div>
                          <span style={{fontFamily:'var(--mono)',fontSize:11}}>%{Math.round(accept*100)}</span>
                        </div>
                      </td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',fontWeight:700,color:'var(--teal)'}}>
                        €{Math.round(r.mevcut*accept*r.fark).toLocaleString('tr-TR')}
                      </td>
                      <td style={{fontSize:11,fontWeight:600}}>{strategy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{marginTop:14,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[
                {l:'Günlük Upgrade Potansiyeli', v:`€${Math.round(upgradeData.reduce((s,r)=>{const a=r.fark<=30?0.7:r.fark<=60?0.5:r.fark<=100?0.3:0.15;return s+r.mevcut*a*r.fark;},0)).toLocaleString('tr-TR')}`, c:'var(--teal)'},
                {l:'Aylık Potansiyel', v:`€${Math.round(upgradeData.reduce((s,r)=>{const a=r.fark<=30?0.7:r.fark<=60?0.5:r.fark<=100?0.3:0.15;return s+r.mevcut*a*r.fark;},0)*30/1000).toLocaleString('tr-TR')}K`, c:'var(--gold)'},
                {l:'En Karlı Upgrade', v:'Standart → Superior', c:'var(--blue)'},
              ].map((k,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px'}}>
                  <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:6}}>{k.l}</div>
                  <div style={{fontSize:16,fontWeight:700,color:k.c}}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {sec==='blackout'&&(
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div className="notif nb" style={{flex:1,marginRight:12}}>
              <strong>🚫 Stop Sale</strong> = satış tamamen durdurulur &nbsp;|&nbsp;
              <strong>⚡ Kısıtlama</strong> = min stay veya kanal kısıtlaması uygulanır
            </div>
            {user.p.editor&&(
              <button className="btn bp" style={{whiteSpace:'nowrap',padding:'8px 16px',fontSize:12}} onClick={()=>setBlkModal(true)}>
                + Kural Ekle
              </button>
            )}
          </div>

          {blk.length===0?(
            <div className="panel" style={{textAlign:'center',padding:'48px 24px',color:'var(--text3)'}}>
              <div style={{fontSize:36,marginBottom:12}}>📅</div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Kayıtlı kural yok</div>
              <div style={{fontSize:12}}>Yüksek sezon dönemlerine stop sale veya kısıtlama ekleyin.</div>
            </div>
          ):(
            <div className="panel">
              <div className="ptitle">🚫 Aktif Kurallar</div>
              <table className="tbl">
                <thead><tr><th>Başlangıç</th><th>Bitiş</th><th>Tür</th><th>Sebep</th><th>Süre</th>{user.p.editor&&<th></th>}</tr></thead>
                <tbody>
                  {blk.map((b,i)=>{
                    const start=new Date(b.start), end=new Date(b.end);
                    const days=Math.round((end-start)/(1000*60*60*24))+1;
                    return(
                      <tr key={b.id||i}>
                        <td style={{fontFamily:'var(--mono)',fontWeight:600}}>{b.start}</td>
                        <td style={{fontFamily:'var(--mono)'}}>{b.end}</td>
                        <td><span className={`badge ${b.type==='stop_sale'?'br2':'by2'}`}>
                          {b.type==='stop_sale'?'🚫 Stop Sale':'⚡ Kısıtlama'}
                        </span></td>
                        <td style={{color:'var(--text2)',fontSize:12}}>{b.reason||'—'}</td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>{days} gün</td>
                        {user.p.editor&&<td>
                          <button onClick={()=>removeBlackout(b.id||i)} style={{background:'none',border:'1px solid rgba(247,37,133,0.25)',borderRadius:6,color:'#ff6eb4',cursor:'pointer',padding:'3px 8px',fontSize:11}}>✕</button>
                        </td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {blkModal&&(
            <div className="overlay" onClick={()=>setBlkModal(false)}>
              <div className="modal" style={{width:420}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setBlkModal(false)} style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text2)',cursor:'pointer',padding:'3px 8px',fontSize:13}}>✕</button>
                <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,marginBottom:20}}>+ Yeni Kural</div>
                <div className="mg">
                  <label className="lbl">Tür</label>
                  <select className="inp" value={blkForm.type} onChange={e=>setBlkForm(f=>({...f,type:e.target.value}))}>
                    <option value="stop_sale">🚫 Stop Sale — Satışı Durdur</option>
                    <option value="restriction">⚡ Kısıtlama — Min Stay / Kanal</option>
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div className="mg">
                    <label className="lbl">Başlangıç</label>
                    <input type="date" className="inp" value={blkForm.start} onChange={e=>setBlkForm(f=>({...f,start:e.target.value}))}/>
                  </div>
                  <div className="mg">
                    <label className="lbl">Bitiş</label>
                    <input type="date" className="inp" value={blkForm.end} onChange={e=>setBlkForm(f=>({...f,end:e.target.value}))}/>
                  </div>
                </div>
                <div className="mg">
                  <label className="lbl">Sebep / Not</label>
                  <input className="inp" value={blkForm.reason} onChange={e=>setBlkForm(f=>({...f,reason:e.target.value}))} placeholder="örn: Özel etkinlik, yüksek talep..."/>
                </div>
                <button className="btn bp bfull" style={{marginTop:8}} onClick={saveBlackout}
                  disabled={!blkForm.start||!blkForm.end}>
                  💾 Kaydet
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default Operasyonel;
