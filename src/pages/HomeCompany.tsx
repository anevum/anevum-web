import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import ProductCard from "../components/company/ProductCard";
import SystemTopology from "../components/company/SystemTopology";
import { products } from "../data/products";
import { useLiveTrading } from "../hooks/useLiveTrading";

const infrastructure = [
  ["WEB", "React · TypeScript · Vite", "Public product surfaces and protected operator interface."],
  ["EDGE", "Cloudflare Workers", "Routing, metadata, API proxying, security headers, and deployment."],
  ["DATA", "Supabase · PostgreSQL", "Canonical telemetry, evidence, research state, and authentication."],
  ["SERVICES", "Python · FastAPI · Railway · Docker", "Market, research, replay, and runtime services."],
  ["DELIVERY", "GitHub Actions", "Build verification, release synchronization, browser captures, and production deployment."],
  ["INTEGRATIONS", "Alpaca · Slack", "Market/broker interface and operational notification surface."]
];

export default function HomeCompany() {
  const { data, loading, error } = useLiveTrading(7000);
  const state = loading ? "CONNECTING" : error ? "UNAVAILABLE" : data?.state || "UNAVAILABLE";

  return (
    <div className="company-page company-home">
      <section className="company-hero">
        <div className="company-hero-copy">
          <div className="company-mark-lockup"><Mark /><span>SOFTWARE · RESEARCH · SYSTEMS</span></div>
          <h1>ANEVUM</h1>
          <h2>Intelligent systems for research, forecasting, execution, simulation, and autonomous operation.</h2>
          <p>ANEVUM builds specialized software systems that retain evidence, separate research from production authority, and make their operating boundaries visible.</p>
          <div className="company-actions">
            <Link className="company-button primary" to="/products">Explore products <span>→</span></Link>
            <Link className="company-button" to="/founder">Founder profile</Link>
            <Link className="company-text-link" to="/live">Live systems ↗</Link>
          </div>
          <div className="company-live-strip" aria-label="Public runtime status">
            <span><i className={data?.live ? "is-live" : ""} /> PUBLIC RUNTIME</span>
            <strong>{state}</strong>
            <small>{data?.active_strategy?.version_id || "STRATEGY STATE UNAVAILABLE"}</small>
          </div>
        </div>
        <div className="company-hero-visual"><SystemTopology compact /></div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>01 / SYSTEM ARCHITECTURE</span>
          <h2>Different systems. Different authority. One evidence chain.</h2>
          <p>IREN coordinates state; RHEN operates market workflows; NOSTRA forecasts; GRAEN validates methodology; VELUM reconstructs and replays. The architecture is connected without pretending those jobs are interchangeable.</p>
        </header>
        <SystemTopology />
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>02 / PRODUCTS</span>
          <h2>Engineered systems, not feature labels.</h2>
          <p>Each flagship system has a defined operating role, evidence boundary, maturity state, and relationship to the rest of ANEVUM.</p>
        </header>
        <div className="company-product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
      </section>

      <section className="company-section company-proof">
        <header className="company-section-head">
          <span>03 / EVIDENCE</span>
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
          <Link to="/releases">Release history →</Link>
        </div>
      </section>

      <section className="company-section company-infrastructure">
        <header className="company-section-head">
          <span>04 / PRODUCTION INFRASTRUCTURE</span>
          <h2>A working stack behind the diagrams.</h2>
          <p>The public site is only one surface. Runtime services, data systems, research processes, deployment controls, and broker integrations operate behind it.</p>
        </header>
        <div className="infrastructure-stack">
          {infrastructure.map(([layer, tech, description]) => (
            <article key={layer}><span>{layer}</span><strong>{tech}</strong><p>{description}</p><i aria-hidden="true" /></article>
          ))}
        </div>
      </section>

      <section className="company-founder-cta">
        <div><span>FOUNDER</span><h2>Devon Akins</h2><p>Founder · Systems Builder · Independent Researcher</p></div>
        <div><p>Building ANEVUM across software engineering, deployment infrastructure, telemetry, mathematical research, forecasting, simulation, and live operating systems.</p><Link to="/founder">View founder profile →</Link></div>
      </section>
    </div>
  );
}
