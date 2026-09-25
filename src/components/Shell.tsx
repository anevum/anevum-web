import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Mark from "./Mark";

const views = [
  ["home", "Home"],
  ["current", "Current"],
  ["proof", "Proof"],
  ["ideas", "Ideas"],
  ["other", "Other"]
] as const;

function normalizedView(hash: string) {
  const candidate = hash.replace("#", "").toLowerCase();
  return views.some(([id]) => id === candidate) ? candidate : "home";
}

export function PublicShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const active = normalizedView(location.hash);
  const activeIndex = views.findIndex(([id]) => id === active);

  function goTo(id: string) {
    navigate(id === "home" ? "/" : "/#" + id);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, button")) return;

      const forward = ["ArrowDown", "ArrowRight", "PageDown", " "].includes(event.key);
      const backward = ["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key);
      if (!forward && !backward) return;

      const next = forward
        ? Math.min(views.length - 1, activeIndex + 1)
        : Math.max(0, activeIndex - 1);

      if (next === activeIndex) return;
      event.preventDefault();
      goTo(views[next][0]);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  return (
    <div className="portal-frame">
      <header className="portal-header">
        <button className="portal-brand" type="button" onClick={() => goTo("home")} aria-label="ANEVUM home">
          <Mark />
          <span>ANEVUM</span>
        </button>

        <div className="portal-state">
          <i />
          <span>{views[activeIndex]?.[1] || "Home"}</span>
        </div>
      </header>

      <nav className="portal-nav" aria-label="ANEVUM portal">
        {views.map(([id, label], index) => (
          <button
            key={id}
            type="button"
            className={active === id ? "active" : ""}
            onClick={() => goTo(id)}
            aria-current={active === id ? "page" : undefined}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </nav>

      <main className="portal-stage">{children}</main>

      <div className="portal-counter" aria-hidden="true">
        <span>{String(activeIndex + 1).padStart(2, "0")}</span>
        <i />
        <span>{String(views.length).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
