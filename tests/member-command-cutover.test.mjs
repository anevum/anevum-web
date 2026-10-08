import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { legacyOperatorTarget } from "../src/server/operator-routes.mjs";

test("member Command has no forced operator redirect", () => {
  for (const path of ["/", "/me", "/command", "/command/rhen", "/command/rhen/operate", "/command/rhen/review", "/apps/rhen/evidence", "/commanded"]) {
    assert.equal(legacyOperatorTarget(path), null, "Unexpected redirect: " + path);
  }
});

test("old terminal routes only redirect to the protected RHEN subtree", () => {
  const redirects = {
    "/command/operate": "/command/rhen/operate",
    "/command/discover": "/command/rhen/discover",
    "/command/review": "/command/rhen/review",
    "/command/system": "/command/rhen/system",
    "/command/topology": "/command/rhen/topology",
    "/command/iren": "/command/rhen/iren",
    "/apps/rhen/terminal": "/command/rhen/operate",
    "/apps/rhen/terminal/operate": "/command/rhen/operate",
    "/apps/rhen/command": "/command/rhen/operate",
    "/apps/rhen/command/review": "/command/rhen/review",
    "/private": "/command/rhen/operate",
    "/iren": "/command/rhen/operate",
    "/rhenlink": "/command/rhen/operate"
  };
  for (const [source, expected] of Object.entries(redirects)) {
    assert.equal(legacyOperatorTarget(source), expected, source);
  }
});

test("edge routes legacy operator links before delivering public SPA HTML", () => {
  const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");
  assert.match(worker, /import \{ legacyOperatorTarget \} from "\.\/src\/server\/operator-routes\.mjs"/);
  const legacy = worker.indexOf("legacyOperatorTarget(pathname)");
  const assets = worker.indexOf("env.ASSETS.fetch(request)");
  assert.ok(legacy > 0 && assets > legacy, "Legacy redirects must run before the asset fallback");
  assert.match(worker, /Response\.redirect\(new URL\(operatorDestination, request\.url\)\.toString\(\), 308\)/);
});

test("unknown protected operator APIs never fall back to anonymous public assets", () => {
  const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");
  const apiGuard = worker.indexOf('pathname === "/api/command" || pathname.startsWith("/api/command/")');
  const assets = worker.indexOf("env.ASSETS.fetch(request)");
  assert.ok(apiGuard > 0 && assets > apiGuard, "Protected operator API fallback must execute before public assets");
  assert.match(worker, /commandCredential\(request, env\)/);
  assert.match(worker, /pathname\.startsWith\("\/api\/command\/trader\/"\)/);
  assert.doesNotMatch(worker, /ANEVUM_MEMBERS_ENABLED\s*===\s*"true"\s*\?\s*commandCredential/);
});

test("production and staging live trading privileges remain unchanged", () => {
  const prod = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  const stage = JSON.parse(readFileSync(new URL("../wrangler.member-staging.jsonc", import.meta.url), "utf8"));
  assert.equal(prod.vars.ANEVUM_MEMBERS_ENABLED, "false");
  assert.equal(prod.vars.ANEVUM_MEMBER_PREVIEW_ENABLED, "false");
  assert.equal(stage.vars.COMMAND_LIVE_STREAM_ENABLED, "false");
  assert.equal(stage.d1_databases[0].database_name, "anevum-members-preview");
  assert.notEqual(stage.d1_databases[0].database_id, prod.d1_databases[0].database_id);
});
