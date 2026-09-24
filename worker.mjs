const SUPABASE_URL = "https://mfntzxheldzdvlokyntk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae";
const TRADER_HEALTH_URL = "https://alpaca-trader-production-bf3e.up.railway.app/health";
const COMMAND_FOUNDER_EMAIL = "devon@anevum.com";

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function bearerToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return "";
  return authorization.slice(7).trim();
}

async function resolveMember(request) {
  const token = bearerToken(request);
  if (!token) return { error: json({ error: "RHENLINK authentication required." }, 401) };

  const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
    method: "GET",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: "Bearer " + token,
      "Cache-Control": "no-store"
    }
  });
  const user = await response.json().catch(() => ({}));
  if (!response.ok) return { error: json({ error: "RHENLINK session is not valid." }, 401) };
  return { token, user };
}

function isCommandAdmin(user) {
  const metadata = user?.app_metadata || {};
  const role = String(metadata.role || "").trim().toLowerCase();
  const email = String(user?.email || "").trim().toLowerCase();

  return (email === COMMAND_FOUNDER_EMAIL && Boolean(user?.email_confirmed_at))
    || metadata.command_admin === true
    || metadata.wiki_admin === true
    || role === "owner"
    || role === "founder"
    || role === "admin"
    || role === "command_admin"
    || role === "wiki_admin";
}

async function requireCommandAdmin(request) {
  const resolved = await resolveMember(request);
  if (resolved.error) return resolved;
  if (!isCommandAdmin(resolved.user)) {
    return { error: json({ error: "COMMAND administrator authorization required." }, 403) };
  }
  return resolved;
}

async function commandTraderStatus(request) {
  const admin = await requireCommandAdmin(request);
  if (admin.error) return admin.error;

  try {
    const response = await fetch(TRADER_HEALTH_URL, {
      method: "GET",
      headers: { Accept: "application/json", "Cache-Control": "no-store" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      return json({
        error: "Trader telemetry is unavailable.",
        upstreamStatus: response.status
      }, 502);
    }

    return json({
      source: "anevum/alpaca-trader",
      observedAt: new Date().toISOString(),
      service: payload
    });
  } catch {
    return json({ error: "Trader telemetry could not be reached." }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/command/trader/status") {
      if (request.method !== "GET") return json({ error: "Method not allowed." }, 405);
      return commandTraderStatus(request);
    }

    let response = await env.ASSETS.fetch(request);
    if (!response.headers.get("content-type")?.includes("text/html")) return response;

    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("X-Frame-Options", "DENY");
    if (url.pathname !== "/") headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
