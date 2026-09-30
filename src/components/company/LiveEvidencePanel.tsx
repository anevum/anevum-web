import { Link } from "react-router-dom";
import type { PublicMarketLanePerformance, PublicPerformancePoint } from "../../lib/data";

function formatPct(value?: number | null, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return (value > 0 ? "+" : "") + value.toFixed(digits) + "%";
}

function pathFor(points: PublicPerformancePoint[], width = 640, height = 220) {
  const clean = points
    .map((point) => ({ value: Number(point.return_pct) }))
    .filter((point) => Number.isFinite(point.value));
  if (clean.length < 2) return null;
  const values = clean.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = Math.max(max - min, 0.05);
  const pad = span * 0.18;
  const low = min - pad;
  const high = max + pad;
  const range = Math.max(high - low, 0.001);
  const coords = clean.map((point, index) => ({
    x: (index / Math.max(clean.length - 1, 1)) * width,
    y: height - ((point.value - low) / range) * height
  }));
  return {
    d: coords.map((point, index) => (index === 0 ? "M" : "L") + point.x.toFixed(2) + " " + point.y.toFixed(2)).join(" "),
    latest: clean[clean.length - 1]?.value ?? null
  };
}

export default function LiveEvidencePanel({
  equities,
  crypto,
  events60m,
  state,
  activity
}: {
  equities?: PublicMarketLanePerformance;
  crypto?: PublicMarketLanePerformance;
  events60m?: number;
  state?: string;
  activity?: { at?: string | null; count?: number | string }[];
}) {
  const equityPath = pathFor(equities?.curve || []);
  const activityValues = (activity || []).slice(-18).map((point) => Number(point.count || 0));
  const maxActivity = Math.max(...activityValues, 1);

  return (
    <div className="live-evidence-deck">
      <article className="live-evidence-primary">
        <header>
          <div><span>LIVE EQUITIES</span><strong>{equities?.closed_trades ?? 0} CLOSED TRADES</strong></div>
          <b>{equityPath ? formatPct(equities?.realized_return_pct) : "AWAITING CURVE"}</b>
        </header>
        <div className="live-evidence-chart">
          {equityPath ? (
            <svg viewBox="0 0 640 220" preserveAspectRatio="none" role="img" aria-label="Equities normalized realized live-trade curve">
              <defs>
                <linearGradient id="live-equity-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity=".22" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="live-evidence-fill" d={equityPath.d + " L640 220 L0 220 Z"} />
              <path className="live-evidence-line" d={equityPath.d} />
            </svg>
          ) : (
            <div className="live-evidence-empty"><span>NO MEASURED CURVE YET</span></div>
          )}
        </div>
        <footer>
          <div><span>WIN RATE</span><strong>{equities?.closed_trades ? formatPct(equities.win_rate_pct, 1) : "—"}</strong></div>
          <div><span>DRAWDOWN</span><strong>{equities?.closed_trades ? formatPct(equities.max_drawdown_pct, 2) : "—"}</strong></div>
          <div><span>SAMPLE</span><strong>{String(equities?.sample_state || "UNAVAILABLE").replaceAll("_", " ")}</strong></div>
        </footer>
      </article>

      <div className="live-evidence-side">
        <article className="live-activity-card">
          <header><span>SYSTEM ACTIVITY</span><b>{state || "UNAVAILABLE"}</b></header>
          <div className="live-activity-bars" aria-label="Recent public telemetry activity">
            {activityValues.length ? activityValues.map((value, index) => (
              <i key={index} style={{ height: Math.max(8, (value / maxActivity) * 100) + "%" }} />
            )) : <em>NO ACTIVITY SERIES</em>}
          </div>
          <footer><strong>{events60m ?? "—"}</strong><span>public-safe events / 60m</span></footer>
        </article>

        <article className="live-crypto-card">
          <span>LIVE CRYPTO</span>
          <strong>{crypto?.closed_trades ? formatPct(crypto.realized_return_pct) : "AWAITING LIVE SAMPLE"}</strong>
          <p>{crypto?.closed_trades ? String(crypto.closed_trades) + " closed live trades" : "0 closed live trades. Replay and research results are excluded."}</p>
          <Link to="/performance">Open performance record →</Link>
        </article>
      </div>
    </div>
  );
}
