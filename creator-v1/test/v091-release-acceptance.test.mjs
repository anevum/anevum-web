import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyV091Acceptance,V091_APPLICATION_SOURCE,V091_RELEASE_METADATA,reviewedV091SourceFiles,
 verifyV091SourceScope} from '../ops/v091-release-acceptance.mjs';
const complete=()=>({source_sha:V091_APPLICATION_SOURCE,founder_staff_session:true,
 reviewer_staff_session:true,creator_journey:true,cross_account_identity:true,
 verified_at:'2026-10-19T00:00:00Z',evidence:['https://github.com/anevum/anevum-web/actions/runs/123']});
test('checked-in V091 acceptance is pinned and stays blocked while any gate is pending',()=>{
 const record=JSON.parse(readFileSync(new URL('../../.github/release-evidence/v091-authenticated.json',import.meta.url),'utf8'));
 assert.equal(record.source_sha,V091_APPLICATION_SOURCE);
 if(['founder_staff_session','reviewer_staff_session','creator_journey','cross_account_identity'].every(key=>record[key]===true))
  assert.equal(verifyV091Acceptance(record),true);
 else assert.throws(()=>verifyV091Acceptance(record),/unverified/);
});
test('each authenticated gate is mandatory and never accepts truthy text',()=>{
 for(const key of ['founder_staff_session','reviewer_staff_session','creator_journey','cross_account_identity'])
  for(const value of [false,undefined,'true','fixture','owner'])
   assert.throws(()=>verifyV091Acceptance({...complete(),[key]:value}),/unverified/);
});
test('a different source, future timestamp, missing evidence or credential URL cannot release',()=>{
 assert.throws(()=>verifyV091Acceptance({...complete(),source_sha:'0'.repeat(40)}),/source/);
 for(const verified_at of [null,'not a date','2999-01-01T00:00:00Z'])
  assert.throws(()=>verifyV091Acceptance({...complete(),verified_at}),/timestamp/);
 for(const evidence of [[],['https://evil.invalid/'],['https://github.com/anevum/anevum-web/actions/runs/123?token=secret']])
  assert.throws(()=>verifyV091Acceptance({...complete(),evidence}),/evidence/);
 assert.equal(verifyV091Acceptance(complete()),true);
});

test('guarded V091 release stays pinned to precisely the reviewed integrated files',()=>{
 const release=readFileSync(new URL('../../.github/workflows/v084-continuance-production.yml',import.meta.url),'utf8');
 assert.ok(release.includes('git merge-base --is-ancestor '+V091_APPLICATION_SOURCE+' HEAD'));
 assert.ok(release.includes('git diff --exit-code '+V091_APPLICATION_SOURCE+' HEAD'));
 assert.ok(release.includes("':(exclude).github/workflows/v091-live-readonly-qa.yml'"),'Only the reviewed read-only QA workflow may differ as release configuration');
 assert.ok(release.includes("':(exclude).github/workflows/v084-continuance-production.yml'"),'Guard changes must remain separate from reviewed app source');
 const start=release.indexOf("diff -u <(printf '%s\\n' \\");
 const end=release.indexOf('<(git diff --name-only db2b8c0f8f79061adf1677986b87077856204267 HEAD)',start);
 assert.ok(start>=0&&end>start,'A static source-delta allowlist must be present');
 const scope=release.slice(start,end);
 const files=[...scope.matchAll(/^\s*'([^']+)'/gm)].map(match=>match[1]);
 assert.equal(files.length,148,'The candidate contains exactly 148 reviewed source files');
 assert.equal(new Set(files).size,files.length,'No duplicated entries');
 assert.deepEqual(files,[...files].sort(),'Source scope must be deterministic');
 for(const required of [
  'creator-v1/web/src/components/IrenGuidedContinuance.tsx',
  'creator-v1/web/src/pages/DiscoverPage.tsx',
  'creator-v1/test/package-discovery-browser-v011.mjs',
  'creator-v1/test/package-discovery-v011.test.mjs',
  'site/alpha/v003/unified-creation-bridge-v009.mjs',
  'site/alpha/v003/resource-service.mjs',
  'tests/alpha-package-v004-browser.mjs',
  'creator-v1/web/src/iren-living-v088.css',
  'creator-v1/web/src/iren-guided-v080.css',
  'creator-v1/test/iren-first-contact-v092.test.mjs',
  'creator-v1/web/src/pages/AuraCodexPage.tsx',
  'creator-v1/test/aura-codex-visual-v091.mjs',
  '.github/workflows/v091-aura-codex-browser.yml',
  'creator-v1/test/capture-home-navigation-v079.mjs',
  'creator-v1/web/src/components/MemberPresenceStatus.tsx',
  'creator-v1/test/player-presence-v092.test.mjs',
  'creator-v1/canonical-auth/member-verified-roles.mjs',
  'creator-v1/canonical-auth/migrations/0012_verified_designations_v093.sql',
  'creator-v1/operations/anevum-iren-insignias-v093.mjs',
  'creator-v1/test/staff-verified-designations-v093.test.mjs',
  'creator-v1/wrangler.iren-insignias-v093.jsonc'
 ])assert.ok(files.includes(required),'Reviewed source is missing '+required);
 assert.ok(files.every(file=>!/[?*{}]/.test(file)),'Globs are not allowed in the release scope');
 assert.ok(release.includes('all(.result.bindings[]; .name!="CANONICAL_VERIFIED_ROLES_ENABLED" or .text!="true")'));
 assert.ok(release.includes('test "$pre_version" = "93cc7f07-cf39-457e-af69-c9f6f4c02d25"'));
 assert.ok(release.includes('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"'));
 assert.match(release,/ANEVUM_LAUNCH_APPROVED/);
 assert.match(release,/CLOUDFLARE_ACCOUNT_ID/);
});

function sourceFixture(){
 const release=readFileSync(new URL('../../.github/workflows/v084-continuance-production.yml',import.meta.url),'utf8');
 return {release,recordedSource:V091_APPLICATION_SOURCE,changedFiles:reviewedV091SourceFiles(release),
   applicationChangedFiles:[],applicationIsAncestor:true,baselineIsAncestor:true};
}
test('source-only scope check requires actual git paths to match every reviewed entry',()=>{
 const input=sourceFixture();
 assert.equal(verifyV091SourceScope(input).changedFiles,input.changedFiles.length);
 assert.throws(()=>verifyV091SourceScope({...input,changedFiles:[...input.changedFiles,'site/alpha/unreviewed.mjs']}),/differs from git; missing:/);
 assert.throws(()=>verifyV091SourceScope({...input,changedFiles:input.changedFiles.slice(1)}),/extra:/);
 assert.throws(()=>verifyV091SourceScope({...input,changedFiles:[...input.changedFiles,input.changedFiles[0]]}),/unique literal paths/);
 assert.throws(()=>verifyV091SourceScope({...input,changedFiles:[...input.changedFiles,'site/alpha/*']}),/unique literal paths/);
});
test('source-only validation allows exactly the five metadata differences and cannot certify authenticated acceptance',()=>{
 const input=sourceFixture(),pending={...complete(),founder_staff_session:false};
 assert.equal(verifyV091SourceScope({...input,applicationChangedFiles:[...V091_RELEASE_METADATA]}).applicationSource,V091_APPLICATION_SOURCE);
 assert.throws(()=>verifyV091Acceptance(pending),/unverified/);
 for(const file of ['creator-v1/web/src/main.tsx','site/alpha/v003/api.mjs','docs/production/unreviewed.md'])
   assert.throws(()=>verifyV091SourceScope({...input,applicationChangedFiles:[...V091_RELEASE_METADATA,file]}),/changed after its source pin/);
 const broadened=input.release.replace("':(exclude)creator-v1/test/v091-release-acceptance.test.mjs'",
   "':(exclude)creator-v1/test/v091-release-acceptance.test.mjs' \\\n            ':(exclude)site/alpha/v003/api.mjs'");
 assert.throws(()=>verifyV091SourceScope({...input,release:broadened}),/exactly the five/);
 const bypass=input.release.replace('node creator-v1/ops/v091-release-acceptance.mjs\n',
   'node creator-v1/ops/v091-release-acceptance.mjs --source-only\n');
 assert.throws(()=>verifyV091SourceScope({...input,release:bypass}),/must run authenticated acceptance/);
});
test('source-only validation fails stale source records, ancestry and nonliteral workflow scope',()=>{
 const input=sourceFixture();
 assert.throws(()=>verifyV091SourceScope({...input,recordedSource:'0'.repeat(40)}),/pin is stale/);
 for(const key of ['applicationIsAncestor','baselineIsAncestor'])
   for(const value of [false,undefined,'true'])
     assert.throws(()=>verifyV091SourceScope({...input,[key]:value}),/must be ancestors/);
 const file=input.changedFiles[0];
 assert.throws(()=>verifyV091SourceScope({...input,release:input.release.replace("'"+file+"' \\","'creator-v1/**' \\")}),/literal file paths/);
 const missingPin=input.release.replace('git merge-base --is-ancestor '+V091_APPLICATION_SOURCE+' HEAD',
   'git merge-base --is-ancestor '+'0'.repeat(40)+' HEAD');
 assert.throws(()=>verifyV091SourceScope({...input,release:missingPin}),/production ancestry pin is stale/);
});
test('read-only CI requires full history and the actual source-scope check before public canary work',()=>{
 const qa=readFileSync(new URL('../../.github/workflows/v091-live-readonly-qa.yml',import.meta.url),'utf8');
 assert.match(qa,/persist-credentials: false\s+fetch-depth: 0/);
 const gate=qa.indexOf('node creator-v1/ops/v091-release-acceptance.mjs --source-only');
 assert.ok(gate>0&&gate<qa.indexOf('name: Verify read-only API checks'));
 assert.doesNotMatch(qa,/CLOUDFLARE_API_TOKEN|wrangler deploy|wrangler versions upload/);
});
