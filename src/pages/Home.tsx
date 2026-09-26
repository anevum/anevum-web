import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import Mark from "../components/Mark";
import { useLiveTrading } from "../hooks/useLiveTrading";

function timeLabel(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ageLabel(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "awaiting telemetry";
  if (value < 60) return Math.max(0, Math.round(value)) + "s ago";
  return Math.floor(value / 60) + "m ago";
}

function shortVersion(value?: string | null) {
  if (!value) return "UNVERSIONED";
  return String(value).replace(/^strategy[-_ ]?/i, "").toUpperCase();
}

const architecture = [
  ["01", "Observe", "Sample market data."],
  ["02", "Evaluate", "Apply active entry rules."],
  ["03", "Risk gate", "Check capital and exposure."],
  ["04", "Execute", "Submit approved orders."],
  ["05", "Reconcile", "Match broker and ledger truth."],
  ["06", "Analyze", "Measure results and revise."]
];

const latestUpdate = {
  date: "SEP 25 2026",
  version: "PUBLIC 3.1",
  title: "Single-screen public interface",
  body: "The public site is condensed into one fixed viewport. Runtime telemetry remains live while private trading data stays excluded."
};

export default function Home() {
  const [showIntro, setShowIntro] = useState(() => !window.location.hash);
  const { data, loading, error } = useLiveTrading(5000);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 1350);
    return () => window.clearTimeout(timer);
  }, []);

  const telemetry = data?.telemetry;
  const events = data?.events || [];
  const activity = data?.activity || [];
  const version = data?.active_strategy?.version_id || data?.active_strategy?.strategy_name;
  const state = loading ? "CONNECTING" : data?.state || (data?.live ? "RUNNING" : "STALE");
  const stateClass = data?.live ? "is-live" : data ? "is-stale" : "";

  const activityMax = useMemo(
    () => Math.max(1, ...activity.map((row) => Number(row.count) || 0)),
    [activity]
  );

  return (
    <>
      <AnimatePresence>
        {showIntro ? (
          <motion.div
            className="anevum-intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.7, 0, 0.3, 1] }}
            aria-hidden="true"
          >
            <motion.div
              className="anevum-intro-mark"
              initial={{ opacity: 0, scale: 0.84 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.62, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Mark />
              <span>ANEVUM</span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="public-page one-page" id="top">
        <div className="one-page-grid">
          <section className="overview-pane" id="system">
            <div className="overview-mark"><Mark /></div>
            <div className="overview-copy">
              <p className="one-eyebrow">ANEVUM / LIVE RESEARCH SYSTEM</p>
              <h1>Automated market research and execution.</h1>
              <p>
                ANEVUM scans a configured market universe, applies versioned trading rules,
                checks risk constraints, executes approved orders, reconciles broker activity,
                and stores the resulting data for analysis.
              </p>
            </div>

            <div className="runtime-inline">
              <span className={"runtime-state " + stateClass}><i />{state}</span>
              <div><small>ACTIVE VERSION</small><strong>{shortVersion(version)}</strong></div>
              <div><small>ENVIRONMENT</small><strong>{String(data?.active_strategy?.environment || "live").toUpperCase()}</strong></div>
              <div><small>TELEMETRY</small><strong>{ageLabel(data?.freshness_seconds)}</strong></div>
            </div>

            <div className="metric-strip">
              <article><span>EVENTS / 60M</span><strong>{telemetry?.events_60m ?? "—"}</strong></article>
              <article><span>SCANS / 10M</span><strong>{telemetry?.scan_events_10m ?? "—"}</strong></article>
              <article><span>SYMBOLS / 10M</span><strong>{telemetry?.symbols_10m ?? "—"}</strong></article>
              <article><span>RECON / 2H</span><strong>{telemetry?.reconciliations_2h ?? "—"}</strong></article>
            </div>
          </section>

          <section className="runtime-pane" id="demo">
            <header className="one-panel-head">
              <div>
                <span>PUBLIC RUNTIME</span>
                <small>{error || (data?.live ? "LIVE TELEMETRY" : "SANITIZED TELEMETRY")}</small>
              </div>
              <span className={"runtime-state " + stateClass}><i />{state}</span>
            </header>

            <div className="one-console">
              <div className="console-line system-line">
                <time>{timeLabel(data?.generated_at)}</time>
                <strong>SYSTEM</strong>
                <p>Public telemetry connected. Account and strategy-sensitive data are excluded.</p>
              </div>
              {events.length ? events.slice(0, 8).map((event, index) => (
                <motion.div
                  className={"console-line console-" + (event.kind || "system")}
                  key={(event.at || "") + (event.type || "") + index}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <time>{timeLabel(event.at)}</time>
                  <strong>{String(event.type || "system").toUpperCase()}</strong>
                  <p>{event.label || "System telemetry event recorded."}</p>
                </motion.div>
              )) : (
                <div className="one-console-empty">{loading ? "Connecting to live telemetry…" : "No recent public events."}</div>
              )}
            </div>

            <div className="runtime-bottom">
              <div className="activity-mini" aria-label="Aggregate event activity">
                <div className="activity-mini-copy">
                  <span>ACTIVITY / 60M</span>
                  <strong>{telemetry?.events_60m ?? "—"}</strong>
                </div>
                <div className="activity-mini-bars">
                  {activity.length ? activity.map((row, index) => {
                    const count = Number(row.count) || 0;
                    const height = Math.max(8, (count / activityMax) * 100);
                    return <i key={(row.at || "") + index} style={{ height: height + "%" }} />;
                  }) : Array.from({ length: 6 }).map((_, index) => <i key={index} />)
                  }
                </div>
              </div>
              <div className="execution-mini">
                <span>EXECUTION EVENTS / 2H</span>
                <strong>{telemetry?.execution_events_2h ?? "—"}</strong>
                <small>No positions, symbols, prices, or P&amp;L are disclosed.</small>
              </div>
            </div>
          </section>

          <section className="process-pane" id="architecture">
            <div className="process-heading">
              <span>PROCESS</span>
              <strong>Observe → Evaluate → Risk gate → Execute → Reconcile → Analyze</strong>
            </div>
            <div className="process-row">
              {architecture.map(([number, title, body]) => (
                <article key={number}>
                  <span>{number}</span>
                  <div><strong>{title}</strong><small>{body}</small></div>
                </article>
              ))}
            </div>
          </section>

          <section className="change-pane" id="updates">
            <div className="change-meta">
              <span>LATEST CHANGE</span>
              <small>{latestUpdate.date} / {latestUpdate.version}</small>
            </div>
            <div>
              <strong>{latestUpdate.title}</strong>
              <p>{latestUpdate.body}</p>
            </div>
            <a href="/command" rel="nofollow">OPERATOR <i /></a>
          </section>
        </div>
      </div>
    </>
  );
}
