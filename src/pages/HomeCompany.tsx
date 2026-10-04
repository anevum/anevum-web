import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import ProductCard from "../components/company/ProductCard";
import SystemIcon from "../components/company/SystemIcon";
import { publicSystem, SYSTEMS } from "../lib/system-display";
import PublicSystemStatus from "../components/PublicSystemStatus";
import { fieldNotes } from "../data/fieldNotes";
import { products } from "../data/products";
import { useLiveTrading } from "../hooks/useLiveTrading";

const introVideoUrl = import.meta.env.VITE_ANEVUM_INTRO_VIDEO_URL?.trim();

const systemRoles = {
  IREN: "Operating intelligence",
  RHEN: "Market system",
  NOSTRA: "Forecasting",
  GRAEN: "Research",
  VELUM: "Replay"
} as const;

export default function HomeCompany() {
  const { data, loading, error } = useLiveTrading(5000);
  const views = SYSTEMS.map((name) => publicSystem(name, data, Date.now(), Boolean(error)));
  const observedSystems = views.filter((view) => view.fresh).length;
  const healthySystems = views.filter(
    (view) => view.fresh && ["HEALTHY", "RUNNING", "READY", "IDLE"].includes(view.raw)
  ).length;
  const researchState = String(data?.research?.current_status || "UNRECORDED")
    .replaceAll("_", " ")
    .toUpperCase();

  return (
    <div className="company-page company-home launch-home">
      <section className="launch-hero" aria-labelledby="launch-title">
        <div className="launch-hero-copy">
          <div className="launch-kicker">
            <span><i /> ANEVUM // SYSTEMS + RESEARCH</span>
            <small>REBUILD LAUNCH / 2026</small>
          </div>

          <div className="launch-brand-lockup" aria-hidden="true">
            <Mark />
            <span>ANEVUM</span>
          </div>

          <h1 id="launch-title">A system built to show its work.</h1>
          <p className="launch-lead">
            ANEVUM connects operating intelligence, market execution, mathematical research,
            forecasting, and replay into one inspectable engineering environment.
          </p>

          <div className="launch-actions">
            <a className="company-button primary" href="#intro-film">
              Watch the introduction <span>↓</span>
            </a>
            <Link className="company-button" to="/products">Explore the systems</Link>
          </div>

          <div className="launch-runtime" aria-label="Current public runtime">
            <div>
              <span>PUBLIC FEED</span>
              <strong>{loading ? "CONNECTING" : error ? "DEGRADED" : data?.live ? "LIVE" : "LIMITED"}</strong>
            </div>
            <div>
              <span>OBSERVED</span>
              <strong>{observedSystems ? observedSystems + " / " + SYSTEMS.length : "—"}</strong>
            </div>
            <div>
              <span>READY</span>
              <strong>{observedSystems ? healthySystems + " / " + observedSystems : "—"}</strong>
            </div>
            <div>
              <span>RESEARCH</span>
              <strong>{researchState}</strong>
            </div>
          </div>
        </div>

        <div className="launch-hero-visual" aria-label="ANEVUM system topology">
          <div className="launch-system-map">
            <svg className="launch-system-lines" viewBox="0 0 100 100" aria-hidden="true">
              <path d="M50 50 L18 18" />
              <path d="M50 50 L82 18" />
              <path d="M50 50 L18 82" />
              <path d="M50 50 L82 82" />
              <circle cx="50" cy="50" r="27" />
              <circle cx="50" cy="50" r="39" />
            </svg>

            {(["RHEN", "GRAEN", "IREN", "NOSTRA", "VELUM"] as const).map((system) => {
              const view = views.find((item) => item.name === system);
              return (
                <Link
                  key={system}
                  to={"/products/" + system.toLowerCase()}
                  className={"launch-orbit-node launch-orbit-" + system.toLowerCase()}
                >
                  <SystemIcon system={system} size={system === "IREN" ? "lg" : "md"} />
                  <strong>{system}</strong>
                  <span>{systemRoles[system]}</span>
                  <small className={view?.fresh ? "is-fresh" : ""}>
                    {view?.fresh ? view.raw : "PUBLIC STATE PENDING"}
                  </small>
                </Link>
              );
            })}

            <div className="launch-system-caption">
              <span>ONE ENVIRONMENT</span>
              <strong>FIVE BOUNDED SYSTEMS</strong>
            </div>
          </div>
        </div>

        <div className="launch-scroll-cue" aria-hidden="true">
          <span>INTRODUCTION</span><i />
        </div>
      </section>

      <section className="launch-film-section" id="intro-film" aria-labelledby="intro-film-title">
        <header className="launch-section-heading">
          <span>00 / INTRODUCTION</span>
          <div>
            <h2 id="intro-film-title">Meet ANEVUM.</h2>
            <p>
              This presentation stage is reserved for the launch film: a concise visual explanation
              of ANEVUM, the five systems, their authority boundaries, and the evidence path that ties
              research to production.
            </p>
          </div>
        </header>

        <div className={"launch-film-frame" + (introVideoUrl ? " has-video" : " is-prepared")}>
          <div className="launch-film-bar">
            <span>ANEVUM // INTRO FILM</span>
            <small>{introVideoUrl ? "MEDIA READY" : "MEDIA SLOT READY"}</small>
          </div>

          {introVideoUrl ? (
            <video
              className="launch-film-video"
              src={introVideoUrl}
              controls
              playsInline
              preload="metadata"
              aria-label="ANEVUM introduction film"
            />
          ) : (
            <div className="launch-film-placeholder">
              <div className="launch-film-mark"><Mark /></div>
              <span>ANEVUM PRESENTS</span>
              <strong>SYSTEMS THAT CAN BE INSPECTED.</strong>
              <p>
                The launch film is being prepared for this stage. The final 16:9 master can replace
                this frame without changing the page layout.
              </p>
              <div className="launch-film-timeline" aria-label="Planned film structure">
                <span><b>00:00</b> Identity</span>
                <span><b>00:12</b> Five systems</span>
                <span><b>00:30</b> Evidence path</span>
                <span><b>00:48</b> Rebuild</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="company-section launch-live-section">
        <header className="launch-section-heading">
          <span>01 / LIVE MACHINE</span>
          <div>
            <h2>See the current system, not a frozen marketing snapshot.</h2>
            <p>
              The public surface reports sanitized runtime state and freshness without exposing
              private account data, strategy thresholds, order details, or protected controls.
            </p>
          </div>
        </header>
        <PublicSystemStatus data={data} error={error} compact />
      </section>

      <section className="company-section">
        <header className="launch-section-heading">
          <span>02 / SYSTEMS</span>
          <div>
            <h2>Specialized systems. Explicit boundaries.</h2>
            <p>
              IREN coordinates state. RHEN owns bounded market execution. GRAEN owns formal research.
              NOSTRA owns forecasting. VELUM owns broker-isolated replay.
            </p>
          </div>
        </header>
        <div className="company-product-grid launch-product-grid">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>

      <section className="company-section launch-record-section">
        <header className="launch-section-heading">
          <span>03 / EVIDENCE</span>
          <div>
            <h2>The record stays visible.</h2>
            <p>
              Architecture changes, research decisions, failures, releases, and measured evidence
              remain separate records so current state never erases how the system got there.
            </p>
          </div>
        </header>

        <div className="launch-record-grid">
          <Link to="/architecture">
            <span>ARCHITECTURE</span>
            <strong>How the machine is divided</strong>
            <p>Service boundaries, authority, data flow, infrastructure, and public/private separation.</p>
            <i>OPEN →</i>
          </Link>
          <Link to="/research">
            <span>FIELD NOTES</span>
            <strong>Research and engineering decisions</strong>
            <p>Hypotheses, failures, methodology changes, implementation work, and next actions.</p>
            <i>OPEN →</i>
          </Link>
          <Link to="/releases">
            <span>RELEASES</span>
            <strong>Versioned implementation history</strong>
            <p>What changed, when it changed, and what was actually verified.</p>
            <i>OPEN →</i>
          </Link>
        </div>
      </section>

      <section className="company-section home-field-notes launch-notes">
        <header className="launch-section-heading">
          <span>04 / LATEST</span>
          <div>
            <h2>Follow the work as it changes.</h2>
            <p>Recent Field Notes document implementation, evidence, rejected ideas, and measured results.</p>
          </div>
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
