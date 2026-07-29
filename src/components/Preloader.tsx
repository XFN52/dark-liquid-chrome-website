import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { platform, shared } from '../lib/platform';

/**
 * Прелоадер: моно-счётчик 000 → 100 и линия 200px цветом --chrome.
 * Прогресс реальный: счётчик капится на 90, пока не сойдутся
 * загрузчики three (useProgress), document.fonts и первый кадр WebGL.
 * После 100 — пауза 0.25s и уход вверх за 0.8s cubic-bezier(0.76,0,0.24,1).
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (platform.reduced) {
      const t1 = window.setTimeout(() => {
        setLeaving(true);
        onDone();
        window.setTimeout(() => setGone(true), 300);
      }, 120);
      return () => window.clearTimeout(t1);
    }
    let raf = 0;
    let finished = false;
    const t0 = performance.now();
    const tick = (now: number) => {
      const raw = Math.min(1, (now - t0) / 1500);
      const eased = 1 - Math.pow(1 - raw, 3);
      let target = Math.round(eased * 100);
      const loadingActive = useProgress.getState().active;
      const ready =
        shared.fontsReady && (!platform.webgl || shared.firstFrame) && !loadingActive;
      if (!ready) target = Math.min(target, 90 + Math.round(eased * 4));
      setN(target);
      if (target >= 100) {
        if (!finished) {
          finished = true;
          window.setTimeout(() => {
            setLeaving(true);
            onDone();
            window.setTimeout(() => setGone(true), 860);
          }, 250);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div className={leaving ? 'preloader is-leaving' : 'preloader'} role="status" aria-label="Загрузка сайта">
      <div className="preloader__num mono">{String(n).padStart(3, '0')}</div>
      <div className="preloader__track">
        <div className="preloader__fill" style={{ transform: `scaleX(${n / 100})` }} />
      </div>
    </div>
  );
}
