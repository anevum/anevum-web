import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname, "../web");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(resolve(root, "public/site.webmanifest"), "utf8"));

test("anevum.com supplies PWA and social share metadata before JavaScript executes", () => {
  for (const name of ["apple-touch-icon.png","site.webmanifest","og:image","twitter:image","summary_large_image"]) {
    assert.ok(html.includes(name), "Missing " + name);
  }
  assert.ok(html.includes("https://anevum.com/anevum-social-share-v2.png"));
  assert.ok(!html.includes("anevum-social-share-v1.png"));
  const svg = readFileSync(resolve(root,"public/anevum-social-share.svg"),"utf8");
  assert.ok(svg.includes(">ANEVUM.COM</text>"));
  assert.ok(!svg.includes("A.ANEVUM.COM"));
  assert.ok(!html.includes("https://a.anevum.com/anevum-social-share-v2.png"));
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
});

test("Orbit raster assets exist at expected exact dimensions", () => {
  for (const [name, width, height] of [
    ["apple-touch-icon.png", 180, 180],
    ["icon-192.png", 192, 192],
    ["icon-512.png", 512, 512],
    ["anevum-social-share-v2.png", 1200, 630],
  ]) {
    const b = readFileSync(resolve(root, "public", name));
    assert.equal(b.subarray(0,8).toString("hex"), "89504e470d0a1a", name + " PNG signature");
    assert.equal(b.readUInt32BE(16), width, name + " width");
    assert.equal(b.readUInt32BE(20), height, name + " height");
  }
});
