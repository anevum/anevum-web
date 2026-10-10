import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const path = file => readFileSync(new URL(file, import.meta.url), "utf8");

test("only guarded production workflow may deploy ANEVUM Worker", () => {
  const verify = path("../.github/workflows/anevum-verify.yml");
  const release = path("../.github/workflows/deploy-production.yml");
  assert.doesNotMatch(verify, /run:\s*npx wrangler deploy\b/);
  assert.doesNotMatch(verify, /cloudflare\/wrangler-action@/);
  assert.doesNotMatch(verify, /- name: Deploy production to Cloudflare\b/);
  assert.match(verify, /Enforce single guarded production Worker deployment/);

  assert.match(release, /name: Deploy ANEVUM Production/);
  assert.match(release, /concurrency:\s*\n\s+group: anevum-production/);
  const deployActions = release.match(/uses:\s*cloudflare\/wrangler-action@v3/g) ?? [];
  assert.equal(deployActions.length, 1, "one guarded Wrangler production deploy");
  assert.equal((release.match(/command:\s*deploy\b/g) ?? []).length, 1);
  assert.ok(
    release.indexOf("Verify production member release prerequisites before deployment") <
      release.indexOf("Deploy to Cloudflare Workers"),
    "production member preflight must precede the only deploy"
  );
  for (const prerequisite of [
    "verify-member-bindings.mjs --require-live",
    "BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
    "CLOUDFLARE_API_TOKEN", "MEMBER_DB",
    "PRAGMA foreign_key_check",
  ]) assert.ok(release.includes(prerequisite), prerequisite);
});

test("V5 retirement and member-safe staging tests remain mandatory", () => {
  const verify = path("../.github/workflows/anevum-verify.yml");
  const release = path("../.github/workflows/deploy-production.yml");
  assert.match(verify, /node --test tests\/legacy-rhen-retirement\.test\.mjs/);
  assert.match(release, /node --test tests\/legacy-rhen-retirement\.test\.mjs/);
  assert.match(release, /Verify production member launch boundaries/);
});
