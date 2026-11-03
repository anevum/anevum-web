import test from "node:test";
import assert from "node:assert/strict";
import worker from "../scripts/ops/original-works-review-worker.mjs";

function envWithAssets(observed) {
  return {ASSETS: {async fetch(request) {
    observed.push(new URL(request.url).pathname);
    return new Response("<!doctype html><title>Review only</title>", {
      status: 200, headers: {"Content-Type": "text/html"}
    });
  }}};
}

test("serves only review prefix with noindex headers", async () => {
  const calls = [];
  const r = await worker.fetch(new Request("https://backstage.anevum.com/design/original-works/wiki/ovara"), envWithAssets(calls));
  assert.equal(r.status, 200);
  assert.deepEqual(calls, ["/design/original-works/wiki/ovara"]);
  assert.equal(r.headers.get("X-Robots-Tag"), "noindex, nofollow, noarchive");
  assert.equal(r.headers.get("Cache-Control"), "private, no-store");
  assert.equal(r.headers.get("Content-Security-Policy"), "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
});

test("out-of-scope paths remain unavailable", async () => {
  const calls = [];
  for (const path of ["/", "/member", "/api/auth", "/design/original-works-private"]) {
    const r = await worker.fetch(new Request("https://backstage.anevum.com" + path), envWithAssets(calls));
    assert.equal(r.status, 404, path);
  }
  assert.deepEqual(calls, []);
});

test("writes are never forwarded to static assets", async () => {
  const calls = [];
  const r = await worker.fetch(new Request("https://backstage.anevum.com/design/original-works", {method:"POST"}),envWithAssets(calls));
  assert.equal(r.status, 405);
  assert.deepEqual(calls, []);
});

test("missing assets binding fails closed", async () => {
  const r=await worker.fetch(new Request("https://backstage.anevum.com/design/original-works"), {});
  assert.equal(r.status,503);
});
