import { motion } from "motion/react";
import { useMemo } from "react";
import { useLiveTrading } from "../hooks/useLiveTrading";

function timeLabel(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ageLabel(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "awaiting";
  if (value < 60) return Math.max(0, Math.round(value)) + "s ago";
  return Math.floor(value / 60) + "m ago";
}

function shortVersion(value?: string | null) {
  if (!value) return "UNVERSIONED";
  return String(value).replace(/^strategy[-_ ]?/i, "").toUpperCase();
}

export default function Live() {
  const { data, loading, error } = useLiveTrading(5000);
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
    <section className="compact-page workspace-screen live-screen">
      <header className="workspace-heading">
        <div>
          <p className="compact-eyebrow">RHEN / PUBLIC TELEMETRY</p>
          <h1>RHEN</h1>
        </div>
        <div className="workspace-heading-status">
          <span className={"runtime-state " + stateClass}><i />{state}</span>
          <div><small>VERSION</small><strong>{shortVersion(version)}</strong></div>
          <div><small>FRESHNESS</small><strong>{ageLabel(data?.freshness_seconds)}</strong></div>
        </div>
      </header>

      <div className="live-layout">
        <article className="compact-panel live-console-panel">
          <header className="compact-panel-head">
            <div><span>EVENT FEED</span><small>{error || "SANITIZED PUBLIC EVENTS"}</small></div>
            <b>REFRESH 5S</b>
          </header>
          <div className="live-console-body">
            <div className="console-line system-line">
              <time>{timeLabel(data?.generated_at)}</time>
              <strong>RHEN</strong>
              <p>Public telemetry connected. Sensitive trading data is excluded.</p>
            </div>
            {events.length ? events.slice(0, 11).map((event, index) => (
              <motion.div
                className={"console-line console-" + (event.kind || "system")}
                key={(event.at || "") + (event.type || "") + index}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <time>{timeLabel(event.at)}</time>
                <strong>{String(event.type || "system").toUpperCase()}</strong>
                <p>{event.label || "System telemetry event recorded."}</p>
              </motion.div>
            )) : (
              <div className="one-console-empty">{loading ? "Connecting…" : "No recent events."}</div>
            )}
          </div>
        </article>

        <aside className="live-side">
          <div className="live-metrics-grid">
            <article className="compact-stat"><span>EVENTS / 60M</span><strong>{telemetry?.events_60m ?? "—"}</strong></article>
            <article className="compact-stat"><span>SCANS / 10M</span><strong>{telemetry?.scan_events_10m ?? "—"}</strong></article>
            <article className="compact-stat"><span>SYMBOLS / 10M</span><strong>{telemetry?.symbols_10m ?? "—"}</strong></article>
            <article className="compact-stat"><span>RECON / 2H</span><strong>{telemetry?.reconciliations_2h ?? "—"}</strong></article>
          </div>

          <article className="compact-panel activity-compact">
            <header className="compact-panel-head">
              <div><span>ACTIVITY</span><small>LAST 60 MINUTES</small></div>
              <b>{telemetry?.events_60m ?? "—"}</b>
            </header>
            <div className="compact-activity-bars">
              {activity.length ? activity.map((row, index) => {
                const count = Number(row.count) || 0;
                const height = Math.max(8, (count / activityMax) * 100);
                return <i key={(row.at || "") + index} style={{ height: height + "%" }} />;
              }) : Array.from({ length: 8 }).map((_, index) => <i key={index} />)
              }
            </div>
          </article>

          <article className="compact-panel disclosure-card">
            <span>PUBLIC BOUNDARY</span>
            <p>
              Runtime state and aggregate activity are public. Account value, positions, symbols,
              prices, trade history, P&amp;L, strategy thresholds, and risk parameters are not.
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}
