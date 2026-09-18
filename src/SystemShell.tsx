import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  BookOpenText,
  CircleUserRound,
  Command,
  House,
  LibraryBig,
  Orbit,
  Terminal,
} from "lucide-react";
import { RhenlinkIdentityCard } from "./MemberChrome";
import { displayIdentity, loadSession, type MemberSession } from "./memberClient";
import { Mark, navigate } from "./ui";

export type SystemSurface = "anevum" | "stories" | "wiki" | "lattice" | "rhenlink" | "command";

const surfaces = [
  { id: "anevum" as const, label: "ANEVUM", code: "ROOT", href: "https://anevum.com/", icon: House },
  { id: "stories" as const, label: "REPLY", code: "STORY", href: "https://anevum.com/the-book", icon: LibraryBig },
  { id: "wiki" as const, label: "WIKI", code: "CANON", href: "https://anevum.com/wiki", icon: BookOpenText },
  { id: "lattice" as const, label: "LATTICE", code: "MEMBER", href: "https://anevum.com/lattice", icon: Orbit },
  { id: "rhenlink" as const, label: "RHENLINK", code: "IDENT", href: "https://anevum.com/rhenlink", icon: CircleUserRound },
  { id: "command" as const, label: "COMMAND", code: "OPS", href: "https://anevum.com/command", icon: Command },
];

const surfaceMeta: Record<SystemSurface, { eyebrow: string; detail: string; access: string }> = {
  anevum: { eyebrow: "PUBLIC FRONT DOOR", detail: "Story, knowledge, place and identity converge here.", access: "PUBLIC" },
  stories: { eyebrow: "STORY SURFACE", detail: "Published narrative remains the center of the universe.", access: "PUBLIC" },
  wiki: { eyebrow: "CANON AUTHORITY", detail: "The live Wiki owns fictional truth and publishes approved projections into ANEVUM.", access: "PUBLIC / MODERATED" },
  lattice: { eyebrow: "MEMBER EXPERIENCE", detail: "LATTICE turns approved ANEVUM content, identity and relationships into a persistent member layer.", access: "PUBLIC + RHENLINK" },
  rhenlink: { eyebrow: "IDENTITY SURFACE", detail: "Persistent member identity, saves, XP and achievements.", access: "MEMBER" },
  command: { eyebrow: "COMPANY OPERATIONS", detail: "Private cockpit unifying publishing, product, canon, identity, finance and infrastructure state.", access: "ADMIN" },
};

function go(href: string) {
  const target = new URL(href, window.location.href);
  if (target.origin === window.location.origin) {
    navigate(`${target.pathname}${target.search}${target.hash}`);
    return;
  }
  window.location.assign(target.toString());
}

function resolveCommand(raw: string) {
  const value = raw.trim();
  const command = value.toLowerCase();
  if (!command) return null;

  if (["home", "root", "anevum"].includes(command)) return "https://anevum.com/";
  if (["stories", "story", "the story"].includes(command)) return "https://anevum.com/the-story";
  if (["reply", "book", "book one", "the book"].includes(command)) return "https://anevum.com/the-book";
  if (["wiki", "knowledge", "truth", "canon"].includes(command)) return "https://anevum.com/wiki";
  if (["wiki new", "new page", "propose"].includes(command)) return "https://anevum.com/wikinew";
  if (["wiki saved", "saved"].includes(command)) return "https://anevum.com/wikisaved";
  if (["wiki admin", "moderation"].includes(command)) return "https://anevum.com/wikiadmin";
  if (["lattice", "space", "explore", "relations"].includes(command)) return "https://anevum.com/lattice";
  if (["rhenlink", "profile", "identity", "id"].includes(command)) return "https://anevum.com/rhenlink";
  if (["command", "cmd", "control", "operations"].includes(command)) return "https://anevum.com/command";
  if (command === "search") return "https://anevum.com/wiki";
  if (command.startsWith("wiki ")) {
    const slug = command.slice(5).trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return slug ? `https://anevum.com/wiki${slug}` : "https://anevum.com/wiki";
  }
  return null;
}

function useSystemIdentity() {
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  useEffect(() => {
    const sync = () => setSession(loadSession());
    window.addEventListener("anevum-member-session", sync);
    return () => window.removeEventListener("anevum-member-session", sync);
  }, []);
  return session;
}

export function UnifiedSystemShell({
  surface,
  pathname,
  hostname,
  children,
}: {
  surface: SystemSurface;
  pathname: string;
  hostname: string;
  children: ReactNode;
}) {
  const [commandValue, setCommandValue] = useState("");
  const [commandState, setCommandState] = useState("READY");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const session = useSystemIdentity();
  const identity = displayIdentity(session);
  const meta = surfaceMeta[surface];

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (!typing && event.key === "/") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function runCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = resolveCommand(commandValue);
    if (!target) {
      setCommandState("UNKNOWN COMMAND");
      window.setTimeout(() => setCommandState("READY"), 1800);
      return;
    }
    setCommandState("ROUTING");
    go(target);
  }

  return (
    <div className={`anevum-system-shell surface-${surface}`}>
      <header className="system-topbar">
        <a className="system-brand" href="https://anevum.com/" aria-label="ANEVUM home">
          <Mark />
          <span><strong>ANEVUM</strong><small>UNIFIED INTERFACE</small></span>
        </a>
        <div className="system-breadcrumb">
          <span>SYS</span><i>/</i><strong>{surface.toUpperCase()}</strong><i>/</i><em>{pathname || "/"}</em>
        </div>
        <div className="system-top-status">
          <span className="system-live"><i />ONLINE</span>
          <span>{meta.access}</span>
          <span className={session ? "auth-active" : ""}>{session ? `@${identity.handle || "MEMBER"}` : "GUEST"}</span>
        </div>
      </header>

      <aside className="system-rail" aria-label="ANEVUM system surfaces">
        <div className="system-rail-label">ANEVUM LAYERS</div>
        {surfaces.map((entry, index) => {
          const Icon = entry.icon;
          const active = entry.id === surface;
          return (
            <a key={entry.id} href={entry.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <span className="system-rail-index">0{index + 1}</span>
              <Icon size={17} strokeWidth={1.45} />
              <span className="system-rail-copy"><strong>{entry.label}</strong><small>{entry.code}</small></span>
            </a>
          );
        })}
      </aside>

      <main className="system-viewport" id="anevum-system-viewport">
        <div className="system-surface-heading">
          <div><span>{meta.eyebrow}</span><strong>{surface.toUpperCase()}</strong></div>
          <p>{meta.detail}</p>
          <small>{hostname}</small>
        </div>
        <div className="system-content-frame">{children}</div>
      </main>

      <aside className="system-sidecar">
        <div className="system-side-module system-current-module">
          <span>CURRENT SURFACE</span>
          <strong>{surface.toUpperCase()}</strong>
          <small>{meta.access}</small>
          <div className="system-signal"><i /><i /><i /><i /></div>
        </div>
        <div className="system-identity-slot"><RhenlinkIdentityCard /></div>
        <div className="system-side-module system-quick-module">
          <span>QUICK COMMANDS</span>
          <button type="button" onClick={() => go("https://anevum.com/wiki")}><BookOpenText size={13} />wiki / canonical record</button>
          <button type="button" onClick={() => go("https://anevum.com/lattice")}><Orbit size={13} />lattice / relations</button>
          <button type="button" onClick={() => go("https://anevum.com/rhenlink")}><CircleUserRound size={13} />rhenlink / identity</button>
          <button type="button" onClick={() => go("https://anevum.com/command")}><Terminal size={13} />command / control</button>
        </div>
        <div className="system-side-module system-host-module"><span>HOST</span><code>{hostname}</code><small>ONE ANEVUM RUNTIME / CLEAR SOURCE AUTHORITY</small></div>
      </aside>

      <form className="system-console" onSubmit={runCommand}>
        <span className="system-prompt"><Terminal size={14} /><b>ANEVUM</b><i>:</i><strong>{surface}</strong><i>$</i></span>
        <input
          ref={inputRef}
          value={commandValue}
          onChange={(event) => setCommandValue(event.target.value)}
          onFocus={() => setCommandState("COMMAND MODE")}
          onBlur={() => setCommandState("READY")}
          placeholder="type wiki, lattice, rhenlink, command, reply…"
          aria-label="ANEVUM command navigation"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <span className="system-console-state">{commandState}</span>
        <span className="system-console-key">⌘K</span>
      </form>
    </div>
  );
}
