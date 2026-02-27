import React, { useState } from 'react';
import { USERS, RI } from '../data/constants';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';
import { createClient } from '@supabase/supabase-js';

function Login({onLogin,allUsers}){
  const [sel,setSel]=useState(null);
  const [email,setEmail]=useState('');
  const [pass,setPass]=useState('');
  const [err,setErr]=useState('');
  const [loading,setLoading]=useState(false);
  const [showD,setShowD]=useState(false);
  // Supabase bağlantı adımı
  const hasSb = !!((SUPABASE_URL&&SUPABASE_URL.trim()) || localStorage.getItem('sb_url')) && !!((SUPABASE_KEY&&SUPABASE_KEY.trim()) || localStorage.getItem('sb_key'));
  const [step,setStep]=useState('login'); // connect adımı kaldırıldı — config dosyaya gömülü
  const [sbUrl,setSbUrl]=useState(localStorage.getItem('sb_url')||'');
  const [sbKey,setSbKey]=useState(localStorage.getItem('sb_key')||'');
  const [sbErr,setSbErr]=useState('');
  const [sbLoading,setSbLoading]=useState(false);

  const connectSB=async()=>{
    const url=sbUrl.trim().replace(/\/+$/,'');
    const key=sbKey.trim();
    if(!url||!key){setSbErr('URL ve Key zorunlu.');return;}
    if(!url.includes('.supabase.co')){setSbErr('Geçerli bir Supabase URL girin.');return;}
    setSbLoading(true);setSbErr('');
    try{
      const client=supabase.createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const {error}=await client.from('monthly_targets').select('month_index').limit(1);
      if(error && error.code!=='PGRST116'){setSbErr('Bağlantı hatası: '+error.message);setSbLoading(false);return;}
      localStorage.setItem('sb_url',url);
      localStorage.setItem('sb_key',key);
      window._sbClient=null; // reset singleton
      setStep('login');
    }catch(e){setSbErr('Bağlantı hatası. URL ve Key kontrol edin.');}
    setSbLoading(false);
  };

  const roles=[{id:'gm',i:'👑',n:'Genel Müdür',d:'Tam yetki'},{id:'sales',i:'🎯',n:'Satış Müdürü',d:'Hedef+Acente'},{id:'revenue',i:'📊',n:'Revenue Mgr',d:'Fiyat+Projeksiyon'},{id:'rez',i:'📋',n:'Rezervasyon',d:'Görüntüleme'}];
  const pick=id=>{setSel(id);setErr('');const u=allUsers.find(u=>u.id===id);if(u)setEmail(u.email);};
  const doLogin=()=>{const u=allUsers.find(u=>u.email===email&&u.pass===pass);if(!u){setErr('E-posta veya şifre hatalı.');return;}setLoading(true);setTimeout(()=>{setLoading(false);onLogin(u);},600);};
  const quick=id=>{const u=allUsers.find(u=>u.id===id);if(u){setLoading(true);setTimeout(()=>{setLoading(false);onLogin(u);},400);}};
  return(
    <div className="login-page">
      {step==='connect'&&(
        <div className="login-box" style={{maxWidth:420}}>
          <div style={{textAlign:'center',marginBottom:24}}>
            <div style={{fontSize:32,marginBottom:8}}>🗄</div>
            <div style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:800,marginBottom:4}}>Veritabanı Bağlantısı</div>
            <div style={{fontSize:12,color:'var(--text2)'}}>Devam etmek için Supabase bilgilerinizi girin</div>
          </div>
          <div className="mg">
            <label className="lbl">Project URL</label>
            <input className="inp" value={sbUrl} onChange={e=>setSbUrl(e.target.value)} placeholder="https://xxxxxxxxxxxx.supabase.co" style={{fontFamily:'var(--mono)',fontSize:12}}/>
          </div>
          <div className="mg">
            <label className="lbl">Anon Key</label>
            <input className="inp" type="password" value={sbKey} onChange={e=>setSbKey(e.target.value)} placeholder="eyJhbGci..." style={{fontFamily:'var(--mono)',fontSize:12}}
              onKeyDown={e=>e.key==='Enter'&&connectSB()}/>
          </div>
          {sbErr&&<div style={{fontSize:12,color:'#ff6eb4',marginBottom:10,fontFamily:'var(--mono)',padding:'8px 12px',background:'rgba(247,37,133,0.08)',borderRadius:8}}>❌ {sbErr}</div>}
          <button className="btn bp bfull" onClick={connectSB} disabled={sbLoading||!sbUrl||!sbKey}>
            {sbLoading?'⏳ Bağlanıyor…':'🔌 Bağlan ve Devam Et'}
          </button>
          <div style={{textAlign:'center',marginTop:12,fontSize:11,color:'var(--text3)'}}>
            Supabase bilgilerinizi <strong style={{color:'var(--text2)'}}>supabase.com → Settings → API</strong> sayfasından bulabilirsiniz
          </div>
        </div>
      )}
      {step==='login'&&(
      <div style={{width:'100%',maxWidth:430}}>
        <div className="lbox">
          <div className="ltop"/>
          <div className="logo">Revenue<em>OS</em></div>
          <div className="logo-s">Otel Satış & Bütçe Yönetim Sistemi • Elektra Web PMS</div>
          <div className="lbl" style={{marginBottom:10}}>Rolünüzü Seçin</div>
          <div className="rgrid">
            {roles.map(r=>(
              <div key={r.id} className={`rbtn${sel===r.id?' sel':''}`} onClick={()=>pick(r.id)}>
                <div className="ricon">{r.i}</div>
                <div className="rname">{r.n}</div>
                <div className="rdesc">{r.d}</div>
              </div>
            ))}
          </div>
          <hr className="divider"/>
          {err&&<div className="err">⚠️ {err}</div>}
          <div className="mg"><label className="lbl">E-Posta</label><input className="inp" type="email" value={email} placeholder="kullanici@otel.com" onChange={e=>{setEmail(e.target.value);setErr('');}}/></div>
          <div className="mg"><label className="lbl">Şifre</label><input className="inp" type="password" value={pass} placeholder="••••••••" onChange={e=>{setPass(e.target.value);setErr('');}} onKeyDown={e=>e.key==='Enter'&&doLogin()}/></div>
          <button className="btn bp bfull" onClick={doLogin} disabled={loading||!email||!pass}>{loading?'⏳ Giriş yapılıyor…':'🔐 Giriş Yap'}</button>
          <button className="dtgl" onClick={()=>setShowD(!showD)}>{showD?'Demo gizle ▲':'Demo hesapları göster ▼'}</button>
          {showD&&(
            <div className="dbox">
              <div className="lbl" style={{marginBottom:8}}>Hızlı Demo Girişi</div>
              {USERS.map(u=>(
                <div key={u.id} className="drow">
                  <div><span style={{marginRight:6}}>{RI[u.role]}</span><span style={{fontWeight:600,fontSize:12}}>{u.name}</span><span className="dinfo" style={{marginLeft:7}}>{u.email} / {u.pass}</span></div>
                  <button className="btn bg" style={{padding:'3px 10px',fontSize:10}} onClick={()=>quick(u.id)}>Giriş</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{textAlign:'center',marginTop:14,fontSize:10,color:'var(--text2)',fontFamily:'var(--mono)'}}>RevenueOS v2.0 • Elektra Web PMS • © 2024</div>
      </div>
      )}
    </div>
  );
}

export default Login;
