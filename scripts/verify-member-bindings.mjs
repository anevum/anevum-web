// Member activation release guard. No Cloudflare credentials or remote API calls.
// This repository intentionally keeps signup disabled until operator sign-off.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECRET_NAMES = ["BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];

function binding(config, scope, errors) {
  const databases = config?.d1_databases || [];
  if (!Array.isArray(databases)) {
    errors.push(scope + ".d1_databases must be an array.");
    return null;
  }
  const matches = databases.filter((item) => item?.binding === "MEMBER_DB");
  if (matches.length > 1) errors.push(scope + " has duplicate MEMBER_DB bindings.");
  return matches[0] || null;
}

function validateDatabase(db, label, expectedName, errors) {
  if (!db) {
    errors.push(label + " MEMBER_DB binding is missing.");
    return;
  }
  if (db.database_name !== expectedName) {
    errors.push(label + " database_name must be " + expectedName + ".");
  }
  if (!UUID.test(String(db.database_id || ""))) {
    errors.push(label + " database_id is not a real UUID.");
  }
  if (db.migrations_dir !== "migrations") {
    errors.push(label + " must use the committed migrations directory.");
  }
}

export function inspectMemberBindings(config, previewMigrationConfig = null, options = {}) {
  const errors = [];
  const vars = config?.vars || {};
  const strict = Boolean(options.requireConfig || options.requireLive);
  const enabled = vars.ANEVUM_MEMBERS_ENABLED === "true";

  if (!["true", "false"].includes(vars.ANEVUM_MEMBERS_ENABLED)) {
    errors.push("ANEVUM_MEMBERS_ENABLED must be an explicit string true or false.");
  }
  if (Object.hasOwn(vars, "ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED") && vars.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED !== "false") {
    errors.push("Production RHEN member draft editing must remain disabled.");
  }
  if (vars.ANEVUM_MEMBER_PREVIEW_ENABLED !== "false") {
    errors.push("The top-level Worker must not enable preview identity.");
  }
  if (Object.hasOwn(vars, "MEMBER_PREVIEW_ORIGIN")) {
    errors.push("A preview origin must not be configured in top-level production vars.");
  }
  for (const key of SECRET_NAMES) {
    if (Object.hasOwn(vars, key) || Object.hasOwn(config || {}, key)) {
      errors.push(key + " must be provisioned as a Worker secret, never in source.");
    }
  }

  const production = binding(config, "production", errors);
  const preview = binding(config?.previews, "previews", errors);
  const migrations = binding(previewMigrationConfig, "preview migration config", errors);
  const configured = Boolean(production || preview || migrations);
  const requireBindings = strict || enabled || configured;

  if (options.requireLive && !enabled) {
    errors.push("Production member activation flag is still disabled.");
  }

  if (requireBindings) {
    validateDatabase(production, "Production", "anevum-members", errors);
    validateDatabase(preview, "Preview", "anevum-members-preview", errors);
    validateDatabase(migrations, "Preview migration", "anevum-members-preview", errors);

    if (production && preview &&
        production.database_id === preview.database_id) {
      errors.push("Production and preview must not share a D1 database_id.");
    }
    if (production && preview &&
        production.database_name === preview.database_name) {
      errors.push("Production and preview must not share a D1 database_name.");
    }
    if (preview && migrations &&
        (preview.database_id !== migrations.database_id ||
          preview.database_name !== migrations.database_name)) {
      errors.push("The preview migration target does not match the preview Worker binding.");
    }
  }

  return {
    state: enabled ? "enabled-in-source" : configured ? "configured-but-disabled" : "disabled-unconfigured",
    valid: errors.length === 0,
    errors
  };
}

function readConfig(filename, optional = false) {
  if (!existsSync(filename)) {
    if (optional) return null;
    throw new Error("Required file missing: " + filename);
  }
  // These checked-in .jsonc files are intentionally also strict JSON.
  // Reject malformed edits rather than attempting to recover ambiguous bindings.
  return JSON.parse(readFileSync(filename, "utf8"));
}

const launchedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (launchedDirectly) {
  try {
    const config = readConfig(resolve("wrangler.jsonc"));
    const preview = readConfig(resolve("wrangler.preview-migrations.jsonc"), true);
    const result = inspectMemberBindings(config, preview, {
      requireConfig: process.argv.includes("--require-config"),
      requireLive: process.argv.includes("--require-live")
    });
    console.log("Member bindings: " + result.state + "; isolation: " + (result.valid ? "PASS" : "FAIL"));
    for (const message of result.errors) console.error("ERROR: " + message);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    console.error("Member binding verification failed: " + error.message);
    process.exitCode = 1;
  }
}
