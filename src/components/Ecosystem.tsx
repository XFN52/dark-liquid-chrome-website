const ROW_A = ['PyTorch', 'Kubernetes', 'Ray', 'Slurm', 'Docker', 'Terraform'];
const ROW_B = ['Weights & Biases', 'MLflow', 'Airflow', 'Hugging Face', 'vLLM'];

function Group({ items }: { items: string[] }) {
  // троекратное повторение, чтобы строка покрывала сверхширокие экраны
  const tripled = [...items, ...items, ...items];
  return (
    <div className="marquee__group" aria-hidden="true">
      {tripled.map((item, i) => (
        <span key={i} style={{ display: 'contents' }}>
          <span className="marquee__item">{item}</span>
          <span className="marquee__dot" />
        </span>
      ))}
    </div>
  );
}

/** Бегущие строки: чистый CSS, содержимое продублировано для бесшовного -50% цикла. */
export function Ecosystem() {
  return (
    <section className="section eco" id="stack" aria-label="Совместимость со стеком">
      <div className="container">
        <span className="label">Интегрируется со стеком</span>
      </div>
      <div className="marquee">
        <div className="marquee__track">
          <Group items={ROW_A} />
          <Group items={ROW_A} />
        </div>
      </div>
      <div className="marquee marquee--reverse">
        <div className="marquee__track">
          <Group items={ROW_B} />
          <Group items={ROW_B} />
        </div>
      </div>
      <ul className="sr-only">
        {[...ROW_A, ...ROW_B].map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </section>
  );
}
