import { useMemo } from "react";
import type { CommandAccountHistory } from "../lib/data";
import { clockTime, money, signedMoney } from "../lib/format";

function numeric(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

type ChartPoint = {
  at: string;
  time: number;
  equity: number;
  x: number;
  y: number;
};

export default function CommandAccountTracker({
  account,
  history,
  orders
}: {
  account: Record<string, unknown>;
  history?: CommandAccountHistory | null;
  orders: Record<string, unknown>[];
}) {
  const chart = useMemo(() => {
    const raw = (history?.points || [])
      .map((row) => {
        const time = Date.parse(String(row.at || ""));
        const equity = numeric(row.equity);
        return Number.isFinite(time) && equity !== null && row.at
          ? { at: String(row.at), time, equity }
          : null;
      })
      .filter((row): row is { at: string; time: number; equity: number } => Boolean(row));

    if (raw.length < 2) return null;

    const width = 1000;
    const top = 18;
    const bottom = 202;
    const firstTime = raw[0].time;
    const lastTime = raw[raw.length - 1].time;
    const timeSpan = Math.max(1, lastTime - firstTime);
    const lowValue = Math.min(...raw.map((row) => row.equity));
    const highValue = Math.max(...raw.map((row) => row.equity));
    const observedRange = highValue - lowValue;
    const padding = Math.max(
      0.25,
      observedRange * 0.18,
      Math.max(Math.abs(highValue), 1) * 0.0015
    );
    const low = lowValue - padding;
    const high = highValue + padding;
    const valueSpan = Math.max(0.01, high - low);

    const points: ChartPoint[] = raw.map((row) => ({
      ...row,
      x: ((row.time - firstTime) / timeSpan) * width,
      y: bottom - ((row.equity - low) / valueSpan) * (bottom - top)
    }));

    const markers = orders
      .map((order) => {
        const side = String(order.side || "").toLowerCase();
        const at = String(order.filled_at || "");
        const time = Date.parse(at);
        if (!["buy", "sell"].includes(side) || !Number.isFinite(time) || time < firstTime || time > lastTime) {
          return null;
        }
        let nearest = points[0];
        for (const point of points) {
          if (Math.abs(point.time - time) < Math.abs(nearest.time - time)) nearest = point;
        }
        return {
          id: String(order.id || order.client_order_id || at + side),
          side,
          symbol: text(order.symbol, "—"),
          at,
          x: ((time - firstTime) / timeSpan) * width,
          y: nearest.y
        };
      })
      .filter((row): row is { id: string; side: string; symbol: string; at: string; x: number; y: number } => Boolean(row));

    return {
      points: points.map((row) => row.x.toFixed(2) + "," + row.y.toFixed(2)).join(" "),
      markers,
      first: points[0],
      last: points[points.length - 1],
      low: lowValue,
      high: highValue
    };
  }, [history?.points, orders]);

  const dayPnl = numeric(account.day_pnl);
  const lastEquity = numeric(account.last_equity);
  const dayPct = dayPnl !== null && lastEquity && lastEquity !== 0
    ? (dayPnl / lastEquity) * 100
    : null;
  const recentFills = orders.filter((order) => order.filled_at && ["buy", "sell"].includes(String(order.side || "").toLowerCase()));

  return (
    <article className="command-panel command-view-overview command-view-live command-view-performance command-panel-account-tracker">
      <header>
        <div>
          <span>BROKER ACCOUNT / PRIVATE</span>
          <strong>Equity + executions</strong>
        </div>
        <small>{history?.timeframe || "5Min"} · {history?.status === "unavailable" ? "HISTORY UNAVAILABLE" : "LIVE"}</small>
      </header>

      <div className="account-tracker-body">
        <div className="account-tracker-chart">
          <div className="account-tracker-head">
            <div>
              <span>EQUITY</span>
              <strong>{money(account.equity)}</strong>
            </div>
            <div>
              <span>DAY P&amp;L</span>
              <strong className={dayPnl && dayPnl > 0 ? "positive" : dayPnl && dayPnl < 0 ? "negative" : ""}>
                {signedMoney(account.day_pnl)}
                <small>{dayPct === null ? "" : " " + (dayPct > 0 ? "+" : "") + dayPct.toFixed(2) + "%"}</small>
              </strong>
            </div>
          </div>

          {chart ? (
            <>
              <svg viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label="Private broker account equity curve with RHEN buy and sell execution markers">
                <polyline points={chart.points} className="account-tracker-line" />
                {chart.markers.map((marker) => (
                  <g key={marker.id} className={"account-tracker-marker " + (marker.side === "buy" ? "is-buy" : "is-sell")}>
                    <circle cx={marker.x} cy={marker.y} r="7" />
                    <text x={marker.x} y={marker.y + 3} textAnchor="middle">{marker.side === "buy" ? "B" : "S"}</text>
                    <title>{marker.side.toUpperCase()} {marker.symbol} · {clockTime(marker.at)}</title>
                  </g>
                ))}
              </svg>
              <div className="account-tracker-scale">
                <span>{clockTime(chart.first.at)} · {money(chart.low)}</span>
                <span>B = buy · S = sell</span>
                <span>{clockTime(chart.last.at)} · {money(chart.high)}</span>
              </div>
            </>
          ) : (
            <div className="command-empty">
              {history?.status === "unavailable"
                ? "Broker equity history is temporarily unavailable. Current balances and executions remain live."
                : "Account equity history will appear after at least two broker history points are available."}
            </div>
          )}
        </div>

        <div className="account-tracker-side">
          <div className="account-tracker-metrics">
            <div><span>CASH</span><strong>{money(account.cash)}</strong></div>
            <div><span>BUYING POWER</span><strong>{money(account.buying_power)}</strong></div>
            <div><span>PREVIOUS EQUITY</span><strong>{money(account.last_equity)}</strong></div>
            <div><span>RISK REFERENCE</span><strong>{money(account.risk_reference_equity)}</strong></div>
          </div>
          <div className="account-tracker-fills">
            <div className="account-tracker-subhead">
              <span>RECENT FILLS</span>
              <strong>{recentFills.length}</strong>
            </div>
            {recentFills.length ? recentFills.slice(0, 8).map((order, index) => (
              <div className="account-tracker-fill" key={text(order.id, String(index))}>
                <time>{clockTime(order.filled_at)}</time>
                <b className={String(order.side).toLowerCase() === "buy" ? "is-buy" : "is-sell"}>{text(order.side).toUpperCase()}</b>
                <strong>{text(order.symbol)}</strong>
                <span>{text(order.filled_qty || order.qty)} @ {money(order.filled_avg_price)}</span>
              </div>
            )) : <div className="command-empty">No RHEN fills are recorded in the current broker snapshot.</div>}
          </div>
        </div>
      </div>
    </article>
  );
}
