import { type ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Mark from "./Mark";
import publicRoutes from "../data/public-routes.json";

const nav = publicRoutes.filter((route) => route.nav);

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function PublicFooter() {
  return (
    <footer className="company-footer">
      <div className="company-footer-inner">
        <div className="company-footer-brand">
          <Mark />
          <div>
            <strong>ANEVUM</strong>
            <span>COMMAND + RHEN LIVE EVIDENCE</span>
            <small>Use the product. Inspect the runtime. Follow the evidence.</small>
          </div>
        </div>

        <div className="company-footer-links">
          <section>
            <span>PRODUCT</span>
            <Link to="/command/overview">Command</Link>
            <Link to="/live">RHEN Live</Link>
            <Link to="/research">Field Notes</Link>
          </section>
          <section>
            <span>ANEVUM</span>
            <Link to="/architecture">Architecture</Link>
            <Link to="/founder">About</Link>
            <Link to="/resume">Résumé</Link>
            <a href="mailto:devon@anevum.com">devon@anevum.com</a>
          </section>
        </div>
      </div>

      <div className="company-footer-bottom">
        <span>© {new Date().getFullYear()} ANEVUM</span>
        <span>RHEN V3 / COMMAND / PROTECTED EXECUTION AUTHORITY</span>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="public-frame compact-public-frame company-shell">
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
          <Link className="company-live-link" to="/command/overview" aria-label="Open ANEVUM Command">
            <span>Command</span>
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

        {mobileOpen ? (
          <nav className="company-mobile-nav is-open" aria-label="Mobile navigation">
            {nav.map(({ path: href, label }) => (
              <Link key={href} to={href} className={isActive(location.pathname, href) ? "active" : ""}>{label}</Link>
            ))}
            <Link to="/command/overview">Command</Link>
          </nav>
        ) : null}
      </header>
      <main className="public-stage compact-public-stage company-public-stage">
        {children}
        <PublicFooter />
      </main>
    </div>
  );
}
