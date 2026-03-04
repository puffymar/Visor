'use client';

import { useRef, useMemo, useCallback, memo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ConflictEvent } from '@/lib/types';

const R = 2;

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function latLngToUV(lat: number, lng: number): [number, number] {
  return [(lng + 180) / 360, (90 - lat) / 180];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EARTH SPHERE — real texture with grid overlay
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function EarthSphere() {
  const [colorMap, bumpMap] = useTexture(['/earth-dark.jpg', '/earth-topology.png']);

  return (
    <mesh>
      <sphereGeometry args={[R, 64, 64]} />
      <meshStandardMaterial
        map={colorMap}
        bumpMap={bumpMap}
        bumpScale={0.015}
        metalness={0.1}
        roughness={0.7}
      />
    </mesh>
  );
}

function GridOverlay() {
  const texture = useMemo(() => {
    const W = 4096, H = 2048;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(0, 210, 255, 0.22)';
    ctx.lineWidth = 1.5;
    for (let d = 0; d <= 360; d += 30) {
      const x = (d / 360) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let d = 0; d <= 180; d += 30) {
      const y = (d / 180) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 210, 255, 0.07)';
    ctx.lineWidth = 0.5;
    for (let d = 0; d <= 360; d += 10) {
      const x = (d / 360) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let d = 0; d <= 180; d += 10) {
      const y = (d / 180) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[R * 1.002, 64, 64]} />
      <meshBasicMaterial map={texture} transparent opacity={0.6} depthWrite={false} />
    </mesh>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRIPLE-LAYER ATMOSPHERE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Atmosphere() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[R * 1.015, 64, 64]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[R * 1.05, 64, 64]} />
        <meshBasicMaterial color="#0066ff" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[R * 1.12, 48, 48]} />
        <meshBasicMaterial color="#4400ff" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFLICT-DENSITY HEATMAP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function HeatmapLayer({ events }: { events: ConflictEvent[] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const W = 2048, H = 1024;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    const cfg: Record<string, { r: number; a: number; col: string }> = {
      critical: { r: 120, a: 0.7,  col: '255,20,60' },
      high:     { r: 85,  a: 0.5,  col: '255,100,0' },
      medium:   { r: 55,  a: 0.3,  col: '255,170,0' },
      low:      { r: 35,  a: 0.15, col: '0,200,100' },
    };

    events.forEach(e => {
      const [u, v] = latLngToUV(e.lat, e.lng);
      const x = u * W, y = v * H;
      let { r, a, col } = cfg[e.severity] ?? cfg.low;
      if (e.ongoing) { a *= 1.4; r *= 1.3; }

      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${col},${a})`);
      g.addColorStop(0.35, `rgba(${col},${a * 0.5})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });

    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }, [events]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.7 + Math.sin(clock.elapsedTime * 0.8) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[R * 1.004, 64, 64]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ATTACK MARKER — shockwave rings + threat beam
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SEV = {
  critical: { sz: 0.065, col: '#ff0040', rings: 3, beam: true,  lum: 3.0 },
  high:     { sz: 0.050, col: '#ff6600', rings: 2, beam: true,  lum: 1.8 },
  medium:   { sz: 0.035, col: '#ffaa00', rings: 1, beam: false, lum: 0.8 },
  low:      { sz: 0.025, col: '#00cc88', rings: 1, beam: false, lum: 0.4 },
} as const;

function AttackMarker({ event, onClick }: { event: ConflictEvent; onClick: (e: ConflictEvent) => void }) {
  const core = useRef<THREE.Mesh>(null);
  const r1   = useRef<THREE.Mesh>(null);
  const r2   = useRef<THREE.Mesh>(null);
  const r3   = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);

  const pos    = useMemo(() => latLngToVector3(event.lat, event.lng, R + 0.01), [event.lat, event.lng]);
  const normal = useMemo(() => pos.clone().normalize(), [pos]);
  const quat   = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal), [normal]);
  const c      = SEV[event.severity];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (core.current) core.current.scale.setScalar(0.8 + Math.sin(t * 4 + event.lat) * 0.35);

    const ring = (ref: React.RefObject<THREE.Mesh | null>, spd: number, off: number, mx: number, base: number) => {
      if (!ref.current) return;
      const cyc = ((t * spd) + off) % 2;
      ref.current.scale.setScalar(1 + cyc * mx);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, base * (1 - cyc / 2));
    };

    ring(r1, 1.5, 0,   2.5, 0.6);
    ring(r2, 1.5, 0.7, 2.5, 0.4);
    ring(r3, 1.2, 1.4, 3.5, 0.3);

    if (beam.current) {
      (beam.current.material as THREE.MeshBasicMaterial).opacity =
        0.22 + Math.sin(t * 3) * 0.12;
    }
  });

  const handleClick = useCallback(() => onClick(event), [event, onClick]);
  const s = c.sz;

  return (
    <group position={pos} quaternion={quat}>
      <mesh ref={core} onClick={handleClick}>
        <sphereGeometry args={[s, 16, 16]} />
        <meshBasicMaterial color={c.col} transparent opacity={0.95} />
      </mesh>

      <mesh ref={r1}>
        <ringGeometry args={[s * 1.5, s * 2.2, 32]} />
        <meshBasicMaterial color={c.col} transparent opacity={0.6} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {c.rings >= 2 && (
        <mesh ref={r2}>
          <ringGeometry args={[s * 1.5, s * 2.2, 32]} />
          <meshBasicMaterial color={c.col} transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
      {c.rings >= 3 && (
        <mesh ref={r3}>
          <ringGeometry args={[s * 1.5, s * 2.2, 32]} />
          <meshBasicMaterial color={c.col} transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      {c.beam && event.ongoing && (
        <mesh ref={beam} position={[0, 0, s * 5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[s * 0.4, s * 0.06, s * 10, 8]} />
          <meshBasicMaterial color={c.col} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      <pointLight color={c.col} intensity={c.lum} distance={1.2} />
    </group>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ATTACK ARC + travelling pulse
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AttackArc({ from, to, color }: { from: [number, number]; to: [number, number]; color: string }) {
  const lineRef  = useRef<THREE.Line | null>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const { curve, geometry, material } = useMemo(() => {
    const a = latLngToVector3(from[0], from[1], R + 0.02);
    const b = latLngToVector3(to[0], to[1], R + 0.02);
    const m = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    m.normalize().multiplyScalar(R + 0.02 + a.distanceTo(b) * 0.35);
    const cv = new THREE.QuadraticBezierCurve3(a, m, b);
    return {
      curve: cv,
      geometry: new THREE.BufferGeometry().setFromPoints(cv.getPoints(80)),
      material: new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0.7,
      }),
    };
  }, [from, to, color]);

  useMemo(() => { lineRef.current = new THREE.Line(geometry, material); }, [geometry, material]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (pulseRef.current) pulseRef.current.position.copy(curve.getPoint((t * 0.35) % 1));
    if (lineRef.current) {
      (lineRef.current.material as THREE.LineBasicMaterial).opacity =
        0.5 + Math.sin(t * 3) * 0.25;
    }
  });

  return (
    <group>
      {lineRef.current && <primitive object={lineRef.current} />}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ORBITAL SCAN RINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ScanRings() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (a.current) { a.current.rotation.x = Math.PI / 3; a.current.rotation.y = t * 0.15; }
    if (b.current) { b.current.rotation.x = -Math.PI / 4; b.current.rotation.z = t * 0.12; }
  });

  return (
    <>
      <mesh ref={a}>
        <torusGeometry args={[R * 1.18, 0.006, 8, 128]} />
        <meshBasicMaterial color="#00ffa0" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={b}>
        <torusGeometry args={[R * 1.25, 0.005, 8, 128]} />
        <meshBasicMaterial color="#00c8ff" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AMBIENT DATA PARTICLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Particles() {
  const ref = useRef<THREE.Points>(null);

  const { geo, mat } = useMemo(() => {
    const N = 600;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = R * (1.08 + Math.random() * 0.9);
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      color: '#00d0ff', size: 0.015, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
      sizeAttenuation: true,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.015;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN GLOBE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface GlobeProps {
  events: ConflictEvent[];
  onSelectEvent: (event: ConflictEvent) => void;
  selectedEvent: ConflictEvent | null;
}

const ORIGINS: Record<string, [number, number]> = {
  'Russia':        [55.76, 37.62],
  'Israel':        [31.77, 35.21],
  'Turkey':        [39.93, 32.86],
  'United States': [25.0,  55.0],
  'Iran':          [35.69, 51.39],
};

export default memo(function Globe({ events, onSelectEvent, selectedEvent }: GlobeProps) {
  const arcs = useMemo(() => {
    const out: { from: [number, number]; to: [number, number]; color: string; key: string }[] = [];

    events.forEach(e => {
      const col = e.severity === 'critical' ? '#ff0040'
        : e.severity === 'high' ? '#ff6600' : '#ffaa00';

      for (const party of e.parties) {
        const o = ORIGINS[party];
        if (!o) continue;
        const d = Math.abs(o[0] - e.lat) + Math.abs(o[1] - e.lng);
        if (d < 3) continue;
        out.push({ from: o, to: [e.lat, e.lng], color: col, key: `xb-${e.id}-${party}` });
      }
    });

    const byCountry: Record<string, ConflictEvent[]> = {};
    events.forEach(e => {
      (byCountry[e.country] ??= []).push(e);
    });
    Object.values(byCountry).forEach(g => {
      for (let i = 0; i < g.length; i++)
        for (let j = i + 1; j < g.length; j++)
          out.push({
            from: [g[i].lat, g[i].lng],
            to: [g[j].lat, g[j].lng],
            color: '#00c3ff',
            key: `cl-${g[i].id}-${g[j].id}`,
          });
    });

    return out;
  }, [events]);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 3, 5]} intensity={0.6} />
        <pointLight position={[-5, -3, -5]} intensity={0.3} color="#00c3ff" />

        <Suspense fallback={null}>
          <EarthSphere />
          <GridOverlay />
          <Atmosphere />
          <HeatmapLayer events={events} />

          {events.map(ev => (
            <AttackMarker key={ev.id} event={ev} onClick={onSelectEvent} />
          ))}

          {arcs.map(a => (
            <AttackArc key={a.key} from={a.from} to={a.to} color={a.color} />
          ))}

          <ScanRings />
          <Particles />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={3}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.3}
          dampingFactor={0.05}
          enableDamping
        />
      </Canvas>

      {selectedEvent && (
        <div className="absolute bottom-4 left-4 max-w-sm bg-[#0a0e16]/95 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              selectedEvent.severity === 'critical' ? 'bg-red-500' :
              selectedEvent.severity === 'high' ? 'bg-orange-500' :
              selectedEvent.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
              {selectedEvent.type.replace('_', ' ')}
            </span>
            {selectedEvent.ongoing && (
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 font-mono">LIVE</span>
            )}
          </div>
          <h3 className="text-white font-semibold text-sm mb-1">{selectedEvent.title}</h3>
          <p className="text-gray-400 text-xs mb-2 leading-relaxed">{selectedEvent.description.slice(0, 140)}...</p>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500 font-mono">{selectedEvent.source}</span>
            <span className="text-cyan-500 font-mono">{new Date(selectedEvent.timestamp).toLocaleTimeString()}</span>
          </div>
          {selectedEvent.estimatedCasualties && (
            <div className="mt-2 text-[10px] text-red-400/80 bg-red-500/5 border border-red-500/10 rounded px-2 py-1 font-mono">
              {selectedEvent.estimatedCasualties}
            </div>
          )}
        </div>
      )}
    </div>
  );
})
