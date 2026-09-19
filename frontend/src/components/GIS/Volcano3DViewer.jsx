import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ErrorBoundary from '../UI/ErrorBoundary';

// Procedural Plume Particles (Smoke & Ash)
function SmokePlume({ isErupting, riskScore = 50, viewMode }) {
  const particleCount = isErupting ? 120 : 60;
  const particlesRef = useRef();

  const [positions, scales, speeds, phases] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const sca = new Float32Array(particleCount);
    const spd = new Float32Array(particleCount);
    const phs = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = 2.0 + Math.random() * 3.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      sca[i] = 0.15 + Math.random() * 0.35;
      spd[i] = 0.015 + Math.random() * 0.035 * (riskScore / 50);
      phs[i] = Math.random() * Math.PI * 2;
    }
    return [pos, sca, spd, phs];
  }, [particleCount, riskScore]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const geom = particlesRef.current.geometry;
    const posAttr = geom.attributes.position;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < particleCount; i++) {
      let y = posAttr.getY(i);
      y += speeds[i];

      let x = posAttr.getX(i);
      let z = posAttr.getZ(i);

      // Expanding swirl effect as it rises
      x += Math.sin(time * 1.5 + phases[i]) * 0.008;
      z += Math.cos(time * 1.5 + phases[i]) * 0.008;

      if (y > 5.8) {
        y = 2.0;
        x = (Math.random() - 0.5) * 0.35;
        z = (Math.random() - 0.5) * 0.35;
      }

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });

  const plumeColor = viewMode === 'thermal'
    ? (riskScore > 65 ? '#ff3b5c' : '#ffb020')
    : (isErupting ? '#2d2522' : '#8c827a');

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.45}
        color={plumeColor}
        transparent
        opacity={viewMode === 'thermal' ? 0.8 : 0.45}
        depthWrite={false}
        blending={viewMode === 'thermal' ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
}

// Concentric Thermal & Seismic Pulse Waves
function ThermalPulseWaves({ riskScore = 50 }) {
  const ringsRef = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ringsRef.current.forEach((mesh, index) => {
      if (mesh) {
        const offset = index * 1.2;
        const progress = ((t + offset) % 3.6) / 3.6;
        mesh.scale.set(1 + progress * 4.2, 1 + progress * 4.2, 1);
        mesh.material.opacity = (1 - progress) * (riskScore > 60 ? 0.6 : 0.3);
      }
    });
  });

  const waveColor = riskScore > 75 ? '#ff3b5c' : (riskScore > 50 ? '#ff6b35' : '#00e5ff');

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => (ringsRef.current[i] = el)}
          position={[0, 0, 0]}
        >
          <ringGeometry args={[1.5, 1.6, 48]} />
          <meshBasicMaterial
            color={waveColor}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// 3D Volcano Cone, Magma Chamber, and Conduit
function VolcanoModel({ volcano, analytics, viewMode, showSmoke = true, showWaves = true }) {
  const groupRef = useRef();
  const magmaRef = useRef();
  const conduitRef = useRef();
  const craterLightRef = useRef();

  const isErupting = (volcano?.status || '').toUpperCase().includes('ERUPT');
  const riskScore = analytics?.overall_score || 55;
  const chancePct = analytics?.chance_pct || 60;
  const isShield = (volcano?.volcano_type || '').toLowerCase().includes('shield');

  // Smooth lerp for model transition when volcano changes
  const targetScaleY = isShield ? 0.75 : 1.25;
  const targetScaleXZ = isShield ? 1.45 : 1.05;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScaleY, 3, delta);
      groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScaleXZ, 3, delta);
      groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScaleXZ, 3, delta);
    }

    // Pulsing magma chamber breathing animation
    const t = state.clock.getElapsedTime();
    const pulseRate = 2.0 + (riskScore / 100) * 3.5;
    const pulseIntensity = Math.sin(t * pulseRate) * 0.12 + 0.98;

    if (magmaRef.current) {
      magmaRef.current.scale.set(pulseIntensity, pulseIntensity, pulseIntensity);
      if (magmaRef.current.material) {
        magmaRef.current.material.emissiveIntensity = 1.2 + Math.sin(t * pulseRate) * 0.8;
      }
    }

    if (conduitRef.current && conduitRef.current.material) {
      conduitRef.current.material.emissiveIntensity = 0.9 + Math.sin(t * pulseRate) * 0.5;
    }

    if (craterLightRef.current) {
      craterLightRef.current.intensity = 2.5 + Math.sin(t * pulseRate) * 1.8;
    }
  });

  // Terrain Mountain Geometry (cone with crater)
  const mountainGeom = useMemo(() => {
    const geom = new THREE.CylinderGeometry(0.35, 2.4, 2.2, 32, 16, true);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const noise = (Math.sin(x * 6) + Math.cos(z * 6) + Math.sin(y * 4)) * 0.04;
      pos.setXYZ(i, x + noise, y, z + noise);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Material selection based on view mode
  const mountainMaterial = useMemo(() => {
    if (viewMode === 'xray') {
      return new THREE.MeshPhysicalMaterial({
        color: '#1a2233',
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.82,
        thickness: 0.8,
        transparent: true,
        opacity: 0.45,
        wireframe: false,
      });
    } else if (viewMode === 'thermal') {
      return new THREE.MeshStandardMaterial({
        color: riskScore > 65 ? '#a31d1d' : '#2b4c7e',
        roughness: 0.4,
        metalness: 0.3,
        emissive: riskScore > 65 ? '#591010' : '#08172c',
        emissiveIntensity: 0.5,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: '#2b2d35',
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });
  }, [viewMode, riskScore]);

  const magmaColor = chancePct > 70 ? '#ff3b20' : (chancePct > 40 ? '#ff8c00' : '#d95300');
  const magmaEmissive = chancePct > 70 ? '#ff1e00' : '#ff5100';

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Mountain Cone */}
      <mesh geometry={mountainGeom} material={mountainMaterial} position={[0, 1.1, 0]} castShadow receiveShadow />

      {/* Caldera Crater Rim & Magma Pool */}
      <mesh position={[0, 2.05, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.12, 24]} />
        <meshStandardMaterial
          color={magmaColor}
          emissive={magmaEmissive}
          emissiveIntensity={viewMode === 'xray' ? 2.5 : 1.8}
          roughness={0.2}
        />
      </mesh>

      {/* Caldera Lava Glow Light */}
      <pointLight
        ref={craterLightRef}
        position={[0, 2.3, 0]}
        color={magmaColor}
        intensity={2.8}
        distance={6}
        decay={2}
      />

      {/* Subsurface Magma Chamber */}
      <group position={[0, -0.3, 0]}>
        <mesh ref={magmaRef}>
          <sphereGeometry args={[0.65, 24, 24]} />
          <meshStandardMaterial
            color={magmaColor}
            emissive={magmaEmissive}
            emissiveIntensity={1.5}
            roughness={0.25}
            transparent={viewMode !== 'xray'}
            opacity={viewMode === 'xray' ? 1.0 : 0.85}
          />
        </mesh>
        {/* Magma Conduit (Pipe to Crater) */}
        <mesh ref={conduitRef} position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.12, 0.18, 1.8, 16]} />
          <meshStandardMaterial
            color={magmaColor}
            emissive={magmaEmissive}
            emissiveIntensity={1.2}
            roughness={0.3}
            transparent={viewMode !== 'xray'}
            opacity={viewMode === 'xray' ? 1.0 : 0.75}
          />
        </mesh>
      </group>

      {/* Ground Bedrock Base */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[3.2, 3.4, 0.1, 32]} />
        <meshStandardMaterial
          color="#101318"
          roughness={0.9}
          metalness={0.1}
          wireframe={viewMode === 'xray'}
        />
      </mesh>

      {/* Smoke & Ash Plume */}
      {showSmoke && <SmokePlume isErupting={isErupting} riskScore={riskScore} viewMode={viewMode} />}

      {/* Concentric Seismic & Thermal Hazard Waves */}
      {showWaves && <ThermalPulseWaves riskScore={riskScore} />}
    </group>
  );
}

// 2D Tactical Fallback for systems without WebGL or rendering issues
function VolcanoTacticalFallback({ volcano, analytics }) {
  const chancePct = analytics?.chance_pct || 58;
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'radial-gradient(ellipse at center, #181d28 0%, #0a0c10 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px',
      position: 'relative'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '12px',
        filter: 'drop-shadow(0 0 16px rgba(255, 59, 92, 0.4))'
      }}>
        🌋
      </div>
      <h3 style={{ fontSize: '20px', color: 'var(--cyan)', marginBottom: '6px' }}>
        {volcano?.name || 'Volcano Monitoring Node'}
      </h3>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginBottom: '16px'
      }}>
        {volcano?.volcano_type || 'Stratovolcano'} · Elevation: {volcano?.elevation_m || 2400}m
      </div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 16px',
        borderRadius: '20px',
        background: chancePct > 65 ? 'rgba(255, 59, 92, 0.15)' : 'rgba(255, 176, 32, 0.15)',
        border: `1px solid ${chancePct > 65 ? 'var(--red)' : 'var(--amber)'}`,
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        fontWeight: 700,
        color: chancePct > 65 ? 'var(--red)' : 'var(--amber)'
      }}>
        {analytics?.chance_text || `Eruption Probability: ${chancePct}%`}
      </div>
    </div>
  );
}

export default function Volcano3DViewer({
  volcano,
  analytics,
  onViewDetails
}) {
  const [viewMode, setViewMode] = useState('realistic'); // 'realistic' | 'xray' | 'thermal'
  const [showSmoke, setShowSmoke] = useState(true);
  const [showWaves, setShowWaves] = useState(true);
  const controlsRef = useRef();

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const chancePct = analytics?.chance_pct || 58;
  const chanceLevel = analytics?.chance_level || 'ELEVATED';
  const chanceColor = chancePct > 70 ? 'var(--red)' : (chancePct > 45 ? 'var(--amber)' : 'var(--cyan)');

  return (
    <ErrorBoundary fallback={() => <VolcanoTacticalFallback volcano={volcano} analytics={analytics} />}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '490px',
        background: 'radial-gradient(circle at 50% 35%, #131722 0%, #080a0f 100%)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}>
        {/* WebGL 3D Canvas */}
        <Canvas
          camera={{ position: [0, 2.8, 5.2], fov: 46 }}
          style={{ width: '100%', height: '100%' }}
          shadows
        >
          <Suspense fallback={null}>
            <color attach="background" args={['#090b10']} />
            <fog attach="fog" args={['#090b10', 6, 15]} />

            {/* Ambient & Directional Lighting */}
            <ambientLight intensity={0.45} />
            <directionalLight
              position={[5, 8, 4]}
              intensity={1.3}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <pointLight position={[-4, 2, -3]} color="#2979ff" intensity={0.6} />

            {/* 3D Volcano Scene */}
            <VolcanoModel
              volcano={volcano}
              analytics={analytics}
              viewMode={viewMode}
              showSmoke={showSmoke}
              showWaves={showWaves}
            />

            {/* Smooth OrbitControls */}
            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.07}
              minDistance={2.4}
              maxDistance={9.5}
              maxPolarAngle={Math.PI / 2 - 0.04}
            />
          </Suspense>
        </Canvas>

        {/* Top-Center Floating Cyber Badge (Pure CSS animation, zero font suspension) */}
        <div style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(10, 14, 22, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          borderRadius: 30,
          padding: '6px 18px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(0, 229, 255, 0.1)',
          pointerEvents: 'none',
          zIndex: 10,
          animation: 'floatingBadge 3s ease-in-out infinite'
        }}>
          <span style={{ fontSize: 14 }}>🌋</span>
          <span style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.02em'
          }}>
            {volcano?.name || 'Volcano Dynamics Hub'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            color: chanceColor,
            letterSpacing: '0.05em'
          }}>
            {chanceLevel} · {chancePct}% CHANCE
          </span>
        </div>

        {/* Top-Left Telemetry HUD Card */}
        <div style={{
          position: 'absolute',
          top: 14,
          left: 14,
          background: 'rgba(12, 16, 25, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          padding: '12px 16px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          pointerEvents: 'none',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.55)',
          zIndex: 10,
          minWidth: 200
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: chanceColor,
              boxShadow: `0 0 8px ${chanceColor}`
            }} />
            <span style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em' }}>
              3D VOLCANO DYNAMICS
            </span>
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: 10, marginBottom: 10 }}>
            {volcano?.volcano_type || 'Stratovolcano'} · ELEV: {volcano?.elevation_m || 2400}m
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
            <span style={{ color: 'var(--text-muted)' }}>PROBABILITY:</span>
            <span style={{ color: chanceColor, fontWeight: 700 }}>
              {chancePct}% ({chanceLevel})
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
            <span style={{ color: 'var(--text-muted)' }}>MAGMA DEPTH:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {analytics?.magma_chamber_depth_km || 4.8} km
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
            <span style={{ color: 'var(--text-muted)' }}>ASCENT RATE:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {analytics?.magma_ascent_rate_m_hr || 1.4} m/hr
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: 'var(--text-muted)' }}>EST. VEI INDEX:</span>
            <span style={{ color: 'var(--amber)', fontWeight: 700 }}>
              VEI-{analytics?.estimated_vei || 3}
            </span>
          </div>
        </div>

        {/* Top-Right: View Mode & Controls Tabs */}
        <div style={{
          position: 'absolute',
          top: 14,
          right: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
          zIndex: 10
        }}>
          {/* View Mode Segmented Controls */}
          <div style={{
            display: 'flex',
            gap: 4,
            background: 'rgba(12, 16, 25, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
          }}>
            {[
              { id: 'realistic', label: '🌋 Surface', hint: 'Photorealistic geologic slope' },
              { id: 'xray', label: '🔬 Magma X-Ray', hint: 'Translucent crust & magma chamber' },
              { id: 'thermal', label: '🌡️ Thermal IR', hint: 'False-color infrared thermal map' }
            ].map((mode) => {
              const isActive = viewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  title={mode.hint}
                  style={{
                    background: isActive ? 'var(--cyan)' : 'transparent',
                    color: isActive ? '#000' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive ? '0 0 12px rgba(0, 229, 255, 0.4)' : 'none'
                  }}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Quick Toggles: Plume, Waves & Camera Reset */}
          <div style={{
            display: 'flex',
            gap: 6,
            background: 'rgba(12, 16, 25, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            padding: '4px 8px'
          }}>
            <button
              onClick={() => setShowSmoke(!showSmoke)}
              className="btn-ghost btn-sm"
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                padding: '3px 8px',
                color: showSmoke ? 'var(--cyan)' : 'var(--text-muted)'
              }}
              title="Toggle ash & smoke plume"
            >
              💨 PLUME: {showSmoke ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowWaves(!showWaves)}
              className="btn-ghost btn-sm"
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                padding: '3px 8px',
                color: showWaves ? 'var(--cyan)' : 'var(--text-muted)'
              }}
              title="Toggle seismic/thermal shockwaves"
            >
              🌊 WAVES: {showWaves ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={resetCamera}
              className="btn-ghost btn-sm"
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '3px 8px' }}
              title="Reset 3D camera angle"
            >
              🔄 RESET CAM
            </button>
          </div>
        </div>

        {/* Bottom Interactive Navigation Prompt */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          pointerEvents: 'none',
          background: 'rgba(10, 14, 20, 0.7)',
          padding: '4px 10px',
          borderRadius: 4,
          backdropFilter: 'blur(6px)'
        }}>
          <span>🖱️ Left-Click + Drag: Rotate 360°</span>
          <span>·</span>
          <span>Scroll: Zoom In/Out</span>
          <span>·</span>
          <span>Right-Click: Pan</span>
        </div>

        {/* Bottom Right Source Badge */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 14,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          background: 'rgba(10, 14, 20, 0.7)',
          padding: '4px 10px',
          borderRadius: 4,
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ color: 'var(--cyan)' }}>✦</span>
          <span>{analytics?.api_source || 'NASA EONET / USGS Telemetry'}</span>
        </div>
      </div>
    </ErrorBoundary>
  );
}
