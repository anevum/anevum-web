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
