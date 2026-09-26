import { motion } from "motion/react";
import Mark from "../components/Mark";
import { useLiveTrading } from "../hooks/useLiveTrading";

function ageLabel(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "awaiting telemetry";
  if (value < 60) return Math.max(0, Math.round(value)) + "s ago";
  return Math.floor(value / 60) + "m ago";
}

function shortVersion(value?: string | null) {
  if (!value) return "UNVERSIONED";
  return String(value).replace(/^strategy[-_ ]?/i, "").toUpperCase();
}

const pipeline = [
  ["01", "Observe", "Sample the configured market universe and normalize incoming market data into a consistent internal form."],
  ["02", "Evaluate", "Apply the active strategy version. Candidate structures that do not meet its rules are rejected."],
  ["03", "Risk gate", "Check capital, exposure, timing, execution state, and other safety constraints before an order can exist."],
  ["04", "Execute", "Submit approved orders through the broker interface and track the complete order lifecycle."],
  ["05", "Reconcile", "Compare broker records with the internal ledger so the research record reflects what actually happened."],
  ["06", "Analyze", "Tag completed observations, measure excursions, replay historical sessions, and decide what should change next."]
];

const operating = [
  ["Market session", "The trader scans continuously, evaluates candidates, applies risk gates, executes only approved orders, and records telemetry."],
  ["Execution record", "Order and position state are persisted so later analysis can distinguish intended behavior from broker reality."],
  ["Post-close", "Reconciliation, tagging, MFE/MAE analysis, replay, and session review are performed on the completed dataset."],
  ["Research branch", "New strategy ideas are tested offline against historical data. Production remains unchanged while those candidates are evaluated."],
  ["Promotion", "A candidate must survive reproducible configuration, chronological validation, realistic friction, holdouts, and replay parity before it can replace production."],
  ["Scaling", "Additional capital and simultaneous exposure remain downstream of edge validation rather than being used to hide weak expectancy."]
];

const layers = [
  ["Public interface", "React + TypeScript", "anevum.com exposes a limited observability surface: runtime state, version identity, aggregate event activity, architecture, and public development records."],
  ["Edge and access", "Cloudflare", "Serves the website and Worker API, applies security headers, proxies public telemetry, and protects the private Command surface."],
  ["Canonical data", "Supabase", "Stores application and trading records. A dedicated Edge Function emits the sanitized public trading feed."],
  ["Trader runtime", "Railway", "Runs the production trading service separately from the public website and exposes protected operational endpoints."],
  ["Broker and market data", "Alpaca", "Provides brokerage execution and the market-data source used by the live trader and historical research corpus."],
  ["Source and verification", "GitHub + Actions", "Tracks source and research changes, runs type checks and production builds, performs privacy probes and browser captures, and deploys main."]
];

export default function System() {
  const { data, loading } = useLiveTrading(5000);
  const version = data?.active_strategy?.version_id || data?.active_strategy?.strategy_name;
  const state = loading ? "CONNECTING" : data?.state || (data?.live ? "RUNNING" : "STALE");
  const stateClass = data?.live ? "is-live" : data ? "is-stale" : "";

  return (
    <div className="docs-page">
      <motion.section
        className="docs-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .65, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="docs-hero-mark"><Mark /></div>
        <div>
          <p className="docs-eyebrow">SYSTEM / CURRENT ARCHITECTURE</p>
          <h1>How ANEVUM works.</h1>
          <p className="docs-lead">
            ANEVUM is a personal research system for automated market observation, rule evaluation,
            risk gating, broker execution, reconciliation, and post-trade analysis. The live path is
            deterministic: production decisions do not depend on an AI-model call for every market event.
          </p>
        </div>
        <div className="docs-live-card">
          <span className={"runtime-state " + stateClass}><i />{state}</span>
          <div><small>ACTIVE VERSION</small><strong>{shortVersion(version)}</strong></div>
          <div><small>TELEMETRY</small><strong>{ageLabel(data?.freshness_seconds)}</strong></div>
        </div>
      </motion.section>

      <section className="docs-section">
        <div className="docs-section-label"><span>01</span><strong>PURPOSE</strong></div>
        <div className="docs-prose docs-prose-large">
          <p>
            The system is built to test whether a small account can be operated by a disciplined,
            measurable process that improves from evidence instead of impulse.
          </p>
          <p>
            The goal is not constant activity and it is not to make every trade win. The goal is to
            discover a reproducible edge, execute it consistently, measure it correctly, and refuse
            to scale until the evidence supports scaling.
          </p>
        </div>
      </section>

      <section className="docs-section">
        <div className="docs-section-label"><span>02</span><strong>PIPELINE</strong></div>
        <div className="pipeline-stack">
          {pipeline.map(([number, title, body], index) => (
            <motion.article
              className="pipeline-card"
              key={number}
              initial={{ opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: .45 }}
              transition={{ duration: .4, delay: index * .04 }}
            >
              <span>{number}</span>
              <div><h2>{title}</h2><p>{body}</p></div>
              <i />
            </motion.article>
          ))}
        </div>
      </section>

      <section className="docs-section">
        <div className="docs-section-label"><span>03</span><strong>OPERATING PROCESS</strong></div>
        <div className="process-grid">
          {operating.map(([title, body], index) => (
            <motion.article
              className="glass-card"
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: .3 }}
              transition={{ duration: .45, delay: index * .04 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="docs-section">
        <div className="docs-section-label"><span>04</span><strong>ARCHITECTURE</strong></div>
        <div className="architecture-stack">
          {layers.map(([title, tool, body], index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, scale: .985 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: .35 }}
              transition={{ duration: .4, delay: index * .035 }}
            >
              <div><span>{String(index + 1).padStart(2, "0")}</span><strong>{title}</strong></div>
              <b>{tool}</b>
              <p>{body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="docs-section docs-split">
        <div>
          <div className="docs-section-label"><span>05</span><strong>PUBLIC BOUNDARY</strong></div>
          <div className="docs-prose">
            <p>
              The public site is an observability layer, not the trading console. It may show runtime state,
              telemetry freshness, public version identity, aggregate event activity, architecture,
              methodology, and release notes.
            </p>
            <p>
              Account equity, cash, buying power, positions, orders, traded symbols, prices, individual
              trade history, P&amp;L, exact entry and exit rules, thresholds, risk limits, credentials,
              and private database records stay outside the public interface.
            </p>
          </div>
        </div>
        <div>
          <div className="docs-section-label"><span>06</span><strong>PRODUCTION VS RESEARCH</strong></div>
          <div className="docs-prose">
            <p>
              Production and research are deliberately separated. Research can test ideas, repair data,
              replay historical sessions, or reject entire strategy families without silently changing
              what is running live.
            </p>
            <p>
              Production changes only after the research evidence passes its promotion gates. Capital
              scaling follows the same rule.
            </p>
          </div>
        </div>
      </section>

      <footer className="docs-footer">
        <span>ANEVUM / SYSTEM DOCUMENTATION</span>
        <a href="/research">Research &amp; development →</a>
      </footer>
    </div>
  );
}
