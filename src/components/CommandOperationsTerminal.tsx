import { useMemo, type CSSProperties } from "react";
import type { LiveTradingFeed } from "../lib/data";
import type { IrenSnapshot } from "../lib/runtime-topology";
import {
  IDENTITY,
  ageText,
  commandSystem,
  displayState,
  runtimeOwner,
  stateTone,
  systemWork,
  type SystemName
} from "../lib/system-display";
import type { CommandObservation } from "../hooks/useCommandObservation";
import SystemIcon from "./company/SystemIcon";
import { buildCommandEvents, TERMINAL_SYSTEMS, type CommandTerminalEvent } from "../lib/command-events";
import "../styles/operations-terminal.css";

type TerminalEvent = CommandTerminalEvent;

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

function activeResearchProblem(snapshot: IrenSnapshot | null, system: SystemName) {
  const activeStates = ["RUNNING", "QUEUED", "WAITING", "BLOCKED"];
  return (snapshot?.research?.graen_problems || []).find(row => {
    if (!activeStates.includes(String(row.status || "").toUpperCase())) return false;
    const stage = String(row.research_stage || "");
    return system === "VELUM" ? stage.includes("VELUM_REPLAY") : true;
  });
}

function laneActivity(snapshot: IrenSnapshot | null, feed: LiveTradingFeed | null | undefined, system: SystemName, now: number) {
  const view = commandSystem(system, snapshot, feed, now);
  const work = systemWork(snapshot, system);
  const running = work.jobs.find(row => String(row.status) === "RUNNING");
  const queued = work.jobs.find(row => String(row.status) === "QUEUED");
  const job = running || queued || work.jobs[0];

  const activeProblem = activeResearchProblem(snapshot, system);
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
  if (system === "VELUM" && (activeProblem || activeReplay)) {
    traceActivity = stage ? displayState(stage) : "Replay running";
    traceStatus = activeReplay?.status || activeProblem?.status || null;
    traceType = stage ? displayState(stage) : "VELUM replay";
    traceStarted = activeReplay?.started_at || activeProblem?.started_at || activeProblem?.updated_at || null;
  }

  const runningJob = String(job?.status || "").toUpperCase() === "RUNNING";
  const queuedJob = String(job?.status || "").toUpperCase() === "QUEUED";
  const traceActive = String(traceStatus || "").toUpperCase() === "RUNNING";
  let activityState = view.activityState;
  if (traceActive) activityState = system === "VELUM" ? "REPLAYING" : "RESEARCHING";
  else if (runningJob) activityState = "RUNNING";
  else if (queuedJob && activityState === "WAITING_FOR_WORK") activityState = "QUEUED";

  const active = view.active || traceActive || runningJob;
  const fallback = system === "IREN"
    ? "Supervising; no active jobs."
    : system === "RHEN"
      ? "No current executable cycle."
      : system === "GRAEN"
        ? "No active research run."
        : system === "VELUM"
          ? "No replay currently running."
          : "No forecast cycle currently running.";
  const activity = String(traceActivity || (job?.title ? String(job.title) : "") || (active ? view.activity : "") || fallback);
  const started = String(traceStarted || job?.started_at || activeProblem?.started_at || job?.created_at || "");
  return { view, work, job, activity, activityState, active, started, traceStatus, traceType, traceActive, activeProblem };
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

function researchContext(snapshot: IrenSnapshot | null, system: "GRAEN" | "VELUM") {
  const problem = activeResearchProblem(snapshot, system);
  if (!problem) return [] as Array<[string, string]>;
  const run = (snapshot?.research?.graen_runs || []).find(row =>
    row.problem_id && row.problem_id === problem.problem_id
  );
  const rows: Array<[string, string | null | undefined]> = [
    ["STAGE", problem.research_stage ? displayState(problem.research_stage) : null],
    ["RUN", run?.run_id || problem.campaign_id],
    ["CANDIDATE", problem.candidate_id],
    ["HYPOTHESIS", problem.hypothesis || problem.family || problem.mechanism]
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1])).slice(0, 4);
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
  const jobMeta = jobContext(lane.job);
  const context = jobMeta.length ? jobMeta : researchContext(snapshot, system);
  const startedAt = lane.started || runtime?.started_at;
  const heartbeat = runtime?.last_heartbeat_at || runtime?.observed_at || lane.view.observedAt ||
    (system === "GRAEN" ? snapshot?.research?.graen_runtime?.heartbeat_at : null);
  const live = lane.active;

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
        <div className="terminal-focus-state"><i aria-hidden="true" /><strong>{displayState(lane.view.health)} · {displayState(lane.activityState)}</strong></div>
      </header>

      <div className="terminal-focus-work">
        <span>CURRENT WORK</span>
        <strong>{lane.activity}</strong>
        <p>{runtime?.current_activity || (lane.job?.title ? String(lane.job.title) : lane.activity)}</p>
      </div>

      {context.length > 0 && <div className="terminal-focus-context">
        {context.map(([label, value]) => <span key={label}><b>{label}</b>{value}</span>)}
      </div>}

      <dl className="terminal-focus-metrics">
        <div><dt>ACTIVITY</dt><dd>{displayState(lane.activityState)}</dd></div>
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
  observation,
  feed,
  feedError
}: {
  observation: CommandObservation;
  feed?: LiveTradingFeed | null;
  feedError?: string;
}) {
  const { snapshot, error, now, receivedAt } = observation;
  const events = useMemo(() => buildCommandEvents(snapshot, feed), [snapshot, feed]);
  const fleetFresh = Boolean(snapshot && !snapshot.stale && !error);
  const activeCount = TERMINAL_SYSTEMS.filter(system => {
    const lane = laneActivity(snapshot, feed, system, now);
    return lane.active;
  }).length;

  return (
    <article className="command-panel command-view-terminal operations-terminal" data-visual-ops="terminal" aria-label="ANEVUM live operations terminal">
      <header className="terminal-heading">
        <div>
          <span>COMMAND / LIVE OPERATIONS</span>
          <h1>System terminal</h1>
          <p>Evidence-backed activity across the named modules inside the unified RHEN runtime.</p>
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
              className={"terminal-lane tone-" + tone + (lane.active ? " is-working" : "")}
              style={{ "--terminal-accent": IDENTITY[system].color } as CSSProperties}
            >
              <header>
                <SystemIcon system={system} size="sm" />
                <div><strong>{system}</strong><span>{IDENTITY[system].role}</span></div>
                <b>{displayState(lane.view.health)}</b>
              </header>
              <div className="terminal-lane-activity">
                <i className={lane.active ? "is-live" : ""} aria-hidden="true" />
                <p>{lane.activity}</p>
              </div>
              <dl>
                <div><dt>ACTIVITY</dt><dd>{displayState(lane.activityState)}</dd></div>
                <div><dt>RUNTIMES</dt><dd>{rows.length || "—"}</dd></div>
                <div><dt>LAST EVENT</dt><dd>{latest ? ageText(latest.at, now) : "No substantive event"}</dd></div>
              </dl>
              {lane.job && <small className="terminal-job-age">{lane.started ? "Started " + ageText(lane.started, now) : "Queued work"} · {String(lane.job.job_type || "work").replaceAll("_", " ")}</small>}
            </article>
          );
        })}
      </section>

      <footer className="terminal-footer">
        <span>READ ONLY · no execution authority</span>
        <span>IREN / RHEN Core + durable telemetry</span>
      </footer>
    </article>
  );
}
