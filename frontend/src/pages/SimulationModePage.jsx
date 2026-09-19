import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend, ReferenceLine, Cell
} from 'recharts';

const CYAN = '#00e5ff';
const RED = '#ff3b5c';
const AMBER = '#ffb020';
const GREEN = '#22c55e';
const ORANGE = '#ff6b35';
const BLUE = '#2979ff';

const REAL_WORLD_ZONES = [
  {
    id: 'shimla',
    name: 'Shimla Summer Hill Sector 4',
    state: 'Himachal Pradesh',
    lat: 31.1048,
    lon: 77.1734,
    elevation: 2150,
    slopeAngle: 42.2,
    population: 14500,
    criticalInfra: 'NH-5 Kalka-Shimla Highway & Railway Substation',
    geology: 'Weathered Quartzite-Phyllite Colluvium',
    nominalFos: 1.42
  },
  {
    id: 'wayanad',
    name: 'Wayanad Meppadi Chooralmala',
    state: 'Kerala',
    lat: 11.5510,
    lon: 76.1280,
    elevation: 850,
    slopeAngle: 46.8,
    population: 28400,
    criticalInfra: 'Punnapuzha River Basin & Ghat Highway SH-59',
    geology: 'Lateritic Soil over Charnockite Bedrock',
    nominalFos: 1.38
  },
  {
    id: 'kullu',
    name: 'Kullu Valley Aut Portal',
    state: 'Himachal Pradesh',
    lat: 31.7450,
    lon: 77.2150,
    elevation: 1120,
    slopeAngle: 38.5,
    population: 9200,
    criticalInfra: 'Aut Tunnel North Portal & Beas River Hydro Conduit',
    geology: 'Fissured Granite Gneiss with Joint Planes',
    nominalFos: 1.45
  },
  {
    id: 'joshimath',
    name: 'Rishikesh-Joshimath NH-7 Scarp',
    state: 'Uttarakhand',
    lat: 30.5520,
    lon: 79.5670,
    elevation: 1890,
    slopeAngle: 44.5,
    population: 18600,
    criticalInfra: 'Char Dham Military Highway & Alaknanda Bridge',
    geology: 'Tectonic Shear Zone / Moraine Deposits',
    nominalFos: 1.32
  },
  {
    id: 'raigad',
    name: 'Raigad Mahad Hills (Taliye)',
    state: 'Maharashtra',
    lat: 18.0210,
    lon: 73.5420,
    elevation: 480,
    slopeAngle: 45.1,
    population: 6800,
    criticalInfra: 'Savitri River Lowlands & State Highway 97',
    geology: 'Deccan Trap Stratified Basalt Scarp',
    nominalFos: 1.39
  }
];

const PRESET_SCENARIOS = [
  {
    id: 1,
    title: '🌧️ Extreme Monsoon Cloudburst',
    desc: 'Simulates 115 mm/h cloudburst with rapid soil saturation and drainage liquefaction.',
    icon: '🌧️',
    rain: 115,
    eqMag: 2.1,
    wind: 45,
    saturation: 98,
    durationH: 36
  },
  {
    id: 2,
    title: '🌀 Super Cyclonic Landfall',
    desc: 'Cat-4 cyclonic gale with 190 km/h wind gusts, coastal storm surge, and 85 mm/h rain.',
    icon: '🌀',
    rain: 85,
    eqMag: 2.0,
    wind: 190,
    saturation: 92,
    durationH: 48
  },
  {
    id: 3,
    title: '🌎 Major Himalayan Strike-Slip (M7.1)',
    desc: 'M7.1 earthquake at 14km depth along Main Central Thrust with severe ground acceleration.',
    icon: '🌎',
    rain: 20,
    eqMag: 7.1,
    wind: 20,
    saturation: 55,
    durationH: 24
  },
  {
    id: 4,
    title: '⚡ Multi-Vector Cascade Catastrophe',
    desc: 'Simultaneous 140 mm/h deluge + M6.2 earthquake on already saturated mountain scarp.',
    icon: '⚡',
    rain: 140,
    eqMag: 6.2,
    wind: 95,
    saturation: 99,
    durationH: 72
  },
  {
    id: 5,
    title: '☀️ Post-Drought Flash Deluge',
    desc: 'Desiccated fissured soil crust overwhelmed by sudden 90 mm/h torrential rain.',
    icon: '☀️',
    rain: 90,
    eqMag: 1.8,
    wind: 35,
    saturation: 84,
    durationH: 30
  }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(6, 12, 22, 0.96)', border: '1px solid var(--border-cyan)', borderRadius: 6, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
      <div style={{ fontSize: 11, color: CYAN, fontFamily: 'var(--font-mono)', fontWeight: 800, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey || p.name} style={{ fontSize: 12, color: p.color || '#fff', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>{p.name}:</span>
          <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function SimulationModePage() {
  const [isActive, setIsActive] = useState(false);
  const [selectedZone, setSelectedZone] = useState(REAL_WORLD_ZONES[0]);
  const [logs, setLogs] = useState([]);

  // Environmental Stress Sliders
  const [rainfallMmH, setRainfallMmH] = useState(45);
  const [earthquakeMag, setEarthquakeMag] = useState(3.2);
  const [windSpeedKmh, setWindSpeedKmh] = useState(40);
  const [soilSaturationPct, setSoilSaturationPct] = useState(65);

  // Time-Step Temporal Simulation Controls (0 to 72 hours)
  const [simTimeHours, setSimTimeHours] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(5); // 1x, 5x, 15x, 60x

  const simTimerRef = useRef(null);

  useEffect(() => {
    const active = localStorage.getItem('nexus_sim_mode') === 'true';
    setIsActive(active);
    if (active) {
      setLogs([{ time: new Date().toLocaleTimeString(), msg: 'Mission Control: Simulation Mode ACTIVATED. Sandboxed telemetry stream.' }]);
    }
  }, []);

  const toggleSimMode = () => {
    const newState = !isActive;
    setIsActive(newState);
    localStorage.setItem('nexus_sim_mode', newState ? 'true' : 'false');
    window.dispatchEvent(new Event('nexus_sim_changed'));
    if (!newState) {
      setIsPlaying(false);
      setSimTimeHours(0);
      setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: 'Simulation Mode DEACTIVATED. Production telemetry restored.' }, ...prev]);
    } else {
      setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: 'Simulation Mode ACTIVATED. Multi-hazard physics stress engine engaged.' }, ...prev]);
    }
  };

  // Real-time time progression loop
  useEffect(() => {
    if (!isPlaying) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      return;
    }

    simTimerRef.current = setInterval(() => {
      setSimTimeHours(prev => {
        if (prev >= 72) {
          setIsPlaying(false);
          return 72;
        }
        const next = Math.min(72, prev + 1);

        // Generate physics logs at key time steps
        if (next === 12) {
          setLogs(l => [{ time: `+12:00h`, msg: `[INFILTRATION SPIKE] Piezometer pore pressure reached 95 kPa. Initial scarp micro-strain detected.` }, ...l]);
        } else if (next === 24) {
          setLogs(l => [{ time: `+24:00h`, msg: `[CREEP ACCELERATION] Driving shear force exceeds resisting limit. Colluvial tension cracks widen by 18mm.` }, ...l]);
        } else if (next === 36) {
          setLogs(l => [{ time: `+36:00h`, msg: `🚨 [CRITICAL RUPTURE] Factor of Safety degraded below 1.0! Major slope failure in progress. Evacuation mandatory.` }, ...l]);
        } else if (next === 48) {
          setLogs(l => [{ time: `+48:00h`, msg: `[DEBRIS FLOW EXPANSION] Runout inundation reaches downstream valley corridor. Road infrastructure severed.` }, ...l]);
        }

        return next;
      });
    }, Math.max(100, 1000 / simSpeed));

    return () => clearInterval(simTimerRef.current);
  }, [isPlaying, simSpeed]);

  const applyPreset = (s) => {
    setRainfallMmH(s.rain);
    setEarthquakeMag(s.eqMag);
    setWindSpeedKmh(s.wind);
    setSoilSaturationPct(s.saturation);
    setSimTimeHours(0);
    setIsPlaying(true);
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), msg: `Loaded Scenario: ${s.title} (Duration: ${s.durationH}h, Target: ${selectedZone.name})` },
      ...prev
    ]);
  };

  const resetSimulations = () => {
    setIsPlaying(false);
    setSimTimeHours(0);
    setRainfallMmH(45);
    setEarthquakeMag(3.2);
    setWindSpeedKmh(40);
    setSoilSaturationPct(65);
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: 'All simulation vectors reset to nominal baseline.' }, ...prev]);
  };

  // Dynamic physics calculations as time progresses
  // 1. Cumulative precipitation over simulated time
  const effectiveRain = rainfallMmH * (1 + (simTimeHours / 48));
  const cumulativeRainfallMm = Math.round((rainfallMmH * simTimeHours) / 3.2);
  const effectiveSaturation = Math.min(100, soilSaturationPct + (simTimeHours * (rainfallMmH / 60)));
  const porePressureKpa = Math.round(25 + (effectiveSaturation / 100) * 115 + (simTimeHours * 0.8));

  // 2. Factor of Safety degradation equation
  // FoS = nominalFos - precipitation_decay - earthquake_impact - pore_pressure_decay
  const rainPenalty = (effectiveRain / 150) * 0.45;
  const eqPenalty = earthquakeMag > 4.0 ? ((earthquakeMag - 4.0) / 4.0) * 0.42 : 0;
  const satPenalty = (effectiveSaturation / 100) * 0.35;
  const timeDecay = (simTimeHours / 72) * 0.28;

  const currentFoS = Math.max(0.55, Number((selectedZone.nominalFos - rainPenalty - eqPenalty - satPenalty - timeDecay).toFixed(2)));
  const isRupture = currentFoS < 1.0;
  const isMarginal = currentFoS >= 1.0 && currentFoS < 1.3;

  // 3. Slope displacement velocity
  const displacementRateMmh = isRupture
    ? Math.round(45 + Math.pow(simTimeHours, 1.8) * 2.5)
    : isMarginal
    ? +(1.2 + simTimeHours * 0.35).toFixed(1)
    : +(0.1 + (simTimeHours * 0.05)).toFixed(2);

  // 4. Composite Risk Score (0-100)
  const compositeRiskScore = Math.min(100, Math.round(
    ((1.6 - currentFoS) / 1.05) * 65 + (earthquakeMag / 8.0) * 20 + (effectiveSaturation / 100) * 15
  ));

  const simRiskLevel = compositeRiskScore >= 75 ? 'CRITICAL' : compositeRiskScore >= 55 ? 'HIGH' : compositeRiskScore >= 35 ? 'MODERATE' : 'LOW';

  // 5. Cascading infrastructure impact quantification
  const exposedPop = Math.min(selectedZone.population, Math.round(selectedZone.population * (compositeRiskScore / 100) * (simTimeHours / 40 + 0.3)));
  const housingDamaged = Math.round(exposedPop / 4.2);
  const roadsBlockedKm = +(Math.min(32, (compositeRiskScore / 100) * 24 + (isRupture ? 8 : 0))).toFixed(1);
  const sheltersCapacityFilled = Math.min(100, Math.round((exposedPop / (selectedZone.population * 0.6)) * 100));

  // Generate 72-Hour FoS Decay Curve
  const fosDecayChartData = [];
  for (let h = 0; h <= 72; h += 6) {
    const rPen = (effectiveRain / 150) * 0.45;
    const eqPen = earthquakeMag > 4.0 ? ((earthquakeMag - 4.0) / 4.0) * 0.42 : 0;
    const sPen = (Math.min(100, soilSaturationPct + (h * (rainfallMmH / 60))) / 100) * 0.35;
    const tDec = (h / 72) * 0.28;
    const f = Math.max(0.55, Number((selectedZone.nominalFos - rPen - eqPen - sPen - tDec).toFixed(2)));
    const pore = Math.round(25 + (Math.min(100, soilSaturationPct + (h * (rainfallMmH / 60))) / 100) * 115 + (h * 0.8));
    fosDecayChartData.push({
      time: `+${h}h`,
      fos: f,
      failureThreshold: 1.0,
      nominalThreshold: 1.3,
      porePressure: pore
    });
  }

  // Cascading impact exposure chart data
  const cascadeImpactBarData = [
    { metric: 'Exposed People (x100)', value: Math.round(exposedPop / 100), fill: RED },
    { metric: 'Housing Units Damaged', value: housingDamaged, fill: ORANGE },
    { metric: 'Blocked Roads (km)', value: Math.round(roadsBlockedKm * 10), fill: AMBER },
    { metric: 'Shelter Need (%)', value: sheltersCapacityFilled, fill: CYAN },
  ];

  const exportBriefing = () => {
    const data = {
      simulation_timestamp: new Date().toISOString(),
      target_vulnerable_zone: selectedZone,
      applied_vectors: {
        rainfall_intensity_mmh: rainfallMmH,
        cumulative_rainfall_mm: cumulativeRainfallMm,
        earthquake_magnitude: earthquakeMag,
        wind_gusts_kmh: windSpeedKmh,
        soil_saturation_pct: effectiveSaturation,
        pore_water_pressure_kpa: porePressureKpa
      },
      time_elapsed_hours: simTimeHours,
      geotechnical_evaluation: {
        factor_of_safety: currentFoS,
        rupture_status: isRupture ? 'CATACLYSMIC SLOPE FAILURE' : isMarginal ? 'PROGRESSIVE CREEP' : 'STABLE',
        displacement_rate_mmh: displacementRateMmh,
        composite_risk_score: compositeRiskScore,
        risk_level: simRiskLevel
      },
      cascading_impact: {
        population_at_risk: exposedPop,
        dwellings_affected: housingDamaged,
        transport_artery_severed_km: roadsBlockedKm,
        shelter_capacity_utilization_pct: sheltersCapacityFilled,
        critical_infrastructure: selectedZone.criticalInfra
      },
      recommended_directives: isRupture
        ? 'IMMEDIATE MANDATORY LEVEL-4 EVACUATION. Dispatched NDRF battalions and emergency air rescue.'
        : isMarginal
        ? 'STAGE 2 VOLUNTARY RELOCATION. Restrict heavy transit across mountain highways.'
        : 'CONTINUOUS TELEMETRIC SURVEILLANCE. Monitor piezometer arrays.'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIMULATION_MISSION_DOSSIER_${selectedZone.id.toUpperCase()}_+${simTimeHours}H.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 56px)', overflowY: 'auto', background: 'var(--bg-canvas)' }}>
      <style>{`
        @keyframes pulseCriticalFailure {
          0% { box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.8); border-color: rgba(255, 23, 68, 1); }
          50% { box-shadow: 0 0 35px 8px rgba(255, 23, 68, 0.4); border-color: #ff5252; }
          100% { box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.8); border-color: rgba(255, 23, 68, 1); }
        }
        @keyframes mudflowParticleFlow {
          0% { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes liveScanSweep {
          0% { top: -5%; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: 102%; opacity: 0.3; }
        }
      `}</style>

      {/* Top Header Deck */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--red)' }}>⚡ Simulation Mode &amp; What-If Stress Engine</span>
            <span style={{
              fontSize: 12, background: 'rgba(255, 59, 92, 0.15)', color: 'var(--red)',
              border: '1px solid var(--red)', padding: '3px 10px', borderRadius: 12, fontWeight: 800, fontFamily: 'var(--font-mono)'
            }}>
              Real-World Limit Equilibrium Physics · 72-Hour Cascade Modeling
            </span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Synthesize extreme multi-hazard crises. Tune precipitation, seismic shock, and pore pressure to model catastrophic slope rupture and infrastructure impacts.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={exportBriefing}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', borderRadius: 6, padding: '10px 16px',
              fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>📄</span>
            <span>Export Mission Dossier</span>
          </button>

          <button
            onClick={toggleSimMode}
            style={{
              background: isActive ? 'linear-gradient(135deg, #ff1744, #b71c1c)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-primary)',
              border: `1.5px solid ${isActive ? '#ff1744' : 'var(--border-default)'}`,
              padding: '10px 22px', borderRadius: 6,
              fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-mono)',
              boxShadow: isActive ? '0 0 25px rgba(255,23,68,0.6)' : 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <span>{isActive ? '⏹' : '▶'}</span>
            <span>{isActive ? 'DEACTIVATE SIMULATION' : 'ACTIVATE SIMULATION MODE'}</span>
          </button>
        </div>
      </div>

      {/* Target Geographic Zone Selector Ribbon */}
      <div className="panel" style={{ padding: '12px 18px', marginBottom: 20, background: 'rgba(10, 16, 28, 0.95)', border: '1.5px solid var(--border-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📍</span>
            <span style={{ fontSize: 12, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
              TARGET VULNERABLE SCARP:
            </span>
            <select
              value={selectedZone.id}
              onChange={(e) => {
                const z = REAL_WORLD_ZONES.find(item => item.id === e.target.value);
                if (z) {
                  setSelectedZone(z);
                  setLogs(l => [{ time: new Date().toLocaleTimeString(), msg: `Target zone focused: ${z.name} (${z.state}) · Slope: ${z.slopeAngle}°` }, ...l]);
                }
              }}
              style={{
                background: 'var(--bg-panel-high)', border: '1.5px solid var(--cyan)',
                color: '#ffffff', borderRadius: 6, padding: '6px 14px',
                fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', cursor: 'pointer'
              }}
            >
              {REAL_WORLD_ZONES.map(z => (
                <option key={z.id} value={z.id}>
                  {z.name}, {z.state} (Elevation: {z.elevation}m · Slope: {z.slopeAngle}° · Pop: {z.population.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 16, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            <span>BEDROCK: <strong style={{ color: '#ffffff' }}>{selectedZone.geology}</strong></span>
            <span>|</span>
            <span>CRITICAL INFRA: <strong style={{ color: '#ffb020' }}>{selectedZone.criticalInfra}</strong></span>
          </div>
        </div>
      </div>

      {/* ⏱️ REAL-TIME TEMPORAL ESCALATION ENGINE (PLAY/PAUSE/SCRUB 0-72h) ⏱️ */}
      <div className="panel" style={{
        padding: '16px 20px', marginBottom: 20,
        background: 'linear-gradient(90deg, rgba(6, 12, 22, 0.98), rgba(16, 24, 40, 0.98))',
        border: isRupture ? '2px solid #ff1744' : '1.5px solid var(--border-cyan)',
        boxShadow: isRupture ? '0 0 35px rgba(255, 23, 68, 0.35)' : '0 4px 20px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: CYAN, fontFamily: 'var(--font-mono)', fontWeight: 900 }}>
              ⏱️ 72-HOUR DISASTER ESCALATION TIMELINE:
            </span>
            <span style={{
              fontSize: 22, fontWeight: 900, color: isRupture ? '#ff4d6d' : isMarginal ? '#ffb020' : '#22c55e',
              fontFamily: 'var(--font-mono)', textShadow: isRupture ? '0 0 12px rgba(255,23,68,0.7)' : 'none'
            }}>
              +{simTimeHours.toString().padStart(2, '0')}:00 HOURS
            </span>
            {isRupture && (
              <span style={{
                background: '#ff1744', color: '#ffffff', padding: '3px 10px', borderRadius: 4,
                fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-mono)', animation: 'pulseCriticalFailure 2s infinite'
              }}>
                🚨 CATASTROPHIC RUPTURE ACTIVE
              </span>
            )}
          </div>

          {/* Time Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? 'rgba(255, 176, 32, 0.2)' : 'linear-gradient(135deg, #00e5ff, #0091ea)',
                color: isPlaying ? '#ffb020' : '#000000',
                border: `1.5px solid ${isPlaying ? '#ffb020' : 'var(--cyan)'}`,
                borderRadius: 5, padding: '6px 16px', fontSize: 12,
                fontWeight: 900, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
              <span>{isPlaying ? 'PAUSE' : 'PLAY SIMULATION'}</span>
            </button>

            <button
              onClick={() => setSimTimeHours(Math.min(72, simTimeHours + 6))}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
                color: '#ffffff', borderRadius: 5, padding: '6px 12px',
                fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', cursor: 'pointer'
              }}
            >
              +6h Step
            </button>

            <button
              onClick={() => setSimTimeHours(Math.min(72, simTimeHours + 12))}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
                color: '#ffffff', borderRadius: 5, padding: '6px 12px',
                fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', cursor: 'pointer'
              }}
            >
              +12h Step
            </button>

            {/* Speed Selector */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: 5, padding: 2, border: '1px solid var(--border-subtle)' }}>
              {[1, 5, 15, 60].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  style={{
                    background: simSpeed === spd ? 'var(--cyan)' : 'transparent',
                    color: simSpeed === spd ? '#000000' : 'var(--text-secondary)',
                    border: 'none', borderRadius: 3, padding: '4px 8px',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              onClick={() => { setSimTimeHours(0); setIsPlaying(false); }}
              style={{
                background: 'rgba(255, 59, 92, 0.15)', border: '1px solid var(--red)',
                color: 'var(--red)', borderRadius: 5, padding: '6px 12px',
                fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', cursor: 'pointer'
              }}
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Scrubbing Range Slider */}
        <input
          type="range" min="0" max="72" step="1"
          value={simTimeHours} onChange={(e) => setSimTimeHours(Number(e.target.value))}
          style={{ width: '100%', accentColor: isRupture ? '#ff1744' : 'var(--cyan)', cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
          <span>T-00h: Baseline Quiescent</span>
          <span>+12h: Infiltration Front</span>
          <span>+24h: Piezometer Surge</span>
          <span style={{ color: '#ffb020' }}>+36h: Tension Cracks</span>
          <span style={{ color: '#ff4d6d' }}>+48h: Catastrophic Rupture</span>
          <span style={{ color: '#ff1744' }}>+72h: Peak Valley Inundation</span>
        </div>
      </div>

      {/* Main Grid: Hazard Vectors + Real-Time Slope Rupture Canvas + Output Report */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 1.1fr', gap: 16, marginBottom: 24 }}>
        
        {/* PANEL 1: Interactive Vector Tuner & Presets */}
        <div className="panel">
          <div className="panel-header">
            <span className="label-caps">1. SYNTHETIC HAZARD VECTOR TUNER</span>
          </div>
          <div className="panel-body">
            {/* Slider 1: Rainfall */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>🌧️ Precipitation Rate</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 900 }}>
                  {rainfallMmH} mm/h ({cumulativeRainfallMm} mm Cum.)
                </span>
              </div>
              <input
                type="range" min="0" max="150" value={rainfallMmH}
                onChange={e => setRainfallMmH(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>0 mm/h (Dry)</span>
                <span>50 mm/h (Threshold)</span>
                <span>150 mm/h (Cloudburst)</span>
              </div>
            </div>

            {/* Slider 2: Seismic Shock */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>🌎 Regional Seismic Shock</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#ffb020', fontWeight: 900 }}>
                  M{earthquakeMag.toFixed(1)} {earthquakeMag >= 6.0 ? '🔴 (Destructive)' : earthquakeMag >= 4.5 ? '🟡 (Moderate)' : '🟢 (Micro-tremor)'}
                </span>
              </div>
              <input
                type="range" min="1.0" max="8.5" step="0.1" value={earthquakeMag}
                onChange={e => setEarthquakeMag(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ffb020' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>M1.0 (Minor)</span>
                <span>M5.0 (Moderate)</span>
                <span>M8.5 (Great Himalayan)</span>
              </div>
            </div>

            {/* Slider 3: Soil Saturation */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>💧 Pore-Water Saturation</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#60a5fa', fontWeight: 900 }}>
                  {effectiveSaturation}% ({porePressureKpa} kPa Head)
                </span>
              </div>
              <input
                type="range" min="10" max="100" value={soilSaturationPct}
                onChange={e => setSoilSaturationPct(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#60a5fa' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>10% (Drained)</span>
                <span>75% (Perched Table)</span>
                <span>100% (Liquefaction)</span>
              </div>
            </div>

            {/* Slider 4: Wind Speed */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>🌀 Cyclonic Wind Velocity</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--orange)', fontWeight: 900 }}>
                  {windSpeedKmh} km/h
                </span>
              </div>
              <input
                type="range" min="10" max="220" value={windSpeedKmh}
                onChange={e => setWindSpeedKmh(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--orange)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>10 km/h</span>
                <span>100 km/h (Storm)</span>
                <span>220 km/h (Super Cyclone)</span>
              </div>
            </div>

            {/* Preset Scenario Cards */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 800, marginBottom: 8 }}>
                LOAD REAL-WORLD CRISIS PRESETS:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PRESET_SCENARIOS.slice(0, 4).map(s => (
                  <button
                    key={s.id}
                    onClick={() => applyPreset(s)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6, padding: '8px 10px',
                      textAlign: 'left', cursor: 'pointer',
                      fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{s.icon}</span>
                      <strong style={{ fontSize: 11 }}>{s.title.slice(3)}</strong>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--cyan)' }}>Load ➔</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 2: Real-Time Slope Failure Cross-Section & Geotechnical Canvas */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px' }}>
            <span style={{ fontSize: 12, color: CYAN, fontFamily: 'var(--font-mono)', fontWeight: 900 }}>
              ⛰️ REAL-TIME SLOPE FAILURE DYNAMICS (BISHOP SLICE MODEL)
            </span>
            <span style={{ fontSize: 11, color: isRupture ? '#ff4d6d' : '#22c55e', fontFamily: 'var(--font-mono)', fontWeight: 900 }}>
              {isRupture ? '🔴 ACTIVE RUPTURE SLIP' : isMarginal ? '🟡 CREEP SHEAR' : '🟢 STABLE'}
            </span>
          </div>

          <div style={{ position: 'relative', flex: 1, minHeight: 340, background: '#04070d', overflow: 'hidden' }}>
            {/* SVG Slope Profile & Dynamic Slip Circle */}
            <svg viewBox="0 0 450 320" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="rockGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="waterTableGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(0, 229, 255, 0.6)" />
                  <stop offset="100%" stopColor="rgba(41, 121, 255, 0.2)" />
                </linearGradient>
                <linearGradient id="failureRuptureGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255, 23, 68, 0.8)" />
                  <stop offset="100%" stopColor="rgba(255, 107, 53, 0.4)" />
                </linearGradient>
              </defs>

              {/* Bedrock Polygon */}
              <polygon points="0,320 0,60 140,70 320,240 450,270 450,320" fill="url(#rockGrad)" stroke="#334155" strokeWidth="2" />

              {/* Dynamic Water Table Level (Rises with Saturation) */}
              <polygon
                points={`0,320 0,${160 - (effectiveSaturation / 100) * 80} 140,${150 - (effectiveSaturation / 100) * 70} 320,${250 - (effectiveSaturation / 100) * 20} 450,280 450,320`}
                fill="url(#waterTableGrad)"
                style={{ transition: 'all 0.5s ease' }}
              />

              {/* Crown Scarp Tension Crack */}
              <line x1="140" y1="70" x2="155" y2="120" stroke={isRupture ? '#ff1744' : '#ffb020'} strokeWidth={isRupture ? 4 : 2} strokeDasharray="3 3" />
              <text x="145" y="60" fill="#fff" fontSize="10" fontFamily="monospace" fontWeight="800">Crown Scarp ({selectedZone.elevation}m)</text>

              {/* Arc of Slip Surface (Bishop Circle) */}
              <path
                d="M 140,70 Q 230,170 320,240"
                fill="none"
                stroke={isRupture ? '#ff1744' : isMarginal ? '#ffb020' : '#22c55e'}
                strokeWidth={isRupture ? 4.5 : 2.5}
                strokeDasharray={isRupture ? '6 3' : 'none'}
                style={isRupture ? { animation: 'mudflowParticleFlow 1s linear infinite' } : {}}
              />

              {/* Unstable Sliding Mass Polygon (When in Rupture) */}
              {isRupture && (
                <polygon
                  points="140,70 190,120 320,240 280,245 190,140"
                  fill="url(#failureRuptureGrad)"
                  stroke="#ff1744"
                  strokeWidth="1.5"
                />
              )}

              {/* Valley Infrastructure & Runout Toe */}
              <circle cx="340" cy="245" r="5" fill="#ffb020" />
              <text x="348" y="248" fill="#ffd54f" fontSize="10" fontFamily="monospace" fontWeight="700">Highway &amp; Settlement Toe</text>

              {/* Slope Angle Indicator */}
              <text x="210" y="195" fill={CYAN} fontSize="11" fontFamily="monospace" fontWeight="900">
                θ: {selectedZone.slopeAngle}° STEEP
              </text>
            </svg>

            {/* Live Cross-Section HUD Overlay */}
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: 'rgba(6, 12, 22, 0.92)', border: '1px solid var(--border-cyan)',
              borderRadius: 6, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11
            }}>
              <div>DISPLACEMENT VELOCITY: <strong style={{ color: isRupture ? '#ff4d6d' : '#22c55e' }}>{displacementRateMmh} mm/h</strong></div>
              <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>PORE PRESSURE: <strong style={{ color: CYAN }}>{porePressureKpa} kPa</strong></div>
            </div>

            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              background: 'rgba(6, 12, 22, 0.92)', border: `1px solid ${isRupture ? '#ff1744' : '#22c55e'}`,
              borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900
            }}>
              FoS: <span style={{ color: isRupture ? '#ff4d6d' : '#22c55e' }}>{currentFoS}</span> ({isRupture ? 'FAILURE' : 'STABLE'})
            </div>
          </div>
        </div>

        {/* PANEL 3: Simulated Cascade Impact Report & Civil Defense Directives */}
        <div className="panel" style={{
          borderColor: isRupture ? '#ff1744' : isMarginal ? '#ffb020' : 'var(--border-cyan)',
          boxShadow: isRupture ? '0 0 25px rgba(255, 23, 68, 0.3)' : 'none'
        }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label-caps">2. CASCADE IMPACT REPORT</span>
            <span style={{
              background: isRupture ? 'rgba(255,23,68,0.25)' : isMarginal ? 'rgba(255,176,32,0.25)' : 'rgba(34,197,94,0.25)',
              color: isRupture ? '#ff4d6d' : isMarginal ? '#ffb020' : '#22c55e',
              border: `1px solid ${isRupture ? '#ff1744' : isMarginal ? '#ffb020' : '#22c55e'}`,
              padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-mono)'
            }}>
              [SIM] {simRiskLevel} THREAT
            </span>
          </div>
          <div className="panel-body">
            {/* Hero Metric */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SYNTHETIC RISK</div>
                <div style={{
                  fontSize: 44, fontWeight: 900, fontFamily: 'var(--font-mono)',
                  color: isRupture ? '#ff4d6d' : isMarginal ? '#ffb020' : '#22c55e', lineHeight: 1
                }}>
                  {compositeRiskScore}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>/ 100</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 3 }}>
                  Factor of Safety: <strong style={{ color: isRupture ? '#ff4d6d' : '#22c55e' }}>{currentFoS}</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3, marginBottom: 6 }}>
                  {isRupture
                    ? '🔴 CRITICAL FAILURE — Resisting shear strength collapsed under saturation. Rapid runout active.'
                    : isMarginal
                    ? '🟡 MARGINAL CREEP — Tension cracks actively propagating along quartz phyllite plane.'
                    : '🟢 STABLE NOMINAL — Resisting strength exceeds driving shear force.'}
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${compositeRiskScore}%`, height: '100%',
                    background: isRupture ? '#ff1744' : isMarginal ? '#ffb020' : '#22c55e',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* Cascading Infrastructure Exposure */}
            <div style={{ marginBottom: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 6 }}>
                EXPOSED CIVIL INFRASTRUCTURE (+{simTimeHours}h):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Exposed Population:</span>
                  <strong style={{ color: isRupture ? '#ff4d6d' : '#fff' }}>{exposedPop.toLocaleString()} citizens</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Housing Units Damaged:</span>
                  <strong style={{ color: ORANGE }}>{housingDamaged} dwellings</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Highway Blockage:</span>
                  <strong style={{ color: '#ffb020' }}>{roadsBlockedKm} km severed</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Shelter Capacity Demand:</span>
                  <strong style={{ color: CYAN }}>{sheltersCapacityFilled}% utilized</strong>
                </div>
              </div>
            </div>

            {/* Recommended Civil Defense Directive */}
            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, color: CYAN, fontFamily: 'var(--font-mono)', fontWeight: 800, marginBottom: 4 }}>
                CIVIL PROTECTION DIRECTIVE:
              </div>
              <div style={{ fontSize: 11, color: '#ffffff', lineHeight: 1.4 }}>
                {isRupture
                  ? 'STAGE 4 MANDATORY EVACUATION: Immediate airborne extraction of toe settlements. Sever power grid to prevent electrical ignition. Mobilize 3 NDRF battalions.'
                  : isMarginal
                  ? 'STAGE 2 VOLUNTARY RELOCATION: Divert commercial haulage from mountain highways. Deploy geotechnical piezometer alert beacon.'
                  : 'STAGE 1 NOMINAL SURVEILLANCE: Normal sensor polling interval maintained.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📈 DETAILED GRAPHS: FoS DECAY CURVE & CASCADING IMPACT MATRIX 📈 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Factor of Safety Decay Curve over 72h */}
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px' }}>
            <span style={{ fontSize: 12, color: CYAN, fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
              📉 72-HOUR FACTOR OF SAFETY (FoS) DEGRADATION &amp; PORE PRESSURE TRAJECTORY
            </span>
            <span style={{ fontSize: 11, color: RED, fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
              FAILURE THRESHOLD = 1.0
            </span>
          </div>
          <div style={{ padding: 18 }}>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={fosDecayChartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" tick={{ fill: '#8a9aaa', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.4, 1.6]} tick={{ fill: '#8a9aaa', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', paddingTop: 6 }} />
                <ReferenceLine y={1.0} stroke="#ff1744" strokeDasharray="4 4" label={{ value: 'RUPTURE (1.0)', fill: '#ff1744', fontSize: 10, position: 'right' }} />
                <Line type="monotone" dataKey="fos" name="Factor of Safety (FoS)" stroke="#ff1744" strokeWidth={3} dot={{ r: 4, fill: '#ff1744' }} />
                <Line type="monotone" dataKey="nominalThreshold" name="Nominal Margin (1.3)" stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cascading Infrastructure Exposure Bar Chart */}
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header" style={{ padding: '12px 18px' }}>
            <span style={{ fontSize: 12, color: CYAN, fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
              📊 CASCADING CIVIL IMPACT QUANTIFICATION
            </span>
          </div>
          <div style={{ padding: 18 }}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={cascadeImpactBarData} layout="vertical" margin={{ top: 8, right: 18, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={{ fill: '#8a9aaa', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {cascadeImpactBarData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 📡 MISSION CONTROL AUDIT TELEMETRY TERMINAL 📡 */}
      <div className="panel" style={{ padding: 0 }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px' }}>
          <span style={{ fontSize: 12, color: CYAN, fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
            🖥️ MISSION CONTROL AUDIT LOG &amp; GEOTECHNICAL DISPATCH TERMINAL
          </span>
          <span style={{ fontSize: 11, color: GREEN, fontFamily: 'var(--font-mono)' }}>
            PHYSICS TELEMETRY STREAM
          </span>
        </div>
        <div style={{ background: '#03060c', padding: 16, maxHeight: 180, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          {logs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: 4, display: 'flex', gap: 10 }}>
              <span style={{ color: CYAN, flexShrink: 0 }}>[{log.time}]</span>
              <span style={{ color: log.msg.includes('CRITICAL') || log.msg.includes('ACTIVATED') ? '#ff4d6d' : '#cbd5e1' }}>
                {log.msg}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div style={{ color: 'var(--text-muted)' }}>No simulation events logged yet. Adjust sliders or press Play.</div>
          )}
        </div>
      </div>
    </div>
  );
}
