import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SystemIcon from "../components/company/SystemIcon";
import SystemInstrument from "../components/operations/SystemInstruments";
import { SystemStatusChip } from "../components/operations/VisualOps";
import { useLiveTrading } from "../hooks/useLiveTrading";
import {
  IDENTITY,
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
      label: "GRAEN",
      state: graen?.activityState || "UNAVAILABLE",
      detail: graen?.activity || "Research unavailable"
    },
    {
      label: "VELUM",
      state: velum?.activityState || "UNAVAILABLE",
      detail: velum?.activity || "Replay unavailable"
    },
    {
      label: "Validation",
      state: data?.crypto_shadow_validation?.status || data?.research?.current_status || "UNAVAILABLE",
      detail: data?.crypto_shadow_validation?.study_name || "Public research gate"
    },
    {
      label: "RHEN",
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
    <section className="public-terminal-page" aria-label="ANEVUM live terminal">
      <header className="pt-topbar">
        <div className="pt-title-lockup">
          <i className={"pt-live-dot" + (error ? " is-stale" : "")} aria-hidden="true" />
          <div>
            <span>ANEVUM / PUBLIC TERMINAL</span>
            <strong>{error ? "OBSERVATION DEGRADED" : "LIVE OPERATING VIEW"}</strong>
          </div>
        </div>
        <div className="pt-meta">
          <span>{new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          <span>FEED {ageText(data?.generated_at, now)}</span>
          <SystemStatusChip state={fleet} />
        </div>
      </header>

      <div className="pt-shell">
        <aside className="pt-system-rail" aria-label="System selector">
          <span>SYSTEM ARRAY</span>
          <button className={"pt-system-button" + (selected === "ALL" ? " is-selected" : "")} type="button" onClick={() => setSelected("ALL")}>
            <i className="pt-all-icon">5</i>
            <div><strong>ALL</strong><small>Unified operating picture</small></div>
          </button>
          {views.map((view) => (
            <button
              key={view.name}
              className={"pt-system-button" + (selected === view.name ? " is-selected" : "")}
              type="button"
              onClick={() => setSelected(view.name)}
            >
              <SystemIcon system={view.name} size="sm" />
              <div><strong>{view.name}</strong><small>{displayState(view.activityState)}</small></div>
            </button>
          ))}
        </aside>

        <main className="pt-main">
          <section className="pt-visual">
            <header className="pt-visual-head">
              <div className="pt-selected-title">
                {selectedView ? <SystemIcon system={selectedView.name} size="sm" /> : <span>◉</span>}
                <div>
                  <span>{selectedView ? IDENTITY[selectedView.name].role : "ANEVUM / SYSTEM ARRAY"}</span>
                  <strong>{selectedView ? selectedView.name : "Five bounded systems"}</strong>
                  <small>{selectedView ? selectedView.activity : "Select a system to inspect its current public observation."}</small>
                </div>
              </div>
              <SystemStatusChip state={selectedView?.raw || fleet} />
            </header>

            {selectedView ? (
              <div className="pt-focus">
                <div className="pt-instrument-stage" data-system={selectedView.name} data-active={selectedView.active}>
                  <SystemInstrument name={selectedView.name} />
                </div>
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
              <div className="pt-map" aria-label="Current five-system operating picture">
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
                      <strong>{view.name}</strong>
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
              <strong>Research → production evidence path</strong>
              <span>States below are direct public projections, not inferred progress.</span>
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
                  {name}
                </button>
              ))}
            </div>
          </header>
          <div className="pt-feed-list">
            {visibleEvents.length ? visibleEvents.map((row) => (
              <article className="pt-feed-event" key={row.id}>
                <time dateTime={row.at || undefined}>{shortTime(row.at)}</time>
                <div>
                  <span className="pt-event-system"><SystemIcon system={row.system} size="xs" /> {row.system}</span>
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
          <header><strong>RHEN telemetry</strong><span>AGGREGATE ONLY</span></header>
          <div className="pt-kpis">
            <div className="pt-kpi"><span>Events · 60m</span><strong>{count(data?.telemetry?.events_60m)}</strong></div>
            <div className="pt-kpi"><span>Scans · 10m</span><strong>{count(data?.telemetry?.scan_events_10m)}</strong></div>
            <div className="pt-kpi"><span>Reconciliations · 2h</span><strong>{count(data?.telemetry?.reconciliations_2h)}</strong></div>
            <div className="pt-kpi"><span>Errors · 2h</span><strong>{count(data?.telemetry?.errors_2h)}</strong></div>
          </div>
        </section>

        <section className="pt-data-panel">
          <header><strong>GRAEN research</strong><span>{displayState(data?.research?.current_status)}</span></header>
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

      <footer className="pt-terminal-foot">
        <span>
          Public-safe observations only. No account balances, positions, orders, symbols, fills, dollar P&amp;L,
          exact strategy rules, thresholds, credentials, or protected controls are exposed. Missing or stale evidence
          remains visibly missing or stale.
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
