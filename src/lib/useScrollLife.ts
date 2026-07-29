import { useEffect } from 'react';
import { gsap } from './gsap';
import { platform } from './platform';

/**
 * «Живость при скролле»: всё, что помечено data-speed, получает
 * scrub-параллакс относительно своей секции. speed 0.04 — почти незаметный
 * дрейф, 0.18 — глубокий параллакс свечения. Отключено при reduce-motion.
 */
export function useScrollLife(deps: unknown[] = []) {
  useEffect(() => {
    if (platform.reduced) return;
    const els = gsap.utils.toArray<HTMLElement>('[data-speed]');
    const tweens: gsap.core.Tween[] = [];
    els.forEach((el) => {
      const speed = parseFloat(el.dataset.speed || '0');
      if (!speed) return;
      const px = Math.round(speed * 200); // 0.05 -> ±10px, 0.18 -> ±36px
      const trigger = (el.closest('section') as HTMLElement) ?? el;
      tweens.push(
        gsap.fromTo(
          el,
          { y: px },
          {
            y: -px,
            ease: 'none',
            scrollTrigger: {
              trigger,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          },
        ),
      );
    });
    return () => {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      gsap.set(els, { clearProps: 'transform' });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
