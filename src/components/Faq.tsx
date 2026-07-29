import { useLayoutEffect, useRef, useState } from 'react';
import { SectionHeading } from './Reveal';
import { platform } from '../lib/platform';

const ITEMS = [
  {
    q: 'Можно ли взять GPU на 5 минут?',
    a: 'Минимальной аренды нет: биллинг посекундный. Пять минут на A10G обойдутся в $0.026. Остановили инстанс — списания прекратились в ту же секунду.',
  },
  {
    q: 'Что будет, если узел упадёт посреди обучения?',
    a: 'Планировщик перезапустит задачу на свободном узле в том же регионе примерно за 400 мс. Чекпоинты пишутся на отдельное хранилище каждые 5 минут. Время простоя не тарифицируется.',
  },
  {
    q: 'Мои данные видит владелец узла?',
    a: 'Нет. Узлы принадлежат NOCTA или аудированным по SOC 2 партнёрам. Задача работает в изолированном контейнере, диск шифруется AES-256, память очищается после каждой задачи.',
  },
  {
    q: 'Как считается биллинг при остановке задачи?',
    a: 'Секунда запуска тарифицируется, секунда остановки — уже нет. В счёте поминутная разбивка по каждому GPU, есть экспорт в CSV и API для вашего биллинга.',
  },
  {
    q: 'Есть ли квоты и лимиты на аккаунт?',
    a: 'По умолчанию — до 32 GPU одновременно. Верифицированным командам поднимаем до 512 GPU по запросу, обычно в течение одного рабочего дня.',
  },
  {
    q: 'Чем это дешевле, чем облако большого провайдера?',
    a: 'Мы не держим пустые мощности: утилизация парка 87%. H100 у нас стоит $2.14/час против $4–6 у крупных облаков, без резерваций, авансов и минимальных контрактов.',
  },
];

function FaqItem({
  q,
  a,
  open,
  onToggle,
  index,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // реальная высота через scrollHeight, без max-height хака
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    if (platform.reduced) {
      body.style.transition = 'none';
      body.style.height = open ? 'auto' : '0px';
      return;
    }
    body.style.transition = '';
    body.style.height = open ? `${body.scrollHeight}px` : '0px';
  }, [open]);

  return (
    <div className={open ? 'faq-item is-open' : 'faq-item'}>
      <button
        className="faq-item__q"
        aria-expanded={open}
        aria-controls={`faq-a-${index}`}
        id={`faq-q-${index}`}
        onClick={onToggle}
      >
        <span>{q}</span>
        <span className="faq__icon" aria-hidden="true"><i /><i /></span>
      </button>
      <div
        className="faq-item__body"
        id={`faq-a-${index}`}
        role="region"
        aria-labelledby={`faq-q-${index}`}
        ref={bodyRef}
      >
        <p>{a}</p>
      </div>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number>(-1); // одновременно открыт только один

  return (
    <section className="section" id="faq">
      <div className="container faq__grid">
        <div className="faq__side">
          <SectionHeading label="Вопросы и ответы" lines={['Частые вопросы']} />
        </div>
        <div className="faq__list">
          {ITEMS.map((item, i) => (
            <FaqItem
              key={i}
              q={item.q}
              a={item.a}
              open={open === i}
              index={i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
