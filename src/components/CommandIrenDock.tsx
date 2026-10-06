import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { commandAuthHeaders, type RhenSession } from "../lib/auth";
import "../styles/iren-dock.css";

type IrenObjective = {
  objective_key?: string;
  parent_key?: string | null;
  title?: string;
  description?: string;
  status?: string;
  owner_system?: string;
  priority?: number;
  dependencies?: string[];
};

type IrenJob = {
  job_id?: string;
  objective_key?: string | null;
  title?: string;
  owner_system?: string;
  job_type?: string;
  status?: string;
  requires_human?: boolean;
  created_at?: string;
  updated_at?: string;
  result?: Record<string, unknown>;
};

type IrenCommand = {
  command_id?: string;
  command_text?: string;
  source?: string;
  status?: string;
  result?: Record<string, unknown>;
  response?: Record<string, unknown>;
  linked_job_id?: string | null;
  created_at?: string;
  completed_at?: string | null;
};

type CodexHandoff = {
  handoff_id: string; objective_key: string; handoff_status: string;
  package?: { title: string; prompt: string; created_at: string; base_sha: string; branch: string };
  association?: { pr_number: number; repository: string } | null;
  verification?: { verified: boolean; blockers?: string[]; observed_at?: string };
};
type IrenFeed = {
  schema_version?: string;
  revision?: number | null;
  observed_at?: string | null;
  stale?: boolean;
  state?: string;
  incidents?: Array<Record<string, unknown>>;
  work?: {
    next_action?: { title?: string; objective_key?: string; job_type?: string };
    execution_mode?: string;
    handoffs?: CodexHandoff[];
    objective_count?: number;
    objectives_complete?: number;
    active_jobs?: number;
    blocked_objectives?: number;
    requires_human?: number;
    objectives?: IrenObjective[];
    jobs?: IrenJob[];
    commands?: IrenCommand[];
  };
};

function shortId(value?: string | null) {
  return value ? value.slice(0, 8) : "—";
}

function stateClass(value?: string) {
  const v = String(value || "").toUpperCase();
  if (["HEALTHY", "COMPLETE", "SUCCEEDED", "READY"].includes(v)) return "good";
  if (["FAILED", "ATTENTION_REQUIRED", "BLOCKED", "CANCELLED", "OFFLINE"].includes(v)) return "bad";
  return "warn";
}

export default function CommandIrenDock({ session }: { session: RhenSession }) {
  const [feed, setFeed] = useState<IrenFeed | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingControl, setPendingControl] = useState("");
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
        const deterministicJob = linkedJob && String(linkedJob.job_type || "").startsWith("CONTROL_");
        if (!deterministicJob || ["SUCCEEDED", "FAILED", "CANCELLED", "NEEDS_APPROVAL"].includes(String(linkedJob?.status || "").toUpperCase())) {
          return command;
        }
      }
    }
    throw new Error("Control was accepted but completion was not observed.");
  }, [request]);

  useEffect(() => {
    document.documentElement.classList.add("iren-dock-active");
    return () => document.documentElement.classList.remove("iren-dock-active");
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const send = useCallback(async (value: string) => {
    const text = value.trim();
    if (!text || sending) return;
    setSending(true);
    setPendingControl(text);
    try {
      const accepted = await request("/api/command/iren/command", {
        method: "POST",
        body: JSON.stringify({ command: text })
      }) as { command?: IrenCommand };
      setExpanded(true);
      setError("");
      const commandId = accepted.command?.command_id;
      if (commandId) await waitForCommand(commandId);
      else await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "IREN control failed.");
    } finally {
      setPendingControl("");
      setSending(false);
    }
  }, [refresh, request, sending, waitForCommand]);

  const work = feed?.work;
  const objectives = work?.objectives || [];
  const jobs = work?.jobs || [];
  const activeJobs = useMemo(
    () => jobs.filter((job) => ["QUEUED", "RUNNING", "WAITING", "BLOCKED", "NEEDS_APPROVAL"].includes(String(job.status || ""))),
    [jobs]
  );
  const nextObjectives = useMemo(
    () => objectives.filter((objective) => ["ACTIVE", "READY", "BLOCKED"].includes(String(objective.status || ""))).slice(0, 8),
    [objectives]
  );
  const handoff = work?.handoffs?.find((row) => !["SUPERSEDED", "FAILED"].includes(row.handoff_status));
  const nextAction = work?.next_action;
  const executionMode = String(work?.execution_mode || "idle");
  const hasNextAction = Boolean(nextAction?.title);
  const canRunAction = hasNextAction && executionMode === "deterministic";
  const canPrepareCodex = hasNextAction && executionMode === "codex/manual software" && !handoff;
  const canVerifyHandoff = Boolean(handoff);
  const openIncidents = (feed?.incidents || [])
    .filter((row) => String(row.status || "OPEN").toUpperCase() !== "RESOLVED")
    .slice(0, 4);
  const incidentSummary = openIncidents
    .map((row) => String(row.key || row.reason || row.incident_type || "incident"))
    .join(" · ");
  const connectionLabel = error
    ? (feed ? "DEGRADED" : "OFFLINE")
    : feed?.stale
      ? "STALE"
      : String(feed?.state || "CONNECTING").toUpperCase();

  return (
    <aside className={"iren-dock " + (expanded ? "expanded" : "")} aria-label="IREN operating terminal">
      <button className="iren-dock-handle" type="button" onClick={() => setExpanded((value) => !value)}>
        <span className={"iren-dock-state " + stateClass(connectionLabel)} />
        <strong>IREN</strong>
        <span className="iren-dock-connection">{connectionLabel}</span>
        <i />
        <span className="iren-dock-prompt">DETERMINISTIC CONTROL</span>
        <span className="iren-dock-count">{activeJobs.length} JOB{activeJobs.length === 1 ? "" : "S"}</span>
        <span className="iren-dock-count">{work?.requires_human || 0} NEEDS YOU</span>
        <b>{expanded ? "⌄" : "⌃"}</b>
      </button>

      <div className="iren-dock-body">
        <div className="iren-dock-toolbar">
          <div>
            <small>IREN / CONTROL PLANE</small>
            <strong>Operator controls</strong>
          </div>
          <div className="iren-dock-actions">
            <button type="button" disabled={sending} onClick={() => void refresh()}>refresh</button>
            {canRunAction ? (
              <button type="button" disabled={sending} onClick={() => void send("do that")}>
                {pendingControl === "do that" ? "running…" : "run action"}
              </button>
            ) : null}
            {canPrepareCodex ? (
              <button type="button" disabled={sending} onClick={() => void send("prepare for Codex")}>
                {pendingControl === "prepare for Codex" ? "preparing…" : "prepare for Codex"}
              </button>
            ) : null}
            {canVerifyHandoff ? (
              <button type="button" disabled={sending} onClick={() => void send("verify Codex handoff")}>
                {pendingControl === "verify Codex handoff" ? "verifying…" : "verify handoff"}
              </button>
            ) : null}
          </div>
        </div>

        {error ? <div className="iren-dock-error">{error}</div> : null}
        {(feed?.stale || openIncidents.length || connectionLabel === "DEGRADED") ? (
          <div className="iren-dock-response">
            <span>CURRENT CONTROL STATE · {connectionLabel}</span>
            <p>{feed?.stale
              ? "Canonical IREN observation is stale."
              : incidentSummary || "IREN is degraded; no open incident detail was supplied by the canonical state."}</p>
            <small>Observed {feed?.observed_at ? new Date(feed.observed_at).toLocaleString() : "—"}</small>
          </div>
        ) : null}
        {sending ? (
          <div className="iren-dock-response">
            <span>CONTROL RUNNING</span>
            <p>{pendingControl}</p>
          </div>
        ) : null}
        {!hasNextAction && !handoff && !sending ? (
          <div className="iren-dock-response">
            <span>READY</span>
            <p>No pending control action.</p>
          </div>
        ) : null}
        {work?.next_action ? <div className="iren-dock-response">
          <span>{work.execution_mode}</span><p>{work.next_action.title}</p>
        </div> : null}
        {handoff?.package ? <section className="iren-codex-handoff" aria-label="Codex handoff">
          <strong>{handoff.package.title}</strong>
          <p>{handoff.handoff_status} · {handoff.objective_key}</p>
          <small>Prepared {new Date(handoff.package.created_at).toLocaleString()} · main {handoff.package.base_sha.slice(0, 12)}</small>
          <p>Verification: {handoff.verification?.verified ? "VERIFIED" : "Evidence pending"}</p>
          {handoff.association ? <a target="_blank" rel="noreferrer"
            href={`https://github.com/${handoff.association.repository}/pull/${handoff.association.pr_number}`}>
            PR #{handoff.association.pr_number}</a> : <small>Branch: {handoff.package.branch}</small>}
          {handoff.verification?.blockers?.length ? <ul>{handoff.verification.blockers.map((blocker) =>
            <li key={blocker}>{blocker.replaceAll("_", " ")}</li>)}</ul> : null}
          <button type="button" onClick={async () => {
            try { await navigator.clipboard.writeText(handoff.package!.prompt); setCopied(handoff.handoff_id); }
            catch { setError("Copy unavailable. Select and copy the complete prompt below."); }
          }}>{copied === handoff.handoff_id ? "Copied" : "Copy Codex Handoff"}</button>
          <details><summary>Full Codex prompt</summary>
            <textarea readOnly aria-label="Complete Codex prompt" value={handoff.package.prompt}
              onFocus={(event) => event.target.select()} rows={12} />
          </details>
        </section> : null}

        {(nextObjectives.length || activeJobs.length) ? (
          <div className="iren-dock-grid">
            {nextObjectives.length ? (
              <section>
                <header>
                  <span>OBJECTIVES</span>
                  <b>{work?.objectives_complete || 0}/{work?.objective_count || 0} COMPLETE</b>
                </header>
                <div className="iren-dock-list">
                  {nextObjectives.map((objective) => (
                    <article key={objective.objective_key}>
                      <i className={stateClass(objective.status)} />
                      <div>
                        <strong>{objective.title || objective.objective_key}</strong>
                        <small>{objective.owner_system || "IREN"} · {objective.objective_key}</small>
                      </div>
                      <b className={stateClass(objective.status)}>{objective.status}</b>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {activeJobs.length ? (
              <section>
                <header>
                  <span>ACTIVE WORK</span>
                  <b>{activeJobs.length} CURRENT</b>
                </header>
                <div className="iren-dock-list">
                  {activeJobs.slice(0, 8).map((job) => (
                    <article key={job.job_id}>
                      <i className={stateClass(job.status)} />
                      <div>
                        <strong>{job.title || job.job_type || "IREN job"}</strong>
                        <small>{job.owner_system || "IREN"} · {shortId(job.job_id)}</small>
                      </div>
                      <b className={stateClass(job.status)}>{job.status}</b>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
