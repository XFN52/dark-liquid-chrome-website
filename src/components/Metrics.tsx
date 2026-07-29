import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { platform } from '../lib/platform';
import { formatNumber } from '../lib/format';

const METRICS: {
  label: string;
  to: number;
  decimals?: number;
  suffix?: string;
  delta: string;
  live?: boolean;
}[] = [
  { label: 'GPU в сети', to: 41240, delta: '+2.1% за сутки', live: true },
  { label: 'средняя утилизация', to: 87, suffix: '%', delta: '+1.3 п.п. за неделю' },
  { label: 'регионов присутствия', to: 19, delta: '+2 за квартал' },
  { label: 'секунд до запуска', to: 8, decimals: 1, delta: '−0.6 с за неделю' },
];

/** Отсчёт 0 → значение за 1.8s при входе в viewport, once, power3.out.
 *  При prefers-reduced-motion — сразу финальное значение.
 *  live: после отсчёта число продолжает потихоньку джиттериться, как живая сеть. */
function Counter({
  to,
  decimals = 0,
  suffix = '',
  live = false,
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  live?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (platform.reduced) {
      el.textContent = formatNumber(to, decimals) + suffix;
      return;
    }
    let liveId: number | undefined;
    let current = to;
    const startLive = () => {
      if (!live) return;
      liveId = window.setInterval(() => {
        current += Math.round((Math.random() - 0.5) * 7);
        current = Math.max(to - 60, Math.min(current, to + 140));
        el.textContent = formatNumber(current, decimals) + suffix;
      }, 5200);
    };
    const obj = { v: 0 };
    el.textContent = formatNumber(0, decimals) + suffix;
    const tw = gsap.to(obj, {
      v: to,
      duration: 1.8,
      ease: 'power3.out',
      paused: true,
      onUpdate: () => {
        el.textContent = formatNumber(obj.v, decimals) + suffix;
      },
      onComplete: startLive,
    });
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => tw.play(),
    });
    return () => {
      if (liveId !== undefined) window.clearInterval(liveId);
      st.kill();
      tw.kill();
    };
  }, [to, decimals, suffix, live]);

  return <span ref={ref} />;
}

export function Metrics() {
  return (
    <section className="section metrics" aria-label="Живые метрики сети">
      <div className="glow metrics__glow" aria-hidden="true" data-speed={0.2} />
      <div className="container">
        <span className="label">Сеть сейчас</span>
        <div className="metrics__grid">
          {METRICS.map((m, i) => (
            <div className="metric-cell" key={m.label} data-speed={0.03 + (i % 2) * 0.02}>
              <span className="label">{m.label}</span>
              <span className="metric-cell__value mono">
                <Counter to={m.to} decimals={m.decimals} suffix={m.suffix} live={m.live} />
              </span>
              <span className="metric-cell__delta mono">{m.delta}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
