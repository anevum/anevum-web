import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Mark from "./Mark";
import UniverseBackground from "./UniverseBackground";

const nav = [
  ["/", "Home"],
  ["/live", "Live"],
  ["/system", "System"],
  ["/research", "Research"]
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();

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

        <Link className="public-status-link" to="/command" rel="nofollow">
          <i />
          <span>OPERATOR</span>
        </Link>
      </header>

      <main className="public-stage compact-public-stage">{children}</main>
    </div>
  );
}
