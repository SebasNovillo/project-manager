import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">Project Manager</p>
          <h1>Build projects with clarity.</h1>
          <p>
            A calm starting point for scrum planning, kanban execution, and team
            collaboration.
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;

