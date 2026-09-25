import { useEffect, useState } from "react";
import { fetchLiveTradingFeed, type LiveTradingFeed } from "../lib/data";

export function useLiveTrading(intervalMs = 5000) {
  const [data, setData] = useState<LiveTradingFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    async function load() {
      try {
        const next = await fetchLiveTradingFeed();
        if (!active) return;
        setData(next);
        setError("");
      } catch (reason) {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Live feed unavailable.");
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
