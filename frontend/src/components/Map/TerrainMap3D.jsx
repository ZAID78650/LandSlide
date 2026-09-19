import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ─── Terrain Mesh ─────────────────────────────────────────────────────────────
function TerrainMesh({ incidents = [] }) {
  const meshRef = useRef();
  const wireRef = useRef();

  const geometry = useMemo(() => {
    const size = 80;
    const segs = 120;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);

    const pos = geo.attributes.position;
    const simplex = createSimplexLike();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      let h = 0;
      h += simplex(x * 0.05, z * 0.05) * 8;
      h += simplex(x * 0.12, z * 0.12) * 4;
      h += simplex(x * 0.3, z * 0.3) * 1.5;
      h += simplex(x * 0.8, z * 0.8) * 0.4;
      pos.setZ(i, h);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      meshRef.current.material.uniforms.time.value = t;
    }
  });

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colorLow:  { value: new THREE.Color('#0d1520') },
      colorMid:  { value: new THREE.Color('#152535') },
      colorHigh: { value: new THREE.Color('#1e3550') },
      scanColor: { value: new THREE.Color('#00e5ff') },
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      void main() {
        vPosition = position;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorLow;
      uniform vec3 colorMid;
      uniform vec3 colorHigh;
      uniform vec3 scanColor;
      varying vec3 vPosition;
      varying vec3 vNormal;
      void main() {
        float h = (vPosition.z + 10.0) / 20.0;
        h = clamp(h, 0.0, 1.0);
        vec3 col = mix(colorLow, colorMid, h);
        col = mix(col, colorHigh, h * h);

        // Scan line effect
        float scanY = mod(vPosition.x + time * 4.0, 80.0) / 80.0;
        float scan = 1.0 - smoothstep(0.0, 0.02, abs(scanY - 0.5));
        col += scanColor * scan * 0.15;

        // Contour lines
        float contourY = mod(vPosition.z, 2.0);
        float contour = 1.0 - smoothstep(0.0, 0.08, abs(contourY - 1.0));
        col += scanColor * contour * 0.06;

        // Rim lighting from normal
        float rim = 1.0 - max(dot(normalize(vNormal), vec3(0,0,1)), 0.0);
        col += scanColor * rim * rim * 0.04;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  }), []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={meshRef} geometry={geometry} material={material} />
      <mesh ref={wireRef} geometry={geometry}>
        <meshBasicMaterial
          color="#00e5ff"
          wireframe
          transparent
          opacity={0.04}
        />
      </mesh>
    </group>
  );
}

// ─── Incident Markers ─────────────────────────────────────────────────────────
function IncidentMarker({ incident }) {
  const meshRef = useRef();
  const ringRef = useRef();

  const colorMap = {
    CRITICAL: '#ff3b5c',
    HIGH: '#ff6b35',
    MEDIUM: '#ffb020',
    LOW: '#22c55e',
  };

  const color = colorMap[incident.severity] || '#00e5ff';
  // Map lat/lon to scene coords (normalized to scene bounds)
  const x = ((incident.lon - 80) / 20) * 30;
  const z = ((incident.lat - 28) / 10) * 20;
  const y = 2.5;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 1.2;
      meshRef.current.position.y = y + Math.sin(t * 2) * 0.2;
    }
    if (ringRef.current) {
      const s = 1 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.8;
      ringRef.current.scale.set(s, s, 1);
      ringRef.current.material.opacity = 1 - (s - 1) / 0.8;
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* Diamond marker */}
      <mesh ref={meshRef} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.65, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical beam */}
      <mesh position={[0, -y / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, y, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ─── Grid Lines ───────────────────────────────────────────────────────────────
function GridOverlay() {
  const geo = useMemo(() => {
    const points = [];
    for (let i = -40; i <= 40; i += 8) {
      points.push(new THREE.Vector3(-40, 0.1, i), new THREE.Vector3(40, 0.1, i));
      points.push(new THREE.Vector3(i, 0.1, -40), new THREE.Vector3(i, 0.1, 40));
    }
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, []);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#00e5ff" transparent opacity={0.06} />
    </lineSegments>
  );
}

// ─── Camera Rig ───────────────────────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 35, 45);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

// ─── Simple noise function (seeded) ──────────────────────────────────────────
function createSimplexLike() {
  const rand = (x, y) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = smooth(fx), uy = smooth(fy);
    const a = rand(ix, iy), b = rand(ix + 1, iy);
    const c = rand(ix, iy + 1), d = rand(ix + 1, iy + 1);
    return (a + ux * (b - a) + uy * ((c + ux * (d - c)) - (a + ux * (b - a)))) * 2 - 1;
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TerrainMap3D({ incidents = [], style = {} }) {
  return (
    <div className="map-container" style={style}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ fov: 55, near: 0.1, far: 500 }}
        style={{ background: '#05080f' }}
      >
        <CameraRig />
        <Stars radius={150} depth={50} count={3000} factor={4} fade speed={0.3} />

        {/* Ambient scene */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[20, 40, 20]} intensity={0.6} color="#00e5ff" />
        <pointLight position={[-20, 20, -20]} intensity={0.4} color="#2979ff" />

        <TerrainMesh incidents={incidents} />
        <GridOverlay />

        {incidents.map((inc) => (
          <IncidentMarker key={inc.id} incident={inc} />
        ))}

        <OrbitControls
          enablePan enableRotate enableZoom
          maxPolarAngle={Math.PI / 2.1}
          minDistance={15}
          maxDistance={120}
          autoRotate
          autoRotateSpeed={0.3}
          dampingFactor={0.08}
          enableDamping
        />
        <fog attach="fog" args={['#05080f', 80, 160]} />
      </Canvas>

      {/* HUD Overlays */}
      <div className="map-hud map-hud-tl">
        <div style={{
          background: 'rgba(10,12,16,0.85)',
          border: '1px solid var(--border-default)',
          borderRadius: 4, padding: '8px 12px',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="label-caps" style={{ fontSize: 9, color: 'var(--cyan)', marginBottom: 4 }}>
            TERRAIN INTELLIGENCE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
            South Asia Risk Grid
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Resolution: 30m · SRTM DEM
          </div>
        </div>
      </div>

      <div className="map-hud map-hud-tr">
        <div style={{
          background: 'rgba(10,12,16,0.85)',
          border: '1px solid var(--border-default)',
          borderRadius: 4, padding: '8px 10px',
          backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {[
            { label: 'CRITICAL', color: 'var(--red)' },
            { label: 'HIGH', color: 'var(--orange)' },
            { label: 'MEDIUM', color: 'var(--amber)' },
            { label: 'NOMINAL', color: 'var(--green)' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, background: color, transform: 'rotate(45deg)', flexShrink: 0 }} />
              <span className="label-caps" style={{ fontSize: 8 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="map-hud map-hud-br">
        {incidents.length > 0 && (
          <div style={{
            background: 'rgba(10,12,16,0.85)',
            border: '1px solid var(--border-default)',
            borderRadius: 4, padding: '6px 10px',
            backdropFilter: 'blur(8px)',
          }}>
            <span className="label-caps" style={{ fontSize: 9 }}>
              {incidents.length} ACTIVE ZONES
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
