import type { LiveTradingFeed } from "./data";
import type { IrenJobEvent, IrenSnapshot, RuntimeRow } from "./runtime-topology";
import { SYSTEMS, displayState, incidentOwner, runtimeOwner, type SystemName } from "./system-display";

export type CommandTerminalEvent = {
  id: string;
  at?: string | null;
  system: SystemName;
  source: string;
  state?: string | null;
  title: string;
  detail?: string | null;
};

export const TERMINAL_SYSTEMS: SystemName[] = ["GRAEN", "VELUM", "IREN", "RHEN", "NOSTRA"];

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

function jobEvents(snapshot: IrenSnapshot | null): CommandTerminalEvent[] {
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

function runtimeEvents(snapshot: IrenSnapshot | null): CommandTerminalEvent[] {
  return (snapshot?.topology?.services || []).flatMap(row => {
    const system = runtimeOwner(row);
    if (!system) return [];
    const state = String(row.status || "UNKNOWN").toUpperCase();
    const abnormal = ["OFFLINE", "DEGRADED", "INCIDENT", "STALE", "UNKNOWN"].includes(state);
    if (!row.current_activity && !abnormal) return [];
    return [{
      id: "runtime-" + row.service_id + "-" + String(stamp(row, snapshot?.observed_at)),
      at: stamp(row, snapshot?.observed_at),
      system,
      source: row.current_activity ? "RUNTIME ACTIVITY" : "RUNTIME HEALTH",
      state: row.status,
      title: row.service_name || row.service_id,
      detail: row.current_activity || displayState(row.status)
    }];
  });
}

function controlEvents(snapshot: IrenSnapshot | null): CommandTerminalEvent[] {
  const transitions = (snapshot?.operator?.recent_transitions || []).map((row, index): CommandTerminalEvent => ({
    id: "control-" + String(row.key || index) + "-" + String(row.created_at || index),
    at: row.created_at,
    system: "IREN",
    source: "CONTROL TRANSITION",
    state: row.severity,
    title: displayState(row.transition || "control transition"),
    detail: row.reason ? row.reason.replaceAll("_", " ") : row.key
  }));

  const incidents = (snapshot?.incidents || []).map((row, index): CommandTerminalEvent => ({
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

function publicEvents(feed?: LiveTradingFeed | null): CommandTerminalEvent[] {
  const telemetry = (feed?.events || []).map((row, index): CommandTerminalEvent => ({
    id: "telemetry-" + String(row.at || index) + "-" + index,
    at: row.at,
    system: "RHEN",
    source: "DURABLE TELEMETRY",
    state: row.kind,
    title: displayState(row.type || "runtime event"),
    detail: row.label
  }));

  const research = (feed?.research?.completed_decisions || []).map((row, index): CommandTerminalEvent => ({
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

function researchEvents(snapshot: IrenSnapshot | null): CommandTerminalEvent[] {
  const problems = snapshot?.research?.graen_problems || [];
  const runs = snapshot?.research?.graen_runs || [];
  const activeVelumStage = problems.find(row =>
    String(row.research_stage || "").includes("VELUM")
    && ["RUNNING", "QUEUED", "WAITING", "BLOCKED"].includes(String(row.status || "").toUpperCase())
  )?.research_stage;

  const problemEvents = problems.map((row, index): CommandTerminalEvent => ({
    id: "graen-problem-" + String(row.problem_id || index) + "-" + String(row.updated_at || index),
    at: row.updated_at || row.started_at,
    system: "GRAEN",
    source: "GRAEN STAGE",
    state: row.status,
    title: row.title || "Research problem",
    detail: row.research_stage ? displayState(row.research_stage) : "No active research stage"
  }));

  const runEvents = runs.map((row, index): CommandTerminalEvent => ({
    id: "graen-run-" + String(row.run_id || index),
    at: row.completed_at || row.started_at || row.created_at,
    system: "GRAEN",
    source: "GRAEN RUN",
    state: row.status,
    title: row.result_state ? displayState(row.result_state) : "Research execution",
    detail: [
      row.methodology_version ? "method: " + row.methodology_version : "",
      row.result_state ? "state: " + displayState(row.result_state) : "",
      row.error ? "error: " + row.error.slice(0, 140) : ""
    ].filter(Boolean).join(" · ")
  }));

  const replayEvents = (snapshot?.research?.velum_replays || []).map((row, index): CommandTerminalEvent => ({
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

function sortEvents(rows: CommandTerminalEvent[]) {
  const seen = new Set<string>();
  return rows
    .filter(row => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .sort((a, b) => (Date.parse(b.at || "") || 0) - (Date.parse(a.at || "") || 0));
}

export function buildCommandEvents(snapshot: IrenSnapshot | null, feed?: LiveTradingFeed | null) {
  return sortEvents([
    ...jobEvents(snapshot),
    ...runtimeEvents(snapshot),
    ...controlEvents(snapshot),
    ...researchEvents(snapshot),
    ...publicEvents(feed)
  ]);
}
