import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useLiveTrading } from "../hooks/useLiveTrading";

type SystemTab = "idea" | "flow" | "machine" | "guardrails";

const tabs: [SystemTab, string, string][] = [
  ["idea", "The idea", "What this is"],
  ["flow", "The loop", "How a trade moves"],
  ["machine", "The machine", "What actually runs"],
  ["guardrails", "Guardrails", "Live vs. research"]
];

const flowStages = [
  {
    n: "01",
    title: "Watch",
    plain: "The system continuously looks through its configured market universe.",
    input: "Market data",
    output: "Candidates"
  },
  {
    n: "02",
    title: "Question",
    plain: "Each candidate has to match the current strategy rules. Most are supposed to fail here.",
    input: "Candidates",
    output: "Qualified setups"
  },
  {
    n: "03",
    title: "Risk check",
    plain: "Before money moves, the system checks capital, exposure, timing, order state, and safety limits.",
    input: "Qualified setups",
    output: "Approved actions"
  },
  {
    n: "04",
    title: "Act",
    plain: "Approved orders are sent to Alpaca, then tracked from submission through fill or cancellation.",
    input: "Approved actions",
    output: "Broker events"
  },
  {
    n: "05",
    title: "Tell the truth",
    plain: "Broker records are reconciled against the internal ledger so the website never learns from a fictional trade history.",
    input: "Broker events",
    output: "Clean record"
  },
  {
    n: "06",
    title: "Learn",
    plain: "Outcomes are tagged, measured, replayed, and compared. Research can propose a change; production does not improvise one.",
    input: "Clean record",
    output: "Evidence"
  }
];

const machineNodes = [
  ["MARKET", "Alpaca data", "https://www.google.com/s2/favicons?domain=alpaca.markets&sz=64", "Prices, bars, quotes, and broker truth enter here."],
  ["RHEN", "Railway", "https://www.google.com/s2/favicons?domain=railway.com&sz=64", "The always-on service scans, evaluates, risk-checks, and executes."],
  ["RECORD", "Supabase", "https://www.google.com/s2/favicons?domain=supabase.com&sz=64", "Canonical records and sanitized public telemetry live here."],
  ["PUBLIC", "Cloudflare + React", "https://www.google.com/s2/favicons?domain=cloudflare.com&sz=64", "anevum.com shows what the system is doing without exposing private account details."],
  ["SOURCE", "GitHub", "https://www.google.com/s2/favicons?domain=github.com&sz=64", "Every meaningful code change is versioned so the machine has a history."],
  ["RESEARCH", "OpenAI / ChatGPT", "https://www.google.com/s2/favicons?domain=openai.com&sz=64", "Ideas are tested away from live execution before they can be promoted."]
];

export default function System() {
  const [tab, setTab] = useState<SystemTab>("idea");
  const { data, loading } = useLiveTrading(5000);
  const state = loading ? "CONNECTING" : data?.state || (data?.live ? "RUNNING" : "STALE");
  const stateClass = data?.live ? "is-live" : data ? "is-stale" : "";

  return (
    <section className="compact-page workspace-screen story-workspace system-story">
      <header className="workspace-heading story-heading">
        <div>
          <p className="compact-eyebrow">RHEN / SYSTEM</p>
          <h1>How it works</h1>
          <p className="story-heading-copy">
            RHEN is the automated trading system inside ANEVUM: built to measure itself, expose its mistakes, and earn the right to scale.
          </p>
        </div>
        <div className="workspace-heading-status story-status">
          <span className={"runtime-state " + stateClass}><i />{state}</span>
          <div><small>LIVE LOOP</small><strong>RULE-BASED</strong></div>
          <div><small>LEARNING</small><strong>OFFLINE</strong></div>
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
          <AnimatePresence mode="wait">
            {tab === "idea" && (
              <motion.div
                className="workspace-view story-view"
                key="idea"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="system-idea-grid">
                  <section className="story-hero-card">
                    <span className="story-kicker">THE QUESTION</span>
                    <h2>Can a tiny account become a better machine instead of just making bigger bets?</h2>
                    <p>
                      ANEVUM started as a personal attempt to automate capital growth. The important part is not whether a bot can place trades.
                      That is easy. The hard part is building a process that can prove when it has an edge, admit when it does not, and improve
                      without rewriting the evidence to make itself look successful.
                    </p>
                    <div className="idea-sequence" aria-label="Core system loop">
                      {["Observe", "Decide", "Act", "Measure", "Learn"].map((item, index) => (
                        <div key={item}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <strong>{item}</strong>
                          {index < 4 && <i aria-hidden="true">→</i>}
                        </div>
                      ))}
                    </div>
                  </section>

                  <aside className="idea-principles">
                    <article>
                      <span>01</span>
                      <div><strong>Evidence beats confidence.</strong><p>A good story about a trade is not the same thing as a repeatable statistical advantage.</p></div>
                    </article>
                    <article>
                      <span>02</span>
                      <div><strong>Production is boring on purpose.</strong><p>RHEN follows explicit rules. New ideas are not allowed to mutate the running system mid-session.</p></div>
                    </article>
                    <article>
                      <span>03</span>
                      <div><strong>Scaling comes last.</strong><p>More capital and more simultaneous exposure only matter after the entry logic survives realistic testing.</p></div>
                    </article>
                  </aside>
                </div>
              </motion.div>
            )}

            {tab === "flow" && (
              <motion.div
                className="workspace-view story-view"
                key="flow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="story-title-row">
                  <div>
                    <span className="story-kicker">ONE TRADE, END TO END</span>
                    <h2>Nothing jumps straight from a chart to a buy button.</h2>
                  </div>
                  <p>Every stage narrows the set of possible actions and leaves evidence behind.</p>
                </div>

                <div className="flow-track">
                  <div className="flow-beam" aria-hidden="true"><i /></div>
                  {flowStages.map((stage) => (
                    <article key={stage.n} className="flow-stage">
                      <span className="flow-number">{stage.n}</span>
                      <div className="flow-copy">
                        <strong>{stage.title}</strong>
                        <p>{stage.plain}</p>
                      </div>
                      <div className="flow-io">
                        <small>IN</small><b>{stage.input}</b>
                        <i>→</i>
                        <small>OUT</small><b>{stage.output}</b>
                      </div>
                    </article>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "machine" && (
              <motion.div
                className="workspace-view story-view"
                key="machine"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="story-title-row">
                  <div>
                    <span className="story-kicker">THE ACTUAL MACHINE</span>
                    <h2>Six pieces, each with one job.</h2>
                  </div>
                  <p>The website is only the window. RHEN, the broker, the record, research, and source history are separate parts.</p>
                </div>

                <div className="machine-map">
                  <div className="machine-orbit" aria-hidden="true" />
                  {machineNodes.map(([label, tool, icon, body], index) => (
                    <article key={label} className={"machine-node node-" + (index + 1)}>
                      <div className="brand-line">
                        <img src={icon} alt="" aria-hidden="true" referrerPolicy="no-referrer" />
                        <span>{label}</span>
                      </div>
                      <strong>{tool}</strong>
                      <p>{body}</p>
                    </article>
                  ))}
                  <div className="machine-core">
                    <span>RHEN</span>
                    <strong>LIVE TRADING SYSTEM</strong>
                    <i />
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "guardrails" && (
              <motion.div
                className="workspace-view story-view"
                key="guardrails"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="story-title-row">
                  <div>
                    <span className="story-kicker">WHY IT DOES NOT SELF-EDIT LIVE</span>
                    <h2>RHEN and the laboratory are deliberately separated.</h2>
                  </div>
                  <p>Learning is useful only when it cannot quietly change the rules that produced the evidence.</p>
                </div>

                <div className="guardrail-map">
                  <section className="guardrail-lane live-lane">
                    <header><span>LIVE</span><strong>Production loop</strong></header>
                    <p>Deterministic rules run against real market data and real capital. The job is consistency, not creativity.</p>
                    <div className="guardrail-chain">
                      <b>SCAN</b><i>→</i><b>FILTER</b><i>→</i><b>RISK</b><i>→</i><b>EXECUTE</b><i>→</i><b>RECORD</b>
                    </div>
                  </section>

                  <div className="guardrail-gate">
                    <span>PROMOTION GATE</span>
                    <strong>Evidence must cross this line.</strong>
                    <p>No single good day, attractive chart, or clever idea is enough.</p>
                  </div>

                  <section className="guardrail-lane lab-lane">
                    <header><span>LAB</span><strong>Research loop</strong></header>
                    <p>Historical data is audited, replayed, stressed, and split into development, validation, and untouched holdout periods.</p>
                    <div className="guardrail-chain">
                      <b>AUDIT</b><i>→</i><b>TEST</b><i>→</i><b>BREAK</b><i>→</i><b>RETEST</b><i>→</i><b>DECIDE</b>
                    </div>
                  </section>
                </div>

                <div className="public-private-strip">
                  <div><span>PUBLIC WINDOW</span><p>Runtime state, sanitized activity, method, architecture, research direction, and development history.</p></div>
                  <div><span>PRIVATE OPERATOR DATA</span><p>Account values, exact symbols, orders, thresholds, risk parameters, credentials, and strategy-sensitive details.</p></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
