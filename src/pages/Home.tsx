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
    href: "/live",
    index: "01",
    title: "Live",
    description: "Runtime telemetry, event feed, activity, and current system state."
  },
  {
    href: "/system",
    index: "02",
    title: "System",
    description: "Architecture, operating pipeline, process, and public data boundary."
  },
  {
    href: "/research",
    index: "03",
    title: "Research",
    description: "Edge discovery, development record, current work, and resource registry."
  }
];

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const { data, loading } = useLiveTrading(5000);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 1150);
    return () => window.clearTimeout(timer);
  }, []);

  const version = data?.active_strategy?.version_id || data?.active_strategy?.strategy_name;
  const state = loading ? "CONNECTING" : data?.state || (data?.live ? "RUNNING" : "STALE");
  const stateClass = data?.live ? "is-live" : data ? "is-stale" : "";

  return (
    <>
      <AnimatePresence>
        {showIntro ? (
          <motion.div
            className="anevum-intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .34 }}
            aria-hidden="true"
          >
            <motion.div
              className="anevum-intro-mark"
              initial={{ opacity: 0, scale: .86 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: .62, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Mark />
              <span>ANEVUM</span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="compact-page landing-screen">
        <motion.div
          className="landing-copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .62, delay: .08 }}
        >
          <div className="landing-mark"><Mark /></div>
          <p className="compact-eyebrow">ANEVUM / RHEN</p>
          <h1>RHEN — automated market research, execution, and evidence.</h1>
          <p className="landing-description">
            RHEN is ANEVUM's automated market research and execution system. It observes markets and applies versioned rules,
            executes approved trades, reconciles broker activity, and tests whether the process has a reproducible edge.
          </p>
        </motion.div>

        <motion.div
          className="landing-destinations"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: .6, delay: .2 }}
        >
          {destinations.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .4, delay: .25 + index * .06 }}
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
          <div><small>ACTIVE VERSION</small><strong>{shortVersion(version)}</strong></div>
          <div><small>TELEMETRY</small><strong>{ageLabel(data?.freshness_seconds)} AGO</strong></div>
          <div><small>PUBLIC MODE</small><strong>SANITIZED</strong></div>
        </div>
      </section>
    </>
  );
}
