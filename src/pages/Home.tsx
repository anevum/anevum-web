import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import { useLiveTrading } from "../hooks/useLiveTrading";

function ageLabel(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "awaiting";
  if (value < 60) return Math.max(0, Math.round(value)) + "s";
  return Math.floor(value / 60) + "m";
}

function shortVersion(value?: string | null) {
  if (!value) return "UNVERSIONED";
  return String(value).replace(/^strategy[-_ ]?/i, "").toUpperCase();
}

const destinations = [
  {
    href: "/performance",
    index: "01",
    title: "Performance",
    description: "The live broker-derived record: normalized returns, drawdown, sample size, and methodology."
  },
  {
    href: "/live",
    index: "02",
    title: "Operations",
    description: "RHEN runtime telemetry, current system state, activity, and the evidence being generated now."
  },
  {
    href: "/research",
    index: "03",
    title: "Research",
    description: "Experiments, rejected ideas, active questions, durable decisions, and the next direction."
  }
];

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const { data, loading } = useLiveTrading(5000);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 1050);
    return () => window.clearTimeout(timer);
  }, []);

  const version = data?.active_strategy?.version_id || data?.active_strategy?.strategy_name;
  const state = loading ? "CONNECTING" : data?.state || (data?.live ? "RUNNING" : "STALE");
  const stateClass = data?.live ? "is-live" : data ? "is-stale" : "";
  const research = String(data?.research?.current_status || "UNRECORDED").replaceAll("_", " ").toUpperCase();

  return (
    <>
      <AnimatePresence>
        {showIntro ? (
          <motion.div
            className="anevum-intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .32 }}
            aria-hidden="true"
          >
            <motion.div
              className="anevum-intro-mark"
              initial={{ opacity: 0, scale: .88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: .58, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Mark />
              <span>ANEVUM</span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="compact-page landing-screen anevum-home">
        <motion.div
          className="landing-copy anevum-home-copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .62, delay: .06 }}
        >
          <div className="landing-mark"><Mark /></div>
          <p className="compact-eyebrow">ANEVUM / OPERATING COMPANY</p>
          <h1>Build systems. Prove them. Scale what works.</h1>
          <p className="landing-description">
            ANEVUM builds and operates autonomous systems around real work. RHEN is the current flagship:
            a live market research, execution, evidence, and learning system. We preserve what happens,
            reject what fails, and expand people, agents, infrastructure, and scope only when the evidence justifies it.
          </p>
          <div className="anevum-home-principles" aria-label="ANEVUM operating principles">
            <span>REAL SYSTEMS</span><i />
            <span>DURABLE EVIDENCE</span><i />
            <span>CONTROLLED SCALE</span>
          </div>
        </motion.div>

        <motion.div
          className="landing-destinations"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: .6, delay: .18 }}
        >
          <div className="anevum-home-section-label">
            <span>CURRENT OPERATION</span>
            <strong>RHEN</strong>
          </div>
          {destinations.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .4, delay: .22 + index * .06 }}
            >
              <Link className="destination-card" to={item.href}>
                <span>{item.index}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <i>→</i>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="landing-status">
          <div><span className={"runtime-state " + stateClass}><i />{state}</span></div>
          <div><small>FLAGSHIP</small><strong>RHEN</strong></div>
          <div><small>ACTIVE VERSION</small><strong>{shortVersion(version)}</strong></div>
          <div><small>TELEMETRY</small><strong>{ageLabel(data?.freshness_seconds)} AGO</strong></div>
          <div><small>RESEARCH</small><strong>{research}</strong></div>
        </div>
      </section>
    </>
  );
}
