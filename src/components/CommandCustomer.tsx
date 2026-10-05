import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { RhenSession } from "../lib/auth";
import {
  fetchCommandAccount,
  fetchCommandActivity,
  fetchCommandMoney,
  fetchCommandOverview,
  fetchCommandTrading,
  type CommandAccountSurface,
  type CommandActivitySurface,
  type CommandMoneySurface,
  type CommandOverviewSurface,
  type CommandTradingSurface
} from "../lib/command-customer";
import {
  pauseCustomerPaper,
  refreshCustomerBroker,
  resumeCustomerPaper,
  startCustomerAlpacaPaperOauth,
  updateCustomerAllocation,
  updateCustomerRisk
} from "../lib/command-platform";
import { dateTime, money, percent } from "../lib/format";
import Mark from "./Mark";
import SystemIcon from "./company/SystemIcon";
import "../styles/command-customer-v2.css";

type CustomerPage = "overview" | "trading" | "money" | "activity" | "settings" | "system";

const NAV: Array<{ page: CustomerPage; label: string; mark: string }> = [
  { page: "overview", label: "Overview", mark: "O" },
  { page: "trading", label: "Trading", mark: "T" },
  { page: "money", label: "Money", mark: "$" },
  { page: "activity", label: "Activity", mark: "A" },
  { page: "settings", label: "Settings", mark: "S" },
  { page: "system", label: "System", mark: "//" }
];

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function label(value: unknown) {
  return text(value).replaceAll("_", " ");
}

function surfacePage(pathname: string): CustomerPage {
  const page = pathname.split("/")[2] || "overview";
  return NAV.some(item => item.page === page) ? page as CustomerPage : "overview";
}

function StatusPill({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const tone = normalized === "ACTIVE" || normalized === "READY" || normalized === "FUNDED"
    ? "good"
    : normalized.includes("REQUIRED") || normalized.includes("PENDING")
      ? "warn"
      : normalized === "PAUSED"
        ? "quiet"
        : "neutral";
  return <span className={"cc2-pill " + tone}>{label(value)}</span>;
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
  const page = surfacePage(location.pathname);
  const initialTenant = session.active_tenant_id || session.tenants[0]?.tenant_id || "";

  const [tenantId, setTenantId] = useState(initialTenant);
  const [accountSurface, setAccountSurface] = useState<CommandAccountSurface | null>(null);
  const [overview, setOverview] = useState<CommandOverviewSurface | null>(null);
  const [trading, setTrading] = useState<CommandTradingSurface | null>(null);
  const [moneySurface, setMoneySurface] = useState<CommandMoneySurface | null>(null);
  const [activity, setActivity] = useState<CommandActivitySurface | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const [allocationFraction, setAllocationFraction] = useState("0.90");
  const [allocationCap, setAllocationCap] = useState("100");
  const [maxPosition, setMaxPosition] = useState("0.25");
  const [maxGross, setMaxGross] = useState("0.90");
  const [maxDailyLoss, setMaxDailyLoss] = useState("0.05");
  const [maxDrawdown, setMaxDrawdown] = useState("0.20");
  const [maxConcurrent, setMaxConcurrent] = useState("1");

  const oauthState = useMemo(
    () => new URLSearchParams(location.search).get("alpaca"),
    [location.search]
  );
  const oauthMessage = useMemo(
    () => new URLSearchParams(location.search).get("message"),
    [location.search]
  );

  useEffect(() => {
    if (location.pathname !== "/command") return;
    navigate(oauthState ? "/command/settings" + location.search : "/command/overview", {
      replace: true
    });
  }, [location.pathname, location.search, navigate, oauthState]);

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [nextAccount, nextOverview, nextTrading, nextMoney, nextActivity] = await Promise.all([
        fetchCommandAccount(session, tenantId),
        fetchCommandOverview(session, tenantId),
        fetchCommandTrading(session, tenantId),
        fetchCommandMoney(session, tenantId),
        fetchCommandActivity(session, tenantId)
      ]);
      setAccountSurface(nextAccount);
      setOverview(nextOverview);
      setTrading(nextTrading);
      setMoneySurface(nextMoney);
      setActivity(nextActivity);
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
    const allocation = record(trading?.allocation);
    const risk = record(trading?.risk);
    if (Object.keys(allocation).length) {
      setAllocationFraction(String(allocation.allocation_fraction ?? "0.90"));
      setAllocationCap(String(allocation.absolute_cap ?? "100"));
    }
    if (Object.keys(risk).length) {
      setMaxPosition(String(risk.max_position_fraction ?? "0.25"));
      setMaxGross(String(risk.max_gross_exposure_fraction ?? "0.90"));
      setMaxDailyLoss(String(risk.max_daily_loss_fraction ?? "0.05"));
      setMaxDrawdown(String(risk.max_drawdown_fraction ?? "0.20"));
      setMaxConcurrent(String(risk.max_concurrent_positions ?? "1"));
    }
  }, [trading?.allocation, trading?.risk]);

  useEffect(() => {
    if (!oauthState) return;
    void refresh();
    const timer = window.setTimeout(() => {
      navigate("/command/settings", { replace: true });
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [oauthState, navigate, refresh]);

  async function mutate(name: string, work: () => Promise<unknown>) {
    setBusy(name);
    setError("");
    try {
      await work();
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Command update failed.");
    } finally {
      setBusy("");
    }
  }

  const lifecycle = accountSurface?.lifecycle || overview?.lifecycle || {};
  const lifecycleState = lifecycle.state || "LOADING";
  const nextAction = lifecycle.next_action || "Loading account state";
  const funding = moneySurface?.funding || overview?.funding || {};
  const broker = record(accountSurface?.broker || moneySurface?.broker);
  const allocation = record(trading?.allocation || moneySurface?.allocation);
  const risk = record(trading?.risk);
  const strategy = record(trading?.strategy || overview?.strategy);
  const control = record(trading?.control);
  const reconciliation = record(trading?.reconciliation || overview?.reconciliation);
  const positions = trading?.positions || [];
  const orders = trading?.orders || [];
  const events = activity?.activity || [];
  const reasons = trading?.eligibility?.reasons || [];
  const paperConnected = String(broker.environment || "") === "PAPER";
  const funded = funding.funded === true;
  const botEnabled = control.bot_enabled === true;
  const executionReady = trading?.eligibility?.eligible === true;
  const mode = overview?.mode || trading?.mode || "PAPER";

  const automationState = executionReady
    ? "ACTIVE"
    : botEnabled
      ? "ENABLED / WAITING"
      : "PAUSED";

  function OverviewPage() {
    const steps = accountSurface?.onboarding.steps || [];
    return (
      <>
        <section className="cc2-hero">
          <div>
            <span>ANEVUM COMMAND / {mode}</span>
            <h1>{text(accountSurface?.tenant.display_name, "Command")}</h1>
            <p>{nextAction}</p>
          </div>
          <div className="cc2-hero-state">
            <StatusPill value={lifecycleState} />
            <strong>RHEN {automationState}</strong>
            <small>{executionReady ? "All current paper execution gates pass." : "No active execution is implied by setup state."}</small>
          </div>
        </section>

        <section className="cc2-metrics">
          <article><span>Broker equity</span><strong>{money(funding.equity)}</strong><small>Alpaca source of truth</small></article>
          <article><span>Crypto capacity</span><strong>{money(funding.available_for_crypto)}</strong><small>{funded ? "Funded" : "Funding required"}</small></article>
          <article><span>RHEN allocation</span><strong>{percent(allocation.allocation_fraction)}</strong><small>Cap {money(allocation.absolute_cap)}</small></article>
          <article><span>Strategy</span><strong>{text(strategy.strategy_key, "Awaiting release")}</strong><small>{text(strategy.semantic_version)}</small></article>
        </section>

        <section className="cc2-grid two">
          <article className="cc2-card">
            <header><div><span>SETUP</span><strong>Paper onboarding</strong></div><small>{steps.filter(step => step.complete).length}/{steps.length}</small></header>
            <div className="cc2-steps">
              {steps.map((step, index) => (
                <div key={step.key} className={step.complete ? "done" : ""}>
                  <b>{step.complete ? "✓" : index + 1}</b><span>{step.label}</span>
                </div>
              ))}
            </div>
            <Link className="cc2-link" to="/command/settings">Open setup & settings</Link>
          </article>

          <article className="cc2-card">
            <header><div><span>TRADING</span><strong>RHEN paper state</strong></div><StatusPill value={automationState} /></header>
            <div className="cc2-rhen">
              <SystemIcon system="RHEN" size="md" />
              <div><strong>{positions.length} positions · {orders.length} observed orders</strong><span>{reasons[0] ? label(reasons[0]) : "No execution blocker reported."}</span></div>
            </div>
            <Link className="cc2-link" to="/command/trading">Open Trading</Link>
          </article>
        </section>

        <section className="cc2-card">
          <header><div><span>RECENT ACTIVITY</span><strong>Account timeline</strong></div><Link to="/command/activity">View all</Link></header>
          <ActivityRows rows={events.slice(0, 8)} />
        </section>
      </>
    );
  }

  function TradingPage() {
    return (
      <>
        <section className="cc2-section-head">
          <div><span>TRADING</span><h1>RHEN</h1><p>Customer authority, positions, orders, risk, and the current approved release.</p></div>
          <div className="cc2-actions">
            {botEnabled ? (
              <button className="danger" disabled={Boolean(busy) || !paperConnected} onClick={() => void mutate("pause", () => pauseCustomerPaper(session, tenantId))}>Pause new entries</button>
            ) : (
              <button className="primary" disabled={Boolean(busy) || !paperConnected} onClick={() => void mutate("resume", () => resumeCustomerPaper(session, tenantId))}>Enable paper automation</button>
            )}
          </div>
        </section>

        <section className="cc2-metrics">
          <article><span>State</span><strong>{automationState}</strong><small>{mode}</small></article>
          <article><span>Release</span><strong>{text(strategy.semantic_version)}</strong><small>{text(strategy.lifecycle_state)}</small></article>
          <article><span>Allocation</span><strong>{percent(allocation.allocation_fraction)}</strong><small>{money(allocation.absolute_cap)} cap</small></article>
          <article><span>Reconciliation</span><strong>{text(reconciliation.status, "NONE")}</strong><small>{dateTime(reconciliation.observed_at)}</small></article>
        </section>

        {!executionReady && (
          <article className="cc2-card cc2-blockers">
            <header><div><span>EXECUTION GATES</span><strong>Fail closed</strong></div></header>
            <div className="cc2-tags">{(reasons.length ? reasons : ["onboarding_incomplete"]).map(reason => <span key={reason}>{label(reason)}</span>)}</div>
          </article>
        )}

        <section className="cc2-grid two">
          <article className="cc2-card"><header><div><span>POSITIONS</span><strong>{positions.length} open</strong></div></header><PositionRows rows={positions} /></article>
          <article className="cc2-card"><header><div><span>ORDERS</span><strong>{orders.length} observed</strong></div></header><OrderRows rows={orders.slice(0, 16)} /></article>
        </section>

        <section className="cc2-grid two">
          <article className="cc2-card">
            <header><div><span>ACCOUNT RISK</span><strong>Guardrails</strong></div></header>
            <dl className="cc2-dl">
              <div><dt>Max position</dt><dd>{percent(risk.max_position_fraction)}</dd></div>
              <div><dt>Max gross</dt><dd>{percent(risk.max_gross_exposure_fraction)}</dd></div>
              <div><dt>Daily loss</dt><dd>{percent(risk.max_daily_loss_fraction)}</dd></div>
              <div><dt>Drawdown</dt><dd>{percent(risk.max_drawdown_fraction)}</dd></div>
            </dl>
            <Link className="cc2-link" to="/command/settings">Edit guardrails</Link>
          </article>
          <article className="cc2-card">
            <header><div><span>STRATEGY RELEASE</span><strong>{text(strategy.strategy_key, "Not assigned")}</strong></div></header>
            <dl className="cc2-dl">
              <div><dt>Version</dt><dd>{text(strategy.semantic_version)}</dd></div>
              <div><dt>Channel</dt><dd>{text(strategy.channel)}</dd></div>
              <div><dt>Lifecycle</dt><dd>{text(strategy.lifecycle_state)}</dd></div>
              <div><dt>Live authority</dt><dd>NO</dd></div>
            </dl>
          </article>
        </section>
      </>
    );
  }

  function MoneyPage() {
    const transfers = moneySurface?.recent_transfers || [];
    return (
      <>
        <section className="cc2-section-head">
          <div><span>MONEY</span><h1>Broker-held capital</h1><p>Alpaca remains the custody and cash source of truth. ANEVUM stores RHEN capital permission, not a competing customer balance.</p></div>
          <StatusPill value={funded ? "FUNDED" : "FUNDING REQUIRED"} />
        </section>
        <section className="cc2-metrics">
          <article><span>Equity</span><strong>{money(funding.equity)}</strong><small>Broker observed</small></article>
          <article><span>Cash</span><strong>{money(funding.cash)}</strong><small>Broker observed</small></article>
          <article><span>Crypto capacity</span><strong>{money(funding.available_for_crypto)}</strong><small>Non-marginable</small></article>
          <article><span>RHEN cap</span><strong>{money(allocation.absolute_cap)}</strong><small>{percent(allocation.allocation_fraction)} allocation</small></article>
        </section>
        <article className="cc2-card">
          <header><div><span>FUNDING</span><strong>{funded ? "Paper funds detected" : "Action required"}</strong></div></header>
          <p className="cc2-copy">{funded ? "Command is reading usable paper crypto capacity from the latest Alpaca reconciliation." : "Add or reset Alpaca Paper funds in Alpaca, then refresh the broker state in Settings."}</p>
          <Link className="cc2-link" to="/command/settings">Broker settings</Link>
        </article>
        <article className="cc2-card">
          <header><div><span>TRANSFERS</span><strong>Broker activity</strong></div><small>{transfers.length} recorded</small></header>
          {transfers.length ? <SimpleRows rows={transfers} fields={["direction", "amount", "status", "created_at"]} /> : <div className="cc2-empty">No ANEVUM broker transfer intents are recorded. External money movement is disabled in paper beta.</div>}
        </article>
      </>
    );
  }

  function ActivityPage() {
    return (
      <>
        <section className="cc2-section-head"><div><span>ACTIVITY</span><h1>What actually happened</h1><p>Broker reconciliation, controls, strategy assignments, transfers, orders, and protected account changes.</p></div></section>
        <article className="cc2-card"><ActivityRows rows={events} /></article>
      </>
    );
  }

  function SettingsPage() {
    const steps = accountSurface?.onboarding.steps || [];
    return (
      <>
        <section className="cc2-section-head"><div><span>SETTINGS</span><h1>Account setup</h1><p>Connect the broker, define RHEN capital authority, set account guardrails, and control paper automation.</p></div><StatusPill value={lifecycleState} /></section>

        {oauthState && <div className={"cc2-notice " + (oauthState === "connected" ? "good" : "bad")}>{oauthState === "connected" ? "Alpaca Paper connected and reconciled." : "Alpaca connection failed: " + (oauthMessage || "connection failed")}</div>}

        <section className="cc2-grid two">
          <article className="cc2-card">
            <header><div><span>BROKERAGE</span><strong>{paperConnected ? "Alpaca Paper" : "Not connected"}</strong></div><StatusPill value={text(broker.account_status, "SETUP REQUIRED")} /></header>
            <p className="cc2-copy">{paperConnected ? "Broker state is read-only and reconciled into Command." : "Connect an Alpaca Paper account through the approved OAuth flow."}</p>
            <div className="cc2-actions">
              <button className="primary" disabled={Boolean(busy)} onClick={() => paperConnected ? void mutate("refresh", () => refreshCustomerBroker(session, tenantId)) : void startCustomerAlpacaPaperOauth(session, tenantId).catch(error => setError(error instanceof Error ? error.message : "Alpaca connection failed."))}>{paperConnected ? "Refresh broker state" : "Connect Alpaca Paper"}</button>
            </div>
          </article>
          <article className="cc2-card">
            <header><div><span>ONBOARDING</span><strong>{steps.filter(step => step.complete).length}/{steps.length} complete</strong></div></header>
            <div className="cc2-steps">{steps.map((step, index) => <div key={step.key} className={step.complete ? "done" : ""}><b>{step.complete ? "✓" : index + 1}</b><span>{step.label}</span></div>)}</div>
          </article>
        </section>

        <section className="cc2-grid two">
          <article className="cc2-card">
            <header><div><span>RHEN ALLOCATION</span><strong>Capital authority</strong></div></header>
            <div className="cc2-form">
              <label><span>Allocation %</span><input type="number" min="1" max="100" value={String(Number(allocationFraction) * 100)} onChange={event => setAllocationFraction(String(Number(event.target.value) / 100))} /></label>
              <label><span>Absolute cap</span><input type="number" min="1" step="1" value={allocationCap} onChange={event => setAllocationCap(event.target.value)} /></label>
            </div>
            <button disabled={Boolean(busy) || !paperConnected} onClick={() => void mutate("allocation", () => updateCustomerAllocation(session, tenantId, Number(allocationFraction), Number(allocationCap)))}>Save allocation</button>
          </article>

          <article className="cc2-card">
            <header><div><span>AUTOMATION</span><strong>{botEnabled ? "Enabled" : "Paused"}</strong></div></header>
            <p className="cc2-copy">Customer consent can authorize paper automation, but it cannot bypass IREN, broker, release, risk, or tenant-executor gates.</p>
            {botEnabled
              ? <button className="danger" disabled={Boolean(busy) || !paperConnected} onClick={() => void mutate("pause", () => pauseCustomerPaper(session, tenantId))}>Pause RHEN</button>
              : <button className="primary" disabled={Boolean(busy) || !paperConnected} onClick={() => void mutate("resume", () => resumeCustomerPaper(session, tenantId))}>Accept consent & enable</button>}
          </article>
        </section>

        <article className="cc2-card">
          <header><div><span>ACCOUNT RISK</span><strong>Guardrails</strong></div><small>Platform limits always win</small></header>
          <div className="cc2-form risk">
            <label><span>Max position %</span><input type="number" value={String(Number(maxPosition) * 100)} onChange={event => setMaxPosition(String(Number(event.target.value) / 100))} /></label>
            <label><span>Max gross %</span><input type="number" value={String(Number(maxGross) * 100)} onChange={event => setMaxGross(String(Number(event.target.value) / 100))} /></label>
            <label><span>Daily loss %</span><input type="number" step="0.1" value={String(Number(maxDailyLoss) * 100)} onChange={event => setMaxDailyLoss(String(Number(event.target.value) / 100))} /></label>
            <label><span>Drawdown %</span><input type="number" step="0.1" value={String(Number(maxDrawdown) * 100)} onChange={event => setMaxDrawdown(String(Number(event.target.value) / 100))} /></label>
            <label><span>Max positions</span><input type="number" min="1" max="20" value={maxConcurrent} onChange={event => setMaxConcurrent(event.target.value)} /></label>
          </div>
          <button disabled={Boolean(busy) || !paperConnected} onClick={() => void mutate("risk", () => updateCustomerRisk(session, tenantId, {
            maxPositionFraction: Number(maxPosition),
            maxGrossExposureFraction: Number(maxGross),
            maxDailyLossFraction: Number(maxDailyLoss),
            maxDrawdownFraction: Number(maxDrawdown),
            maxConcurrentPositions: Number(maxConcurrent)
          }))}>Save guardrails</button>
        </article>
      </>
    );
  }

  function SystemPage() {
    return (
      <>
        <section className="cc2-section-head"><div><span>SYSTEM</span><h1>Advanced transparency</h1><p>Technical state relevant to this tenant. Protected operator controls remain outside the customer surface.</p></div></section>
        <section className="cc2-grid two">
          <article className="cc2-card">
            <header><div><span>RELEASE</span><strong>{text(strategy.strategy_key, "No release")}</strong></div></header>
            <dl className="cc2-dl"><div><dt>Version</dt><dd>{text(strategy.semantic_version)}</dd></div><div><dt>Channel</dt><dd>{text(strategy.channel)}</dd></div><div><dt>Lifecycle</dt><dd>{text(strategy.lifecycle_state)}</dd></div></dl>
          </article>
          <article className="cc2-card">
            <header><div><span>BROKER RECONCILIATION</span><strong>{text(reconciliation.status, "NONE")}</strong></div></header>
            <dl className="cc2-dl"><div><dt>Observed</dt><dd>{dateTime(reconciliation.observed_at)}</dd></div><div><dt>Provider</dt><dd>ALPACA</dd></div><div><dt>Mode</dt><dd>{mode}</dd></div></dl>
          </article>
        </section>
        <article className="cc2-card">
          <header><div><span>EXECUTION GATES</span><strong>{executionReady ? "OPEN" : "CLOSED"}</strong></div></header>
          <div className="cc2-tags">{(reasons.length ? reasons : ["no_current_blocker"]).map(reason => <span key={reason}>{label(reason)}</span>)}</div>
        </article>
        <article className="cc2-card">
          <header><div><span>ANEVUM SYSTEM</span><strong>Public-safe live terminal</strong></div></header>
          <p className="cc2-copy">GRAEN, VELUM, NOSTRA, IREN, and RHEN remain internal systems. Their public-safe operating state is available in the ANEVUM live terminal.</p>
          <Link className="cc2-link" to="/live">Open live system terminal</Link>
        </article>
      </>
    );
  }

  return (
    <div className="cc2">
      <header className="cc2-topbar">
        <div className="cc2-brand"><Mark /><div><span>ANEVUM</span><strong>Command</strong></div></div>
        <div className="cc2-account">
          {session.tenants.length > 1 && <select value={tenantId} onChange={event => setTenantId(event.target.value)}>{session.tenants.map(tenant => <option key={tenant.tenant_id} value={tenant.tenant_id}>{tenant.display_name || tenant.tenant_key}</option>)}</select>}
          <div><strong>{text(accountSurface?.tenant.display_name, "Customer")}</strong><small>{session.user?.email}</small></div>
          <StatusPill value={mode} />
          <button onClick={() => void onSignOut()}>Sign out</button>
        </div>
      </header>

      <div className="cc2-shell">
        <nav className="cc2-nav" aria-label="Command customer navigation">
          {NAV.map(item => <Link key={item.page} className={page === item.page ? "active" : ""} to={"/command/" + item.page}><i>{item.mark}</i><span>{item.label}</span></Link>)}
        </nav>

        <main className="cc2-main">
          {error && <div className="cc2-notice bad">{error}</div>}
          {page === "overview" && <OverviewPage />}
          {page === "trading" && <TradingPage />}
          {page === "money" && <MoneyPage />}
          {page === "activity" && <ActivityPage />}
          {page === "settings" && <SettingsPage />}
          {page === "system" && <SystemPage />}
        </main>
      </div>
    </div>
  );
}

function ActivityRows({ rows }: { rows: CommandActivitySurface["activity"] }) {
  if (!rows.length) return <div className="cc2-empty">No customer activity recorded yet.</div>;
  return <div className="cc2-timeline">{rows.map((row, index) => <div key={text(row.object_id, "event") + "-" + index}><i /><div><strong>{label(row.action || "event")}</strong><span>{text(record(row.payload).status, text(row.object_type))}</span></div><time>{dateTime(row.occurred_at)}</time></div>)}</div>;
}

function PositionRows({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <div className="cc2-empty">No reconciled paper positions.</div>;
  return <div className="cc2-table">{rows.map((row, index) => <div key={text(row.asset_id, String(index))}><strong>{text(row.symbol)}</strong><span>{text(row.side).toUpperCase()}</span><span>{text(row.qty)} units</span><span>{money(row.market_value)}</span><b>{percent(row.unrealized_plpc)}</b></div>)}</div>;
}

function OrderRows({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <div className="cc2-empty">No reconciled paper orders.</div>;
  return <div className="cc2-table">{rows.map((row, index) => <div key={text(row.id, String(index))}><strong>{text(row.symbol)}</strong><span>{text(row.side).toUpperCase()}</span><span>{text(row.status).toUpperCase()}</span><span>{text(row.filled_qty, text(row.qty))}</span><b>{money(row.filled_avg_price)}</b></div>)}</div>;
}

function SimpleRows({ rows, fields }: { rows: Record<string, unknown>[]; fields: string[] }) {
  return <div className="cc2-table simple">{rows.map((row, index) => <div key={text(row.transfer_intent_id, String(index))}>{fields.map(field => <span key={field}>{field.endsWith("_at") ? dateTime(row[field]) : text(row[field])}</span>)}</div>)}</div>;
}
