import { test } from "node:test";
import assert from "node:assert/strict";
import { proxyIren } from "../command-iren.mjs";
import { isStale, runtimeStatus } from "../src/lib/runtime-topology.ts";
const now = Date.parse("2026-09-30T15:00:00Z");
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
  const response = await proxyIren(new Request("http://test"), () => { throw Error("unexpected"); });
  assert.equal(response.status, 401);
});
test("authorization precedes private data access", async () => {
  await assert.rejects(() => proxyIren(new Request("http://test", { headers: { authorization: "Bearer nonadmin" } }),
    async () => { throw Error("forbidden"); }, () => { throw Error("upstream must not be called"); }), /forbidden/);
});
test("canonical read bypasses RHEN and preserves JWT", async () => {
  const response = await proxyIren(new Request("http://test?ignored=1", { headers: { authorization: "Bearer synthetic" } }),
    async token => assert.equal(token, "synthetic"), async (url, options) => {
      assert.match(url, /supabase.co\/functions\/v1\/iren-command$/);
      assert.equal(options.headers.authorization, "Bearer synthetic");
      return Response.json({ schema_version: "iren_command.v2", stale: false });
    });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
test("upstream outage and malformed contract fail closed", async () => {
  for (const upstream of [async () => { throw Error("sensitive provider detail"); }, async () => Response.json({})]) {
    const response = await proxyIren(new Request("http://test", { headers: { authorization: "Bearer synthetic" } }), async () => {}, upstream);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).stale, true);
  }
});
test("write proxy still requires private authentication", async () => {
  assert.equal((await proxyIren(new Request("http://test", { method: "POST" }), () => {})).status, 401);
});
