import { Link, Navigate, useParams } from "react-router-dom";
import ArchitectureFlow from "../components/company/ArchitectureFlow";
import SystemTopology from "../components/company/SystemTopology";
import SystemIcon from "../components/company/SystemIcon";
import SystemMark from "../components/company/SystemMark";
import { modules, productBySlug, products } from "../data/products";
import { useLiveTrading } from "../hooks/useLiveTrading";

function ProductSpecific({ slug }: { slug: string }) {
  if (slug === "iren") {
    return (
      <>
        <div className="product-deep-grid">
          <article><span>CONTROL PLANE</span><h3>State without authority collapse.</h3><p>IREN exposes operating and research state across systems while preserving their separate controls. Public presentation and protected Command remain distinct surfaces.</p></article>
          <article><span>BOUNDARY</span><h3>Public observability. Private operation.</h3><p>Public routes receive sanitized status and evidence. Command remains authenticated and protected; private execution parameters and account data stay outside the marketing surface.</p></article>
        </div>
        <SystemTopology />
      </>
    );
  }
  if (slug === "rhen") {
    return (
      <div className="product-deep-grid three">
        <article><span>EQUITIES LANE</span><h3>Session-bound live market workflow.</h3><p>Market observation, candidate scoring, risk, execution, reconciliation, and evidence are retained in canonical telemetry.</p></article>
        <article><span>CRYPTO LANE</span><h3>Continuous market architecture.</h3><p>Crypto has explicit market-lane attribution, feature normalization, execution-adapter versioning, NOSTRA regime research, GRAEN promotion gates, ADS research, and VELUM replay.</p></article>
        <article><span>SEPARATION</span><h3>Live ≠ shadow ≠ replay.</h3><p>Research layers can measure and challenge production behavior, but they do not silently rewrite the original live decision or mix simulated outcomes into the live record.</p></article>
      </div>
    );
  }
  if (slug === "nostra") {
    return (
      <div className="product-deep-grid three">
        <article><span>PREDICTION</span><h3>State with a measurable horizon.</h3><p>Predictions are retained before the outcome exists so later calibration can compare forecast state with what actually followed.</p></article>
        <article><span>UNCERTAINTY</span><h3>Confidence is metadata, not certainty.</h3><p>Regime and confidence state are research inputs whose value must be tested against post-event evidence.</p></article>
        <article><span>AUTHORITY</span><h3>Forecast ≠ trade authorization.</h3><p>NOSTRA can inform research and evaluation. RHEN's live qualification, risk, and execution gates remain separate authorities.</p></article>
      </div>
    );
  }
  if (slug === "graen") {
    return (
      <>
        <div className="graen-equations">
          <article><span>SELECTION</span><code>E[θ̂ | selected] ≠ E[θ̂]</code><p>Selection can bias the apparent effect after searching many candidates.</p></article>
          <article><span>MULTIPLICITY</span><code>P(any false positive) ↑ as tests ↑</code><p>Search breadth is treated as part of the evidence problem, not hidden after a result looks good.</p></article>
          <article><span>DEPENDENCE</span><code>n_eff ≤ n</code><p>Correlated observations do not automatically provide the information content of independent samples.</p></article>
        </div>
        <div className="research-ladder" aria-label="Research evidence ladder">
          {["CONJECTURE","HYPOTHESIS","DEVELOPMENT","VALIDATION","ACCEPTED EVIDENCE"].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2,"0")}</span><strong>{item}</strong></div>)}
        </div>
      </>
    );
  }
  return (
    <div className="product-deep-grid three">
      <article><span>RECONSTRUCT</span><h3>Historical state becomes an explicit research environment.</h3><p>Replay uses retained or fetched historical market data with declared assumptions for spread, slippage, and unknown intrabar ordering.</p></article>
      <article><span>COUNTERFACTUAL</span><h3>Ask what a bounded alternate decision would have changed.</h3><p>Counterfactual work compares alternatives against the same post-event evidence rather than rewriting the live record.</p></article>
      <article><span>SAFETY</span><h3>Broker-isolated by design.</h3><p>The continuous replay engine does not import or call RHEN's broker client or execution engine. Simulation results remain research evidence only.</p></article>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { data, loading, error } = useLiveTrading(10000);
  const product = productBySlug(slug);
  if (!product) return <Navigate to="/products" replace />;

  const relevantModules = modules.filter((module) =>
    module.owner.includes(product.name) ||
    (product.slug === "iren" && module.owner.includes("IREN"))
  );
  const runtimeState = error ? "UNAVAILABLE" : loading ? "CONNECTING" : data?.state || "UNAVAILABLE";
  const researchState = String(data?.research?.current_status || "UNAVAILABLE").replaceAll("_", " ").toUpperCase();

  return (
    <div className={"company-page product-detail product-detail-" + product.slug}>
      <section className="product-hero">
        <div>
          <span>{product.eyebrow}</span>
          <h1>{product.name}</h1>
          <h2>{product.summary}</h2>
          <p>{product.role}</p>
          <div className="product-status-line"><b>{product.status}</b><span>{product.category}</span></div>
        </div>
        <div className="product-hero-code" aria-hidden="true">
          <span>ANEVUM / SYSTEM</span>
          <SystemMark system={product.name} decorative />
          <strong>{product.name}</strong>
          <small>{product.category}</small>
          <div className="product-hero-signal">
            <div><span>01</span><b>{product.flow[0]}</b></div>
            <div><span>{String(product.flow.length).padStart(2, "0")}</span><b>{product.flow[product.flow.length - 1]}</b></div>
          </div>
          <div className="product-hero-facts">
            <span><small>CAPABILITIES</small><b>{product.capabilities.length}</b></span>
            <span><small>MODULES</small><b>{relevantModules.length}</b></span>
            <span><small>BOUNDARIES</small><b>{product.boundaries.length}</b></span>
          </div>
          <i />
        </div>
      </section>

      <section className="product-public-state" aria-label={product.name + " public-safe state"}>
        <article><span>PRODUCT STATUS</span><strong>{product.status}</strong><small>{product.category}</small></article>
        <article><span>PUBLIC RUNTIME</span><strong>{product.slug === "rhen" || product.slug === "iren" ? runtimeState : "BOUNDED"}</strong><small>{product.slug === "rhen" ? (data?.active_strategy?.version_id || "No active strategy recorded") : "Public-safe state only"}</small></article>
        <article><span>RESEARCH STATE</span><strong>{product.slug === "velum" ? "REPLAY / RESEARCH" : researchState}</strong><small>Sanitized canonical research state</small></article>
        <article><span>TELEMETRY</span><strong>{data?.telemetry?.events_60m ?? "—"}</strong><small>Public aggregate events / 60m</small></article>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>OPERATING FLOW</span><h2>From state to evidence.</h2></header>
        <ArchitectureFlow steps={product.flow} label={product.name + " operating flow"} />
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>CAPABILITIES</span><h2>What it actually does.</h2></header>
        <div className="product-spec-grid">
          {product.capabilities.map((capability, index) => <article key={capability}><span>{String(index + 1).padStart(2,"0")}</span><strong>{capability}</strong></article>)}
        </div>
      </section>

      {relevantModules.length ? (
        <section className="company-section">
          <header className="company-section-head"><span>SUPPORTING MODULES</span><h2>Implemented components behind {product.name}.</h2></header>
          <div className="product-module-strip">
            {relevantModules.map((module) => (
              <article key={module.name}>
                <span>{module.category}</span><strong>{module.name}</strong><p>{module.purpose}</p><b>{module.status}</b>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="company-section">
        <header className="company-section-head"><span>ARCHITECTURE / BOUNDARIES</span><h2>The constraints are part of the system.</h2></header>
        <ProductSpecific slug={product.slug} />
      </section>

      <section className="company-section product-evidence-section">
        <div>
          <span>EVIDENCE SURFACES</span>
          {product.evidence.map((item) => <p key={item}>{item}</p>)}
        </div>
        <div>
          <span>BOUNDARIES</span>
          {product.boundaries.map((item) => <p key={item}>{item}</p>)}
        </div>
        <div>
          <span>TECHNOLOGIES</span>
          <div className="tech-chips">{product.technologies.map((item) => <b key={item}>{item}</b>)}</div>
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>RELATED SYSTEMS</span><h2>Connected, not interchangeable.</h2></header>
        <div className="related-products">
          {products.filter((item) => product.related.includes(item.slug)).map((item) => <Link key={item.slug} to={"/products/" + item.slug}><SystemIcon system={item.name} size="sm" /><span>{item.category}</span><strong>{item.name}</strong><i>→</i></Link>)}
        </div>
      </section>
    </div>
  );
}
