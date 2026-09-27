import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Mark from "./Mark";
import UniverseBackground from "./UniverseBackground";

const nav = [
  ["/live", "Live"],
  ["/system", "System"],
  ["/research", "Research"],
  ["/record", "Record"],
  ["/releases", "Releases"]
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="public-frame compact-public-frame">
      <UniverseBackground />
      <header className="public-header compact-public-header">
        <Link className="public-brand" to="/" aria-label="ANEVUM home">
          <Mark /><span>ANEVUM</span>
        </Link>
        <nav className="public-nav public-nav-main" aria-label="Primary navigation">
          {nav.map(([href, label]) => (
            <Link key={href} to={href} className={location.pathname === href || (href === "/releases" && location.pathname.startsWith("/releases/")) ? "active" : ""}>{label}</Link>
          ))}
        </nav>
        <Link className="command-nav" to="/command" rel="nofollow" aria-label="Open Command login" title="Command login">
          <span className="command-nav-dot" /><span>Command</span>
        </Link>
      </header>
      <main className="public-stage compact-public-stage">{children}</main>
    </div>
  );
}
