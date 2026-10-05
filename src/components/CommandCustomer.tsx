import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { RhenSession } from "../lib/auth";
import {
  fetchCustomerCommand,
  pauseCustomerPaper,
  refreshCustomerBroker,
  resumeCustomerPaper,
  startCustomerAlpacaPaperOauth,
  updateCustomerAllocation,
  updateCustomerRisk,
  type CustomerCommandOverview
} from "../lib/command-platform";
import { dateTime, money, percent } from "../lib/format";
import Mark from "./Mark";
import SystemIcon from "./company/SystemIcon";
import "../styles/command-customer.css";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function reasonLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function CommandCustomer({
  session,
  onSignOut
}: {
  session: RhenSession;
  onSignOut(): Promise<void>;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTenant = session.active_tenant_id || session.tenants[0]?.tenant_id || "";
  const [tenantId, setTenantId] = useState(initialTenant);
  const [overview, setOverview] = useState<CustomerCommandOverview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [allocationFraction, setAllocationFraction] = useState("0.90");
  const [allocationCap, setAllocationCap] = useState("100");
  const [maxPosition, setMaxPosition] = useState("0.25");
  const [maxGross, setMaxGross] = useState("0.90");
  const [maxDailyLoss, setMaxDailyLoss] = useState("0.05");
  const [maxDrawdown, setMaxDrawdown] = useState("0.20");
  const [maxConcurrent, setMaxConcurrent] = useState("1");

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    try {
      const next = await fetchCustomerCommand(session, tenantId);
      setOverview(next);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Customer Command unavailable.");
    }
  }, [session, tenantId]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!overview) return;
    if (overview.allocation) {
      setAllocationFraction(String(overview.allocation.allocation_fraction ?? "0.90"));
      setAllocationCap(String(overview.allocation.absolute_cap ?? "100"));
    }
    if (overview.risk) {
      setMaxPosition(String(overview.risk.max_position_fraction ?? "0.25"));
      setMaxGross(String(overview.risk.max_gross_exposure_fraction ?? "0.90"));
      setMaxDailyLoss(String(overview.risk.max_daily_loss_fraction ?? "0.05"));
      setMaxDrawdown(String(overview.risk.max_drawdown_fraction ?? "0.20"));
      setMaxConcurrent(String(overview.risk.max_concurrent_positions ?? "1"));
    }
  }, [overview?.allocation?.allocation_id, overview?.risk?.risk_profile_id]);

  const oauthState = useMemo(() => new URLSearchParams(location.search).get("alpaca"), [location.search]);
  const oauthMessage = useMemo(() => new URLSearchParams(location.search).get("message"), [location.search]);

  useEffect(() => {
    if (!oauthState) return;
    void refresh();
    const clean = window.setTimeout(() => navigate("/command", { replace: true }), 6000);
    return () => window.clearTimeout(clean);
  }, [oauthState, navigate, refresh]);

  async function mutate(label: string, work: () => Promise<CustomerCommandOverview>) {
    setBusy(label);
    setError("");
    try {
      setOverview(await work());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Command update failed.");
    } finally {
      setBusy("");
    }
  }

  const account = record(overview?.account);
  const positions = overview?.positions || [];
  const orders = overview?.orders || [];
  const steps = overview?.onboarding.steps || [];
  const eligibilityReasons = overview?.eligibility?.reasons || [];
  const paperConnected = overview?.broker?.environment === "PAPER";
  const botEnabled = overview?.control?.bot_enabled === true;

  return (
    <div className="customer-command">
      <header className="customer-command-header">
        <div className="customer-command-brand">
          <Mark />
          <div>
            <span>ANEVUM / COMMAND</span>
            <strong>Paper Beta</strong>
          </div>
        </div>

        <div className="customer-command-account">
          {session.tenants.length > 1 ? (
            <select value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
              {session.tenants.map((tenant) => (
                <option key={tenant.tenant_id} value={tenant.tenant_id}>
                  {tenant.display_name || tenant.tenant_key || tenant.tenant_id}
                </option>
              ))}
            </select>
          ) : (
            <span>{overview?.tenant.display_name || session.tenants[0]?.display_name || "Customer"}</span>
          )}
          <small>{session.user?.email}</small>
          <button type="button" onClick={() => void onSignOut()}>Sign out</button>
        </div>
      </header>

      <main className="customer-command-main">
        <section className="customer-command-hero">
          <div>
            <span>CRYPTO AUTOMATION / PAPER ENVIRONMENT</span>
            <h1>{overview?.tenant.display_name || "Command"}</h1>
            <p>
              Connect an Alpaca paper account, choose RHEN capital authority, set risk limits,
              and observe every broker reconciliation and automation state from one place.
            </p>
          </div>
          <div className={"customer-command-state " + (botEnabled ? "is-active" : "")}>
            <i />
            <span>{botEnabled ? "RHEN PAPER ACTIVE" : "RHEN PAPER PAUSED"}</span>
            <small>Live customer trading remains disabled.</small>
          </div>
        </section>

        {oauthState && (
          <div className={"customer-command-notice " + (oauthState === "connected" ? "success" : "error")}>
            {oauthState === "connected"
              ? "Alpaca Paper connected and reconciliation requested."
              : "Alpaca connection was not completed: " + (oauthMessage || "connection failed")}
          </div>
        )}
        {error && <div className="customer-command-notice error">{error}</div>}

        <section className="customer-command-status-grid">
          <article>
            <span>BROKER</span>
            <strong>{paperConnected ? "ALPACA PAPER" : "NOT CONNECTED"}</strong>
            <small>{text(overview?.broker?.account_status, "Setup required")}</small>
          </article>
          <article>
            <span>STRATEGY</span>
            <strong>{text(overview?.strategy?.strategy_key, "Awaiting release")}</strong>
            <small>{text(overview?.strategy?.semantic_version)}</small>
          </article>
          <article>
            <span>EXECUTION GATE</span>
            <strong>{overview?.eligibility?.eligible ? "READY" : "CLOSED"}</strong>
            <small>{overview?.eligibility?.eligible ? "All paper gates pass" : eligibilityReasons[0] ? reasonLabel(eligibilityReasons[0]) : "Onboarding incomplete"}</small>
          </article>
          <article>
            <span>LAST RECONCILIATION</span>
            <strong>{text(overview?.reconciliation?.status, "NONE")}</strong>
            <small>{dateTime(overview?.reconciliation?.observed_at)}</small>
          </article>
        </section>

        <section className="customer-command-grid">
          <article className="customer-command-panel customer-command-onboarding">
            <header>
              <div><span>GET STARTED</span><strong>Paper onboarding</strong></div>
              <small>{steps.filter((step) => step.complete).length}/{steps.length} complete</small>
            </header>
            <div className="customer-command-steps">
              {steps.map((step, index) => (
                <div key={step.key} className={step.complete ? "complete" : ""}>
                  <b>{step.complete ? "✓" : index + 1}</b>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
            <div className="customer-command-actions">
              <button
                type="button"
                className="primary"
                disabled={busy !== ""}
                onClick={() => paperConnected
                  ? void mutate("refresh", () => refreshCustomerBroker(session, tenantId))
                  : void startCustomerAlpacaPaperOauth(session, tenantId).catch((nextError) => {
                      setError(nextError instanceof Error ? nextError.message : "Alpaca connection failed.");
                    })
                }
              >
                {paperConnected ? "Verify Alpaca state" : "Connect Alpaca Paper"}
              </button>
            </div>
          </article>

          <article className="customer-command-panel customer-command-balance">
            <header>
              <div><span>ACCOUNT</span><strong>Paper portfolio</strong></div>
              <small>Alpaca source of truth</small>
            </header>
            <div className="customer-command-balance-value">{money(account.equity)}</div>
            <dl>
              <div><dt>Cash</dt><dd>{money(account.cash)}</dd></div>
              <div><dt>Buying power</dt><dd>{money(account.buying_power)}</dd></div>
              <div><dt>RHEN allocation</dt><dd>{percent(overview?.allocation?.allocation_fraction)}</dd></div>
              <div><dt>Allocation cap</dt><dd>{money(overview?.allocation?.absolute_cap)}</dd></div>
            </dl>
          </article>

          <article className="customer-command-panel customer-command-control">
            <header>
              <div><span>AUTOMATION</span><strong>RHEN control</strong></div>
              <small>Paper only</small>
            </header>
            <div className={"customer-command-control-state " + (botEnabled ? "on" : "off")}>
              <SystemIcon system="RHEN" size="sm" />
              <div>
                <strong>{botEnabled ? "Enabled" : "Paused"}</strong>
                <span>{botEnabled ? "New paper entries may pass when all gates are ready." : "No new tenant paper entries are authorized."}</span>
              </div>
            </div>
            <div className="customer-command-actions">
              {botEnabled ? (
                <button
                  type="button"
                  className="danger"
                  disabled={busy !== "" || !paperConnected}
                  onClick={() => void mutate("pause", () => pauseCustomerPaper(session, tenantId))}
                >Pause RHEN</button>
              ) : (
                <button
                  type="button"
                  className="primary"
                  disabled={busy !== "" || !paperConnected}
                  onClick={() => void mutate("resume", () => resumeCustomerPaper(session, tenantId))}
                >Accept paper consent & enable</button>
              )}
            </div>
            <small className="customer-command-disclosure">
              This control cannot authorize live trading, withdrawals, or funding movement.
            </small>
          </article>

          <article className="customer-command-panel customer-command-config">
            <header>
              <div><span>CAPITAL AUTHORITY</span><strong>RHEN allocation</strong></div>
              <small>Separate from account balance</small>
            </header>
            <div className="customer-command-form-grid">
              <label>
                <span>Allocation %</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={(Number(allocationFraction) * 100).toString()}
                  onChange={(event) => setAllocationFraction((Number(event.target.value) / 100).toString())}
                />
              </label>
              <label>
                <span>Absolute cap</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={allocationCap}
                  onChange={(event) => setAllocationCap(event.target.value)}
                />
              </label>
            </div>
            <div className="customer-command-actions">
              <button
                type="button"
                disabled={busy !== "" || !paperConnected}
                onClick={() => void mutate(
                  "allocation",
                  () => updateCustomerAllocation(
                    session,
                    tenantId,
                    Number(allocationFraction),
                    Number(allocationCap)
                  )
                )}
              >Save allocation</button>
            </div>
          </article>

          <article className="customer-command-panel customer-command-config customer-command-risk">
            <header>
              <div><span>RISK</span><strong>Account guardrails</strong></div>
              <small>Higher-level platform gates always win</small>
            </header>
            <div className="customer-command-form-grid risk">
              <label><span>Max position %</span><input type="number" min="1" max="100" value={(Number(maxPosition) * 100).toString()} onChange={(event) => setMaxPosition((Number(event.target.value) / 100).toString())} /></label>
              <label><span>Max gross %</span><input type="number" min="1" max="100" value={(Number(maxGross) * 100).toString()} onChange={(event) => setMaxGross((Number(event.target.value) / 100).toString())} /></label>
              <label><span>Daily loss %</span><input type="number" min="0.1" max="25" step="0.1" value={(Number(maxDailyLoss) * 100).toString()} onChange={(event) => setMaxDailyLoss((Number(event.target.value) / 100).toString())} /></label>
              <label><span>Drawdown %</span><input type="number" min="0.1" max="50" step="0.1" value={(Number(maxDrawdown) * 100).toString()} onChange={(event) => setMaxDrawdown((Number(event.target.value) / 100).toString())} /></label>
              <label><span>Max positions</span><input type="number" min="1" max="20" value={maxConcurrent} onChange={(event) => setMaxConcurrent(event.target.value)} /></label>
            </div>
            <div className="customer-command-actions">
              <button
                type="button"
                disabled={busy !== "" || !paperConnected}
                onClick={() => void mutate(
                  "risk",
                  () => updateCustomerRisk(session, tenantId, {
                    maxPositionFraction: Number(maxPosition),
                    maxGrossExposureFraction: Number(maxGross),
                    maxDailyLossFraction: Number(maxDailyLoss),
                    maxDrawdownFraction: Number(maxDrawdown),
                    maxConcurrentPositions: Number(maxConcurrent)
                  })
                )}
              >Save risk profile</button>
            </div>
          </article>

          <article className="customer-command-panel customer-command-eligibility">
            <header>
              <div><span>READINESS</span><strong>Execution gates</strong></div>
              <small>Fail closed</small>
            </header>
            {overview?.eligibility?.eligible ? (
              <div className="customer-command-ready">All current paper gates pass.</div>
            ) : (
              <div className="customer-command-reasons">
                {(eligibilityReasons.length ? eligibilityReasons : ["onboarding_incomplete"]).map((reason) => (
                  <span key={reason}>{reasonLabel(reason)}</span>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="customer-command-lower-grid">
          <article className="customer-command-panel">
            <header>
              <div><span>POSITIONS</span><strong>{positions.length} open</strong></div>
              <small>Broker-reconciled</small>
            </header>
            <div className="customer-command-table">
              {positions.length ? positions.map((position, index) => (
                <div className="customer-command-row" key={text(position.asset_id, String(index))}>
                  <strong>{text(position.symbol)}</strong>
                  <span>{text(position.side).toUpperCase()}</span>
                  <span>{text(position.qty)} units</span>
                  <span>{money(position.market_value)}</span>
                  <b>{percent(position.unrealized_plpc)}</b>
                </div>
              )) : <div className="customer-command-empty">No reconciled paper positions.</div>}
            </div>
          </article>

          <article className="customer-command-panel">
            <header>
              <div><span>ORDERS</span><strong>Recent broker state</strong></div>
              <small>{orders.length} observed</small>
            </header>
            <div className="customer-command-table">
              {orders.length ? orders.slice(0, 12).map((order, index) => (
                <div className="customer-command-row" key={text(order.id, String(index))}>
                  <strong>{text(order.symbol)}</strong>
                  <span>{text(order.side).toUpperCase()}</span>
                  <span>{text(order.status).toUpperCase()}</span>
                  <span>{text(order.filled_qty, text(order.qty))}</span>
                  <b>{money(order.filled_avg_price)}</b>
                </div>
              )) : <div className="customer-command-empty">No reconciled paper orders.</div>}
            </div>
          </article>

          <article className="customer-command-panel customer-command-activity">
            <header>
              <div><span>ACTIVITY</span><strong>What actually happened</strong></div>
              <small>No decorative activity</small>
            </header>
            <div className="customer-command-timeline">
              {(overview?.activity || []).length ? (overview?.activity || []).slice(0, 16).map((event, index) => (
                <div key={event.object_id + "-" + index}>
                  <i />
                  <div>
                    <strong>{reasonLabel(text(event.action, "event"))}</strong>
                    <span>{text(record(event.payload).status, text(record(event.payload).error_code, text(event.object_type)))}</span>
                  </div>
                  <time>{dateTime(event.occurred_at)}</time>
                </div>
              )) : <div className="customer-command-empty">No tenant activity recorded yet.</div>}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
