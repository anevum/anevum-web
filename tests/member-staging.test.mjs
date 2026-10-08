import test from "node:test";
import assert from "node:assert/strict";
import { stagingOrigin } from "../scripts/verify-member-staging.mjs";

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
