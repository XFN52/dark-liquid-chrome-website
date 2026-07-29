import { useMaskReveal } from './Reveal';
import { handleAnchor } from '../lib/scroll';

export function FinalCta() {
  const ref = useMaskReveal<HTMLDivElement>();

  return (
    <section className="cta" id="cta">
      <div className="glow cta__glow" aria-hidden="true" data-speed={0.16} />
      <div className="container cta__inner" ref={ref} data-speed={0.05}>
        <span className="label">Начать</span>
        <h2>
          <span className="mask-line"><span className="mask-line__in">Первые 20 GPU-часов</span></span>
          <span className="mask-line"><span className="mask-line__in">бесплатно</span></span>
        </h2>
        <p>Без карты. Регистрация занимает минуту.</p>
        <a href="#top" className="btn btn--primary btn--lg" onClick={handleAnchor}>
          <span>Создать аккаунт</span>
        </a>
      </div>
    </section>
  );
}
