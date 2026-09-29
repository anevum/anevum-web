import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RhenMark from "../components/RhenMark";
import RhenLaunchSequence from "../components/RhenLaunchSequence";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { fetchTheoryProgram, type TheoryProgramFeed } from "../lib/data";

function ageLabel(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "awaiting";
  if (value < 60) return Math.max(0, Math.round(value)) + "s";
  return Math.floor(value / 60) + "m";
}

function shortVersion(value?: string | null) {
  if (!value) return "UNVERSIONED";
  return String(value).replace(/^strategy[-_ ]?/i, "").toUpperCase();
}

function percentLabel(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return sign + value.toFixed(2) + "%";
}

const destinations = [
  {
    href: "/performance",
    index: "01",
    title: "Performance",
    description: "Broker-derived returns, drawdown, sample size, methodology, and the evidence boundary."
  },
  {
    href: "/live",
    index: "02",
    title: "Operations",
    description: "Current runtime state, telemetry, activity, and what RHEN is observing now."
  },
  {
    href: "/research",
    index: "03",
    title: "Research",
    description: "Experiments, rejected ideas, open questions, evidence gaps, and durable decisions."
  },
  {
    href: "/theory",
    index: "04",
    title: "Mathematics & Theory",
    description: "Formal models, conjectures, proof targets, and the mathematical research program."
  },
  {
    href: "/system",
    index: "05",
    title: "System",
    description: "Architecture, boundaries, telemetry layers, data flow, and operating constraints."
  },
  {
    href: "/releases",
    index: "06",
    title: "Releases",
    description: "Versioned RHEN releases, immutable snapshots, verification, and change history."
  }
];

export default function Home() {
  const reduceMotion = Boolean(useReducedMotion());
  const [theoryProgram, setTheoryProgram] = useState<TheoryProgramFeed | null>(null);
  const { data, loading } = useLiveTrading(5000);

  useEffect(() => {
    let active = true;
    fetchTheoryProgram()
      .then((program) => {
        if (active) setTheoryProgram(program);
      })
      .catch(() => {
        if (active) setTheoryProgram(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const version = data?.active_strategy?.version_id || data?.active_strategy?.strategy_name;
  const state = loading ? "CONNECTING" : data?.state || (data?.live ? "RUNNING" : "STALE");
  const stateClass = data?.live ? "is-live" : data ? "is-stale" : "";
  const research = String(data?.research?.current_status || "UNRECORDED").replaceAll("_", " ").toUpperCase();
  const performance = data?.performance;
  const october = document.documentElement.dataset.seasonalTheme === "oct";
  const activeTheoryProblem =
    theoryProgram?.problems.find((row) => row.problem_id === theoryProgram.program.current_problem_id) ||
    [...(theoryProgram?.problems || [])].reverse().find((row) => row.status === "ACTIVE") ||
    theoryProgram?.problems[0];

  return (
    <>
      <section className={"anevum-home-v2" + (october ? " october-home" : "")}>
        <section className="anevum-home-hero-v2">
          {october ? (
            <div className="october-hero-art" aria-hidden="true">
              <div className="october-pumpkin-core"><i /><b /><span /></div>
              <div className="october-orbit october-orbit-a" />
              <div className="october-orbit october-orbit-b" />
            </div>
          ) : null}
          <div className="anevum-home-hero-copy-v2 anevum-home-launch-hero">
            <RhenLaunchSequence />

            <motion.div
              className="anevum-home-launch-actions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : .5, delay: reduceMotion ? 0 : 10.95 }}
            >
              <div className="anevum-home-actions-v2">
                <Link className="anevum-home-primary-v2" to="/performance">
                  See the record <b>↗</b>
                </Link>
                <Link className="anevum-home-secondary-v2" to="/system">
                  Explore RHEN <b>→</b>
                </Link>
              </div>

              <div className="anevum-home-principles-v2">
                <span>LIVE SYSTEMS</span><i />
                <span>DURABLE EVIDENCE</span><i />
                <span>CONTROLLED SCALE</span>
              </div>
            </motion.div>
          </div>

          <motion.aside
            className="anevum-home-rhen-card-v2"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : .62, delay: reduceMotion ? 0 : 11.1 }}
          >
            <div className="anevum-home-rhen-orbit-v2" aria-hidden="true">
              <span /><span /><span />
              <RhenMark decorative />
            </div>
            <div className="anevum-home-rhen-card-head-v2">
              <div>
                <small>FLAGSHIP SYSTEM</small>
                <strong>RHEN</strong>
              </div>
              <span className={"runtime-state " + stateClass}><i />{state}</span>
            </div>
            <div className="anevum-home-rhen-metrics-v2">
              <div><small>ACTIVE VERSION</small><strong>{shortVersion(version)}</strong></div>
              <div><small>RETURN</small><strong>{percentLabel(performance?.account_return_pct)}</strong></div>
              <div><small>CLOSED TRADES</small><strong>{performance?.closed_trades ?? "—"}</strong></div>
              <div><small>SESSIONS</small><strong>{performance?.trading_sessions ?? "—"}</strong></div>
            </div>
            <div className="anevum-home-rhen-card-foot-v2">
              <span>TELEMETRY {ageLabel(data?.freshness_seconds)} AGO</span>
              <span>{research}</span>
            </div>
          </motion.aside>
        </section>

        <section className="anevum-home-status-v2" aria-label="Current ANEVUM state">
          <div><small>LIVE SYSTEM</small><strong>RHEN</strong></div>
          <div><small>ACTIVE VERSION</small><strong>{shortVersion(version)}</strong></div>
          <div><small>STRATEGY</small><strong>{data?.active_strategy?.strategy_name || "UNRECORDED"}</strong></div>
          <div><small>RESEARCH</small><strong>{research}</strong></div>
          <div><small>TELEMETRY</small><strong>{ageLabel(data?.freshness_seconds)} AGO</strong></div>
        </section>

        <section className="anevum-home-section-v2">
          <div className="anevum-home-section-head-v2">
            <div>
              <span>01 // CURRENT WORK</span>
              <h2>What is moving now.</h2>
            </div>
            <p>
              The public site is a live view into the work: operational evidence, current research,
              formal theory, and versioned system changes.
            </p>
          </div>

          <div className="anevum-home-current-grid-v2">
            <Link className="anevum-home-project-card-v2 is-rhen" to="/releases">
              <div className="anevum-home-project-card-top-v2">
                <span>RHEN // {shortVersion(version)}</span>
                <b>{data?.active_strategy?.status || state}</b>
              </div>
              <div>
                <RhenMark decorative />
                <h3>{data?.active_strategy?.strategy_name || "RHEN"}</h3>
                <p>Live execution, telemetry, evidence generation, and bounded research operating from the current production state.</p>
              </div>
              <footer>
                <span>LIVE SYSTEM // CANONICAL TELEMETRY</span>
                <i>→</i>
              </footer>
            </Link>

            <Link className="anevum-home-project-card-v2 is-theory" to="/theory">
              <div className="anevum-home-project-card-top-v2">
                <span>MATHEMATICS // THEORY</span>
                <b>{theoryProgram?.program.status || "ACTIVE"}</b>
              </div>
              <div>
                <div className="anevum-home-equation-v2">ΔVₜ + Rₜ(π)</div>
                <h3>{activeTheoryProblem?.problem_id || "THEORY"}</h3>
                <p>{activeTheoryProblem?.title || "Formal mathematical research and model development."}</p>
              </div>
              <footer>
                <span>{activeTheoryProblem?.status || "PROGRAM"}</span>
                <i>→</i>
              </footer>
            </Link>
          </div>
        </section>

        <section className="anevum-home-section-v2 anevum-home-explore-v2">
          <div className="anevum-home-section-head-v2">
            <div>
              <span>02 // EXPLORE</span>
              <h2>Follow the evidence.</h2>
            </div>
            <p>
              Each surface answers a different question. Nothing important is hidden behind a
              single marketing page.
            </p>
          </div>

          <div className="anevum-home-destination-grid-v2">
            {destinations.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: .38, delay: index * .04 }}
              >
                <Link className="anevum-home-destination-v2" to={item.href}>
                  <span>{item.index}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <i>↗</i>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="anevum-home-record-v2">
          <div>
            <span>03 // RECORD</span>
            <strong>The work should leave a trail.</strong>
            <p>Daily system work, research decisions, releases, evidence, and operational milestones remain inspectable rather than disappearing into a feed.</p>
          </div>
          <Link to="/record">Open the record <b>→</b></Link>
        </section>
      </section>
    </>
  );
}
