import React, { useState } from 'react';
import { ROLES, COLORS, PERMS, DEF_PERMS, RI } from '../data/constants';

function KullaniciYonetimi({user,users,saveUser,deleteUser,sbReady}){
  const [editing,setEditing]=useState(null); // null=liste, user obj=düzenle, 'new'=yeni
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState('');
  const [delConfirm,setDelConfirm]=useState(null);

  const startEdit=(u)=>{
    setForm({...u,p:{...u.p}});
    setEditing(u.id);
    setMsg('');
  };

  const startNew=()=>{
    setForm({
      id:'user_'+Date.now(), name:'', email:'', pass:'',
      role:'Rezervasyon', av:'', color:COLORS[users.length%COLORS.length],
      p:{...DEF_PERMS}
    });
    setEditing('new');
    setMsg('');
  };

  const handleSave=async()=>{
    if(!form.name||!form.email||!form.pass){setMsg('Ad, e-posta ve şifre zorunlu.');return;}
    setSaving(true);
    const u={
      ...form,
      av:form.av||form.name.substring(0,2).toUpperCase().replace(' ',''),
    };
    const ok=await saveUser(u);
    setSaving(false);
    setMsg(sbReady?'✅ Kaydedildi (DB+Yerel)':'✅ Kaydedildi (Yerel)');
    setTimeout(()=>{setEditing(null);setMsg('');},1000);
  };

  const handleDelete=async(uid)=>{
    await deleteUser(uid);
    setDelConfirm(null);
    if(editing===uid)setEditing(null);
  };

  const togglePerm=(k)=>setForm(f=>({...f,p:{...f.p,[k]:f.p[k]?0:1}}));

  if(editing){
    const isNew=editing==='new';
    return(
      <div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
          <button className="btn bg" style={{padding:'6px 12px',fontSize:12}} onClick={()=>{setEditing(null);setMsg('');}}>← Geri</button>
          <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700}}>{isNew?'Yeni Kullanıcı':'Kullanıcıyı Düzenle'}</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div className="panel">
            <div className="ptitle">👤 Temel Bilgiler</div>
            <div className="mg">
              <label className="lbl">Ad Soyad</label>
              <input className="inp" value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value,av:e.target.value.substring(0,2).toUpperCase()}))} placeholder="örn: Ahmet Yılmaz"/>
            </div>
            <div className="mg">
              <label className="lbl">E-posta</label>
              <input className="inp" value={form.email||''} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="ahmet@otel.com"/>
            </div>
            <div className="mg">
              <label className="lbl">Şifre</label>
              <input className="inp" type="text" value={form.pass||''} onChange={e=>setForm(f=>({...f,pass:e.target.value}))} placeholder="min 6 karakter"/>
            </div>
            <div className="mg">
              <label className="lbl">Rol</label>
              <select className="inp" value={form.role||'Rezervasyon'} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label className="lbl">Avatar (2 harf)</label>
                <input className="inp" value={form.av||''} onChange={e=>setForm(f=>({...f,av:e.target.value.toUpperCase().substring(0,2)}))} placeholder="AY" style={{textAlign:'center',fontWeight:700,fontSize:16}}/>
              </div>
              <div>
                <label className="lbl">Renk</label>
                <div style={{display:'flex',gap:6,marginTop:2,flexWrap:'wrap'}}>
                  {COLORS.map(c=>(
                    <div key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                      style={{width:24,height:24,borderRadius:'50%',background:c,cursor:'pointer',
                        border:form.color===c?'3px solid #fff':'2px solid transparent',
                        boxShadow:form.color===c?'0 0 0 2px '+c:'none',transition:'all .15s'}}/>
                  ))}
                </div>
              </div>
            </div>
            {form.name&&(
              <div style={{marginTop:14,display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid var(--border)'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:form.color+'22',color:form.color,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13}}>
                  {form.av||form.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{form.name}</div>
                  <div style={{fontSize:11,color:'var(--text2)',fontFamily:'var(--mono)'}}>{form.role} · {form.email}</div>
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="ptitle">🔐 Yetkiler</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {PERMS.map(({k,l})=>(
                <div key={k} onClick={()=>togglePerm(k)}
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'10px 14px',borderRadius:10,cursor:'pointer',
                    background:form.p?.[k]?'rgba(6,214,160,0.07)':'rgba(255,255,255,0.02)',
                    border:`1px solid ${form.p?.[k]?'rgba(6,214,160,0.25)':'var(--border)'}`,
                    transition:'all .15s',userSelect:'none'}}>
                  <span style={{fontSize:13,fontWeight:500}}>{l}</span>
                  <div style={{width:36,height:20,borderRadius:10,
                    background:form.p?.[k]?'var(--teal)':'rgba(255,255,255,0.1)',
                    position:'relative',transition:'background .2s'}}>
                    <div style={{position:'absolute',top:3,left:form.p?.[k]?18:3,
                      width:14,height:14,borderRadius:'50%',background:'#fff',
                      transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}/>
                  </div>
                </div>
              ))}
            </div>

            {!sbReady&&<div style={{marginTop:12,padding:'8px 12px',background:'rgba(240,180,41,0.08)',border:'1px solid rgba(240,180,41,0.2)',borderRadius:8,fontSize:11,color:'var(--gold)',fontFamily:'var(--mono)'}}>⚠ Kaydetmek için Supabase bağlantısı gerekli</div>}

            {msg&&<div style={{marginTop:10,padding:'8px 12px',borderRadius:8,fontSize:12,
              background:msg.startsWith('✅')?'var(--teal-dim)':'var(--rose-dim)',
              border:`1px solid ${msg.startsWith('✅')?'rgba(6,214,160,0.25)':'rgba(247,37,133,0.25)'}`,
              color:msg.startsWith('✅')?'var(--teal)':'#ff6eb4'}}>{msg}</div>}

            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button className="btn bg" style={{flex:1}} onClick={()=>setEditing(null)}>İptal</button>
              <button className="btn bp" style={{flex:2}} onClick={handleSave} disabled={saving||!sbReady}>
                {saving?'⏳ Kaydediliyor…':'💾 Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div>
      {!sbReady&&(
        <div className="notif ny" style={{marginBottom:16}}>
          ⚠ Kullanıcı yönetimi için Supabase bağlantısı gereklidir. ⚙ Ayarlar'dan bağlanın.
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700}}>👥 Kullanıcı Yönetimi</div>
        <button className="btn bp" style={{fontSize:12,padding:'7px 16px'}} onClick={startNew} disabled={!sbReady}>+ Yeni Kullanıcı</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:12}}>
        {users.map(u=>(
          <div key={u.id} className="panel" style={{padding:'16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{width:42,height:42,borderRadius:'50%',background:u.color+'22',color:u.color,
                display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,
                border:`2px solid ${u.color}44`,flexShrink:0}}>
                {u.av}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
                <div style={{fontSize:11,color:'var(--text2)',fontFamily:'var(--mono)',marginTop:2}}>{RI[u.role]||'👤'} {u.role}</div>
                <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
              </div>
              {u.id===user.id&&<span style={{fontSize:9,fontFamily:'var(--mono)',padding:'2px 6px',background:'var(--gold-dim)',border:'1px solid rgba(240,180,41,0.3)',borderRadius:4,color:'var(--gold)',flexShrink:0}}>SİZ</span>}
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:12}}>
              {PERMS.filter(({k})=>u.p?.[k]).map(({l})=>(
                <span key={l} className="badge bg2" style={{fontSize:9}}>{l}</span>
              ))}
              {PERMS.filter(({k})=>!u.p?.[k]).map(({l})=>(
                <span key={l} className="badge" style={{fontSize:9,background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',color:'var(--text3)',textDecoration:'line-through'}}>{l}</span>
              ))}
            </div>

            <div style={{display:'flex',gap:8}}>
              <button className="btn bg" style={{flex:1,fontSize:11}} onClick={()=>startEdit(u)} disabled={!sbReady}>✏ Düzenle</button>
              {u.id!==user.id&&(
                delConfirm===u.id?(
                  <div style={{display:'flex',gap:5,flex:1}}>
                    <button className="btn" style={{flex:1,fontSize:10,background:'var(--rose-dim)',border:'1px solid rgba(247,37,133,.3)',color:'#ff6eb4',padding:'5px 8px'}} onClick={()=>handleDelete(u.id)}>Sil</button>
                    <button className="btn bg" style={{fontSize:10,padding:'5px 8px'}} onClick={()=>setDelConfirm(null)}>İptal</button>
                  </div>
                ):(
                  <button className="btn bg" style={{fontSize:11,padding:'5px 10px',color:'var(--text3)'}} onClick={()=>setDelConfirm(u.id)}>🗑</button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KullaniciYonetimi;
