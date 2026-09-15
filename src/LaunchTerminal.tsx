import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Command, LogIn, Menu, Terminal, UserRound, X } from "lucide-react";
import { displayIdentity, loadSession, type MemberSession } from "./memberClient";
import { loadMemberProgress, memberLevelDetails, onMemberProgressChange, type MemberProgress } from "./memberState";

type TerminalTarget = {
  command: string;
  label: string;
  description: string;
  href: string;
};

const targets: TerminalTarget[] = [
  { command: "reply", label: "REPLY", description: "Return to the book launch hero.", href: "/#top" },
  { command: "story", label: "THE STORY", description: "Read the public story introduction.", href: "/#world" },
  { command: "book", label: "THE BOOK", description: "See the physical-book presentation.", href: "/#book" },
  { command: "buy", label: "BOOK / BUY", description: "View the book and any live purchase options.", href: "/#book" },
  { command: "rhenlink", label: "RHENLINK", description: "Open your persistent ANEVUM identity.", href: "/rhenlink" },
];

function emptyProgress(): MemberProgress {
  return { version: 1, savedRecordIds: [], visitedRoutes: [], achievements: [], updatedAt: new Date(0).toISOString() };
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const identity = displayIdentity(session);
  const level = memberLevelDetails(progress);

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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => {
      window.clearTimeout(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return targets;
    return targets.filter((target) => target.command.includes(normalized) || target.label.toLowerCase().includes(normalized));
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
    if (!command) return;
    if (command === "close" || command === "exit") {
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (command === "home") {
      navigate("/#top");
      return;
    }
    if (command === "profile" || command === "identity" || command === "signin" || command === "login") {
      navigate("/rhenlink");
      return;
    }
    const match = targets.find((target) => target.command === command || target.label.toLowerCase() === command);
    if (match) {
      navigate(match.href);
      return;
    }
    setMessage(`UNKNOWN COMMAND // ${command.toUpperCase()}`);
  }

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
          <aside className="launch-terminal-panel" role="dialog" aria-modal="true" aria-label="ANEVUM terminal navigation">
            <header>
              <div className="terminal-brand"><Terminal size={18} strokeWidth={1.4} /><span><strong>ANEVUM://</strong><small>NAVIGATION TERMINAL</small></span></div>
              <button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label="Close menu"><X size={18} strokeWidth={1.4} /></button>
            </header>

            <div className="terminal-boot" aria-hidden="true">
              <span>BOOT // PUBLIC LAUNCH NODE</span>
              <span>IDENTITY // {session ? "RESOLVED" : "GUEST"}</span>
              <span>ROUTE // {window.location.pathname || "/"}</span>
              <span>{message}</span>
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

            <nav className="terminal-route-list" aria-label="Launch destinations">
              {targets.map((target, index) => (
                <button type="button" key={target.command} onClick={() => navigate(target.href)}>
                  <span className="terminal-route-index">{String(index + 1).padStart(2, "0")}</span>
                  <span><strong>{target.label}</strong><small>{target.description}</small></span>
                  <ArrowRight size={16} strokeWidth={1.35} />
                </button>
              ))}
            </nav>

            <form className="terminal-command-line" onSubmit={(event) => { event.preventDefault(); execute(value); }}>
              <Command size={15} strokeWidth={1.4} />
              <span>ANEVUM://</span>
              <input ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)} placeholder="type a command" autoComplete="off" spellCheck={false} aria-label="ANEVUM command" />
              <button type="submit">RUN</button>
            </form>

            {value ? (
              <div className="terminal-suggestions">
                {filtered.slice(0, 4).map((target) => <button type="button" key={target.command} onClick={() => navigate(target.href)}><code>{target.command}</code><span>{target.label}</span></button>)}
                {!filtered.length ? <span>NO MATCHING ROUTE</span> : null}
              </div>
            ) : null}

            <footer><span>ESC // CLOSE</span><span>/ // OPEN</span><span>⌘K // TOGGLE</span></footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
