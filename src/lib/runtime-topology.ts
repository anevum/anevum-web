export type RuntimeRow = {
  service_id: string;
  runtime_kind: string;
  independent_runtime: boolean;
  status: string;
  service_name?: string;
  service_version?: string;
  deployment?: string;
  revision?: string;
  started_at?: string;
  observed_at?: string;
  last_heartbeat_at?: string;
  liveness?: boolean | null;
  readiness?: boolean;
  current_activity?: string;
  last_success?: string;
  last_failure?: string;
  scope: string;
  observation_source?: string;
};

export type DependencyRow = {
  status: string;
  basis?: string;
  last_success?: string;
  dropped_count?: number;
};

export type IrenIncident = {
  key: string;
  severity: string;
  reason: string;
  opened_at?: string;
};

export type IrenJobEvent = {
  event_id: string | number;
  job_id: string;
  event_type: string;
  event?: Record<string, unknown>;
  created_at?: string;
  owner_system?: string;
  objective_key?: string | null;
  title?: string | null;
  job_type?: string | null;
};

export type IrenWorkSummary = {
  next_action?: { title?: string; objective_key?: string; job_type?: string };
  execution_mode?: string;
  objective_count?: number;
  objectives_complete?: number;
  active_jobs?: number;
  blocked_objectives?: number;
  requires_human?: number;
  objectives?: Array<Record<string, unknown>>;
  jobs?: Array<Record<string, unknown>>;
  job_events?: IrenJobEvent[];
};

export type OperatorProjection = {
  version?: string;
  state?: string;
  message?: string;
  inventory?: {
    independent_runtimes?: number;
    ready?: number;
    problems?: number;
    complete?: boolean;
    gaps?: Record<string, string[]>;
    verified_at?: string;
  };
  work?: {
    objective_count?: number;
    objectives_complete?: number;
    active_jobs?: number;
    blocked_objectives?: number;
    requires_human?: number;
  };
  guidance?: OperatorGuidance[];
  recent_transitions?: Array<{
    key?: string;
    transition?: string;
    severity?: string;
    reason?: string;
    created_at?: string;
    delivery_status?: string;
  }>;
  authority?: {
    read_only_projection?: boolean;
    trading_mutations?: boolean;
    protected_actions_bypassed?: boolean;
  };
};

export type StrategyAuthorityProjection = {
  owner?: string;
  lane?: string;
  strategy_version_id?: string | null;
  strategy_name?: string | null;
  status?: string;
  trading_mode?: string;
  execution_mode?: string;
  execution_enabled?: boolean;
  signal_authorized?: boolean;
  signals_enabled?: boolean;
  execution_authorized?: boolean;
  broker_writes_allowed?: boolean;
  entries_enabled?: boolean;
  manual_approval_required?: boolean;
  pending_approval?: Record<string, unknown> | null;
};

export type StrategyCandidateProjection = {
  owner?: string;
  problem_id?: string | null;
  candidate_id?: string | null;
  title?: string | null;
  lane?: string | null;
  status?: string | null;
  stage?: string | null;
  methodology_version?: string | null;
  run_id?: string | null;
  updated_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  supersedes_strategy_version_id?: string | null;
};

export type StrategyValidationProjection = {
  owner?: string;
  event_type?: string | null;
  candidate_id?: string | null;
  problem_id?: string | null;
  strategy_version_id?: string | null;
  status?: string | null;
  observed_at?: string | null;
  engineering_gate?: Record<string, unknown> | null;
};

export type StrategyReleaseGateProjection = {
  owner?: string;
  status?: string | null;
  reason?: string | null;
  target_lane?: string | null;
  target_strategy_version_id?: string | null;
  automatic_promotion?: boolean;
  production_authority_changed?: boolean;
};

export type StrategyPipelineProjection = {
  btc_discovery?: BtcDiscoveryProjection | null;
  research?: {
    control?: ResearchControlProjection;
    observability?: ResearchObservabilityProjection;
    graen_problems?: IrenSnapshot["research"] extends infer R ? never : never;
  } | Record<string, unknown>;
  schema_version?: string;
  observed_at?: string | null;
  available?: boolean;
  active?: StrategyAuthorityProjection[];
  candidate?: StrategyCandidateProjection | null;
  validation?: StrategyValidationProjection | null;
  release_gate?: StrategyReleaseGateProjection | null;
};

export type BtcDiscoveryMetrics = {
  trade_count: number;
  independent_days: number;
  net_expectancy: number;
  profit_factor: number;
  max_drawdown: number;
  net_return: number;
};
export type BtcDiscoveryCandidate = StrategyCandidateProjection & {
  fingerprint?: string;
  parameters?: Record<string, unknown>;
  rejection_reasons?: string[];
  results?: Record<string, {
    verified?: boolean;
    rejection_reasons?: string[];
    scenarios?: Record<string, { costs: { fee_bps: number; spread_bps: number; slippage_bps: number }; delay_bars: number; metrics: BtcDiscoveryMetrics }>;
  }>;
};
export type BtcDiscoveryProjection = {
  schema_version: string;
  methodology_version: string;
  state: string;
  current_stage: string;
  running: boolean;
  updated_at?: string | null;
  candidate?: BtcDiscoveryCandidate | null;
  candidates?: BtcDiscoveryCandidate[];
  rejection_reasons?: string[];
  search_completed?: number;
  search_bound?: number;
  paper_candidate_id?: string | null;
  last_error?: string | null;
  paper_progress?: {
    status: string;
    metrics?: BtcDiscoveryMetrics;
    elapsed_days?: number;
    filled_orders?: number;
    fresh?: boolean;
    fee_source?: string;
  } | null;
};

export type ResearchObservabilityPoint = {
  at?: string | null;
  value: number;
};

export type ResearchObservabilitySeries = {
  key?: string;
  label?: string;
  unit?: string;
  points?: ResearchObservabilityPoint[];
};

export type ResearchObservabilityRun = {
  run_id: string;
  system: "GRAEN" | "VELUM" | "NOSTRA" | "RHEN";
  kind?: string;
  title?: string;
  status?: string;
  stage?: string | null;
  progress_pct?: number | null;
  problem_id?: string | null;
  candidate_id?: string | null;
  methodology_version?: string | null;
  strategy_version_id?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
  metrics?: Record<string, number>;
  series?: ResearchObservabilitySeries[];
  artifact_count?: number;
  detail?: Record<string, unknown>;
};

export type ResearchObservabilityEvent = {
  event_id?: string;
  at?: string | null;
  system?: "GRAEN" | "VELUM" | "NOSTRA" | "RHEN";
  run_id?: string | null;
  event_type?: string | null;
  stage?: string | null;
  status?: string | null;
  progress_pct?: number | null;
  title?: string | null;
  detail?: string | null;
};

export type ResearchControlProjection = {
  schema_version?: string;
  mode?: "IDLE" | "OBSERVING" | "AUTOMATED_TEST" | "RESEARCH_REVIEW_REQUIRED" | "RELEASE_REVIEW_REQUIRED" | string;
  reason?: string | null;
  review_required?: boolean;
  review_kind?: string | null;
  work_credit_recommended?: boolean;
  problem_id?: string | null;
  stage?: string | null;
  decision?: string | null;
  next_action?: string | null;
  rejected_generations?: number;
  latest_run_id?: string | null;
  autonomy?: {
    collect_market_evidence?: boolean;
    execute_frozen_hypotheses?: boolean;
    run_replay_validation?: boolean;
    generate_new_hypothesis_family?: boolean;
    patch_strategy_code?: boolean;
    promote_live_strategy?: boolean;
    change_risk_or_capital?: boolean;
  };
};

export type ResearchObservabilityProjection = {
  schema_version?: string;
  updated_at?: string | null;
  poll_seconds?: number;
  runs?: ResearchObservabilityRun[];
  events?: ResearchObservabilityEvent[];
  authority?: {
    read_only?: boolean;
    research_only?: boolean;
    live_trading_performance_mixed?: boolean;
  };
};

export type IrenSnapshot = {
  schema_version: string;
  revision: string | number | null;
  observed_at: string | null;
  stale: boolean;
  state: string;
  action_required: boolean;
  topology: {
    services: RuntimeRow[];
    dependencies: Record<string, DependencyRow>;
    inventory_complete?: boolean;
    inventory_gaps?: Record<string, string[]>;
    inventory_verified_at?: string;
  } | null;
  incidents: IrenIncident[];
  scheduler?: {
    next_expected_runs?: Record<string, string>;
    last_success_at?: string;
    running_job?: string | null;
  };
  work?: IrenWorkSummary;
  strategy_pipeline?: StrategyPipelineProjection;
  research?: {
    control?: ResearchControlProjection;
    graen_problems?: Array<{
      problem_id?: string;
      title?: string;
      status?: string;
      research_stage?: string | null;
      candidate_id?: string | null;
      hypothesis?: string | null;
      family?: string | null;
      mechanism?: string | null;
      campaign_id?: string | null;
      updated_at?: string;
      started_at?: string | null;
      completed_at?: string | null;
    }>;
    graen_runs?: Array<{
      run_id?: string;
      problem_id?: string;
      status?: string;
      methodology_version?: string | null;
      result_state?: string | null;
      decision?: string | null;
      next_action?: string | null;
      candidate_id?: string | null;
      error?: string | null;
      started_at?: string;
      completed_at?: string | null;
      created_at?: string;
    }>;
    velum_replays?: Array<{
      status?: string;
      started_at?: string | null;
      completed_at?: string | null;
    }>;
    observability?: ResearchObservabilityProjection;
    graen_runtime?: {
      worker_id?: string | null;
      runtime_version?: string | null;
      deployment_id?: string | null;
      heartbeat_at?: string | null;
      active_problem_id?: string | null;
      queue_depth?: number | null;
      last_error?: string | null;
      updated_at?: string | null;
    } | null;
  };
  operator?: OperatorProjection;
};

export type OperatorGuidance = {
  severity: "info" | "warning" | "critical";
  target: string;
  title: string;
  action: string;
};

export function isStale(value: IrenSnapshot | null, now: number, unavailable = false) {
  const stamp = value?.observed_at;
  if (unavailable || !stamp || !/(Z|[+-]\d{2}:\d{2})$/.test(stamp)) return true;
  const age = now - Date.parse(stamp);
  return value?.stale !== false || !Number.isFinite(age) || age < 0 || age > 180000;
}

export function runtimeStatus(row: RuntimeRow, stale: boolean) {
  return stale && row.independent_runtime ? "STALE" : row.status;
}

export function ageLabel(value?: string | null, now = Date.now()) {
  if (!value) return "no observation";
  const stamp = Date.parse(value);
  if (!Number.isFinite(stamp)) return "invalid timestamp";
  const seconds = Math.max(0, Math.floor((now - stamp) / 1000));
  if (seconds < 5) return "now";
  if (seconds < 60) return seconds + "s ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

export function operatorGuidance(snapshot: IrenSnapshot | null, unavailable = false): OperatorGuidance[] {
  if (!snapshot || unavailable || snapshot.stale) {
    return [{
      severity: "critical",
      target: "IREN / RHEN Core",
      title: "Canonical operations state is stale",
      action: "Check the RHEN unified runtime, IREN process, and RHEN Core durability first. Restore fresh IREN observations before trusting downstream status."
    }];
  }

  const rows: OperatorGuidance[] = [];
  for (const incident of snapshot.incidents || []) {
    const key = String(incident.key || "");
    const severity = String(incident.severity || "").toLowerCase() === "critical" ? "critical" : "warning";
    if (key.startsWith("service.")) {
      rows.push({
        severity,
        target: key.slice("service.".length),
        title: "Runtime health is unavailable or unhealthy",
        action: "Open the service deployment and logs, verify its health endpoint and dependencies, then let IREN re-observe it. Do not change trading configuration to clear a health incident."
      });
    } else if (key.startsWith("evidence.")) {
      rows.push({
        severity,
        target: "RHEN Core evidence",
        title: "Durable evidence delivery is degraded",
        action: "Check RHEN Core plus the evidence spool/backlog. Confirm new events are landing before retrying or evaluating research."
      });
    } else if (key.startsWith("scheduler.") || key.startsWith("workflow.")) {
      rows.push({
        severity,
        target: "IREN scheduler",
        title: "Scheduled work is degraded",
        action: "Inspect the latest scheduler run and its failure classification. Retry only idempotent work after the underlying dependency is healthy."
      });
    } else if (key.startsWith("configuration.")) {
      rows.push({
        severity,
        target: "Protected configuration",
        title: "Configuration identity changed",
        action: "Compare the current runtime configuration with the recorded baseline. Explain the drift before accepting or overwriting it."
      });
    } else if (key.startsWith("safety.")) {
      rows.push({
        severity: "critical",
        target: "Safety boundary",
        title: "Protected runtime invariant failed",
        action: "Keep execution authority unchanged. Inspect the reported invariant and restore the expected safe state before any further promotion or execution work."
      });
    } else {
      rows.push({
        severity,
        target: key || "ANEVUM",
        title: String(incident.reason || "Operational incident").replaceAll("_", " "),
        action: "Inspect the affected subsystem and its latest deployment/log evidence, repair the root cause, then wait for IREN to verify recovery."
      });
    }
  }

  if (!rows.length && snapshot.state !== "HEALTHY") {
    rows.push({
      severity: "warning",
      target: "ANEVUM",
      title: "Control state is not healthy",
      action: "Review subsystem readiness and dependency freshness below, then run IREN status after the next observation cycle."
    });
  }

  return rows;
}
