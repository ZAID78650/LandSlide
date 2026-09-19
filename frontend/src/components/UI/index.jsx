import React from 'react';

export function StatusChip({ level, label, pulse = false }) {
  const map = {
    RED:      { cls: 'chip-red',    dot: 'dot-red',    text: label || 'CRITICAL' },
    ORANGE:   { cls: 'chip-orange', dot: 'dot-orange', text: label || 'HIGH' },
    AMBER:    { cls: 'chip-amber',  dot: 'dot-amber',  text: label || 'MEDIUM' },
    GREEN:    { cls: 'chip-green',  dot: 'dot-green',  text: label || 'NOMINAL' },
    CRITICAL: { cls: 'chip-red',    dot: 'dot-red',    text: label || 'CRITICAL' },
    HIGH:     { cls: 'chip-orange', dot: 'dot-orange', text: label || 'HIGH' },
    MEDIUM:   { cls: 'chip-amber',  dot: 'dot-amber',  text: label || 'MEDIUM' },
    LOW:      { cls: 'chip-green',  dot: 'dot-green',  text: label || 'LOW' },
    ONLINE:   { cls: 'chip-green',  dot: 'dot-green',  text: label || 'ONLINE' },
    OFFLINE:  { cls: 'chip-red',    dot: 'dot-red',    text: label || 'OFFLINE' },
    DEGRADED: { cls: 'chip-amber',  dot: 'dot-amber',  text: label || 'DEGRADED' },
    ACTIVE:   { cls: 'chip-cyan',   dot: '',           text: label || 'ACTIVE' },
    RESOLVED: { cls: 'chip-green',  dot: '',           text: label || 'RESOLVED' },
    MONITORING: { cls: 'chip-blue', dot: '',           text: label || 'MONITORING' },
  };

  const { cls, dot, text } = map[level] || { cls: 'chip-cyan', dot: '', text: label || level };

  return (
    <span className={`chip ${cls}`}>
      {dot && <span className={`chip-dot ${dot}`} />}
      {text}
    </span>
  );
}

export function DataCard({ title, children, action, confidence, style = {} }) {
  return (
    <div className="panel" style={style}>
      <div className="panel-header">
        <span className="label-caps">{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {confidence !== undefined && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)' }}>
              {(confidence * 100).toFixed(0)}% CONF
            </span>
          )}
          {action}
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

export function Sparkline({ data = [], color = 'var(--cyan)', height = 40 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h * 0.8) - h * 0.1;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(' L ')}`;
  const fillD = `${pathD} L ${w},${h} L 0,${h} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#sg-${color.replace(/[^a-z]/gi,'')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function LoadingScreen({ message = 'INITIALIZING NEXUS-LAND SYSTEMS...' }) {
  return (
    <div className="loading-screen">
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 24, fontWeight: 700,
        color: 'var(--cyan)',
        letterSpacing: '0.2em',
        marginBottom: 8,
      }}>NEXUS-LAND</div>
      <div className="loading-ring" />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
        {message}
      </div>
    </div>
  );
}

export function ConfidenceBar({ value = 0, label }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? 'var(--cyan)' : pct >= 65 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--red)';
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span className="label-caps" style={{ fontSize: 9 }}>{label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color }}>{pct}%</span>
        </div>
      )}
      <div className="confidence-bar">
        <div className="confidence-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export { default as Chart3D } from './Chart3D';
