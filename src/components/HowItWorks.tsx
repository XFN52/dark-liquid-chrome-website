import { SectionHeading, useClipRevealAll, useScaleXReveal } from './Reveal';

const STEPS = [
  {
    n: '01',
    h: 'Опишите задачу',
    p: 'Один YAML или CLI-команда. Указываете тип GPU, количество и лимит по бюджету.',
  },
  {
    n: '02',
    h: 'Сеть находит узлы',
    p: 'Планировщик подбирает свободные мощности в ближайшем регионе. Обычно за 8 секунд.',
  },
  {
    n: '03',
    h: 'Платите за секунды',
    p: 'Списание идёт по факту работы. Остановили задачу — начисление прекратилось в ту же секунду.',
  },
];

export function HowItWorks() {
  const ruleRef = useScaleXReveal<HTMLDivElement>();
  const stepsRef = useClipRevealAll<HTMLDivElement>('.step');

  return (
    <section className="section" id="how">
      <div className="container">
        <SectionHeading label="Путь задачи" lines={['Как это работает']} />
        <div className="how__rule" ref={ruleRef}>
          <div className="hairline-lit" />
        </div>
        <div className="steps" ref={stepsRef}>
          {STEPS.map((s, i) => (
            <div className="step" key={s.n} data-speed={[0.05, 0.11, 0.07][i]}>
              <span className="step__num">{s.n}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
