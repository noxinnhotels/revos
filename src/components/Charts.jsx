import React from 'react';

export function AreaChartSVG({ data, keys, colors, height = 220 }) {
  const W = 800, H = height, PL = 48, PR = 16, PT = 10, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const allVals = data.flatMap(d => keys.map(k => d[k] || 0));
  const maxV = Math.max(...allVals, 1);
  const x = (i) => PL + (i / (data.length - 1 || 1)) * cW;
  const y = (v) => PT + cH - (v / maxV) * cH;
  const linePath = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key] || 0).toFixed(1)}`).join(' ');
  const areaPath = (key) => {
    const pts = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key] || 0).toFixed(1)}`).join(' ');
    return `${pts} L${x(data.length - 1).toFixed(1)},${(PT + cH).toFixed(1)} L${PL},${(PT + cH).toFixed(1)} Z`;
  };
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => maxV * p);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>{keys.map((k, i) => <linearGradient key={k} id={`ag${k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[i]} stopOpacity="0.3" /><stop offset="100%" stopColor={colors[i]} stopOpacity="0" /></linearGradient>)}</defs>
      {ticks.map((t, i) => { const yy = y(t); return <line key={i} x1={PL} y1={yy} x2={W - PR} y2={yy} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />; })}
      {ticks.map((t, i) => <text key={i} x={PL - 4} y={y(t) + 4} textAnchor="end" fontSize="9" fill="#64748b">{t >= 1000 ? `${(t / 1000).toFixed(0)}K` : t.toFixed(0)}</text>)}
      {data.map((d, i) => <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#64748b">{d.m}</text>)}
      {keys.map((k, i) => <path key={k + '-a'} d={areaPath(k)} fill={`url(#ag${k})`} />)}
      {keys.map((k, i) => <path key={k + '-l'} d={linePath(k)} fill="none" stroke={colors[i]} strokeWidth={k === 'gercek' ? "2" : "1.5"} strokeDasharray={k === 'hedef' ? "6,3" : k === 'sim' ? "8,4" : "none"} />)}
      {keys.map((k, i) => data.filter(d => d[k]).map((d, j) => { const di = data.indexOf(d); return <circle key={`${k}${j}`} cx={x(di)} cy={y(d[k])} r="3" fill={colors[i]} />; }))}
    </svg>
  );
}

export function BarChartSVG({ data, keys, colors, height = 240 }) {
  const W = 800, H = height, PL = 48, PR = 16, PT = 10, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const allVals = data.flatMap(d => keys.map(k => d[k] || 0));
  const maxV = Math.max(...allVals, 1);
  const grpW = cW / data.length;
  const barW = Math.min(grpW / (keys.length + 1), 40);
  const y = (v) => PT + cH - (v / maxV) * cH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => maxV * p);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      {ticks.map((t, i) => { const yy = y(t); return [<line key={`l${i}`} x1={PL} y1={yy} x2={W - PR} y2={yy} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />, <text key={`t${i}`} x={PL - 4} y={yy + 4} textAnchor="end" fontSize="9" fill="#64748b">{t >= 1000 ? `${(t / 1000).toFixed(0)}K` : t.toFixed(0)}</text>]; })}
      {data.map((d, i) => {
        const gx = PL + i * grpW + grpW / 2;
        return [
          ...keys.map((k, ki) => { const v = d[k] || 0; if (!v) return null; const bx = gx + (ki - (keys.length - 1) / 2) * (barW + 2) - barW / 2; const bh = (v / maxV) * cH; return <rect key={k} x={bx} y={PT + cH - bh} width={barW} height={bh} fill={colors[ki]} fillOpacity={k === 'hedef' ? 0.35 : 0.9} rx="2" />; }),
          <text key={`l${i}`} x={gx} y={H - 6} textAnchor="middle" fontSize="9" fill="#64748b">{d.m}</text>
        ];
      })}
    </svg>
  );
}

export function PieChartSVG({ data, size = 160 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.35, ir = size * 0.22;
  let angle = -Math.PI / 2;
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const slices = data.map(d => { const sweep = 2 * Math.PI * (d.value / total); const s = angle; angle += sweep; return { ...d, startAngle: s, endAngle: angle }; });
  const arc = (s, e, R) => { const x1 = cx + R * Math.cos(s), y1 = cy + R * Math.sin(s), x2 = cx + R * Math.cos(e), y2 = cy + R * Math.sin(e), large = e - s > Math.PI ? 1 : 0; return `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2}`; };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: size }}>
      {slices.map((s, i) => {
        const mid = (s.startAngle + s.endAngle) / 2;
        const outerR = r + (Math.abs(mid) < 0.3 ? 4 : 0);
        return <path key={i} d={`${arc(s.startAngle, s.endAngle, outerR)} L${cx + ir * Math.cos(s.endAngle)},${cy + ir * Math.sin(s.endAngle)} A${ir},${ir} 0 ${s.endAngle - s.startAngle > Math.PI ? 1 : 0},0 ${cx + ir * Math.cos(s.startAngle)},${cy + ir * Math.sin(s.startAngle)} Z`} fill={s.fill} opacity="0.9" />;
      })}
    </svg>
  );
}

export function Legend({ keys, colors, labels }) {
  return <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
    {keys.map((k, i) => <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}><div style={{ width: 20, height: 2, background: colors[i], borderRadius: 1 }} />{labels ? labels[i] : k}</div>)}
  </div>;
}
