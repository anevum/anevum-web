import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/member-terminal.css";

type TerminalReadiness = {
  terminalScope: "personal";
  ownerMember: boolean;
  provider: "alpaca";
  connectionAvailable: boolean;
  brokerageConnected: boolean;
  account: null;
  portfolio: null;
  positions: null;
  orders: null;
  personalBotRunning: false;
  paperTradingEnabled: false;
  liveTradingEnabled: false;
  depositsEnabled: false;
  withdrawalsEnabled: false;
};

const EMPTY = "Not connected";

export default function MemberRhenTerminal() {
  const [status, setStatus] = useState<TerminalReadiness | null>(null);
  const [error, setError] = useState(false);
  const [operator, setOperator] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setStatus(null);
    setOperator(false);
    setError(false);
    void (async () => {
      try {
        const response = await fetch("/api/member/rhen/terminal", {
          method: "GET", cache: "no-store", signal: controller.signal
        });
        if (!response.ok) throw new Error("Member terminal is unavailable.");
        const next = await response.json() as TerminalReadiness;
        // Fail closed if a backend ever starts returning company or other-account
        // trading data through an ordinary member terminal endpoint.
        if (next.terminalScope !== "personal" ||
          next.connectionAvailable || next.brokerageConnected ||
          next.account !== null || next.portfolio !== null ||
          next.positions !== null || next.orders !== null ||
          next.paperTradingEnabled || next.liveTradingEnabled ||
          next.personalBotRunning || next.depositsEnabled || next.withdrawalsEnabled) {
          throw new Error("Unexpected trading authority in personal terminal.");
        }
        if (controller.signal.aborted) return;
        setStatus(next);
        // This company link is considered only for the bound owner-member ID.
        // The backend still requires separate, verified operator authentication.
        if (next.ownerMember) {
          const owner = await fetch("/api/command/session", {
            method: "GET", cache: "no-store", signal: controller.signal
          }).then(response => response.ok ? response.json() : null).catch(() => null);
          if (!controller.signal.aborted) {
            setOperator(owner?.command_admin === true && owner?.auth_source === "cloudflare_access");
          }
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <div className="member-rhen-terminal">
      <header className="member-rhen-terminal-header">
        <div>
          <p className="workshop-kicker">RHEN / PERSONAL TERMINAL</p>
          <h2>Your RHEN Terminal</h2>
          <p>A private workspace for your own brokerage and RHEN settings. It is separate from ANEVUM's company trading account.</p>
        </div>
        <span className="member-rhen-terminal-state">{status ? EMPTY : error ? "Unavailable" : "Checking"}</span>
      </header>
      {error ? (
        <div className="member-rhen-terminal-empty" role="alert">
          <h3>Terminal status unavailable</h3>
          <p>Personal trading state could not be verified. No brokerage data is displayed.</p>
        </div>
      ) : !status ? (
        <p role="status">Verifying your account's terminal…</p>
      ) : (
        <>
          {status.ownerMember && operator && (
            <div className="member-rhen-terminal-owner">
              <strong>Company RHEN Terminal</strong>
              <p>Your existing ANEVUM trading and research system remains separately protected.</p>
              <Link to="/command/rhen/operate">Open your existing terminal →</Link>
            </div>
          )}
          <div className="member-rhen-terminal-grid">
            <section><span>BROKERAGE</span><strong>{EMPTY}</strong><small>Personal Alpaca connection not available</small></section>
            <section><span>PORTFOLIO</span><strong>—</strong><small>No personal account data</small></section>
            <section><span>BOT</span><strong>Inactive</strong><small>No member orders or execution</small></section>
            <section><span>TRADING MODE</span><strong>Unavailable</strong><small>Paper and live execution disabled</small></section>
          </div>
          <div className="member-rhen-terminal-empty">
            <h3>No brokerage linked</h3>
            <p>When personal Alpaca connections become available, this terminal will display only your positions, orders, performance, and bot configuration. It will never reuse the company brokerage account.</p>
            <Link to="/apps/rhen/setup">Manage your non-executing bot draft →</Link>
          </div>
        </>
      )}
    </div>
  );
}
