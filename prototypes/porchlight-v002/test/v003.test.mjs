import test from 'node:test';
import assert from 'node:assert/strict';
import {createHarness, BLOCK_FORM, EXACT_FORM, submit, review, ORIGIN} from './harness.mjs';

const EVENT='halloween-2026';
const PINS=`/v1/events/${EVENT}/pins`;
const BLOCKS=`/v1/events/${EVENT}/blocks`;

test('a public participant can read only organizer-approved block codes and no private addresses',async()=>{
  const h=createHarness();const response=await h.request('GET',BLOCKS);
  assert.equal(response.status,200);
  assert.deepEqual(response.body.blocks,[{code:'lantern-walk',label:'Fictional Lantern Walk'},{code:'oak-court',label:'Fictional Oak Court'}]);
  assert.equal(response.body.consentVersion,'porchlight-host-consent-v1');
  assert.equal(response.body.status,'active');
  assert.ok(!JSON.stringify(response.body).includes('Example Street'));
  assert.match(response.headers.get('cache-control'),/no-store/);
});

test('unknown or paused event never returns approved blocks',async()=>{
  const h=createHarness();
  assert.deepEqual((await h.request('GET','/v1/events/unknown/blocks')).body.blocks,[]);
  const p=await h.request('POST',`/v1/organizer/events/${EVENT}/pause`,{actor:'manager-A',body:{reason:'Security rehearsal requires temporary shutdown'}});
  assert.equal(p.status,200);
  const res=await h.request('GET',BLOCKS);
  assert.deepEqual(res.body,{status:'inactive',blocks:[]});
});

test('private session displays only server-granted event role, never browser-requested privilege',async()=>{
  const h=createHarness();const get=actor=>h.request('GET',`/v1/session?event=${EVENT}&role=manager`,{actor,headers:{'X-Admin-Role':'manager'}});
  assert.equal((await get(undefined)).status,401);
  assert.equal((await get('host-A')).body.role,null);
  assert.equal((await get('moderator-A')).body.role,'reviewer');
  assert.equal((await get('manager-A')).body.role,'manager');
  assert.equal((await get('moderator-B')).body.role,null);
  assert.equal((await get('retired-A')).body.role,null);
});

test('private session rejects unverified email and without adult eligibility',async()=>{
  const h=createHarness();
  for(const actor of [
    {id:'host-A',verified:true,emailVerified:false,adultEligible:true},
    {id:'host-A',verified:true,emailVerified:true,adultEligible:false},
    {id:'host-A',verified:false,emailVerified:true,adultEligible:true},
    {id:'host-A',verified:true,emailVerified:true},
  ]) {
    assert.equal((await h.request('GET',`/v1/session?event=${EVENT}`,{actor})).status,401);
    assert.equal((await h.request('POST',`/v1/events/${EVENT}/submissions`,{actor,body:BLOCK_FORM})).status,401);
  }
});

test('host withdrawal scrubs location and private text and never resurfaces public pin',async()=>{
  const h=createHarness();const s=await submit(h,'host-A',EXACT_FORM);
  assert.equal(s.status,201);
  const id=s.body.submission.id;
  assert.equal((await review(h,id,'approve')).status,200);
  assert.equal((await h.request('GET',PINS)).body.pins.length,1);
  const w=await h.request('POST',`/v1/host/submissions/${id}/withdraw`,{actor:'host-A',body:{}});
  assert.equal(w.status,200);
  const row=h.db.one('SELECT * FROM porchlight_host_submissions WHERE id=?',id);
  assert.equal(row.private_address,'[deleted]');
  assert.equal(row.public_exact_address,null);
  assert.equal(row.public_lat,null);
  assert.equal(row.public_lng,null);
  assert.equal(row.display_mode,'block');
  assert.equal(row.status,'withdrawn');
  assert.equal((await h.request('GET',PINS)).body.pins.length,0);
  assert.equal((await h.request('GET','/v1/organizer/events/halloween-2026/submissions',{actor:'moderator-A'})).body.submissions[0].privateAddress,'[deleted]');
});

test('rejection clears an unapproved exact address instead of retaining private home data',async()=>{
  const h=createHarness();const s=await submit(h,'host-A',EXACT_FORM);
  const decision=await review(h,s.body.submission.id,'reject');assert.equal(decision.status,200);
  const row=h.db.one('SELECT * FROM porchlight_host_submissions WHERE id=?',s.body.submission.id);
  assert.equal(row.private_address,'[deleted]');
  assert.equal(row.public_exact_address,null);
  assert.equal(row.public_lat,null);
  assert.equal(row.display_mode,'block');
  assert.equal(row.status,'rejected');
});

test('block and session APIs do not reveal data once event has ended',async()=>{
  const h=createHarness({today:'2026-11-02T00:00:00.000Z'});
  assert.deepEqual((await h.request('GET',BLOCKS)).body.blocks,[]);
  assert.equal((await h.request('GET',`/v1/session?event=${EVENT}`,{actor:'manager-A'})).body.canSubmit,false);
});

test('organizer removal scrubs public and private location details',async()=>{
  const h=createHarness();const s=await submit(h,'host-A',EXACT_FORM);
  const id=s.body.submission.id;
  assert.equal((await review(h,id,'approve')).status,200);
  assert.equal((await review(h,id,'remove','moderator-A',2)).status,200);
  const row=h.db.one('SELECT * FROM porchlight_host_submissions WHERE id=?',id);
  assert.equal(row.status,'removed');
  assert.equal(row.private_address,'[deleted]');
  assert.equal(row.public_exact_address,null);
  assert.equal(row.public_lat,null);
  assert.equal(row.public_lng,null);
  assert.equal((await h.request('GET',PINS)).body.pins.length,0);
});
