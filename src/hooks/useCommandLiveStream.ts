import { useEffect, useState } from "react";
import { applyLiveMessage, emptyLiveState, type LiveState, type LiveMessage } from "../lib/command-live-events";

export function useCommandLiveStream(enabled: boolean): LiveState {
  const [state, setState] = useState<LiveState>(emptyLiveState);
  useEffect(() => {
    if (!enabled) return;
    let stopped = false, attempt = 0, socket: WebSocket | null = null;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let frame = 0, lastReceived = Date.now();
    let current = emptyLiveState();
    function publish(immediate = false) {
      if (immediate) { cancelAnimationFrame(frame); frame = 0; setState(current); }
      else if (!frame) frame = requestAnimationFrame(() => { frame = 0; if (!stopped) setState(current); });
    }
    function open() {
      if (stopped) return;
      const url = new URL("/api/command/stream", window.location.origin);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
      const activeSocket = socket;
      lastReceived = Date.now();
      socket.onmessage = event => {
        if (stopped || socket !== activeSocket) return;
        try {
          const message = JSON.parse(String(event.data)) as LiveMessage;
          current = applyLiveMessage(current, message);
          lastReceived = Date.now();
          if (message.message_type === "snapshot") attempt = 0;
          if (current.stale) socket?.close(1000, "Snapshot required");
          publish(["execution_event", "critical_event", "snapshot"].includes(message.message_type));
        } catch {
          current = {...current, stale: true, error: "Invalid canonical live data; reconnecting"};
          publish(true); socket?.close(1000, "Invalid canonical data");
        }
      };
      socket.onclose = () => {
        if (stopped || socket !== activeSocket) return;
        current = {...current, stale: true, error: "Live transport disconnected; values frozen"};
        publish(true);
        reconnect = setTimeout(open, Math.min(30000, 1000 * 2 ** Math.min(attempt++, 5)));
      };
      socket.onerror = () => socket?.close();
    }
    open();
    // Watchdog only; no REST or market polling and no invented price updates.
    const watchdog = setInterval(() => {
      if (Date.now()-lastReceived > 10000) { current = {...current, stale: true, error: "Live heartbeat stale"}; publish(true); socket?.close(); }
    }, 2000);
    return () => {
      stopped = true; clearTimeout(reconnect); clearInterval(watchdog); cancelAnimationFrame(frame);
      if (socket) { socket.onclose = null; socket.onmessage = null; socket.onerror = null; socket.close(); }
    };
  }, [enabled]);
  return state;
}
