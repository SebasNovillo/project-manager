import { panelClassName } from '../../lib/ui';

function EmptyStatePanel({ eyebrow, title, description }) {
  return (
    <article className={`${panelClassName} grid min-h-56 place-items-center text-center`}>
      <div className="max-w-lg space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-600">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.05em] text-ink-950">{title}</h2>
        <p className="text-base leading-7 text-slate-500">{description}</p>
      </div>
    </article>
  );
}

export default EmptyStatePanel;
