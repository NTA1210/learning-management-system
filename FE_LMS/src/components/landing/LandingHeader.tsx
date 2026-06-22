import { useEffect, useState, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpenCheck, LogIn, Menu, X } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

const navItems = [
  { label: "Overview", hash: "#home" },
  { label: "Why FStudyMate", hash: "#why" },
  { label: "Learning Paths", hash: "#courses" },
  { label: "Features", hash: "#features" },
  { label: "Preview", hash: "#preview" },
  { label: "Blogs", href: "/blogs" },
];

const LandingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { darkMode: isDarkMode } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAnchorClick = (
    event: MouseEvent<HTMLAnchorElement>,
    hash: string
  ) => {
    setMobileMenuOpen(false);

    if (location.pathname !== "/") return;

    event.preventDefault();
    window.history.replaceState(null, "", hash);
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={[
        "landing-header",
        isDarkMode ? "landing-header-dark" : "",
        isScrolled ? "is-scrolled" : "",
      ].join(" ")}
    >
      <div className="landing-header-shell">
        <Link to="/" className="landing-brand" aria-label="FStudyMate home">
          <span className="landing-brand-mark">
            <BookOpenCheck size={20} strokeWidth={2.4} />
          </span>
          <span>
            <strong>F</strong>StudyMate
          </span>
        </Link>

        <nav className="landing-nav" aria-label="Landing navigation">
          {navItems.map((item) =>
            item.href ? (
              <Link key={item.label} to={item.href} className="landing-nav-link">
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                to={`/${item.hash}`}
                className="landing-nav-link"
                onClick={(event) => handleAnchorClick(event, item.hash)}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="landing-header-actions">
          <Link to="/login" className="landing-login-link">
            <LogIn size={17} />
            Sign in
          </Link>
          <Link to="/register" className="landing-header-cta">
            Sign up
          </Link>
        </div>

        <button
          type="button"
          className="landing-menu-button"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="landing-mobile-menu">
          {navItems.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                to={item.href}
                className="landing-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                to={`/${item.hash}`}
                className="landing-mobile-link"
                onClick={(event) => handleAnchorClick(event, item.hash)}
              >
                {item.label}
              </Link>
            )
          )}
          <div className="landing-mobile-actions">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              Sign in
            </Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
