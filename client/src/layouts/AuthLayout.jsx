import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-50 px-4 py-10 font-sans text-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.16),transparent_32%)]" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] h-80 w-80 rounded-full bg-brand-100/70 blur-3xl" />

      <div className="relative grid w-full max-w-5xl gap-10 rounded-[32px] border border-stroke-1 bg-white/82 p-6 shadow-soft-panel backdrop-blur-xl sm:p-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid content-center gap-5 rounded-[28px] bg-[linear-gradient(135deg,rgba(239,244,255,0.95),rgba(255,255,255,0.88))] p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-600">
            Project Manager
          </p>
          <h1 className="max-w-md text-4xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-5xl">
            Build projects with more calm and more control.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            Plan sprints, shape backlogs, and align delivery in a workspace that feels more premium than utilitarian.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Clear backlog', 'Focus the next sprint before the board gets noisy.'],
              ['Fast execution', 'Move from planning into delivery without losing context.'],
              ['Shared rhythm', 'Give product, design, and engineering the same visual language.']
            ].map(([title, description]) => (
              <article key={title} className="rounded-[24px] border border-stroke-1 bg-white/88 p-4 shadow-soft-card">
                <h2 className="text-sm font-semibold text-ink-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
