import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../worker.js", import.meta.url), "utf8");
let handler;
runInNewContext(source, {
  URL, Response, Request, Uint8Array, atob,
  addEventListener(name, listener) {
    assert.equal(name, "fetch");
    assert.equal(handler, undefined, "one fetch handler");
    handler = listener;
  }
}, { timeout: 10000 });

async function invoke(path, method = "GET") {
  let promise;
  const request = new Request("https://next.anevum.com" + path, { method });
  handler({ request, respondWith(p) { promise = p; } });
  assert.ok(promise, "the Worker handled the request");
  return await promise;
}

test("approved cinematic homepage is an explicitly fictional design preview", async () => {
  const response = await invoke("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  for (const text of [
    "BUILD", "SHARE", "PLAY", "TOGETHER", "ANEVUM",
    "INTERACTIVE DESIGN PREVIEW", "Illustrative projects",
    "Featured Projects", "Trending Right Now",
    "Apps & Tools", "Community", "Jams", "Portal",
    "const p=[", "const creators=["
  ]) assert.ok(html.includes(text), "expected preview marker: " + text);
});

test("original approved local artwork is served without external image dependencies", async () => {
  for (const asset of ["hero.webp", "aurora.webp", "flowstate.webp", "voxel.webp", "rift.webp", "profileavatar.webp", "jam.webp"]) {
    const response = await invoke("/assets/" + asset);
    assert.equal(response.status, 200, asset);
    assert.equal(response.headers.get("content-type"), "image/webp", asset);
    assert.ok((await response.arrayBuffer()).byteLength > 1000, asset);
  }
});

test("noindex headers and isolation CSP apply to the preview", async () => {
  const response = await invoke("/");
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  const csp = response.headers.get("content-security-policy");
  for (const directive of ["connect-src 'none'", "default-src 'none'", "frame-ancestors 'none'", "form-action 'none'"]) assert.ok(csp.includes(directive));
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  const robots = await (await invoke("/robots.txt")).text();
  assert.match(robots, /Disallow: \/$/m);
});

test("private API endpoints and mutating requests have no route", async () => {
  for (const path of ["/api/private/orders", "/command/rhen", "/studio", "/unrecognized"]) {
    assert.equal((await invoke(path)).status, 404, path);
  }
  const response = await invoke("/", "POST");
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("preview health and HEAD behavior disclose only non-sensitive state", async () => {
  const health = await invoke("/health");
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), {
    status: "ok", service: "anevum-community-preview", theme: "cinematic", mode: "illustrative-only"
  });
  const head = await invoke("/", "HEAD");
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});
