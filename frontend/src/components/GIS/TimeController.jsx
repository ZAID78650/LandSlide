import React, { useState, useEffect } from 'react';

export const TIME_MODES = [
  { id: 'PAST_72H', label: 'PAST (T-72h)', sub: '-3 Days History', offsetHours: -72, type: 'HISTORICAL' },
  { id: 'PAST_24H', label: 'PAST (T-24h)', sub: '-24h Progression', offsetHours: -24, type: 'HISTORICAL' },
  { id: 'PRESENT', label: 'PRESENT (LIVE)', sub: 'Real-Time Telemetry', offsetHours: 0, type: 'LIVE' },
  { id: 'FORECAST_24H', label: 'FORECAST (+24h)', sub: 'Next 24 Hours GFS', offsetHours: 24, type: 'FORECAST' },
  { id: 'FORECAST_72H', label: 'FORECAST (+72h)', sub: '72h Impact Simulation', offsetHours: 72, type: 'FORECAST' }
];

export default function TimeController({ currentTimeMode = 'PRESENT', onChangeTimeMode }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const currentIndex = TIME_MODES.findIndex(m => m.id === currentTimeMode);
  const activeMode = TIME_MODES[currentIndex] || TIME_MODES[2];

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        const nextIndex = (currentIndex + 1) % TIME_MODES.length;
        onChangeTimeMode(TIME_MODES[nextIndex].id);
      }, 2400);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentIndex, onChangeTimeMode]);

  const handleStep = (direction) => {
    let nextIdx = currentIndex + direction;
    if (nextIdx < 0) nextIdx = TIME_MODES.length - 1;
    if (nextIdx >= TIME_MODES.length) nextIdx = 0;
    onChangeTimeMode(TIME_MODES[nextIdx].id);
  };

  return (
    <div style={{
      background: 'rgba(10, 14, 22, 0.94)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border-cyan)',
      borderRadius: 12,
      padding: '12px 18px',
      color: 'var(--text-primary)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      width: '100%',
      maxWidth: 680,
      margin: '0 auto'
    }}>
      {/* Top row: controls & active status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? 'rgba(255, 59, 92, 0.2)' : 'rgba(0, 229, 255, 0.2)',
              border: `1px solid ${isPlaying ? 'var(--red)' : 'var(--cyan)'}`,
              borderRadius: 6,
              color: isPlaying ? 'var(--red)' : 'var(--cyan)',
              padding: '5px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>{isPlaying ? '⏸' : '▶'}</span>
            <span>{isPlaying ? 'PAUSE 4D' : 'PLAY 4D'}</span>
          </button>

          <button
            onClick={() => handleStep(-1)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              color: 'var(--text-primary)',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: 11
            }}
            title="Step Back"
          >
            ⏮
          </button>

          <button
            onClick={() => handleStep(1)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              color: 'var(--text-primary)',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: 11
            }}
            title="Step Forward"
          >
            ⏭
          </button>
        </div>

        {/* Status chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            TEMPORAL STATE:
          </span>
          <span className={`chip ${activeMode.type === 'LIVE' ? 'chip-green' : activeMode.type === 'FORECAST' ? 'chip-blue' : 'chip-amber'}`} style={{ fontSize: 10, fontWeight: 800 }}>
            {activeMode.type === 'LIVE' ? '● ' : '◷ '}
            {activeMode.label}
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {TIME_MODES.map((mode, idx) => {
          const isSelected = mode.id === currentTimeMode;
          return (
            <button
              key={mode.id}
              onClick={() => onChangeTimeMode(mode.id)}
              style={{
                background: isSelected ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                borderRadius: 6,
                padding: '6px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{
                fontSize: 9,
                fontWeight: 800,
                color: isSelected ? 'var(--cyan)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {mode.label}
              </div>
              <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>
                {mode.sub}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
