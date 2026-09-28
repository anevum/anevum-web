import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Mark from "../components/Mark";
import RhenMark from "../components/RhenMark";
import UniverseBackground from "../components/UniverseBackground";
import CommandPerformance from "../components/CommandPerformance";
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

export default function Command() {
  const { session, loading, commandAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const commandPage = (() => {
    const segment = location.pathname.split("/")[2];
    return ["overview", "live", "performance", "evidence", "research", "system"].includes(segment)
      ? segment
      : "overview";
  })();
  const [snapshot, setSnapshot] = useState<CommandSnapshot | null>(null);
  const [evidence, setEvidence] = useState<CommandEvidence | null>(null);
  const [dailyReport, setDailyReport] = useState<Record<string, unknown> | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<Record<string, unknown> | null>(null);
  const [researchReadiness, setResearchReadiness] = useState<ResearchReadiness | null>(null);
  const [theoryProgram, setTheoryProgram] = useState<TheoryProgramFeed | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { data: publicFeed, error: publicFeedError } = useLiveTrading(3000);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/", { replace: true });
  }, [signOut, navigate]);

  const refresh = useCallback(async () => {
    if (!session || !commandAdmin) return;
    setRefreshing(true);
    try {
      const [nextSnapshot, nextEvidence, nextReadiness, nextTheory] = await Promise.all([
        fetchCommandStatus(session),
        fetchCommandEvidence(session),
        fetchResearchReadiness().catch(() => null),
        fetchTheoryProgram().catch(() => null)
      ]);
      const [daily, weekly] = await Promise.all([
        fetchCommandDailyReport(session).catch(() => null),
        fetchCommandWeeklyReport(session).catch(() => null)
      ]);
      setSnapshot(nextSnapshot);
      setEvidence(nextEvidence);
      setDailyReport(daily || record(nextEvidence.latest_daily));
      setWeeklyReport(weekly || record(nextEvidence.latest_weekly));
      setResearchReadiness(nextReadiness);
      setTheoryProgram(nextTheory);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Command evidence unavailable.");
    } finally {
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
    return <div className="command-gate"><RhenMark /><span>ANEVUM / RHEN COMMAND</span><h1>Resolving identity.</h1></div>;
  }

  if (!session?.user) {
    return (
      <div className="command-gate">
        <RhenMark />
        <span>ANEVUM / RHEN COMMAND</span>
        <h1>Private operations.</h1>
        <p>Sign in through the private ANEVUM entrance to open Command.</p>
        <Link className="primary-link" to="/private">Private access <b>↗</b></Link>
      </div>
    );
  }

  if (!commandAdmin) {
    return (
      <div className="command-gate">
        <RhenMark />
        <span>ANEVUM / RHEN COMMAND</span>
        <h1>Administrator access required.</h1>
        <p>This RHENLINK is authenticated but is not authorized for the private operations console.</p>
        <Link className="text-link" to="/">Return to ANEVUM <b>→</b></Link>
      </div>
    );
  }

  const account = record(snapshot?.account);
  const bot = record(snapshot?.bot);
  const strategy = record(snapshot?.strategy);
  const market = record(snapshot?.market);
  const positions = list(snapshot?.positions);
  const openOrders = list(snapshot?.open_orders);
  const recentOrders = list(snapshot?.recent_orders);
  const scanner = record(snapshot?.scanner);
  const history = list(snapshot?.history);
  const position = positions[0];
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

  const scanRows = useMemo(() => {
    const preferred = Array.isArray(strategy.scan_symbols)
      ? strategy.scan_symbols.map(String)
      : Object.keys(scanner);
    return preferred
      .filter((symbol) => scanner[symbol])
      .map((symbol) => ({ symbol, row: record(scanner[symbol]) }));
  }, [scanner, strategy.scan_symbols]);

  return (
    <div className={`command-shell command-page-${commandPage}`}>
      <UniverseBackground />
      <header className="command-header">
        <Link to="/" className="command-brand"><Mark /><span>ANEVUM</span><i /><span className="command-rhen-lockup"><RhenMark decorative /><strong>RHEN COMMAND</strong></span></Link>
        <nav aria-label="Command sections">
          <Link className={commandPage === "overview" ? "active" : ""} to="/command/overview">Overview</Link>
          <Link className={commandPage === "live" ? "active" : ""} to="/command/live">Live</Link>
          <Link className={commandPage === "performance" ? "active" : ""} to="/command/performance">Performance</Link>
          <Link className={commandPage === "evidence" ? "active" : ""} to="/command/evidence">Evidence</Link>
          <Link className={commandPage === "research" ? "active" : ""} to="/command/research">Research</Link>
          <Link className={commandPage === "system" ? "active" : ""} to="/command/system">System</Link>
        </nav>
        <div className="command-account">
          <span><i /> READ / LIVE</span>
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
            <p>PRIVATE OPERATIONS / {commandPage.toUpperCase()}</p>
            <h1>{commandPage === "overview" ? "Command" : commandPage.charAt(0).toUpperCase() + commandPage.slice(1)}</h1>
            <span>{commandPage === "overview"
              ? "RHEN at a glance: capital, market state, active strategy, position, and current operating evidence."
              : commandPage === "live"
                ? "Live scanner, orders, broker position, and runtime decisions."
                : commandPage === "performance"
                  ? "Live normalized performance synchronized with the public record, plus private daily and weekly operating evidence."
                  : commandPage === "evidence"
                    ? "Post-event evidence and live-versus-offline comparisons."
                    : commandPage === "research"
                      ? "Canonical research direction, rejected families, open questions, and decisions."
                      : "Telemetry, provenance, runtime health, and Command boundaries."}</span>
          </div>
          <div className="command-connection">
            <i className={bot.bot_armed && bot.execution_authorized && !bot.runtime_paused ? "online" : ""} />
            <div><strong>{text(snapshot?.mode).toUpperCase()} / {bot.bot_armed ? "ARMED" : "DISARMED"}</strong><small>{error || "Updated " + clockTime(snapshot?.observed_at)}</small></div>
            <button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh Command">↻</button>
          </div>
        </section>

        <section className="command-stats command-view-overview command-view-performance">
          <article><span>TOTAL EQUITY</span><strong>{money(account.equity)}</strong><small className={dayPnl && dayPnl > 0 ? "positive" : dayPnl && dayPnl < 0 ? "negative" : ""}>Today {money(account.day_pnl)}</small></article>
          <article><span>CASH</span><strong>{money(account.cash)}</strong><small>Buying power {money(account.buying_power)}</small></article>
          <article><span>MARKET</span><strong>{market.is_open ? "OPEN" : "CLOSED"}</strong><small>{text(latestScan.market_session, "runtime")}</small></article>
          <article><span>RHEN</span><strong>{bot.entries_enabled ? "WATCHING" : "ENTRY LOCK"}</strong><small>{text(strategy.name, "strategy")}</small></article>
          <article><span>POSITION</span><strong>{position ? text(position.symbol) : "FLAT"}</strong><small>{position ? money(position.unrealized_pl) + " / " + percent(position.unrealized_plpc) : "No open position"}</small></article>
        </section>

        <section className="command-grid">
          <div className="command-primary">
            <CommandPerformance performance={publicFeed?.performance} feedError={publicFeedError} />
            <article className="command-panel command-view-overview command-view-live command-panel-scanner">
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

            <article className="command-panel command-view-live command-panel-orders">
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

            <article id="daily" className="command-panel command-evidence-panel command-view-overview command-view-performance command-panel-daily">
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

            <article id="weekly" className="command-panel command-evidence-panel command-view-performance command-panel-weekly">
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

            <article id="post-event" className="command-panel command-evidence-panel command-view-evidence command-panel-post-event">
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
            <article className="command-panel command-view-overview command-view-live command-panel-position">
              <header><div><span>ACTIVE POSITION</span><strong>{position ? text(position.symbol) : "FLAT"}</strong></div><small>Live from broker</small></header>
              {position ? (
                <div className="position-grid">
                  <div><span>MARKET VALUE</span><strong>{money(position.market_value)}</strong></div>
                  <div><span>ENTRY</span><strong>{money(position.avg_entry_price)}</strong></div>
                  <div><span>CURRENT</span><strong>{money(position.current_price)}</strong></div>
                  <div><span>QTY</span><strong>{text(position.qty)}</strong></div>
                  <div className="wide"><span>UNREALIZED P&amp;L</span><strong>{money(position.unrealized_pl)} / {percent(position.unrealized_plpc)}</strong></div>
                </div>
              ) : <div className="command-empty">No open position.</div>}
            </article>

            <article id="telemetry" className="command-panel command-view-overview command-view-system command-panel-telemetry">
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

            <article className="command-panel command-view-live command-panel-feed">
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
              <header><div><span>READ-ONLY BOUNDARY</span><strong>OBSERVATIONAL</strong></div><small>Command</small></header>
              <div className="command-summary-block">
                <span>THIS SURFACE</span>
                <strong>Reads live state and canonical evidence.</strong>
                <p>No strategy parameter, risk, sizing, or research-experiment controls were added.</p>
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
