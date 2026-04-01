import React, { useState } from 'react';
import { USERS, RI } from '../data/constants';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';

function Login({onLogin,allUsers}){
  const [sel,setSel]=useState(null);
  const [email,setEmail]=useState('');
  const [pass,setPass]=useState('');
  const [err,setErr]=useState('');
  const [loading,setLoading]=useState(false);

  const roles=[
    {id:'gm',     i:'👑', n:'Genel Müdür',   d:'Tam yetki'},
    {id:'sales',  i:'🎯', n:'Satış Müdürü',  d:'Hedef+Acente'},
    {id:'revenue',i:'📊', n:'Revenue Mgr',   d:'Fiyat+Projeksiyon'},
    {id:'rez',    i:'📋', n:'Rezervasyon',   d:'Görüntüleme'},
  ];

  const pick = id => {
    setSel(id); setErr('');
    const u = allUsers.find(u => u.id === id);
    if (u) setEmail(u.email);
  };

  const doLogin = () => {
    const u = allUsers.find(u => u.email === email && u.pass === pass);
    if (!u) { setErr('E-posta veya şifre hatalı.'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(u); }, 600);
  };

  return (
    <div className="login-page">
      <div style={{width:'100%', maxWidth:430}}>
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

          {err && <div className="err">⚠️ {err}</div>}

          <div className="mg">
            <label className="lbl">E-Posta</label>
            <input className="inp" type="email" value={email}
              placeholder="kullanici@otel.com"
              onChange={e=>{setEmail(e.target.value); setErr('');}}/>
          </div>
          <div className="mg">
            <label className="lbl">Şifre</label>
            <input className="inp" type="password" value={pass}
              placeholder="••••••••"
              onChange={e=>{setPass(e.target.value); setErr('');}}
              onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
          </div>

          <button className="btn bp bfull" onClick={doLogin}
            disabled={loading||!email||!pass}>
            {loading ? '⏳ Giriş yapılıyor…' : '🔐 Giriş Yap'}
          </button>
        </div>

        <div style={{textAlign:'center',marginTop:14,fontSize:10,color:'var(--text2)',fontFamily:'var(--mono)'}}>
          RevenueOS v2.1 • Elektra Web PMS • © 2025
        </div>
      </div>
    </div>
  );
}

export default Login;
