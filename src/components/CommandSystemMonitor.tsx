import { Link } from "react-router-dom";
import type { RhenSession } from "../lib/auth";
import type { LiveTradingFeed } from "../lib/data";
import { useCommandObservation } from "../hooks/useCommandObservation";
import { ageText, commandSystem, displayState, incidentOwner, runtimeOwner, systemWork, type SystemName } from "../lib/system-display";
import { RuntimeDetails, SectionHead, SystemIncidentPanel, SystemMetric, SystemStatusChip, SystemTimeline, SystemVisualShell, SystemWorkQueue, TelemetryActivity, type TimelineItem } from "./operations/VisualOps";
export type MonitoredSystem = SystemName;
const RELATED: Record<SystemName, Array<[string,string]>> = {
  IREN: [["/command/infrastructure","Infrastructure"]],
  RHEN: [["/command/live","Live"],["/command/performance","Performance"],["/command/evidence","Evidence"],["/command/research","Research"]],
  GRAEN: [["/command/research","Research record"]], NOSTRA: [["/products/nostra","About NOSTRA"]], VELUM: [["/products/velum","About VELUM"]]
};
export default function CommandSystemMonitor({ session, feed, system }: { session: RhenSession; feed?: LiveTradingFeed | null; system: SystemName }) {
  const { snapshot, error, now, receivedAt } = useCommandObservation(session);
  const view = commandSystem(system, snapshot, feed, now, Boolean(error));
  const work = systemWork(snapshot, system);
  const rows = (snapshot?.topology?.services || []).filter(row => runtimeOwner(row) === system);
  const incidents = (snapshot?.incidents || []).filter(row => incidentOwner(row) === system);
  const workEvents: TimelineItem[] = (snapshot?.work?.jobs || []).filter(row => row.owner_system === system && (row.updated_at || row.completed_at || row.created_at)).map((row,index) => ({
    id: String(row.job_id || index), title: String(row.title || "System job"), detail: displayState(String(row.status)),
    at: String(row.updated_at || row.completed_at || row.created_at), state: String(row.status), system
  }));
  const events: TimelineItem[] = system === "RHEN" ? (feed?.events || []).map((row,index) => ({id:String(row.at)+index,title:displayState(row.type),detail:row.label,at:row.at,state:row.kind,system})) : system === "IREN" ?
    (snapshot?.operator?.recent_transitions || []).map((row,index) => ({id:String(row.key)+index,title:displayState(row.transition),detail:row.reason?.replaceAll("_"," "),at:row.created_at,state:row.severity,system})) : workEvents;
  events.sort((a,b) => (Date.parse(b.at || "") || 0) - (Date.parse(a.at || "") || 0));
  return <article className="command-panel command-view-system system-monitor vo-console" data-visual-ops={system.toLowerCase()}>
    <header className="vo-console-heading"><div><span>COMMAND / SYSTEM MONITOR</span><h1>{system}</h1></div><Link to="/command/overview">← Overview</Link></header>
    <div className="vo-monitor-hero"><SystemVisualShell view={view} hero now={now} /><section className="vo-panel vo-health-panel"><SectionHead eyebrow="HEALTH & FRESHNESS" title="Operating state" />
      <div className="vo-health-line"><SystemStatusChip state={view.raw} /><span>{ageText(view.observedAt, now)}</span></div>
      <div className="vo-metrics"><SystemMetric label="Open objectives" value={view.objectives} /><SystemMetric label="Active jobs" value={view.jobs} /><SystemMetric label="Incidents" value={view.incidents} />
        <SystemMetric label="Ready runtimes" value={view.fresh && rows.length ? rows.filter(row => row.readiness === true).length + " / " + rows.length : "—"} /></div>
      {system === "IREN" && <div className="vo-metrics"><SystemMetric label="Blocked objectives" value={snapshot?.work?.blocked_objectives} /><SystemMetric label="Human action" value={snapshot?.work?.requires_human} /></div>}
      <p className="vo-caption">{!view.fresh ? "Last known details · fresh evidence unavailable" : "Observed by IREN / Foundation"} · refreshed {ageText(receivedAt,now)}</p>
      {system === "IREN" && snapshot?.operator?.message && <p className="vo-brief-message">{snapshot.operator.message}</p>}
      {system === "NOSTRA" && <p className="vo-caption">Branches describe the system's role. No forecast values or confidence levels are inferred.</p>}
      {system === "VELUM" && <p className="vo-caption">Replay activity is separate from broker execution.</p>}
    </section></div>
    {system === "RHEN" && <><TelemetryActivity feed={feed} /><details className="vo-details"><summary>Strategy & execution telemetry</summary><dl className="vo-facts"><div><dt>Strategy identity</dt><dd>{feed?.active_strategy?.strategy_name || "Unavailable"}</dd></div><div><dt>Recorded strategy state</dt><dd>{displayState(feed?.active_strategy?.status)}</dd></div><div><dt>Execution-related events · 2h</dt><dd>{feed?.telemetry?.execution_events_2h ?? "—"} (not an order or fill count)</dd></div></dl></details></>}
    {system === "GRAEN" && <section className="vo-panel"><SectionHead eyebrow="CANONICAL RESEARCH PROJECTION" title="Research focus" detail={ageText(feed?.research?.last_updated_at, now)} /><SystemStatusChip state={feed?.research?.current_status} /><p className="vo-research-focus">{feed?.research?.current_focus || "No canonical research focus available."}</p><div className="vo-metrics"><SystemMetric label="Recorded questions" value={feed?.research?.active_questions?.length} /><SystemMetric label="Recorded decisions" value={feed?.research?.completed_decisions?.length} /></div></section>}
    <section className="vo-panel"><SectionHead eyebrow="IREN / OWNED BY THIS SYSTEM" title="Current work" detail={view.fresh ? "Jobs & objectives" : "Last known work"} /><div className="vo-two-column"><div><h3 className="vo-label">Jobs</h3><SystemWorkQueue rows={work.jobs} known={Boolean(snapshot?.work?.jobs) && view.fresh} kind="jobs" now={now} /></div><div><h3 className="vo-label">Objectives</h3><SystemWorkQueue rows={work.objectives} known={Boolean(snapshot?.work?.objectives) && view.fresh} kind="objectives" now={now} /></div></div></section>
    <div className="vo-two-column"><section className="vo-panel"><SectionHead eyebrow="RECORDED EVENTS" title="Recent activity" /><SystemTimeline items={events} now={now} /></section><section className="vo-panel"><SectionHead eyebrow="ATTENTION" title="Incidents" /><SystemIncidentPanel incidents={incidents} known={Boolean(snapshot)} stale={!view.fresh} /></section></div>
    <RuntimeDetails rows={rows} revision={snapshot?.revision} />
    <footer className="vo-console-footer"><span>{error || "Read-only observation · authority unchanged"}</span><nav aria-label={system + " detailed views"}>{RELATED[system].map(([to,label]) => <Link key={to} to={to}>{label} ↗</Link>)}</nav></footer>
  </article>;
}
