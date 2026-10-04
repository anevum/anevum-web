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

export type BtcCanaryProjection = {
  available?: boolean;
  run_id?: string;
  strategy_version_id?: string;
  paper_only?: boolean;
  live_execution_authorized?: boolean;
  promotion_ready?: boolean;
  research_status?: string;
  evidence_state?: string;
  observed_at?: string | null;
  decision_at?: string | null;
  action?: string | null;
  reason?: string | null;
  bar_interval?: string | null;
  strategy_family?: string | null;
  model_version?: string | null;
  position_open?: boolean;
  position_observed_at?: string | null;
  current_return_pct?: string | null;
  risk_stop_pct?: string | null;
  account_observed_at?: string | null;
  protection_status?: string | null;
  protection_observed_at?: string | null;
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
  research?: {
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
  btc_canary?: BtcCanaryProjection;
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
      target: "IREN / Foundation",
      title: "Canonical operations state is stale",
      action: "Check rhen-research-scheduler and Foundation availability first. Restore fresh IREN observations before trusting any downstream status."
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
        target: "Foundation evidence",
        title: "Durable evidence delivery is degraded",
        action: "Check Foundation ingest plus the RHEN evidence spool/backlog. Confirm new events are landing before retrying or evaluating research."
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
