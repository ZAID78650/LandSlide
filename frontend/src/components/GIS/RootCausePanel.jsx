import React, { useState } from 'react';

export default function RootCausePanel({ activeDisaster, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  // Default / dynamic root-cause chain based on active disaster
  const rootData = activeDisaster?.root_cause || {
    trigger: 'EXTREME MONSOON PRECIPITATION (142 mm / 24h)',
    soil_saturation: 'CRITICAL HYDROLOGIC PORE-WATER SATURATION (Ru = 72%)',
    slope_instability: 'LIMIT EQUILIBRIUM SHEAR FAILURE (FoS = 0.82 < 1.0)',
    ground_movement: 'COPERNICUS SENTINEL-1 InSAR DEFORMATION (18 mm/month creep)',
    landslide_risk: 'CATASTROPHIC PLANAR MASS DEBRIS RUNOUT HAZARD'
  };

  const steps = [
    {
      id: 1,
      tag: 'TRIGGER',
      title: 'HEAVY PRECIPITATION',
      icon: '🌧️',
      summary: rootData.trigger,
      evidenceType: 'IMD AWS & Open-Meteo Telemetry',
      metrics: [
        { label: 'Rainfall Intensity', val: '42.5 mm/hr' },
        { label: '24h Total Acc.', val: '142.8 mm' },
        { label: 'Threshold Exceeded', val: '+185%' }
      ],
      description: 'Persistent cloudburst convective cells saturated the upper catchment regolith, initiating intense infiltration beyond the hydrologic hydraulic conductivity threshold.'
    },
    {
      id: 2,
      tag: 'HYDROLOGY',
      title: 'SOIL PORE-WATER SATURATION',
      icon: '💧',
      summary: rootData.soil_saturation,
      evidenceType: 'Piezometer Telemetry & Hydrologic DEM',
      metrics: [
        { label: 'Pore Ratio (Ru)', val: '0.72' },
        { label: 'Volumetric Water', val: '58.4%' },
        { label: 'Buoyancy Effect', val: 'Elevated' }
      ],
      description: 'Infiltration converted positive effective stress into high buoyant pore-water pressure, reducing inter-granular friction along the colluvium-bedrock boundary.'
    },
    {
      id: 3,
      tag: 'GEOTECHNICS',
      title: 'SLOPE INSTABILITY (FoS < 1.0)',
      icon: '◢',
      summary: rootData.slope_instability,
      evidenceType: 'Mohr-Coulomb Limit Equilibrium',
      metrics: [
        { label: 'Factor of Safety', val: '0.82' },
        { label: 'Driving Stress', val: '46.8 kPa' },
        { label: 'Shear Resistance', val: '38.4 kPa' }
      ],
      description: 'Driving gravitational shear stress exceeded available resisting shear strength. The slope factor of safety dropped below the critical threshold (FoS < 1.0).'
    },
    {
      id: 4,
      tag: 'DEFORMATION',
      title: 'GROUND DISPLACEMENT',
      icon: '🛰️',
      summary: rootData.ground_movement,
      evidenceType: 'Copernicus Sentinel-1 InSAR Interferometry',
      metrics: [
        { label: 'Downslope Creep', val: '18 mm/month' },
        { label: 'Coherence Loss', val: '0.42 (High)' },
        { label: 'Surface Rupture', val: 'Tensile Scarp' }
      ],
      description: 'SAR phase interferometry detected progressive millimetric downslope deformation vectors confirming active creeping along the failure scarp plane.'
    },
    {
      id: 5,
      tag: 'HAZARD',
      title: 'MASS COLLAPSE & RUNOUT',
      icon: '🚨',
      summary: rootData.landslide_risk,
      evidenceType: 'Runout Simulation & Population Catchment',
      metrics: [
        { label: 'Runout Perimeter', val: '1,450 m' },
        { label: 'Velocity est.', val: '32 km/h' },
        { label: 'Hazard Severity', val: 'CRITICAL' }
      ],
      description: 'Gravitational acceleration of liquefied debris threatens valleys, road corridors, and lower residential settlements within the evacuation perimeter.'
    }
  ];

  return (
    <div style={{
      background: 'rgba(10, 14, 22, 0.96)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border-cyan)',
      borderRadius: 12,
      padding: '16px 20px',
      color: 'var(--text-primary)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 24px var(--cyan-glow)',
      animation: 'fadeInUp 0.3s ease-out',
      maxWidth: '100%',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔬</span>
          <div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: 13, fontWeight: 800, color: 'var(--cyan)', letterSpacing: '0.08em' }}>
              SCIENTIFIC ROOT CAUSE CORRELATION
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {activeDisaster ? activeDisaster.name || activeDisaster.title || 'ACTIVE HAZARD ZONE' : 'MULTI-HAZARD CAUSAL CHAIN'}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 18,
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: 4
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* 5-Step Pipeline Flow */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8,
        marginBottom: 16,
        overflowX: 'auto'
      }}>
        {steps.map((step, idx) => {
          const isSelected = activeStep === idx;
          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(idx)}
              style={{
                background: isSelected ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                borderRadius: 8,
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 4 }}>{step.icon}</div>
              <div style={{
                fontSize: 9,
                fontWeight: 800,
                color: isSelected ? 'var(--cyan)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                marginBottom: 2
              }}>
                STEP {step.id}
              </div>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                lineHeight: 1.2
              }}>
                {step.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Step Geographic Evidence Telemetry */}
      {steps[activeStep] && (
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '14px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="chip chip-cyan" style={{ fontSize: 9 }}>
                {steps[activeStep].tag}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {steps[activeStep].title}
              </span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Source: {steps[activeStep].evidenceType}
            </span>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
            {steps[activeStep].description}
          </p>

          {/* Metric telemetry cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {steps[activeStep].metrics.map((m, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                padding: '6px 10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
