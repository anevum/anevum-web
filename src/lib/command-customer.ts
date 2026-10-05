import { commandAuthHeaders, type RhenSession } from "./auth";

export type CommandLifecycle = {
  state?: string;
  setup_ready?: boolean;
  execution_ready?: boolean;
  next_action?: string | null;
  missing?: string[];
};

export type CommandFunding = {
  source?: string;
  environment?: string;
  known?: boolean;
  funded?: boolean;
  equity?: string | null;
  cash?: string | null;
  buying_power?: string | null;
  non_marginable_buying_power?: string | null;
  available_for_crypto?: string | null;
  observed_at?: string | null;
  external_money_movement_enabled?: boolean;
};

export type CommandAccountSurface = {
  schema_version: "command_account.v1";
  tenant: Record<string, unknown>;
  lifecycle: CommandLifecycle;
  onboarding: {
    complete: boolean;
    steps: Array<{ key: string; label: string; complete: boolean }>;
  };
  broker?: Record<string, unknown> | null;
  authority: Record<string, unknown>;
};

export type CommandOverviewSurface = {
  schema_version: "command_overview.v1";
  tenant: Record<string, unknown>;
  lifecycle: CommandLifecycle;
  mode: "PAPER" | "LIVE";
  automation_state: "ACTIVE" | "ENABLED_PENDING" | "PAUSED";
  action_required?: string | null;
  funding: CommandFunding;
  allocation?: Record<string, unknown> | null;
  strategy?: Record<string, unknown> | null;
  risk?: Record<string, unknown> | null;
  position_count: number;
  order_count: number;
  reconciliation?: Record<string, unknown> | null;
  authority: Record<string, unknown>;
};

export type CommandTradingSurface = {
  schema_version: "command_trading.v1";
  tenant: Record<string, unknown>;
  lifecycle: CommandLifecycle;
  mode: "PAPER" | "LIVE";
  control?: Record<string, unknown> | null;
  strategy?: Record<string, unknown> | null;
  eligibility?: {
    eligible?: boolean;
    reasons?: string[];
    environment?: string;
    live_customer_authority?: boolean;
  } | null;
  allocation?: Record<string, unknown> | null;
  risk?: Record<string, unknown> | null;
  positions: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  reconciliation?: Record<string, unknown> | null;
  authority: Record<string, unknown>;
};

export type CommandMoneySurface = {
  schema_version: "command_money.v1";
  tenant: Record<string, unknown>;
  mode: "PAPER" | "LIVE";
  broker?: Record<string, unknown> | null;
  funding: CommandFunding;
  allocation?: Record<string, unknown> | null;
  recent_transfers: Record<string, unknown>[];
  authority: Record<string, unknown>;
};

export type CommandActivitySurface = {
  schema_version: "command_activity.v1";
  tenant: Record<string, unknown>;
  activity: Array<{
    occurred_at?: string;
    action?: string;
    object_type?: string;
    object_id?: string;
    payload?: Record<string, unknown>;
  }>;
};

async function readSurface<T>(
  session: RhenSession,
  tenantId: string,
  surface: "account" | "overview" | "trading" | "money" | "activity"
): Promise<T> {
  const response = await fetch(
    "/api/command/" + surface + "?tenant_id=" + encodeURIComponent(tenantId),
    {
      method: "GET",
      headers: commandAuthHeaders(session),
      cache: "no-store"
    }
  );
  const payload = await response.json().catch(() => ({})) as T & {
    detail?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(
      payload.detail || payload.message || "Customer Command surface unavailable."
    );
  }
  return payload;
}

export function fetchCommandAccount(
  session: RhenSession,
  tenantId: string
): Promise<CommandAccountSurface> {
  return readSurface(session, tenantId, "account");
}

export function fetchCommandOverview(
  session: RhenSession,
  tenantId: string
): Promise<CommandOverviewSurface> {
  return readSurface(session, tenantId, "overview");
}

export function fetchCommandTrading(
  session: RhenSession,
  tenantId: string
): Promise<CommandTradingSurface> {
  return readSurface(session, tenantId, "trading");
}

export function fetchCommandMoney(
  session: RhenSession,
  tenantId: string
): Promise<CommandMoneySurface> {
  return readSurface(session, tenantId, "money");
}

export function fetchCommandActivity(
  session: RhenSession,
  tenantId: string
): Promise<CommandActivitySurface> {
  return readSurface(session, tenantId, "activity");
}
