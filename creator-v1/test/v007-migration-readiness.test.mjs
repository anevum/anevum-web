import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {BASE,PROPOSED,DEPLOYMENT_DENIED,STAGING_DB,collisions,
  versionPrefix,rehearseV007,inspectSchemaSnapshot} from "../ops/verify-v007-migration-readiness.mjs";

const snapshotPath=new URL("../../docs/creator-platform/V007-STAGING-SCHEMA-SNAPSHOT-2026-10-14.json",import.meta.url);
const snapshot=JSON.parse(readFileSync(snapshotPath,"utf8"));

test("actual read-only metadata baseline is the designated isolated Creator V1 staging D1",()=>{
 const status=inspectSchemaSnapshot(snapshot);
 assert.equal(snapshot.database,STAGING_DB);
 assert.equal(status.actualMigrationCount,6);
 assert.equal(status.schemaMatchesAuditedBaseline,true);
 assert.equal(status.liveMigrationAuthorization,DEPLOYMENT_DENIED);
 assert.equal(status.collisionCount,1);
});

test("offline replay migrates reviewed Creator V1 SQL with no real member data",()=>{
 const report=rehearseV007();
 assert.equal(report.rehearsal,"PASS");
 assert.equal(report.scope,"OFFLINE-SYNTHETIC-IN-MEMORY");
 assert.equal(report.defaultPublicConsent,false);
 assert.equal(report.transactionRollback,true);
 assert.deepEqual(report.preservedFixtureRows,{members:1,projects:1,xp:0});
 assert.deepEqual(report.baselineVersions,BASE.map(x=>x.version));
 assert.deepEqual(report.proposedVersions,PROPOSED.map(x=>x.version));
 assert.equal(report.liveMigrationAuthorization,DEPLOYMENT_DENIED);
 assert.equal(report.unresolved0014Claims.length,1);
});

test("both 0014 migration claims are detected, never automatically sequenced",()=>{
 assert.deepEqual(collisions(),[{prefix:"0014",versions:[
   "0014_private_creator_assets (PR #393)",
   "0014_creator_featured_awards (PR #398)"
 ]}]);
 assert.equal(versionPrefix("0015_creator_profile_showcase"),"0015");
 assert.throws(()=>versionPrefix("0014test"),/Invalid migration version/);
});

test("read-only snapshot tampering, missing baseline tables and another database fail closed",()=>{
 assert.throws(()=>inspectSchemaSnapshot({...snapshot,database:"anevum-members"}),/Wrong database/);
 assert.throws(()=>inspectSchemaSnapshot({...snapshot,source:"local"}),/Unverified/);
 assert.throws(()=>inspectSchemaSnapshot({...snapshot,migrations:snapshot.migrations.slice(0,5)}),/ledger drift/);
 assert.throws(()=>inspectSchemaSnapshot({...snapshot,tables:snapshot.tables.filter(x=>x!=="member_sessions")}),/baseline table/);
 assert.throws(()=>inspectSchemaSnapshot({...snapshot,tables:[...snapshot.tables,"community_posts"]}),/advanced/);
 assert.throws(()=>inspectSchemaSnapshot({...snapshot,tables:[...snapshot.tables,"member_showcase_selections"]}),/advanced/);
 assert.throws(()=>inspectSchemaSnapshot({...snapshot,tables:[...snapshot.tables,"project_assets"]}),/advanced/);
});

test("command line reports review-only gate and rejects live/apply flags",()=>{
 const binary=fileURLToPath(new URL("../ops/verify-v007-migration-readiness.mjs",import.meta.url));
 const good=spawnSync(process.execPath,[binary,"--snapshot",fileURLToPath(snapshotPath)],{encoding:"utf8",timeout:12000});
 assert.equal(good.status,0,good.stderr);
 const report=JSON.parse(good.stdout);
 assert.equal(report.liveMigrationAuthorization,DEPLOYMENT_DENIED);
 assert.equal(report.snapshotStatus.schemaMatchesAuditedBaseline,true);
 const denied=spawnSync(process.execPath,[binary,"--apply"],{encoding:"utf8",timeout:12000});
 assert.notEqual(denied.status,0);
 assert.match(denied.stderr,/Cannot apply migrations/);
});
