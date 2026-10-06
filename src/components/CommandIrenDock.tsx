import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function buildMaintenancePrompt(feed: IrenFeed | null, focus: string) {
  const services = (feed?.topology?.services || []).slice(0, 12);
  const incidents = (feed?.incidents || []).slice(0, 12);
  const objectives = (feed?.work?.objectives || [])
    .filter((row) => ["ACTIVE", "READY", "BLOCKED"].includes(String(row.status || "").toUpperCase()))
    .slice(0, 10);
  const jobs = (feed?.work?.jobs || [])
    .filter((row) => ["QUEUED", "RUNNING", "WAITING", "BLOCKED", "NEEDS_APPROVAL"].includes(String(row.status || "").toUpperCase()))
    .slice(0, 10);
  const handoff = activeHandoff(feed);
  const operatorFocus = focus.trim();

  const lines = [
    "Continue ANEVUM/RHEN maintenance from the CURRENT actual state. Do not restart architecture analysis or redesign completed work.",
    "",
    "Canonical repositories:",
    "- Backend/runtime: anevum/alpaca-trader",
    "- Frontend/Command: anevum/anevum-web",
    "",
    "IREN snapshot:",
    "- State: " + clean(feed?.state, "UNKNOWN"),
    "- Observed at: " + clean(feed?.observed_at),
    "- Snapshot stale: " + (feed?.stale ? "YES" : "NO"),
    "- Revision: " + clean(feed?.revision),
    "",
    "Runtime services:"
  ];

  if (services.length) {
    for (const row of services) {
      lines.push(
        "- " + clean(row.service_name || row.service_id, "service") +
        " | status=" + clean(row.status, "UNKNOWN") +
        " | ready=" + (row.readiness === true ? "YES" : row.readiness === false ? "NO" : "UNKNOWN") +
        " | revision=" + clean(row.revision) +
        " | deployment=" + clean(row.deployment) +
        (row.current_activity ? " | activity=" + clean(row.current_activity) : "")
      );
    }
  } else {
    lines.push("- No service inventory was present in this snapshot. Inspect live Railway state before editing.");
  }

  lines.push("", "Open incidents:");
  if (incidents.length) {
    for (const row of incidents) {
      lines.push(
        "- " + clean(row.key || row.incident_type, "incident") +
        " | severity=" + clean(row.severity, "UNKNOWN") +
        " | reason=" + clean(row.reason, "unspecified")
      );
    }
  } else {
    lines.push("- None reported.");
  }

  lines.push("", "Active objectives:");
  if (objectives.length) {
    for (const row of objectives) {
      lines.push(
        "- " + clean(row.objective_key, "objective") +
        " | " + clean(row.status, "UNKNOWN") +
        " | " + clean(row.title, "Untitled") +
        " | owner=" + clean(row.owner_system, "IREN")
      );
    }
  } else {
    lines.push("- None.");
  }

  lines.push("", "Active work:");
  if (jobs.length) {
    for (const row of jobs) {
      lines.push(
        "- " + clean(row.job_id, "job") +
        " | " + clean(row.status, "UNKNOWN") +
        " | " + clean(row.job_type, "WORK") +
        " | " + clean(row.title, "Untitled") +
        " | owner=" + clean(row.owner_system, "IREN")
      );
    }
  } else {
    lines.push("- None.");
  }

  lines.push(
    "",
    "IREN next action:",
    "- " + (feed?.work?.next_action?.title
      ? clean(feed.work.next_action.title) + " | mode=" + clean(feed.work.execution_mode, "unknown")
      : "No pending canonical action.")
  );

  lines.push("", "Tracked Codex handoff:");
  if (handoff?.package) {
    lines.push(
      "- ACTIVE: " + clean(handoff.package.title) +
      " | status=" + clean(handoff.handoff_status) +
      " | objective=" + clean(handoff.objective_key) +
      " | base=" + shortId(handoff.package.base_sha)
    );
    lines.push("- Inspect and continue/verify this handoff before creating overlapping work.");
  } else {
    lines.push("- None active.");
  }

  lines.push(
    "",
    "Operator focus:",
    operatorFocus ? "- " + operatorFocus : "- No additional focus supplied. Perform the highest-value maintenance pass supported by current evidence.",
    "",
    "Execution instructions:",
    "1. Inspect CURRENT main in both repositories, applicable AGENTS.md files, current GitHub CI, current Railway deployments, and current Command/IREN state before editing. Treat the snapshot above as context, not authority.",
    "2. Reconcile the snapshot against live evidence. Do not act on stale assumptions, old PRs, obsolete services, or legacy architecture.",
    "3. Preserve the current ANEVUM/RHEN architecture and naming. Consolidate rather than duplicate. Do not reintroduce retired infrastructure.",
    "4. Identify the highest-value concrete maintenance/update work consistent with the operator focus and current evidence. If a safe code fix is clear, implement it; do not stop at analysis.",
    "5. Add or update focused tests, run the relevant full CI, and verify the deployed result with GitHub plus Railway/Cloudflare evidence.",
    "6. Preserve RHEN live strategy, risk controls, broker behavior, position sizing, execution permissions, credentials, and capital behavior unless the operator explicitly authorizes a change to those protected areas.",
    "7. Keep paid model/API worker spending disabled. Do not add autonomous spending, credential changes, destructive infrastructure actions, or silent live-trading behavior changes.",
    "8. Do not fabricate health, telemetry, research progress, trades, deployment state, or completion. If evidence is missing, surface the missing evidence.",
    "9. If there is no real maintenance need, say so and do not invent work.",
    "10. Finish with: exact changes made, tests/CI results, deployed state, unresolved blockers, and the next concrete action if one exists."
  );

  return lines.join("\n");
}

export default function CommandIrenMaintenance({ session }: { session: RhenSession }) {
  const [feed, setFeed] = useState<IrenFeed | null>(null);
  const [focus, setFocus] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [sending, setSending] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<{ command: IrenCommand; job?: IrenJob } | null>(null);
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
    if (sending) return;
    setSending(true);
    setLastOutcome(null);
    try {
      const accepted = await request("/api/command/iren/command", {
        method: "POST",
        body: JSON.stringify({ command })
      }) as { command?: IrenCommand };
      const commandId = accepted.command?.command_id;
      if (commandId) {
        setLastOutcome(await waitForCommand(commandId));
      } else {
        await refresh();
      }
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "IREN control failed.");
    } finally {
      setSending(false);
    }
  }, [refresh, request, sending, waitForCommand]);

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
  const maintenancePrompt = useMemo(() => buildMaintenancePrompt(feed, focus), [feed, focus]);
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
          <div><span>MODE</span><strong>{executionMode}</strong></div>
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
          <button type="button" className="primary" onClick={() => void copy(maintenancePrompt, "maintenance")}>
            {copied === "maintenance" ? "Copied" : "Copy maintenance prompt"}
          </button>
          {canPrepareTracked ? (
            <button type="button" onClick={() => void send("prepare for Codex")} disabled={sending}>
              {sending ? "Preparing…" : "Prepare tracked handoff"}
            </button>
          ) : null}
          {handoff ? (
            <button type="button" onClick={() => void send("verify Codex handoff")} disabled={sending}>
              {sending ? "Verifying…" : "Verify tracked handoff"}
            </button>
          ) : null}
        </div>

        {lastOutcome ? (
          <div className="iren-maintenance-alert">
            <span>LAST IREN CONTROL · {clean(lastOutcome.job?.status || lastOutcome.command.status, "COMPLETE")}</span>
            <strong>{outcomeMessage || "Control completed."}</strong>
          </div>
        ) : null}

        <details className="iren-maintenance-prompt">
          <summary>Preview maintenance prompt</summary>
          <textarea readOnly aria-label="IREN maintenance Codex prompt" value={maintenancePrompt} rows={12} onFocus={(event) => event.target.select()} />
        </details>

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
