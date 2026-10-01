import { test } from "node:test";
import assert from "node:assert/strict";
import { proxyIren } from "../command-iren.mjs";
import { isStale, runtimeStatus } from "../src/lib/runtime-topology.ts";

const now = Date.parse("2026-09-30T15:00:00Z");
const credential = { token: "synthetic-access", source: "cloudflare_access" };
const foundationUrl = "https://foundation.example/v1/command/iren";

test("browser independently expires stale, missing, malformed and future observations", () => {
  for (const stamp of [null, "bad", "2026-09-30T14:56:59Z", "2026-09-30T15:01:00Z", "2026-09-30T15:00:00"]) {
    assert.equal(isStale({ observed_at: stamp, stale: false }, now), true);
  }
  assert.equal(isStale({ observed_at: "2026-09-30T15:00:00Z", stale: false }, now), false);
  assert.equal(isStale({ observed_at: "2026-09-30T15:00:00Z", stale: false }, now, true), true);
});

test("internal modules do not become offline services", () => {
  assert.equal(runtimeStatus({ independent_runtime: false, status: "UNKNOWN" }, true), "UNKNOWN");
  assert.equal(runtimeStatus({ independent_runtime: true, status: "RUNNING" }, true), "STALE");
});

test("anonymous read is rejected without upstream calls", async () => {
  let called = false;
  const response = await proxyIren(
    new Request("http://test"),
    async () => {
      called = true;
      throw Error("upstream must not be called");
    },
    { foundationUrl }
  );
  assert.equal(response.status, 401);
  assert.equal(called, false);
});

test("legacy credentials are rejected before private data access", async () => {
  let called = false;
  const response = await proxyIren(
    new Request("http://test"),
    async () => {
      called = true;
      throw Error("upstream must not be called");
    },
    {
      credential: { token: "legacy", source: "supabase" },
      foundationUrl
    }
  );
  assert.equal(response.status, 401);
  assert.equal(called, false);
});

test("canonical read bypasses RHEN and preserves Access assertion", async () => {
  const response = await proxyIren(
    new Request("http://test?ignored=1"),
    async (url, options) => {
      assert.equal(url, foundationUrl);
      assert.equal(options.headers["cf-access-jwt-assertion"], "synthetic-access");
      assert.equal(options.headers.authorization, undefined);
      return Response.json({ schema_version: "iren_command.v2", stale: false });
    },
    { credential, foundationUrl }
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("upstream outage and malformed contract fail closed", async () => {
  for (const upstream of [
    async () => { throw Error("sensitive provider detail"); },
    async () => Response.json({})
  ]) {
    const response = await proxyIren(
      new Request("http://test"),
      upstream,
      { credential, foundationUrl }
    );
    assert.equal(response.status, 503);
    assert.equal((await response.json()).stale, true);
  }
});

test("write proxy still requires Access authentication", async () => {
  const response = await proxyIren(
    new Request("http://test", { method: "POST" }),
    async () => {
      throw Error("upstream must not be called");
    },
    { foundationUrl }
  );
  assert.equal(response.status, 401);
});
