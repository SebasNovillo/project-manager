import { useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function getRouteMeta(pathname) {
  if (pathname.includes('/board')) {
    return {
      eyebrow: 'Sprint Execution',
      title: 'Sprint Board',
      searchPlaceholder: 'Search tasks, labels, or people...'
    };
  }

  if (pathname.startsWith('/projects/')) {
    return {
      eyebrow: 'Project Workspace',
      title: 'Project Detail',
      searchPlaceholder: 'Search backlog items or sprint history...'
    };
  }

  return {
    eyebrow: 'Workspace Overview',
    title: 'Dashboard',
    searchPlaceholder: 'Search projects, tasks, or sprint goals...'
  };
}

function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const routeMeta = getRouteMeta(location.pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-stroke-1 bg-surface-50/88 backdrop-blur-xl">
      <div className="grid gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)_auto] lg:items-center lg:px-8">
        <div className="grid gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            {routeMeta.eyebrow}
          </p>
          <strong className="text-xl font-semibold tracking-[-0.03em] text-ink-950">
            {routeMeta.title}
          </strong>
        </div>

        <label
          className="flex min-h-12 items-center gap-3 rounded-full border border-stroke-1 bg-white px-4 text-sm text-slate-500 shadow-soft-card"
          aria-label="Global search"
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600"
            aria-hidden="true"
          >
            Go
          </span>
          <input
            type="search"
            placeholder={routeMeta.searchPlaceholder}
            className="w-full bg-transparent text-sm text-ink-950 outline-none placeholder:text-slate-400"
          />
        </label>

        <nav className="flex flex-wrap items-center gap-3 lg:justify-end">
          {isAuthenticated ? (
            <>
              <span
                className="grid h-10 w-10 place-items-center rounded-2xl border border-stroke-1 bg-white text-sm text-slate-500 shadow-soft-card"
                aria-hidden="true"
              >
                1
              </span>
              <span className="inline-flex items-center gap-3 rounded-[22px] border border-stroke-1 bg-white px-3 py-2 shadow-soft-card">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#3525cd_100%)] text-sm font-semibold text-white" aria-hidden="true">
                  {(user?.name || 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="grid leading-tight">
                  <strong className="text-sm font-semibold text-ink-950">
                    {user?.name || 'User'}
                  </strong>
                  <small className="text-xs font-medium text-slate-500">
                    {location.pathname.includes('/board') ? 'Scrum lead' : 'Workspace member'}
                  </small>
                </span>
              </span>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-stroke-1 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                onClick={logout}
              >
                Log out
              </button>
            </>
          ) : (
            <span className="text-sm font-medium text-slate-500">
              Sign in to manage your workspace.
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
