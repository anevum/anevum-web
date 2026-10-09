// Read-only post-deploy probe for the deliberately activated ANEVUM member service.
// No cookies, account data, secret values, credential submission or mutation.
// This does not prove a real OAuth callback or two logged-in account isolation.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PRODUCTION_ORIGIN = "https://anevum.com";
export const STAGING_ORIGIN = "https://anevum-member-staging.devonakins.workers.dev";
const ACCESS_HOST = "wispy-tooth-095a.cloudflareaccess.com";

export async function probeMemberProductionLaunch(request = fetch) {
  const checks = [];
  const get = (base, path) => request(base + path, {
    method: "GET", redirect: "manual", cache: "no-store",
    signal: AbortSignal.timeout(15000)
  });
  const expect = (label, response, allowed) => {
    if (!allowed.includes(response.status)) {
      throw new Error(label + " unexpected HTTP " + response.status);
    }
    checks.push(label);
  };
  const privateResponse = (label, response) => {
    if (!(response.headers.get("cache-control") || "").includes("no-store") ||
        !(response.headers.get("x-robots-tag") || "").includes("noindex")) {
      throw new Error(label + " missing private/noindex headers.");
    }
  };
  const readJson = async (label, response) => {
    expect(label, response, [200]);
    if (!(response.headers.get("content-type") || "").includes("application/json")) {
      throw new Error(label + " response is not JSON.");
    }
    privateResponse(label, response);
    return response.json();
  };

  const production = await readJson("production Google availability",
    await get(PRODUCTION_ORIGIN, "/api/member/availability"));
  if (production.available !== true || production.provider !== "google") {
    throw new Error("Production member sign-in did not become available.");
  }

  const staging = await readJson("staging Google availability",
    await get(STAGING_ORIGIN, "/api/member/availability"));
  if (staging.available !== true || staging.provider !== "google") {
    throw new Error("Independent staging member sign-in is unavailable.");
  }

  const memberHome = await get(PRODUCTION_ORIGIN, "/command");
  expect("public-safe Command root", memberHome, [200]);
  privateResponse("public-safe Command root", memberHome);

  const signin = await get(PRODUCTION_ORIGIN, "/sign-in");
  expect("production sign-in page", signin, [200]);

  const authSession = await get(PRODUCTION_ORIGIN, "/api/auth/get-session");
  expect("anonymous auth session route", authSession, [200]);
  if (!(authSession.headers.get("content-type") || "").includes("application/json")) {
    throw new Error("Production Better Auth session endpoint is not JSON.");
  }

  for (const path of [
    "/api/member/me", "/api/member/session", "/api/member/export",
    "/api/member/entitlements", "/api/member/rhen/draft",
    "/api/member/rewards", "/api/member/brokerage"
  ]) {
    const response = await get(PRODUCTION_ORIGIN, path);
    expect("anonymous member access denied " + path, response, [401]);
    privateResponse("anonymous member access denied " + path, response);
  }

  const legacy = await get(PRODUCTION_ORIGIN, "/command/operate");
  expect("legacy operator redirect remains protected", legacy, [308]);
  const legacyDestination = new URL(legacy.headers.get("location") || "", PRODUCTION_ORIGIN);
  if (legacyDestination.origin !== PRODUCTION_ORIGIN ||
      legacyDestination.pathname !== "/command/rhen/operate") {
    throw new Error("Operator alias escaped the protected RHEN Terminal.");
  }

  for (const path of ["/command/rhen", "/command/rhen/operate"]) {
    const response = await get(PRODUCTION_ORIGIN, path);
    expect("RHEN Terminal Access challenge " + path, response, [302, 303]);
    if (new URL(response.headers.get("location") || "", PRODUCTION_ORIGIN).hostname !== ACCESS_HOST) {
      throw new Error("Protected RHEN Terminal escaped Cloudflare Access.");
    }
  }

  for (const path of ["/api/command/trader/status", "/api/command/unknown"]) {
    const response = await get(PRODUCTION_ORIGIN, path);
    expect("operator API denied " + path, response, [302, 303, 401, 403]);
    if ([302, 303].includes(response.status) &&
        new URL(response.headers.get("location") || "", PRODUCTION_ORIGIN).hostname !== ACCESS_HOST) {
      throw new Error("Protected operator API escaped Cloudflare Access.");
    }
  }

  return { success: true, checks };
}

const direct = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  probeMemberProductionLaunch().then(({ checks }) => {
    console.log("ANEVUM production member anonymous launch probe: PASS (" + checks.length + " checks)");
    checks.forEach(check => console.log("PASS " + check));
    console.log("Real Google callback, member sign-in, private secret rotation and authenticated tenant isolation need separate acceptance.");
  }).catch(error => {
    console.error("ANEVUM production member launch probe: FAIL: " + error.message);
    process.exitCode = 1;
  });
}
