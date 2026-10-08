import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveTrading } from "../hooks/useLiveTrading";

function pct(value?: number | null, digits = 2, signed = true) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = signed && value > 0 ? "+" : "";
  return sign + value.toFixed(digits) + "%";
}

function ageText(value?: string | null, now = Date.now()) {
  if (!value) return "awaiting";
  const ms = now - new Date(value).getTime();
  if (!Number.isFinite(ms)) return "unknown";
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return seconds + "s ago";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  return Math.floor(seconds / 3600) + "h ago";
}

export default function PublicEvidenceSnapshot({ compact = false }: { compact?: boolean }) {
  const { data, loading, error, now } = useLiveTrading(30000);
  const performance = data?.performance;

  const chart = useMemo(() => {
    const rows = (performance?.curve || [])
      .map((row) => ({ at: row.at || "", value: Number(row.return_pct) }))
      .filter((row) => Number.isFinite(row.value));
    if (rows.length < 2) return null;
    const values = rows.map((row) => row.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const pad = Math.max(.08, (max - min || .2) * .18);
    const low = min - pad;
    const high = max + pad;
    const span = Math.max(.001, high - low);
    const points = rows.map((row, index) => {
      const x = (index / (rows.length - 1)) * 1000;
      const y = 210 - ((row.value - low) / span) * 180;
      return x.toFixed(2) + "," + y.toFixed(2);
    }).join(" ");
    const zeroY = 210 - ((0 - low) / span) * 180;
    return { points, zeroY: Math.max(12, Math.min(210, zeroY)) };
  }, [performance?.curve]);

  const state = error ? "DEGRADED" : loading && !data ? "CONNECTING" : String(data?.state || data?.systems?.RHEN?.runtime_state || "OBSERVING").replaceAll("_", " ").toUpperCase();
  const freshness = ageText(data?.generated_at, now);

  return (
    <section className={"truth-snapshot " + (compact ? "compact" : "")} aria-label="RHEN public evidence snapshot">
      <header className="truth-snapshot-head">
        <div><span>RHEN / PUBLIC EVIDENCE</span><strong>Real observations only</strong></div>
        <div className="truth-snapshot-state"><i className={error ? "degraded" : "live"} />{state}<small>{freshness}</small></div>
      </header>

      <div className="truth-chart-wrap">
        <div className="truth-chart-meta">
          <div><span>NORMALIZED ACCOUNT RETURN</span><strong>{pct(performance?.account_return_pct)}</strong></div>
          <div><span>REALIZED RETURN</span><strong>{pct(performance?.realized_return_pct)}</strong></div>
        </div>
        <div className="truth-chart">
          {chart ? (
            <svg viewBox="0 0 1000 225" preserveAspectRatio="none" role="img" aria-label="RHEN normalized public performance curve">
              <line x1="0" x2="1000" y1={chart.zeroY} y2={chart.zeroY} className="truth-chart-zero" />
              <polyline points={chart.points} className="truth-chart-line" />
            </svg>
          ) : (
            <div className="truth-empty">{error || "Collecting enough public observations to draw the curve."}</div>
          )}
        </div>
      </div>

      <div className="truth-metrics">
        <div><span>MAX DRAWDOWN</span><strong>{pct(performance?.max_drawdown_pct, 2, false)}</strong></div>
        <div><span>CLOSED TRADES</span><strong>{performance?.closed_trades ?? "—"}</strong><small>{performance?.wins ?? "—"} W / {performance?.losses ?? "—"} L</small></div>
        <div><span>WIN RATE</span><strong>{pct(performance?.win_rate_pct, 1, false)}</strong></div>
        <div><span>SESSIONS</span><strong>{performance?.trading_sessions ?? "—"}</strong><small>{String(performance?.sample_state || "AWAITING").replaceAll("_", " ")}</small></div>
      </div>

      <footer className="truth-snapshot-foot">
        <span>{performance?.basis || "Normalized public-safe RHEN evidence. Protected broker state remains private."}</span>
        <Link to="/products/rhen/evidence">Inspect evidence →</Link>
      </footer>
    </section>
  );
}
