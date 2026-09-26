import { type ReactNode } from "react";
import Mark from "./Mark";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="public-frame">
      <header className="public-header">
        <a className="public-brand" href="#top" aria-label="ANEVUM home">
          <Mark />
          <span>ANEVUM</span>
        </a>

        <div className="public-mode">PUBLIC SYSTEM</div>

        <a className="public-status-link" href="/command">
          <i />
          <span>OPERATOR</span>
        </a>
      </header>

      <main className="public-stage">{children}</main>
    </div>
  );
}
