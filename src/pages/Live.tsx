import PublicSystemStatus from "../components/PublicSystemStatus";
import { SectionHead, SystemStatusChip, SystemTimeline, TelemetryActivity } from "../components/operations/VisualOps";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { ageText, displayState } from "../lib/system-display";
export default function Live() {
  const { data, error } = useLiveTrading(5000);
  return <section className="compact-page workspace-screen live-screen vo-live">
    <header className="vo-page-heading"><div><span>ANEVUM / PUBLIC OBSERVATORY</span><h1>Live systems</h1></div><small>Sanitized telemetry · refresh 5s</small></header>
    <PublicSystemStatus data={data} error={error} />
    <div className="vo-two-column"><TelemetryActivity feed={data} /><section className="vo-panel"><SectionHead eyebrow="GRAEN / RESEARCH" title="Research in view" detail={ageText(data?.research?.last_updated_at)} /><SystemStatusChip state={error ? "UNAVAILABLE" : data?.research?.current_status} /><p className="vo-research-focus">{data?.research?.current_focus || "No canonical research focus available."}</p><div className="vo-next"><span>Next recorded direction</span><strong>{data?.research?.next_direction?.subject || "Not yet recorded"}</strong>{data?.research?.next_direction?.executed === false && <small>Defined · not run</small>}</div><small className="vo-caption">Public research projection · a study or promotion is never inferred from runtime health.</small></section></div>
    <section className="vo-panel"><SectionHead eyebrow="DURABLE PUBLIC EVENTS" title="Activity timeline" detail={error ? "Feed unavailable · last known events" : "Sanitized activity"} /><SystemTimeline items={(data?.events || []).map((row,index) => ({id:String(row.at)+row.type+index,title:displayState(row.type),detail:row.label,at:row.at,state:row.kind,system:"RHEN"}))} /></section>
    <details className="vo-details"><summary>About this public view</summary><p>Aggregate system observations only. Accounts, symbols, prices, quantities, orders, fills, private trade records, thresholds and risk settings are excluded. Event counts are not trade counts. Instruments show activity, not market prices or forecast probabilities.</p></details>
  </section>;
}
