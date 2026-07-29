import { handleAnchor } from '../lib/scroll';

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Продукт',
    links: [
      { label: 'Цены', href: '#pricing' },
      { label: 'Регионы', href: '#top' },
      { label: 'Статус сети', href: '#top' },
      { label: 'Changelog', href: '#top' },
    ],
  },
  {
    title: 'Разработчикам',
    links: [
      { label: 'Документация', href: '#faq' },
      { label: 'API-справка', href: '#faq' },
      { label: 'CLI', href: '#faq' },
      { label: 'SDK для Python', href: '#faq' },
    ],
  },
  {
    title: 'Компания',
    links: [
      { label: 'О проекте', href: '#top' },
      { label: 'Блог', href: '#top' },
      { label: 'Карьера', href: '#top' },
      { label: 'Контакты', href: '#cta' },
    ],
  },
  {
    title: 'Правовое',
    links: [
      { label: 'Условия', href: '#top' },
      { label: 'Конфиденциальность', href: '#top' },
      { label: 'SLA', href: '#faq' },
      { label: 'Отчёт SOC 2', href: '#top' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <a href="#top" className="footer__logo" onClick={handleAnchor}>
              NOCTA
            </a>
            <p>
              Распределённая сеть GPU для обучения и инференса.
              41 000 GPU, 19 регионов, оплата по секундам.
            </p>
          </div>
          {COLS.map((col) => (
            <nav className="footer__col" key={col.title} aria-label={col.title}>
              <span className="label">{col.title}</span>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="u-link" onClick={handleAnchor}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer__bottom">
          <span>NOCTA © 2026</span>
          <nav aria-label="Социальные сети">
            <a href="#top" onClick={handleAnchor}>GitHub</a>
            <a href="#top" onClick={handleAnchor}>X</a>
            <a href="#top" onClick={handleAnchor}>LinkedIn</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
