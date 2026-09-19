import React from 'react';

export default function SimulationBanner() {
  const isSim = localStorage.getItem('nexus_sim_mode') === 'true';
  if (!isSim) return null;

  return (
    <div style={{ 
      background: 'rgba(255,59,92,0.15)', 
      border: '1px solid rgba(255,59,92,0.4)', 
      color: 'var(--text-primary)', 
      padding: '10px', 
      textAlign: 'center', 
      fontFamily: 'var(--font-mono)', 
      fontSize: '12px', 
      fontWeight: 'bold', 
      letterSpacing: '0.05em',
      width: '100%'
    }}>
      <span style={{ color: 'var(--red)' }}>⚡ SIMULATION MODE ACTIVE</span> — All data below is synthetic and does NOT represent real conditions.
    </div>
  );
}
