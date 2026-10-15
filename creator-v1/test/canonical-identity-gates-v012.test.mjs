import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {
  assessIdentityStageInventory,IDENTITY_STAGE,
  REQUIRED_CREATOR_MIGRATIONS,REQUIRED_ACCEPTANCE
} from "../ops/identity-release-gate.mjs";
import {linkedIdentityStatus,CANONICAL_ISSUER} from "../auth/canonical-identity-read.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const snapshot=JSON.parse(read("test/fixtures/identity-stage-inventory-2026-10-14.json"));
const clone=x=>JSON.parse(JSON.stringify(x));
const reasons=x=>assessIdentityStageInventory(x).reasons;
const absent=(arr,key)=>assert.ok(arr.some(s=>s===key||s.startsWith(key+":")),"Expected "+key+" in "+JSON.stringify(arr));

test("real read-only Cloudflare inventory remains blocked until canonical same-origin auth exists",()=>{
 const result=assessIdentityStageInventory(snapshot);
 assert.equal(result.status,"blocked");
 assert.equal(result.candidateForOwnerReview,false);
 for(const required of [
  "CANONICAL_SAME_ORIGIN_ROUTE_MISSING",
  "CANONICAL_AUTH_D1_NOT_ISOLATED",
  "CANONICAL_ISSUER_AND_COOKIE_ORIGIN_UNVERIFIED",
  "STAGING_MIGRATIONS_NOT_APPLIED",
  "INDEPENDENT_CREATOR_MEMBER_COUNT_INSUFFICIENT",
  "ACCEPTANCE_MISSING:backup_and_restore",
  "ACCEPTANCE_MISSING:owner_role_isolation"
 ])absent(result.reasons,required);
 assert.equal(snapshot.counts.creatorMembers,1);
 assert.equal(snapshot.counts.creatorProfiles,2);
 assert.equal(snapshot.counts.legacyV5PreviewMembers,1);
 assert.ok(!snapshot.creatorMigrationVersions.includes("0014_creator_featured_awards"));
 assert.ok(!snapshot.creatorMigrationVersions.includes("0015_creator_canonical_identity_links"));
 assert.equal(snapshot.routes.find(x=>x.pattern==="anevum.com/*")?.script,"anevum-construction-terminal");
});

test("incomplete or forged topology cannot become eligible for account traffic",()=>{
 const missing=[null,{},[],{routes:[],workers:[]},false];
 for(const state of missing)assert.equal(assessIdentityStageInventory(state).status,"blocked");
 const foreign=clone(snapshot);
 foreign.routes.push({pattern:IDENTITY_STAGE.canonicalRoute,script:"anevum-member-auth-staging"});
 absent(reasons(foreign),"CANONICAL_SAME_ORIGIN_ROUTE_MISSING");
 const prod=clone(snapshot);
 prod.routes.find(x=>x.pattern==="anevum.com/*").script="anevum-creator-v1-a-staging";
 absent(reasons(prod),"PUBLIC_LAUNCH_PAGE_NOT_ISOLATED");
 const renamed=clone(snapshot);
 renamed.workers.find(x=>x.name==="anevum-member-auth-staging").bindings[0].database_id=IDENTITY_STAGE.productionDb;
 absent(reasons(renamed),"CREATOR_AND_LEGACY_D1_NOT_PINNED");
});

test("even a complete synthetic plan is only a candidate for owner review, never permission",()=>{
 const plan=clone(snapshot);
 plan.routes.push({pattern:IDENTITY_STAGE.canonicalRoute,script:IDENTITY_STAGE.canonicalWorker});
 plan.workers.push({name:IDENTITY_STAGE.canonicalWorker,
   issuer:IDENTITY_STAGE.canonicalIssuer,
   sessionOrigin:"https://a.anevum.com",
   bindings:[
     {name:"MEMBER_DB",type:"d1",database_id:"test-isolated-canonical-stage-db"},
     {name:"CREATOR_BRIDGE_DB",type:"d1",database_id:IDENTITY_STAGE.creatorStageDb}
   ]});
 plan.creatorMigrationVersions=[...new Set([...plan.creatorMigrationVersions,...REQUIRED_CREATOR_MIGRATIONS])];
 plan.counts.creatorMembers=2;
 for(const key of REQUIRED_ACCEPTANCE)plan.acceptance[key]={result:"passed",evidence:"test-review-"+key};
 const answer=assessIdentityStageInventory(plan);
 assert.equal(answer.status,"review_candidate");
 assert.deepEqual(answer.reasons,[]);
 assert.equal(answer.candidateForOwnerReview,true);
 assert.ok(!Object.hasOwn(answer,"deployAllowed"));
 for(const usedId of [
   IDENTITY_STAGE.creatorStageDb,IDENTITY_STAGE.productionDb,
   IDENTITY_STAGE.olderV5PreviewDb,IDENTITY_STAGE.olderMemberPreviewDb,
   IDENTITY_STAGE.olderMemberMainDb
 ]){
  const cross=clone(plan);
  cross.workers.find(x=>x.name===IDENTITY_STAGE.canonicalWorker).bindings[0].database_id=usedId;
  absent(reasons(cross),"CANONICAL_AUTH_D1_NOT_ISOLATED");
 }
 const missingBridge=clone(plan);
 missingBridge.workers.find(x=>x.name===IDENTITY_STAGE.canonicalWorker).bindings.pop();
 absent(reasons(missingBridge),"CANONICAL_CREATOR_BRIDGE_D1_NOT_PINNED");
 const wrongBridge=clone(plan);
 wrongBridge.workers.find(x=>x.name===IDENTITY_STAGE.canonicalWorker).bindings[1].database_id=IDENTITY_STAGE.productionDb;
 absent(reasons(wrongBridge),"CANONICAL_CREATOR_BRIDGE_D1_NOT_PINNED");
 const sameBridge=clone(plan);
 sameBridge.workers.find(x=>x.name===IDENTITY_STAGE.canonicalWorker).bindings[1].database_id="test-isolated-canonical-stage-db";
 absent(reasons(sameBridge),"CANONICAL_CREATOR_BRIDGE_D1_NOT_PINNED");
 const migrated=clone(plan);
 migrated.creatorMigrationVersions=migrated.creatorMigrationVersions.filter(x=>x!=="0015_creator_canonical_identity_links");
 absent(reasons(migrated),"STAGING_MIGRATIONS_NOT_APPLIED");
 const noProof=clone(plan);
 noProof.acceptance.cross_account_denial={result:"passed",evidence:""};
 absent(reasons(noProof),"ACCEPTANCE_MISSING:cross_account_denial");
});

function fixture(){
 const sqlite=new DatabaseSync(":memory:");
 sqlite.exec("PRAGMA foreign_keys=ON;CREATE TABLE schema_migrations(version TEXT PRIMARY KEY);");
 sqlite.exec(read("auth/migrations/0003_member_identity_staging.sql"));
 sqlite.exec(read("auth/migrations/0015_creator_canonical_identity_links.sql"));
 const now=1760480000;
 const add=id=>sqlite.prepare("INSERT INTO member_accounts(id,email,verified_at,created_at,status) VALUES(?,?,?,?,'active')").run(id,id+"@fixture.invalid",now,now);
 add("stage_alpha");add("stage_beta");
 const db={prepare:sql=>({bind(...params){return{
    async all(){return{success:true,results:sqlite.prepare(sql).all(...params)}}
  }}})};
 const link=(id,subject,digest="a".repeat(64),issuer=CANONICAL_ISSUER)=>
  sqlite.prepare("INSERT INTO creator_canonical_identity_links(legacy_member_id,canonical_subject,canonical_issuer,proof_digest,status,verified_at,reviewed_at) VALUES(?,?,?,?,'verified',?,?)")
    .run(id,subject,issuer,digest,now,now+10);
 return {sqlite,db,link,now};
}

test("V012 migration is idempotent and enforces one-to-one unique canonical IDs and proof digests",()=>{
 const f=fixture();try{
  f.sqlite.exec(read("auth/migrations/0015_creator_canonical_identity_links.sql"));
  assert.equal(f.sqlite.prepare("SELECT count(*) n FROM schema_migrations WHERE version='0015_creator_canonical_identity_links'").get().n,1);
  f.link("stage_alpha","canonical_subject_alpha");
  assert.throws(()=>f.link("stage_beta","canonical_subject_alpha","b".repeat(64)),/UNIQUE/);
  assert.throws(()=>f.link("stage_beta","canonical_subject_beta","a".repeat(64)),/UNIQUE/);
  assert.throws(()=>f.link("stage_beta","somebody@fixture.invalid","c".repeat(64)),/CHECK/);
  assert.throws(()=>f.link("stage_beta","canonical_subject_beta","G".repeat(64)),/CHECK/);
  assert.throws(()=>f.link("stage_beta","canonical_subject_beta","c".repeat(64),"foreign-provider"),/CHECK/);
  f.link("stage_beta","canonical_subject_beta","b".repeat(64));
  assert.throws(()=>f.link("stage_alpha","canonical_subject_gamma","c".repeat(64)),/UNIQUE/);
  assert.equal(f.sqlite.prepare("SELECT count(*) n FROM creator_canonical_identity_links").get().n,2);
 }finally{f.sqlite.close()}
});

test("only a still-active authenticated legacy member can see a verified link flag",async()=>{
 const f=fixture();try{
  assert.deepEqual(await linkedIdentityStatus(f.db,{id:"stage_alpha"}),{linked:false,available:true});
  f.link("stage_alpha","canonical_subject_alpha");
  assert.deepEqual(await linkedIdentityStatus(f.db,{id:"stage_alpha"}),{linked:true,available:true});
  assert.deepEqual(await linkedIdentityStatus(f.db,{id:"stage_beta"}),{linked:false,available:true});
  for(const bad of [null,{},{id:"foo@bar.invalid"},{id:4},{email:"stage_alpha@fixture.invalid"}])
    assert.deepEqual(await linkedIdentityStatus(f.db,bad),{linked:false,available:false});
  f.sqlite.prepare("UPDATE member_accounts SET status='suspended' WHERE id='stage_alpha'").run();
  assert.deepEqual(await linkedIdentityStatus(f.db,{id:"stage_alpha"}),{linked:false,available:true});
  f.sqlite.prepare("UPDATE member_accounts SET status='active' WHERE id='stage_alpha'").run();
  f.sqlite.prepare("UPDATE creator_canonical_identity_links SET status='revoked',revoked_at=? WHERE legacy_member_id='stage_alpha'").run(f.now+11);
  assert.deepEqual(await linkedIdentityStatus(f.db,{id:"stage_alpha"}),{linked:false,available:true});
  f.sqlite.prepare("DELETE FROM member_accounts WHERE id='stage_alpha'").run();
  assert.equal(f.sqlite.prepare("SELECT count(*) n FROM creator_canonical_identity_links WHERE legacy_member_id='stage_alpha'").get().n,0);
 }finally{f.sqlite.close()}
});

test("missing schema and D1 outages fail closed instead of enabling an account",async()=>{
 const f=fixture();try{
  f.sqlite.exec("DROP TABLE creator_canonical_identity_links");
  assert.deepEqual(await linkedIdentityStatus(f.db,{id:"stage_alpha"}),{linked:false,available:false});
  assert.deepEqual(await linkedIdentityStatus(null,{id:"stage_alpha"}),{linked:false,available:false});
  assert.deepEqual(await linkedIdentityStatus({prepare(){throw Error("offline")}},{id:"stage_alpha"}),{linked:false,available:false});
 }finally{f.sqlite.close()}
});

test("identity prep has no unauthenticated HTTP API, automatic email merge, or role/XP writes",()=>{
 const memberWorker=read("auth/worker.mjs");
 const linked=read("auth/canonical-identity-read.mjs");
 const publicWorker=read("web/production-worker.mjs");
 const releaseGate=read("ops/identity-release-gate.mjs");
 const schema=read("auth/migrations/0015_creator_canonical_identity_links.sql");
 assert.doesNotMatch(memberWorker,/canonical-identity-read|identity\/link|canonical\/link/);
 assert.doesNotMatch(publicWorker,/canonical-identity|identity\/link/);
 assert.doesNotMatch(linked,/INSERT INTO|UPDATE |DELETE FROM|email\s*=|handle\s*=|grantXP|grantXp|ownerRole/);
 assert.doesNotMatch(releaseGate,/fetch\(|cloudflare\.request|deploy\(|process\.env|D1\.prepare/);
 assert.doesNotMatch(schema,/ALTER TABLE member_accounts|community_xp_events|staff_members|member_entitlements/);
 assert.match(schema,/ON DELETE CASCADE/);
 assert.match(schema,/canonical_subject TEXT NOT NULL UNIQUE/);
 assert.match(schema,/proof_digest TEXT NOT NULL UNIQUE/);
 assert.match(schema,/status IN \('verified', 'revoked'\)/);
});
