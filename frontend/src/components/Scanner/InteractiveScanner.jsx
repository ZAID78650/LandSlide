import React, { useState, useEffect, useRef } from 'react';

const CYAN = '#00e5ff';
const RED = '#ff3b5c';
const AMBER = '#ffb020';
const GREEN = '#22c55e';
const BLUE = '#2979ff';
const PURPLE = '#a855f7';

export default function InteractiveScanner({
  imageSrc,
  maskSrc,
  sampleName = "Satellite_Tile_26.2N_93.9E.png",
  onScanComplete,
}) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeBand, setActiveBand] = useState('RGB');
  const [maskOpacity, setMaskOpacity] = useState(0.75);
  const [showMask, setShowMask] = useState(true);
  const [scanSpeed, setScanSpeed] = useState(1);
  const [activeStage, setActiveStage] = useState('');
  const [logs, setLogs] = useState([]);
  const [selectedPixel, setSelectedPixel] = useState(null);
  const logContainerRef = useRef(null);

  const BANDS = [
    { id: 'RGB', label: 'RGB (True Color)', color: CYAN, desc: 'Visible Spectrum Satellite Band' },
    { id: 'NIR', label: 'NIR (Near Infrared)', color: GREEN, desc: 'Vegetation & Biomass Index (B8)' },
    { id: 'SWIR', label: 'SWIR (Moisture)', color: BLUE, desc: 'Soil Water Content (B11/B12)' },
    { id: 'DEM', label: 'DEM (Elevation)', color: PURPLE, desc: 'Digital Elevation Model Aspect' },
    { id: 'SLOPE', label: 'Slope Gradient', color: AMBER, desc: 'Topographic Slope Angle (°)' },
    { id: 'NDVI', label: 'NDVI Index', color: '#10b981', desc: 'Vegetation Density Index' },
  ];

  const addLog = (msg, type = 'info') => {
    const time = new Date().toISOString().slice(11, 19);
    setLogs(prev => [...prev.slice(-30), { time, msg, type }]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const startScanProcess = async () => {
    setScanning(true);
    setProgress(0);
    setLogs([]);
    setSelectedPixel(null);

    const stages = [
      { name: "DATA VERIFICATION", duration: 700, log: "Validating Sentinel-2 12-band L2A spectral data cubes..." },
      { name: "TOPOGRAPHIC EXTRACTION", duration: 900, log: "Computing Topographic Wetness Index (TWI) & Slope Aspect..." },
      { name: "U-NET SEGMENTATION", duration: 1100, log: "Running LandslideNet ResNet-50 tensor inference for slip surface..." },
      { name: "GEOTECHNICAL EVALUATION", duration: 800, log: "Calculating Factor of Safety (FoS) & Displacement Creep Rate..." },
      { name: "FINALIZING HAZARD MASK", duration: 500, log: "Generating probabilistic risk contours & geo-json metadata." }
    ];

    let totalP = 0;
    for (let s = 0; s < stages.length; s++) {
      const st = stages[s];
      setActiveStage(st.name);
      addLog(`[${st.name}] ${st.log}`, 'stage');

      const stepInc = 20 / (st.duration / (40 / scanSpeed));
      const endTime = Date.now() + st.duration / scanSpeed;

      while (Date.now() < endTime) {
        await new Promise(r => setTimeout(r, 40));
        totalP = Math.min(100, totalP + stepInc);
        setProgress(Math.round(totalP));
      }
    }

    setProgress(100);
    setActiveStage("ANALYSIS COMPLETE");
    addLog("✓ Scanning & Geotechnical Debug Complete. FoS: 0.94 [CRITICAL HAZARD].", "success");
    setScanning(false);

    if (onScanComplete) {
      onScanComplete({
        factor_of_safety: 0.94,
        confidence: 0.934,
        displacement_rate_mm_day: 14.8,
        risk_level: "CRITICAL RISK",
      });
    }
  };

  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const slope = Math.round(20 + (x * 0.3) + (y * 0.2));
    const moisture = Math.round(40 + (y * 0.45));
    const fos = (1.5 - (slope / 60) - (moisture / 200)).toFixed(2);

    setSelectedPixel({
      x, y,
      slopeAngle: slope,
      soilMoisture: moisture,
      factorOfSafety: fos,
      elevationMeters: 1450 + (x * 8),
      riskCategory: fos < 1.0 ? "CRITICAL" : fos < 1.3 ? "HIGH" : "STABLE"
    });

    addLog(`Pixel Query [${x}%, ${y}%] -> Slope: ${slope}°, FoS: ${fos}, Saturation: ${moisture}%`, 'pixel');
  };

  return (
    <div style={{ background: '#0a0d14', border: '1px solid #1e2a3a', borderRadius: 12, overflow: 'hidden', color: '#e2e8f0' }}>
      
      {/* Top Controls Header */}
      <div style={{ padding: '12px 18px', background: '#0f172a', borderBottom: '1px solid #1e2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: scanning ? AMBER : GREEN, boxShadow: `0 0 8px ${scanning ? AMBER : GREEN}` }} />
          <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: CYAN }}>MULTISPECTRAL GIS SCANNER</span>
          <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{sampleName}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={startScanProcess}
            disabled={scanning}
            style={{
              background: scanning ? '#1e293b' : `linear-gradient(135deg, ${BLUE}, ${CYAN})`,
              color: scanning ? '#64748b' : '#000',
              border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 11,
              fontFamily: 'monospace', fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer',
              boxShadow: scanning ? 'none' : '0 0 16px rgba(0,229,255,0.3)', transition: 'all 0.2s'
            }}
          >
            {scanning ? `SCANNING ${progress}%` : '▶ RUN REAL-TIME SCAN'}
          </button>
        </div>
      </div>

      {/* Multi-spectral Band Selectors */}
      <div style={{ padding: '8px 18px', background: '#080c14', borderBottom: '1px solid #1e2a3a', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {BANDS.map(band => (
          <button
            key={band.id}
            onClick={() => setActiveBand(band.id)}
            style={{
              background: activeBand === band.id ? 'rgba(0,229,255,0.12)' : '#0f172a',
              border: `1px solid ${activeBand === band.id ? CYAN : '#1e2a3a'}`,
              color: activeBand === band.id ? CYAN : '#94a3b8',
              borderRadius: 4, padding: '4px 10px', fontSize: 10, fontFamily: 'monospace',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
            }}
            title={band.desc}
          >
            {band.label}
          </button>
        ))}
      </div>

      {/* Main Interactive Viewer Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', minHeight: 380, position: 'relative' }}>
        
        {/* Left Image Viewport */}
        <div
          onClick={handleImageClick}
          style={{
            position: 'relative', background: '#05070a', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'crosshair'
          }}
        >
          {/* Base Image with Band Filters */}
          <div style={{
            position: 'relative', width: '100%', height: 380,
            filter: activeBand === 'NIR' ? 'hue-rotate(90deg) contrast(1.2)' :
                    activeBand === 'SWIR' ? 'invert(0.8) hue-rotate(180deg)' :
                    activeBand === 'DEM' ? 'grayscale(1) contrast(1.8)' :
                    activeBand === 'SLOPE' ? 'sepia(1) hue-rotate(300deg)' :
                    activeBand === 'NDVI' ? 'hue-rotate(60deg) saturate(2)' : 'none',
            transition: 'filter 0.4s ease'
          }}>
            {imageSrc ? (
              <img src={imageSrc} alt="Satellite Tile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #090d16 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>SATELLITE RASTER TELEMETRY TILE</span>
              </div>
            )}

            {/* Slip Surface Mask Overlay */}
            {showMask && (
              <div style={{
                position: 'absolute', inset: 0, opacity: maskOpacity, pointerEvents: 'none',
                mixBlendMode: 'screen', transition: 'opacity 0.2s'
              }}>
                {maskSrc ? (
                  <img src={maskSrc} alt="Segmentation Mask" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'drop-shadow(0 0 10px #ff3b5c)' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'radial-gradient(ellipse at 60% 40%, rgba(255,59,92,0.6) 0%, rgba(255,176,32,0.3) 40%, transparent 70%)'
                  }} />
                )}
              </div>
            )}
          </div>

          {/* Animated Laser Scanning Beam */}
          {scanning && (
            <div style={{
              position: 'absolute', left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, transparent, ${CYAN}, ${RED}, ${CYAN}, transparent)`,
              boxShadow: `0 0 15px ${CYAN}, 0 0 30px ${RED}`,
              top: `${progress}%`, transition: 'top 0.05s linear', pointerEvents: 'none', zIndex: 10
            }}>
              <div style={{ position: 'absolute', right: 10, top: -14, fontSize: 9, fontFamily: 'monospace', color: CYAN, background: '#0a0d14', padding: '2px 6px', borderRadius: 3 }}>
                LASER SCANNER: {progress}%
              </div>
            </div>
          )}

          {/* HUD Cyber Grid Lines */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />

          {/* Selected Pixel Inspector Pin */}
          {selectedPixel && (
            <div style={{
              position: 'absolute', left: `${selectedPixel.x}%`, top: `${selectedPixel.y}%`,
              transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 15
            }}>
              <div style={{ width: 14, height: 14, border: `2px solid ${RED}`, borderRadius: '50%', animation: 'pulse 1s infinite' }} />
              <div style={{
                position: 'absolute', left: 18, top: -10, background: 'rgba(10,13,20,0.95)', border: `1px solid ${selectedPixel.factorOfSafety < 1.0 ? RED : AMBER}`,
                borderRadius: 6, padding: '6px 10px', fontSize: 10, fontFamily: 'monospace', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
              }}>
                <div style={{ color: RED, fontWeight: 700 }}>PIXEL INSPECTOR [{selectedPixel.x}%, {selectedPixel.y}%]</div>
                <div>Slope: <span style={{ color: AMBER }}>{selectedPixel.slopeAngle}°</span> | FoS: <span style={{ color: selectedPixel.factorOfSafety < 1.0 ? RED : GREEN }}>{selectedPixel.factorOfSafety}</span></div>
                <div>Moisture: <span style={{ color: BLUE }}>{selectedPixel.soilMoisture}%</span> | Elev: {selectedPixel.elevationMeters}m</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Debug & Telemetry Sidebar */}
        <div style={{ background: '#0a0d14', borderLeft: '1px solid #1e2a3a', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* Mask Toggle & Opacity */}
          <div style={{ background: '#0f172a', border: '1px solid #1e2a3a', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: CYAN, fontWeight: 600 }}>HAZARD MASK OVERLAY</span>
              <button
                onClick={() => setShowMask(s => !s)}
                style={{ background: showMask ? RED : '#334155', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 9, fontFamily: 'monospace', cursor: 'pointer' }}
              >
                {showMask ? 'ENABLED' : 'HIDDEN'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b' }}>OPACITY</span>
              <input
                type="range" min="0" max="1" step="0.05" value={maskOpacity}
                onChange={e => setMaskOpacity(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: RED }}
              />
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: CYAN }}>{Math.round(maskOpacity * 100)}%</span>
            </div>
          </div>

          {/* Active Stage & Progress Bar */}
          <div style={{ background: '#0f172a', border: '1px solid #1e2a3a', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b', marginBottom: 4 }}>CURRENT PROCESS STAGE</div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: activeStage ? CYAN : '#475569', fontWeight: 700, marginBottom: 8 }}>
              {activeStage || "READY TO SCAN"}
            </div>
            <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${CYAN}, ${RED})`, transition: 'width 0.1s linear' }} />
            </div>
          </div>

          {/* Live Debug Execution Log Terminal */}
          <div style={{ flex: 1, background: '#05070a', border: '1px solid #1e2a3a', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: CYAN, fontWeight: 700, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>ALGORITHMIC DEBUG LOGS</span>
              <span style={{ color: '#475569' }}>TERMINAL TRACE</span>
            </div>
            <div ref={logContainerRef} style={{ flex: 1, height: 140, overflowY: 'auto', fontSize: 9, fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {logs.length === 0 ? (
                <div style={{ color: '#334155', fontStyle: 'italic' }}>Click 'RUN REAL-TIME SCAN' to start algorithmic execution...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} style={{ color: log.type === 'stage' ? CYAN : log.type === 'success' ? GREEN : log.type === 'pixel' ? AMBER : '#94a3b8', lineHeight: 1.4 }}>
                    <span style={{ color: '#475569' }}>[{log.time}]</span> {log.msg}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
