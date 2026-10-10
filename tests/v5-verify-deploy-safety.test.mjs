import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("V5 verification never deploys the production Worker", () => {
  const verify = read(".github/workflows/anevum-verify.yml");
  assert.doesNotMatch(verify, /run:\s*npx wrangler deploy\b/);
  assert.doesNotMatch(verify, /cloudflare\/wrangler-action@/);
  assert.doesNotMatch(verify, /- name: Deploy production to Cloudflare\b/);
  assert.match(verify, /Enforce one guarded production Worker deployment/);
});

test("guarded release workflow is the only production deployment authority", () => {
  const release = read(".github/workflows/deploy-production.yml");
  assert.match(release, /name: Deploy ANEVUM Production/);
  assert.match(release, /concurrency:\s*\n\s+group: anevum-production/);
  const actions = release.match(/uses:\s*cloudflare\/wrangler-action@v3/g) ?? [];
  assert.equal(actions.length, 1);
  assert.equal((release.match(/command:\s*deploy\b/g) ?? []).length, 1);
  assert.ok(
    release.indexOf("Verify production member release prerequisites before deployment") <
    release.indexOf("Deploy to Cloudflare Workers")
  );
  assert.match(release, /verify-member-bindings\.mjs --require-live/);
});
