import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNavigationItems, isActiveRoute } from "../utils/navigationConfig";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  // Show navbar on public pages even if not authenticated
  const publicPages = ["/", "/about", "/contact", "/services", "/auth"];
  const isPublicPage = publicPages.includes(location.pathname);
  const isPortfolioPage = location.pathname.startsWith("/portfolio/");

  // Hide navbar on portfolio pages
  if (isPortfolioPage) {
    return null;
  }

  if (!isAuthenticated && !isPublicPage) {
    return null;
  }

  // Get role-based navigation items
  const navigationItems = isAuthenticated && user?.role 
    ? getNavigationItems(user.role)
    : [];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-logo">
          <img src="/LOGO.png" alt="Olympiad" className="navbar-logo-image" />
        </Link>

        <div className="navbar-menu">
          {!isAuthenticated && (
            <>
              <Link to="/" className="navbar-link">
                Home
              </Link>
              <Link to="/about" className="navbar-link">
                About
              </Link>
              <Link to="/services" className="navbar-link">
                Services
              </Link>
              <Link to="/contact" className="navbar-link">
                Contact
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <>
              {/* Render role-based navigation items */}
              {navigationItems.map((item, index) => (
                <Link
                  key={`${item.path}-${item.label}-${index}`}
                  to={item.path}
                  className={`navbar-link ${
                    isActiveRoute(item.path, location.pathname) ? "active" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="navbar-user">
                <span className="navbar-username">{user?.email}</span>
                <span className="navbar-role">({user?.role})</span>
              </div>

              <button
                onClick={handleLogout}
                className="button-secondary navbar-logout"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="navbar-login">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
