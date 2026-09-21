import { CompanyFinanceOverview } from "./CompanyFinanceOverview";
import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Banknote, Gauge, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { financeBackend, loadFinanceSnapshot, type FinanceChartPoint, type FinanceSnapshot, type FinanceStrategySetup } from "./financeClient";
import { type MemberSession } from "./memberClient";

type FinanceState = "idle" | "loading" | "ready" | "error";

type WatchTone = "positive" | "negative" | "neutral";
type WatchEvent = {
  id: string;
  at: number;
  tone: WatchTone;
  symbol?: string;
  label: string;
  value: string;
  detail: string;
};
type TickMove = {
  priceDelta: number;
  pnlDelta: number;
  valueDelta: number;
};

function money(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function number(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function signedMoney(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  const formatted = money(Math.abs(value));
  return value > 0 ? `+${formatted}` : value < 0 ? `-${formatted}` : formatted;
}

function elapsed(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function buildWatchEvents(previous: FinanceSnapshot | null, next: FinanceSnapshot): WatchEvent[] {
  const at = Number.isFinite(Date.parse(next.generatedAt)) ? Date.parse(next.generatedAt) : Date.now();
  const events: WatchEvent[] = [];

  if (!previous) {
    events.push({
      id: `${at}-watch-online`,
      at,
      tone: next.gateway.connected ? "positive" : "negative",
      label: next.gateway.connected ? "LIVE WATCH CONNECTED" : "LIVE WATCH OFFLINE",
      value: next.account ? money(next.account.netLiquidation) : "NO ACCOUNT DATA",
      detail: next.gateway.connected ? "IBKR telemetry session started." : (next.gateway.reason || "IBKR gateway unavailable."),
    });
    next.positions.forEach((position) => {
      events.push({
        id: `${at}-${position.contract.symbol}-start`,
        at,
        tone: position.unrealizedPnl > 0 ? "positive" : position.unrealizedPnl < 0 ? "negative" : "neutral",
        symbol: position.contract.symbol,
        label: "POSITION WATCH",
        value: money(position.marketPrice),
        detail: `${number(position.quantity, 6)} shares · ${money(position.marketValue)} value · ${signedMoney(position.unrealizedPnl)} open P&L`,
      });
    });
    return events;
  }

  if (previous.gateway.connected !== next.gateway.connected) {
    events.push({
      id: `${at}-gateway`,
      at,
      tone: next.gateway.connected ? "positive" : "negative",
      label: next.gateway.connected ? "IBKR CONNECTION RESTORED" : "IBKR CONNECTION LOST",
      value: next.gateway.connected ? "ONLINE" : "OFFLINE",
      detail: next.gateway.reason || "Gateway connection state changed.",
    });
  }

  if (previous.account && next.account) {
    const netDelta = next.account.netLiquidation - previous.account.netLiquidation;
    if (Math.abs(netDelta) >= 0.01) {
      events.push({
        id: `${at}-account-net`,
        at,
        tone: netDelta > 0 ? "positive" : "negative",
        label: "PORTFOLIO VALUE",
        value: money(next.account.netLiquidation),
        detail: `${signedMoney(netDelta)} since prior 5-second sample`,
      });
    }

    const cashDelta = next.account.settledCash - previous.account.settledCash;
    if (Math.abs(cashDelta) >= 0.01) {
      events.push({
        id: `${at}-account-cash`,
        at,
        tone: cashDelta > 0 ? "positive" : "negative",
        label: "SETTLED CASH",
        value: money(next.account.settledCash),
        detail: `${signedMoney(cashDelta)} since prior sample`,
      });
    }
  }

  const previousPositions = new Map(previous.positions.map((position) => [position.contract.symbol, position]));
  const nextPositions = new Map(next.positions.map((position) => [position.contract.symbol, position]));

  next.positions.forEach((position) => {
    const prior = previousPositions.get(position.contract.symbol);
    if (!prior) {
      events.push({
        id: `${at}-${position.contract.symbol}-opened`,
        at,
        tone: "positive",
        symbol: position.contract.symbol,
        label: "POSITION DETECTED",
        value: `${number(position.quantity, 6)} shares`,
        detail: `${money(position.marketValue)} market value at ${money(position.marketPrice)}`,
      });
      return;
    }

    const quantityDelta = position.quantity - prior.quantity;
    if (Math.abs(quantityDelta) > 0.0000001) {
      events.push({
        id: `${at}-${position.contract.symbol}-size`,
        at,
        tone: quantityDelta > 0 ? "positive" : "negative",
        symbol: position.contract.symbol,
        label: "POSITION SIZE",
        value: `${number(position.quantity, 6)} shares`,
        detail: `${quantityDelta > 0 ? "+" : ""}${number(quantityDelta, 6)} shares since prior sample`,
      });
    }

    const priceDelta = position.marketPrice - prior.marketPrice;
    const pnlDelta = position.unrealizedPnl - prior.unrealizedPnl;
    if (Math.abs(priceDelta) >= 0.0001 || Math.abs(pnlDelta) >= 0.005) {
      const tone: WatchTone = pnlDelta > 0 ? "positive" : pnlDelta < 0 ? "negative" : priceDelta > 0 ? "positive" : priceDelta < 0 ? "negative" : "neutral";
      events.push({
        id: `${at}-${position.contract.symbol}-tick`,
        at,
        tone,
        symbol: position.contract.symbol,
        label: "LIVE TICK",
        value: money(position.marketPrice),
        detail: `${signedMoney(priceDelta)} price · ${signedMoney(pnlDelta)} open P&L tick · ${signedMoney(position.unrealizedPnl)} total open P&L`,
      });
    }
  });

  previous.positions.forEach((position) => {
    if (!nextPositions.has(position.contract.symbol)) {
      events.push({
        id: `${at}-${position.contract.symbol}-closed`,
        at,
        tone: "neutral",
        symbol: position.contract.symbol,
        label: "POSITION CLEARED",
        value: "0 shares",
        detail: `Previous market value ${money(position.marketValue)} no longer appears in the live portfolio.`,
      });
    }
  });

  return events.slice(0, 12);
}

function signalClass(signal?: string) {
  return String(signal || "NO_TRADE").toLowerCase().replace(/_/g, "-");
}

function valueRange(points: FinanceChartPoint[]) {
  const values = points.flatMap((point) => [point.close, point.sma20, point.sma50]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!values.length) return { min: 0, max: 1 };
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

function linePath(points: FinanceChartPoint[], key: "close" | "sma20" | "sma50", width: number, height: number, min: number, max: number) {
  const usable = points.map((point, index) => ({ value: point[key], index })).filter((point): point is { value: number; index: number } => typeof point.value === "number" && Number.isFinite(point.value));
  if (!usable.length) return "";
  return usable.map((point, index) => {
    const x = usable.length === 1 ? width / 2 : (point.index / Math.max(points.length - 1, 1)) * width;
    const y = height - ((point.value - min) / Math.max(max - min, 0.0001)) * height;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function StrategyChart({ setup }: { setup: FinanceStrategySetup }) {
  const points = setup.chart || [];
  const { min, max } = valueRange(points);
  const width = 720;
  const height = 220;
  const closePath = linePath(points, "close", width, height, min, max);
  const sma20Path = linePath(points, "sma20", width, height, min, max);
  const sma50Path = linePath(points, "sma50", width, height, min, max);
  const latest = points[points.length - 1];

  if (!points.length) {
    return <div className="finance-chart-empty">NO PRICE HISTORY RESOLVED</div>;
  }

  return (
    <div className="finance-chart-wrap">
      <div className="finance-chart-meta">
        <span>{points[0]?.date}</span>
        <strong>{setup.symbol} / DAILY</strong>
        <span>{latest?.date}</span>
      </div>
      <svg className="finance-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${setup.symbol} price chart with 20 and 50 day moving averages`}>
        <line x1="0" y1={height * .25} x2={width} y2={height * .25} className="grid" />
        <line x1="0" y1={height * .5} x2={width} y2={height * .5} className="grid" />
        <line x1="0" y1={height * .75} x2={width} y2={height * .75} className="grid" />
        <path d={sma50Path} className="sma50" />
        <path d={sma20Path} className="sma20" />
        <path d={closePath} className="price" />
      </svg>
      <div className="finance-chart-legend">
        <span><i className="price" />CLOSE {money(setup.close)}</span>
        <span><i className="sma20" />SMA20 {money(setup.sma20)}</span>
        <span><i className="sma50" />SMA50 {money(setup.sma50)}</span>
      </div>
    </div>
  );
}

function InvestmentDetails({ session }: { session: MemberSession }) {
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [state, setState] = useState<FinanceState>("idle");
  const [error, setError] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("QQQM");
  const [clock, setClock] = useState(() => Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [watchEvents, setWatchEvents] = useState<WatchEvent[]>([]);
  const [tickMoves, setTickMoves] = useState<Record<string, TickMove>>({});
  const refreshInFlight = useRef(false);
  const previousSnapshotRef = useRef<FinanceSnapshot | null>(null);
  const watchStartedAtRef = useRef(Date.now());

  async function refresh(silent = false) {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    if (!silent) setState("loading");
    try {
      const next = await loadFinanceSnapshot(session);
      const previous = previousSnapshotRef.current;
      const nextMoves: Record<string, TickMove> = {};
      if (previous) {
        const priorPositions = new Map(previous.positions.map((position) => [position.contract.symbol, position]));
        next.positions.forEach((position) => {
          const prior = priorPositions.get(position.contract.symbol);
          if (!prior) return;
          nextMoves[position.contract.symbol] = {
            priceDelta: position.marketPrice - prior.marketPrice,
            pnlDelta: position.unrealizedPnl - prior.unrealizedPnl,
            valueDelta: position.marketValue - prior.marketValue,
          };
        });
      }
      const nextEvents = buildWatchEvents(previous, next);
      if (nextEvents.length) {
        setWatchEvents((current) => [...nextEvents, ...current].slice(0, 80));
      }
      setTickMoves(nextMoves);
      previousSnapshotRef.current = next;
      setSnapshot(next);
      setLastRefresh(new Date());
      setError("");
      setState("ready");
      if (!next.strategy.setups.some((setup) => setup.symbol === selectedSymbol)) {
        setSelectedSymbol(next.strategy.setups[0]?.symbol || "QQQM");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Finance data could not be resolved.");
      setState("error");
    } finally {
      refreshInFlight.current = false;
    }
  }

  useEffect(() => {
    previousSnapshotRef.current = null;
    watchStartedAtRef.current = Date.now();
    setWatchEvents([]);
    setTickMoves({});
    void refresh();
  }, [session.access_token]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => void refresh(true), financeBackend.refreshMs);
    return () => window.clearInterval(timer);
  }, [autoRefresh, session.access_token]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedSetup = useMemo(
    () => snapshot?.strategy.setups.find((setup) => setup.symbol === selectedSymbol) || snapshot?.strategy.setups[0] || null,
    [snapshot, selectedSymbol],
  );

  const account = snapshot?.account;
  const positions = snapshot?.positions || [];
  const setups = snapshot?.strategy.setups || [];
  const quotes = snapshot?.quotes || [];
  const signalCount = setups.filter((setup) => setup.signal === "ENTRY" || setup.signal === "EXIT").length;
  const generatedAt = snapshot?.generatedAt ? new Date(snapshot.generatedAt).getTime() : 0;
  const ageSeconds = generatedAt ? Math.max(0, Math.floor((clock - generatedAt) / 1000)) : null;
  const fresh = Boolean(snapshot?.gateway.connected && ageSeconds != null && ageSeconds <= 20);
  const grossPositions = positions.reduce((sum, position) => sum + Math.abs(position.marketValue || 0), 0);
  const totalValue = account?.netLiquidation || (grossPositions + (account?.settledCash || 0));
  const portfolioPnl = positions.reduce((sum, position) => sum + (position.unrealizedPnl || 0), 0);
  const watchRuntime = elapsed((clock - watchStartedAtRef.current) / 1000);

  return (
    <section className="command-finance-panel" aria-labelledby="command-finance-title">
      <header className="finance-head">
        <div>
          <span>FINANCE / TRADING SYSTEM</span>
          <h2 id="command-finance-title">Live investment portfolio.</h2>
          <p>Read-only IBKR telemetry for balances, holdings, quotes, unrealized P&amp;L and daily trend context. No order-placement endpoint exists.</p>
        </div>
        <div className="finance-controls">
          <div className={`finance-link-state ${fresh ? "online" : "offline"}`}><i /><span>{fresh ? "IBKR LIVE" : snapshot?.gateway.connected ? "IBKR STALE" : "IBKR OFFLINE"}</span></div>
          <button type="button" className={autoRefresh ? "active" : ""} onClick={() => setAutoRefresh((value) => !value)}>{autoRefresh ? "AUTO 5S" : "AUTO OFF"}</button>
          <button type="button" onClick={() => void refresh()} disabled={state === "loading"}><RefreshCw size={14} className={state === "loading" ? "spin" : ""} />REFRESH</button>
        </div>
      </header>

      {state === "loading" && !snapshot ? <div className="finance-message">RESOLVING IBKR ACCOUNT + STRATEGY DATA…</div> : null}
      {state === "error" && !snapshot ? <div className="finance-message error">{error}</div> : null}

      {snapshot ? (
        <>
          <div className="finance-source-strip">
            <div><span>SOURCE</span><strong>IBKR GATEWAY</strong><small>READ-ONLY / PORT {snapshot.gateway.port}</small></div>
            <div><span>MODE</span><strong>{snapshot.mode}</strong><small>NO ORDER ENDPOINT</small></div>
            <div><span>LIVE AGE</span><strong>{ageSeconds == null ? "—" : `${ageSeconds}s`}</strong><small>{autoRefresh ? "5 SEC REFRESH" : "MANUAL REFRESH"}</small></div>
            <div><span>POSITIONS</span><strong>{positions.length}</strong><small>{signalCount} STRATEGY ALERTS</small></div>
          </div>

          <div className="finance-metrics">
            <article><WalletCards size={17} /><span>NET LIQUIDATION</span><strong>{money(account?.netLiquidation)}</strong><small>Account equity</small></article>
            <article><Banknote size={17} /><span>SETTLED CASH</span><strong>{money(account?.settledCash)}</strong><small>{number(account?.cashPercent)}% cash</small></article>
            <article><Gauge size={17} /><span>BUYING POWER</span><strong>{money(account?.buyingPower)}</strong><small>{money(account?.availableFunds)} available</small></article>
            <article className={portfolioPnl >= 0 ? "positive" : "negative"}><Activity size={17} /><span>OPEN P&amp;L</span><strong>{money(portfolioPnl)}</strong><small>{money(account?.realizedPnl)} realized</small></article>
          </div>

          <section className="finance-watch" aria-labelledby="finance-watch-title">
            <header className="finance-watch-head">
              <div>
                <span>PORTFOLIO LIVE WATCH</span>
                <strong id="finance-watch-title">MARK-TO-MARKET FEED</strong>
              </div>
              <div className="finance-watch-status">
                <span className={fresh ? "live" : "stale"}><i />{fresh ? "STREAMING" : "STALE"}</span>
                <small>5 SEC SAMPLE · SESSION {watchRuntime} · {watchEvents.length} EVENTS</small>
              </div>
            </header>

            <div className="finance-watch-layout">
              <div className="finance-watch-table">
                <div className="finance-watch-row finance-watch-columns">
                  <span>ASSET</span><span>LAST / TICK</span><span>POSITION VALUE</span><span>OPEN P&amp;L / TICK</span>
                </div>
                {positions.map((position) => {
                  const move = tickMoves[position.contract.symbol];
                  const priceTone = !move || Math.abs(move.priceDelta) < 0.0001 ? "neutral" : move.priceDelta > 0 ? "positive" : "negative";
                  const pnlTone = !move || Math.abs(move.pnlDelta) < 0.005 ? "neutral" : move.pnlDelta > 0 ? "positive" : "negative";
                  return (
                    <div className="finance-watch-row" key={`watch-${position.contract.conId || position.contract.symbol}`}>
                      <div><strong>{position.contract.symbol}</strong><small>{number(position.quantity, 6)} SHARES</small></div>
                      <div><strong>{money(position.marketPrice)}</strong><small className={priceTone}>{move ? signedMoney(move.priceDelta) : "INITIAL"}</small></div>
                      <div><strong>{money(position.marketValue)}</strong><small>{move ? `${signedMoney(move.valueDelta)} TICK` : "LIVE VALUE"}</small></div>
                      <div><strong className={position.unrealizedPnl >= 0 ? "positive" : "negative"}>{signedMoney(position.unrealizedPnl)}</strong><small className={pnlTone}>{move ? `${signedMoney(move.pnlDelta)} TICK` : "INITIAL"}</small></div>
                    </div>
                  );
                })}
                {!positions.length ? <div className="finance-message compact">NO POSITIONS TO WATCH</div> : null}
              </div>

              <div className="finance-watch-tape" aria-live="polite">
                <div className="finance-watch-tape-head"><span>SESSION TAPE</span><small>NEWEST FIRST</small></div>
                <div className="finance-watch-events">
                  {watchEvents.length ? watchEvents.map((event) => (
                    <article className={`finance-watch-event ${event.tone}`} key={event.id}>
                      <time>{new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
                      <div>
                        <span>{event.symbol ? `${event.symbol} · ${event.label}` : event.label}</span>
                        <strong>{event.value}</strong>
                        <small>{event.detail}</small>
                      </div>
                    </article>
                  )) : <div className="finance-watch-empty">WAITING FOR NEXT LIVE SAMPLE…</div>}
                </div>
              </div>
            </div>
          </section>

          <section className="finance-live-grid" aria-label="Live holdings summary">
            {positions.map((position) => {
              const quote = quotes.find((item) => item.symbol === position.contract.symbol);
              const allocation = totalValue ? (position.marketValue / totalValue) * 100 : 0;
              const costValue = position.averageCost * Math.abs(position.quantity);
              const returnPct = costValue ? (position.unrealizedPnl / costValue) * 100 : 0;
              return (
                <article key={position.contract.conId || position.contract.symbol} className="finance-live-card">
                  <header>
                    <div><span>HOLDING</span><strong>{position.contract.symbol}</strong></div>
                    <em className={position.unrealizedPnl >= 0 ? "positive" : "negative"}>{position.unrealizedPnl >= 0 ? "+" : ""}{number(returnPct, 2)}%</em>
                  </header>
                  <div className="finance-live-price"><strong>{money(quote?.last ?? position.marketPrice)}</strong><small>{number(position.quantity, 6)} SHARES</small></div>
                  <div className="finance-live-stats">
                    <div><span>VALUE</span><strong>{money(position.marketValue)}</strong></div>
                    <div><span>AVG COST</span><strong>{money(position.averageCost)}</strong></div>
                    <div><span>OPEN P&amp;L</span><strong>{money(position.unrealizedPnl)}</strong></div>
                    <div><span>ALLOCATION</span><strong>{number(allocation, 1)}%</strong></div>
                  </div>
                  <footer><span>BID {money(quote?.bid)}</span><span>ASK {money(quote?.ask)}</span><span>IBKR</span></footer>
                </article>
              );
            })}
            {!positions.length ? <div className="finance-message compact">NO LIVE POSITIONS RESOLVED</div> : null}
          </section>

          {!snapshot.gateway.connected ? (
            <div className="finance-message error compact">
              IBKR Gateway is offline. {snapshot.gateway.reason || "Approve the current IBKR authentication / two-factor request, then refresh COMMAND."}
            </div>
          ) : null}

          <section className="finance-strategy">
            <header>
              <div><span>{snapshot.strategy.name.toUpperCase()}</span><strong>HOLDINGS + TREND MONITOR</strong></div>
              <small>MAX PLANNED LOSS {money(snapshot.strategy.rules.maxPlannedLossUsd)} / POSITION BUDGET {money(snapshot.strategy.rules.positionBudgetUsd)}</small>
            </header>
            <div className="finance-symbol-tabs" role="tablist" aria-label="Strategy symbols">
              {setups.map((setup) => (
                <button key={setup.symbol} type="button" className={setup.symbol === selectedSetup?.symbol ? "active" : ""} onClick={() => setSelectedSymbol(setup.symbol)} role="tab" aria-selected={setup.symbol === selectedSetup?.symbol}>
                  <strong>{setup.symbol}</strong>
                  <span className={`signal ${signalClass(setup.signal)}`}>{setup.signal?.replace("_", " ") || setup.status || "WAIT"}</span>
                  <small>{money(setup.close)}</small>
                </button>
              ))}
            </div>

            {selectedSetup ? (
              <div className="finance-strategy-detail">
                <div className="finance-chart-column">
                  <StrategyChart setup={selectedSetup} />
                </div>
                <div className="finance-signal-column">
                  <div className={`finance-primary-signal ${signalClass(selectedSetup.signal)}`}>
                    <span>{selectedSetup.symbol} / CURRENT SIGNAL</span>
                    <strong>{selectedSetup.signal?.replace("_", " ") || selectedSetup.status || "WAIT"}</strong>
                    <p>{selectedSetup.reason || "Waiting for sufficient daily history."}</p>
                  </div>
                  <div className="finance-rule-grid">
                    <div className={selectedSetup.trendPass ? "pass" : "fail"}><span>TREND</span><strong>{selectedSetup.trendPass ? "PASS" : "WAIT"}</strong><small>Close &gt; SMA50 · SMA20 &gt; SMA50</small></div>
                    <div className={selectedSetup.breakoutPass ? "pass" : "fail"}><span>10D BREAKOUT</span><strong>{selectedSetup.breakoutPass ? "PASS" : "WAIT"}</strong><small>Prior high {money(selectedSetup.previous10High)}</small></div>
                    <div><span>ATR14</span><strong>{number(selectedSetup.atr14, 4)}</strong><small>Stop {money(selectedSetup.plannedStop)}</small></div>
                    <div><span>PLANNED SIZE</span><strong>{number(selectedSetup.plannedQty, 5)}</strong><small>{money(selectedSetup.plannedValue)} notional</small></div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="finance-positions">
            <header><div><span>LIVE PORTFOLIO</span><strong>POSITIONS</strong></div><small>{positions.length} OPEN</small></header>
            {positions.length ? positions.map((position) => (
              <div className="finance-position-row" key={position.contract.conId || `${position.contract.symbol}-${position.quantity}`}>
                <div><strong>{position.contract.symbol}</strong><small>{position.contract.secType} · {position.contract.currency}</small></div>
                <div><span>QTY</span><strong>{number(position.quantity, 6)}</strong></div>
                <div><span>MARKET VALUE</span><strong>{money(position.marketValue)}</strong></div>
                <div><span>AVG COST</span><strong>{money(position.averageCost)}</strong></div>
                <div className={position.unrealizedPnl >= 0 ? "positive" : "negative"}>
                  {position.unrealizedPnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>UNREALIZED</span><strong>{money(position.unrealizedPnl)}</strong>
                </div>
              </div>
            )) : <div className="finance-message compact">NO OPEN IBKR POSITIONS</div>}
          </section>

          <section className="finance-integrity">
            <ShieldCheck size={17} />
            <div>
              <strong>DATA INTEGRITY</strong>
              <p>{snapshot.persistence.reason}</p>
            </div>
            <small>NO FABRICATED EQUITY CURVE</small>
          </section>

          {error ? <div className="finance-message error compact">{error}</div> : null}
        </>
      ) : null}
    </section>
  );
}

export function CommandFinance({session}:{session:MemberSession}) {
 const [details,setDetails]=useState(false);
 return <><CompanyFinanceOverview session={session} onAuth={()=>{window.location.href='/rhenlink?return=command'}}/><div className="finance-detail-toggle"><button type="button" aria-expanded={details} onClick={()=>setDetails(x=>!x)}>{details?'Hide investment detail':'Open investment detail & strategy'}</button></div>{details&&<InvestmentDetails session={session}/>}</>;
}
