import { useCallback, useEffect, useMemo, useState } from "react";
import Mark from "../components/Mark";
import RhenMark from "../components/RhenMark";
import UniverseBackground from "../components/UniverseBackground";
import { useAuth } from "../auth/AuthProvider";
import { useLiveTrading } from "../hooks/useLiveTrading";
import {
  fetchCommandDailyReport,
  fetchCommandEvidence,
  fetchCommandStatus,
  fetchCommandWeeklyReport,
  fetchResearchReadiness,
  fetchTheoryProgram,
  type CommandEvidence,
  type CommandSnapshot,
  type ResearchReadiness,
  type TheoryProgramFeed
} from "../lib/data";
import { clockTime, money, percent } from "../lib/format";

type View = "overview" | "rhen" | "research" | "graen" | "operations" | "system";

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value as Record<string, unknown>[] : [];
}

function text(value: unknown, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function human(value: unknown) {
  return text(value).replaceAll("_", " ");
}

function stateTone(value?: string | null) {
  const raw = String(value || "").toLowerCase();
  if (/running|open|ready|active|armed|healthy|safe|available/.test(raw)) return "good";
  if (/error|failed|blocked|unsafe|offline/.test(raw)) return "bad";
  return "warn";
}

async function commandPost(path: string) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || payload.message || "Command request failed.");
  return payload;
}

export default function Iren() {
  const { session, commandAdmin, signOut } = useAuth();
  const { data: publicFeed, loading: publicLoading, error: publicError } = useLiveTrading(3000);
  const [view, setView] = useState<View>("overview");
  const [snapshot, setSnapshot] = useState<CommandSnapshot | null>(null);
  const [evidence, setEvidence] = useState<CommandEvidence | null>(null);
  const [daily, setDaily] = useState<Record<string, unknown> | null>(null);
  const [weekly, setWeekly] = useState<Record<string, unknown> | null>(null);
  const [readiness, setReadiness] = useState<ResearchReadiness | null>(null);
  const [theory, setTheory] = useState<TheoryProgramFeed | null>(null);
  const [privateError, setPrivateError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) link.href = "/iren.webmanifest";
    document.title = "IREN — ANEVUM";
    return () => {
      if (link) link.href = "/site.webmanifest";
    };
  }, []);

  const refreshExtended = useCallback(async () => {
    const [nextReadiness, nextTheory] = await Promise.all([
      fetchResearchReadiness().catch(() => null),
      fetchTheoryProgram().catch(() => null)
    ]);
    setReadiness(nextReadiness);
    setTheory(nextTheory);

    if (!session || !commandAdmin) return;

    // Private status is the authoritative unlock signal. Evidence and reports are
    // supplemental surfaces and must not make a healthy founder session look broken.
    try {
      const nextSnapshot = await fetchCommandStatus(session);
      setSnapshot(nextSnapshot);
      setPrivateError("");
    } catch (error) {
      setPrivateError(error instanceof Error ? error.message : "Private telemetry unavailable.");
      return;
    }

    const [evidenceResult, dailyResult, weeklyResult] = await Promise.allSettled([
      fetchCommandEvidence(session),
      fetchCommandDailyReport(session),
      fetchCommandWeeklyReport(session)
    ]);

    if (evidenceResult.status === "fulfilled") {
      setEvidence(evidenceResult.value);
    }
    if (dailyResult.status === "fulfilled") {
      setDaily(dailyResult.value);
    } else if (evidenceResult.status === "fulfilled") {
      setDaily(rec(evidenceResult.value.latest_daily));
    }
    if (weeklyResult.status === "fulfilled") {
      setWeekly(weeklyResult.value);
    } else if (evidenceResult.status === "fulfilled") {
      setWeekly(rec(evidenceResult.value.latest_weekly));
    }
  }, [session, commandAdmin]);

  useEffect(() => {
    void refreshExtended();
    const timer = window.setInterval(refreshExtended, 5000);
    return () => window.clearInterval(timer);
  }, [refreshExtended]);

  const runControl = useCallback(async (label: string, path: string, warning: string) => {
    if (!session || !commandAdmin) return;
    if (!window.confirm(warning)) return;
    setBusy(true);
    try {
      await commandPost(path);
      await refreshExtended();
      window.alert(label + " completed.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Command failed.");
    } finally {
      setBusy(false);
    }
  }, [session, commandAdmin, refreshExtended]);

  const account = rec(snapshot?.account);
  const bot = rec(snapshot?.bot);
  const market = rec(snapshot?.market);
  const strategy = rec(snapshot?.strategy);
  const scanner = rec(snapshot?.scanner);
  const positions = rows(snapshot?.positions);
  const recentOrders = rows(snapshot?.recent_orders);
  const research = rec(snapshot?.research);
  const performance = publicFeed?.performance;
  const activeTheory =
    theory?.problems.find((item) => item.problem_id === theory.program.current_problem_id) ||
    theory?.problems.find((item) => item.status === "ACTIVE") ||
    theory?.problems[0];
  const liveState = publicFeed?.state || (publicLoading ? "CONNECTING" : "UNKNOWN");
  const nav: Array<[View, string, string]> = [
    ["overview", "IREN", "System overview"],
    ["rhen", "RHEN", "Trading intelligence"],
    ["research", "RESEARCH", "Evidence & ADS"],
    ["graen", "GRAEN", "Theory program"],
    ["operations", "OPS", "Protected controls"],
    ["system", "SYSTEM", "Health & provenance"]
  ];

  const activity = useMemo(() => (publicFeed?.events || []).slice(0, 12), [publicFeed?.events]);
  const scanRows = useMemo(() => {
    const symbols = Array.isArray(strategy.scan_symbols)
      ? strategy.scan_symbols.map(String)
      : Object.keys(scanner);
    return symbols.filter((symbol) => scanner[symbol]).slice(0, 18).map((symbol) => ({
      symbol,
      row: rec(scanner[symbol])
    }));
  }, [strategy.scan_symbols, scanner]);

  return (
    <div className="iren-shell">
      <UniverseBackground />
      <aside className="iren-sidebar">
        <div className="iren-brand">
          <Mark />
          <div><strong>IREN</strong><span>ANEVUM OPERATING INTELLIGENCE</span></div>
        </div>
        <nav>
          {nav.map(([id, label, hint]) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>
              <i />
              <span><strong>{label}</strong><small>{hint}</small></span>
            </button>
          ))}
        </nav>
        <div className="iren-sidebar-foot">
          <div className={"iren-live-dot " + stateTone(liveState)} />
          <span><strong>{liveState}</strong><small>{publicFeed?.freshness_seconds == null ? "Awaiting telemetry" : Math.round(publicFeed.freshness_seconds) + "s freshness"}</small></span>
        </div>
      </aside>

      <main className="iren-main">
        <header className="iren-topbar">
          <div>
            <span>IREN / {view.toUpperCase()}</span>
            <strong>{view === "overview" ? "Operating picture" : nav.find((item) => item[0] === view)?.[2]}</strong>
          </div>
          <div className="iren-top-actions">
            <div className="iren-clock"><small>RHEN</small><strong>{clockTime(publicFeed?.generated_at)}</strong></div>
            {session?.user ? (
              <button className="iren-account" onClick={() => void signOut()}>
                <span>{session.user.email}</span><small>{commandAdmin ? "FOUNDER ACCESS" : "RHENLINK"}</small>
              </button>
            ) : (
              <button className="iren-unlock" onClick={() => window.location.assign("/command")}>Open Command</button>
            )}
          </div>
        </header>

        {(publicError || privateError) && (
          <div className="iren-alert"><strong>TELEMETRY NOTICE</strong><span>{privateError || publicError}</span></div>
        )}

        {view === "overview" && (
          <section className="iren-view">
            <div className="iren-hero">
              <div>
                <span>LIVE SYSTEM MAP</span>
                <h1>One surface for the whole operating system.</h1>
                <p>IREN combines live RHEN operation, research evidence, GRAEN theory work, system health, and protected controls. NOSTRA remains staged until its production API is exposed.</p>
              </div>
              <div className="iren-orbit">
                <div className="iren-core">IREN</div>
                <span className="node node-rhen">RHEN</span>
                <span className="node node-nostra">NOSTRA</span>
                <span className="node node-graen">GRAEN</span>
              </div>
            </div>

            <div className="iren-module-grid">
              <article className="iren-module featured">
                <header><RhenMark decorative /><span>RHEN</span><b className={stateTone(liveState)}>{liveState}</b></header>
                <strong>{publicFeed?.active_strategy?.strategy_name || "Trading intelligence"}</strong>
                <p>{publicFeed?.telemetry?.symbols_10m ?? 0} symbols observed · {publicFeed?.telemetry?.events_60m ?? 0} events / 60m</p>
                <footer><span>RETURN</span><b>{performance?.account_return_pct == null ? "—" : percent(performance.account_return_pct / 100)}</b></footer>
              </article>

              <article className="iren-module">
                <header><span>NOSTRA</span><b className="warn">STAGED</b></header>
                <strong>Forecasting / prediction</strong>
                <p>The identity is locked under IREN. A dedicated production API has not yet been exposed, so IREN will not fabricate live state.</p>
                <footer><span>FORMAL PROGRAM</span><b>FORWARD</b></footer>
              </article>

              <article className="iren-module">
                <header><span>GRAEN</span><b className={stateTone(activeTheory?.status)}>{activeTheory?.status || "IDLE"}</b></header>
                <strong>{activeTheory?.title || "Mathematical research"}</strong>
                <p>{activeTheory?.question || "No active theory problem is currently exposed."}</p>
                <footer><span>CONJECTURES</span><b>{activeTheory?.conjectures?.length ?? 0}</b></footer>
              </article>

              <article className="iren-module">
                <header><span>IREN</span><b className="good">ONLINE</b></header>
                <strong>Coordination layer</strong>
                <p>Private operating state becomes available after RHENLINK founder authentication.</p>
                <footer><span>ACCESS</span><b>{commandAdmin ? "PRIVATE + PUBLIC" : "PUBLIC"}</b></footer>
              </article>
            </div>

            <div className="iren-two-column">
              <article className="iren-panel">
                <header><div><span>LIVE ACTIVITY</span><strong>RHEN event stream</strong></div><small>3s public refresh</small></header>
                <div className="iren-tape">
                  {activity.length ? activity.map((event, index) => (
                    <div key={(event.at || "") + index}>
                      <time>{clockTime(event.at)}</time>
                      <b>{human(event.type).toUpperCase()}</b>
                      <span>{event.label}</span>
                    </div>
                  )) : <p className="iren-empty">No current telemetry events.</p>}
                </div>
              </article>

              <article className="iren-panel">
                <header><div><span>RESEARCH GATE</span><strong>{human(readiness?.state || "unavailable")}</strong></div><small>{readiness?.cadence || "—"}</small></header>
                <div className="iren-status-list">
                  <p><span>GPT RUN GATE</span><b>{readiness?.gpt_would_run_now ? "READY" : "WAIT"}</b></p>
                  <p><span>BLOCKERS</span><b>{readiness?.blocker_count ?? 0}</b></p>
                  <p><span>MONITORS</span><b>{readiness?.monitor_count ?? 0}</b></p>
                  <p><span>QUESTIONS READY</span><b>{readiness?.ready_strategy_question_count ?? 0}</b></p>
                </div>
              </article>
            </div>
          </section>
        )}

        {view === "rhen" && (
          <section className="iren-view">
            <div className="iren-section-title"><span>RHEN / LIVE OPERATIONS</span><h1>Trading intelligence</h1><p>Public telemetry is always available. Founder authentication unlocks broker and runtime detail.</p></div>
            <div className="iren-kpi-row">
              <article><span>STATE</span><strong>{liveState}</strong><small>{publicFeed?.freshness_seconds == null ? "—" : Math.round(publicFeed.freshness_seconds) + " sec"}</small></article>
              <article><span>RETURN</span><strong>{performance?.account_return_pct == null ? "—" : performance.account_return_pct.toFixed(2) + "%"}</strong><small>normalized tracked account</small></article>
              <article><span>DRAWDOWN</span><strong>{performance?.max_drawdown_pct == null ? "—" : performance.max_drawdown_pct.toFixed(2) + "%"}</strong><small>max tracked</small></article>
              <article><span>CLOSED TRADES</span><strong>{performance?.closed_trades ?? "—"}</strong><small>{performance?.wins ?? "—"} W / {performance?.losses ?? "—"} L</small></article>
            </div>

            {commandAdmin && snapshot ? (
              <>
                <div className="iren-kpi-row private">
                  <article><span>EQUITY</span><strong>{money(account.equity)}</strong><small>day {money(account.day_pnl)}</small></article>
                  <article><span>MARKET</span><strong>{market.is_open ? "OPEN" : "CLOSED"}</strong><small>{text(snapshot.mode).toUpperCase()}</small></article>
                  <article><span>EXECUTION</span><strong>{bot.bot_armed ? "ARMED" : "DISARMED"}</strong><small>{bot.entries_enabled ? "entries enabled" : "entry lock"}</small></article>
                  <article><span>POSITIONS</span><strong>{positions.length}</strong><small>{positions[0] ? text(positions[0].symbol) : "flat"}</small></article>
                </div>

                <div className="iren-two-column wide-left">
                  <article className="iren-panel">
                    <header><div><span>SCANNER</span><strong>{scanRows.length} current symbols</strong></div><small>{clockTime(bot.last_strategy_at)}</small></header>
                    <div className="iren-table">
                      <div className="head"><span>SYMBOL</span><span>ACTION</span><span>REASON</span></div>
                      {scanRows.map(({ symbol, row }) => (
                        <div key={symbol}><strong>{symbol}</strong><b>{text(row.action, "hold").toUpperCase()}</b><span>{text(row.reason, "waiting")}</span></div>
                      ))}
                    </div>
                  </article>
                  <article className="iren-panel">
                    <header><div><span>ORDER TAPE</span><strong>{recentOrders.length} recent</strong></div><small>private</small></header>
                    <div className="iren-tape compact">
                      {recentOrders.slice(0, 10).map((order, index) => (
                        <div key={text(order.id, String(index))}><time>{clockTime(order.filled_at || order.submitted_at)}</time><b>{text(order.symbol)}</b><span>{text(order.side).toUpperCase()} · {text(order.status).toUpperCase()}</span></div>
                      ))}
                    </div>
                  </article>
                </div>
              </>
            ) : (
              <div className="iren-private-gate">
                <strong>PRIVATE RHEN STATE LOCKED</strong>
                <p>Sign in with your RHENLINK founder account to expose live broker state, scanner rows, positions, orders, reports, evidence, and controls.</p>
                <button onClick={() => window.location.assign("/command")}>Open Command</button>
              </div>
            )}
          </section>
        )}

        {view === "research" && (
          <section className="iren-view">
            <div className="iren-section-title"><span>IREN / RESEARCH</span><h1>Evidence before changes</h1><p>Research state is separated from authorization to alter live production.</p></div>
            <div className="iren-module-grid research-grid">
              <article className="iren-module featured"><header><span>READINESS</span><b className={stateTone(readiness?.state)}>{human(readiness?.state || "unknown")}</b></header><strong>{readiness?.gpt_would_run_now ? "Research gate open" : "Research gate waiting"}</strong><p>{readiness?.waiting_requirements?.join(" · ") || "No additional waiting requirements exposed."}</p><footer><span>BLOCKERS</span><b>{readiness?.blocker_count ?? 0}</b></footer></article>
              <article className="iren-module"><header><span>CURRENT FOCUS</span><b>{publicFeed?.research?.current_status || "—"}</b></header><strong>{publicFeed?.research?.current_focus || "No public focus"}</strong><p>{publicFeed?.research?.next_direction?.conclusion || "Awaiting durable direction."}</p></article>
              <article className="iren-module"><header><span>ADS-002</span><b>{publicFeed?.research?.latest_daily?.ads002?.readiness_state || "RESEARCH"}</b></header><strong>Attribution / decision-space research</strong><p>Confidence {publicFeed?.research?.latest_daily?.ads002?.confidence_score ?? "—"} · direct coverage {publicFeed?.research?.latest_daily?.ads002?.direct_coverage ?? "—"}</p><footer><span>PROMOTION</span><b>{publicFeed?.research?.latest_daily?.ads002?.promotion_authorized ? "AUTHORIZED" : "NO"}</b></footer></article>
              <article className="iren-module"><header><span>ACTIVE QUESTIONS</span><b>{publicFeed?.research?.active_questions?.length ?? 0}</b></header><strong>Open research queue</strong><p>{publicFeed?.research?.active_questions?.[0]?.question || "No public active question."}</p></article>
            </div>
            {commandAdmin && evidence && (
              <article className="iren-panel">
                <header><div><span>PRIVATE EVIDENCE</span><strong>{evidence.evidence_version || "canonical evidence"}</strong></div><small>{clockTime(evidence.generated_at)}</small></header>
                <div className="iren-evidence-grid">
                  <div><span>FORWARD OUTCOMES</span><strong>{evidence.post_event_evidence?.forward_outcomes?.length ?? 0}</strong></div>
                  <div><span>LIVE/OFFLINE</span><strong>{evidence.post_event_evidence?.live_offline?.length ?? 0}</strong></div>
                  <div><span>QUESTIONS</span><strong>{evidence.research_questions?.length ?? 0}</strong></div>
                  <div><span>DECISIONS</span><strong>{evidence.research_decisions?.length ?? 0}</strong></div>
                </div>
              </article>
            )}
          </section>
        )}

        {view === "graen" && (
          <section className="iren-view">
            <div className="iren-section-title"><span>GRAEN / MATHEMATICAL INTELLIGENCE</span><h1>{activeTheory?.title || "Theory program"}</h1><p>{activeTheory?.question || theory?.program.purpose || "No active problem exposed."}</p></div>
            <div className="iren-kpi-row">
              <article><span>PROGRAM</span><strong>{theory?.program.name || "GRAEN"}</strong><small>{theory?.program.status || "—"}</small></article>
              <article><span>PROBLEMS</span><strong>{theory?.problems.length ?? 0}</strong><small>registered</small></article>
              <article><span>CONJECTURES</span><strong>{activeTheory?.conjectures.length ?? 0}</strong><small>current problem</small></article>
              <article><span>WORKSTREAMS</span><strong>{activeTheory?.workstreams.length ?? 0}</strong><small>current problem</small></article>
            </div>
            <div className="iren-two-column">
              <article className="iren-panel"><header><div><span>CONJECTURES</span><strong>Falsifiable claims</strong></div></header><div className="iren-card-list">{activeTheory?.conjectures.map((item) => <div key={item.conjecture_id}><b>{item.status}</b><strong>{item.title}</strong><p>{item.statement}</p></div>) || <p className="iren-empty">No conjectures exposed.</p>}</div></article>
              <article className="iren-panel"><header><div><span>WORKSTREAMS</span><strong>Active lines of work</strong></div></header><div className="iren-card-list">{activeTheory?.workstreams.map((item) => <div key={item.workstream_id}><b>{item.status}</b><strong>{item.title}</strong><p>{item.objective}</p></div>) || <p className="iren-empty">No workstreams exposed.</p>}</div></article>
            </div>
          </section>
        )}

        {view === "operations" && (
          <section className="iren-view">
            <div className="iren-section-title"><span>IREN / PROTECTED OPERATIONS</span><h1>Human-authorized controls</h1><p>Controls below call the existing RHEN production safeguards. IREN does not bypass reconciliation or execution gates.</p></div>
            {commandAdmin && session ? (
              <div className="iren-control-grid">
                <button disabled={busy} onClick={() => void runControl("Entry lock", "/api/command/trader/entries/disable", "Disable all new RHEN entries? Existing positions remain managed.")}><span>RISK CONTROL</span><strong>Disable new entries</strong><small>Stops new position entry without shutting down observation.</small></button>
                <button disabled={busy} onClick={() => void runControl("Entry enable", "/api/command/trader/entries/enable", "Enable RHEN new entries? Server-side execution and reconciliation gates still apply.")}><span>EXECUTION CONTROL</span><strong>Enable entries</strong><small>Only succeeds when RHEN reports a safe reconciled state.</small></button>
                <button disabled={busy} onClick={() => void runControl("Order cancellation", "/api/command/trader/orders/cancel", "Cancel RHEN-managed pending orders?")}><span>ORDER CONTROL</span><strong>Cancel pending orders</strong><small>Cancels bot-managed pending orders through RHEN.</small></button>
                <button className="danger" disabled={busy} onClick={() => void runControl("Position close", "/api/command/trader/position/close", "Close the RHEN-managed position and disable new entries? This may submit a live market action.")}><span>POSITION CONTROL</span><strong>Close managed position</strong><small>Live action. Requires explicit confirmation and server authorization.</small></button>
              </div>
            ) : (
              <div className="iren-private-gate"><strong>FOUNDER AUTHENTICATION REQUIRED</strong><p>Operational controls never appear as active actions without authenticated Command administrator authority.</p><button onClick={() => window.location.assign("/command")}>Open Command</button></div>
            )}
          </section>
        )}

        {view === "system" && (
          <section className="iren-view">
            <div className="iren-section-title"><span>IREN / SYSTEM</span><h1>Health, provenance, boundaries</h1><p>Operational state is kept explicit so degraded evidence cannot look healthy by omission.</p></div>
            <div className="iren-kpi-row">
              <article><span>PUBLIC FEED</span><strong>{liveState}</strong><small>{publicFeed?.freshness_seconds == null ? "—" : Math.round(publicFeed.freshness_seconds) + "s freshness"}</small></article>
              <article><span>ERRORS / 2H</span><strong>{publicFeed?.telemetry?.errors_2h ?? 0}</strong><small>runtime telemetry</small></article>
              <article><span>RECONCILIATIONS</span><strong>{publicFeed?.telemetry?.reconciliations_2h ?? 0}</strong><small>last 2h</small></article>
              <article><span>EXECUTIONS</span><strong>{publicFeed?.telemetry?.execution_events_2h ?? 0}</strong><small>last 2h</small></article>
            </div>
            <div className="iren-two-column">
              <article className="iren-panel"><header><div><span>BOUNDARIES</span><strong>What IREN can see</strong></div></header><div className="iren-status-list"><p><span>PUBLIC TELEMETRY</span><b>LIVE</b></p><p><span>RHEN PRIVATE STATE</span><b>{commandAdmin ? "AUTHORIZED" : "LOCKED"}</b></p><p><span>NOSTRA API</span><b>NOT EXPOSED</b></p><p><span>GRAEN PUBLIC PROGRAM</span><b>{theory ? "AVAILABLE" : "UNAVAILABLE"}</b></p></div></article>
              <article className="iren-panel"><header><div><span>PROVENANCE</span><strong>Private runtime evidence</strong></div></header><div className="iren-card-list">{commandAdmin && evidence ? <><div><b>RUNTIME</b><strong>{text(rec(evidence.provenance?.runtime).deployment_id, "recorded")}</strong><p>{text(rec(evidence.provenance?.runtime).git_commit, "No commit exposed")}</p></div><div><b>LATEST SCAN</b><strong>{text(rec(evidence.provenance?.latest_scan_cycle).data_status, "—")}</strong><p>{text(rec(evidence.provenance?.latest_scan_cycle).cycle_outcome, "No cycle outcome")}</p></div></> : <p className="iren-empty">Authenticate to inspect private runtime provenance.</p>}</div></article>
            </div>
                      </section>
        )}
      </main>

    </div>
  );
}
