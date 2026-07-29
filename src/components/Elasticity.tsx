import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { platform, shared } from '../lib/platform';
import { ChromeCanvas } from '../three/ChromeCanvas';

const BLOCKS = [
  {
    label: 'Упругость',
    text: 'Мощность перетекает между регионами. Упал узел — задача продолжается на другом через 400 миллисекунд.',
    meta: 'failover: 400 мс',
  },
  {
    label: 'Плотность',
    text: 'Мы не держим пустые серверы. Средняя утилизация парка 87%, поэтому час стоит 31 цент, а не два доллара.',
    meta: 'утилизация парка: 87%',
  },
  {
    label: 'Прозрачность',
    text: 'В счёте видно каждую секунду каждого GPU. Экспорт в CSV, API для биллинга, никаких «прочих услуг».',
    meta: 'гранулярность счёта: 1 с',
  },
];

/**
 * Главный визуальный момент: левая колонка sticky с хромом,
 * три состояния деформации едят scroll progress секции (shared.deform).
 * Текст появляется маской clip-path и уходит в opacity 0.25 при выходе из фокуса.
 */
export function Elasticity() {
  const root = useRef<HTMLElement>(null);
  const blocksRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (!platform.reduced) shared.deform = self.progress;
      },
    });

    const tweens: gsap.core.Tween[] = [];
    const triggers: ScrollTrigger[] = [st];
    const blocks = blocksRef.current.filter(Boolean) as HTMLDivElement[];

    if (!platform.reduced) {
      blocks.forEach((b, i) => {
        gsap.set(b, { clipPath: 'inset(0 0 100% 0)' });
        tweens.push(
          gsap.to(b, {
            clipPath: 'inset(0% 0 0% 0)',
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: b, start: 'top 72%', once: true },
          }),
        );
        if (i < blocks.length - 1) {
          const next = blocks[i + 1];
          triggers.push(
            ScrollTrigger.create({
              trigger: next,
              start: 'top 62%',
              onEnter: () => gsap.to(b, { opacity: 0.25, duration: 0.45, ease: 'power2.out' }),
              onLeaveBack: () => gsap.to(b, { opacity: 1, duration: 0.45, ease: 'power2.out' }),
            }),
          );
        }
      });
    }

    return () => {
      triggers.forEach((t) => t.kill());
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      gsap.set(blocks, { clearProps: 'clipPath,opacity' });
      shared.deform = 0;
    };
  }, []);

  return (
    <section className="elastic" ref={root} aria-label="Свойства сети">
      <div className="elastic__left">
        <ChromeCanvas mode="sticky" className="elastic__canvas" />
      </div>
      <div className="elastic__right">
        {BLOCKS.map((b, i) => (
          <div
            className="elastic-block"
            key={b.label}
            data-speed={0.06}
            ref={(n) => {
              blocksRef.current[i] = n;
            }}
          >
            <span className="label">{b.label}</span>
            <p className="elastic-block__text">{b.text}</p>
            <span className="elastic-block__meta mono">{b.meta}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
