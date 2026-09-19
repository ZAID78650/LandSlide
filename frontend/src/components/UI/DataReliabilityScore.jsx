import React from 'react';

export default function DataReliabilityScore({ score, reliability_score, factors, showWarning }) {
  const pct = Math.round(score ?? reliability_score ?? 0);
  const isLow = pct < 60;
  
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';

  const formatFactor = (f) => {
    if (typeof f === 'string') return { label: f, title: f };
    if (!f) return { label: '', title: '' };
    if (typeof f === 'object') {
      const name = f.name || f.label || f.factor || 'Factor';
      const scorePart = f.score != null ? ` (${Math.round(f.score)}%)` : (f.weight != null ? ` (${f.weight})` : '');
      const detail = f.detail || (f.weight != null ? `Weight: ${f.weight}` : name);
      return {
        label: `${name}${scorePart}`,
        title: detail
      };
    }
    return { label: String(f), title: String(f) };
  };

  return (
    <div style={{ padding: '12px', background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
      {showWarning && isLow && (
        <div style={{ background: 'rgba(255,176,32,0.15)', border: '1px solid rgba(255,176,32,0.4)', color: 'var(--amber)', padding: '8px', borderRadius: '4px', marginBottom: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
          ⚠ LOW DATA CONFIDENCE: Analysis based on incomplete data.
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', width: '50px', height: '50px' }}>
          <svg width="50" height="50" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
            <circle
              cx="25" cy="25" r={r}
              fill="none" stroke={color} strokeWidth="4"
              strokeDasharray={`${circ - offset} ${circ}`}
              strokeLinecap="round" transform="rotate(-90 25 25)"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
            {pct}%
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>DATA RELIABILITY SCORE</div>
          {factors && factors.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
              {factors.map((f, i) => {
                const { label, title } = formatFactor(f);
                return (
                  <span
                    key={i}
                    title={title}
                    style={{
                      fontSize: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
