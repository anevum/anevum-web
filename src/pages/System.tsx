import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import RhenMark, { RhenSectionLabel } from "../components/RhenMark";
import { useLiveTrading } from "../hooks/useLiveTrading";
import { productionServiceLog } from "../data/public-work-log";

type SystemTab = "chain" | "machine" | "evidence" | "guardrails";

const tabs: [SystemTab, string, string][] = [
  ["chain", "Evidence chain", "What becomes durable"],
  ["machine", "Architecture", "What actually runs"],
  ["evidence", "Meaning", "Trades and rejections"],
  ["guardrails", "Guardrails", "Live vs. analytics"]
];

const flowStages = [
  ["01", "Market observation", "Alpaca market data enters RHEN.", "Market data", "Scan cycle"],
  ["02", "Candidate evaluation", "Each scan records what was evaluated. Most candidates are expected to stop here.", "Scan cycle", "Candidate / rejection"],
  ["03", "Signal + intent", "Only a qualified candidate can produce a signal and then an order intent.", "Qualified candidate", "Signal / order intent"],
  ["04", "Broker lifecycle", "Authorized intents become broker orders and fills, with reconciliation against broker truth.", "Order intent", "Order / fill"],
  ["05", "Position + exit", "Fills become positions. Exits close the lifecycle and remain attributable to the strategy version.", "Fill", "Position / exit"],
  ["06", "Post-event outcome", "After the event, RHEN measures forward outcomes and can attempt live-vs-offline reconstruction.", "Recorded decision", "Analytics evidence"],
  ["07", "Daily report", "The canonical close report summarizes one captured session without rewriting the underlying ledger.", "Session evidence", "Daily report"],
  ["08", "Weekly decision", "Weekly reporting aggregates canonical daily reports, states completeness, opens questions, and records decisions.", "Daily reports", "Question / decision"]
] as const;

const machineNodes = [
  ["MARKET", "Alpaca", "https://www.google.com/s2/favicons?domain=alpaca.markets&sz=64", "Market and broker data. Broker state remains the external execution truth."],
  ["RHEN", "Railway", "https://www.google.com/s2/favicons?domain=railway.com&sz=64", "The production RHEN service scans, evaluates, executes, reconciles, and reports."],
  ["LEDGER", "Railway PostgreSQL", "https://www.google.com/s2/favicons?domain=postgresql.org&sz=64", "Canonical scan, candidate, signal, order, fill, position, outcome, report, and decision records."],
  ["WEB", "Cloudflare", "https://www.google.com/s2/favicons?domain=cloudflare.com&sz=64", "ANEVUM serves the public sanitized projection and the authenticated Command proxy."],
  ["SOURCE", "GitHub", "https://www.google.com/s2/favicons?domain=github.com&sz=64", "Source and deployment history tie runtime behavior to versioned code."],
  ["RESEARCH", "Offline research + reports", "https://www.google.com/s2/favicons?domain=python.org&sz=64", "Historical tests and canonical reports analyze evidence without changing live decisions."]
];

export default function System() {
  const [tab, setTab] = useState<SystemTab>("chain");
  const { data, loading } = useLiveTrading(5000);
  const state = loading ? "CONNECTING" : data?.state || (data?.live ? "RUNNING" : "STALE");
  const stateClass = data?.live ? "is-live" : data ? "is-stale" : "";
  const researchStatus = data?.research?.current_status || "UNRECORDED";

  return (
    <section className="compact-page workspace-screen story-workspace system-story">
      <header className="workspace-heading story-heading">
        <div>
          <RhenSectionLabel context="SYSTEM" />
          <h1>How evidence moves</h1>
          <p className="story-heading-copy">
            RHEN separates observation, live decisions, broker truth, post-event analytics, and research conclusions so one layer cannot quietly rewrite another.
          </p>
        </div>
        <div className="workspace-heading-status story-status">
          <span className={"runtime-state " + stateClass}><i />{state}</span>
          <div><small>LIVE STRATEGY</small><strong>{data?.active_strategy?.version_id || "UNRECORDED"}</strong></div>
          <div><small>NEXT RESEARCH</small><strong>{String(researchStatus).replaceAll("_", " ").toUpperCase()}</strong></div>
        </div>
      </header>

      <div className="workspace-layout story-layout">
        <aside className="workspace-tabs story-tabs" aria-label="System sections">
          {tabs.map(([id, label, hint], index) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{label}</strong><small>{hint}</small></div>
            </button>
          ))}
        </aside>

        <div className="workspace-content story-content">
          <AnimatePresence mode="wait" initial={false}>
            {tab === "chain" && (
              <motion.div className="workspace-view story-view" key="chain" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">CANONICAL EVIDENCE CHAIN</span><h2>Every stage has a different meaning.</h2></div>
                  <p>Not every candidate travels through every stage. A rejection is a recorded decision, not a missing trade.</p>
                </div>
                <div className="flow-track rhen-flow-track">
                  <div className="flow-beam" aria-hidden="true"><i /></div>
                  {flowStages.map(([n, title, plain, input, output]) => (
                    <article key={n} className="flow-stage">
                      <span className="flow-number">{n}</span>
                      <div className="flow-copy"><strong>{title}</strong><p>{plain}</p></div>
                      <div className="flow-io"><small>IN</small><b>{input}</b><i>→</i><small>OUT</small><b>{output}</b></div>
                    </article>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "machine" && (
              <motion.div className="workspace-view story-view" key="machine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">PRODUCTION ARCHITECTURE</span><h2>The website is a window, not the trading engine.</h2></div>
                  <p>Private Command requests stay behind authentication; public pages consume only a sanitized projection.</p>
                </div>
                <div className="machine-map">
                  <div className="machine-orbit" aria-hidden="true" />
                  {machineNodes.map(([label, tool, icon, body], index) => (
                    <article key={label} className={"machine-node node-" + (index + 1)}>
                      <div className="brand-line"><img src={icon} alt="" aria-hidden="true" referrerPolicy="no-referrer" /><span>{label}</span></div>
                      <strong>{tool}</strong><p>{body}</p>
                    </article>
                  ))}
                  <div className="machine-core"><RhenMark decorative /><span className="rhen-core-word">RHEN</span><strong>CANONICAL SYSTEM</strong><i /></div>
                </div>
                <div className="story-title-row">
                  <div><span className="story-kicker">PRODUCTION SERVICES / SEPTEMBER 28</span><h2>The actual services are visible too.</h2></div>
                  <p>Service names and public-safe roles are shown here; credentials, private URLs, account data, and execution-sensitive configuration remain private.</p>
                </div>
                <div className="evidence-summary-grid">
                  {productionServiceLog.map(([name, platform, status, body]) => (
                    <article key={name}><span>{platform}</span><strong>{name} · {status}</strong><p>{body}</p></article>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "evidence" && (
              <motion.div className="workspace-view story-view" key="evidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">WHAT COUNTS AS EVIDENCE</span><h2>No trade is required for an observation to matter.</h2></div>
                  <p>RHEN preserves both actions and non-actions so later analysis can distinguish selection quality from execution quality.</p>
                </div>
                <div className="rhen-state-grid">
                  <article><span>CANDIDATE</span><strong>Observed</strong><p>A market observation reached candidate evaluation. It may still be rejected.</p></article>
                  <article><span>REJECTION</span><strong>Valid evidence</strong><p>A rejected candidate records why no live action followed. Rejection is not a telemetry gap.</p></article>
                  <article><span>FORWARD OUTCOME</span><strong>Analytics only</strong><p>After enough future data exists, RHEN measures what happened after a candidate. It does not retroactively create a trade.</p></article>
                  <article><span>REPLAY / COMPARISON</span><strong>Analytics only</strong><p>Live-vs-offline reconstruction checks consistency when decision-time inputs exist. It cannot modify the original live decision.</p></article>
                  <article><span>DAILY REPORT</span><strong>Canonical session view</strong><p>The close report summarizes captured evidence and states warnings instead of filling gaps with guesses.</p></article>
                  <article><span>WEEKLY REPORT</span><strong>Cross-session view</strong><p>Weekly evidence is explicitly COMPLETE, PARTIAL, or INCOMPLETE based on canonical daily coverage.</p></article>
                </div>
              </motion.div>
            )}

            {tab === "guardrails" && (
              <motion.div className="workspace-view story-view" key="guardrails" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">LIVE / RESEARCH SEPARATION</span><h2>Post-event knowledge cannot leak backward into live decisions.</h2></div>
                  <p>Forward outcomes, replay, daily reports, and weekly reports are read-only analytics layers.</p>
                </div>
                <div className="guardrail-map">
                  <section className="guardrail-lane live-lane">
                    <header><span>LIVE</span><strong>Production decisions</strong></header>
                    <p>The active version receives current market and account state, then follows the already-authorized rules.</p>
                    <div className="guardrail-chain"><b>OBSERVE</b><i>→</i><b>EVALUATE</b><i>→</i><b>RISK</b><i>→</i><b>EXECUTE</b><i>→</i><b>RECORD</b></div>
                  </section>
                  <div className="guardrail-gate"><span>ONE-WAY EVIDENCE</span><strong>Future data stays future data.</strong><p>Analytics may inform a later research decision; it cannot rewrite the live event that already happened.</p></div>
                  <section className="guardrail-lane lab-lane">
                    <header><span>ANALYTICS</span><strong>Evidence after the fact</strong></header>
                    <p>Outcomes, reconstruction, reports, and research decisions consume durable records without sending trading instructions.</p>
                    <div className="guardrail-chain"><b>OUTCOME</b><i>→</i><b>REPLAY</b><i>→</i><b>REPORT</b><i>→</i><b>QUESTION</b><i>→</i><b>DECIDE</b></div>
                  </section>
                </div>
                <div className="public-private-strip">
                  <div><span>PUBLIC</span><p>Sanitized runtime state, strategy identity, aggregate activity, normalized performance, research state, evidence availability, and system history.</p></div>
                  <div><span>PRIVATE / COMMAND</span><p>Raw account values, positions, orders, fills, symbols, individual trade detail, detailed reports, execution-sensitive parameters, and incidents.</p></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
