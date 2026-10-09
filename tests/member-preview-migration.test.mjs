import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
  assert.match(workflow, /member_billing_subscriptions/);
  assert.match(read("migrations/0003_member_billing.sql"), /REFERENCES "user"\("id"\) ON DELETE CASCADE/);
  const schema = read("migrations/0002_member_rhen_drafts.sql");
  assert.match(schema, /REFERENCES "user"\("id"\) ON DELETE CASCADE/);
  assert.doesNotMatch(schema, /account_tokens|access_token|trading_order/);
});
