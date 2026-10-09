import { useEffect, useState } from "react";
import {
  applyLiveMessage, emptyLiveState, type LiveMessage, type LiveState
} from "../lib/command-live-events";

/**
 * Dedicated owner-only broker/market socket. The legacy 4.4 shadow bootstrap
 * is intentionally not used: a current authenticated socket snapshot is
 * required before any data are treated as connected/live.
 */
export function useRhenLiveObserver(enabled: boolean): LiveState {
  const [state, setState] = useState<LiveState>(() => ({
    ...emptyLiveState(), error: "Connecting to RHEN read-only observation",
  }));
  useEffect(() => {
    if (!enabled) {
      setState({...emptyLiveState(), error: "Authorized owner session required"});
      return;
    }
    let stopped = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let frame = 0;
    let attempt = 0;
    let lastPacket = Date.now();
    let current: LiveState = {...emptyLiveState(), error: "Connecting to RHEN observation"};
    const flush = (immediate = false) => {
      if (immediate) {
        cancelAnimationFrame(frame);
        frame = 0;
        if (!stopped) setState(current);
      } else if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (!stopped) setState(current);
        });
      }
    };
    function connect() {
      if (stopped) return;
      const url = new URL("/api/command/live", window.location.href);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
      const active = socket;
      lastPacket = Date.now();
      socket.onopen = () => {
        if (!stopped && active === socket) {
          current = {...current, stale: true, error: "Connected; waiting for authenticated source snapshot"};
          flush(true);
        }
      };
      socket.onmessage = event => {
        if (stopped || socket !== active) return;
        try {
          const incoming = JSON.parse(String(event.data)) as LiveMessage;
          current = applyLiveMessage(current, incoming);
          lastPacket = Date.now();
          if (current.stale) {
            flush(true);
            active.close(1000, "New snapshot required");
            return;
          }
          if (incoming.message_type === "snapshot") attempt = 0;
          flush(["snapshot", "execution_event", "critical_event"].includes(incoming.message_type));
        } catch {
          current = {...current, stale: true, error: "Source protocol invalid; reconnecting"};
          flush(true);
          active.close(1000, "Invalid observation frame");
        }
      };
      socket.onclose = event => {
        if (stopped || active !== socket) return;
        current = {
          ...current, stale: true,
          error: event.code === 1008
            ? "RHEN owner authorization expired or unavailable"
            : "RHEN observation disconnected; historical values frozen",
        };
        flush(true);
        retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(attempt++, 5)));
      };
      socket.onerror = () => {
        if (active === socket) active.close();
      };
    }
    connect();
    const watchdog = setInterval(() => {
      if (!stopped && socket && Date.now() - lastPacket > 10000) {
        current = {...current, stale: true, error: "Observation heartbeat stale; values frozen"};
        flush(true);
        socket.close(1000, "Source heartbeat timeout");
      }
    }, 2000);
    return () => {
      stopped = true;
      clearInterval(watchdog);
      if (retry) clearTimeout(retry);
      cancelAnimationFrame(frame);
      socket?.close();
    };
  }, [enabled]);
  return state;
}
