import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PRODUCTION_ORIGIN, STAGING_ORIGIN, probeMemberProductionLaunch
} from "../scripts/probe-member-production-launch.mjs";

const getFile = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const protectedHeaders = {
  "content-type": "application/json",
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow"
};
function mockServer(overrides = {}) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    const path = new URL(url).pathname;
    const scope = new URL(url).origin;
    const key = scope + path;
    if (overrides[key]) return overrides[key];
    if (path === "/api/member/availability") {
      return Response.json({ available: true, provider: "google" }, { headers: protectedHeaders });
    }
    if (path === "/command") return new Response("<html></html>", {
      status: 200, headers: protectedHeaders
    });
    if (path === "/sign-in") return new Response("<html></html>", { status: 200 });
    if (path === "/api/auth/get-session") return Response.json(null, { headers: protectedHeaders });
    if (path.startsWith("/api/member/")) return Response.json({ message: "Sign in required" }, {
      status: 401, headers: protectedHeaders
    });
    if (path === "/command/operate") return new Response(null, {
      status: 308, headers: { location: PRODUCTION_ORIGIN + "/command/rhen/operate" }
    });
    if (path.startsWith("/command/rhen")) return new Response(null, {
      status: 302, headers: { location: "https://wispy-tooth-095a.cloudflareaccess.com/login" }
    });
    if (path.startsWith("/api/command/")) return new Response(null, {
      status: 403, headers: protectedHeaders
    });
    return new Response(null, { status: 404 });
  };
  return { calls, fetcher };
}

test("production launch probe uses only anonymous, read-only requests and proves closed operator authority", async () => {
  const mock = mockServer();
  const report = await probeMemberProductionLaunch(mock.fetcher);
  assert.equal(report.success, true);
  assert.ok(report.checks.length >= 14);
  assert.ok(mock.calls.every(({ url, init }) =>
    (url.startsWith(PRODUCTION_ORIGIN) || url.startsWith(STAGING_ORIGIN))
    && init.method === "GET" && init.redirect === "manual"
    && init.cache === "no-store" && !init.headers && !init.body
  ));
});

test("launch probe fails closed for a disabled production account backend", async () => {
  const mock = mockServer({
    [PRODUCTION_ORIGIN + "/api/member/availability"]:
      Response.json({ available: false, provider: null }, { headers: protectedHeaders })
  });
  await assert.rejects(probeMemberProductionLaunch(mock.fetcher), /did not become available/);
});

test("launch probe rejects a leaked member endpoint, missing no-store, or weak Access challenge", async () => {
  for (const patch of [
    {
      [PRODUCTION_ORIGIN + "/api/member/me"]:
        Response.json({ user: { id: "leaked" } }, { headers: protectedHeaders })
    },
    {
      [PRODUCTION_ORIGIN + "/api/member/export"]:
        Response.json({ message: "Sign in required" }, { status: 401 })
    },
    {
      [PRODUCTION_ORIGIN + "/command/rhen/operate"]:
        new Response("<html>unprotected</html>", { status: 200 })
    }
  ]) {
    await assert.rejects(probeMemberProductionLaunch(mockServer(patch).fetcher));
  }
});

test("production draft editing and privileged RHEN links cannot be activated by signup flag", () => {
  const config = JSON.parse(getFile("wrangler.jsonc"));
  const stage = JSON.parse(getFile("wrangler.member-staging.jsonc"));
  assert.equal(config.vars.ANEVUM_MEMBERS_ENABLED, "true");
  assert.equal(config.vars.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED, "false");
  assert.equal(config.vars.ANEVUM_MEMBER_PREVIEW_ENABLED, "false");
  assert.equal(config.vars.COMMAND_LIVE_STREAM_ENABLED, "false");
  assert.equal(stage.vars.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED, "true");
  assert.notEqual(config.d1_databases[0].database_id, stage.d1_databases[0].database_id);
  assert.match(getFile("worker.mjs"), /commandCredential\(request, env\)/);
  assert.doesNotMatch(getFile("scripts/probe-member-production-launch.mjs"),
    /method: "(?:POST|PUT|PATCH|DELETE)"|Cookie:|Authorization:|createOrder|brokerToken/);
});
