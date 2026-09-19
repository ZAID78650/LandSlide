import React, { useState, useEffect } from 'react';

const PRESET_SCENARIOS = [
  { id: 1, title: '🌧️ Extreme Monsoon Cloudburst', desc: 'Simulates 95 mm/h extreme precipitation over steep debris slope.', icon: '🌧️', rain: 95, eqMag: 2.1, wind: 35, saturation: 96 },
  { id: 2, title: '🌀 Super Cyclonic Landfall', desc: 'Simulates Cat-3 cyclonic wind field with 180 km/h gusts and storm surge.', icon: '🌀', rain: 65, eqMag: 1.5, wind: 180, saturation: 88 },
  { id: 3, title: '🌎 Major Himalayan Strike-Slip', desc: 'Simulates M6.8 earthquake at 12km focal depth along Main Central Thrust.', icon: '🌎', rain: 15, eqMag: 6.8, wind: 15, saturation: 45 },
  { id: 4, title: '🌋 Volcanic Caldera Reactivation', desc: 'Simulates VEI-4 phreatomagmatic unrest with harmonic tremors.', icon: '🌋', rain: 20, eqMag: 4.8, wind: 40, saturation: 50 },
  { id: 5, title: '🔴 IoT Sensor Network Cascade Failure', desc: 'Marks multiple critical geotechnical stations as offline.', icon: '🔴', rain: 40, eqMag: 2.0, wind: 25, saturation: 70 },
  { id: 6, title: '⚡ Multi-Vector Cascade Catastrophe', desc: 'Simultaneous cloudburst (120mm/h) + M5.5 earthquake on saturated scarp.', icon: '⚡', rain: 120, eqMag: 5.5, wind: 85, saturation: 99 },
];

export default function SimulationModePage() {
  const [isActive, setIsActive] = useState(false);
  const [activeScenarios, setActiveScenarios] = useState([]);
  const [logs, setLogs] = useState([]);

  // Interactive parameter sliders
  const [rainfallMmH, setRainfallMmH] = useState(45);
  const [earthquakeMag, setEarthquakeMag] = useState(3.2);
  const [windSpeedKmh, setWindSpeedKmh] = useState(40);
  const [soilSaturationPct, setSoilSaturationPct] = useState(65);

  useEffect(() => {
    setIsActive(localStorage.getItem('nexus_sim_mode') === 'true');
  }, []);

  const toggleSimMode = () => {
    const newState = !isActive;
    setIsActive(newState);
    localStorage.setItem('nexus_sim_mode', newState ? 'true' : 'false');
    window.dispatchEvent(new Event('nexus_sim_changed'));
    if (!newState) {
      setActiveScenarios([]);
      setLogs([{ time: new Date().toLocaleTimeString(), msg: 'Simulation Mode DEACTIVATED.' }]);
    } else {
      setLogs([{ time: new Date().toLocaleTimeString(), msg: 'Simulation Mode ACTIVATED. Sandboxed from real-time data.' }]);
    }
  };

  const applyPreset = (s) => {
    setRainfallMmH(s.rain);
    setEarthquakeMag(s.eqMag);
    setWindSpeedKmh(s.wind);
    setSoilSaturationPct(s.saturation);
    if (!activeScenarios.includes(s.id)) {
      setActiveScenarios(prev => [...prev, s.id]);
    }
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), msg: `Loaded parameters for: ${s.title}` },
      ...prev
    ]);
  };

  const resetSimulations = () => {
    setActiveScenarios([]);
    setRainfallMmH(45);
    setEarthquakeMag(3.2);
    setWindSpeedKmh(40);
    setSoilSaturationPct(65);
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: 'All simulation parameters reset to nominal baseline.' }, ...prev]);
  };

  // Dynamic calculation of simulated risk
  const simRainScore = Math.min(40, (rainfallMmH / 100) * 40);
  const simEqScore = Math.min(30, (earthquakeMag / 7.0) * 30);
  const simSatScore = Math.min(20, (soilSaturationPct / 100) * 20);
  const simWindScore = Math.min(10, (windSpeedKmh / 160) * 10);
  const simCompositeScore = Math.min(100, Math.round(simRainScore + simEqScore + simSatScore + simWindScore));

  const simFoS = Math.max(0.65, Number((1.8 - (soilSaturationPct / 100) * 0.7 - (earthquakeMag > 4.5 ? 0.4 : 0) - (rainfallMmH > 60 ? 0.3 : 0)).toFixed(2)));
  const simRiskLevel = simCompositeScore >= 75 ? 'CRITICAL' : simCompositeScore >= 55 ? 'HIGH' : simCompositeScore >= 35 ? 'MODERATE' : 'LOW';

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: 4, color: 'var(--red)' }}>⚡ Simulation Mode & What-If Stress Engine</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
              Synthesize extreme multi-hazard scenarios. Tune environmental vectors and audit predicted cascade impact without affecting live data streams.
            </p>
          </div>
          <button 
            onClick={toggleSimMode}
            className="btn"
            style={{ 
              background: isActive ? 'var(--red)' : 'transparent', 
              color: isActive ? '#fff' : 'var(--text-primary)',
              border: `1px solid ${isActive ? 'var(--red)' : 'var(--border-default)'}`,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 800,
              boxShadow: isActive ? '0 0 20px rgba(255,59,92,0.4)' : 'none',
            }}
          >
            {isActive ? '⏹ DEACTIVATE SIMULATION MODE' : '▶ ACTIVATE SIMULATION MODE'}
          </button>
        </div>
      </div>

      {isActive && (
        <div style={{
          background: 'rgba(255,59,92,0.12)',
          border: '1px solid var(--red)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--red)', letterSpacing: '0.08em' }}>
                [SIMULATION MODE ACTIVE] — SYNTHETIC DATA STREAM
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                All generated alerts, risk scores, and telemetry are isolated. Production datasets remain strictly untouched.
              </div>
            </div>
          </div>
          <button onClick={resetSimulations} className="btn btn-secondary btn-sm">
            RESET PARAMETERS
          </button>
        </div>
      )}

      {/* Main Grid: Parameters + Output */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Left: Interactive Parameter Sliders */}
        <div className="panel">
          <div className="panel-header">
            <span className="label-caps">1. SYNTHETIC HAZARD VECTOR TUNER</span>
          </div>
          <div className="panel-body">
            {/* Slider 1: Rainfall */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>🌧️ Precipitation Intensity</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 800 }}>
                  {rainfallMmH} mm/h {rainfallMmH > 65 ? '🔴 (Extreme Cloudburst)' : rainfallMmH > 35 ? '🟡 (Heavy Monsoon)' : '🟢 (Normal)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                value={rainfallMmH}
                onChange={e => setRainfallMmH(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>0 mm/h (Dry)</span>
                <span>50 mm/h (Threshold)</span>
                <span>150 mm/h (Catastrophic)</span>
              </div>
            </div>

            {/* Slider 2: Earthquake */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>🌎 Regional Seismic Shock</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#ffb020', fontWeight: 800 }}>
                  M{earthquakeMag.toFixed(1)} {earthquakeMag >= 6.0 ? '🔴 (Severe Destruction)' : earthquakeMag >= 4.5 ? '🟡 (Moderate Shock)' : '🟢 (Micro-tremor)'}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="8.5"
                step="0.1"
                value={earthquakeMag}
                onChange={e => setEarthquakeMag(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ffb020' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>M1.0 (Imperceptible)</span>
                <span>M5.0 (Moderate)</span>
                <span>M8.5 (Great Himalayan)</span>
              </div>
            </div>

            {/* Slider 3: Soil Saturation */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>💧 Pore-Water Saturation</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#60a5fa', fontWeight: 800 }}>
                  {soilSaturationPct}% {soilSaturationPct >= 90 ? '🔴 (Liquefaction Imminent)' : soilSaturationPct >= 70 ? '🟡 (High Hydrostatic Head)' : '🟢 (Drained)'}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={soilSaturationPct}
                onChange={e => setSoilSaturationPct(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#60a5fa' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>10% (Field Capacity)</span>
                <span>75% (Perched Water Table)</span>
                <span>100% (Fully Saturated)</span>
              </div>
            </div>

            {/* Slider 4: Wind Speed */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>🌀 Gale / Cyclonic Gusts</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--orange)', fontWeight: 800 }}>
                  {windSpeedKmh} km/h {windSpeedKmh >= 130 ? '🔴 (Extremely Severe Cyclone)' : windSpeedKmh >= 70 ? '🟡 (Gale Force)' : '🟢 (Breeze)'}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="220"
                value={windSpeedKmh}
                onChange={e => setWindSpeedKmh(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--orange)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>10 km/h</span>
                <span>100 km/h (Storm)</span>
                <span>220 km/h (Super Cyclone)</span>
              </div>
            </div>

            {/* Presets */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                LOAD SIMULATION PRESET SCENARIO
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {PRESET_SCENARIOS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => applyPreset(s)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>{s.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{s.title.slice(3)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Predicted Cascade Output Card */}
        <div className="panel" style={{
          borderColor: simRiskLevel === 'CRITICAL' ? 'var(--red)' : simRiskLevel === 'HIGH' ? 'var(--orange)' : 'var(--border-cyan)',
        }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label-caps">2. SIMULATED CASCADE IMPACT REPORT</span>
            <span className={`chip ${simRiskLevel === 'CRITICAL' ? 'chip-red' : simRiskLevel === 'HIGH' ? 'chip-orange' : 'chip-amber'}`}>
              [SIM] {simRiskLevel} HAZARD
            </span>
          </div>
          <div className="panel-body">
            <div style={{
              background: 'rgba(255,59,92,0.08)',
              border: '1px solid rgba(255,59,92,0.3)',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--red)',
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: 16,
            }}>
              ⚠️ SYNTHETIC MODEL PROJECTION — FOR STRESS-TESTING ONLY
            </div>

            {/* Hero metric */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SIMULATED RISK</div>
                <div style={{
                  fontSize: 48, fontWeight: 900, fontFamily: 'var(--font-mono)',
                  color: simRiskLevel === 'CRITICAL' ? 'var(--red)' : simRiskLevel === 'HIGH' ? 'var(--orange)' : 'var(--amber)',
                  lineHeight: 1,
                }}>
                  {simCompositeScore}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>/ 100</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  Predicted Factor of Safety (FoS): <span style={{ color: simFoS < 1.0 ? 'var(--red)' : simFoS < 1.3 ? 'var(--amber)' : 'var(--green)' }}>{simFoS}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 8 }}>
                  {simFoS < 1.0 ? '🔴 CRITICAL FAILURE — Driving shear stress exceeds resisting shear strength. Rapid debris flow triggered.'
                    : simFoS < 1.3 ? '🟡 MARGINAL STABILITY — Progressive creep deformation expected along colluvial boundary.'
                    : '🟢 STABLE NOMINAL — Retains sufficient safety margin under applied stress.'}
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${simCompositeScore}%`, height: '100%',
                    background: simRiskLevel === 'CRITICAL' ? 'var(--red)' : simRiskLevel === 'HIGH' ? 'var(--orange)' : 'var(--amber)',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            </div>

            {/* Contributing Simulated Vectors */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 8 }}>
                SIMULATED STRESS BREAKDOWN
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Precipitation Loading:</span>
                  <span style={{ color: 'var(--cyan)' }}>+{simRainScore.toFixed(0)} pts ({rainfallMmH} mm/h)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ground Motion Inertia:</span>
                  <span style={{ color: '#ffb020' }}>+{simEqScore.toFixed(0)} pts (M{earthquakeMag.toFixed(1)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hydrostatic Pore Pressure:</span>
                  <span style={{ color: '#60a5fa' }}>+{simSatScore.toFixed(0)} pts ({soilSaturationPct}% Sat)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Aerodynamic Drag:</span>
                  <span style={{ color: 'var(--orange)' }}>+{simWindScore.toFixed(0)} pts ({windSpeedKmh} km/h)</span>
                </div>
              </div>
            </div>

            {/* Predicted Tactical Protocols */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                RECOMMENDED SIMULATED DIRECTIVE
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {simRiskLevel === 'CRITICAL'
                  ? 'Initiate Level-3 emergency evacuation protocol for downstream settlements. Pre-alert state SDRF quick response teams within 45km.'
                  : simRiskLevel === 'HIGH'
                  ? 'Issue high-frequency telemetry alerts to district disaster officers. Deploy mobile satellite uplinks to monitoring nodes.'
                  : 'Maintain heightened sensor polling rate. Monitor pore pressure fluctuations at 5-minute intervals.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Audit Log */}
      <div className="panel">
        <div className="panel-header">
          <span className="label-caps">SIMULATION ACTIVITY AUDIT LOG</span>
        </div>
        <div className="panel-body" style={{ background: '#05070a', maxHeight: 180, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          {logs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: 4, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--cyan)' }}>[{log.time}]</span>
              <span style={{ color: log.msg.includes('ACTIVATED') ? 'var(--red)' : 'var(--text-secondary)' }}>{log.msg}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div style={{ color: 'var(--text-muted)' }}>No simulation events logged yet. Activate mode or adjust sliders above.</div>
          )}
        </div>
      </div>
    </div>
  );
}
