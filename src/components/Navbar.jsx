import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { List, X, ArrowUpRight } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { getNavigationItems, isActiveRoute } from "../utils/navigationConfig";
import { getImageUrl } from "../utils/helpers";
import BalanceDisplay from "./BalanceDisplay/BalanceDisplay";
import "./Navbar.css";

const Navbar = () => {
  const logoPath = `${import.meta.env.BASE_URL}logo_logo.png`;
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [activePill, setActivePill] = useState(null);
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const measure = () => {
      const link = menu.querySelector('.navbar-link.active');
      setActivePill(link ? { left:link.offsetLeft, top:link.offsetTop, width:link.offsetWidth, height:link.offsetHeight } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(menu);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [location.pathname, isAuthenticated, user?.role]);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navigationItems = useMemo(() => {
    if (!isAuthenticated || !user?.role) return [];
    return getNavigationItems(user.role);
  }, [isAuthenticated, user?.role]);

  const isOlympiadInProgressRoute = /^\/olympiad\/[^/]+(?:\/essay)?$/.test(location.pathname);

  if (location.pathname === "/" || location.pathname === "/auth" || isOlympiadInProgressRoute) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderAuthLinks = () => (
    <>
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

      <div className="navbar-account-group">
        <BalanceDisplay />

        <Link to="/profile" className="navbar-user" aria-label="Profile">
          {user?.userLogo ? (
            <img
              src={getImageUrl(user.userLogo)}
              alt="Profile"
              className="navbar-user-avatar"
            />
          ) : (
            <div className="navbar-user-avatar-placeholder">
              {user?.name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </div>
          )}
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="button-secondary navbar-logout"
      >
        Sign out <ArrowUpRight size={16} aria-hidden="true" />
      </button>
    </>
  );

  return (
    <nav className="navbar" aria-label="Platform navigation">
      <div className="navbar-container">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-logo">
          <img src={logoPath} alt="Global Olympiads logo" className="navbar-logo-image" />
          <span className="navbar-logo-text">global<span>olympiad</span></span>
        </Link>

        <div className="navbar-tour-mobile-balance"><BalanceDisplay /></div>
        <div className="navbar-menu navbar-menu-desktop" ref={menuRef}>
          {activePill && <span className="navbar-active-pill" aria-hidden="true" style={activePill} />}
          {isAuthenticated ? (
            renderAuthLinks()
          ) : (
            <Link to="/auth" className="navbar-login">
              Login
            </Link>
          )}
        </div>

        <button
          type="button"
          className={`navbar-mobile-toggle ${mobileMenuOpen ? "open" : ""}`}
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="platform-mobile-menu"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={23} aria-hidden="true" /> : <List size={23} aria-hidden="true" />}
        </button>
      </div>

      <div
        className={`navbar-mobile-backdrop ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      <div id="platform-mobile-menu" className={`navbar-mobile-menu ${mobileMenuOpen ? "open" : ""}`} inert={mobileMenuOpen ? undefined : ""} aria-hidden={!mobileMenuOpen}>
        {isAuthenticated ? (
          renderAuthLinks()
        ) : (
          <Link to="/auth" className="navbar-login">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
