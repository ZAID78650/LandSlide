import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const SCAN_DETAILS = {
  'SAT-RECON': {
    waveform: 'MULTISPECTRAL',
    bands: ['VIS-Red', 'NIR', 'SWIR-1', 'SWIR-2'],
    processing: ['Atmospheric Correction', 'NDVI Computation', 'Change Detection', 'Spectral Unmixing'],
  },
  'UAV-SWARM': {
    waveform: 'RGB + LiDAR',
    bands: ['RGB-TrueColor', 'LiDAR-DSM', 'LiDAR-CHM', 'Thermal'],
    processing: ['Photogrammetry', '3D Reconstruction', 'Orthomosaic', 'Object Detection'],
  },
  'SAR-RADAR': {
    waveform: 'C-Band SAR',
    bands: ['VV-Pol', 'VH-Pol', 'Interferogram', 'Coherence'],
    processing: ['DInSAR', 'PS-InSAR', 'Deformation Map', 'Velocity Field'],
  },
  'LIDAR-TOPO': {
    waveform: '532nm / 1064nm',
    bands: ['FullWaveform', 'FirstReturn', 'LastReturn', 'Intensity'],
    processing: ['DEM Generation', 'DSM Extraction', 'Fracture Analysis', 'Slope Modeling'],
  },
};

export default function ResponseCenterPage() {
  const [activeProtocols, setActiveProtocols] = useState({});
  const [scanStatus, setScanStatus] = useState({});
  const [scanProgress, setScanProgress] = useState({});
  const [scanStage, setScanStage] = useState({});
  const [scanSubStage, setScanSubStage] = useState({});
  const [expandedScan, setExpandedScan] = useState(null);
  const intervalRefs = useRef({});

  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, []);

  const handleActivateProtocol = (code) => {
    setActiveProtocols(prev => ({ ...prev, [code]: 'ACTIVATING' }));
    setTimeout(() => {
      setActiveProtocols(prev => ({ ...prev, [code]: 'ACTIVE' }));
    }, 2500);
  };

  const handleExecuteScan = (code) => {
    setScanStatus(prev => ({ ...prev, [code]: 'SCANNING' }));
    setScanProgress(prev => ({ ...prev, [code]: 0 }));
    setScanStage(prev => ({ ...prev, [code]: 'INITIALIZING' }));
    setScanSubStage(prev => ({ ...prev, [code]: 'Calibrating sensors...' }));

    const details = SCAN_DETAILS[code];
    let progress = 0;
    let stageIdx = 0;
    const stages = ['INITIALIZING', 'CALIBRATING', 'ACQUIRING', 'PROCESSING', 'ANALYZING', 'FINALIZING'];
    const subStages = [
      'Powering up subsystems...',
      'Calibrating sensors...',
      'Locking target coordinates...',
      'Acquiring data stream...',
      details.processing[0] + '...',
      details.processing[1] + '...',
      details.processing[2] + '...',
      details.processing[3] + '...',
      'Generating results...',
      'Saving output...',
    ];

    if (intervalRefs.current[code]) clearInterval(intervalRefs.current[code]);

    intervalRefs.current[code] = setInterval(() => {
      progress += Math.random() * 4 + 1.5;
      if (progress > 100) progress = 100;
      setScanProgress(prev => ({ ...prev, [code]: Math.floor(progress) }));

      const newStage = stages[Math.min(Math.floor((progress / 100) * stages.length), stages.length - 1)];
      setScanStage(prev => ({ ...prev, [code]: newStage }));

      const subIdx = Math.min(Math.floor((progress / 100) * subStages.length), subStages.length - 1);
      setScanSubStage(prev => ({ ...prev, [code]: subStages[subIdx] }));

      if (progress >= 100) {
        clearInterval(intervalRefs.current[code]);
        setTimeout(() => {
          setScanStatus(prev => ({ ...prev, [code]: 'COMPLETE' }));
        }, 500);
      }
    }, 250);
  };

  const protocols = [
    {
      code: 'ALPHA-7',
      name: 'Critical Landslide Response',
      severity: 'CRITICAL',
      steps: [
        'Activate district emergency operations center',
        'Deploy advance recon team to coordinates',
        'Pre-position SAR equipment at staging areas',
        'Issue public evacuation advisory via EAS',
        'Coordinate with NDRF rapid deployment unit',
        'Establish medical triage point at safe distance',
      ],
    },
    {
      code: 'BRAVO-3',
      name: 'Flood Inundation Response',
      severity: 'HIGH',
      steps: [
        'Activate river monitoring alert cascade',
        'Pre-position boats and rescue equipment',
        'Coordinate with dam authority for controlled release',
        'Issue flood watch for downstream communities',
        'Activate emergency shelters at elevated sites',
      ],
    },
    {
      code: 'CHARLIE-1',
      name: 'Earthquake Rapid Assessment',
      severity: 'HIGH',
      steps: [
        'Activate seismic monitoring enhanced mode',
        'Dispatch structural damage assessment teams',
        'Coordinate with NDRF for urban search and rescue',
        'Activate medical surge capacity at hospitals',
        'Issue public safety advisory',
      ],
    },
  ];

  const scanningMethods = [
    {
      code: 'SAT-RECON',
      name: 'Satellite Multispectral Scan',
      status: 'AVAILABLE',
      resolution: '0.5m',
      desc: 'Deploy high-resolution optical and multispectral satellite imaging over the target zone.',
    },
    {
      code: 'UAV-SWARM',
      name: 'Drone Reconnaissance',
      status: 'AVAILABLE',
      resolution: '0.05m',
      desc: 'Dispatch rapid-response autonomous drone swarm for hyper-local aerial mapping.',
    },
    {
      code: 'SAR-RADAR',
      name: 'Synthetic Aperture Radar',
      status: 'ORBIT PENDING',
      resolution: '1.0m',
      desc: 'Penetrate cloud cover and canopy to detect ground deformation and moisture.',
    },
    {
      code: 'LIDAR-TOPO',
      name: 'LiDAR Topographical Survey',
      status: 'AVAILABLE',
      resolution: '0.1m',
      desc: 'High-precision laser scanning to detect micro-fractures in slopes.',
    },
  ];

  const activeResources = [
    { name: 'NDRF Battalion 4', type: 'SEARCH & RESCUE', location: 'Dehradun Base', status: 'AVAILABLE', count: 45 },
    { name: 'Air Rescue Squadron', type: 'HELICOPTER', location: 'Jolly Grant Airport', status: 'ON MISSION', count: 3 },
    { name: 'Medical Response Unit Alpha', type: 'MEDICAL', location: 'Rishikesh', status: 'AVAILABLE', count: 12 },
    { name: 'Engineering Corps Unit 7', type: 'INFRASTRUCTURE', location: 'Haridwar', status: 'AVAILABLE', count: 28 },
  ];

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, animation: 'fadeInUp 0.4s ease-out' }}>
        <h2 style={{ marginBottom: 4 }}>Response Center</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Emergency response protocols, scanning operations, and resource coordination.
        </p>
      </div>

      {/* Response Protocols */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <span className="label-caps">RESPONSE PROTOCOLS</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {Object.values(activeProtocols).filter(v => v === 'ACTIVE').length} ACTIVE
          </span>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {protocols.map(({ code, name, severity, steps }) => {
            const currentStatus = activeProtocols[code] || 'STANDBY';
            const isActivating = currentStatus === 'ACTIVATING';
            const isActive = currentStatus === 'ACTIVE';
            const sevColor = severity === 'CRITICAL' ? 'var(--red)' : 'var(--orange)';

            return (
              <div key={code} style={{
                background: isActive ? 'rgba(34,197,94,0.06)' : 'var(--bg-card)',
                border: isActive ? '1px solid var(--green)' : isActivating ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                borderRadius: 8, padding: 16, transition: 'all 0.4s ease',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Activation shimmer */}
                {isActivating && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.05), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                    pointerEvents: 'none',
                  }} />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                        color: isActive ? 'var(--green)' : 'var(--cyan)',
                      }}>
                        PROTOCOL {code}
                      </span>
                      <span style={{
                        fontSize: 8, padding: '1px 6px', borderRadius: 3,
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        background: `${sevColor}20`, color: sevColor,
                      }}>
                        {severity}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: isActive ? 'var(--green)' : 'inherit' }}>{name}</div>
                  </div>
                  <span className={`chip ${isActive ? 'chip-green' : isActivating ? 'chip-cyan' : 'chip-amber'}`} style={{ height: 'fit-content' }}>
                    {currentStatus}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
                  {steps.map((step, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      opacity: isActive ? 1 : 0.7,
                      animation: isActive ? `fadeInUp 0.3s ease-out ${i * 0.08}s both` : 'none',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        color: isActive ? 'var(--green)' : 'var(--cyan)',
                        flexShrink: 0, marginTop: 2, minWidth: 16,
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontSize: 11, lineHeight: 1.5,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        textDecoration: isActive ? 'none' : 'none',
                      }}>{step}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                  disabled={isActivating || isActive}
                  onClick={() => handleActivateProtocol(code)}
                  style={{ marginTop: 14, width: '100%', justifyContent: 'center', position: 'relative' }}
                >
                  {isActive ? '✓ PROTOCOL ACTIVE' : isActivating ? 'ACTIVATING...' : 'ACTIVATE PROTOCOL'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scanning Methods — Enhanced */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <span className="label-caps">ADVANCED SCANNING OPERATIONS</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {scanningMethods.map(sm => {
              const st = scanStatus[sm.code];
              return st === 'COMPLETE' ? (
                <span key={sm.code} className="chip chip-green" style={{ fontSize: 8, padding: '2px 6px' }}>✓ {sm.code}</span>
              ) : st === 'SCANNING' ? (
                <span key={sm.code} className="chip chip-cyan" style={{ fontSize: 8, padding: '2px 6px' }}>◉ {sm.code}</span>
              ) : null;
            })}
          </div>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {scanningMethods.map(({ code, name, status, resolution, desc }) => {
            const currentScanStatus = scanStatus[code];
            const isScanning = currentScanStatus === 'SCANNING';
            const isComplete = currentScanStatus === 'COMPLETE';
            const isDisabled = status !== 'AVAILABLE' && !isScanning && !isComplete;
            const details = SCAN_DETAILS[code];
            const isExpanded = expandedScan === code;

            return (
              <div key={code} style={{
                background: isComplete ? 'rgba(34,197,94,0.06)' : isScanning ? 'rgba(0,229,255,0.03)' : 'var(--bg-card)',
                border: isComplete ? '1px solid var(--green)' : isScanning ? '1px solid rgba(0,229,255,0.3)' : '1px solid var(--border-subtle)',
                borderRadius: 8, padding: 16, transition: 'all 0.3s ease',
                display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
              }}>
                {/* Scanning grid overlay */}
                {isScanning && (
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `
                      repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,229,255,0.03) 19px, rgba(0,229,255,0.03) 20px),
                      repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,229,255,0.03) 19px, rgba(0,229,255,0.03) 20px)
                    `,
                    animation: 'scanGrid 3s linear infinite',
                  }} />
                )}

                {/* Scan line */}
                {isScanning && (
                  <div style={{
                    position: 'absolute', left: 0, width: '100%', height: 2,
                    background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
                    boxShadow: '0 0 12px var(--cyan)',
                    animation: 'scanLine 2s ease-in-out infinite',
                    zIndex: 2,
                  }} />
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                      color: isComplete ? 'var(--green)' : isScanning ? 'var(--cyan)' : 'var(--cyan)',
                    }}>
                      {code}
                    </div>
                    <span className={`chip ${isComplete ? 'chip-green' : isScanning ? 'chip-cyan' : status === 'AVAILABLE' ? 'chip-green' : 'chip-amber'}`} style={{ fontSize: 8, padding: '2px 6px' }}>
                      {isComplete ? 'READY' : isScanning ? scanStage[code] || 'SCANNING' : status}
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: isComplete ? 'var(--green)' : 'inherit' }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 8 }}>{desc}</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>MAX RES</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isComplete ? 'var(--green)' : 'var(--cyan)', fontWeight: 700 }}>{resolution}</span>
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>
                    WAVEFORM: <span style={{ color: 'var(--cyan)' }}>{details.waveform}</span>
                  </div>

                  {/* Expand Details */}
                  {details && (
                    <button
                      onClick={() => setExpandedScan(isExpanded ? null : code)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--cyan)',
                        fontSize: 9, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                        padding: '4px 0', letterSpacing: '0.05em',
                      }}
                    >
                      {isExpanded ? '▾ COLLAPSE DETAILS' : '▸ EXPAND DETAILS'}
                    </button>
                  )}

                  {isExpanded && details && (
                    <div style={{
                      marginTop: 8, padding: 8, background: 'rgba(0,0,0,0.3)',
                      borderRadius: 4, border: '1px solid rgba(0,229,255,0.08)',
                      animation: 'slideDown 0.3s ease-out',
                    }}>
                      <div style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 4 }}>
                        PROCESSING PIPELINE
                      </div>
                      {details.processing.map((proc, i) => (
                        <div key={i} style={{
                          fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                          padding: '2px 0', display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <span style={{ color: 'var(--cyan)', fontSize: 8 }}>●</span>
                          {proc}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Progress */}
                  {isScanning && (
                    <div style={{ marginTop: 10 }}>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${scanProgress[code] || 0}%` }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {scanSubStage[code]}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                          {scanProgress[code] || 0}%
                        </span>
                      </div>
                    </div>
                  )}

                  {!isScanning && (
                    <button
                      className={`btn btn-sm ${isComplete ? 'btn-primary' : 'btn-secondary'}`}
                      disabled={isDisabled || isComplete}
                      onClick={() => handleExecuteScan(code)}
                      style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                    >
                      {isComplete ? '✓ VIEW RESULTS' : isDisabled ? 'UNAVAILABLE' : '▶ EXECUTE SCAN'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Resources */}
      <div className="panel">
        <div className="panel-header">
          <span className="label-caps">RESPONSE RESOURCES</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="chip chip-green" style={{ fontSize: 8 }}>
              {activeResources.filter(r => r.status === 'AVAILABLE').length} AVAILABLE
            </span>
            <span className="chip chip-orange" style={{ fontSize: 8 }}>
              {activeResources.filter(r => r.status !== 'AVAILABLE').length} DEPLOYED
            </span>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>UNIT</th>
              <th>TYPE</th>
              <th>CURRENT LOCATION</th>
              <th>STATUS</th>
              <th>PERSONNEL</th>
              <th>DISPATCH</th>
            </tr>
          </thead>
          <tbody>
            {activeResources.map((r) => (
              <tr key={r.name}>
                <td style={{ fontWeight: 500 }}>{r.name}</td>
                <td className="mono-cell" style={{ fontSize: 10 }}>{r.type}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.location}</td>
                <td>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                    color: r.status === 'AVAILABLE' ? 'var(--green)' : 'var(--orange)',
                  }}>
                    {r.status === 'AVAILABLE' ? '●' : '◉'} {r.status}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)' }}>{r.count}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" disabled={r.status !== 'AVAILABLE'}>
                    DISPATCH
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
