import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Banknote, CircleDollarSign, Gauge, LineChart, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { financeBackend, loadFinanceSnapshot, type FinanceChartPoint, type FinanceSnapshot, type FinanceStrategySetup } from "./financeClient";
import { type MemberSession } from "./memberClient";

type FinanceState = "idle" | "loading" | "ready" | "error";

function money(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function number(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
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

export function CommandFinance({ session }: { session: MemberSession }) {
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [state, setState] = useState<FinanceState>("idle");
  const [error, setError] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("SPY");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function refresh(silent = false) {
    if (!silent) setState("loading");
    try {
      const next = await loadFinanceSnapshot(session);
      setSnapshot(next);
      setLastRefresh(new Date());
      setError("");
      setState("ready");
      if (!next.strategy.setups.some((setup) => setup.symbol === selectedSymbol)) {
        setSelectedSymbol(next.strategy.setups[0]?.symbol || "SPY");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Finance data could not be resolved.");
      setState("error");
    }
  }

  useEffect(() => {
    void refresh();
  }, [session.access_token]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => void refresh(true), financeBackend.refreshMs);
    return () => window.clearInterval(timer);
  }, [autoRefresh, session.access_token, selectedSymbol]);

  const selectedSetup = useMemo(
    () => snapshot?.strategy.setups.find((setup) => setup.symbol === selectedSymbol) || snapshot?.strategy.setups[0] || null,
    [snapshot, selectedSymbol],
  );

  const account = snapshot?.account;
  const positions = snapshot?.positions || [];
  const setups = snapshot?.strategy.setups || [];
  const signalCount = setups.filter((setup) => setup.signal === "ENTRY" || setup.signal === "EXIT").length;

  return (
    <section className="command-finance-panel" aria-labelledby="command-finance-title">
      <header className="finance-head">
        <div>
          <span>FINANCE / TRADING SYSTEM</span>
          <h2 id="command-finance-title">Capital, risk and strategy in one mobile control surface.</h2>
          <p>Stripe → Revolut → IBKR. IBKR is live-connected in read-only mode; strategy calculations are deterministic and no order-placement route exists.</p>
        </div>
        <div className="finance-controls">
          <div className={`finance-link-state ${snapshot?.gateway.connected ? "online" : "offline"}`}><i /><span>{snapshot?.gateway.connected ? "IBKR LIVE" : state.toUpperCase()}</span></div>
          <button type="button" className={autoRefresh ? "active" : ""} onClick={() => setAutoRefresh((value) => !value)}>{autoRefresh ? "AUTO 15S" : "AUTO OFF"}</button>
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
            <div><span>UPDATED</span><strong>{lastRefresh ? lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}</strong><small>{autoRefresh ? "15 SEC REFRESH" : "MANUAL REFRESH"}</small></div>
            <div><span>ACTIVE SIGNALS</span><strong>{signalCount}</strong><small>ENTRY / EXIT ONLY</small></div>
          </div>

          <div className="finance-metrics">
            <article><WalletCards size={17} /><span>NET LIQUIDATION</span><strong>{money(account?.netLiquidation)}</strong><small>Account equity</small></article>
            <article><Banknote size={17} /><span>SETTLED CASH</span><strong>{money(account?.settledCash)}</strong><small>{number(account?.cashPercent)}% cash</small></article>
            <article><Gauge size={17} /><span>BUYING POWER</span><strong>{money(account?.buyingPower)}</strong><small>{money(account?.availableFunds)} available</small></article>
            <article className={(account?.unrealizedPnl || 0) >= 0 ? "positive" : "negative"}><Activity size={17} /><span>UNREALIZED P&L</span><strong>{money(account?.unrealizedPnl)}</strong><small>{money(account?.realizedPnl)} realized</small></article>
          </div>

          <div className="finance-flow">
            <article className="source-live"><CircleDollarSign size={18} /><span>01 / STRIPE</span><strong>PAYMENT SOURCE</strong><small>Account connected to ChatGPT; Command API credential not installed yet.</small></article>
            <ArrowRight size={18} />
            <article className="source-manual"><WalletCards size={18} /><span>02 / REVOLUT</span><strong>TRANSFER LEG</strong><small>Tracked/reconciled until a supported Revolut API connection is available.</small></article>
            <ArrowRight size={18} />
            <article className="source-live"><LineChart size={18} /><span>03 / IBKR</span><strong>{money(account?.netLiquidation)}</strong><small>Live read-only account + strategy telemetry.</small></article>
          </div>

          <section className="finance-strategy">
            <header>
              <div><span>{snapshot.strategy.name.toUpperCase()}</span><strong>DAILY SWING ENGINE</strong></div>
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
