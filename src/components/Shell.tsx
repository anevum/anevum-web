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
    const root = document.querySelector<HTMLElement>(".deck-scroll");
    if (!root) return;

    let frame = 0;

    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nodes = sections
          .map(([id]) => document.getElementById(id))
          .filter((node): node is HTMLElement => Boolean(node));

        if (!nodes.length) return;

        const focus = root.scrollTop + root.clientHeight * 0.48;
        let best = nodes[0];
        let distance = Number.POSITIVE_INFINITY;

        for (const node of nodes) {
          const center = node.offsetTop + node.offsetHeight / 2;
          const nextDistance = Math.abs(center - focus);
          if (nextDistance < distance) {
            best = node;
            distance = nextDistance;
          }
        }

        setActive(best.id);
      });
    }

    root.addEventListener("scroll", update, { passive: true });
    const mutations = new MutationObserver(update);
    mutations.observe(root, { childList: true, subtree: true });
    update();

    return () => {
      root.removeEventListener("scroll", update);
      mutations.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const activeIndex = Math.max(0, sections.findIndex(([id]) => id === active));
  const current = activeIndex + 1;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const forward = ["ArrowDown", "ArrowRight", "PageDown", " "].includes(event.key);
      const backward = ["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key);
      if (!forward && !backward) return;

      const nextIndex = forward
        ? Math.min(sections.length - 1, activeIndex + 1)
        : Math.max(0, activeIndex - 1);

      if (nextIndex === activeIndex) return;
      event.preventDefault();
      document.getElementById(sections[nextIndex][0])?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

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
