import { SectionHeading, useClipRevealAll } from './Reveal';

/** Собственные линейные иконки: stroke 1.25, цвет --chrome, без заливки и кружков. */
function ShieldIcon() {
  return (
    <svg className="tile__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.2 18.8 6v5.1c0 4.4-2.9 7.6-6.8 8.9-3.9-1.3-6.8-4.5-6.8-8.9V6L12 3.2Z" />
      <path d="M8.9 11.8l2.1 2.1 4-4.4" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg className="tile__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5.6" y="10.4" width="12.8" height="9.2" rx="1" />
      <path d="M8.8 10.4V8.2a3.2 3.2 0 0 1 6.4 0v2.2" />
      <path d="M12 14v2.4" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg className="tile__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.2 19.4 7.4v9.2L12 20.8l-7.4-4.2V7.4L12 3.2Z" />
      <path d="M12 12.1 19.4 7.6" />
      <path d="M12 12.1v8.4" />
      <path d="M12 12.1 4.6 7.6" />
    </svg>
  );
}
function PulseIcon() {
  return (
    <svg className="tile__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12h4l2.4-6.2 4.6 12.4L16.6 12H21" />
    </svg>
  );
}

const TILES = [
  {
    icon: <ShieldIcon />,
    h: 'SOC 2 Type II',
    p: 'Аудит пройден в 2025, отчёт доступен по запросу.',
  },
  {
    icon: <LockIcon />,
    h: 'Шифрование в покое',
    p: 'AES-256 на дисках, ключи в HSM, доступ по IAM-ролям.',
  },
  {
    icon: <BoxIcon />,
    h: 'Изоляция задач',
    p: 'Каждая задача в отдельном контейнере с cgroup-лимитами.',
  },
  {
    icon: <PulseIcon />,
    h: 'SLA 99.9%',
    p: 'Компенсация кредитами автоматически, без обращений.',
  },
];

export function Reliability() {
  const tilesRef = useClipRevealAll<HTMLDivElement>('.tile');

  return (
    <section className="section" aria-label="Надёжность и безопасность">
      <div className="container">
        <SectionHeading label="Безопасность и SLA" lines={['Надёжность']} />
        <div className="tiles" ref={tilesRef}>
          {TILES.map((t, i) => (
            <div className="tile" key={t.h} data-speed={[0.05, 0.09, 0.07, 0.11][i]}>
              {t.icon}
              <h3>{t.h}</h3>
              <p>{t.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
