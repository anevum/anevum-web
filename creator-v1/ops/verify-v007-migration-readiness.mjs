/**
 * ANEVUM V007 schema-only / local rehearsal gate.
 *
 * Usage:
 *   node creator-v1/ops/verify-v007-migration-readiness.mjs
 *   node creator-v1/ops/verify-v007-migration-readiness.mjs --snapshot docs/creator-platform/V007-STAGING-SCHEMA-SNAPSHOT-2026-10-14.json
 *
 * ALL rehearsals run in disposable node:sqlite memory. This tool has NO
 * Cloudflare client, credentials, network calls, D1/R2 mutation, or deployment.
 * An offline PASS never authorizes applying an actual migration.
 */
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

export const STAGING_DB="anevum-creator-v1-staging";
export const DEPLOYMENT_DENIED="MIGRATION_REVIEW_REQUIRED";
export const BASE=Object.freeze([
 {version:"0001_initial_creator_platform",path:"../../community-preview/migrations/0001_initial_creator_platform.sql"},
 {version:"0002_staff_authoring",path:"../authoring/migrations/0002_staff_authoring.sql"},
 {version:"0003_member_identity_staging",path:"../auth/migrations/0003_member_identity_staging.sql"},
 {version:"0004_member_project_workflow",path:"../auth/migrations/0004_member_project_workflow.sql"},
 {version:"0005_voting_progression",path:"../auth/migrations/0005_voting_progression.sql"},
 {version:"0006_account_privacy",path:"../auth/migrations/0006_account_privacy.sql"}
]);
export const PROPOSED=Object.freeze([
 {version:"0007_community_post_stream",path:"../auth/migrations/0007_community_post_stream.sql"},
 {version:"0008_community_reply_reviews",path:"../auth/migrations/0008_community_reply_reviews.sql"},
 {version:"0013_community_post_projects",path:"../auth/migrations/0013_community_post_projects.sql"},
 {version:"0015_creator_profile_showcase",path:"../auth/migrations/0015_creator_profile_showcase.sql"}
]);
// Both alternate 0014 drafts are real OPEN PRs. Neither is imported here.
// 0010-0012 in PR #381, 0014 in #393/#398 and 0009 are NOT authorized.
export const CLAIMED_PREFIXES=Object.freeze([
 {prefix:"0014",version:"0014_private_creator_assets",pr:393},
 {prefix:"0014",version:"0014_creator_featured_awards",pr:398}
]);

function migrate(db,entry){
 const sql=readFileSync(new URL(entry.path,import.meta.url),"utf8");
 // Local SQL is trusted checked-in migration source, never from requests.
 db.exec(sql);
 if(db.prepare("SELECT 1 FROM schema_migrations WHERE version=?").get(entry.version)===undefined)
   throw Error("Expected schema ledger entry absent: "+entry.version);
}
export function versionPrefix(version){
 const m=/^(\d{4})_[a-z0-9_]+$/.exec(version);
 if(!m)throw Error("Invalid migration version: "+version);
 return m[1];
}
export function collisions(items=CLAIMED_PREFIXES){
 const byPrefix=new Map();
 for(const item of items){
  const prefix=versionPrefix(item.version);
  const list=byPrefix.get(prefix)||[];
  list.push(item.version+" (PR #"+item.pr+")");
  byPrefix.set(prefix,list);
 }
 return [...byPrefix.entries()].filter(([,values])=>values.length>1)
   .map(([prefix,versions])=>({prefix,versions}));
}
export function inspectSchemaSnapshot(snapshot){
 if(!snapshot||typeof snapshot!=="object"||Array.isArray(snapshot))
   throw Error("Staging snapshot must be a metadata object");
 if(snapshot.database!==STAGING_DB)throw Error("Wrong database name: "+String(snapshot.database));
 if(snapshot.source!=="cloudflare-read-only")throw Error("Unverified staging snapshot source");
 if(typeof snapshot.captured_date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.captured_date))
   throw Error("Missing read-only audit date");
 if(!Array.isArray(snapshot.migrations)||!Array.isArray(snapshot.tables))
   throw Error("Missing sanitized migration/table name arrays");
 const known=BASE.map(x=>x.version);
 const given=[...snapshot.migrations].sort();
 if(JSON.stringify(given)!==JSON.stringify([...known].sort()))
   throw Error("Staging migration ledger drift: stop and refresh read-only audit");
 if(new Set(snapshot.tables).size!==snapshot.tables.length||
    snapshot.tables.some(x=>typeof x!=="string"))
   throw Error("Malformed or duplicate table metadata");
 for(const table of ["schema_migrations","member_accounts","creator_profiles","projects",
   "community_xp_events","community_project_votes","member_sessions"]){
    if(!snapshot.tables.includes(table))throw Error("Expected baseline table is missing: "+table);
 }
 for(const forbidden of ["community_posts","member_showcase_selections","project_assets","creator_featured_awards"]){
  if(snapshot.tables.includes(forbidden))
    throw Error("Staging schema has advanced since the audited baseline: "+forbidden);
 }
 return {schemaMatchesAuditedBaseline:true,actualMigrationCount:known.length,
    collisionCount:collisions().length,liveMigrationAuthorization:DEPLOYMENT_DENIED};
}
function rowCount(db,name){
 return db.prepare("SELECT COUNT(*) AS n FROM "+name).get().n;
}
function sampleSeed(db){
 db.prepare("INSERT INTO member_accounts(id,email,verified_at,created_at,status) VALUES(?,?,?,?,?)")
   .run("fixture-member-a","fixture-a@invalid.test",1792000000,1792000000,"active");
 db.prepare("INSERT INTO creator_profiles(member_id,handle,display_name,bio,status) VALUES(?,?,?,?,?)")
   .run("fixture-member-a","maker_fixture","Fixture Creator","Test-only biography","active");
 db.prepare("INSERT INTO projects(id,owner_member_id,slug,title,summary,category,status,published_at) VALUES(?,?,?,?,?,?,?,?)")
   .run("fixture-project-a","fixture-member-a","fixture-project","Fixture project","A synthetic approved project","tools","published","2026-10-01");
}
export function rehearseV007(){
 const db=new DatabaseSync(":memory:");
 try{
  db.exec("PRAGMA foreign_keys=ON");
  for(const item of BASE)migrate(db,item);
  sampleSeed(db);
  const countBefore={members:rowCount(db,"member_accounts"),projects:rowCount(db,"projects"),
    xp:rowCount(db,"community_xp_events")};
  db.exec("SAVEPOINT v007_release_rehearsal");
  for(const item of PROPOSED)migrate(db,item);
  for(const name of ["community_posts","community_post_replies","community_reply_review_events",
    "community_post_projects","member_showcase_selections"]){
   if(!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name))
     throw Error("Missing migrated table "+name);
  }
  if(rowCount(db,"member_accounts")!==countBefore.members||
     rowCount(db,"projects")!==countBefore.projects||
     rowCount(db,"community_xp_events")!==countBefore.xp)
     throw Error("Migrating lost/forged fixture member, project or XP records");
  if(db.prepare("PRAGMA foreign_key_check").all().length)throw Error("Foreign key violations");
  if(db.prepare("PRAGMA integrity_check").get().integrity_check!=="ok")
    throw Error("SQLite integrity check failed");
  db.prepare("INSERT INTO member_showcase_selections(member_id,artifact_key,award_keys_json,updated_at) VALUES(?,?,?,?)")
    .run("fixture-member-a","Foundry Spark",'["first-launch"]',1792000000);
  const saved=db.prepare("SELECT is_public,revision FROM member_showcase_selections WHERE member_id='fixture-member-a'").get();
  if(saved.is_public!==0||saved.revision!==1)throw Error("Migrated default leaks rewards publicly");
  if(db.prepare("PRAGMA foreign_key_check").all().length)
    throw Error("Foreign key check failed after inserting opt-out preference");
  db.exec("ROLLBACK TO v007_release_rehearsal");
  db.exec("RELEASE v007_release_rehearsal");
  if(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='member_showcase_selections'").get())
    throw Error("Savepoint rollback did not restore pre-migration schema");
  if(rowCount(db,"member_accounts")!==countBefore.members)throw Error("Rollback lost fixture account");
  return {rehearsal:"PASS",scope:"OFFLINE-SYNTHETIC-IN-MEMORY",
    baselineVersions:BASE.map(x=>x.version),proposedVersions:PROPOSED.map(x=>x.version),
    preservedFixtureRows:countBefore,defaultPublicConsent:false,transactionRollback:true,
    unresolved0014Claims:collisions(),liveMigrationAuthorization:DEPLOYMENT_DENIED};
 }finally{db.close()}
}
function runCLI(){
 const args=process.argv.slice(2);
 if(args.length>2||args.some(x=>x==="--apply"||x==="--deploy"||x==="--live"))
  throw Error("Only offline --snapshot <sanitized path> is supported. Cannot apply migrations.");
 let snapshotStatus=null;
 if(args.length){
  if(args.length!==2||args[0]!=="--snapshot"||!args[1].endsWith(".json"))
   throw Error("Only --snapshot <sanitized JSON filename> is supported.");
  const snapshot=JSON.parse(readFileSync(args[1],"utf8"));
  snapshotStatus=inspectSchemaSnapshot(snapshot);
 }
 const report={...rehearseV007(),snapshotStatus};
 process.stdout.write(JSON.stringify(report,null,2)+"\n");
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])runCLI();
