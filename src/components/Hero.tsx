import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { platform } from '../lib/platform';
import { handleAnchor } from '../lib/scroll';
import { ChromeCanvas } from '../three/ChromeCanvas';

const STRIP = [
  { v: '41 240', l: 'GPU в сети' },
  { v: '19', l: 'регионов' },
  {
    v: '99.94%',
    l: 'аптайм',
    live: true,
  },
  { v: '$0.31', l: 'за час A10G' },
];

export function Hero({ start }: { start: boolean }) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const lines = el.querySelectorAll<HTMLElement>('.mask-line__in');
    if (platform.reduced) {
      gsap.set(lines, { yPercent: 0 });
      return;
    }
    if (!start) {
      gsap.set(lines, { yPercent: 110 });
      return;
    }
    const tw = gsap.fromTo(
      lines,
      { yPercent: 110 },
      { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, delay: 0.05 },
    );
    return () => {
      tw.kill();
    };
  }, [start]);

  // Лёгкое следование hero-glow за курсором — только на десктопе и без reduced-motion.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (platform.reduced || platform.mobile) return;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1..1
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      el.style.setProperty('--gx', `${nx * -56}px`);
      el.style.setProperty('--gy', `${ny * 34}px`);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <section className="hero" id="top" ref={root}>
      <div className="glow hero__glow" aria-hidden="true" />
      <ChromeCanvas mode="hero" className="hero__canvas" dataSpeed={0.06} />
      <div className="hero__main">
        <div className="container hero__grid">
          <div className="hero__content" data-speed={0.11}>
            <span className="label">Сеть распределённых вычислений</span>
            <h1 className="display">
              <span className="mask-line"><span className="mask-line__in">Вычисления</span></span>
              <span className="mask-line"><span className="mask-line__in">по цене</span></span>
              <span className="mask-line"><span className="mask-line__in">электричества</span></span>
            </h1>
            <p className="hero__sub">
              41 000 GPU в 19 регионах. Оплата по секундам, без минимальной аренды.
              Запуск задачи — 8 секунд.
            </p>
            <div className="hero__actions">
              <a href="#cta" className="btn btn--primary" onClick={handleAnchor}>
                <span>Запустить задачу</span>
              </a>
              <a href="#pricing" className="link-arrow" onClick={handleAnchor}>
                Смотреть цены <span className="arr" aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="hero__strip">
        <div className="container hero__strip-grid">
          {STRIP.map((s) => (
            <div className="stat" key={s.l}>
              <span className="stat__v mono">
                {s.v}
                {s.live && <span className="live" aria-label="статус: в сети" />}
              </span>
              <span className="stat__l">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
