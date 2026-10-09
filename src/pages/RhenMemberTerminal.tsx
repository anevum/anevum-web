import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/rhen-member-terminal.css";

type BrokerStatus = {
  connectionAvailable: boolean;
  accountConnected: boolean;
  accountReadAvailable?: boolean;
  liveTradingEnabled: boolean;
  brokerWriteEnabled?: boolean;
  account?: { ending?: string } | null;
};
type Portfolio = {
  available: true;
  broker: string;
  environment: "live";
  accountEnding: string;
  account: {
    currency: string | null;
    equityCents: number | null;
    cashCents: number | null;
    buyingPowerCents: number | null;
    lastEquityCents: number | null;
    status: string;
  };
  observedAt: string;
  marketOpen: boolean;
  positions: {
    symbol: string; assetClass: string; qty: string | null;
    marketValueCents: number | null; unrealizedPlCents: number | null;
  }[];
  orders: {
    symbol: string; side: string; qty: string | null; filledQty: string | null;
    type: string; status: string; submittedAt: string | null;
  }[];
  positionsTruncated: boolean;
  ordersTruncated: boolean;
  canSubmitOrders: false;
  canTransferFunds: false;
  executionEnabled: false;
  dataMode: "polled_broker_snapshot";
};
type DraftStatus = {
  available: boolean;
  draft: {
    label: string; marketScope: string; direction: string;
    maxOpenPositions: number; maxTotalExposurePercent: number;
    maxPositionPercent: number; updatedAt: string;
  } | null;
  executionEnabled: false;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
function showMoney(value: number | null | undefined) {
  return typeof value === "number" && Number.isSafeInteger(value)
    ? money.format(value / 100) : "Unavailable";
}
function readableTime(value: string | null | undefined) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function RhenMemberTerminal() {
  const [broker, setBroker] = useState<BrokerStatus | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [draft, setDraft] = useState<DraftStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    setError("");
    try {
      const accountResp = await fetch("/api/member/brokerage", {
        cache: "no-store", signal
      });
      if (!accountResp.ok) throw new Error("Your member brokerage status is unavailable.");
      const status = await accountResp.json() as BrokerStatus;
      if (signal?.aborted) return;
      if (status.liveTradingEnabled || status.brokerWriteEnabled) {
        throw new Error("Unexpected trading permission. Do not use this workspace.");
      }
      setBroker(status);
      const draftResp = await fetch("/api/member/rhen/draft", {
        cache: "no-store", signal
      });
      if (draftResp.ok) {
        const d = await draftResp.json() as DraftStatus;
        if (d.executionEnabled) throw new Error("Unexpected draft execution authority.");
        if (!signal?.aborted) setDraft(d);
      } else if (!signal?.aborted) {
        setDraft(null);
      }

      if (status.accountConnected && status.accountReadAvailable) {
        const snapshotResp = await fetch("/api/member/alpaca/live/snapshot", {
          cache: "no-store", signal
        });
        if (!snapshotResp.ok) throw new Error("Read-only Alpaca data is unavailable.");
        const snapshot = await snapshotResp.json() as Portfolio;
        if (!snapshot.available || snapshot.canSubmitOrders ||
            snapshot.canTransferFunds || snapshot.executionEnabled ||
            snapshot.dataMode !== "polled_broker_snapshot" ||
            snapshot.accountEnding !== status.account?.ending) {
          throw new Error("Broker data could not be verified for your account.");
        }
        if (!signal?.aborted) setPortfolio(snapshot);
      } else if (!signal?.aborted) {
        setPortfolio(null);
      }
      if (!signal?.aborted) setLastCheck(new Date().toISOString());
    } catch (e) {
      if (!signal?.aborted) {
        setPortfolio(null);
        setError(e instanceof Error ? e.message : "RHEN account could not be refreshed.");
      }
    } finally {
      if (!signal?.aborted) { setBusy(false); setLoading(false); }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    // Thirty-second polling, not a realtime feed. Skip background tabs.
    const interval = window.setInterval(() => {
      if (!document.hidden) void load(controller.signal);
    }, 30000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [load]);

  const connected = broker?.accountConnected === true;
  const current = Boolean(portfolio);
  return (
    <div className="rhen-member-terminal" aria-label="Your private RHEN member terminal">
      <div className="rhen-member-terminal-header">
        <div>
          <h2>My RHEN terminal</h2>
          <p>Only your authenticated member account. This terminal is separate from ANEVUM's company RHEN bot.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={busy || loading}>
          {busy ? "Checking…" : "Refresh account"}
        </button>
      </div>
      <div className="rhen-member-terminal-state" aria-label="Member trading status">
        <div><span>Alpaca connection</span><strong>{connected ? "Linked" : "Not linked"}</strong></div>
        <div><span>Account observations</span><strong>{current ? "Broker snapshot" : connected ? "Not available" : "Not connected"}</strong></div>
        <div><span>RHEN automated trading</span><strong>Disabled — prelaunch</strong></div>
        <div><span>Last checked</span><strong>{readableTime(lastCheck)}</strong></div>
      </div>
      {loading && <p role="status">Checking your personal account…</p>}
      {error && <div role="alert" className="rhen-member-terminal-warning">
        <strong>Account data unavailable.</strong> {error} Previously retrieved balances and positions have been cleared rather than displayed as current.
      </div>}
      <div className="rhen-member-terminal-grid">
        <section className="rhen-member-terminal-card">
          <div className="rhen-member-terminal-cardhead">
            <div><p>ACCOUNT / USD</p><h3>Brokerage overview</h3></div>
            {current && <span className="rhen-member-terminal-badge">Read-only</span>}
          </div>
          {current && portfolio ? <>
            <p className="rhen-member-terminal-caption">Alpaca live account ending {portfolio.accountEnding}. Broker-sourced snapshot, not a stream.</p>
            <dl className="rhen-member-terminal-metrics">
              <div><dt>Account equity</dt><dd>{showMoney(portfolio.account.equityCents)}</dd></div>
              <div><dt>Cash</dt><dd>{showMoney(portfolio.account.cashCents)}</dd></div>
              <div><dt>Buying power</dt><dd>{showMoney(portfolio.account.buyingPowerCents)}</dd></div>
              <div><dt>U.S. market</dt><dd>{portfolio.marketOpen ? "Open" : "Closed"}</dd></div>
            </dl>
            <p className="rhen-member-terminal-caption">Observed {readableTime(portfolio.observedAt)}. Values may change between checks.</p>
          </> : <>
            <div className="rhen-member-terminal-empty">
              <p>{connected
                ? "Your account connection is recorded, but member portfolio reading has not been approved or verified."
                : "Connect your own Alpaca account when Alpaca Connect approval is granted. No account balances are assumed."}</p>
              <Link to="/apps/rhen/connect">{connected ? "Review connection disclosure" : "Learn about Alpaca connection"} →</Link>
            </div>
          </>}
        </section>
        <section className="rhen-member-terminal-card">
          <div className="rhen-member-terminal-cardhead">
            <div><p>CONFIGURATION / MEMBER-OWNED</p><h3>Your bot limits</h3></div>
            <span className="rhen-member-terminal-badge">Inactive</span>
          </div>
          {draft?.draft ? <>
            <strong className="rhen-member-terminal-strategy">{draft.draft.label}</strong>
            <dl className="rhen-member-terminal-metrics">
              <div><dt>Positions</dt><dd>{draft.draft.maxOpenPositions} maximum</dd></div>
              <div><dt>Total allocation</dt><dd>{draft.draft.maxTotalExposurePercent}% ceiling</dd></div>
              <div><dt>Single position</dt><dd>{draft.draft.maxPositionPercent}% ceiling</dd></div>
              <div><dt>Direction</dt><dd>Long equities/ETFs</dd></div>
            </dl>
            <p className="rhen-member-terminal-caption">Planning limits only. Operator limits may be stricter. No strategy is running.</p>
          </> : <div className="rhen-member-terminal-empty"><p>No active trading strategy or risk configuration. You can prepare settings without connecting a broker.</p></div>}
          <Link className="rhen-member-terminal-link" to="/apps/rhen/setup">{draft?.draft ? "Edit my limits" : "Prepare my bot settings"} →</Link>
        </section>
      </div>
      <section className="rhen-member-terminal-card">
        <div className="rhen-member-terminal-cardhead">
          <div><p>YOUR ACCOUNT / NOT ANEVUM COMPANY TRADES</p><h3>Current positions</h3></div>
          <span className="rhen-member-terminal-badge">{current ? "Broker-provided" : "Not available"}</span>
        </div>
        {portfolio?.positions.length ? <div className="rhen-member-terminal-table-wrap">
          <table><thead><tr><th scope="col">Symbol</th><th scope="col">Quantity</th><th scope="col">Market value</th><th scope="col">Unrealized P/L</th></tr></thead>
            <tbody>{portfolio.positions.map((pos, i) => <tr key={pos.symbol + "-" + i}>
              <th scope="row">{pos.symbol}{pos.assetClass === "other" && <small>Outside initial RHEN execution scope</small>}</th>
              <td>{pos.qty ?? "Unavailable"}</td>
              <td>{showMoney(pos.marketValueCents)}</td>
              <td>{showMoney(pos.unrealizedPlCents)}</td>
            </tr>)}</tbody></table>
          {portfolio.positionsTruncated && <p className="rhen-member-terminal-caption">Only the first 50 positions are shown.</p>}
        </div> : <p className="rhen-member-terminal-empty">{portfolio ? "No current broker positions reported." : "No verified brokerage positions to display."}</p>}
      </section>
      <section className="rhen-member-terminal-card">
        <div className="rhen-member-terminal-cardhead">
          <div><p>ACCOUNT HISTORY / READ-ONLY</p><h3>Recent Alpaca orders</h3></div>
          <span className="rhen-member-terminal-badge">No member order controls</span>
        </div>
        {portfolio?.orders.length ? <div className="rhen-member-terminal-table-wrap">
          <table><thead><tr><th scope="col">Submitted</th><th scope="col">Symbol</th><th scope="col">Side</th><th scope="col">Filled / requested</th><th scope="col">Status</th></tr></thead>
          <tbody>{portfolio.orders.map((order, i) => <tr key={order.symbol + "-" + order.submittedAt + "-" + i}>
            <td>{readableTime(order.submittedAt)}</td>
            <th scope="row">{order.symbol}</th>
            <td>{order.side}</td>
            <td>{order.filledQty ?? "—"} / {order.qty ?? "—"}</td>
            <td>{order.status.replaceAll("_", " ")}</td>
          </tr>)}</tbody></table>
          {portfolio.ordersTruncated && <p className="rhen-member-terminal-caption">Only 20 recent orders are shown.</p>}
        </div> : <p className="rhen-member-terminal-empty">{portfolio ? "No recent brokerage orders reported." : "No verified brokerage order history available."}</p>}
        <p className="rhen-member-terminal-caption">This list reflects brokerage activity, not necessarily orders generated by RHEN. Broker order execution, cancellation, and funds transfers are unavailable in this member terminal.</p>
      </section>
      <p className="rhen-member-terminal-footnote">
        This is a personal read-only account workspace. Alpaca Connect approval, legal and security review,
        independent live execution deployment, and explicit member activation are still required.
        No market prices, trade results, or account balances are synthesized when unavailable.
      </p>
    </div>
  );
}
