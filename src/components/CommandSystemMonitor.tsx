import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { commandAuthHeaders, type RhenSession } from "../lib/auth";
import type { LiveTradingFeed } from "../lib/data";
import {
  ageLabel,
  isStale,
  runtimeStatus,
  type IrenSnapshot,
  type RuntimeRow
} from "../lib/runtime-topology";
import "../styles/system-monitor.css";

export type MonitoredSystem = "IREN" | "RHEN" | "GRAEN" | "NOSTRA" | "VELUM";

const SYSTEM_COPY: Record<MonitoredSystem, { role: string; empty: string }> = {
  IREN: {
    role: "Operating intelligence, control-plane state, incidents, objectives, and system coordination.",
    empty: "No IREN or Foundation runtime observation is available."
  },
  RHEN: {
    role: "Market observation, execution boundaries, broker state, telemetry, and strategy runtime.",
    empty: "No RHEN runtime observation is available."
  },
  GRAEN: {
    role: "Mathematical research, hypothesis evaluation, falsification, and strategy promotion research.",
    empty: "No GRAEN runtime observation is available."
  },
  NOSTRA: {
    role: "Forecasting, forward-horizon inference, regime context, and calibrated prediction research.",
    empty: "No NOSTRA runtime observation is available."
  },
  VELUM: {
    role: "Replay, simulation, counterfactual evaluation, and broker-isolated verification.",
    empty: "No VELUM runtime observation is available."
  }
};

const RELATED: Record<MonitoredSystem, Array<{ to: string; label: string }>> = {
  IREN: [{ to: "/command/infrastructure", label: "Infrastructure" }],
  RHEN: [
    { to: "/command/live", label: "Live" },
    { to: "/command/performance", label: "Performance" },
    { to: "/command/evidence", label: "Evidence" }
  ],
  GRAEN: [{ to: "/command/research", label: "Research record" }],
  NOSTRA: [{ to: "/products/nostra", label: "Public system page" }],
  VELUM: [{ to: "/products/velum", label: "Public system page" }]
};

function tone(value?: string | null) {
  const state = String(value || "UNKNOWN").toUpperCase();
  if (["HEALTHY", "RUNNING", "READY", "SUCCEEDED", "COMPLETE", "IDLE"].includes(state)) return "good";
  if (["FAILED", "CRASHED", "OFFLINE", "CRITICAL", "ATTENTION_REQUIRED", "STALE"].includes(state)) return "bad";
  return "warn";
}

function compact(value?: string | null, n = 10) {
  return value ? value.slice(0, n) : "—";
}

function belongsToSystem(row: RuntimeRow, system: MonitoredSystem) {
  const haystack = [
    row.service_id,
    row.service_name,
    row.runtime_kind,
    row.scope,
    row.current_activity
  ].filter(Boolean).join(" ").toLowerCase();

  // Classify by current subsystem responsibility before legacy service prefixes.
  const isVelum = /velum/.test(haystack);
  const isGraen = /graen|crypto[-_ ]?edge[-_ ]?discovery|research[-_ ]?agent/.test(haystack);
  const isNostra = /nostra/.test(haystack);
  const isIren = /iren|foundation|research[-_ ]?scheduler/.test(haystack);
  const isRhen = /alpaca[-_ ]?trader|preopen|rhen/.test(haystack)
    && !isVelum && !isGraen && !isIren;

  if (system === "IREN") return isIren;
  if (system === "RHEN") return isRhen;
  if (system === "GRAEN") return isGraen;
  if (system === "NOSTRA") return isNostra;
  return isVelum;
}

function incidentMatches(key: string, system: MonitoredSystem) {
  const normalized = key.toLowerCase();
  if (system === "IREN") return /iren|foundation|scheduler|workflow|configuration|safety/.test(normalized);
  return normalized.includes(system.toLowerCase());
}

export default function CommandSystemMonitor({
  session,
  feed,
  system
}: {
  session: RhenSession;
  feed?: LiveTradingFeed | null;
  system: MonitoredSystem;
}) {
  const [snapshot, setSnapshot] = useState<IrenSnapshot | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();

    async function refresh() {
      try {
        const response = await fetch("/api/command/iren/status", {
          headers: commandAuthHeaders(session),
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])
        });
        if (!response.ok) throw new Error("Canonical IREN state unavailable");
        const body = await response.json() as IrenSnapshot;
        if (!stopped) {
          setSnapshot(body);
          setError("");
        }
      } catch {
        if (!stopped) setError("Canonical IREN state unavailable.");
      } finally {
        if (!stopped) timer = setTimeout(refresh, 10000);
      }
    }

    void refresh();
    const clock = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
      clearInterval(clock);
    };
  }, [session]);

  const stale = isStale(snapshot, now, Boolean(error));
  const systemState = feed?.systems?.[system];
  const services = useMemo(
    () => (snapshot?.topology?.services || []).filter((row) => belongsToSystem(row, system)),
    [snapshot, system]
  );
  const incidents = useMemo(
    () => (snapshot?.incidents || []).filter((row) => incidentMatches(String(row.key || ""), system)),
    [snapshot, system]
  );
  const activeJobs = useMemo(
    () => (snapshot?.work?.jobs || []).filter((row) => {
      const owner = String(row.owner_system || "").toUpperCase();
      const status = String(row.status || "").toUpperCase();
      return owner === system && ["QUEUED", "RUNNING", "WAITING", "BLOCKED", "NEEDS_APPROVAL"].includes(status);
    }),
    [snapshot, system]
  );
  const activeObjectives = useMemo(
    () => (snapshot?.work?.objectives || []).filter((row) => {
      const owner = String(row.owner_system || "").toUpperCase();
      const status = String(row.status || "").toUpperCase();
      return owner === system && ["ACTIVE", "READY", "WAITING", "BLOCKED"].includes(status);
    }),
    [snapshot, system]
  );
  const ready = services.filter((row) => row.readiness === true && ["RUNNING", "IDLE"].includes(runtimeStatus(row, stale))).length;
  const problems = services.filter((row) => !["RUNNING", "IDLE"].includes(runtimeStatus(row, stale))).length;
  const currentState = stale
    ? "STALE"
    : systemState?.health_state || systemState?.runtime_state ||
      (problems ? "DEGRADED" : services.length ? "RUNNING" : "UNKNOWN");

  return (
    <article className="command-panel command-view-system system-monitor">
      <header className="system-monitor-head">
        <div>
          <span>ANEVUM / {system}</span>
          <strong>{system}</strong>
        </div>
        <div className={"system-monitor-state " + tone(currentState)}>
          <i />
          <span>{currentState}</span>
        </div>
      </header>

      <div className="system-monitor-body">
        <section className="system-monitor-summary">
          <div>
            <span className="system-monitor-kicker">SYSTEM ROLE</span>
            <h2>{SYSTEM_COPY[system].role}</h2>
            <p>{systemState?.activity || "Canonical activity summary is not currently available."}</p>
          </div>
          <div className="system-monitor-metrics">
            <div><span>RUNTIMES</span><strong>{services.length}</strong></div>
            <div><span>READY</span><strong>{ready}</strong></div>
            <div><span>PROBLEMS</span><strong>{problems}</strong></div>
            <div><span>INCIDENTS</span><strong>{incidents.length}</strong></div>
          </div>
        </section>

        <section>
          <div className="system-monitor-section-head">
            <div><span>RUNTIME INVENTORY</span><strong>Independent services associated with {system}</strong></div>
            <small>{systemState?.observed_at ? "Activity " + ageLabel(systemState.observed_at, now) : "No subsystem timestamp"}</small>
          </div>
          <div className="system-monitor-runtime-grid">
            {services.length ? services.map((row) => {
              const status = runtimeStatus(row, stale);
              return (
                <article className={"system-monitor-runtime " + tone(status)} key={row.service_id}>
                  <div className="system-monitor-runtime-title">
                    <strong>{row.service_name || row.runtime_kind || row.service_id}</strong>
                    <span>{status}</span>
                  </div>
                  <p>{row.current_activity || row.scope || "No current activity description."}</p>
                  <dl>
                    <div><dt>REV</dt><dd>{compact(row.revision)}</dd></div>
                    <div><dt>DEPLOY</dt><dd>{compact(row.deployment, 8)}</dd></div>
                    <div><dt>HEARTBEAT</dt><dd>{ageLabel(row.last_heartbeat_at || row.observed_at, now)}</dd></div>
                    <div><dt>READY</dt><dd>{row.readiness === true ? "YES" : row.readiness === false ? "NO" : "—"}</dd></div>
                  </dl>
                </article>
              );
            }) : <p className="command-empty">{SYSTEM_COPY[system].empty}</p>}
          </div>
        </section>

        {system === "RHEN" ? (
          <section>
            <div className="system-monitor-section-head">
              <div><span>MARKET TELEMETRY</span><strong>Current RHEN operating evidence</strong></div>
              <small>{feed?.freshness_seconds == null ? "Freshness unavailable" : Math.round(feed.freshness_seconds) + "s old"}</small>
            </div>
            <div className="system-monitor-data-grid">
              <div><span>EVENTS / 60M</span><strong>{feed?.telemetry?.events_60m ?? "—"}</strong></div>
              <div><span>SCANS / 10M</span><strong>{feed?.telemetry?.scan_events_10m ?? "—"}</strong></div>
              <div><span>EXECUTION / 2H</span><strong>{feed?.telemetry?.execution_events_2h ?? "—"}</strong></div>
              <div><span>ERRORS / 2H</span><strong>{feed?.telemetry?.errors_2h ?? "—"}</strong></div>
              <div><span>STRATEGY</span><strong>{feed?.active_strategy?.strategy_name || "—"}</strong></div>
              <div><span>STATUS</span><strong>{feed?.active_strategy?.status || "—"}</strong></div>
            </div>
          </section>
        ) : null}

        {system === "GRAEN" ? (
          <section>
            <div className="system-monitor-section-head">
              <div><span>RESEARCH STATE</span><strong>Current GRAEN research projection</strong></div>
              <small>{feed?.research?.last_updated_at ? ageLabel(feed.research.last_updated_at, now) : "No research timestamp"}</small>
            </div>
            <div className="system-monitor-data-grid">
              <div><span>STATUS</span><strong>{feed?.research?.current_status || "—"}</strong></div>
              <div className="wide"><span>FOCUS</span><strong>{feed?.research?.current_focus || "—"}</strong></div>
              <div><span>QUESTIONS</span><strong>{feed?.research?.active_questions?.length ?? "—"}</strong></div>
              <div><span>DECISIONS</span><strong>{feed?.research?.completed_decisions?.length ?? "—"}</strong></div>
            </div>
          </section>
        ) : null}

        {system === "IREN" ? (
          <section>
            <div className="system-monitor-section-head">
              <div><span>CONTROL PLANE</span><strong>Objectives, dependencies, and operator demand</strong></div>
              <small>{snapshot?.work?.execution_mode || "deterministic control"}</small>
            </div>
            <div className="system-monitor-data-grid">
              <div><span>OBJECTIVES</span><strong>{snapshot?.work?.objectives_complete ?? 0}/{snapshot?.work?.objective_count ?? 0}</strong></div>
              <div><span>ACTIVE JOBS</span><strong>{snapshot?.work?.active_jobs ?? 0}</strong></div>
              <div><span>BLOCKED</span><strong>{snapshot?.work?.blocked_objectives ?? 0}</strong></div>
              <div><span>NEEDS YOU</span><strong>{snapshot?.work?.requires_human ?? 0}</strong></div>
            </div>
          </section>
        ) : null}

        <section>
          <div className="system-monitor-section-head">
            <div><span>CURRENT WORK</span><strong>IREN-tracked objectives and jobs owned by {system}</strong></div>
            <small>{activeJobs.length} active job{activeJobs.length === 1 ? "" : "s"} · {activeObjectives.length} open objective{activeObjectives.length === 1 ? "" : "s"}</small>
          </div>
          <div className="system-monitor-work-grid">
            <div>
              <span className="system-monitor-work-label">ACTIVE JOBS</span>
              {activeJobs.length ? activeJobs.slice(0, 6).map((row, index) => (
                <article key={String(row.job_id || index)}>
                  <div><strong>{String(row.title || row.job_type || "System job")}</strong><span>{String(row.status || "UNKNOWN")}</span></div>
                  <p>{String(row.job_type || row.objective_key || "IREN work item")}</p>
                </article>
              )) : <p className="system-monitor-clear">No active {system} jobs are recorded by IREN.</p>}
            </div>
            <div>
              <span className="system-monitor-work-label">OPEN OBJECTIVES</span>
              {activeObjectives.length ? activeObjectives.slice(0, 6).map((row, index) => (
                <article key={String(row.objective_key || index)}>
                  <div><strong>{String(row.title || row.objective_key || "System objective")}</strong><span>{String(row.status || "UNKNOWN")}</span></div>
                  <p>{String(row.description || row.objective_key || "IREN objective")}</p>
                </article>
              )) : <p className="system-monitor-clear">No open {system} objectives are recorded by IREN.</p>}
            </div>
          </div>
        </section>

        <section>
          <div className="system-monitor-section-head">
            <div><span>INCIDENTS</span><strong>{system} issues requiring attention</strong></div>
            <small>{error || "Canonical IREN observation"}</small>
          </div>
          <div className="system-monitor-incidents">
            {incidents.length ? incidents.map((incident) => (
              <article className={tone(incident.severity)} key={incident.key}>
                <div><strong>{incident.key}</strong><span>{incident.severity}</span></div>
                <p>{String(incident.reason || "Operational incident").replaceAll("_", " ")}</p>
              </article>
            )) : <p className="system-monitor-clear">No {system}-specific incident is currently recorded.</p>}
          </div>
        </section>

        <footer className="system-monitor-footer">
          <div>
            <span>RELATED VIEWS</span>
            {RELATED[system].map((item) => <Link key={item.to} to={item.to}>{item.label} →</Link>)}
          </div>
          <small>{snapshot?.observed_at ? "IREN observed " + ageLabel(snapshot.observed_at, now) : "No canonical observation"} · refresh 10s</small>
        </footer>
      </div>
    </article>
  );
}
