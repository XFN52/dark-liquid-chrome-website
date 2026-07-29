import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { platform } from '../lib/platform';
import { handleAnchor } from '../lib/scroll';

const NAV = [
  { href: '#how', label: 'Как это работает' },
  { href: '#pricing', label: 'Цены' },
  { href: '#stack', label: 'Стек' },
  { href: '#faq', label: 'FAQ' },
];

/** Живые UTC-часы — инфраэстетика: сеть работает прямо сейчас. */
function UtcClock() {
  const [time, setTime] = useState('00:00:00');
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      setTime(`${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`);
    };
    fmt();
    const id = window.setInterval(fmt, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="mono">UTC {time}</span>;
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // линия прогресса чтения по нижней границе хедера
  useLayoutEffect(() => {
    const el = progressRef.current;
    if (!el || platform.reduced) return;
    const tw = gsap.fromTo(
      el,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      },
    );
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);

  return (
    <header className={scrolled ? 'site-header is-scrolled' : 'site-header'}>
      <div className="site-header__inner container">
        <a href="#top" className="site-header__logo" onClick={handleAnchor}>
          NOCTA
        </a>
        <nav className="site-header__nav" aria-label="Основная навигация">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="u-link" onClick={handleAnchor}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="site-header__actions">
          <div className="site-header__status" role="status" aria-label="Статус сети: все системы работают">
            <span className="hdr-dot" aria-hidden="true" />
            ALL SYSTEMS GO
            <span aria-hidden="true">·</span>
            <UtcClock />
          </div>
          <a href="#faq" className="u-link site-header__doc" onClick={handleAnchor}>
            Документация
          </a>
          <a href="#cta" className="btn btn--ghost btn--sm" onClick={handleAnchor}>
            <span>Начать</span>
          </a>
        </div>
      </div>
      <div className="site-header__progress" ref={progressRef} aria-hidden="true" />
    </header>
  );
}
