export const THEMES = {
  'Koyu Okyanus': {
    '--bg':'#070b14','--bg2':'#0c1220','--bg3':'#111827',
    '--border':'rgba(255,255,255,0.07)',
    '--gold':'#f0b429','--gold2':'#fbbf24','--gold-dim':'rgba(240,180,41,0.1)',
    '--teal':'#06d6a0','--teal-dim':'rgba(6,214,160,0.1)',
    '--blue':'#4cc9f0','--rose':'#f72585','--rose-dim':'rgba(247,37,133,0.1)',
    '--text':'#e2e8f0','--text2':'#94a3b8','--text3':'#475569',
    '--ff':'"Syne",sans-serif','--mono':'"JetBrains Mono",monospace',
    '--glow-gold':'0 0 20px rgba(240,180,41,0.15)',
  },
  'Derin Mor': {
    '--bg':'#0a0614','--bg2':'#110a1e','--bg3':'#18102a',
    '--border':'rgba(167,139,250,0.12)',
    '--gold':'#c084fc','--gold2':'#d8b4fe','--gold-dim':'rgba(192,132,252,0.12)',
    '--teal':'#a78bfa','--teal-dim':'rgba(167,139,250,0.1)',
    '--blue':'#818cf8','--rose':'#f472b6','--rose-dim':'rgba(244,114,182,0.1)',
    '--text':'#ede9fe','--text2':'#a78bfa','--text3':'#6d28d9',
    '--ff':'"Syne",sans-serif','--mono':'"JetBrains Mono",monospace',
    '--glow-gold':'0 0 20px rgba(192,132,252,0.15)',
  },
  'Gece Mavisi': {
    '--bg':'#050d1a','--bg2':'#091428','--bg3':'#0d1e38',
    '--border':'rgba(76,201,240,0.1)',
    '--gold':'#38bdf8','--gold2':'#7dd3fc','--gold-dim':'rgba(56,189,248,0.1)',
    '--teal':'#22d3ee','--teal-dim':'rgba(34,211,238,0.1)',
    '--blue':'#60a5fa','--rose':'#fb7185','--rose-dim':'rgba(251,113,133,0.1)',
    '--text':'#e0f2fe','--text2':'#7dd3fc','--text3':'#0369a1',
    '--ff':'"Syne",sans-serif','--mono':'"JetBrains Mono",monospace',
    '--glow-gold':'0 0 20px rgba(56,189,248,0.15)',
  },
  'Zümrüt': {
    '--bg':'#030f0a','--bg2':'#071a10','--bg3':'#0b2516',
    '--border':'rgba(6,214,160,0.1)',
    '--gold':'#10b981','--gold2':'#34d399','--gold-dim':'rgba(16,185,129,0.1)',
    '--teal':'#06d6a0','--teal-dim':'rgba(6,214,160,0.1)',
    '--blue':'#6ee7b7','--rose':'#f87171','--rose-dim':'rgba(248,113,113,0.1)',
    '--text':'#d1fae5','--text2':'#6ee7b7','--text3':'#065f46',
    '--ff':'"Syne",sans-serif','--mono':'"JetBrains Mono",monospace',
    '--glow-gold':'0 0 20px rgba(16,185,129,0.15)',
  },
  'Gün Batımı': {
    '--bg':'#120508','--bg2':'#1e0a0e','--bg3':'#2a1016',
    '--border':'rgba(251,113,133,0.1)',
    '--gold':'#fb923c','--gold2':'#fdba74','--gold-dim':'rgba(251,146,60,0.1)',
    '--teal':'#fb7185','--teal-dim':'rgba(251,113,133,0.1)',
    '--blue':'#fda4af','--rose':'#f43f5e','--rose-dim':'rgba(244,63,94,0.1)',
    '--text':'#fff1f2','--text2':'#fda4af','--text3':'#9f1239',
    '--ff':'"Syne",sans-serif','--mono':'"JetBrains Mono",monospace',
    '--glow-gold':'0 0 20px rgba(251,146,60,0.15)',
  },
  'Beyaz': {
    '--bg':'#eef2f7','--bg2':'#ffffff','--bg3':'#f4f7fb',
    '--border':'rgba(0,0,0,0.10)',
    '--gold':'#d97706','--gold2':'#b45309','--gold-dim':'rgba(217,119,6,0.1)',
    '--teal':'#0891b2','--teal-dim':'rgba(8,145,178,0.1)',
    '--blue':'#2563eb','--rose':'#e11d48','--rose-dim':'rgba(225,29,72,0.08)',
    '--text':'#0f172a','--text2':'#334155','--text3':'#64748b',
    '--ff':'"Syne",sans-serif','--mono':'"JetBrains Mono",monospace',
    '--glow-gold':'0 2px 12px rgba(217,119,6,0.12)',
  },
  'Krem': {
    '--bg':'#ede8df','--bg2':'#fdf8f0','--bg3':'#f5efe6',
    '--border':'rgba(0,0,0,0.09)',
    '--gold':'#c2410c','--gold2':'#ea580c','--gold-dim':'rgba(194,65,12,0.08)',
    '--teal':'#0d9488','--teal-dim':'rgba(13,148,136,0.1)',
    '--blue':'#1d4ed8','--rose':'#be123c','--rose-dim':'rgba(190,18,60,0.08)',
    '--text':'#1c1917','--text2':'#44403c','--text3':'#78716c',
    '--ff':'"Syne",sans-serif','--mono':'"JetBrains Mono",monospace',
    '--glow-gold':'0 2px 12px rgba(194,65,12,0.1)',
  },
};

export function applyTheme(name) {
  const t = THEMES[name] || THEMES['Koyu Okyanus'];
  Object.entries(t).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  localStorage.setItem('rv_theme', name);
  const isLight = name === 'Beyaz' || name === 'Krem';
  document.body.classList.toggle('light-theme', isLight);

  const styleId = 'rv-light-overrides';
  let el = document.getElementById(styleId);
  if (!el) { el = document.createElement('style'); el.id = styleId; document.head.appendChild(el); }

  if (isLight) {
    const bg = t['--bg'] || '#f8fafc';
    const bg2 = t['--bg2'] || '#ffffff';
    const bg3 = t['--bg3'] || '#f1f5f9';
    const txt = t['--text'] || '#0f172a';
    const txt2 = t['--text2'] || '#334155';
    const txt3 = t['--text3'] || '#94a3b8';
    const bdr = t['--border'] || 'rgba(0,0,0,0.09)';
    el.textContent = `
      .light-theme [style*="background:#07"],
      .light-theme [style*="background:#0c"],
      .light-theme [style*="background:#0d"],
      .light-theme [style*="background:#11"],
      .light-theme [style*="background:#12"],
      .light-theme [style*="background:#1e"],
      .light-theme [style*="background:#18"],
      .light-theme [style*="background:#09"],
      .light-theme [style*="background:#0a"],
      .light-theme [style*="background:#05"] { background:${bg2} !important; color:${txt} !important; }
      .light-theme [style*="rgba(255,255,255,0.02)"] { background:rgba(0,0,0,0.015) !important; }
      .light-theme [style*="rgba(255,255,255,0.03)"] { background:rgba(0,0,0,0.025) !important; }
      .light-theme [style*="rgba(255,255,255,0.04)"] { background:rgba(0,0,0,0.03) !important; }
      .light-theme [style*="rgba(255,255,255,0.05)"] { background:rgba(0,0,0,0.04) !important; }
      .light-theme [style*="rgba(255,255,255,0.06)"] { background:rgba(0,0,0,0.04) !important; }
      .light-theme [style*="rgba(255,255,255,0.07)"] { background:rgba(0,0,0,0.05) !important; }
      .light-theme [style*="rgba(255,255,255,0.08)"] { background:rgba(0,0,0,0.05) !important; }
      .light-theme [style*="color:#e2e8f0"] { color:${txt} !important; }
      .light-theme [style*="color:#94a3b8"] { color:${txt2} !important; }
      .light-theme [style*="color:#475569"] { color:${txt3} !important; }
      .light-theme [style*="color:#64748b"] { color:${txt2} !important; }
      .light-theme .tbl tbody tr { background:${bg2} !important; }
      .light-theme .tbl tbody tr:nth-child(even) { background:${bg3} !important; }
      .light-theme .tbl tbody tr:hover { background:rgba(0,0,0,0.025) !important; }
      .light-theme .tbl td { color:${txt} !important; border-color:${bdr} !important; }
      .light-theme .tbl th { color:${txt2} !important; background:${bg3} !important; }
      .light-theme .tbl { color:${txt}; }
      .light-theme .panel { background:${bg2} !important; color:${txt} !important; }
      .light-theme .panel > div, .light-theme .panel > table { color:${txt}; }
      .light-theme .kcard { background:${bg2} !important; }
      .light-theme .aicard { background:${bg2} !important; border-color:${bdr} !important; }
      .light-theme [style*="background:#0c1620"] { background:${bg2} !important; color:${txt} !important; }
      .light-theme [style*="border:1px solid rgba(255,255,255"] { border-color:${bdr} !important; }
      .light-theme { color:${txt}; }
      .light-theme div, .light-theme span, .light-theme td, .light-theme th, .light-theme p { color:inherit; }
    `;
  } else {
    el.textContent = '';
  }
}
