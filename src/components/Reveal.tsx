import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { platform } from '../lib/platform';

/**
 * Три приёма появления, распределённые по сайту:
 *  1. useMaskReveal  — заголовки: маска + выезд строки снизу (yPercent 110 → 0);
 *  2. useClipRevealAll — карточки/плитки: clip-path inset(0 0 100% 0) → inset(0), stagger 0.08;
 *  3. useScaleXReveal — hairline-линии: scaleX(0) → scaleX(1) от левого края.
 * Основной текст не анимируется вовсе — он просто есть.
 */

export function useMaskReveal<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inners = el.querySelectorAll<HTMLElement>('.mask-line__in');
    if (platform.reduced) {
      gsap.set(inners, { yPercent: 0 });
      return;
    }
    gsap.set(inners, { yPercent: 110 });
    const tw = gsap.to(inners, {
      yPercent: 0,
      duration: 1.05,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export function useClipRevealAll<T extends HTMLElement>(selector: string, deps: unknown[] = []) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>(selector);
    if (!items.length) return;
    if (platform.reduced) {
      gsap.set(items, { clipPath: 'inset(0% 0 0% 0)' });
      return;
    }
    gsap.set(items, { clipPath: 'inset(0 0 100% 0)' });
    const tw = gsap.to(items, {
      clipPath: 'inset(0% 0 0% 0)',
      duration: 0.85,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 80%', once: true },
    });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export function useScaleXReveal<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (platform.reduced) {
      gsap.set(el, { scaleX: 1 });
      return;
    }
    gsap.set(el, { scaleX: 0 });
    const tw = gsap.to(el, {
      scaleX: 1,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** Шапка секции: label + h2 со строками в масках. */
export function SectionHeading({
  label,
  lines,
  className,
}: {
  label: string;
  lines: string[];
  className?: string;
}) {
  const ref = useMaskReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={className ? `section-head ${className}` : 'section-head'}>
      <span className="label">{label}</span>
      <h2>
        {lines.map((line, i) => (
          <span className="mask-line" key={i}>
            <span className="mask-line__in">{line}</span>
          </span>
        ))}
      </h2>
    </div>
  );
}
