import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { memberConfigured, memberEndpoint } from "../src/server/member.mjs";

test("member accounts fail closed without all dependencies", () => {
  assert.equal(memberConfigured({}), false);
  assert.equal(memberConfigured({ ANEVUM_MEMBERS_ENABLED: "true" }), false);
  assert.equal(memberConfigured({
    ANEVUM_MEMBERS_ENABLED: "true",
    MEMBER_DB: { prepare() {} },
    GOOGLE_CLIENT_ID: "fake",
    GOOGLE_CLIENT_SECRET: "fake",
    BETTER_AUTH_SECRET: "x".repeat(31)
  }), false);
});

test("unprovisioned membership announces no signup", async () => {
  const response = await memberEndpoint(
    new Request("https://anevum.com/api/member/availability"),
    { ANEVUM_MEMBERS_ENABLED: "false" },
    "/api/member/availability"
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { available: false, provider: null });
});

test("unprovisioned private member APIs never expose state", async () => {
  for (const path of [
    "/api/auth/sign-in/social",
    "/api/member/me",
    "/api/member/session",
    "/api/member/entitlements",
    "/api/member/export",
    "/api/member/saved-apps/rhen"
  ]) {
    const response = await memberEndpoint(
      new Request("https://anevum.com" + path),
      { ANEVUM_MEMBERS_ENABLED: "false" },
      path
    );
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  }
});

test("new accounts never redefine protected RHEN operator APIs", () => {
  const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");
  const members = readFileSync(new URL("../src/server/member.mjs", import.meta.url), "utf8");
  const sql = readFileSync(new URL("../migrations/0001_member_platform.sql", import.meta.url), "utf8");

  assert.match(worker, /pathname\.startsWith\("\/api\/member\/"\)/);
  assert.match(worker, /pathname\.startsWith\("\/api\/command\/trader\/"\)/);
  assert.match(worker, /commandCredential\(request, env\)/);
  assert.match(members, /disableImplicitLinking: true/);
  assert.match(members, /encryptOAuthTokens: true/);
  assert.match(members, /requireEmailVerification: true/);
  assert.match(members, /storage: "database"/);
  assert.match(members, /user\.id/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS member_entitlements/);
  assert.match(sql, /REFERENCES "user"\("id"\) ON DELETE CASCADE/);
  assert.doesNotMatch(members, /proxyTrader|TRADER_BASE|EXECUTION_ENABLED|BOT_ARMED/);
});
