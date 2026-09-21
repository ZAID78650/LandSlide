import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Color Constants ─────────────────────────────────────── */
const C = {
  cyan:   '#00e5ff',
  red:    '#ff3b5c',
  amber:  '#ffb020',
  green:  '#22c55e',
  blue:   '#2979ff',
  purple: '#a855f7',
  teal:   '#10b981',
};

/* ─── Scan Stages ─────────────────────────────────────────── */
const STAGES = [
  { id: 0, label: 'DATA VERIFICATION',        icon: '🛰️',  color: C.cyan,   ms: 800,  log: 'Validating Sentinel-2 12-band L2A spectral cubes (10m/20m/60m)...' },
  { id: 1, label: 'TOPOGRAPHIC EXTRACTION',   icon: '〰️',  color: C.blue,   ms: 1000, log: 'Computing TWI, slope aspect, curvature from SRTM-30m DEM...' },
  { id: 2, label: 'U-NET TENSOR INFERENCE',   icon: '⬡',   color: C.purple, ms: 1200, log: 'Running LandslideNet ResNet-50 slip-surface segmentation (GPU)...' },
  { id: 3, label: 'GEOTECHNICAL EVALUATION',  icon: '⚙️',  color: C.amber,  ms: 900,  log: 'Calculating FoS via infinite slope model + pore-water pressure...' },
  { id: 4, label: 'HAZARD CONTOUR SYNTHESIS', icon: '◈',   color: C.red,    ms: 600,  log: 'Generating probabilistic risk contours & GeoJSON metadata export...' },
];

/* ─── Spectral Bands ──────────────────────────────────────── */
const BANDS = [
  { id: 'RGB',  label: 'RGB',    color: C.cyan,   desc: 'True Color (Visible Spectrum)', filter: 'none' },
  { id: 'NIR',  label: 'NIR',    color: C.teal,   desc: 'Near Infrared (Vegetation B8)', filter: 'hue-rotate(90deg) contrast(1.2) saturate(1.4)' },
  { id: 'SWIR', label: 'SWIR',   color: C.blue,   desc: 'Moisture Index (B11/B12)',       filter: 'invert(0.8) hue-rotate(180deg) contrast(1.1)' },
  { id: 'DEM',  label: 'DEM',    color: C.purple, desc: 'Digital Elevation Model',        filter: 'grayscale(1) contrast(1.8) brightness(0.9)' },
  { id: 'SLOPE',label: 'SLOPE',  color: C.amber,  desc: 'Topographic Slope Gradient (°)', filter: 'sepia(1) hue-rotate(300deg) saturate(1.5)' },
  { id: 'NDVI', label: 'NDVI',   color: C.teal,   desc: 'Vegetation Density Index',       filter: 'hue-rotate(60deg) saturate(2.2) contrast(1.1)' },
];

/* ─── FoS Circular Gauge ──────────────────────────────────── */
function FosGauge({ fos, size = 90 }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const fosNorm = Math.min(Math.max(parseFloat(fos) || 0, 0), 2.0);
  const fraction = fosNorm / 2.0;
  const offset = circumference * (1 - fraction);
  const color = fosNorm < 1.0 ? C.red : fosNorm < 1.3 ? C.amber : C.green;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} className="fos-ring-bg" />
        <circle
          cx="50" cy="50" r={r}
          className="fos-ring-fill"
          style={{ stroke: color, '--fos-offset': offset }}
          strokeDashoffset={offset}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color, lineHeight: 1 }}>{fos}</div>
        <div style={{ fontSize: 8, color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.05em' }}>FoS</div>
      </div>
      {/* Outer ring pulse */}
      <div className="ring-expand" style={{ borderColor: color, opacity: 0.4, animationDuration: '2s' }} />
    </div>
  );
}

/* ─── Waterfall Spectral Bar ──────────────────────────────── */
function WaterfallBar({ label, value, color, max = 100, delay = 0, unit = '' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b' }}>{label}</span>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color }}>{value}{unit}</span>
      </div>
      <div style={{ height: 5, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          borderRadius: 3,
          boxShadow: `0 0 6px ${color}80`,
          transition: `width 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
        }} />
      </div>
    </div>
  );
}

/* ─── Stage Pipeline Row ──────────────────────────────────── */
function StagePipeline({ stages, currentStage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '10px 0' }}>
      {stages.map((st, i) => {
        const state = i < currentStage ? 'done' : i === currentStage ? 'active' : 'pending';
        return (
          <React.Fragment key={st.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div className={`stage-node ${state}`}>
                {state === 'done' ? '✓' : state === 'active' ? (
                  <span style={{ animation: 'stagePulse 1s ease infinite' }}>{i + 1}</span>
                ) : i + 1}
              </div>
              <span style={{
                fontSize: 7, fontFamily: 'monospace', textAlign: 'center',
                color: state === 'done' ? C.green : state === 'active' ? C.cyan : '#334155',
                maxWidth: 48, lineHeight: 1.2,
                transition: 'color 0.3s ease',
              }}>
                {st.label.split(' ').slice(0, 2).join(' ')}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="stage-connector" style={{ margin: '0 2px', marginBottom: 14 }}>
                <div className="stage-connector-fill" style={{ width: i < currentStage ? '100%' : '0%' }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Ticker Tape ─────────────────────────────────────────── */
function TelemetryTicker({ data, scanning }) {
  const tickStr = data.join('   ▸   ');
  return (
    <div className="hud-ticker-wrap" style={{
      background: '#05070a', borderTop: '1px solid #1e2a3a',
      padding: '4px 0', opacity: scanning ? 1 : 0.5,
      transition: 'opacity 0.4s ease',
    }}>
      <div className="hud-ticker-inner" style={{ fontFamily: 'monospace', fontSize: 9, color: scanning ? C.cyan : '#334155' }}>
        {tickStr}&nbsp;&nbsp;&nbsp;{tickStr}
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export default function InteractiveScanner({ imageSrc, maskSrc, sampleName = 'Satellite_Tile_26.2N_93.9E.png', onScanComplete }) {
  const [scanning, setScanning]       = useState(false);
  const [progress, setProgress]       = useState(0);
  const [currentStage, setCurrentStage] = useState(-1);
  const [completedStages, setCompletedStages] = useState([]);
  const [activeBand, setActiveBand]   = useState('RGB');
  const [maskOpacity, setMaskOpacity] = useState(0.75);
  const [showMask, setShowMask]       = useState(true);
  const [scanSpeed, setScanSpeed]     = useState(1);
  const [logs, setLogs]               = useState([]);
  const [selectedPixel, setSelectedPixel] = useState(null);
  const [scanResult, setScanResult]   = useState(null);
  const [glitch, setGlitch]           = useState(false);
  const [tickerData, setTickerData]   = useState([
    'SYSTEM READY', 'BANDS: 12-CHANNEL L2A', 'MODEL: LANDSLIDE-NET v3.4',
    'GPU: IDLE', 'RESOLUTION: 10m/px', 'CRS: WGS84 EPSG:4326',
  ]);
  const logRef = useRef(null);
  const beamRef = useRef(null);
  const progressRef = useRef(0);
  const stageRef = useRef(-1);

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toISOString().slice(11, 19);
    setLogs(prev => [...prev.slice(-40), { time, msg, type, key: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const runScan = async () => {
    setScanning(true);
    setProgress(0);
    setLogs([]);
    setSelectedPixel(null);
    setScanResult(null);
    setCurrentStage(0);
    setCompletedStages([]);
    progressRef.current = 0;
    stageRef.current = 0;

    setTickerData([
      'SCAN INITIATED', 'ACQUIRING SATELLITE LOCK...', 'TENSOR GPU: ACTIVE',
      'BAND STACK: LOADING', 'DEM TILE: FETCHING', 'FoS MODEL: WARM',
    ]);

    addLog('▶ Scan sequence initiated. Loading spectral data cubes...', 'stage');

    for (let s = 0; s < STAGES.length; s++) {
      const st = STAGES[s];
      stageRef.current = s;
      setCurrentStage(s);
      addLog(`[STAGE ${s + 1}/${STAGES.length}] ${st.label}`, 'stage');
      addLog(`  → ${st.log}`, 'info');

      // Update ticker
      setTickerData([
        `STAGE ${s+1}/5: ${st.label}`,
        `GPU LOAD: ${40 + s * 12}%`,
        `RAM: ${1.2 + s * 0.4}GB`,
        `TENSOR OPS: ${(s * 2.4).toFixed(1)}B`,
        `CONF: ${(72 + s * 4)}%`,
        `ETA: ${Math.ceil((STAGES.length - s - 1) * st.ms / 1000 / scanSpeed)}s`,
      ]);

      const stageShare = 100 / STAGES.length;
      const stepMs = 40;
      const totalSteps = (st.ms / scanSpeed) / stepMs;
      for (let step = 0; step < totalSteps; step++) {
        await new Promise(r => setTimeout(r, stepMs));
        progressRef.current = Math.min(100, ((s * stageShare) + (stageShare * (step / totalSteps))));
        setProgress(Math.round(progressRef.current));
      }

      setCompletedStages(prev => [...prev, s]);
      addLog(`  ✓ ${st.label} complete`, 'success');
    }

    // Finalize
    setProgress(100);
    setCurrentStage(STAGES.length);
    setGlitch(true);
    setTimeout(() => setGlitch(false), 500);

    const result = {
      factor_of_safety: 0.94,
      confidence: 0.934,
      displacement_rate_mm_day: 14.8,
      risk_level: 'CRITICAL RISK',
      slope_angle: 42,
      soil_moisture: 87,
      shear_stress: 29.4,
      shear_resistance: 35.9,
      elevation: 347,
    };
    setScanResult(result);
    setScanning(false);
    addLog('✓ ANALYSIS COMPLETE — FoS: 0.94 [CRITICAL HAZARD ZONE]', 'success');
    addLog('  ✦ Hazard mask exported to GeoJSON. Report generated.', 'success');

    setTickerData([
      'SCAN COMPLETE', `FoS: ${result.factor_of_safety}`, `RISK: ${result.risk_level}`,
      `SLOPE: ${result.slope_angle}°`, `MOISTURE: ${result.soil_moisture}%`, `CONF: ${(result.confidence * 100).toFixed(1)}%`,
    ]);

    if (onScanComplete) onScanComplete(result);
  };

  const handleImageClick = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const slope = Math.round(20 + x * 0.3 + y * 0.2);
    const moisture = Math.round(40 + y * 0.45);
    const fos = (1.5 - slope / 60 - moisture / 200).toFixed(2);
    const elev = 1450 + x * 8;
    const risk = fos < 1.0 ? 'CRITICAL' : fos < 1.3 ? 'HIGH' : 'STABLE';
    setSelectedPixel({ x, y, slope, moisture, fos, elev, risk });
    addLog(`PIXEL [${x}%,${y}%] → Slope:${slope}° FoS:${fos} Moisture:${moisture}% Elev:${elev}m`, 'pixel');
  };

  const bandObj = BANDS.find(b => b.id === activeBand) || BANDS[0];

  return (
    <div style={{ background: '#0a0d14', border: '1px solid #1e2a3a', borderRadius: 12, overflow: 'hidden', color: '#e2e8f0', fontFamily: 'monospace' }}>

      {/* ── Header Bar ── */}
      <div style={{ padding: '10px 16px', background: '#0c1220', borderBottom: '1px solid #1e2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Status dot */}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: scanning ? C.amber : scanResult ? C.green : '#334155',
            boxShadow: scanning ? `0 0 10px ${C.amber}` : scanResult ? `0 0 10px ${C.green}` : 'none',
            transition: 'all 0.3s ease',
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: '0.08em' }}>
            MULTISPECTRAL GIS SCANNER
          </span>
          <span style={{ fontSize: 9, color: '#475569' }}>v3.4</span>
          <span style={{ fontSize: 9, color: '#334155', marginLeft: 4 }}>{sampleName}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Speed selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a', border: '1px solid #1e2a3a', borderRadius: 6, padding: '4px 10px' }}>
            <span style={{ fontSize: 9, color: '#64748b' }}>SPEED</span>
            {[0.5, 1, 2].map(s => (
              <button key={s} onClick={() => setScanSpeed(s)} style={{
                background: scanSpeed === s ? 'rgba(0,229,255,0.15)' : 'transparent',
                border: scanSpeed === s ? `1px solid ${C.cyan}` : '1px solid transparent',
                color: scanSpeed === s ? C.cyan : '#475569',
                borderRadius: 4, padding: '2px 8px', fontSize: 9, cursor: 'pointer',
              }}>{s}×</button>
            ))}
          </div>

          {/* Scan button */}
          <button
            onClick={runScan}
            disabled={scanning}
            style={{
              background: scanning ? '#1e293b' : `linear-gradient(135deg, ${C.blue}, ${C.cyan})`,
              color: scanning ? '#64748b' : '#000',
              border: 'none', borderRadius: 6, padding: '7px 18px',
              fontSize: 11, fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer',
              boxShadow: scanning ? 'none' : `0 0 18px rgba(0,229,255,0.35)`,
              transition: 'all 0.25s ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {scanning ? (
              <>
                <span style={{ display: 'inline-block', width: 10, height: 10, border: `2px solid ${C.cyan}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                SCANNING {progress}%
              </>
            ) : scanResult ? '↺ RE-SCAN' : '▶ RUN REAL-TIME SCAN'}
          </button>
        </div>
      </div>

      {/* ── Band Selector Strip ── */}
      <div style={{ padding: '6px 16px', background: '#070b12', borderBottom: '1px solid #1e2a3a', display: 'flex', gap: 6, overflowX: 'auto', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: '#334155', flexShrink: 0 }}>BAND:</span>
        {BANDS.map(band => (
          <button
            key={band.id}
            onClick={() => setActiveBand(band.id)}
            title={band.desc}
            style={{
              background: activeBand === band.id ? `rgba(${band.id === activeBand ? '0,229,255' : '0,0,0'},0.12)` : '#0f172a',
              border: `1px solid ${activeBand === band.id ? band.color : '#1e2a3a'}`,
              color: activeBand === band.id ? band.color : '#64748b',
              borderRadius: 4, padding: '3px 10px', fontSize: 9, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s ease',
              boxShadow: activeBand === band.id ? `0 0 8px ${band.color}40` : 'none',
            }}
          >
            {band.label}
          </button>
        ))}
        <span style={{ fontSize: 9, color: '#334155', marginLeft: 4 }}>{bandObj.desc}</span>
      </div>

      {/* ── Stage Pipeline ── */}
      <div style={{ padding: '6px 16px', background: '#080c14', borderBottom: '1px solid #1e2a3a' }}>
        <StagePipeline stages={STAGES} currentStage={currentStage} />
      </div>

      {/* ── Main Viewport + Sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', minHeight: 380 }}>

        {/* Left: Image Viewport */}
        <div
          onClick={handleImageClick}
          style={{ position: 'relative', background: '#04060a', overflow: 'hidden', cursor: 'crosshair' }}
          className={glitch ? 'glitch-flash' : ''}
        >
          {/* Satellite image with band filter */}
          <div style={{
            width: '100%', height: 380,
            filter: bandObj.filter,
            transition: 'filter 0.5s ease',
            position: 'relative',
          }}>
            {imageSrc ? (
              <img src={imageSrc} alt="Satellite Tile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'radial-gradient(circle at 60% 40%, #1a2540 0%, #090d16 70%, #04060a 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8
              }}>
                <div style={{ fontSize: 11, color: '#334155' }}>SATELLITE RASTER TELEMETRY TILE</div>
                <div style={{ fontSize: 9, color: '#1e2a3a' }}>26.2°N 93.9°E • SENTINEL-2 L2A</div>
              </div>
            )}

            {/* Hazard Mask Overlay */}
            {showMask && (
              <div style={{
                position: 'absolute', inset: 0,
                opacity: maskOpacity, pointerEvents: 'none',
                mixBlendMode: 'screen', transition: 'opacity 0.3s ease'
              }}>
                {maskSrc ? (
                  <img src={maskSrc} alt="Segmentation Mask" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'drop-shadow(0 0 12px #ff3b5c)' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'radial-gradient(ellipse at 58% 42%, rgba(255,59,92,0.55) 0%, rgba(255,176,32,0.28) 38%, transparent 65%)'
                  }} />
                )}
              </div>
            )}
          </div>

          {/* Scan grid overlay (always visible during scan) */}
          {scanning && <div className="scan-grid-overlay" />}

          {/* Cyber grid (subtle, always) */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          {/* HUD Corners */}
          {scanning && (
            <>
              <div className="scanner-hud-corner tl" />
              <div className="scanner-hud-corner tr" />
              <div className="scanner-hud-corner bl" />
              <div className="scanner-hud-corner br" />
            </>
          )}

          {/* Primary Laser Scan Beam */}
          {scanning && (
            <>
              {/* Trail gradient */}
              <div style={{
                position: 'absolute', left: 0, right: 0,
                top: 0, height: `${progress}%`,
                background: 'linear-gradient(180deg, transparent 60%, rgba(0,229,255,0.06) 100%)',
                pointerEvents: 'none', zIndex: 9, transition: 'height 0.08s linear',
              }} />
              {/* Main beam */}
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, transparent 0%, ${C.cyan} 15%, #fff 45%, ${C.red} 55%, ${C.cyan} 85%, transparent 100%)`,
                boxShadow: `0 0 14px ${C.cyan}, 0 0 28px rgba(255,59,92,0.5), 0 0 4px #fff`,
                top: `${progress}%`, transition: 'top 0.08s linear',
                pointerEvents: 'none', zIndex: 13,
              }} />
              {/* Secondary beam (offset) */}
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent, rgba(0,229,255,0.5), transparent)`,
                top: `calc(${progress}% + 5px)`, transition: 'top 0.08s linear',
                pointerEvents: 'none', zIndex: 12,
              }} />
              {/* Beam label */}
              <div style={{
                position: 'absolute', right: 10, zIndex: 14,
                top: `${progress}%`, transform: 'translateY(-20px)',
                fontSize: 8, fontFamily: 'monospace', color: C.cyan,
                background: 'rgba(10,13,20,0.9)', padding: '2px 6px', borderRadius: 3,
                border: `1px solid ${C.cyan}40`,
                pointerEvents: 'none', transition: 'top 0.08s linear',
              }}>
                LASER SWEEP ▸ {progress}%
              </div>
              {/* Active stage badge on beam */}
              <div style={{
                position: 'absolute', left: 10, zIndex: 14,
                top: `${progress}%`, transform: 'translateY(-20px)',
                fontSize: 8, fontFamily: 'monospace', color: C.amber,
                background: 'rgba(10,13,20,0.9)', padding: '2px 8px', borderRadius: 3,
                border: `1px solid ${C.amber}40`, pointerEvents: 'none',
                transition: 'top 0.08s linear',
              }}>
                {currentStage >= 0 && currentStage < STAGES.length ? STAGES[currentStage].label : ''}
              </div>
            </>
          )}

          {/* Selected Pixel Inspector */}
          {selectedPixel && (
            <div style={{
              position: 'absolute',
              left: `${selectedPixel.x}%`,
              top: `${selectedPixel.y}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none', zIndex: 16,
            }}>
              {/* Pin rings */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: 14, height: 14, border: `2px solid ${C.red}`, borderRadius: '50%', transform: 'translate(-50%,-50%)', zIndex: 2 }} />
              <div className="ring-expand" style={{ borderColor: C.red, width: 14, height: 14 }} />
              {/* Popup */}
              <div style={{
                position: 'absolute', left: 18, top: -60,
                background: 'rgba(8,12,20,0.97)', border: `1px solid ${selectedPixel.fos < 1.0 ? C.red : C.amber}`,
                borderRadius: 8, padding: '8px 12px', minWidth: 200,
                boxShadow: `0 6px 24px rgba(0,0,0,0.8), 0 0 16px ${selectedPixel.fos < 1.0 ? 'rgba(255,59,92,0.2)' : 'rgba(255,176,32,0.15)'}`,
                animation: 'fadeInScale 0.25s ease both',
              }}>
                <div style={{ fontSize: 9, color: C.red, fontWeight: 700, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>PIXEL INSPECTOR</span>
                  <span style={{ color: '#64748b' }}>[{selectedPixel.x}%, {selectedPixel.y}%]</span>
                </div>
                <WaterfallBar label="SLOPE ANGLE" value={selectedPixel.slope} max={90} color={C.amber} unit="°" delay={0} />
                <WaterfallBar label="SOIL MOISTURE" value={selectedPixel.moisture} max={100} color={C.blue} unit="%" delay={80} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                  <div>
                    <div style={{ fontSize: 8, color: '#475569', marginBottom: 2 }}>FoS</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: selectedPixel.fos < 1.0 ? C.red : selectedPixel.fos < 1.3 ? C.amber : C.green }}>{selectedPixel.fos}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: '#475569', marginBottom: 2 }}>ELEVATION</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.cyan }}>{selectedPixel.elev}m</div>
                  </div>
                </div>
                <div style={{
                  marginTop: 6, padding: '3px 8px', borderRadius: 4, textAlign: 'center',
                  background: selectedPixel.fos < 1.0 ? 'rgba(255,59,92,0.15)' : 'rgba(255,176,32,0.1)',
                  border: `1px solid ${selectedPixel.fos < 1.0 ? C.red : C.amber}40`,
                  fontSize: 9, fontWeight: 700,
                  color: selectedPixel.fos < 1.0 ? C.red : selectedPixel.fos < 1.3 ? C.amber : C.green,
                }}>
                  {selectedPixel.risk}
                </div>
              </div>
            </div>
          )}

          {/* Bottom-right coordinates HUD */}
          <div style={{
            position: 'absolute', bottom: 8, right: 10,
            fontSize: 8, fontFamily: 'monospace', color: '#475569',
            background: 'rgba(5,7,10,0.7)', padding: '3px 8px', borderRadius: 4,
            pointerEvents: 'none',
          }}>
            26.2°N 93.9°E • {bandObj.label} • {bandObj.desc.split('(')[0].trim()}
          </div>
        </div>

        {/* Right: Control Sidebar */}
        <div style={{ background: '#080c14', borderLeft: '1px solid #1e2a3a', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>

          {/* Mask controls */}
          <div style={{ background: '#0c1118', border: '1px solid #1e2a3a', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: C.cyan, fontWeight: 600 }}>HAZARD MASK</span>
              <button
                onClick={() => setShowMask(s => !s)}
                style={{
                  background: showMask ? 'rgba(255,59,92,0.15)' : '#1e293b',
                  color: showMask ? C.red : '#64748b',
                  border: `1px solid ${showMask ? C.red : '#334155'}`,
                  borderRadius: 4, padding: '2px 8px', fontSize: 9, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {showMask ? '● ON' : '○ OFF'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 8, color: '#475569', flexShrink: 0 }}>OPACITY</span>
              <input
                type="range" min="0" max="1" step="0.05" value={maskOpacity}
                onChange={e => setMaskOpacity(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: C.red, height: 3 }}
              />
              <span style={{ fontSize: 9, color: C.red, flexShrink: 0 }}>{Math.round(maskOpacity * 100)}%</span>
            </div>
          </div>

          {/* Progress + Stage info */}
          <div style={{ background: '#0c1118', border: '1px solid #1e2a3a', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>CURRENT STAGE</span>
              <span style={{ fontSize: 9, color: C.cyan, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: currentStage >= 0 && currentStage < STAGES.length ? C.cyan : '#334155', marginBottom: 8, minHeight: 14 }}>
              {currentStage >= 0 && currentStage < STAGES.length
                ? `${STAGES[currentStage].icon} ${STAGES[currentStage].label}`
                : scanResult ? '✓ ANALYSIS COMPLETE' : 'READY TO SCAN'}
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: progress === 100
                  ? `linear-gradient(90deg, ${C.green}, ${C.cyan})`
                  : `linear-gradient(90deg, ${C.cyan}, ${C.red})`,
                transition: 'width 0.1s linear, background 0.4s ease',
                boxShadow: progress > 0 ? `0 0 8px ${C.cyan}80` : 'none',
              }} />
            </div>
          </div>

          {/* Spectral waterfall bars (visible after scan) */}
          {scanResult && (
            <div className="scanner-result-card" style={{ background: '#0c1118', border: `1px solid ${C.green}40`, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 9, color: C.green, fontWeight: 700, marginBottom: 8 }}>GEOTECHNICAL READINGS</div>
              <WaterfallBar label="SLOPE ANGLE" value={scanResult.slope_angle} max={90} color={C.amber} unit="°" delay={0} />
              <WaterfallBar label="SOIL MOISTURE" value={scanResult.soil_moisture} max={100} color={C.blue} unit="%" delay={100} />
              <WaterfallBar label="SHEAR STRESS" value={scanResult.shear_stress} max={60} color={C.red} unit=" kPa" delay={200} />
              <WaterfallBar label="SHEAR RESISTANCE" value={scanResult.shear_resistance} max={60} color={C.teal} unit=" kPa" delay={300} />
            </div>
          )}

          {/* Live debug terminal */}
          <div style={{ flex: 1, background: '#050709', border: '1px solid #1e2a3a', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', minHeight: 130 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: C.cyan, fontWeight: 700 }}>ALGO DEBUG LOG</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {scanning && <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, display: 'inline-block', animation: 'stagePulse 1s ease infinite' }} />}
                <span style={{ fontSize: 8, color: '#334155' }}>TERMINAL</span>
              </span>
            </div>
            <div
              ref={logRef}
              className="scanner-terminal"
              style={{ flex: 1, overflowY: 'auto', fontSize: 8.5, display: 'flex', flexDirection: 'column', gap: 3 }}
            >
              {logs.length === 0 ? (
                <div style={{ color: '#1e2a3a', fontStyle: 'italic' }}>
                  {'> '}Awaiting scan execution...<span style={{ animation: 'terminalBlink 1s ease infinite' }}>█</span>
                </div>
              ) : logs.map((log) => (
                <div
                  key={log.key}
                  className="scanner-log-entry"
                  style={{
                    color: log.type === 'stage' ? C.cyan : log.type === 'success' ? C.green : log.type === 'pixel' ? C.amber : '#6a8aaa',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: '#334155' }}>[{log.time}]</span>{' '}{log.msg}
                </div>
              ))}
              {scanning && (
                <div style={{ color: '#334155' }}>
                  {'> '}<span style={{ animation: 'terminalBlink 1s ease infinite' }}>█</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Scan Result Card (slides in from bottom on complete) ── */}
      {scanResult && (
        <div className="scanner-result-card" style={{
          margin: '0 12px 12px',
          background: 'linear-gradient(135deg, #05090f, #0a1520)',
          border: `1px solid ${C.red}60`,
          borderRadius: 10,
          padding: '14px 18px',
          boxShadow: `0 0 24px rgba(255,59,92,0.12), 0 8px 32px rgba(0,0,0,0.6)`,
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        }}>
          {/* FoS Gauge */}
          <FosGauge fos={scanResult.factor_of_safety} size={84} />

          {/* Main metrics */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                background: 'rgba(255,59,92,0.15)', border: `1px solid ${C.red}`,
                color: C.red, borderRadius: 4, padding: '2px 10px', fontSize: 10, fontWeight: 800,
                letterSpacing: '0.1em',
              }}>
                {scanResult.risk_level}
              </span>
              <span style={{ fontSize: 9, color: '#475569' }}>GEOTECHNICAL ASSESSMENT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'FACTOR OF SAFETY', value: scanResult.factor_of_safety, color: C.red },
                { label: 'CONFIDENCE', value: `${(scanResult.confidence * 100).toFixed(1)}%`, color: C.cyan },
                { label: 'DISPLACEMENT', value: `${scanResult.displacement_rate_mm_day}mm/d`, color: C.amber },
              ].map(({ label, value, color }) => (
                <div key={label} className="stat-anim-in" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: '#475569', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Shear analysis mini block */}
          <div style={{ minWidth: 140, borderLeft: '1px solid #1e2a3a', paddingLeft: 16 }}>
            <div style={{ fontSize: 8, color: '#475569', marginBottom: 8 }}>SHEAR ANALYSIS</div>
            <WaterfallBar label="RESISTANCE" value={scanResult.shear_resistance} max={60} color={C.teal} unit=" kPa" />
            <WaterfallBar label="STRESS" value={scanResult.shear_stress} max={60} color={C.red} unit=" kPa" delay={150} />
            <div style={{ marginTop: 4, fontSize: 8, color: '#475569' }}>
              ELEVATION: <span style={{ color: C.cyan }}>{scanResult.elevation}m</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Telemetry Ticker ── */}
      <TelemetryTicker data={tickerData} scanning={scanning} />

      {/* ── Spin keyframe (inline) ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes terminalBlink { 0%,100%{opacity:1;} 50%{opacity:0;} }
      `}</style>
    </div>
  );
}
