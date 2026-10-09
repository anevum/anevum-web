import releaseRegistry from "./src/data/releases.json";
import { shadowRead } from "./shadow-transport.mjs";
import { memberEndpoint } from "./src/server/member.mjs";
import { legacyOperatorTarget } from "./src/server/operator-routes.mjs";

const TRADER_BASE = "https://alpaca-trader-production-bf3e.up.railway.app";
const PUBLIC_TRADING_FEED = TRADER_BASE + "/v1/trading-public-feed";

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

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return bytes;
}

function decodeJwtJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

async function verifyAccessAssertion(token, env) {
  const teamDomain = String(env?.CF_ACCESS_TEAM_DOMAIN || "").trim().replace(/\/$/, "");
  const audience = String(env?.CF_ACCESS_AUD || "").trim();
  if (!teamDomain.startsWith("https://") || !audience) {
    throw new ApiError(503, "Cloudflare Access is not configured.");
  }

  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new ApiError(401, "Cloudflare Access authentication is invalid.");
  const header = decodeJwtJson(parts[0]);
  const payload = decodeJwtJson(parts[1]);
  if (header.alg !== "RS256" || !header.kid) {
    throw new ApiError(401, "Cloudflare Access authentication is invalid.");
  }

  const response = await fetch(teamDomain + "/cdn-cgi/access/certs", {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new ApiError(503, "Cloudflare Access signing keys are unavailable.");
  const jwks = await response.json();
  const jwk = Array.isArray(jwks?.keys)
    ? jwks.keys.find((item) => item && item.kid === header.kid)
    : null;
  if (!jwk) throw new ApiError(401, "Cloudflare Access signing key is unknown.");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signed = new TextEncoder().encode(parts[0] + "." + parts[1]);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodeBase64Url(parts[2]),
    signed
  );
  if (!valid) throw new ApiError(401, "Cloudflare Access authentication is invalid.");

  const now = Math.floor(Date.now() / 1000);
  const tokenAudience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (
    payload.iss !== teamDomain ||
    !tokenAudience.includes(audience) ||
    !Number.isFinite(Number(payload.exp)) ||
    Number(payload.exp) <= now ||
    (payload.iat !== undefined && Number(payload.iat) > now + 60)
  ) {
    throw new ApiError(401, "Cloudflare Access authentication is invalid or expired.");
  }

  const email = String(payload.email || "").trim().toLowerCase();
  if (!email) throw new ApiError(401, "Cloudflare Access identity is missing email.");
  const allowed = new Set(
    String(env?.COMMAND_ACCESS_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
  if (allowed.size && !allowed.has(email)) {
    throw new ApiError(403, "Cloudflare Access identity is not authorized for Command.");
  }
  return { email, source: "cloudflare_access" };
}

async function commandCredential(request, env) {
  const access = (request.headers.get("cf-access-jwt-assertion") || "").trim();
  if (!access) {
    throw new ApiError(401, "Cloudflare Access authentication is required.");
  }
  const identity = await verifyAccessAssertion(access, env);
  return { token: access, source: "cloudflare_access", identity };
}

async function proxyTrader(request, upstreamPath, env) {
  const credential = await commandCredential(request, env);

  const requestUrl = new URL(request.url);
  const response = await fetch(TRADER_BASE + upstreamPath + requestUrl.search, {
    method: request.method,
    headers: {
      Authorization: "Bearer " + credential.token,
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
    signal: AbortSignal.timeout(10000)
  });
  const raw = await response.text();
  let payload = {};
  if (raw) {
    try { payload = JSON.parse(raw); }
    catch { payload = { message: raw }; }
  }
  return jsonResponse(payload, response.status);
}

async function proxyCommandStream(request, env) {
  if (String(env?.COMMAND_LIVE_STREAM_ENABLED || "false") !== "true") return jsonResponse({ message: "Archived 4.4 observation is not resident in the lean RHEN runtime." }, 503);
  const url = new URL(request.url);
  if (request.method !== "GET" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return jsonResponse({ message: "WebSocket upgrade required." }, 426);
  if (request.headers.get("Origin") !== url.origin) return jsonResponse({ message: "Same-origin Command stream required." }, 403);
  if (url.search) return jsonResponse({ message: "Stream query credentials are not accepted." }, 400);
  const credential = await commandCredential(request, env);
  const base = String(env?.RHEN_COMMAND_STREAM_BASE || TRADER_BASE).replace(/\/$/, "");
  if (!base.startsWith("https://")) return jsonResponse({ message: "Secure stream upstream required." }, 503);
  // Returning the upgrade response preserves Cloudflare's WebSocket proxy. It must
  // not be converted to JSON, read as text, or subject to a REST timeout.
  return fetch(base + "/v1/command/stream", {
    headers: { Upgrade: "websocket", Authorization: "Bearer " + credential.token },
    redirect: "manual"
  });
}

async function proxyOwnerReadOnlyStream(request, env) {
  if (String(env?.RHEN_OBSERVER_ENABLED || "false") !== "true") {
    return jsonResponse({message:"RHEN read-only stream not enabled."}, 503);
  }
  const url = new URL(request.url);
  if (request.method !== "GET" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
    return jsonResponse({message:"WebSocket upgrade required."}, 426);
  }
  if (request.headers.get("Origin") !== url.origin || url.search) {
    return jsonResponse({message:"Same-origin private stream only."}, 403);
  }
  const credential = await commandCredential(request, env);
  const base = String(env?.RHEN_COMMAND_STREAM_BASE || TRADER_BASE).replace(/\\/$/,"");
  if (!base.startsWith("https://")) return jsonResponse({message:"Secure upstream required."}, 503);
  // Forward only the verified Access assertion, never a broker token or URL credential.
  return fetch(base + "/v1/command/live", {
    headers: { Upgrade: "websocket", Authorization: "Bearer " + credential.token },
    redirect: "manual"
  });
}

async function proxyCommandHistory(request, env) {
  if (String(env?.COMMAND_LIVE_STREAM_ENABLED || "false") !== "true") return jsonResponse({ message: "Archived 4.4 observation is not resident in the lean RHEN runtime." }, 503);
  if (request.method !== "GET") return jsonResponse({message:"Read-only history."},405);
  const url = new URL(request.url);
  const allowed = new Set(["series","start","end","clock","limit"]);
  if ([...url.searchParams.keys()].some(key=>!allowed.has(key))) return jsonResponse({message:"Invalid history query."},400);
  const credential = await commandCredential(request,env);
  const base = String(env?.RHEN_COMMAND_STREAM_BASE || TRADER_BASE).replace(/\/$/,"");
  if (!base.startsWith("https://")) return jsonResponse({message:"Secure upstream required."},503);
  let result = await shadowRead(base,"/v1/command/research/history"+url.search,credential.token);
  if (result.status === 404) result = await shadowRead(base,"/v1/command/shadow/history"+url.search,credential.token);
  return jsonResponse(result.payload,result.status);
}

async function proxyCommandBootstrap(request, env) {
  if (String(env?.COMMAND_LIVE_STREAM_ENABLED || "false") !== "true") return jsonResponse({message:"Archived 4.4 observation is not resident in the lean RHEN runtime."},503);
  if (request.method !== "GET") return jsonResponse({message:"Read-only bootstrap."},405);
  if (new URL(request.url).search) return jsonResponse({message:"Bootstrap query credentials are not accepted."},400);
  const credential = await commandCredential(request,env);
  const base = String(env?.RHEN_COMMAND_STREAM_BASE || TRADER_BASE).replace(/\/$/,"");
  if (!base.startsWith("https://")) return jsonResponse({message:"Secure upstream required."},503);
  let result = await shadowRead(base,"/v1/command/research/bootstrap",credential.token);
  if (result.status === 404) result = await shadowRead(base,"/v1/command/shadow/bootstrap",credential.token);
  return jsonResponse(result.payload,result.status);
}

async function publicResearchReadiness() {
  const response = await fetch(TRADER_BASE + "/v1/research/readiness/public", {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000)
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
  const response = await fetch(TRADER_BASE + "/v1/research/theory/public", {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000)
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
    },
    signal: AbortSignal.timeout(10000)
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

async function commandApi(request, pathname, env) {
  if (pathname === "/api/command/trader/status" && request.method === "GET") {
    return proxyTrader(request, "/v1/command/status", env);
  }
  if (pathname === "/api/command/trader/reports/daily" && request.method === "GET") {
    return proxyTrader(request, "/v1/command/reports/daily", env);
  }
  if (pathname === "/api/command/trader/reports/weekly" && request.method === "GET") {
    return proxyTrader(request, "/v1/command/reports/weekly", env);
  }
  if (pathname === "/api/command/trader/evidence" && request.method === "GET") {
    return proxyTrader(request, "/v1/command/evidence", env);
  }
  if (pathname === "/api/command/trader/entries/disable" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/entries/disable", env);
  }
  if (pathname === "/api/command/trader/entries/enable" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/entries/enable", env);
  }
  if (pathname === "/api/command/trader/orders/cancel" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/orders/cancel", env);
  }
  if (pathname === "/api/command/trader/position/close" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/position/close", env);
  }
  if (pathname === "/api/command/trader/mobile/live-activity-token" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/mobile/live-activity-token", env);
  }
  if (pathname === "/api/command/trader/mobile/live-activity-end" && request.method === "POST") {
    return proxyTrader(request, "/v1/command/mobile/live-activity-end", env);
  }
  return null;
}

function currentReleaseSnapshot() {
  return releaseRegistry.releases.find((release) => release.slug === releaseRegistry.currentSlug) || null;
}

function publicRouteMetadata(pathname) {
  const staticRoutes = {
    "/": {
      title: "ANEVUM — Independent Software",
      description: "Independent software built against real problems, with real data, public evidence, and versioned work."
    },
    "/products": {
      title: "Products — ANEVUM",
      description: "The canonical registry of public ANEVUM products. Products appear when they actually exist."
    },
    "/feed": {
      title: "Feed — ANEVUM",
      description: "A chronological record assembled from real releases, Field Notes, public-safe runtime observations, and research decisions."
    },
    "/field-notes": {
      title: "Field Notes — ANEVUM",
      description: "ANEVUM Field Notes document research decisions, failures, engineering changes, releases, and measured evidence."
    },
    "/products/rhen": {
      title: "RHEN — ANEVUM",
      description: "RHEN is ANEVUM's live trading and research system operating on real market data with public evidence and narrow live authority."
    },
    "/products/rhen/evidence": {
      title: "RHEN Public Evidence — ANEVUM",
      description: "Inspect sanitized RHEN runtime and performance evidence without exposing protected broker, position, order, or strategy details."
    },
    "/products/rhen/architecture": {
      title: "RHEN Architecture — ANEVUM",
      description: "Inspect RHEN execution, research, replay, forecasting, control, storage, and evidence boundaries."
    },
    "/products/rhen/releases": {
      title: "RHEN Releases — ANEVUM",
      description: "RHEN release records document production changes, verification, limitations, and public system history."
    },
    "/about": {
      title: "About — ANEVUM",
      description: "About ANEVUM, the independently built and operated software studio."
    },
    "/resume": {
      title: "Résumé — ANEVUM",
      description: "Professional résumé and background for the person responsible for ANEVUM."
    }
  };

  if (staticRoutes[pathname]) {
    return {
      ...staticRoutes[pathname],
      url: "https://anevum.com" + (pathname === "/" ? "/" : pathname)
    };
  }

  if (pathname.startsWith("/products/rhen/releases/")) {
    const slug = pathname.slice("/products/rhen/releases/".length);
    const release = releaseRegistry.releases.find((item) => item.slug === slug);
    if (release) {
      return {
        title: "RHEN " + release.version + " — " + release.codename + " — ANEVUM",
        description: release.releaseClass + ". " + release.abstract,
        url: "https://anevum.com/products/rhen/releases/" + release.slug
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
  const privateOrArchived = pathname.startsWith("/me") || pathname.startsWith("/sign-in") || pathname.startsWith("/apps/") || pathname.startsWith("/command") || pathname.startsWith("/private") || pathname.startsWith("/rhenlink") || pathname.startsWith("/wiki/archive") || pathname.startsWith("/lattice") || pathname.startsWith("/store") || pathname.startsWith("/reply") || pathname.startsWith("/the-book") || pathname.startsWith("/stories/");
  if (privateOrArchived || hostname !== "anevum.com") headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (pathname.startsWith("/command") || pathname.startsWith("/private") || pathname.startsWith("/me") || pathname.startsWith("/sign-in") || pathname.startsWith("/apps/")) headers.set("Cache-Control", "private, no-store");

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

    if (pathname.startsWith("/api/member/") || pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
      try {
        return await memberEndpoint(request, env, pathname);
      } catch {
        return jsonResponse({ message: "Member service unavailable." }, 503);
      }
    }

    if (pathname === "/api/public/trading/live") {
      if (request.method !== "GET") return jsonResponse({ message: "Method not allowed." }, 405);
      try {
        return await publicTradingFeed();
      } catch (error) {
        return jsonResponse(
          {
            ok: false,
            message: error instanceof Error ? error.message : "Public trading telemetry unavailable.",
            stale: true
          },
          502
        );
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

    if (pathname === "/api/command/live") {
      try { return await proxyOwnerReadOnlyStream(request, env); }
      catch (error) { return jsonResponse({ message: "Private RHEN observer unavailable." }, error instanceof ApiError ? error.status : 502); }
    }

    if (pathname === "/api/command/stream") {
      try { return await proxyCommandStream(request, env); }
      catch (error) { return jsonResponse({ message: "Authenticated Command stream unavailable." }, error instanceof ApiError ? error.status : 502); }
    }

    if (pathname === "/api/command/research/history" || pathname === "/api/command/shadow/history") {
      try { return await proxyCommandHistory(request,env); }
      catch (error) { return jsonResponse({message:"Authenticated source history unavailable."},error instanceof ApiError ? error.status : 502); }
    }

    if (pathname === "/api/command/research/bootstrap" || pathname === "/api/command/shadow/bootstrap") {
      try { return await proxyCommandBootstrap(request,env); }
      catch (error) { return jsonResponse({message:"Authenticated research bootstrap unavailable."},error instanceof ApiError ? error.status : 502); }
    }

    if (pathname === "/api/command/session") {
      if (request.method !== "GET") return jsonResponse({ message: "Method not allowed." }, 405);
      try {
        const credential = await commandCredential(request, env);
        return jsonResponse({
          authenticated: true,
          email: credential.identity?.email || null,
          auth_source: credential.source,
          command_admin: true
        });
      } catch (error) {
        if (error instanceof ApiError) return jsonResponse({ message: error.message }, error.status);
        return jsonResponse({ message: "Private authentication unavailable." }, 503);
      }
    }

    if (pathname === "/api/command/iren/status") {
      if (request.method !== "GET") return jsonResponse({ message: "Method not allowed." }, 405);
      try {
        return await proxyTrader(request, "/v1/command/iren/status", env);
      } catch (error) {
        if (error instanceof ApiError) return jsonResponse({ message: error.message }, error.status);
        return jsonResponse({ message: "IREN state unavailable from RHEN.", stale: true }, 503);
      }
    }

    if (pathname === "/api/command/iren/configuration/accept") {
      if (request.method !== "POST") return jsonResponse({ message: "Method not allowed." }, 405);
      if (url.hostname !== "anevum.com") {
        return jsonResponse({ message: "Protected configuration acceptance is disabled outside production." }, 403);
      }
      try {
        return await proxyTrader(request, "/v1/command/iren/configuration/accept", env);
      } catch (error) {
        if (error instanceof ApiError) return jsonResponse({ message: error.message }, error.status);
        return jsonResponse({ message: "IREN configuration review unavailable from RHEN." }, 503);
      }
    }

    if (pathname === "/api/command/iren/command") {
      if (request.method !== "POST") return jsonResponse({ message: "Method not allowed." }, 405);
      if (url.hostname !== "anevum.com") {
        return jsonResponse({ message: "IREN Command mutations are disabled outside production." }, 403);
      }
      try {
        return await proxyTrader(request, "/v1/command/iren/command", env);
      } catch (error) {
        if (error instanceof ApiError) return jsonResponse({ message: error.message }, error.status);
        return jsonResponse({ message: "IREN command unavailable from RHEN." }, 503);
      }
    }

    if (pathname.startsWith("/api/command/trader/")) {
      if (request.method !== "GET" && url.hostname !== "anevum.com") {
        return jsonResponse({ message: "Live Command controls are disabled outside production." }, 403);
      }
      try {
        const response = await commandApi(request, pathname, env);
        if (response) return response;
        return jsonResponse({ message: "Command trader endpoint not found." }, 404);
      } catch (error) {
        if (error instanceof ApiError) return jsonResponse({ message: error.message }, error.status);
        return jsonResponse({ message: error instanceof Error ? error.message : "Command trader request failed." }, 500);
      }
    }

    // Guard all unrecognized operator API paths. Never let a protected API
    // accidentally fall through to the public SPA/HTML response.
    if (pathname === "/api/command" || pathname.startsWith("/api/command/")) {
      return jsonResponse({ message: "Cloudflare Access authentication is required." }, 401);
    }

    if (request.method === "GET" || request.method === "HEAD") {
      const operatorDestination = legacyOperatorTarget(pathname);
      if (operatorDestination) return Response.redirect(new URL(operatorDestination, request.url).toString(), 308);
      const legacyRedirects = {
        "/founder": "/about",
        "/live": "/products/rhen/evidence",
        "/performance": "/products/rhen/evidence",
        "/architecture": "/products/rhen/architecture",
        "/releases": "/products/rhen/releases",
        "/research": "/field-notes",
        "/case-studies": "/products",
        "/theory": "/field-notes",
        "/products/iren": "/products/rhen",
        "/products/nostra": "/products/rhen",
        "/products/graen": "/products/rhen",
        "/products/velum": "/products/rhen"
      };
      const targetPath = legacyRedirects[pathname];
      if (targetPath) {
        const target = new URL(targetPath, request.url);
        return Response.redirect(target.toString(), 308);
      }
    }

    let response = await env.ASSETS.fetch(request);
    if (!response.headers.get("content-type")?.includes("text/html")) return response;
    response = await withPublicRouteMetadata(response, pathname);
    return withSecurityHeaders(response, pathname, url.hostname);
  }
};
