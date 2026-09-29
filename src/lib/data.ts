import type { RhenSession } from "./auth";

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

export type PublicAds002State = {
  methodology_version?: string | null;
  readiness_state?: string | null;
  data_valid?: boolean;
  stable?: boolean;
  confidence_score?: number | null;
  executable_signals?: number | null;
  direct_signals?: number | null;
  unlinked_signals?: number | null;
  direct_coverage?: number | null;
  reason_codes?: string[];
  promotion_authorized?: boolean;
  live_configuration_changed?: boolean;
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
  ads002?: PublicAds002State | null;
};

export type PublicResearchDecision = {
  at?: string | null;
  decision_key?: string | null;
  status?: string | null;
  decision_type?: string | null;
  subject?: string | null;
  conclusion?: string | null;
  methodology_version?: string | null;
  families?: string[];
  observation_interval?: string | null;
  primary_forward_horizon_minutes?: number | null;
  implemented?: boolean;
  executed?: boolean;
};

export type PublicResearchQuestion = {
  research_question_id?: string;
  status?: string;
  question?: string;
  why_it_matters?: string;
  sample_size?: number;
  created_on?: string;
  created_at?: string;
};

export type PublicEvidenceCount = {
  horizon_minutes?: number;
  status?: string;
  count?: number;
  match_state?: string;
};

export type PublicWeeklySummary = {
  report_version?: string;
  period_start?: string;
  period_end?: string;
  completeness_state?: string;
  expected_session_count?: number;
  included_session_count?: number;
  missing_session_count?: number;
  included_sessions?: string[];
  missing_sessions?: string[];
  generated_at?: string;
};

export type PublicStrategyHistory = {
  version_id?: string;
  strategy_name?: string;
  environment?: string;
  status?: string;
  activated_at?: string;
  retired_at?: string | null;
};

export type PublicPerformancePoint = {
  at?: string | null;
  return_pct?: number | null;
};

export type PublicPerformance = {
  methodology_version?: string;
  basis?: string;
  status?: string;
  sample_state?: string;
  tracking_started_at?: string | null;
  last_observed_at?: string | null;
  first_trade_at?: string | null;
  last_trade_at?: string | null;
  snapshot_count?: number;
  trading_sessions?: number;
  closed_trades?: number;
  wins?: number;
  losses?: number;
  win_rate_pct?: number | null;
  account_return_pct?: number | null;
  realized_return_pct?: number | null;
  max_drawdown_pct?: number | null;
  external_cash_flows_present?: boolean;
  baseline_reason?: string | null;
  baseline_reset?: boolean;
  curve?: PublicPerformancePoint[];
  limitations?: string[];
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
  strategy_history?: PublicStrategyHistory[];
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
  operational?: {
    latest_scan?: {
      observed_at?: string;
      market_session?: string;
      cycle_outcome?: string;
      data_status?: string;
      degraded?: boolean;
    } | null;
  };
  research?: {
    current_focus?: string | null;
    current_status?: string | null;
    last_updated_at?: string | null;
    next_direction?: PublicResearchDecision | null;
    completed_decisions?: PublicResearchDecision[];
    active_questions?: PublicResearchQuestion[];
    latest_daily?: PublicResearchEntry | null;
    latest_weekly?: PublicResearchEntry | null;
    latest_weekly_summary?: PublicWeeklySummary | null;
    evidence?: {
      candidate_forward_outcomes?: PublicEvidenceCount[];
      live_offline_comparison?: PublicEvidenceCount[];
      analytics_only?: boolean;
    };
    limitations?: string[];
    journal?: PublicResearchEntry[];
  };
  performance?: PublicPerformance;
  disclosure?: {
    level?: string;
    public_fields?: string[];
    excluded_fields?: string[];
  };
};

export type TheoryStandard = {
  standard_id: string;
  name: string;
  rule: string;
};

export type TheoryTrack = {
  track_id: string;
  name: string;
  status: string;
  scope: string;
};

export type TheoryWorkstream = {
  workstream_id: string;
  title: string;
  status: string;
  objective: string;
};

export type TheoryResult = {
  result_id: string;
  title: string;
  status: string;
  claim_class: string;
  novelty_state: string;
  statement: string;
  scope: string;
  artifact_path: string;
  model_path?: string;
};

export type TheoryConjecture = {
  conjecture_id: string;
  title: string;
  status: string;
  novelty_state: string;
  statement: string;
  falsification: string;
};

export type TheoryProblem = {
  problem_id: string;
  title: string;
  status: string;
  visibility: string;
  started_on: string;
  question: string;
  domains: string[];
  formalization: {
    latent_state?: string;
    observation?: string;
    action?: string;
    policy?: string;
    objective_latex?: string;
    variation_latex?: string;
    dynamic_regret_latex?: string;
    target_bound?: string;
  };
  assumptions: string[];
  non_claims: string[];
  workstreams: TheoryWorkstream[];
  conjectures: TheoryConjecture[];
  results?: TheoryResult[];
  success_criteria: string[];
};

export type TheoryProgramFeed = {
  schema_version: string;
  registry_hash: string;
  program: {
    program_id: string;
    name: string;
    status: string;
    purpose: string;
    current_problem_id?: string;
    standards: TheoryStandard[];
    tracks: TheoryTrack[];
  };
  problems: TheoryProblem[];
  authority: {
    theory_can_change_live_trading: boolean;
    theory_can_open_protected_research_stages: boolean;
    theory_can_claim_novelty_without_review: boolean;
  };
};

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

export type CommandEvidence = {
  ok?: boolean;
  evidence_version?: string;
  generated_at?: string;
  latest_daily?: Record<string, unknown> | null;
  latest_weekly?: Record<string, unknown> | null;
  research_questions?: Record<string, unknown>[];
  weekly_decisions?: Record<string, unknown>[];
  research_decisions?: Record<string, unknown>[];
  post_event_evidence?: {
    forward_outcomes?: Record<string, unknown>[];
    live_offline?: Record<string, unknown>[];
    analytics_only?: boolean;
  };
  provenance?: {
    runtime?: Record<string, unknown> | null;
    latest_scan_cycle?: Record<string, unknown> | null;
  };
  telemetry_health?: Record<string, unknown> | null;
};

export type ResearchReadinessBlocker = {
  scope?: string | null;
  code?: string | null;
  reason_codes?: string[];
};

export type ResearchReadiness = {
  state?: string;
  cadence?: string;
  gpt_would_run_now?: boolean;
  blocker_count?: number;
  blockers?: ResearchReadinessBlocker[];
  limitation_count?: number;
  limitations?: ResearchReadinessBlocker[];
  monitor_count?: number;
  monitors?: ResearchReadinessBlocker[];
  strategy_question_count?: number;
  ready_strategy_question_count?: number;
  waiting_strategy_question_count?: number;
  waiting_requirements?: string[];
  trigger_reference?: string | null;
  evidence_cutoff?: string | null;
  read_only?: boolean;
  model_invoked?: boolean;
  persisted?: boolean;
};

async function authenticatedJson<T>(
  path: string,
  session: RhenSession
): Promise<T> {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.access_token
    },
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as T & {
    detail?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.detail || payload.message || "Command request failed.");
  }
  return payload;
}

export function fetchCommandStatus(session: RhenSession): Promise<CommandSnapshot> {
  return authenticatedJson<CommandSnapshot>("/api/command/trader/status", session);
}

export function fetchCommandEvidence(session: RhenSession): Promise<CommandEvidence> {
  return authenticatedJson<CommandEvidence>("/api/command/trader/evidence", session);
}

export function fetchCommandDailyReport(
  session: RhenSession,
  reportSession?: string
): Promise<Record<string, unknown>> {
  const query = reportSession ? "?session=" + encodeURIComponent(reportSession) : "";
  return authenticatedJson<Record<string, unknown>>("/api/command/trader/reports/daily" + query, session);
}

export function fetchCommandWeeklyReport(
  session: RhenSession,
  weekEnd?: string
): Promise<Record<string, unknown>> {
  const query = weekEnd ? "?week_end=" + encodeURIComponent(weekEnd) : "";
  return authenticatedJson<Record<string, unknown>>("/api/command/trader/reports/weekly" + query, session);
}

export async function fetchResearchReadiness(): Promise<ResearchReadiness> {
  const response = await fetch("/api/public/research/readiness", {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  const payload = (await response.json().catch(() => ({}))) as ResearchReadiness & {
    message?: string;
    detail?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || payload.detail || "Research readiness unavailable.");
  }
  return payload;
}

export async function fetchTheoryProgram(): Promise<TheoryProgramFeed> {
  const response = await fetch("/api/public/theory", {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  const payload = (await response.json().catch(() => ({}))) as TheoryProgramFeed & {
    message?: string;
    detail?: string;
  };
  if (!response.ok || !payload.program) {
    throw new Error(payload.message || payload.detail || "Theory program unavailable.");
  }
  return payload;
}

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
