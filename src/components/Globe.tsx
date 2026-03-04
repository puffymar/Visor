'use client';

import { useRef, useMemo, useState, useCallback, memo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture, Html } from '@react-three/drei';
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
// STARFIELD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Stars() {
  const ref = useRef<THREE.Points>(null);

  const { geo, mat } = useMemo(() => {
    const N = 1500;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 18 + Math.random() * 35;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      color: '#ffffff', size: 0.04, transparent: true, opacity: 0.7,
      sizeAttenuation: true, depthWrite: false,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.003;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VISIBLE SUN — light source with glow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Sun() {
  const glowRef = useRef<THREE.Sprite>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.scale.setScalar(3.2 + Math.sin(clock.elapsedTime * 0.4) * 0.4);
    }
  });

  return (
    <group position={[12, 7, 10]}>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>
      <sprite ref={glowRef} scale={[3.5, 3.5, 1]}>
        <spriteMaterial
          color="#FDB813"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <sprite scale={[6, 6, 1]}>
        <spriteMaterial
          color="#ff9900"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EARTH SPHERE — brighter, higher contrast, tech overlay
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function EarthSphere() {
  const [colorMap, bumpMap] = useTexture(['/earth-dark.jpg', '/earth-topology.png']);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.035}
          metalness={0.25}
          roughness={0.5}
          emissive="#001a33"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Wireframe overlay — tech/SIPRNet aesthetic */}
      <mesh>
        <sphereGeometry args={[R * 1.001, 24, 16]} />
        <meshBasicMaterial
          color="#00ffcc"
          wireframe
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GRID OVERLAY — prominent lat/lng, continent labels feel
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function GridOverlay() {
  const texture = useMemo(() => {
    const W = 4096, H = 2048;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(0, 255, 200, 0.28)';
    ctx.lineWidth = 2;
    for (let d = 0; d <= 360; d += 30) {
      const x = (d / 360) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let d = 0; d <= 180; d += 30) {
      const y = (d / 180) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 255, 200, 0.1)';
    ctx.lineWidth = 0.8;
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
      <meshBasicMaterial map={texture} transparent opacity={0.55} depthWrite={false} />
    </mesh>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ATMOSPHERE — stronger glow, amber edge
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Atmosphere() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[R * 1.01, 64, 64]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[R * 1.035, 64, 64]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[R * 1.08, 48, 48]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[R * 1.14, 32, 32]} />
        <meshBasicMaterial color="#4400ff" transparent opacity={0.02} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HEATMAP LAYER
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
      critical: { r: 100, a: 0.6,  col: '255,20,60' },
      high:     { r: 75,  a: 0.4,  col: '255,100,0' },
      medium:   { r: 50,  a: 0.25, col: '255,170,0' },
      low:      { r: 30,  a: 0.12, col: '0,200,100' },
    };

    events.forEach(e => {
      const [u, v] = latLngToUV(e.lat, e.lng);
      const x = u * W, y = v * H;
      let { r, a, col } = cfg[e.severity] ?? cfg.low;
      if (e.ongoing) { a *= 1.3; r *= 1.2; }

      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${col},${a})`);
      g.addColorStop(0.3, `rgba(${col},${a * 0.5})`);
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
        0.55 + Math.sin(clock.elapsedTime * 0.8) * 0.12;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[R * 1.004, 64, 64]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEVERITY CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SEV = {
  critical: { sz: 0.045, col: '#ff0040', rings: 3, beam: true,  lum: 2.0 },
  high:     { sz: 0.035, col: '#ff6600', rings: 2, beam: true,  lum: 1.2 },
  medium:   { sz: 0.026, col: '#ffaa00', rings: 1, beam: false, lum: 0.5 },
  low:      { sz: 0.018, col: '#00cc88', rings: 1, beam: false, lum: 0.25 },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTERACTIVE ATTACK MARKER — hover to enlarge + tooltip
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AttackMarker({ event, onClick, isSelected }: {
  event: ConflictEvent;
  onClick: (e: ConflictEvent) => void;
  isSelected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef  = useRef<THREE.Mesh>(null);
  const r1       = useRef<THREE.Mesh>(null);
  const r2       = useRef<THREE.Mesh>(null);
  const r3       = useRef<THREE.Mesh>(null);
  const beamRef  = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);
  const [hovered, setHovered] = useState(false);

  const pos    = useMemo(() => latLngToVector3(event.lat, event.lng, R + 0.015), [event.lat, event.lng]);
  const normal = useMemo(() => pos.clone().normalize(), [pos]);
  const quat   = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal), [normal]);
  const c      = SEV[event.severity];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    const target = hovered || isSelected ? 2.2 : 1.0;
    scaleRef.current += (target - scaleRef.current) * 0.1;
    if (groupRef.current) groupRef.current.scale.setScalar(scaleRef.current);

    if (coreRef.current) {
      coreRef.current.scale.setScalar(0.85 + Math.sin(t * 3.5 + event.lat) * 0.2);
    }

    const animateRing = (ref: React.RefObject<THREE.Mesh | null>, speed: number, offset: number, maxScale: number, baseOpacity: number) => {
      if (!ref.current) return;
      const cycle = ((t * speed) + offset) % 2;
      ref.current.scale.setScalar(1 + cycle * maxScale);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, baseOpacity * (1 - cycle / 2));
    };

    animateRing(r1, 1.2, 0,   2.0, 0.45);
    animateRing(r2, 1.2, 0.7, 2.0, 0.3);
    animateRing(r3, 1.0, 1.4, 2.5, 0.2);

    if (beamRef.current) {
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.14 + Math.sin(t * 2.5) * 0.08;
    }
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    onClick(event);
  }, [event, onClick]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const s = c.sz;

  const locationLabel = event.title.includes(':')
    ? event.title.split(':')[0].trim()
    : event.country;

  const sevColor = c.col;
  const showTip = hovered || isSelected;

  return (
    <group position={pos} quaternion={quat} ref={groupRef}>
      {/* Core dot */}
      <mesh
        ref={coreRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[s, 16, 16]} />
        <meshBasicMaterial color={sevColor} transparent opacity={0.95} />
      </mesh>

      {/* Larger invisible hit area for easy hover */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[s * 5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Shockwave rings */}
      <mesh ref={r1}>
        <ringGeometry args={[s * 1.4, s * 1.9, 32]} />
        <meshBasicMaterial color={sevColor} transparent opacity={0.45} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {c.rings >= 2 && (
        <mesh ref={r2}>
          <ringGeometry args={[s * 1.4, s * 1.9, 32]} />
          <meshBasicMaterial color={sevColor} transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
      {c.rings >= 3 && (
        <mesh ref={r3}>
          <ringGeometry args={[s * 1.4, s * 1.9, 32]} />
          <meshBasicMaterial color={sevColor} transparent opacity={0.2} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      {/* Vertical threat beam */}
      {c.beam && event.ongoing && (
        <mesh ref={beamRef} position={[0, 0, s * 5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[s * 0.25, s * 0.04, s * 10, 8]} />
          <meshBasicMaterial color={sevColor} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      {/* Hover/selected tooltip */}
      {showTip && (
        <Html
          position={[0, 0, s * 3.5]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div style={{
            background: 'rgba(6, 10, 20, 0.95)',
            border: '1px solid rgba(0, 200, 255, 0.35)',
            borderRadius: '8px',
            padding: '8px 12px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            minWidth: '130px',
            transform: 'translateY(-120%)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 15px rgba(0,200,255,0.1)',
          }}>
            <div style={{
              color: '#67e8f9', fontSize: '11px', fontFamily: 'monospace',
              fontWeight: 700, letterSpacing: '0.04em',
            }}>
              {locationLabel}
            </div>
            <div style={{
              color: '#9ca3af', fontSize: '9px', fontFamily: 'monospace', marginTop: '2px',
            }}>
              {event.country} &bull; {event.region}
            </div>
            <div style={{
              fontSize: '9px', fontFamily: 'monospace', marginTop: '5px',
              padding: '2px 8px', borderRadius: '9999px', display: 'inline-block',
              color: event.severity === 'critical' ? '#f87171' :
                     event.severity === 'high'     ? '#fb923c' :
                     event.severity === 'medium'   ? '#fbbf24' : '#4ade80',
              background: event.severity === 'critical' ? 'rgba(239,68,68,0.15)' :
                          event.severity === 'high'     ? 'rgba(249,115,22,0.15)' :
                          event.severity === 'medium'   ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)',
              border: `1px solid ${
                event.severity === 'critical' ? 'rgba(239,68,68,0.3)' :
                event.severity === 'high'     ? 'rgba(249,115,22,0.3)' :
                event.severity === 'medium'   ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)'
              }`,
            }}>
              {event.severity.toUpperCase()} &bull; {event.type.replace('_', ' ').toUpperCase()}
            </div>
            {event.ongoing && (
              <div style={{
                marginTop: '4px', fontSize: '8px', fontFamily: 'monospace',
                color: '#f87171', animation: 'pulse 2s infinite',
              }}>
                ● ACTIVE
              </div>
            )}
          </div>
        </Html>
      )}

      <pointLight color={sevColor} intensity={c.lum} distance={0.8} />
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
      material: new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 }),
    };
  }, [from, to, color]);

  useMemo(() => { lineRef.current = new THREE.Line(geometry, material); }, [geometry, material]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (pulseRef.current) pulseRef.current.position.copy(curve.getPoint((t * 0.3) % 1));
    if (lineRef.current) {
      (lineRef.current.material as THREE.LineBasicMaterial).opacity =
        0.35 + Math.sin(t * 2.5) * 0.15;
    }
  });

  return (
    <group>
      {lineRef.current && <primitive object={lineRef.current} />}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
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
    if (a.current) { a.current.rotation.x = Math.PI / 3; a.current.rotation.y = t * 0.12; }
    if (b.current) { b.current.rotation.x = -Math.PI / 4; b.current.rotation.z = t * 0.09; }
  });

  return (
    <>
      <mesh ref={a}>
        <torusGeometry args={[R * 1.18, 0.005, 8, 128]} />
        <meshBasicMaterial color="#00ffa0" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={b}>
        <torusGeometry args={[R * 1.25, 0.004, 8, 128]} />
        <meshBasicMaterial color="#00c8ff" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
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
    const N = 450;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = R * (1.08 + Math.random() * 0.8);
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      color: '#00d0ff', size: 0.01, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.012;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN GLOBE COMPONENT
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
  'United States': [38.90, -77.04],
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
        {/* Sun-based lighting — strong terminator, warm lit side */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[12, 7, 10]} intensity={2.2} color="#fff8e7" />
        <pointLight position={[-8, -5, -8]} intensity={0.25} color="#00aaff" />
        <pointLight position={[0, 8, 0]} intensity={0.15} color="#00ffcc" />

        <Suspense fallback={null}>
          <Stars />
          <Sun />
          <EarthSphere />
          <GridOverlay />
          <Atmosphere />
          <HeatmapLayer events={events} />

          {events.map(ev => (
            <AttackMarker
              key={ev.id}
              event={ev}
              onClick={onSelectEvent}
              isSelected={selectedEvent?.id === ev.id}
            />
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
          autoRotateSpeed={0.25}
          dampingFactor={0.05}
          enableDamping
        />
      </Canvas>

    </div>
  );
});
