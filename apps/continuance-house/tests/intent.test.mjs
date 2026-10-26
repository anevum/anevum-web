import test from "node:test";
import assert from "node:assert/strict";
import { interpretCommand, SAFE_LINKS } from "../src/intent.mjs";

test("read-only status command switches to public signals", () => {
  assert.deepEqual(interpretCommand("show development status").kind, "view");
  assert.equal(interpretCommand("check github status").view, "signals");
});
test("CI question routes to read-only workflow results", () => {
  assert.equal(interpretCommand("Show CI checks").feed, "ci");
});
test("integration prompt routes to the right screen", () => {
  assert.equal(interpretCommand("Show integrations").view, "systems");
});
test("family commands remain preview-only", () => {
  assert.equal(interpretCommand("show stardust").view, "family");
});
test("destructive and privileged commands never execute", () => {
  for (const input of ["deploy the website", "merge PR", "pay someone", "unlock door", "delete records", "publish now", "disable access"]) {
    assert.notEqual(interpretCommand(input).kind, "link");
    assert.notEqual(interpretCommand(input).kind, "view");
  }
});
test("unknown requests do not pretend a language model exists", () => {
  assert.equal(interpretCommand("Explain quantum decoherence").kind, "not-connected");
});
test("safe links are literal allowlisted origins", () => {
  for (const link of Object.values(SAFE_LINKS)) {
    assert.equal(new URL(link).origin, "https://anevum.com");
  }
});
test("empty or overlong input cannot be processed", () => {
  assert.equal(interpretCommand("").kind, "invalid");
  assert.equal(interpretCommand("a".repeat(241)).kind, "invalid");
});
