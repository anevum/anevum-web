import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import SystemIcon from "../company/SystemIcon";
import SystemInstrument from "./SystemInstruments";
import { ageText, displayState, IDENTITY, SEMANTIC, stateTone, type SystemName, type SystemView, freshStamp } from "../../lib/system-display";
import type { IrenIncident, RuntimeRow } from "../../lib/runtime-topology";
import type { LiveTradingFeed } from "../../lib/data";
import "../../styles/visual-ops.css";

export function SystemStatusChip({ state }: { state?: string | null }) {
  const tone = stateTone(state);
  return <span className={"vo-chip tone-" + tone} title={"Canonical state: " + (state || "UNKNOWN")}><i aria-hidden="true">{tone === "bad" ? "×" : tone === "warn" ? "!" : tone === "quiet" ? "○" : "●"}</i>{displayState(state)}</span>;
}
export function SystemMetric({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) {
  return <div className="vo-metric"><span>{label}</span><strong>{value ?? "—"}</strong>{detail && <small>{detail}</small>}</div>;
}
export function SectionHead({ title, eyebrow, detail }: { title: string; eyebrow?: string; detail?: string }) {
  return <header className="vo-section-head"><div>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2></div>{detail && <small>{detail}</small>}</header>;
}
function visualClass(view: SystemView) {
  return " vo-system-" + view.name.toLowerCase() + " tone-" + stateTone(view.raw) +
    (view.fresh ? " is-fresh" : " is-stale") + (view.active ? " is-working" : "");
}
export function SystemVisualShell({ view, to, hero = false, now = Date.now() }: { view: SystemView; to?: string; hero?: boolean; now?: number }) {
  const identity = IDENTITY[view.name];
  const body = <><div className="vo-card-top"><SystemIcon system={view.name} size={hero ? "lg" : "sm"} /><SystemStatusChip state={view.raw} /></div>
    <div className="vo-card-identity"><div><span>{identity.role}</span><h3>{view.name}</h3></div><span className="vo-accent" aria-hidden="true">{identity.accent}</span></div>
    <div className="vo-instrument-frame"><SystemInstrument name={view.name} /><i key={view.signal} className={view.signal ? "vo-arrival" : "vo-no-arrival"} aria-hidden="true" /></div>
    <div className="vo-work-label"><i aria-hidden="true" />{view.active ? "Activity observed" : view.fresh ? displayState(view.runtime) : view.runtime !== "UNKNOWN" ? "Last reported: " + displayState(view.runtime) : "Awaiting fresh evidence"}</div>
    <p className="vo-activity" title={view.activity}>{view.activity}</p>
    {(view.jobs !== undefined || view.objectives !== undefined || view.incidents !== undefined) && <div className="vo-card-counts"><span>◇ <b>{view.jobs ?? "—"}</b> jobs</span><span>◎ <b>{view.objectives ?? "—"}</b> objectives</span><span className={view.incidents ? "vo-attention" : ""}>! <b>{view.incidents ?? "—"}</b> incidents</span></div>}
    <footer><span title={view.observedAt || undefined}>{SEMANTIC.freshness} {ageText(view.observedAt, now)}</span><span>{to ? "Open monitor ↗" : "Activity schematic"}</span></footer></>;
  return to ? <Link to={to} className={"vo-system-card" + visualClass(view)} aria-label={view.name + ": " + displayState(view.raw) + ", activity " + displayState(view.runtime) + ". Open monitor"} data-system={view.name} data-state={view.raw} data-activity={view.runtime} data-active={view.active}>{body}</Link> :
    <section className={"vo-system-card vo-hero-card" + visualClass(view)} aria-label={view.name + " activity instrument"} data-system={view.name} data-state={view.raw} data-activity={view.runtime} data-active={view.active}>{body}</section>;
}
export function SystemConstellation({ views, command = false, compact = false }: { views: SystemView[]; command?: boolean; compact?: boolean }) {
  return <div className={"vo-constellation" + (compact ? " is-compact" : "")} aria-label="Five-system constellation">
    <div className="vo-constellation-caption"><span>ANEVUM / SYSTEM ARRAY</span><small>Signals follow fresh observations</small></div>
    <svg className="vo-connections" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
      {views.filter(view => view.name !== "IREN").map((view, i) => {
        const ends = [[210,95],[790,95],[210,265],[790,265]][i];
        return <g key={view.name} className={visualClass(view)}><path d={"M500 180L" + ends.join(" ")} className="vo-link-base" /><path d={"M500 180L" + ends.join(" ")} className="vo-link-signal" key={view.signal} /></g>;
      })}
    </svg>
    <div className="vo-core-ring" aria-hidden="true" />
    {views.map(view => <Link key={view.name} to={(command ? "/command/" : "/products/") + view.name.toLowerCase()} className={"vo-node vo-node-" + view.name.toLowerCase() + visualClass(view)} aria-label={view.name + ": " + displayState(view.raw) + ". Open monitor"} data-state={view.raw}>
      <SystemIcon system={view.name} size="lg" /><strong>{view.name}</strong><SystemStatusChip state={view.raw} /><span className="vo-node-work">{view.active ? "Work in progress" : view.fresh ? displayState(view.runtime) : view.runtime !== "UNKNOWN" ? "Reported: " + displayState(view.runtime) : "Observation unavailable"}</span>
    </Link>)}
  </div>;
}
export type TimelineItem = { id: string; title: string; detail?: string | null; at?: string | null; state?: string | null; system?: SystemName };
export function SystemTimeline({ items, empty = "No recent activity recorded.", now = Date.now() }: { items: TimelineItem[]; empty?: string; now?: number }) {
  return items.length ? <ol className="vo-timeline">{items.slice(0,8).map(item => <li key={item.id}>
    <span className={"vo-timeline-dot tone-" + stateTone(item.state)} aria-hidden="true">{item.system ? <SystemIcon system={item.system} size="xs" /> : "◇"}</span>
    <div><strong>{item.title}</strong>{item.detail && <p>{item.detail}</p>}</div><time dateTime={item.at || undefined} title={item.at || undefined}>{ageText(item.at, now)}</time>
  </li>)}</ol> : <p className="vo-empty">{SEMANTIC.data} {empty}</p>;
}
export function SystemWorkQueue({ rows, known, kind, now }: { rows: Array<Record<string, unknown>>; known: boolean; kind: "jobs" | "objectives"; now: number }) {
  return <div className="vo-work-queue">{rows.length ? rows.slice(0,6).map((row,index) => <article key={String(row.job_id || row.objective_key || index)} className={row.status === "RUNNING" ? "is-running" : ""}>
    <span className="vo-queue-icon" aria-hidden="true">{kind === "jobs" ? SEMANTIC.job : SEMANTIC.objective}</span>
    <div><strong>{String(row.title || (kind === "jobs" ? "System job" : "System objective"))}</strong><p>{String(row.description || row.job_type || "IREN work item").replaceAll("_", " ")}</p><time>{ageText(String(row.updated_at || row.created_at || row.started_at || ""), now)}</time></div>
    <SystemStatusChip state={String(row.status || "UNKNOWN")} />
  </article>) : <p className="vo-empty">{known ? "○ No active " + kind + " recorded." : "○ Work evidence unavailable."}</p>}</div>;
}
export function SystemIncidentPanel({ incidents, known, stale = false }: { incidents: IrenIncident[]; known: boolean; stale?: boolean }) {
  if (!known || stale && !incidents.length) return <p className="vo-empty">○ Incident evidence unavailable. Awaiting a fresh observation.</p>;
  return incidents.length ? <div className="vo-incidents">{stale && <small>Last known incidents · observation stale</small>}{incidents.map(row => <article key={row.key} className={"tone-" + stateTone(row.severity)}>
    <span className="vo-incident-icon" aria-hidden="true">!</span><div><strong>{displayState(row.reason || "Operational incident")}</strong><details><summary>Incident identity</summary><code>{row.key}</code></details></div><SystemStatusChip state={row.severity} />
  </article>)}</div> : <p className="vo-empty is-clear">✓ No active incidents</p>;
}
export function RuntimeDetails({ rows, revision }: { rows: RuntimeRow[]; revision?: string | number | null }) {
  return <details className="vo-details"><summary>Technical details <span>Runtime identity & provenance</span></summary>
    <small>IREN observation revision: {revision ?? "unavailable"}</small>
    <div className="vo-runtime-list">{rows.map(row => <article key={row.service_id}><strong>{row.service_name || row.service_id}</strong><dl>
      {Object.entries({Service:row.service_id, State:row.status, Revision:row.revision, Deployment:row.deployment, Observed:row.last_heartbeat_at || row.observed_at, Source:row.observation_source}).map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || "Unavailable"}</dd></div>)}
    </dl></article>)}</div>{!rows.length && <p>Runtime inventory unavailable.</p>}
  </details>;
}
export function TelemetryActivity({ feed }: { feed?: LiveTradingFeed | null }) {
  const buckets = (feed?.activity || []).filter(row => row.count != null && Number.isFinite(Number(row.count)) && Number(row.count) >= 0);
  const max = Math.max(1, ...buckets.map(row => Number(row.count)));
  return <section className="vo-panel vo-telemetry"><SectionHead eyebrow="RHEN / DURABLE TELEMETRY" title="Market observation" detail={freshStamp(feed?.generated_at) ? "Counts are events, not trades" : "Last known counts · data stale"} />
    <div className="vo-metrics"><SystemMetric label="Events · 60m" value={feed?.telemetry?.events_60m} /><SystemMetric label="Scans · 10m" value={feed?.telemetry?.scan_events_10m} /><SystemMetric label="Reconciliations · 2h" value={feed?.telemetry?.reconciliations_2h} /><SystemMetric label="Errors · 2h" value={feed?.telemetry?.errors_2h} /></div>
    {buckets.length ? <div className="vo-buckets" role="img" aria-label={buckets.map(row => ageText(row.at) + ": " + row.count + " events").join("; ")}>{buckets.map((row,index) => <div key={String(row.at || index)}><i style={{"--bar-height": Number(row.count) / max * 100 + "%"} as CSSProperties} /><span>{row.count}</span><small>{row.at ? new Date(row.at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "—"}</small></div>)}</div> : <p className="vo-empty">○ No telemetry buckets available</p>}
    <small className="vo-caption">Durable events per 10-minute bucket · no synthetic history</small>
  </section>;
}
