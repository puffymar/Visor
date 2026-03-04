'use client';

import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ConflictEvent } from '@/lib/types';

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function EarthSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Dark ocean
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, 2048, 1024);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 2048; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();
    }
    for (let j = 0; j < 1024; j += 32) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(2048, j);
      ctx.stroke();
    }

    // Simplified continent outlines using rough polygon fills
    ctx.fillStyle = 'rgba(0, 195, 255, 0.06)';
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.25)';
    ctx.lineWidth = 1.5;

    // Draw simplified continent shapes
    const continents = [
      // North America
      [[400, 180], [520, 160], [600, 200], [620, 280], [580, 360], [500, 400], [420, 380], [380, 340], [360, 280], [370, 220]],
      // South America
      [[500, 420], [560, 440], [580, 520], [560, 620], [520, 700], [480, 680], [460, 580], [470, 480]],
      // Europe
      [[900, 180], [1000, 160], [1060, 180], [1080, 240], [1040, 280], [960, 300], [900, 260], [880, 220]],
      // Africa
      [[920, 320], [1020, 300], [1080, 340], [1100, 440], [1060, 560], [1000, 600], [940, 560], [900, 440], [900, 360]],
      // Asia
      [[1080, 140], [1300, 120], [1500, 160], [1560, 240], [1500, 340], [1380, 380], [1260, 360], [1160, 320], [1100, 260], [1080, 200]],
      // Australia
      [[1420, 500], [1540, 480], [1580, 540], [1560, 600], [1480, 620], [1420, 580], [1400, 540]],
    ];

    continents.forEach(pts => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={gridTexture}
        transparent
        opacity={0.95}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function AtmosphereGlow() {
  return (
    <mesh>
      <sphereGeometry args={[2.08, 64, 64]} />
      <meshBasicMaterial
        color="#00c3ff"
        transparent
        opacity={0.04}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

interface AttackMarkerProps {
  event: ConflictEvent;
  onClick: (event: ConflictEvent) => void;
}

function AttackMarker({ event, onClick }: AttackMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => latLngToVector3(event.lat, event.lng, 2.02), [event.lat, event.lng]);

  const color = useMemo(() => {
    switch (event.severity) {
      case 'critical': return '#ff0040';
      case 'high': return '#ff6600';
      case 'medium': return '#ffaa00';
      case 'low': return '#00cc88';
    }
  }, [event.severity]);

  const size = useMemo(() => {
    switch (event.severity) {
      case 'critical': return 0.04;
      case 'high': return 0.032;
      case 'medium': return 0.025;
      case 'low': return 0.02;
    }
  }, [event.severity]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 0.8 + Math.sin(clock.elapsedTime * 3) * 0.3;
      meshRef.current.scale.setScalar(pulse);
    }
    if (ringRef.current && event.ongoing) {
      const expand = 1 + Math.sin(clock.elapsedTime * 2) * 0.5;
      ringRef.current.scale.setScalar(expand);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 - expand * 0.15;
    }
  });

  const handleClick = useCallback(() => onClick(event), [event, onClick]);

  return (
    <group position={pos}>
      {/* Core dot */}
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      {/* Pulsing ring for ongoing events */}
      {event.ongoing && (
        <mesh ref={ringRef} onClick={handleClick}>
          <ringGeometry args={[size * 1.5, size * 2.2, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Glow */}
      <pointLight color={color} intensity={0.3} distance={0.5} />
    </group>
  );
}

// Arc line between two conflict parties
function AttackArc({ from, to, color }: { from: [number, number]; to: [number, number]; color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const lineObjRef = useRef<THREE.Line | null>(null);

  const geometry = useMemo(() => {
    const start = latLngToVector3(from[0], from[1], 2.02);
    const end = latLngToVector3(to[0], to[1], 2.02);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    mid.normalize().multiplyScalar(2.02 + dist * 0.3);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(50);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [from, to]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 });
  }, [color]);

  useFrame(({ clock }) => {
    if (lineObjRef.current) {
      (lineObjRef.current.material as THREE.LineBasicMaterial).opacity =
        0.3 + Math.sin(clock.elapsedTime * 4) * 0.2;
    }
  });

  // Create line imperatively to avoid JSX <line> / SVGLineElement conflict
  useMemo(() => {
    lineObjRef.current = new THREE.Line(geometry, material);
  }, [geometry, material]);

  return (
    <group ref={groupRef}>
      {lineObjRef.current && <primitive object={lineObjRef.current} />}
    </group>
  );
}

interface GlobeProps {
  events: ConflictEvent[];
  onSelectEvent: (event: ConflictEvent) => void;
  selectedEvent: ConflictEvent | null;
}

export default function Globe({ events, onSelectEvent, selectedEvent }: GlobeProps) {
  // Generate arcs for events with known bilateral conflicts
  const arcs = useMemo(() => {
    const arcData: { from: [number, number]; to: [number, number]; color: string; key: string }[] = [];

    events.forEach(e => {
      if (e.id === 'ukr-001' || e.id === 'ukr-002') {
        arcData.push({
          from: [55.7558, 37.6173], // Moscow
          to: [e.lat, e.lng],
          color: '#ff0040',
          key: `arc-${e.id}`,
        });
      }
      if (e.id === 'gaz-002') {
        arcData.push({
          from: [e.lat, e.lng],
          to: [31.7683, 35.2137], // Jerusalem
          color: '#ff6600',
          key: `arc-${e.id}`,
        });
      }
    });

    return arcData;
  }, [events]);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.6} />
        <pointLight position={[-5, -3, -5]} intensity={0.2} color="#00c3ff" />

        <EarthSphere />
        <AtmosphereGlow />

        {events.map(event => (
          <AttackMarker
            key={event.id}
            event={event}
            onClick={onSelectEvent}
          />
        ))}

        {arcs.map(arc => (
          <AttackArc
            key={arc.key}
            from={arc.from}
            to={arc.to}
            color={arc.color}
          />
        ))}

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.3}
          dampingFactor={0.05}
          enableDamping
        />
      </Canvas>

      {/* Selected event tooltip */}
      {selectedEvent && (
        <div className="absolute bottom-4 left-4 max-w-sm bg-[#0d1117]/95 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              selectedEvent.severity === 'critical' ? 'bg-red-500' :
              selectedEvent.severity === 'high' ? 'bg-orange-500' :
              selectedEvent.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <span className="text-xs font-mono text-cyan-400 uppercase">{selectedEvent.type.replace('_', ' ')}</span>
            {selectedEvent.ongoing && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">LIVE</span>
            )}
          </div>
          <h3 className="text-white font-semibold text-sm mb-1">{selectedEvent.title}</h3>
          <p className="text-gray-400 text-xs mb-2">{selectedEvent.description.slice(0, 120)}...</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{selectedEvent.source}</span>
            <span className="text-xs text-cyan-500 font-mono">
              {new Date(selectedEvent.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
