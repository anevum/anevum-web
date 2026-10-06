import type { CommandCryptoLane, CommandExtendedEquityLane, CommandSnapshot } from "../lib/data";
import { clockTime, money, percent } from "../lib/format";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function list(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value as Record<string, unknown>[] : [];
}

function text(value: unknown, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function numeric(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function laneTone(lane?: CommandCryptoLane | null) {
  if (!lane || lane.available === false) return "offline";
  if (lane.last_error) return "degraded";
  if (lane.execution_healthy === false || lane.scanner_healthy === false) return "degraded";
  return "live";
}

function laneState(lane?: CommandCryptoLane | null) {
  if (!lane || lane.available === false) return "UNAVAILABLE";
  if (lane.last_error) return "DEGRADED";
  if (lane.active_positions && lane.active_positions > 0) return "POSITION OPEN";
  const approval = record(lane.pending_approval);
  if (text(approval.status, "").toUpperCase() === "PENDING_APPROVAL") return "ACTION READY";
  if (text(lane.execution_mode, "").includes("paper")) return "PAPER AUTONOMOUS";
  if (text(lane.execution_mode, "").includes("live_signal")) return "LIVE SIGNAL";
  return lane.execution_enabled ? "MONITORING" : "DISABLED";
}

function extendedTone(lane?: CommandExtendedEquityLane | null) {
  if (!lane || lane.enabled === false) return "offline";
  if (lane.last_error) return "degraded";
  return "live";
}

function extendedState(lane?: CommandExtendedEquityLane | null) {
  if (!lane) return "UNAVAILABLE";
  if (lane.enabled === false) return "DISABLED";
  if (lane.last_error) return "DEGRADED";
  if ((lane.active_positions || 0) > 0) return "POSITION OPEN";
  const session = text(lane.session?.session, "closed").toLowerCase();
  if (session === "regular") return "HANDOFF";
  if (session === "closed") return "CLOSED";
  if (lane.execution_authorized) return "ACTIVE";
  if (lane.execution_enabled) return "GATED";
  return "OBSERVING";
}

function LaneOrders({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <div className="trading-lane-empty">No recent orders.</div>;
  return (
    <div className="trading-lane-orders">
      {rows.slice(0, 5).map((order, index) => (
        <div className="trading-lane-order" key={text(order.id, String(index))}>
          <time>{clockTime(order.filled_at || order.submitted_at)}</time>
          <strong>{text(order.symbol)}</strong>
          <span>{text(order.side).toUpperCase()}</span>
          <span>{text(order.status).toUpperCase()}</span>
          <b>{order.filled_avg_price ? money(order.filled_avg_price) : "—"}</b>
        </div>
      ))}
    </div>
  );
}

function CryptoLane({
  title,
  subtitle,
  lane
}: {
  title: string;
  subtitle: string;
  lane?: CommandCryptoLane | null;
}) {
  const stats = record(lane?.stats);
  const positions = list(lane?.positions);
  const orders = list(lane?.recent_orders);
  const scan = record(lane?.last_scan);
  const btc = record(scan["BTC/USD"]);
  const approval = record(lane?.pending_approval);
  const winRate = numeric(stats.win_rate);
  const currentPosition = positions[0];
  const currentReturn = numeric(currentPosition?.unrealized_plpc);
  const state = laneState(lane);
  const preview = lane?.intraday_preview;

  return (
    <article className={"trading-lane-card trading-lane-" + laneTone(lane)}>
      <header>
        <div>
          <span>{title}</span>
          <strong>{state}</strong>
          <small>{subtitle}</small>
        </div>
        <div className="trading-lane-heartbeat">
          <i />
          <span>{clockTime(lane?.observed_at || lane?.last_scan_at || lane?.last_execution_at)}</span>
        </div>
      </header>

      <div className="trading-lane-metrics">
        <div><span>STRATEGY</span><strong>{text(lane?.strategy_version_id, "—")}</strong></div>
        <div><span>MODE</span><strong>{text(lane?.execution_mode, "—").replaceAll("_", " ").toUpperCase()}</strong></div>
        <div><span>POSITION</span><strong>{positions.length ? text(currentPosition.symbol, "BTC/USD") : "FLAT"}</strong></div>
        <div><span>W / L</span><strong>{text(stats.wins, "0")} / {text(stats.losses, "0")}</strong></div>
        <div><span>WIN RATE</span><strong>{winRate !== null ? percent(winRate) : "—"}</strong></div>
        <div><span>BROKER WRITES</span><strong>{lane?.broker_writes_allowed ? "ENABLED" : "BLOCKED"}</strong></div>
      </div>

      <section className="trading-lane-focus">
        <div>
          <span>CURRENT DECISION</span>
          <strong>{text(lane?.last_decision, "Waiting for runtime observation.")}</strong>
          {btc.reason ? <p>{text(btc.reason)}</p> : null}
        </div>
        <div>
          <span>POSITION STATE</span>
          {positions.length ? (
            <>
              <strong>{text(currentPosition.symbol)} · {text(currentPosition.qty)} units</strong>
              <p>
                {currentPosition.current_price ? money(currentPosition.current_price) : "—"}
                {currentReturn !== null ? " · " + percent(currentReturn) : ""}
              </p>
            </>
          ) : (
            <>
              <strong>NO OPEN POSITION</strong>
              <p>RHEN is continuously evaluating the lane.</p>
            </>
          )}
        </div>
      </section>

      {Object.keys(approval).length ? (
        <section className="trading-lane-alert">
          <span>PENDING ACTION</span>
          <strong>{text(approval.ticket_type, "ACTION")} · {text(approval.side).toUpperCase()}</strong>
          <p>{text(approval.reason, "RHEN generated an actionable signal.")}</p>
        </section>
      ) : null}

      {lane?.last_error ? (
        <section className="trading-lane-alert is-error">
          <span>LANE ERROR</span>
          <strong>{lane.last_error}</strong>
        </section>
      ) : null}

      {preview && preview.status !== "DISABLED" ? (
        <section className="trading-lane-alert">
          <span>INTRADAY DESIGN · UNVALIDATED</span>
          <strong>{text(preview.strategy_version_id)} · {text(preview.action, preview.status).toUpperCase()}</strong>
          <p>{text(preview.reason, "Market data observation unavailable.")}</p>
          <p>
            Observed {clockTime(preview.observed_at)} · flat account hypothesis · broker writes blocked.
            {preview.max_hold_minutes ? ` Holding limit ${preview.max_hold_minutes} minutes.` : ""}
          </p>
          {preview.cost_assumptions ? <p>
            Round-trip fee floor {percent(preview.cost_assumptions.minimum_round_trip_fee_pct)}
            {" · "}slippage floor {percent(preview.cost_assumptions.minimum_slippage_pct)} plus spread.
          </p> : null}
          {preview.activation_blockers?.length ? <p>
            Release blocked: {preview.activation_blockers.map(value => value.replaceAll("_", " ")).join("; ")}.
          </p> : null}
        </section>
      ) : null}

      <footer>
        <div>
          <span>RECENT ORDERS</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>LAST MARKET DATA</span>
          <strong>{clockTime(lane?.last_market_data_at)}</strong>
        </div>
      </footer>
      <LaneOrders rows={orders} />
    </article>
  );
}

function EquitiesLane({ snapshot }: { snapshot: CommandSnapshot }) {
  const bot = record(snapshot.bot);
  const strategy = record(snapshot.strategy);
  const extendedOwned = new Set(snapshot.extended_equity?.managed_symbols || []);
  const positions = list(snapshot.positions).filter(row => {
    const symbol = text(row.symbol, "");
    return !symbol.includes("/") && !extendedOwned.has(symbol);
  });
  const orders = list(snapshot.recent_orders).filter(row => {
    const symbol = text(row.symbol, "");
    const clientOrderId = text(row.client_order_id, "");
    return !symbol.includes("/") && !clientOrderId.includes("-ext-");
  });
  const scanner = record(snapshot.scanner);
  const lastSignal = Object.entries(scanner)
    .map(([symbol, raw]) => ({ symbol, row: record(raw) }))
    .find(item => text(item.row.action, "").toLowerCase() === "buy")
    || Object.entries(scanner).map(([symbol, raw]) => ({ symbol, row: record(raw) }))[0];

  return (
    <article className="trading-lane-card trading-lane-live">
      <header>
        <div>
          <span>EQUITIES / LIVE</span>
          <strong>{bot.runtime_paused ? "PAUSED" : bot.entries_enabled ? "ACTIVE" : "ENTRY LOCK"}</strong>
          <small>Primary RHEN equity execution lane</small>
        </div>
        <div className="trading-lane-heartbeat"><i /><span>{clockTime(bot.last_strategy_at)}</span></div>
      </header>

      <div className="trading-lane-metrics">
        <div><span>STRATEGY</span><strong>{text(strategy.name, text(strategy.strategy_name, "rolling momentum"))}</strong></div>
        <div><span>MODE</span><strong>{text(snapshot.mode, "live").toUpperCase()}</strong></div>
        <div><span>POSITIONS</span><strong>{positions.length}</strong></div>
        <div><span>SCANNED</span><strong>{Object.keys(scanner).length}</strong></div>
        <div><span>ORDERS</span><strong>{orders.length}</strong></div>
        <div><span>BROKER WRITES</span><strong>{bot.execution_authorized ? "ENABLED" : "BLOCKED"}</strong></div>
      </div>

      <section className="trading-lane-focus">
        <div>
          <span>CURRENT DECISION</span>
          <strong>{text(bot.last_decision, "Waiting for next equity cycle.")}</strong>
          {lastSignal ? <p>{lastSignal.symbol} · {text(lastSignal.row.action, "hold").toUpperCase()} · {text(lastSignal.row.reason, "waiting")}</p> : null}
        </div>
        <div>
          <span>POSITION STATE</span>
          {positions.length ? (
            <>
              <strong>{positions.slice(0, 3).map(row => text(row.symbol)).join(" · ")}</strong>
              <p>{positions.length} open equity position{positions.length === 1 ? "" : "s"}</p>
            </>
          ) : (
            <>
              <strong>FLAT</strong>
              <p>No open equity positions.</p>
            </>
          )}
        </div>
      </section>

      <footer>
        <div><span>RECENT ORDERS</span><strong>{orders.length}</strong></div>
        <div><span>LAST STRATEGY</span><strong>{clockTime(bot.last_strategy_at)}</strong></div>
      </footer>
      <LaneOrders rows={orders} />
    </article>
  );
}

function ExtendedEquitiesLane({ snapshot }: { snapshot: CommandSnapshot }) {
  const lane = snapshot.extended_equity;
  const session = lane?.session;
  const universe = lane?.universe;
  const scanner = lane?.scanner || {};
  const cache = lane?.data_cache;
  const managedSymbols = lane?.managed_symbols || [];
  const orders = list(snapshot.recent_orders).filter(row => {
    const symbol = text(row.symbol, "");
    const clientOrderId = text(row.client_order_id, "");
    return !symbol.includes("/") && clientOrderId.includes("-ext-");
  });
  const candidates = Object.entries(scanner)
    .map(([symbol, raw]) => ({ symbol, row: record(raw) }))
    .filter(item => text(item.row.action, "").toLowerCase() === "buy");
  const focus = candidates[0]
    || Object.entries(scanner).map(([symbol, raw]) => ({ symbol, row: record(raw) }))[0];
  const sessionLabel = text(session?.session, "closed").replaceAll("_", " ").toUpperCase();

  return (
    <article className={"trading-lane-card trading-lane-" + extendedTone(lane)}>
      <header>
        <div>
          <span>EQUITIES / EXTENDED 24/5</span>
          <strong>{extendedState(lane)}</strong>
          <small>Overnight · premarket · after-hours</small>
        </div>
        <div className="trading-lane-heartbeat">
          <i />
          <span>{clockTime(lane?.observed_at)}</span>
        </div>
      </header>

      <div className="trading-lane-metrics">
        <div><span>STRATEGY</span><strong>{text(lane?.strategy_version_id, "—")}</strong></div>
        <div><span>SESSION</span><strong>{sessionLabel}</strong></div>
        <div><span>POSITIONS</span><strong>{lane?.active_positions || 0}</strong></div>
        <div><span>SCANNED</span><strong>{Object.keys(scanner).length}</strong></div>
        <div><span>QUALIFIED</span><strong>{candidates.length}</strong></div>
        <div><span>BROKER WRITES</span><strong>{lane?.execution_authorized ? "ENABLED" : "BLOCKED"}</strong></div>
      </div>

      <section className="trading-lane-focus">
        <div>
          <span>CURRENT DECISION</span>
          <strong>{text(lane?.last_decision, "Waiting for extended-session observation.")}</strong>
          {focus ? (
            <p>
              {focus.symbol} · {text(focus.row.action, "hold").toUpperCase()} · {text(focus.row.reason, "waiting")}
            </p>
          ) : null}
        </div>
        <div>
          <span>SESSION / TAPE</span>
          <strong>
            {sessionLabel}
            {session?.tradable === true ? " · TRADABLE" : " · NO NEW EXTENDED ENTRIES"}
          </strong>
          <p>
            {managedSymbols.length ? managedSymbols.join(" · ") + " owned" : "No extended positions"}
            {" · "}{text(universe?.active_count, "0")} symbols
            {" · "}{text(cache?.bars, "0")} rolling bars
          </p>
        </div>
      </section>

      {lane?.execution_enabled && !lane?.execution_authorized ? (
        <section className="trading-lane-alert">
          <span>EXECUTION GATED</span>
          <strong>Observation is live; broker writes remain blocked.</strong>
          <p>The extended lane cannot place orders until its execution authorization is satisfied.</p>
        </section>
      ) : null}

      {lane?.last_error ? (
        <section className="trading-lane-alert is-error">
          <span>LANE ERROR</span>
          <strong>{lane.last_error}</strong>
        </section>
      ) : null}

      <footer>
        <div><span>RECENT EXT ORDERS</span><strong>{orders.length}</strong></div>
        <div><span>UNIVERSE UPDATED</span><strong>{clockTime(universe?.updated_at)}</strong></div>
      </footer>
      <LaneOrders rows={orders} />
    </article>
  );
}

export default function CommandTradingLanes({ snapshot }: { snapshot: CommandSnapshot }) {
  return (
    <section className="command-trading-lanes" aria-label="Live RHEN trading lanes">
      <header className="command-trading-lanes-heading">
        <div>
          <span>RHEN / LIVE TRADING</span>
          <strong>Regular, extended, and crypto execution in one operating view</strong>
        </div>
        <small>5s broker snapshot · 24/5 equities · 24/7 crypto</small>
      </header>
      <div className="command-trading-lanes-grid">
        <EquitiesLane snapshot={snapshot} />
        <ExtendedEquitiesLane snapshot={snapshot} />
        <CryptoLane
          title="CRYPTO / REAL ACCOUNT"
          subtitle="Live Alpaca account · signal authority"
          lane={snapshot.crypto_live}
        />
        <CryptoLane
          title="CRYPTO / PAPER CANARY"
          subtitle="Autonomous paper execution · validation lane"
          lane={snapshot.crypto_paper}
        />
      </div>
    </section>
  );
}
