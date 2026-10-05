import { useCallback, useEffect, useMemo, useState } from "react";
import type { RhenSession } from "../lib/auth";
import {
  fetchCommandFinance,
  mutateCommandFinance,
  type CommandFinanceSnapshot
} from "../lib/data";
import { money } from "../lib/format";

function idempotencyKey(prefix: string) {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  return prefix + ":" + suffix;
}

function safeAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? String(amount) : "";
}

function statusTone(value: string | undefined) {
  const status = String(value || "").toUpperCase();
  if (["ACTIVE", "SETTLED", "COMPLETE", "CONFIGURED"].includes(status)) return "good";
  if (["PENDING", "QUEUED", "REQUESTED"].includes(status)) return "pending";
  if (["FAILED", "RESTRICTED", "CLOSED", "CANCELED"].includes(status)) return "bad";
  return "neutral";
}

export default function CommandFinance({ session }: { session: RhenSession }) {
  const [finance, setFinance] = useState<CommandFinanceSnapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [depositAmount, setDepositAmount] = useState("25");
  const [allocationTarget, setAllocationTarget] = useState("10");
  const [processorToken, setProcessorToken] = useState("");
  const [bankType, setBankType] = useState("CHECKING");
  const [transferAmount, setTransferAmount] = useState("10");

  const refresh = useCallback(async () => {
    try {
      const next = await fetchCommandFinance(session);
      setFinance(next);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Finance state unavailable.");
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = useCallback(async (label: string, body: Record<string, unknown>) => {
    setBusy(label);
    try {
      const next = await mutateCommandFinance(session, body);
      setFinance(next);
      setError("");
      return next;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Finance request failed.");
      return null;
    } finally {
      setBusy("");
    }
  }, [session]);

  const balances = finance?.balances || {};
  const provider = finance?.provider || {};
  const providerAccount = finance?.provider_accounts?.[0];
  const bankLinks = finance?.bank_links || [];
  const activeBankLink = bankLinks.find((row) => ["ACTIVE", "PENDING"].includes(String(row.status || "").toUpperCase()));
  const transfers = finance?.recent_transfers || [];
  const allocation = finance?.allocation;
  const initialized = finance?.initialized === true;

  const guardState = useMemo(() => ({
    virtualOnly: provider.virtual_funds_only !== false,
    externalMoney: finance?.external_money_movement_enabled === true,
    liveExecution: finance?.live_execution_authorized === true || allocation?.external_execution_enabled === true
  }), [finance, allocation, provider.virtual_funds_only]);

  const providerLabel = provider.configured ? "CONFIGURED" : "NOT CONFIGURED";

  return (
    <section className="command-finance-surface" aria-label="ANEVUM Financial sandbox">
      <div className="command-finance-guard">
        <div>
          <span>ANEVUM FINANCIAL / CONTROL STATE</span>
          <strong>SANDBOX ONLY</strong>
        </div>
        <div className="command-finance-guard-flags">
          <b className={guardState.virtualOnly ? "good" : "bad"}>VIRTUAL FUNDS</b>
          <b className={!guardState.externalMoney ? "good" : "bad"}>REAL MONEY OFF</b>
          <b className={!guardState.liveExecution ? "good" : "bad"}>LIVE RHEN OFF</b>
        </div>
      </div>

      {error ? <div className="command-finance-error">{error}</div> : null}

      {!initialized ? (
        <article className="command-finance-onboarding">
          <span>FINANCIAL GATEWAY</span>
          <h2>Initialize the Command financial ledger.</h2>
          <p>This creates the internal USD account set only. It does not open a bank or brokerage account and does not move real money.</p>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void mutate("initialize", { action: "initialize" })}
          >
            {busy === "initialize" ? "Initializing…" : "Initialize financial layer"}
          </button>
        </article>
      ) : (
        <>
          <div className="command-finance-balances">
            <article>
              <span>TOTAL CONTROLLED VALUE</span>
              <strong>{money(balances.total)}</strong>
              <small>Internal sandbox ledger</small>
            </article>
            <article>
              <span>AVAILABLE CASH</span>
              <strong>{money(balances.available_cash)}</strong>
              <small>Unallocated virtual cash</small>
            </article>
            <article>
              <span>RHEN ALLOCATION</span>
              <strong>{money(balances.rhen_allocation)}</strong>
              <small>{allocation?.status || "No allocation"}</small>
            </article>
            <article>
              <span>RESERVE</span>
              <strong>{money(balances.reserve)}</strong>
              <small>Held outside RHEN allocation</small>
            </article>
          </div>

          <div className="command-finance-grid">
            <article className="command-finance-card">
              <header>
                <div><span>TREASURY</span><strong>Virtual funding + allocation</strong></div>
                <small>Double-entry ledger</small>
              </header>

              <div className="command-finance-form">
                <label>
                  <span>ADD VIRTUAL FUNDS</span>
                  <div>
                    <input
                      inputMode="decimal"
                      value={depositAmount}
                      onChange={(event) => setDepositAmount(event.target.value)}
                      aria-label="Virtual deposit amount"
                    />
                    <button
                      type="button"
                      disabled={Boolean(busy) || !safeAmount(depositAmount) || Number(depositAmount) <= 0}
                      onClick={() => void mutate("deposit", {
                        action: "sandbox_deposit",
                        amount: safeAmount(depositAmount),
                        idempotency_key: idempotencyKey("command-deposit")
                      })}
                    >
                      {busy === "deposit" ? "Posting…" : "Add"}
                    </button>
                  </div>
                </label>

                <label>
                  <span>RHEN TARGET ALLOCATION</span>
                  <div>
                    <input
                      inputMode="decimal"
                      value={allocationTarget}
                      onChange={(event) => setAllocationTarget(event.target.value)}
                      aria-label="RHEN allocation target"
                    />
                    <button
                      type="button"
                      disabled={Boolean(busy) || !safeAmount(allocationTarget)}
                      onClick={() => void mutate("allocation", {
                        action: "set_rhen_allocation",
                        target_amount: safeAmount(allocationTarget),
                        execution_mode: "PAPER",
                        max_position_fraction: "0.10",
                        max_daily_loss_fraction: "0.05",
                        idempotency_key: idempotencyKey("command-allocation")
                      })}
                    >
                      {busy === "allocation" ? "Updating…" : "Set"}
                    </button>
                  </div>
                </label>
              </div>

              <div className="command-finance-policy">
                <p><span>EXECUTION MODE</span><strong>{allocation?.execution_mode || "PAPER"}</strong></p>
                <p><span>POSITION CAP</span><strong>{allocation?.max_position_fraction ? (Number(allocation.max_position_fraction) * 100).toFixed(1) + "%" : "10.0%"}</strong></p>
                <p><span>DAILY LOSS CAP</span><strong>{allocation?.max_daily_loss_fraction ? (Number(allocation.max_daily_loss_fraction) * 100).toFixed(1) + "%" : "5.0%"}</strong></p>
                <p><span>EXTERNAL EXECUTION</span><strong>DISABLED</strong></p>
              </div>
            </article>

            <article className="command-finance-card">
              <header>
                <div><span>CUSTODY PROVIDER</span><strong>Alpaca Broker Sandbox</strong></div>
                <small>{provider.environment || "SANDBOX"}</small>
              </header>

              <div className="command-finance-provider">
                <p>
                  <span>ADAPTER</span>
                  <b className={provider.configured ? "good" : "pending"}>{providerLabel}</b>
                </p>
                <p><span>ENVIRONMENT</span><strong>{provider.environment || "SANDBOX"}</strong></p>
                <p><span>ACCOUNT</span><strong>{providerAccount?.provider_account_ref || "Not opened"}</strong></p>
                <p>
                  <span>ACCOUNT STATE</span>
                  <b className={statusTone(providerAccount?.status)}>{providerAccount?.status || "NOT CONNECTED"}</b>
                </p>
              </div>

              <div className="command-finance-actions">
                <button
                  type="button"
                  disabled={Boolean(busy) || !provider.configured || !providerAccount}
                  onClick={() => void mutate("refresh-provider", { action: "sandbox_refresh_provider_account" })}
                >
                  {busy === "refresh-provider" ? "Refreshing…" : "Refresh provider"}
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy) || !provider.configured || !providerAccount}
                  onClick={() => void mutate("sync-provider", { action: "sandbox_sync_provider" })}
                >
                  {busy === "sync-provider" ? "Syncing…" : "Sync transfers"}
                </button>
              </div>

              {!provider.configured ? (
                <p className="command-finance-note">
                  Configure <code>ALPACA_BROKER_SANDBOX_KEY</code> and <code>ALPACA_BROKER_SANDBOX_SECRET</code> on Foundation before provider operations are available.
                </p>
              ) : !providerAccount ? (
                <p className="command-finance-note">
                  The adapter is ready. Broker-account onboarding is intentionally not exposed as a raw KYC form in Command v1.
                </p>
              ) : null}
            </article>

            <article className="command-finance-card">
              <header>
                <div><span>BANK LINK</span><strong>Tokenized ACH only</strong></div>
                <small>No routing/account storage</small>
              </header>

              {bankLinks.length ? (
                <div className="command-finance-list">
                  {bankLinks.map((row) => (
                    <div key={row.bank_link_id || row.provider_relationship_ref}>
                      <strong>{row.display_name || "Linked bank"}</strong>
                      <span>{row.bank_account_type || "ACCOUNT"}</span>
                      <b className={statusTone(row.status)}>{row.status || "UNKNOWN"}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="command-finance-link-form">
                  <input
                    type="password"
                    autoComplete="off"
                    placeholder="Plaid processor token"
                    value={processorToken}
                    onChange={(event) => setProcessorToken(event.target.value)}
                    disabled={!providerAccount}
                    aria-label="Plaid processor token"
                  />
                  <select value={bankType} onChange={(event) => setBankType(event.target.value)} disabled={!providerAccount}>
                    <option value="CHECKING">Checking</option>
                    <option value="SAVINGS">Savings</option>
                  </select>
                  <button
                    type="button"
                    disabled={Boolean(busy) || !providerAccount || !processorToken.trim()}
                    onClick={async () => {
                      const next = await mutate("link-bank", {
                        action: "sandbox_link_bank",
                        processor_token: processorToken.trim(),
                        bank_account_type: bankType,
                        nickname: "Sandbox bank"
                      });
                      if (next) setProcessorToken("");
                    }}
                  >
                    {busy === "link-bank" ? "Linking…" : "Link sandbox bank"}
                  </button>
                </div>
              )}
              <p className="command-finance-note">
                Processor tokens are sent to Foundation for the single Alpaca request and are not written into the ANEVUM ledger or bank-link record.
              </p>
            </article>

            <article className="command-finance-card">
              <header>
                <div><span>VIRTUAL ACH</span><strong>Deposit / withdrawal simulation</strong></div>
                <small>{activeBankLink ? "Bank link ready" : "Bank link required"}</small>
              </header>

              <div className="command-finance-transfer-form">
                <input
                  inputMode="decimal"
                  value={transferAmount}
                  onChange={(event) => setTransferAmount(event.target.value)}
                  aria-label="Sandbox transfer amount"
                />
                <button
                  type="button"
                  disabled={Boolean(busy) || !activeBankLink?.bank_link_id || !safeAmount(transferAmount) || Number(transferAmount) <= 0}
                  onClick={() => void mutate("ach-deposit", {
                    action: "sandbox_provider_transfer",
                    direction: "DEPOSIT",
                    amount: safeAmount(transferAmount),
                    bank_link_id: activeBankLink?.bank_link_id,
                    idempotency_key: idempotencyKey("command-ach-deposit")
                  })}
                >
                  Virtual deposit
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy) || !activeBankLink?.bank_link_id || !safeAmount(transferAmount) || Number(transferAmount) <= 0}
                  onClick={() => void mutate("ach-withdrawal", {
                    action: "sandbox_provider_transfer",
                    direction: "WITHDRAWAL",
                    amount: safeAmount(transferAmount),
                    bank_link_id: activeBankLink?.bank_link_id,
                    idempotency_key: idempotencyKey("command-ach-withdrawal")
                  })}
                >
                  Virtual withdrawal
                </button>
              </div>

              <div className="command-finance-transfer-list">
                {transfers.length ? transfers.map((row) => (
                  <div key={row.transfer_id}>
                    <span>{row.direction || "TRANSFER"}</span>
                    <strong>{money(row.amount)}</strong>
                    <small>{row.provider || "ANEVUM"} / {row.provider_environment || "SANDBOX"}</small>
                    <b className={statusTone(row.status)}>{row.status || "UNKNOWN"}</b>
                  </div>
                )) : <p>No sandbox transfers recorded.</p>}
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
