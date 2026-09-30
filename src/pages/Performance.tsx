import { useMemo, useState } from "react";
import type { LiveTradingFeed, PublicPerformancePoint } from "../lib/data";
import { useLiveTrading } from "../hooks/useLiveTrading";

type PerformanceTab = "overview" | "equities" | "crypto" | "methodology" | "boundaries";

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
};

const tabs: [PerformanceTab, string, string][] = [
  ["overview", "Overview", "Separate live market lanes"],
  ["equities", "Equities", "Closed live equity trades"],
  ["crypto", "Crypto", "Closed live crypto trades"],
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
  const equityClosed = equities?.closed_trades ?? 0;
  const cryptoClosed = crypto?.closed_trades ?? 0;

  return (
    <div className="company-page market-performance-page">
      <section className="company-page-hero performance-company-hero">
        <span>LIVE PERFORMANCE EVIDENCE</span>
        <h1>Separate markets. Separate records.</h1>
        <p>Equities and crypto are presented as distinct live market lanes. Their realized curves are not combined, and simulated or replay results never enter the live record.</p>
        <div className="performance-company-status">
          <div><small>PUBLIC FEED</small><strong>{error ? "UNAVAILABLE" : loading ? "CONNECTING" : feed?.state || "UNAVAILABLE"}</strong></div>
          <div><small>EQUITIES</small><strong>{equityClosed} CLOSED</strong></div>
          <div><small>CRYPTO</small><strong>{cryptoClosed ? cryptoClosed + " CLOSED" : "AWAITING SAMPLE"}</strong></div>
          <div><small>METHOD</small><strong>{markets?.methodology_version || "PUBLIC-MARKET-PERFORMANCE-v1"}</strong></div>
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
                  <span>CRYPTO</span><strong>{cryptoClosed ? human(crypto?.sample_state) : "AWAITING LIVE SAMPLE"}</strong>
                  <b>{cryptoClosed} closed live trades</b><MarketOverviewSparkline rows={crypto?.curve || []} label="Crypto" /><p>{cryptoClosed ? "Measured broker-derived lane evidence is available." : "The interface is live-data ready; no closed live crypto sample is shown until one exists."}</p><i>OPEN CRYPTO →</i>
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
