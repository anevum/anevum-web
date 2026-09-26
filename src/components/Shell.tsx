import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Mark from "./Mark";
import UniverseBackground from "./UniverseBackground";

const nav = [
  ["/live", "Live"],
  ["/system", "System"],
  ["/research", "Research"]
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const home = location.pathname === "/";

  return (
    <div className="public-frame compact-public-frame">
      <UniverseBackground />

      <header className="public-header compact-public-header">
        <Link className="public-brand" to="/" aria-label="ANEVUM home">
          <Mark />
          <span>ANEVUM</span>
        </Link>

        <nav className="public-nav public-nav-main" aria-label="Primary navigation">
          {nav.map(([href, label]) => (
            <Link
              key={href}
              to={href}
              className={location.pathname === href ? "active" : ""}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="header-spacer" aria-hidden="true" />
      </header>

      {!home ? (
        <Link className="return-home" to="/" aria-label="Return to ANEVUM home">
          <span>←</span>
          <strong>HOME</strong>
        </Link>
      ) : null}

      <Link
        className="command-dock"
        to="/command"
        rel="nofollow"
        aria-label="Open Command login"
        title="Command login"
      >
        <span className="command-dock-dot" />
        <strong>COMMAND</strong>
      </Link>

      <main className="public-stage compact-public-stage">{children}</main>
    </div>
  );
}
