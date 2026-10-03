import type { LiveTradingFeed, PublicSystemState } from "./data";
import type { IrenSnapshot, RuntimeRow, IrenIncident } from "./runtime-topology";

export const SYSTEMS = ["IREN", "RHEN", "GRAEN", "NOSTRA", "VELUM"] as const;
export type SystemName = typeof SYSTEMS[number];
export type Tone = "good" | "active" | "warn" | "bad" | "quiet";
export const IDENTITY = {
  IREN: { role: "Operating intelligence", accent: "🧭", slack: ":iren:", color: "#6EA1FF" },
  RHEN: { role: "Market observation", accent: "📈", slack: ":rhen:", color: "#6FD1FF" },
  GRAEN: { role: "Mathematical research", accent: "📐", slack: ":graen:", color: "#D0B37A" },
  NOSTRA: { role: "Forecast research", accent: "🔮", slack: ":nostra:", color: "#A99BE8" },
  VELUM: { role: "Temporal replay", accent: "⏱", slack: ":velum:", color: "#56B8BC" }
} as const;
// Matches app/slack_brand.py's concepts; Slack assets are not shipped to the browser.
export const SEMANTIC = { health: "✓", warning: "!", critical: "×", live: "◉", research: "⌘", forecast: "⑂", replay: "↺", execution: "↗", freshness: "◷", job: "◇", objective: "◎", incident: "!", data: "≋", waiting: "○" } as const;
const LABELS: Record<string, string> = {
  HEALTHY: "Healthy", RUNNING: "Active", ACTIVE: "Active", CANONICAL_CONTROL_STATE: "Control active",
  LIVE_TELEMETRY: "Live telemetry", LIVE_BASELINE: "Baseline tracking", READY: "Ready",
  IDLE: "Ready / idle", OFFLINE: "Offline", OFFLINE_BY_DESIGN: "Offline by design",
  STALE: "Data stale", DEGRADED: "Needs attention", WAITING: "Waiting", BLOCKED: "Blocked",
  NEEDS_APPROVAL: "Needs approval", ATTENTION_REQUIRED: "Needs attention", CRITICAL: "Critical",
  FAILED: "Failed", CRASHED: "Offline", UNAVAILABLE: "Unavailable", UNKNOWN: "Unverified",
  QUEUED: "Queued", SUCCEEDED: "Complete", COMPLETE: "Complete", COMPLETED: "Complete",
  REJECTED: "Rejected", CANCELLED: "Cancelled", CONNECTING: "Connecting", OPEN: "Open",
  CLOSED: "Closed", REPLAYING: "Replaying", FORECASTING: "Forecasting", RESEARCHING: "Researching",
  OBSERVING: "Observing", WAITING_FOR_INPUTS: "Waiting for inputs", COLLECTING: "Collecting evidence"
};
export function displayState(raw?: string | null) {
  const key = String(raw || "UNKNOWN").toUpperCase();
  return LABELS[key] || key.toLowerCase().replaceAll("_", " ").replace(/^./, c => c.toUpperCase());
}
export function stateTone(raw?: string | null): Tone {
  const key = String(raw || "").toUpperCase();
  if (["OFFLINE", "FAILED", "CRASHED", "CRITICAL", "OFFLINE_BY_DESIGN"].includes(key)) return "bad";
  if (["DEGRADED", "BLOCKED", "NEEDS_APPROVAL", "ATTENTION_REQUIRED", "WARNING"].includes(key)) return "warn";
  if (["HEALTHY", "READY", "IDLE", "COMPLETE", "COMPLETED", "SUCCEEDED"].includes(key)) return "good";
  if (["RUNNING", "ACTIVE", "OBSERVING", "FORECASTING", "RESEARCHING", "REPLAYING", "LIVE_TELEMETRY", "CANONICAL_CONTROL_STATE", "LIVE_BASELINE"].includes(key)) return "active";
  return "quiet";
}
export function freshStamp(stamp?: string | null, now = Date.now(), maxAge = 180000) {
  if (!stamp || !/(Z|[+-]\d{2}:\d{2})$/.test(stamp)) return false;
  const age = now - Date.parse(stamp);
  return Number.isFinite(age) && age >= 0 && age <= maxAge;
}
export function ageText(stamp?: string | null, now = Date.now()) {
  if (!stamp || !Number.isFinite(Date.parse(stamp))) return "No observation";
  if (Date.parse(stamp) > now) return "Clock mismatch";
  const seconds = Math.max(0, Math.floor((now - Date.parse(stamp)) / 1000));
  return seconds < 60 ? seconds + "s ago" : seconds < 3600 ? Math.floor(seconds / 60) + "m ago" : Math.floor(seconds / 3600) + "h ago";
}
export function runtimeOwner(row: RuntimeRow): SystemName | null {
  const key = [row.service_id, row.service_name, row.runtime_kind].join(" ").toLowerCase();
  if (/velum/.test(key)) return "VELUM";
  if (/nostra/.test(key)) return "NOSTRA";
  if (/iren|foundation|research[-_ ]?scheduler/.test(key)) return "IREN";
  if (/graen|crypto[-_ ]?edge|research[-_ ]?agent/.test(key)) return "GRAEN";
  if (/rhen|alpaca[-_ ]?trader|preopen/.test(key)) return "RHEN";
  return null;
}
export function incidentOwner(row: IrenIncident): SystemName {
  const key = row.key.toLowerCase();
  if (/workflow|scheduler|foundation|configuration|safety/.test(key)) return "IREN";
  return SYSTEMS.find(name => key.includes(name.toLowerCase())) || "IREN";
}
const OPEN_JOBS = ["QUEUED", "RUNNING", "WAITING", "BLOCKED", "NEEDS_APPROVAL"];
const OPEN_OBJECTIVES = ["ACTIVE", "READY", "WAITING", "BLOCKED", "NEEDS_APPROVAL"];
export function systemWork(snapshot: IrenSnapshot | null | undefined, name: SystemName) {
  return {
    jobs: (snapshot?.work?.jobs || []).filter(row => row.owner_system === name && OPEN_JOBS.includes(String(row.status))),
    objectives: (snapshot?.work?.objectives || []).filter(row => row.owner_system === name && OPEN_OBJECTIVES.includes(String(row.status)))
  };
}
export type SystemView = {
  name: SystemName; raw: string; runtime: string; activity: string; observedAt?: string | null;
  fresh: boolean; active: boolean; jobs?: number; objectives?: number; incidents?: number;
  signal?: string; source: string;
};
function mostSevere(values: string[]): string | undefined {
  for (const group of [
    ["CRITICAL", "FAILED", "CRASHED", "OFFLINE", "OFFLINE_BY_DESIGN"],
    ["DEGRADED", "BLOCKED", "NEEDS_APPROVAL", "ATTENTION_REQUIRED"],
    ["STALE", "UNAVAILABLE", "UNKNOWN"], ["IDLE", "WAITING", "WAITING_FOR_INPUTS"],
    ["READY", "HEALTHY", "RUNNING", "ACTIVE", "REPLAYING", "FORECASTING", "RESEARCHING", "OBSERVING"]
  ]) { const match = values.find(value => group.includes(value)); if (match) return match; }
  return values[0];
}
export function publicSystem(name: SystemName, feed?: LiveTradingFeed | null, now = Date.now(), unavailable = false): SystemView {
  const row: PublicSystemState | undefined = feed?.systems?.[name];
  const fresh = !unavailable && feed?.ok === true && freshStamp(feed.generated_at, now) && freshStamp(row?.observed_at, now);
  const known = mostSevere([row?.health_state, row?.runtime_state].filter(Boolean) as string[]) || "UNAVAILABLE";
  const raw = unavailable ? "UNAVAILABLE" : !row ? "UNAVAILABLE" : !fresh && stateTone(known) !== "bad" ? "STALE" : known;
  const runtime = row?.runtime_state || "UNKNOWN";
  // Runtime availability is not proof of research/forecast/replay work.
  const explicitWork = ["OBSERVING", "RESEARCHING", "FORECASTING", "REPLAYING"].includes(runtime);
  const scan = name === "RHEN" && (feed?.telemetry?.scan_events_10m ?? 0) > 0 && freshStamp(feed?.operational?.latest_scan?.observed_at, now);
  const canAnimate = fresh && ["good", "active"].includes(stateTone(raw));
  return { name, raw, runtime, fresh, active: canAnimate && (explicitWork || scan),
    observedAt: row?.observed_at, activity: row?.activity || "Awaiting a canonical activity observation.",
    signal: canAnimate ? row?.observed_at || undefined : undefined, source: "Foundation public projection" };
}
export function commandSystem(name: SystemName, snapshot: IrenSnapshot | null, feed?: LiveTradingFeed | null, now = Date.now(), unavailable = false): SystemView {
  const rows = (snapshot?.topology?.services || []).filter(row => runtimeOwner(row) === name);
  const fresh = !unavailable && snapshot?.stale === false && freshStamp(snapshot.observed_at, now);
  const work = systemWork(snapshot, name);
  const incidents = snapshot?.incidents.filter(row => incidentOwner(row) === name);
  const states = rows.map(row => row.liveness === false ? "OFFLINE" : row.readiness === false ? "DEGRADED" :
    !freshStamp(row.last_heartbeat_at || row.observed_at || snapshot?.observed_at, now) ? "STALE" : row.status);
  if (name === "IREN" && snapshot) states.push(snapshot.operator?.state || snapshot.state);
  if (incidents?.length) states.push(incidents.some(row => row.severity.toLowerCase() === "critical") ? "CRITICAL" : "DEGRADED");
  const raw = !snapshot ? "UNAVAILABLE" : !fresh ? "STALE" : mostSevere(states) || "UNAVAILABLE";
  const healthy = ["good", "active"].includes(stateTone(raw));
  const publicRow = publicSystem(name, feed, now);
  const ownActivity = rows.find(row => row.current_activity)?.current_activity;
  return { name, raw, runtime: mostSevere(rows.map(row => row.status)) || "UNKNOWN", fresh,
    active: fresh && healthy && (work.jobs.some(row => row.status === "RUNNING") || publicRow.active),
    activity: work.jobs.find(row => row.status === "RUNNING")?.title as string || ownActivity || (publicRow.fresh ? publicRow.activity : "Awaiting a canonical activity observation."),
    observedAt: snapshot?.observed_at,
    jobs: snapshot?.work?.jobs ? work.jobs.length : undefined,
    objectives: snapshot?.work?.objectives ? work.objectives.length : undefined,
    incidents: incidents?.length, signal: fresh && healthy ? String(snapshot?.revision ?? snapshot?.observed_at) : undefined,
    source: "IREN / Foundation" };
}
export function fleetState(views: SystemView[]) {
  if (views.some(view => stateTone(view.raw) === "bad")) return "DEGRADED";
  if (views.some(view => !view.fresh || ["UNAVAILABLE", "UNKNOWN", "STALE"].includes(view.raw))) return "STALE";
  if (views.some(view => stateTone(view.raw) === "warn")) return "DEGRADED";
  return views.length === 5 && views.every(view => ["good", "active"].includes(stateTone(view.raw))) ? "HEALTHY" : "UNAVAILABLE";
}
