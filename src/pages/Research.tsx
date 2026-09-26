import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type ResearchTab = "state" | "process" | "edge" | "log" | "resources";

const tabs: [ResearchTab, string][] = [
  ["state", "State"],
  ["process", "Process"],
  ["edge", "Edge Discovery"],
  ["log", "Development"],
  ["resources", "Resources"]
];

const stateItems = [
  ["Production", "The live baseline remains separate from experimental strategy work."],
  ["Bottleneck", "Discover a reproducible entry edge; account size is not treated as the current bottleneck."],
  ["Research", "Edge Discovery v1 is testing independent families against a larger historical corpus."],
  ["Corpus integrity", "Coverage is checked by development window and symbol before research conclusions are trusted."],
  ["Data quality", "Reconciliation, tagging, MFE/MAE, pagination completeness, and replay parity are part of the quality gate."],
  ["Promotion", "No strategy or scaling change moves live because of one strong day or one attractive backtest."],
  ["Failure rule", "If the current families fail, reject them and design a genuinely new family."]
];

const researchProcess = [
  ["01", "Capture", "Collect market, scanner, execution, and broker records without rewriting the evidence after the fact."],
  ["02", "Audit", "Measure bars, trading days, first/last timestamps, pagination completion, missing sessions, and coverage ratio."],
  ["03", "Reconcile", "Match broker truth to the internal ledger and isolate malformed or ambiguous records."],
  ["04", "Enrich", "Add identity tags, context, and excursion measurements including MFE/MAE."],
  ["05", "Replay", "Run historical sessions through research logic and check that replay behavior matches the intended live rules."],
  ["06", "Discover", "Test independent strategy families instead of repeatedly optimizing one losing structure."],
  ["07", "Validate", "Use chronological development, validation, friction, and untouched holdout gates."],
  ["08", "Decide", "Promote a robust survivor or reject the family and preserve the rejection as evidence."]
];

const logs = [
  ["SEP 26", "CORPUS INTEGRITY", "Added a dedicated corpus diagnostic for every development window and symbol: bar count, trading days, first/last timestamp, pagination completion, missing sessions, and coverage ratio."],
  ["SEP 25", "EDGE DISCOVERY", "Expanded the historical corpus and moved the research program to family-level elimination."],
  ["SEP 25", "DATA QUALITY", "Reconciliation, identity validation, tagging, MFE/MAE, pagination completeness, and replay parity moved ahead of scaling."],
  ["SEP 25", "STRATEGY 004", "Candidate filters remained offline after failing to demonstrate robust positive expectancy."],
  ["SEP 25", "SCALING", "Additional simultaneous exposure remained locked behind reproducible edge evidence."],
  ["SEP 24", "PRODUCTION", "Live Alpaca execution, continuous scanning, telemetry, and the private Command surface were established."]
];

const resources = [
  ["Alpaca", "Broker + market data", "Live brokerage execution and the market-data source used by the production and historical research systems."],
  ["Railway", "RHEN runtime", "Runs the RHEN production trading service and isolated research jobs outside the public website."],
  ["Supabase", "Canonical data + telemetry", "Stores application and trading records and publishes the sanitized public telemetry feed through an Edge Function."],
  ["Cloudflare", "Web edge + access", "Serves anevum.com, runs the Worker API, applies security headers, and protects private operator surfaces."],
  ["GitHub", "Source + version history", "Holds the website and trading-system source, branches, commits, research changes, and historical implementation record."],
  ["GitHub Actions", "Verification + deployment", "Runs type checks, builds, route/privacy verification, and production deployment from main."],
  ["React / TypeScript", "Public application", "Powers the public interface and private operator application."],
  ["Vite / Wrangler", "Build + Cloudflare packaging", "Builds the frontend and packages the Cloudflare Worker/static asset deployment."],
  ["Motion", "Interface motion", "Handles restrained page, tab, and panel animation while keeping content usable without motion."],
  ["OpenAI / ChatGPT", "Research + engineering", "Used for offline analysis, engineering, documentation, and research workflows; it is not required in the deterministic live decision loop."]
];

export default function Research() {
  const [tab, setTab] = useState<ResearchTab>("state");

  return (
    <section className="compact-page workspace-screen research-workspace">
      <header className="workspace-heading">
        <div>
          <p className="compact-eyebrow">RESEARCH / DEVELOPMENT RECORD</p>
          <h1>Research</h1>
        </div>
        <div className="workspace-heading-status">
          <div><small>PROGRAM</small><strong>EDGE DISCOVERY V1</strong></div>
          <div><small>SCALING</small><strong>LOCKED</strong></div>
          <div><small>PRODUCTION</small><strong>ISOLATED</strong></div>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="workspace-tabs research-tabs" aria-label="Research sections">
          {tabs.map(([id, label], index) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong>
            </button>
          ))}
        </aside>

        <div className="workspace-content">
          <AnimatePresence mode="wait">
            {tab === "state" && (
              <motion.div className="workspace-view" key="state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="compact-title-block"><span>CURRENT STATE</span><h2>What is happening now.</h2></div>
                <div className="research-state-grid">
                  {stateItems.map(([title, body]) => <article key={title}><span>{title}</span><p>{body}</p></article>)}
                </div>
              </motion.div>
            )}

            {tab === "process" && (
              <motion.div className="workspace-view" key="process" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="compact-title-block">
                  <span>RESEARCH PROCESS</span>
                  <h2>Evidence moves through eight gates.</h2>
                  <p>Bad data is rejected before strategy conclusions are allowed to depend on it.</p>
                </div>
                <div className="research-process-grid">
                  {researchProcess.map(([number, title, body]) => (
                    <article key={number}>
                      <span>{number}</span>
                      <div><strong>{title}</strong><p>{body}</p></div>
                    </article>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "edge" && (
              <motion.div className="workspace-view" key="edge" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="compact-title-block"><span>EDGE DISCOVERY V1</span><h2>Five families. No forced winner.</h2><p>Each family survives only if the evidence forces us to keep it.</p></div>
                <div className="edge-compact-layout">
                  <article className="edge-primary-card"><span>PRIMARY QUESTION</span><strong>Does any entry family survive realistic chronological validation?</strong><p>If none survives, all five are rejected and the next strategy family is designed from new premises.</p></article>
                  <div className="edge-fact-grid">
                    <article><span>CORPUS</span><strong>JAN–JUL 2026</strong></article>
                    <article><span>UNIVERSE</span><strong>36 + 3</strong></article>
                    <article><span>DATA</span><strong>ALPACA IEX</strong></article>
                    <article><span>FAMILIES</span><strong>5</strong></article>
                    <article><span>FRICTION</span><strong>3 MODELS</strong></article>
                    <article><span>OUTPUT</span><strong>SURVIVE / REJECT</strong></article>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "log" && (
              <motion.div className="workspace-view" key="log" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="compact-title-block"><span>DEVELOPMENT LOG</span><h2>Recent material changes.</h2></div>
                <div className="log-compact-list">
                  {logs.map(([date, type, body]) => <article key={date + type}><time>{date}</time><span>{type}</span><p>{body}</p></article>)}
                </div>
              </motion.div>
            )}

            {tab === "resources" && (
              <motion.div className="workspace-view" key="resources" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="compact-title-block"><span>RESOURCE REGISTRY</span><h2>What the system currently uses.</h2></div>
                <div className="resource-compact-grid">
                  {resources.map(([name, role, body], index) => (
                    <article key={name}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <small>{role}</small>
                      <strong>{name}</strong>
                      <p>{body}</p>
                    </article>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
