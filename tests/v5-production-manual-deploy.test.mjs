import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("production Worker deploy is manual, pinned to approved main SHA and rollback", () => {
  const workflow = read(".github/workflows/deploy-production.yml");
  assert.match(workflow, /^name: Deploy ANEVUM Production/m);
  assert.match(workflow, /^on:\s*\n\s*#/m);
  assert.match(workflow, /^\s+workflow_dispatch:\s*\n\s+inputs:/m);
  assert.doesNotMatch(workflow, /^\s+push:\s*$/m);
  assert.doesNotMatch(workflow, /^\s+pull_request:\s*$/m);
  assert.match(workflow, /inputs\.confirmation == 'DEPLOY_ANEVUM_PRODUCTION_V5'/);
  assert.match(workflow, /inputs\.reviewed_head_sha == github\.sha/);
  assert.match(workflow, /inputs\.rollback_confirmed == 'PRODUCTION_ROLLBACK_VERIFIED'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.equal((workflow.match(/cloudflare\/wrangler-action@v3/g) ?? []).length, 1);
  const prerequisite = workflow.indexOf("Verify production member release prerequisites before deployment");
  const actual = workflow.indexOf("Deploy to Cloudflare Workers");
  assert.ok(prerequisite > 0 && actual > prerequisite);
});

test("no other GitHub workflow contains an unrestricted production Wrangler deploy", () => {
  const directory = new URL("../.github/workflows/", import.meta.url);
  const allowed = "deploy-production.yml";
  for (const file of readdirSync(directory, "utf8")) {
    if (!/\.ya?ml$/.test(file) || file === allowed) continue;
    const source = read(".github/workflows/" + file);
    // The staging flow is intentionally separate and requires pinned dispatch;
    // no second production Wrangler Action may slip into any workflow.
    assert.doesNotMatch(source, /uses:\s*cloudflare\/wrangler-action@v3/,
      "Unreviewed Wrangler Action in " + file);
  }
});
