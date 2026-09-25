import type { PublicEquityRow } from "../lib/data";

function labelMoney(value: number) {
  return "$" + value.toFixed(2);
}

function timeLabel(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function EquityChart({
  rows,
  compact = false
}: {
  rows: PublicEquityRow[];
  compact?: boolean;
}) {
  const clean = rows
    .map((row) => ({ at: row.observed_at, value: Number(row.equity) }))
    .filter((row) => Number.isFinite(row.value));

  if (!clean.length) {
    return <div className="chart-empty">No canonical equity snapshots yet.</div>;
  }

  let low = Math.min(...clean.map((row) => row.value));
  let high = Math.max(...clean.map((row) => row.value));

  if (high === low) {
    high += 0.05;
    low -= 0.05;
  }

  const width = 800;
  const height = compact ? 170 : 300;
  const left = compact ? 12 : 56;
  const right = 14;
  const top = 18;
  const bottom = compact ? 16 : 36;
  const x = (index: number) =>
    clean.length === 1
      ? width / 2
      : left + (index * (width - left - right)) / (clean.length - 1);
  const y = (value: number) =>
    top + ((high - value) * (height - top - bottom)) / (high - low);
  const points = clean
    .map((point, index) => x(index).toFixed(1) + "," + y(point.value).toFixed(1))
    .join(" ");
  const last = clean[clean.length - 1];
  const first = clean[0];

  return (
    <svg
      className={compact ? "equity-chart compact" : "equity-chart"}
      viewBox={"0 0 " + width + " " + height}
      role="img"
      aria-label={
        "Canonical account equity from " +
        timeLabel(first.at) +
        " to " +
        timeLabel(last.at) +
        ", " +
        clean.length +
        " persisted snapshots"
      }
    >
      {!compact && (
        <>
          <g className="chart-grid">
            <line x1={left} x2={width - right} y1="70" y2="70" />
            <line x1={left} x2={width - right} y1="140" y2="140" />
            <line x1={left} x2={width - right} y1="210" y2="210" />
          </g>
          <g className="chart-labels">
            <text x="4" y={top + 5}>{labelMoney(high)}</text>
            <text x="4" y={height - bottom}>{labelMoney(low)}</text>
            <text x={left} y={height - 8}>{timeLabel(first.at)}</text>
            <text x={width - right} y={height - 8} textAnchor="end">{timeLabel(last.at)}</text>
            <text x={width - right} y={top + 5} textAnchor="end">{clean.length} snapshots</text>
          </g>
        </>
      )}
      <polyline className="equity-shadow" points={points} />
      <polyline className="equity-line" points={points} />
      <circle cx={x(clean.length - 1)} cy={y(last.value)} r={compact ? 4 : 5} />
    </svg>
  );
}
