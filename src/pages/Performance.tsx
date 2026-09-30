import { useMemo, useState } from "react";
import type {
  LiveTradingFeed,
  PublicPerformancePoint,
  PublicCryptoShadowValidation,
  PublicCrrActivityPoint,
  PublicCrrOutcomePoint,
  PublicCrrGate
} from "../lib/data";
import { useLiveTrading } from "../hooks/useLiveTrading";

type PerformanceTab = "overview" | "equities" | "crypto" | "validation" | "methodology" | "boundaries";

type LanePerformance = {
  market_lane?: string;
  methodology_version?: string;
  basis?: string;
  status?: string;
  sample_state?: string;
  tracking_started_at?: string | null;
  tracking_ended_at?: string | null;
  first_trade_at?: string | null;
  last_trade_at?: string | null;
  active_periods?: number;
  closed_trades?: number;
  wins?: number;
  losses?: number;
  win_rate_pct?: number | null;
  realized_return_pct?: number | null;
  max_drawdown_pct?: number | null;
  strategy_version_id?: string | null;
  strategy_name?: string | null;
  strategy_environment?: string | null;
  strategy_status?: string | null;
  denominator?: string;
  curve?: PublicPerformancePoint[];
  limitations?: string[];
};

type ExtendedFeed = LiveTradingFeed & {
  market_performance?: {
    methodology_version?: string;
    equities?: LanePerformance;
    crypto?: LanePerformance;
    limitations?: string[];
  };
  crypto_shadow_validation?: PublicCryptoShadowValidation;
};

const tabs: [PerformanceTab, string, string][] = [
  ["overview", "Overview", "Separate live market lanes"],
  ["equities", "Equities", "Closed live equity trades"],
  ["crypto", "Crypto", "Closed live crypto trades"],
  ["validation", "CRR Study", "Live shadow validation evidence"],
  ["methodology", "Methodology", "How normalized records are built"],
  ["boundaries", "Boundaries", "What remains private or excluded"]
];

function pct(value?: number | null, digits = 2, signed = true) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = signed && value > 0 ? "+" : "";
  return sign + value.toFixed(digits) + "%";
}

function dateLabel(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function human(value?: string | null) {
  return String(value || "UNAVAILABLE").replaceAll("_", " ");
}

function stateClass(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "";
  return value > 0 ? "is-positive" : value < 0 ? "is-negative" : "is-flat";
}

function MarketOverviewSparkline({ rows = [], label }: { rows?: PublicPerformancePoint[]; label: string }) {
  const clean = rows.map((row) => Number(row.return_pct)).filter(Number.isFinite);
  if (clean.length < 2) return <div className="market-overview-spark-empty">{label}: AWAITING MEASURED CURVE</div>;

  const low = Math.min(...clean, 0);
  const high = Math.max(...clean, 0);
  const span = Math.max(0.01, high - low);
  const points = clean.map((value, index) => {
    const x = (index / Math.max(1, clean.length - 1)) * 400;
    const y = 64 - ((value - low) / span) * 52;
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
  const zeroY = 64 - ((0 - low) / span) * 52;

  return (
    <svg className="market-overview-sparkline" viewBox="0 0 400 76" preserveAspectRatio="none" role="img" aria-label={label + " normalized live performance preview"}>
      <line className="baseline" x1="0" x2="400" y1={zeroY} y2={zeroY} />
      <polyline className="curve" points={points} />
    </svg>
  );
}

function PerformanceCurve({
  rows,
  label,
  empty
}: {
  rows: PublicPerformancePoint[];
  label: string;
  empty: string;
}) {
  const chart = useMemo(() => {
    const clean = rows
      .map((row) => ({ at: row.at || null, value: Number(row.return_pct) }))
      .filter((row) => Number.isFinite(row.value));

    if (clean.length < 2) return null;

    const values = clean.map((row) => row.value);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 0);
    const rawRange = Math.max(0.05, maxValue - minValue);
    const pad = Math.max(0.03, rawRange * 0.18);
    const low = minValue - pad;
    const high = maxValue + pad;
    const span = Math.max(0.001, high - low);
    const points = clean.map((row, index) => {
      const x = (index / Math.max(clean.length - 1, 1)) * 1000;
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
    return (
      <div className="market-performance-empty">
        <span>{label}</span>
        <strong>{empty}</strong>
        <p>No measured curve is shown until closed live trades create a real sample.</p>
      </div>
    );
  }

  return (
    <div className="market-performance-chart-wrap">
      <header>
        <div><span>{label}</span><strong className={stateClass(chart.latest)}>{pct(chart.latest)}</strong></div>
        <div><small>{dateLabel(chart.clean[0]?.at)}</small><i>→</i><small>{dateLabel(chart.clean[chart.clean.length - 1]?.at)}</small></div>
      </header>
      <svg viewBox="0 0 1000 310" preserveAspectRatio="none" role="img" aria-label={label + " normalized live-trade performance curve"}>
        <line className="market-performance-zero" x1="0" x2="1000" y1={chart.zeroY} y2={chart.zeroY} />
        <polyline className="market-performance-line" points={chart.points} />
      </svg>
      <footer><span>LOW {pct(chart.minValue)}</span><span>0% EPOCH BASELINE</span><span>HIGH {pct(chart.maxValue)}</span></footer>
    </div>
  );
}


function compactNumber(value?: number | null, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function dateTimeLabel(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  });
}

function gateStateClass(status?: string | null) {
  const value = String(status || "").toUpperCase();
  if (value.includes("PASS")) return "is-pass";
  if (value.includes("FAIL")) return "is-fail";
  if (value.includes("PENDING") || value.includes("UNMEASURED")) return "is-pending";
  return "is-collecting";
}

function ProgressMeter({
  label,
  value,
  observed,
  target
}: {
  label: string;
  value?: number | null;
  observed?: number | null;
  target?: number | null;
}) {
  const width = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="crr-meter">
      <div><span>{label}</span><strong>{observed ?? 0} / {target ?? "—"}</strong></div>
      <div className="crr-meter-track"><i style={{ width: width + "%" }} /></div>
      <small>{width.toFixed(1)}% of frozen minimum sample gate</small>
    </div>
  );
}

function CrrSampleProgressChart({ rows = [] }: { rows?: PublicCrrActivityPoint[] }) {
  const clean = rows
    .map((row) => ({
      at: row.at || null,
      trades: Number(row.trade_progress_pct),
      days: Number(row.day_progress_pct)
    }))
    .filter((row) => Number.isFinite(row.trades) && Number.isFinite(row.days));

  if (!clean.length) {
    return (
      <div className="crr-chart-empty">
        <span>SAMPLE ACCUMULATION</span>
        <strong>AWAITING DURABLE SHADOW EVENTS</strong>
        <p>The chart begins only after CRR-001 evidence is written durably.</p>
      </div>
    );
  }

  const x = (index: number) => clean.length === 1 ? 500 : (index / (clean.length - 1)) * 1000;
  const y = (value: number) => 280 - Math.max(0, Math.min(100, value)) * 2.5;
  const tradePoints = clean.map((row, index) => x(index).toFixed(1) + "," + y(row.trades).toFixed(1)).join(" ");
  const dayPoints = clean.map((row, index) => x(index).toFixed(1) + "," + y(row.days).toFixed(1)).join(" ");

  return (
    <div className="crr-chart-card">
      <header>
        <div><span>SAMPLE ACCUMULATION</span><strong>Validation minimums</strong></div>
        <div className="crr-chart-legend"><i className="trades" /> completed trades <i className="days" /> independent days</div>
      </header>
      <svg className="crr-progress-chart" viewBox="0 0 1000 310" preserveAspectRatio="none" role="img" aria-label="CRR-001 sample accumulation against validation minimums">
        {[25, 50, 75, 100].map((level) => (
          <g key={level}>
            <line className={level === 100 ? "crr-threshold-line" : "crr-grid-line"} x1="0" x2="1000" y1={y(level)} y2={y(level)} />
            <text className="crr-axis-text" x="8" y={y(level) - 5}>{level}%</text>
          </g>
        ))}
        <polyline className="crr-progress-trades" points={tradePoints} />
        <polyline className="crr-progress-days" points={dayPoints} />
        {clean.map((row, index) => (
          <g key={(row.at || "point") + index}>
            <circle className="crr-dot-trades" cx={x(index)} cy={y(row.trades)} r="5"><title>{dateLabel(row.at)} · trades {row.trades.toFixed(1)}%</title></circle>
            <circle className="crr-dot-days" cx={x(index)} cy={y(row.days)} r="5"><title>{dateLabel(row.at)} · days {row.days.toFixed(1)}%</title></circle>
          </g>
        ))}
      </svg>
      <footer><span>{dateLabel(clean[0]?.at)}</span><span>100% = frozen minimum sample gate</span><span>{dateLabel(clean[clean.length - 1]?.at)}</span></footer>
    </div>
  );
}

function CrrOutcomeChart({ rows = [] }: { rows?: PublicCrrOutcomePoint[] }) {
  const clean = rows
    .map((row) => ({
      at: row.at || null,
      outcome: Number(row.return_pct),
      mean: Number(row.running_expectancy_pct),
      compounded: Number(row.compounded_return_pct)
    }))
    .filter((row) => Number.isFinite(row.outcome) && Number.isFinite(row.mean) && Number.isFinite(row.compounded));

  if (!clean.length) {
    return (
      <div className="crr-chart-empty">
        <span>STRESSED-COST OUTCOMES</span>
        <strong>NO DURABLE COMPLETED OUTCOME YET</strong>
        <p>Running expectancy and cumulative shadow return remain unplotted until an exit is durably recorded.</p>
      </div>
    );
  }

  const values = clean.flatMap((row) => [row.mean, row.compounded, row.outcome, 0]);
  const rawLow = Math.min(...values);
  const rawHigh = Math.max(...values);
  const span = Math.max(0.05, rawHigh - rawLow);
  const low = rawLow - span * 0.16;
  const high = rawHigh + span * 0.16;
  const range = Math.max(0.001, high - low);
  const x = (index: number) => clean.length === 1 ? 500 : (index / (clean.length - 1)) * 1000;
  const y = (value: number) => 285 - ((value - low) / range) * 255;
  const meanPoints = clean.map((row, index) => x(index).toFixed(1) + "," + y(row.mean).toFixed(1)).join(" ");
  const compoundedPoints = clean.map((row, index) => x(index).toFixed(1) + "," + y(row.compounded).toFixed(1)).join(" ");
  const zeroY = y(0);

  return (
    <div className="crr-chart-card">
      <header>
        <div><span>STRESSED-COST OUTCOMES</span><strong>Running evidence</strong></div>
        <div className="crr-chart-legend"><i className="expectancy" /> running expectancy <i className="compound" /> cumulative return</div>
      </header>
      <svg className="crr-outcome-chart" viewBox="0 0 1000 310" preserveAspectRatio="none" role="img" aria-label="CRR-001 stressed-cost running expectancy and cumulative shadow return">
        <line className="crr-zero-line" x1="0" x2="1000" y1={zeroY} y2={zeroY} />
        <polyline className="crr-expectancy-line" points={meanPoints} />
        <polyline className="crr-compound-line" points={compoundedPoints} />
        {clean.map((row, index) => (
          <g key={(row.at || "outcome") + index}>
            <line className={row.outcome >= 0 ? "crr-outcome-stem is-up" : "crr-outcome-stem is-down"} x1={x(index)} x2={x(index)} y1={zeroY} y2={y(row.outcome)} />
            <circle className="crr-outcome-dot" cx={x(index)} cy={y(row.outcome)} r="4">
              <title>{dateTimeLabel(row.at)} · outcome {pct(row.outcome)} · running mean {pct(row.mean)}</title>
            </circle>
          </g>
        ))}
      </svg>
      <footer><span>LOW {pct(rawLow)}</span><span>0% = no stressed-cost edge</span><span>HIGH {pct(rawHigh)}</span></footer>
    </div>
  );
}

function formatGateObserved(gate: PublicCrrGate) {
  const id = gate.id || "";
  if (gate.observed == null || !Number.isFinite(Number(gate.observed))) return "—";
  const value = Number(gate.observed);
  if (id === "expectancy" || id === "symbol_concentration") return pct(value, 3, id === "expectancy");
  if (id === "profit_factor" || id === "dependence_adjusted_null") return compactNumber(value, 3);
  return compactNumber(value, 0);
}

function CrrGateMatrix({ gates = [] }: { gates?: PublicCrrGate[] }) {
  return (
    <div className="crr-gate-panel">
      <header><span>FROZEN VALIDATION GATES</span><h3>No single metric can promote the strategy.</h3><p>Every required gate must survive the formal GRAEN evaluation. Live descriptive values are labeled provisional until the minimum sample is reached.</p></header>
      <div className="crr-gate-grid">
        {gates.map((gate) => (
          <article key={gate.id || gate.label} className={gateStateClass(gate.status)}>
            <div><span>{gate.label}</span><b>{human(gate.status)}</b></div>
            <strong>{formatGateObserved(gate)}</strong>
            <p>Rule: {gate.rule || "—"}</p>
            {gate.target != null ? <small>Target count: {gate.target}</small> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function CrrValidationStudy({ study }: { study?: PublicCryptoShadowValidation }) {
  if (!study) {
    return (
      <section className="crr-study crr-study-empty">
        <span>CRR-001 LIVE VALIDATION STUDY</span>
        <h2>Public study feed unavailable.</h2>
        <p>The live-money crypto lane remains separate. No shadow statistic is substituted when the research feed is unavailable.</p>
      </section>
    );
  }

  const metrics = study.descriptive_metrics || {};
  const counts = study.counts || {};
  const targets = study.targets || {};
  const progress = study.progress || {};
  const design = study.design || {};
  const historical = study.historical_reference;
  const provisional = (counts.exits || 0) < (targets.validation_min_completed_trades || 30)
    || (counts.independent_day_blocks || 0) < (targets.validation_min_independent_day_blocks || 20);

  return (
    <section className="crr-study">
      <header className="crr-study-hero">
        <div>
          <span>CRR-001 · LIVE VALIDATION STUDY</span>
          <h2>Controlled Residual Reversal</h2>
          <p>{study.hypothesis}</p>
        </div>
        <div className="crr-study-state">
          <small>RESEARCH STATE</small>
          <strong>{human(study.status)}</strong>
          <b>SHADOW ONLY · BROKER ORDERS DISABLED</b>
        </div>
      </header>

      <div className="crr-science-note">
        <strong>INTERPRETATION BOUNDARY</strong>
        <p>This panel tracks forward shadow evidence arriving from the live market. It is not live-money performance. Until the frozen sample gates and formal tests pass, all outcome statistics are descriptive, not confirmatory.</p>
      </div>

      <div className="crr-study-summary">
        <article><span>TRACKING SINCE</span><strong>{dateTimeLabel(study.tracking_started_at)}</strong><small>Durable CRR evidence window</small></article>
        <article><span>LATEST EVIDENCE</span><strong>{dateTimeLabel(study.latest_received_at || study.latest_event_at)}</strong><small>Public feed refreshes every 5 seconds</small></article>
        <article><span>OPPORTUNITIES</span><strong>{counts.opportunities ?? 0}</strong><small>{counts.entries ?? 0} confirmed entries · {counts.expired ?? 0} expired</small></article>
        <article><span>COMPLETED OUTCOMES</span><strong>{counts.exits ?? 0}</strong><small>120-minute stressed-cost shadow exits</small></article>
        <article><span>INDEPENDENT DAYS</span><strong>{counts.independent_day_blocks ?? 0}</strong><small>Entry-day blocks retained for dependence control</small></article>
        <article><span>EXECUTION AUTHORITY</span><strong>NONE</strong><small>Research process cannot place broker orders</small></article>
      </div>

      <div className="crr-protocol-strip">
        <article><span>BAR</span><strong>{design.bar_minutes ?? 5} min</strong><small>Observation interval</small></article>
        <article><span>SHOCK</span><strong>{design.shock_lookback_minutes ?? 15} min</strong><small>Residual lookback</small></article>
        <article><span>BASELINE</span><strong>{design.residual_volatility_lookback_minutes ?? 360} min</strong><small>Residual-volatility window</small></article>
        <article><span>RECLAIM</span><strong>{design.reclaim_window_minutes ?? 15} min</strong><small>Confirmation window</small></article>
        <article><span>HOLD</span><strong>{design.hold_minutes ?? 120} min</strong><small>Fixed outcome horizon</small></article>
        <article><span>UNIVERSE</span><strong>{design.execution_asset_count ?? 3} / {design.context_asset_count ?? 6}</strong><small>Execution / context assets</small></article>
      </div>

      <div className="crr-progress-section">
        <div className="crr-progress-copy">
          <span>SAMPLE SUFFICIENCY</span>
          <h3>Two minimums must be satisfied before formal validation is meaningful.</h3>
          <p>Completed trades control outcome sample size. Independent day blocks reduce the chance that many correlated trades from one market episode masquerade as broad evidence.</p>
          <ProgressMeter
            label="Completed shadow trades"
            value={progress.completed_trades_pct}
            observed={counts.exits}
            target={targets.validation_min_completed_trades}
          />
          <ProgressMeter
            label="Independent day blocks"
            value={progress.independent_days_pct}
            observed={counts.independent_day_blocks}
            target={targets.validation_min_independent_day_blocks}
          />
        </div>
        <CrrSampleProgressChart rows={study.activity} />
      </div>

      <div className="crr-chart-grid">
        <CrrOutcomeChart rows={study.outcomes} />
        <div className="crr-descriptive-panel">
          <header><span>DESCRIPTIVE STATISTICS</span><strong>{provisional ? "PROVISIONAL" : "SAMPLE MINIMUM REACHED"}</strong></header>
          <div>
            <article><span>EXPECTANCY / TRADE</span><strong className={stateClass(metrics.expectancy_per_trade_pct)}>{pct(metrics.expectancy_per_trade_pct, 3)}</strong><small>Mean stressed-cost shadow return</small></article>
            <article><span>MEDIAN OUTCOME</span><strong className={stateClass(metrics.median_trade_return_pct)}>{pct(metrics.median_trade_return_pct, 3)}</strong><small>Median completed shadow return</small></article>
            <article><span>WIN RATE</span><strong>{pct(metrics.win_rate_pct, 1, false)}</strong><small>Descriptive only; not a promotion gate alone</small></article>
            <article><span>PROFIT FACTOR</span><strong>{compactNumber(metrics.profit_factor, 3)}</strong><small>Gross positive / gross negative shadow return</small></article>
            <article><span>MAX DRAWDOWN</span><strong>{pct(metrics.max_drawdown_pct, 2, false)}</strong><small>Compounded shadow outcome sequence</small></article>
            <article><span>MAX CONCENTRATION</span><strong>{pct(metrics.max_symbol_concentration_pct, 1, false)}</strong><small>Largest asset share of confirmed entries</small></article>
          </div>
        </div>
      </div>

      <CrrGateMatrix gates={study.gates} />

      <div className="crr-reference-grid">
        <article className="crr-historical-reference">
          <span>FROZEN HISTORICAL REFERENCE</span>
          <h3>Why more live evidence is necessary.</h3>
          {historical ? (
            <>
              <p>The current v6 historical validation did not authorize promotion. It remains a reference point, not evidence to be blended into this forward shadow sample.</p>
              <div>
                <span><b>{historical.validation?.trade_count ?? 0}</b><small>validation trades</small></span>
                <span><b>{historical.validation?.independent_day_blocks ?? 0}</b><small>day blocks</small></span>
                <span><b className={stateClass(historical.validation?.expectancy_per_trade_pct)}>{pct(historical.validation?.expectancy_per_trade_pct, 3)}</b><small>validation expectancy</small></span>
                <span><b>{historical.validation?.p_value == null ? "—" : compactNumber(historical.validation.p_value, 3)}</b><small>dependence-adjusted p</small></span>
                <span><b className={stateClass(historical.validation?.delayed_expectancy_pct)}>{pct(historical.validation?.delayed_expectancy_pct, 3)}</b><small>one-bar-delay expectancy</small></span>
                <span><b>{historical.holdout_opened ? "OPENED" : "CLOSED"}</b><small>holdout state</small></span>
              </div>
            </>
          ) : (
            <p>The latest persisted historical-reference result is not yet available through the public feed. The forward shadow study continues without filling the gap with estimated values.</p>
          )}
        </article>

        <article className="crr-method-card">
          <span>WHAT WOULD COUNT AS EVIDENCE?</span>
          <h3>Positive results must survive multiple failure modes.</h3>
          <p>The strategy is not promoted because a chart turns green. It must clear minimum sample size, independent-day coverage, positive stressed-cost expectancy, dependence-adjusted significance, concentration limits, profit-factor requirements, and delayed-entry robustness. Only then may an untouched holdout be opened.</p>
          <div><b>{targets.holdout_min_completed_trades ?? 20}</b><small>minimum holdout trades</small><b>{targets.holdout_min_independent_day_blocks ?? 15}</b><small>minimum holdout day blocks</small></div>
        </article>
      </div>

      <div className="crr-limitations">
        <strong>LIMITATIONS / DATA QUALITY</strong>
        {(study.limitations || []).map((item) => <p key={item}>{item}</p>)}
      </div>
    </section>
  );
}

function MarketLane({
  title,
  eyebrow,
  performance
}: {
  title: string;
  eyebrow: string;
  performance?: LanePerformance;
}) {
  const closed = Number(performance?.closed_trades || 0);
  const hasSample = closed > 0;

  return (
    <div className="market-lane-view">
      <header className="market-lane-heading">
        <div><span>{eyebrow}</span><h2>{title}</h2><p>Realized live-trade evidence for this market lane only. Replay, shadow, paper, and development results are excluded.</p></div>
        <div className={"market-lane-status " + (hasSample ? "has-sample" : "awaiting")}>
          <span>LIVE SAMPLE</span>
          <strong>{hasSample ? human(performance?.sample_state) : "AWAITING LIVE SAMPLE"}</strong>
          <small>{closed} closed live trade{closed === 1 ? "" : "s"}</small>
        </div>
      </header>

      <PerformanceCurve
        rows={performance?.curve || []}
        label={title.toUpperCase() + " REALIZED LIVE-TRADE PERFORMANCE"}
        empty="AWAITING LIVE SAMPLE"
      />

      <div className="market-lane-metrics">
        <article><span>REALIZED RETURN</span><strong className={hasSample ? stateClass(performance?.realized_return_pct) : ""}>{hasSample ? pct(performance?.realized_return_pct) : "—"}</strong><small>{hasSample ? "Lane P&L / shared performance-epoch baseline" : "No measured live return yet"}</small></article>
        <article><span>MAX DRAWDOWN</span><strong>{hasSample ? pct(performance?.max_drawdown_pct, 2, false) : "—"}</strong><small>{hasSample ? "Realized lane drawdown / epoch baseline" : "No measured live drawdown yet"}</small></article>
        <article><span>CLOSED TRADES</span><strong>{closed}</strong><small>{performance?.wins ?? 0} wins · {performance?.losses ?? 0} losses</small></article>
        <article><span>WIN RATE</span><strong>{hasSample ? pct(performance?.win_rate_pct, 1, false) : "—"}</strong><small>{hasSample ? "Descriptive sample statistic" : "Requires closed live trades"}</small></article>
        <article><span>ACTIVE PERIODS</span><strong>{performance?.active_periods ?? 0}</strong><small>{hasSample ? "Distinct ET dates containing a close" : "No live close periods yet"}</small></article>
        <article><span>STRATEGY</span><strong>{performance?.strategy_version_id || "UNRECORDED"}</strong><small>{human(performance?.strategy_environment)} · {human(performance?.strategy_status)}</small></article>
      </div>

      <div className="market-lane-evidence">
        <div><span>FIRST LIVE TRADE</span><strong>{dateLabel(performance?.first_trade_at)}</strong></div>
        <div><span>LATEST LIVE TRADE</span><strong>{dateLabel(performance?.last_trade_at)}</strong></div>
        <div><span>METHODOLOGY</span><strong>{performance?.methodology_version || "PUBLIC-MARKET-PERFORMANCE-v1"}</strong></div>
        <div><span>EVIDENCE STATUS</span><strong>{hasSample ? "MEASURED LIVE SAMPLE" : "NO LIVE CLOSED-TRADE SAMPLE"}</strong></div>
      </div>
    </div>
  );
}

export default function Performance() {
  const [tab, setTab] = useState<PerformanceTab>("overview");
  const { data, loading, error } = useLiveTrading(5000);
  const feed = data as ExtendedFeed | null;
  const markets = feed?.market_performance;
  const equities = markets?.equities;
  const crypto = markets?.crypto;
  const crrStudy = feed?.crypto_shadow_validation;
  const equityClosed = equities?.closed_trades ?? 0;
  const cryptoClosed = crypto?.closed_trades ?? 0;
  const crrExits = crrStudy?.counts?.exits ?? 0;
  const crrDays = crrStudy?.counts?.independent_day_blocks ?? 0;

  return (
    <div className="company-page market-performance-page">
      <section className="company-page-hero performance-company-hero">
        <span>LIVE PERFORMANCE EVIDENCE</span>
        <h1>Separate markets. Separate records.</h1>
        <p>Equities and crypto are presented as distinct live market lanes. Their realized curves are not combined, and simulated or replay results never enter the live record.</p>
        <div className="performance-company-status">
          <div><small>PUBLIC FEED</small><strong>{error ? "UNAVAILABLE" : loading ? "CONNECTING" : feed?.state || "UNAVAILABLE"}</strong></div>
          <div><small>EQUITIES</small><strong>{equityClosed} CLOSED</strong></div>
          <div><small>CRYPTO LIVE</small><strong>{cryptoClosed ? cryptoClosed + " CLOSED" : "AWAITING SAMPLE"}</strong></div>
          <div><small>CRR SHADOW</small><strong>{crrExits} / 30 · {crrDays} / 20 DAYS</strong></div>
        </div>
      </section>

      <section className="performance-market-shell">
        <nav className="performance-market-tabs" aria-label="Performance sections">
          {tabs.map(([id, label, hint]) => (
            <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => setTab(id)} aria-pressed={tab === id}>
              <strong>{label}</strong><small>{hint}</small>
            </button>
          ))}
        </nav>

        <div className="performance-market-content">
          {tab === "overview" && (
            <div className="performance-overview">
              <header><span>MARKET-LANE OVERVIEW</span><h2>The account may be shared. The evidence is not.</h2><p>Market-specific curves describe realized live-trade P&L for each lane normalized against the shared current performance-epoch denominator. They are not separate account-equity curves.</p></header>
              <div className="market-overview-cards">
                <button type="button" onClick={() => setTab("equities")}>
                  <span>US EQUITIES</span><strong>{equityClosed ? human(equities?.sample_state) : "AWAITING LIVE SAMPLE"}</strong>
                  <b>{equityClosed} closed live trades</b><MarketOverviewSparkline rows={equities?.curve || []} label="Equities" /><p>{equityClosed ? "Measured broker-derived lane evidence is available." : "No measured live sample exists."}</p><i>OPEN EQUITIES →</i>
                </button>
                <button type="button" onClick={() => setTab("crypto")}>
                  <span>CRYPTO</span><strong>{cryptoClosed ? human(crypto?.sample_state) : "LIVE MONEY AWAITING SAMPLE"}</strong>
                  <b>{cryptoClosed} live closes · CRR shadow {crrExits}/30 outcomes</b><MarketOverviewSparkline rows={crypto?.curve || []} label="Crypto live" /><p>{crrStudy ? "Live-money performance remains separate from the continuously updating CRR-001 shadow validation study." : "The live lane is ready; the CRR public study feed is connecting."}</p><i>OPEN CRYPTO →</i>
                </button>
              </div>
              <div className="performance-overview-boundary">
                <strong>LIVE ONLY.</strong>
                <p>Strategy research, paper trading, shadow evaluation, VELUM replay, historical simulation, and counterfactual results stay outside these curves.</p>
              </div>
            </div>
          )}

          {tab === "equities" && <MarketLane title="Equities" eyebrow="LIVE EQUITIES PERFORMANCE" performance={equities} />}
          {tab === "crypto" && <MarketLane title="Crypto" eyebrow="LIVE CRYPTO PERFORMANCE" performance={crypto} />}
          {tab === "validation" && <CrrValidationStudy study={crrStudy} />}

          {tab === "methodology" && (
            <div className="performance-methodology">
              <header><span>METHODOLOGY</span><h2>What the percentages mean.</h2></header>
              <div className="performance-method-grid-v3">
                <article><span>01 / SOURCE</span><strong>Canonical closed live positions</strong><p>Lane attribution is resolved from the canonical decision and order chain, not guessed in the browser.</p></article>
                <article><span>02 / DENOMINATOR</span><strong>Shared performance-epoch baseline</strong><p>Lane realized return is cumulative lane realized P&L inside the current performance epoch divided by the shared account epoch baseline.</p></article>
                <article><span>03 / NOT ACCOUNT EQUITY</span><strong>Market-lane performance curve</strong><p>Because equities and crypto can share one brokerage account, neither lane curve is presented as a separately funded account-equity curve.</p></article>
                <article><span>04 / CASH FLOWS</span><strong>Owner cash movement is not performance</strong><p>External deposits or withdrawals define explicit epoch boundaries so they are not represented as trading profit or loss.</p></article>
                <article><span>05 / SAMPLE STATE</span><strong>No sample means no return</strong><p>A lane with zero closed live trades reports AWAITING LIVE SAMPLE. It does not display 0.00% as though zero return had been measured.</p></article>
                <article><span>06 / EXCLUSIONS</span><strong>Research stays research</strong><p>Replay, simulation, paper, shadow, development, and counterfactual results are excluded from live performance.</p></article>
              </div>
              <div className="performance-formula"><span>LANE REALIZED RETURN</span><code>Σ realized P&amp;L for lane during epoch / shared epoch baseline equity × 100</code></div>
            </div>
          )}

          {tab === "boundaries" && (
            <div className="performance-boundaries-v3">
              <header><span>PUBLIC / PRIVATE CONTRACT</span><h2>Enough evidence to inspect. Not enough data to reconstruct private execution.</h2></header>
              <div className="performance-boundary-columns">
                <article><span>PUBLIC</span><ul><li>Normalized realized percentages</li><li>Aggregate counts</li><li>Sample classification</li><li>Strategy identities</li><li>First/latest live trade dates</li><li>Sanitized methodology</li><li>System status</li></ul></article>
                <article><span>PRIVATE</span><ul><li>Account equity dollars</li><li>Cash and buying power</li><li>Deposit/withdrawal amounts</li><li>Symbols in private execution history</li><li>Order prices, fills, and quantities</li><li>Sensitive strategy thresholds</li><li>Private infrastructure URLs and credentials</li></ul></article>
                <article><span>NEVER MIXED INTO LIVE</span><ul><li>VELUM replay</li><li>Historical simulations</li><li>Paper trades</li><li>Shadow scoring</li><li>Development experiments</li><li>Counterfactual alternatives</li></ul></article>
              </div>
              {(markets?.limitations || []).length ? <div className="performance-limitations">{markets?.limitations?.map((item) => <p key={item}>{item}</p>)}</div> : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
