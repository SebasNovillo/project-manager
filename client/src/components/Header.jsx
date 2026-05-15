import { Link, NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          PM
        </span>
        <span className="brand-copy">
          <strong>Project Manager</strong>
          <small>Scrum and Kanban workspace</small>
        </span>
      </Link>

      <nav className="nav-links">
        {isAuthenticated ? (
          <>
            <span className="user-pill">{user?.name}</span>
            <button type="button" className="ghost-button" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
