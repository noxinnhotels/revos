import React, { useState } from 'react';
import { fmt, fmtK } from '../utils/format';
import { SEZON_OCC, MS, MF } from '../data/constants';

function ZekaMerkezi({user, monthly, ac, simOcc, simAdr, setSimAdr, setSimOcc}){
  const [sec,setSec] = useState('fiyat');

  // ── ORTAK HESAPLAR ──
  const hT = monthly.reduce((a,b)=>a+b.h, 0);
  const gT = monthly.filter(m=>m.g!=null).reduce((a,b)=>a+b.g, 0);
  const pct = gT/hT*100;
  const kalan = monthly.filter(m=>m.g==null).length;
  const pyRealT = monthly.filter(m=>m.g!=null).reduce((a,b)=>a+(b.py||0),0);
  const yoy = pyRealT>0?((gT-pyRealT)/pyRealT*100):0;
  const avgOcc = monthly.filter(m=>m.o!=null).reduce((a,b)=>a+(b.o||0),0)/Math.max(monthly.filter(m=>m.o!=null).length,1);
  const totalOda = 280;

  // ── RAKİP FİYAT VERİSİ (simüle OTA scrape) ──
  const rakipler = [
    {ad:'Otel Akdeniz Palace', yildiz:5, mesafe:'0.8km', occ:88,
      fiyatlar:{Booking:195, Expedia:192, HotelsCom:198, Direkt:210},
      puanlar:{Booking:8.6, Expedia:8.4}, doluluk:'Yüksek'},
    {ad:'Grand Antalya Resort', yildiz:5, mesafe:'1.2km', occ:92,
      fiyatlar:{Booking:225, Expedia:220, HotelsCom:228, Direkt:240},
      puanlar:{Booking:9.1, Expedia:8.9}, doluluk:'Çok Yüksek'},
    {ad:'Sunrise Beach Hotel', yildiz:4, mesafe:'0.5km', occ:79,
      fiyatlar:{Booking:168, Expedia:165, HotelsCom:170, Direkt:180},
      puanlar:{Booking:8.2, Expedia:8.0}, doluluk:'Orta'},
    {ad:'Blue Horizon Suites', yildiz:5, mesafe:'2.1km', occ:85,
      fiyatlar:{Booking:208, Expedia:205, HotelsCom:212, Direkt:220},
      puanlar:{Booking:8.8, Expedia:8.7}, doluluk:'Yüksek'},
    {ad:'Coral Bay Resort', yildiz:4, mesafe:'1.8km', occ:71,
      fiyatlar:{Booking:152, Expedia:148, HotelsCom:155, Direkt:165},
      puanlar:{Booking:7.9, Expedia:7.8}, doluluk:'Orta'},
  ];
  const bizimFiyat = simAdr;
  const kanallar = ['Booking','Expedia','HotelsCom','Direkt'];
  const rakipOrt = rakipler.reduce((s,r)=>s+r.fiyatlar.Booking,0)/rakipler.length;
  const pozisyon = bizimFiyat > rakipOrt ? 'Üst Segment' : bizimFiyat > rakipOrt*0.95 ? 'Piyasa Ortası' : 'Alt Segment';
  const fiyatOneri = Math.round(
    rakipOrt * (simOcc>90?1.08 : simOcc>80?1.04 : simOcc>70?1.0 : 0.96)
  );

  // ── ANOMALİ TESPİTİ ──
  const anomaliler = [];
  monthly.forEach((m,i)=>{
    if(!m.g) return;
    // Pick-up anomalisi — beklenen vs gerçekleşen
    const expectedByPY = m.py ? m.py*(1+yoy/100) : m.h*0.9;
    const diff = (m.g - expectedByPY)/expectedByPY*100;
    if(diff < -15) anomaliler.push({
      sev:'kritik', ay:m.m, tip:'Ciro Düşüşü',
      msg:`Beklenenin %${Math.abs(diff).toFixed(0)} altında. (Beklenen: €${(expectedByPY/1000).toFixed(0)}K, Gerçek: €${(m.g/1000).toFixed(0)}K)`,
      oneri:'OTA kampanya fiyatı kontrol edin. Grup rezervasyon iptaline dikkat.',
      icon:'📉'
    });
    else if(diff > 20) anomaliler.push({
      sev:'bilgi', ay:m.m, tip:'Beklenmedik Artış',
      msg:`Beklenenden %${diff.toFixed(0)} yukarıda. (€${(m.g/1000).toFixed(0)}K)`,
      oneri:'Hangi kanal bu artışı sağladı? Başarılı stratejiyi diğer aylara uygulayın.',
      icon:'📈'
    });
    // OCC anomalisi
    if(m.o!=null && m.a!=null){
      const revpar = m.a * m.o/100;
      const expectedRevpar = (simAdr * simOcc/100) * 0.9;
      if(revpar < expectedRevpar*0.75) anomaliler.push({
        sev:'uyari', ay:m.m, tip:'Düşük RevPAR',
        msg:`RevPAR €${revpar.toFixed(0)} — beklenen €${expectedRevpar.toFixed(0)}'in altında.`,
        oneri:'OCC ve PP dengesini gözden geçirin. Upgrade stratejisi aktive edin.',
        icon:'⚠️'
      });
    }
  });
  // Acente anomalileri
  ac.forEach(a=>{
    const ap = a.ciro/a.hedef*100;
    const ayliOrt = a.ay.filter((_,i)=>monthly[i]?.g!=null);
    if(ayliOrt.length>2){
      const son2 = a.ay.filter((_,i)=>monthly[i]?.g!=null).slice(-2);
      const trend = son2[1]<son2[0]*0.85;
      if(trend) anomaliler.push({
        sev:'uyari', ay:'Son 2 Ay', tip:`${a.ad} — Düşen Trend`,
        msg:`Son 2 ayda acente cirosu %${Math.round((1-son2[1]/son2[0])*100)} geriledi.`,
        oneri:'Acente ile ivedi görüşme planlayın. Özel kampanya veya indirim teklif edin.',
        icon:'📊'
      });
    }
  });
  if(anomaliler.length===0) anomaliler.push({
    sev:'bilgi', ay:'Genel', tip:'Sistem Normal',
    msg:'Tespit edilen anomali yok. Tüm metrikler beklenen aralıkta.',
    oneri:'Haftalık pick-up takibine devam edin.',
    icon:'✅'
  });

  // ── HEDEF REVİZYON ASISTANI ──
  const gerceklesenAylar = monthly.filter(m=>m.g!=null).length;
  const kalanAylar = monthly.filter(m=>m.g==null);
  // Ağırlıklı forecast: gerçekleşen büyümeye + sezon faktörüne göre
  const growthRate = yoy/100;
  const forecastKalan = kalanAylar.reduce((s,m)=>{
    const mi = monthly.indexOf(m);
    const sezonFak = (m.py||m.h*0.9) / (monthly.filter(x=>x.py).reduce((a,b)=>a+(b.py||0),0)/12||100000);
    const base = (m.py||m.h*0.92) * (1 + growthRate*0.65);
    return s + Math.round(base*sezonFak);
  },0);
  const projectedTotal = gT + forecastKalan;
  const hedefFarki = projectedTotal - hT;
  const revizeHedef = Math.round(projectedTotal * 0.98); // %2 güvenlik marjı
  const agresifHedef = Math.round(projectedTotal * 1.05);
  const gercekciHedef = Math.round(projectedTotal * 0.95);

  // PP değişikliğinin etkisi
  const ppEtkisi = (delta) => Math.round(delta * totalOda * simOcc/100 * 365 * (kalanAylar.length/12));
  const occEtkisi = (delta) => Math.round(simAdr * (delta/100) * totalOda * 365 * (kalanAylar.length/12));

  // ── HAFTALIK OTOMATİK INSİGHT ──
  const hafta = new Date().toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric'});
  const insights = [];

  // Performans insighti
  if(pct>=90) insights.push({cat:'🏆 Performans',c:'var(--teal)',
    baslik:'Hedef Yolunda — Fiyat Artış Fırsatı',
    detay:`Yıllık hedefe %${pct.toFixed(0)} ulaşıldı. Bu güçlü performans, fiyat artışı için ideal ortam yaratıyor. Rakip ortalama €${rakipOrt.toFixed(0)} iken sizin fiyatınız €${bizimFiyat} — ${bizimFiyat<rakipOrt?'+€'+(rakipOrt-bizimFiyat).toFixed(0)+' artış payı var':'rakip üstünde, pozisyonu koruyun'}.`,
    aksiyon:`PP'yi €${Math.min(bizimFiyat+10, fiyatOneri)} yapın — yıllık ek gelir tahmini €${(ppEtkisi(10)/1000).toFixed(0)}K.`
  });
  else if(pct>=75) insights.push({cat:'⚡ Performans',c:'var(--gold)',
    baslik:'Hedef Geride — Hacim Artışı Gerekli',
    detay:`%${pct.toFixed(0)} gerçekleşme ile hedef ${kalan} ayda kapatılabilir. Aylık €${((hT-gT)/kalan/1000).toFixed(0)}K ek ciro gerekiyor. OTA kanallarında görünürlük artırılmalı.`,
    aksiyon:`Booking.com ve Expediada visibility campaign açın. TO acentelerine erken rezervasyon bonusu teklif edin.`
  });
  else insights.push({cat:'🚨 Performans',c:'#ff6eb4',
    baslik:'Kritik Açık — Acil Aksiyon',
    detay:`%${pct.toFixed(0)} gerçekleşme ile yıl sonu hedefi risk altında. Kalan ${kalan} ayda €${((hT-gT)/1e6).toFixed(2)}M kapatılması gerekiyor.`,
    aksiyon:`Tüm kanal yöneticileriyle acil toplantı. Fiyat revizyonu + kampanya paketi hazırlayın.`
  });

  // Rakip konumu insighti
  const altRakipler = rakipler.filter(r=>r.fiyatlar.Booking < bizimFiyat*0.95).length;
  const ustRakipler = rakipler.filter(r=>r.fiyatlar.Booking > bizimFiyat*1.05).length;
  insights.push({cat:'🏨 Rekabet',c:'var(--blue)',
    baslik:`${pozisyon} Konumunda`,
    detay:`${rakipler.length} rakip arasında ${altRakipler} tanesi sizden ucuz, ${ustRakipler} tanesi daha pahalı. Rakip ortalaması €${rakipOrt.toFixed(0)}, sizin fiyatınız €${bizimFiyat}.`,
    aksiyon: fiyatOneri > bizimFiyat
      ? `Doluluk %${simOcc} ile fiyatınızı €${fiyatOneri}'ye yükseltebilirsiniz (+€${fiyatOneri-bizimFiyat}).`
      : `Mevcut fiyat rekabetçi. Doluluk %${simOcc} — fiyatı koruyun.`
  });

  // Acente insighti
  const kritikAc = ac.filter(a=>a.ciro/a.hedef*100<65);
  if(kritikAc.length>0) insights.push({cat:'🤝 Acente',c:'#a78bfa',
    baslik:`${kritikAc.length} Acente Kritik Seviyede`,
    detay:`${kritikAc.map(a=>a.ad).join(', ')} hedeflerinin %65 altında. Toplam risk: €${(kritikAc.reduce((s,a)=>s+(a.hedef-a.ciro),0)/1000).toFixed(0)}K açık.`,
    aksiyon:`Bu acentelere bu hafta içinde +%3 komisyon veya erken rezervasyon bonusu teklif edin.`
  });

  // PP insighti
  const ppTrend = monthly.filter(m=>m.a!=null).slice(-3);
  if(ppTrend.length>=2){
    const ppDeg = ppTrend[ppTrend.length-1].a - ppTrend[0].a;
    insights.push({cat:'💰 Fiyat',c:'var(--gold)',
      baslik:ppDeg>=0?'PP Artış Trendinde':'PP Düşüş Sinyali',
      detay:`Son 3 ayda ort. PP: €${ppTrend.map(m=>m.a).join(' → ')}. ${ppDeg>=0?`+€${ppDeg} artış iyi gidiyor.`:`-€${Math.abs(ppDeg)} düşüş var, sebep analiz edilmeli.`}`,
      aksiyon:ppDeg>=0?`Upgrade oranını artırın, PP momentumunu koruyun.`:`Kanal karması gözden geçirilmeli — TO/Direkt oranı kontrol edin.`
    });
  }

  const sevColor = s => s==='kritik'?'#ff6eb4':s==='uyari'?'var(--gold)':'var(--teal)';
  const sevBg = s => s==='kritik'?'rgba(247,37,133,0.06)':s==='uyari'?'rgba(240,180,41,0.06)':'rgba(6,214,160,0.05)';
  const sevBorder = s => s==='kritik'?'rgba(247,37,133,0.25)':s==='uyari'?'rgba(240,180,41,0.25)':'rgba(6,214,160,0.2)';

  return(
    <div>
      {/* Sekme bar */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[
          ['fiyat',   '💰 Rakip Fiyat Analizi'],
          ['anomali', '🔍 Anomali Tespiti'],
          ['revizyon','🎯 Hedef Revizyon'],
          ['insight', '💡 Haftalık Insight'],
        ].map(([k,l])=>(
          <button key={k} className={`btn ${sec===k?'bp':'bg'}`} style={{fontSize:12,padding:'7px 18px'}}
            onClick={()=>setSec(k)}>{l}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          RAKİP FİYAT ANALİZİ
      ══════════════════════════════════════ */}
      {sec==='fiyat'&&(
        <div>
          {/* Özet bar */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
            {[
              {l:'Bizim PP', v:`€${bizimFiyat}`, sub:'Mevcut simülasyon', c:'var(--gold)'},
              {l:'Rakip Ortalama', v:`€${rakipOrt.toFixed(0)}`, sub:`${rakipler.length} rakip`, c:'var(--blue)'},
              {l:'Fark', v:`${bizimFiyat>=rakipOrt?'+':''}€${(bizimFiyat-rakipOrt).toFixed(0)}`,
                sub:pozisyon, c:bizimFiyat>=rakipOrt?'var(--teal)':'#ff6eb4'},
              {l:'Önerilen PP', v:`€${fiyatOneri}`,
                sub:`OCC %${simOcc} bazında`, c:'#a78bfa'},
            ].map((k,i)=>(
              <div key={i} className="kcard" style={{'--kc':k.c,padding:'12px 14px'}}>
                <div className="klbl">{k.l}</div>
                <div style={{fontSize:20,fontWeight:800,color:k.c,fontFamily:'var(--ff)',margin:'6px 0'}}>{k.v}</div>
                <div style={{fontSize:10,color:'var(--text2)'}}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Fiyat öneri kutusu */}
          <div style={{padding:'14px 18px',marginBottom:16,borderRadius:12,
            background: fiyatOneri>bizimFiyat?'rgba(6,214,160,0.07)':'rgba(240,180,41,0.07)',
            border:`1px solid ${fiyatOneri>bizimFiyat?'rgba(6,214,160,0.3)':'rgba(240,180,41,0.3)'}`,
            display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:4,color:fiyatOneri>bizimFiyat?'var(--teal)':'var(--gold)'}}>
                {fiyatOneri>bizimFiyat?`⬆ Fiyat Artış Fırsatı: €${bizimFiyat} → €${fiyatOneri}`:`→ Fiyat Dengede: €${bizimFiyat} uygun`}
              </div>
              <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.7}}>
                {simOcc>90?'Doluluk çok yüksek (%90+) — fiyat artışı için ideal ortam.':
                 simOcc>80?'Doluluk yüksek (%80+) — temkinli artış uygulanabilir.':
                 simOcc>70?'Doluluk orta (%70+) — piyasa ortası fiyat uygulayın.':
                 'Doluluk düşük — rekabetçi fiyat ile hacim artırın.'}
                {' '}Tahmini ek gelir: <strong style={{color:'var(--gold)'}}>€{(ppEtkisi(fiyatOneri-bizimFiyat)/1000).toFixed(0)}K</strong> (kalan {kalan} ay)
              </div>
            </div>
            {fiyatOneri!==bizimFiyat&&(
              <button className="btn bp" style={{whiteSpace:'nowrap',padding:'8px 18px'}}
                onClick={()=>setSimAdr(fiyatOneri)}>
                Uygula: €{fiyatOneri}
              </button>
            )}
          </div>

          {/* Rakip tablosu */}
          <div className="panel" style={{marginBottom:14}}>
            <div className="ptitle">🏨 OTA Rakip Fiyat Karşılaştırması</div>
            <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:10}}>
              Kaynak: Booking.com / Expedia / Hotels.com simüle veri • Güncelleme: Bugün 08:00
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Otel</th><th>⭐</th><th>Mesafe</th>
                  <th style={{textAlign:'center',color:'#4cc9f0'}}>Booking</th>
                  <th style={{textAlign:'center',color:'var(--gold)'}}>Expedia</th>
                  <th style={{textAlign:'center',color:'#a78bfa'}}>Hotels.com</th>
                  <th style={{textAlign:'center',color:'var(--teal)'}}>Direkt</th>
                  <th style={{textAlign:'center'}}>Puan</th>
                  <th style={{textAlign:'center'}}>Doluluk</th>
                  <th style={{textAlign:'center'}}>Bizimle Fark</th>
                </tr>
              </thead>
              <tbody>
                {/* Bizim satırımız */}
                <tr style={{background:'rgba(240,180,41,0.08)',borderLeft:'3px solid var(--gold)'}}>
                  <td style={{fontWeight:800,color:'var(--gold)'}}>★ Bizim Otelimiz</td>
                  <td style={{color:'var(--gold)'}}>5⭐</td>
                  <td style={{color:'var(--text3)',fontSize:11}}>—</td>
                  {kanallar.map(k=>(
                    <td key={k} style={{textAlign:'center',fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)'}}>€{bizimFiyat}</td>
                  ))}
                  <td style={{textAlign:'center',fontFamily:'var(--mono)',color:'var(--teal)',fontWeight:700}}>9.2</td>
                  <td style={{textAlign:'center'}}><span className="badge by2">%{simOcc}</span></td>
                  <td style={{textAlign:'center',color:'var(--text3)',fontFamily:'var(--mono)'}}>—</td>
                </tr>
                {rakipler.map((r,i)=>{
                  const bookingFark = bizimFiyat - r.fiyatlar.Booking;
                  const doluBadge = r.doluluk==='Çok Yüksek'?'br2':r.doluluk==='Yüksek'?'by2':'bg2';
                  return(
                    <tr key={i}>
                      <td style={{fontWeight:600}}>{r.ad}</td>
                      <td style={{color:'var(--gold)',fontSize:11}}>{'⭐'.repeat(r.yildiz)}</td>
                      <td style={{color:'var(--text3)',fontSize:11,fontFamily:'var(--mono)'}}>{r.mesafe}</td>
                      {kanallar.map(k=>(
                        <td key={k} style={{textAlign:'center',fontFamily:'var(--mono)',
                          color:bizimFiyat>r.fiyatlar[k]?'#ff6eb4':bizimFiyat<r.fiyatlar[k]?'var(--teal)':'var(--text2)',
                          fontWeight:600}}>
                          €{r.fiyatlar[k]}
                        </td>
                      ))}
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',color:'var(--text2)'}}>{r.puanlar.Booking}</td>
                      <td style={{textAlign:'center'}}><span className={`badge ${doluBadge}`}>{r.doluluk}</span></td>
                      <td style={{textAlign:'center',fontFamily:'var(--mono)',fontWeight:700,
                        color:bookingFark>0?'var(--teal)':bookingFark<0?'#ff6eb4':'var(--text3)'}}>
                        {bookingFark>0?'+':''}{bookingFark}€
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Kanal bazlı öneriler */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {kanallar.map(k=>{
              const kanalOrt = rakipler.reduce((s,r)=>s+r.fiyatlar[k],0)/rakipler.length;
              const fark = bizimFiyat - kanalOrt;
              return(
                <div key={k} className="panel" style={{padding:'12px 14px',borderTop:`3px solid ${fark>=0?'var(--teal)':'#ff6eb4'}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:6}}>{k.toUpperCase()}</div>
                  <div style={{fontSize:18,fontWeight:800,color:fark>=0?'var(--teal)':'#ff6eb4',fontFamily:'var(--ff)',marginBottom:2}}>
                    {fark>=0?'+':''}{fark.toFixed(0)}€
                  </div>
                  <div style={{fontSize:10,color:'var(--text3)'}}>
                    Rakip ort: €{kanalOrt.toFixed(0)}<br/>
                    {fark>15?'Prim konumundasınız':fark>0?'Hafif üstte':'Rakiplerin altında'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          ANOMALİ TESPİTİ
      ══════════════════════════════════════ */}
      {sec==='anomali'&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {[
              {l:'Kritik Anomali', v:anomaliler.filter(a=>a.sev==='kritik').length, c:'#ff6eb4', icon:'🚨'},
              {l:'Uyarı', v:anomaliler.filter(a=>a.sev==='uyari').length, c:'var(--gold)', icon:'⚠️'},
              {l:'Bilgi', v:anomaliler.filter(a=>a.sev==='bilgi').length, c:'var(--teal)', icon:'💡'},
            ].map((k,i)=>(
              <div key={i} className="kcard" style={{'--kc':k.c,padding:'14px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <span style={{fontSize:22}}>{k.icon}</span>
                  <div className="klbl">{k.l}</div>
                </div>
                <div style={{fontSize:28,fontWeight:800,color:k.c,fontFamily:'var(--ff)'}}>{k.v}</div>
              </div>
            ))}
          </div>

          <div style={{marginBottom:10,padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:10,fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)'}}>
            Anomali motoru: YoY karşılaştırma ±15%, RevPAR sapması ±25%, acente trend analizi (son 2 ay) | Son güncelleme: Bugün
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {anomaliler.map((a,i)=>(
              <div key={i} style={{padding:'14px 16px',borderRadius:12,
                background:sevBg(a.sev), border:`1px solid ${sevBorder(a.sev)}`}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <span style={{fontSize:22,flexShrink:0}}>{a.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                      <span style={{fontWeight:700,fontSize:13,color:sevColor(a.sev)}}>{a.tip}</span>
                      <span style={{fontSize:10,fontFamily:'var(--mono)',padding:'2px 8px',
                        borderRadius:20,background:'rgba(255,255,255,0.06)',
                        border:'1px solid rgba(255,255,255,0.1)',color:'var(--text2)'}}>{a.ay}</span>
                      <span style={{fontSize:10,fontFamily:'var(--mono)',padding:'2px 8px',
                        borderRadius:20,fontWeight:700,
                        background:sevBg(a.sev), border:`1px solid ${sevBorder(a.sev)}`,
                        color:sevColor(a.sev)}}>
                        {a.sev.toUpperCase()}
                      </span>
                    </div>
                    <div style={{fontSize:12,color:'var(--text)',lineHeight:1.7,marginBottom:8}}>{a.msg}</div>
                    <div style={{fontSize:11,color:'var(--text2)',padding:'8px 12px',
                      background:'rgba(255,255,255,0.04)',borderRadius:8,borderLeft:`3px solid ${sevColor(a.sev)}`}}>
                      <span style={{fontWeight:700,color:sevColor(a.sev)}}>💡 Öneri: </span>{a.oneri}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          HEDEF REVİZYON ASISTANI
      ══════════════════════════════════════ */}
      {sec==='revizyon'&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
            {[
              {l:'Mevcut Hedef', v:`€${(hT/1e6).toFixed(2)}M`, sub:'Yıllık plan', c:'var(--text2)'},
              {l:'YTD Gerçekleşen', v:`€${(gT/1e6).toFixed(2)}M`, sub:`%${pct.toFixed(0)} tamamlandı`, c:'var(--teal)'},
              {l:'Forecast Kalan', v:`€${(forecastKalan/1e6).toFixed(2)}M`, sub:`${kalan} ay projeksiyon`, c:'var(--blue)'},
              {l:'Yıl Sonu Tahmini', v:`€${(projectedTotal/1e6).toFixed(2)}M`,
                sub:hedefFarki>=0?`+€${(hedefFarki/1e6).toFixed(2)}M hedef üstü`:`-€${(Math.abs(hedefFarki)/1e6).toFixed(2)}M açık`,
                c:hedefFarki>=0?'var(--teal)':'#ff6eb4'},
            ].map((k,i)=>(
              <div key={i} className="kcard" style={{'--kc':k.c,padding:'12px 14px'}}>
                <div className="klbl">{k.l}</div>
                <div style={{fontSize:18,fontWeight:800,color:k.c,fontFamily:'var(--ff)',margin:'6px 0'}}>{k.v}</div>
                <div style={{fontSize:10,color:'var(--text2)'}}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            {/* Senaryo kartları */}
            <div className="panel">
              <div className="ptitle">📋 Revizyon Senaryoları</div>
              {[
                {l:'Gerçekçi Hedef', v:gercekciHedef, oran:gercekciHedef/hT*100, c:'var(--teal)',
                  desc:'Mevcut trend devam ederse ulaşılabilir. %5 güvenlik marjı.'},
                {l:'Mevcut Forecast', v:revizeHedef, oran:revizeHedef/hT*100, c:'var(--gold)',
                  desc:'YoY büyüme oranına göre ağırlıklı projeksiyon.'},
                {l:'Agresif Hedef', v:agresifHedef, oran:agresifHedef/hT*100, c:'#a78bfa',
                  desc:'Tüm aksiyonlar alınırsa ve piyasa koşulları iyi giderse.'},
                {l:'Mevcut Hedef', v:hT, oran:100, c:'var(--text3)',
                  desc:'Yıl başındaki plan.'},
              ].map((s,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',
                  borderBottom:i<3?'1px solid rgba(255,255,255,0.05)':'none'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:s.c,marginBottom:2}}>{s.l}</div>
                    <div style={{fontSize:10,color:'var(--text3)',lineHeight:1.5}}>{s.desc}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:16,fontWeight:800,color:s.c,fontFamily:'var(--ff)'}}>{(s.v/1e6).toFixed(2)}M</div>
                    <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>%{s.oran.toFixed(0)} plan</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Aksiyon simülatörü */}
            <div className="panel">
              <div className="ptitle">🎛 Aksiyon Simülatörü</div>
              <div style={{fontSize:11,color:'var(--text2)',marginBottom:14,lineHeight:1.7}}>
                Kalan <strong style={{color:'var(--teal)'}}>{kalan} ay</strong> için PP veya OCC değişikliğinin yıl sonu etkisini görün.
              </div>
              {[
                {l:'PP +€5 artırılırsa', v:`+€${(ppEtkisi(5)/1000).toFixed(0)}K`, c:'var(--teal)'},
                {l:'PP +€10 artırılırsa', v:`+€${(ppEtkisi(10)/1000).toFixed(0)}K`, c:'var(--teal)'},
                {l:'PP -€5 düşürülürse', v:`-€${(Math.abs(ppEtkisi(-5))/1000).toFixed(0)}K`, c:'#ff6eb4'},
                {l:'OCC +%3 artırılırsa', v:`+€${(occEtkisi(3)/1000).toFixed(0)}K`, c:'var(--gold)'},
                {l:'OCC +%5 artırılırsa', v:`+€${(occEtkisi(5)/1000).toFixed(0)}K`, c:'var(--gold)'},
                {l:'OCC -%3 düşerse', v:`-€${(Math.abs(occEtkisi(-3))/1000).toFixed(0)}K`, c:'#ff6eb4'},
              ].map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'7px 10px',borderRadius:8,marginBottom:4,
                  background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)'}}>
                  <span style={{fontSize:11,color:'var(--text2)'}}>{r.l}</span>
                  <span style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:12,color:r.c}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aylık forecast tablosu */}
          <div className="panel">
            <div className="ptitle">📅 Kalan Ay Forecast</div>
            <table className="tbl">
              <thead>
                <tr><th>Ay</th><th>Hedef €</th><th>Forecast €</th><th>Geçen Yıl €</th><th>YoY Büyüme</th><th>Hedef vs Forecast</th></tr>
              </thead>
              <tbody>
                {kalanAylar.map((m,i)=>{
                  const mi = monthly.indexOf(m);
                  const sezonFak = (m.py||m.h*0.9)/(monthly.filter(x=>x.py).reduce((a,b)=>a+(b.py||0),0)/12||100000);
                  const base = (m.py||m.h*0.92)*(1+growthRate*0.65);
                  const fc = Math.round(base*sezonFak);
                  const yoyM = m.py?(( fc-m.py)/m.py*100):null;
                  const vsPlan = (fc/m.h*100);
                  return(
                    <tr key={i}>
                      <td style={{fontWeight:700}}>{m.m}</td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{(m.h/1000).toFixed(0)}K</td>
                      <td style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--teal)',fontStyle:'italic'}}>{(fc/1000).toFixed(0)}K</td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>{m.py?(m.py/1000).toFixed(0)+'K':'—'}</td>
                      <td style={{fontFamily:'var(--mono)',fontWeight:600,
                        color:yoyM==null?'var(--text3)':yoyM>=0?'var(--teal)':'#ff6eb4'}}>
                        {yoyM!=null?(yoyM>=0?'+':'')+yoyM.toFixed(1)+'%':'—'}
                      </td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:50,height:4,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
                            <div style={{width:`${Math.min(vsPlan,100)}%`,height:'100%',borderRadius:2,
                              background:vsPlan>=100?'var(--teal)':vsPlan>=85?'var(--gold)':'#ff6eb4'}}/>
                          </div>
                          <span style={{fontFamily:'var(--mono)',fontSize:11,
                            color:vsPlan>=100?'var(--teal)':vsPlan>=85?'var(--gold)':'#ff6eb4'}}>
                            %{vsPlan.toFixed(0)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{fontWeight:700,background:'rgba(255,255,255,0.04)'}}>
                  <td>TOPLAM</td>
                  <td style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{(kalanAylar.reduce((s,m)=>s+m.h,0)/1000).toFixed(0)}K</td>
                  <td style={{fontFamily:'var(--mono)',color:'var(--teal)',fontWeight:800}}>{(forecastKalan/1000).toFixed(0)}K</td>
                  <td style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>{(kalanAylar.reduce((s,m)=>s+(m.py||0),0)/1000).toFixed(0)}K</td>
                  <td style={{fontFamily:'var(--mono)',color:yoy>=0?'var(--teal)':'#ff6eb4'}}>{yoy>=0?'+':''}{yoy.toFixed(1)}%</td>
                  <td style={{fontFamily:'var(--mono)',color:forecastKalan/kalanAylar.reduce((s,m)=>s+m.h,0)>=0.9?'var(--teal)':'#ff6eb4'}}>
                    %{(forecastKalan/Math.max(kalanAylar.reduce((s,m)=>s+m.h,0),1)*100).toFixed(0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          HAFTALIK OTOMATİK INSİGHT
      ══════════════════════════════════════ */}
      {sec==='insight'&&(
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
            <div>
              <div style={{fontFamily:'var(--ff)',fontSize:18,fontWeight:800}}>Haftalık Otomatik Özet</div>
              <div style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:2}}>
                {hafta} • Sistem tarafından otomatik üretildi
              </div>
            </div>
            <button className="btn bg" style={{fontSize:11,padding:'6px 14px'}}
              onClick={()=>{
                const w=window.open('','_blank');
                w.document.write(`<html><head><title>RevenueOS Haftalık Özet</title>
                <style>body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;}
                h1{font-size:20px;margin-bottom:4px;}
                .meta{font-size:11px;color:#64748b;margin-bottom:24px;}
                .card{border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;}
                .cat{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;}
                .title{font-size:14px;font-weight:700;margin-bottom:8px;}
                .detail{font-size:12px;color:#334155;line-height:1.7;margin-bottom:8px;}
                .action{font-size:12px;background:#f8fafc;border-left:3px solid #0891b2;padding:8px 12px;border-radius:0 6px 6px 0;}
                </style></head><body>
                <h1>RevenueOS — Haftalık Özet Raporu</h1>
                <p class="meta">${hafta} • RevenueOS Akıllı Analiz</p>
                ${insights.map(ins=>`
                  <div class="card">
                    <div class="cat">${ins.cat}</div>
                    <div class="title">${ins.baslik}</div>
                    <div class="detail">${ins.detay}</div>
                    <div class="action">💡 Önerilen Aksiyon: ${ins.aksiyon}</div>
                  </div>
                `).join('')}
                </body></html>`);
                w.document.close();
                setTimeout(()=>w.print(),400);
              }}>
              🖨 Yazdır / PDF
            </button>
          </div>

          {/* Özet KPI bar */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:16}}>
            {[
              {l:'Hedef %', v:`%${pct.toFixed(0)}`, c:+pct>=85?'var(--teal)':'#ff6eb4'},
              {l:'YoY', v:`${yoy>=0?'+':''}${yoy.toFixed(1)}%`, c:yoy>=0?'var(--teal)':'#ff6eb4'},
              {l:'OCC', v:`%${simOcc}`, c:simOcc>=85?'var(--teal)':'var(--gold)'},
              {l:'PP', v:`€${simAdr}`, c:'var(--gold)'},
              {l:'Rakip Ort.', v:`€${rakipOrt.toFixed(0)}`, c:'var(--blue)'},
            ].map((k,i)=>(
              <div key={i} style={{padding:'10px 12px',background:'rgba(255,255,255,0.03)',
                border:'1px solid var(--border)',borderRadius:10,textAlign:'center'}}>
                <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',marginBottom:4,textTransform:'uppercase'}}>{k.l}</div>
                <div style={{fontSize:16,fontWeight:800,color:k.c,fontFamily:'var(--ff)'}}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Insight kartları */}
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {insights.map((ins,i)=>(
              <div key={i} style={{borderRadius:12,overflow:'hidden',
                border:`1px solid rgba(255,255,255,0.08)`}}>
                <div style={{padding:'10px 16px',background:'rgba(255,255,255,0.04)',
                  display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:ins.c,fontFamily:'var(--mono)'}}>{ins.cat}</span>
                </div>
                <div style={{padding:'14px 16px',background:'rgba(255,255,255,0.02)'}}>
                  <div style={{fontWeight:700,fontSize:14,color:'var(--text)',marginBottom:8}}>{ins.baslik}</div>
                  <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.8,marginBottom:10}}>{ins.detay}</div>
                  <div style={{fontSize:12,padding:'10px 14px',borderRadius:8,
                    background:'rgba(255,255,255,0.04)',
                    borderLeft:`3px solid ${ins.c}`}}>
                    <span style={{fontWeight:700,color:ins.c}}>→ Önerilen Aksiyon: </span>
                    <span style={{color:'var(--text)'}}>{ins.aksiyon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ZekaMerkezi;
