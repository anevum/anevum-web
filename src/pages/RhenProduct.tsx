import { Link } from "react-router-dom";
import PublicEvidenceSnapshot from "../components/PublicEvidenceSnapshot";
import SystemIcon from "../components/company/SystemIcon";
import { currentRhenRelease } from "../data/releases";
import { useLiveTrading } from "../hooks/useLiveTrading";

export default function RhenProduct() {
  const release = currentRhenRelease();
  const { data, error, now } = useLiveTrading(5000);
  const research = data?.research;
  const telemetry = data?.telemetry;

  return (
    <div className="studio-page truth-rhen-page">
      <section className="truth-rhen-hero">
        <div className="truth-rhen-title">
          <SystemIcon system="RHEN" size="lg" />
          <div><span>PRODUCT / RHEN</span><h1>RHEN</h1><p>Trading and research system operating on real market data with public evidence and deliberately narrow live authority.</p></div>
        </div>
        <aside className="truth-rhen-release">
          <span>CURRENT RELEASE</span><strong>{release.version}</strong><b>{release.codename}</b><small>{release.date}</small>
          <dl><div><dt>LIVE</dt><dd>LONG EQUITIES + ETFs</dd></div><div><dt>OPTIONS</dt><dd>RESEARCH ONLY</dd></div><div><dt>SHORTS</dt><dd>DISABLED</dd></div><div><dt>PROMOTION</dt><dd>MANUAL</dd></div></dl>
        </aside>
      </section>

      <PublicEvidenceSnapshot />

      <section className="truth-rhen-data-grid">
        <article>
          <header><span>OPERATIONS</span><strong>{error ? "DEGRADED" : String(data?.state || "OBSERVING").replaceAll("_"," ")}</strong></header>
          <div className="truth-kpi-grid"><div><span>EVENTS · 60M</span><strong>{telemetry?.events_60m ?? "—"}</strong></div><div><span>SCANS · 10M</span><strong>{telemetry?.scan_events_10m ?? "—"}</strong></div><div><span>RECONCILIATIONS · 2H</span><strong>{telemetry?.reconciliations_2h ?? "—"}</strong></div><div><span>ERRORS · 2H</span><strong>{telemetry?.errors_2h ?? "—"}</strong></div></div>
          <footer>{data?.generated_at ? "Feed observed "+new Date(data.generated_at).toLocaleString() : "No current public feed timestamp"}</footer>
        </article>

        <article>
          <header><span>RESEARCH</span><strong>{String(research?.current_status || "AWAITING").replaceAll("_"," ")}</strong></header>
          <h3>{research?.current_focus || "No current public research focus recorded."}</h3>
          <p>{research?.next_direction?.conclusion || research?.next_direction?.subject || "No next public research direction recorded."}</p>
          <footer>{research?.last_updated_at ? new Date(research.last_updated_at).toLocaleString() : "No research timestamp"}</footer>
        </article>
      </section>

      <section className="truth-rhen-links">
        <Link to="/products/rhen/evidence"><span>01</span><strong>Public evidence</strong><p>Live public-safe telemetry, performance, research state, and evidence boundaries.</p><b>OPEN ↗</b></Link>
        <Link to="/products/rhen/releases"><span>02</span><strong>Releases</strong><p>Versioned record of what changed, what was verified, and what remains unresolved.</p><b>OPEN ↗</b></Link>
        <Link to="/products/rhen/architecture"><span>03</span><strong>Architecture</strong><p>Execution, control, research, replay, forecasting, storage, and authority boundaries.</p><b>OPEN ↗</b></Link>
        <Link to="/field-notes"><span>04</span><strong>Field Notes</strong><p>Research decisions, failures, repairs, experiments, and build notes.</p><b>OPEN ↗</b></Link>
      </section>

      <section className="truth-rhen-limits">
        <span>WHAT RHEN DOES NOT CLAIM</span><h2>Operating is not the same as proving an edge.</h2><p>{release.limitations.find((item)=>item.title.toLowerCase().includes("profitability"))?.body || "Profitability remains an evidence question, not a marketing statement."}</p>
      </section>
    </div>
  );
}
