import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
  response?: Record<string, unknown>;
  linked_job_id?: string | null;
  created_at?: string;
  completed_at?: string | null;
};

type IrenFeed = {
  schema_version?: string;
  revision?: number | null;
  observed_at?: string | null;
  stale?: boolean;
  state?: string;
  incidents?: Array<Record<string, unknown>>;
  work?: {
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
  if (["FAILED", "ATTENTION_REQUIRED", "BLOCKED", "CANCELLED"].includes(v)) return "bad";
  return "warn";
}

function responseText(command?: IrenCommand) {
  const response = command?.response || {};
  const message = response.message;
  if (typeof message === "string" && message.trim()) return message;
  const next = response.next_action;
  if (next && typeof next === "object") {
    const title = (next as Record<string, unknown>).title;
    if (typeof title === "string") return title;
  }
  return command?.status === "PROCESSING" ? "IREN is processing this command." : "";
}

export default function CommandIrenDock({ accessToken }: { accessToken: string }) {
  const [feed, setFeed] = useState<IrenFeed | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [command, setCommand] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
        ...(init?.headers || {})
      },
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || payload.error || "IREN request failed.");
    }
    return payload;
  }, [accessToken]);

  const refresh = useCallback(async () => {
    try {
      const value = await request("/api/command/iren/status");
      setFeed(value);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "IREN unavailable.");
    }
  }, [request]);

  useEffect(() => {
    document.documentElement.classList.add("iren-dock-active");
    return () => document.documentElement.classList.remove("iren-dock-active");
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 2500);
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
      setCommand("");
      setExpanded(true);
      setError("");
      window.setTimeout(() => void refresh(), 350);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "IREN command failed.");
    } finally {
      setSending(false);
    }
  }, [refresh, request, sending]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(command);
  };

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
  const lastCommand = commands[0];
  const lastResponse = responseText(lastCommand);

  return (
    <aside className={"iren-dock " + (expanded ? "expanded" : "")} aria-label="IREN operating terminal">
      <button className="iren-dock-handle" type="button" onClick={() => setExpanded((value) => !value)}>
        <span className={"iren-dock-state " + stateClass(feed?.state)} />
        <strong>IREN</strong>
        <span>{feed?.stale ? "STALE" : String(feed?.state || "CONNECTING")}</span>
        <i />
        <span>{activeJobs.length} JOB{activeJobs.length === 1 ? "" : "S"}</span>
        <span>{work?.requires_human || 0} NEEDS YOU</span>
        <b>{expanded ? "⌄" : "⌃"}</b>
      </button>

      <div className="iren-dock-body">
        <div className="iren-dock-toolbar">
          <div>
            <small>OPERATING INTELLIGENCE</small>
            <strong>Objective + job control</strong>
          </div>
          <div className="iren-dock-actions">
            {["status", "what's next?", "do that", "what needs me?"].map((value) => (
              <button key={value} type="button" disabled={sending} onClick={() => void send(value)}>
                {value}
              </button>
            ))}
          </div>
        </div>

        <form className="iren-command-line" onSubmit={submit}>
          <span>IREN &gt;</span>
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="status, what's next?, do that, fix it, or give IREN a directive…"
            aria-label="Command IREN"
            autoComplete="off"
          />
          <button type="submit" disabled={sending || !command.trim()}>
            {sending ? "…" : "RUN"}
          </button>
        </form>

        {error ? <div className="iren-dock-error">{error}</div> : null}
        {lastResponse ? (
          <div className="iren-dock-response">
            <span>{String(lastCommand?.status || "IREN")}</span>
            <p>{lastResponse}</p>
            {lastCommand?.linked_job_id ? <small>Job {shortId(lastCommand.linked_job_id)}</small> : null}
          </div>
        ) : null}

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
