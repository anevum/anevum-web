import { useEffect, useMemo, useState } from "react";
import { commandAuthHeaders, type RhenSession } from "../lib/auth";
import type { LiveTradingFeed, PublicSystemState } from "../lib/data";
import {
  ageLabel,
  isStale,
  operatorGuidance,
  runtimeStatus,
  type IrenSnapshot,
  type RuntimeRow
} from "../lib/runtime-topology";
import "../styles/operations.css";

const CORE_SYSTEMS = ["IREN", "RHEN", "GRAEN", "NOSTRA", "VELUM"] as const;

function tone(value?: string) {
  const state = String(value || "UNKNOWN").toUpperCase();
  if (["HEALTHY", "RUNNING", "SUCCEEDED", "READY", "COMPLETE"].includes(state)) return "good";
  if (["FAILED", "OFFLINE", "ATTENTION_REQUIRED", "CRITICAL", "STALE"].includes(state)) return "bad";
  return "warn";
}

function compact(value?: string | null, length = 10) {
  return value ? value.slice(0, length) : "—";
}

function SystemCard({ name, row, now }: { name: string; row?: PublicSystemState; now: number }) {
  const state = row?.health_state || row?.runtime_state || "UNKNOWN";
  return <div className={"ops-system-card " + tone(state)}>
    <div className="ops-system-title"><strong>{name}</strong><span>{state}</span></div>
    <p>{row?.activity || "No activity summary available."}</p>
    <small>{row?.observed_at ? "Observed " + ageLabel(row.observed_at, now) : "No canonical activity timestamp"}</small>
  </div>;
}

function RuntimeCard({ row, stale, now }: { row: RuntimeRow; stale: boolean; now: number }) {
  const status = runtimeStatus(row, stale);
  return <div className={"ops-runtime-card " + tone(status)}>
    <div>
      <strong>{row.service_id}</strong>
      <span>{status}</span>
    </div>
    <p>{row.service_name || row.runtime_kind} · {row.scope}</p>
    <dl>
      <div><dt>REVISION</dt><dd>{compact(row.revision)}</dd></div>
      <div><dt>DEPLOYMENT</dt><dd>{compact(row.deployment, 8)}</dd></div>
      <div><dt>OBSERVED</dt><dd>{ageLabel(row.last_heartbeat_at || row.observed_at, now)}</dd></div>
    </dl>
  </div>;
}

export default function CommandTopology({
  session,
  feed
}: {
  session: RhenSession;
  feed?: LiveTradingFeed | null;
}) {
  const [snapshot, setSnapshot] = useState<IrenSnapshot | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    setSnapshot(null);
    setError("");

    async function refresh() {
      try {
        const response = await fetch("/api/command/iren/status", {
          headers: commandAuthHeaders(session),
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])
        });
        if (!response.ok) throw new Error("Canonical IREN state unavailable");
        const body = await response.json() as IrenSnapshot;
        if (!["iren_command.v1", "iren_command.v2"].includes(String(body.schema_version || "")) ||
            !Array.isArray(body.incidents) ||
            (body.topology && !Array.isArray(body.topology.services))) {
          throw new Error("Invalid operational observation");
        }
        if (!stopped) {
          setSnapshot(body);
          setError("");
        }
      } catch {
        if (!stopped) setError("Canonical IREN state unavailable.");
      } finally {
        if (!stopped) timer = setTimeout(refresh, 15000);
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
  const guidance = useMemo(() => operatorGuidance(snapshot, Boolean(error)), [snapshot, error]);
  const services = snapshot?.topology?.services || [];
  const dependencies = Object.entries(snapshot?.topology?.dependencies || {});
  const work = snapshot?.work;
  const readyCount = services.filter((row) => row.readiness === true && runtimeStatus(row, stale) === "RUNNING").length;
  const problemCount = services.filter((row) => !["RUNNING", "IDLE"].includes(runtimeStatus(row, stale))).length;
  const overall = stale ? "STALE" : snapshot?.state || "UNKNOWN";
  const stamp = snapshot?.observed_at ? new Date(snapshot.observed_at).toLocaleString() : "No observation";
  const operatorMessage = stale
    ? "Fresh canonical observations are unavailable. Treat subsystem state as untrusted until IREN recovers."
    : overall === "HEALTHY" && !guidance.length
      ? `ANEVUM healthy. ${readyCount}/${services.length || 0} independent runtimes ready. No operator action required.`
      : `${guidance.length} operator item${guidance.length === 1 ? "" : "s"} require review.`;

  return <article className="command-panel command-view-overview command-view-system ops-center">
    <header className="ops-header">
      <div>
        <span>ANEVUM / OPERATIONS</span>
        <strong>{overall}</strong>
      </div>
      <small>{stamp}</small>
    </header>

    <div className="ops-body">
      <section className={"ops-overall " + tone(overall)}>
        <div>
          <span className="ops-kicker">OPERATOR SUMMARY</span>
          <h2>{operatorMessage}</h2>
          <p>One view of runtime health, data freshness, current work, incidents, and deployment identity.</p>
        </div>
        <div className="ops-summary-metrics">
          <div><span>RUNTIMES</span><strong>{services.length}</strong></div>
          <div><span>READY</span><strong>{readyCount}</strong></div>
          <div><span>PROBLEMS</span><strong>{problemCount}</strong></div>
          <div><span>INCIDENTS</span><strong>{snapshot?.incidents.length || 0}</strong></div>
        </div>
      </section>

      <section>
        <div className="ops-section-head">
          <div><span>SUBSYSTEM ACTIVITY</span><strong>What the machine is doing</strong></div>
          <small>Foundation public projections + canonical timestamps</small>
        </div>
        <div className="ops-system-grid">
          {CORE_SYSTEMS.map((name) => <SystemCard key={name} name={name} row={feed?.systems?.[name]} now={now} />)}
        </div>
      </section>

      <section>
        <div className="ops-section-head">
          <div><span>RUNTIME INVENTORY</span><strong>Every independently observed service</strong></div>
          <small>{snapshot?.topology?.inventory_complete === false ? "Inventory gaps detected" : "Canonical IREN topology"}</small>
        </div>
        <div className="ops-runtime-grid">
          {services.length ? services.map((row) =>
            <RuntimeCard key={row.service_id} row={row} stale={stale} now={now} />
          ) : <p className="command-empty">Runtime topology has not been observed.</p>}
        </div>
      </section>

      <section>
        <div className="ops-section-head">
          <div><span>DEPENDENCIES + FRESHNESS</span><strong>Is data actually moving?</strong></div>
          <small>Process alive is not treated as sufficient health</small>
        </div>
        <div className="ops-dependency-grid">
          {dependencies.map(([name, value]) => <div className={"ops-dependency " + tone(stale ? "STALE" : value.status)} key={name}>
            <div><strong>{name.replaceAll("_", " ").toUpperCase()}</strong><span>{stale ? "STALE" : value.status}</span></div>
            <p>{value.basis || "Canonical dependency observation"}</p>
            <small>{value.last_success ? "Last success " + ageLabel(value.last_success, now) : "No last-success timestamp"}{value.dropped_count !== undefined ? " · dropped " + value.dropped_count : ""}</small>
          </div>)}
        </div>
        <div className="ops-data-strip">
          <div><span>RHEN TELEMETRY</span><strong>{feed?.freshness_seconds == null ? "—" : Math.round(feed.freshness_seconds) + "s old"}</strong></div>
          <div><span>EVENTS / 60M</span><strong>{feed?.telemetry?.events_60m ?? "—"}</strong></div>
          <div><span>SCANS / 10M</span><strong>{feed?.telemetry?.scan_events_10m ?? "—"}</strong></div>
          <div><span>ERRORS / 2H</span><strong>{feed?.telemetry?.errors_2h ?? "—"}</strong></div>
          <div><span>LATEST SCAN</span><strong>{ageLabel(feed?.operational?.latest_scan?.observed_at, now)}</strong></div>
        </div>
      </section>

      <section>
        <div className="ops-section-head">
          <div><span>IREN WORK</span><strong>What is active and what needs you</strong></div>
          <small>{work?.execution_mode || "deterministic control"}</small>
        </div>
        <div className="ops-work-grid">
          <div><span>OBJECTIVES</span><strong>{work?.objectives_complete ?? 0}/{work?.objective_count ?? 0}</strong><small>complete</small></div>
          <div><span>ACTIVE JOBS</span><strong>{work?.active_jobs ?? 0}</strong><small>current work</small></div>
          <div><span>BLOCKED</span><strong>{work?.blocked_objectives ?? 0}</strong><small>objectives</small></div>
          <div><span>NEEDS YOU</span><strong>{work?.requires_human ?? 0}</strong><small>human decisions</small></div>
        </div>
        <div className="ops-next-action">
          <span>NEXT ACTION</span>
          <strong>{work?.next_action?.title || "No queued action."}</strong>
          <small>{work?.next_action?.objective_key || "IREN will continue observing."}</small>
        </div>
      </section>

      <section>
        <div className="ops-section-head">
          <div><span>INCIDENTS + MAINTENANCE</span><strong>What you should do when something is wrong</strong></div>
          <small>Read-only guidance · protected actions remain gated</small>
        </div>
        {guidance.length ? <div className="ops-guidance-list">
          {guidance.map((item, index) => <div className={"ops-guidance " + item.severity} key={item.target + index}>
            <div><span>{item.target}</span><strong>{item.title}</strong></div>
            <p>{item.action}</p>
          </div>)}
        </div> : <div className="ops-clear">
          <strong>No operator action required.</strong>
          <p>Keep Command open during maintenance; IREN will surface a concrete item here when canonical health changes.</p>
        </div>}
      </section>

      <details className="ops-runbook">
        <summary>Operator runbook</summary>
        <div className="ops-runbook-grid">
          <div><strong>1 · TRUST IREN FIRST</strong><p>If this panel is stale, restore IREN/Foundation before interpreting downstream green lights.</p></div>
          <div><strong>2 · CHECK FRESHNESS</strong><p>A service can be running while its evidence is stale. Confirm last-success timestamps and telemetry age.</p></div>
          <div><strong>3 · FIND THE BOUNDARY</strong><p>Use the affected runtime, dependency, deployment SHA, and incident key to isolate the fault before changing anything.</p></div>
          <div><strong>4 · REPAIR ROOT CAUSE</strong><p>Fix code, dependency, or configuration. Do not hide counters or loosen safety gates to make status green.</p></div>
          <div><strong>5 · VERIFY RECOVERY</strong><p>Wait for fresh evidence and IREN recovery observations. A successful Railway deploy alone is not proof of health.</p></div>
          <div><strong>6 · KEEP AUTHORITY SEPARATE</strong><p>Monitoring and repair must not silently change strategy, risk, broker behavior, spending, or publication authority.</p></div>
        </div>
      </details>

      <footer className="ops-footer">
        <span>IREN revision {snapshot?.revision ?? "unknown"}</span>
        <span>Refresh 15s</span>
        <span>{error || "Canonical control feed connected"}</span>
      </footer>
    </div>
  </article>;
}
