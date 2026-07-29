import type { MouseEvent } from 'react';
import { shared } from './platform';

/** Якорный скролл через lenis (плавно) или нативно (fallback). */
export function handleAnchor(e: MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  e.preventDefault();
  if (href === '#') return;
  const el = href.length > 1 ? document.querySelector<HTMLElement>(href) : null;
  if (href !== '#top' && !el) return;
  if (shared.lenis) {
    shared.lenis.scrollTo(href === '#top' ? 0 : (el as HTMLElement), {
      offset: href === '#top' ? 0 : -48,
      duration: 1.5,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
    });
  } else if (href === '#top') {
    window.scrollTo({ top: 0 });
  } else {
    (el as HTMLElement).scrollIntoView({ block: 'start' });
  }
}
