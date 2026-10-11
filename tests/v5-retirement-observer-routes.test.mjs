import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LEGACY_RHEN_RETIRED,
  retiredRhenBoundary,
  retiredRhenStatus
} from "../src/server/legacy-rhen-retirement.mjs";

const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");

test("only exact, separately authenticated owner observations bypass retired RHEN", () => {
  assert.equal(LEGACY_RHEN_RETIRED, true);
  for (const path of [
    "/api/command/session",
    "/api/command/integrations/github",
    "/api/command/integrations/infrastructure"
  ]) {
    assert.equal(retiredRhenBoundary(path), null, path + " must reach its own guarded handler");
  }
  for (const path of [
    "/api/command/live",
    "/api/command/stream",
    "/api/command/trader/status",
    "/api/command/trader/entries/enable",
    "/api/command/trader/orders/cancel",
    "/api/command/iren/status",
    "/api/command/iren/command",
    "/api/command/integrations/railway",
    "/api/command/integrations/github/extra",
    "/api/command/integrations/infrastructure/extra",
    "/api/command/integrations/unregistered"
  ]) {
    assert.equal(retiredRhenBoundary(path), "operator", path + " must stay retired");
  }
  for (const path of [
    "/api/public/trading/live",
    "/api/public/trading/events",
    "/api/public/research/readiness",
    "/api/public/theory"
  ]) {
    assert.equal(retiredRhenBoundary(path), "public", path + " must stay suspended");
  }
  assert.equal(retiredRhenStatus().status, "SUSPENDED_FOR_REBUILD");
  assert.equal(retiredRhenStatus().execution_enabled, false);
});

test("owner observers are reachable only after the retirement gate, and authenticate before provider reads", () => {
  const boundary = worker.indexOf("const retiredRhenAccess = retiredRhenBoundary(pathname)");
  const githubStart = worker.indexOf('if (pathname === "/api/command/integrations/github")');
  const infraStart = worker.indexOf('if (pathname === "/api/command/integrations/infrastructure")');
  const next = worker.indexOf('if (pathname === "/api/command/iren/status")', infraStart);
  assert.ok(boundary > 0 && githubStart > boundary && infraStart > githubStart && next > infraStart);
  const github = worker.slice(githubStart, infraStart);
  const infra = worker.slice(infraStart, next);
  for (const [name, source, observer] of [
    ["github", github, "await observeOwnerGitHub()"],
    ["infrastructure", infra, "await observeOwnerInfrastructure(env)"]
  ]) {
    assert.match(source, /request\.method !== "GET"/, name + " must stay GET-only");
    assert.match(source, /url\.search/, name + " must reject arbitrary query input");
    const auth = source.indexOf("await commandCredential(request, env)");
    const read = source.indexOf(observer);
    assert.ok(auth >= 0 && read > auth, name + " must authenticate before upstream reads");
  }
  const retirementSection = worker.slice(boundary, worker.indexOf('if (pathname === "/api/public/trading/events")', boundary));
  assert.match(retirementSection, /return jsonResponse\(retiredRhenStatus\(\), 503\)/);
});
