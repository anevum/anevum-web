import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SystemIcon from "../components/company/SystemIcon";
import { SystemStatusChip } from "../components/operations/VisualOps";
import { useLiveTrading } from "../hooks/useLiveTrading";
import {
  IDENTITY,
  MODULE_LABEL,
  SYSTEMS,
  ageText,
  displayState,
  fleetState,
  publicSystem,
  stateTone,
  type SystemName
} from "../lib/system-display";
import "../styles/public-terminal.css";

type TerminalFilter = "ALL" | SystemName;
type EvidenceTab = "OVERVIEW" | "RESEARCH" | "PERFORMANCE" | "ARCHITECTURE" | "HISTORY";

type PublicTerminalEvent = {
  id: string;
  at?: string | null;
  system: SystemName;
  state?: string | null;
  title: string;
  detail?: string | null;
};

function pct(value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(value)) return "—";
  return (value > 0 ? "+" : "") + value.toFixed(2) + "%";
}

function count(value?: number | null) {
  return value === undefined || value === null || !Number.isFinite(value) ? "—" : String(value);
}

function shortTime(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Live() {
  const { data, error, now } = useLiveTrading(5000);
  const [selected, setSelected] = useState<TerminalFilter>("ALL");
  const [feedFilter, setFeedFilter] = useState<TerminalFilter>("ALL");
  const [evidenceTab, setEvidenceTab] = useState<EvidenceTab>("OVERVIEW");

  const views = useMemo(
    () => SYSTEMS.map((name) => publicSystem(name, data, now, Boolean(error))),
    [data, error, now]
  );
  const fleet = fleetState(views);
  const selectedView = selected === "ALL" ? null : views.find((view) => view.name === selected) || null;

  const events = useMemo(() => {
    const rows: PublicTerminalEvent[] = [];

    for (const view of views) {
      rows.push({
        id: "system-" + view.name + "-" + String(view.observedAt || "unknown"),
        at: view.observedAt,
        system: view.name,
        state: view.raw,
        title: displayState(view.activityState),
        detail: view.activity
      });
    }

    for (const [index, row] of (data?.events || []).entries()) {
      rows.push({
        id: "telemetry-" + String(row.at || index) + "-" + index,
        at: row.at,
        system: "RHEN",
        state: row.kind,
        title: displayState(row.type || "runtime event"),
        detail: row.label
      });
    }

    for (const [index, row] of (data?.research?.completed_decisions || []).entries()) {
      rows.push({
        id: "research-" + String(row.decision_key || row.at || index),
        at: row.at,
        system: "GRAEN",
        state: row.status,
        title: row.subject || row.decision_type || "Research decision",
        detail: row.conclusion || row.methodology_version
      });
    }

    if (data?.crypto_shadow_validation?.latest_event_at) {
      rows.push({
        id: "crypto-validation-" + data.crypto_shadow_validation.latest_event_at,
        at: data.crypto_shadow_validation.latest_event_at,
        system: "GRAEN",
        state: data.crypto_shadow_validation.status,
        title: data.crypto_shadow_validation.study_name || "Crypto validation",
        detail: "Public validation evidence updated"
      });
    }

    if (data?.active_strategy?.activated_at) {
      rows.push({
        id: "strategy-" + data.active_strategy.activated_at,
        at: data.active_strategy.activated_at,
        system: "RHEN",
        state: data.active_strategy.status,
        title: data.active_strategy.version_id || "Active strategy record",
        detail: data.active_strategy.environment || "Production record"
      });
    }

    return rows.sort((a, b) => Date.parse(b.at || "") - Date.parse(a.at || ""));
  }, [data, views]);

  const visibleEvents = events.filter((row) => feedFilter === "ALL" || row.system === feedFilter).slice(0, 28);
  const graen = views.find((view) => view.name === "GRAEN");
  const velum = views.find((view) => view.name === "VELUM");
  const rhen = views.find((view) => view.name === "RHEN");

  const pipeline = [
    {
      label: "Hypothesis",
      state: data?.research?.current_focus ? "RECORDED" : "WAITING",
      detail: data?.research?.current_focus || "No public focus"
    },
    {
      label: "Research",
      state: graen?.activityState || "UNAVAILABLE",
      detail: graen?.activity || "Research unavailable"
    },
    {
      label: "Replay",
      state: velum?.activityState || "UNAVAILABLE",
      detail: velum?.activity || "Replay unavailable"
    },
    {
      label: "Validation",
      state: data?.crypto_shadow_validation?.status || data?.research?.current_status || "UNAVAILABLE",
      detail: data?.crypto_shadow_validation?.study_name || "Public research gate"
    },
    {
      label: "Execution",
      state: rhen?.activityState || "UNAVAILABLE",
      detail: rhen?.activity || "Market system unavailable"
    },
    {
      label: "Evidence",
      state: data?.performance?.status || "UNAVAILABLE",
      detail: data?.performance?.sample_state || "Normalized record"
    }
  ];

  return (
    <section className="public-terminal-page" aria-label="RHEN live terminal" data-visual-ops="public-terminal">
      <header className="pt-topbar">
        <div className="pt-title-lockup">
          <i className={"pt-live-dot" + (error ? " is-stale" : "")} aria-hidden="true" />
          <div>
            <span>ANEVUM / RHEN PUBLIC TERMINAL</span>
            <strong>{error ? "OBSERVATION DEGRADED" : "RHEN OPERATING VIEW"}</strong>
          </div>
        </div>
        <div className="pt-meta">
          <span>{new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          <span>FEED {ageText(data?.generated_at, now)}</span>
          <SystemStatusChip state={fleet} />
        </div>
      </header>

      <div className="pt-shell">
        <aside className="pt-system-rail" aria-label="RHEN module selector">
          <span>RHEN MODULES</span>
          <button className={"pt-system-button" + (selected === "ALL" ? " is-selected" : "")} type="button" onClick={() => setSelected("ALL")}>
            <i className="pt-all-icon">R</i>
            <div><strong>RHEN</strong><small>Unified runtime picture</small></div>
          </button>
          {views.map((view) => (
            <button
              key={view.name}
              className={"pt-system-button" + (selected === view.name ? " is-selected" : "")}
              type="button"
              onClick={() => setSelected(view.name)}
            >
              <SystemIcon system={view.name} size="sm" />
              <div><strong>{MODULE_LABEL[view.name]}</strong><small>{displayState(view.activityState)}</small></div>
            </button>
          ))}
        </aside>

        <main className="pt-main">
          <section className="pt-visual">
            <header className="pt-visual-head">
              <div className="pt-selected-title">
                {selectedView ? <SystemIcon system={selectedView.name} size="sm" /> : <span>◉</span>}
                <div>
                  <span>{selectedView ? IDENTITY[selectedView.name].role : "RHEN / UNIFIED RUNTIME"}</span>
                  <strong>{selectedView ? MODULE_LABEL[selectedView.name] : "Canonical runtime · isolated modules"}</strong>
                  <small>{selectedView ? selectedView.activity : "Select an internal RHEN module to inspect its current public observation."}</small>
                </div>
              </div>
              <SystemStatusChip state={selectedView?.raw || fleet} />
            </header>

            {selectedView ? (
              <div className="pt-focus pt-focus-observation">
                <div className="pt-focus-copy">
                  <span className="pt-label">CURRENT PUBLIC OBSERVATION</span>
                  <h2>{displayState(selectedView.activityState)}</h2>
                  <p>{selectedView.activity}</p>
                  <div className="pt-fact-grid">
                    <div className="pt-fact"><span>Health</span><strong>{displayState(selectedView.health)}</strong></div>
                    <div className="pt-fact"><span>Runtime</span><strong>{displayState(selectedView.runtime)}</strong></div>
                    <div className="pt-fact"><span>Freshness</span><strong>{ageText(selectedView.observedAt, now)}</strong></div>
                    <div className="pt-fact"><span>Source</span><strong>{selectedView.source}</strong></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-map" aria-label="Current RHEN module operating picture">
                {views.map((view) => (
                  <button
                    key={view.name}
                    type="button"
                    className={"pt-map-card pt-map-" + view.name.toLowerCase()}
                    data-active={view.active}
                    onClick={() => setSelected(view.name)}
                  >
                    <SystemIcon system={view.name} size={view.name === "IREN" ? "lg" : "md"} />
                    <div className="pt-map-card-copy">
                      <strong>{MODULE_LABEL[view.name]}</strong>
                      <span>{IDENTITY[view.name].role} · {displayState(view.activityState)}</span>
                      <small>{view.activity}</small>
                    </div>
                    <i className={"pt-state-pip tone-" + stateTone(view.raw)} aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="pt-pipeline" aria-label="Public research and evidence pipeline">
            <header className="pt-pipeline-head">
              <strong>RHEN research → protected execution evidence path</strong>
              <span>Named subsystem identities are projected as internal modules of the unified RHEN runtime.</span>
            </header>
            <div className="pt-pipeline-track">
              {pipeline.map((stage) => (
                <div className="pt-stage" key={stage.label}>
                  <span>{stage.label.toUpperCase()}</span>
                  <strong>{displayState(stage.state)}</strong>
                  <small title={stage.detail}>{stage.detail}</small>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="pt-feed" aria-label="Live public event feed">
          <header className="pt-feed-head">
            <div className="pt-feed-title"><span>≋</span><div><span>DURABLE + OBSERVED</span><strong>Live feed</strong></div></div>
            <div className="pt-filter-row" aria-label="Event filters">
              {(["ALL", ...SYSTEMS] as TerminalFilter[]).map((name) => (
                <button key={name} type="button" className={feedFilter === name ? "is-selected" : ""} onClick={() => setFeedFilter(name)}>
                  {name === "ALL" ? "ALL" : MODULE_LABEL[name]}
                </button>
              ))}
            </div>
          </header>
          <div className="pt-feed-list">
            {visibleEvents.length ? visibleEvents.map((row) => (
              <article className="pt-feed-event" key={row.id}>
                <time dateTime={row.at || undefined}>{shortTime(row.at)}</time>
                <div>
                  <span className="pt-event-system"><SystemIcon system={row.system} size="xs" /> {MODULE_LABEL[row.system]}</span>
                  <strong>{row.title}</strong>
                  {row.detail ? <p>{row.detail}</p> : null}
                </div>
              </article>
            )) : <p className="pt-no-events">No current public events for this filter.</p>}
          </div>
        </aside>
      </div>

      <div className="pt-bottom-grid">
        <section className="pt-data-panel">
          <header><strong>Execution telemetry</strong><span>RHEN · AGGREGATE ONLY</span></header>
          <div className="pt-kpis">
            <div className="pt-kpi"><span>Events · 60m</span><strong>{count(data?.telemetry?.events_60m)}</strong></div>
            <div className="pt-kpi"><span>Scans · 10m</span><strong>{count(data?.telemetry?.scan_events_10m)}</strong></div>
            <div className="pt-kpi"><span>Reconciliations · 2h</span><strong>{count(data?.telemetry?.reconciliations_2h)}</strong></div>
            <div className="pt-kpi"><span>Errors · 2h</span><strong>{count(data?.telemetry?.errors_2h)}</strong></div>
          </div>
        </section>

        <section className="pt-data-panel">
          <header><strong>Research module</strong><span>{displayState(data?.research?.current_status)}</span></header>
          <p className="pt-panel-copy">{data?.research?.current_focus || "No current public research focus is recorded."}</p>
          <p className="pt-panel-copy"><b>Next:</b> {data?.research?.next_direction?.subject || "No next direction recorded."}</p>
        </section>

        <section className="pt-data-panel">
          <header><strong>Normalized record</strong><span>{displayState(data?.performance?.sample_state)}</span></header>
          <div className="pt-kpis">
            <div className="pt-kpi"><span>Return</span><strong>{pct(data?.performance?.account_return_pct)}</strong></div>
            <div className="pt-kpi"><span>Drawdown</span><strong>{pct(data?.performance?.max_drawdown_pct)}</strong></div>
            <div className="pt-kpi"><span>Closed trades</span><strong>{count(data?.performance?.closed_trades)}</strong></div>
            <div className="pt-kpi"><span>Win rate</span><strong>{pct(data?.performance?.win_rate_pct)}</strong></div>
          </div>
        </section>

        <section className="pt-data-panel">
          <header><strong>Crypto validation</strong><span>{displayState(data?.crypto_shadow_validation?.status)}</span></header>
          <div className="pt-kpis">
            <div className="pt-kpi"><span>Completed exits</span><strong>{count(data?.crypto_shadow_validation?.counts?.exits)}</strong></div>
            <div className="pt-kpi"><span>Independent days</span><strong>{count(data?.crypto_shadow_validation?.counts?.independent_day_blocks)}</strong></div>
            <div className="pt-kpi"><span>Trade progress</span><strong>{pct(data?.crypto_shadow_validation?.progress?.completed_trades_pct)}</strong></div>
            <div className="pt-kpi"><span>Day progress</span><strong>{pct(data?.crypto_shadow_validation?.progress?.independent_days_pct)}</strong></div>
          </div>
        </section>
      </div>


      <section className="pt-evidence-drawer" aria-label="Terminal evidence drawer">
        <header className="pt-evidence-tabs">
          <div>
            <span>EVIDENCE DRAWER</span>
            <strong>Inspect without leaving the terminal</strong>
          </div>
          <nav aria-label="Evidence views">
            {(["OVERVIEW", "RESEARCH", "PERFORMANCE", "ARCHITECTURE", "HISTORY"] as EvidenceTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={evidenceTab === tab ? "is-selected" : ""}
                onClick={() => setEvidenceTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        <div className="pt-evidence-body">
          {evidenceTab === "OVERVIEW" ? (
            <div className="pt-evidence-grid">
              <article>
                <span>PUBLIC CONTRACT</span>
                <strong>{data?.disclosure?.level || "Sanitized projection"}</strong>
                <p>The browser receives only the bounded public feed. Protected operator state remains behind Command.</p>
              </article>
              <article>
                <span>RHEN RUNTIME</span>
                <strong>{displayState(fleet)}</strong>
                <p>{views.filter((view) => view.fresh).length} of 5 compatibility module observations are currently fresh.</p>
              </article>
              <article>
                <span>CURRENT RESEARCH</span>
                <strong>{displayState(data?.research?.current_status)}</strong>
                <p>{data?.research?.current_focus || "No current public research focus recorded."}</p>
              </article>
              <article>
                <span>PERFORMANCE RECORD</span>
                <strong>{displayState(data?.performance?.status)}</strong>
                <p>{data?.performance?.basis || "Normalized public performance evidence."}</p>
              </article>
            </div>
          ) : null}

          {evidenceTab === "RESEARCH" ? (
            <div className="pt-evidence-list">
              <article>
                <span>CURRENT FOCUS</span>
                <strong>{data?.research?.current_focus || "No current public focus"}</strong>
                <p>{data?.research?.next_direction?.conclusion || data?.research?.next_direction?.subject || "No next recorded direction."}</p>
              </article>
              {(data?.research?.completed_decisions || []).slice(0, 6).map((row, index) => (
                <article key={String(row.decision_key || row.at || index)}>
                  <span>{displayState(row.status)} · {row.methodology_version || "methodology unlisted"}</span>
                  <strong>{row.subject || row.decision_type || "Research decision"}</strong>
                  <p>{row.conclusion || "No public conclusion recorded."}</p>
                </article>
              ))}
              {!data?.research?.completed_decisions?.length ? <p className="pt-no-events">No completed public research decisions are available.</p> : null}
            </div>
          ) : null}

          {evidenceTab === "PERFORMANCE" ? (
            <div className="pt-evidence-grid">
              <article><span>ACCOUNT RETURN</span><strong>{pct(data?.performance?.account_return_pct)}</strong><p>{data?.performance?.methodology_version || "Methodology unavailable"}</p></article>
              <article><span>REALIZED RETURN</span><strong>{pct(data?.performance?.realized_return_pct)}</strong><p>Normalized public evidence only.</p></article>
              <article><span>MAX DRAWDOWN</span><strong>{pct(data?.performance?.max_drawdown_pct)}</strong><p>{displayState(data?.performance?.sample_state)}</p></article>
              <article><span>CLOSED TRADES</span><strong>{count(data?.performance?.closed_trades)}</strong><p>{count(data?.performance?.wins)} wins · {count(data?.performance?.losses)} losses</p></article>
              <article><span>WIN RATE</span><strong>{pct(data?.performance?.win_rate_pct)}</strong><p>{count(data?.performance?.trading_sessions)} recorded trading sessions</p></article>
              <article><span>TRACKING</span><strong>{ageText(data?.performance?.last_observed_at, now)}</strong><p>{data?.performance?.baseline_reason || "Current normalized baseline"}</p></article>
            </div>
          ) : null}

          {evidenceTab === "ARCHITECTURE" ? (
            <div className="pt-architecture-flow">
              {[
                ["IREN", "Control", "Health, incidents, scheduling, protected actions, and operator-facing evidence."],
                ["GRAEN", "Research", "Bounded strategy discovery, chronological evidence, falsification, and paper-only promotion state."],
                ["VELUM", "Replay", "Independent replay, friction stress, execution-delay stress, and counterfactual verification without live broker authority."],
                ["NOSTRA", "Forecast", "Forward horizons, regimes, uncertainty, outcomes, and calibration."],
                ["RHEN", "Execution", "Market observation, risk, bounded broker execution, reconciliation, and evidence."]
              ].map(([name, role, detail]) => (
                <article key={name}>
                  <SystemIcon system={name as SystemName} size="sm" />
                  <div><span>{role} module</span><strong>{MODULE_LABEL[name as SystemName]}</strong><p>{detail}</p></div>
                </article>
              ))}
              <footer>
                <span>AUTHORITY BOUNDARY</span>
                <strong>Research and replay do not silently become live trading authority.</strong>
                <Link to="/architecture">Open detailed architecture →</Link>
              </footer>
            </div>
          ) : null}

          {evidenceTab === "HISTORY" ? (
            <div className="pt-evidence-list">
              {(data?.strategy_history || []).slice(0, 8).map((row, index) => (
                <article key={String(row.version_id || row.activated_at || index)}>
                  <span>{row.activated_at ? new Date(row.activated_at).toLocaleDateString() : "DATE UNAVAILABLE"} · {displayState(row.status)}</span>
                  <strong>{row.version_id || row.strategy_name || "Strategy record"}</strong>
                  <p>{row.strategy_name || "Unnamed strategy"} · {row.environment || "environment unlisted"}</p>
                </article>
              ))}
              {(data?.research?.completed_decisions || []).slice(0, 4).map((row, index) => (
                <article key={"history-research-" + String(row.decision_key || index)}>
                  <span>{row.at ? new Date(row.at).toLocaleDateString() : "DATE UNAVAILABLE"} · RESEARCH</span>
                  <strong>{row.subject || row.decision_type || "Research decision"}</strong>
                  <p>{row.conclusion || displayState(row.status)}</p>
                </article>
              ))}
              {!data?.strategy_history?.length && !data?.research?.completed_decisions?.length ? <p className="pt-no-events">No public history is currently available.</p> : null}
            </div>
          ) : null}
        </div>
      </section>

      <footer className="pt-terminal-foot">
        <span>
          Public-safe RHEN observations only. IREN, GRAEN, VELUM, and NOSTRA are named internal modules of the canonical RHEN runtime.
          A separate BTC paper canary is retained only for isolated paper execution and forward evidence. No account balances,
          positions, orders, symbols, fills, dollar P&amp;L, exact strategy rules, thresholds, credentials, or protected
          controls are exposed. Missing or stale evidence remains visibly missing or stale.
        </span>
        <nav className="pt-terminal-links" aria-label="Terminal evidence links">
          <Link to="/research">Field Notes</Link>
          <Link to="/founder">About</Link>
          <Link to="/command">Command</Link>
        </nav>
      </footer>
    </section>
  );
}
