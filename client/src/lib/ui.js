export function cx(...values) {
  return values.filter(Boolean).join(' ');
}

export const labelClassName = 'grid gap-1.5 text-sm font-medium text-slate-600';

export const inputClassName =
  'mt-2 w-full rounded-2xl border border-stroke-1 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100';

export const panelClassName =
  'rounded-[28px] border border-stroke-1 bg-white/92 p-5 shadow-soft-card backdrop-blur sm:p-6';

export const cardClassName =
  'rounded-[24px] border border-stroke-1 bg-white/90 p-4 shadow-soft-card';

export function buttonClassName(tone = 'primary') {
  if (tone === 'secondary') {
    return 'inline-flex min-h-11 items-center justify-center rounded-2xl border border-stroke-1 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60';
  }

  if (tone === 'danger') {
    return 'inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60';
  }

  if (tone === 'warning') {
    return 'inline-flex min-h-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60';
  }

  return 'inline-flex min-h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#3525cd_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-soft-card transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60';
}
