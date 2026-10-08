// Fail-closed audit for the independently deployed ANEVUM member staging Worker.
// Never let a staging deployment inherit production D1, routes, privileged RHEN
// operations, real secrets in source, or enabled accounts at bootstrap.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function load(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
const expected = "a537432e-d216-4b31-8b22-19662cc3a44a";
const production = "7f0d4c0c-2e85-4900-8504-1347954e1df1";
const schema = "migrations";
const privateNames = ["BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];
const errors = [];

function assert(ok, message) {
  if (!ok) errors.push(message);
}
function onePreviewDb(config, label, requireMigrationDir = true) {
  const bindings = config?.d1_databases;
  assert(Array.isArray(bindings) && bindings.length === 1, label + " must have exactly one D1 binding.");
  const db = Array.isArray(bindings) ? bindings[0] : null;
  assert(db?.binding === "MEMBER_DB", label + " must use MEMBER_DB.");
  assert(db?.database_name === "anevum-members-preview", label + " must bind preview D1 name.");
  assert(db?.database_id === expected, label + " must bind the verified preview UUID.");
  assert(db?.database_id !== production, label + " must not bind the production UUID.");
  if (requireMigrationDir) assert(db?.migrations_dir === schema, label + " must reference committed migrations.");
  // Generated configs rebase migration paths relative to dist; only validate\n  // the source migration directory. Deployed bindings are checked by exact UUID.
}

const prod = load("wrangler.jsonc");
const stage = load("wrangler.member-staging.jsonc");
const previewMigration = load("wrangler.preview-migrations.jsonc");

assert(prod?.vars?.ANEVUM_MEMBERS_ENABLED === "false", "Production signup must remain disabled.");
assert(prod?.vars?.ANEVUM_MEMBER_PREVIEW_ENABLED === "false", "Production preview identity must remain disabled.");
assert(prod?.d1_databases?.[0]?.database_id === production, "Production binding UUID changed.");
assert(prod?.previews?.d1_databases?.[0]?.database_id === expected, "Production preview binding UUID changed.");
assert(previewMigration?.d1_databases?.[0]?.database_id === expected, "Preview migrations target changed.");

assert(stage.name === "anevum-member-staging", "Staging Worker name must be isolated.");
assert(stage.workers_dev === true, "Staging must have its own workers.dev host.");
assert(stage.preview_urls !== true, "Staging must not expose extra randomized preview URLs.");
assert(!Object.hasOwn(stage, "routes") && !Object.hasOwn(stage, "route"), "Staging must not bind production routes.");
assert(!Object.hasOwn(stage, "custom_domains"), "Staging must not bind custom domains.");
assert(!Object.hasOwn(stage, "env"), "Staging deployment must use one explicit configuration.");
assert(stage?.vars?.ANEVUM_MEMBERS_ENABLED === "false", "Staging bootstrap must leave member signup disabled.");
assert(stage?.vars?.ANEVUM_MEMBER_PREVIEW_ENABLED === "false", "Staging bootstrap must not start OAuth before manual approval.");
assert(stage?.vars?.COMMAND_LIVE_STREAM_ENABLED === "false", "Staging must disable RHEN live command stream.");
assert(!Object.hasOwn(stage?.vars || {}, "MEMBER_PREVIEW_ORIGIN"), "Do not invent an unverified staging origin.");
assert(!Object.hasOwn(stage?.vars || {}, "CF_ACCESS_AUD") &&
       !Object.hasOwn(stage?.vars || {}, "CF_ACCESS_TEAM_DOMAIN") &&
       !Object.hasOwn(stage?.vars || {}, "COMMAND_ACCESS_EMAILS"),
       "Staging must not inherit live operator access credentials.");
assert(!Object.hasOwn(stage, "secrets"), "Never commit staging Worker secrets.");
assert(stage?.assets?.binding === "ASSETS" && stage?.assets?.run_worker_first === true, "Staging must use the same asset-aware Worker shape.");
onePreviewDb(stage, "Staging input");

for (const name of privateNames) {
  assert(!Object.hasOwn(stage?.vars || {}, name), "Secret " + name + " was added to staging vars.");
  assert(!Object.hasOwn(prod?.vars || {}, name), "Secret " + name + " was added to production vars.");
}

if (process.argv.includes("--generated")) {
  const redirect = resolve(".wrangler/deploy/config.json");
  assert(existsSync(redirect), "Cloudflare Vite generated config pointer is missing.");
  if (existsSync(redirect)) {
    const pointer = load(redirect);
    const output = resolve(dirname(redirect), String(pointer?.configPath || ""));
    assert(Boolean(pointer?.configPath) && existsSync(output), "Generated Wrangler deployment config missing.");
    if (existsSync(output)) {
      const generated = load(output);
      assert(generated?.name === stage.name, "Vite built the wrong Worker (could overwrite production).");
      assert(generated?.workers_dev === true, "Generated Worker must preserve workers.dev route.");
      assert(!Object.hasOwn(generated, "routes") && !Object.hasOwn(generated, "route"),
             "Generated Worker unexpectedly contains a production route.");
      assert(generated?.vars?.ANEVUM_MEMBERS_ENABLED === "false", "Generated Worker activated member signup.");
      assert(generated?.vars?.ANEVUM_MEMBER_PREVIEW_ENABLED === "false", "Generated Worker activated preview OAuth.");
      // Cloudflare Vite omits migrations_dir from deployment output by design.
      onePreviewDb(generated, "Staging generated", false);
      for (const name of privateNames) {
        assert(!Object.hasOwn(generated?.vars || {}, name), "Generated Worker includes secret " + name + " in source vars.");
      }
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error("STAGING GUARD FAIL: " + error);
  process.exitCode = 1;
} else {
  console.log("STAGING GUARD PASS: " + (process.argv.includes("--generated") ? "generated" : "source") +
    " Worker targets isolated preview D1; production member signup remains disabled.");
}
