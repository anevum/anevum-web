import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { forecastCurrent, sourceHistoryValid, scannerFreshness, type LiveState, type Point, type Forecast, type ExecutionMarker } from "../lib/command-live-events";
import "../styles/command-live.css";
import { currentRhenRelease } from "../data/releases";

function value(v: unknown, digits = 2) { return typeof v === "number" && Number.isFinite(v) ? v.toFixed(digits) : "—"; }

class ChartBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() { return this.state.failed ? <p>Chart unavailable. RHEN observation continues.</p> : this.props.children; }
}

type BrokerOverlay = {symbol: string; order_ref?: string; kind: string; value: number; observed_at: string; provenance: string; source: string};
function Candles({points, forecast, now, windowSize, vwap, executions, overlays}: {points: Point[]; forecast?: Forecast; now: number; windowSize: number; vwap: Point[]; executions: ExecutionMarker[]; overlays: BrokerOverlay[]}) {
  const bars = points.filter(p => [p.open,p.high,p.low,p.close].every(v => typeof v === "number" && Number.isFinite(v))).slice(-windowSize);
  if (!bars.length) return <div className="command-live-empty">No authoritative candles available.</div>;
  const f = forecast && forecastCurrent(forecast, now) ? forecast : undefined;
  const first = Date.parse(bars[0].timestamp), last = Date.parse(bars.at(-1)!.timestamp)+60000;
  const within = (p: {timestamp: string}) => first <= Date.parse(p.timestamp) && Date.parse(p.timestamp) <= last;
  const line = vwap.filter(p=>within(p) && typeof p.value === "number");
  const fills = executions.filter(p=>within(p) && ["FILL","PARTIAL_FILL"].includes(p.event_type) && typeof p.price === "number" && Number.isFinite(p.price));
  const levels = overlays.filter(p=>p.provenance === "OBSERVED" && Number.isFinite(p.value) && 0 <= now-Date.parse(p.observed_at) && now-Date.parse(p.observed_at) <= 150000);
  const prices = [...bars.flatMap(b => [b.low!,b.high!]), ...line.map(p=>p.value!), ...fills.map(p=>p.price!), ...levels.map(p=>p.value), ...(f ? [...f.central_path,...(f.lower_path||[]),...(f.upper_path||[])].map(p => p.value) : [])];
  const lo = Math.min(...prices), hi = Math.max(...prices), pad = Math.max((hi-lo)*.07, .01);
  const start = Date.parse(bars[0].timestamp), end = Math.max(Date.parse(bars.at(-1)!.timestamp)+60000, f ? Date.parse(f.expires_at) : 0);
  const x = (timestamp: string) => 50+(Date.parse(timestamp)-start)/Math.max(end-start,60000)*900;
  const y = (price: number) => 260-(price-lo+pad)/(hi-lo+2*pad)*230;
  const path = (p: {timestamp: string; value: number}[]) => p.map((point,i) => `${i ? "L" : "M"}${x(point.timestamp)},${y(point.value)}`).join(" ");
  const band = f?.lower_path && f.upper_path ? path(f.upper_path)+" "+path([...f.lower_path].reverse()).replace(/^M/,"L")+" Z" : null;
  const maxVolume = Math.max(1,...bars.map(b=>b.volume ?? 0));
  return <>
    <svg viewBox="0 0 1000 380" role="img" aria-label="Observed candles, source volume, broker levels and real fill markers">
      <text x="4" y="32">{value(hi+pad)}</text><text x="4" y="264">{value(lo-pad)}</text>
      {bars.map((b,i) => <g key={b.timestamp} className={b.close! >= b.open! ? "up" : "down"}>
        <title>{`${b.timestamp} · ${b.source} · OBSERVED · ${b.session} · ${b.complete ? "completed" : "forming"} · O ${b.open} H ${b.high} L ${b.low} C ${b.close} V ${b.volume ?? "unavailable"}`}</title>
        <line x1={x(b.timestamp)} x2={x(b.timestamp)} y1={y(b.high!)} y2={y(b.low!)} />
        <rect x={x(b.timestamp)-2} y={Math.min(y(b.open!),y(b.close!))} width="4" height={Math.max(1,Math.abs(y(b.open!)-y(b.close!)))} />
        {i > 0 && Date.parse(b.timestamp)-Date.parse(bars[i-1].timestamp)>90000 && <text x={x(b.timestamp)-12} y="287">gap</text>}
      </g>)}
      {line.length > 1 && <path d={path(line.map(p=>({timestamp:p.timestamp,value:p.value!})))} className="observed-vwap"><title>DERIVED · completed-rolling-bar-features-v1 · rolling window VWAP</title></path>}
      {levels.map((p,i)=><g key={`${p.order_ref || p.kind}:${i}`} className="broker-level"><line x1="50" x2="950" y1={y(p.value)} y2={y(p.value)} /><text x="760" y={y(p.value)-4}>{p.kind} {value(p.value)}</text><title>OBSERVED · {p.source} · {p.observed_at} · {p.order_ref || "broker position"}</title></g>)}
      {fills.map(p=><g key={p.event_id} className="broker-fill"><circle cx={x(p.timestamp)} cy={y(p.price!)} r="5" /><title>OBSERVED · {p.side} {p.quantity ?? "unavailable"} @ {p.price} · {p.order_ref} · {p.event_id}</title></g>)}
      {band && <path d={band} className="forecast-band" />}
      {f && <path d={path(f.central_path)} className="forecast-path"><title>{`FORECAST · ${f.model_version} · ${f.methodology_version} · expires ${f.expires_at}`}</title></path>}
      <text x="50" y="307">{bars[0].timestamp}</text><text x="650" y="307">{bars.at(-1)!.timestamp}</text>
      {bars.filter(b=>b.volume != null).map(b=><rect key={`volume:${b.timestamp}`} className="source-volume" x={x(b.timestamp)-2} y={365-b.volume!/maxVolume*40} width="4" height={b.volume!/maxVolume*40}><title>OBSERVED volume {b.volume} · {b.source} · {b.timestamp}</title></rect>)}
      <text x="50" y="379">OBSERVED volume · missing bars remain gaps</text>
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
  return <svg viewBox="0 0 120 25" role="img" aria-label={`Source series · ${data.at(-1)!.provenance}`}><polyline points={data.map(p=>`${(Date.parse(p.timestamp)-start)/Math.max(1,end-start)*120},${24-(p.value!-low)/Math.max(.0001,high-low)*23}`).join(" ")} /><title>{data.at(-1)!.provenance} · {data.at(-1)!.methodology_version || "source observation"} · {data.at(-1)!.source}</title></svg>;
}

function SourceReplay({symbol}: {symbol: string}) {
  const [clock,setClock] = useState(new Date().toISOString().slice(0,16));
  const [points,setPoints] = useState<Point[]>([]);
  const [status,setStatus] = useState("No source artifact loaded.");
  const [busy,setBusy] = useState(false);
  const [fingerprint,setFingerprint] = useState("");
  const generation = useRef(0);
  const replayTime = Date.parse(clock+"Z");
  useEffect(()=>()=>{generation.current += 1;},[]);
  useEffect(()=>{setPoints([]);setFingerprint("");setStatus("No source artifact loaded.");},[symbol]);
  async function load() {
    if (!symbol || !Number.isFinite(replayTime)) return;
    const requestGeneration = ++generation.current;
    setBusy(true); setPoints([]); setFingerprint("");
    try {
      const end = new Date(replayTime).toISOString();
      const start = new Date(replayTime-2*60*60*1000).toISOString();
      const query = new URLSearchParams({series:"candles:"+symbol,start,end,clock:end,limit:"2400"});
      const response = await fetch("/api/command/shadow/history?"+query,{credentials:"same-origin",cache:"no-store"});
      if (!response.ok) throw new Error(`Source history unavailable (${response.status}).`);
      const body = await response.json() as {points:Point[];entry_authority:boolean;truncated:boolean;pruned_records:number;artifact_fingerprint:string;replay_clock:string};
      if (body.entry_authority !== false || !sourceHistoryValid(body.points,replayTime)) throw new Error("Source artifact failed provenance checks.");
      if (requestGeneration !== generation.current) return;
      setPoints(body.points);setFingerprint(body.artifact_fingerprint);
      setStatus(`${body.points.length} observed bars · ${body.truncated ? "truncated" : "bounded response"} · ${body.pruned_records} records pruned from archive`);
    } catch(error) {if (requestGeneration === generation.current) setStatus(error instanceof Error ? error.message : "Source history unavailable.");}
    finally {if (requestGeneration === generation.current) setBusy(false);}
  }
  return <><h3>Source availability replay</h3><p>Archived observations available at the selected clock. This view does not establish a VELUM validation pass.</p>
    <label>Replay clock (UTC) <input type="datetime-local" value={clock} onChange={e=>{generation.current += 1;setBusy(false);setClock(e.target.value);setPoints([]);setFingerprint("");setStatus("No source artifact loaded.");}} /></label>
    <button type="button" disabled={busy || !symbol} onClick={load}>{busy ? "Loading observations…" : `Load ${symbol || "symbol"} source history`}</button>
    <p role="status">{status}</p>
    <ChartBoundary><Candles points={points} now={replayTime} windowSize={120} vwap={[]} executions={[]} overlays={[]} /></ChartBoundary>
    {fingerprint && <small>Source artifact {fingerprint} · no execution authority</small>}
  </>;
}

export default function CommandLiveMarket({state}: {state: LiveState}) {
  const [selected, setSelected] = useState("");
  const [view, setView] = useState("LIVE");
  const [paused, setPaused] = useState<LiveState | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [windowSize, setWindowSize] = useState(120);
  const [now,setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(timer); },[]);
  const rows = Object.values(state.scanner);
  const symbol = selected || rows[0]?.symbol || "";
  const shown = paused || state;
  const hotset = shown.system.hotset as {quality_state?: string; discovery_count?: number; rotation_count?: number} | undefined;
  const parity = shown.system.canonical_ledger_parity as {reconciliation_complete?: boolean; stream_parity_complete?: boolean; missing_observed_orders?: number; missing_observed_fills?: number} | undefined;
  const approvals = shown.system.asc_profile_release as {approved_profiles?: string[]; reason?: string} | undefined;
  const forecasts = shown.system.nostra_forecasts as {canonical_count?: number; projected_count?: number; reason?: string} | undefined;
  const forecast = shown.forecasts[symbol];
  const currentForecast = forecast && forecastCurrent(forecast,now) ? forecast : undefined;
  const account = shown.system.account_observation as {positions?: {symbol: string; average_entry_price: number; observed_at: string; source: string; provenance: string}[]; overlays?: BrokerOverlay[]; quality_state?: string} | undefined;
  const coverage = shown.system.scanner_coverage as {session_id?: string; evaluable_symbol_hours?: number;
    eligible_symbol_hours?: number; signal_candidates?: number; signal_candidates_per_evaluable_symbol_hour?: number | null} | undefined;
  const overlays: BrokerOverlay[] = account?.quality_state === "LIVE" ? [...(account.overlays || []), ...(account.positions || []).map(p=>({symbol:p.symbol,kind:"BROKER_AVERAGE_ENTRY",value:p.average_entry_price,observed_at:p.observed_at,source:p.source,provenance:p.provenance}))].filter(p=>p.symbol === symbol) : [];
  return <section className="command-live" aria-label="RHEN 4.4 shadow visual intelligence">
    <header><div><small>RHEN 4.4 / SHADOW OBSERVATION</small><h2>Market fabric</h2></div><strong>{state.stale ? "STALE / VALUES FROZEN" : String(state.system.connection_state || "WARMING")}</strong></header>
    <p>{currentRhenRelease().version} remains the trading champion. The 4.4 observer is deployed separately; live crossover remains pending.</p>
    <div className="command-live-readiness" aria-label="4.4 integration and validation status">
      <article><small>DISCOVERY → STREAM</small><strong>{hotset?.quality_state || "Awaiting observation"}</strong><p>{value(hotset?.discovery_count,0)} discovery symbols · {value(hotset?.rotation_count,0)} rotations</p></article>
      <article><small>BROKER RECONCILIATION</small><strong>{!parity ? "Awaiting observation" : parity.reconciliation_complete ? "Canonical recovery complete" : "Incomplete"}</strong><p>{parity?.stream_parity_complete ? "Raw stream parity complete" : parity ? `Raw gaps: ${value(parity.missing_observed_orders,0)} orders / ${value(parity.missing_observed_fills,0)} fills` : "No verified ledger snapshot"}</p></article>
      <article><small>ADAPTIVE APPROVALS</small><strong>{approvals?.approved_profiles?.length ? `${approvals.approved_profiles.length} shadow profiles` : "No approved profile"}</strong><p>ACTIVE unavailable · evidence gates remain required</p></article>
      <article><small>NOSTRA PROJECTION</small><strong>{value(forecasts?.projected_count,0)} projected forecasts</strong><p>{value(forecasts?.canonical_count,0)} canonical forecasts · only observed references qualify</p></article>
    </div>
    <nav aria-label="Live visual views">{["LIVE","SYMBOL","FORECAST","PERFORMANCE","ADAPTIVE","SYSTEM","REPLAY"].map(v => <button type="button" key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v}</button>)}</nav>
    {(state.stale || state.error) && <p role="status">{state.error || "Live data stale"}</p>}
    {state.stale && state.bootstrap_status && <p>{state.bootstrap_status}</p>}
    <div className="command-live-strip"><span>OPERATIONAL · {String(state.system.session || "unavailable")}</span><span>Feed {String(state.system.feed || "unavailable")}</span><span>Coverage {String(state.system.subscribed_symbols ?? 0)}/{String(state.system.intended_symbols ?? 0)}</span><span>{String(state.system.capability || "unknown")}</span><span>Entry authority: disabled</span></div>
    <p>DERIVED / {coverage?.session_id || "coverage unavailable"}: {value(coverage?.evaluable_symbol_hours,4)} evaluable symbol-hours
      {" / "}{value(coverage?.eligible_symbol_hours,4)} subscribed symbol-hours · {value(coverage?.signal_candidates,0)} distinct signal candidates
      {" · "}{value(coverage?.signal_candidates_per_evaluable_symbol_hour)} candidates per evaluable symbol-hour.
      Restart downtime excluded. Signal candidates have not passed portfolio/risk validation; these counters do not establish independent research sessions.</p>
    {["LIVE","SYMBOL","FORECAST"].includes(view) && <>
      <div className="command-live-controls"><label>Symbol <select value={symbol} onChange={e=>setSelected(e.target.value)}>{rows.map(row=><option key={row.symbol}>{row.symbol}</option>)}</select></label><button type="button" onClick={()=>setPaused(paused ? null : state)}>{paused ? "Follow live" : "Pause visual following"}</button><label><input type="checkbox" checked={showForecast} onChange={e=>setShowForecast(e.target.checked)} /> Show forecast</label></div>
      <label>Completed-bar window <select value={windowSize} onChange={e=>setWindowSize(Number(e.target.value))}>{[30,60,120].map(v=><option key={v} value={v}>{v} bars</option>)}</select></label>
      <ChartBoundary key={symbol}><Candles points={shown.series["candles:"+symbol] || []} forecast={showForecast ? currentForecast : undefined} now={now} windowSize={windowSize} vwap={shown.series["rolling_vwap:"+symbol] || []} executions={shown.executions.filter(e=>e.symbol === symbol)} overlays={overlays} /></ChartBoundary>
      {view === "FORECAST" && <p>{currentForecast ? `Issued ${currentForecast.issued_at}; expires ${currentForecast.expires_at}; ${currentForecast.methodology_version}` : "No current versioned NOSTRA forecast. Projection unavailable."}</p>}
      <div className="command-live-grid">{Object.values(shown.scanner).map(row=>{
        const {quoteAge:age, stale} = scannerFreshness(row,now,state.stale);
        return <button type="button" key={row.symbol} onClick={()=>setSelected(row.symbol)} aria-pressed={symbol===row.symbol}>
          <strong>{row.symbol}<b>{value(row.mid)}</b></strong><Sparkline points={shown.series["mid:"+row.symbol] || []} />
          <span>{stale ? "STALE" : row.evaluable ? "EVALUABLE" : "BLOCKED"} · {stale ? "BLOCKED" : row.candidate_state}</span><span>Spread {value(row.spread_bps)} bp · quote {age===null ? "unavailable" : `${age.toFixed(0)} ms`}</span><span>Observed bars {value(row.observed_bar_count,0)} / {value(row.required_bar_count,0)} required</span><span>{row.rejection_code || "No rejection"}</span><small>{row.signal_reason}</small>
        </button>;
      })}</div>
      <h3>Broker evidence tape / OBSERVED</h3>{shown.executions.length ? shown.executions.slice(-20).reverse().map(e=><p key={e.event_id}>{e.timestamp} · {e.symbol} · {e.event_type} · {e.quantity ?? "—"} @ {e.price ?? "—"} · {e.order_ref}</p>) : <p>No broker events observed by this shadow runtime.</p>}
    </>}
    {view === "SYSTEM" && <dl>{Object.entries(state.system).map(([key,v])=><div key={key}><dt>{key}</dt><dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd></div>)}</dl>}
    {view === "PERFORMANCE" && <ChartBoundary><h3>Observed broker equity</h3><Sparkline points={shown.series["account:equity"] || []} /><p>OBSERVED · ALPACA/REST_RECONCILIATION · updates after broker events and periodic reconciliation. Latest equity {value(shown.series["account:equity"]?.at(-1)?.value)}. Account state {account?.quality_state || "UNAVAILABLE"}. These samples do not establish daily return or trading performance validation.</p></ChartBoundary>}
    {view === "PERFORMANCE" && <ChartBoundary><div className="command-live-grid">{[
      ["normalized_equity","Account equity / first observed sample = 100"],
      ["sampled_drawdown_pct","Drawdown from observed sample peak (%)"],
      ["gross_exposure_pct","Observed gross position exposure / equity (%)"]
    ].map(([key,label])=><article key={key}><h3>{label}</h3><Sparkline points={shown.series["performance:"+key] || []} /><p>{value(shown.series["performance:"+key]?.at(-1)?.value)} · DERIVED · account-observation-diagnostics-v1</p></article>)}</div><p>Account sample diagnostics. Deposits and withdrawals are not adjusted; strategy returns and full-session drawdown remain unavailable.</p></ChartBoundary>}
    {view === "ADAPTIVE" && <>
      <h3>Policy, regime and capital / shadow</h3>
      <p>Effective execution remains BASELINE_LOCKED. Proposed values are counterfactual and confer no trading authority.</p>
      {["nostra","adaptive_control","capital_governor"].map(key=>{
        const data = shown.system[key];
        return <article key={key}><h3>{key}</h3>{data && typeof data === "object" ? <dl>{Object.entries(data).map(([field,v])=><div key={field}><dt>{field}</dt><dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd></div>)}</dl> : <p>Canonical source unavailable.</p>}</article>;
      })}
    </>}
    {view === "REPLAY" && <><label>Symbol <select value={symbol} onChange={e=>setSelected(e.target.value)}>{rows.map(row=><option key={row.symbol}>{row.symbol}</option>)}</select></label><SourceReplay key={symbol} symbol={symbol} /></>}
  </section>;
}
