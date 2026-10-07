import { useEffect, useMemo, useState } from "react";
import type {
  IrenSnapshot,
  ResearchObservabilityProjection,
  ResearchObservabilityRun,
  ResearchObservabilitySeries
} from "../lib/runtime-topology";
import { ageText, displayState } from "../lib/system-display";
import SystemIcon from "./company/SystemIcon";
import "../styles/research-observability.css";

type SystemFilter = "ALL" | "GRAEN" | "VELUM" | "NOSTRA" | "RHEN";
type EventScope = "SELECTED" | "ALL";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function numeric(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMetric(key: string, value: number) {
  const label = key.replaceAll("_", " ").toUpperCase();
  if (/(_pct|pct$)/.test(key)) {
    return { label, value: value.toFixed(Math.abs(value) < 10 ? 3 : 2) + "%" };
  }
  if (/(return|expectancy|max_drawdown|win_rate)/.test(key)) {
    return { label, value: value.toFixed(4) };
  }
  if (/(trades|days|count|fills|events|sample)/.test(key)) {
    return { label, value: Math.round(value).toLocaleString() };
  }
  return { label, value: value.toFixed(Math.abs(value) < 1 ? 4 : 2) };
}

function pointLabel(at?: string | null) {
  if (!at) return "—";
  const stamp = Date.parse(at);
  if (!Number.isFinite(stamp)) return at;
  return new Date(stamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function statusTone(status?: string | null) {
  const value = String(status || "").toUpperCase();
  if (["FAILED", "BLOCKED", "REJECTED", "CANCELLED"].some(token => value.includes(token))) return "danger";
  if (["RUNNING", "RESEARCHING", "REPLAYING", "OPEN"].some(token => value.includes(token))) return "live";
  if (["SUCCEEDED", "COMPLETED", "SCORED", "PASSED"].some(token => value.includes(token))) return "good";
  return "neutral";
}

function fallbackProjection(snapshot: IrenSnapshot | null): ResearchObservabilityProjection | null {
  const research = snapshot?.research;
  if (!research) return null;

  const problems = new Map(
    (research.graen_problems || [])
      .filter(row => row.problem_id)
      .map(row => [String(row.problem_id), row] as const)
  );

  const runs: ResearchObservabilityRun[] = (research.graen_runs || [])
    .filter(row => row.run_id)
    .map(row => {
      const problem = problems.get(String(row.problem_id || ""));
      const status = String(row.status || "UNKNOWN").toUpperCase();
      const stage = problem?.research_stage || row.result_state || null;
      const progress =
        ["SUCCEEDED", "COMPLETED", "COMPLETE", "FAILED", "CANCELLED"].includes(status) ? 100 :
        status === "WAITING" ? 85 :
        status === "QUEUED" ? 10 :
        status === "BLOCKED" ? 70 :
        30;
      return {
        run_id: String(row.run_id),
        system: "GRAEN",
        kind: "RESEARCH",
        title: problem?.title || problem?.candidate_id || "GRAEN research run",
        status,
        stage,
        progress_pct: progress,
        problem_id: row.problem_id || null,
        candidate_id: problem?.candidate_id || null,
        methodology_version: row.methodology_version || null,
        started_at: row.started_at || row.created_at || null,
        completed_at: row.completed_at || null,
        updated_at: row.completed_at || row.started_at || row.created_at || null,
        metrics: {},
        series: [],
        detail: {
          fallback: true,
          source: "rhen_core_graen_runs"
        }
      };
    });

  const represented = new Set(runs.map(row => row.problem_id).filter(Boolean));
  for (const problem of research.graen_problems || []) {
    const problemId = String(problem.problem_id || "");
    const status = String(problem.status || "UNKNOWN").toUpperCase();
    if (!problemId || represented.has(problemId)) continue;
    if (!["RUNNING", "QUEUED", "WAITING", "BLOCKED"].includes(status)) continue;
    runs.push({
      run_id: "problem:" + problemId,
      system: "GRAEN",
      kind: "RESEARCH_QUEUE",
      title: problem.title || problem.candidate_id || "GRAEN research problem",
      status,
      stage: problem.research_stage || null,
      progress_pct: status === "WAITING" ? 85 : status === "BLOCKED" ? 70 : status === "QUEUED" ? 10 : 30,
      problem_id: problemId,
      candidate_id: problem.candidate_id || null,
      started_at: problem.started_at || null,
      completed_at: problem.completed_at || null,
      updated_at: problem.updated_at || problem.started_at || null,
      metrics: {},
      series: [],
      detail: {
        fallback: true,
        source: "rhen_core_graen_problems"
      }
    });
  }

  runs.sort((a, b) =>
    String(b.updated_at || b.started_at || "").localeCompare(String(a.updated_at || a.started_at || ""))
  );

  if (!runs.length) return null;
  return {
    schema_version: "research_observability.fallback.v1",
    updated_at:
      research.graen_runtime?.heartbeat_at ||
      runs[0]?.updated_at ||
      snapshot?.observed_at ||
      null,
    poll_seconds: 3,
    runs,
    events: [],
    authority: {
      read_only: true,
      research_only: true,
      live_trading_performance_mixed: false
    }
  };
}

function Chart({
  series,
  selectedPoint,
  onSelect
}: {
  series?: ResearchObservabilitySeries;
  selectedPoint: number | null;
  onSelect: (index: number | null) => void;
}) {
  const points = (series?.points || []).filter(row => numeric(row.value) !== null);
  if (points.length < 2) {
    return <div className="research-observability-empty">This run is visible. The chart appears after two persisted evidence points; scan activity remains available in metrics and the event tape.</div>;
  }

  const values = points.map(row => Number(row.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(0.000001, max - min);
  const pad = Math.max(spread * 0.15, Math.max(Math.abs(max), Math.abs(min), 1) * 0.03);
  const low = min - pad;
  const high = max + pad;
  const span = Math.max(0.000001, high - low);
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? 500 : (index / (points.length - 1)) * 1000;
    const y = 210 - ((Number(point.value) - low) / span) * 185;
    return { x, y, point, index };
  });
  const polyline = coords.map(row => row.x.toFixed(2) + "," + row.y.toFixed(2)).join(" ");
  const zeroY = low <= 0 && high >= 0
    ? 210 - ((0 - low) / span) * 185
    : null;
  const active = selectedPoint == null ? coords[coords.length - 1] : coords[selectedPoint] || coords[coords.length - 1];

  return (
    <div className="research-observability-chart">
      <div className="research-observability-chart-head">
        <div>
          <span>{series?.label || "Run series"}</span>
          <strong>{active.point.value.toFixed(4)}{series?.unit || ""}</strong>
        </div>
        <small>{pointLabel(active.point.at)} · point {active.index + 1}/{points.length}</small>
      </div>
      <svg viewBox="0 0 1000 225" preserveAspectRatio="none" role="img" aria-label={(series?.label || "Research series") + " chart"}>
        {zeroY != null && <line x1="0" x2="1000" y1={zeroY} y2={zeroY} className="research-observability-zero" />}
        <polyline points={polyline} className="research-observability-line" />
        {coords.map(row => (
          <circle
            key={row.index}
            cx={row.x}
            cy={row.y}
            r={selectedPoint === row.index ? 6 : 3.5}
            className={selectedPoint === row.index ? "research-observability-point is-selected" : "research-observability-point"}
            tabIndex={0}
            role="button"
            aria-label={pointLabel(row.point.at) + " " + row.point.value.toFixed(4) + (series?.unit || "")}
            onClick={() => onSelect(row.index)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(row.index);
              }
            }}
          />
        ))}
      </svg>
      <div className="research-observability-chart-foot">
        <span>{pointLabel(points[0].at)}</span>
        <b>Evidence-indexed · inactive time is not drawn as flatline space</b>
        <span>{pointLabel(points[points.length - 1].at)}</span>
      </div>
    </div>
  );
}

function RunList({
  runs,
  selectedRunId,
  onSelect,
  now,
  emptyMessage
}: {
  runs: ResearchObservabilityRun[];
  selectedRunId: string | null;
  onSelect: (runId: string) => void;
  now: number;
  emptyMessage?: string;
}) {
  return (
    <div className="research-observability-run-list" role="list" aria-label="Research and simulation runs">
      {runs.length ? runs.map(run => {
        const progress = clamp(numeric(run.progress_pct) ?? 0, 0, 100);
        return (
          <button
            type="button"
            key={run.run_id}
            className={"research-observability-run tone-" + statusTone(run.status) + (selectedRunId === run.run_id ? " is-selected" : "")}
            onClick={() => onSelect(run.run_id)}
          >
            <div className="research-observability-run-main">
              <span><SystemIcon system={run.system} size="xs" /> {run.system} · {String(run.kind || "RUN").replaceAll("_", " ")}</span>
              <strong>{run.title || run.candidate_id || run.strategy_version_id || run.run_id}</strong>
              <small>{displayState(run.stage || run.status)} · {ageText(run.updated_at || run.started_at, now)}</small>
            </div>
            <div className="research-observability-run-state">
              <b>{displayState(run.status)}</b>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="research-observability-progress" aria-label={"Progress " + Math.round(progress) + "%"}>
              <i style={{ width: progress + "%" }} />
            </div>
          </button>
        );
      }) : <div className="research-observability-empty">{emptyMessage || "No canonical research or simulation runs match this filter."}</div>}
    </div>
  );
}

export default function CommandResearchLab({
  snapshot,
  now
}: {
  snapshot: IrenSnapshot | null;
  now: number;
}) {
  const liveProjection = snapshot?.research?.observability || fallbackProjection(snapshot);
  const [system, setSystem] = useState<SystemFilter>("ALL");
  const [eventScope, setEventScope] = useState<EventScope>("SELECTED");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [frozenProjection, setFrozenProjection] = useState<ResearchObservabilityProjection | null>(null);

  useEffect(() => {
    if (!paused) setFrozenProjection(null);
  }, [paused]);

  const projection = paused
    ? (frozenProjection || liveProjection)
    : liveProjection;

  const runs = projection?.runs || [];
  const filteredRuns = useMemo(
    () => runs.filter(run => system === "ALL" || run.system === system),
    [runs, system]
  );

  useEffect(() => {
    if (!filteredRuns.length) {
      setSelectedRunId(null);
      return;
    }
    if (!selectedRunId || !filteredRuns.some(run => run.run_id === selectedRunId)) {
      setSelectedRunId(filteredRuns[0].run_id);
      setSelectedSeries(0);
      setSelectedPoint(null);
    }
  }, [filteredRuns, selectedRunId]);

  const selectedRun = runs.find(run => run.run_id === selectedRunId) || filteredRuns[0] || null;
  const awaitingCohort = snapshot?.strategy_pipeline?.evidence_readiness?.state === "AWAITING_MEASURABLE_COHORT";
  const emptyRunMessage = system === "VELUM" && awaitingCohort
    ? "VELUM is healthy. Replay is waiting for the first exact post-fix measurable cohort; no replay curve should exist yet."
    : system === "GRAEN" && awaitingCohort
      ? "GRAEN is collecting evidence. New hypothesis work is intentionally gated until the first measurable cohort exists."
      : undefined;
  const series = selectedRun?.series || [];
  const activeSeries = series[selectedSeries] || series[0];
  const metrics = Object.entries(selectedRun?.metrics || {})
    .filter((entry): entry is [string, number] => Number.isFinite(entry[1]))
    .slice(0, 12);

  const events = (projection?.events || []).filter(event => {
    if (eventScope === "SELECTED" && selectedRun) return event.run_id === selectedRun.run_id;
    if (system !== "ALL") return event.system === system;
    return true;
  }).slice(0, 80);

  const activeRuns = runs.filter(run =>
    ["RUNNING", "OPEN", "QUEUED", "WAITING", "AWAITING_STAGE_MATURITY"].includes(String(run.status || "").toUpperCase())
  ).length;
  const chartableRuns = runs.filter(run => (run.series || []).some(item => (item.points || []).length > 1)).length;

  function togglePause() {
    setPaused(value => {
      if (!value) setFrozenProjection(liveProjection);
      else setFrozenProjection(null);
      return !value;
    });
  }

  return (
    <article className="command-panel command-view-research research-observability" aria-label="Live research and simulation observability">
      <header className="research-observability-header">
        <div>
          <span>RESEARCH LAB / LIVE EVIDENCE</span>
          <strong>Researchers + simulations</strong>
        </div>
        <div className="research-observability-header-state">
          <i className={projection ? "is-live" : ""} />
          <div>
            <b>{paused ? "VIEW PAUSED" : projection ? "LIVE" : "NO FEED"}</b>
            <small>{projection?.updated_at ? ageText(projection.updated_at, now) : "Awaiting IREN research projection"}</small>
          </div>
          <button type="button" onClick={togglePause}>{paused ? "Resume view" : "Pause view"}</button>
        </div>
      </header>

      <section className="research-observability-summary">
        <div><span>ACTIVE RUNS</span><strong>{activeRuns}</strong><small>GRAEN / VELUM / NOSTRA / RHEN evidence</small></div>
        <div><span>TRACKED RUNS</span><strong>{runs.length}</strong><small>Most recent persisted research evidence</small></div>
        <div><span>CHARTABLE</span><strong>{chartableRuns}</strong><small>Scan / replay / return evidence series</small></div>
        <div><span>POLL</span><strong>{projection?.poll_seconds ?? 3}s</strong><small>Shared canonical IREN observation</small></div>
      </section>

      <nav className="research-observability-filters" aria-label="Research system filter">
        {(["ALL", "GRAEN", "VELUM", "NOSTRA", "RHEN"] as SystemFilter[]).map(item => (
          <button type="button" key={item} className={system === item ? "active" : ""} onClick={() => setSystem(item)}>
            {item}
          </button>
        ))}
      </nav>

      <div className="research-observability-layout">
        <aside className="research-observability-sidebar">
          <div className="research-observability-subhead">
            <span>RUNS</span>
            <strong>{filteredRuns.length}</strong>
          </div>
          <RunList runs={filteredRuns} selectedRunId={selectedRun?.run_id || null} emptyMessage={emptyRunMessage} onSelect={runId => {
            setSelectedRunId(runId);
            setSelectedSeries(0);
            setSelectedPoint(null);
          }} now={now} />
        </aside>

        <section className="research-observability-workbench">
          {selectedRun ? (
            <>
              <div className="research-observability-run-head">
                <div>
                  <span><SystemIcon system={selectedRun.system} size="xs" /> {selectedRun.system} · {String(selectedRun.kind || "RUN").replaceAll("_", " ")}</span>
                  <h2>{selectedRun.title || selectedRun.run_id}</h2>
                  <p>{selectedRun.candidate_id || selectedRun.strategy_version_id || selectedRun.methodology_version || "No candidate identifier persisted"}</p>
                </div>
                <div>
                  <b className={"tone-" + statusTone(selectedRun.status)}>{displayState(selectedRun.status)}</b>
                  <span>{displayState(selectedRun.stage)}</span>
                  <small>{selectedRun.updated_at ? ageText(selectedRun.updated_at, now) : "No update timestamp"}</small>
                </div>
              </div>

              <div className="research-observability-identity">
                <span><b>RUN</b>{selectedRun.run_id}</span>
                {selectedRun.problem_id && <span><b>PROBLEM</b>{selectedRun.problem_id}</span>}
                {selectedRun.methodology_version && <span><b>METHOD</b>{selectedRun.methodology_version}</span>}
                {selectedRun.artifact_count != null && <span><b>ARTIFACTS</b>{selectedRun.artifact_count}</span>}
              </div>

              <div className="research-observability-series-tabs" aria-label="Chart series">
                {series.length ? series.map((item, index) => (
                  <button type="button" key={(item.key || "series") + index} className={selectedSeries === index ? "active" : ""} onClick={() => {
                    setSelectedSeries(index);
                    setSelectedPoint(null);
                  }}>
                    {item.label || item.key || "Series " + (index + 1)}
                  </button>
                )) : <span>No chart series yet</span>}
              </div>

              <Chart series={activeSeries} selectedPoint={selectedPoint} onSelect={setSelectedPoint} />

              <div className="research-observability-metrics">
                {metrics.length ? metrics.map(([key, value]) => {
                  const formatted = formatMetric(key, value);
                  return <div key={key}><span>{formatted.label}</span><strong>{formatted.value}</strong></div>;
                }) : <div className="research-observability-empty">No normalized metrics persisted for this run yet.</div>}
              </div>

              <details className="research-observability-detail">
                <summary>Run context</summary>
                <dl>
                  {Object.entries(selectedRun.detail || {}).slice(0, 16).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key.replaceAll("_", " ").toUpperCase()}</dt>
                      <dd>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </>
          ) : <div className="research-observability-empty">{emptyRunMessage || "Select a research run to inspect it."}</div>}
        </section>
      </div>

      <section className="research-observability-events">
        <header>
          <div><span>EVENT TAPE</span><strong>{eventScope === "SELECTED" && selectedRun ? "Selected run" : "Visible research systems"}</strong></div>
          <nav>
            <button type="button" className={eventScope === "SELECTED" ? "active" : ""} onClick={() => setEventScope("SELECTED")} disabled={!selectedRun}>Selected</button>
            <button type="button" className={eventScope === "ALL" ? "active" : ""} onClick={() => setEventScope("ALL")}>All</button>
          </nav>
        </header>
        <div className="research-observability-event-head">
          <span>TIME</span><span>SYSTEM</span><span>PHASE</span><span>EVENT</span>
        </div>
        <ol>
          {events.length ? events.map((event, index) => (
            <li key={(event.event_id || "event") + "-" + index}>
              <time>{event.at ? new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}</time>
              <span>{event.system || "—"}</span>
              <b>{displayState(event.stage || event.status)}</b>
              <div>
                <strong>{String(event.event_type || event.title || "research event").replaceAll("_", " ").toUpperCase()}</strong>
                {event.detail && <p>{event.detail}</p>}
                {event.progress_pct != null && <small>{Math.round(event.progress_pct)}% · {displayState(event.status)}</small>}
              </div>
            </li>
          )) : <li className="research-observability-empty">No persisted events for this scope yet.</li>}
        </ol>
      </section>

      <footer className="research-observability-footer">
        <span>READ ONLY · research and replay authority only</span>
        <span>Live trading performance is intentionally separate from simulation curves</span>
      </footer>
    </article>
  );
}
