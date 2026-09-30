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

function PublicFooter() {
  return (
    <footer className="company-footer">
      <div className="company-footer-inner">
        <div className="company-footer-brand">
          <Mark />
          <div>
            <strong>ANEVUM</strong>
            <span>SOFTWARE SYSTEMS &amp; RESEARCH</span>
            <small>Public system state, research records, architecture, and measured evidence. Protected operational controls remain outside this surface.</small>
          </div>
        </div>

        <div className="company-footer-links">
          <section>
            <span>SYSTEMS</span>
            <Link to="/products/iren">IREN</Link>
            <Link to="/products/rhen">RHEN</Link>
            <Link to="/products/nostra">NOSTRA</Link>
            <Link to="/products/graen">GRAEN</Link>
            <Link to="/products/velum">VELUM</Link>
          </section>
          <section>
            <span>EVIDENCE</span>
            <Link to="/performance">Performance</Link>
            <Link to="/research">Field Notes</Link>
            <Link to="/case-studies">Case Studies</Link>
            <Link to="/live">Live Systems</Link>
            <Link to="/releases">Releases</Link>
          </section>
          <section>
            <span>COMPANY</span>
            <Link to="/architecture">Architecture</Link>
            <Link to="/founder">Founder</Link>
            <Link to="/resume">Résumé</Link>
            <a href="mailto:devon@anevum.com">devon@anevum.com</a>
          </section>
        </div>
      </div>

      <div className="company-footer-bottom">
        <span>© {new Date().getFullYear()} ANEVUM</span>
        <span>PUBLIC SURFACE / SANITIZED STATE / EVIDENCE BEFORE CLAIMS</span>
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
            <Link to="/live">Live systems</Link>
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
