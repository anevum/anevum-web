import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Mark from "../components/Mark";
import { fetchCommandStatus, type CommandSnapshot } from "../lib/data";
import { clockTime, money, percent } from "../lib/format";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function list(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function text(value: unknown, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function number(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function Command() {
  const { session, loading, commandAdmin } = useAuth();
  const [snapshot, setSnapshot] = useState<CommandSnapshot | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!session || !commandAdmin) return;
    setRefreshing(true);
    try {
      const next = await fetchCommandStatus(session);
      setSnapshot(next);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Command status unavailable.");
    } finally {
      setRefreshing(false);
    }
  }, [session, commandAdmin]);

  useEffect(() => {
    if (!session || !commandAdmin) return;
    refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, [session, commandAdmin, refresh]);

  if (loading) {
    return <div className="command-gate"><Mark /><span>ANEVUM / RHEN COMMAND</span><h1>Resolving identity.</h1></div>;
  }

  if (!session?.user) {
    return (
      <div className="command-gate">
        <Mark />
        <span>ANEVUM / RHEN COMMAND</span>
        <h1>Private operations.</h1>
        <p>Sign in through the private ANEVUM entrance to open Command.</p>
        <Link className="primary-link" to="/private">Private access <b>↗</b></Link>
      </div>
    );
  }

  if (!commandAdmin) {
    return (
      <div className="command-gate">
        <Mark />
        <span>ANEVUM / RHEN COMMAND</span>
        <h1>Administrator access required.</h1>
        <p>This RHENLINK is authenticated but is not authorized for the private operations console.</p>
        <Link className="text-link" to="/">Return to ANEVUM <b>→</b></Link>
      </div>
    );
  }

  const account = record(snapshot?.account);
  const bot = record(snapshot?.bot);
  const strategy = record(snapshot?.strategy);
  const risk = record(snapshot?.risk);
  const market = record(snapshot?.market);
  const positions = list(snapshot?.positions);
  const openOrders = list(snapshot?.open_orders);
  const recentOrders = list(snapshot?.recent_orders);
  const scanner = record(snapshot?.scanner);
  const history = list(snapshot?.history);
  const position = positions[0];
  const dayPnl = number(account.day_pnl);

  const scanRows = useMemo(() => {
    const preferred = Array.isArray(strategy.scan_symbols)
      ? strategy.scan_symbols.map(String)
      : Object.keys(scanner);
    return preferred
      .filter((symbol) => scanner[symbol])
      .map((symbol) => ({ symbol, row: record(scanner[symbol]) }));
  }, [scanner, strategy.scan_symbols]);

  return (
    <div className="command-shell">
      <header className="command-header">
        <Link to="/" className="command-brand"><Mark /><span>ANEVUM</span><i /><strong>RHEN COMMAND</strong></Link>
        <nav><a href="#overview">Overview</a><a href="#scanner">Scanner</a><a href="#orders">Orders</a><a href="#system">System</a></nav>
        <div className="command-account"><span><i /> READ / LIVE</span><small>{session.user.email}</small></div>
      </header>

      <main className="command-main">
        <section id="overview" className="command-hero">
          <div>
            <p>PRIVATE OPERATIONS / LIVE STATUS</p>
            <h1>Command</h1>
            <span>Account, scanner, execution state, and runtime telemetry in one read-only surface.</span>
          </div>
          <div className="command-connection">
            <i className={bot.bot_armed && bot.execution_authorized && !bot.runtime_paused ? "online" : ""} />
            <div><strong>{text(snapshot?.mode).toUpperCase()} / {bot.bot_armed ? "ARMED" : "DISARMED"}</strong><small>{error || "Updated " + clockTime(snapshot?.observed_at)}</small></div>
            <button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh status">↻</button>
          </div>
        </section>

        <section className="command-stats">
          <article><span>TOTAL EQUITY</span><strong>{money(account.equity)}</strong><small className={dayPnl && dayPnl > 0 ? "positive" : dayPnl && dayPnl < 0 ? "negative" : ""}>Today {money(account.day_pnl)}</small></article>
          <article><span>CASH</span><strong>{money(account.cash)}</strong><small>Buying power {money(account.buying_power)}</small></article>
          <article><span>MARKET</span><strong>{market.is_open ? "OPEN" : "CLOSED"}</strong><small>{text(strategy.entry_start)}–{text(strategy.entry_cutoff)} ET</small></article>
          <article><span>RHEN</span><strong>{bot.entries_enabled ? "WATCHING" : "ENTRY LOCK"}</strong><small>{text(risk.entries_remaining)} entries remain</small></article>
          <article><span>POSITION</span><strong>{position ? text(position.symbol) : "FLAT"}</strong><small>{position ? money(position.unrealized_pl) + " / " + percent(position.unrealized_plpc) : "No open position"}</small></article>
        </section>

        <section className="command-grid">
          <div className="command-primary">
            <article id="scanner" className="command-panel">
              <header><div><span>LIVE SCANNER</span><strong>{scanRows.length} symbols observed</strong></div><small>{clockTime(bot.last_strategy_at)}</small></header>
              <div className="scanner-head"><span>SYMBOL</span><span>PRICE</span><span>ACTION</span><span>REASON</span></div>
              <div className="scanner-body">
                {scanRows.length ? scanRows.map(({ symbol, row }) => {
                  const meta = record(row.metadata);
                  return (
                    <div className={"scanner-row " + (row.action === "buy" ? "qualified" : "")} key={symbol}>
                      <strong>{symbol}</strong>
                      <span>{money(meta.current_close)}</span>
                      <b>{text(row.action, "hold").toUpperCase()}</b>
                      <p>{text(row.reason, "waiting")}</p>
                    </div>
                  );
                }) : <div className="command-empty">Waiting for the scanner to publish a completed cycle.</div>}
              </div>
            </article>

            <article id="orders" className="command-panel">
              <header><div><span>ORDER TAPE</span><strong>{openOrders.length} open / {recentOrders.length} recent</strong></div><small>Broker telemetry</small></header>
              <div className="order-body">
                {recentOrders.length ? recentOrders.slice(0, 12).map((order, index) => (
                  <div className="order-row" key={text(order.id, String(index))}>
                    <time>{clockTime(order.filled_at || order.submitted_at)}</time>
                    <strong>{text(order.symbol)}</strong>
                    <span>{text(order.side).toUpperCase()}</span>
                    <span>{text(order.status).toUpperCase()}</span>
                    <b>{order.filled_avg_price ? money(order.filled_avg_price) : "—"}</b>
                  </div>
                )) : <div className="command-empty">No recent RHEN orders.</div>}
              </div>
            </article>
          </div>

          <aside className="command-side">
            <article className="command-panel">
              <header><div><span>ACTIVE POSITION</span><strong>{position ? text(position.symbol) : "FLAT"}</strong></div><small>Live from broker</small></header>
              {position ? (
                <div className="position-grid">
                  <div><span>MARKET VALUE</span><strong>{money(position.market_value)}</strong></div>
                  <div><span>ENTRY</span><strong>{money(position.avg_entry_price)}</strong></div>
                  <div><span>CURRENT</span><strong>{money(position.current_price)}</strong></div>
                  <div><span>QTY</span><strong>{text(position.qty)}</strong></div>
                  <div className="wide"><span>UNREALIZED P&L</span><strong className={number(position.unrealized_pl) && number(position.unrealized_pl)! > 0 ? "positive" : number(position.unrealized_pl) && number(position.unrealized_pl)! < 0 ? "negative" : ""}>{money(position.unrealized_pl)} / {percent(position.unrealized_plpc)}</strong></div>
                </div>
              ) : <div className="command-empty">No open position.</div>}
            </article>

            <article className="command-panel">
              <header><div><span>LIVE FEED</span><strong>Recent decisions</strong></div><small>Newest first</small></header>
              <div className="feed-body">
                {history.length ? history.slice().reverse().slice(0, 16).map((item, index) => (
                  <div className="feed-row" key={text(item.at, String(index))}>
                    <time>{clockTime(item.at)}</time>
                    <div><strong>{text(item.symbol || item.kind, "RHEN")}</strong><span>{text(item.action, "decision").toUpperCase()}</span></div>
                    <p>{text(item.reason || item.message, "Recorded")}</p>
                  </div>
                )) : <div className="command-empty">No runtime decisions recorded in this process.</div>}
              </div>
            </article>

            <article id="system" className="command-panel">
              <header><div><span>SYSTEM</span><strong>{bot.execution_authorized && bot.bot_armed && !bot.runtime_paused ? "AUTONOMOUS / LIVE" : "CHECK REQUIRED"}</strong></div><small>Read-only console</small></header>
              <div className="system-grid">
                <div><span>STRATEGY</span><strong>{text(strategy.name, "—")}</strong></div>
                <div><span>DATA FEED</span><strong>{text(strategy.data_feed).toUpperCase()}</strong></div>
                <div><span>FUNDING</span><strong>{bot.funding_ready ? "READY" : "NOT READY"}</strong></div>
                <div><span>DAILY LOSS LIMIT</span><strong>{money(risk.max_daily_loss)}</strong></div>
                <div><span>ORDER SIZE</span><strong>{money(strategy.order_notional)}</strong></div>
                <div><span>LAST DECISION</span><strong>{text(bot.last_decision)}</strong></div>
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
