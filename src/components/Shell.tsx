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
    <footer className="studio-footer">
      <div className="studio-footer-main">
        <div className="studio-footer-brand"><Mark /><div><strong>ANEVUM</strong><span>Independent software studio</span><small>Built and operated by Devon Akins.</small></div></div>
        <div className="studio-footer-links">
          <section><span>EXPLORE</span><Link to="/products">Products</Link><Link to="/research">Field Notes</Link><Link to="/about">About</Link><Link to="/resume">Résumé</Link></section>
          <section><span>RHEN</span><Link to="/products/rhen">Overview</Link><Link to="/live">Public evidence</Link><Link to="/releases">Releases</Link><Link to="/architecture">Architecture</Link></section>
          <section><span>CONTACT</span><a href="mailto:devon@anevum.com">devon@anevum.com</a><Link to="/command/overview">Command</Link></section>
        </div>
      </div>
      <div className="studio-footer-bottom"><span>© {new Date().getFullYear()} ANEVUM</span><span>ONE FOUNDER · SOFTWARE / FINANCE / AUTOMATION</span></div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="public-frame compact-public-frame company-shell studio-shell">
      <header className="studio-header">
        <Link className="studio-brand" to="/" aria-label="ANEVUM home"><Mark /><span>ANEVUM</span></Link>
        <nav className="studio-nav" aria-label="Primary navigation">
          {nav.map(({ path: href, label }) => <Link key={href} to={href} className={isActive(location.pathname, href) ? "active" : ""}>{label}</Link>)}
        </nav>
        <div className="studio-header-actions">
          <Link className="studio-command-link" to="/command/overview"><i /> Command</Link>
          <button className="studio-menu-button" type="button" aria-label="Toggle navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}><span /><span /></button>
        </div>
        {mobileOpen ? <nav className="studio-mobile-nav" aria-label="Mobile navigation">{nav.map(({ path: href, label }) => <Link key={href} to={href} className={isActive(location.pathname, href) ? "active" : ""}>{label}</Link>)}<Link to="/command/overview">Command</Link></nav> : null}
      </header>
      <main className="studio-stage">{children}<PublicFooter /></main>
    </div>
  );
}
