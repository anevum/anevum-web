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
            RHEN is now the single ANEVUM system and production runtime. Execution, control, research,
            replay, forecasting, Core/Store, and the research worker run as isolated modules inside one
            Railway service instead of a fleet of overlapping services. Command remains the customer
            surface; the public terminal remains the evidence surface.
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
              The former IREN, GRAEN, VELUM, NOSTRA, Foundation, and Research Agent identities are now
              migration aliases for internal RHEN modules rather than independent top-level products or
              Railway services. This removes duplicated infrastructure while preserving the authority
              boundaries that keep research and control code from silently gaining broker execution power.
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
              Command is being built around the decisions a customer actually needs: account state,
              trading state, allocation, risk, activity, and required action. Paper Beta is the current
              launch path. Live-money customer authority and real money movement remain gated until their
              execution, custody, reconciliation, and security requirements are verified.
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
              RHEN v3 has merged with one Railway application service and a bounded SQLite Core at
              /data/rhen-core.db. The frozen V15 BTC breakout candidate remains shadow/paper only while
              forward evidence accumulates. Command Paper Beta is being implemented separately and does
              not imply live customer trading authority.
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
            <span>BTC / V15</span>
            <strong>Forward evidence before promotion</strong>
            <p>V15-R1-BTC-R2H-BREAKOUT-42-15 is frozen and remains shadow/paper only. No automatic live promotion.</p>
          </Link>
          <Link to="/command/overview">
            <span>COMMAND</span>
            <strong>Paper Beta in implementation</strong>
            <p>Customer account connection, allocation, risk, activity, and paper authorization are being built behind protected access.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
