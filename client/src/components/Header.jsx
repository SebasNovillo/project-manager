import { Link, NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        Project Manager
      </Link>

      <nav className="nav-links">
        {isAuthenticated ? (
          <>
            <NavLink to="/">Dashboard</NavLink>
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
