const TRADER_BASE = "https://alpaca-trader-production-bf3e.up.railway.app";

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function bearerToken(request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

async function proxyTrader(request, upstreamPath) {
  const token = bearerToken(request);
  if (!token) throw new ApiError(401, "Resolve RHENLINK before using COMMAND.");

  const response = await fetch(TRADER_BASE + upstreamPath, {
    method: request.method,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text()
  });
  const raw = await response.text();
  let payload = {};
  if (raw) {
    try { payload = JSON.parse(raw); }
    catch { payload = { message: raw }; }
  }
  return jsonResponse(payload, response.status);
}

async function commandApi(request, pathname) {
  if (pathname === "/api/command/trader/status" && request.method === "GET") {
    return proxyTrader(request, "/v1/command/status");
  }
  if (pathname === "/api/command/trader/entries/disable" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/entries/disable");
  }
  if (pathname === "/api/command/trader/entries/enable" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/entries/enable");
  }
  if (pathname === "/api/command/trader/orders/cancel" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/orders/cancel");
  }
  if (pathname === "/api/command/trader/position/close" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/position/close");
  }
  return null;
}

function withSecurityHeaders(response, pathname, hostname) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("X-Frame-Options", "DENY");
  const privateOrArchived = pathname.startsWith("/command") || pathname.startsWith("/private") || pathname.startsWith("/rhenlink") || pathname.startsWith("/wiki/archive") || pathname.startsWith("/lattice") || pathname.startsWith("/store") || pathname.startsWith("/reply") || pathname.startsWith("/the-book") || pathname.startsWith("/stories/");
  if (privateOrArchived || hostname !== "anevum.com") headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (pathname.startsWith("/command") || pathname.startsWith("/private")) headers.set("Cache-Control", "private, no-store");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    if (pathname.startsWith("/api/command/trader/")) {
      if (request.method !== "GET" && url.hostname !== "anevum.com") {
        return jsonResponse({ message: "Live Command controls are disabled outside production." }, 403);
      }
      try {
        const response = await commandApi(request, pathname);
        if (response) return response;
        return jsonResponse({ message: "Command trader endpoint not found." }, 404);
      } catch (error) {
        if (error instanceof ApiError) return jsonResponse({ message: error.message }, error.status);
        return jsonResponse({ message: error instanceof Error ? error.message : "Command trader request failed." }, 500);
      }
    }

    const response = await env.ASSETS.fetch(request);
    if (!response.headers.get("content-type")?.includes("text/html")) return response;
    return withSecurityHeaders(response, pathname, url.hostname);
  }
};
