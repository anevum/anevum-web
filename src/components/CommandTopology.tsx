import { Link } from "react-router-dom";
import type { RhenSession } from "../lib/auth";
import type { LiveTradingFeed } from "../lib/data";
import { isStale, operatorGuidance } from "../lib/runtime-topology";
import { useCommandObservation } from "../hooks/useCommandObservation";
import { SYSTEMS, ageText, commandSystem, fleetState } from "../lib/system-display";
import { RuntimeDetails, SectionHead, SystemConstellation, SystemIncidentPanel, SystemMetric, SystemStatusChip, SystemTimeline, SystemVisualShell, SystemWorkQueue } from "./operations/VisualOps";

function commandRoute(name: string) {
  if (name === "RHEN") return "/command/trading";
  if (["GRAEN", "NOSTRA", "VELUM"].includes(name)) return "/command/research";
  return "/command/system";
}

export default function CommandTopology({ session, feed }: { session: RhenSession; feed?: LiveTradingFeed | null }) {
  const { snapshot, error, now, receivedAt } = useCommandObservation(session);
  const stale = isStale(snapshot, now, Boolean(error));
  const views = SYSTEMS.map(name => commandSystem(name, snapshot, feed, now, Boolean(error)));
  const fleet = fleetState(views);
  const overall = stale ? "STALE" : fleet !== "HEALTHY" ? fleet : snapshot?.operator?.state || snapshot?.state || "UNAVAILABLE";
  const work = snapshot?.work;
  const guidance = stale ? operatorGuidance(null, true) : snapshot?.operator?.guidance || operatorGuidance(snapshot);
  const jobs = (work?.jobs || []).filter(row => !["SUCCEEDED","FAILED","CANCELLED","COMPLETE"].includes(String(row.status)));
  const transitions = (snapshot?.operator?.recent_transitions || []).map((row,index) => ({
    id: String(row.key) + row.created_at + index, title: (row.transition || "Observation").replaceAll("_", " "),
    detail: row.reason?.replaceAll("_", " "), at: row.created_at, state: row.severity, system: "IREN" as const
  }));
  return <article className="command-panel command-view-overview command-view-system ops-center vo-console" data-visual-ops="overview">
    <header className="vo-console-heading"><div><span>ANEVUM / COMMAND</span><h1>Mission control</h1></div><SystemStatusChip state={overall} /></header>
    <div className="vo-status-strip" aria-label="Global operational status">
      <SystemMetric label="Observation" value={ageText(snapshot?.observed_at, now)} detail={stale ? "Fresh evidence unavailable" : "Canonical control"} />
      <SystemMetric label="Incidents" value={snapshot?.incidents.length} />
      <SystemMetric label="Active jobs" value={work?.active_jobs} />
      <SystemMetric label="Needs you" value={work?.requires_human} />
      <SystemMetric label="Market" value={feed?.operational?.latest_scan?.market_session?.replaceAll("_", " ") || "Unavailable"} />
      <SystemMetric label="Refreshed" value={ageText(receivedAt, now)} detail="Observations every 15s" />
    </div>
    <SystemConstellation views={views} command />
    <section className={"vo-operator-brief" + (snapshot?.action_required || guidance.length ? " needs-attention" : "")} aria-label="IREN operator brief">
      <span className="vo-brief-icon" aria-hidden="true">{stale ? "!" : snapshot?.action_required ? "!" : "◎"}</span>
      <div><span>IREN WANTS YOU TO KNOW</span><strong>{stale ? "Fresh control evidence is unavailable." : snapshot?.operator?.message || (guidance.length ? guidance[0].title : "No operator action required.")}</strong>
        {guidance.length > 0 && <details><summary>Review {guidance.length} operator item{guidance.length === 1 ? "" : "s"}</summary>{guidance.map((item,index) => <div key={index}><b>{item.target} · {item.title}</b><p>{item.action}</p></div>)}</details>}
      </div><Link to="/command/system">Open IREN ↗</Link>
    </section>
    <section><SectionHead eyebrow="FIVE SYSTEMS / ONE OPERATING PICTURE" title="Inside the system" detail="Motion reflects observed activity" /><div className="vo-system-grid">{views.map(view => <SystemVisualShell key={view.name} view={view} now={now} to={commandRoute(view.name)} />)}</div></section>
    <div className="vo-two-column"><section className="vo-panel"><SectionHead eyebrow="IREN / CURRENT WORK" title="Work in motion" detail={stale ? "Last known observation" : work?.next_action?.title} /><SystemWorkQueue rows={jobs} known={Boolean(work?.jobs) && !stale} kind="jobs" now={now} /></section>
      <section className="vo-panel"><SectionHead eyebrow="CONTROL EVENTS" title="Recent activity" /><SystemTimeline items={transitions} now={now} empty={stale ? "Activity evidence unavailable." : "No recent control transitions recorded."} /></section></div>
    <section className="vo-panel"><SectionHead eyebrow="ATTENTION" title="Incidents" /><SystemIncidentPanel incidents={snapshot?.incidents || []} known={Boolean(snapshot)} stale={stale} /></section>
    <details className="vo-details"><summary>Dependencies & freshness <span>Evidence delivery and scheduler state</span></summary><div className="vo-dependencies">{Object.entries(snapshot?.topology?.dependencies || {}).map(([name,row]) => <article key={name}><strong>{name.replaceAll("_"," ")}</strong><SystemStatusChip state={stale ? "STALE" : row.status} /><p>{row.basis}</p><small>Last success: {ageText(row.last_success, now)}</small></article>)}</div></details>
    <RuntimeDetails rows={snapshot?.topology?.services || []} revision={snapshot?.revision} />
    <footer className="vo-console-footer"><span>{error || "IREN / RHEN Core · canonical observation"}</span><Link to="/command/system">System ↗</Link></footer>
  </article>;
}
