import { useEffect, useState } from "react";
import { fetchPublicRecord, type PublicRecord } from "../lib/data";

const empty: PublicRecord = { equity: [], strategies: [], trades: [], runs: [] };

export function usePublicRecord(intervalMs = 60000) {
  const [data, setData] = useState<PublicRecord>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    async function load() {
      try {
        const next = await fetchPublicRecord();
        if (!active) return;
        setData(next);
        setError("");
      } catch (reason) {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Public record unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    timer = window.setInterval(load, intervalMs);

    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [intervalMs]);

  return { data, loading, error };
}
