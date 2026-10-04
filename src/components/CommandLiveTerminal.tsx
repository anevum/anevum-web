import { useMemo, useState } from "react";
import type { RhenSession } from "../lib/auth";
import type { LiveTradingFeed, PublicResearchEntry, PublicTelemetryEvent } from "../lib/data";
import type { IrenJobEvent, RuntimeRow } from "../lib/runtime-topology";
import {
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
import "./../styles/live-terminal.css";

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

const FILTERS: TerminalFilter[] = ["ALL", ...SYSTEMS];
const OPEN_STATES = new Set(["QUEUED", "RUNNING", "WAITING", "BLOCKED", "NEEDS_APPROVAL"]);

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asText(value: unknown, fallback = "") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function asSystem(value: unknown, fallback: SystemName = "IREN"): SystemName {
  const normalized = asText(value).toUpperCase();
  return SYSTEMS.includes(normalized as SystemName) ? normalized as SystemName : fallback;
}

function elapsedText(value: unknown, now: number) {
  const raw = asText(value);
  const stamp = Date.parse(raw);
  if (!raw || !Number.isFinite(stamp) || stamp > now) return "—";
  const seconds = Math.max(0, Math.floor((now - stamp) / 1000));
  if (seconds < 60) return seconds + "s";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m " + (seconds % 60) + "s";
  const hours = Math.floor(minutes / 60);
  return hours + "h " + (minutes % 60) + "m";
}

function clock(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function firstDetail(payload: Record<string, unknown>) {
  for (const key of ["stage", "phase", "message", "summary", "reason", "detail", "candidate_id", "strategy_id", "run_id"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return key.replaceAll("_", " ") + ": " + value;
  }
  const result = object(payload.result);
  for (const key of ["stage", "status", "decision", "reason", "summary", "artifact"]) {
    const value = result[key];
    if (typeof value === "string" && value.trim()) return key.replaceAll("_", " ") + ": " + value;
  }
  const error = object(payload.error);
  const errorMessage = error.message || error.reason || error.code;
  if (errorMessage) return "error: " + String(errorMessage);
  return "";
}

function jobContext(job?: Record<string, unknown>) {
  if (!job) return [];
  const metadata = object(job.metadata);
  const rows: Array<[string, string]> = [];
  for (const [label, keys] of [
    ["STAGE", ["stage", "phase"]],
    ["RUN", ["run_id", "campaign_id", "experiment_id"]],
    ["CANDIDATE", ["candidate_id", "candidate", "strategy_id"]],
    ["HYPOTHESIS", ["hypothesis", "family", "mechanism"]]
  ] as Array<[string, string[]]>) {
    const key = keys.find(candidate => metadata[candidate] !== undefined && metadata[candidate] !== null && metadata[candidate] !== "");
    if (key) rows.push([label, String(metadata[key])]);
  }
  return rows.slice(0, 4);
}

function runtimeLabel(row?: RuntimeRow) {
  if (!row) return "No owned runtime observed";
  return row.service_name || row.service_id || "Runtime";
}

function TerminalWorkbench({
  system,
  snapshot,
  feed,
  now
}: {
  system: "GRAEN" | "VELUM";
  snapshot: ReturnType<typeof useCommandObservation>["snapshot"];
  feed?: LiveTradingFeed | null;
  now: number;
}) {
  const view = commandSystem(system, snapshot, feed, now);
  const work = systemWork(snapshot, system);
  const jobs = work.jobs;
  const currentJob = jobs.find(row => String(row.status).toUpperCase() === "RUNNING") || jobs[0];
  const runtimes = (snapshot?.topology?.services || []).filter(row => runtimeOwner(row) === system);
  const runtime = runtimes.find(row => row.current_activity) || runtimes[0];
  const latestEvent = (snapshot?.work?.job_events || []).find(row => asSystem(row.owner_system) === system);
  const context = jobContext(currentJob);
  const active = view.active || String(currentJob?.status || "").toUpperCase() === "RUNNING";
  const startedAt = currentJob?.started_at || runtime?.started_at;
  const heartbeat = runtime?.last_heartbeat_at || runtime?.observed_at || view.observedAt;

  return <section className={"terminal-workbench terminal-" + system.toLowerCase() + " tone-" + stateTone(view.raw) + (active ? " is-working" : "")}>
    <header>
      <div className="terminal-system-title">
        <span className="terminal-icon-wrap"><SystemIcon system={system} size="sm" /></span>
        <div><small>{system === "GRAEN" ? "RESEARCH ENGINE" : "REPLAY / SIMULATION"}</small><h2>{system}</h2></div>
      </div>
      <div className="terminal-state"><i aria-hidden="true" /><strong>{displayState(view.raw)}</strong></div>
    </header>

    <div className="terminal-instrument" aria-label={system + " activity instrument"}>
      <SystemInstrument name={system} />
      <div className="terminal-scan-line" aria-hidden="true" />
    </div>

    <div className="terminal-now">
      <span>CURRENT WORK</span>
      <strong>{asText(currentJob?.title, view.activity || "No active job recorded")}</strong>
      <p>{asText(currentJob?.instructions, runtime?.current_activity || view.activity || "Awaiting a canonical activity observation.")}</p>
    </div>

    <div className="terminal-workbench-metrics">
      <div><span>JOB STATE</span><strong>{displayState(asText(currentJob?.status, "IDLE"))}</strong></div>
      <div><span>JOB TYPE</span><strong>{asText(currentJob?.job_type, "—").replaceAll("_", " ")}</strong></div>
      <div><span>ELAPSED</span><strong>{elapsedText(startedAt, now)}</strong></div>
      <div><span>HEARTBEAT</span><strong>{ageText(heartbeat, now)}</strong></div>
    </div>

    {context.length > 0 && <div className="terminal-context">
      {context.map(([label, value]) => <span key={label}><b>{label}</b>{value}</span>)}
    </div>}

    <footer>
      <div><span>RUNTIME</span><strong>{runtimeLabel(runtime)}</strong></div>
      <div><span>LATEST TRANSITION</span><strong>{latestEvent ? displayState(latestEvent.event_type) + " · " + ageText(latestEvent.created_at, now) : "No transition exposed yet"}</strong></div>
    </footer>
  </section>;
}

function feedEvent(row: PublicTelemetryEvent, index: number): TerminalEvent {
  return {
    id: "feed:" + asText(row.at, String(index)) + ":" + index,
    at: row.at,
    system: "RHEN",
    source: "TELEMETRY",
    state: row.kind,
    title: displayState(row.type || "runtime event"),
    detail: row.label
  };
}

function researchEvent(row: PublicResearchEntry, index: number): TerminalEvent {
  return {
    id: "research:" + asText(row.at, String(index)) + ":" + index,
    at: row.at,
    system: "GRAEN",
    source: "RESEARCH",
    state: row.classification || row.type,
    title: row.title || row.focus || displayState(row.type || "research update"),
    detail: row.summary || row.next_action
  };
}

function jobEvent(row: IrenJobEvent): TerminalEvent {
  return {
    id: "job:" + row.event_id,
    at: row.created_at,
    system: asSystem(row.owner_system),
    source: "JOB",
    state: row.event_type,
    title: (row.title || row.job_type || "IREN work item") + " · " + displayState(row.event_type),
    detail: firstDetail(object(row.event)) || row.objective_key || ""
  };
}

export default function CommandLiveTerminal({ session, feed }: { session: RhenSession; feed?: LiveTradingFeed | null }) {
  const { snapshot, error, now, receivedAt } = useCommandObservation(session, 2500);
  const [filter, setFilter] = useState<TerminalFilter>("ALL");

  const views = SYSTEMS.map(system => commandSystem(system, snapshot, feed, now, Boolean(error)));
  const runningJobs = (snapshot?.work?.jobs || []).filter(row => String(row.status || "").toUpperCase() === "RUNNING");
  const openJobs = (snapshot?.work?.jobs || []).filter(row => OPEN_STATES.has(String(row.status || "").toUpperCase()));

  const events = useMemo(() => {
    const rows: TerminalEvent[] = [];

    for (const row of snapshot?.work?.job_events || []) rows.push(jobEvent(row));

    for (const row of snapshot?.topology?.services || []) {
      const system = runtimeOwner(row);
      if (!system) continue;
      rows.push({
        id: "runtime:" + row.service_id,
        at: row.last_heartbeat_at || row.observed_at,
        system,
        source: "RUNTIME",
        state: row.status,
        title: runtimeLabel(row) + " · " + displayState(row.status),
        detail: row.current_activity || (row.readiness === false ? "Runtime is not ready" : "Heartbeat observed")
      });
    }

    for (const row of snapshot?.incidents || []) {
      rows.push({
        id: "incident:" + row.key,
        at: row.opened_at || snapshot?.observed_at,
        system: incidentOwner(row),
        source: "INCIDENT",
        state: row.severity,
        title: displayState(row.reason || "Operational incident"),
        detail: row.key
      });
    }

    for (const [index, row] of (snapshot?.operator?.recent_transitions || []).entries()) {
      rows.push({
        id: "transition:" + asText(row.key, String(index)) + ":" + index,
        at: row.created_at,
        system: "IREN",
        source: "IREN",
        state: row.severity || row.transition,
        title: displayState(row.transition || "control transition"),
        detail: row.reason ? row.reason.replaceAll("_", " ") : row.key
      });
    }

    for (const [index, row] of (feed?.events || []).entries()) rows.push(feedEvent(row, index));
    for (const [index, row] of (feed?.research?.journal || []).entries()) rows.push(researchEvent(row, index));

    const decisions = feed?.research?.completed_decisions || [];
    for (const [index, row] of decisions.entries()) {
      rows.push({
        id: "decision:" + asText(row.decision_key, String(index)),
        at: row.at,
        system: "GRAEN",
        source: "DECISION",
        state: row.status || row.decision_type,
        title: row.subject || displayState(row.decision_type || "research decision"),
        detail: row.conclusion || row.methodology_version
      });
    }

    return rows
      .filter(row => row.at && Number.isFinite(Date.parse(String(row.at))))
      .sort((a, b) => Date.parse(String(b.at)) - Date.parse(String(a.at)));
  }, [snapshot, feed]);

  const visibleEvents = filter === "ALL" ? events : events.filter(row => row.system === filter);

  return <section className="live-terminal" aria-label="ANEVUM live operations terminal">
    <div className="terminal-statusbar">
      <div className="terminal-status-left">
        <span className={"terminal-live-dot " + (!error && snapshot && !snapshot.stale ? "is-live" : "is-stale")} />
        <div><strong>{!error && snapshot && !snapshot.stale ? "LIVE OBSERVATION" : "OBSERVATION DEGRADED"}</strong><small>{error || "IREN / Foundation · read-only"}</small></div>
      </div>
      <div className="terminal-status-metrics">
        <span><b>REV</b>{snapshot?.revision ?? "—"}</span>
        <span><b>RUNNING</b>{runningJobs.length}</span>
        <span><b>OPEN</b>{openJobs.length}</span>
        <span><b>EVENTS</b>{events.length}</span>
        <span><b>RECEIVED</b>{ageText(receivedAt, now)}</span>
      </div>
    </div>

    <div className="terminal-focus-grid">
      <TerminalWorkbench system="GRAEN" snapshot={snapshot} feed={feed} now={now} />
      <TerminalWorkbench system="VELUM" snapshot={snapshot} feed={feed} now={now} />
    </div>

    <section className="terminal-rack" aria-label="All ANEVUM systems">
      <header><span>ALL SYSTEMS</span><small>Canonical state · runtime heartbeat · active work</small></header>
      <div className="terminal-rack-grid">
        {views.map(view => {
          const work = systemWork(snapshot, view.name);
          const runtimes = (snapshot?.topology?.services || []).filter(row => runtimeOwner(row) === view.name);
          const heartbeat = runtimes.map(row => row.last_heartbeat_at || row.observed_at).filter(Boolean).sort((a,b) => Date.parse(String(b)) - Date.parse(String(a)))[0];
          return <article key={view.name} className={"terminal-rack-item tone-" + stateTone(view.raw) + (view.active ? " is-working" : "")}>
            <div className="terminal-rack-head"><SystemIcon system={view.name} size="xs" /><strong>{view.name}</strong><i aria-hidden="true" /></div>
            <span>{displayState(view.raw)}</span>
            <p>{view.activity}</p>
            <footer><small>{work.jobs.length} open job{work.jobs.length === 1 ? "" : "s"}</small><small>{heartbeat ? ageText(heartbeat, now) : "no heartbeat"}</small></footer>
          </article>;
        })}
      </div>
    </section>

    <section className="terminal-console">
      <header className="terminal-console-head">
        <div><span>EVENT STREAM</span><strong>What the system is doing</strong></div>
        <div className="terminal-filters" role="group" aria-label="Filter terminal events">
          {FILTERS.map(name => <button key={name} type="button" className={filter === name ? "active" : ""} onClick={() => setFilter(name)}>{name}</button>)}
        </div>
      </header>
      <div className="terminal-columns" aria-hidden="true"><span>TIME</span><span>SYSTEM</span><span>SOURCE</span><span>EVENT</span></div>
      <div className="terminal-stream" aria-live="polite">
        {visibleEvents.slice(0, 100).map(row => <article key={row.id} className={"terminal-event tone-" + stateTone(row.state)}>
          <time dateTime={row.at || undefined} title={row.at || undefined}>{clock(row.at)}</time>
          <span className="terminal-event-system"><SystemIcon system={row.system} size="xs" /><b>{row.system}</b></span>
          <span className="terminal-event-source">{row.source}</span>
          <div><strong>{row.title}</strong>{row.detail && <p>{row.detail}</p>}<small>{ageText(row.at, now)}</small></div>
        </article>)}
        {!visibleEvents.length && <div className="terminal-empty">No observed events for this filter yet.</div>}
      </div>
    </section>

    <footer className="terminal-boundary">
      <span>READ-ONLY OBSERVABILITY</span>
      <p>This terminal displays durable IREN work transitions, runtime observations, incidents, research records, and RHEN telemetry. It does not grant broker, research-stage, promotion, or configuration authority.</p>
    </footer>
  </section>;
}
