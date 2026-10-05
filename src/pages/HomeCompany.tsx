import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import SystemIcon from "../components/company/SystemIcon";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { SYSTEMS, ageText, displayState, fleetState, publicSystem } from "../lib/system-display";
import "../styles/public-terminal.css";

const introVideoUrl = import.meta.env.VITE_ANEVUM_INTRO_VIDEO_URL?.trim();

export default function HomeCompany() {
  const { data, loading, error, now } = useLiveTrading(5000);
  const views = SYSTEMS.map((name) => publicSystem(name, data, now, Boolean(error)));
  const fleet = fleetState(views);

  return (
    <div className="public-terminal-home">
      <section className="pt-home-hero">
        <div className="pt-home-copy">
          <span className="pt-home-kicker">ANEVUM COMMAND // CUSTOMER CONTROL + LIVE EVIDENCE</span>
          <h1>Connect. Configure. Observe.</h1>
          <p>
            ANEVUM Command is the product surface for automated trading: connect an Alpaca account,
            configure RHEN, understand broker-derived money state, review activity, and inspect what the
            system is actually doing. The customer launch path begins in paper mode while live-money
            authority and money movement remain deliberately disabled until they are verified.
          </p>

          <div className="pt-home-actions">
            <Link to="/command/overview">Open Command →</Link>
            <Link to="/live">See Live Evidence</Link>
            <Link to="/research">Read Field Notes</Link>
          </div>

          <div className="pt-home-runtime" aria-label="Current public runtime">
            <span>PUBLIC EVIDENCE FEED</span>
            <strong>{loading ? "CONNECTING" : error ? "DEGRADED" : displayState(fleet).toUpperCase()}</strong>
            <span>·</span>
            <span>{views.filter((view) => view.fresh).length} / 5 FRESH</span>
            <span>·</span>
            <span>UPDATED {ageText(data?.generated_at, now).toUpperCase()}</span>
          </div>
        </div>

        <div className="pt-home-machine" aria-label="ANEVUM system array">
          <i className="pt-home-orbit one" />
          <i className="pt-home-orbit two" />
          <Link className="pt-home-core" to="/live" aria-label="Open IREN in the Live Terminal">
            <Mark />
            <strong>IREN</strong>
          </Link>

          {(["RHEN", "GRAEN", "NOSTRA", "VELUM"] as const).map((name) => {
            const view = views.find((item) => item.name === name);
            return (
              <Link key={name} className={"pt-home-node " + name.toLowerCase()} to="/live">
                <SystemIcon system={name} size="md" />
                <span>{name}</span>
                <small>{displayState(view?.activityState)}</small>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="pt-home-section" id="introduction">
        <header className="pt-home-section-head">
          <span>00 / COMMAND</span>
          <div>
            <h2>The product is Command. The terminal is the proof.</h2>
            <p>
              Customers should not have to understand every ANEVUM subsystem to use the platform.
              Command reduces the system to the decisions that matter: account state, trading state,
              allocation, risk, money, activity, and required action. Deep subsystem operations remain
              available under System, while the public terminal shows sanitized evidence of the machine
              working.
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
              <strong>COMMAND THE SYSTEM. INSPECT THE EVIDENCE.</strong>
              <small>16:9 INTRO FILM SLOT READY</small>
            </div>
          )}
        </div>
      </section>

      <section className="pt-home-section">
        <header className="pt-home-section-head">
          <span>01 / PRODUCT</span>
          <div>
            <h2>One product. Two evidence surfaces.</h2>
            <p>
              Command is where a customer uses ANEVUM. The Live Terminal and Field Notes exist to make
              the underlying system and its development record inspectable instead of hiding everything
              behind a dashboard.
            </p>
          </div>
        </header>

        <div className="pt-home-links">
          <Link to="/command/overview">
            <span>COMMAND</span>
            <strong>Use the product</strong>
            <p>
              Overview, Trading, Money, Activity, Settings, and advanced System. Paper beta first;
              live-money execution and customer transfer controls remain gated until verified.
            </p>
          </Link>
          <Link to="/live">
            <span>LIVE TERMINAL</span>
            <strong>Inspect the operating evidence</strong>
            <p>System state, activity, telemetry, research, replay, failures, evidence, and public-safe performance.</p>
          </Link>
          <Link to="/research">
            <span>FIELD NOTES</span>
            <strong>Follow the development record</strong>
            <p>Research decisions, failed hypotheses, implementation changes, releases, and measured results.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
