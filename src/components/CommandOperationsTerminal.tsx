import { useMemo, useState, type CSSProperties } from "react";
import type { RhenSession } from "../lib/auth";
import type { LiveTradingFeed } from "../lib/data";
import type { IrenJobEvent, IrenSnapshot, RuntimeRow } from "../lib/runtime-topology";
import {
  IDENTITY,
  SYSTEMS,
  ageText,
  commandSystem,
  displayState,
  incidentOwner,
  runtimeOwner,
  stateTone,
  systemWork,
  type SystemName
} from "../lib/system-display";
import { useCommandObservation } from "../hooks/useCommandObservation";
import SystemIcon from "./company/SystemIcon";
import SystemInstrument from "./operations/SystemInstruments";
import "../styles/operations-terminal.css";

type TerminalFilter = "ALL" | SystemName;
type TerminalEvent = {
  id: string;
  at?: string | null;
  system: SystemName;
  source: string;
  state?: string | null;
  title: string;
  detail?: string | null;
};

const TERMINAL_SYSTEMS: SystemName[] = ["GRAEN", "VELUM", "IREN", "RHEN", "NOSTRA"];

function isSystem(value: unknown): value is SystemName {
  return typeof value === "string" && (SYSTEMS as readonly string[]).includes(value);
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function compactValue(value: unknown) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.length <= 120) return value;
  return "";
}

function eventDetail(event?: Record<string, unknown>) {
  if (!event) return "";
  const candidates = [event, object(event.result), object(event.error)];
  const keys = ["stage", "phase", "status", "reason", "message", "candidate_id", "run_id", "retrying"];
  const parts: string[] = [];
  for (const bucket of candidates) {
    for (const key of keys) {
      const value = compactValue(bucket[key]);
      if (value && !parts.some(part => part.startsWith(key + ":"))) {
        parts.push(key.replaceAll("_", " ") + ": " + value);
      }
      if (parts.length >= 3) return parts.join(" · ");
    }
  }
  return parts.join(" · ");
}

function stamp(row: RuntimeRow, fallback?: string | null) {
  return row.last_heartbeat_at || row.observed_at || fallback || null;
}

function jobEvents(snapshot: IrenSnapshot | null): TerminalEvent[] {
  return (snapshot?.work?.job_events || []).flatMap((row: IrenJobEvent) => {
    const system = isSystem(row.owner_system) ? row.owner_system : null;
    if (!system) return [];
    const state = String(row.event_type || "UNKNOWN").toUpperCase();
    const detail = eventDetail(row.event);
    return [{
      id: "job-" + row.event_id,
      at: row.created_at,
      system,
      source: "DURABLE JOB EVENT",
      state,
      title: row.title || row.job_type || "IREN work item",
      detail: detail || displayState(state)
    }];
  });
}

function runtimeEvents(snapshot: IrenSnapshot | null): TerminalEvent[] {
  return (snapshot?.topology?.services || []).flatMap(row => {
    const system = runtimeOwner(row);
    if (!system) return [];
    return [{
      id: "runtime-" + row.service_id + "-" + String(stamp(row, snapshot?.observed_at)),
      at: stamp(row, snapshot?.observed_at),
      system,
      source: "RUNTIME OBSERVATION",
      state: row.status,
      title: row.service_name || row.service_id,
      detail: row.current_activity || "Heartbeat / readiness observation"
    }];
  });
}

function controlEvents(snapshot: IrenSnapshot | null): TerminalEvent[] {
  const transitions = (snapshot?.operator?.recent_transitions || []).map((row, index): TerminalEvent => ({
    id: "control-" + String(row.key || index) + "-" + String(row.created_at || index),
    at: row.created_at,
    system: "IREN",
    source: "CONTROL TRANSITION",
    state: row.severity,
    title: displayState(row.transition || "control transition"),
    detail: row.reason ? row.reason.replaceAll("_", " ") : row.key
  }));

  const incidents = (snapshot?.incidents || []).map((row, index): TerminalEvent => ({
    id: "incident-" + row.key + "-" + index,
    at: row.opened_at,
    system: incidentOwner(row),
    source: "INCIDENT",
    state: row.severity,
    title: row.key,
    detail: row.reason.replaceAll("_", " ")
  }));
  return [...transitions, ...incidents];
}

function publicEvents(feed?: LiveTradingFeed | null): TerminalEvent[] {
  const telemetry = (feed?.events || []).map((row, index): TerminalEvent => ({
    id: "telemetry-" + String(row.at || index) + "-" + index,
    at: row.at,
    system: "RHEN",
    source: "DURABLE TELEMETRY",
    state: row.kind,
    title: displayState(row.type || "runtime event"),
    detail: row.label
  }));

  const research = (feed?.research?.completed_decisions || []).map((row, index): TerminalEvent => ({
    id: "research-" + String(row.decision_key || row.at || index),
    at: row.at,
    system: "GRAEN",
    source: "RESEARCH RECORD",
    state: row.status,
    title: row.subject || row.decision_type || "Research decision",
    detail: row.conclusion || row.methodology_version
  }));
  return [...telemetry, ...research];
}

function researchTraceEvents(snapshot: IrenSnapshot | null): TerminalEvent[] {
  const problems = snapshot?.research?.graen_problems || [];
  const runs = snapshot?.research?.graen_runs || [];
  const activeVelumStage = problems.find(row =>
    String(row.research_stage || "").includes("VELUM")
    && ["RUNNING", "QUEUED", "WAITING", "BLOCKED"].includes(String(row.status || "").toUpperCase())
  )?.research_stage;

  const problemEvents = problems.map((row, index): TerminalEvent => ({
    id: "graen-problem-" + String(row.problem_id || index) + "-" + String(row.updated_at || index),
    at: row.updated_at || row.started_at,
    system: "GRAEN",
    source: "GRAEN STAGE",
    state: row.status,
    title: row.title || "Research problem",
    detail: row.research_stage ? displayState(row.research_stage) : "No active research stage"
  }));

  const runEvents = runs.map((row, index): TerminalEvent => {
    const detail = [
      row.methodology_version ? "method: " + row.methodology_version : "",
      row.result_state ? "state: " + displayState(row.result_state) : "",
      row.error ? "error: " + row.error.slice(0, 140) : ""
    ].filter(Boolean).join(" · ");
    return {
      id: "graen-run-" + String(row.run_id || index),
      at: row.completed_at || row.started_at || row.created_at,
      system: "GRAEN",
      source: "GRAEN RUN",
      state: row.status,
      title: row.result_state ? displayState(row.result_state) : "Research execution",
      detail
    };
  });

  const replayEvents = (snapshot?.research?.velum_replays || []).map((row, index): TerminalEvent => ({
    id: "velum-replay-" + String(row.started_at || index) + "-" + index,
    at: row.completed_at || row.started_at,
    system: "VELUM",
    source: "VELUM REPLAY",
    state: row.status,
    title: activeVelumStage ? displayState(activeVelumStage) : "Replay lifecycle",
    detail: "Replay " + displayState(row.status || "UNKNOWN")
  }));

  return [...problemEvents, ...runEvents, ...replayEvents];
}

function sortEvents(rows: TerminalEvent[]) {
  const seen = new Set<string>();
  return rows
    .filter(row => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .sort((a, b) => (Date.parse(b.at || "") || 0) - (Date.parse(a.at || "") || 0));
}

function laneActivity(snapshot: IrenSnapshot | null, feed: LiveTradingFeed | null | undefined, system: SystemName, now: number) {
  const view = commandSystem(system, snapshot, feed, now);
  const work = systemWork(snapshot, system);
  const running = work.jobs.find(row => String(row.status) === "RUNNING");
  const queued = work.jobs.find(row => String(row.status) === "QUEUED");
  const job = running || queued || work.jobs[0];

  const activeProblem = (snapshot?.research?.graen_problems || []).find(row =>
    ["RUNNING", "QUEUED", "WAITING", "BLOCKED"].includes(String(row.status || "").toUpperCase())
  );
  const activeReplay = (snapshot?.research?.velum_replays || []).find(row =>
    String(row.status || "").toUpperCase() === "RUNNING"
  );
  const stage = activeProblem?.research_stage || null;

  let traceActivity: string | null = null;
  let traceStatus: string | null = null;
  let traceType: string | null = null;
  let traceStarted: string | null = null;

  if (system === "GRAEN" && activeProblem) {
    traceActivity = [activeProblem.title, stage ? displayState(stage) : null].filter(Boolean).join(" · ");
    traceStatus = activeProblem.status || null;
    traceType = stage ? displayState(stage) : "Research problem";
    traceStarted = activeProblem.started_at || activeProblem.updated_at || null;
  }
  if (system === "VELUM" && activeReplay) {
    traceActivity = stage && stage.includes("VELUM") ? displayState(stage) : "Replay running";
    traceStatus = activeReplay.status || null;
    traceType = stage && stage.includes("VELUM") ? displayState(stage) : "VELUM replay";
    traceStarted = activeReplay.started_at || null;
  }

  const researchFocus = system === "GRAEN" ? feed?.research?.current_focus : null;
  const activity = String(job?.title || traceActivity || researchFocus || view.activity || "Awaiting observation.");
  const started = String(job?.started_at || traceStarted || activeProblem?.started_at || job?.created_at || "");
  const traceActive = String(traceStatus || "").toUpperCase() === "RUNNING";
  return { view, work, job, activity, started, traceStatus, traceType, traceActive };
}

function elapsed(value: unknown, now: number) {
  const stamp = Date.parse(String(value || ""));
  if (!Number.isFinite(stamp) || stamp > now) return "—";
  const seconds = Math.max(0, Math.floor((now - stamp) / 1000));
  if (seconds < 60) return seconds + "s";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m " + (seconds % 60) + "s";
  return Math.floor(minutes / 60) + "h " + (minutes % 60) + "m";
}

function jobContext(job?: Record<string, unknown>) {
  if (!job) return [] as Array<[string, string]>;
  const metadata = object(job.metadata);
  const rows: Array<[string, string]> = [];
  const fields: Array<[string, string[]]> = [
    ["STAGE", ["stage", "phase"]],
    ["RUN", ["run_id", "campaign_id", "experiment_id"]],
    ["CANDIDATE", ["candidate_id", "candidate", "strategy_id"]],
    ["HYPOTHESIS", ["hypothesis", "family", "mechanism"]]
  ];
  for (const [label, keys] of fields) {
    const key = keys.find(candidate => compactValue(metadata[candidate]));
    if (key) rows.push([label, compactValue(metadata[key])]);
  }
  return rows.slice(0, 4);
}

function FocusWorkbench({
  system,
  snapshot,
  feed,
  events,
  now
}: {
  system: "GRAEN" | "VELUM";
  snapshot: IrenSnapshot | null;
  feed?: LiveTradingFeed | null;
  events: TerminalEvent[];
  now: number;
}) {
  const lane = laneActivity(snapshot, feed, system, now);
  const rows = (snapshot?.topology?.services || []).filter(row => runtimeOwner(row) === system);
  const runtime = rows.find(row => row.current_activity) || rows[0];
  const latest = events.find(row => row.system === system);
  const context = jobContext(lane.job);
  const startedAt = lane.job?.started_at || lane.job?.created_at || runtime?.started_at;
  const heartbeat = runtime?.last_heartbeat_at || runtime?.observed_at || lane.view.observedAt;
  const live = lane.view.active || lane.traceActive || String(lane.job?.status || "") === "RUNNING";

  return (
    <article
      className={"terminal-focus-card tone-" + stateTone(lane.view.raw) + (live ? " is-working" : "")}
      style={{ "--terminal-accent": IDENTITY[system].color } as CSSProperties}
    >
      <header>
        <div className="terminal-focus-title">
          <SystemIcon system={system} size="sm" />
          <div><span>{system === "GRAEN" ? "RESEARCH WORKBENCH" : "REPLAY WORKBENCH"}</span><h2>{system}</h2></div>
        </div>
        <div className="terminal-focus-state"><i aria-hidden="true" /><strong>{displayState(lane.view.raw)}</strong></div>
      </header>

      <div className="terminal-focus-instrument" aria-label={system + " live activity instrument"}>
        <SystemInstrument name={system} />
        <i className="terminal-focus-sweep" aria-hidden="true" />
      </div>

      <div className="terminal-focus-work">
        <span>CURRENT WORK</span>
        <strong>{lane.job?.title ? String(lane.job.title) : lane.activity}</strong>
        <p>{runtime?.current_activity || lane.activity}</p>
      </div>

      {context.length > 0 && <div className="terminal-focus-context">
        {context.map(([label, value]) => <span key={label}><b>{label}</b>{value}</span>)}
      </div>}

      <dl className="terminal-focus-metrics">
        <div><dt>STATE</dt><dd>{displayState(lane.traceStatus || String(lane.job?.status || lane.view.raw || "UNKNOWN"))}</dd></div>
        <div><dt>STAGE</dt><dd>{lane.traceType || String(lane.job?.job_type || "—").replaceAll("_", " ")}</dd></div>
        <div><dt>ELAPSED</dt><dd>{elapsed(startedAt, now)}</dd></div>
        <div><dt>HEARTBEAT</dt><dd>{ageText(heartbeat, now)}</dd></div>
      </dl>

      <footer>
        <div><span>RUNTIME</span><strong>{runtime?.service_name || runtime?.service_id || "No owned runtime observed"}</strong></div>
        <div><span>LATEST EVENT</span><strong>{latest ? latest.title + " · " + ageText(latest.at, now) : "No event exposed yet"}</strong></div>
      </footer>
    </article>
  );
}

export default function CommandOperationsTerminal({
  session,
  feed,
  feedError
}: {
  session: RhenSession;
  feed?: LiveTradingFeed | null;
  feedError?: string;
}) {
  const { snapshot, error, now, receivedAt } = useCommandObservation(session, 3000);
  const [filter, setFilter] = useState<TerminalFilter>("ALL");

  const events = useMemo(
    () => sortEvents([
      ...jobEvents(snapshot),
      ...runtimeEvents(snapshot),
      ...controlEvents(snapshot),
      ...researchTraceEvents(snapshot),
      ...publicEvents(feed)
    ]),
    [snapshot, feed]
  );
  const visible = filter === "ALL" ? events : events.filter(row => row.system === filter);
  const fleetFresh = Boolean(snapshot && !snapshot.stale && !error);
  const activeCount = TERMINAL_SYSTEMS.filter(system => {
    const lane = laneActivity(snapshot, feed, system, now);
    return lane.view.active || lane.traceActive;
  }).length;

  return (
    <article className="command-panel command-view-terminal operations-terminal" aria-label="ANEVUM live operations terminal">
      <header className="terminal-heading">
        <div>
          <span>COMMAND / LIVE OPERATIONS</span>
          <h1>System terminal</h1>
          <p>Evidence-backed activity across GRAEN, VELUM, IREN, RHEN, and NOSTRA.</p>
        </div>
        <div className="terminal-session">
          <span className={fleetFresh ? "terminal-live-dot is-live" : "terminal-live-dot"} aria-hidden="true" />
          <div><strong>{fleetFresh ? "LIVE" : "DEGRADED"}</strong><small>3s read-only poll</small></div>
        </div>
      </header>

      <section className="terminal-meta" aria-label="Terminal observation state">
        <div><span>IREN</span><strong>{displayState(snapshot?.state)}</strong><small>revision {snapshot?.revision ?? "—"}</small></div>
        <div><span>OBSERVED</span><strong>{ageText(snapshot?.observed_at, now)}</strong><small>received {ageText(receivedAt, now)}</small></div>
        <div><span>ACTIVE</span><strong>{activeCount} / {TERMINAL_SYSTEMS.length}</strong><small>explicit work signals</small></div>
        <div><span>EVENTS</span><strong>{events.length}</strong><small>current merged window</small></div>
      </section>

      {(error || feedError) && <div className="terminal-warning"><strong>OBSERVATION DEGRADED</strong><span>{error || feedError}</span></div>}

      <section className="terminal-focus-grid" aria-label="GRAEN and VELUM live workbenches">
        <FocusWorkbench system="GRAEN" snapshot={snapshot} feed={feed} events={events} now={now} />
        <FocusWorkbench system="VELUM" snapshot={snapshot} feed={feed} events={events} now={now} />
      </section>

      <section className="terminal-lanes" aria-label="ANEVUM systems">
        {TERMINAL_SYSTEMS.map(system => {
          const lane = laneActivity(snapshot, feed, system, now);
          const tone = stateTone(lane.view.raw);
          const latest = events.find(row => row.system === system);
          const rows = (snapshot?.topology?.services || []).filter(row => runtimeOwner(row) === system);
          return (
            <article
              key={system}
              className={"terminal-lane tone-" + tone + (lane.view.active || lane.traceActive ? " is-working" : "")}
              style={{ "--terminal-accent": IDENTITY[system].color } as CSSProperties}
            >
              <header>
                <SystemIcon system={system} size="sm" />
                <div><strong>{system}</strong><span>{IDENTITY[system].role}</span></div>
                <b>{displayState(lane.view.raw)}</b>
              </header>
              <div className="terminal-lane-activity">
                <i className={lane.view.active || lane.traceActive ? "is-live" : ""} aria-hidden="true" />
                <p>{lane.activity}</p>
              </div>
              <dl>
                <div><dt>STATE</dt><dd>{displayState(lane.traceStatus || String(lane.job?.status || lane.view.raw || "UNKNOWN"))}</dd></div>
                <div><dt>RUNTIMES</dt><dd>{rows.length || "—"}</dd></div>
                <div><dt>LAST SIGNAL</dt><dd>{ageText(latest?.at || lane.view.observedAt, now)}</dd></div>
              </dl>
              {lane.job && <small className="terminal-job-age">{lane.started ? "Started " + ageText(lane.started, now) : "Queued work"} · {String(lane.job.job_type || "work").replaceAll("_", " ")}</small>}
            </article>
          );
        })}
      </section>

      <section className="terminal-stream">
        <header>
          <div><span>UNIFIED EVENT STREAM</span><strong>{filter === "ALL" ? "All systems" : filter}</strong></div>
          <nav aria-label="Filter terminal events">
            {(["ALL", ...TERMINAL_SYSTEMS] as TerminalFilter[]).map(item => (
              <button
                type="button"
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
              >{item}</button>
            ))}
          </nav>
        </header>
        <div className="terminal-stream-head" aria-hidden="true"><span>TIME</span><span>SYSTEM</span><span>SOURCE</span><span>EVENT</span></div>
        <ol>
          {visible.length ? visible.slice(0, 80).map(row => (
            <li key={row.id} className={"tone-" + stateTone(row.state)}>
              <time dateTime={row.at || undefined}>{row.at ? new Date(row.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}</time>
              <span className="terminal-event-system"><SystemIcon system={row.system} size="xs" /><b>{row.system}</b></span>
              <span className="terminal-event-source">{row.source}</span>
              <div><strong>{row.title}</strong>{row.detail && <p>{row.detail}</p>}<small>{ageText(row.at, now)}</small></div>
            </li>
          )) : <li className="terminal-empty">No recorded events for this filter.</li>}
        </ol>
      </section>

      <footer className="terminal-footer">
        <span>READ ONLY · no execution authority</span>
        <span>IREN / Foundation + durable telemetry</span>
      </footer>
    </article>
  );
}
