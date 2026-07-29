import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { platform, shared } from '../lib/platform';
import { stateTargets, HERO_TARGETS, type SceneMode } from './ChromeForm';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Общий uniform времени мерцания — один на обе сцены. */
const twinkleU: THREE.IUniform<number> = { value: 0 };

interface OrbitDatum {
  radius: number;
  speed: number;
  phase: number;
  size: number;
  quat: THREE.Quaternion;
  signal: boolean;
}

/** Круглая мягкая текстура точки без жёстких краёв и «границ». */
let pointMap: THREE.CanvasTexture | null = null;
function getPointMap(): THREE.CanvasTexture {
  if (pointMap) return pointMap;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.18)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  pointMap = new THREE.CanvasTexture(c);
  pointMap.colorSpace = THREE.SRGBColorSpace;
  return pointMap;
}

/** Частицы данных: мягкие Points на орбитах, без жёстких краёв. */
export function Particles({ mode }: { mode: SceneMode }) {
  const low = platform.low;
  const count = low ? 300 : 1050;

  const pointsRef = useRef<THREE.Points>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const spread = useRef(1);

  const data = useMemo<OrbitDatum[]>(() => {
    const arr: OrbitDatum[] = [];
    for (let i = 0; i < count; i++) {
      // радиусы с широким «хвостом» наружу — без видимого края оболочки
      arr.push({
        radius: 1.45 + Math.pow(Math.random(), 1.6) * 2.75,
        speed: (0.05 + Math.random() * 0.22) * (Math.random() < 0.5 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
        size: 2.2 + Math.random() * 4.2,
        quat: new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            (Math.random() - 0.5) * 1.1,
            Math.random() * Math.PI,
            (Math.random() - 0.5) * 1.1,
          ),
        ),
        signal: Math.random() < 0.18,
      });
    }
    return arr;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const colors = useMemo(() => new Float32Array(count * 3), [count]);
  const sizes = useMemo(() => new Float32Array(count), [count]);
  const phases = useMemo(() => {
    const a = new Float32Array(count);
    for (let i = 0; i < count; i++) a[i] = Math.random() * Math.PI * 2;
    return a;
  }, [count]);

  // Цвета затухают к внешнему ободу: при AdditiveBlending затемнение цвета
  // эквивалентно альфа-фейду — граница облака растворяется, края нет.
  useMemo(() => {
    const chrome = new THREE.Color('#C9D4E8');
    const signal = new THREE.Color('#00E5A0');
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    for (let i = 0; i < count; i++) {
      const p = data[i];
      const inner = clamp01((p.radius - 1.45) / 0.4);          // приближение от объекта
      const outer = clamp01(1 - (p.radius - 1.45) / 2.75);     // растворение к ободу
      const fade = Math.pow(Math.min(inner, outer), 0.7);
      const c = p.signal ? signal : chrome;
      colors[i * 3 + 0] = c.r * fade;
      colors[i * 3 + 1] = c.g * fade;
      colors[i * 3 + 2] = c.b * fade;
      sizes[i] = p.size * (0.75 + 0.25 * fade);
    }
  }, [count, data, colors, sizes]);

  const material = useMemo(() => {
    const m = new THREE.PointsMaterial({
      map: getPointMap(),
      size: 0.022,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        opacity: 0.9,
      });
    // Per-point размер (aSize) + мерцание (aPhase → vTw): точки дышат,
    // как события в очереди задач. При AdditiveBlending достаточно модулировать цвет.
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime2 = twinkleU;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nattribute float aSize;\nattribute float aPhase;\nuniform float uTime2;\nvarying float vTw;',
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n vTw = 0.66 + 0.34 * sin(uTime2 * 1.35 + aPhase);',
        )
        .replace(
          'gl_PointSize = size;',
          'gl_PointSize = size * aSize * 0.32 * (0.9 + 0.2 * vTw);',
        );
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vTw;')
        .replace(
          '#include <color_fragment>',
          '#include <color_fragment>\n diffuseColor.rgb *= vTw;',
        );
    };
    m.customProgramCacheKey = () => 'nocta-particles';
    return m;
  }, []);

  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );

  useFrame((state, delta) => {
    const time = platform.reduced ? 0 : state.clock.elapsedTime;
    const T = mode === 'sticky' ? stateTargets(shared.deform) : HERO_TARGETS;
    spread.current = lerp(spread.current, T.spread, 0.08);
    const baseScale = mode === 'hero' ? 1 : 0.95;
    for (let i = 0; i < count; i++) {
      const p = data[i];
      const ang = p.phase + time * p.speed;
      const pos = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang))
        .applyQuaternion(p.quat)
        .multiplyScalar(p.radius * spread.current * baseScale);
      positions[i * 3 + 0] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
    }
    const geo = pointsRef.current.geometry;
    geo.attributes.position.needsUpdate = true;
    if (!platform.reduced) {
      twinkleU.value = time;
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={mode === 'hero' ? [0.72, 0, 0] : [0, 0, 0]}>
      <points ref={pointsRef} material={material} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        </bufferGeometry>
      </points>
    </group>
  );
}
