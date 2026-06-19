import { cx } from '../../lib/ui';

function InsightBanner({ insight }) {
  const toneClassName =
    insight.tone === 'good'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : insight.tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : insight.tone === 'risk'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-stroke-1 bg-surface-100 text-slate-600';

  return (
    <div className={cx('rounded-[24px] border px-4 py-4', toneClassName)}>
      <strong className="block text-sm font-semibold">{insight.title}</strong>
      <span className="mt-2 block text-sm leading-6">{insight.description}</span>
    </div>
  );
}

export default InsightBanner;
