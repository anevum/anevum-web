// Fail-closed audit for the independently deployed ANEVUM member staging Worker.
// Never let a staging deployment inherit production D1, routes, privileged RHEN
// operations or real secrets in source. Only the verified staging origin may enable OAuth.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function load(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
const expected = "a537432e-d216-4b31-8b22-19662cc3a44a";
const production = "7f0d4c0c-2e85-4900-8504-1347954e1df1";
const schema = "migrations";
const verifiedStagingOrigin = "https://anevum-member-staging.devonakins.workers.dev";
const privateNames = ["BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
  "ALPACA_CONNECT_CLIENT_ID", "ALPACA_CONNECT_CLIENT_SECRET",
  "ALPACA_CONNECT_TOKEN_KEY_BASE64", "ANEVUM_OWNER_BROKER_ACCOUNT_ID"];
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
  // Generated configs rebase migration paths relative to dist; only validate
  // the source migration directory. Deployed bindings are checked by exact UUID.
}

const prod = load("wrangler.jsonc");
const stage = load("wrangler.member-staging.jsonc");
const previewMigration = load("wrangler.preview-migrations.jsonc");

assert(prod?.vars?.ANEVUM_MEMBERS_ENABLED === "true", "The release candidate must explicitly opt into production members.");
assert(prod?.vars?.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED === "false", "Production personal draft settings must remain disabled.");
assert(prod?.vars?.ANEVUM_COMMONS_ENABLED === "false", "Production Commons must remain disabled.");
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
assert(stage?.vars?.ANEVUM_MEMBERS_ENABLED === "true", "Only staging OAuth test accounts may be enabled.");
assert(stage?.vars?.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED === "true", "Only staging may expose authenticated RHEN draft settings.");
assert(stage?.vars?.ANEVUM_COMMONS_ENABLED === "true", "Staging Commons is gated by invitations and preview D1.");
assert(stage?.vars?.ANEVUM_MEMBER_PREVIEW_ENABLED === "true", "Staging test OAuth must use explicitly enabled preview identity.");
assert(stage?.vars?.COMMAND_LIVE_STREAM_ENABLED === "false", "Staging must disable RHEN live command stream.");
assert(stage?.vars?.MEMBER_PREVIEW_ORIGIN === verifiedStagingOrigin, "Staging identity must use its exact verified HTTPS origin.");
const alpacaLockedFlags = [
  "ANEVUM_ALPACA_LIVE_CONNECT_ENABLED",
  "ANEVUM_ALPACA_PROVIDER_LIVE_APPROVED",
  "ANEVUM_ALPACA_COMMERCIAL_USE_APPROVED",
  "ANEVUM_ALPACA_LIVE_SNAPSHOT_ENABLED"
];
for (const flag of alpacaLockedFlags) {
  assert(prod?.vars?.[flag] === "false", "Production must keep " + flag + " disabled until independent approval.");
  assert(stage?.vars?.[flag] === "false", "Staging must keep " + flag + " disabled until independent approval.");
}
const stageVarsAllowed = new Set(["COMMAND_AUTH_MODE", "COMMAND_LIVE_STREAM_ENABLED", "ANEVUM_MEMBERS_ENABLED", "ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED", "ANEVUM_COMMONS_ENABLED", "ANEVUM_MEMBER_PREVIEW_ENABLED", "MEMBER_PREVIEW_ORIGIN", ...alpacaLockedFlags]);
for (const name of Object.keys(stage.vars || {})) {
  assert(stageVarsAllowed.has(name), "Unexpected variable in staging config: " + name);
}
assert(stage?.vars?.COMMAND_AUTH_MODE === "cloudflare_access", "Staging must keep operator access guarded.");
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
      assert(generated?.vars?.ANEVUM_MEMBERS_ENABLED === "true", "Generated Worker lost the explicit staging-only OAuth gate.");
      assert(generated?.vars?.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED === "true", "Generated Worker lost staging-only draft gate.");
      assert(generated?.vars?.ANEVUM_COMMONS_ENABLED === "true", "Generated staging must retain the invitation-gated Commons flag.");
      assert(generated?.vars?.ANEVUM_MEMBER_PREVIEW_ENABLED === "true", "Generated Worker lost its staging preview gate.");
      assert(generated?.vars?.MEMBER_PREVIEW_ORIGIN === verifiedStagingOrigin, "Generated Worker uses an unverified OAuth origin.");
      assert(generated?.vars?.COMMAND_LIVE_STREAM_ENABLED === "false", "Generated staging Worker enabled live RHEN command stream.");
      for (const flag of alpacaLockedFlags) {
        assert(generated?.vars?.[flag] === "false", "Generated staging Worker enabled unapproved Alpaca feature: " + flag);
      }
      assert(!Object.hasOwn(generated?.vars || {}, "CF_ACCESS_AUD") &&
             !Object.hasOwn(generated?.vars || {}, "CF_ACCESS_TEAM_DOMAIN") &&
             !Object.hasOwn(generated?.vars || {}, "COMMAND_ACCESS_EMAILS"),
             "Generated staging Worker inherited protected RHEN operator authorization.");
      for (const name of Object.keys(generated.vars || {})) {
        assert(stageVarsAllowed.has(name), "Unexpected generated staging variable: " + name);
      }
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
    " Worker targets isolated preview D1 with exact OAuth origin; production member signup is a separate top-level Worker authorization domain.");
}
