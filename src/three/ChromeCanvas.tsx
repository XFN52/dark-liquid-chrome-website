import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import { ChromeForm, type SceneMode } from './ChromeForm';
import { Particles } from './Particles';
import { createEnvironmentTexture } from './environment';
import { platform, shared } from '../lib/platform';

/** Привязывает процедурное окружение к сцене именно этого контекста. */
function EnvironmentBinding() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const tex = createEnvironmentTexture();
    scene.environment = tex;
    return () => {
      scene.environment = null;
      tex.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Отмечает первый реальный кадр — прелоадер ждёт его. */
function FirstFrame() {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      shared.firstFrame = true;
    }
  });
  return null;
}

/** Минимум постобработки: мягкий Bloom + лёгкий Noise. Без DoF и виньетки. */
function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.4} luminanceThreshold={0.82} luminanceSmoothing={0.18} mipmapBlur />
      <Noise opacity={0.02} />
    </EffectComposer>
  );
}

/** Статичная замена при отсутствии WebGL: glow + SVG-кольца тонкими линиями.
 *  Внешний div несёт позиционирующий класс секции, внутренний — наполнение. */
function ChromeFallback({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="chrome-fallback">
        <div className="chrome-fallback__glow" />
        <svg className="chrome-fallback__rings" viewBox="0 0 600 600" fill="none" aria-hidden="true">
          <circle cx="300" cy="300" r="238" stroke="rgba(201,212,232,0.18)" strokeWidth="1" />
          <circle cx="300" cy="300" r="196" stroke="rgba(201,212,232,0.12)" strokeWidth="1" strokeDasharray="2 10" />
          <ellipse cx="300" cy="300" rx="238" ry="96" stroke="rgba(59,91,255,0.25)" strokeWidth="1" />
          <ellipse cx="300" cy="300" rx="238" ry="150" stroke="rgba(201,212,232,0.10)" strokeWidth="1" strokeDasharray="1 8" />
        </svg>
        <svg className="chrome-fallback__rings chrome-fallback__rings--2" viewBox="0 0 600 600" fill="none" aria-hidden="true">
          <circle cx="300" cy="300" r="252" stroke="rgba(201,212,232,0.08)" strokeWidth="1" strokeDasharray="1 14" />
          <ellipse cx="300" cy="300" rx="260" ry="64" stroke="rgba(201,212,232,0.12)" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

export function ChromeCanvas({
  mode,
  className,
  dataSpeed,
}: {
  mode: SceneMode;
  className?: string;
  dataSpeed?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const low = platform.low;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '120px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!platform.webgl) return <ChromeFallback className={className} />;

  return (
    <div
      ref={wrapRef}
      className={className}
      aria-hidden="true"
      data-speed={dataSpeed !== undefined ? String(dataSpeed) : undefined}
    >
      <Canvas
        dpr={low ? 1 : [1, 1.6]}
        frameloop={inView ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 4.4], fov: 40 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <EnvironmentBinding />
        <FirstFrame />
        <Suspense fallback={null}>
          <ChromeForm mode={mode} />
          <Particles mode={mode} />
        </Suspense>
        {!low && <Effects />}
      </Canvas>
    </div>
  );
}
