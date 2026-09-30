import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import ProductCard from "../components/company/ProductCard";
import SystemIcon from "../components/company/SystemIcon";
import SystemTopology from "../components/company/SystemTopology";
import type { SystemName } from "../components/company/SystemMark";
import { fieldNotes } from "../data/fieldNotes";
import { products } from "../data/products";
import { useLiveTrading } from "../hooks/useLiveTrading";
import type { PublicPerformancePoint } from "../lib/data";

type Lane = { closed_trades?: number; realized_return_pct?: number | null; curve?: PublicPerformancePoint[] };
type MarketFeed = { market_performance?: { equities?: Lane; crypto?: Lane } };
type SystemState = { system: SystemName; status: string | number; detail: string };

function pct(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return (value > 0 ? "+" : "") + value.toFixed(2) + "%";
}

function MiniCurve({ rows = [] }: { rows?: PublicPerformancePoint[] }) {
  const clean = rows.map((row) => Number(row.return_pct)).filter(Number.isFinite);
  if (clean.length < 2) return <div className="home-curve-empty"><span>LIVE CURVE</span><strong>AWAITING MEASURED SAMPLE</strong></div>;
  const low = Math.min(...clean, 0);
  const high = Math.max(...clean, 0);
  const span = Math.max(0.01, high - low);
  const points = clean.map((value, index) => {
    const x = (index / Math.max(1, clean.length - 1)) * 600;
    const y = 150 - ((value - low) / span) * 125;
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
  return <svg className="home-performance-curve" viewBox="0 0 600 170" preserveAspectRatio="none" role="img" aria-label="Normalized live performance preview"><polyline points={points} /></svg>;
}

export default function HomeCompany() {
  const { data, loading, error } = useLiveTrading(7000);
  const feed = data as (typeof data & MarketFeed);
  const state = loading ? "CONNECTING" : error ? "UNAVAILABLE" : data?.state || "UNAVAILABLE";
  const equities = feed?.market_performance?.equities;
  const crypto = feed?.market_performance?.crypto;
  const curve = (equities?.curve?.length ? equities.curve : crypto?.curve) || [];
  const systems = data?.systems || {};
  const systemState: SystemState[] = [
    { system:"RHEN", status:systems.RHEN?.runtime_state || state, detail:systems.RHEN?.activity || data?.active_strategy?.version_id || "Production market system" },
    { system:"NOSTRA", status:systems.NOSTRA?.runtime_state || "EMBEDDED", detail:systems.NOSTRA?.activity || "Forecast research embedded in RHEN" },
    { system:"GRAEN", status:systems.GRAEN?.runtime_state || "CONNECTING", detail:systems.GRAEN?.activity || "Canonical mathematical research runtime" },
    { system:"VELUM", status:systems.VELUM?.runtime_state || "CONNECTING", detail:systems.VELUM?.activity || "Replay / counterfactual runtime" },
    { system:"IREN", status:systems.IREN?.runtime_state || (error ? "DEGRADED" : "CONNECTING"), detail:systems.IREN?.activity || "Operating intelligence" }
  ];
  const evidenceChain: { system: SystemName; step: string; action: string }[] = [
    { system:"GRAEN", step:"01", action:"QUESTION" },
    { system:"NOSTRA", step:"02", action:"FORECAST" },
    { system:"VELUM", step:"03", action:"REPLAY" },
    { system:"RHEN", step:"04", action:"OPERATE" },
    { system:"IREN", step:"05", action:"COORDINATE" }
  ];
  const caseStudyFlow: SystemName[] = ["GRAEN","NOSTRA","VELUM","RHEN"];

  return (
    <div className="company-page company-home company-home-v3">
      <section className="company-hero company-hero-v3">
        <div className="company-hero-copy">
          <div className="company-mark-lockup"><Mark /><span>SOFTWARE · RESEARCH · AUTONOMOUS SYSTEMS</span></div>
          <h1>ANEVUM</h1>
          <h2>Research. Forecast. Simulate. Execute. Measure.</h2>
          <p>ANEVUM builds interconnected software systems that turn hypotheses into measurable evidence and bounded production behavior.</p>
          <div className="company-actions">
            <Link className="company-button primary" to="/architecture">Explore the architecture <span>→</span></Link>
            <Link className="company-button" to="/products">Systems</Link>
            <Link className="company-text-link" to="/research">Read Field Notes ↗</Link>
          </div>
          <div className="company-live-strip" aria-label="Public runtime status">
            <span><i className={data?.live ? "is-live" : ""} /> PRODUCTION EVIDENCE</span>
            <strong>{state}</strong>
            <small>{data?.generated_at ? "UPDATED " + new Date(data.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "PUBLIC FEED"}</small>
          </div>
        </div>
        <div className="company-hero-visual">
          <div className="hero-visual-label"><span>ANEVUM / SYSTEM MAP</span><b>LIVE ARCHITECTURE</b></div>
          <SystemTopology compact />
          <div className="hero-visual-metrics" aria-label="Current public system summary">
            <span><small>RUNTIME</small><strong>{state}</strong></span>
            <span><small>EVENTS / 60M</small><strong>{data?.telemetry?.events_60m ?? "—"}</strong></span>
            <span><small>LIVE CLOSED</small><strong>{data?.performance?.closed_trades ?? "—"}</strong></span>
          </div>
          <p className="hero-visual-caption">Public-safe state only. Research, replay, and protected execution controls remain separated from this surface.</p>
        </div>
      </section>

      <section className="home-mission-strip home-mission-strip-icons">
        <div className="home-mission-copy">
          <span>01 / OPERATING MODEL</span>
          <h2>Five systems. One evidence chain.</h2>
          <p>IREN coordinates. GRAEN tests what can be inferred. NOSTRA forecasts what may happen next. VELUM reconstructs what could have happened. RHEN operates bounded market workflows and records what actually happened.</p>
          <Link to="/architecture">How ANEVUM works →</Link>
        </div>
        <div className="home-evidence-chain home-evidence-chain-icons" aria-label="ANEVUM evidence chain">
          {evidenceChain.map(({ system, step, action }) => (
            <div key={system}>
              <SystemIcon system={system} size="sm" />
              <span>{step} / {action}</span>
              <strong>{system}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="company-section home-system-state">
        <header className="company-section-head"><span>02 / SYSTEM STATE</span><h2>The site reflects the operating system behind it.</h2><p>Public-safe state is separated from private Command. Unavailable data fails closed instead of being replaced with invented metrics.</p></header>
        <div className="system-state-grid system-state-grid-icons">
          {systemState.map(({ system, status, detail }) => (
            <article key={system} className={"system-state-" + system.toLowerCase()}>
              <header><SystemIcon system={system} size="sm" /><i /></header>
              <span>{system}</span>
              <strong>{String(status).replaceAll("_", " ")}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="company-section home-evidence-section">
        <header className="company-section-head"><span>03 / LIVE EVIDENCE</span><h2>Measured performance stays separate from simulation.</h2><p>Only broker-derived closed live trades enter the public live record. Research, replay, shadow, and paper results remain outside it.</p></header>
        <div className="home-evidence-grid">
          <article className="home-evidence-chart">
            <header><span>NORMALIZED LIVE PERFORMANCE</span><Link to="/performance">FULL RECORD ↗</Link></header>
            <MiniCurve rows={curve} />
            <footer><span>EQUITIES {equities?.closed_trades ?? 0} CLOSED</span><strong>{pct(equities?.realized_return_pct)}</strong><span>CRYPTO {crypto?.closed_trades ?? 0} CLOSED</span><strong>{pct(crypto?.realized_return_pct)}</strong></footer>
          </article>
          <div className="home-evidence-metrics">
            <article><span>EVENTS / 60M</span><strong>{data?.telemetry?.events_60m ?? "—"}</strong><p>Sanitized canonical telemetry.</p></article>
            <article><span>LIVE CLOSED TRADES</span><strong>{data?.performance?.closed_trades ?? "—"}</strong><p>Broker-derived live record.</p></article>
            <article><span>GRAEN RUNTIME</span><strong>{systems.GRAEN?.runtime_state || "—"}</strong><p>{systems.GRAEN?.activity || "Canonical research runtime."}</p></article>
            <article><span>STRATEGY</span><strong>{data?.active_strategy?.version_id || "UNAVAILABLE"}</strong><p>Active public-safe version identity.</p></article>
          </div>
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>04 / SYSTEMS</span><h2>Specialized authority, shared evidence.</h2><p>Each system has a defined role and boundary. Product names do not imply that research, forecasting, simulation, and execution are interchangeable.</p></header>
        <div className="company-product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
      </section>

      <section className="company-section home-field-notes home-field-notes-editorial">
        <header className="company-section-head"><span>05 / FIELD NOTES</span><h2>A readable engineering journal.</h2><p>The public record is organized like a publication now: concise stories first, complete reproduction detail inside each note.</p></header>
        <div className="field-note-preview-grid field-note-preview-grid-icons">
          {fieldNotes.slice(0, 3).map((note) => (
            <Link key={note.slug} to={"/research/" + note.slug}>
              <header><span>{note.date}</span><b>{note.type}</b></header>
              <SystemIcon system={note.systems[0]} size="md" />
              <strong>{note.title}</strong>
              <p>{note.summary}</p>
              <footer><span>{note.readMinutes} MIN · {note.status}</span><i>READ →</i></footer>
            </Link>
          ))}
        </div>
        <div className="section-end-link"><Link to="/research">Open Field Notes →</Link></div>
      </section>

      <section className="company-section home-case-study">
        <div className="case-study-feature-copy"><span>06 / CASE STUDY</span><h2>What happens when an equity strategy meets a 24/7 crypto market?</h2><p>GRAEN challenges the assumption. NOSTRA measures market state. VELUM replays alternatives. RHEN receives only what survives the evidence gate.</p><Link to="/case-studies">Explore case studies →</Link></div>
        <div className="case-study-feature-flow case-study-feature-flow-icons" aria-label="Case study system flow">
          {caseStudyFlow.map((system, index) => (
            <div key={system}>
              <SystemIcon system={system} size="sm" />
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{system}</strong>
              {index < caseStudyFlow.length - 1 ? <i>↓</i> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="company-founder-cta company-founder-cta-v3">
        <div className="founder-cta-identity"><span>FOUNDER / SYSTEMS BUILDER</span><h2>Devon Akins</h2><p>Software systems · mathematical research · forecasting · simulation · production infrastructure</p></div>
        <div><p>ANEVUM is being built as an operating software and research company, with the public site exposing the architecture, evidence, development record, and limits of what the systems can currently support.</p><Link to="/founder">Founder profile →</Link><Link to="/resume">Résumé →</Link></div>
      </section>
    </div>
  );
}
