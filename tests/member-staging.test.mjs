import test from "node:test";
import assert from "node:assert/strict";
import { stagingOrigin } from "../scripts/verify-member-staging.mjs";
import { resolveMemberOrigin } from "../src/server/member-preflight.mjs";
import { readFileSync } from "node:fs";

test("staging acceptance never targets production", () => {
  for (const origin of [
    "https://anevum.com",
    "http://test.anevum.com",
    "https://evil.example",
    "https://anevum.com.evil.example",
    "https://staging.anevum.com/path",
    "https://test.anevum.com?token=private",
    "https://me:secret@staging.anevum.com"
  ]) {
    assert.throws(() => stagingOrigin(origin));
  }
});
test("staging accepts only exact clean ANEVUM or workers.dev origins", () => {
  assert.equal(stagingOrigin("https://stage.anevum.com"), "https://stage.anevum.com");
  assert.equal(stagingOrigin("https://anevum-preview.example.workers.dev"), "https://anevum-preview.example.workers.dev");
});

test("activated staging is pinned to one verified HTTPS origin and preview D1", () => {
  const prod = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  const stage = JSON.parse(readFileSync(new URL("../wrangler.member-staging.jsonc", import.meta.url), "utf8"));
  const origin = "https://anevum-member-staging.devonakins.workers.dev";

  assert.equal(prod.vars.ANEVUM_MEMBERS_ENABLED, "false");
  assert.equal(prod.vars.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED, "false");
  assert.equal(prod.vars.ANEVUM_MEMBER_PREVIEW_ENABLED, "false");
  assert.equal(stage.name, "anevum-member-staging");
  assert.equal(stage.vars.ANEVUM_MEMBERS_ENABLED, "true");
  assert.equal(stage.vars.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED, "true");
  assert.equal(stage.vars.ANEVUM_MEMBER_PREVIEW_ENABLED, "true");
  assert.equal(stage.vars.MEMBER_PREVIEW_ORIGIN, origin);
  assert.equal(stage.d1_databases[0].database_id, "a537432e-d216-4b31-8b22-19662cc3a44a");
  assert.notEqual(stage.d1_databases[0].database_id, prod.d1_databases[0].database_id);
  assert.equal(stage.vars.COMMAND_LIVE_STREAM_ENABLED, "false");
  assert.equal(stage.routes, undefined);

  assert.equal(resolveMemberOrigin(new Request(origin + "/api/member/availability"), stage.vars), origin);
  assert.equal(resolveMemberOrigin(new Request("https://anevum.com/api/member/availability"), prod.vars), "https://anevum.com");
  assert.equal(resolveMemberOrigin(new Request("https://evil.example/api/member/availability"), stage.vars), null);
  for (const name of ["BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]) {
    assert.equal(Object.hasOwn(stage.vars, name), false);
    assert.equal(Object.hasOwn(prod.vars, name), false);
  }
});
