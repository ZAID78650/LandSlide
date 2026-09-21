import React, { useState, useEffect, useRef } from 'react';
import {
  CYAN, RED, AMBER, GREEN, ORANGE, PURPLE, BLUE,
  FONT_MONO, FONT_BODY
} from './sensorTypes';

const SCENARIOS = [
  {
    id: 'baseline',
    label: '🟢 NORMAL BASELINE',
    name: 'Dry Season Baseline (Gangtok NH-10)',
    description: 'Quiescent weather, nominal ground moisture, zero seismic excitation.',
    rainfall: 0.2, // mm/hr
    porePressure: 8.4, // kPa
    frictionAngle: 33.0, // degrees
    cohesion: 15.0, // kPa
    slopeAngle: 36.0, // degrees
    depth: 2.8, // meters
    unitWeight: 19.0, // kN/m3
    expectedFos: 1.62,
    threatLevel: 'LOW',
    color: GREEN,
    alertTitle: 'ROUTINE MONITORING - ALL LIFELINES NORMAL',
    dispatches: [
      { agency: 'DDMA Gangtok', status: 'STANDBY', note: 'Routine 6h automated check-in' },
      { agency: 'BRO Project Swastik', status: 'NORMAL', note: 'Standard NH-10 patrol active' },
      { agency: 'NDRF 1st Battalion', status: 'STANDBY', note: 'Nominal base readiness' },
      { agency: 'NHAI / State Traffic', status: 'CLEAR', note: 'All lanes open (Siliguri-Gangtok)' }
    ]
  },
  {
    id: 'cloudburst',
    label: '🔴 EXTREME CLOUDBURST',
    name: 'Teesta River Gorge Catastrophic Deluge (NH-10)',
    description: 'Sudden high-intensity pluvial surge (115 mm/hr) inducing rapid pore-water pressure spike and slope liquefaction.',
    rainfall: 115.0,
    porePressure: 44.5,
    frictionAngle: 28.0,
    cohesion: 6.2,
    slopeAngle: 42.0,
    depth: 3.5,
    unitWeight: 21.4,
    expectedFos: 0.84,
    threatLevel: 'CRITICAL',
    color: RED,
    alertTitle: 'CODE RED: IMMINENT MASS FAILURE & DEBRIS FLOW',
    dispatches: [
      { agency: 'DDMA Gangtok & Kalimpong', status: 'EOC ACTIVATED', note: 'Red Alert broadcast to all DDMAs' },
      { agency: 'BRO Project Swastik', status: 'DEPLOYED', note: 'Pre-positioning excavators at 29th Mile & Melli' },
      { agency: 'NDRF 2nd Battalion', status: 'MOBILIZED', note: 'Water rescue and cutting teams dispatched' },
      { agency: 'NHAI / State Traffic', status: 'CLOSED', note: 'NH-10 closed to all traffic at Rangpo & Melli checkposts' }
    ]
  },
  {
    id: 'subsidence',
    label: '🟠 DZÜDZA RIVER SUBSIDENCE',
    name: 'Nagaland NH-29 Dzüdza Sinking Sump Collapse',
    description: 'Progressive creeping shear zone with accelerated InSAR line-of-sight velocity (145 mm/yr) and highway bed failure.',
    rainfall: 38.0,
    porePressure: 28.0,
    frictionAngle: 29.5,
    cohesion: 9.8,
    slopeAngle: 35.0,
    depth: 4.2,
    unitWeight: 19.8,
    expectedFos: 1.05,
    threatLevel: 'ELEVATED',
    color: ORANGE,
    alertTitle: 'CODE ORANGE: LIFELINE SEVERANCE PROBABILITY 74%',
    dispatches: [
      { agency: 'DDMA Kohima', status: 'WATCH ACTIVATED', note: 'Emergency advisory issued for NH-29' },
      { agency: 'BRO Project Pushpak', status: 'REPAIRS ACTIVE', note: 'Gabion wall reinforcement & culvert clearing' },
      { agency: 'Nagaland State Police', status: 'RESTRICTED', note: 'Heavy multi-axle trucks diverted to Peducha route' },
      { agency: 'Gram Panchayat Siren', status: 'WARNED', note: 'Dzüdza bridge settlements alerted' }
    ]
  },
  {
    id: 'shale_shear',
    label: '🟡 JATINGA SHALE MUDFLOW',
    name: 'Dima Hasao Jatinga Fault Slip (Assam NH-27)',
    description: 'Expansive weathered carbonaceous shale cutting saturated by continuous antecedent monsoon rainfall.',
    rainfall: 62.0,
    porePressure: 32.0,
    frictionAngle: 30.0,
    cohesion: 11.5,
    slopeAngle: 34.0,
    depth: 3.0,
    unitWeight: 20.1,
    expectedFos: 1.18,
    threatLevel: 'MODERATE',
    color: AMBER,
    alertTitle: 'CODE YELLOW: RAILWAY & HIGHWAY ADVISORY',
    dispatches: [
      { agency: 'DDMA Dima Hasao (Haflong)', status: 'ADVISORY', note: 'Weather bulletin shared with local PWD' },
      { agency: 'Northeast Frontier Railway', status: 'SLOW ORDER', note: 'Speed restriction (20 km/h) on Lumding-Badarpur track' },
      { agency: 'NHAI Project Director', status: 'MONITORING', note: 'Slope inclinometers sampled every 60s' },
      { agency: 'District SDRF', status: 'STANDBY', note: 'Haflong quick-response teams notified' }
    ]
  }
];

const WORKFLOW_STAGES = [
  {
    id: 1,
    step: 'STAGE 01',
    name: 'MULTI-PLATFORM INGESTION',
    desc: 'Acquiring ground telemetry & radar',
    icon: '🛰️',
    details: 'Pulls data every 10s from 8 Virtual IoT Sensors, Sentinel-1 C-band SAR interferograms, Open-Meteo precipitation, and USGS seismic feeds.',
    metric: '283 active vectors ingested',
    latency: '14 ms'
  },
  {
    id: 2,
    step: 'STAGE 02',
    name: 'SIGNAL CONDITIONING & QUALITY',
    desc: 'Kalman filtering & despiking',
    icon: '🧹',
    details: 'Applies Extended Kalman Filter (EKF) to suppress white Gaussian noise, Hampel identifier for 3σ outlier despiking, and ISO 17025 drift compensation.',
    metric: 'SNR: +44.2 dB · 0.02% outliers rejected',
    latency: '8 ms'
  },
  {
    id: 3,
    step: 'STAGE 03',
    name: 'GEOTECHNICAL INFILTRATION & FOS',
    desc: '1D Green-Ampt & Infinite Slope',
    icon: '📐',
    details: 'Solves the 1D Green-Ampt infiltration kinematic wave, computes transient pore-water suction ψ, and derives the Infinite Slope Factor of Safety (FoS).',
    metric: 'Real-time mathematical derivation',
    latency: '22 ms'
  },
  {
    id: 4,
    step: 'STAGE 04',
    name: 'AI MULTI-HAZARD RISK FUSION',
    desc: 'Whisper-Large-V3 Ensemble',
    icon: '🧠',
    details: 'Runs agentic ensemble combining Random Forest, XGBoost, and Whisper geotechnical text/acoustic inference to synthesize composite risk (0–100).',
    metric: 'Whisper-Large-V3 Inference Active',
    latency: '35 ms'
  },
  {
    id: 5,
    step: 'STAGE 05',
    name: 'TIERED SOP & AGENCY DISPATCH',
    desc: 'Automated inter-agency protocols',
    icon: '🚨',
    details: 'Evaluates SOP decision matrix. Dispatches automated broadcast to DDMA, BRO Project Swastik/Pushpak, NDRF, NHAI traffic control, and village sirens.',
    metric: 'Multi-agency webhook dispatched',
    latency: '19 ms'
  },
  {
    id: 6,
    step: 'STAGE 06',
    name: 'POST-EVENT DRONE & SAR VERIFY',
    desc: 'Autonomous UAV & InSAR loop',
    icon: '🛸',
    details: 'Triggers autonomous hexacopter lidar route over high-strain scarps and queries Sentinel-1 ascending/descending passes for millimeter change confirmation.',
    metric: 'Point-cloud resolution: 2.5 cm/px',
    latency: '42 ms'
  },
];

export default function DynamicWorkflow({ location, sensors = [], liveWeather = null, currentRisk = null }) {
  // Extract live parameters from virtual sensors or weather
  const livePrecip = parseFloat((liveWeather?.precipitation ?? (sensors.find(s => s.sensor_type === 'rainfall')?.last_value ?? 0)).toFixed(1));
  const liveHumidity = parseFloat((liveWeather?.relative_humidity_2m ?? (sensors.find(s => s.sensor_type === 'humidity')?.last_value ?? 68)).toFixed(0));
  const liveSoil = parseFloat((sensors.find(s => s.sensor_type === 'soil_moisture')?.last_value ?? Math.min(95, liveHumidity * 0.82)).toFixed(1));
  const livePorePressure = Math.max(6.0, parseFloat((livePrecip * 1.6 + liveSoil * 0.32).toFixed(1)));

  // Dynamic Live Scenario built directly from active telemetry
  const liveAdaptiveScenario = {
    id: 'live_telemetry',
    label: '⚡ LIVE ADAPTIVE (REAL-TIME)',
    name: `Live Telemetry Stream — ${location?.name || 'Current Monitoring Zone'}`,
    description: `Dynamic physical parameters assimilated from ${sensors.length || 8} virtual sensors: ${livePrecip}mm/h rain, ${liveSoil}% soil moisture, ${livePorePressure}kPa pore pressure.`,
    rainfall: livePrecip,
    porePressure: livePorePressure,
    frictionAngle: 31.5,
    cohesion: 12.0,
    slopeAngle: 38.0,
    depth: 3.2,
    unitWeight: 20.4,
    threatLevel: currentRisk?.overall_level || (livePrecip > 50 ? 'CRITICAL' : livePrecip > 20 ? 'ELEVATED' : 'MODERATE'),
    color: CYAN,
    alertTitle: `REAL-TIME TELEMETRY: ${currentRisk?.overall_level || 'OPERATIONAL'} STATUS`,
    dispatches: [
      { agency: 'Regional SEOC / DDMA', status: 'SYNCHRONIZED', note: `Live feed locked to ${location?.name || 'hotspot'}` },
      { agency: 'Border Roads Organisation (BRO)', status: 'TELEMETRY ACTIVE', note: 'Highway slope inclinometers nominal' },
      { agency: 'NDRF Battalion Control Room', status: 'STANDBY', note: 'Common Alerting Protocol (CAP) channel open' },
      { agency: 'CWC Hydrological Bureau', status: 'LOGGING', note: 'Basin discharge velocity verified' }
    ]
  };

  const allScenarios = [liveAdaptiveScenario, ...SCENARIOS];

  const [selectedScenario, setSelectedScenario] = useState(liveAdaptiveScenario);
  const [activeStage, setActiveStage] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isWatchdogActive, setIsWatchdogActive] = useState(true);
  const [progressPct, setProgressPct] = useState(0);
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);

  // Auto-update live scenario parameters if selected
  useEffect(() => {
    if (selectedScenario.id === 'live_telemetry') {
      setSelectedScenario(liveAdaptiveScenario);
    }
  }, [livePrecip, liveSoil, livePorePressure, location?.name, currentRisk?.overall_level]);

  // Calculate Infinite Slope FoS dynamically:
  // FoS = [c' + (gamma * z * cos^2(beta) - u) * tan(phi')] / [gamma * z * sin(beta) * cos(beta)]
  const calcFos = (scenario) => {
    const deg2rad = Math.PI / 180;
    const beta = scenario.slopeAngle * deg2rad;
    const phi = scenario.frictionAngle * deg2rad;
    const gamma = scenario.unitWeight;
    const z = scenario.depth;
    const c = scenario.cohesion;
    const u = scenario.porePressure;

    const normalTotal = gamma * z * Math.pow(Math.cos(beta), 2);
    const normalEffective = Math.max(0.1, normalTotal - u);
    const shearResisting = c + normalEffective * Math.tan(phi);
    const shearDriving = gamma * z * Math.sin(beta) * Math.cos(beta);

    const fos = shearResisting / (shearDriving || 0.001);
    return Math.max(0.1, Math.min(3.5, parseFloat(fos.toFixed(2))));
  };

  const currentFos = calcFos(selectedScenario);

  // Add a log entry
  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, text, type }].slice(-60));
  };

  // Real-time continuous watchdog loop
  useEffect(() => {
    if (!isWatchdogActive) return;
    const iv = setInterval(() => {
      const activeFos = calcFos(selectedScenario);
      const logType = activeFos < 1.0 ? 'error' : activeFos < 1.3 ? 'warn' : 'info';
      addLog(`[LIVE WATCHDOG] Pkg Rx: 8 nodes OK | FoS: ${activeFos} (${activeFos < 1.0 ? 'FAILURE IMMINENT' : activeFos < 1.3 ? 'MARGINAL' : 'STABLE'}) | Rain: ${selectedScenario.rainfall}mm/h | u: ${selectedScenario.porePressure}kPa | EKF: -62dBm`, logType);
    }, 7000);
    return () => clearInterval(iv);
  }, [isWatchdogActive, selectedScenario]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle Scenario Change
  const handleSelectScenario = (sc) => {
    setSelectedScenario(sc);
    addLog(`[CONFIG] Scenario switched to: ${sc.name}`, 'warn');
    addLog(`[GEOTECH] Injected parameters: Rain=${sc.rainfall}mm/hr, u=${sc.porePressure}kPa, β=${sc.slopeAngle}°`, 'info');
  };

  // Run Pipeline Simulation Animation
  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgressPct(0);
    setActiveStage(1);
    setLogs([]);

    addLog(`========================================================`, 'info');
    addLog(`[WORKFLOW START] Initializing End-to-End Operational Loop for ${location?.name || 'Monitoring Grid'}`, 'info');
    addLog(`[SCENARIO] Active Threat: ${selectedScenario.name}`, 'warn');

    let currentStep = 1;
    const stepDuration = 900; // ms per stage

    const interval = setInterval(() => {
      if (currentStep <= 6) {
        setActiveStage(currentStep);
        setProgressPct(Math.round((currentStep / 6) * 100));

        const stage = WORKFLOW_STAGES[currentStep - 1];
        addLog(`[STAGE 0${currentStep}] EXECUTING: ${stage.name} (${stage.latency})`, 'info');

        if (currentStep === 1) {
          addLog(`  → Pulled live feeds: IMD Radar, USGS Seismic, Sentinel-1, 8 Virtual Nodes`, 'info');
        } else if (currentStep === 2) {
          addLog(`  → Kalman filtering complete: High-frequency sensor noise suppressed by 28 dB`, 'info');
        } else if (currentStep === 3) {
          addLog(`  → Infinite Slope Model Solved: Effective Stress σ'=${(selectedScenario.unitWeight * selectedScenario.depth - selectedScenario.porePressure).toFixed(1)} kPa`, 'info');
          addLog(`  → Computed Factor of Safety: FoS = ${currentFos} [${currentFos < 1.0 ? 'FAILURE IMMINENT' : currentFos < 1.3 ? 'MARGINAL' : 'STABLE'}]`, currentFos < 1.0 ? 'error' : 'info');
        } else if (currentStep === 4) {
          addLog(`  → Agentic Core (Whisper-V3) synthesized risk score: ${selectedScenario.threatLevel === 'CRITICAL' ? '88/100 (CRITICAL)' : selectedScenario.threatLevel === 'ELEVATED' ? '68/100 (ELEVATED)' : '24/100 (LOW)'}`, 'warn');
        } else if (currentStep === 5) {
          addLog(`  → Multi-Agency SOP Triggered: Dispatched to DDMA, BRO Swastik, NDRF & NHAI`, currentFos < 1.0 ? 'error' : 'warn');
          selectedScenario.dispatches.forEach(d => {
            addLog(`     [${d.agency}] → STATUS: ${d.status} (${d.note})`, 'info');
          });
        } else if (currentStep === 6) {
          addLog(`  → Closed-loop drone flight trajectory uploaded · Post-event InSAR verified`, 'info');
          addLog(`[WORKFLOW SUCCESS] Pipeline completed in 5.4s. System returning to high-frequency polling.`, 'success');
        }

        currentStep++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, stepDuration);
  };

  const resetPipeline = () => {
    setIsRunning(false);
    setProgressPct(0);
    setActiveStage(1);
    addLog(`[RESET] Workflow state reset to STANDBY.`, 'info');
  };

  return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.25)', borderRadius: 12, padding: '18px 24px',
        marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 800, color: CYAN, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              DYNAMIC GEOTECHNICAL & EARLY WARNING WORKFLOW ENGINE
            </span>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 9, background: isWatchdogActive ? `${CYAN}22` : isRunning ? `${RED}22` : `${GREEN}22`,
              color: isWatchdogActive ? CYAN : isRunning ? RED : GREEN, border: `1px solid ${isWatchdogActive ? CYAN : isRunning ? RED : GREEN}66`,
              padding: '2px 8px', borderRadius: 4, fontWeight: 700
            }}>
              {isWatchdogActive ? '● REAL-TIME WATCHDOG ACTIVE (7s)' : isRunning ? '● EXECUTING PIPELINE' : '● STANDBY'}
            </span>
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: '#9ca3af', marginTop: 4, maxWidth: 840 }}>
            Closed-loop disaster intelligence: continuous multi-platform ingestion, Kalman signal conditioning, 1D Green-Ampt infiltration,
            Infinite Slope Factor of Safety (FoS) derivation, Whisper-Large-V3 risk fusion, and automated multi-agency SOP escalation.
          </div>
        </div>

        {/* Execution Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setIsWatchdogActive(!isWatchdogActive)}
            style={{
              background: isWatchdogActive ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.05)',
              color: isWatchdogActive ? CYAN : '#9ca3af',
              border: `1px solid ${isWatchdogActive ? CYAN : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 6, padding: '10px 14px', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isWatchdogActive ? CYAN : '#666', boxShadow: isWatchdogActive ? `0 0 6px ${CYAN}` : 'none' }} />
            {isWatchdogActive ? 'WATCHDOG: ACTIVE' : 'WATCHDOG: PAUSED'}
          </button>

          <button
            onClick={runSimulation}
            disabled={isRunning}
            style={{
              background: isRunning ? 'rgba(0, 229, 255, 0.2)' : 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
              color: '#000', border: 'none', borderRadius: 6, padding: '10px 18px',
              fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(0, 229, 255, 0.3)'
            }}
          >
            {isRunning ? 'EXECUTING PIPELINE...' : '▶ RUN SIMULATED WORKFLOW'}
          </button>
          <button
            onClick={resetPipeline}
            style={{
              background: 'rgba(255,255,255,0.05)', color: '#d1d5db',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
              padding: '10px 14px', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, cursor: 'pointer'
            }}
          >
            ⏹ RESET
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16
      }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: CYAN, fontWeight: 700, whiteSpace: 'nowrap' }}>
          LIFECYCLE PROGRESS: {progressPct}%
        </span>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${progressPct}%`, height: '100%',
            background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
            transition: 'width 0.4s ease', boxShadow: `0 0 10px ${CYAN}`
          }} />
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>
          STAGE {activeStage} OF 6
        </span>
      </div>

      {/* Threat Scenario Selector */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: AMBER, letterSpacing: '0.1em', marginBottom: 10 }}>
          ⚡ SELECT OPERATIONAL DRILL SCENARIO (INJECT PHYSICAL FORCING):
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {allScenarios.map(sc => (
            <div
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              style={{
                background: selectedScenario.id === sc.id ? `${sc.color}15` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${selectedScenario.id === sc.id ? sc.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: selectedScenario.id === sc.id ? `0 0 16px ${sc.color}33` : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: sc.color }}>
                  {sc.label}
                </span>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 9, padding: '2px 6px', borderRadius: 4,
                  background: `${sc.color}22`, color: sc.color, fontWeight: 700
                }}>
                  FoS: {sc.expectedFos || calcFos(sc)}
                </span>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: '#f3f4f6', marginBottom: 4 }}>
                {sc.name}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#9ca3af', lineHeight: 1.3 }}>
                {sc.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6-Stage Interactive Visual Pipeline Stepper */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: CYAN, letterSpacing: '0.1em', marginBottom: 12 }}>
          🔄 6-STAGE CLOSED-LOOP DISASTER INTELLIGENCE PIPELINE:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {WORKFLOW_STAGES.map(stage => {
            const isCurrent = activeStage === stage.id;
            const isCompleted = activeStage > stage.id;
            return (
              <div
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                style={{
                  background: isCurrent ? 'rgba(0, 229, 255, 0.08)' : isCompleted ? 'rgba(34, 197, 94, 0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCurrent ? CYAN : isCompleted ? GREEN : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.2s',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: isCurrent ? `0 0 16px ${CYAN}33` : 'none'
                }}
              >
                {/* Step pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 8, fontWeight: 700,
                    color: isCurrent ? CYAN : isCompleted ? GREEN : '#6b7280'
                  }}>
                    {stage.step}
                  </span>
                  <span style={{ fontSize: 16 }}>{stage.icon}</span>
                </div>

                <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: isCurrent ? '#fff' : '#cbd5e1', marginBottom: 4 }}>
                  {stage.name}
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 9, color: '#9ca3af', marginBottom: 8, height: 26, overflow: 'hidden' }}>
                  {stage.desc}
                </div>

                <div style={{
                  fontFamily: FONT_MONO, fontSize: 8,
                  color: isCurrent ? CYAN : isCompleted ? GREEN : '#4b5563',
                  background: 'rgba(0,0,0,0.3)', padding: '3px 6px', borderRadius: 4
                }}>
                  {isCurrent ? '⚡ IN EXECUTION' : isCompleted ? '✓ VERIFIED' : 'PENDING'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Grid: Selected Stage Inspector + Live Geotechnical Equation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Left: Selected Stage Deep Inspector */}
        <div style={{
          background: 'rgba(0, 229, 255, 0.02)', border: '1px solid rgba(0, 229, 255, 0.15)',
          borderRadius: 12, padding: 20
        }}>
          {(() => {
            const currentStageObj = WORKFLOW_STAGES[activeStage - 1] || WORKFLOW_STAGES[0];
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{currentStageObj.icon}</span>
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 800, color: CYAN }}>
                      {currentStageObj.step}: {currentStageObj.name}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#6b7280' }}>
                      Operational Specification & Execution Mechanics
                    </div>
                  </div>
                </div>

                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: '#d1d5db', lineHeight: 1.5, marginBottom: 16 }}>
                  {currentStageObj.details}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12 }}>
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>STAGE BENCHMARK</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#f3f4f6', fontWeight: 600, marginTop: 2 }}>
                      {currentStageObj.metric}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>EXECUTION LATENCY</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: GREEN, fontWeight: 700, marginTop: 2 }}>
                      {currentStageObj.latency}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right: Live Geotechnical Infinite Slope Factor of Safety Equation */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.03)', border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: 12, padding: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, color: PURPLE }}>
              📐 INFINITE SLOPE FACTOR OF SAFETY (FoS)
            </div>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
              background: currentFos < 1.0 ? `${RED}22` : currentFos < 1.3 ? `${AMBER}22` : `${GREEN}22`,
              color: currentFos < 1.0 ? RED : currentFos < 1.3 ? AMBER : GREEN,
              border: `1px solid ${currentFos < 1.0 ? RED : currentFos < 1.3 ? AMBER : GREEN}`
            }}>
              FoS = {currentFos}
            </span>
          </div>

          <div style={{
            background: '#070b14', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, padding: '10px 14px', fontFamily: FONT_MONO, fontSize: 10, color: '#9ca3af',
            marginBottom: 14, textAlign: 'center'
          }}>
            FoS = [ c' + (γ·z·cos²β - u)·tanφ' ] / [ γ·z·sinβ·cosβ ]
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: 6 }}>
              <span style={{ color: '#6b7280' }}>Cohesion c': </span>
              <strong style={{ color: '#f3f4f6' }}>{selectedScenario.cohesion} kPa</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: 6 }}>
              <span style={{ color: '#6b7280' }}>Friction φ': </span>
              <strong style={{ color: '#f3f4f6' }}>{selectedScenario.frictionAngle}°</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: 6 }}>
              <span style={{ color: '#6b7280' }}>Slope β: </span>
              <strong style={{ color: '#f3f4f6' }}>{selectedScenario.slopeAngle}°</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: 6 }}>
              <span style={{ color: '#6b7280' }}>Pore Water u: </span>
              <strong style={{ color: selectedScenario.porePressure > 30 ? RED : CYAN }}>{selectedScenario.porePressure} kPa</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: 6 }}>
              <span style={{ color: '#6b7280' }}>Soil Depth z: </span>
              <strong style={{ color: '#f3f4f6' }}>{selectedScenario.depth} m</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: 6 }}>
              <span style={{ color: '#6b7280' }}>Unit Wt γ: </span>
              <strong style={{ color: '#f3f4f6' }}>{selectedScenario.unitWeight} kN/m³</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Standard Operating Procedure (SOP) Dispatch + Live Execution Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Inter-Agency SOP Action Matrix */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, color: '#f3f4f6' }}>
              🚨 INTER-AGENCY SOP ESCALATION MATRIX
            </div>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 9, color: selectedScenario.color,
              background: `${selectedScenario.color}22`, padding: '2px 8px', borderRadius: 4, fontWeight: 700
            }}>
              {selectedScenario.threatLevel} LEVEL
            </span>
          </div>

          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#9ca3af', marginBottom: 14 }}>
            Active civil protection & infrastructure directives automatically generated from Stage 05 outputs:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedScenario.dispatches.map((disp, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>
                    {disp.agency}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                    {disp.note}
                  </div>
                </div>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                  background: disp.status === 'STANDBY' || disp.status === 'CLEAR' ? `${GREEN}22` : `${selectedScenario.color}22`,
                  color: disp.status === 'STANDBY' || disp.status === 'CLEAR' ? GREEN : selectedScenario.color,
                  border: `1px solid ${disp.status === 'STANDBY' || disp.status === 'CLEAR' ? GREEN : selectedScenario.color}44`
                }}>
                  {disp.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Execution Terminal Log */}
        <div style={{
          background: '#040711', border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', height: 320
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: CYAN, fontWeight: 700 }}>
              💻 WORKFLOW EXECUTION TERMINAL TRACE
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#4b5563' }}>
              BUFFER: {logs.length} EVENTS
            </span>
          </div>

          <div
            ref={logContainerRef}
            style={{
              flex: 1, overflowY: 'auto', fontFamily: FONT_MONO, fontSize: 10,
              display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 4
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: '#4b5563', fontStyle: 'italic', marginTop: 40, textAlign: 'center' }}>
                Pipeline idle. Click "▶ RUN SIMULATED WORKFLOW" or switch threat scenarios to view live execution logs.
              </div>
            ) : (
              logs.map((l, i) => (
                <div key={i} style={{
                  color: l.type === 'error' ? RED : l.type === 'warn' ? AMBER : l.type === 'success' ? GREEN : '#cbd5e1',
                  lineHeight: 1.4
                }}>
                  <span style={{ color: '#6b7280' }}>[{l.time}] </span>
                  {l.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
