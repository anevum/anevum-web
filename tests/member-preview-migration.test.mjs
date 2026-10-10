import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("production and preview member D1 resources use verified distinct identities", () => {
  const config = JSON.parse(read("wrangler.jsonc"));
  const migration = JSON.parse(read("wrangler.preview-migrations.jsonc"));
  const production = config.d1_databases.find(x => x.binding === "MEMBER_DB");
  const preview = config.previews.d1_databases.find(x => x.binding === "MEMBER_DB");
  const target = migration.d1_databases.find(x => x.binding === "MEMBER_DB");
  assert.equal(production.database_name, "anevum-members");
  assert.equal(preview.database_name, "anevum-members-preview");
  assert.notEqual(production.database_id, preview.database_id);
  assert.deepEqual(preview, target);
  assert.equal(config.vars.ANEVUM_MEMBERS_ENABLED, "true");
  assert.equal(config.vars.ANEVUM_MEMBER_PREVIEW_ENABLED, "false");
});

test("schema automation can only migrate preview D1 after main-branch merge", () => {
  const workflow = read(".github/workflows/member-preview-d1-migrate.yml");
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /github\.event_name == 'push'/);
  assert.match(workflow, /--require-config/);
  assert.match(workflow, /ANEVUM_MEMBERS_ENABLED == "false"/);
  assert.match(workflow, /d1 migrations apply MEMBER_DB --remote --config wrangler\.preview-migrations\.jsonc/);
  assert.doesNotMatch(workflow, /d1 migrations apply[^\n]*(?<!preview-)migrations\.jsonc/);
  assert.doesNotMatch(workflow, /d1 migrations apply[^\n]*--config wrangler\.jsonc/);
  assert.match(workflow, /secrets\.CLOUDFLARE_D1_TOKEN/);
  assert.doesNotMatch(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /PRAGMA foreign_key_check/);
  assert.match(workflow, /member_rhen_drafts/);
  assert.match(workflow, /member_rhen_workspaces/);
  const schema = read("migrations/0002_member_rhen_drafts.sql");
  assert.match(schema, /REFERENCES "user"\("id"\) ON DELETE CASCADE/);
  assert.doesNotMatch(schema, /account_tokens|access_token|trading_order/);
  const workspaces = read("migrations/0004_member_rhen_workspaces.sql");
  assert.match(workspaces, /REFERENCES "user"\("id"\) ON DELETE CASCADE/);
  assert.match(workspaces, /UNIQUE/);
  assert.doesNotMatch(workspaces, /alpaca|token|orders|broker_id/i);
});


test("workspace migration avoids the applied billing 0003 filename without rewriting preview history", () => {
  const files = readdirSync(new URL("migrations/", root))
    .filter(name => name.endsWith(".sql")).sort();
  assert.deepEqual(files, [
    "0001_member_platform.sql",
    "0002_member_rhen_drafts.sql",
    "0003_member_billing.sql",
    "0004_member_rhen_workspaces.sql"
  ]);
  // The preview already records 0003 billing from unmerged PR #240. Copy
  // only the byte-identical reviewed SQL file; no checkout or billing runtime.
  const billing = Buffer.from(read("migrations/0003_member_billing.sql"));
  const billingBlob = createHash("sha1")
    .update(Buffer.from("blob " + billing.length + "\0"))
    .update(billing)
    .digest("hex");
  assert.equal(billingBlob, "54333fa22dfce87a58e16e3e85b2d27a59b33544");
  assert.match(billing.toString("utf8"), /CREATE TABLE IF NOT EXISTS member_billing_customers/);
  assert.doesNotMatch(billing.toString("utf8"), /CREATE TRIGGER|DROP TABLE|DELETE FROM|ALTER TABLE|alpaca|broker_account|place_order/i);
  const workspace = read("migrations/0004_member_rhen_workspaces.sql");
  assert.match(workspace, /CREATE TABLE IF NOT EXISTS member_rhen_workspaces/);
  assert.match(workspace, /REFERENCES "user"\("id"\) ON DELETE CASCADE/);
  assert.doesNotMatch(workspace, /\bDROP\s+TABLE\b|\bDELETE\s+FROM\b|\bUPDATE\s+member_rhen_workspaces\b/i);
  assert.doesNotMatch(workspace, /broker_account|access_token|order_id|payment_intent/i);
});

test("preview migration workflow fails closed unless workspace 0004 is recorded in the ledger", () => {
  const workflow = read(".github/workflows/member-preview-d1-migrate.yml");
  assert.match(workflow, /0004_member_rhen_workspaces\.sql/);
  assert.match(workflow, /workspace_migration_registered/);
  assert.match(workflow, /d1_migrations/);
  assert.match(workflow, /--config wrangler\.preview-migrations\.jsonc/);
  assert.doesNotMatch(workflow, /d1 migrations apply MEMBER_DB --remote --config wrangler\.jsonc/);
});


test("missing preview D1 ledger source blocks all future preview writes", () => {
  const workflow = read(".github/workflows/member-preview-d1-migrate.yml");
  const provenance = workflow.indexOf("Block migrations if preview history has no reviewed local SQL source");
  const applies = workflow.indexOf("npx wrangler d1 migrations apply MEMBER_DB");
  assert.ok(provenance > 0 && applies > provenance,
    "Preview provenance validation must happen strictly before the first migration apply.");
  assert.match(workflow, /SELECT name FROM d1_migrations ORDER BY id/);
  assert.match(workflow, /node scripts\/verify-preview-d1-ledger\.mjs/);
  assert.match(workflow, /CLOUDFLARE_D1_TOKEN/);
  assert.match(workflow, /wrangler\.preview-migrations\.jsonc/);
  assert.doesNotMatch(workflow, /--config wrangler\.jsonc/);
  const validator = read("scripts/verify-preview-d1-ledger.mjs");
  assert.match(validator, /PREVIEW_LINEAGE_BLOCKED/);
  assert.match(validator, /missing reviewed source for applied/);
  assert.doesNotMatch(validator, /cloudflare\.request|d1 execute|d1 migrations apply/);
});
