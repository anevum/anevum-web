// The member platform is a separate authorization domain from Cloudflare Access / RHEN Command.
// Production is the default. Preview can be enabled only for one explicit HTTPS origin and its own D1 database.
const PRODUCTION_ORIGIN = "https://anevum.com";

export const REQUIRED_MEMBER_TABLES = Object.freeze([
  "user", "session", "account", "verification", "rateLimit",
  "member_profiles", "member_saved_apps", "member_project_follows", "member_entitlements"
]);

export function resolveMemberOrigin(request, env) {
  const origin = new URL(request.url).origin;
  if (origin === PRODUCTION_ORIGIN) return origin;
  if (env?.ANEVUM_MEMBER_PREVIEW_ENABLED !== "true") return null;

  let configured;
  try {
    configured = new URL(String(env?.MEMBER_PREVIEW_ORIGIN || ""));
  } catch {
    return null;
  }

  // An explicit preview origin must be HTTPS, have no pathname/query, and
  // belong to the ANEVUM domain or to a specifically provisioned Workers preview.
  const host = configured.hostname.toLowerCase();
  const allowedHost = host.endsWith(".anevum.com") || host.endsWith(".workers.dev");
  if (
    configured.protocol !== "https:" ||
    configured.port ||
    configured.pathname !== "/" ||
    configured.search ||
    configured.hash ||
    !allowedHost
  ) return null;

  return configured.origin === origin ? origin : null;
}

export async function memberSchemaReady(env) {
  if (!env?.MEMBER_DB || typeof env.MEMBER_DB.prepare !== "function") return false;
  try {
    const response = await env.MEMBER_DB
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all();
    const existing = new Set((response?.results || []).map((row) => row.name));
    return REQUIRED_MEMBER_TABLES.every((table) => existing.has(table));
  } catch {
    // A partially migrated/unavailable database must not advertise working signup.
    return false;
  }
}
