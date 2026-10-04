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
          <span className="pt-home-kicker">ANEVUM // LIVE SYSTEMS + RESEARCH</span>
          <h1>Watch the machine work.</h1>
          <p>
            ANEVUM is an inspectable research and operating environment. The public site is now centered
            on one live terminal showing sanitized system state, research activity, replay, market
            telemetry, evidence, and failures as they are recorded.
          </p>

          <div className="pt-home-actions">
            <Link to="/live">Enter Live Terminal →</Link>
            <Link to="/research">Read Field Notes</Link>
            <Link to="/founder">About ANEVUM</Link>
          </div>

          <div className="pt-home-runtime" aria-label="Current public runtime">
            <span>PUBLIC FEED</span>
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
          <Link className="pt-home-core" to="/live" aria-label="Open IREN in Live Terminal">
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
          <span>00 / INTRODUCTION</span>
          <div>
            <h2>ANEVUM in one view.</h2>
            <p>
              The launch film will introduce IREN, RHEN, GRAEN, NOSTRA, and VELUM, then hand directly
              into the live terminal rather than sending visitors through a maze of product pages.
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
              <strong>SYSTEMS THAT SHOW THEIR WORK.</strong>
              <small>16:9 INTRO FILM SLOT READY</small>
            </div>
          )}
        </div>
      </section>

      <section className="pt-home-section">
        <header className="pt-home-section-head">
          <span>01 / EXPLORE</span>
          <div>
            <h2>Three places to go.</h2>
            <p>
              The public surface is intentionally small. Observe the system, read the record, or learn
              who built it and how it is structured.
            </p>
          </div>
        </header>

        <div className="pt-home-links">
          <Link to="/live">
            <span>LIVE TERMINAL</span>
            <strong>Observe ANEVUM operating</strong>
            <p>System state, activity, telemetry, research, replay, evidence, and public-safe performance.</p>
          </Link>
          <Link to="/research">
            <span>FIELD NOTES</span>
            <strong>Follow the development record</strong>
            <p>Research decisions, failed hypotheses, implementation changes, releases, and measured results.</p>
          </Link>
          <Link to="/founder">
            <span>ABOUT</span>
            <strong>Company, architecture, and founder</strong>
            <p>Why ANEVUM exists, how the system is divided, and the person building it.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
