import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { ageText, displayState, publicSystem } from "../lib/system-display";
import "../styles/public-terminal.css";

const introVideoUrl = import.meta.env.VITE_ANEVUM_INTRO_VIDEO_URL?.trim();

const modules = [
  ["EXECUTION", "RHEN broker-facing equities execution, live BTC signal generation, risk, reconciliation, and durable evidence."],
  ["IREN / CONTROL", "Health, incidents, scheduling, orchestration, required-action state, and protected release boundaries."],
  ["GRAEN / RESEARCH", "Bounded strategy discovery, chronological evaluation, falsification, and candidate promotion evidence."],
  ["VELUM / REPLAY", "Independent replay, friction stress, delay stress, simulation, and counterfactual verification."],
  ["NOSTRA / FORECAST", "Regime, baseline, calibration, forward measurement, and prediction-state workflows."],
  ["CORE / STORE", "Bounded SQLite state, scheduler state, research state, evidence retention, and canonical gateway APIs."]
] as const;

export default function HomeCompany() {
  const { data, loading, error, now } = useLiveTrading(5000);
  const rhen = publicSystem("RHEN", data, now, Boolean(error));

  return (
    <div className="public-terminal-home">
      <section className="pt-home-hero">
        <div className="pt-home-copy">
          <span className="pt-home-kicker">ANEVUM // RHEN</span>
          <h1>One system. Clear evidence.</h1>
          <p>
            ANEVUM builds RHEN, an inspectable automated trading and research system. RHEN operates
            equities execution, a live BTC signal lane, durable evidence, strategy research, replay,
            forecasting, and control. Command is the protected operator surface; the Live Terminal is
            the sanitized public view into what the system is actually doing.
          </p>

          <div className="pt-home-actions">
            <Link to="/live">Inspect RHEN Live →</Link>
            <Link to="/research">Read Research</Link>
            <Link to="/architecture">See Architecture</Link>
          </div>

          <div className="pt-home-runtime" aria-label="Current RHEN public runtime">
            <span>RHEN PUBLIC EVIDENCE</span>
            <strong>{loading ? "CONNECTING" : error ? "DEGRADED" : displayState(rhen.raw).toUpperCase()}</strong>
            <span>·</span>
            <span>1 CANONICAL RUNTIME + ISOLATED PAPER CANARY</span>
            <span>·</span>
            <span>UPDATED {ageText(data?.generated_at, now).toUpperCase()}</span>
          </div>
        </div>

        <div className="pt-home-machine" aria-label="RHEN unified runtime and named modules">
          <Link className="pt-home-core" to="/live" aria-label="Open RHEN in the Live Terminal">
            <Mark />
            <strong>RHEN</strong>
            <small>CANONICAL RUNTIME</small>
          </Link>

          <Link className="pt-home-node rhen" to="/architecture">
            <span>IREN</span>
            <small>Control · health · scheduler</small>
          </Link>
          <Link className="pt-home-node graen" to="/research">
            <span>GRAEN</span>
            <small>Discovery · validation</small>
          </Link>
          <Link className="pt-home-node nostra" to="/architecture">
            <span>NOSTRA</span>
            <small>Forecast · calibration</small>
          </Link>
          <Link className="pt-home-node velum" to="/architecture">
            <span>VELUM</span>
            <small>Replay · stress verification</small>
          </Link>
        </div>
      </section>

      <section className="pt-home-section">
        <header className="pt-home-section-head">
          <span>00 / SYSTEM</span>
          <div>
            <h2>RHEN is the production system. The modules keep distinct responsibilities.</h2>
            <p>
              IREN, GRAEN, VELUM, and NOSTRA operate as named modules inside the canonical RHEN runtime,
              not as separate product stacks. An isolated BTC paper canary remains a second Railway service
              specifically for paper execution and forward evidence; it cannot grant live broker-write authority.
              This keeps deployment simple without collapsing research, replay, control, and execution into one permission set.
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
            <h2>Command is the operating product. RHEN is the system underneath it.</h2>
            <p>
              Command is the protected surface for account state, trading lanes, strategy authority,
              risk, research, replay, forecasting, incidents, and required action. It reads canonical
              RHEN state instead of maintaining a parallel control model, and it keeps broker-write
              authority explicit rather than inferring it from a healthy process or active strategy.
            </p>
          </div>
        </header>

        <div className="pt-home-film">
          {introVideoUrl ? (
            <video src={introVideoUrl} controls playsInline preload="metadata" aria-label="ANEVUM introduction film" />
          ) : (
            <div className="pt-home-film-placeholder">
              <Mark />
              <span>INTRODUCTION FILM</span>
              <strong>RHEN / COMMAND</strong>
              <small>VIDEO ASSET NOT YET PUBLISHED</small>
            </div>
          )}
        </div>
      </section>

      <section className="pt-home-section">
        <header className="pt-home-section-head">
          <span>02 / CURRENT STATE</span>
          <div>
            <h2>One canonical runtime, one isolated paper canary, one evidence model.</h2>
            <p>
              RHEN v3 runs the canonical production supervisor, execution boundary, Core/Store, IREN control,
              GRAEN research, VELUM replay, and NOSTRA forecasting in one Railway application service backed by
              bounded SQLite state at /data/rhen-core.db. The separate BTC paper canary consumes only validated
              paper assignments and remains isolated from live execution authority.
            </p>
          </div>
        </header>

        <div className="pt-home-links">
          <Link to="/architecture">
            <span>RHEN V3</span>
            <strong>Canonical production runtime</strong>
            <p>One supervised runtime with isolated internal responsibilities, bounded state, evidence retention, and narrow broker authority.</p>
          </Link>
          <Link to="/research">
            <span>GRAEN → VELUM</span>
            <strong>Research must earn forward paper</strong>
            <p>Bounded candidates move through chronological evidence, independent replay, friction stress, and paper-only forward evaluation.</p>
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
