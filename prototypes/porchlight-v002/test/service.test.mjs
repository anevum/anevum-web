import test from 'node:test';
import assert from 'node:assert/strict';
import {createPorchlightHandler} from '../service.mjs';
import {createHarness, submit, review, BLOCK_FORM, EXACT_FORM, ORIGIN} from './harness.mjs';

const PINS='/v1/events/halloween-2026/pins';

test('default Worker entrypoint never serves data without verified identity integration', async()=>{
  const response=await (await import('../service.mjs')).default.fetch(new Request(ORIGIN+PINS));
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'not_configured');
});

test('feature flag and identity adapter each fail closed', async()=>{
  let h=createHarness({flag:'false'});
  assert.equal((await h.request('GET',PINS)).status,503);
  h=createHarness({withResolver:false});
  assert.equal((await h.request('GET',PINS)).status,503);
});

test('public map begins empty, is never cached, and contains no real data', async()=>{
  const h=createHarness(); const r=await h.request('GET',PINS);
  assert.equal(r.status,200); assert.equal(r.body.status,'active');assert.deepEqual(r.body.pins,[]);
  assert.match(r.headers.get('cache-control'),/no-store/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');
});

test('untrusted CF-Access headers alone never authenticate a host', async()=>{
  const h=createHarness();
  const r=await h.request('POST','/v1/events/halloween-2026/submissions',{
    headers:{'CF-Access-Authenticated-User-Email':'organizer@example.test','X-User-Id':'manager-A'},body:BLOCK_FORM,
  });
  assert.equal(r.status,401);
});

test('cross-origin POST and missing Origin are rejected', async()=>{
  const h=createHarness();
  const wrong=await h.request('POST','/v1/events/halloween-2026/submissions',{actor:'host-A',body:BLOCK_FORM,headers:{Origin:'https://another.example'}});
  assert.deepEqual([wrong.status,wrong.body.error],[403,'origin_denied']);
  const missing=await h.request('POST','/v1/events/halloween-2026/submissions',{actor:'host-A',body:BLOCK_FORM,headers:{Origin:''}});
  assert.equal(missing.status,403);
});

test('consent and affirmative adult/property authority attestation are required', async()=>{
  const h=createHarness();
  for (const field of ['consentConfirmed','adultAttested','authorizedResidentAttested']) {
    const r=await submit(h,'host-A',{...BLOCK_FORM,[field]:false});
    assert.equal(r.status,422,field);
  }
  assert.equal((await submit(h,'host-A',{...BLOCK_FORM,consentVersion:'obsolete'})).status,422);
  assert.equal(h.db.rows('SELECT * FROM porchlight_host_submissions').length,0);
});

test('plain text validation rejects XSS, control chars and arbitrary fields', async()=>{
  const h=createHarness();
  for(const payload of [{...BLOCK_FORM,label:'<script>evil()</script>'}, {...BLOCK_FORM,unknown:'unapproved'}, {...BLOCK_FORM,blockCode:'123-street!'}]) {
    assert.equal((await submit(h,'host-A',payload)).status,422);
  }
});

test('verified adult can submit, pending record is private and organizer can review', async()=>{
  const h=createHarness();const s=await submit(h);
  assert.equal(s.status,201);assert.equal(s.body.submission.status,'pending');
  const list=await h.request('GET','/v1/host/submissions',{actor:'host-A'});
  assert.equal(list.body.submissions.length,1);
  const pins=await h.request('GET',PINS);
  assert.equal(pins.body.pins.length,0);
  const queue=await h.request('GET','/v1/organizer/events/halloween-2026/submissions',{actor:'moderator-A'});
  assert.equal(queue.status,200);assert.equal(queue.body.submissions[0].privateAddress,BLOCK_FORM.privateAddress);
  assert.equal(queue.body.submissions[0].consentVersion,BLOCK_FORM.consentVersion);
  assert.equal(h.db.rows('SELECT * FROM porchlight_audit').length,1);
});

test('cross-account submission enumeration and withdrawal are denied', async()=>{
  const h=createHarness();const a=await submit(h);
  const b=await h.request('GET','/v1/host/submissions',{actor:'host-B'});
  assert.deepEqual(b.body.submissions,[]);
  const wrong=await h.request('POST',`/v1/host/submissions/${a.body.submission.id}/withdraw`,{actor:'host-B',body:{}});
  assert.equal(wrong.status,404);
  const row=h.db.one('SELECT status FROM porchlight_host_submissions WHERE id=?',a.body.submission.id);
  assert.equal(row.status,'pending');
});

test('organizer access is event scoped and a revoked grant is denied', async()=>{
  const h=createHarness();const s=await submit(h);
  assert.equal((await review(h,s.body.submission.id,'approve','moderator-B')).status,403);
  assert.equal((await review(h,s.body.submission.id,'approve','retired-A')).status,403);
  assert.equal((await h.request('GET','/v1/organizer/events/halloween-2026/submissions',{actor:'moderator-B'})).status,403);
});

test('no self-approval even if a host also holds organizer permissions', async()=>{
  const h=createHarness();const s=await submit(h,'moderator-A');
  assert.equal((await review(h,s.body.submission.id,'approve','moderator-A')).status,403);
});

test('host is never published without independent property verification decision', async()=>{
  const h=createHarness();const s=await submit(h);
  const denied=await h.request('POST',`/v1/organizer/submissions/${s.body.submission.id}/approve`,{
    actor:'moderator-A',body:{expectedRevision:1,reason:'Confirmed directly with property owner',verifiedPropertyAuthority:false,verificationMethod:'direct-confirmation'},
  });
  assert.equal(denied.status,422);
  const a=await review(h,s.body.submission.id,'approve');
  assert.deepEqual([a.status,a.body.status,a.body.revision],[200,'approved',2]);
  const pins=await h.request('GET',PINS);
  assert.equal(pins.body.pins.length,1);
  assert.deepEqual(pins.body.pins[0],{
    id:s.body.submission.id,label:BLOCK_FORM.label,mode:'block',place:'Fictional Lantern Walk',coords:null,offerings:BLOCK_FORM.tags,
  });
  const serialized=JSON.stringify(pins.body);
  for(const token of [BLOCK_FORM.privateAddress,'host-A','adult_attested','consented_at','reviewed_by','mutation_id']) assert.ok(!serialized.includes(token),token);
  assert.match(pins.headers.get('cache-control'),/no-store/);
});

test('exact address and coordinates require both explicit disclosure consents', async()=>{
  const h=createHarness();
  assert.equal((await submit(h,'host-A',{...EXACT_FORM,exactAddressConsent:false})).status,422);
  assert.equal((await submit(h,'host-A',{...EXACT_FORM,exactLocationConsent:false})).status,422);
  assert.equal((await submit(h,'host-A',{...BLOCK_FORM,lat:28.2})).status,422);
  const s=await submit(h,'host-A',EXACT_FORM);
  assert.equal(s.status,201);
  assert.equal((await review(h,s.body.submission.id,'approve')).status,200);
  const pins=await h.request('GET',PINS);assert.equal(pins.body.pins[0].place,EXACT_FORM.privateAddress);
  assert.deepEqual(pins.body.pins[0].coords,{lat:28.25,lng:-81.29});
});

test('stale review revision is rejected and does not double-audit', async()=>{
  const h=createHarness();const s=await submit(h);
  assert.equal((await review(h,s.body.submission.id,'approve')).status,200);
  assert.equal((await review(h,s.body.submission.id,'approve')).status,409);
  assert.equal(h.db.rows('SELECT * FROM porchlight_audit').length,2);
});

test('host withdrawal immediately removes an approved public listing', async()=>{
  const h=createHarness();const s=await submit(h);
  await review(h,s.body.submission.id,'approve');
  assert.equal((await h.request('GET',PINS)).body.pins.length,1);
  const w=await h.request('POST',`/v1/host/submissions/${s.body.submission.id}/withdraw`,{actor:'host-A',body:{}});
  assert.equal(w.status,200);assert.equal(w.body.status,'withdrawn');
  assert.equal((await h.request('GET',PINS)).body.pins.length,0);
  assert.equal((await h.request('POST',`/v1/host/submissions/${s.body.submission.id}/withdraw`,{actor:'host-A',body:{}})).status,200);
  assert.equal(h.db.rows("SELECT * FROM porchlight_audit WHERE action='host_withdraw'").length,1);
});

test('rejection and removal suppress public listings, withdrawn host can submit again', async()=>{
  const h=createHarness();const s=await submit(h);
  assert.equal((await review(h,s.body.submission.id,'reject')).status,200);
  assert.equal((await h.request('GET',PINS)).body.pins.length,0);
  const retry=await submit(h,'host-A');assert.equal(retry.status,201);
  assert.equal((await review(h,retry.body.submission.id,'approve')).status,200);
  assert.equal((await review(h,retry.body.submission.id,'remove','moderator-A',2)).status,200);
  assert.equal((await h.request('GET',PINS)).body.pins.length,0);
  assert.equal((await submit(h,'host-A')).status,201);
});

test('active duplicate host submission denied', async()=>{
  const h=createHarness();assert.equal((await submit(h)).status,201);
  assert.equal((await submit(h)).status,409);
  assert.equal(h.db.rows('SELECT * FROM porchlight_host_submissions').length,1);
});

test('organizer pause requires manager and causes all pins to disappear immediately', async()=>{
  const h=createHarness();const s=await submit(h);await review(h,s.body.submission.id,'approve');
  const path='/v1/organizer/events/halloween-2026/pause';
  assert.equal((await h.request('POST',path,{actor:'moderator-A',body:{reason:'Suspicious duplicate house reports require a pause'}})).status,403);
  const p=await h.request('POST',path,{actor:'manager-A',body:{reason:'Suspicious duplicate house reports require a pause'}});
  assert.equal(p.status,200);assert.equal(p.body.status,'paused');
  assert.deepEqual((await h.request('GET',PINS)).body,{status:'inactive',pins:[]});
  assert.equal((await submit(h,'host-C')).status,404);
  assert.equal((await h.request('POST',path,{actor:'manager-A',body:{reason:'Attempting to pause twice for testing'}})).status,409);
  assert.equal(h.db.rows("SELECT * FROM porchlight_audit WHERE action='organizer_pause'").length,1);
});

test('public listings expire synchronously when the event window ends', async()=>{
  const h=createHarness();const s=await submit(h);await review(h,s.body.submission.id,'approve');
  h.clock.today='2026-11-01T01:59:59.000Z';assert.equal((await h.request('GET',PINS)).body.pins.length,1);
  h.clock.today='2026-11-01T02:00:00.000Z';assert.deepEqual((await h.request('GET',PINS)).body,{status:'inactive',pins:[]});
  assert.equal((await submit(h,'host-C')).status,404);
});

test('request body over limit fails without allocation of unlimited data', async()=>{
  const h=createHarness();const huge={...BLOCK_FORM,label:'A'.repeat(5000)};
  const r=await submit(h,'host-A',huge);assert.equal(r.status,413);
});

test('new host submissions fail closed if abuse-prevention adapter not connected', async()=>{
  const h=createHarness({quota:null});const r=await submit(h);
  assert.deepEqual([r.status,r.body.error],[503,'abuse_prevention_unavailable']);
});

test('quota-denied submission cannot create private records', async()=>{
  const h=createHarness({quota:false});const r=await submit(h);
  assert.equal(r.status,429);assert.equal(h.db.rows('SELECT * FROM porchlight_host_submissions').length,0);
});

test('closed or draft event never exposes approved records', async()=>{
  const h=createHarness();const s=await submit(h);await review(h,s.body.submission.id,'approve');
  h.db.exec("UPDATE porchlight_events SET status='draft'");
  assert.deepEqual((await h.request('GET',PINS)).body,{status:'inactive',pins:[]});
});

test('event route identifiers cannot inject SQL or traverse resources', async()=>{
  const h=createHarness();
  assert.equal((await h.request('GET','/v1/events/%27%20OR%201%3D1/pins')).status,404);
  assert.deepEqual((await h.request('GET','/v1/events/%27%20OR%201%3D1/pins')).body,{error:'not_found'});
});

test('block-level public place always comes from event-owned whitelist, not host-supplied text', async()=>{
  const h=createHarness();
  assert.equal((await submit(h,'host-A',{...BLOCK_FORM,blockCode:'snow-ridge'})).status,422);
  assert.equal((await submit(h,'host-A',{...BLOCK_FORM,blockCode:'unknown-block'})).status,422);
  assert.equal((await submit(h,'host-A',{...BLOCK_FORM,blockLabel:'123 Private Road'})).status,422);
  const s=await submit(h);assert.equal(s.status,201);
  await review(h,s.body.submission.id,'approve');
  assert.equal((await h.request('GET',PINS)).body.pins[0].place,'Fictional Lantern Walk');
});
