import React from 'react';

export default function PageSkeleton({ title = 'LOADING TELEMETRY...' }) {
  return (
    <div style={{
      padding: '24px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            width: 220,
            height: 24,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s infinite',
            borderRadius: 4
          }} />
          <div style={{
            width: 340,
            height: 12,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 4
          }} />
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--cyan)'
        }}>
          <div className="loading-ring" style={{ width: 14, height: 14, borderWidth: 2 }} />
          <span>{title}</span>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: 110,
            background: 'rgba(26, 28, 38, 0.6)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.04), transparent)',
              animation: 'shimmer 2.2s infinite'
            }} />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div style={{
        flex: 1,
        minHeight: 320,
        background: 'rgba(26, 28, 38, 0.4)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}>
          <div className="loading-ring" style={{ width: 28, height: 28, borderWidth: 2 }} />
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.15em',
            color: 'var(--text-muted)'
          }}>
            SYNCHRONIZING SENSOR STREAMS...
          </div>
        </div>
      </div>
    </div>
  );
}
