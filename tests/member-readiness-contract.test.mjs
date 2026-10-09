import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("owner-reviewed legal notices are no longer marked as drafts", () => {
  for (const path of ["src/pages/Privacy.tsx", "src/pages/Terms.tsx"]) {
    const document = read(path);
    assert.match(document, /Last reviewed October 8, 2026/);
    assert.doesNotMatch(document, /Draft for owner review/);
    assert.match(document, /\/me\/settings/);
  }
});

test("readiness workflow only gathers information and cannot auto-migrate or enable users", () => {
  const workflow = read(".github/workflows/member-public-readiness.yml");
  const liveProbe = read("scripts/probe-member-public-readiness.mjs");
  const config = JSON.parse(read("wrangler.jsonc"));
  const staging = JSON.parse(read("wrangler.member-staging.jsonc"));
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /branches: \[main\]/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.match(workflow, /npx wrangler d1 execute MEMBER_DB --remote --config wrangler\.jsonc --json/);
  assert.match(workflow, /--command "SELECT COUNT\(\*\) AS member_tables/);
  assert.doesNotMatch(workflow, /d1 migrations apply|wrangler deploy|wrangler secret put|wrangler d1 create/i);
  assert.doesNotMatch(liveProbe, /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/);
  assert.doesNotMatch(liveProbe, /Cookie\s*:|Authorization\s*:/);
  assert.equal(config.vars.ANEVUM_MEMBERS_ENABLED, "true");
  assert.equal(config.vars.ANEVUM_MEMBER_PREVIEW_ENABLED, "false");
  assert.equal(staging.vars.ANEVUM_MEMBERS_ENABLED, "true");
  assert.notEqual(config.d1_databases[0].database_id, staging.d1_databases[0].database_id);
});

test("independent release diagnostics gather all blocker types but fail closed overall", () => {
  const workflow = read(".github/workflows/member-public-readiness.yml");
  for (const id of ["production_secrets", "production_d1", "anonymous_routes"]) {
    assert.match(workflow, new RegExp("id: " + id + "\\n\\s*continue-on-error: true"));
    assert.match(workflow, new RegExp("steps\\." + id + "\\.outcome"));
  }
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /steps\.production_secrets\.outcome/);
  assert.match(workflow, /PRODUCTION_MEMBER_READINESS=PASS/);
  assert.match(workflow, /missing=0/);
  assert.match(workflow, /if \[ "\$missing" != '0' \]/);
  assert.match(workflow, /Production member readiness NOT approved/);
});

test("production migration still requires independent, affirmative operator confirmations", () => {
  const migration = read(".github/workflows/member-production-d1-migrate.yml");
  assert.match(migration, /workflow_dispatch:/);
  assert.doesNotMatch(migration, /on:\s*\n\s*push:/);
  for (const name of [
    "confirmation", "privacy_terms_approved", "staging_security_approved", "google_production_confirmed"
  ]) assert.match(migration, new RegExp(name));
  assert.match(migration, /MIGRATE_PRODUCTION_MEMBER_DB/);
  assert.match(migration, /ANEVUM_MEMBERS_ENABLED == "false"/);
  assert.match(migration, /d1 migrations apply MEMBER_DB --remote --config wrangler\.jsonc/);
  assert.match(migration, /member_rhen_drafts/);
  assert.match(migration, /migrations\/\*\.sql/);
});
