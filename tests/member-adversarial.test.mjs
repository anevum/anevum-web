import test from "node:test";
import assert from "node:assert/strict";
import { safeMutation, safeJSON, memberEndpoint } from "../src/server/member.mjs";
import { resolveMemberOrigin } from "../src/server/member-preflight.mjs";

const staging = "https://anevum-member-staging.devonakins.workers.dev";
const prod = "https://anevum.com";
const mutation = (url, origin) => new Request(url, {
  method: "PATCH",
  headers: origin ? { Origin: origin, "content-type": "application/json" } : { "content-type": "application/json" },
  body: JSON.stringify({ displayName: "Sample" })
});

test("same-origin member mutations accept only an exact HTTPS Origin", () => {
  assert.equal(safeMutation(mutation(staging + "/api/member/me", staging), staging), true);
  assert.equal(safeMutation(mutation(prod + "/api/member/me", prod), prod), true);
  for (const [url, origin, expected] of [
    [staging + "/api/member/me", null, staging],
    [staging + "/api/member/me", prod, staging],
    [staging + "/api/member/me", "https://anevum.com.evil.example", staging],
    [staging + "/api/member/me", staging + "/extra", staging],
    [staging + "/api/member/me", staging.replace("https:", "http:"), staging],
    [prod + "/api/member/me", staging, prod],
    [staging + "/api/member/me", staging, prod],
    [staging.replace("https:", "http:") + "/api/member/me", staging, staging]
  ]) assert.equal(safeMutation(mutation(url, origin), expected), false);
});

test("preview Origin must be deliberately enabled and is never trusted by production", () => {
  const stageConfig = {
    ANEVUM_MEMBER_PREVIEW_ENABLED: "true",
    MEMBER_PREVIEW_ORIGIN: staging
  };
  assert.equal(resolveMemberOrigin(new Request(staging + "/api/member/me"), stageConfig), staging);
  assert.equal(resolveMemberOrigin(new Request(staging + "/api/member/me"), {
    ...stageConfig, ANEVUM_MEMBER_PREVIEW_ENABLED: "false"
  }), null);
  assert.equal(resolveMemberOrigin(new Request("https://evil.example/api/member/me"), stageConfig), null);
  assert.equal(resolveMemberOrigin(new Request(prod + "/api/member/me"), {
    ANEVUM_MEMBER_PREVIEW_ENABLED: "false"
  }), prod);
});

const bodyRequest = (value, headers = { "content-type": "application/json" }) =>
  new Request(staging + "/api/member/me", { method: "PATCH", headers, body: value });

test("member profile JSON accepts only small structured objects", async () => {
  assert.deepEqual(await safeJSON(bodyRequest('{"displayName":"Sample","theme":"system"}')), {
    displayName: "Sample", theme: "system"
  });
  assert.deepEqual(await safeJSON(bodyRequest('{"theme":"dark"}', {
    "content-type": "application/json; charset=utf-8"
  })), { theme: "dark" });

  await assert.rejects(safeJSON(bodyRequest('{"theme":"dark"}', {
    "content-type": "text/plain"
  })), /JSON body required/);
  await assert.rejects(safeJSON(bodyRequest('not-json')), SyntaxError);
  await assert.rejects(safeJSON(bodyRequest("null")), /Invalid object/);
  await assert.rejects(safeJSON(bodyRequest("[]")), /Invalid object/);
  await assert.rejects(safeJSON(bodyRequest('{"x":"' + "x".repeat(2050) + '"}')), /too large/);
});

test("no credentials means disabled signup and inaccessible private data even with forged Origin", async () => {
  const disabled = {
    ANEVUM_MEMBERS_ENABLED: "false",
    MEMBER_DB: { prepare() { throw new Error("should not execute"); } }
  };
  const availability = await memberEndpoint(
    new Request(prod + "/api/member/availability"), disabled,
    "/api/member/availability"
  );
  assert.deepEqual(await availability.json(), { available: false, provider: null });

  for (const path of [
    "/api/member/me", "/api/member/export", "/api/member/entitlements",
    "/api/member/saved-apps/rhen", "/api/auth/get-session"
  ]) {
    const request = mutation(prod + path, prod);
    const result = await memberEndpoint(request, disabled, path);
    assert.equal(result.status, 503, path);
    assert.equal(result.headers.get("cache-control"), "private, no-store");
    assert.match(result.headers.get("x-robots-tag") || "", /noindex/);
  }
});
