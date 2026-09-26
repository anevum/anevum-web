import { motion } from "motion/react";
import Mark from "../components/Mark";

const researchPipeline = [
  ["Capture", "Collect broker, scanner, execution, and market-data records without rewriting the evidence after the fact."],
  ["Reconcile", "Match the internal ledger against broker truth and isolate malformed or ambiguous records."],
  ["Enrich", "Add tags, context, and excursion measurements such as MFE/MAE to completed observations."],
  ["Replay", "Run strategy logic against historical data and check parity between research behavior and live behavior."],
  ["Discover", "Test independent strategy families instead of repeatedly tuning one losing idea."],
  ["Validate", "Use chronological development, validation, realistic friction, and untouched holdouts."],
  ["Decide", "Promote only a robust survivor. Reject failed candidates and preserve the rejection as evidence."]
];

const resources = [
  ["Alpaca", "Broker + market data", "Live brokerage execution and Alpaca IEX minute data for the historical research corpus."],
  ["Railway", "Trader runtime", "Hosts the production trading service and the protected runtime endpoints used by Command."],
  ["Supabase", "Canonical data layer", "Stores application state, trading records, telemetry, and the sanitized public-feed Edge Function."],
  ["Cloudflare", "Web edge + access", "Hosts the public site and Worker API, serves anevum.com, and protects private surfaces."],
  ["GitHub", "Source control", "Holds website and trading-system source, branches, pull requests, research changes, and version history."],
  ["GitHub Actions", "CI/CD", "Runs type checks, builds, privacy probes, browser captures, and production deployment workflows."],
  ["React + TypeScript", "Public application", "Powers the current public interface and private operator surfaces."],
  ["Vite + Wrangler", "Build + deployment", "Builds the frontend and packages the Cloudflare Worker and static assets."],
  ["Motion", "Interface motion", "Provides controlled entrance and scroll animation without making the content depend on motion."],
  ["OpenAI / ChatGPT", "Research + engineering assistance", "Used for offline analysis, engineering, documentation, and research workflows. It is not required inside the deterministic live decision loop."]
];

const logs = [
  {
    date: "SEP 25 2026",
    type: "EDGE DISCOVERY",
    title: "Edge Discovery v1 became the primary research program",
    body: "The historical corpus was expanded so five independent entry families could be tested under the same elimination framework. The purpose is to discover whether any family survives robustly rather than continuing to optimize a losing one."
  },
  {
    date: "SEP 25 2026",
    type: "DATA QUALITY",
    title: "Reconciliation, tagging, MFE/MAE, and replay moved ahead of scaling",
    body: "Live results showed that strategy conclusions are only as trustworthy as the underlying record. Broker reconciliation, trade identity, tagging, excursion measurement, and replay/live parity became prerequisites for strategy decisions."
  },
  {
    date: "SEP 25 2026",
    type: "STRATEGY 004",
    title: "Strategy 004 stayed offline",
    body: "The post-close work focused on distinguishing the structures behind winners from the larger losing set. New entry filters remained research-only until they could demonstrate positive expectancy outside the same-day sample."
  },
  {
    date: "SEP 25 2026",
    type: "SCALING",
    title: "Capital scaling remained locked",
    body: "The immediate bottleneck is reproducible entry edge, not permission to place more trades. Additional simultaneous exposure remains downstream of evidence that the entry process itself has positive expectancy."
  },
  {
    date: "SEP 25 2026",
    type: "PUBLIC SYSTEM",
    title: "Public observability was separated from private trading data",
    body: "The website was rebuilt around sanitized runtime telemetry. Public status can show that the system is operating without exposing account values, positions, symbols, trade history, or reproducible strategy parameters."
  },
  {
    date: "SEP 24 2026",
    type: "PRODUCTION",
    title: "Live automated operation established",
    body: "The system moved through paper and scan-only stages into live Alpaca execution with continuous scanning, persistent telemetry, a canonical record, and a separate private Command surface."
  }
];

const current = [
  ["Production", "The live baseline remains separate from experimental strategy work."],
  ["Primary bottleneck", "Discover a reproducible entry edge. Account size is not treated as the current bottleneck."],
  ["Research program", "Edge Discovery v1 is testing five independent families against a much larger historical corpus."],
  ["Data program", "Reconciliation, identity validation, tagging, MFE/MAE, and replay parity are part of the quality gate."],
  ["Promotion rule", "No strategy or scaling change moves live because of one strong day or one attractive backtest."],
  ["Failure rule", "If all five families fail, reject them and design a genuinely new strategy family."]
];

export default function Research() {
  return (
    <div className="docs-page research-page">
      <motion.section
        className="docs-hero research-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .65, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="docs-hero-mark"><Mark /></div>
        <div>
          <p className="docs-eyebrow">RESEARCH / DEVELOPMENT RECORD</p>
          <h1>What is being tested, changed, and rejected.</h1>
          <p className="docs-lead">
            This is the public research record for ANEVUM. It documents the development process,
            infrastructure, current bottlenecks, rejected directions, and promotion gates without
            publishing private trading parameters or account data.
          </p>
        </div>
        <div className="research-state">
          <span>CURRENT RESEARCH STATE</span>
          <strong>EDGE DISCOVERY</strong>
          <p>Scaling locked. Production isolated. Historical testing expanding.</p>
        </div>
      </motion.section>

      <section className="docs-section">
        <div className="docs-section-label"><span>01</span><strong>CURRENT STATE</strong></div>
        <div className="state-grid">
          {current.map(([label, body], index) => (
            <motion.article
              className="state-card"
              key={label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: .35 }}
              transition={{ duration: .4, delay: index * .04 }}
            >
              <span>{label}</span>
              <p>{body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="docs-section">
        <div className="docs-section-label"><span>02</span><strong>RESEARCH PIPELINE</strong></div>
        <div className="research-pipeline">
          {researchPipeline.map(([title, body], index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, x: index % 2 ? 14 : -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: .4 }}
              transition={{ duration: .42, delay: index * .035 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="docs-section edge-program">
        <div className="docs-section-label"><span>03</span><strong>EDGE DISCOVERY V1</strong></div>
        <div className="edge-layout">
          <div className="edge-summary glass-card">
            <span>PRIMARY QUESTION</span>
            <h2>Does any tested entry family survive realistic chronological validation?</h2>
            <p>
              The system is no longer trying to make one existing strategy look better through repeated tuning.
              Independent strategy families are compared under the same research discipline. A family either
              survives the gates or it is rejected.
            </p>
          </div>
          <div className="edge-facts">
            <article><span>DEVELOPMENT CORPUS</span><strong>JAN–JUL 2026</strong><p>Historical development data is frozen before later holdout periods are examined.</p></article>
            <article><span>RESEARCH UNIVERSE</span><strong>36 + 3</strong><p>Thirty-six research symbols plus broad reference context.</p></article>
            <article><span>DATA SOURCE</span><strong>ALPACA IEX</strong><p>Paginated minute data builds a substantially larger historical sample.</p></article>
            <article><span>FAMILIES</span><strong>5</strong><p>Independent entry families are evaluated under the same promotion framework.</p></article>
            <article><span>COST MODELS</span><strong>3</strong><p>Multiple friction assumptions are used instead of assuming ideal execution.</p></article>
            <article><span>OUTCOME</span><strong>SURVIVE / REJECT</strong><p>There is no forced winner. A complete rejection is useful evidence.</p></article>
          </div>
        </div>
      </section>

      <section className="docs-section">
        <div className="docs-section-label"><span>04</span><strong>DEVELOPMENT LOG</strong></div>
        <div className="research-log">
          {logs.map((item, index) => (
            <motion.article
              key={item.date + item.type}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: .25 }}
              transition={{ duration: .42, delay: index * .03 }}
            >
              <div className="log-meta"><time>{item.date}</time><span>{item.type}</span></div>
              <div><h3>{item.title}</h3><p>{item.body}</p></div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="docs-section">
        <div className="docs-section-label"><span>05</span><strong>RESOURCE REGISTRY</strong></div>
        <div className="resource-grid">
          {resources.map(([name, role, body], index) => (
            <motion.article
              className="resource-card"
              key={name}
              initial={{ opacity: 0, scale: .98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: .3 }}
              transition={{ duration: .38, delay: index * .025 }}
            >
              <span>{role}</span>
              <h3>{name}</h3>
              <p>{body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="docs-section docs-split">
        <div>
          <div className="docs-section-label"><span>06</span><strong>PROMOTION</strong></div>
          <div className="docs-prose">
            <p>
              Research code does not become production code because it improves one sample. Promotion requires
              reproducible configuration, complete data, replay/live parity, chronological validation, holdout
              survival, realistic costs, and a result that remains useful outside the period that produced the idea.
            </p>
          </div>
        </div>
        <div>
          <div className="docs-section-label"><span>07</span><strong>REJECTION</strong></div>
          <div className="docs-prose">
            <p>
              Rejection is an expected output. Failed candidates remain in the record so the system does not keep
              rediscovering the same losing structure. If every current family fails, the next step is a new family,
              not a more aggressive optimization of the rejected set.
            </p>
          </div>
        </div>
      </section>

      <footer className="docs-footer">
        <span>ANEVUM / RESEARCH RECORD</span>
        <a href="/system">← System documentation</a>
      </footer>
    </div>
  );
}
