import { useMemo, useState } from "react";
import type { LiveState, Point } from "../lib/command-live-events";
import { ageText } from "../lib/system-display";
import "../styles/rhen-realtime.css";

type BrokerAccountObservation = {
  equity?: number;
  cash?: number | null;
  buying_power?: number | null;
  observed_at?: string;
  source?: string;
  quality_state?: string;
  sampling_seconds?: number;
};

function numeric(value: unknown, digits = 2): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-US", {minimumFractionDigits: digits, maximumFractionDigits: digits})
    : "—";
}

function timeStamp(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Unknown source time";
  return new Date(value).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"});
}

function observedRecently(at: string | null | undefined, now: number, maxMs: number) {
  if (!at) return false;
  const age = now - Date.parse(at);
  return Number.isFinite(age) && age >= -2000 && age <= maxMs;
}

function MeasuredCurve({
  points,
  label,
  breakAfterMs
}: {
  points: readonly Point[];
  label: string;
  breakAfterMs: number;
}) {
  const chart = useMemo(() => {
    const observed = points
      .filter(p =>
        (p.provenance === "OBSERVED" || p.provenance === "DERIVED") &&
        Number.isFinite(p.value) && Number.isFinite(Date.parse(p.timestamp)) &&
        Date.parse(p.timestamp) <= Date.now() + 2000)
      .slice(-500) as (Point & {value: number})[];
    if (!observed.length) return null;
    const times = observed.map(row => Date.parse(row.timestamp));
    const values = observed.map(row => row.value);
    const first = times[0];
    const last = times[times.length - 1];
    const floor = Math.min(...values), ceiling = Math.max(...values);
    const padding = Math.max(.001, (ceiling - floor) * .15, Math.abs(ceiling) * .0005);
    const scale = Math.max(.00001, ceiling - floor + padding * 2);
    const x = (timestamp: number) => ((timestamp - first) / Math.max(1, last - first)) * 1000;
    const y = (value: number) => 175 - ((value - floor + padding) / scale) * 155;
    const segments: string[] = [];
    let current: string[] = [];
    for (let i = 0; i < observed.length; i++) {
      if (i && times[i] - times[i-1] > breakAfterMs) {
        if (current.length > 1) segments.push(current.join(" "));
        current = [];
      }
      current.push(x(times[i]).toFixed(2) + "," + y(values[i]).toFixed(2));
    }
    if (current.length > 1) segments.push(current.join(" "));
    return {
      segments,
      dots: observed.length <= 1 ? [{x:x(times[0]),y:y(values[0])}] : [],
      first: observed[0].timestamp,
      last: observed[observed.length-1].timestamp,
      count: observed.length
    };
  }, [points, breakAfterMs]);

  if (!chart) return <p className="rhen-realtime-empty">No measured source samples yet. The chart will not invent points.</p>;
  return <>
    <svg className="rhen-realtime-chart" viewBox="0 0 1000 200" preserveAspectRatio="none" role="img" aria-label={label}>
      {chart.segments.map((segment, i) => <polyline key={i} points={segment} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />)}
      {chart.dots.map((dot, i) => <circle key={i} cx={dot.x} cy={dot.y} r="5" fill="currentColor" />)}
    </svg>
    <div className="rhen-realtime-range"><span>{timeStamp(chart.first)}</span><span>{chart.count} actual samples; gaps preserved</span><span>{timeStamp(chart.last)}</span></div>
  </>;
}

export default function RhenRealtimePanel({state}: {state: LiveState}) {
  const [selected, setSelected] = useState("");
  const now = Date.now();
  const rows = Object.values(state.scanner);
  const symbol = rows.find(row => row.symbol === selected)?.symbol || rows[0]?.symbol || "";
  const instrument = rows.find(row => row.symbol === symbol);
  const quoteFresh = Boolean(
    instrument && !state.stale &&
    observedRecently(instrument.quote_source_at, now, 45000)
  );
  const account = state.system.account_observation as BrokerAccountObservation | undefined;
  const accountFresh = Boolean(
    account && !state.stale &&
    observedRecently(account.observed_at, now, 40000) &&
    state.system.account_state === "HEALTHY"
  );
  const liveSource = String(state.system.connection_state || "CONNECTING");
  const sourceFeed = String(state.system.market_feed || "UNKNOWN").toUpperCase();
  const session = String(state.system.session || "UNKNOWN");
  const brokerStatus = String(state.system.broker_stream_state || "UNAVAILABLE");

  return <section className="rhen-realtime" aria-label="Authenticated RHEN real-time broker observations">
    <header className="rhen-realtime-heading">
      <div>
        <small>RHEN / PRIVATE ACCOUNT / READ-ONLY SOURCE</small>
        <h2>Live observations</h2>
        <p>Market quotes and broker order notifications arrive by WebSocket. Account equity is sampled from Alpaca REST and never inferred from quote movement.</p>
      </div>
      <strong className={state.stale ? "is-stale" : "is-connected"}>
        {state.stale ? "DISCONNECTED / STALE" : "SOCKET CONNECTED"}
      </strong>
    </header>
    {state.error && <p role="status" className="rhen-realtime-error">{state.error}</p>}
    <div className="rhen-realtime-status">
      <div><small>MARKET SOURCE</small><strong>{liveSource}</strong><span>{sourceFeed} · {session}</span></div>
      <div><small>BROKER ORDER UPDATES</small><strong>{brokerStatus}</strong><span>Alpaca trade_updates · not canonical until reconciled</span></div>
      <div><small>ACCOUNT SAMPLE</small><strong>{accountFresh ? "FRESH" : "STALE / UNAVAILABLE"}</strong><span>{account?.observed_at ? ageText(account.observed_at, now) : "No account sample"}</span></div>
      <div><small>QUOTE SUBSCRIPTIONS</small><strong>{String(state.system.subscribed_symbols ?? 0)} / {String(state.system.intended_symbols ?? rows.length)}</strong><span>Bounded watchlist; not RHEN's entire trading universe</span></div>
    </div>
    <div className="rhen-realtime-main">
      <article className="rhen-realtime-card">
        <div className="rhen-realtime-chart-head">
          <div>
            <small>MARKET / {sourceFeed} QUOTE MIDPOINT</small>
            <h3>{symbol || "Waiting for symbols"}</h3>
          </div>
          <div>
            <strong>{numeric(instrument?.mid)}</strong>
            <span>{quoteFresh ? "FRESH QUOTE" : "QUOTE STALE / MARKET QUIET"}</span>
          </div>
        </div>
        <MeasuredCurve points={state.series["mid:" + symbol] || []} breakAfterMs={120000} label="Timestamped market quote midpoints, with true gaps" />
        <div className="rhen-realtime-range">
          <span>Bid {numeric(instrument?.bid)} / Ask {numeric(instrument?.ask)}</span>
          <span>{instrument?.quote_source_at ? "Source: " + timeStamp(instrument.quote_source_at) + " · " + ageText(instrument.quote_source_at, now) : "No verified quote timestamp"}</span>
        </div>
        <div className="rhen-realtime-symbols" role="group" aria-label="Observed market symbols">
          {rows.map(row => {
            const fresh = !state.stale && observedRecently(row.quote_source_at, now, 45000);
            return <button key={row.symbol} type="button" className={row.symbol === symbol ? "active" : ""} onClick={() => setSelected(row.symbol)}>
              <b>{row.symbol}</b><strong>{numeric(row.mid)}</strong><span>{fresh ? "QUOTE FRESH" : "STALE / NO QUOTE"}</span>
            </button>;
          })}
        </div>
        <p className="rhen-realtime-method">These are actual time-stamped quote midpoints from the subscribed Alpaca feed, not a consolidated last-sale price. IEX is a single-venue feed. Empty periods remain empty.</p>
      </article>
      <article className="rhen-realtime-card">
        <div className="rhen-realtime-chart-head">
          <div>
            <small>BROKER / REPORTED ACCOUNT EQUITY</small>
            <h3>Measured equity</h3>
          </div>
          <div>
            <strong>{accountFresh ? "$" + numeric(account?.equity) : "—"}</strong>
            <span>{accountFresh ? "BROKER SAMPLE" : "LAST SAMPLE NOT CURRENT"}</span>
          </div>
        </div>
        <MeasuredCurve points={state.series["account:equity"] || []} breakAfterMs={120000} label="Timestamped Alpaca-reported account equity, sampled without synthetic prices" />
        <div className="rhen-realtime-range">
          <span>Cash {accountFresh && account?.cash != null ? "$" + numeric(account.cash) : "—"}</span>
          <span>Buying power {accountFresh && account?.buying_power != null ? "$" + numeric(account.buying_power) : "—"}</span>
        </div>
        <p className="rhen-realtime-method">Alpaca account values, sampled about every {account?.sampling_seconds ?? state.system.account_sample_interval_seconds ?? 10} seconds and after observed broker updates. This is not a tick-by-tick equity calculation or cash-flow-adjusted performance curve.</p>
        <h3>Broker event tape</h3>
        {state.executions.length ? (
          <div className="rhen-realtime-tape">
            {state.executions.slice(-12).reverse().map(row => (
              <div key={row.event_id}>
                <time>{timeStamp(row.timestamp)}</time>
                <strong>{row.symbol} · {row.event_type}</strong>
                <span>{row.quantity == null ? "—" : numeric(row.quantity, 4)} @ {row.price == null ? "—" : "$" + numeric(row.price)}</span>
              </div>
            ))}
          </div>
        ) : <p className="rhen-realtime-empty">No live broker order events observed since this observer started.</p>}
        <p className="rhen-realtime-method">Observed order notifications do not change RHEN's canonical position ledger. The independent reconciliation gate remains authoritative.</p>
      </article>
    </div>
  </section>;
}
