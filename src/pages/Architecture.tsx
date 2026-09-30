import { Link } from "react-router-dom";
import SystemTopology from "../components/company/SystemTopology";
import SystemMark from "../components/company/SystemMark";
import { products } from "../data/products";

const stack = [
  ["PUBLIC SURFACE", "React · TypeScript · Vite", "Company site, product surfaces, evidence views, Field Notes, founder profile, and public-safe system state."],
  ["EDGE", "Cloudflare Workers", "Routing, headers, API proxying, metadata, privacy boundaries, and production delivery."],
  ["CONTROL / STATE", "IREN", "Cross-system operating state, research state, protected Command, and orchestration visibility."],
  ["RESEARCH", "GRAEN · NOSTRA · VELUM", "Validation, forecasting, replay, simulation, counterfactual analysis, and promotion evidence."],
  ["EXECUTION", "RHEN", "Market observation, qualification, risk, execution, reconciliation, telemetry, and evidence capture."],
  ["DATA", "PostgreSQL · Supabase", "Canonical events, evidence, research decisions, forward outcomes, authentication, and public projections."],
  ["SERVICES", "Python · FastAPI · Railway · Docker", "Long-running market, research, replay, and scheduled service roles."],
  ["INTEGRATIONS", "Alpaca · Slack · GitHub", "Broker interface, operational notifications, source control, CI, and deployment."]
];

export default function Architecture() {
  return (
    <div className="company-page architecture-page">
      <section className="company-page-hero architecture-hero">
        <span>ANEVUM ARCHITECTURE</span>
        <h1>One company. Specialized systems. Explicit authority boundaries.</h1>
        <p>ANEVUM is organized so research can challenge production without silently controlling it, simulation can reuse production mathematics without becoming live evidence, and public observability can exist without exposing private execution state.</p>
      </section>

      <section className="company-section no-top-border architecture-topology">
        <SystemTopology />
      </section>

      <section className="architecture-evidence-band" aria-label="ANEVUM evidence path">
        <div className="architecture-evidence-flow">
          <article><span>01 / OBSERVATION</span><strong>Canonical state</strong><p>Runtime events, market state, and research inputs are retained before conclusions are made.</p></article>
          <article><span>02 / RESEARCH</span><strong>Challenge the claim</strong><p>GRAEN, NOSTRA, and VELUM test inference, prediction, replay, and counterfactual alternatives.</p></article>
          <article><span>03 / PROMOTION</span><strong>Explicit authority gate</strong><p>Evidence can support a proposal, but it does not silently grant production authority.</p></article>
          <article><span>04 / MEASUREMENT</span><strong>RHEN records reality</strong><p>Broker-derived live outcomes return to the evidence layer without being mixed with simulation.</p></article>
        </div>
        <div className="architecture-evidence-legend">STATE MAY FLOW ACROSS SYSTEMS · AUTHORITY REMAINS BOUNDED · LIVE AND SIMULATED EVIDENCE STAY DISTINCT</div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>SYSTEM ROLES</span>
          <h2>The hierarchy is functional, not decorative.</h2>
        </header>
        <div className="architecture-role-grid">
          {products.map((product, index) => (
            <Link key={product.slug} to={"/products/" + product.slug}>
              <SystemMark system={product.name} decorative />
              <span>{String(index + 1).padStart(2, "0")} / {product.category}</span>
              <strong>{product.name}</strong>
              <p>{product.role}</p>
              <i>OPEN SYSTEM →</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>PRODUCTION STACK</span>
          <h2>Software underneath the product names.</h2>
        </header>
        <div className="architecture-stack">
          {stack.map(([layer, tech, description], index) => (
            <article key={layer}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><small>{layer}</small><strong>{tech}</strong></div>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>AUTHORITY MODEL</span>
          <h2>State can flow farther than authority.</h2>
        </header>
        <div className="authority-grid">
          <article><span>GRAEN</span><strong>Can falsify and validate.</strong><p>It does not place live orders.</p></article>
          <article><span>NOSTRA</span><strong>Can forecast and calibrate.</strong><p>A forecast is not trade authorization.</p></article>
          <article><span>VELUM</span><strong>Can replay and compare.</strong><p>Simulation does not enter the live record.</p></article>
          <article><span>RHEN</span><strong>Can execute within bounded controls.</strong><p>Production behavior changes only through explicit promotion and deployment paths.</p></article>
          <article><span>IREN</span><strong>Can coordinate and expose state.</strong><p>Public observability and protected operation remain separate surfaces.</p></article>
        </div>
      </section>

      <section className="architecture-cta">
        <div><span>SEE THE SYSTEM OPERATE</span><h2>Architecture is only useful if the evidence matches it.</h2></div>
        <div><Link to="/performance">Performance evidence →</Link><Link to="/research">Field Notes →</Link><Link to="/case-studies">Case Studies →</Link></div>
      </section>
    </div>
  );
}
