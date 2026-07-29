import { useEffect } from 'react';
import { platform } from './platform';

const GLYPHS = '░▒/<>|01—·';

/**
 * Лейблы (.label) «декодируются» при первом входе в вьюпорт:
 * случайные знаки схлопываются в финальный текст слева направо за ~0.7s.
 * Запускается только после загрузки, при reduce-motion не работает.
 */
export function useScramble(loaded: boolean) {
  useEffect(() => {
    if (!loaded || platform.reduced) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>('.label'));
    const cleanups: (() => void)[] = [];

    const scramble = (el: HTMLElement) => {
      const final = el.dataset.final ?? el.textContent ?? '';
      el.dataset.final = final;
      let frame = 0;
      const total = Math.max(16, Math.round(final.length * 1.15));
      const timer = window.setInterval(() => {
        frame += 1;
        const resolved = Math.floor((frame / total) * final.length);
        let out = '';
        for (let i = 0; i < final.length; i++) {
          const ch = final[i];
          if (i < resolved || ch === ' ') out += ch;
          else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (frame >= total) {
          window.clearInterval(timer);
          el.textContent = final;
        }
      }, 34);
      cleanups.push(() => window.clearInterval(timer));
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            io.unobserve(entry.target);
            scramble(entry.target as HTMLElement);
          }
        });
      },
      { threshold: 0.6 },
    );

    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      cleanups.forEach((fn) => fn());
      // восстанавливаем финальный текст, если размонтировались на полпути
      els.forEach((el) => {
        if (el.dataset.final) el.textContent = el.dataset.final;
      });
    };
  }, [loaded]);
}
