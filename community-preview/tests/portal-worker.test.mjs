import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const code = readFileSync(new URL("../worker.js", import.meta.url), "utf8");
let fetchHandler;
runInNewContext(code, {
  Request, Response, URL, console,
  addEventListener(type, callback) {
    assert.equal(type, "fetch");
    assert.equal(fetchHandler, undefined, "register only one fetch handler");
    fetchHandler = callback;
  }
}, { timeout: 2500 });

async function request(path, method = "GET") {
  let responsePromise;
  fetchHandler({
    request: new Request("https://next.anevum.com" + path, { method }),
    respondWith(promise) { responsePromise = promise; }
  });
  assert.ok(responsePromise, "the Worker responds to fetch");
  return await responsePromise;
}

test("homepage is an independent creator preview", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  assert.match(html, /MAKE IT\./);
  assert.match(html, /SHIP IT\./);
  assert.match(html, /projectSearch/);
  assert.match(html, /draftDialog/);
  assert.match(html, /localStorage/);
  assert.match(html, /not a live publishing network/);
});

test("drafts never pretend to be public published projects", async () => {
  const html = await (await request("/")).text();
  assert.match(html, /LOCAL DRAFT/);
  assert.match(html, /NOT PUBLISHED/);
  assert.match(html, /not on ANEVUM's servers/);
  assert.match(html, /No projects match yet/);
});

test("unknown paths and writes are denied", async () => {
  const missing = await request("/api/broker/positions");
  assert.equal(missing.status, 404);
  assert.equal((await request("/nonexistent")).status, 404);
  const post = await request("/", "POST");
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
});

test("preview has no indexation and no external script/network permissions", async () => {
  const response = await request("/");
  const policy = response.headers.get("content-security-policy");
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  assert.match(policy, /default-src 'none'/);
  assert.match(policy, /connect-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  const robots = await (await request("/robots.txt")).text();
  assert.match(robots, /Disallow: \/$/m);
});

test("health is read-only and HEAD avoids HTML body", async () => {
  const health = await request("/health");
  assert.equal(health.status, 200);
  assert.deepEqual(JSON.parse(await health.text()), {
    status: "ok", service: "anevum-community-preview", mode: "read-only"
  });
  const head = await request("/", "HEAD");
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});
