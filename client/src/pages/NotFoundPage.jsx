import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-50 px-6 text-center font-sans text-ink-950">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-600">404</p>
      <h1 className="text-4xl font-semibold tracking-[-0.05em]">Page not found</h1>
      <p className="max-w-md text-base leading-7 text-slate-500">
        The route does not exist yet. Return to the dashboard to keep building.
      </p>
      <Link
        to="/"
        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#3525cd_100%)] px-5 py-3 text-sm font-semibold text-white shadow-soft-card transition hover:brightness-105"
      >
        Go home
      </Link>
    </main>
  );
}

export default NotFoundPage;
