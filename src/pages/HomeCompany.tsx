import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import ProductCard from "../components/company/ProductCard";
import SystemIcon from "../components/company/SystemIcon";
import PublicSystemStatus from "../components/PublicSystemStatus";
import { fieldNotes } from "../data/fieldNotes";
import { products } from "../data/products";
import { useLiveTrading } from "../hooks/useLiveTrading";

const currentWork = [
  {
    step: "01",
    status: "ACTIVE",
    system: "GRAEN" as const,
    title: "BTC strategy discovery",
    body: "BTC-only mechanism research is running behind explicit development gates. No candidate is presented as promoted until the evidence path actually clears."
  },
  {
    step: "02",
    status: "ACTIVE",
    system: "IREN" as const,
    title: "Canonical operations state",
    body: "IREN observes runtime health, dependency freshness, incidents, objectives, and service identity so operator decisions come from one control surface."
  },
  {
    step: "03",
    status: "ACTIVE",
    system: "RHEN" as const,
    title: "Execution integration",
    body: "RHEN remains the bounded market runtime. Research output must pass replay, forward evidence, promotion, risk, and durable execution gates before live use."
  },
  {
    step: "04",
    status: "VERIFY",
    system: "VELUM" as const,
    title: "Replay before promotion",
    body: "VELUM remains broker-isolated and is the engineering replay boundary for a research survivor before fresh forward evidence and any production consideration."
  }
];

export default function HomeCompany() {
  const { data, loading, error } = useLiveTrading(5000);
  const systemRows = data?.systems || {};
  const systemStates = Object.values(systemRows);
  const observedSystems = systemStates.length;
  const healthySystems = systemStates.filter((row) => {
    const state = String(row?.health_state || row?.runtime_state || "").toUpperCase();
    return ["HEALTHY", "RUNNING", "READY", "COMPLETE", "IDLE"].includes(state);
  }).length;
  const researchState = String(data?.research?.current_status || "UNRECORDED").replaceAll("_", " ").toUpperCase();

  return (
    <div className="company-page company-home rebuild-home">
      <section className="rebuild-breaking-hero" aria-labelledby="rebuild-headline">
        <div className="rebuild-breaking-kicker">
          <span className="rebuild-breaking-label"><i /> LIVE // SYSTEM REBUILD + VERIFICATION</span>
          <span>OCTOBER 3, 2026</span>
          <span>ANEVUM OPERATING UPDATE</span>
        </div>

        <div className="rebuild-breaking-grid">
          <div className="rebuild-breaking-copy">
            <div className="company-mark-lockup"><Mark /><span>SOFTWARE · RESEARCH · AUTONOMOUS SYSTEMS</span></div>
            <p className="rebuild-eyebrow">CURRENT STATE</p>
            <h1 id="rebuild-headline">ANEVUM is operating through a staged rebuild.</h1>
            <p className="rebuild-deck">
              The foundation has moved beyond the original prototype architecture. GitHub is the canonical change record,
              Railway runs the service layer, PostgreSQL carries durable state, and the named systems are being observed as
              distinct runtimes with explicit authority boundaries. Public data now returns only where the rebuilt evidence
              path can support it.
            </p>

            <div className="rebuild-status-band" aria-label="Current ANEVUM status">
              <span><small>PUBLIC FEED</small><strong>{loading ? "CONNECTING" : error ? "DEGRADED" : data?.live ? "LIVE" : "LIMITED"}</strong></span>
              <span><small>SYSTEMS OBSERVED</small><strong>{observedSystems ? healthySystems + " / " + observedSystems + " READY" : "AWAITING FEED"}</strong></span>
              <span><small>RESEARCH</small><strong>{researchState}</strong></span>
            </div>

            <div className="company-actions">
              <Link className="company-button primary" to="/live">Open live systems <span>→</span></Link>
              <Link className="company-button" to="/architecture">Architecture</Link>
              <Link className="company-text-link" to="/research">Research record ↗</Link>
            </div>
          </div>

          <aside className="rebuild-latest-card" aria-label="Current ANEVUM work">
            <header>
              <span>NOW // SYSTEM STATE</span>
              <strong>OPERATING BRIEF</strong>
            </header>
            <div className="rebuild-latest-lead">
              <span>01</span>
              <div>
                <small>PRIMARY RESEARCH</small>
                <strong>GRAEN is evaluating BTC-native strategy mechanisms.</strong>
                <p>Development evidence is being treated as development evidence only. A research survivor still requires replay and fresh forward confirmation before promotion.</p>
              </div>
            </div>
            <div className="rebuild-latest-list">
              <article><span>02</span><div><strong>Command is moving to one canonical operations model.</strong><p>IREN, RHEN, GRAEN, NOSTRA, and VELUM are monitored as separate systems instead of being hidden inside RHEN-centric pages.</p></div></article>
              <article><span>03</span><div><strong>The public site is being reconnected to live subsystem state.</strong><p>System status is rendered from the rebuilt feed instead of stale rebuild copy or placeholder continuity.</p></div></article>
              <article><span>04</span><div><strong>Execution remains intentionally gated.</strong><p>Research, replay, forecasting, and control-plane state can inform RHEN, but none of them silently grants broker authority.</p></div></article>
            </div>
          </aside>
        </div>

        <div className="rebuild-ticker" role="status">
          <strong>PUBLIC STATUS</strong>
          <span>{error ? "THE PUBLIC SYSTEM FEED IS CURRENTLY DEGRADED. STATIC FALLBACKS ARE NOT BEING PRESENTED AS LIVE STATE." : "LIVE SYSTEM STATE IS RETURNING THROUGH THE REBUILT FOUNDATION. SOME DATA REMAINS LIMITED UNTIL ITS EVIDENCE CONTRACT IS VERIFIED."}</span>
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>01 / LIVE MACHINE</span>
          <h2>Monitor the systems, not a marketing snapshot.</h2>
          <p>
            The public view is intentionally compact. It reports canonical system activity and freshness without exposing private
            account state, strategy thresholds, orders, sizing, or protected operator controls.
          </p>
        </header>
        <PublicSystemStatus data={data} />
      </section>

      <section className="company-section rebuild-roadmap">
        <header className="company-section-head">
          <span>02 / CURRENT WORK</span>
          <h2>The rebuild is now a running program, not a blank-slate outage.</h2>
          <p>
            Current work is concentrated on subsystem observability, BTC research, replay/forward evidence, and keeping production authority separate from research.
          </p>
        </header>

        <div className="rebuild-phase-grid">
          {currentWork.map((item) => (
            <article key={item.step} className="is-active">
              <header><span>{item.step}</span><b>{item.status}</b></header>
              <SystemIcon system={item.system} size="sm" />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>03 / SYSTEMS</span>
          <h2>Specialized runtimes with bounded authority.</h2>
          <p>
            IREN coordinates state, RHEN owns bounded market execution, GRAEN owns formal research, NOSTRA owns forecasting,
            and VELUM owns broker-isolated replay. Their identities are functional boundaries, not presentation labels.
          </p>
        </header>
        <div className="company-product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
      </section>

      <section className="company-section rebuild-documentation">
        <header className="company-section-head">
          <span>04 / OPERATING RECORD</span>
          <h2>The work should remain inspectable.</h2>
          <p>
            Architecture changes, research decisions, failures, releases, and public evidence remain separate records so current status does not erase how the system got there.
          </p>
        </header>
        <div className="rebuild-documentation-grid">
          <article><span>LIVE SYSTEMS</span><strong>Current public-safe runtime state</strong><p>Cross-system state, telemetry freshness, and current research context from the rebuilt public feed.</p><Link to="/live">Open live systems →</Link></article>
          <article><span>FIELD NOTES</span><strong>Research and engineering decisions</strong><p>Readable records of hypotheses, architecture changes, failures, limitations, and next actions.</p><Link to="/research">Open Field Notes →</Link></article>
          <article><span>RELEASES</span><strong>Versioned implementation history</strong><p>Release records preserve what changed and what was verified without conflating repository activity with research evidence.</p><Link to="/releases">Open releases →</Link></article>
        </div>
      </section>

      <section className="company-section home-field-notes home-field-notes-editorial rebuild-notes">
        <header className="company-section-head">
          <span>05 / FIELD NOTES</span>
          <h2>Follow the research and engineering record.</h2>
          <p>Current notes document implementation, evidence, rejected ideas, system changes, and measured results.</p>
        </header>
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
    </div>
  );
}
