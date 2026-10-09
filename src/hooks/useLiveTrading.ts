import { useEffect, useState } from "react";
import { fetchLiveTradingFeed, type LiveTradingFeed } from "../lib/data";

type FeedTransport = "STREAM" | "POLL";

/** Event-driven, aggregate-only Core activity with a bounded REST fallback.
 * Neither transport fabricates new price, performance, or event observations.
 */
export function useLiveTrading(intervalMs = 5000) {
  const [data, setData] = useState<LiveTradingFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [transport, setTransport] = useState<FeedTransport>("POLL");

  useEffect(() => {
    let active = true;
    let streamReady = false;
    let requestInFlight = false;
    let source: EventSource | null = null;
    let lastEventAt = 0;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const clearPoll = () => {
      if (pollTimer) clearTimeout(pollTimer);
      pollTimer = undefined;
    };
    const schedulePoll = (delay = intervalMs) => {
      if (!active || streamReady || pollTimer) return;
      pollTimer = setTimeout(() => {
        pollTimer = undefined;
        void poll();
      }, delay);
    };
    async function poll() {
      if (!active || streamReady || requestInFlight) return;
      requestInFlight = true;
      try {
        const next = await fetchLiveTradingFeed();
        if (!active || streamReady) return;
        setData(next);
        setError("");
        setTransport("POLL");
      } catch (reason) {
        if (active && !streamReady) {
          setError(reason instanceof Error ? reason.message : "Live feed unavailable.");
        }
      } finally {
        requestInFlight = false;
        if (active) {
          setLoading(false);
          schedulePoll();
        }
      }
    }

    function failStream(failed: EventSource) {
      if (!active || source !== failed) return;
      failed.close();
      source = null;
      streamReady = false;
      setTransport("POLL");
      schedulePoll(0);
      if (!retryTimer && typeof EventSource !== "undefined") {
        retryTimer = setTimeout(() => {
          retryTimer = undefined;
          connect();
        }, 30000);
      }
    }
    function connect() {
      if (!active || typeof EventSource === "undefined" || source) return;
      const stream = new EventSource("/api/public/trading/events");
      source = stream;
      stream.addEventListener("snapshot", event => {
        if (!active || source !== stream) return;
        try {
          const next = JSON.parse((event as MessageEvent<string>).data) as LiveTradingFeed;
          if (
            next.ok !== true || next.source !== "rhen-core-sqlite" ||
            next.disclosure?.level !== "aggregate_only"
          ) throw new Error("Invalid public observation boundary");
          streamReady = true;
          lastEventAt = Date.now();
          clearPoll();
          setData(next);
          setError("");
          setLoading(false);
          setTransport("STREAM");
        } catch {
          failStream(stream);
        }
      });
      stream.addEventListener("unavailable", () => failStream(stream));
      stream.onerror = () => failStream(stream);
    }

    void poll(); // One immediate source read; later refreshes are SSE-driven.
    connect();

    // Expire visual observations even when no new market events exist.
    const clock = setInterval(() => {
      setNow(Date.now());
      if (source && streamReady && Date.now() - lastEventAt > 90000) {
        failStream(source); // core emits source-truth freshness every 45s
      }
    }, 5000);

    return () => {
      active = false;
      clearInterval(clock);
      clearPoll();
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  }, [intervalMs]);

  return { data, loading, error, now, transport };
}
