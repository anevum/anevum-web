import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LEGACY_RHEN_RETIRED, retiredRhenBoundary, retiredRhenStatus } from "../src/server/legacy-rhen-retirement.mjs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("legacy RHEN retirement is deliberate and fails closed", () => {
  assert.equal(LEGACY_RHEN_RETIRED, true);
  const payload = retiredRhenStatus();
  assert.equal(payload.status, "SUSPENDED_FOR_REBUILD");
  assert.equal(payload.execution_enabled, false);
  assert.equal(payload.broker_workspace_available, false);
  assert.equal(payload.stale, true);
  assert.equal(payload.ok, false);
  assert.equal("positions" in payload, false);
  assert.equal("account_equity" in payload, false);
  assert.equal("historical_profit" in payload, false);
});

test("every former public trading, stream and research endpoint is suspended", () => {
  for (const route of [
    "/api/public/trading/live",
    "/api/public/trading/events",
    "/api/public/research/readiness",
    "/api/public/theory",
  ]) assert.equal(retiredRhenBoundary(route), "public", route);
});

test("all former operator routes stay behind Cloudflare Access even while retired", () => {
  for (const route of [
    "/api/command/live", "/api/command/stream", "/api/command/trader/status",
    "/api/command/trader/entries/enable", "/api/command/trader/position/close",
    "/api/command/iren/status", "/api/command/iren/configuration/accept",
    "/api/command/research/bootstrap"
  ]) assert.equal(retiredRhenBoundary(route), "operator", route);
  assert.equal(retiredRhenBoundary("/api/command/session"), null);
});

test("member auth, brokerage capability checks, billing and Commons APIs are not retired", () => {
  for (const route of [
    "/", "/products/rhen", "/api/member/brokerage", "/api/member/session",
    "/api/member/billing", "/api/auth/session", "/api/command/session",
    "/api/member/rhen/draft", "/apps/rhen"
  ]) assert.equal(retiredRhenBoundary(route), null, route);
});

test("Worker guards legacy routes before old fetch handlers and authenticates protected requests", () => {
  const worker = read("../worker.mjs");
  const guard = worker.indexOf("const retiredRhenAccess = retiredRhenBoundary(pathname)");
  const member = worker.indexOf("return await memberEndpoint(request, env, pathname)");
  const oldFeed = worker.indexOf('if (pathname === "/api/public/trading/events")');
  const proxy = worker.indexOf('if (pathname === "/api/command/live")');
  assert.ok(member < guard && guard < oldFeed && guard < proxy, "member auth before retirement, upstream after");
  const section = worker.slice(guard, oldFeed);
  assert.match(section, /await commandCredential\(request, env\)/);
  assert.match(section, /return jsonResponse\(retiredRhenStatus\(\), 503\)/);
  assert.doesNotMatch(section, /fetch\(/);
  assert.match(worker, /if \(pathname === "\/api\/command\/session"\)/);
});

test("browser surfaces disclose retirement and stop live transport retries", () => {
  const page = read("../src/pages/Live.tsx");
  const product = read("../src/pages/RhenProduct.tsx");
  const member = read("../src/pages/RhenApp.tsx");
  const hook = read("../src/hooks/useLiveTrading.ts");
  assert.match(page, /TRADING SUSPENDED \/ V5 REBUILD/);
  assert.match(page, /role="status"/);
  assert.match(product, /Legacy trading is suspended/);
  assert.match(member, /Legacy trading is suspended/);
  assert.match(hook, /const LEGACY_RHEN_REBUILD = true/);
  assert.match(hook, /if \(LEGACY_RHEN_REBUILD\) return/);
});

test("post-deploy owner Access audit recognizes retired RHEN without weakening policies", () => {
  const verify = read("../.github/workflows/verify-command-access.yml");
  const scope = read("../.github/workflows/command-access-member-cutover.yml");
  assert.match(verify, /"https:\/\/anevum.com\/api\/public\/trading\/live", "GET", \[503\]/);
  assert.match(verify, /"https:\/\/anevum.com\/api\/public\/research\/readiness", "GET", \[503\]/);
  assert.match(verify, /payload\.get\("status"\) != "SUSPENDED_FOR_REBUILD"/);
  assert.doesNotMatch(verify, /alpaca-trader-production-bf3e\.up\.railway\.app/);
  assert.match(verify, /Owner allow policy missing/);
  assert.match(verify, /app_uris in \(legacy_uris, member_uris\)/);
  assert.match(verify, /p\["decision"\] in \("allow","deny"\)/);
  assert.match(scope, /Apply reversible owner-only Access scope to the RHEN terminal/);
});
