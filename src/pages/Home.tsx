import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
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
  const minutes = Math.floor(value / 60);
  return minutes + "m ago";
}

function shortVersion(value?: string | null) {
  if (!value) return "UNVERSIONED";
  return String(value).replace(/^strategy[-_ ]?/i, "").toUpperCase();
}

const architecture = [
  ["01", "Observe", "Continuously sample the permitted market universe and normalize incoming market data."],
  ["02", "Evaluate", "Apply the current strategy version and reject structures that do not meet its entry rules."],
  ["03", "Risk gate", "Check capital, exposure, timing, and execution constraints before an order can exist."],
  ["04", "Execute", "Send approved orders through the broker interface and track their complete lifecycle."],
  ["05", "Reconcile", "Compare broker truth with the internal ledger so the system knows what actually happened."],
  ["06", "Learn", "Persist results for post-close analysis, MFE/MAE work, tagging, and the next strategy revision."]
];

const updates = [
  {
    date: "SEP 25 2026",
    version: "PUBLIC 3.0",
    title: "Public observability rebuilt",
    body: "The public site now exposes sanitized runtime telemetry instead of account balances, positions, symbols, trade history, or exact strategy parameters."
  },
  {
    date: "SEP 25 2026",
    version: "DATA BOUNDARY",
    title: "Public projections locked down",
    body: "Previously public trading projection tables were removed from anonymous access. The public demo now receives only the limited telemetry designed for this page."
  },
  {
    date: "SEP 24 2026",
    version: "CANONICAL LOG",
    title: "Live system record connected",
    body: "Runtime, scanner, execution, broker, and reconciliation events began feeding a persistent canonical record for analysis and verification."
  }
];

export default function Home() {
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(() => !window.location.hash);
  const { data, loading, error } = useLiveTrading(5000);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 1750);
    return () => window.clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    const id = location.hash.replace("#", "");
    if (!id) return;

    const target = document.getElementById(id);
    if (!target) return;

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    const y = target.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo(0, Math.max(0, y));

    const frame = window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousBehavior;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);
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
            transition={{ duration: 0.42, ease: [0.7, 0, 0.3, 1] }}
            aria-hidden="true"
          >
            <motion.div
              className="anevum-intro-mark"
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Mark />
              <motion.span
                initial={{ opacity: 0, letterSpacing: "0.5em" }}
                animate={{ opacity: 1, letterSpacing: "0.32em" }}
                transition={{ delay: 0.28, duration: 0.62 }}
              >
                ANEVUM
              </motion.span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="public-page" id="top">
        <section className="landing-hero">
          <div className="hero-orbit hero-orbit-a" />
          <div className="hero-orbit hero-orbit-b" />
          <div className="hero-noise" />

          <div className="hero-center">
            <div className="hero-mark-wrap">
              <Mark />
              <span className="hero-mark-glow" />
            </div>
            <p className="hero-eyebrow">ANEVUM / LIVE RESEARCH SYSTEM</p>
            <h1>Build it.<br />Run it. Learn.</h1>
            <p className="hero-copy">
              A live experiment in automated capital growth: observe the system,
              understand how it works, and follow each version as the evidence changes it.
            </p>
            <div className="hero-actions">
              <a className="hero-primary" href="#demo">Open live demo <span>↓</span></a>
              <a className="hero-secondary" href="#architecture">How it works</a>
            </div>
          </div>

          <div className="hero-runtime">
            <span className={"runtime-state " + stateClass}><i />{state}</span>
            <span>{shortVersion(version)}</span>
            <span>{ageLabel(data?.freshness_seconds)}</span>
          </div>
          <a className="scroll-cue" href="#system" aria-label="Continue to system overview">
            <span>EXPLORE</span><i />
          </a>
        </section>

        <section className="public-section system-section" id="system">
          <div className="section-heading">
            <p>01 / THE SYSTEM</p>
            <h2>What is<br />ANEVUM doing?</h2>
          </div>
          <div className="system-copy-grid">
            <p className="system-lead">
              ANEVUM is a continuously running research and execution system built to test
              a simple question: can a very small pool of capital be grown through disciplined,
              automated decision-making rather than impulsive trading?
            </p>
            <p>
              The machine scans, evaluates, rejects, executes, reconciles, and records.
              The goal is not to make every trade win. The goal is to build a process that
              can measure its own mistakes, preserve what works, and improve version by version.
            </p>
          </div>

          <div className="system-status-board">
            <article className="system-primary-card">
              <header>
                <span>LIVE RUNTIME</span>
                <span className={"runtime-state " + stateClass}><i />{state}</span>
              </header>
              <div className="system-primary-state">
                <Mark />
                <div>
                  <span>ACTIVE VERSION</span>
                  <strong>{shortVersion(version)}</strong>
                  <small>{data?.active_strategy?.strategy_name || "Strategy telemetry"}</small>
                </div>
              </div>
              <footer>
                <span>Environment</span><strong>{String(data?.active_strategy?.environment || "live").toUpperCase()}</strong>
                <span>Telemetry</span><strong>{ageLabel(data?.freshness_seconds)}</strong>
              </footer>
            </article>

            <div className="system-metric-cards">
              <article><span>EVENTS / 60M</span><strong>{telemetry?.events_60m ?? "—"}</strong><small>recorded system events</small></article>
              <article><span>SCANS / 10M</span><strong>{telemetry?.scan_events_10m ?? "—"}</strong><small>market observations</small></article>
              <article><span>UNIVERSE / 10M</span><strong>{telemetry?.symbols_10m ?? "—"}</strong><small>distinct symbols observed</small></article>
              <article><span>RECONCILIATIONS / 2H</span><strong>{telemetry?.reconciliations_2h ?? "—"}</strong><small>ledger truth checks</small></article>
            </div>
          </div>
        </section>

        <section className="public-section demo-section" id="demo">
          <div className="section-heading demo-heading">
            <p>02 / LIVE DEMO</p>
            <h2>Watch the machine<br />without opening the vault.</h2>
            <span>
              Public telemetry is intentionally limited. Exact account value, positions,
              symbols, pricing, trade history, strategy thresholds, and risk parameters stay private.
            </span>
          </div>

          <div className="demo-grid">
            <article className="console-panel">
              <header className="panel-head">
                <div>
                  <span className="panel-label">ANEVUM // PUBLIC CONSOLE</span>
                  <small>{error || (data?.live ? "STREAM CONNECTED" : "SANITIZED TELEMETRY")}</small>
                </div>
                <span className={"runtime-state " + stateClass}><i />{state}</span>
              </header>
              <div className="console-body">
                <div className="console-line system-line">
                  <time>{timeLabel(data?.generated_at)}</time>
                  <strong>SYSTEM</strong>
                  <p>Public telemetry session established. Sensitive trading data withheld.</p>
                </div>
                {events.length ? events.slice(0, 12).map((event, index) => (
                  <motion.div
                    className={"console-line console-" + (event.kind || "system")}
                    key={(event.at || "") + (event.type || "") + index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025 }}
                  >
                    <time>{timeLabel(event.at)}</time>
                    <strong>{String(event.type || "system").toUpperCase()}</strong>
                    <p>{event.label || "System telemetry event recorded."}</p>
                  </motion.div>
                )) : (
                  <div className="console-empty">{loading ? "Connecting to live telemetry…" : "No recent public events."}</div>
                )}
              </div>
              <footer className="console-footer">
                <span>REFRESH 5S</span>
                <span>PUBLIC / SANITIZED</span>
                <span>{ageLabel(data?.freshness_seconds)}</span>
              </footer>
            </article>

            <div className="demo-side">
              <article className="activity-panel">
                <header className="panel-head">
                  <div><span className="panel-label">ACTIVITY DENSITY</span><small>LAST 60 MINUTES</small></div>
                  <strong>{telemetry?.events_60m ?? "—"}</strong>
                </header>
                <div className="activity-bars" aria-label="Aggregate system events over the last hour">
                  {activity.length ? activity.map((row, index) => {
                    const count = Number(row.count) || 0;
                    const height = Math.max(6, (count / activityMax) * 100);
                    return (
                      <div className="activity-column" key={(row.at || "") + index}>
                        <motion.i
                          initial={{ height: "3%" }}
                          animate={{ height: height + "%" }}
                          transition={{ duration: 0.55, delay: index * 0.04 }}
                        />
                        <span>{count}</span>
                      </div>
                    );
                  }) : Array.from({ length: 6 }).map((_, index) => (
                    <div className="activity-column is-empty" key={index}><i /><span>—</span></div>
                  ))}
                </div>
                <footer>
                  <span>-60M</span><span>EVENT VOLUME, NOT P&L</span><span>NOW</span>
                </footer>
              </article>

              <article className="telemetry-panel">
                <div className="telemetry-ring">
                  <Mark />
                  <span className={data?.live ? "is-live" : ""} />
                </div>
                <div className="telemetry-copy">
                  <span>EXECUTION EVENTS / 2H</span>
                  <strong>{telemetry?.execution_events_2h ?? "—"}</strong>
                  <p>
                    This counts execution-related lifecycle events. It does not reveal
                    whether a position exists, what was traded, or whether the event was profitable.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="public-section architecture-section" id="architecture">
          <div className="section-heading architecture-heading">
            <p>03 / ARCHITECTURE</p>
            <h2>Six stages.<br />One feedback loop.</h2>
            <span>
              The public model shows the operating logic without publishing the rules needed
              to reproduce the strategy.
            </span>
          </div>

          <div className="architecture-map">
            <div className="architecture-line" aria-hidden="true" />
            {architecture.map(([number, title, body], index) => (
              <article className="architecture-node" key={number}>
                <div className="architecture-index"><span>{number}</span><i /></div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
                <small>{index === architecture.length - 1 ? "→ NEXT VERSION" : "↓"}</small>
              </article>
            ))}
          </div>

          <div className="feedback-loop">
            <div>
              <span>THE IMPORTANT PART</span>
              <h3>The bot is not the strategy.</h3>
            </div>
            <p>
              The durable asset is the measurement loop around it: complete data, reconciliation,
              tagging, excursion analysis, and disciplined versioning. Code executes the current
              idea. The record determines whether that idea deserves to survive.
            </p>
          </div>
        </section>

        <section className="public-section updates-section" id="updates">
          <div className="section-heading updates-heading">
            <p>04 / VERSION RECORD</p>
            <h2>Change is<br />part of the product.</h2>
            <span>
              ANEVUM is meant to remain inspectable as it evolves. Public releases record
              meaningful system changes without exposing private implementation details.
            </span>
          </div>

          <div className="updates-list">
            {updates.map((item, index) => (
              <article key={item.version}>
                <div className="update-meta">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <time>{item.date}</time>
                </div>
                <div className="update-version">{item.version}</div>
                <div className="update-body">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="public-footer">
          <div className="footer-brand">
            <Mark />
            <div><strong>ANEVUM</strong><span>Personal research system by Devon Akins</span></div>
          </div>
          <p>
            This public interface demonstrates system behavior and development.
            It is not a trading signal, financial product, or performance promise.
          </p>
          <a className="operator-link" href="/command" rel="nofollow">
            <span>OPERATOR</span><i />
          </a>
        </footer>
      </div>
    </>
  );
}
