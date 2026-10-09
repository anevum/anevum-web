// Read-only, unauthenticated live production/staging release preflight.
// Never sends cookies or account secrets. Does not mutate member data.
// Staging authenticated two-account validation remains a separate acceptance gate.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PRODUCTION_ORIGIN = "https://anevum.com";
export const STAGING_ORIGIN = "https://anevum-member-staging.devonakins.workers.dev";
const ACCESS_HOST = "wispy-tooth-095a.cloudflareaccess.com";

export async function runPublicReadiness(request = fetch) {
  const checked = [];
  const get = async (origin, path, options = {}) => {
    const response = await request(origin + path, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      ...options
    });
    return response;
  };
  const status = (label, response, allowed) => {
    if (!allowed.includes(response.status)) {
      throw new Error(label + ": unexpected HTTP " + response.status);
    }
    checked.push(label);
  };
  const json = async (label, response, codes = [200]) => {
    status(label, response, codes);
    if (!(response.headers.get("content-type") || "").includes("application/json")) {
      throw new Error(label + ": not JSON");
    }
    return response.json();
  };

  const prod = await json("production signups disabled",
    await get(PRODUCTION_ORIGIN, "/api/member/availability"));
  if (prod.available !== false || prod.provider !== null)
    throw new Error("Production signup gate must remain disabled.");

  const stage = await json("isolated staging Google availability",
    await get(STAGING_ORIGIN, "/api/member/availability"));
  if (stage.available !== true || stage.provider !== "google")
    throw new Error("Staging Google OAuth is not ready.");

  const memberHome = await get(PRODUCTION_ORIGIN, "/command");
  status("public-safe member Command", memberHome, [200]);
  if (!(memberHome.headers.get("x-robots-tag") || "").includes("noindex") ||
      !(memberHome.headers.get("cache-control") || "").includes("no-store")) {
    throw new Error("Member Command requires noindex and no-store.");
  }

  const legacy = await get(PRODUCTION_ORIGIN, "/command/operate");
  status("legacy operator redirect", legacy, [308]);
  const destination = new URL(legacy.headers.get("location") || "", PRODUCTION_ORIGIN);
  if (destination.origin !== PRODUCTION_ORIGIN || destination.pathname !== "/command/rhen/operate")
    throw new Error("Legacy operator route escapes its protected destination.");

  for (const path of ["/command/rhen", "/command/rhen/operate"]) {
    const response = await get(PRODUCTION_ORIGIN, path);
    status("Access protects " + path, response, [302, 303]);
    const location = response.headers.get("location");
    if (!location || new URL(location, PRODUCTION_ORIGIN).hostname !== ACCESS_HOST)
      throw new Error("Protected RHEN Terminal did not challenge through Cloudflare Access.");
  }

  for (const path of ["/api/command/trader/status", "/api/command/unknown"]) {
    const response = await get(PRODUCTION_ORIGIN, path);
    status("operator API denies " + path, response, [302, 303, 401, 403]);
    if ([302, 303].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || new URL(location, PRODUCTION_ORIGIN).hostname !== ACCESS_HOST)
        throw new Error("Operator API redirects outside Cloudflare Access.");
    }
  }

  for (const path of ["/api/member/me", "/api/member/export", "/api/auth/get-session"]) {
    status("production closed " + path, await get(PRODUCTION_ORIGIN, path), [503]);
  }

  for (const path of [
    "/api/member/me",
    "/api/member/session",
    "/api/member/entitlements",
    "/api/member/export",
    "/api/member/saved-apps/rhen"
  ]) {
    status("staging anonymous denied " + path, await get(STAGING_ORIGIN, path), [401]);
  }
  status("staging auth handler healthy",
    await get(STAGING_ORIGIN, "/api/auth/get-session"), [200]);
  for (const path of ["/api/command/trader/status", "/api/command/unknown"]) {
    status("staging operator API denied " + path, await get(STAGING_ORIGIN, path), [401]);
  }
  status("staging forged-origin guest write denied", await get(
    STAGING_ORIGIN, "/api/member/me", {
      method: "PATCH",
      headers: { Origin: "https://untrusted.example", "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "no-mutation" })
    }), [401]);

  return { success: true, checks: checked };
}

const isDirect = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  runPublicReadiness()
    .then(({ checks }) => {
      console.log("ANEVUM anonymous release preflight PASS (" + checks.length + " checks)");
      checks.forEach(label => console.log("PASS " + label));
      console.log("Real two-account cookie isolation, Google client origin and private secret rotation are NOT proven by this check.");
    })
    .catch(error => {
      console.error("ANEVUM anonymous release preflight FAIL: " + error.message);
      process.exitCode = 1;
    });
}
