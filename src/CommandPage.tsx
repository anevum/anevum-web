import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, BookOpenText, CheckCircle2, CircleDashed, CircleUserRound, Database, GitBranch, LockKeyhole, Orbit, RadioTower, Rocket, ShieldCheck } from "lucide-react";
import { loadSession, syncCurrentUser, type MemberSession } from "./memberClient";
import { CommandFinance } from "./CommandFinance";
import { CANON_LIFECYCLE_COUNTS, CANON_PROJECTION_SYNC } from "./canonProjection";
import { getLaunchReadiness, launchReadinessSummary, type LaunchReadinessState } from "./launchReadiness";
import {
  WIKI_CANON_STATES,
  WikiBackendUnavailable,
  isWikiAdmin,
  isWikiProductVisible,
  loadPendingWikiSubmissions,
  loadWikiControlPages,
  wikiCanonState,
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
  { code: "WIKI", title: "Canonical Database", detail: "Inspect the released projection of the live Notion canon authority and its lifecycle state.", href: "https://wiki.anevum.com/", icon: BookOpenText },
  { code: "LATTICE", title: "Relation Runtime", detail: "Navigate only Wiki-cleared records and publication-safe relationships.", href: "https://lattice.anevum.com/", icon: Orbit },
  { code: "RHENLINK", title: "Identity Layer", detail: "Resolve persistent identity, progression and authenticated product behavior.", href: "https://anevum.com/rhenlink", icon: CircleUserRound },
  { code: "GITHUB", title: "Production Source", detail: "The active implementation is built from the ANEVUM GitHub main branch.", href: "https://github.com/anevum/anevum-web", icon: GitBranch },
] as const;

const stateDescriptions: Record<(typeof WIKI_CANON_STATES)[number], string> = {
  "Source-Locked": "Source boundary is locked. Downstream surfaces preserve the released boundary without expanding it.",
  Locked: "A locked master record is protected from ordinary mutation and remains governed by Wiki release rules.",
  Canonical: "Current canon. It may appear downstream only when it also passes the website publication gate.",
  Working: "Active development material. It is excluded from current public product truth.",
  Unresolved: "The master record is not settled enough for downstream truth claims.",
  Exploratory: "Exploratory material remains outside current canon and public release surfaces.",
  Superseded: "Historical material retained for lineage but excluded from current truth.",
  Archived: "Archived material remains reference history, not current public canon.",
};

type SurfaceState = "idle" | "loading" | "ready" | "unavailable" | "error";

function ReadinessIcon({ state }: { state: LaunchReadinessState }) {
  if (state === "ready") return <ShieldCheck size={17} />;
  if (state === "pending" || state === "stale") return <AlertTriangle size={17} />;
  return <CircleDashed size={17} />;
}

export function CommandHome() {
  const session = useCommandSession();
  const admin = isWikiAdmin(session);
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [queue, setQueue] = useState<WikiSubmission[]>([]);
  const [canonState, setCanonState] = useState<SurfaceState>("idle");
  const [moderationState, setModerationState] = useState<SurfaceState>("idle");
  const [canonError, setCanonError] = useState("");
  const [moderationError, setModerationError] = useState("");
  const readiness = useMemo(() => getLaunchReadiness(), []);
  const readinessSummary = useMemo(() => launchReadinessSummary(readiness), [readiness]);

  useEffect(() => {
    if (!admin) {
      setPages([]);
      setQueue([]);
      setCanonState("idle");
      setModerationState("idle");
      return;
    }

    let cancelled = false;
    setCanonState("loading");
    setModerationState("loading");

    loadWikiControlPages()
      .then((nextPages) => {
        if (cancelled) return;
        setPages(nextPages);
        setCanonState("ready");
        setCanonError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setCanonState("error");
        setCanonError(error instanceof Error ? error.message : "Canon projection could not be resolved.");
      });

    loadPendingWikiSubmissions()
      .then((nextQueue) => {
        if (cancelled) return;
        setQueue(nextQueue);
        setModerationState("ready");
        setModerationError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setQueue([]);
        if (error instanceof WikiBackendUnavailable) setModerationState("unavailable");
        else {
          setModerationState("error");
          setModerationError(error instanceof Error ? error.message : "Community moderation state could not be resolved.");
        }
      });

    return () => { cancelled = true; };
  }, [admin, session?.user.id]);

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
          <p>One authenticated operational surface. The live Notion Wiki is truth; Command observes the product-safe projection and the systems that consume it.</p>
        </div>
        <div className="command-health"><i /><strong>ADMIN LINK RESOLVED</strong><small>{session.user.email}</small></div>
      </header>

      <div className="command-metrics">
        <div><Database size={16} /><span>WIKI AUTHORITY</span><strong>{canonState === "ready" ? "RESOLVED" : canonState.toUpperCase()}</strong><small>Notion Canon + Publishing Queue</small></div>
        <div><BookOpenText size={16} /><span>PRODUCT RECORDS</span><strong>{canonState === "ready" ? productVisible : "—"}</strong><small>{CANON_PROJECTION_SYNC.queueCount} released at last sync</small></div>
        <div><Rocket size={16} /><span>LAUNCH GATE</span><strong>{readinessSummary.criticalReady}/{readinessSummary.criticalTotal}</strong><small>{readinessSummary.complete ? "Critical launch systems resolved" : `${readinessSummary.blocking.length} critical configuration gaps`}</small></div>
        <div><CheckCircle2 size={16} /><span>COMMUNITY QUEUE</span><strong>{moderationState === "ready" ? queue.length : moderationState === "unavailable" ? "OFF" : "—"}</strong><small>{moderationState === "unavailable" ? "Optional proposal backend not configured" : "Pending proposals"}</small></div>
      </div>

      <CommandFinance session={session} />

      <section className="command-readiness-panel" aria-labelledby="command-readiness-title">
        <header>
          <div><span>REPLY / LAUNCH READINESS</span><h2 id="command-readiness-title">What still blocks publication readiness.</h2></div>
          <div className={`command-readiness-score ${readinessSummary.complete ? "ready" : "pending"}`}><Rocket size={20} /><strong>{readinessSummary.criticalReady}/{readinessSummary.criticalTotal}</strong><small>CRITICAL SYSTEMS READY</small></div>
        </header>
        <div className="command-readiness-grid">
          {readiness.map((item) => (
            <article key={item.id} className={`command-readiness-item ${item.state} ${item.critical ? "critical" : "optional"}`}>
              <div className="command-readiness-state"><ReadinessIcon state={item.state} /><span>{item.state.toUpperCase()}</span></div>
              <h3>{item.label}</h3>
              <p>{item.detail}</p>
              <footer>
                <small>{item.critical ? "LAUNCH CRITICAL" : "NON-BLOCKING"}</small>
                {item.actionHref ? <a href={item.actionHref}>{item.actionLabel || "OPEN"} ↗</a> : null}
              </footer>
            </article>
          ))}
        </div>
        <div className="command-readiness-note"><BarChart3 size={15} /><p>Configuration values are reduced to readiness state here. COMMAND does not expose project tokens, authentication keys, private Notion credentials, or member identity data.</p></div>
      </section>

      <section className="command-canon-panel" aria-labelledby="command-canon-title">
        <header>
          <div><span>CANON LIFECYCLE / MASTER WIKI SNAPSHOT</span><h2 id="command-canon-title">Wiki state is preserved end to end.</h2></div>
          <p>Command does not confuse canon state with website release state. A record can be canonical or source-locked in the master Wiki and still remain hidden until the Website Publishing Queue releases it.</p>
        </header>
        <div className="command-state-grid">
          {WIKI_CANON_STATES.map((state) => (
            <article key={state} className={`command-state-card state-${state.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              <span>{state.toUpperCase()}</span>
              <strong>{CANON_LIFECYCLE_COUNTS[state]}</strong>
              <p>{stateDescriptions[state]}</p>
            </article>
          ))}
        </div>
        <p className="command-data-warning">SOURCE / {CANON_PROJECTION_SYNC.source.toUpperCase()} · PROJECTION SYNC / {CANON_PROJECTION_SYNC.syncedAt} · RELEASE GATE / {CANON_PROJECTION_SYNC.policy.toUpperCase()}</p>
        {canonState === "error" ? <p className="command-data-warning">{canonError}</p> : null}
        {moderationState === "unavailable" ? <p className="command-data-warning">Canonical Wiki reads remain active. Only the optional RHENLINK community-proposal persistence layer is currently unavailable.</p> : null}
        {moderationState === "error" ? <p className="command-data-warning">COMMUNITY LAYER / {moderationError}</p> : null}
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
        <header><div><span>RELEASE PROJECTION</span><strong>WIKI-CLEARED PRODUCT RECORDS</strong></div><small>{canonState === "ready" ? `${pages.length} RELEASED RECORDS` : canonState.toUpperCase()}</small></header>
        {canonState === "loading" ? <div className="command-record-empty">RESOLVING LIVE WIKI RELEASE PROJECTION…</div> : null}
        {canonState === "ready" && pages.length ? pages.slice(0, 12).map((page) => {
          const state = wikiCanonState(page);
          return (
            <div key={page.id} className="command-record-row">
              <time>{new Date(page.updated_at).toLocaleDateString()}</time>
              <span>{page.category_id.toUpperCase()}</span>
              <strong>{page.title}</strong>
              <em className={`record-state state-${state.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{state}</em>
              <small>{page.freeze_state?.toUpperCase() || page.status.toUpperCase()}</small>
              {isWikiProductVisible(page) ? <a href={`https://wiki.anevum.com/${encodeURIComponent(page.slug)}`}>OPEN ↗</a> : <b>CONTROL ONLY</b>}
            </div>
          );
        }) : null}
        {canonState === "ready" && !pages.length ? <div className="command-record-empty">NO RELEASED WIKI RECORDS RESOLVED</div> : null}
      </section>

      <div className="command-event-stream">
        <div className="command-event-head"><span>OPERATING MODEL</span><strong>ONE RUNTIME / WIKI-AUTHORITATIVE DATA FLOW</strong></div>
        <div><time>01</time><span>anevum.com</span><p>Public story and launch surface.</p></div>
        <div><time>02</time><span>wiki.anevum.com</span><p>Browser-safe release projection of the live canonical Notion Wiki.</p></div>
        <div><time>03</time><span>lattice.anevum.com</span><p>Relational interpretation of Wiki-cleared records only.</p></div>
        <div><time>04</time><span>anevum.com/rhenlink</span><p>Persistent identity, saves and progression across the system.</p></div>
        <div><time>05</time><span>command.anevum.com</span><p>Private control and observability surface.</p></div>
      </div>
    </section>
  );
}
