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
  const segment = pathname.split("/")[2] || "operate";
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
    eyebrow: "GRAEN + VELUM / DISCOVERY",
    title: "Discover",
    detail: "Live research observations, market coverage, opportunity funnel, replay evidence, and bounded discovery progress."
  },
  review: {
    eyebrow: "IREN / DECISION BOUNDARY",
    title: "Review",
    detail: "Only work that needs judgment: new hypotheses, strategy patches, release decisions, and evidence-backed handoffs."
  },
  public: {
    eyebrow: "ANEVUM / PUBLIC PROJECTION",
    title: "Public",
    detail: "Exactly what the public website can see: source freshness, public performance, releases, research state, and privacy-safe telemetry."
  },
  system: {
    eyebrow: "IREN / SYSTEM",
    title: "System",
    detail: "Runtime health, dependencies, work state, incidents, and the raw canonical event stream."
  }
};

function StateDot({ ok }: { ok: boolean }) {
  return <i className={ok ? "is-live" : ""} aria-hidden="true" />;
}

export default function Command() {
  const { session, loading, commandAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const page = routePage(location.pathname);
  const liveEnabled = import.meta.env.VITE_COMMAND_LIVE_STREAM_ENABLED === "true" && Boolean(commandAdmin && session);
  const liveState = useCommandLiveStream(liveEnabled);
  const [snapshot, setSnapshot] = useState<CommandSnapshot | null>(null);
  const [evidence, setEvidence] = useState<CommandEvidence | null>(null);
  const [dailyReport, setDailyReport] = useState<Record<string, unknown> | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<Record<string, unknown> | null>(null);
  const [statusError, setStatusError] = useState("");
  const [evidenceError, setEvidenceError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const refreshInFlight = useRef(false);
  const controlObservation = useCommandObservation(commandAdmin ? session : null, 3000);
  const { data: publicFeed, error: publicFeedError } = useLiveTrading(3000);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/", { replace: true });
  }, [signOut, navigate]);

  const refresh = useCallback(async () => {
    if (!session || !commandAdmin || refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    try {
      const [statusResult, evidenceResult] = await Promise.allSettled([
        fetchCommandStatus(session),
        fetchCommandEvidence(session)
      ]);

      if (statusResult.status === "fulfilled") {
        setSnapshot(statusResult.value);
        setStatusError("");
      } else {
        setStatusError(statusResult.reason instanceof Error ? statusResult.reason.message : "Trading status unavailable.");
      }

      if (evidenceResult.status === "fulfilled") {
        const next = evidenceResult.value;
        setEvidence(next);
        setEvidenceError("");
        const [daily, weekly] = await Promise.all([
          fetchCommandDailyReport(session).catch(() => null),
          fetchCommandWeeklyReport(session).catch(() => null)
        ]);
        setDailyReport(daily || record(next.latest_daily));
        setWeeklyReport(weekly || record(next.latest_weekly));
      } else {
        setEvidenceError(evidenceResult.reason instanceof Error ? evidenceResult.reason.message : "Evidence unavailable.");
      }
    } finally {
      refreshInFlight.current = false;
      setRefreshing(false);
    }
  }, [session, commandAdmin]);

  useEffect(() => {
    if (!session || !commandAdmin) return;
    void refresh();
    // 4.4 REST is a degraded research diagnostic. Prices/candles use one live observation socket.
    const timer = window.setInterval(refresh, liveEnabled ? 60000 : 5000);
    return () => window.clearInterval(timer);
  }, [session, commandAdmin, refresh, liveEnabled]);

  if (loading) {
    return <div className="command-gate"><SystemIcon system="IREN" size="lg" /><span>ANEVUM / COMMAND</span><h1>Resolving identity.</h1></div>;
  }

  if (!session?.user) {
    return <div className="command-gate"><SystemIcon system="IREN" size="lg" /><span>ANEVUM / COMMAND</span><h1>Private operations.</h1><p>Sign in through the private ANEVUM entrance to open Command.</p><Link className="primary-link" to="/private">Private access <b>↗</b></Link></div>;
  }

  if (!commandAdmin) {
    return <div className="command-gate"><SystemIcon system="IREN" size="lg" /><span>ANEVUM / COMMAND</span><h1>Administrator access required.</h1><p>This identity is authenticated but is not authorized for the operations console.</p><Link className="text-link" to="/">Return to ANEVUM <b>→</b></Link></div>;
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
    <div className={"command-shell command-v4 command-v4-" + page}>
      <header className="command-v4-header">
        <Link className="command-v4-brand" to="/command/operate">
          <SystemIcon system="IREN" size="sm" />
          <span>ANEVUM</span>
          <i />
          <strong>COMMAND</strong>
        </Link>

        <nav aria-label="Command workspaces">
          <Link className={page === "operate" ? "active" : ""} aria-current={page === "operate" ? "page" : undefined} to="/command/operate">Operate</Link>
          <Link className={page === "discover" ? "active" : ""} aria-current={page === "discover" ? "page" : undefined} to="/command/discover">Discover</Link>
          <Link className={page === "review" ? "active" : ""} aria-current={page === "review" ? "page" : undefined} to="/command/review">Review{control?.review_required ? <b /> : null}</Link>
          <Link className={page === "public" ? "active" : ""} aria-current={page === "public" ? "page" : undefined} to="/command/public">Public</Link>
          <Link className={page === "system" ? "active" : ""} aria-current={page === "system" ? "page" : undefined} to="/command/system">System</Link>
        </nav>

        <div className="command-v4-account">
          <span><StateDot ok={controlFresh && !statusError} />{controlFresh && !statusError ? "LIVE" : "DEGRADED"}</span>
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
            </div>
            <button type="button" onClick={() => void refresh()} disabled={refreshing}>{refreshing ? "…" : "↻"}</button>
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
          <>
            <section className="command-v4-strip">
              <div><span>PUBLIC FEED</span><strong>{publicFeedError ? "DEGRADED" : displayState(publicFeed?.state || "OBSERVING")}</strong><small>{publicFeed?.generated_at ? ageText(publicFeed.generated_at, Date.now()) : "awaiting source"}</small></div>
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
          </>
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
