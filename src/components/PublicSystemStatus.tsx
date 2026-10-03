import type { LiveTradingFeed } from "../lib/data";
import { ageText, fleetState, publicSystem, SYSTEMS } from "../lib/system-display";
import { SectionHead, SystemConstellation, SystemStatusChip, SystemVisualShell } from "./operations/VisualOps";

export default function PublicSystemStatus({ data, error = "", compact = false }: { data?: LiveTradingFeed | null; error?: string; compact?: boolean }) {
  const now = Date.now();
  const views = SYSTEMS.map(name => publicSystem(name, data, now, Boolean(error)));
  return <section className={"vo-public-status" + (compact ? " is-compact" : "")} aria-label="ANEVUM system status" data-visual-ops="public">
    <SectionHead eyebrow="LIVE SYSTEMS / CANONICAL OBSERVATIONS" title={compact ? "Five systems. One operating picture." : "The ANEVUM observatory"} detail={"Feed refreshed " + ageText(data?.generated_at, now)} />
    <div className="vo-public-health" role="status"><SystemStatusChip state={fleetState(views)} /><span>{error ? "Public feed unavailable · last observations shown" : views.filter(view => view.fresh).length + " / 5 systems with fresh observations"}</span></div>
    <SystemConstellation views={views} compact={compact} />
    {!compact && <div className="vo-system-grid">{views.map(view => <SystemVisualShell key={view.name} view={view} now={now} to={"/products/" + view.name.toLowerCase()} />)}</div>}
  </section>;
}
