import { Component, useEffect, useState, type ReactNode } from "react";
import { forecastCurrent, type LiveState, type Point, type Forecast } from "../lib/command-live-events";
import "../styles/command-live.css";

function value(v: unknown, digits = 2) { return typeof v === "number" && Number.isFinite(v) ? v.toFixed(digits) : "—"; }

class ChartBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() { return this.state.failed ? <p>Chart unavailable. RHEN observation continues.</p> : this.props.children; }
}

function Candles({points, forecast, now}: {points: Point[]; forecast?: Forecast; now: number}) {
  const bars = points.filter(p => [p.open,p.high,p.low,p.close].every(v => typeof v === "number" && Number.isFinite(v))).slice(-120);
  if (!bars.length) return <div className="command-live-empty">No authoritative candles available.</div>;
  const f = forecast && forecastCurrent(forecast, now) ? forecast : undefined;
  const prices = [...bars.flatMap(b => [b.low!,b.high!]), ...(f ? [...f.central_path,...(f.lower_path||[]),...(f.upper_path||[])].map(p => p.value) : [])];
  const lo = Math.min(...prices), hi = Math.max(...prices), pad = Math.max((hi-lo)*.07, .01);
  const start = Date.parse(bars[0].timestamp), end = Math.max(Date.parse(bars.at(-1)!.timestamp)+60000, f ? Date.parse(f.expires_at) : 0);
  const x = (timestamp: string) => 50+(Date.parse(timestamp)-start)/Math.max(end-start,60000)*900;
  const y = (price: number) => 260-(price-lo+pad)/(hi-lo+2*pad)*230;
  const path = (p: {timestamp: string; value: number}[]) => p.map((point,i) => `${i ? "L" : "M"}${x(point.timestamp)},${y(point.value)}`).join(" ");
  const band = f?.lower_path && f.upper_path ? path(f.upper_path)+" "+path([...f.lower_path].reverse()).replace(/^M/,"L")+" Z" : null;
  return <>
    <svg viewBox="0 0 1000 310" role="img" aria-label="Observed candles with exact source timestamps and explicit gaps">
      <text x="4" y="32">{value(hi+pad)}</text><text x="4" y="264">{value(lo-pad)}</text>
      {bars.map((b,i) => <g key={b.timestamp} className={b.close! >= b.open! ? "up" : "down"}>
        <title>{`${b.timestamp} · ${b.source} · OBSERVED · ${b.session} · ${b.complete ? "completed" : "forming"} · O ${b.open} H ${b.high} L ${b.low} C ${b.close} V ${b.volume ?? "unavailable"}`}</title>
        <line x1={x(b.timestamp)} x2={x(b.timestamp)} y1={y(b.high!)} y2={y(b.low!)} />
        <rect x={x(b.timestamp)-2} y={Math.min(y(b.open!),y(b.close!))} width="4" height={Math.max(1,Math.abs(y(b.open!)-y(b.close!)))} />
        {i > 0 && Date.parse(b.timestamp)-Date.parse(bars[i-1].timestamp)>90000 && <text x={x(b.timestamp)-12} y="287">gap</text>}
      </g>)}
      {band && <path d={band} className="forecast-band" />}
      {f && <path d={path(f.central_path)} className="forecast-path"><title>{`FORECAST · ${f.model_version} · ${f.methodology_version} · expires ${f.expires_at}`}</title></path>}
      <text x="50" y="307">{bars[0].timestamp}</text><text x="650" y="307">{bars.at(-1)!.timestamp}</text>
    </svg>
    <small>OBSERVED · {bars.at(-1)!.source} · gaps preserved · {bars.at(-1)!.quality_state}</small>
    {f && <p>FORECAST · {f.model_version} · horizon {f.horizon_seconds}s · uncertainty {f.uncertainty_state}</p>}
  </>;
}

function Sparkline({points}: {points: Point[]}) {
  const data = points.filter(p => typeof p.value === "number").slice(-120);
  if (data.length < 2) return <span>Awaiting real observations</span>;
  const low = Math.min(...data.map(p=>p.value!)), high = Math.max(...data.map(p=>p.value!));
  const start = Date.parse(data[0].timestamp), end = Date.parse(data.at(-1)!.timestamp);
  return <svg viewBox="0 0 120 25" role="img" aria-label="Derived midpoint from observed quotes"><polyline points={data.map(p=>`${(Date.parse(p.timestamp)-start)/Math.max(1,end-start)*120},${24-(p.value!-low)/Math.max(.0001,high-low)*23}`).join(" ")} /><title>DERIVED · quote-mid-v1 · {data.at(-1)!.source}</title></svg>;
}

export default function CommandLiveMarket({state}: {state: LiveState}) {
  const [selected, setSelected] = useState("");
  const [view, setView] = useState("LIVE");
  const [paused, setPaused] = useState<LiveState | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [now,setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(timer); },[]);
  const rows = Object.values(state.scanner);
  const symbol = selected || rows[0]?.symbol || "";
  const shown = paused || state;
  const forecast = shown.forecasts[symbol];
  const currentForecast = forecast && forecastCurrent(forecast,now) ? forecast : undefined;
  return <section className="command-live" aria-label="RHEN 4.4 shadow visual intelligence">
    <header><div><small>RHEN 4.4 / SHADOW OBSERVATION</small><h2>Market fabric</h2></div><strong>{state.stale ? "STALE / VALUES FROZEN" : String(state.system.connection_state || "WARMING")}</strong></header>
    <p>4.3 remains the trading champion. This surface has no broker-write authority.</p>
    <nav aria-label="Live visual views">{["LIVE","SYMBOL","FORECAST","PERFORMANCE","SYSTEM","REPLAY"].map(v => <button type="button" key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v}</button>)}</nav>
    {(state.stale || state.error) && <p role="status">{state.error || "Live data stale"}</p>}
    <div className="command-live-strip"><span>OPERATIONAL · {String(state.system.session || "unavailable")}</span><span>Feed {String(state.system.feed || "unavailable")}</span><span>Coverage {String(state.system.subscribed_symbols ?? 0)}/{String(state.system.intended_symbols ?? 0)}</span><span>{String(state.system.capability || "unknown")}</span><span>Entry authority: disabled</span></div>
    {["LIVE","SYMBOL","FORECAST"].includes(view) && <>
      <div className="command-live-controls"><label>Symbol <select value={symbol} onChange={e=>setSelected(e.target.value)}>{rows.map(row=><option key={row.symbol}>{row.symbol}</option>)}</select></label><button type="button" onClick={()=>setPaused(paused ? null : state)}>{paused ? "Follow live" : "Pause visual following"}</button><label><input type="checkbox" checked={showForecast} onChange={e=>setShowForecast(e.target.checked)} /> Show forecast</label></div>
      <ChartBoundary key={symbol}><Candles points={shown.series["candles:"+symbol] || []} forecast={showForecast ? currentForecast : undefined} now={now} /></ChartBoundary>
      {view === "FORECAST" && <p>{currentForecast ? `Issued ${currentForecast.issued_at}; expires ${currentForecast.expires_at}; ${currentForecast.methodology_version}` : "No current versioned NOSTRA forecast. Projection unavailable."}</p>}
      <div className="command-live-grid">{Object.values(shown.scanner).map(row=>{
        const age = row.quote_source_at ? now-Date.parse(row.quote_source_at) : null;
        const stale = state.stale || age === null || age > 45000;
        return <button type="button" key={row.symbol} onClick={()=>setSelected(row.symbol)} aria-pressed={symbol===row.symbol}>
          <strong>{row.symbol}<b>{value(row.mid)}</b></strong><Sparkline points={shown.series["mid:"+row.symbol] || []} />
          <span>{stale ? "STALE" : row.evaluable ? "EVALUABLE" : "BLOCKED"} · {row.candidate_state}</span><span>Spread {value(row.spread_bps)} bp · quote {age===null ? "unavailable" : `${Math.max(0,age).toFixed(0)} ms`}</span><span>{row.rejection_code || "No rejection"}</span><small>{row.signal_reason}</small>
        </button>;
      })}</div>
      <h3>Broker evidence tape / OBSERVED</h3>{shown.executions.length ? shown.executions.slice(-20).reverse().map(e=><p key={e.event_id}>{e.timestamp} · {e.symbol} · {e.event_type} · {e.quantity ?? "—"} @ {e.price ?? "—"} · {e.order_ref}</p>) : <p>No broker events observed by this shadow runtime.</p>}
    </>}
    {view === "SYSTEM" && <dl>{Object.entries(state.system).map(([key,v])=><div key={key}><dt>{key}</dt><dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd></div>)}</dl>}
    {view === "PERFORMANCE" && <p>Reconciled account/performance projection is pending canonical ledger integration. Existing Command performance remains authoritative.</p>}
    {view === "REPLAY" && <p>VELUM visual contract is implemented behind validation gates. No replay artifact is loaded; no synthetic replay is shown.</p>}
  </section>;
}
