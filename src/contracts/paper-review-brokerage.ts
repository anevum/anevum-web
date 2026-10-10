/** Fail-closed client projection for reviewer-only paper connections.
 * Server authorization is authoritative. This is an additional UI boundary:
 * unrecognized/elevated capability responses never enable OAuth controls.
 */
export type PaperReviewBrokerage = {
  integration: "alpaca_connect" | "unavailable";
  connectionAvailable: boolean;
  accountConnected: boolean;
  paperTradingEnabled: false;
  liveTradingEnabled: false;
  depositsEnabled: false;
  withdrawalsEnabled: false;
  brokerWriteEnabled?: false;
  account: { ending: string; environment: "paper" } | null;
};

export function parsePaperReviewBrokerage(value: unknown): PaperReviewBrokerage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.integration !== "alpaca_connect" && v.integration !== "unavailable") return null;
  if (typeof v.connectionAvailable !== "boolean" ||
      typeof v.accountConnected !== "boolean") return null;
  if (v.paperTradingEnabled !== false || v.liveTradingEnabled !== false ||
      v.depositsEnabled !== false || v.withdrawalsEnabled !== false ||
      (v.brokerWriteEnabled !== undefined && v.brokerWriteEnabled !== false)) return null;
  if ((v.connectionAvailable || v.accountConnected) && v.integration !== "alpaca_connect") return null;
  if (v.accountConnected) {
    if (!v.account || typeof v.account !== "object" || Array.isArray(v.account)) return null;
    const account = v.account as Record<string, unknown>;
    if (account.environment !== "paper" || typeof account.ending !== "string" ||
        !/^[a-zA-Z0-9-]{4}$/.test(account.ending)) return null;
    return {
      integration: "alpaca_connect",
      connectionAvailable: v.connectionAvailable,
      accountConnected: true,
      paperTradingEnabled: false, liveTradingEnabled: false,
      depositsEnabled: false, withdrawalsEnabled: false,
      account: { ending: account.ending, environment: "paper" }
    };
  }
  if (v.account !== null && v.account !== undefined) return null;
  return {
    integration: v.integration,
    connectionAvailable: v.connectionAvailable,
    accountConnected: false,
    paperTradingEnabled: false, liveTradingEnabled: false,
    depositsEnabled: false, withdrawalsEnabled: false,
    account: null
  };
}
