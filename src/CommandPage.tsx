import { useEffect, useMemo, useState } from "react";
import { BookOpenText, CheckCircle2, CircleUserRound, Database, GitBranch, LockKeyhole, Orbit, RadioTower } from "lucide-react";
import { loadSession, syncCurrentUser, type MemberSession } from "./memberClient";
import {
  WIKI_CANON_STATES,
  WikiBackendUnavailable,
  isWikiAdmin,
  isWikiProductVisible,
  loadPendingWikiSubmissions,
  loadWikiControlPages,
  wikiCanonState,
  wikiStateCounts,
  type WikiPage,
  type WikiSubmission,
} from "./wikiClient";

function useCommandSession() {
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  useEffect(() => {
    const sync = () => setSession(loadSession());
    window.addEventListener("anevum-member-session", sync);
    if (session) syncCurrentUser(session).then((next) => next && setSession(next)).catch(() => undefined);
    return () => window.removeEventListener("anevum-member-session", sync);
  }, [session?.user.id]);
  return session;
}

const modules = [
  { code: "WIKI", title: "Canonical Database", detail: "Inspect the live record authority, moderation queue and lifecycle states.", href: "https://wiki.anevum.com/", icon: BookOpenText },
  { code: "LATTICE", title: "Relation Runtime", detail: "Navigate only Wiki-authorized records and their relational presentation.", href: "https://lattice.anevum.com/", icon: Orbit },
  { code: "RHENLINK", title: "Identity Layer", detail: "Resolve persistent identity, progression and authenticated product behavior.", href: "https://anevum.com/rhenlink", icon: CircleUserRound },
  { code: "GITHUB", title: "Production Source", detail: "The current implementation is built from the ANEVUM GitHub main branch.", href: "https://github.com/anevum/anevum-web", icon: GitBranch },
] as const;

const stateDescriptions: Record<(typeof WIKI_CANON_STATES)[number], string> = {
  "Source-Locked": "Source boundary is locked. Downstream surfaces preserve this state exactly.",
  Locked: "Record is locked against casual mutation and remains governed by Wiki publication state.",
  Canonical: "Current canonical record available to downstream product surfaces when published.",
  Working: "Active development material. Excluded from Lattice and public product exposure.",
  Superseded: "Historical state retained for lineage. Excluded from current product truth.",
};

export function CommandHome() {
  const session = useCommandSession();
  const admin = isWikiAdmin(session);
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [queue, setQueue] = useState<WikiSubmission[]>([]);
  const [wikiState, setWikiState] = useState<"idle" | "loading" | "ready" | "unavailable" | "error">("idle");
  const [wikiError, setWikiError] = useState("");

  useEffect(() => {
    if (!admin) {
      setPages([]);
      setQueue([]);
      setWikiState("idle");
      return;
    }
    let cancelled = false;
    setWikiState("loading");
    Promise.all([loadWikiControlPages(), loadPendingWikiSubmissions()])
      .then(([nextPages, nextQueue]) => {
        if (cancelled) return;
        setPages(nextPages);
        setQueue(nextQueue);
        setWikiState("ready");
        setWikiError("");
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof WikiBackendUnavailable) setWikiState("unavailable");
        else {
          setWikiState("error");
          setWikiError(error instanceof Error ? error.message : "Wiki control state could not be resolved.");
        }
      });
    return () => { cancelled = true; };
  }, [admin, session?.user.id]);

  const counts = useMemo(() => wikiStateCounts(pages), [pages]);
  const productVisible = useMemo(() => pages.filter(isWikiProductVisible).length, [pages]);

  if (!session) {
    return (
      <section className="command-gate">
        <LockKeyhole size={30} />
        <span>COMMAND / AUTHORIZATION REQUIRED</span>
        <h1>Private control plane.</h1>
        <p>COMMAND is part of the same ANEVUM runtime, but operational controls resolve only after RHENLINK authentication.</p>
        <a href="https://anevum.com/rhenlink">RESOLVE RHENLINK →</a>
      </section>
    );
  }

  if (!admin) {
    return (
      <section className="command-gate">
        <RadioTower size={30} />
        <span>COMMAND / IDENTITY RESOLVED</span>
        <h1>Administrative claim required.</h1>
        <p>Your RHENLINK is active, but this account does not currently carry the protected administrator claim used by COMMAND.</p>
        <div className="command-gate-meta"><strong>{session.user.email}</strong><small>AUTHENTICATED / NOT AUTHORIZED</small></div>
      </section>
    );
  }

  return (
    <section className="command-home">
      <header className="command-home-header">
        <div>
          <span>ANEVUM COMMAND</span>
          <h1>Control plane.</h1>
          <p>One authenticated operational surface. Wiki is truth; Command inspects and controls the product systems that consume it.</p>
        </div>
        <div className="command-health"><i /><strong>ADMIN LINK RESOLVED</strong><small>{session.user.email}</small></div>
      </header>

      <div className="command-metrics">
        <div><Database size={16} /><span>WIKI AUTHORITY</span><strong>{wikiState === "ready" ? "RESOLVED" : wikiState.toUpperCase()}</strong><small>Live canonical database</small></div>
        <div><BookOpenText size={16} /><span>PRODUCT RECORDS</span><strong>{wikiState === "ready" ? productVisible : "—"}</strong><small>Published + product-visible state</small></div>
        <div><Orbit size={16} /><span>LATTICE SOURCE</span><strong>WIKI ONLY</strong><small>No parallel lore store</small></div>
        <div><CheckCircle2 size={16} /><span>MODERATION QUEUE</span><strong>{wikiState === "ready" ? queue.length : "—"}</strong><small>Pending Wiki proposals</small></div>
      </div>

      <section className="command-canon-panel" aria-labelledby="command-canon-title">
        <header>
          <div><span>CANON LIFECYCLE</span><h2 id="command-canon-title">Wiki state is preserved end to end.</h2></div>
          <p>Command, Lattice and terminal surfaces do not invent or upgrade canon state. Working and Superseded records are excluded from current product truth.</p>
        </header>
        <div className="command-state-grid">
          {WIKI_CANON_STATES.map((state) => (
            <article key={state} className={`command-state-card state-${state.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              <span>{state.toUpperCase()}</span>
              <strong>{wikiState === "ready" ? counts[state] : "—"}</strong>
              <p>{stateDescriptions[state]}</p>
            </article>
          ))}
        </div>
        {wikiState === "unavailable" ? <p className="command-data-warning">The Wiki schema is not available to this runtime. Command is withholding record claims rather than falling back to another lore source.</p> : null}
        {wikiState === "error" ? <p className="command-data-warning">{wikiError}</p> : null}
      </section>

      <div className="command-module-grid">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <a key={module.code} href={module.href} className="command-module-card">
              <span className="command-module-code">{module.code}</span>
              <Icon size={22} strokeWidth={1.35} />
              <h2>{module.title}</h2>
              <p>{module.detail}</p>
              <b>OPEN MODULE ↗</b>
            </a>
          );
        })}
      </div>

      <section className="command-record-panel">
        <header><div><span>WIKI CONTROL VIEW</span><strong>RECENT RECORD STATE</strong></div><small>{wikiState === "ready" ? `${pages.length} TOTAL RECORDS` : wikiState.toUpperCase()}</small></header>
        {wikiState === "loading" ? <div className="command-record-empty">RESOLVING LIVE WIKI STATE…</div> : null}
        {wikiState === "ready" && pages.length ? pages.slice(0, 10).map((page) => {
          const state = wikiCanonState(page);
          return (
            <div key={page.id} className="command-record-row">
              <time>{new Date(page.updated_at).toLocaleDateString()}</time>
              <span>{page.category_id.toUpperCase()}</span>
              <strong>{page.title}</strong>
              <em className={`record-state state-${state.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{state}</em>
              <small>{page.status.toUpperCase()}</small>
              {isWikiProductVisible(page) ? <a href={`https://wiki.anevum.com/${encodeURIComponent(page.slug)}`}>OPEN ↗</a> : <b>CONTROL ONLY</b>}
            </div>
          );
        }) : null}
        {wikiState === "ready" && !pages.length ? <div className="command-record-empty">NO WIKI RECORDS RESOLVED</div> : null}
      </section>

      <div className="command-event-stream">
        <div className="command-event-head"><span>OPERATING MODEL</span><strong>ONE RUNTIME / WIKI-AUTHORITATIVE DATA FLOW</strong></div>
        <div><time>01</time><span>anevum.com</span><p>Public story and launch surface.</p></div>
        <div><time>02</time><span>wiki.anevum.com</span><p>Canonical record authority and moderation surface.</p></div>
        <div><time>03</time><span>lattice.anevum.com</span><p>Relational interpretation of Wiki-authorized records.</p></div>
        <div><time>04</time><span>anevum.com/rhenlink</span><p>Persistent identity and progression across the system.</p></div>
        <div><time>05</time><span>command.anevum.com</span><p>Private control and observability surface.</p></div>
      </div>
    </section>
  );
}
