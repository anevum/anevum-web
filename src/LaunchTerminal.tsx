import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Command, LogIn, Menu, Terminal, UserRound, X } from "lucide-react";
import { displayIdentity, loadSession, type MemberSession } from "./memberClient";
import { loadMemberProgress, onMemberProgressChange, type MemberProgress } from "./memberState";
import { networkLevelDetails } from "./networkProgress";

type TerminalTarget = {
  command: string;
  label: string;
  description: string;
  href: string;
};

const targets: TerminalTarget[] = [
  { command: "reply", label: "REPLY", description: "Return to the launch homepage.", href: "/#top" },
  { command: "story", label: "THE STORY", description: "Open the spoiler-light story doorway.", href: "/the-story" },
  { command: "book", label: "THE BOOK", description: "Open the publication page for REPLY.", href: "/the-book" },
  { command: "store", label: "STORE", description: "Open the official REPLY availability surface.", href: "/store" },
  { command: "rhenlink", label: "RHENLINK", description: "Open or establish your persistent ANEVUM identity.", href: "/rhenlink" },
  { command: "about", label: "ABOUT ANEVUM", description: "See how REPLY, Wiki, Lattice and RHENLINK fit together.", href: "/about" },
  { command: "wiki", label: "WIKI", description: "Browse records cleared by the live ANEVUM Wiki release gate.", href: "https://wiki.anevum.com/" },
  { command: "lattice", label: "LATTICE", description: "Enter the relational map of released ANEVUM records.", href: "https://lattice.anevum.com/" },
];

function emptyProgress(): MemberProgress {
  return { version: 1, savedRecordIds: [], visitedRoutes: [], achievements: [], updatedAt: new Date(0).toISOString() };
}

function focusableElements(container: HTMLElement | null) {
  if (!container) return [] as HTMLElement[];
  return Array.from(container.querySelectorAll<HTMLElement>(
    'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
  )).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
}

export function LaunchTerminal() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  const [progress, setProgress] = useState<MemberProgress>(() => {
    const current = loadSession();
    return current ? loadMemberProgress(current) : emptyProgress();
  });
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("SYSTEM READY");
  const [bootStep, setBootStep] = useState(4);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const identity = displayIdentity(session);
  const level = networkLevelDetails(progress);

  const bootLines = useMemo(() => [
    "BOOT // PUBLIC LAUNCH NODE",
    `IDENTITY // ${session ? "RESOLVED" : "GUEST"}`,
    `ROUTE // ${window.location.pathname || "/"}`,
    message,
  ], [session, message]);

  useEffect(() => {
    const sync = () => {
      const next = loadSession();
      setSession(next);
      setProgress(next ? loadMemberProgress(next) : emptyProgress());
    };
    const remove = onMemberProgressChange(setProgress);
    window.addEventListener("anevum-member-session", sync);
    return () => {
      remove();
      window.removeEventListener("anevum-member-session", sync);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const typing = active?.tagName === "INPUT" || active?.tagName === "TEXTAREA" || active?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (event.key === "/" && !open && !typing) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === "Tab" && open) {
        const focusable = focusableElements(panelRef.current);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setBootStep(reducedMotion ? bootLines.length : 1);
    setActiveIndex(0);
    const frame = window.setTimeout(() => inputRef.current?.focus(), reducedMotion ? 0 : 100);
    const timers = reducedMotion
      ? []
      : bootLines.slice(1).map((_, index) => window.setTimeout(() => setBootStep(index + 2), 150 * (index + 1)));
    return () => {
      window.clearTimeout(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      document.body.style.overflow = previousOverflow;
    };
  }, [open, bootLines.length]);

  const filtered = useMemo(() => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return targets;
    return targets.filter((target) => target.command.includes(normalized) || target.label.toLowerCase().includes(normalized));
  }, [value]);
  const visibleSuggestions = useMemo(() => filtered.slice(0, 4), [filtered]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value]);

  function navigate(href: string) {
    setOpen(false);
    setValue("");
    setMessage("SYSTEM READY");
    if (href.startsWith("/#")) {
      const hash = href.slice(1);
      if (window.location.pathname !== "/") {
        window.location.assign(href);
        return;
      }
      window.history.replaceState({}, "", hash || "/");
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      document.querySelector(hash)?.scrollIntoView({ behavior, block: "start" });
      return;
    }
    window.location.assign(href);
  }

  function execute(raw: string) {
    const command = raw.trim().toLowerCase();
    if (!command) {
      const selected = targets[activeIndex];
      if (selected) navigate(selected.href);
      return;
    }
    if (command === "close" || command === "exit") {
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (command === "home") {
      navigate("/#top");
      return;
    }
    if (command === "buy" || command === "edition" || command === "availability") {
      navigate("/store");
      return;
    }
    if (command === "profile" || command === "identity" || command === "signin" || command === "login") {
      navigate("/rhenlink");
      return;
    }
    if (command === "company" || command === "anevum") {
      navigate("/about");
      return;
    }
    if (command === "records" || command === "canon") {
      navigate("https://wiki.anevum.com/");
      return;
    }
    if (command === "map" || command === "world") {
      navigate("https://lattice.anevum.com/");
      return;
    }
    const exact = targets.find((target) => target.command === command || target.label.toLowerCase() === command);
    if (exact) {
      navigate(exact.href);
      return;
    }
    const selected = visibleSuggestions[activeIndex];
    if (selected) {
      navigate(selected.href);
      return;
    }
    setMessage(`UNKNOWN COMMAND // ${command.toUpperCase()}`);
    setBootStep(bootLines.length);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const optionCount = value.trim() ? visibleSuggestions.length : targets.length;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => optionCount ? (current + 1) % optionCount : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => optionCount ? (current - 1 + optionCount) % optionCount : 0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      execute(value);
    }
  }

  const typedValue = Boolean(value.trim());
  const activeDescendant = typedValue
    ? (visibleSuggestions[activeIndex] ? `anevum-terminal-suggestion-${activeIndex}` : undefined)
    : `anevum-terminal-route-${activeIndex}`;

  return (
    <>
      <button ref={triggerRef} type="button" className="launch-terminal-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label="Open ANEVUM terminal menu">
        <Menu size={17} strokeWidth={1.4} />
        <span>ANE/VUM //</span>
        <kbd>⌘K</kbd>
      </button>

      <a className={`launch-identity-pill ${session ? "resolved" : "unresolved"}`} href="/rhenlink">
        {session ? <UserRound size={16} strokeWidth={1.4} /> : <LogIn size={16} strokeWidth={1.4} />}
        <span>
          <small>{session ? `RHENLINK // ${level.rankMark}` : "RHENLINK"}</small>
          <strong>{session ? `@${identity.handle || "member"}` : "SIGN IN"}</strong>
        </span>
      </a>

      {open ? (
        <div className="launch-terminal-overlay is-open">
          <button type="button" className="launch-terminal-backdrop" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label="Close terminal menu" />
          <aside ref={panelRef} className="launch-terminal-panel" role="dialog" aria-modal="true" aria-labelledby="anevum-terminal-title">
            <header>
              <div className="terminal-brand"><Terminal size={18} strokeWidth={1.4} /><span><strong id="anevum-terminal-title">ANEVUM://</strong><small>NAVIGATION TERMINAL</small></span></div>
              <button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label="Close menu"><X size={18} strokeWidth={1.4} /></button>
            </header>

            <div className="terminal-boot" aria-live="polite">
              {bootLines.map((line, index) => (
                <span key={`${index}-${line}`} className={index < bootStep ? "resolved" : "pending"}><i aria-hidden="true">{index === bootStep - 1 ? "›" : "·"}</i>{line}</span>
              ))}
            </div>

            {session ? (
              <a className="terminal-profile-card" href="/rhenlink">
                <div className="terminal-profile-mark"><i /><span>{level.rankMark}</span></div>
                <div><small>IDENTITY RESOLVED</small><strong>{identity.displayName || identity.handle || "Member"}</strong><span>@{identity.handle || "member"}</span></div>
                <div className="terminal-profile-level"><small>LEVEL {String(level.level).padStart(2, "0")}</small><strong>{level.xp.toLocaleString()} XP</strong><i><b style={{ width: `${level.percent}%` }} /></i></div>
              </a>
            ) : (
              <a className="terminal-auth-card" href="/rhenlink"><LogIn size={18} /><span><small>IDENTITY UNRESOLVED</small><strong>CREATE OR SIGN IN TO RHENLINK</strong></span><ArrowRight size={17} /></a>
            )}

            <nav id="anevum-terminal-routes" className="terminal-route-list" aria-label="Launch destinations" role="listbox" aria-hidden={typedValue}>
              {targets.map((target, index) => (
                <button
                  id={`anevum-terminal-route-${index}`}
                  type="button"
                  role="option"
                  tabIndex={typedValue ? -1 : 0}
                  aria-selected={!typedValue && activeIndex === index}
                  className={!typedValue && activeIndex === index ? "selected" : ""}
                  key={target.command}
                  onMouseEnter={() => { if (!typedValue) setActiveIndex(index); }}
                  onClick={() => navigate(target.href)}
                >
                  <span className="terminal-route-index">{String(index + 1).padStart(2, "0")}</span>
                  <span><strong>{target.label}</strong><small>{target.description}</small></span>
                  <ArrowRight size={16} strokeWidth={1.35} />
                </button>
              ))}
            </nav>

            <form className="terminal-command-line" onSubmit={(event) => { event.preventDefault(); execute(value); }}>
              <Command size={15} strokeWidth={1.4} />
              <span>ANEVUM://</span>
              <input
                ref={inputRef}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="type a command"
                autoComplete="off"
                spellCheck={false}
                role="combobox"
                aria-label="ANEVUM command"
                aria-autocomplete="list"
                aria-expanded={typedValue}
                aria-controls={typedValue ? "anevum-terminal-suggestions" : "anevum-terminal-routes"}
                aria-activedescendant={activeDescendant}
              />
              <button type="submit">RUN</button>
            </form>

            {typedValue ? (
              <div id="anevum-terminal-suggestions" className="terminal-suggestions" role="listbox" aria-label="Matching destinations">
                {visibleSuggestions.map((target, index) => (
                  <button
                    id={`anevum-terminal-suggestion-${index}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    className={activeIndex === index ? "selected" : ""}
                    key={target.command}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigate(target.href)}
                  >
                    <code>{target.command}</code><span>{target.label}</span>
                  </button>
                ))}
                {!visibleSuggestions.length ? <span>NO MATCHING ROUTE</span> : null}
              </div>
            ) : null}

            <footer><span>↑↓ // SELECT</span><span>ENTER // OPEN</span><span>ESC // CLOSE</span><span>⌘K // TOGGLE</span></footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
