import { type ReactNode } from "react";
import Mark from "./Mark";

const links = [
  ["system", "System"],
  ["demo", "Live demo"],
  ["architecture", "Architecture"],
  ["updates", "Updates"]
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="public-frame">
      <header className="public-header">
        <a className="public-brand" href="#top" aria-label="ANEVUM home">
          <Mark />
          <span>ANEVUM</span>
        </a>

        <nav className="public-nav" aria-label="Public navigation">
          {links.map(([id, label]) => (
            <a key={id} href={"#" + id}>{label}</a>
          ))}
        </nav>

        <a className="public-status-link" href="#system">
          <i />
          <span>LIVE SYSTEM</span>
        </a>
      </header>

      <main className="public-stage">{children}</main>
    </div>
  );
}
