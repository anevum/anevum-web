import { loadSession, type MemberSession } from "./memberClient";

export type FinanceChartPoint = {
  date: string;
  close: number;
  sma20: number | null;
  sma50: number | null;
};

export type FinanceStrategySetup = {
  symbol: string;
  status?: string;
  signal?: "ENTRY" | "HOLD" | "EXIT" | "NO_TRADE";
  reason?: string;
  trendPass?: boolean;
  breakoutPass?: boolean;
  exitBreak?: boolean;
  hasPosition?: boolean;
  positionQty?: number;
  close?: number;
  sma20?: number | null;
  sma50?: number | null;
  previous10High?: number;
  previous10Low?: number;
  atr14?: number | null;
  plannedStop?: number | null;
  plannedQty?: number;
  plannedValue?: number;
  maxPlannedLoss?: number;
  commissionBuffer?: number;
  chart: FinanceChartPoint[];
};

export type FinanceSnapshot = {
  version: string;
  generatedAt: string;
  mode: "READ_ONLY";
  gateway: {
    connected: boolean;
    host: string;
    port: number;
    reason?: string | null;
  };
  account: ({
    account: string;
    netLiquidation: number;
    totalCash: number;
    settledCash: number;
    buyingPower: number;
    availableFunds: number;
    excessLiquidity: number;
    grossPositionValue: number;
    initMarginReq: number;
    maintMarginReq: number;
    dayTradesRemaining: number | string | null;
    leverage: number;
    unrealizedPnl: number;
    realizedPnl: number;
    cashPercent: number;
  } | null);
  positions: Array<{
    contract: {
      symbol: string;
      secType: string;
      currency: string;
      exchange: string;
      conId: number;
    };
    quantity: number;
    marketPrice: number;
    marketValue: number;
    averageCost: number;
    unrealizedPnl: number;
    realizedPnl: number;
  }>;
  quotes: Array<{
    symbol: string;
    last: number | null;
    bid: number | null;
    ask: number | null;
    close: number | null;
    source: string;
  }>;
  strategy: {
    name: string;
    timeframe: string;
    rules: {
      trend: string;
      entry: string;
      exit: string;
      stop: string;
      universe: string[];
      positionBudgetUsd: number;
      maxPlannedLossUsd: number;
      commissionBufferUsd: number;
    };
    setups: FinanceStrategySetup[];
  };
  persistence: {
    equityHistory: string;
    reason: string;
  };
};

const financeApiBase = "https://ibkr-runner-production.up.railway.app";

export class FinanceBackendUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceBackendUnavailable";
  }
}

export async function loadFinanceSnapshot(session: MemberSession | null = loadSession()) {
  if (!session?.access_token) throw new FinanceBackendUnavailable("RHENLINK administrator session required.");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  let response: Response;
  try {
    response = await fetch(`${financeApiBase}/v1/finance/snapshot`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new FinanceBackendUnavailable("Finance API timed out after 8 seconds.");
    }
    throw cause;
  } finally {
    window.clearTimeout(timeout);
  }

  const payload = await response.json().catch(() => null) as FinanceSnapshot | { detail?: string } | null;
  if (!response.ok) {
    const detail = payload && "detail" in payload ? String(payload.detail || "") : "";
    throw new FinanceBackendUnavailable(detail || `Finance API request failed (${response.status}).`);
  }

  return payload as FinanceSnapshot;
}

export const financeBackend = {
  baseUrl: financeApiBase,
  refreshMs: 5_000,
};
