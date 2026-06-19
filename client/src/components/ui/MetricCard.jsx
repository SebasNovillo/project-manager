import { cardClassName, cx } from '../../lib/ui';

function MetricCard({ label, value, accent = 'default' }) {
  const accentClassName =
    accent === 'brand'
      ? 'bg-brand-50 text-brand-700'
      : accent === 'dark'
        ? 'bg-ink-950 text-white'
        : 'bg-surface-100 text-slate-600';

  return (
    <article className={cardClassName}>
      <div
        className={cx(
          'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
          accentClassName
        )}
      >
        {label}
      </div>
      <strong className="mt-4 block text-3xl font-semibold tracking-[-0.05em] text-ink-950">
        {value}
      </strong>
    </article>
  );
}

export default MetricCard;
