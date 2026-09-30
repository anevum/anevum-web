import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import ProductCard from "../components/company/ProductCard";
import SystemTopology from "../components/company/SystemTopology";
import LiveEvidencePanel from "../components/company/LiveEvidencePanel";
import { products } from "../data/products";
import { dispatches } from "../data/dispatches";
import { useLiveTrading } from "../hooks/useLiveTrading";

const infrastructure = [
  ["WEB", "React · TypeScript · Vite", "Public product surfaces and protected operator interface."],
  ["EDGE", "Cloudflare Workers", "Routing, metadata, API proxying, security headers, and deployment."],
  ["DATA", "Supabase · PostgreSQL", "Canonical telemetry, evidence, research state, and authentication."],
  ["SERVICES", "Python · FastAPI · Railway · Docker", "Market, research, replay, and runtime services."],
  ["DELIVERY", "GitHub Actions", "Build verification, release synchronization, browser captures, and production deployment."],
  ["INTEGRATIONS", "Alpaca · Slack", "Market/broker interface and operational notification surface."]
];

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export default function HomeCompany() {
  const { data, loading, error } = useLiveTrading(7000);
  const state = loading ? "CONNECTING" : error ? "UNAVAILABLE" : data?.state || "UNAVAILABLE";
  const latest = dispatches.slice(0, 4);

  return (
    <div className="company-page company-home">
      <section className="company-hero company-hero-v2">
        <div className="company-hero-copy">
          <div className="company-mark-lockup"><Mark /><span>SOFTWARE · RESEARCH · SYSTEMS</span></div>
          <h1>ANEVUM</h1>
          <h2>Engineered systems for research, forecasting, execution, simulation, and evidence.</h2>
          <p>ANEVUM builds specialized software that can operate, measure itself, retain what it knew at decision time, and expose enough evidence to inspect the work without exposing protected execution state.</p>
          <div className="company-actions">
            <Link className="company-button primary" to="/products">Explore systems <span>→</span></Link>
            <Link className="company-button" to="/dispatches">Read Dispatches</Link>
            <Link className="company-text-link" to="/live">Live systems ↗</Link>
          </div>
          <div className="company-live-strip" aria-label="Public runtime status">
            <span><i className={data?.live ? "is-live" : ""} /> PUBLIC RUNTIME</span>
            <strong>{state}</strong>
            <small>{data?.active_strategy?.version_id || "STRATEGY STATE UNAVAILABLE"}</small>
          </div>
        </div>

        <div className="company-hero-visual company-hero-instrument">
          <div className="hero-instrument-grid" aria-hidden="true" />
          <SystemTopology compact />
          <div className="hero-instrument-readout">
            <span>PUBLIC EVIDENCE BUS</span>
            <strong>{data?.telemetry?.events_60m ?? "—"}</strong>
            <small>events / 60m</small>
          </div>
          <div className="hero-instrument-readout second">
            <span>RESEARCH STATE</span>
            <strong>{data?.research?.current_status || "UNAVAILABLE"}</strong>
            <small>{data?.research?.current_focus || "canonical public state"}</small>
          </div>
        </div>
      </section>

      <section className="company-section live-evidence-section">
        <header className="company-section-head">
          <span>01 / LIVE EVIDENCE</span>
          <h2>The site should show the system moving.</h2>
          <p>These visualizations are populated from the public-safe telemetry contract. No decorative success curve is substituted when a live sample does not exist.</p>
        </header>
        <LiveEvidencePanel
          equities={data?.market_performance?.equities}
          crypto={data?.market_performance?.crypto}
          events60m={data?.telemetry?.events_60m}
          state={state}
          activity={data?.activity}
        />
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>02 / SYSTEM ARCHITECTURE</span>
          <h2>Different systems. Different authority. One evidence chain.</h2>
          <p>IREN coordinates state; RHEN operates market workflows; NOSTRA forecasts; GRAEN validates methodology; VELUM reconstructs and replays. The architecture is connected without pretending those jobs are interchangeable.</p>
        </header>
        <SystemTopology />
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>03 / PRODUCTS</span>
          <h2>Engineered systems, not feature labels.</h2>
          <p>Each flagship system has a defined operating role, evidence boundary, maturity state, and relationship to the rest of ANEVUM.</p>
        </header>
        <div className="company-product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
      </section>

      <section className="company-section home-dispatches">
        <header className="company-section-head">
          <span>04 / DISPATCHES</span>
          <h2>The build record is part of the product.</h2>
          <p>Progress reports, research notes, field observations, and system updates document what changed, what failed, what remains unproved, and what comes next.</p>
        </header>
        <div className="home-dispatch-grid">
          {latest.map((entry, index) => (
            <Link key={entry.slug} to={"/dispatches/" + entry.slug} className={index === 0 ? "featured" : ""}>
              <header><span>{entry.kind}</span><b>{entry.system}</b></header>
              <time>{dateLabel(entry.publishedAt)}</time>
              <h3>{entry.title}</h3>
              <p>{entry.dek}</p>
              <footer><strong>{entry.status}</strong><i>READ →</i></footer>
            </Link>
          ))}
        </div>
        <Link className="dispatch-index-link" to="/dispatches">Open the complete public record →</Link>
      </section>

      <section className="company-section company-proof">
        <header className="company-section-head">
          <span>05 / EVIDENCE</span>
          <h2>Public claims stop where the evidence stops.</h2>
        </header>
        <div className="company-proof-grid">
          <article><span>RUNTIME STATE</span><strong>{state}</strong><p>Sanitized state is read from the production public telemetry contract rather than hardcoded frontend status.</p></article>
          <article><span>CANONICAL TELEMETRY</span><strong>{data?.telemetry?.events_60m ?? "—"}</strong><p>Public-safe aggregate events recorded in the most recent hour when the feed is available.</p></article>
          <article><span>LIVE CLOSED TRADES</span><strong>{data?.performance?.closed_trades ?? "—"}</strong><p>Broker-derived live record. Replay, backtest, paper, and development evidence are excluded.</p></article>
          <article><span>RESEARCH STATE</span><strong>{data?.research?.current_status || "UNAVAILABLE"}</strong><p>Durable research decisions, forward outcomes, and explicit limitations remain visible.</p></article>
        </div>
        <div className="company-proof-links">
          <Link to="/performance">Performance evidence →</Link>
          <Link to="/research">Research program →</Link>
          <Link to="/dispatches">Progress record →</Link>
          <Link to="/releases">Release history →</Link>
        </div>
      </section>

      <section className="company-section company-infrastructure">
        <header className="company-section-head">
          <span>06 / PRODUCTION INFRASTRUCTURE</span>
          <h2>A working stack behind the diagrams.</h2>
          <p>The public site is only one surface. Runtime services, data systems, research processes, deployment controls, and broker integrations operate behind it.</p>
        </header>
        <div className="infrastructure-stack">
          {infrastructure.map(([layer, tech, description]) => (
            <article key={layer}><span>{layer}</span><strong>{tech}</strong><p>{description}</p><i aria-hidden="true" /></article>
          ))}
        </div>
      </section>

      <section className="company-founder-cta company-founder-cta-v2">
        <div className="founder-cta-photo"><img src="/devon-akins-headshot.jpg" alt="Devon Akins" /></div>
        <div><span>FOUNDER</span><h2>Devon Akins</h2><p>Founder · Systems Builder · Independent Researcher</p></div>
        <div><p>Building ANEVUM across software engineering, deployment infrastructure, telemetry, mathematical research, forecasting, simulation, and live operating systems.</p><Link to="/founder">View founder profile →</Link></div>
      </section>
    </div>
  );
}
