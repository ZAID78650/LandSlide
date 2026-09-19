import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

/* ── Fetch real elevation grid from Open-Elevation API ── */
async function fetchElevationGrid(lat, lon, gridSize = 20, spanDeg = 0.3) {
  const half = spanDeg / 2;
  const locations = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const gridLat = lat - half + (r / (gridSize - 1)) * spanDeg;
      const gridLon = lon - half + (c / (gridSize - 1)) * spanDeg;
      locations.push({ latitude: parseFloat(gridLat.toFixed(5)), longitude: parseFloat(gridLon.toFixed(5)) });
    }
  }
  const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations }),
  });
  const data = await res.json();
  return data.results.map(r => r.elevation);
}

/* ── 3D Terrain Mesh ── */
function TerrainMesh({ elevations, gridSize, riskLevel, viewMode }) {
  const meshRef = useRef();

  const { geometry, minElev, maxElev } = useMemo(() => {
    if (!elevations || elevations.length < gridSize * gridSize) return { geometry: null, minElev: 0, maxElev: 1 };

    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const range = max - min || 1;

    const geom = new THREE.PlaneGeometry(8, 8, gridSize - 1, gridSize - 1);
    const pos = geom.attributes.position;

    // Apply elevation to Y axis (terrain height)
    for (let i = 0; i < pos.count; i++) {
      const elev = elevations[i] ?? min;
      const normalized = ((elev - min) / range) * 2.8; // Scale to 3D scene units
      pos.setZ(i, normalized);
    }

    geom.rotateX(-Math.PI / 2);
    geom.computeVertexNormals();
    return { geometry: geom, minElev: min, maxElev: max };
  }, [elevations, gridSize]);

  // Color the terrain by elevation or risk
  const vertexColors = useMemo(() => {
    if (!elevations || !geometry) return null;
    const min = minElev;
    const range = (maxElev - min) || 1;
    const colors = new Float32Array(elevations.length * 3);

    elevations.forEach((elev, i) => {
      const t = (elev - min) / range;
      let r, g, b;

      if (viewMode === 'thermal') {
        // False-color thermal: cold=blue → warm=red
        r = t;
        g = 1 - Math.abs(t - 0.5) * 2;
        b = 1 - t;
      } else if (viewMode === 'risk') {
        // Risk: low=green → mid=amber → high=red
        if (t < 0.4) { r = 0.1; g = 0.6 + t; b = 0.1; }
        else if (t < 0.7) { r = 0.9; g = 0.7 - t; b = 0.0; }
        else { r = 0.9; g = 0.1; b = 0.1; }
      } else {
        // Realistic: water=blue, lowland=green, rock=brown, snow=white
        if (elev < 50)       { r = 0.18; g = 0.32; b = 0.70; }
        else if (elev < 300) { r = 0.23; g = 0.47; b = 0.22; }
        else if (elev < 800) { r = 0.38; g = 0.34; b = 0.25; }
        else if (elev < 2000){ r = 0.55; g = 0.50; b = 0.42; }
        else                  { r = 0.85; g = 0.87; b = 0.90; }
      }
      colors[i * 3]     = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    });

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return colors;
  }, [elevations, geometry, minElev, maxElev, viewMode]);

  // Slow rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.08) * 0.15;
    }
  });

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        vertexColors={!!vertexColors}
        roughness={viewMode === 'thermal' ? 0.3 : 0.8}
        metalness={viewMode === 'thermal' ? 0.2 : 0.05}
        wireframe={viewMode === 'wireframe'}
      />
    </mesh>
  );
}

/* ── Risk Beacon (pulsing marker at highest point) ── */
function RiskBeacon({ riskLevel }) {
  const ref = useRef();
  const color = riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? '#ff3b5c' : riskLevel === 'MODERATE' ? '#ffb020' : '#22c55e';

  useFrame((state) => {
    if (ref.current) {
      const s = 1 + Math.sin(state.clock.getElapsedTime() * 3) * 0.3;
      ref.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh ref={ref} position={[0, 2, 0]}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  );
}

/* ── Loading Spinner (3D) ── */
function Spinner() {
  const ref = useRef();
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 2; });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[1, 0.08, 12, 40]} />
      <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={1.5} />
    </mesh>
  );
}

/* ── Main Exported Component ── */
export default function LocationTerrain3D({ location, riskData }) {
  const [elevations, setElevations]   = useState(null);
  const [fetchState, setFetchState]   = useState('idle'); // idle | loading | done | error
  const [viewMode, setViewMode]       = useState('realistic');
  const [minMax, setMinMax]           = useState({ min: 0, max: 0 });
  const GRID = 22;

  const riskLevel = riskData?.risk_level || riskData?.overall_risk_level || 'MODERATE';

  useEffect(() => {
    if (!location?.lat || !location?.lon) return;
    setElevations(null);
    setFetchState('loading');

    fetchElevationGrid(location.lat, location.lon, GRID, 0.35)
      .then(data => {
        setElevations(data);
        setMinMax({ min: Math.min(...data), max: Math.max(...data) });
        setFetchState('done');
      })
      .catch(err => {
        console.error('Elevation fetch failed:', err);
        // Synthetic fallback terrain using sin/cos noise
        const synth = Array.from({ length: GRID * GRID }, (_, i) => {
          const r = Math.floor(i / GRID), c = i % GRID;
          return 100 + Math.sin(r * 0.8) * 80 + Math.cos(c * 0.8) * 60 + Math.random() * 40;
        });
        setElevations(synth);
        setMinMax({ min: 20, max: 340 });
        setFetchState('synthetic');
      });
  }, [location?.lat, location?.lon]);

  if (!location) return (
    <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a6a8a', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40 }}>🗺️</div>
      <div style={{ fontFamily: 'monospace', fontSize: 13 }}>Search a location to generate its real 3D terrain</div>
    </div>
  );

  const riskColor = riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? '#ff3b5c' : riskLevel === 'MODERATE' ? '#ffb020' : '#22c55e';

  return (
    <div style={{ position: 'relative', width: '100%', height: 500, background: 'radial-gradient(circle at 50% 30%, #101520 0%, #060810 100%)', borderRadius: 12, overflow: 'hidden' }}>

      {/* WebGL Canvas */}
      <Canvas camera={{ position: [0, 5, 9], fov: 48 }} shadows style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[-5, 6, -5]} intensity={0.6} color="#4488ff" />
        <fog attach="fog" args={['#060810', 14, 28]} />

        <Suspense fallback={<Spinner />}>
          {fetchState === 'loading' && <Spinner />}

          {(fetchState === 'done' || fetchState === 'synthetic') && elevations && (
            <>
              <TerrainMesh elevations={elevations} gridSize={GRID} riskLevel={riskLevel} viewMode={viewMode} />
              <RiskBeacon riskLevel={riskLevel} />
            </>
          )}
        </Suspense>

        <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.4} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>

      {/* ── Top-Left HUD ── */}
      <div style={{
        position: 'absolute', top: 14, left: 14,
        background: 'rgba(8,12,20,0.88)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
        padding: '12px 16px', fontFamily: 'monospace', fontSize: 11,
        color: '#ccc', minWidth: 210, pointerEvents: 'none', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: riskColor, boxShadow: `0 0 8px ${riskColor}` }} />
          <span style={{ color: '#00e5ff', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE TERRAIN — {location.locality || location.city || 'Location'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { k: 'LATITUDE',  v: `${Number(location.lat).toFixed(5)}° N` },
            { k: 'LONGITUDE', v: `${Number(location.lon).toFixed(5)}° E` },
            { k: 'ELEV RANGE',v: fetchState === 'done' ? `${minMax.min}m — ${minMax.max}m` : '—' },
            { k: 'RISK LEVEL',v: riskLevel, c: riskColor },
          ].map(({ k, v, c }) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: '#4a6a8a' }}>{k}:</span>
              <span style={{ color: c || '#e0e0e0', fontWeight: c ? 700 : 400 }}>{v}</span>
            </div>
          ))}
          {riskData?.chance_pct != null && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#4a6a8a' }}>RISK PERCENTAGE:</span>
                <span style={{ color: riskColor, fontWeight: 700 }}>{riskData.chance_pct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4a6a8a' }}>HAZARD SCORE:</span>
                <span style={{ color: riskColor, fontWeight: 700 }}>{riskData.overall_score}/100</span>
              </div>
            </div>
          )}
        </div>
        {fetchState === 'synthetic' && (
          <div style={{ marginTop: 8, fontSize: 9, color: '#ff6b35', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            ⚠ Elevation API unavailable — synthetic terrain
          </div>
        )}
      </div>

      {/* ── Loading state overlay ── */}
      {fetchState === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14,
          background: 'rgba(6,8,16,0.6)', backdropFilter: 'blur(4px)', zIndex: 20,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #00e5ff', borderTopColor: 'transparent', animation: 'spin3d 0.9s linear infinite' }} />
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#00e5ff' }}>Fetching real elevation data for {location.locality || location.city || 'this location'}...</div>
          <div style={{ fontSize: 10, color: '#4a6a8a', fontFamily: 'monospace' }}>Source: Open-Elevation · {GRID}×{GRID} grid</div>
        </div>
      )}

      {/* ── View mode controls ── */}
      <div style={{
        position: 'absolute', top: 14, right: 14, display: 'flex', gap: 4,
        background: 'rgba(8,12,20,0.9)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 4, zIndex: 10,
      }}>
        {[
          { id: 'realistic',  label: '🌍 Realistic' },
          { id: 'thermal',    label: '🌡️ Thermal' },
          { id: 'risk',       label: '⚠️ Risk Map' },
          { id: 'wireframe',  label: '⬡ Wireframe' },
        ].map(m => (
          <button key={m.id} onClick={() => setViewMode(m.id)} style={{
            background: viewMode === m.id ? '#00e5ff' : 'transparent',
            color: viewMode === m.id ? '#000' : '#6a8aaa',
            border: 'none', borderRadius: 6, padding: '5px 10px',
            fontFamily: 'monospace', fontSize: 10, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>{m.label}</button>
        ))}
      </div>

      {/* ── Bottom legend ── */}
      <div style={{
        position: 'absolute', bottom: 12, left: 14,
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'monospace', fontSize: 10, color: '#4a6a8a',
        background: 'rgba(6,8,16,0.7)', padding: '4px 12px', borderRadius: 4,
        backdropFilter: 'blur(6px)', pointerEvents: 'none',
      }}>
        <span>🖱️ Drag: Rotate</span>
        <span>·</span>
        <span>Scroll: Zoom</span>
        <span>·</span>
        <span>Right-click: Pan</span>
      </div>

      <div style={{
        position: 'absolute', bottom: 12, right: 14,
        fontFamily: 'monospace', fontSize: 10, color: '#4a6a8a',
        background: 'rgba(6,8,16,0.7)', padding: '4px 10px', borderRadius: 4, backdropFilter: 'blur(6px)',
      }}>
        <span style={{ color: '#00e5ff' }}>✦</span> Open-Elevation · {GRID}×{GRID} DEM · Real terrain
      </div>

      <style>{`@keyframes spin3d { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
