import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyV091Acceptance,V091_APPLICATION_SOURCE} from '../ops/v091-release-acceptance.mjs';
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
 assert.equal(files.length,59,'The candidate contains exactly 59 reviewed source files');
 assert.equal(new Set(files).size,files.length,'No duplicated entries');
 assert.deepEqual(files,[...files].sort(),'Source scope must be deterministic');
 for(const required of [
  'creator-v1/web/src/components/IrenGuidedContinuance.tsx',
  'creator-v1/web/src/iren-living-v088.css',
  'creator-v1/web/src/iren-guided-v080.css',
  'creator-v1/test/iren-first-contact-v092.test.mjs',
  'creator-v1/web/src/pages/AuraCodexPage.tsx',
  'creator-v1/test/aura-codex-visual-v091.mjs',
  '.github/workflows/v091-aura-codex-browser.yml',
  'creator-v1/test/capture-home-navigation-v079.mjs'
 ])assert.ok(files.includes(required),'Reviewed source is missing '+required);
 assert.ok(files.every(file=>!/[?*{}]/.test(file)),'Globs are not allowed in the release scope');
 assert.ok(release.includes('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"'));
 assert.match(release,/ANEVUM_LAUNCH_APPROVED/);
 assert.match(release,/CLOUDFLARE_ACCOUNT_ID/);
});
