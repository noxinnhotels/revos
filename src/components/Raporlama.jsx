import React, { useState } from 'react';
import { fmt, fmtK } from '../utils/format';
import { MS, MF } from '../data/constants';

function Raporlama({user, monthly, ac, simOcc, simAdr}){
  const [sec,setSec] = useState('aylik');
  const [donem1,setDonem1] = useState({start:0,end:5});   // Oca-Haz
  const [donem2,setDonem2] = useState({start:6,end:8});   // Tem-Eyl
  const [exportMsg,setExportMsg] = useState('');
  const [pdfPreview,setPdfPreview] = useState(false);

  // ── HESAPLAMALAR ──
  const hT = monthly.reduce((a,b)=>a+b.h,0);
  const gT = monthly.filter(m=>m.g!=null).reduce((a,b)=>a+b.g,0);
  const pyT = monthly.reduce((a,b)=>a+(b.py||0),0);
  const pct = (gT/hT*100).toFixed(1);
  const yoy = pyT>0?((gT-monthly.filter(m=>m.g!=null).reduce((a,b)=>a+(b.py||0),0))/
               monthly.filter(m=>m.g!=null).reduce((a,b)=>a+(b.py||0),0)*100).toFixed(1):null;
  const avgOcc = monthly.filter(m=>m.o!=null).reduce((a,b)=>a+(b.o||0),0)/
                 Math.max(monthly.filter(m=>m.o!=null).length,1);
  const avgPP = monthly.filter(m=>m.a!=null).reduce((a,b)=>a+(b.a||0),0)/
                Math.max(monthly.filter(m=>m.a!=null).length,1);
  const acTopCiro = [...ac].sort((a,b)=>b.ciro-a.ciro);
  const totalAcCiro = ac.reduce((s,a)=>s+a.ciro,0);
  const totalAcHedef = ac.reduce((s,a)=>s+a.hedef,0);
  const today = new Date().toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric'});
  const rapTarih = new Date().toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'});

  // Dönem karşılaştırma hesapla
  const donemStat = (d) => {
    const aylar = monthly.slice(d.start, d.end+1);
    return {
      ciro: aylar.filter(m=>m.g).reduce((s,m)=>s+m.g,0),
      hedef: aylar.reduce((s,m)=>s+m.h,0),
      py: aylar.reduce((s,m)=>s+(m.py||0),0),
      occ: aylar.filter(m=>m.o).reduce((s,m)=>s+(m.o||0),0)/Math.max(aylar.filter(m=>m.o).length,1),
      pp: aylar.filter(m=>m.a).reduce((s,m)=>s+(m.a||0),0)/Math.max(aylar.filter(m=>m.a).length,1),
      aylar,
    };
  };
  const d1 = donemStat(donem1);
  const d2 = donemStat(donem2);

  // ── CSV EXPORT ──
  const exportCSV = (type) => {
    let csv = '';
    if(type==='aylik'){
      csv = 'Ay,Hedef (€),Gerceklesen (€),Onceki Yil (€),OCC %,PP €,Hedef %,YoY %\n';
      monthly.forEach(m=>{
        const pct = m.g&&m.h?(m.g/m.h*100).toFixed(1):'';
        const yoy = m.g&&m.py?((m.g-m.py)/m.py*100).toFixed(1):'';
        csv += `${m.m},${m.h},${m.g||''},${m.py||''},${m.o||''},${m.a||''},${pct},${yoy}\n`;
      });
    } else if(type==='acente'){
      csv = 'Acente,Tip,Ciro (€),Hedef (€),Hedef %,Komisyon %,Net Ciro (€),Kontrat PP,EB Fiyat\n';
      ac.forEach(a=>{
        const p = (a.ciro/a.hedef*100).toFixed(1);
        const net = Math.round(a.ciro*(1-a.kom/100));
        csv += `${a.ad},${a.tip},${a.ciro},${a.hedef},${p},${a.kom},${net},${a.kontrat||''},${a.eb||''}\n`;
      });
    } else if(type==='ozet'){
      csv = 'Metrik,Deger\n';
      csv += `Yillik Hedef,${hT}\n`;
      csv += `Gerceklesen Ciro,${gT}\n`;
      csv += `Hedef Yuzde,${pct}%\n`;
      csv += `YoY Buyume,${yoy?yoy+'%':'N/A'}\n`;
      csv += `Ort OCC,${avgOcc.toFixed(1)}%\n`;
      csv += `Ort PP,${avgPP.toFixed(0)} EUR\n`;
      csv += `Toplam Acente Ciro,${totalAcCiro}\n`;
      csv += `Acente Hedef Basari,${(totalAcCiro/totalAcHedef*100).toFixed(1)}%\n`;
    }
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a2 = document.createElement('a');
    a2.href=url; a2.download=`RevenueOS_${type}_${rapTarih.replace(/\./g,'-')}.csv`;
    a2.click(); URL.revokeObjectURL(url);
    setExportMsg('✅ CSV indirildi!');
    setTimeout(()=>setExportMsg(''),3000);
  };

  // ── PDF PRINT ──
  const printReport = (title) => {
    const printContent = document.getElementById('print-area');
    if(!printContent) return;
    const w = window.open('','_blank','width=900,height=700');
    w.document.write(`
      <html><head><title>${title}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:32px;}
        h1{font-size:22px;font-weight:800;color:#0f172a;margin-bottom:4px;}
        h2{font-size:14px;font-weight:700;color:#334155;margin:20px 0 8px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;}
        .meta{font-size:11px;color:#64748b;margin-bottom:24px;}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px;}
        th{background:#f1f5f9;padding:8px 10px;text-align:left;font-weight:600;color:#475569;border:1px solid #e2e8f0;}
        td{padding:7px 10px;border:1px solid #e2e8f0;color:#1e293b;}
        tr:nth-child(even) td{background:#f8fafc;}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
        .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;}
        .kpi-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
        .kpi-val{font-size:20px;font-weight:800;color:#0f172a;}
        .kpi-sub{font-size:11px;color:#64748b;margin-top:2px;}
        .good{color:#059669;} .bad{color:#dc2626;} .warn{color:#d97706;}
        .footer{margin-top:32px;border-top:1px solid #e2e8f0;padding-top:12px;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between;}
        @media print{body{padding:16px;} @page{margin:1.5cm;}}
      </style></head><body>
      ${printContent.innerHTML}
      <div class="footer"><span>RevenueOS • ${today}</span><span>Gizli — Yalnızca Yönetim</span></div>
      </body></html>
    `);
    w.document.close();
    setTimeout(()=>{ w.focus(); w.print(); },400);
  };

  // Ortak print butonu
  const PrintBtn = ({title}) => (
    <button className="btn bg" style={{fontSize:11,padding:'5px 14px',display:'flex',alignItems:'center',gap:5}}
      onClick={()=>printReport(title)}>
      🖨 Yazdır / PDF
    </button>
  );

  // Ortak kpi kutusu
  const KPI = ({l,v,sub,c}) => (
    <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px'}}>
      <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>{l}</div>
      <div style={{fontSize:20,fontWeight:800,color:c||'var(--text)',fontFamily:'var(--ff)'}}>{v}</div>
      {sub&&<div style={{fontSize:11,color:'var(--text2)',marginTop:3}}>{sub}</div>}
    </div>
  );

  return(
    <div>
      {/* Sekme bar */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        {[
          ['aylik',   '📄 Aylık Yönetim Raporu'],
          ['donem',   '📊 Dönem Karşılaştırma'],
          ['acente',  '🏢 Acente Performans'],
          ['export',  '📥 Dışa Aktar'],
        ].map(([k,l])=>(
          <button key={k} className={`btn ${sec===k?'bp':'bg'}`} style={{fontSize:12,padding:'7px 18px'}}
            onClick={()=>setSec(k)}>{l}</button>
        ))}
        {exportMsg&&<span style={{fontSize:12,color:'var(--teal)',fontFamily:'var(--mono)',fontWeight:600,marginLeft:8}}>{exportMsg}</span>}
      </div>

      {/* ── AYLIK YÖNETİM RAPORU ── */}
      {sec==='aylik'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div>
              <div style={{fontFamily:'var(--ff)',fontSize:18,fontWeight:800}}>Aylık Yönetim Raporu</div>
              <div style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:2}}>{today} tarihli • Gizli</div>
            </div>
            <PrintBtn title="RevenueOS — Aylik Yonetim Raporu"/>
          </div>

          <div id="print-area">
            {/* Print header */}
            <div style={{display:'none'}} className="print-header">
              <h1>RevenueOS — Aylık Yönetim Raporu</h1>
              <p className="meta">{today} • Hazırlayan: RevenueOS Sistemi</p>
            </div>

            {/* KPI özet */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
              <KPI l="Yıllık Hedef" v={`€${(hT/1e6).toFixed(2)}M`} sub="2024 toplam" c="var(--text)"/>
              <KPI l="Gerçekleşen" v={`€${(gT/1e6).toFixed(2)}M`} sub={`%${pct} hedefe`} c={+pct>=85?'var(--teal)':'#ff6eb4'}/>
              <KPI l="YoY Büyüme" v={yoy?(+yoy>=0?'+':'')+yoy+'%':'—'} sub="Aynı dönem geçen yıl" c={yoy&&+yoy>=0?'var(--teal)':'#ff6eb4'}/>
              <KPI l="Kalan Hedef" v={`€${((hT-gT)/1e6).toFixed(2)}M`} sub={`${monthly.filter(m=>!m.g).length} ayda`} c="var(--gold)"/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
              <KPI l="Ort. OCC" v={`%${avgOcc.toFixed(1)}`} sub="Gerçekleşen aylar" c="var(--blue)"/>
              <KPI l="Ort. PP" v={`€${avgPP.toFixed(0)}`} sub="Kişi başı/gece" c="var(--gold)"/>
              <KPI l="Toplam Acente" v={`€${(totalAcCiro/1e6).toFixed(2)}M`} sub={`%${(totalAcCiro/totalAcHedef*100).toFixed(0)} hedef`} c="var(--text2)"/>
              <KPI l="En İyi Acente" v={acTopCiro[0]?.ad||'—'} sub={`€${((acTopCiro[0]?.ciro||0)/1e6).toFixed(2)}M`} c="var(--teal)"/>
            </div>

            {/* Aylık tablo */}
            <div className="panel" style={{marginBottom:16}}>
              <div className="ptitle">📅 Aylık Kırılım</div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Ay</th><th>Hedef €</th><th>Gerçekleşen €</th>
                    <th>Geçen Yıl €</th><th>OCC %</th><th>PP €</th>
                    <th>Hedef %</th><th>YoY %</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m,i)=>{
                    const p = m.g&&m.h?(m.g/m.h*100):null;
                    const y = m.g&&m.py?((m.g-m.py)/m.py*100):null;
                    return(
                      <tr key={i}>
                        <td style={{fontWeight:700}}>{m.m}</td>
                        <td style={{fontFamily:'var(--mono)'}}>{(m.h/1000).toFixed(0)}K</td>
                        <td style={{fontFamily:'var(--mono)',fontWeight:m.g?700:400,color:m.g?'var(--teal)':'var(--text3)'}}>
                          {m.g?(m.g/1000).toFixed(0)+'K':'—'}
                        </td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>{m.py?(m.py/1000).toFixed(0)+'K':'—'}</td>
                        <td style={{fontFamily:'var(--mono)'}}>{m.o?`%${m.o}`:'—'}</td>
                        <td style={{fontFamily:'var(--mono)'}}>{m.a?`€${m.a}`:'—'}</td>
                        <td>
                          {p!=null&&<span style={{fontFamily:'var(--mono)',fontWeight:700,
                            color:p>=100?'var(--teal)':p>=85?'var(--gold)':'#ff6eb4'}}>%{p.toFixed(0)}</span>}
                        </td>
                        <td>
                          {y!=null&&<span style={{fontFamily:'var(--mono)',fontWeight:700,
                            color:y>=0?'var(--teal)':'#ff6eb4'}}>{y>=0?'+':''}{y.toFixed(1)}%</span>}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{fontWeight:700,background:'rgba(255,255,255,0.04)'}}>
                    <td>TOPLAM</td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--gold)'}}>{(hT/1000).toFixed(0)}K</td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--teal)'}}>{(gT/1000).toFixed(0)}K</td>
                    <td style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>{(pyT/1000).toFixed(0)}K</td>
                    <td style={{fontFamily:'var(--mono)'}}>%{avgOcc.toFixed(1)}</td>
                    <td style={{fontFamily:'var(--mono)'}}>€{avgPP.toFixed(0)}</td>
                    <td style={{fontFamily:'var(--mono)',color:+pct>=85?'var(--teal)':'#ff6eb4'}}>%{pct}</td>
                    <td style={{fontFamily:'var(--mono)',color:yoy&&+yoy>=0?'var(--teal)':'#ff6eb4'}}>{yoy?(+yoy>=0?'+':'')+yoy+'%':'—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Acente özet */}
            <div className="panel">
              <div className="ptitle">🏢 Acente Kanalları Özet</div>
              <table className="tbl">
                <thead><tr><th>Acente</th><th>Tip</th><th>Ciro €</th><th>Hedef €</th><th>Hedef %</th><th>Kom %</th><th>Net Ciro €</th></tr></thead>
                <tbody>
                  {acTopCiro.map((a,i)=>{
                    const p=(a.ciro/a.hedef*100);
                    const net=Math.round(a.ciro*(1-a.kom/100));
                    return(
                      <tr key={i}>
                        <td style={{fontWeight:600}}>{a.ad}</td>
                        <td><span className={`badge ${a.tip==='OTA'?'bb2':a.tip==='Direkt'?'bg2':'by2'}`}>{a.tip}</span></td>
                        <td style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--teal)'}}>{(a.ciro/1000).toFixed(0)}K</td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{(a.hedef/1000).toFixed(0)}K</td>
                        <td><span style={{fontFamily:'var(--mono)',fontWeight:700,color:p>=100?'var(--teal)':p>=80?'var(--gold)':'#ff6eb4'}}>%{p.toFixed(0)}</span></td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>%{a.kom}</td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--gold)'}}>{(net/1000).toFixed(0)}K</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── DÖNEM KARŞILAŞTIRMA ── */}
      {sec==='donem'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontFamily:'var(--ff)',fontSize:18,fontWeight:800}}>Dönem Karşılaştırma</div>
            <PrintBtn title="RevenueOS — Donem Karsilastirma"/>
          </div>

          {/* Dönem seçici */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
            {[
              {label:'Dönem A', d:donem1, setD:setDonem1, c:'var(--teal)'},
              {label:'Dönem B', d:donem2, setD:setDonem2, c:'var(--gold)'},
            ].map(({label,d,setD,c},idx)=>(
              <div key={idx} className="panel" style={{borderLeft:`3px solid ${c}`}}>
                <div style={{fontSize:13,fontWeight:700,color:c,marginBottom:10}}>{label}: {MS[d.start]} — {MS[d.end]}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div>
                    <label className="lbl">Başlangıç</label>
                    <select className="inp" value={d.start} onChange={e=>setD(p=>({...p,start:+e.target.value}))}>
                      {MS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="lbl">Bitiş</label>
                    <select className="inp" value={d.end} onChange={e=>setD(p=>({...p,end:+e.target.value}))}>
                      {MS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Karşılaştırma tablosu */}
          <div id="print-area">
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
              {[
                {l:'Dönem A Ciro', v:`€${(d1.ciro/1e6).toFixed(2)}M`, sub:`${MS[donem1.start]}–${MS[donem1.end]}`, c:'var(--teal)'},
                {l:'Dönem B Ciro', v:`€${(d2.ciro/1e6).toFixed(2)}M`, sub:`${MS[donem2.start]}–${MS[donem2.end]}`, c:'var(--gold)'},
                {l:'Fark (A–B)', v:`${d1.ciro>d2.ciro?'+':''}€${((d1.ciro-d2.ciro)/1e6).toFixed(2)}M`,
                  sub:d1.ciro>=d2.ciro?'A dönemi daha güçlü':'B dönemi daha güçlü',
                  c:d1.ciro>=d2.ciro?'var(--teal)':'#ff6eb4'},
              ].map((k,i)=><KPI key={i} {...k}/>)}
            </div>

            <div className="panel">
              <div className="ptitle">📊 Metrik Karşılaştırması</div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Metrik</th>
                    <th style={{color:'var(--teal)'}}>Dönem A ({MS[donem1.start]}–{MS[donem1.end]})</th>
                    <th style={{color:'var(--gold)'}}>Dönem B ({MS[donem2.start]}–{MS[donem2.end]})</th>
                    <th>Fark</th>
                    <th>Kazanan</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {l:'Toplam Ciro', a:d1.ciro, b:d2.ciro, fmt:v=>`€${(v/1e6).toFixed(2)}M`, higher:true},
                    {l:'Hedef', a:d1.hedef, b:d2.hedef, fmt:v=>`€${(v/1e6).toFixed(2)}M`, higher:true},
                    {l:'Hedef %', a:d1.hedef?d1.ciro/d1.hedef*100:0, b:d2.hedef?d2.ciro/d2.hedef*100:0, fmt:v=>`%${v.toFixed(1)}`, higher:true},
                    {l:'Geçen Yıl', a:d1.py, b:d2.py, fmt:v=>`€${(v/1e6).toFixed(2)}M`, higher:true},
                    {l:'YoY %', a:d1.py?((d1.ciro-d1.py)/d1.py*100):null, b:d2.py?((d2.ciro-d2.py)/d2.py*100):null, fmt:v=>`${v>=0?'+':''}${v.toFixed(1)}%`, higher:true},
                    {l:'Ort. OCC', a:d1.occ, b:d2.occ, fmt:v=>`%${v.toFixed(1)}`, higher:true},
                    {l:'Ort. PP', a:d1.pp, b:d2.pp, fmt:v=>`€${v.toFixed(0)}`, higher:true},
                  ].map((r,i)=>{
                    if(r.a==null||r.b==null) return null;
                    const diff = r.a-r.b;
                    const pctDiff = r.b!==0?(diff/Math.abs(r.b)*100).toFixed(1):null;
                    const aWins = r.higher?r.a>=r.b:r.a<=r.b;
                    return(
                      <tr key={i}>
                        <td style={{fontWeight:600}}>{r.l}</td>
                        <td style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--teal)'}}>{r.fmt(r.a)}</td>
                        <td style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)'}}>{r.fmt(r.b)}</td>
                        <td style={{fontFamily:'var(--mono)',color:diff>=0?'var(--teal)':'#ff6eb4',fontWeight:600}}>
                          {diff>=0?'+':''}{r.fmt(diff)}
                          {pctDiff&&<span style={{fontSize:10,marginLeft:5,opacity:0.7}}>({diff>=0?'+':''}{pctDiff}%)</span>}
                        </td>
                        <td>
                          <span style={{fontSize:12,fontWeight:700,color:aWins?'var(--teal)':'var(--gold)'}}>
                            {aWins?`✓ Dönem A`:`✓ Dönem B`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Ay bazlı detay */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:14}}>
              {[
                {d:donem1, label:'Dönem A', c:'var(--teal)'},
                {d:donem2, label:'Dönem B', c:'var(--gold)'},
              ].map(({d,label,c},idx)=>(
                <div key={idx} className="panel">
                  <div className="ptitle" style={{color:c}}>{label} — Ay Detayı</div>
                  <table className="tbl" style={{fontSize:11}}>
                    <thead><tr><th>Ay</th><th>Ciro</th><th>Hedef %</th><th>OCC</th></tr></thead>
                    <tbody>
                      {d.aylar.map((m,i)=>{
                        const p=m.g&&m.h?(m.g/m.h*100):null;
                        return(
                          <tr key={i}>
                            <td style={{fontWeight:600}}>{m.m}</td>
                            <td style={{fontFamily:'var(--mono)',color:m.g?c:'var(--text3)'}}>{m.g?(m.g/1000).toFixed(0)+'K':'Bekl.'}</td>
                            <td style={{fontFamily:'var(--mono)',fontSize:10,color:p>=100?'var(--teal)':p>=85?'var(--gold)':'#ff6eb4'}}>{p?`%${p.toFixed(0)}`:'—'}</td>
                            <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{m.o?`%${m.o}`:'—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ACENTE PERFORMANS RAPORU ── */}
      {sec==='acente'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontFamily:'var(--ff)',fontSize:18,fontWeight:800}}>Acente Performans Raporu</div>
            <PrintBtn title="RevenueOS — Acente Performans Raporu"/>
          </div>
          <div id="print-area">
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
              <KPI l="Toplam Acente Ciro" v={`€${(totalAcCiro/1e6).toFixed(2)}M`} sub={`${ac.length} acente`} c="var(--teal)"/>
              <KPI l="Toplam Hedef" v={`€${(totalAcHedef/1e6).toFixed(2)}M`} sub={`%${(totalAcCiro/totalAcHedef*100).toFixed(0)} gerçekleşti`} c="var(--gold)"/>
              <KPI l="Ort. Komisyon" v={`%${(ac.reduce((s,a)=>s+a.kom,0)/ac.length).toFixed(1)}`} sub="Ağırlıksız ortalama" c="var(--text2)"/>
              <KPI l="Net Toplam Ciro" v={`€${(ac.reduce((s,a)=>s+Math.round(a.ciro*(1-a.kom/100)),0)/1e6).toFixed(2)}M`} sub="Komisyon sonrası" c="var(--blue)"/>
            </div>
            <div className="panel" style={{marginBottom:14}}>
              <div className="ptitle">🏢 Acente Detay</div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th><th>Acente</th><th>Tip</th><th>Ciro €</th>
                    <th>Hedef €</th><th>Hedef %</th><th>Kom %</th>
                    <th>Net Ciro €</th><th>Kontrat PP</th><th>EB PP</th><th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {acTopCiro.map((a,i)=>{
                    const p=(a.ciro/a.hedef*100);
                    const net=Math.round(a.ciro*(1-a.kom/100));
                    const d=p>=100?'iyi':p>=80?'geride':'kritik';
                    return(
                      <tr key={i}>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text3)',fontWeight:700}}>{i+1}</td>
                        <td style={{fontWeight:700}}>{a.ad}</td>
                        <td><span className={`badge ${a.tip==='OTA'?'bb2':a.tip==='Direkt'?'bg2':'by2'}`}>{a.tip}</span></td>
                        <td style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--teal)'}}>{(a.ciro/1000).toFixed(0)}K</td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{(a.hedef/1000).toFixed(0)}K</td>
                        <td><span style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:12,color:p>=100?'var(--teal)':p>=80?'var(--gold)':'#ff6eb4'}}>%{p.toFixed(0)}</span></td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>%{a.kom}</td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--gold)',fontWeight:600}}>{(net/1000).toFixed(0)}K</td>
                        <td style={{fontFamily:'var(--mono)',color:'#4cc9f0'}}>{a.kontrat?`€${a.kontrat}`:'OTA'}</td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{a.eb?`€${a.eb}`:'—'}</td>
                        <td><span className={`badge ${d==='iyi'?'bg2':d==='geride'?'by2':'br2'}`}>{d==='iyi'?'✓ İyi':d==='geride'?'⚡ Geride':'🚨 Kritik'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Aylık kırılım - en iyi 3 */}
            <div className="panel">
              <div className="ptitle">📅 Top 3 Acente Aylık Kırılım</div>
              <table className="tbl" style={{fontSize:11}}>
                <thead>
                  <tr>
                    <th>Ay</th>
                    {acTopCiro.slice(0,3).map(a=><th key={a.id} style={{color:'var(--teal)'}}>{a.ad}</th>)}
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {MS.map((m,i)=>{
                    const top3 = acTopCiro.slice(0,3);
                    const total = top3.reduce((s,a)=>s+(a.ay[i]||0),0);
                    return(
                      <tr key={i}>
                        <td style={{fontWeight:600}}>{m}</td>
                        {top3.map(a=>(
                          <td key={a.id} style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{((a.ay[i]||0)/1000).toFixed(0)}K</td>
                        ))}
                        <td style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)'}}>{(total/1000).toFixed(0)}K</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── DIŞA AKTAR ── */}
      {sec==='export'&&(
        <div>
          <div style={{fontFamily:'var(--ff)',fontSize:18,fontWeight:800,marginBottom:16}}>Dışa Aktar</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {[
              {
                icon:'📅', title:'Aylık Veri CSV',
                desc:'12 aylık ciro, hedef, OCC, PP, YoY verileri.',
                fields:['Ay','Hedef','Gerçekleşen','Önceki Yıl','OCC %','PP €','Hedef %','YoY %'],
                action:()=>exportCSV('aylik'), btnLabel:'İndir (CSV)',
              },
              {
                icon:'🏢', title:'Acente Verileri CSV',
                desc:'Tüm acenteler — ciro, hedef, komisyon, kontrat/EB fiyatları.',
                fields:['Acente','Tip','Ciro','Hedef','Hedef %','Komisyon','Net Ciro','Kontrat PP','EB Fiyat'],
                action:()=>exportCSV('acente'), btnLabel:'İndir (CSV)',
              },
              {
                icon:'📊', title:'Özet Rapor CSV',
                desc:'Temel KPI\'lar tek satırda — dashboard ve sunumlar için.',
                fields:['Metrik','Değer'],
                action:()=>exportCSV('ozet'), btnLabel:'İndir (CSV)',
              },
            ].map((item,i)=>(
              <div key={i} className="panel" style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={{fontSize:28}}>{item.icon}</div>
                <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700}}>{item.title}</div>
                <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.7}}>{item.desc}</div>
                <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:'auto'}}>
                  <div style={{marginBottom:4}}>İçerik:</div>
                  {item.fields.map(f=><span key={f} style={{display:'inline-block',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 7px',marginRight:4,marginBottom:4}}>{f}</span>)}
                </div>
                <button className="btn bp bfull" style={{marginTop:4}} onClick={item.action}>{item.btnLabel}</button>
              </div>
            ))}
          </div>

          <div style={{marginTop:16}} className="panel">
            <div className="ptitle">🖨 PDF Rapor Yazdır</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:4}}>
              {[
                {t:'Aylık Yönetim Raporu', d:'KPI özeti + aylık tablo + acente özeti', action:()=>{setSec('aylik');setTimeout(()=>printReport('Aylik Yonetim Raporu'),200);}},
                {t:'Dönem Karşılaştırma', d:'Seçilen iki dönemin karşılaştırmalı analizi', action:()=>{setSec('donem');setTimeout(()=>printReport('Donem Karsilastirma'),200);}},
                {t:'Acente Performans', d:'Tüm acente detayları + aylık kırılım', action:()=>{setSec('acente');setTimeout(()=>printReport('Acente Performans Raporu'),200);}},
              ].map((r,i)=>(
                <div key={i} style={{padding:'14px',background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:10}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:5}}>{r.t}</div>
                  <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.6,marginBottom:10}}>{r.d}</div>
                  <button className="btn bg bfull" style={{fontSize:11}} onClick={r.action}>🖨 Yazdır / PDF</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Raporlama;
