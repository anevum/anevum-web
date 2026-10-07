import { useCallback, useEffect, useRef, useState } from "react";
import { commandAuthHeaders, type RhenSession } from "../lib/auth";
import UiIcon from "./UiIcon";

type IrenObjective = {
  objective_key?: string;
  title?: string;
  status?: string;
  owner_system?: string;
};

type IrenJob = {
  job_id?: string;
  title?: string;
  owner_system?: string;
  job_type?: string;
  status?: string;
  result?: Record<string, unknown>;
};

type IrenCommand = {
  command_id?: string;
  status?: string;
  result?: Record<string, unknown>;
  response?: Record<string, unknown>;
  linked_job_id?: string | null;
};

type MaintenanceManifest = {
  version?: string;
  generated_at?: string;
  mode?: string;
  driver?: string;
  change_count?: number;
  changed_since_previous?: boolean;
  changes?: string[];
  budget?: {
    primary_objectives?: number;
    supporting_changes?: number;
    parallel_research_threads?: number;
    scope?: string;
  };
};

type CodexHandoff = {
  handoff_id: string;
  objective_key: string;
  handoff_status: string;
  package?: {
    title: string;
    prompt: string;
    created_at: string;
    base_sha: string;
    branch: string;
  };
  association?: {
    pr_number: number;
    repository: string;
  } | null;
  verification?: {
    verified: boolean;
    blockers?: string[];
    observed_at?: string;
  };
};

type ConfigurationChange = {
  path?: string;
  operation?: string;
  classification?: string;
  severity?: string;
  before?: unknown;
  after?: unknown;
};

type IrenFeed = {
  schema_version?: string;
  revision?: number | string | null;
  observed_at?: string | null;
  stale?: boolean;
  state?: string;
  incidents?: Array<Record<string, unknown>>;
  configuration_review?: {
    status?: string;
    baseline_fingerprint?: string | null;
    current_fingerprint?: string | null;
    comparison_completeness?: string | null;
    accepted_at?: string | null;
    accepted_by?: string | null;
  } | null;
  configuration_drift?: {
    comparison_completeness?: string | null;
    changed_count?: number;
    added_count?: number;
    removed_count?: number;
    detail_unavailable?: boolean;
    legacy_note?: string;
    changes?: ConfigurationChange[];
  } | null;
  configuration_current?: Record<string, unknown> | null;
  work?: {
    next_action?: {
      title?: string;
      objective_key?: string;
      job_type?: string;
    };
    execution_mode?: string;
    handoffs?: CodexHandoff[];
    objectives?: IrenObjective[];
    jobs?: IrenJob[];
    commands?: IrenCommand[];
  };
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function clean(value: unknown, fallback = "—") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function shortId(value?: string | null) {
  return value ? value.slice(0, 10) : "—";
}

function activeHandoff(feed: IrenFeed | null) {
  return feed?.work?.handoffs?.find((row) =>
    ["PREPARED", "IN_PROGRESS", "PR_OPEN", "MERGED", "VERIFYING"].includes(
      String(row.handoff_status || "").toUpperCase()
    )
  );
}

export default function CommandIrenMaintenance({ session }: { session: RhenSession }) {
  const [feed, setFeed] = useState<IrenFeed | null>(null);
  const [focus, setFocus] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [sending, setSending] = useState(false);
  const [acceptingConfiguration, setAcceptingConfiguration] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<{ command: IrenCommand; job?: IrenJob } | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generatedManifest, setGeneratedManifest] = useState<MaintenanceManifest | null>(null);
  const refreshInFlight = useRef(false);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(path, {
      ...init,
      headers: {
        ...commandAuthHeaders(session),
        ...(init?.headers || {})
      },
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || payload.error || "IREN request failed.");
    }
    return payload;
  }, [session]);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return null;
    refreshInFlight.current = true;
    try {
      const value = await request("/api/command/iren/status") as IrenFeed;
      setFeed(value);
      setError("");
      return value;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "IREN unavailable.");
      return null;
    } finally {
      refreshInFlight.current = false;
    }
  }, [request]);

  const waitForCommand = useCallback(async (commandId: string) => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      const value = await request("/api/command/iren/status") as IrenFeed;
      setFeed(value);
      const command = value.work?.commands?.find((row) => row.command_id === commandId);
      if (command && ["SUCCEEDED", "FAILED", "CANCELLED"].includes(String(command.status || "").toUpperCase())) {
        const linkedJob = command.linked_job_id
          ? value.work?.jobs?.find((row) => row.job_id === command.linked_job_id)
          : undefined;
        return { command, job: linkedJob };
      }
    }
    throw new Error("IREN accepted the control but completion was not observed.");
  }, [request]);

  const send = useCallback(async (command: string) => {
    if (sending) return null;
    setSending(true);
    setLastOutcome(null);
    try {
      const accepted = await request("/api/command/iren/command", {
        method: "POST",
        body: JSON.stringify({ command })
      }) as { command?: IrenCommand };
      const commandId = accepted.command?.command_id;
      if (commandId) {
        const outcome = await waitForCommand(commandId);
        setLastOutcome(outcome);
        setError("");
        return outcome;
      }
      await refresh();
      setError("");
      return null;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "IREN control failed.");
      return null;
    } finally {
      setSending(false);
    }
  }, [refresh, request, sending, waitForCommand]);

  const acceptConfiguration = useCallback(async () => {
    const fingerprint = String(feed?.configuration_review?.current_fingerprint || "").trim();
    if (!fingerprint || acceptingConfiguration) return;
    setAcceptingConfiguration(true);
    try {
      await request("/api/command/iren/configuration/accept", {
        method: "POST",
        body: JSON.stringify({ fingerprint })
      });
      setError("");
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Configuration acceptance failed.");
    } finally {
      setAcceptingConfiguration(false);
    }
  }, [acceptingConfiguration, feed?.configuration_review?.current_fingerprint, refresh, request]);

  const generateMaintenancePrompt = useCallback(async () => {
    const command = focus.trim()
      ? "maintenance prompt: " + focus.trim()
      : "maintenance prompt";
    const outcome = await send(command);
    const response = (outcome?.command.result || outcome?.command.response || {}) as Record<string, unknown>;
    const prompt = typeof response.maintenance_prompt === "string"
      ? response.maintenance_prompt
      : "";
    const manifest = response.maintenance_manifest;
    if (!prompt) {
      setGeneratedPrompt("");
      setGeneratedManifest(null);
      setError("IREN completed without returning a Work handoff prompt.");
      return;
    }
    setGeneratedPrompt(prompt);
    setGeneratedManifest(
      manifest && typeof manifest === "object"
        ? manifest as MaintenanceManifest
        : null
    );
  }, [focus, send]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const handoff = activeHandoff(feed);
  const executionMode = String(feed?.work?.execution_mode || "idle");
  const canPrepareTracked = Boolean(feed?.work?.next_action?.title) &&
    executionMode === "codex/manual software" &&
    !handoff;
  const state = String(error ? "OFFLINE" : feed?.stale ? "STALE" : feed?.state || "CONNECTING").toUpperCase();
  const activeIncidents = (feed?.incidents || []).length;
  const activeJobs = (feed?.work?.jobs || []).filter((row) =>
    ["QUEUED", "RUNNING", "WAITING", "BLOCKED", "NEEDS_APPROVAL"].includes(String(row.status || "").toUpperCase())
  ).length;
  const outcomeResponse = (lastOutcome?.command.result || lastOutcome?.command.response || {}) as Record<string, unknown>;
  const outcomeMessage = typeof outcomeResponse.message === "string" ? outcomeResponse.message : "";
  const promptMode = clean(generatedManifest?.mode, "—");
  const promptDelta = Number(generatedManifest?.change_count || 0);
  const configurationReview = feed?.configuration_review;
  const configurationDrift = feed?.configuration_drift;
  const currentConfiguration = record(feed?.configuration_current);
  const currentProtected = record(currentConfiguration.protected);
  const currentExecution = record(currentProtected.execution);
  const currentStrategy = record(currentProtected.strategy);
  const currentAuthority = record(currentProtected.asset_authority);
  const currentPortfolio = record(currentProtected.portfolio);
  const configurationNeedsReview = configurationReview?.status === "CONFIGURATION_REVIEW_REQUIRED";
  const driftChanges = configurationDrift?.changes || [];

  const copy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => current === key ? "" : current), 1800);
    } catch {
      setError("Clipboard unavailable. Open the prompt preview and copy it manually.");
    }
  }, []);

  return (
    <article className="command-panel command-view-system command-panel-boundary command-panel-iren-maintenance" aria-label="IREN work handoff">
      <header>
        <div>
          <span>IREN / WORK HANDOFF</span>
          <strong>{state}</strong>
        </div>
        <small>{activeIncidents} incident{activeIncidents === 1 ? "" : "s"} · {activeJobs} active job{activeJobs === 1 ? "" : "s"}</small>
      </header>

      <div className="iren-maintenance-body">
        {error ? <div className="iren-maintenance-alert bad">{error}</div> : null}

        <div className="iren-maintenance-state">
          <div><span>OBSERVED</span><strong>{feed?.observed_at ? new Date(feed.observed_at).toLocaleString() : "—"}</strong></div>
          <div><span>NEXT</span><strong>{feed?.work?.next_action?.title || "No pending canonical action"}</strong></div>
          <div><span>CODEX PASS</span><strong>{generatedPrompt ? promptMode : "NOT GENERATED"}</strong></div>
          <div><span>DELTA</span><strong>{generatedPrompt ? promptDelta + " material change" + (promptDelta === 1 ? "" : "s") : "—"}</strong></div>
        </div>

        {configurationReview ? (
          <section className={"iren-maintenance-alert " + (configurationNeedsReview ? "bad" : "")}>
            <span>PROTECTED CONFIGURATION · {clean(configurationReview.status)}</span>
            <strong>
              {configurationNeedsReview
                ? "Review the exact current V4.3 configuration before accepting it as the new trusted baseline."
                : "Configuration acceptance is waiting for IREN re-observation."}
            </strong>
            <small>
              Comparison: {clean(configurationDrift?.comparison_completeness || configurationReview.comparison_completeness)}
              {" · "}current {shortId(configurationReview.current_fingerprint)}
              {" · "}baseline {shortId(configurationReview.baseline_fingerprint)}
            </small>

            <div className="iren-maintenance-state">
              <div><span>STRATEGY</span><strong>{clean(currentStrategy.version_id || currentStrategy.name)}</strong></div>
              <div><span>MODE</span><strong>{clean(currentExecution.trading_mode)}</strong></div>
              <div><span>LIVE AUTHORITY</span><strong>{currentExecution.live_execution_authorized === true && currentExecution.bot_armed === true ? "ARMED" : "REVIEW"}</strong></div>
              <div><span>ASSET SCOPE</span><strong>{clean(currentAuthority.live_asset_scope || (currentAuthority.long_us_equities_etfs === true ? "long_us_equities_etfs_only" : ""))}</strong></div>
              <div><span>OPTIONS</span><strong>{currentAuthority.options_research_only === true || currentAuthority.options === false ? "RESEARCH ONLY" : "REVIEW"}</strong></div>
              <div><span>SHORT / LEVERAGE</span><strong>{currentAuthority.short_equities === false && currentAuthority.leverage_expansion === false ? "DISABLED" : "REVIEW"}</strong></div>
              <div><span>MAX DAILY LOSS</span><strong>{clean(currentPortfolio.max_daily_loss)}</strong></div>
              <div><span>MAX GROSS</span><strong>{clean(currentPortfolio.max_gross_exposure_pct)}</strong></div>
            </div>

            {configurationDrift?.detail_unavailable ? (
              <small>{configurationDrift.legacy_note || "The legacy baseline did not preserve enough non-secret inputs for an honest field-level historical diff. Review the full current V2 snapshot instead."}</small>
            ) : driftChanges.length ? (
              <details className="iren-maintenance-prompt">
                <summary>Review {driftChanges.length} protected configuration change{driftChanges.length === 1 ? "" : "s"}</summary>
                <div>
                  {driftChanges.slice(0, 24).map((change, index) => (
                    <p key={(change.path || "change") + index}>
                      <strong>{clean(change.path)}</strong>
                      {" · "}{clean(change.classification)}
                      {" · "}{clean(change.operation)}
                      {change.operation !== "add" ? " · " + clean(change.before) : ""}
                      {change.operation !== "remove" ? " → " + clean(change.after) : ""}
                    </p>
                  ))}
                </div>
              </details>
            ) : null}

            {configurationNeedsReview ? (
              <button type="button" className="primary" onClick={() => void acceptConfiguration()} disabled={sending || acceptingConfiguration}>
                {acceptingConfiguration ? "Accepting exact fingerprint…" : "Accept exact current fingerprint"}
              </button>
            ) : null}
          </section>
        ) : null}

        <label className="iren-maintenance-focus">
          <span>OPTIONAL FOCUS FOR THIS WORK PASS</span>
          <textarea
            value={focus}
            rows={3}
            maxLength={1000}
            onChange={(event) => setFocus(event.target.value)}
            placeholder="Optional: narrow the next evidence-backed Work / Codex pass. Leave blank to let current state choose the priority."
          />
        </label>

        <div className="iren-maintenance-actions">
          <button type="button" onClick={() => void refresh()} disabled={sending}><UiIcon name="refresh" /> Refresh state</button>
          <button type="button" className="primary" onClick={() => void generateMaintenancePrompt()} disabled={sending}>
            {sending ? "Working…" : <><UiIcon name="prompt" /> Generate Work prompt</>}
          </button>
          {generatedPrompt ? (
            <button type="button" onClick={() => void copy(generatedPrompt, "maintenance")}>
              {copied === "maintenance" ? "Copied" : <><UiIcon name="copy" /> Copy Work prompt</>}
            </button>
          ) : null}
          {canPrepareTracked ? (
            <button type="button" onClick={() => void send("prepare for Codex")} disabled={sending}>
              <UiIcon name="handoff" /> Prepare tracked handoff
            </button>
          ) : null}
          {handoff ? (
            <button type="button" onClick={() => void send("verify Codex handoff")} disabled={sending}>
              <UiIcon name="validation" /> Verify tracked handoff
            </button>
          ) : null}
        </div>

        {lastOutcome ? (
          <div className="iren-maintenance-alert">
            <span>LAST IREN CONTROL · {clean(lastOutcome.job?.status || lastOutcome.command.status, "COMPLETE")}</span>
            <strong>{outcomeMessage || "Control completed."}</strong>
          </div>
        ) : null}

        {generatedPrompt ? (
          <>
            {generatedManifest ? (
              <div className="iren-maintenance-alert">
                <span>WORK PASS · {promptMode}</span>
                <strong>{clean(generatedManifest.driver, "Current evidence selected this pass.")}</strong>
                <small>
                  {promptDelta} material change{promptDelta === 1 ? "" : "s"} ·
                  {" "}{generatedManifest.budget?.primary_objectives ?? 0} primary objective ·
                  {" "}up to {generatedManifest.budget?.supporting_changes ?? 0} supporting changes
                </small>
                {generatedManifest.changes?.length ? (
                  <small>{generatedManifest.changes.slice(0, 4).join(" · ")}</small>
                ) : null}
              </div>
            ) : null}
            <details className="iren-maintenance-prompt">
              <summary>Preview evidence-backed Work prompt</summary>
              <textarea readOnly aria-label="IREN Work handoff prompt" value={generatedPrompt} rows={12} onFocus={(event) => event.target.select()} />
            </details>
          </>
        ) : (
          <div className="iren-maintenance-alert">
            <span>CODEX HANDOFF</span>
            <strong>Generate a Work prompt only when current evidence justifies a new reasoning or implementation pass.</strong>
          </div>
        )}

        {handoff?.package ? (
          <div className="iren-maintenance-handoff">
            <div>
              <span>TRACKED HANDOFF</span>
              <strong>{handoff.package.title}</strong>
              <small>{handoff.handoff_status} · {handoff.objective_key} · main {shortId(handoff.package.base_sha)}</small>
            </div>
            {handoff.association ? (
              <a href={"https://github.com/" + handoff.association.repository + "/pull/" + handoff.association.pr_number} target="_blank" rel="noreferrer">
                PR #{handoff.association.pr_number}
              </a>
            ) : <small>{handoff.package.branch}</small>}
            <button type="button" onClick={() => void copy(handoff.package!.prompt, handoff.handoff_id)}>
              {copied === handoff.handoff_id ? "Copied" : <><UiIcon name="copy" /> Copy tracked handoff</>}
            </button>
            {handoff.verification?.blockers?.length ? (
              <small>{handoff.verification.blockers.map((item) => item.replaceAll("_", " ")).join(" · ")}</small>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
