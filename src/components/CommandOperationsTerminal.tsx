import { useMemo, useState, type CSSProperties } from "react";
import type { RhenSession } from "../lib/auth";
import type { LiveTradingFeed } from "../lib/data";
import type { BtcCanaryProjection, IrenJobEvent, IrenSnapshot, RuntimeRow } from "../lib/runtime-topology";
import {
  IDENTITY,
  SYSTEMS,
  ageText,
  commandSystem,
  displayState,
  incidentOwner,
  runtimeOwner,
  stateTone,
  systemWork,
  type SystemName
} from "../lib/system-display";
import { useCommandObservation } from "../hooks/useCommandObservation";
import SystemIcon from "./company/SystemIcon";
import SystemInstrument from "./operations/SystemInstruments";
import "../styles/operations-terminal.css";

type TerminalFilter = "ALL" | SystemName;
type TerminalEvent = {
  id: string;
  at?: string | null;
  system: SystemName;
  source: string;
  state?: string | null;
  title: string;
  detail?: string | null;
};

const TERMINAL_SYSTEMS: SystemName[] = ["GRAEN", "VELUM", "IREN", "RHEN", "NOSTRA"];

function isSystem(value: unknown): value is SystemName {
  return typeof value === "string" && (SYSTEMS as readonly string[]).includes(value);
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function compactValue(value: unknown) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.length <= 120) return value;
  return "";
}

function fractionPercent(value?: string | null) {
  if (value === undefined || value === null || value === "") return "—";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";
  const percent = parsed * 100;
  return (percent > 0 ? "+" : "") + percent.toFixed(2) + "%";
}

function eventDetail(event?: Record<string, unknown>) {
  if (!event) return "";
  const candidates = [event, object(event.result), object(event.error)];
  const keys = ["stage", "phase", "status", "reason", "message", "candidate_id", "run_id", "retrying"];
  const parts: string[] = [];
  for (const bucket of candidates) {
    for (const key of keys) {
      const value = compactValue(bucket[key]);
      if (value && !parts.some(part => part.startsWith(key + ":"))) {
        parts.push(key.replaceAll("_", " ") + ": " + value);
      }
      if (parts.length >= 3) return parts.join(" · ");
    }
  }
  return parts.join(" · ");
}

function stamp(row: RuntimeRow, fallback?: string | null) {
  return row.last_heartbeat_at || row.observed_at || fallback || null;
}

function jobEvents(snapshot: IrenSnapshot | null): TerminalEvent[] {
  return (snapshot?.work?.job_events || []).flatMap((row: IrenJobEvent) => {
    const system = isSystem(row.owner_system) ? row.owner_system : null;
    if (!system) return [];
    const state = String(row.event_type || "UNKNOWN").toUpperCase();
    const detail = eventDetail(row.event);
    return [{
      id: "job-" + row.event_id,
      at: row.created_at,
      system,
      source: "DURABLE JOB EVENT",
      state,
      title: row.title || row.job_type || "IREN work item",
      detail: detail || displayState(state)
    }];
  });
}

function runtimeEvents(snapshot: IrenSnapshot | null): TerminalEvent[] {
  return (snapshot?.topology?.services || []).flatMap(row => {
    const system = runtimeOwner(row);
    if (!system) return [];
    return [{
      id: "runtime-" + row.service_id + "-" + String(stamp(row, snapshot?.observed_at)),
      at: stamp(row, snapshot?.observed_at),
      system,
      source: "RUNTIME OBSERVATION",
      state: row.status,
      title: row.service_name || row.service_id,
      detail: row.current_activity || "Heartbeat / readiness observation"
    }];
  });
}

function controlEvents(snapshot: IrenSnapshot | null): TerminalEvent[] {
  const transitions = (snapshot?.operator?.recent_transitions || []).map((row, index): TerminalEvent => ({
    id: "control-" + String(row.key || index) + "-" + String(row.created_at || index),
    at: row.created_at,
    system: "IREN",
    source: "CONTROL TRANSITION",
    state: row.severity,
    title: displayState(row.transition || "control transition"),
    detail: row.reason ? row.reason.replaceAll("_", " ") : row.key
  }));

  const incidents = (snapshot?.incidents || []).map((row, index): TerminalEvent => ({
    id: "incident-" + row.key + "-" + index,
    at: row.opened_at,
    system: incidentOwner(row),
    source: "INCIDENT",
    state: row.severity,
    title: row.key,
    detail: row.reason.replaceAll("_", " ")
  }));
  return [...transitions, ...incidents];
}

function publicEvents(feed?: LiveTradingFeed | null): TerminalEvent[] {
  const telemetry = (feed?.events || []).map((row, index): TerminalEvent => ({
    id: "telemetry-" + String(row.at || index) + "-" + index,
    at: row.at,
    system: "RHEN",
    source: "DURABLE TELEMETRY",
    state: row.kind,
    title: displayState(row.type || "runtime event"),
    detail: row.label
  }));

  const research = (feed?.research?.completed_decisions || []).map((row, index): TerminalEvent => ({
    id: "research-" + String(row.decision_key || row.at || index),
    at: row.at,
    system: "GRAEN",
    source: "RESEARCH RECORD",
    state: row.status,
    title: row.subject || row.decision_type || "Research decision",
    detail: row.conclusion || row.methodology_version
  }));
  return [...telemetry, ...research];
}

function researchTraceEvents(snapshot: IrenSnapshot | null): TerminalEvent[] {
  const problems = snapshot?.research?.graen_problems || [];
  const runs = snapshot?.research?.graen_runs || [];
  const activeVelumStage = problems.find(row =>
    String(row.research_stage || "").includes("VELUM")
    && ["RUNNING", "QUEUED", "WAITING", "BLOCKED"].includes(String(row.status || "").toUpperCase())
  )?.research_stage;

  const problemEvents = problems.map((row, index): TerminalEvent => ({
    id: "graen-problem-" + String(row.problem_id || index) + "-" + String(row.updated_at || index),
    at: row.updated_at || row.started_at,
    system: "GRAEN",
    source: "GRAEN STAGE",
    state: row.status,
    title: row.title || "Research problem",
    detail: row.research_stage ? displayState(row.research_stage) : "No active research stage"
  }));

  const runEvents = runs.map((row, index): TerminalEvent => {
    const detail = [
      row.methodology_version ? "method: " + row.methodology_version : "",
      row.result_state ? "state: " + displayState(row.result_state) : "",
      row.error ? "error: " + row.error.slice(0, 140) : ""
    ].filter(Boolean).join(" · ");
    return {
      id: "graen-run-" + String(row.run_id || index),
      at: row.completed_at || row.started_at || row.created_at,
      system: "GRAEN",
      source: "GRAEN RUN",
      state: row.status,
      title: row.result_state ? displayState(row.result_state) : "Research execution",
      detail
    };
  });

  const replayEvents = (snapshot?.research?.velum_replays || []).map((row, index): TerminalEvent => ({
    id: "velum-replay-" + String(row.started_at || index) + "-" + index,
    at: row.completed_at || row.started_at,
    system: "VELUM",
    source: "VELUM REPLAY",
    state: row.status,
    title: activeVelumStage ? displayState(activeVelumStage) : "Replay lifecycle",
    detail: "Replay " + displayState(row.status || "UNKNOWN")
  }));

  return [...problemEvents, ...runEvents, ...replayEvents];
}

function sortEvents(rows: TerminalEvent[]) {
  const seen = new Set<string>();
  return rows
    .filter(row => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .sort((a, b) => (Date.parse(b.at || "") || 0) - (Date.parse(a.at || "") || 0));
}

function activeResearchProblem(snapshot: IrenSnapshot | null, system: SystemName) {
  const activeStates = ["RUNNING", "QUEUED", "WAITING", "BLOCKED"];
  return (snapshot?.research?.graen_problems || []).find(row => {
    if (!activeStates.includes(String(row.status || "").toUpperCase())) return false;
    const stage = String(row.research_stage || "");
    return system === "VELUM" ? stage.includes("VELUM_REPLAY") : true;
  });
}

function laneActivity(snapshot: IrenSnapshot | null, feed: LiveTradingFeed | null | undefined, system: SystemName, now: number) {
  const view = commandSystem(system, snapshot, feed, now);
  const work = systemWork(snapshot, system);
  const running = work.jobs.find(row => String(row.status) === "RUNNING");
  const queued = work.jobs.find(row => String(row.status) === "QUEUED");
  const job = running || queued || work.jobs[0];

  const activeProblem = activeResearchProblem(snapshot, system);
  const activeReplay = (snapshot?.research?.velum_replays || []).find(row =>
    String(row.status || "").toUpperCase() === "RUNNING"
  );
  const stage = activeProblem?.research_stage || null;

  let traceActivity: string | null = null;
  let traceStatus: string | null = null;
  let traceType: string | null = null;
  let traceStarted: string | null = null;

  if (system === "GRAEN" && activeProblem) {
    traceActivity = [activeProblem.title, stage ? displayState(stage) : null].filter(Boolean).join(" · ");
    traceStatus = activeProblem.status || null;
    traceType = stage ? displayState(stage) : "Research problem";
    traceStarted = activeProblem.started_at || activeProblem.updated_at || null;
  }
  if (system === "VELUM" && (activeProblem || activeReplay)) {
    traceActivity = stage ? displayState(stage) : "Replay running";
    traceStatus = activeReplay?.status || activeProblem?.status || null;
    traceType = stage ? displayState(stage) : "VELUM replay";
    traceStarted = activeReplay?.started_at || activeProblem?.started_at || activeProblem?.updated_at || null;
  }

  const researchFocus = system === "GRAEN" ? feed?.research?.current_focus : null;
  const activity = String(traceActivity || job?.title || researchFocus || view.activity || "Awaiting observation.");
  const started = String(traceStarted || job?.started_at || activeProblem?.started_at || job?.created_at || "");
  const traceActive = String(traceStatus || "").toUpperCase() === "RUNNING";
  return { view, work, job, activity, started, traceStatus, traceType, traceActive, activeProblem };
}

function elapsed(value: unknown, now: number) {
  const stamp = Date.parse(String(value || ""));
  if (!Number.isFinite(stamp) || stamp > now) return "—";
  const seconds = Math.max(0, Math.floor((now - stamp) / 1000));
  if (seconds < 60) return seconds + "s";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m " + (seconds % 60) + "s";
  return Math.floor(minutes / 60) + "h " + (minutes % 60) + "m";
}

function jobContext(job?: Record<string, unknown>) {
  if (!job) return [] as Array<[string, string]>;
  const metadata = object(job.metadata);
  const rows: Array<[string, string]> = [];
  const fields: Array<[string, string[]]> = [
    ["STAGE", ["stage", "phase"]],
    ["RUN", ["run_id", "campaign_id", "experiment_id"]],
    ["CANDIDATE", ["candidate_id", "candidate", "strategy_id"]],
    ["HYPOTHESIS", ["hypothesis", "family", "mechanism"]]
  ];
  for (const [label, keys] of fields) {
    const key = keys.find(candidate => compactValue(metadata[candidate]));
    if (key) rows.push([label, compactValue(metadata[key])]);
  }
  return rows.slice(0, 4);
}

function researchContext(snapshot: IrenSnapshot | null, system: "GRAEN" | "VELUM") {
  const problem = activeResearchProblem(snapshot, system);
  if (!problem) return [] as Array<[string, string]>;
  const run = (snapshot?.research?.graen_runs || []).find(row =>
    row.problem_id && row.problem_id === problem.problem_id
  );
  const rows: Array<[string, string | null | undefined]> = [
    ["STAGE", problem.research_stage ? displayState(problem.research_stage) : null],
    ["RUN", run?.run_id || problem.campaign_id],
    ["CANDIDATE", problem.candidate_id],
    ["HYPOTHESIS", problem.hypothesis || problem.family || problem.mechanism]
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1])).slice(0, 4);
}

function FocusWorkbench({
  system,
  snapshot,
  feed,
  events,
  now
}: {
  system: "GRAEN" | "VELUM";
  snapshot: IrenSnapshot | null;
  feed?: LiveTradingFeed | null;
  events: TerminalEvent[];
  now: number;
}) {
  const lane = laneActivity(snapshot, feed, system, now);
  const rows = (snapshot?.topology?.services || []).filter(row => runtimeOwner(row) === system);
  const runtime = rows.find(row => row.current_activity) || rows[0];
  const latest = events.find(row => row.system === system);
  const jobMeta = jobContext(lane.job);
  const context = jobMeta.length ? jobMeta : researchContext(snapshot, system);
  const startedAt = lane.started || runtime?.started_at;
  const heartbeat = runtime?.last_heartbeat_at || runtime?.observed_at || lane.view.observedAt ||
    (system === "GRAEN" ? snapshot?.research?.graen_runtime?.heartbeat_at : null);
  const live = lane.view.active || lane.traceActive || String(lane.job?.status || "") === "RUNNING";

  return (
    <article
      className={"terminal-focus-card tone-" + stateTone(lane.view.raw) + (live ? " is-working" : "")}
      style={{ "--terminal-accent": IDENTITY[system].color } as CSSProperties}
    >
      <header>
        <div className="terminal-focus-title">
          <SystemIcon system={system} size="sm" />
          <div><span>{system === "GRAEN" ? "RESEARCH WORKBENCH" : "REPLAY WORKBENCH"}</span><h2>{system}</h2></div>
        </div>
        <div className="terminal-focus-state"><i aria-hidden="true" /><strong>{displayState(lane.view.raw)}</strong></div>
      </header>

      <div className="terminal-focus-instrument" aria-label={system + " live activity instrument"}>
        <SystemInstrument name={system} />
        <i className="terminal-focus-sweep" aria-hidden="true" />
      </div>

      <div className="terminal-focus-work">
        <span>CURRENT WORK</span>
        <strong>{lane.activity}</strong>
        <p>{runtime?.current_activity || (lane.job?.title ? String(lane.job.title) : lane.activity)}</p>
      </div>

      {context.length > 0 && <div className="terminal-focus-context">
        {context.map(([label, value]) => <span key={label}><b>{label}</b>{value}</span>)}
      </div>}

      <dl className="terminal-focus-metrics">
        <div><dt>STATE</dt><dd>{displayState(lane.traceStatus || String(lane.job?.status || lane.view.raw || "UNKNOWN"))}</dd></div>
        <div><dt>STAGE</dt><dd>{lane.traceType || String(lane.job?.job_type || "—").replaceAll("_", " ")}</dd></div>
        <div><dt>ELAPSED</dt><dd>{elapsed(startedAt, now)}</dd></div>
        <div><dt>HEARTBEAT</dt><dd>{ageText(heartbeat, now)}</dd></div>
      </dl>

      <footer>
        <div><span>RUNTIME</span><strong>{runtime?.service_name || runtime?.service_id || "No owned runtime observed"}</strong></div>
        <div><span>LATEST EVENT</span><strong>{latest ? latest.title + " · " + ageText(latest.at, now) : "No event exposed yet"}</strong></div>
      </footer>
    </article>
  );
}

function AutonomousOperatingPanel({
  snapshot,
  now
}: {
  snapshot: IrenSnapshot | null;
  now: number;
}) {
  const summary = snapshot?.research?.operating_summary;
  const requirements = snapshot?.research?.engineering_requirements || [];
  const recentHypotheses = snapshot?.research?.hypothesis_graph?.recent_nodes || [];
  const state = snapshot?.operating_state || summary?.condition || snapshot?.state || "UNKNOWN";
  const productivity = snapshot?.productivity_state || summary?.productivity || "UNKNOWN";
  const nextAction = summary?.next_autonomous_action || "Awaiting canonical autonomous operating state.";
  const objective = summary?.objective || "Discover a reproducible, cost-aware crypto trading edge.";
  const charter = snapshot?.research?.autonomy_charter;
  const topRequirement = requirements[0];

  const copyHandoff = async () => {
    const prompt = topRequirement?.handoff_prompt;
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Clipboard permission can be unavailable in standalone/iOS contexts.
    }
  };

  return (
    <section
      className={"terminal-autonomy tone-" + stateTone(state)}
      aria-label="ANEVUM autonomous operating loop"
    >
      <header>
        <div className="terminal-autonomy-title">
          <SystemIcon system="IREN" size="sm" />
          <div>
            <span>ANEVUM / AUTONOMOUS OPERATING LOOP</span>
            <h2>{displayState(state)}</h2>
          </div>
        </div>
        <div className="terminal-autonomy-productivity">
          <i className={productivity === "PRODUCTIVE" || state === "RESEARCHING" ? "is-live" : ""} aria-hidden="true" />
          <span>PRODUCTIVITY</span>
          <strong>{displayState(productivity)}</strong>
        </div>
      </header>

      <div className="terminal-autonomy-objective">
        <span>CURRENT OBJECTIVE</span>
        <strong>{objective}</strong>
        <p>{nextAction}</p>
      </div>

      <dl className="terminal-autonomy-metrics">
        <div><dt>ACTIVE HYPOTHESES</dt><dd>{summary?.active_hypotheses ?? "—"}</dd></div>
        <div><dt>RUNNING</dt><dd>{summary?.experiments_running ?? "—"}</dd></div>
        <div><dt>FALSIFIED</dt><dd>{summary?.hypotheses_falsified ?? "—"}</dd></div>
        <div><dt>VALIDATION</dt><dd>{summary?.validation_candidates ?? "—"}</dd></div>
        <div><dt>HOLDOUT</dt><dd>{summary?.holdout_candidates ?? "—"}</dd></div>
        <div><dt>ENGINEERING</dt><dd>{summary?.engineering_required ?? requirements.length}</dd></div>
      </dl>

      <div className="terminal-autonomy-body">
        <section className="terminal-autonomy-memory">
          <header>
            <div><span>RESEARCH MEMORY</span><strong>{snapshot?.research?.hypothesis_graph?.node_count ?? 0} hypotheses recorded</strong></div>
            <small>latest progress {ageText(summary?.latest_progress_at, now)}</small>
          </header>
          <ol>
            {recentHypotheses.length ? recentHypotheses.slice(0, 6).map((row, index) => (
              <li key={String(row.hypothesis_id || row.problem_id || index)}>
                <div>
                  <b>{row.hypothesis_id || "UNNAMED"}</b>
                  <span>{row.family || row.title || "Research hypothesis"}</span>
                </div>
                <strong>{displayState(row.state || "UNKNOWN")}</strong>
                <small>{row.failure_reasons?.[0] || row.latest_result_state || row.research_stage || "No terminal result yet"}</small>
              </li>
            )) : <li className="terminal-autonomy-empty">No hypothesis memory exposed yet.</li>}
          </ol>
        </section>

        <section className={"terminal-autonomy-engineering" + (topRequirement ? " is-required" : "")}>
          <header>
            <span>MANUAL SOFTWARE BOUNDARY</span>
            <strong>{topRequirement ? "CHATGPT / CODEX REQUIRED" : "NO ENGINEERING REQUIRED"}</strong>
          </header>
          {topRequirement ? (
            <>
              <h3>{topRequirement.title || topRequirement.requirement_id || "Software capability required"}</h3>
              <p>{topRequirement.reason || topRequirement.capability_required}</p>
              <div className="terminal-autonomy-requirement-meta">
                <span><b>ID</b>{topRequirement.requirement_id || "—"}</span>
                <span><b>RISK</b>{topRequirement.risk || "—"}</span>
                <span><b>BLOCKS</b>{topRequirement.blocked_research?.join(", ") || "research branch"}</span>
              </div>
              <button
                type="button"
                onClick={() => void copyHandoff()}
                disabled={!topRequirement.handoff_prompt}
              >
                COPY CODEX HANDOFF
              </button>
              <small>{topRequirement.continuation_policy || "Independent research continues while software is updated manually."}</small>
            </>
          ) : (
            <p>GRAEN can continue research with the trusted runtime. Source changes, merges, deploys, spending, and risk expansion remain outside autonomous authority.</p>
          )}
        </section>
      </div>

      <footer>
        <span><b>CHARTER</b>{charter?.charter_id || "ANEVUM-AUTONOMY-CHARTER-V1"} {charter?.version ? "v" + charter.version : ""}</span>
        <span><b>CODE</b>{charter?.code_mutation_authority === false ? "MANUAL ONLY" : "LOCKED"}</span>
        <span><b>SPEND</b>{charter?.spending_authority === false ? "MANUAL ONLY" : "LOCKED"}</span>
        <span><b>RISK INCREASE</b>{charter?.production_risk_increase_authority === false ? "MANUAL ONLY" : "LOCKED"}</span>
      </footer>
    </section>
  );
}

function BtcCanaryPanel({
  canary,
  now
}: {
  canary?: BtcCanaryProjection;
  now: number;
}) {
  const available = canary?.available === true;
  const state = available
    ? displayState(canary?.evidence_state || "OBSERVING")
    : "NO CANONICAL RUN";
  const protectionStatus = String(canary?.protection_status || "").toLowerCase();
  const protectionActive = [
    "new",
    "accepted",
    "held",
    "pending_new",
    "partially_filled"
  ].includes(protectionStatus);
  const positionState = canary?.position_open
    ? protectionActive
      ? "OPEN / PROTECTED"
      : "OPEN / CHECK PROTECTION"
    : "FLAT";
  const protection = canary?.protection_status
    ? displayState(canary.protection_status)
    : canary?.position_open
      ? "UNCONFIRMED"
      : "NOT REQUIRED";
  const action = displayState(canary?.action || "AWAITING");
  const returnLabel = fractionPercent(canary?.current_return_pct);
  const returnTone = Number(canary?.current_return_pct || 0);
  const returnClass = !available
    ? ""
    : returnTone > 0
      ? " is-positive"
      : returnTone < 0
        ? " is-negative"
        : "";
  const observed = canary?.observed_at || canary?.decision_at;
  const signal = canary?.signal;
  const momentumLabel = fractionPercent(signal?.momentum_return);
  const signalClose = Number(signal?.close || 0);
  const signalSma = Number(signal?.sma || 0);
  const smaGap = signalClose > 0 && signalSma > 0
    ? fractionPercent(String(signalClose / signalSma - 1))
    : "—";
  const desiredState = signal?.desired_long === true
    ? "LONG"
    : signal?.desired_long === false
      ? "FLAT"
      : "WAITING";
  const consensusPass = signal?.desired_long === true;
  const cycles = (canary?.recent_cycles || []).slice(-6).reverse();

  const returns = (canary?.return_history || [])
    .map(point => ({
      at: point.at,
      value: Number(point.return_pct)
    }))
    .filter(point => Number.isFinite(point.value));
  const minReturn = returns.length ? Math.min(...returns.map(point => point.value), 0) : 0;
  const maxReturn = returns.length ? Math.max(...returns.map(point => point.value), 0) : 0;
  const returnRange = Math.max(maxReturn - minReturn, 0.0001);
  const sparkPoints = returns.map((point, index) => {
    const x = returns.length <= 1 ? 120 : index * 240 / (returns.length - 1);
    const y = 50 - ((point.value - minReturn) / returnRange) * 44;
    return x.toFixed(2) + "," + y.toFixed(2);
  }).join(" ");
  const zeroY = 50 - ((0 - minReturn) / returnRange) * 44;

  return (
    <section
      className={"terminal-canary terminal-canary-live" + (available ? " is-available" : "")}
      aria-label="BTC canary live paper experiment"
    >
      <header>
        <div className="terminal-canary-title">
          <SystemIcon system="RHEN" size="sm" />
          <div>
            <span>RHEN / LIVE FORWARD PAPER EXPERIMENT</span>
            <h2>BTC-CANARY-001</h2>
          </div>
        </div>
        <div className="terminal-canary-authority">
          <b>PAPER ONLY</b>
          <b>LIVE DISABLED</b>
          <b>NOT PROMOTED</b>
        </div>
      </header>

      <div className="terminal-canary-livebar">
        <div>
          <i className={available ? "is-live" : ""} aria-hidden="true" />
          <span>OPERATING STATE</span>
          <strong>{state}</strong>
        </div>
        <p>{canary?.reason || "Waiting for canonical BTC canary evidence."}</p>
        <small>canonical observation {ageText(observed, now)} · 3s Command refresh</small>
      </div>

      <div className="terminal-canary-operating-grid">
        <section className="terminal-canary-engine" aria-label="BTC canary decision pipeline">
          <header>
            <div><span>LIVE DECISION PIPELINE</span><strong>Frozen R2H consensus</strong></div>
            <small>{canary?.bar_interval || "4Hour"} bars · 24/7 crypto lane</small>
          </header>

          <div className="terminal-canary-flow">
            <article className={"terminal-canary-node" + (signal?.bar_at ? " is-active" : "")}>
              <span>01 · BAR</span>
              <strong>{signal?.bar_at ? "COMPLETE" : "WAITING"}</strong>
              <small>{signal?.bar_at ? ageText(signal.bar_at, now) : "No completed bar"}</small>
              <em>{signal?.completed_bar_count ? signal.completed_bar_count + " bars loaded" : "4H BTC/USD"}</em>
            </article>

            <div className="terminal-canary-arrow" aria-hidden="true">→</div>

            <article className={"terminal-canary-node" + (signal?.momentum_positive ? " is-pass" : "")}>
              <span>02 · MOMENTUM</span>
              <strong>{momentumLabel}</strong>
              <small>180-day / 1080-bar lookback</small>
              <em>{signal?.momentum_positive === true ? "POSITIVE" : signal?.momentum_positive === false ? "NEGATIVE" : "WAITING"}</em>
            </article>

            <div className="terminal-canary-arrow terminal-canary-arrow-or" aria-hidden="true">OR</div>

            <article className={"terminal-canary-node" + (signal?.above_sma ? " is-pass" : "")}>
              <span>03 · SMA REGIME</span>
              <strong>{smaGap}</strong>
              <small>price vs 250-day / 1500-bar SMA</small>
              <em>{signal?.above_sma === true ? "ABOVE SMA" : signal?.above_sma === false ? "BELOW SMA" : "WAITING"}</em>
            </article>

            <div className="terminal-canary-arrow" aria-hidden="true">→</div>

            <article className={"terminal-canary-node terminal-canary-decision" + (consensusPass ? " is-pass" : "")}>
              <span>04 · CONSENSUS</span>
              <strong>{desiredState}</strong>
              <small>momentum positive OR above SMA</small>
              <em>{action}</em>
            </article>

            <div className="terminal-canary-arrow" aria-hidden="true">→</div>

            <article className={"terminal-canary-node terminal-canary-position" + (canary?.position_open ? " is-active" : "")}>
              <span>05 · POSITION</span>
              <strong>{positionState}</strong>
              <small>{protectionActive ? "broker protection confirmed" : protection}</small>
              <em>{returnLabel}</em>
            </article>
          </div>
        </section>

        <section className="terminal-canary-forward" aria-label="BTC canary forward performance">
          <header>
            <div><span>FORWARD PAPER RETURN</span><strong className={returnClass}>{returnLabel}</strong></div>
            <small>{canary?.position_open ? "position open" : "no open BTC position"}</small>
          </header>

          <div className="terminal-canary-spark">
            {sparkPoints ? (
              <svg viewBox="0 0 240 56" role="img" aria-label="Recent forward paper return trace">
                <line x1="0" x2="240" y1={zeroY} y2={zeroY} className="terminal-canary-zero" />
                <polyline points={sparkPoints} className="terminal-canary-return-line" />
              </svg>
            ) : (
              <div className="terminal-canary-nochart">Waiting for durable return observations.</div>
            )}
          </div>

          <dl>
            <div><dt>POSITION</dt><dd>{positionState}</dd></div>
            <div><dt>RISK STOP</dt><dd>{fractionPercent(canary?.risk_stop_pct)}</dd></div>
            <div><dt>PROTECTION</dt><dd>{protection}</dd></div>
            <div><dt>LAST SIGNAL</dt><dd>{action}</dd></div>
          </dl>
        </section>
      </div>

      <section className="terminal-canary-cycles" aria-label="Recent BTC canary decision cycles">
        <header>
          <span>RECENT DECISION CYCLES</span>
          <strong>{cycles.length ? cycles.length + " canonical observations" : "Awaiting observations"}</strong>
        </header>
        <ol>
          {cycles.length ? cycles.map((cycle, index) => (
            <li key={String(cycle.at || index) + "-" + index}>
              <time dateTime={cycle.at || undefined}>
                {cycle.at ? new Date(cycle.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
              </time>
              <b>{displayState(cycle.action || "OBSERVE")}</b>
              <span>{cycle.reason || "Canary observation"}</span>
              <small>{ageText(cycle.at, now)}</small>
            </li>
          )) : <li className="terminal-canary-empty">No durable canary cycles exposed yet.</li>}
        </ol>
      </section>

      <footer>
        <span><b>RUN</b>{canary?.run_id || "—"}</span>
        <span><b>MODEL</b>{canary?.model_version || canary?.strategy_version_id || "BTC-CANARY-001"}</span>
        <span><b>OBSERVED</b>{ageText(observed, now)}</span>
      </footer>
    </section>
  );
}

export default function CommandOperationsTerminal({
  session,
  feed,
  feedError
}: {
  session: RhenSession;
  feed?: LiveTradingFeed | null;
  feedError?: string;
}) {
  const { snapshot, error, now, receivedAt } = useCommandObservation(session, 3000);
  const [filter, setFilter] = useState<TerminalFilter>("ALL");

  const events = useMemo(
    () => sortEvents([
      ...jobEvents(snapshot),
      ...runtimeEvents(snapshot),
      ...controlEvents(snapshot),
      ...researchTraceEvents(snapshot),
      ...publicEvents(feed)
    ]),
    [snapshot, feed]
  );
  const visible = filter === "ALL" ? events : events.filter(row => row.system === filter);
  const fleetFresh = Boolean(snapshot && !snapshot.stale && !error);
  const activeCount = TERMINAL_SYSTEMS.filter(system => {
    const lane = laneActivity(snapshot, feed, system, now);
    return lane.view.active || lane.traceActive;
  }).length;

  return (
    <article className="command-panel command-view-terminal operations-terminal" data-visual-ops="terminal" aria-label="ANEVUM live operations terminal">
      <header className="terminal-heading">
        <div>
          <span>COMMAND / LIVE OPERATIONS</span>
          <h1>System terminal</h1>
          <p>Evidence-backed activity across GRAEN, VELUM, IREN, RHEN, and NOSTRA.</p>
        </div>
        <div className="terminal-session">
          <span className={fleetFresh ? "terminal-live-dot is-live" : "terminal-live-dot"} aria-hidden="true" />
          <div><strong>{fleetFresh ? "LIVE" : "DEGRADED"}</strong><small>3s read-only poll</small></div>
        </div>
      </header>

      <section className="terminal-meta" aria-label="Terminal observation state">
        <div><span>IREN</span><strong>{displayState(snapshot?.state)}</strong><small>revision {snapshot?.revision ?? "—"}</small></div>
        <div><span>OBSERVED</span><strong>{ageText(snapshot?.observed_at, now)}</strong><small>received {ageText(receivedAt, now)}</small></div>
        <div><span>ACTIVE</span><strong>{activeCount} / {TERMINAL_SYSTEMS.length}</strong><small>explicit work signals</small></div>
        <div><span>EVENTS</span><strong>{events.length}</strong><small>current merged window</small></div>
      </section>

      {(error || feedError) && <div className="terminal-warning"><strong>OBSERVATION DEGRADED</strong><span>{error || feedError}</span></div>}

      <AutonomousOperatingPanel snapshot={snapshot} now={now} />

      <section className="terminal-focus-grid" aria-label="GRAEN and VELUM live workbenches">
        <FocusWorkbench system="GRAEN" snapshot={snapshot} feed={feed} events={events} now={now} />
        <FocusWorkbench system="VELUM" snapshot={snapshot} feed={feed} events={events} now={now} />
      </section>

      <BtcCanaryPanel canary={snapshot?.btc_canary} now={now} />

      <section className="terminal-lanes" aria-label="ANEVUM systems">
        {TERMINAL_SYSTEMS.map(system => {
          const lane = laneActivity(snapshot, feed, system, now);
          const tone = stateTone(lane.view.raw);
          const latest = events.find(row => row.system === system);
          const rows = (snapshot?.topology?.services || []).filter(row => runtimeOwner(row) === system);
          return (
            <article
              key={system}
              className={"terminal-lane tone-" + tone + (lane.view.active || lane.traceActive ? " is-working" : "")}
              style={{ "--terminal-accent": IDENTITY[system].color } as CSSProperties}
            >
              <header>
                <SystemIcon system={system} size="sm" />
                <div><strong>{system}</strong><span>{IDENTITY[system].role}</span></div>
                <b>{displayState(lane.view.raw)}</b>
              </header>
              <div className="terminal-lane-activity">
                <i className={lane.view.active || lane.traceActive ? "is-live" : ""} aria-hidden="true" />
                <p>{lane.activity}</p>
              </div>
              <dl>
                <div><dt>STATE</dt><dd>{displayState(lane.traceStatus || String(lane.job?.status || lane.view.raw || "UNKNOWN"))}</dd></div>
                <div><dt>RUNTIMES</dt><dd>{rows.length || "—"}</dd></div>
                <div><dt>LAST SIGNAL</dt><dd>{ageText(latest?.at || lane.view.observedAt, now)}</dd></div>
              </dl>
              {lane.job && <small className="terminal-job-age">{lane.started ? "Started " + ageText(lane.started, now) : "Queued work"} · {String(lane.job.job_type || "work").replaceAll("_", " ")}</small>}
            </article>
          );
        })}
      </section>

      <section className="terminal-stream">
        <header>
          <div><span>UNIFIED EVENT STREAM</span><strong>{filter === "ALL" ? "All systems" : filter}</strong></div>
          <nav aria-label="Filter terminal events">
            {(["ALL", ...TERMINAL_SYSTEMS] as TerminalFilter[]).map(item => (
              <button
                type="button"
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
              >{item}</button>
            ))}
          </nav>
        </header>
        <div className="terminal-stream-head" aria-hidden="true"><span>TIME</span><span>SYSTEM</span><span>SOURCE</span><span>EVENT</span></div>
        <ol>
          {visible.length ? visible.slice(0, 80).map(row => (
            <li key={row.id} className={"tone-" + stateTone(row.state)}>
              <time dateTime={row.at || undefined}>{row.at ? new Date(row.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}</time>
              <span className="terminal-event-system"><SystemIcon system={row.system} size="xs" /><b>{row.system}</b></span>
              <span className="terminal-event-source">{row.source}</span>
              <div><strong>{row.title}</strong>{row.detail && <p>{row.detail}</p>}<small>{ageText(row.at, now)}</small></div>
            </li>
          )) : <li className="terminal-empty">No recorded events for this filter.</li>}
        </ol>
      </section>

      <footer className="terminal-footer">
        <span>READ ONLY · no execution authority</span>
        <span>IREN / Foundation + durable telemetry</span>
      </footer>
    </article>
  );
}
