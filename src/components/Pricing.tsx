import { useEffect, useState } from 'react';
import { SectionHeading, useClipRevealAll } from './Reveal';
import { formatNumber } from '../lib/format';
import { platform } from '../lib/platform';

const ROWS = [
  { gpu: 'H100 SXM', vram: '80 GB', price: '$2.14', avail: 412 },
  { gpu: 'A100 80G', vram: '80 GB', price: '$1.09', avail: 1840 },
  { gpu: 'L40S', vram: '48 GB', price: '$0.74', avail: 2210 },
  { gpu: 'A10G', vram: '24 GB', price: '$0.31', avail: 6049 },
  { gpu: 'RTX 4090', vram: '24 GB', price: '$0.28', avail: 11302 },
];

/** Доступность дышит как в живой сети: случайное блуждание вокруг базы ±5%. */
function useLiveAvailability() {
  const [avail, setAvail] = useState<number[]>(ROWS.map((r) => r.avail));
  useEffect(() => {
    if (platform.reduced) return;
    const id = window.setInterval(() => {
      setAvail((prev) =>
        prev.map((v, i) => {
          const base = ROWS[i].avail;
          const step = Math.round((Math.random() - 0.48) * (base * 0.012 + 2));
          const next = v + step;
          return Math.max(Math.round(base * 0.94), Math.min(next, Math.round(base * 1.06)));
        }),
      );
    }, 4600);
    return () => window.clearInterval(id);
  }, []);
  return avail;
}

export function Pricing() {
  const wrapRef = useClipRevealAll<HTMLDivElement>('.table-wrap');
  const avail = useLiveAvailability();

  return (
    <section className="section" id="pricing" ref={wrapRef}>
      <div className="container">
        <div className="pricing__head">
          <SectionHeading label="Тарификация" lines={['Цены']} />
          <p className="pricing__hint">
            Один тариф на всё: берёте GPU от одного до тысячи, платите только за фактическое
            время задачи.
          </p>
        </div>
        <div className="table-wrap" data-speed={0.04}>
          <table className="pricing-table">
            <caption className="sr-only">Цены на аренду GPU в сети NOCTA</caption>
            <thead>
              <tr>
                <th scope="col">GPU</th>
                <th scope="col" className="num">VRAM</th>
                <th scope="col" className="num">$/час</th>
                <th scope="col" className="num">Доступно сейчас</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.gpu}>
                  <td className="gpu">{r.gpu}</td>
                  <td className="num">{r.vram}</td>
                  <td className="num">{r.price}</td>
                  <td className="num avail">
                    <span className="num-out" key={avail[i]}>
                      {formatNumber(avail[i])}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pricing-note">
          Цены за секунду аренды, округлены до часа для наглядности. Минимальной аренды нет:
          можно взять GPU на 40 секунд.
        </p>
      </div>
    </section>
  );
}
