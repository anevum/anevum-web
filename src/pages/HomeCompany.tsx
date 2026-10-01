import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import ProductCard from "../components/company/ProductCard";
import SystemIcon from "../components/company/SystemIcon";
import { fieldNotes } from "../data/fieldNotes";
import { products } from "../data/products";

const rebuildPhases = [
  {
    step: "01",
    status: "UNDERWAY",
    title: "Remove inherited data dependencies",
    body: "Supabase dependencies are being removed from the core path. Data contracts, persistence requirements, and ownership are being redefined before a replacement is accepted."
  },
  {
    step: "02",
    status: "ACTIVE",
    title: "Re-center the operating stack",
    body: "GitHub remains the canonical code and change record. Railway remains the primary runtime and deployment layer while service boundaries are rebuilt intentionally."
  },
  {
    step: "03",
    status: "NEXT",
    title: "Rebuild evidence and telemetry",
    body: "Persistence, event delivery, health state, and public-safe telemetry will be reconstructed around durable contracts instead of patched around the previous stack."
  },
  {
    step: "04",
    status: "PRIORITY",
    title: "Bring RHEN and GRAEN back online",
    body: "Market operations and mathematical research are the first subsystem restoration targets. They return only after their new evidence paths pass verification."
  },
  {
    step: "05",
    status: "QUEUED",
    title: "Restore public data surfaces",
    body: "Live graphs, performance evidence, runtime state, and progress telemetry return after the rebuilt pipeline can support them without stale or synthetic fallbacks."
  },
  {
    step: "06",
    status: "QUEUED",
    title: "Reintegrate the full machine",
    body: "IREN, NOSTRA, VELUM, Command, and the public site will be reconnected to the rebuilt foundation and verified as one coherent operating system."
  }
];

const priorities = [
  {
    system: "RHEN" as const,
    tag: "RESTORE FIRST",
    title: "Market operations",
    body: "Re-establish a clean runtime, durable evidence path, and trustworthy production telemetry before live activity is represented publicly."
  },
  {
    system: "GRAEN" as const,
    tag: "RESTORE FIRST",
    title: "Mathematical research",
    body: "Re-establish the independent research runtime, experiment records, validation boundaries, and durable outputs on the new foundation."
  }
];

export default function HomeCompany() {
  return (
    <div className="company-page company-home rebuild-home">
      <section className="rebuild-breaking-hero" aria-labelledby="rebuild-headline">
        <div className="rebuild-breaking-kicker">
          <span className="rebuild-breaking-label"><i /> BREAKING // SYSTEM REBUILD</span>
          <span>OCTOBER 1, 2026</span>
          <span>ANEVUM ENGINEERING UPDATE</span>
        </div>

        <div className="rebuild-breaking-grid">
          <div className="rebuild-breaking-copy">
            <div className="company-mark-lockup"><Mark /><span>SOFTWARE · RESEARCH · AUTONOMOUS SYSTEMS</span></div>
            <p className="rebuild-eyebrow">LATEST DEVELOPMENT</p>
            <h1 id="rebuild-headline">ANEVUM is rebuilding its core stack from the ground up.</h1>
            <p className="rebuild-deck">
              The first generation of the system produced enough useful feedback, data, and operating experience to justify a deeper architectural reset. Instead of continuing to layer fixes onto choices made while the project was still proving itself, we are rebuilding the machine deliberately from first principles.
            </p>

            <div className="rebuild-status-band" aria-label="Current rebuild status">
              <span><small>PUBLIC DATA</small><strong>OFFLINE BY DESIGN</strong></span>
              <span><small>REBUILD</small><strong>UNDERWAY</strong></span>
              <span><small>WORK WINDOW</small><strong>UP TO ~1 WEEK</strong></span>
            </div>

            <div className="company-actions">
              <Link className="company-button primary" to="/research">Follow the rebuild <span>→</span></Link>
              <Link className="company-button" to="/architecture">Architecture</Link>
              <Link className="company-text-link" to="/products">System map ↗</Link>
            </div>
          </div>

          <aside className="rebuild-latest-card" aria-label="Latest rebuild developments">
            <header>
              <span>LATEST // 13:30 ET</span>
              <strong>REBUILD BRIEF</strong>
            </header>
            <div className="rebuild-latest-lead">
              <span>01</span>
              <div>
                <small>FIRST MOVE</small>
                <strong>Supabase is being removed from the core stack.</strong>
                <p>The replacement persistence design will be selected from actual system requirements rather than inherited platform choices.</p>
              </div>
            </div>
            <div className="rebuild-latest-list">
              <article><span>02</span><div><strong>GitHub + Railway become the immediate center of gravity.</strong><p>Code, history, runtime, deployment, tests, and service boundaries are being rebuilt around the parts of the stack that already fit the operating model.</p></div></article>
              <article><span>03</span><div><strong>RHEN and GRAEN are first back online.</strong><p>Trading and mathematical research are the priority restoration lanes before secondary surfaces are reconnected.</p></div></article>
              <article><span>04</span><div><strong>The rebuild is being documented as it happens.</strong><p>Repository changes, tests, failures, architecture decisions, and measured results will be preserved through Field Notes and the public record.</p></div></article>
            </div>
          </aside>
        </div>

        <div className="rebuild-ticker" role="status">
          <strong>PUBLIC STATUS</strong>
          <span>LIVE GRAPHS, PERFORMANCE DATA, AND SYSTEM TELEMETRY ARE TEMPORARILY OFFLINE WHILE THE UNDERLYING DATA AND RUNTIME PATHS ARE REBUILT.</span>
        </div>
      </section>

      <section className="company-section rebuild-why">
        <header className="company-section-head">
          <span>01 / WHY THE DATA IS OFFLINE</span>
          <h2>The downtime is part of the rebuild, not something being hidden.</h2>
          <p>
            The existing public surfaces depend on infrastructure that is being removed, separated, or migrated. During that work, ANEVUM will fail closed: no stale telemetry, invented continuity, or placeholder performance will be presented as live evidence.
          </p>
        </header>

        <div className="rebuild-reason-grid">
          <article className="rebuild-reason-feature">
            <span>WHY NOW</span>
            <h3>The prototype phase answered the important question: the system is worth rebuilding properly.</h3>
            <p>
              ANEVUM began as an experiment whose architecture evolved while the project itself was still being discovered. Recent operating feedback made the next step clear: preserve what worked, discard accidental complexity, and rebuild the foundation around explicit subsystem boundaries, durable evidence, reproducible research, and easier operation.
            </p>
          </article>
          <article>
            <span>PUBLIC DATA POLICY</span>
            <strong>Offline is better than ambiguous.</strong>
            <p>Graphs and metrics stay unavailable until the new pipeline can prove where the data came from, when it was generated, and whether it belongs to live, research, replay, shadow, or simulation state.</p>
          </article>
          <article>
            <span>IMPLEMENTATION</span>
            <strong>Codex-assisted, repository-first.</strong>
            <p>Codex is being used for repository-level implementation, migration work, tests, verification, and documentation while architectural decisions remain traceable in GitHub.</p>
          </article>
        </div>
      </section>

      <section className="company-section rebuild-roadmap">
        <header className="company-section-head">
          <span>02 / REBUILD SEQUENCE</span>
          <h2>Rebuild the foundation first. Restore visible systems second.</h2>
          <p>
            The working window may take the better part of a week. The sequence is intentionally biased toward correctness and clean ownership rather than keeping every public surface artificially online.
          </p>
        </header>

        <div className="rebuild-phase-grid">
          {rebuildPhases.map((phase) => (
            <article key={phase.step} className={phase.status === "UNDERWAY" || phase.status === "ACTIVE" || phase.status === "PRIORITY" ? "is-active" : ""}>
              <header><span>{phase.step}</span><b>{phase.status}</b></header>
              <h3>{phase.title}</h3>
              <p>{phase.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="company-section rebuild-priority">
        <header className="company-section-head">
          <span>03 / FIRST RESTORATION TARGETS</span>
          <h2>RHEN and GRAEN return first.</h2>
          <p>
            These two systems create the most important immediate feedback loop: RHEN produces real operating evidence, while GRAEN tests and formalizes the research that should influence future behavior.
          </p>
        </header>

        <div className="rebuild-priority-grid">
          {priorities.map((item) => (
            <article key={item.system}>
              <header><SystemIcon system={item.system} size="md" /><span>{item.tag}</span></header>
              <small>{item.system}</small>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <Link to={"/products/" + item.system.toLowerCase()}>System profile <b>→</b></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="company-section rebuild-documentation">
        <header className="company-section-head">
          <span>04 / OPEN DEVELOPMENT RECORD</span>
          <h2>The rebuild will leave a reproducible trail.</h2>
          <p>
            Architecture decisions, migration milestones, tests, failures, research outcomes, and restoration checkpoints will be documented while the work is underway rather than reconstructed afterward.
          </p>
        </header>
        <div className="rebuild-documentation-grid">
          <article><span>FIELD NOTES</span><strong>Progress reports and engineering decisions</strong><p>Readable updates explaining what changed, why it changed, what failed, and what evidence supports the next step.</p><Link to="/research">Open Field Notes →</Link></article>
          <article><span>GITHUB</span><strong>Canonical implementation history</strong><p>Code changes, tests, reviews, release history, and architecture work remain traceable to repository state instead of disappearing into chat.</p><Link to="/releases">Open release record →</Link></article>
          <article><span>PUBLIC EVIDENCE</span><strong>Data returns only after verification</strong><p>When live graphs and metrics come back online, they will be connected to the rebuilt evidence path rather than the retired stack.</p><Link to="/performance">Performance surface →</Link></article>
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head">
          <span>05 / SYSTEMS</span>
          <h2>The machine being rebuilt.</h2>
          <p>The subsystem identities remain intact while their infrastructure, contracts, runtime boundaries, and shared evidence paths are rebuilt beneath them.</p>
        </header>
        <div className="company-product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
      </section>

      <section className="company-section home-field-notes home-field-notes-editorial rebuild-notes">
        <header className="company-section-head">
          <span>06 / FIELD NOTES</span>
          <h2>Follow the work as it happens.</h2>
          <p>Current notes remain the public engineering journal. Rebuild entries will document the migration, validation, restoration sequence, and results.</p>
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
