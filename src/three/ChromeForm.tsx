import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { platform, shared } from '../lib/platform';
import { FIELD_GLSL, DISPLACE_NORMAL_CHUNK, DISPLACE_VERTEX_CHUNK, DISPLACE_LINE_CHUNK } from './shaders';

export type SceneMode = 'hero' | 'sticky';

export interface DeformTargets {
  amp: number; sy: number; sxz: number; rough: number; wire: number; spread: number;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Три состояния деформации по скролл-прогрессу sticky-секции (0..1). */
export function stateTargets(p: number): DeformTargets {
  if (p < 1 / 3) {
    // спокойное течение
    return { amp: 0.14, sy: 1, sxz: 1, rough: 0.14, wire: 0.12, spread: 1 };
  }
  if (p < 2 / 3) {
    // сжатие: вытягивание по Y, шум растёт, поверхность зеркалится
    const t = smooth((p - 1 / 3) * 3);
    return {
      amp: lerp(0.14, 0.28, t),
      sy: lerp(1, 1.35, t),
      sxz: lerp(1, 0.8, t),
      rough: lerp(0.14, 0.06, t),
      wire: 0.12,
      spread: 1,
    };
  }
  // распад: максимальный шум, каркас усиливается, частицы разлетаются
  const t = smooth((p - 2 / 3) * 3);
  return {
    amp: lerp(0.28, 0.42, t),
    sy: lerp(1.35, 1, t),
    sxz: lerp(0.8, 1, t),
    rough: lerp(0.06, 0.1, t),
    wire: lerp(0.12, 0.3, t),
    spread: lerp(1, 1.7, t),
  };
}

export const HERO_TARGETS: DeformTargets = {
  amp: 0.16, sy: 1, sxz: 1, rough: 0.12, wire: 0.12, spread: 1,
};

/* Геометрия — модульный синглтон: Canvas-ы не должны её пересоздавать. */
const geoCache = new Map<number, THREE.BufferGeometry>();
function getIco(detail: number): THREE.BufferGeometry {
  let g = geoCache.get(detail);
  if (!g) {
    g = new THREE.IcosahedronGeometry(1, detail);
    geoCache.set(detail, g);
  }
  return g;
}
let wireGeo: THREE.BufferGeometry | null = null;
function getWire(): THREE.BufferGeometry {
  if (!wireGeo) wireGeo = new THREE.WireframeGeometry(getIco(8));
  return wireGeo;
}

export function ChromeForm({ mode }: { mode: SceneMode }) {
  const low = platform.low;
  const detail = low ? 48 : 128;
  const geometry = getIco(detail);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 } as THREE.IUniform<number>,
      uAmp: { value: 0.16 } as THREE.IUniform<number>,
    }),
    [],
  );

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e8edf5'),
      metalness: 1,
      roughness: 0.14,
      envMapIntensity: 1.6,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uAmp = uniforms.uAmp;
      shader.vertexShader =
        FIELD_GLSL + '\n' +
        shader.vertexShader
          .replace('#include <beginnormal_vertex>', DISPLACE_NORMAL_CHUNK)
          .replace('#include <begin_vertex>', DISPLACE_VERTEX_CHUNK);
    };
    return m;
  }, [uniforms]);

  const lineMaterial = useMemo(() => {
    const m = new THREE.LineBasicMaterial({
      color: new THREE.Color('#C9D4E8'),
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uAmp = uniforms.uAmp;
      shader.vertexShader =
        FIELD_GLSL + '\n' +
        shader.vertexShader.replace('#include <begin_vertex>', DISPLACE_LINE_CHUNK);
    };
    return m;
  }, [uniforms]);

  useEffect(
    () => () => {
      material.dispose();
      lineMaterial.dispose();
    },
    [material, lineMaterial],
  );

  const wrapper = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const cur = useRef<DeformTargets>({ ...HERO_TARGETS });
  const pointer = useRef({ x: 0, y: 0 });
  const timeAcc = useRef(Math.random() * 40);
  const velSm = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const T = mode === 'hero' ? HERO_TARGETS : stateTargets(shared.deform);

    // скорость скролла — эмоция объекта: быстрая протяжка взбалтывает хром,
    // на паузе он успокаивается. Сглаживание, чтобы не дёргался.
    const vRaw = Math.min(Math.abs(shared.vel) / 130, 1);
    velSm.current += (vRaw - velSm.current) * 0.05;
    const v = platform.reduced ? 0 : velSm.current;

    if (platform.reduced) {
      cur.current = { ...T };
      uniforms.uTime.value = 10; // статичная красивая фаза, без деформации во времени
    } else {
      timeAcc.current += delta * (1 + v * 1.6);
      uniforms.uTime.value = timeAcc.current;
      const k = 0.085;
      cur.current.amp = lerp(cur.current.amp, T.amp, k);
      cur.current.sy = lerp(cur.current.sy, T.sy, k);
      cur.current.sxz = lerp(cur.current.sxz, T.sxz, k);
      cur.current.rough = lerp(cur.current.rough, T.rough, k);
      cur.current.wire = lerp(cur.current.wire, T.wire, k);
    }

    uniforms.uAmp.value = cur.current.amp + v * 0.05;
    material.roughness = cur.current.rough;
    lineMaterial.opacity = Math.min(cur.current.wire + v * 0.06, 0.34);

    const base = mode === 'hero' ? 1.18 : 0.98;
    spin.current.scale.set(base * cur.current.sxz, base * cur.current.sy, base * cur.current.sxz);

    if (!platform.reduced) {
      const spinSpeed = mode === 'hero' ? 0.12 : 0.1 + shared.deform * 0.18;
      spin.current.rotation.y += delta * (spinSpeed + v * 0.3);
      spin.current.position.y = mode === 'hero' ? Math.sin(t * 0.4) * 0.05 : 0;
      const w = wrapper.current;
      w.rotation.x = lerp(w.rotation.x, pointer.current.y * 0.12, 0.04);
      w.rotation.y = lerp(w.rotation.y, pointer.current.x * 0.12, 0.04);
    }
  });

  return (
    <group ref={wrapper} position={mode === 'hero' ? [0.72, 0, 0] : [0, 0, 0]}>
      <group ref={spin}>
        <mesh geometry={geometry} material={material} frustumCulled={false} />
        {!low && (
          <lineSegments geometry={getWire()} material={lineMaterial} scale={1.003} frustumCulled={false} />
        )}
      </group>
    </group>
  );
}
