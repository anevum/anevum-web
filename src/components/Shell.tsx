import { useEffect, useState, type ReactNode } from "react";
import Mark from "./Mark";

const sections = [
  ["intro", "Start"],
  ["now", "Now"],
  ["system", "How"],
  ["evidence", "Evidence"],
  ["mind", "Mind"],
  ["other", "Other"]
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  const [active, setActive] = useState("intro");

  useEffect(() => {
    const root = document.querySelector(".deck-scroll");
    const nodes = sections
      .map(([id]) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!root || !nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { root, threshold: [0.35, 0.55, 0.75] }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const current = Math.max(0, sections.findIndex(([id]) => id === active)) + 1;

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="deck-frame">
      <header className="deck-header">
        <button className="deck-brand" type="button" onClick={() => goTo("intro")} aria-label="ANEVUM home">
          <Mark />
          <span>ANEVUM</span>
        </button>
        <div className="deck-progress">
          <span>{String(current).padStart(2, "0")}</span>
          <i />
          <span>{String(sections.length).padStart(2, "0")}</span>
        </div>
      </header>

      <nav className="deck-rail" aria-label="Page sections">
        {sections.map(([id, label], index) => (
          <button
            key={id}
            type="button"
            className={active === id ? "active" : ""}
            onClick={() => goTo(id)}
            aria-label={"Go to " + label}
            aria-current={active === id ? "page" : undefined}
          >
            <i />
            <span>{label}</span>
            <b>{String(index + 1).padStart(2, "0")}</b>
          </button>
        ))}
      </nav>

      <main className="deck-scroll">{children}</main>

      <div className="deck-hint" aria-hidden="true">
        <span>SCROLL</span>
        <i />
      </div>
    </div>
  );
}
