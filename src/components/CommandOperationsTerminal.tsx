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
  const researchFocus = system === "GRAEN" ? feed?.research?.current_focus : null;
  const activity = String(job?.title || researchFocus || view.activity || "Awaiting observation.");
  const started = String(job?.started_at || job?.created_at || "");
  return { view, work, job, activity, started };
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
      ...publicEvents(feed)
    ]),
    [snapshot, feed]
  );
  const visible = filter === "ALL" ? events : events.filter(row => row.system === filter);
  const fleetFresh = Boolean(snapshot && !snapshot.stale && !error);
  const activeCount = TERMINAL_SYSTEMS.filter(system => laneActivity(snapshot, feed, system, now).view.active).length;

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

      <section className="terminal-lanes" aria-label="ANEVUM systems">
        {TERMINAL_SYSTEMS.map(system => {
          const lane = laneActivity(snapshot, feed, system, now);
          const tone = stateTone(lane.view.raw);
          const latest = events.find(row => row.system === system);
          const rows = (snapshot?.topology?.services || []).filter(row => runtimeOwner(row) === system);
          return (
            <article
              key={system}
              className={"terminal-lane tone-" + tone + (lane.view.active ? " is-working" : "")}
              style={{ "--terminal-accent": IDENTITY[system].color } as CSSProperties}
            >
              <header>
                <SystemIcon system={system} size="sm" />
                <div><strong>{system}</strong><span>{IDENTITY[system].role}</span></div>
                <b>{displayState(lane.view.raw)}</b>
              </header>
              <div className="terminal-lane-activity">
                <i className={lane.view.active ? "is-live" : ""} aria-hidden="true" />
                <p>{lane.activity}</p>
              </div>
              <dl>
                <div><dt>JOB</dt><dd>{lane.job ? displayState(String(lane.job.status || "UNKNOWN")) : "None active"}</dd></div>
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
