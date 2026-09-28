import releaseRegistry from "./src/data/releases.json";

const TRADER_BASE = "https://alpaca-trader-production-bf3e.up.railway.app";
const RESEARCH_BASE = "https://rhen-research-agent-production.up.railway.app";
const PUBLIC_TRADING_FEED = "https://mfntzxheldzdvlokyntk.supabase.co/functions/v1/trading-public-feed";
const SUPABASE_AUTH_USER = "https://mfntzxheldzdvlokyntk.supabase.co/auth/v1/user";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae";

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

async function assertCommandAdmin(token) {
  const response = await fetch(SUPABASE_AUTH_USER, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new ApiError(401, "Private authentication is invalid or expired.");
  }

  const user = await response.json();
  const meta = user && user.app_metadata && typeof user.app_metadata === "object"
    ? user.app_metadata
    : {};
  const role = String(meta.role || "").trim().toLowerCase();
  const allowed =
    meta.command_admin === true ||
    ["owner", "founder", "admin", "command_admin"].includes(role);

  if (!allowed) {
    throw new ApiError(403, "Administrator authorization is required for Command.");
  }
}

async function proxyTrader(request, upstreamPath) {
  const token = bearerToken(request);
  if (!token) throw new ApiError(401, "Private authentication is required before using Command.");
  await assertCommandAdmin(token);

  const requestUrl = new URL(request.url);
  const response = await fetch(TRADER_BASE + upstreamPath + requestUrl.search, {
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

async function publicResearchReadiness() {
  const response = await fetch(RESEARCH_BASE + "/v1/readiness/public", {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  const raw = await response.text();
  return new Response(raw, {
    status: response.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=2, s-maxage=2, stale-while-revalidate=3",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

async function publicTheory() {
  const response = await fetch(RESEARCH_BASE + "/v1/theory/public", {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  const raw = await response.text();
  return new Response(raw, {
    status: response.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

async function publicTradingFeed() {
  const response = await fetch(PUBLIC_TRADING_FEED, {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  const raw = await response.text();
  return new Response(raw, {
    status: response.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=2, s-maxage=2, stale-while-revalidate=3",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

async function commandApi(request, pathname) {
  if (pathname === "/api/command/trader/status" && request.method === "GET") {
    return proxyTrader(request, "/v1/command/status");
  }
  if (pathname === "/api/command/trader/reports/daily" && request.method === "GET") {
    return proxyTrader(request, "/v1/command/reports/daily");
  }
  if (pathname === "/api/command/trader/reports/weekly" && request.method === "GET") {
    return proxyTrader(request, "/v1/command/reports/weekly");
  }
  if (pathname === "/api/command/trader/evidence" && request.method === "GET") {
    return proxyTrader(request, "/v1/command/evidence");
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

function currentReleaseSnapshot() {
  return releaseRegistry.releases.find((release) => release.slug === releaseRegistry.currentSlug) || null;
}

function publicRouteMetadata(pathname) {
  if (pathname === "/theory") {
    return {
      title: "Mathematics & Theory — ANEVUM",
      description: "ANEVUM's public mathematics and theory program: formal problems, conjectures, assumptions, falsification criteria, workstreams, and the boundary between theory and RHEN production.",
      url: "https://anevum.com/theory"
    };
  }

  if (pathname === "/performance") {
    return {
      title: "RHEN Performance — ANEVUM",
      description: "RHEN's broker-derived live performance record: normalized returns, drawdown, sample size, methodology, and public/private evidence boundary.",
      url: "https://anevum.com/performance"
    };
  }

  if (pathname === "/releases") {
    const current = currentReleaseSnapshot();
    return {
      title: current ? `RHEN Releases — ${current.version} ${current.codename} — ANEVUM` : "RHEN Releases — ANEVUM",
      description: current
        ? `RHEN release archive. Current named release: ${current.version} ${current.codename}, ${current.lifecycle}.`
        : "RHEN named release archive, manifests, verification state, limitations, and release packets.",
      url: "https://anevum.com/releases"
    };
  }

  if (pathname.startsWith("/releases/")) {
    const slug = pathname.slice("/releases/".length);
    const release = releaseRegistry.releases.find((item) => item.slug === slug);
    if (release) {
      return {
        title: `RHEN ${release.version} — ${release.codename} — ANEVUM`,
        description: `${release.releaseClass}. ${release.abstract}`,
        url: `https://anevum.com/releases/${release.slug}`
      };
    }
  }

  return null;
}

async function withPublicRouteMetadata(response, pathname) {
  const meta = publicRouteMetadata(pathname);
  if (!meta) return response;

  let html = await response.text();
  const setMeta = (source, attribute, key, value) => {
    const pattern = new RegExp('<meta\\s+' + attribute + '="' + key + '"\\s+content="[^"]*"\\s*\\/?>', 'i');
    return source.replace(pattern, '<meta ' + attribute + '="' + key + '" content="' + value + '" />');
  };

  html = setMeta(html, "name", "description", meta.description);
  html = setMeta(html, "property", "og:title", meta.title);
  html = setMeta(html, "property", "og:description", meta.description);
  html = setMeta(html, "property", "og:url", meta.url);
  html = setMeta(html, "name", "twitter:title", meta.title);
  html = setMeta(html, "name", "twitter:description", meta.description);
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?\s*>/i, '<link rel="canonical" href="' + meta.url + '" />');
  html = html.replace(/<title>[^<]*<\/title>/i, '<title>' + meta.title + '</title>');

  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.delete("Content-Length");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
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

    if (url.hostname === "anevum.com" && url.protocol !== "https:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }

    if (pathname === "/api/public/trading/live") {
      if (request.method !== "GET") return jsonResponse({ message: "Method not allowed." }, 405);
      try {
        return await publicTradingFeed();
      } catch (error) {
        return jsonResponse({ message: error instanceof Error ? error.message : "Public trading feed failed." }, 502);
      }
    }

    if (pathname === "/api/public/research/readiness") {
      if (request.method !== "GET") return jsonResponse({ message: "Method not allowed." }, 405);
      try {
        return await publicResearchReadiness();
      } catch (error) {
        return jsonResponse({ message: error instanceof Error ? error.message : "Research readiness unavailable." }, 502);
      }
    }

    if (pathname === "/api/public/theory") {
      if (request.method !== "GET") return jsonResponse({ message: "Method not allowed." }, 405);
      try {
        return await publicTheory();
      } catch (error) {
        return jsonResponse({ message: error instanceof Error ? error.message : "Theory program unavailable." }, 502);
      }
    }

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

    let response = await env.ASSETS.fetch(request);
    if (!response.headers.get("content-type")?.includes("text/html")) return response;
    response = await withPublicRouteMetadata(response, pathname);
    return withSecurityHeaders(response, pathname, url.hostname);
  }
};
