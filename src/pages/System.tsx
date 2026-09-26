import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useLiveTrading } from "../hooks/useLiveTrading";

type SystemTab = "overview" | "pipeline" | "architecture" | "boundary";

const tabs: [SystemTab, string][] = [
  ["overview", "Overview"],
  ["pipeline", "Pipeline"],
  ["architecture", "Architecture"],
  ["boundary", "Boundary"]
];

const pipeline = [
  ["01", "Observe", "Sample the configured market universe and normalize incoming market data."],
  ["02", "Evaluate", "Apply the active strategy version and reject candidates that do not meet its rules."],
  ["03", "Risk gate", "Check capital, exposure, timing, execution state, and safety constraints."],
  ["04", "Execute", "Submit approved orders through the broker interface and track the lifecycle."],
  ["05", "Reconcile", "Compare broker truth with the internal ledger and isolate mismatches."],
  ["06", "Analyze", "Tag outcomes, calculate excursions, replay sessions, and decide what changes next."]
];

const architecture = [
  ["Interface", "React + TypeScript", "Public live, system, and research surfaces."],
  ["Edge", "Cloudflare", "Site delivery, Worker API, security headers, and private route protection."],
  ["Data", "Supabase", "Canonical application/trading records and sanitized public telemetry."],
  ["Runtime", "Railway", "RHEN production service and protected operational endpoints."],
  ["Broker", "Alpaca", "Broker execution and market data used by live and historical systems."],
  ["Verification", "GitHub Actions", "Type checks, builds, deployment, and source/version history."]
];

export default function System() {
  const [tab, setTab] = useState<SystemTab>("overview");
  const { data, loading } = useLiveTrading(5000);
  const state = loading ? "CONNECTING" : data?.state || (data?.live ? "RUNNING" : "STALE");
  const stateClass = data?.live ? "is-live" : data ? "is-stale" : "";

  return (
    <section className="compact-page workspace-screen">
      <header className="workspace-heading">
        <div>
          <p className="compact-eyebrow">SYSTEM / HOW IT WORKS</p>
          <h1>System</h1>
        </div>
        <div className="workspace-heading-status">
          <span className={"runtime-state " + stateClass}><i />{state}</span>
          <div><small>LIVE PATH</small><strong>DETERMINISTIC</strong></div>
          <div><small>RESEARCH</small><strong>ISOLATED</strong></div>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="workspace-tabs" aria-label="System sections">
          {tabs.map(([id, label], index) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <span>0{index + 1}</span><strong>{label}</strong>
            </button>
          ))}
        </aside>

        <div className="workspace-content">
          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <motion.div className="workspace-view overview-view" key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="compact-title-block">
                  <span>WHAT RHEN IS</span>
                  <h2>A measurable automated trading research system.</h2>
                  <p>
                    It observes markets, evaluates candidates, applies risk gates, executes approved orders,
                    reconciles broker activity, and stores enough evidence to determine whether the process deserves to survive.
                  </p>
                </div>
                <div className="compact-info-grid">
                  <article><span>OBJECTIVE</span><strong>Reproducible positive expectancy</strong><p>Find an edge that remains useful outside the sample that produced it.</p></article>
                  <article><span>PRODUCTION</span><strong>Rule-based execution</strong><p>Live decisions do not require an AI-model call for every market event.</p></article>
                  <article><span>RESEARCH</span><strong>Offline validation</strong><p>New strategy ideas remain separate until they survive promotion gates.</p></article>
                  <article><span>SCALING</span><strong>Evidence first</strong><p>Additional capital and simultaneous exposure remain downstream of edge validation.</p></article>
                </div>
              </motion.div>
            )}

            {tab === "pipeline" && (
              <motion.div className="workspace-view" key="pipeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="compact-title-block"><span>OPERATING PIPELINE</span><h2>Six stages. One evidence loop.</h2></div>
                <div className="pipeline-compact-grid">
                  {pipeline.map(([number, title, body]) => (
                    <article key={number}><span>{number}</span><div><strong>{title}</strong><p>{body}</p></div></article>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "architecture" && (
              <motion.div className="workspace-view" key="architecture" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="compact-title-block"><span>ARCHITECTURE</span><h2>The current production stack.</h2></div>
                <div className="architecture-compact-grid">
                  {architecture.map(([layer, tool, body], index) => (
                    <article key={layer}><span>0{index + 1}</span><div><small>{layer}</small><strong>{tool}</strong><p>{body}</p></div></article>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "boundary" && (
              <motion.div className="workspace-view boundary-view" key="boundary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="compact-title-block"><span>PUBLIC / PRIVATE BOUNDARY</span><h2>The site explains the system without exposing the strategy.</h2></div>
                <div className="boundary-columns">
                  <article><span>PUBLIC</span><ul><li>Runtime state</li><li>Telemetry freshness</li><li>Aggregate event activity</li><li>Architecture and methodology</li><li>Research and release notes</li></ul></article>
                  <article><span>PRIVATE</span><ul><li>Account values and buying power</li><li>Open positions and orders</li><li>Symbols, prices, and individual trades</li><li>Exact entry / exit thresholds</li><li>Risk parameters and credentials</li></ul></article>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
