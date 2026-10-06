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

function responseText(command?: IrenCommand) {
  const response = command?.result || command?.response || {};
  const message = response.message;
  if (typeof message === "string" && message.trim()) return message;
  const next = response.next_action;
  if (next && typeof next === "object") {
    const title = (next as Record<string, unknown>).title;
    if (typeof title === "string") return title;
  }
  return command?.status === "PROCESSING" ? "IREN is processing this command." : "";
}

export default function CommandIrenDock({ session }: { session: RhenSession }) {
  const [feed, setFeed] = useState<IrenFeed | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [sending, setSending] = useState(false);
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
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      const value = await request("/api/command/iren/status");
      setFeed(value);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "IREN unavailable.");
    } finally {
      refreshInFlight.current = false;
    }
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
    try {
      await request("/api/command/iren/command", {
        method: "POST",
        body: JSON.stringify({ command: text })
      });
      setExpanded(true);
      setError("");
      window.setTimeout(() => void refresh(), 350);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "IREN command failed.");
    } finally {
      setSending(false);
    }
  }, [refresh, request, sending]);

  const work = feed?.work;
  const objectives = work?.objectives || [];
  const jobs = work?.jobs || [];
  const commands = work?.commands || [];
  const activeJobs = useMemo(
    () => jobs.filter((job) => ["QUEUED", "RUNNING", "WAITING", "BLOCKED", "NEEDS_APPROVAL"].includes(String(job.status || ""))),
    [jobs]
  );
  const nextObjectives = useMemo(
    () => objectives.filter((objective) => ["ACTIVE", "READY", "BLOCKED"].includes(String(objective.status || ""))).slice(0, 8),
    [objectives]
  );
  const handoff = work?.handoffs?.find((row) => !["SUPERSEDED", "FAILED"].includes(row.handoff_status));
  const lastCommand = commands[0];
  const lastResponse = responseText(lastCommand);
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
            <small>IREN / ZERO-COST CONTROL PLANE</small>
            <strong>Deterministic operator controls</strong>
            <p>No conversational model is running here. IREN reads canonical state, runs fixed safe controls, and prepares manual Codex handoffs without paid model execution.</p>
          </div>
          <div className="iren-dock-actions">
            <button type="button" disabled={sending} onClick={() => void refresh()}>refresh state</button>
            <button type="button" disabled={sending} onClick={() => void send("what's next?")}>next safe action</button>
            <button type="button" disabled={sending} onClick={() => void send("do that")}>run safe action</button>
            <button type="button" disabled={sending} onClick={() => void send("what needs me?")}>needs owner</button>
            <button type="button" disabled={sending} onClick={() => void send("prepare for Codex")}>prepare manual Codex</button>
            <button type="button" disabled={sending} onClick={() => void send("verify Codex handoff")}>verify handoff</button>
          </div>
        </div>

        {error ? <div className="iren-dock-error">{error}</div> : null}
        {lastResponse ? (
          <div className="iren-dock-response">
            <span>LAST CONTROL · {String(lastCommand?.status || "RECORDED")}</span>
            <p>{lastResponse}</p>
            {lastCommand?.linked_job_id ? <small>Durable job {shortId(lastCommand.linked_job_id)}</small> : <small>No model-generated reply.</small>}
          </div>
        ) : (
          <div className="iren-dock-response">
            <span>CONTROL MODE</span>
            <p>Choose an explicit action above. Free-form prompts are intentionally disabled because Command has no paid conversational worker.</p>
          </div>
        )}
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

        <div className="iren-dock-grid">
          <section>
            <header>
              <span>OBJECTIVES</span>
              <b>{work?.objectives_complete || 0}/{work?.objective_count || 0} COMPLETE</b>
            </header>
            <div className="iren-dock-list">
              {nextObjectives.length ? nextObjectives.map((objective) => (
                <article key={objective.objective_key}>
                  <i className={stateClass(objective.status)} />
                  <div>
                    <strong>{objective.title || objective.objective_key}</strong>
                    <small>{objective.owner_system || "IREN"} · {objective.objective_key}</small>
                  </div>
                  <b className={stateClass(objective.status)}>{objective.status}</b>
                </article>
              )) : <p className="iren-dock-empty">No active or ready objectives.</p>}
            </div>
          </section>

          <section>
            <header>
              <span>ACTIVE WORK</span>
              <b>{activeJobs.length} CURRENT</b>
            </header>
            <div className="iren-dock-list">
              {activeJobs.length ? activeJobs.slice(0, 8).map((job) => (
                <article key={job.job_id}>
                  <i className={stateClass(job.status)} />
                  <div>
                    <strong>{job.title || job.job_type || "IREN job"}</strong>
                    <small>{job.owner_system || "IREN"} · {shortId(job.job_id)}</small>
                  </div>
                  <b className={stateClass(job.status)}>{job.status}</b>
                </article>
              )) : <p className="iren-dock-empty">No active jobs.</p>}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}
