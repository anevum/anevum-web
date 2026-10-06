import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { ageText, displayState, publicSystem } from "../lib/system-display";
import "../styles/public-terminal.css";

const introVideoUrl = import.meta.env.VITE_ANEVUM_INTRO_VIDEO_URL?.trim();

const modules = [
  ["EXECUTION", "Broker-facing market execution, risk, reconciliation, and evidence."],
  ["CONTROL", "Health, incidents, scheduling, orchestration, and protected-action gates."],
  ["RESEARCH", "Strategy evaluation, V15 research, edge discovery, and forward shadow."],
  ["REPLAY", "Deterministic historical replay, simulation, and counterfactual checks."],
  ["FORECAST", "Baseline, regime, calibration, and forward-measurement workflows."],
  ["CORE / STORE", "Bounded SQLite state, evidence, scheduler state, and gateway APIs."]
] as const;

export default function HomeCompany() {
  const { data, loading, error, now } = useLiveTrading(5000);
  const rhen = publicSystem("RHEN", data, now, Boolean(error));

  return (
    <div className="public-terminal-home">
      <section className="pt-home-hero">
        <div className="pt-home-copy">
          <span className="pt-home-kicker">ANEVUM // RHEN V3 UNIFIED RUNTIME</span>
          <h1>One runtime. Clear boundaries.</h1>
          <p>
            RHEN is the unified ANEVUM production runtime. IREN, GRAEN, VELUM, and NOSTRA remain named
            internal modules for control, research, replay, and forecasting, while execution and Core/Store
            share the same Railway service with isolated authority boundaries. Command is the protected
            operating surface; the public terminal is the public evidence surface.
          </p>

          <div className="pt-home-actions">
            <Link to="/command/overview">Open Command →</Link>
            <Link to="/live">Inspect RHEN Live</Link>
            <Link to="/architecture">See Architecture</Link>
          </div>

          <div className="pt-home-runtime" aria-label="Current RHEN public runtime">
            <span>RHEN PUBLIC EVIDENCE</span>
            <strong>{loading ? "CONNECTING" : error ? "DEGRADED" : displayState(rhen.raw).toUpperCase()}</strong>
            <span>·</span>
            <span>1 PRODUCTION SERVICE</span>
            <span>·</span>
            <span>UPDATED {ageText(data?.generated_at, now).toUpperCase()}</span>
          </div>
        </div>

        <div className="pt-home-machine" aria-label="RHEN unified runtime">
          <i className="pt-home-orbit one" />
          <i className="pt-home-orbit two" />
          <Link className="pt-home-core" to="/live" aria-label="Open RHEN in the Live Terminal">
            <Mark />
            <strong>RHEN</strong>
            <small>UNIFIED RUNTIME</small>
          </Link>

          <Link className="pt-home-node rhen" to="/architecture">
            <span>EXECUTION</span>
            <small>Broker authority isolated</small>
          </Link>
          <Link className="pt-home-node graen" to="/architecture">
            <span>CONTROL</span>
            <small>Health · gates · scheduler</small>
          </Link>
          <Link className="pt-home-node nostra" to="/architecture">
            <span>RESEARCH</span>
            <small>V15 · discovery · shadow</small>
          </Link>
          <Link className="pt-home-node velum" to="/architecture">
            <span>REPLAY + FORECAST</span>
            <small>Simulation · calibration</small>
          </Link>
        </div>
      </section>

      <section className="pt-home-section">
        <header className="pt-home-section-head">
          <span>00 / REBUILD</span>
          <div>
            <h2>The architecture has been consolidated around RHEN.</h2>
            <p>
              IREN, GRAEN, VELUM, and NOSTRA now operate as named modules inside the unified RHEN runtime
              rather than separate Railway services. Legacy Foundation-era infrastructure is no longer part
              of the production path. The consolidation removes duplicated infrastructure while preserving
              the authority boundaries that keep research and control code from gaining broker execution power.
            </p>
          </div>
        </header>

        <div className="pt-home-links">
          {modules.map(([name, description]) => (
            <Link key={name} to="/architecture">
              <span>RHEN MODULE</span>
              <strong>{name}</strong>
              <p>{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-home-section" id="introduction">
        <header className="pt-home-section-head">
          <span>01 / COMMAND</span>
          <div>
            <h2>The product is Command. RHEN is the machine underneath it.</h2>
            <p>
              Command is the protected operating surface for account state, trading lanes, strategy authority,
              risk, research, replay, forecasting, incidents, and required action. It reads the canonical RHEN
              runtime instead of maintaining a parallel control model, and it keeps broker-write authority
              explicit rather than inferring it from a healthy process or active strategy.
            </p>
          </div>
        </header>

        <div className="pt-home-film">
          {introVideoUrl ? (
            <video src={introVideoUrl} controls playsInline preload="metadata" aria-label="ANEVUM introduction film" />
          ) : (
            <div className="pt-home-film-placeholder">
              <Mark />
              <span>ANEVUM PRESENTS</span>
              <strong>COMMAND RHEN. INSPECT THE EVIDENCE.</strong>
              <small>16:9 INTRO FILM SLOT READY</small>
            </div>
          )}
        </div>
      </section>

      <section className="pt-home-section">
        <header className="pt-home-section-head">
          <span>02 / CURRENT STATE</span>
          <div>
            <h2>Production rebuild, BTC validation, and customer product work now share one architecture.</h2>
            <p>
              RHEN v3 runs as one Railway application service with a bounded SQLite Core at
              /data/rhen-core.db. Command reads current equities and crypto authority, GRAEN research,
              VELUM validation, NOSTRA forecasting, and IREN control state from that canonical runtime.
              Strategy versions and release gates are rendered from live evidence instead of hard-coded site copy.
            </p>
          </div>
        </header>

        <div className="pt-home-links">
          <Link to="/architecture">
            <span>RHEN V3</span>
            <strong>Unified production runtime</strong>
            <p>One Railway service, one persistent volume, loopback internal modules, bounded retention, and isolated broker authority.</p>
          </Link>
          <Link to="/live">
            <span>STRATEGY PIPELINE</span>
            <strong>Authority and research stay separate</strong>
            <p>Current strategies, research candidates, replay evidence, and release gates are projected from canonical RHEN state.</p>
          </Link>
          <Link to="/command/overview">
            <span>COMMAND</span>
            <strong>Protected operating console</strong>
            <p>Live account state, equities and crypto lanes, risk, research, replay, forecasting, incidents, and raw events in one surface.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
