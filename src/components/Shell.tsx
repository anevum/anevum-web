import { type ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Mark from "./Mark";
import publicRoutes from "../data/public-routes.json";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";

const nav = publicRoutes.filter((route) => route.nav);

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

function MemberLink() {
  const { data: session } = memberAuthClient.useSession();
  return <Link className="workshop-account-link" to={session?.user ? "/command" : "/sign-in"}>{session?.user ? "My account" : "Sign in"}</Link>;
}

function AvailableMemberLink() {
  const status = useMemberAvailability();
  return status === "available" ? <MemberLink /> : <Link className="workshop-account-link" to="/command">Command</Link>;
}

function PublicFooter() {
  return (
    <footer className="workshop-footer">
      <div className="workshop-footer-inner">
        <div className="workshop-footer-intro">
          <Link to="/" className="workshop-footer-brand">ANEVUM</Link>
          <span>Independent software, experiments, and notes.</span>
          <a href="mailto:devon@anevum.com">Contact</a>
        </div>
        <div className="workshop-footer-bottom">
          <span>© {new Date().getFullYear()} ANEVUM</span>
          <nav aria-label="Footer navigation">
            <Link to="/products">Projects</Link>
            <Link to="/feed">Updates</Link>
            <Link to="/learn">Learn</Link>
            <Link to="/field-notes">Field Notes</Link>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="public-frame studio-shell workshop-shell workshop-public-light">
      <header className="studio-header workshop-header">
        <div className="workshop-header-inner">
          <Link className="studio-brand" to="/" aria-label="ANEVUM home">
            <Mark />
            <span>ANEVUM</span>
          </Link>
          <nav className="studio-nav" aria-label="Primary navigation">
            {nav.map(({ path, label }) => (
              <Link key={path} to={path} className={isActive(location.pathname, path) ? "active" : ""} aria-current={isActive(location.pathname, path) ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <AvailableMemberLink />
          <button
            className="studio-menu-button"
            type="button"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="workshop-mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
        </div>
        <nav id="workshop-mobile-navigation" className="studio-mobile-nav" aria-label="Mobile navigation" data-open={mobileOpen ? "true" : "false"}>
          {nav.map(({ path, label }) => (
            <Link key={path} to={path} className={isActive(location.pathname, path) ? "active" : ""} aria-current={isActive(location.pathname, path) ? "page" : undefined}>
              {label}
            </Link>
          ))}
          <AvailableMemberLink />
        </nav>
      </header>
      <main className="studio-stage">
        {children}
        <PublicFooter />
      </main>
    </div>
  );
}

