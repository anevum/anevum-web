import { proxyIren } from "./command-iren.mjs";
import releaseRegistry from "./src/data/releases.json";

const TRADER_BASE = "https://alpaca-trader-production-bf3e.up.railway.app";
const RESEARCH_BASE = "https://rhen-research-agent-production.up.railway.app";
const PUBLIC_TRADING_FEED = "https://foundation-ingest-staging.up.railway.app/v1/trading-public-feed";
const SUPABASE_AUTH_USER = "https://mfntzxheldzdvlokyntk.supabase.co/auth/v1/user";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae";

const PUBLIC_REBUILD_STATE = {
  ok: false,
  status: "REBUILDING",
  source: "anevum_public_rebuild",
  data_state: "OFFLINE_BY_DESIGN",
  since: "2026-10-01",
  priority_systems: ["RHEN", "GRAEN"],
  message: "Public trading telemetry is intentionally offline while ANEVUM rebuilds its core data and runtime paths."
};

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
    headers: {
      Accept: "application/json"
    }
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
  if (pathname === "/api/command/trader/mobile/live-activity-token" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/mobile/live-activity-token");
  }
  if (pathname === "/api/command/trader/mobile/live-activity-end" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/mobile/live-activity-end");
  }
  return null;
}

function currentReleaseSnapshot() {
  return releaseRegistry.releases.find((release) => release.slug === releaseRegistry.currentSlug) || null;
}

function publicRouteMetadata(pathname) {
  const staticRoutes = {
    "/": {
      title: "ANEVUM Core Rebuild Underway — Engineering Update",
      description: "ANEVUM is rebuilding its core stack from the ground up. Public system data is temporarily offline while infrastructure, evidence paths, RHEN, and GRAEN are rebuilt and verified."
    },
    "/products": {
      title: "Products — ANEVUM",
      description: "Explore IREN, RHEN, NOSTRA, GRAEN, and VELUM: ANEVUM's orchestration, market, forecasting, mathematical research, and replay systems."
    },
    "/products/iren": {
      title: "IREN — Operating Intelligence — ANEVUM",
      description: "IREN is ANEVUM's operating intelligence and orchestration layer for system state, research coordination, protected operations, and cross-system visibility."
    },
    "/products/rhen": {
      title: "RHEN — Market System — ANEVUM",
      description: "RHEN is ANEVUM's market observation, evaluation, risk, execution, reconciliation, telemetry, evidence, and strategy-research system."
    },
    "/products/nostra": {
      title: "NOSTRA — Forecasting — ANEVUM",
      description: "NOSTRA is ANEVUM's forecasting and prediction research system for regimes, forward horizons, uncertainty, outcomes, and calibration."
    },
    "/products/graen": {
      title: "GRAEN — Mathematical Research — ANEVUM",
      description: "GRAEN is ANEVUM's mathematical and theoretical research program for falsification, selection bias, multiplicity, dependence, simulation design, and validation."
    },
    "/products/velum": {
      title: "VELUM — Replay & Simulation — ANEVUM",
      description: "VELUM is ANEVUM's broker-isolated replay, simulation, market reconstruction, counterfactual analysis, and failure-analysis system."
    },
    "/performance": {
      title: "Performance — ANEVUM",
      description: "Separate public-safe live performance records for RHEN equities and crypto market lanes, with normalized methodology, sample boundaries, and no simulated results."
    },
    "/research": {
      title: "Research — ANEVUM",
      description: "ANEVUM research across GRAEN, NOSTRA, VELUM, and RHEN: hypotheses, validation gates, durable decisions, forward outcomes, and explicit limitations."
    },
    "/founder": {
      title: "Devon Akins — Founder, ANEVUM",
      description: "Founder profile for Devon Akins: systems builder and independent researcher building ANEVUM's software, infrastructure, telemetry, forecasting, mathematical research, and replay systems."
    },
    "/resume": {
      title: "Devon Akins — Resume",
      description: "Recruiter-ready resume for Devon Akins, founder of ANEVUM, covering software engineering, infrastructure, data systems, research tooling, and selected systems."
    },
    "/live": {
      title: "Live Systems — ANEVUM",
      description: "Sanitized live operating state and telemetry for ANEVUM systems without exposing private account data, execution details, or sensitive infrastructure."
    },
    "/theory": {
      title: "Theory Registry — ANEVUM",
      description: "ANEVUM's public mathematical theory registry: formal problems, conjectures, assumptions, falsification criteria, workstreams, results, and authority boundaries."
    },
    "/releases": {
      title: "Releases — ANEVUM",
      description: "ANEVUM release history with named RHEN milestones, manifests, verification state, limitations, and downloadable release packets."
    }
  };

  if (staticRoutes[pathname]) {
    return {
      ...staticRoutes[pathname],
      url: "https://anevum.com" + (pathname === "/" ? "/" : pathname)
    };
  }

  if (pathname.startsWith("/releases/")) {
    const slug = pathname.slice("/releases/".length);
    const release = releaseRegistry.releases.find((item) => item.slug === slug);
    if (release) {
      return {
        title: "RHEN " + release.version + " — " + release.codename + " — ANEVUM",
        description: release.releaseClass + ". " + release.abstract,
        url: "https://anevum.com/releases/" + release.slug
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
      return jsonResponse(PUBLIC_REBUILD_STATE, 503);
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

    if (pathname === "/api/command/iren/status" || pathname === "/api/command/iren/command") {
      if (request.method === "POST" && url.hostname !== "anevum.com") {
        return jsonResponse({ message: "IREN Command mutations are disabled outside production." }, 403);
      }
      try {
        return await proxyIren(request, assertCommandAdmin);
      } catch (error) {
        if (error instanceof ApiError) return jsonResponse({ message: error.message }, error.status);
        return jsonResponse({ message: "Operational state unavailable.", stale: true }, 503);
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
