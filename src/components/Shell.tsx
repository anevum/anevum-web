import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Mark from "./Mark";
import UniverseBackground from "./UniverseBackground";

const nav = [
  ["/", "Live"],
  ["/system", "System"],
  ["/research", "Research"]
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const home = location.pathname === "/";

  return (
    <div className={"public-frame " + (home ? "public-frame-home" : "public-frame-docs")}>
      <UniverseBackground />

      <header className="public-header">
        <a className="public-brand" href="/" aria-label="ANEVUM home">
          <Mark />
          <span>ANEVUM</span>
        </a>

        <nav className="public-nav public-nav-main" aria-label="Primary navigation">
          {nav.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className={location.pathname === href ? "active" : ""}
            >
              {label}
            </a>
          ))}
        </nav>

        <a className="public-status-link" href="/command" rel="nofollow">
          <i />
          <span>OPERATOR</span>
        </a>
      </header>

      <main className="public-stage">{children}</main>
    </div>
  );
}
