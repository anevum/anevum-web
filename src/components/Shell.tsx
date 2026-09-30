import { type ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Mark from "./Mark";
import UniverseBackground from "./UniverseBackground";
import publicRoutes from "../data/public-routes.json";

const nav = publicRoutes.filter((route) => route.nav);

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="public-frame compact-public-frame company-shell">
      <UniverseBackground />
      <header className="public-header compact-public-header company-header">
        <Link className="public-brand company-brand" to="/" aria-label="ANEVUM home">
          <Mark /><span>ANEVUM</span>
        </Link>

        <nav className="public-nav public-nav-main company-nav" aria-label="Primary navigation">
          {nav.map(({ path: href, label }) => (
            <Link key={href} to={href} className={isActive(location.pathname, href) ? "active" : ""}>{label}</Link>
          ))}
        </nav>

        <div className="company-header-actions">
          <Link className="company-live-link" to="/live" aria-label="Open live systems">
            <i /><span>Live systems</span>
          </Link>
          <Link className="command-nav" to="/command" rel="nofollow" aria-label="Open Command login" title="Command login">
            <span className="command-nav-dot" /><span>Command</span>
          </Link>
          <button
            className="company-menu-button"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span /><span />
          </button>
        </div>

        <nav className={"company-mobile-nav " + (mobileOpen ? "is-open" : "")} aria-label="Mobile navigation">
          {nav.map(({ path: href, label }) => (
            <Link key={href} to={href} className={isActive(location.pathname, href) ? "active" : ""}>{label}</Link>
          ))}
          <Link to="/live">Live systems</Link>
          <Link to="/command" rel="nofollow">Command</Link>
        </nav>
      </header>
      <main className="public-stage compact-public-stage company-public-stage">{children}</main>
    </div>
  );
}
