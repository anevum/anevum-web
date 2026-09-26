import { SUPABASE_KEY, SUPABASE_URL, type RhenSession } from "./auth";

export type PublicEquityRow = {
  observed_at?: string;
  equity?: number | string;
  realized_pnl?: number | string;
  unrealized_pnl?: number | string;
  drawdown_pct?: number | string;
  open_positions?: number | string;
};

export type PublicStrategy = {
  version_id?: string;
  strategy_name?: string;
  status?: string;
  environment?: string;
  hypothesis?: string;
  activated_at?: string;
  retired_at?: string;
  created_at?: string;
};

export type PublicTrade = {
  public_id?: string;
  strategy_version_id?: string;
  symbol?: string;
  side?: string;
  opened_at?: string;
  closed_at?: string;
  qty?: number | string;
  avg_entry_price?: number | string;
  avg_exit_price?: number | string;
  realized_pnl?: number | string;
  net_pnl?: number | string;
  exit_reason?: string;
};

export type PublicRun = {
  public_id?: string;
  strategy_version_id?: string;
  environment?: string;
  status?: string;
  started_at?: string;
  ended_at?: string;
  starting_equity?: number | string;
  ending_equity?: number | string;
  deposits?: number | string;
  withdrawals?: number | string;
};

export type PublicRecord = {
  equity: PublicEquityRow[];
  strategies: PublicStrategy[];
  trades: PublicTrade[];
  runs: PublicRun[];
};

async function publicTable<T>(table: string, query: string) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + query, {
    headers: { Accept: "application/json", apikey: SUPABASE_KEY }
  });
  const payload = (await response.json().catch(() => [])) as T[];
  if (!response.ok) throw new Error("Public record request failed.");
  return payload;
}

export async function fetchPublicRecord(): Promise<PublicRecord> {
  const [equity, strategies, runs, trades] = await Promise.all([
    publicTable<PublicEquityRow>(
      "trading_public_equity",
      "select=observed_at,equity,realized_pnl,unrealized_pnl,drawdown_pct,open_positions&order=observed_at.asc&limit=1000"
    ),
    publicTable<PublicStrategy>(
      "trading_public_strategies",
      "select=version_id,strategy_name,status,environment,hypothesis,activated_at,retired_at,created_at&order=created_at.desc&limit=100"
    ),
    publicTable<PublicRun>(
      "trading_public_runs",
      "select=public_id,strategy_version_id,environment,status,started_at,ended_at,starting_equity,ending_equity,deposits,withdrawals&order=started_at.desc&limit=100"
    ),
    publicTable<PublicTrade>(
      "trading_public_trades",
      "select=public_id,strategy_version_id,symbol,side,opened_at,closed_at,qty,avg_entry_price,avg_exit_price,realized_pnl,net_pnl,exit_reason&order=closed_at.desc&limit=250"
    )
  ]);
  return { equity, strategies, runs, trades };
}

export type CommandSnapshot = {
  mode?: string;
  observed_at?: string;
  account?: Record<string, unknown>;
  bot?: Record<string, unknown>;
  strategy?: Record<string, unknown>;
  risk?: Record<string, unknown>;
  market?: Record<string, unknown>;
  positions?: Record<string, unknown>[];
  open_orders?: Record<string, unknown>[];
  recent_orders?: Record<string, unknown>[];
  scanner?: Record<string, Record<string, unknown>>;
  history?: Record<string, unknown>[];
  research?: Record<string, unknown>;
};

export async function fetchCommandStatus(session: RhenSession): Promise<CommandSnapshot> {
  const response = await fetch("/api/command/trader/status", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.access_token
    }
  });

  const payload = (await response.json().catch(() => ({}))) as CommandSnapshot & {
    detail?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.detail || payload.message || "Command status request failed.");
  }

  return payload;
}


export type PublicTelemetryEvent = {
  at?: string | null;
  type?: string | null;
  kind?: string | null;
  label?: string | null;
};

export type PublicActivityBucket = {
  at?: string | null;
  count?: number | string;
};

export type PublicResearchEntry = {
  at?: string | null;
  type?: string | null;
  title?: string | null;
  summary?: string | null;
  classification?: string | null;
  focus?: string | null;
  next_action?: string | null;
  session?: string | null;
  week_start?: string | null;
  week_end?: string | null;
  warnings?: string[];
};

export type LiveTradingFeed = {
  ok: boolean;
  generated_at?: string;
  source?: string;
  live?: boolean;
  state?: string;
  freshness_seconds?: number | null;
  active_strategy?: {
    version_id?: string;
    strategy_name?: string;
    environment?: string;
    status?: string;
    activated_at?: string;
  } | null;
  telemetry?: {
    events_60m?: number;
    scan_events_10m?: number;
    symbols_10m?: number;
    execution_events_2h?: number;
    reconciliations_2h?: number;
    errors_2h?: number;
  };
  activity?: PublicActivityBucket[];
  events?: PublicTelemetryEvent[];
  research?: {
    current_focus?: string | null;
    current_status?: string | null;
    last_updated_at?: string | null;
    latest_daily?: PublicResearchEntry | null;
    latest_weekly?: PublicResearchEntry | null;
    journal?: PublicResearchEntry[];
  };
  disclosure?: {
    level?: string;
    public_fields?: string[];
  };
};

export async function fetchLiveTradingFeed(): Promise<LiveTradingFeed> {
  const response = await fetch("/api/public/trading/live", {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  const payload = (await response.json().catch(() => ({}))) as LiveTradingFeed & {
    message?: string;
    error?: string;
  };

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || payload.error || "Live trading feed unavailable.");
  }

  return payload;
}
