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
    <footer className="studio-footer truth-footer">
      <div className="studio-footer-main">
        <div className="studio-footer-brand"><Mark /><div><strong>ANEVUM</strong><span>Independent software. Built in public.</span><small>Real products, real data, versioned evidence.</small></div></div>
        <div className="studio-footer-links">
          <section><span>EXPLORE</span><Link to="/products">Products</Link><Link to="/feed">Feed</Link><Link to="/field-notes">Field Notes</Link><Link to="/about">About</Link></section>
          <section><span>RHEN</span><Link to="/products/rhen">Product</Link><Link to="/products/rhen/evidence">Evidence</Link><Link to="/products/rhen/releases">Releases</Link><Link to="/products/rhen/architecture">Architecture</Link></section>
          <section><span>PRIVATE</span><Link to="/command">Command</Link><a href="mailto:devon@anevum.com">Contact</a></section>
        </div>
      </div>
      <div className="studio-footer-bottom"><span>© {new Date().getFullYear()} ANEVUM</span><span>REAL DATA · PUBLIC EVIDENCE · INDEPENDENT SOFTWARE</span></div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="public-frame compact-public-frame company-shell studio-shell truth-shell">
      <header className="studio-header">
        <Link className="studio-brand" to="/" aria-label="ANEVUM home"><Mark /><span>ANEVUM</span></Link>
        <nav className="studio-nav" aria-label="Primary navigation">{nav.map(({ path: href, label }) => <Link key={href} to={href} className={isActive(location.pathname, href) ? "active" : ""}>{label}</Link>)}</nav>
        <div className="studio-header-actions"><Link className="studio-command-link" to="/command"><i /> Command</Link><button className="studio-menu-button" type="button" aria-label="Toggle navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}><span /><span /></button></div>
        {mobileOpen ? <nav className="studio-mobile-nav" aria-label="Mobile navigation">{nav.map(({ path: href, label }) => <Link key={href} to={href} className={isActive(location.pathname, href) ? "active" : ""}>{label}</Link>)}<Link to="/command">Command</Link></nav> : null}
      </header>
      <main className="studio-stage">{children}<PublicFooter /></main>
    </div>
  );
}
