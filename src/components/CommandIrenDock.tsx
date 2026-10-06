import { useCallback, useEffect, useRef, useState } from "react";
import { commandAuthHeaders, type RhenSession } from "../lib/auth";

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

type IrenService = {
  service_id?: string;
  service_name?: string;
  status?: string;
  readiness?: boolean;
  revision?: string;
  deployment?: string;
  current_activity?: string;
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

type IrenFeed = {
  schema_version?: string;
  revision?: number | string | null;
  observed_at?: string | null;
  stale?: boolean;
  state?: string;
  topology?: {
    services?: IrenService[];
  };
  incidents?: Array<Record<string, unknown>>;
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
  const [lastOutcome, setLastOutcome] = useState<{ command: IrenCommand; job?: IrenJob } | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
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

  const generateMaintenancePrompt = useCallback(async () => {
    const command = focus.trim()
      ? "maintenance prompt: " + focus.trim()
      : "maintenance prompt";
    const outcome = await send(command);
    const response = (outcome?.command.result || outcome?.command.response || {}) as Record<string, unknown>;
    const prompt = typeof response.maintenance_prompt === "string"
      ? response.maintenance_prompt
      : "";
    if (!prompt) {
      setGeneratedPrompt("");
      setError("IREN completed without returning a maintenance prompt.");
      return;
    }
    setGeneratedPrompt(prompt);
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
    <article className="command-panel command-view-system command-panel-boundary command-panel-iren-maintenance" aria-label="IREN maintenance">
      <header>
        <div>
          <span>IREN / MAINTENANCE</span>
          <strong>{state}</strong>
        </div>
        <small>{activeIncidents} incident{activeIncidents === 1 ? "" : "s"} · {activeJobs} active job{activeJobs === 1 ? "" : "s"}</small>
      </header>

      <div className="iren-maintenance-body">
        {error ? <div className="iren-maintenance-alert bad">{error}</div> : null}

        <div className="iren-maintenance-state">
          <div><span>OBSERVED</span><strong>{feed?.observed_at ? new Date(feed.observed_at).toLocaleString() : "—"}</strong></div>
          <div><span>NEXT</span><strong>{feed?.work?.next_action?.title || "No pending canonical action"}</strong></div>
          <div><span>CODEX PROMPT</span><strong>{generatedPrompt ? "READY" : "NOT GENERATED"}</strong></div>
        </div>

        <label className="iren-maintenance-focus">
          <span>FOCUS FOR NEXT CODEX PASS</span>
          <textarea
            value={focus}
            rows={3}
            maxLength={1000}
            onChange={(event) => setFocus(event.target.value)}
            placeholder="Optional: tell IREN what you want the next maintenance pass to focus on."
          />
        </label>

        <div className="iren-maintenance-actions">
          <button type="button" onClick={() => void refresh()} disabled={sending}>Refresh state</button>
          <button type="button" className="primary" onClick={() => void generateMaintenancePrompt()} disabled={sending}>
            {sending ? "Working…" : "Generate Codex prompt"}
          </button>
          {generatedPrompt ? (
            <button type="button" onClick={() => void copy(generatedPrompt, "maintenance")}>
              {copied === "maintenance" ? "Copied" : "Copy generated prompt"}
            </button>
          ) : null}
          {canPrepareTracked ? (
            <button type="button" onClick={() => void send("prepare for Codex")} disabled={sending}>
              Prepare tracked handoff
            </button>
          ) : null}
          {handoff ? (
            <button type="button" onClick={() => void send("verify Codex handoff")} disabled={sending}>
              Verify tracked handoff
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
          <details className="iren-maintenance-prompt">
            <summary>Preview generated Codex prompt</summary>
            <textarea readOnly aria-label="IREN maintenance Codex prompt" value={generatedPrompt} rows={12} onFocus={(event) => event.target.select()} />
          </details>
        ) : (
          <div className="iren-maintenance-alert">
            <span>CODEX HANDOFF</span>
            <strong>Generate a fresh maintenance prompt from current IREN state when you want a new Codex pass.</strong>
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
              {copied === handoff.handoff_id ? "Copied" : "Copy tracked handoff"}
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
