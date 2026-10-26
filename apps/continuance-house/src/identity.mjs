import { createPublicKey, verify as verifySignature } from "node:crypto";

export class AccessError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const jwksCache = new Map();
const isLoopback = (address) =>
  address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";

function parseJsonBase64Url(value) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new AccessError(401, "Invalid access token.");
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    throw new AccessError(401, "Invalid access token.");
  }
}

export function validateAccessConfiguration(env) {
  const domain = env.HOUSE_CF_TEAM_DOMAIN || "";
  const aud = env.HOUSE_CF_AUD || "";
  const owner = env.HOUSE_OWNER_EMAIL || "";
  const origin = env.HOUSE_PUBLIC_ORIGIN || "";
  if (!/^[a-z0-9][a-z0-9-]*\.cloudflareaccess\.com$/i.test(domain)) return false;
  if (!/^[\w-]{12,120}$/.test(aud)) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner)) return false;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.origin === origin && !url.username && !url.password;
  } catch {
    return false;
  }
}

async function getSigningKeys(domain, fetchImpl) {
  const existing = jwksCache.get(domain);
  if (existing && existing.expires > Date.now()) return existing.keys;
  const response = await fetchImpl("https://" + domain + "/cdn-cgi/access/certs", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new AccessError(503, "Identity verification unavailable.");
  const body = await response.json();
  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    throw new AccessError(503, "Identity verification unavailable.");
  }
  jwksCache.set(domain, { keys: body.keys, expires: Date.now() + 5 * 60_000 });
  return body.keys;
}

export async function authenticate(request, env, fetchImpl = globalThis.fetch) {
  const localMode = env.HOUSE_LOCAL_DEMO === "1" && env.NODE_ENV !== "production";
  if (localMode) {
    if (!isLoopback(request.socket.remoteAddress)) {
      throw new AccessError(403, "Local demonstration is restricted to this computer.");
    }
    return { role: "local-demo", mode: "synthetic", label: "Local demonstration" };
  }

  if (!validateAccessConfiguration(env)) {
    throw new AccessError(503, "Private access is not configured. This service is closed.");
  }
  const token = request.headers["cf-access-jwt-assertion"];
  if (typeof token !== "string" || token.length > 8192) {
    throw new AccessError(401, "Verified Cloudflare Access identity required.");
  }
  const parts = token.split(".");
  if (parts.length !== 3) throw new AccessError(401, "Invalid access token.");
  const header = parseJsonBase64Url(parts[0]);
  const claims = parseJsonBase64Url(parts[1]);
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new AccessError(401, "Unsupported access token.");
  }
  const now = Math.floor(Date.now() / 1000);
  const issuer = "https://" + env.HOUSE_CF_TEAM_DOMAIN;
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (
    claims.iss !== issuer || !audience.includes(env.HOUSE_CF_AUD) ||
    !Number.isFinite(claims.exp) || claims.exp <= now ||
    (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now + 30)) ||
    typeof claims.email !== "string"
  ) {
    throw new AccessError(401, "Invalid or expired access token.");
  }
  let keys;
  try {
    keys = await getSigningKeys(env.HOUSE_CF_TEAM_DOMAIN, fetchImpl);
  } catch {
    throw new AccessError(503, "Identity verification unavailable.");
  }
  const key = keys.find((item) => item.kid === header.kid && item.kty === "RSA");
  if (!key) throw new AccessError(401, "Unknown access signing key.");
  let valid = false;
  try {
    valid = verifySignature(
      "RSA-SHA256",
      Buffer.from(parts[0] + "." + parts[1]),
      createPublicKey({ key, format: "jwk" }),
      Buffer.from(parts[2], "base64url")
    );
  } catch {
    valid = false;
  }
  if (!valid) throw new AccessError(401, "Invalid access signature.");
  if (claims.email.toLowerCase() !== env.HOUSE_OWNER_EMAIL.toLowerCase()) {
    throw new AccessError(403, "This owner-only terminal does not grant family or staff roles.");
  }
  return { role: "owner", mode: "verified", label: "Verified owner" };
}
