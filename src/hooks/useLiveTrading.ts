import { useEffect, useState } from "react";
import { fetchLiveTradingFeed, type LiveTradingFeed } from "../lib/data";

export function useLiveTrading(intervalMs = 5000) {
  const [data, setData] = useState<LiveTradingFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

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
        if (active) {
          setLoading(false);
          timer = window.setTimeout(load, intervalMs);
        }
      }
    }

    void load();
    // Expire visual observations even while a network request is stalled.
    const clock = window.setInterval(() => setNow(Date.now()), 5000);

    return () => {
      active = false;
      window.clearInterval(clock);
      if (timer) window.clearTimeout(timer);
    };
  }, [intervalMs]);

  return { data, loading, error, now };
}
