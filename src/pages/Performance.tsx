import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useLiveTrading } from "../hooks/useLiveTrading";

type PerformanceTab = "record" | "method" | "path" | "boundary";

const tabs: [PerformanceTab, string, string][] = [
  ["record", "Record", "Live normalized results"],
  ["method", "Method", "How the numbers are built"],
  ["path", "Path", "What has to happen next"],
  ["boundary", "Boundary", "Public versus private data"]
];

function pct(value?: number | null, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return sign + value.toFixed(digits) + "%";
}

function dateLabel(value?: string | null, includeTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", includeTime
    ? { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { month: "short", day: "2-digit", year: "numeric" });
}

function stateClass(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "";
  return value > 0 ? "is-positive" : value < 0 ? "is-negative" : "is-flat";
}

function PerformanceCurve({ rows }: { rows: { at?: string | null; return_pct?: number | null }[] }) {
  const chart = useMemo(() => {
    const clean = rows
      .map((row) => ({ at: row.at || null, value: Number(row.return_pct) }))
      .filter((row) => Number.isFinite(row.value));

    if (clean.length < 2) return null;

    const values = clean.map((row) => row.value);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 0);
    const rawRange = Math.max(0.2, maxValue - minValue);
    const pad = Math.max(0.08, rawRange * 0.18);
    const low = minValue - pad;
    const high = maxValue + pad;
    const span = Math.max(0.001, high - low);

    const points = clean.map((row, index) => {
      const x = clean.length === 1 ? 0 : (index / (clean.length - 1)) * 1000;
      const y = 290 - ((row.value - low) / span) * 270;
      return x.toFixed(2) + "," + y.toFixed(2);
    }).join(" ");

    const zeroY = 290 - ((0 - low) / span) * 270;

    return {
      clean,
      points,
      zeroY: Math.max(20, Math.min(290, zeroY)),
      minValue,
      maxValue,
      latest: clean[clean.length - 1]?.value ?? null
    };
  }, [rows]);

  if (!chart) {
    return <div className="performance-chart-empty">A normalized curve will appear once enough live snapshots exist.</div>;
  }

  return (
    <div className="performance-chart-wrap">
      <div className="performance-chart-head">
        <div>
          <span>NORMALIZED TRACKED-ACCOUNT RETURN</span>
          <strong className={stateClass(chart.latest)}>{pct(chart.latest)}</strong>
        </div>
        <div>
          <small>{dateLabel(chart.clean[0]?.at)}</small>
          <i>→</i>
          <small>{dateLabel(chart.clean[chart.clean.length - 1]?.at)}</small>
        </div>
      </div>
      <svg className="performance-chart" viewBox="0 0 1000 310" preserveAspectRatio="none" role="img" aria-label="Normalized live account return curve">
        <line className="performance-zero" x1="0" x2="1000" y1={chart.zeroY} y2={chart.zeroY} />
        <polyline className="performance-line" points={chart.points} />
      </svg>
      <div className="performance-chart-foot">
        <span>LOW {pct(chart.minValue)}</span>
        <span>0% BASELINE</span>
        <span>HIGH {pct(chart.maxValue)}</span>
      </div>
    </div>
  );
}

export default function Performance() {
  const [tab, setTab] = useState<PerformanceTab>("record");
  const { data, loading, error } = useLiveTrading(15000);
  const performance = data?.performance;
  const activeVersion = data?.active_strategy?.version_id || "UNRECORDED";
  const sample = String(performance?.sample_state || "UNAVAILABLE").replaceAll("_", " ");

  return (
    <section className="compact-page workspace-screen story-workspace performance-workspace">
      <header className="workspace-heading story-heading">
        <div>
          <p className="compact-eyebrow">RHEN / LIVE PERFORMANCE EVIDENCE</p>
          <h1>Performance</h1>
          <p className="story-heading-copy">
            A sanitized record derived from the live broker ledger. Losses remain in the record.
            Simulated research is never mixed into live results.
          </p>
        </div>
        <div className="workspace-heading-status story-status">
          <div><small>SAMPLE</small><strong>{sample}</strong></div>
          <div><small>VERSION</small><strong>{activeVersion}</strong></div>
          <div><small>METHOD</small><strong>{performance?.methodology_version || "UNAVAILABLE"}</strong></div>
        </div>
      </header>

      <div className="workspace-layout story-layout">
        <aside className="workspace-tabs story-tabs" aria-label="Performance sections">
          {tabs.map(([id, label, hint], index) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{label}</strong><small>{hint}</small></div>
            </button>
          ))}
        </aside>

        <div className="workspace-content story-content">
          <AnimatePresence mode="wait" initial={false}>
            {tab === "record" && (
              <motion.div className="workspace-view story-view performance-view" key="record" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row performance-title-row">
                  <div>
                    <span className="story-kicker">LIVE / PERSONAL CAPITAL / BROKER-DERIVED</span>
                    <h2>The public record starts with what actually happened.</h2>
                  </div>
                  <p>{error || (loading ? "Loading durable performance evidence…" : "Tracking began " + dateLabel(performance?.tracking_started_at, true) + ".")}</p>
                </div>

                <div className="performance-record-grid">
                  <div className="performance-primary">
                    <PerformanceCurve rows={performance?.curve || []} />
                    <div className="performance-metric-strip">
                      <article>
                        <span>TRACKED ACCOUNT</span>
                        <strong className={stateClass(performance?.account_return_pct)}>{pct(performance?.account_return_pct)}</strong>
                        <small>From first tracked account snapshot</small>
                      </article>
                      <article>
                        <span>RHEN REALIZED</span>
                        <strong className={stateClass(performance?.realized_return_pct)}>{pct(performance?.realized_return_pct)}</strong>
                        <small>Closed live RHEN trades / starting equity</small>
                      </article>
                      <article>
                        <span>MAX DRAWDOWN</span>
                        <strong>{pct(performance?.max_drawdown_pct)}</strong>
                        <small>Tracked account peak-to-trough measure</small>
                      </article>
                    </div>
                  </div>

                  <aside className="performance-side-stack">
                    <article><span>CLOSED LIVE TRADES</span><strong>{performance?.closed_trades ?? "—"}</strong><p>{performance?.wins ?? "—"} wins · {performance?.losses ?? "—"} losses</p></article>
                    <article><span>WIN RATE</span><strong>{pct(performance?.win_rate_pct, 1)}</strong><p>Descriptive only. Current sample is intentionally labeled {sample.toLowerCase()}.</p></article>
                    <article><span>TRADING SESSIONS</span><strong>{performance?.trading_sessions ?? "—"}</strong><p>Duration matters more than a single strong or weak session.</p></article>
                    <article><span>STATUS</span><strong>{String(performance?.status || "UNAVAILABLE").replaceAll("_", " ")}</strong><p>No outside capital is accepted or managed through this public site.</p></article>
                  </aside>
                </div>

                <div className="performance-disclosure-line">
                  <strong>EARLY SAMPLE.</strong>
                  <span>This record is evidence of current live operation, not a claim of profitability or a forecast of future returns.</span>
                </div>
              </motion.div>
            )}

            {tab === "method" && (
              <motion.div className="workspace-view story-view performance-view" key="method" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">PUBLIC-PERFORMANCE-v1</span><h2>Performance is generated from the durable live ledger.</h2></div>
                  <p>Public percentages are computed server-side from locked telemetry; the browser never receives the underlying account values.</p>
                </div>
                <div className="performance-method-grid">
                  <article><span>01 / SOURCE</span><strong>Broker-derived live telemetry</strong><p>RHEN reconciles execution and account state into durable records. The public feed reads those records rather than screenshots or manually entered results.</p></article>
                  <article><span>02 / SCOPE</span><strong>Live is separate from research</strong><p>Only live strategy versions contribute to the RHEN realized metric. Shadow runs, backtests, replay laboratories, and development experiments remain research evidence.</p></article>
                  <article><span>03 / BASELINE</span><strong>Normalized, not dollar-denominated</strong><p>The tracked-account curve indexes the first public account snapshot to 0%. Raw equity, cash, buying power, trade prices, quantities, and symbols remain private.</p></article>
                  <article><span>04 / CASH FLOWS</span><strong>Fail closed on deposits or withdrawals</strong><p>If external cash flows appear, normalized return is withheld until a proper flow-adjusted methodology can be applied rather than publishing a misleading percentage.</p></article>
                  <article><span>05 / LOSSES</span><strong>No selective deletion</strong><p>Losing live trades remain in aggregate results. Strategy retirement creates a version boundary; it does not erase the prior live record.</p></article>
                  <article><span>06 / FUTURE COMPLIANCE</span><strong>Performance marketing is a later legal gate</strong><p>If ANEVUM ever offers regulated advisory services, the public presentation will require a compliance review, fee-aware net performance treatment, recordkeeping, and any other then-applicable requirements.</p></article>
                </div>
              </motion.div>
            )}

            {tab === "path" && (
              <motion.div className="workspace-view story-view performance-view" key="path" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">EVIDENCE-FIRST EXPANSION</span><h2>Scale comes after proof, not before it.</h2></div>
                  <p>The company can broaden only when each preceding stage has enough evidence, operating maturity, and legal structure to support the next one.</p>
                </div>
                <div className="performance-path">
                  <article className="is-active"><span>01</span><div><small>ACTIVE</small><strong>Personal live record</strong><p>Run RHEN with owned capital. Preserve broker-derived telemetry, failures, version changes, drawdowns, and research decisions.</p></div></article>
                  <article className="is-active"><span>02</span><div><small>ACTIVE / BUILDING</small><strong>Public evidence + distribution</strong><p>Publish the canonical record on ANEVUM. Share the record through professional and social channels only as the underlying evidence becomes worth sharing.</p></div></article>
                  <article><span>03</span><div><small>GATED</small><strong>Private technology demonstration</strong><p>A first business pilot should begin as a bounded shadow or decision-support deployment. No custody, no discretionary trading authority, and no promise of returns.</p></div></article>
                  <article><span>04</span><div><small>FUTURE / LEGAL GATE</small><strong>Regulated outside-capital structure</strong><p>Only after counsel, compliance, operating controls, insurance, reporting, and the appropriate adviser/fund/account structure are in place should outside capital be considered.</p></div></article>
                  <article><span>05</span><div><small>FUTURE / CAPACITY GATE</small><strong>Institutional or limited managed capacity</strong><p>Choose the client model only after RHEN demonstrates that its edge, liquidity, infrastructure, and economics survive larger scale. Retail access is not assumed.</p></div></article>
                </div>
              </motion.div>
            )}

            {tab === "boundary" && (
              <motion.div className="workspace-view story-view performance-view" key="boundary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="story-title-row">
                  <div><span className="story-kicker">PUBLIC DATA CONTRACT</span><h2>Enough evidence to verify direction. Not enough data to reconstruct the account or strategy.</h2></div>
                  <p>The public feed is intentionally narrower than Command and the private telemetry ledger.</p>
                </div>
                <div className="performance-boundary-grid">
                  <article>
                    <span>PUBLISHED</span>
                    <strong>Normalized evidence</strong>
                    <div>{(data?.disclosure?.public_fields || []).map((item) => <p key={item}>+ {item}</p>)}</div>
                  </article>
                  <article>
                    <span>PRIVATE</span>
                    <strong>Capital + execution detail</strong>
                    <div>{(data?.disclosure?.excluded_fields || []).map((item) => <p key={item}>− {item}</p>)}</div>
                  </article>
                </div>
                <div className="performance-boundary-note">
                  <strong>NOT AN OFFER.</strong>
                  <p>ANEVUM is not using this page to accept outside capital, open managed accounts, or offer investment-advisory services. It documents RHEN's own live system and development record.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
