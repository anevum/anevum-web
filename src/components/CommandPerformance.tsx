import { useMemo } from "react";
import type { PublicPerformance } from "../lib/data";

function pct(value?: number | null, digits = 2, signed = true) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = signed && value > 0 ? "+" : "";
  return sign + value.toFixed(digits) + "%";
}

function stateClass(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "";
  return value > 0 ? "positive" : value < 0 ? "negative" : "";
}

export default function CommandPerformance({
  performance,
  feedError
}: {
  performance?: PublicPerformance | null;
  feedError?: string;
}) {
  const chart = useMemo(() => {
    const clean = (performance?.curve || [])
      .map((row) => Number(row.return_pct))
      .filter((value) => Number.isFinite(value));
    if (clean.length < 2) return null;

    const min = Math.min(...clean, 0);
    const max = Math.max(...clean, 0);
    const range = Math.max(.2, max - min);
    const pad = Math.max(.08, range * .18);
    const low = min - pad;
    const high = max + pad;
    const span = Math.max(.001, high - low);
    const points = clean.map((value, index) => {
      const x = (index / (clean.length - 1)) * 1000;
      const y = 190 - ((value - low) / span) * 170;
      return x.toFixed(2) + "," + y.toFixed(2);
    }).join(" ");
    const zeroY = 190 - ((0 - low) / span) * 170;
    return { points, zeroY: Math.max(15, Math.min(190, zeroY)) };
  }, [performance?.curve]);

  const sample = String(performance?.sample_state || "UNAVAILABLE").replaceAll("_", " ");

  return (
    <article className="command-panel command-view-trading command-panel-public-performance">
      <header>
        <div>
          <span>PUBLIC PERFORMANCE / AUTO-SYNC</span>
          <strong>{performance?.methodology_version || "PUBLIC-PERFORMANCE-v2"}</strong>
        </div>
        <small>{feedError || sample}</small>
      </header>

      <div className="command-performance-body">
        <div className="command-performance-chart">
          <div className="command-performance-chart-head">
            <div>
              <span>TRACKED ACCOUNT</span>
              <strong className={stateClass(performance?.account_return_pct)}>{pct(performance?.account_return_pct)}</strong>
            </div>
            <div>
              <span>RHEN REALIZED</span>
              <strong className={stateClass(performance?.realized_return_pct)}>{pct(performance?.realized_return_pct)}</strong>
            </div>
          </div>
          {chart ? (
            <svg viewBox="0 0 1000 205" preserveAspectRatio="none" role="img" aria-label="RHEN normalized public performance curve">
              <line x1="0" x2="1000" y1={chart.zeroY} y2={chart.zeroY} className="command-performance-zero" />
              <polyline points={chart.points} className="command-performance-line" />
            </svg>
          ) : (
            <div className="command-empty">Normalized live performance will appear when enough public snapshots exist.</div>
          )}
        </div>

        <div className="command-performance-metrics">
          <div><span>MAX DRAWDOWN</span><strong>{pct(performance?.max_drawdown_pct, 2, false)}</strong></div>
          <div><span>LIVE TRADES</span><strong>{performance?.closed_trades ?? "—"}</strong><small>{performance?.wins ?? "—"} W / {performance?.losses ?? "—"} L</small></div>
          <div><span>WIN RATE</span><strong>{pct(performance?.win_rate_pct, 1, false)}</strong></div>
          <div><span>SESSIONS</span><strong>{performance?.trading_sessions ?? "—"}</strong><small>{sample}</small></div>
        </div>
      </div>
      <footer className="command-performance-footer">
        <span>Durable measured curve · public feed refreshes about every 3–5 seconds; chart points change only when new source evidence exists</span>
      </footer>
    </article>
  );
}
