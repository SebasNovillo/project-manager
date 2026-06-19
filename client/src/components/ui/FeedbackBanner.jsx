import { cx } from '../../lib/ui';

function FeedbackBanner({ message, tone = 'success' }) {
  const toneClassName =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-600'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <p className={cx('rounded-2xl border px-4 py-3 text-sm font-medium', toneClassName)}>
      {message}
    </p>
  );
}

export default FeedbackBanner;
