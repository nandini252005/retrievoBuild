import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar__content">
        <Link className="navbar__brand" to="/">
          Retrievo
        </Link>

        <nav aria-label="Main navigation" className="navbar__links">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/"
                className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
              >
                Home
              </NavLink>

              <NavLink
                to="/my-reports"
                className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
              >
                My Reports
              </NavLink>

              <button type="button" className="navbar__logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
              >
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
