import { useEffect, useRef } from "react";
import { consumeRhenlinkHandoff, loadSession, saveSession, type MemberSession } from "./memberClient";

const ROOT_ORIGIN = "https://anevum.com";
const TRUSTED_SURFACE_ORIGINS = new Set([
  "https://wiki.anevum.com",
  "https://lattice.anevum.com",
  "https://command.anevum.com",
]);

type SessionRequest = { type: "ANEVUM_SESSION_REQUEST" };
type SessionResponse = { type: "ANEVUM_SESSION_RESPONSE"; session: MemberSession | null };

function isSessionRequest(value: unknown): value is SessionRequest {
  return Boolean(value && typeof value === "object" && (value as { type?: unknown }).type === "ANEVUM_SESSION_REQUEST");
}

function isSessionResponse(value: unknown): value is SessionResponse {
  return Boolean(value && typeof value === "object" && (value as { type?: unknown }).type === "ANEVUM_SESSION_RESPONSE");
}

export function AuthBridgePage() {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!TRUSTED_SURFACE_ORIGINS.has(event.origin) || !isSessionRequest(event.data)) return;
      const source = event.source as Window | null;
      source?.postMessage({ type: "ANEVUM_SESSION_RESPONSE", session: loadSession() } satisfies SessionResponse, event.origin);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return <div aria-hidden="true" style={{ position: "fixed", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>ANEVUM AUTH BRIDGE</div>;
}

export function SystemSessionBridge({ hostname }: { hostname: string }) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const hostOrigin = `https://${hostname}`;
  const enabled = TRUSTED_SURFACE_ORIGINS.has(hostOrigin);

  useEffect(() => {
    if (!enabled) return;

    void consumeRhenlinkHandoff().catch(() => undefined);

    const request = () => frameRef.current?.contentWindow?.postMessage({ type: "ANEVUM_SESSION_REQUEST" } satisfies SessionRequest, ROOT_ORIGIN);
    const receive = (event: MessageEvent) => {
      if (event.origin !== ROOT_ORIGIN || !isSessionResponse(event.data)) return;
      const current = loadSession();
      const next = event.data.session;
      if (!next) {
        if (current) saveSession(null);
        return;
      }
      if (!current || current.access_token !== next.access_token || current.user.id !== next.user.id) saveSession(next);
    };

    window.addEventListener("message", receive);
    const timeout = window.setTimeout(request, 700);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", receive);
    };
  }, [enabled, hostname]);

  if (!enabled) return null;
  return (
    <iframe
      ref={frameRef}
      src={`${ROOT_ORIGIN}/auth-bridge`}
      title="ANEVUM identity bridge"
      tabIndex={-1}
      aria-hidden="true"
      style={{ position: "fixed", left: -10000, top: -10000, width: 1, height: 1, border: 0, opacity: 0, pointerEvents: "none" }}
      onLoad={() => frameRef.current?.contentWindow?.postMessage({ type: "ANEVUM_SESSION_REQUEST" } satisfies SessionRequest, ROOT_ORIGIN)}
    />
  );
}
