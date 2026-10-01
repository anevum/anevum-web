import { useEffect, useState } from "react";
import { isStale, runtimeStatus, type IrenSnapshot } from "../lib/runtime-topology";

export default function CommandTopology({ token }: { token?: string }) {
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
          headers: token ? { Authorization: "Bearer " + token } : undefined,
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])
        });
        if (!response.ok) throw new Error("Canonical IREN state unavailable");
        const body = await response.json() as IrenSnapshot;
        if (!["iren_command.v1", "iren_command.v2"].includes(body.schema_version) || !Array.isArray(body.incidents)
          || (body.topology && !Array.isArray(body.topology.services))) throw new Error("Invalid operational observation");
        if (!stopped) { setSnapshot(body); setError(""); }
      } catch {
        if (!stopped) setError("Canonical IREN state unavailable. Last observation is stale.");
      } finally {
        if (!stopped) timer = setTimeout(refresh, 30000);
      }
    }
    void refresh();
    const clock = setInterval(() => setNow(Date.now()), 5000);
    return () => { stopped = true; controller.abort(); clearTimeout(timer); clearInterval(clock); };
  }, [token]);
  const stale = isStale(snapshot, now, Boolean(error));
  const stamp = snapshot?.observed_at ? new Date(snapshot.observed_at).toLocaleString() : "No observation";
  return <article className="command-panel command-view-overview command-view-system">
    <header><div><span>IREN / RUNTIME TOPOLOGY</span>
      <strong>{stale ? "STALE" : snapshot?.state || "UNKNOWN"}</strong></div>
      <small>{stamp}</small></header>
    <div style={{ padding: "1rem", display: "grid", gap: "1rem" }}>
      {(stale || snapshot?.action_required) && <p role="status"><strong>Action required.</strong> {error || (stale ? "Fresh operational observations are unavailable." : "Review the current incidents below.")}</p>}
      {!snapshot?.topology && <p>Runtime topology has not been observed. No independent deployment is inferred from subsystem names.</p>}
      {snapshot?.topology?.services.map(row => <div key={row.service_id} style={{ borderBottom: "1px solid #333", paddingBottom: ".75rem" }}>
        <strong>{row.service_id} · {row.runtime_kind} · {runtimeStatus(row, stale)}</strong>
        <p>{row.scope}</p>
        <small>{row.independent_runtime ? row.service_name : "Internal subsystem"}{row.deployment ? " · deployment " + row.deployment.slice(0, 8) : ""}{row.revision ? " · revision " + row.revision.slice(0, 10) : ""}</small>
        {row.last_heartbeat_at && <p><small>Last observation {new Date(row.last_heartbeat_at).toLocaleString()} · {row.observation_source === "iren_http_probe" ? "HTTP probe" : "durable heartbeat"}</small></p>}
      </div>)}
      <div className="command-metric-grid">
        {Object.entries(snapshot?.topology?.dependencies || {}).map(([name, value]) =>
          <div key={name}><span>{name.replaceAll("_", " ").toUpperCase()}</span>
            <strong>{stale ? "STALE" : value.status}</strong>
            {value.basis && <small>{value.basis}</small>}
            {value.dropped_count !== undefined && <small>Dropped events: {value.dropped_count}</small>}
          </div>)}
      </div>
      {snapshot?.incidents.map(incident => <p key={incident.key}><strong>INCIDENT · {incident.severity.toUpperCase()} · {incident.key}</strong><br />{incident.reason.replaceAll("_", " ")}</p>)}
      {snapshot?.scheduler?.next_expected_runs && <details><summary>Scheduler: next expected runs</summary>
        {Object.entries(snapshot.scheduler.next_expected_runs).map(([id, at]) => <p key={id}>{id}: {new Date(at).toLocaleString()}</p>)}
      </details>}
      <small>Canonical IREN revision {snapshot?.revision ?? "unknown"} · refresh every 30 seconds</small>
    </div>
  </article>;
}
