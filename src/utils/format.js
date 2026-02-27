// ── FORMAT HELPERS ──
export const fmt = (v) => v != null ? `€${(v / 1e6).toFixed(2)}M` : '-';
export const fmtK = (v) => v != null ? `€${(v / 1000).toFixed(0)}K` : '-';
