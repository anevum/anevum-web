import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import SystemIcon from "../components/company/SystemIcon";
import CommandAccountTracker from "../components/CommandAccountTracker";
import CommandDiscoveryDeck from "../components/CommandDiscoveryDeck";
import CommandIrenMaintenance from "../components/CommandIrenDock";
import CommandOperationsTerminal from "../components/CommandOperationsTerminal";
import CommandPerformance from "../components/CommandPerformance";
import CommandRawLog from "../components/CommandRawLog";
import CommandReviewDeck from "../components/CommandReviewDeck";
import CommandTopology from "../components/CommandTopology";
import CommandTradingLanes from "../components/CommandTradingLanes";
import CommandLiveMarket from "../components/CommandLiveMarket";
import { useCommandLiveStream } from "../hooks/useCommandLiveStream";
import { useRhenLiveObserver } from "../hooks/useRhenLiveObserver";
import RhenRealtimePanel from "../components/RhenRealtimePanel";
import { useCommandObservation } from "../hooks/useCommandObservation";
import { useLiveTrading } from "../hooks/useLiveTrading";
import {
  fetchCommandDailyReport,
  fetchCommandEvidence,
  fetchCommandStatus,
  fetchCommandWeeklyReport,
  type CommandEvidence,
  type CommandSnapshot
} from "../lib/data";
import { clockTime, money } from "../lib/format";
import { ageText, displayState } from "../lib/system-display";
import "../styles/command-v4.css";
import "../styles/workshop-terminal.css";

type CommandPage = "operate" | "discover" | "review" | "public" | "system";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function list(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value as Record<string, unknown>[] : [];
}

function text(value: unknown, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function numeric(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function routePage(pathname: string): CommandPage {
  const segment = pathname.split("/")[3] || "operate";
  if (["discover", "research", "graen", "nostra", "velum"].includes(segment)) return "discover";
  if (["review", "evidence"].includes(segment)) return "review";
  if (["public"].includes(segment)) return "public";
  if (["system", "terminal", "infrastructure", "iren"].includes(segment)) return "system";
  return "operate";
}

const PAGE_COPY: Record<CommandPage, { eyebrow: string; title: string; detail: string }> = {
  operate: {
    eyebrow: "RHEN / EXECUTION",
    title: "Operate",
    detail: "What is trading now, what capital is exposed, and what the broker is actually doing."
  },
  discover: {
    eyebrow: "EVIDENCE + RESEARCH / DISCOVERY",
    title: "Discover",
    detail: "Canonical market evidence, NOSTRA forecast outcomes, open research questions, and on-demand GRAEN / VELUM experiment evidence."
  },
  review: {
    eyebrow: "EVIDENCE / DECISION BOUNDARY",
    title: "Review",
    detail: "Only work that needs judgment: unresolved evidence, new hypotheses, bounded strategy experiments, release decisions, and operator / Work handoffs."
  },
  public: {
    eyebrow: "ANEVUM / PUBLIC PROJECTION",
    title: "Public",
    detail: "Exactly what the public website can see: source freshness, public performance, releases, research state, and privacy-safe telemetry."
  },
  system: {
    eyebrow: "IREN / SYSTEM",
    title: "System",
    detail: "One Railway runtime, embedded modules, on-demand research/replay state, deterministic schedules, incidents, and the raw canonical event stream."
  }
};

function StateDot({ ok }: { ok: boolean }) {
  return <i className={ok ? "is-live" : ""} aria-hidden="true" />;
}

export default function RhenTerminal() {
  const { session, loading, commandAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const page = routePage(location.pathname);
  const liveEnabled = import.meta.env.VITE_COMMAND_LIVE_STREAM_ENABLED === "true" && Boolean(commandAdmin && session);
  const liveState = useCommandLiveStream(liveEnabled);
  const observerState = useRhenLiveObserver(Boolean(commandAdmin && session));
  const [snapshot, setSnapshot] = useState<CommandSnapshot | null>(null);
  const [evidence, setEvidence] = useState<CommandEvidence | null>(null);
  const [dailyReport, setDailyReport] = useState<Record<string, unknown> | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<Record<string, unknown> | null>(null);
  const [statusError, setStatusError] = useState("");
  const [evidenceError, setEvidenceError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [statusReceivedAt, setStatusReceivedAt] = useState<string | null>(null);
  const statusInFlight = useRef(false);
  const evidenceInFlight = useRef(false);
  const controlObservation = useCommandObservation(commandAdmin ? session : null, 3000);
  const { data: publicFeed, error: publicFeedError, transport: publicTransport } = useLiveTrading(3000);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/", { replace: true });
  }, [signOut, navigate]);

  const refreshStatus = useCallback(async () => {
    if (!session || !commandAdmin || statusInFlight.current) return;
    statusInFlight.current = true;
    try {
      const next = await fetchCommandStatus(session);
      setSnapshot(next);
      setStatusReceivedAt(new Date().toISOString());
      setStatusError("");
    } catch (reason) {
      setStatusError(reason instanceof Error ? reason.message : "Trading status unavailable.");
    } finally {
      statusInFlight.current = false;
    }
  }, [session, commandAdmin]);

  const refreshEvidence = useCallback(async () => {
    if (!session || !commandAdmin || evidenceInFlight.current) return;
    evidenceInFlight.current = true;
    try {
      const next = await fetchCommandEvidence(session);
      setEvidence(next);
      setEvidenceError("");
      const [daily, weekly] = await Promise.all([
        fetchCommandDailyReport(session).catch(() => null),
        fetchCommandWeeklyReport(session).catch(() => null)
      ]);
      setDailyReport(daily || record(next.latest_daily));
      setWeeklyReport(weekly || record(next.latest_weekly));
    } catch (reason) {
      setEvidenceError(reason instanceof Error ? reason.message : "Research evidence unavailable.");
    } finally {
      evidenceInFlight.current = false;
    }
  }, [session, commandAdmin]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshStatus(), refreshEvidence()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshStatus, refreshEvidence]);

  useEffect(() => {
    if (!session || !commandAdmin) return;
    void refreshStatus();
    void refreshEvidence();
    // Trading state is fast read-only polling; durable research reports are slow.
    // A slow report must never hold up the next account/position observation.
    const statusTimer = window.setInterval(() => void refreshStatus(), 5000);
    const evidenceTimer = window.setInterval(() => void refreshEvidence(), 60000);
    return () => {
      window.clearInterval(statusTimer);
      window.clearInterval(evidenceTimer);
    };
  }, [session, commandAdmin, refreshStatus, refreshEvidence]);

  if (loading) {
    return <div className="command-gate"><SystemIcon system="RHEN" size="lg" /><span>RHEN / TERMINAL</span><h1>Resolving identity.</h1></div>;
  }

  if (!session?.user) {
    return <div className="command-gate"><SystemIcon system="RHEN" size="lg" /><span>RHEN / TERMINAL</span><h1>Private operations.</h1><p>RHEN Terminal requires an authorized operator identity.</p><Link className="primary-link" to="/command/rhen/operate">Private access <b>↗</b></Link></div>;
  }

  if (!commandAdmin) {
    return <div className="command-gate"><SystemIcon system="RHEN" size="lg" /><span>RHEN / TERMINAL</span><h1>Administrator access required.</h1><p>This identity is authenticated but is not authorized for the operations console.</p><Link className="text-link" to="/">Return to ANEVUM <b>→</b></Link></div>;
  }

  const account = record(snapshot?.account);
  const bot = record(snapshot?.bot);
  const positions = list(snapshot?.positions);
  const recentOrders = list(snapshot?.recent_orders);
  const dayPnl = numeric(account.day_pnl);
  const control = controlObservation.snapshot?.research?.control;
  const controlFresh = Boolean(controlObservation.snapshot && !controlObservation.snapshot.stale && !controlObservation.error);
  const pageCopy = PAGE_COPY[page];
  const activeUniverse = snapshot?.universe?.active_count ?? Object.keys(record(snapshot?.scanner)).length;
  const openPositions = positions.length;

  return (
    <div className={"command-shell command-workshop command-v4 command-v4-" + page}>
      <header className="command-v4-header">
        <Link className="command-v4-brand" to="/command/rhen/operate">
          <SystemIcon system="RHEN" size="sm" />
          <span>RHEN</span>
          <i />
          <strong>TERMINAL</strong>
        </Link>

        <nav aria-label="RHEN Terminal workspaces">
          <Link className={page === "operate" ? "active" : ""} aria-current={page === "operate" ? "page" : undefined} to="/command/rhen/operate">Operate</Link>
          <Link className={page === "discover" ? "active" : ""} aria-current={page === "discover" ? "page" : undefined} to="/command/rhen/discover">Discover</Link>
          <Link className={page === "review" ? "active" : ""} aria-current={page === "review" ? "page" : undefined} to="/command/rhen/review">Review{control?.review_required ? <b /> : null}</Link>
          <Link className={page === "public" ? "active" : ""} aria-current={page === "public" ? "page" : undefined} to="/command/rhen/public">Public</Link>
          <Link className={page === "system" ? "active" : ""} aria-current={page === "system" ? "page" : undefined} to="/command/rhen/system">System</Link>
        </nav>

        <div className="command-v4-account">
          <Link className="terminal-command-link" to="/me">Command</Link>
          <span><StateDot ok={controlFresh && !statusError} />{controlFresh && !statusError ? (observerState.stale ? "STATUS POLLING" : "READ-ONLY STREAM") : "DEGRADED"}</span>
          <button type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <main className="command-v4-main">
        <section className="command-v4-heading">
          <div><span>{pageCopy.eyebrow}</span><h1>{pageCopy.title}</h1><p>{pageCopy.detail}</p></div>
          <div className="command-v4-observation">
            <StateDot ok={controlFresh && !statusError} />
            <div>
              <strong>{displayState(controlObservation.snapshot?.state || (statusError ? "DEGRADED" : "CONNECTING"))}</strong>
              <small>{controlObservation.snapshot?.observed_at ? ageText(controlObservation.snapshot.observed_at, controlObservation.now) : "awaiting canonical observation"}</small>
              <small>Broker snapshot {ageText(statusReceivedAt, controlObservation.now)} · ~5s refresh · equity history 5min</small>
            </div>
            <button type="button" aria-label="Refresh RHEN observations" onClick={() => void refresh()} disabled={refreshing}>{refreshing ? "…" : "↻"}</button>
          </div>
        </section>

        {(statusError || evidenceError || controlObservation.error) && (
          <section className="command-v4-alert">
            <strong>Observation degraded</strong>
            <span>{[statusError, evidenceError, controlObservation.error].filter(Boolean).join(" · ")}</span>
          </section>
        )}

        {page === "operate" && (
          <>
            <section className="command-v4-strip">
              <div><span>ACCOUNT</span><strong>{money(account.equity)}</strong><small>{text(snapshot?.mode, "—").toUpperCase()}</small></div>
              <div><span>DAY P/L</span><strong className={dayPnl !== null && dayPnl < 0 ? "negative" : dayPnl !== null && dayPnl > 0 ? "positive" : ""}>{dayPnl !== null ? (dayPnl >= 0 ? "+" : "") + money(dayPnl) : "—"}</strong><small>broker account</small></div>
              <div><span>POSITIONS</span><strong>{openPositions}</strong><small>{bot.entries_enabled ? "entries enabled" : "entry gate active"}</small></div>
              <div><span>ACTIVE UNIVERSE</span><strong>{Number(activeUniverse).toLocaleString()}</strong><small>{text(snapshot?.universe?.source, "scanner")}</small></div>
              <div><span>RESEARCH</span><strong>{displayState(control?.mode)}</strong><small>{control?.review_required ? "review required" : "bounded automation"}</small></div>
            </section>

            <RhenRealtimePanel state={observerState} />
            {snapshot ? <CommandTradingLanes snapshot={snapshot} /> : <div className="command-v4-empty">Waiting for RHEN trading state.</div>}


            <div className="command-v4-two command-v4-operating-charts">
              <CommandAccountTracker account={account} history={snapshot?.account_history} orders={recentOrders} />
              <CommandPerformance performance={publicFeed?.performance} feedError={publicFeedError} />
            </div>

            <div className="command-v4-two">
              <article className="command-v4-card">
                <header><div><span>OPEN POSITIONS</span><strong>Broker truth</strong></div><small>{openPositions} open</small></header>
                <div className="command-v4-table">
                  {positions.length ? positions.map((row, index) => <div key={text(row.asset_id, text(row.symbol, String(index)))}><strong>{text(row.symbol)}</strong><span>{text(row.qty)} units</span><span>{row.current_price != null ? money(row.current_price) : "—"}</span><b>{text(row.side, "long").toUpperCase()}</b></div>) : <p>Flat.</p>}
                </div>
              </article>
              <article className="command-v4-card">
                <header><div><span>RECENT ORDERS</span><strong>Execution tape</strong></div><small>{recentOrders.length} loaded</small></header>
                <div className="command-v4-table">
                  {recentOrders.length ? recentOrders.slice(0, 12).map((row, index) => <div key={text(row.id, String(index))}><strong>{text(row.symbol)}</strong><span>{text(row.side).toUpperCase()}</span><span>{text(row.status).toUpperCase()}</span><b>{clockTime(row.filled_at || row.submitted_at)}</b></div>) : <p>No recent orders.</p>}
                </div>
              </article>
            </div>
          </>
        )}

        {page === "discover" && (
          <>
            <CommandDiscoveryDeck snapshot={snapshot} control={controlObservation.snapshot} now={controlObservation.now} />
            <RhenRealtimePanel state={observerState} />
            {liveEnabled && <CommandLiveMarket state={liveState} />}
          </>
        )}

        {page === "review" && (
          <div className="command-v4-review-stack">
            <CommandReviewDeck snapshot={controlObservation.snapshot} evidence={evidence} daily={dailyReport} weekly={weeklyReport} researchObservation={liveEnabled ? liveState : null} now={controlObservation.now} />
            <CommandIrenMaintenance session={session} />
          </div>
        )}

        {page === "public" && (
          <div className="command-v4-public">
            <section className="command-v4-strip">
              <div><span>PUBLIC FEED · {publicTransport === "STREAM" ? "PUSH" : "POLL"}</span><strong>{publicFeedError ? "DEGRADED" : displayState(publicFeed?.state || "OBSERVING")}</strong><small>{publicFeed?.generated_at ? ageText(publicFeed.generated_at, Date.now()) : "awaiting source"}</small></div>
              <div><span>PUBLIC RETURN</span><strong>{publicFeed?.performance?.account_return_pct != null ? String(publicFeed.performance.account_return_pct.toFixed(2)) + "%" : "—"}</strong><small>normalized</small></div>
              <div><span>CLOSED TRADES</span><strong>{publicFeed?.performance?.closed_trades ?? "—"}</strong><small>{publicFeed?.performance?.wins ?? "—"} W / {publicFeed?.performance?.losses ?? "—"} L</small></div>
              <div><span>RESEARCH</span><strong>{displayState(publicFeed?.research?.current_status)}</strong><small>{publicFeed?.research?.current_focus || "no public focus"}</small></div>
              <div><span>DISCLOSURE</span><strong>{text(publicFeed?.disclosure?.level, "SANITIZED")}</strong><small>public-safe projection</small></div>
            </section>

            <div className="command-v4-two">
              <CommandPerformance performance={publicFeed?.performance} feedError={publicFeedError} />
              <article className="command-v4-card">
                <header><div><span>PUBLIC SOURCE HEALTH</span><strong>Website truth boundary</strong></div><small>{publicFeed?.generated_at ? clockTime(publicFeed.generated_at) : "—"}</small></header>
                <div className="command-v4-table">
                  <div><strong>RHEN runtime</strong><span>{displayState(publicFeed?.systems?.RHEN?.runtime_state)}</span><span>{displayState(publicFeed?.systems?.RHEN?.health_state)}</span><b>{publicFeed?.systems?.RHEN?.observed_at ? ageText(publicFeed.systems.RHEN.observed_at, Date.now()) : "—"}</b></div>
                  <div><strong>Research</strong><span>{displayState(publicFeed?.research?.current_status)}</span><span>{publicFeed?.research?.active_questions?.length ?? 0} questions</span><b>{publicFeed?.research?.last_updated_at ? ageText(publicFeed.research.last_updated_at, Date.now()) : "—"}</b></div>
                  <div><strong>Performance</strong><span>{displayState(publicFeed?.performance?.status)}</span><span>{displayState(publicFeed?.performance?.sample_state)}</span><b>{publicFeed?.performance?.last_observed_at ? ageText(publicFeed.performance.last_observed_at, Date.now()) : "—"}</b></div>
                  <div><strong>Broker checks</strong><span>{displayState(publicFeed?.broker_reconciliation?.state)}</span><span>{publicFeed?.broker_reconciliation?.checks_2h ?? "—"} / 2h</span><b>{publicFeed?.broker_reconciliation?.last_checked_at ? ageText(publicFeed.broker_reconciliation.last_checked_at, controlObservation.now) : "Awaiting broker check"}</b></div>
                <div><strong>Privacy contract</strong><span>PUBLIC SAFE</span><span>{publicFeed?.disclosure?.public_fields?.length ?? 0} projected fields</span><b>{publicFeed?.disclosure?.excluded_fields?.length ?? 0} excluded</b></div>
                </div>
              </article>
            </div>

            <article className="command-v4-card">
              <header><div><span>RECENT PUBLIC EVENTS</span><strong>Same feed used by anevum.com</strong></div><small>{publicFeed?.events?.length ?? 0} loaded</small></header>
              <div className="command-v4-table">
                {(publicFeed?.events || []).slice(0, 12).map((row, index) => <div key={String(row.at || index)}><strong>{text(row.label, text(row.type, text(row.kind, "Observation")))}</strong><span>RHEN</span><span>{text(row.type, row.kind ? String(row.kind) : "EVENT").toUpperCase()}</span><b>{clockTime(row.at)}</b></div>)}
                {!publicFeed?.events?.length ? <p>No current public runtime events.</p> : null}
              </div>
            </article>
          </div>
        )}

        {page === "system" && (
          <div className="command-v4-system-stack">
            <CommandTopology observation={controlObservation} feed={publicFeed} />
            <CommandOperationsTerminal observation={controlObservation} feed={publicFeed} feedError={publicFeedError} />
          </div>
        )}
      </main>

      <CommandRawLog snapshot={controlObservation.snapshot} feed={publicFeed} tradingSnapshot={snapshot} now={controlObservation.now} />
    </div>
  );
}


