import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inspectMemberBindings } from "../scripts/verify-member-bindings.mjs";

const prodID = "00000000-0000-4000-8000-000000000001";
const stageID = "00000000-0000-4000-8000-000000000002";
const binding = (name, id) => ({ binding: "MEMBER_DB", database_name: name, database_id: id, migrations_dir: "migrations" });
const config = () => ({
  vars: { ANEVUM_MEMBERS_ENABLED: "false", ANEVUM_MEMBER_PREVIEW_ENABLED: "false" },
  d1_databases: [binding("anevum-members", prodID)],
  previews: { d1_databases: [binding("anevum-members-preview", stageID)] }
});
const preview = () => ({ d1_databases: [binding("anevum-members-preview", stageID)] });

test("disabled clean repository passes without databases", () => {
  const result = inspectMemberBindings({
    vars: { ANEVUM_MEMBERS_ENABLED: "false", ANEVUM_MEMBER_PREVIEW_ENABLED: "false" },
    previews: {}
  });
  assert.equal(result.valid, true);
  assert.equal(result.state, "disabled-unconfigured");
});

test("fully separated D1 bindings pass release configuration gate", () => {
  assert.equal(inspectMemberBindings(config(), preview(), { requireConfig: true }).valid, true);
});

test("fails when preview reuses the production D1 ID", () => {
  const c = config();
  c.previews.d1_databases[0].database_id = prodID;
  const result = inspectMemberBindings(c, preview(), { requireConfig: true });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /must not share a D1 database_id/);
});

test("fails if preview migration points at different D1", () => {
  const p = preview();
  p.d1_databases[0].database_id = prodID;
  const result = inspectMemberBindings(config(), p, { requireConfig: true });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /preview migration target does not match/);
});

test("fails missing and placeholder database references", () => {
  const c = config();
  delete c.previews.d1_databases;
  c.d1_databases[0].database_id = "<UUID>";
  const result = inspectMemberBindings(c, preview(), { requireConfig: true });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /missing/);
  assert.match(result.errors.join("\n"), /not a real UUID/);
});

test("fails when secrets or preview authentication are in production source", () => {
  const c = config();
  c.vars.GOOGLE_CLIENT_SECRET = "not-a-real-secret";
  c.vars.ANEVUM_MEMBER_PREVIEW_ENABLED = "true";
  c.vars.MEMBER_PREVIEW_ORIGIN = "https://test.anevum.com";
  const result = inspectMemberBindings(c, preview());
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /Worker secret/);
  assert.match(result.errors.join("\n"), /must not enable preview identity/);
});

test("production activation needs both distinct D1 bindings", () => {
  const c = config();
  c.vars.ANEVUM_MEMBERS_ENABLED = "true";
  assert.equal(inspectMemberBindings(c, preview(), { requireLive: true }).valid, true);
  c.previews.d1_databases = [];
  assert.equal(inspectMemberBindings(c, preview(), { requireLive: true }).valid, false);
});

test("manual D1 provisioning uses supported Wrangler create options", () => {
  const workflow = readFileSync(new URL("../.github/workflows/member-d1-provision.yml", import.meta.url), "utf8");
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /CREATE_MEMBER_DATABASES/);
  assert.match(workflow, /npx wrangler d1 create "\$database"/);
  assert.doesNotMatch(workflow, /npx wrangler d1 create[^\n]*--json/);
  assert.match(workflow, /npx wrangler d1 list --json/);
});
