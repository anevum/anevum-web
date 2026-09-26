import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type ResearchTab = "state" | "edge" | "log" | "resources";

const tabs: [ResearchTab, string][] = [
  ["state", "State"],
  ["edge", "Edge Discovery"],
  ["log", "Development"],
  ["resources", "Resources"]
];

const stateItems = [
  ["Production", "Live baseline remains separate from experimental strategy work."],
  ["Bottleneck", "Discover a reproducible entry edge; account size is not treated as the current bottleneck."],
  ["Research", "Edge Discovery v1 is testing independent families against a larger historical corpus."],
  ["Data quality", "Reconciliation, tagging, MFE/MAE, and replay parity are part of the quality gate."],
  ["Promotion", "No strategy or scaling change moves live because of one strong day or one attractive backtest."],
  ["Failure rule", "If the current families fail, reject them and design a genuinely new family."]
];

const logs = [
  ["SEP 25", "EDGE DISCOVERY", "Expanded the historical corpus and moved the research program to family-level elimination."],
  ["SEP 25", "DATA QUALITY", "Reconciliation, identity validation, tagging, MFE/MAE, and replay parity moved ahead of scaling."],
  ["SEP 25", "STRATEGY 004", "Candidate filters remained offline after failing to demonstrate robust positive expectancy."],
  ["SEP 25", "SCALING", "Additional simultaneous exposure remained locked behind reproducible edge evidence."],
  ["SEP 24", "PRODUCTION", "Live Alpaca execution, continuous scanning, telemetry, and the private Command surface were established."]
];

const resources = [
  ["Alpaca", "Broker + market data"],
  ["Railway", "Trader runtime"],
  ["Supabase", "Canonical data + telemetry"],
  ["Cloudflare", "Web edge + access"],
  ["GitHub", "Source + version history"],
  ["GitHub Actions", "Verification + deployment"],
  ["React / TypeScript", "Public application"],
  ["Vite / Wrangler", "Build + Cloudflare packaging"],
  ["Motion", "Interface motion"],
  ["OpenAI / ChatGPT", "Offline research + engineering"]
];

export default function Research() {
  const [tab, setTab] = useState<ResearchTab>("state");

  return (
    <section className="compact-page workspace-screen">
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
        <aside className="workspace-tabs" aria-label="Research sections">
          {tabs.map(([id, label], index) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <span>0{index + 1}</span><strong>{label}</strong>
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
                  {logs.map(([date, type, body]) => <article key={type}><time>{date}</time><span>{type}</span><p>{body}</p></article>)}
                </div>
              </motion.div>
            )}

            {tab === "resources" && (
              <motion.div className="workspace-view" key="resources" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="compact-title-block"><span>RESOURCE REGISTRY</span><h2>What the system currently uses.</h2></div>
                <div className="resource-compact-grid">
                  {resources.map(([name, role], index) => <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{name}</strong><p>{role}</p></article>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
