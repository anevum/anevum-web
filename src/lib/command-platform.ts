import { commandAuthHeaders, type RhenSession } from "./auth";

export type CustomerCommandStep = {
  key: string;
  label: string;
  complete: boolean;
};

export type CustomerCommandOverview = {
  schema_version: "command_customer.v1" | "command_customer.v2";
  surface: "customer";
  tenant: {
    tenant_id: string;
    tenant_key?: string | null;
    display_name?: string | null;
    status?: string | null;
    role?: string | null;
  };
  lifecycle?: {
    state?: string;
    setup_ready?: boolean;
    execution_ready?: boolean;
    next_action?: string;
    missing?: string[];
  };
  onboarding: {
    complete: boolean;
    steps: CustomerCommandStep[];
  };
  broker?: {
    broker_account_id?: string;
    provider?: string;
    provider_account_id?: string;
    environment?: string;
    account_status?: string;
    crypto_enabled?: boolean;
    trading_blocked?: boolean;
    withdrawals_blocked?: boolean;
    last_reconciled_at?: string | null;
  } | null;
  funding?: {
    source?: string;
    environment?: string;
    known?: boolean;
    funded?: boolean;
    equity?: string | null;
    cash?: string | null;
    buying_power?: string | null;
    observed_at?: string | null;
    external_money_movement_enabled?: boolean;
  } | null;
  allocation?: {
    allocation_id?: string;
    allocation_mode?: string;
    allocation_fraction?: string | number;
    absolute_cap?: string | number;
    status?: string;
    effective_at?: string;
  } | null;
  risk?: {
    risk_profile_id?: string;
    max_position_fraction?: string | number;
    max_gross_exposure_fraction?: string | number;
    max_daily_loss_fraction?: string | number;
    max_drawdown_fraction?: string | number;
    max_concurrent_positions?: number;
    status?: string;
    effective_at?: string;
  } | null;
  control?: {
    bot_enabled?: boolean;
    customer_consent_version?: string | null;
    customer_consented_at?: string | null;
    updated_at?: string | null;
  } | null;
  strategy?: {
    strategy_release_id?: string;
    strategy_key?: string;
    semantic_version?: string;
    channel?: string;
    lifecycle_state?: string;
    assigned_at?: string;
  } | null;
  eligibility?: {
    eligible?: boolean;
    reasons?: string[];
    environment?: string;
    live_customer_authority?: boolean;
  } | null;
  reconciliation?: {
    status?: string;
    observed_at?: string;
    error_code?: string | null;
  } | null;
  account?: Record<string, unknown> | null;
  positions?: Record<string, unknown>[];
  orders?: Record<string, unknown>[];
  activity?: Array<{
    occurred_at?: string;
    action?: string;
    object_type?: string;
    object_id?: string;
    payload?: Record<string, unknown>;
  }>;
  authority?: {
    paper_only?: boolean;
    live_customer_trading?: boolean;
    withdrawals?: boolean;
    funding_mutations?: boolean;
  };
};

async function platformJson<T>(
  path: string,
  session: RhenSession,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...commandAuthHeaders(session),
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({})) as T & {
    detail?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.detail || payload.message || "Customer Command request failed.");
  }
  return payload;
}

export function fetchCustomerCommand(
  session: RhenSession,
  tenantId: string
): Promise<CustomerCommandOverview> {
  return platformJson<CustomerCommandOverview>(
    "/api/command/platform/overview?tenant_id=" + encodeURIComponent(tenantId),
    session
  );
}

export function updateCustomerAllocation(
  session: RhenSession,
  tenantId: string,
  allocationFraction: number,
  absoluteCap: number
): Promise<CustomerCommandOverview> {
  return platformJson<CustomerCommandOverview>(
    "/api/command/platform/allocation",
    session,
    {
      method: "PUT",
      body: JSON.stringify({
        tenant_id: tenantId,
        allocation_fraction: allocationFraction,
        absolute_cap: absoluteCap
      })
    }
  );
}

export function updateCustomerRisk(
  session: RhenSession,
  tenantId: string,
  values: {
    maxPositionFraction: number;
    maxGrossExposureFraction: number;
    maxDailyLossFraction: number;
    maxDrawdownFraction: number;
    maxConcurrentPositions: number;
  }
): Promise<CustomerCommandOverview> {
  return platformJson<CustomerCommandOverview>(
    "/api/command/platform/risk",
    session,
    {
      method: "PUT",
      body: JSON.stringify({
        tenant_id: tenantId,
        max_position_fraction: values.maxPositionFraction,
        max_gross_exposure_fraction: values.maxGrossExposureFraction,
        max_daily_loss_fraction: values.maxDailyLossFraction,
        max_drawdown_fraction: values.maxDrawdownFraction,
        max_concurrent_positions: values.maxConcurrentPositions
      })
    }
  );
}

export function pauseCustomerPaper(
  session: RhenSession,
  tenantId: string
): Promise<CustomerCommandOverview> {
  return platformJson<CustomerCommandOverview>(
    "/api/command/platform/control/pause",
    session,
    {
      method: "POST",
      body: JSON.stringify({ tenant_id: tenantId })
    }
  );
}

export function resumeCustomerPaper(
  session: RhenSession,
  tenantId: string,
  consentVersion = "command-paper-beta-v1"
): Promise<CustomerCommandOverview> {
  return platformJson<CustomerCommandOverview>(
    "/api/command/platform/control/resume",
    session,
    {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        consent_version: consentVersion
      })
    }
  );
}

export async function startCustomerAlpacaPaperOauth(
  session: RhenSession,
  tenantId: string
): Promise<void> {
  const payload = await platformJson<{
    authorization_url: string;
  }>(
    "/api/command/platform/alpaca/oauth/start",
    session,
    {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        redirect_uri: "https://anevum.com/api/command/platform/alpaca/callback"
      })
    }
  );
  if (!payload.authorization_url.startsWith("https://app.alpaca.markets/oauth/authorize")) {
    throw new Error("Unexpected Alpaca authorization destination.");
  }
  window.location.assign(payload.authorization_url);
}

export function refreshCustomerBroker(
  session: RhenSession,
  tenantId: string
): Promise<CustomerCommandOverview> {
  return platformJson<CustomerCommandOverview>(
    "/api/command/platform/broker/refresh",
    session,
    {
      method: "POST",
      body: JSON.stringify({ tenant_id: tenantId })
    }
  );
}
