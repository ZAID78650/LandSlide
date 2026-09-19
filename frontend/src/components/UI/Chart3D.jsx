import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

function Bar({ position, height, color, label, value }) {
  const mesh = useRef();
  
  // Animation for growing bars
  useFrame(() => {
    if (mesh.current) {
      mesh.current.scale.y = THREE.MathUtils.lerp(mesh.current.scale.y, Math.max(height, 0.01), 0.1);
      mesh.current.position.y = mesh.current.scale.y / 2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={mesh} scale={[1, 0.01, 1]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} transparent opacity={0.85} />
      </mesh>
      {/* Label under the bar */}
      <Text
        position={[0, -0.6, 0.8]}
        rotation={[-Math.PI / 6, 0, 0]}
        fontSize={0.4}
        color="#8a9ab5"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      {/* Value on top of the bar */}
      <Text
        position={[0, Math.max(height, 0.01) + 0.6, 0]}
        fontSize={0.4}
        color="#00e5ff"
        anchorX="center"
        anchorY="middle"
      >
        {value > 0 ? value.toFixed(1) : ''}
      </Text>
    </group>
  );
}

export default function Chart3D({ data = [], dataKey = "value", labelKey = "name", color = "#00e5ff" }) {
  // Normalize heights
  const maxVal = Math.max(...data.map(d => d[dataKey] || 0), 1);
  const chartHeight = 5; // max height of bars in 3D units
  
  const bars = data.map((d, i) => {
    const val = d[dataKey] || 0;
    const h = (val / maxVal) * chartHeight;
    // Format label: if it's a date string like YYYY-MM-DD, take MM-DD
    const labelStr = String(d[labelKey] || `Item ${i}`);
    const labelFormatted = labelStr.length > 5 && labelStr.includes('-') ? labelStr.slice(5) : labelStr;

    return {
      id: i,
      x: (i - data.length / 2) * 1.5 + 0.75, // Centered layout
      height: h,
      label: labelFormatted,
      value: val,
    };
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas shadows camera={{ position: [0, 5, 14], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 15]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, 5, -10]} intensity={0.6} color="#2979ff" />
        
        {/* Grid floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[Math.max(data.length * 2, 20), 10]} />
          <meshStandardMaterial color="#080a0d" />
        </mesh>
        
        <gridHelper args={[Math.max(data.length * 2, 20), Math.max(data.length * 2, 20), '#1c2030', '#1c2030']} position={[0, 0, 0]} />

        {bars.map((b) => (
          <Bar 
            key={b.id} 
            position={[b.x, 0, 0]} 
            height={b.height} 
            color={color} 
            label={b.label}
            value={b.value}
          />
        ))}

        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          enableZoom={true}
          minDistance={5}
          maxDistance={25}
        />
      </Canvas>
    </div>
  );
}
