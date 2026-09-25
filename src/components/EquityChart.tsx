import type { PublicEquityRow } from "../lib/data";

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
    return <div className="chart-empty">No public equity snapshots yet.</div>;
  }

  let low = Math.min(...clean.map((row) => row.value));
  let high = Math.max(...clean.map((row) => row.value));

  if (high === low) {
    high += 0.05;
    low -= 0.05;
  }

  const width = 800;
  const height = compact ? 170 : 300;
  const left = 12;
  const right = 12;
  const top = 16;
  const bottom = compact ? 16 : 34;
  const x = (index: number) =>
    clean.length === 1 ? width / 2 : left + (index * (width - left - right)) / (clean.length - 1);
  const y = (value: number) =>
    top + ((high - value) * (height - top - bottom)) / (high - low);
  const points = clean
    .map((point, index) => x(index).toFixed(1) + "," + y(point.value).toFixed(1))
    .join(" ");
  const last = clean[clean.length - 1];

  return (
    <svg
      className={compact ? "equity-chart compact" : "equity-chart"}
      viewBox={"0 0 " + width + " " + height}
      role="img"
      aria-label="Public account equity over time"
    >
      {!compact && (
        <g className="chart-grid">
          <line x1="12" x2="788" y1="70" y2="70" />
          <line x1="12" x2="788" y1="140" y2="140" />
          <line x1="12" x2="788" y1="210" y2="210" />
        </g>
      )}
      <polyline className="equity-shadow" points={points} />
      <polyline className="equity-line" points={points} />
      <circle cx={x(clean.length - 1)} cy={y(last.value)} r={compact ? 4 : 5} />
    </svg>
  );
}
