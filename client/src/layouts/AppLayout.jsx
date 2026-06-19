import { Link, Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';

const SELECTED_PROJECT_STORAGE_KEY = 'project-manager-selected-project';

const primaryNavItems = [
  {
    key: 'overview',
    label: 'Overview',
    getTo: () => '/',
    isActive: (pathname) => pathname === '/'
  },
  {
    key: 'project',
    label: 'Project',
    getTo: (pathname, selectedProjectId) => {
      const match = pathname.match(/^\/projects\/[^/]+/);
      return match ? match[0] : selectedProjectId ? `/projects/${selectedProjectId}` : '/';
    },
    isActive: (pathname) => pathname.startsWith('/projects/')
  },
  {
    key: 'board',
    label: 'Sprint Board',
    getTo: (pathname, selectedProjectId) => {
      const sprintMatch = pathname.match(/^\/projects\/[^/]+\/sprints\/[^/]+\/board/);

      if (sprintMatch) {
        return sprintMatch[0];
      }

      const projectMatch = pathname.match(/^\/projects\/[^/]+/);
      if (projectMatch) {
        return `${projectMatch[0]}/board`;
      }

      return selectedProjectId ? `/projects/${selectedProjectId}/board` : '/';
    },
    isActive: (pathname) => pathname.includes('/board')
  }
];

const secondaryNavItems = [
  'Backlog',
  'Calendar',
  'Team',
  'Settings'
];

function AppLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const selectedProjectId =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY) || ''
      : '';

  const getNavLinkClassName = (isActive, isDisabled = false) => {
    if (isDisabled) {
      return 'inline-flex min-h-11 items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-slate-400 transition lg:justify-between';
    }

    return [
      'inline-flex min-h-11 items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition',
      isActive
        ? 'border-brand-200 bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.08)]'
        : 'border-transparent text-slate-600 hover:border-brand-100 hover:bg-white hover:text-ink-950'
    ].join(' ');
  };

  return (
    <div className="min-h-screen bg-surface-50 font-sans text-ink-950">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.16),transparent_34%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80 bg-[linear-gradient(180deg,rgba(239,244,255,0.95),rgba(248,249,255,0))]" />

      <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="border-b border-stroke-1 bg-white/78 px-4 py-4 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:gap-6 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <Link to="/" className="inline-flex items-center gap-3 rounded-[24px] px-1 py-1">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#3525cd_100%)] text-sm font-extrabold tracking-[0.22em] text-white shadow-soft-card" aria-hidden="true">
            PF
            </span>
            <span className="grid gap-0.5">
              <strong className="text-base font-semibold tracking-[-0.02em]">ProjectFlow</strong>
              <span className="text-xs font-medium text-slate-500">Premium Agile Workspace</span>
            </span>
          </Link>

          <nav
            className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-2 lg:grid lg:gap-2 lg:overflow-visible"
            aria-label="Primary"
          >
            {primaryNavItems.map((item) => {
              const isActive = item.isActive(currentPath);

              return (
                <Link
                  key={item.key}
                  to={item.getTo(currentPath, selectedProjectId)}
                  className={getNavLinkClassName(isActive)}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-900/5 text-[11px] font-bold uppercase tracking-[0.18em]">
                    {item.label.slice(0, 2)}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <section className="mt-5 hidden gap-3 lg:grid">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Planned Views
            </p>
            <div className="grid gap-2">
              {secondaryNavItems.map((item) => (
                <span key={item} className={getNavLinkClassName(false, true)}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-900/5 text-[11px] font-bold uppercase tracking-[0.18em]">
                    {item.slice(0, 2)}
                  </span>
                  <span>{item}</span>
                  <small className="ml-auto rounded-full bg-slate-900/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Soon
                  </small>
                </span>
              ))}
            </div>
          </section>

          <div className="mt-5 hidden rounded-[28px] border border-stroke-1 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(239,244,255,0.92))] p-4 shadow-soft-card lg:grid lg:gap-2 lg:mt-auto">
            <p className="text-sm font-semibold text-ink-950">UI-first redesign in progress</p>
            <span className="text-sm leading-6 text-slate-500">
              We are migrating the experience to a cleaner Tailwind system inspired by Stitch, but with a more editorial rhythm.
            </span>
          </div>
        </aside>

        <section className="min-w-0">
          <Header />
          <main className="px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
            <Outlet />
          </main>
        </section>
      </div>
    </div>
  );
}

export default AppLayout;
