import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Mark from "../components/Mark";
import SystemIcon from "../components/company/SystemIcon";
import UniverseBackground from "../components/UniverseBackground";
import CommandPerformance from "../components/CommandPerformance";
import CommandAccountTracker from "../components/CommandAccountTracker";
import CommandTopology from "../components/CommandTopology";
import CommandIrenDock from "../components/CommandIrenDock";
import CommandOperationsTerminal from "../components/CommandOperationsTerminal";
import CommandStrategyPipeline from "../components/CommandStrategyPipeline";
import CommandRawLog from "../components/CommandRawLog";
import CommandTradingLanes from "../components/CommandTradingLanes";
import { useCommandObservation } from "../hooks/useCommandObservation";
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

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function list(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function text(value: unknown, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function number(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function shortSha(value: unknown) {
  const raw = text(value, "");
  return raw ? raw.slice(0, 10) : "—";
}

function arrayText(value: unknown) {
  return Array.isArray(value) && value.length ? value.map(String).join(", ") : "—";
}

function CommandNavGlyph({ kind }: { kind: "overview" | "trading" | "research" | "system" }) {
  if (kind === "overview") {
    return (
      <svg className="command-nav-glyph" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="6" height="6" rx="1.4" />
        <rect x="14" y="4" width="6" height="6" rx="1.4" />
        <rect x="4" y="14" width="6" height="6" rx="1.4" />
        <rect x="14" y="14" width="6" height="6" rx="1.4" />
      </svg>
    );
  }
  if (kind === "trading") {
    return (
      <svg className="command-nav-glyph" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 17l4-5 4 3 7-9" />
        <path d="M15 6h4v4" />
      </svg>
    );
  }
  if (kind === "research") {
    return (
      <svg className="command-nav-glyph" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="9" r="4" />
        <path d="M12 12l7 7M15 5h4M17 3v4" />
      </svg>
    );
  }
  return (
    <svg className="command-nav-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="4" rx="1.4" />
      <rect x="4" y="10" width="16" height="4" rx="1.4" />
      <rect x="4" y="15" width="16" height="4" rx="1.4" />
      <circle cx="7" cy="7" r=".8" className="command-nav-glyph-dot" />
      <circle cx="7" cy="12" r=".8" className="command-nav-glyph-dot" />
      <circle cx="7" cy="17" r=".8" className="command-nav-glyph-dot" />
    </svg>
  );
}

export default function Command() {
  const { session, loading, commandAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const commandPage = (() => {
    const segment = location.pathname.split("/")[2] || "overview";
    if (["trading", "live", "performance", "evidence", "rhen"].includes(segment)) return "trading";
    if (["research", "graen", "nostra", "velum"].includes(segment)) return "research";
    if (["system", "terminal", "infrastructure", "iren"].includes(segment)) return "system";
    return "overview";
  })();
  const viewPage = commandPage;
  const [snapshot, setSnapshot] = useState<CommandSnapshot | null>(null);
  const [evidence, setEvidence] = useState<CommandEvidence | null>(null);
  const [dailyReport, setDailyReport] = useState<Record<string, unknown> | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<Record<string, unknown> | null>(null);
  const [researchReadiness, setResearchReadiness] = useState<ResearchReadiness | null>(null);
  const [theoryProgram, setTheoryProgram] = useState<TheoryProgramFeed | null>(null);
  const [statusError, setStatusError] = useState("");
  const [evidenceError, setEvidenceError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const refreshInFlight = useRef(false);
  const commandObservation = useCommandObservation(commandAdmin ? session : null, 3000);
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
      const [statusResult, evidenceResult, readinessResult, theoryResult] = await Promise.allSettled([
        fetchCommandStatus(session),
        fetchCommandEvidence(session),
        fetchResearchReadiness(),
        fetchTheoryProgram()
      ]);

      if (statusResult.status === "fulfilled") {
        setSnapshot(statusResult.value);
        setStatusError("");
      } else {
        setStatusError(
          statusResult.reason instanceof Error
            ? statusResult.reason.message
            : "Live status unavailable."
        );
      }

      if (evidenceResult.status === "fulfilled") {
        const nextEvidence = evidenceResult.value;
        setEvidence(nextEvidence);
        setEvidenceError("");

        const [daily, weekly] = await Promise.all([
          fetchCommandDailyReport(session).catch(() => null),
          fetchCommandWeeklyReport(session).catch(() => null)
        ]);
        setDailyReport(daily || record(nextEvidence.latest_daily));
        setWeeklyReport(weekly || record(nextEvidence.latest_weekly));
      } else {
        setEvidenceError(
          evidenceResult.reason instanceof Error
            ? evidenceResult.reason.message
            : "Command evidence unavailable."
        );
      }

      setResearchReadiness(
        readinessResult.status === "fulfilled" ? readinessResult.value : null
      );
      setTheoryProgram(
        theoryResult.status === "fulfilled" ? theoryResult.value : null
      );
    } finally {
      refreshInFlight.current = false;
      setRefreshing(false);
    }
  }, [session, commandAdmin]);

  useEffect(() => {
    if (!session || !commandAdmin) return;
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [session, commandAdmin, refresh]);

  if (loading) {
    return <div className="command-gate"><SystemIcon system="IREN" size="lg" /><span>ANEVUM / COMMAND</span><h1>Resolving identity.</h1></div>;
  }

  if (!session?.user) {
    return (
      <div className="command-gate">
        <SystemIcon system="IREN" size="lg" />
        <span>ANEVUM / COMMAND</span>
        <h1>Private operations.</h1>
        <p>Sign in through the private ANEVUM entrance to open Command.</p>
        <Link className="primary-link" to="/private">Private access <b>↗</b></Link>
      </div>
    );
  }

  if (!commandAdmin) {
    return (
      <div className="command-gate">
        <SystemIcon system="IREN" size="lg" />
        <span>ANEVUM / COMMAND</span>
        <h1>Administrator access required.</h1>
        <p>This identity is authenticated but is not authorized for the private operations console.</p>
        <Link className="text-link" to="/">Return to ANEVUM <b>→</b></Link>
      </div>
    );
  }

  const account = record(snapshot?.account);
  const accountHistory = snapshot?.account_history || null;
  const bot = record(snapshot?.bot);
  const strategy = record(snapshot?.strategy);
  const market = record(snapshot?.market);
  const positions = list(snapshot?.positions);
  const openOrders = list(snapshot?.open_orders);
  const recentOrders = list(snapshot?.recent_orders);
  const scanner = record(snapshot?.scanner);
  const history = list(snapshot?.history);
  const dayPnl = number(account.day_pnl);

  const runtime = record(evidence?.provenance?.runtime);
  const latestScan = record(evidence?.provenance?.latest_scan_cycle);
  const health = record(evidence?.telemetry_health);
  const daily = dailyReport || record(evidence?.latest_daily);
  const weekly = weeklyReport || record(evidence?.latest_weekly);
  const dailyMetrics = record(daily.metrics);
  const dailyClass = record(daily.classification);
  const dailyForward = record(daily.candidate_forward_evidence);
  const dailyForwardStatus = record(dailyForward.status);
  const dailyConsistency = record(daily.live_vs_offline_consistency);
  const weeklyEvidenceStability = record(weekly.evidence_stability);
  const confirmedFacts = list(weeklyEvidenceStability.confirmed_facts);
  const includedWeeklySessions = Array.isArray(weekly.included_trading_sessions)
    ? weekly.included_trading_sessions
    : Array.isArray(weekly.included_sessions)
      ? weekly.included_sessions
      : [];
  const missingWeeklySessions = Array.isArray(weekly.missing_trading_sessions)
    ? weekly.missing_trading_sessions
    : Array.isArray(weekly.missing_sessions)
      ? weekly.missing_sessions
      : [];
  const expectedWeeklySessions = Array.isArray(weekly.expected_trading_sessions)
    ? weekly.expected_trading_sessions
    : Array.isArray(weekly.expected_sessions)
      ? weekly.expected_sessions
      : [];
  const weeklyWarnings = Array.isArray(weekly.warnings) ? weekly.warnings.map(String) : [];
  const weeklyQuestions = evidence?.research_questions || list(weekly.research_questions);
  const weeklyDecisions = evidence?.weekly_decisions || list(weekly.decisions);
  const researchDecisions = evidence?.research_decisions || [];
  const nextResearch = researchDecisions.find((row) => row.decision_type === "next_research_direction");
  const rejectedResearch = researchDecisions.filter((row) => row.decision_type === "terminal_rejection");
  const forwardRows = evidence?.post_event_evidence?.forward_outcomes || [];
  const comparisonRows = evidence?.post_event_evidence?.live_offline || [];
  const maxForwardCount = Math.max(1, ...forwardRows.map((row) => number(row.count) || 0));
  const maxComparisonCount = Math.max(1, ...comparisonRows.map((row) => number(row.count) || 0));
  const dailyWins = Math.max(0, number(dailyMetrics.wins) || 0);
  const dailyLosses = Math.max(0, number(dailyMetrics.losses) || 0);
  const dailyClosed = Math.max(1, dailyWins + dailyLosses);
  const readinessState = text(researchReadiness?.state, "UNAVAILABLE").toUpperCase();
  const readinessBlockers = researchReadiness?.blockers || [];
  const readinessLimitations = researchReadiness?.limitations || [];
  const readinessMonitors = researchReadiness?.monitors || [];
  const gptReady = researchReadiness?.gpt_would_run_now === true;
  const theoryProblem =
    theoryProgram?.problems.find((row) => row.problem_id === theoryProgram.program.current_problem_id) ||
    [...(theoryProgram?.problems || [])].reverse().find((row) => row.status === "ACTIVE") ||
    theoryProgram?.problems[0];
  const theoryConjectures = theoryProblem?.conjectures || [];
  const openTheoryConjectures = theoryConjectures.filter((row) => row.status === "OPEN");

  const scanRows = (() => {
    const preferred = Array.isArray(strategy.scan_symbols)
      ? strategy.scan_symbols.map(String)
      : Object.keys(scanner);
    return preferred
      .filter((symbol) => scanner[symbol])
      .map((symbol) => ({ symbol, row: record(scanner[symbol]) }));
  })();

  const irenConnection = commandObservation.error
    ? commandObservation.snapshot ? "DEGRADED" : "OFFLINE"
    : commandObservation.snapshot?.stale
      ? "DEGRADED"
      : commandObservation.snapshot
        ? "LIVE"
        : "CONNECTING";
  const executionState = bot.runtime_paused
    ? "PAUSED"
    : bot.bot_armed
      ? "ARMED"
      : snapshot
        ? "DISARMED"
        : "WAITING";
  const connectionTitle = irenConnection === "LIVE" && snapshot
    ? text(snapshot.mode, "RHEN").toUpperCase() + " / " + executionState
    : "IREN / " + irenConnection;
  const connectionDetail = irenConnection === "OFFLINE"
    ? commandObservation.error || "Canonical IREN state is unavailable."
    : irenConnection === "DEGRADED"
      ? commandObservation.error || "Canonical IREN state is stale."
      : statusError
        ? "Trading status degraded · " + statusError
        : evidenceError
          ? "Trading live · evidence degraded"
          : snapshot
            ? "RHEN updated " + clockTime(snapshot.observed_at)
            : irenConnection === "LIVE"
              ? "IREN live · RHEN account state pending"
              : "Resolving canonical runtime state…";

  const pageTitle = commandPage === "overview"
    ? "Command"
    : commandPage.charAt(0).toUpperCase() + commandPage.slice(1);
  const pageDescription = commandPage === "overview"
    ? "Mission control: account state, live work, incidents, and the system's current operating picture."
    : commandPage === "trading"
      ? "Broker account, performance, positions, scanner decisions, orders, fills, exposure, and execution state."
      : commandPage === "research"
        ? "GRAEN, NOSTRA, and VELUM in one workspace: hypotheses, evidence, replay, forecasts, validation, and research decisions."
        : "IREN, RHEN runtime health, infrastructure, dependencies, telemetry, versions, and diagnostics.";

  return (
    <div className={`command-shell command-page-${viewPage}`}>
      <UniverseBackground />
      <header className="command-header">
        <Link to="/" className="command-brand"><Mark /><span>ANEVUM</span><i /><span className="command-rhen-lockup"><SystemIcon system="IREN" size="xs" /><strong>COMMAND</strong></span></Link>
        <nav aria-label="Command workspaces">
          <Link className={commandPage === "overview" ? "active" : ""} to="/command/overview" aria-label="Overview" title="Overview" aria-current={commandPage === "overview" ? "page" : undefined}>
            <CommandNavGlyph kind="overview" /><span className="command-nav-label">Overview</span>
          </Link>
          <Link className={commandPage === "trading" ? "active" : ""} to="/command/trading" aria-label="Trading" title="Trading" aria-current={commandPage === "trading" ? "page" : undefined}>
            <CommandNavGlyph kind="trading" /><span className="command-nav-label">Trading</span>
          </Link>
          <Link className={commandPage === "research" ? "active" : ""} to="/command/research" aria-label="Research" title="Research" aria-current={commandPage === "research" ? "page" : undefined}>
            <CommandNavGlyph kind="research" /><span className="command-nav-label">Research</span>
          </Link>
          <Link className={commandPage === "system" ? "active" : ""} to="/command/system" aria-label="System" title="System" aria-current={commandPage === "system" ? "page" : undefined}>
            <CommandNavGlyph kind="system" /><span className="command-nav-label">System</span>
          </Link>
        </nav>
        <div className="command-account">
          <span><i /> COMMAND / AUTHENTICATED</span>
          <small>{session.user.email}</small>
          <div className="command-account-actions">
            <Link to="/" title="Return to public ANEVUM">Public</Link>
            <button type="button" onClick={handleSignOut} title="Sign out of Command">Sign out</button>
          </div>
        </div>
      </header>

      <main className="command-main">
        <section id="live" className="command-hero">
          <div>
            <p>PRIVATE OPERATIONS / {pageTitle.toUpperCase()}</p>
            <h1>{pageTitle}</h1>
            <span>{pageDescription}</span>
          </div>
          <div className="command-connection">
            <i className={irenConnection === "LIVE" ? "online" : ""} />
            <div>
              <strong>{connectionTitle}</strong>
              <small>{connectionDetail}</small>
            </div>
            <button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh Command">↻</button>
          </div>
        </section>

        <section className="command-stats command-view-overview command-view-trading">
          <article><span>TOTAL EQUITY</span><strong>{money(account.equity)}</strong><small className={dayPnl && dayPnl > 0 ? "positive" : dayPnl && dayPnl < 0 ? "negative" : ""}>Today {money(account.day_pnl)}</small></article>
          <article><span>CASH</span><strong>{money(account.cash)}</strong><small>Buying power {money(account.buying_power)}</small></article>
          <article><span>MARKET</span><strong>{market.is_open ? "OPEN" : "CLOSED"}</strong><small>{text(latestScan.market_session, "runtime")}</small></article>
          <article><span>RHEN</span><strong>{bot.entries_enabled ? "WATCHING" : "ENTRY LOCK"}</strong><small>{text(strategy.name, "strategy")}</small></article>
          <article><span>POSITIONS</span><strong>{positions.length ? positions.length + " OPEN" : "FLAT"}</strong><small>{positions.length ? positions.slice(0, 3).map((row) => text(row.symbol)).join(" · ") : "No open position"}</small></article>
        </section>

        <section className="command-grid">
          <div className="command-primary">
            {commandPage === "overview" || commandPage === "system"
              ? <CommandTopology observation={commandObservation} feed={publicFeedError ? null : publicFeed} />
              : null}
            {commandPage === "system"
              ? <CommandOperationsTerminal observation={commandObservation} feed={publicFeedError ? null : publicFeed} feedError={publicFeedError} />
              : null}
            {commandPage === "overview" || commandPage === "research"
              ? <CommandStrategyPipeline snapshot={commandObservation.snapshot} now={commandObservation.now} />
              : null}
            <CommandAccountTracker account={account} history={accountHistory} orders={recentOrders} />
            <CommandPerformance performance={publicFeed?.performance} feedError={publicFeedError} />
            {(commandPage === "overview" || commandPage === "trading") && snapshot
              ? <CommandTradingLanes snapshot={snapshot} />
              : null}
            <article className="command-panel command-view-trading command-panel-scanner">
              <header><div><span>LIVE SCANNER</span><strong>{scanRows.length} symbols observed in runtime snapshot</strong></div><small>{clockTime(bot.last_strategy_at)}</small></header>
              <div className="scanner-head"><span>SYMBOL</span><span>PRICE</span><span>ACTION</span><span>REASON</span></div>
              <div className="scanner-body">
                {scanRows.length ? scanRows.map(({ symbol, row }) => {
                  const meta = record(row.metadata);
                  return (
                    <div className={"scanner-row " + (row.action === "buy" ? "qualified" : "")} key={symbol}>
                      <strong>{symbol}</strong><span>{money(meta.current_close)}</span>
                      <b>{text(row.action, "hold").toUpperCase()}</b><p>{text(row.reason, "waiting")}</p>
                    </div>
                  );
                }) : <div className="command-empty">No current runtime scanner rows. Durable scan-cycle status is shown under Telemetry.</div>}
              </div>
            </article>

            <article className="command-panel command-view-trading command-panel-orders">
              <header><div><span>ORDER TAPE</span><strong>{openOrders.length} open / {recentOrders.length} recent</strong></div><small>Private broker telemetry</small></header>
              <div className="order-body">
                {recentOrders.length ? recentOrders.slice(0, 12).map((order, index) => (
                  <div className="order-row" key={text(order.id, String(index))}>
                    <time>{clockTime(order.filled_at || order.submitted_at)}</time>
                    <strong>{text(order.symbol)}</strong><span>{text(order.side).toUpperCase()}</span>
                    <span>{text(order.status).toUpperCase()}</span><b>{order.filled_avg_price ? money(order.filled_avg_price) : "—"}</b>
                  </div>
                )) : <div className="command-empty">No recent RHEN orders.</div>}
              </div>
            </article>

            <article id="daily" className="command-panel command-evidence-panel command-view-research command-panel-daily">
              <header><div><span>CANONICAL DAILY REPORT</span><strong>{text(daily.session, "No daily report")}</strong></div><small>{text(daily.report_version)}</small></header>
              {Object.keys(daily).length ? (
                <>
                  <div className="command-metric-grid">
                    <div><span>CLASSIFICATION</span><strong>{text(dailyClass.classification)}</strong></div>
                    <div><span>TRADES</span><strong>{text(dailyMetrics.trade_count)}</strong></div>
                    <div><span>W / L</span><strong>{text(dailyMetrics.wins)} / {text(dailyMetrics.losses)}</strong></div>
                    <div><span>EXPECTANCY</span><strong>{money(dailyMetrics.expectancy)}</strong></div>
                    <div><span>PROFIT FACTOR</span><strong>{text(dailyMetrics.profit_factor)}</strong></div>
                    <div><span>AVG MFE / MAE</span><strong>{text(dailyMetrics.average_mfe_pct)}% / {text(dailyMetrics.average_mae_pct)}%</strong></div>
                  </div>
                  <div className="command-outcome-viz" aria-label={dailyWins + " wins and " + dailyLosses + " losses"}>
                    <div><span>WINS</span><strong>{dailyWins}</strong></div>
                    <div className="command-outcome-track">
                      <i className="wins" style={{ width: ((dailyWins / dailyClosed) * 100) + "%" }} />
                      <i className="losses" style={{ width: ((dailyLosses / dailyClosed) * 100) + "%" }} />
                    </div>
                    <div><strong>{dailyLosses}</strong><span>LOSSES</span></div>
                  </div>
                  <div className="command-summary-block">
                    <span>FINDING</span><strong>{text(dailyClass.reason || daily.summary)}</strong>
                    <p>{text(daily.next_offline_research_action, "No next daily research action recorded.")}</p>
                  </div>
                  <div className="command-metric-grid compact">
                    <div><span>FORWARD COMPLETE</span><strong>{text(dailyForwardStatus.complete_rows)}</strong></div>
                    <div><span>FORWARD INCOMPLETE</span><strong>{text(dailyForwardStatus.incomplete_rows)}</strong></div>
                    <div><span>COMPARISON METHOD</span><strong>{text(dailyConsistency.methodology)}</strong></div>
                    <div><span>POST-EVENT ONLY</span><strong>{dailyConsistency.post_event_only === true ? "YES" : "—"}</strong></div>
                  </div>
                  <div className="command-warning-list">
                    {(Array.isArray(daily.data_quality_warnings) ? daily.data_quality_warnings : []).map((warning, index) => <p key={index}>{String(warning)}</p>)}
                  </div>
                </>
              ) : <div className="command-empty">No canonical daily report is available.</div>}
            </article>

            <article id="weekly" className="command-panel command-evidence-panel command-view-research command-panel-weekly">
              <header><div><span>CANONICAL WEEKLY REPORT</span><strong>{text(weekly.completeness_state, "No weekly report")}</strong></div><small>{text(weekly.report_version)}</small></header>
              {Object.keys(weekly).length ? (
                <>
                  <div className="command-metric-grid">
                    <div><span>PERIOD</span><strong>{text(weekly.period_start)} → {text(weekly.period_end)}</strong></div>
                    <div><span>INCLUDED</span><strong>{includedWeeklySessions.length}</strong></div>
                    <div><span>MISSING</span><strong>{missingWeeklySessions.length}</strong></div>
                    <div><span>EXPECTED</span><strong>{expectedWeeklySessions.length}</strong></div>
                    <div><span>INCLUDED SESSIONS</span><strong>{arrayText(includedWeeklySessions)}</strong></div>
                    <div><span>MISSING SESSIONS</span><strong>{arrayText(missingWeeklySessions)}</strong></div>
                    <div><span>REPORT KEY</span><strong>{text(weekly.report_key)}</strong></div>
                  </div>
                  <div className="command-fact-list">
                    {confirmedFacts.map((fact, index) => <p key={index}><b>{text(fact.fact)}</b><span>{text(fact.value)}</span></p>)}
                  </div>
                  <div className="command-warning-list">{weeklyWarnings.map((warning, index) => <p key={index}>{warning}</p>)}</div>
                </>
              ) : <div className="command-empty">No canonical weekly report is available.</div>}
            </article>

            <article id="post-event" className="command-panel command-evidence-panel command-view-research command-panel-post-event">
              <header><div><span>POST-EVENT EVIDENCE</span><strong>{evidence?.post_event_evidence?.analytics_only ? "ANALYTICS ONLY" : "UNAVAILABLE"}</strong></div><small>{text(evidence?.evidence_version)}</small></header>
              <div className="command-two-column">
                <div>
                  <span className="command-subhead">CANDIDATE FORWARD OUTCOMES</span>
                  {forwardRows.length ? forwardRows.map((row, index) => (
                    <div className="command-evidence-bar-row" key={index}>
                      <p className="command-evidence-row"><b>{text(row.horizon_minutes)}M</b><span>{text(row.status)}</span><strong>{text(row.count)}</strong></p>
                      <div className="command-evidence-track"><i style={{ width: (((number(row.count) || 0) / maxForwardCount) * 100) + "%" }} /></div>
                    </div>
                  )) : <p className="command-empty">No forward-outcome summary.</p>}
                </div>
                <div>
                  <span className="command-subhead">LIVE VS. OFFLINE</span>
                  {comparisonRows.length ? comparisonRows.map((row, index) => (
                    <div className="command-evidence-bar-row" key={index}>
                      <p className="command-evidence-row"><b>{text(row.session)}</b><span>{text(row.match_state)}</span><strong>{text(row.count)}</strong></p>
                      <div className="command-evidence-track"><i style={{ width: (((number(row.count) || 0) / maxComparisonCount) * 100) + "%" }} /></div>
                    </div>
                  )) : <p className="command-empty">No comparison summary.</p>}
                </div>
              </div>
            </article>

            <article id="research" className="command-panel command-evidence-panel command-view-research command-panel-research">
              <header><div><span>RESEARCH STATE</span><strong>{readinessState}</strong></div><small>{gptReady ? "GPT READY" : "GPT HELD"}</small></header>
              <div className="command-metric-grid compact">
                <div><span>READINESS</span><strong>{readinessState}</strong></div>
                <div><span>GPT NOW</span><strong>{gptReady ? "RUN" : "HOLD"}</strong></div>
                <div><span>ACTIVE BLOCKERS</span><strong>{researchReadiness?.blocker_count ?? "—"}</strong></div>
                <div><span>KNOWN LIMITATIONS</span><strong>{researchReadiness?.limitation_count ?? "—"}</strong></div>
                <div><span>MONITORS</span><strong>{researchReadiness?.monitor_count ?? "—"}</strong></div>
                <div><span>READY QUESTIONS</span><strong>{researchReadiness?.ready_strategy_question_count ?? "—"}</strong></div>
                <div><span>WAITING QUESTIONS</span><strong>{researchReadiness?.waiting_strategy_question_count ?? "—"}</strong></div>
                <div><span>WAITING ON</span><strong>{arrayText(researchReadiness?.waiting_requirements)}</strong></div>
                <div><span>EVIDENCE SESSION</span><strong>{text(researchReadiness?.trigger_reference)}</strong></div>
                <div><span>EVIDENCE CUTOFF</span><strong>{clockTime(researchReadiness?.evidence_cutoff)}</strong></div>
              </div>
              <div className="command-warning-list">
                {readinessBlockers.map((row, index) => (
                  <p key={"blocker-" + index}><b>BLOCKER / {text(row.code).toUpperCase()}</b> · {arrayText(row.reason_codes)}</p>
                ))}
                {readinessLimitations.map((row, index) => (
                  <p key={"limitation-" + index}><b>LIMITATION / {text(row.code).toUpperCase()}</b> · {arrayText(row.reason_codes)}</p>
                ))}
                {readinessMonitors.map((row, index) => (
                  <p key={"monitor-" + index}><b>MONITOR / {text(row.code).toUpperCase()}</b> · {arrayText(row.reason_codes)}</p>
                ))}
                {!readinessBlockers.length && !readinessLimitations.length && !readinessMonitors.length ? (
                  <p>{gptReady ? "No deterministic blocker is preventing semantic review." : "No readiness details are currently available."}</p>
                ) : null}
              </div>
              <div className="command-summary-block">
                <span>NEXT EXPERIMENT</span>
                <strong>{text(nextResearch?.conclusion, "No canonical next-direction decision.")}</strong>
                <p>Experiment execution is not available from Command in this task.</p>
              </div>
              <div className="command-two-column">
                <div>
                  <span className="command-subhead">MATHEMATICS &amp; THEORY</span>
                  <div className="command-list-item">
                    <strong>{text(theoryProblem?.problem_id)} · {text(theoryProblem?.title)}</strong>
                    <p>{text(theoryProblem?.question, "Canonical theory registry unavailable.")}</p>
                    <small>Registry {theoryProgram?.registry_hash ? theoryProgram.registry_hash.slice(0, 12) : "—"} · Production authority: NONE</small>
                  </div>
                </div>
                <div>
                  <span className="command-subhead">OPEN CONJECTURES</span>
                  {openTheoryConjectures.length ? openTheoryConjectures.map((row) => (
                    <div className="command-list-item" key={row.conjecture_id}>
                      <strong>{row.conjecture_id} · {row.title}</strong>
                      <p>{row.statement}</p>
                      <small>Novelty: {row.novelty_state} · Status: {row.status}</small>
                    </div>
                  )) : <div className="command-empty">No open theory conjectures are recorded.</div>}
                </div>
              </div>
              <div className="command-two-column">
                <div>
                  <span className="command-subhead">PERMANENTLY REJECTED RESEARCH</span>
                  {rejectedResearch.length ? rejectedResearch.map((row, index) => (
                    <div className="command-list-item" key={index}><strong>{text(row.subject)}</strong><p>{text(row.conclusion)}</p></div>
                  )) : <div className="command-empty">No terminal research decision recorded.</div>}
                </div>
                <div>
                  <span className="command-subhead">OPEN / MONITOR QUESTIONS</span>
                  {weeklyQuestions.length ? weeklyQuestions.map((row, index) => (
                    <div className="command-list-item" key={index}><strong>{text(row.research_question_id || row.status)}</strong><p>{text(row.question)}</p></div>
                  )) : <div className="command-empty">No active research questions.</div>}
                </div>
              </div>
              <div className="command-list-stack">
                <span className="command-subhead">WEEKLY DECISIONS</span>
                {weeklyDecisions.map((row, index) => (
                  <div className="command-list-item" key={index}><strong>{text(row.decision_key)}</strong><p>{text(row.decision)}</p><small>Production behavior changed: {row.production_behavior_changed === true ? "YES" : "NO"}</small></div>
                ))}
              </div>
            </article>
          </div>

          <aside className="command-side">
            <article className="command-panel command-view-trading command-panel-position">
              <header><div><span>ACTIVE POSITIONS</span><strong>{positions.length ? positions.length + " OPEN" : "FLAT"}</strong></div><small>Live from broker</small></header>
              {positions.length ? (
                <div className="position-list">
                  {positions.map((row, index) => (
                    <div className="position-row" key={text(row.symbol, String(index))}>
                      <div><span>SYMBOL</span><strong>{text(row.symbol)}</strong></div>
                      <div><span>QTY</span><strong>{text(row.qty)}</strong></div>
                      <div><span>ENTRY</span><strong>{money(row.avg_entry_price)}</strong></div>
                      <div><span>CURRENT</span><strong>{money(row.current_price)}</strong></div>
                      <div><span>VALUE</span><strong>{money(row.market_value)}</strong></div>
                      <div><span>UNREALIZED P&amp;L</span><strong className={(number(row.unrealized_pl) || 0) > 0 ? "positive" : (number(row.unrealized_pl) || 0) < 0 ? "negative" : ""}>{money(row.unrealized_pl)} / {percent(row.unrealized_plpc)}</strong></div>
                    </div>
                  ))}
                </div>
              ) : <div className="command-empty">No open positions.</div>}
            </article>

            <article id="telemetry" className="command-panel command-view-system command-panel-telemetry">
              <header><div><span>TELEMETRY + PROVENANCE</span><strong>{text(runtime.system_version, "RHEN")}</strong></div><small>{text(evidence?.generated_at)}</small></header>
              <div className="system-grid">
                <div><span>RUN</span><strong>{text(runtime.run_id)}</strong></div>
                <div><span>STRATEGY</span><strong>{text(runtime.strategy_version_id)}</strong></div>
                <div><span>DEPLOYMENT</span><strong>{text(runtime.deployment_id)}</strong></div>
                <div><span>GIT</span><strong>{shortSha(runtime.git_commit)}</strong></div>
                <div><span>RUNTIME</span><strong>{text(runtime.runtime_instance_id)}</strong></div>
                <div><span>LATEST SCAN</span><strong>{text(latestScan.scan_cycle_id)}</strong></div>
                <div><span>SCAN OUTCOME</span><strong>{text(latestScan.cycle_outcome)}</strong></div>
                <div><span>DATA STATUS</span><strong>{text(latestScan.data_status)}</strong></div>
                <div><span>EVENTS / 24H</span><strong>{text(health.events_24h)}</strong></div>
                <div><span>RUNTIME ERRORS / 24H</span><strong>{text(health.runtime_errors_24h)}</strong></div>
              </div>
            </article>

            <article className="command-panel command-view-overview command-panel-feed">
              <header><div><span>LIVE FEED</span><strong>Recent runtime decisions</strong></div><small>Process state</small></header>
              <div className="feed-body">
                {history.length ? history.slice(0, 16).map((item, index) => (
                  <div className="feed-row" key={text(item.at, String(index))}>
                    <time>{clockTime(item.at)}</time>
                    <div><strong>{text(item.symbol || item.kind, "RHEN")}</strong><span>{text(item.action, "decision").toUpperCase()}</span></div>
                    <p>{text(item.reason || item.message, "Recorded")}</p>
                  </div>
                )) : <div className="command-empty">No runtime decisions recorded in this process.</div>}
              </div>
            </article>

            <article className="command-panel command-view-system command-panel-boundary">
              <header><div><span>OPERATOR BOUNDARY</span><strong>PROTECTED</strong></div><small>Command + IREN</small></header>
              <div className="command-summary-block">
                <span>THIS SURFACE</span>
                <strong>Reads canonical state and submits durable work through IREN.</strong>
                <p>Protected actions remain gated. Command does not bypass RHEN risk, strategy, broker, or execution authority.</p>
              </div>
            </article>
          </aside>
        </section>
      </main>
      <CommandRawLog snapshot={commandObservation.snapshot} feed={publicFeedError ? null : publicFeed} tradingSnapshot={snapshot} now={commandObservation.now} />
      <CommandIrenDock session={session} />
    </div>
  );
}
