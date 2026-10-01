import { createHandler } from "./handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function fetchJson(url: string, init: RequestInit, timeoutMs = 5000) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try { body = JSON.parse(text); }
    catch { body = text; }
  }
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as Record<string, unknown>).message || "")
        : "";
    throw new Error(message || `upstream_${response.status}`);
  }
  return body;
}

async function serviceRpc(name: string, body: Record<string, unknown> = {}) {
  return await fetchJson(
    `${SUPABASE_URL}/rest/v1/rpc/${name}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
    5000,
  );
}

Deno.serve(createHandler({
  async authenticate(token) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        authorization: "Bearer " + token,
        apikey: SUPABASE_ANON_KEY,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) throw new Error("identity_unavailable");
    return response.json();
  },

  async readSnapshot() {
    const value = await serviceRpc("iren_command_snapshot");
    return (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  },

  async writeCommand(command, requestedBy) {
    const value = await serviceRpc("iren_enqueue_command", {
      p_command: command,
      p_requested_by: requestedBy,
    });
    return (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  },
}));