// Manual release runner. Private member records are never written to logs.
import {readFileSync, writeFileSync, unlinkSync} from "node:fs";
import {join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";

export const DATABASE = "7f0d4c0c-2e85-4900-8504-1347954e1df1";
export const WORKER = "anevum-web-nextgen";
export const LEDGER = ["0001_member_platform.sql", "0002_member_rhen_drafts.sql"];
export const STUDIO_MIGRATION = "0008_studio_editorial.sql";
const root = fileURLToPath(new URL("../", import.meta.url));
const OWNER = "anevum.studio@gmail.com";

function require(ok) { if (!ok) throw new Error("Release prerequisite failed."); }
export function releaseConfigValid(config) {
  const vars = config?.vars || {};
  return config?.name === WORKER && config.d1_databases?.length === 1 &&
    config.d1_databases[0].database_id === DATABASE &&
    vars.ANEVUM_MEMBERS_ENABLED === "true" &&
    vars.ANEVUM_STUDIO_ENABLED === "true" && vars.ANEVUM_STUDIO_PUBLISH_ENABLED === "false" &&
    vars.ANEVUM_STUDIO_ACCESS_EMAILS === OWNER &&
    /^[a-f0-9]{64}$/.test(vars.ANEVUM_STUDIO_ACCESS_AUD || "") &&
    vars.ANEVUM_STUDIO_ACCESS_AUD !== vars.CF_ACCESS_AUD &&
    vars.ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED === "true" &&
    vars.RHEN_OBSERVER_ENABLED === "false" &&
    ["ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED", "ANEVUM_MEMBER_PREVIEW_ENABLED",
      "ANEVUM_V5_WORKSPACES_ENABLED", "ANEVUM_OWNER_PAPER_OBSERVER_ENABLED",
      "ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED", "ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED",
      "COMMAND_LIVE_STREAM_ENABLED"].every(k => vars[k] === "false");
}
export function productionLineageValid(names) {
  return Array.isArray(names) && [LEDGER, [...LEDGER, STUDIO_MIGRATION]]
    .some(expected => JSON.stringify(names) === JSON.stringify(expected));
}
export function signedExportURLValid(value) {
  try { const u = new URL(value); return u.protocol === "https:" &&
    u.hostname.endsWith(".r2.cloudflarestorage.com") && !u.username && !u.password; }
  catch { return false; }
}
export function requireRecoveryAuthorization(env) {
  require(env.ANEVUM_PRIVATE_RECOVERY_AUTHORIZED === "true");
  require(/^[a-f0-9]{32}$/.test(env.CLOUDFLARE_ACCOUNT_ID || ""));
  require(Boolean(env.CLOUDFLARE_D1_TOKEN && env.CLOUDFLARE_API_TOKEN));
}
function client(token, env, request = fetch) {
  return async (path, method = "GET", body) => {
    const response = await request(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}${path}`,
      {method, headers:{Authorization:`Bearer ${token}`, "Content-Type":"application/json"},
        ...(body === undefined ? {} : {body:JSON.stringify(body)}), signal:AbortSignal.timeout(30000)});
    require(response.ok);
    const data = await response.json();
    require(data.success === true);
    return data.result;
  };
}
async function currentOwner(d1) {
  const result = await d1(`/d1/database/${DATABASE}/query`, "POST", {
    sql:'SELECT id FROM "user" WHERE lower(email)=? AND emailVerified=1', params:[OWNER]});
  const users = result?.[0]?.results;
  require(result?.[0]?.success === true && users?.length === 1);
  require(/^[A-Za-z0-9_-]{8,128}$/.test(users[0].id));
  return users[0].id;
}
async function preflight(d1) {
  const metadata = await d1(`/d1/database/${DATABASE}`);
  require(metadata.uuid === DATABASE && metadata.name === "anevum-members");
  const result = await d1(`/d1/database/${DATABASE}/query`, "POST", {
    sql:"SELECT name FROM d1_migrations ORDER BY id; PRAGMA foreign_key_check;"});
  require(result?.length === 2 && result.every(x => x.success === true));
  require(productionLineageValid(result[0].results.map(x => x.name)) && result[1].results.length === 0);
  await currentOwner(d1);
}
export async function backupProduction(env = process.env, request = fetch) {
  requireRecoveryAuthorization(env);
  require(releaseConfigValid(JSON.parse(readFileSync(join(root,"wrangler.jsonc"),"utf8"))));
  require(Boolean(env.RUNNER_TEMP && env.GITHUB_OUTPUT && env.ANEVUM_PRODUCTION_BACKUP_FERNET_KEY));
  const d1 = client(env.CLOUDFLARE_D1_TOKEN,env,request);
  const workers = client(env.CLOUDFLARE_API_TOKEN,env,request);
  await preflight(d1);
  const bookmark = await d1(`/d1/database/${DATABASE}/time_travel/bookmark`);
  const deployments = await workers(`/workers/scripts/${WORKER}/deployments`);
  const previous = deployments?.deployments?.[0];
  require(bookmark.bookmark && previous?.versions?.length === 1 && previous.versions[0].percentage === 100);
  const path = `/d1/database/${DATABASE}/export`;
  let progress = await d1(path,"POST",{output_format:"polling"});
  for (let i=0; i<30 && progress.status === "active"; i++) {
    require(Boolean(progress.at_bookmark));
    await new Promise(resolve => setTimeout(resolve,1000));
    progress = await d1(path,"POST",{output_format:"polling",current_bookmark:progress.at_bookmark});
  }
  require(progress.status === "complete" && signedExportURLValid(progress.result?.signed_url));
  const response = await request(progress.result.signed_url,{signal:AbortSignal.timeout(50000),redirect:"error"});
  require(response.ok && response.body);
  const chunks = [], reader = response.body.getReader();
  let total = 0;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      total += part.value.byteLength;
      require(total <= 64 * 1024 * 1024); chunks.push(Buffer.from(part.value));
    }
  } finally { await reader.cancel(); }
  const rawPath = join(env.RUNNER_TEMP,"anevum-production-private.sql");
  const archive = join(env.RUNNER_TEMP,"anevum-production-d1.sql.fernet");
  try {
    writeFileSync(rawPath,Buffer.concat(chunks),{mode:0o600,flag:"wx"});
    const checked = spawnSync("python",[join(root,"scripts/verify-v5-production-backup.py"),
      "encrypt-and-verify",rawPath,archive],{env,encoding:"utf8",maxBuffer:1024*1024});
    require(checked.status === 0);
    const report = JSON.parse(checked.stdout);
    require(report.status === "PRODUCTION_SQLITE_RECOVERY_AND_STUDIO_REHEARSAL_VERIFIED");
    const recovery = {...report,database_id:DATABASE,worker:WORKER,
      previous_worker_version:previous.versions[0].version_id,time_travel_bookmark:bookmark.bookmark};
    writeFileSync(join(env.RUNNER_TEMP,"production-recovery-report.json"),JSON.stringify(recovery),{mode:0o600});
    writeFileSync(env.GITHUB_OUTPUT,`sql_sha256=${report.sql_sha256}\n`,{flag:"a"});
    return {status:report.status,encrypted:true};
  } finally { try {unlinkSync(rawPath);} catch {} }
}
export async function activateStudio(env = process.env, request = fetch) {
  requireRecoveryAuthorization(env);
  require(releaseConfigValid(JSON.parse(readFileSync(join(root,"wrangler.jsonc"),"utf8"))));
  // This file is generated only by the verified downloaded-artifact step.
  const recovery = JSON.parse(readFileSync(join(env.RUNNER_TEMP,"verified-production-recovery.json"),"utf8"));
  require(recovery.status === "PRODUCTION_SQLITE_RECOVERY_AND_STUDIO_REHEARSAL_VERIFIED" &&
    recovery.sql_sha256 === env.EXPECTED_PRODUCTION_BACKUP_SHA);
  const d1 = client(env.CLOUDFLARE_D1_TOKEN,env,request);
  const workers = client(env.CLOUDFLARE_API_TOKEN,env,request);
  await preflight(d1);
  const owner = await currentOwner(d1);
  const schema = readFileSync(join(root,"migrations-studio",STUDIO_MIGRATION),"utf8");
  const result = await d1(`/d1/database/${DATABASE}/query`,"POST",{
    sql:schema + "\nINSERT INTO d1_migrations(name) SELECT ? WHERE NOT EXISTS " +
      "(SELECT 1 FROM d1_migrations WHERE name=?);", params:[STUDIO_MIGRATION,STUDIO_MIGRATION]});
  require(Array.isArray(result) && result.every(x => x.success === true));
  await preflight(d1);
  require(await currentOwner(d1) === owner);
  const ready = await d1(`/d1/database/${DATABASE}/query`,"POST",{
    sql:"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('studio_entries','studio_entry_events') ORDER BY name"});
  require(JSON.stringify(ready?.[0]?.results?.map(x=>x.name)) === JSON.stringify(["studio_entries","studio_entry_events"]));
  await workers(`/workers/scripts/${WORKER}/secrets`,"PUT",{
    name:"ANEVUM_STUDIO_OWNER_MEMBER_ID",type:"secret_text",text:owner});
  // Never create synthetic users, secondary admin grants, RHEN bindings or publish.
  return {status:"STUDIO_SCHEMA_AND_OWNER_BINDING_READY",publishingEnabled:false};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode=process.argv[2];
    require(["backup","activate-studio"].includes(mode));
    console.log(JSON.stringify(await (mode === "backup" ? backupProduction() : activateStudio())));
  } catch { console.error("Production release blocked; no private details logged."); process.exitCode=1; }
}
