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
        <Link className={"public-brand " + (!home ? "public-brand-home" : "")} to="/" aria-label="ANEVUM home">
          <Mark />
          <span>{home ? "ANEVUM" : "← HOME"}</span>
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

        <Link
          className="command-hatch"
          to="/command"
          rel="nofollow"
          aria-label="Open Command login"
          title="Command login"
        >
          <span className="command-hatch-dot" />
          <span className="command-hatch-label">COMMAND</span>
        </Link>
      </header>

      <main className="public-stage compact-public-stage">{children}</main>
    </div>
  );
}
