import { useEffect, useState } from "react";
import { commandAuthHeaders, type RhenSession } from "../lib/auth";
import type { IrenSnapshot } from "../lib/runtime-topology";

export type CommandObservation = {
  snapshot: IrenSnapshot | null;
  error: string;
  now: number;
  receivedAt?: string;
};

export function useCommandObservation(session: RhenSession | null, intervalMs = 15000): CommandObservation {
  const [snapshot, setSnapshot] = useState<IrenSnapshot | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [receivedAt, setReceivedAt] = useState<string>();
  useEffect(() => {
    if (!session) {
      setSnapshot(null);
      setError("");
      setReceivedAt(undefined);
      return;
    }

    const activeSession = session;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    setSnapshot(null);
    setError("");
    async function refresh() {
      try {
        const response = await fetch("/api/command/iren/status", {
          headers: commandAuthHeaders(activeSession), cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])
        });
        if (!response.ok) throw new Error("Canonical IREN state unavailable");
        const body = await response.json() as IrenSnapshot;
        if (!["iren_command.v1", "iren_command.v2"].includes(body.schema_version) || !Array.isArray(body.incidents) ||
            (body.topology && !Array.isArray(body.topology.services))) throw new Error("Invalid operational observation");
        if (!stopped) { setSnapshot(body); setError(""); setReceivedAt(new Date().toISOString()); setNow(Date.now()); }
      } catch { if (!stopped) setError("Canonical IREN state unavailable"); }
      finally { if (!stopped) timer = setTimeout(refresh, intervalMs); }
    }
    void refresh();
    const clock = setInterval(() => setNow(Date.now()), 5000);
    return () => { stopped = true; controller.abort(); clearTimeout(timer); clearInterval(clock); };
  }, [session, intervalMs]);
  return { snapshot, error, now, receivedAt };
}
