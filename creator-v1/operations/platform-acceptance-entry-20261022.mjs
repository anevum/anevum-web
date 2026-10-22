// creator-v1/apex-prelaunch/preview-access.mjs
var ACCESS_TEAM_DOMAIN = "wispy-tooth-095a.cloudflareaccess.com";
var ACCESS_ISSUER = "https://" + ACCESS_TEAM_DOMAIN;
var CERTS_URL = ACCESS_ISSUER + "/cdn-cgi/access/certs";
var JWT_LIMIT = 8192;
var CERTS_TTL_MS = 5 * 60 * 1e3;
var keyCache = { until: 0, byId: /* @__PURE__ */ new Map() };
var nowSeconds = () => Math.floor(Date.now() / 1e3);
var isRecord = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
function urlBytes(segment) {
  if (typeof segment !== "string" || segment.length > JWT_LIMIT || !/^[a-zA-Z0-9_-]+$/.test(segment)) return null;
  try {
    const encoded = segment.replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(encoded + "=".repeat((4 - encoded.length % 4) % 4));
    return Uint8Array.from(raw, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}
function parsePart(segment) {
  const raw = urlBytes(segment);
  if (!raw) return null;
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw));
  } catch {
    return null;
  }
}
function cookieValue(request, name) {
  const raw = request.headers.get("cookie") || "";
  const parts = raw.split(";").map((s) => s.trim());
  let found = null;
  for (const part of parts) {
    const separator = part.indexOf("=");
    if (separator < 1 || part.slice(0, separator) !== name) continue;
    if (found !== null) return null;
    found = part.slice(separator + 1);
  }
  return found;
}
var emailList = (value) => new Set(typeof value === "string" ? value.split(",").map((v) => v.trim().toLowerCase()).filter((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) : []);
async function accessKey(kid, fetchImpl, nowMs) {
  if (typeof kid !== "string" || !kid || kid.length > 256) return null;
  if (nowMs >= keyCache.until) {
    keyCache = { until: 0, byId: /* @__PURE__ */ new Map() };
    let response2;
    try {
      response2 = await fetchImpl(CERTS_URL, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(4e3),
        headers: { Accept: "application/json" }
      });
      if (!response2.ok || !response2.headers.get("content-type")?.includes("application/json")) return null;
      const text = await response2.text();
      if (text.length > 131072) return null;
      const data = JSON.parse(text);
      if (!Array.isArray(data?.keys) || data.keys.length > 24) return null;
      const keys = /* @__PURE__ */ new Map();
      for (const item of data.keys) {
        if (!isRecord(item) || item.kty !== "RSA" || typeof item.kid !== "string" || item.kid.length > 256 || item.alg && item.alg !== "RS256" || typeof item.n !== "string" || typeof item.e !== "string" || !item.n || !item.e) continue;
        const k = await crypto.subtle.importKey(
          "jwk",
          { kty: "RSA", n: item.n, e: item.e, alg: "RS256", ext: true },
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["verify"]
        );
        keys.set(item.kid, k);
      }
      if (!keys.size) return null;
      keyCache = { until: nowMs + CERTS_TTL_MS, byId: keys };
    } catch {
      return null;
    }
  }
  return keyCache.byId.get(kid) || null;
}
async function verifiedPreviewIdentity(request, env, { fetchImpl = fetch, now = nowSeconds() } = {}) {
  if (typeof env?.ANEVUM_ACCESS_AUD !== "string" || !/^[a-f0-9]{64}$/.test(env.ANEVUM_ACCESS_AUD)) return null;
  const permitted = emailList(env.ANEVUM_PREVIEW_ALLOWED_EMAILS);
  if (!permitted.size) return null;
  const token = cookieValue(request, "CF_Authorization");
  if (!token || token.length > JWT_LIMIT) return null;
  const pieces = token.split(".");
  if (pieces.length !== 3) return null;
  const header = parsePart(pieces[0]);
  const claims = parsePart(pieces[1]);
  if (!isRecord(header) || header.alg !== "RS256" || typeof header.kid !== "string" || !isRecord(claims)) return null;
  if (claims.iss !== ACCESS_ISSUER) return null;
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audience.includes(env.ANEVUM_ACCESS_AUD)) return null;
  if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp) || claims.exp <= now || typeof claims.iat !== "number" || claims.iat > now + 60 || claims.nbf !== void 0 && (typeof claims.nbf !== "number" || claims.nbf > now + 30)) return null;
  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  if (!permitted.has(email)) return null;
  const signature = urlBytes(pieces[2]);
  if (!signature) return null;
  const key = await accessKey(header.kid, fetchImpl, now * 1e3);
  if (!key) return null;
  try {
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      signature,
      new TextEncoder().encode(pieces[0] + "." + pieces[1])
    );
    return valid ? { email, sub: typeof claims.sub === "string" ? claims.sub : "" } : null;
  } catch {
    return null;
  }
}

// creator-v1/ops/v095-v096-acceptance-entry.mjs
var QA_SOURCE = "7630a8b2fef77571862a51417499021d4c162bd2";
var QA_CANDIDATE = "6f26f0cc-6eee-483d-9f07-329e45bd5e76";
var QA_COOKIE = "__Host-anevum-v095-v096-qa";
var ROOT = "/__enter/v095-v096";
var headers = {
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow, noarchive",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "referrer-policy": "same-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY"
};
var response = (body, status = 200, extra = {}) => new Response(body, { status, headers: { ...headers, ...extra } });
async function acceptanceIdentity(request, env, options) {
  const transport = options?.fetchImpl || fetch;
  const checked = { ...options, fetchImpl: (url, init) => transport(url, { ...init, redirect: "manual" }) };
  const cookieIdentity = await verifiedPreviewIdentity(request, env, checked);
  if (cookieIdentity) return cookieIdentity;
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || token.length > 8192) return null;
  const h = new Headers();
  h.set("cookie", "CF_Authorization=" + token);
  return verifiedPreviewIdentity(new Request(request.url, { headers: h }), env, checked);
}
function createAcceptanceEntry({ identity = acceptanceIdentity, now = () => Math.floor(Date.now() / 1e3) } = {}) {
  return { async fetch(request, env) {
    const url = new URL(request.url);
    if (url.origin !== "https://anevum.com" || url.search || ![ROOT, ROOT + "/enable", ROOT + "/leave"].includes(url.pathname))
      return response("Not found", 404);
    if (!["GET", "POST"].includes(request.method)) return response("Method not allowed", 405, { allow: "GET, POST" });
    if (request.method === "POST") {
      if (request.headers.get("origin") !== "https://anevum.com" || !["same-origin", null].includes(request.headers.get("sec-fetch-site")))
        return response("Same-origin form required", 403);
      if (url.pathname === ROOT + "/leave") return response(null, 303, {
        location: "/studio/alpha",
        "set-cookie": QA_COOKIE + "=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0"
      });
      if (url.pathname !== ROOT + "/enable") return response("Not found", 404);
    } else if (url.pathname !== ROOT) return response("Not found", 404);
    let actor = null;
    try {
      actor = await identity(request, env);
    } catch {
    }
    if (!actor) return response("Authorized release tester sign-in required", 403);
    const expires = Number(env.QA_EXPIRES_AT), remaining = expires - now();
    if (!/^[a-f0-9]{64}$/.test(env.QA_ROUTING_TOKEN || "") || !Number.isSafeInteger(expires) || remaining <= 0 || remaining > 86400 || env.QA_CANDIDATE !== QA_CANDIDATE) return response("Candidate testing is unavailable", 503);
    if (request.method === "POST") return response(null, 303, {
      location: "/studio/alpha",
      "set-cookie": QA_COOKIE + "=" + env.QA_ROUTING_TOKEN + "; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=" + Math.min(remaining, 28800)
    });
    return response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ANEVUM release acceptance</title><style>body{background:#050b16;color:#e8f0ff;font:18px system-ui;max-width:44rem;margin:8vh auto;padding:24px;line-height:1.6}button{font:inherit;padding:14px 22px;border:1px solid #a0c5cc;background:#152536;color:inherit;border-radius:9px}code{overflow-wrap:anywhere}</style><main><p>CONTINUANCE INSTITUTE \xB7 RELEASE ACCEPTANCE</p><h1>Review platform recovery on this device</h1><p>This opts this browser into the reviewed candidate for up to four hours. Ordinary visitors continue to receive the existing release. Your normal sign-in and permissions still apply. This is a live-data test: use only designated test projects.</p><p>Application source: <code>${QA_SOURCE}</code><br>Candidate: <code>${QA_CANDIDATE}</code></p><p>On iPhone, open this page in Safari. Check IREN movement and fallback, onboarding and dismissal, identity cards, menus, guest editing, responsive preview and HTML export. Guest mode must offer no server upload or publish.</p><form method="post" action="${ROOT}/enable"><button>Enter candidate testing</button></form><form method="post" action="${ROOT}/leave"><p><button>Return to current release</button></p></form><p>Report the device, iOS version, candidate ID and any failures. Opening this page does not mark acceptance complete.</p></main></html>`, 200, { "content-type": "text/html; charset=utf-8" });
  } };
}
var v095_v096_acceptance_entry_default = createAcceptanceEntry();
export {
  QA_CANDIDATE,
  QA_COOKIE,
  QA_SOURCE,
  acceptanceIdentity,
  createAcceptanceEntry,
  v095_v096_acceptance_entry_default as default
};
