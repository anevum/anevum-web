import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHarness, BLOCK_FORM, submit, review} from './harness.mjs';
import {runPorchlightRetention} from '../retention-v004.mjs';

const MIGRATION = readFileSync(new URL('../schema-v004.sql', import.meta.url), 'utf8');
const EVENT = 'halloween-2026';
const PINS = '/v1/events/' + EVENT + '/pins';
const REPORTS = '/v1/events/' + EVENT + '/reports';
const QUEUE = '/v1/organizer/events/' + EVENT + '/reports';
const DETAILS = 'An organizer should check this potentially incorrect public listing.';
function fixture(options={}) {
  const h=createHarness(options);
  h.db.exec(MIGRATION);
  h.env.PORCHLIGHT_REPORTS_ENABLED='true';
  return h;
}
async function approved(h) {
  const submission=await submit(h,'host-A',BLOCK_FORM);
  assert.equal(submission.status,201);
  const id=submission.body.submission.id;
  assert.equal((await review(h,id,'approve')).status,200);
  return id;
}
const payload=id=>({submissionId:id,reason:'incorrect',details:DETAILS});
const report=(h,id,opts={})=>h.request('POST',REPORTS,{body:payload(id),...opts});
const queue=(h,actor)=>h.request('GET',QUEUE,{actor});

test('default-disabled reporting refuses all writes, including approved homes',async()=>{
  const h=fixture(),id=await approved(h);
  h.env.PORCHLIGHT_REPORTS_ENABLED='false';
  assert.equal((await report(h,id)).status,503);
  assert.equal(h.db.rows('SELECT * FROM porchlight_reports').length,0);
});
test('anonymous reporting accepts only actually published same-event listings',async()=>{
  const h=fixture(),id=await approved(h);
  const result=await report(h,id);
  assert.equal(result.status,201);
  assert.equal(result.body.status,'received');
  assert.equal(h.db.rows('SELECT * FROM porchlight_reports').length,1);
  const publicData=(await h.request('GET',PINS)).body;
  assert.equal(publicData.pins.length,1);
  assert.ok(!JSON.stringify(publicData).includes(DETAILS));
  assert.ok(!JSON.stringify(result.body).includes(id));
  assert.match(result.headers.get('cache-control'),/no-store/);
  assert.equal((await report(h,'nonexistent-listing')).status,404);
  const pending=await submit(h,'host-B',{...BLOCK_FORM,label:'Pending House'});
  assert.equal(pending.status,201);
  assert.equal((await report(h,pending.body.submission.id)).status,404);
  assert.equal(h.db.rows('SELECT * FROM porchlight_reports').length,1);
});
test('independent identity gates keep reporter details invisible to unrelated adults',async()=>{
  const h=fixture(),id=await approved(h);
  assert.equal((await report(h,id)).status,201);
  assert.equal((await queue(h)).status,401);
  assert.equal((await queue(h,'host-A')).status,403);
  assert.equal((await queue(h,'moderator-B')).status,403);
  assert.equal((await queue(h,'retired-A')).status,403);
  const q=await queue(h,'moderator-A');
  assert.equal(q.status,200);
  assert.equal(q.body.reports.length,1);
  assert.equal(q.body.reports[0].details,DETAILS);
  assert.equal(q.body.reports[0].submissionId,id);
  assert.ok(!JSON.stringify(q.body).includes(BLOCK_FORM.privateAddress));
  assert.match(q.headers.get('cache-control'),/no-store/);
});
test('reviewer resolution is revision-bound, audited and cannot be forged',async()=>{
  const h=fixture(),id=await approved(h);
  assert.equal((await report(h,id)).status,201);
  const reportId=(await queue(h,'moderator-A')).body.reports[0].id;
  const path='/v1/organizer/reports/'+reportId+'/resolve';
  const payload={expectedRevision:1,reason:'Verified separately, listing remains permitted'};
  assert.equal((await h.request('POST',path,{actor:'host-A',body:payload})).status,403);
  assert.equal((await h.request('POST',path,{actor:'moderator-B',body:payload})).status,403);
  assert.equal((await h.request('POST',path,{actor:'retired-A',body:payload})).status,403);
  const done=await h.request('POST',path,{actor:'moderator-A',body:payload});
  assert.equal(done.status,200);
  assert.equal(done.body.status,'resolved');
  assert.equal((await queue(h,'moderator-A')).body.reports.length,0);
  assert.equal((await h.request('POST',path,{actor:'moderator-A',body:payload})).status,409);
  assert.equal(h.db.rows('SELECT * FROM porchlight_report_audit').length,1);
  assert.equal(h.db.one('SELECT revision FROM porchlight_reports WHERE id=?',reportId).revision,2);
});
test('unknown fields, malformed text, forged origin and quota failures fail closed',async()=>{
  const h=fixture(),id=await approved(h);
  assert.equal((await report(h,id,{headers:{Origin:'https://untrusted.invalid'}})).status,403);
  assert.equal((await report(h,id,{body:{...payload(id),admin:true}})).status,422);
  assert.equal((await report(h,id,{body:{...payload(id),details:'<script>no</script>'}})).status,422);
  assert.equal((await report(h,id,{body:{...payload(id),reason:'public-accusation'}})).status,422);
  assert.equal(h.db.rows('SELECT * FROM porchlight_reports').length,0);
  const limited=fixture({quota:false});
  assert.equal((await report(limited,'any-target')).status,429);
  assert.equal((await report(limited,'any-target',{overrideEnv:{PORCHLIGHT_REPORTS_ENABLED:'false'}})).status,503);
});
test('revoking consent destroys all reports that may contain private locations',async()=>{
  const h=fixture(),id=await approved(h);
  assert.equal((await report(h,id)).status,201);
  assert.equal((await h.request('POST','/v1/host/submissions/'+id+'/withdraw',{actor:'host-A',body:{}})).status,200);
  assert.equal(h.db.rows('SELECT * FROM porchlight_reports').length,0);
  assert.equal((await h.request('GET',PINS)).body.pins.length,0);
  assert.equal((await report(h,id)).status,404);
});
test('organizer removal removes related sensitive reports and public listing',async()=>{
  const h=fixture(),id=await approved(h);
  assert.equal((await report(h,id)).status,201);
  assert.equal((await review(h,id,'remove','moderator-A',2)).status,200);
  assert.equal(h.db.rows('SELECT * FROM porchlight_reports').length,0);
  assert.equal((await queue(h,'moderator-A')).body.reports.length,0);
  assert.equal((await h.request('GET',PINS)).body.pins.length,0);
});
test('disabled event and expired event refuse new reports',async()=>{
  const h=fixture(),id=await approved(h);
  assert.equal((await h.request('POST','/v1/organizer/events/'+EVENT+'/pause',
    {actor:'manager-A',body:{reason:'Privacy report requires a temporary public stop'}})).status,200);
  assert.equal((await report(h,id)).status,404);
  const expired=fixture({today:'2026-11-02T00:00:00.000Z'});
  assert.equal((await report(expired,'dummy-id')).status,404);
});
test('retention dry-run does not delete a single record; delete occurs after seven days',async()=>{
  const h=fixture(),id=await approved(h);
  assert.equal((await report(h,id)).status,201);
  h.db.raw.prepare("UPDATE porchlight_events SET public_from=?,starts_at=?,ends_at=? WHERE slug='lights-2026'")
    .run('2026-11-12T00:00:00.000Z','2026-11-13T00:00:00.000Z','2026-11-15T02:00:00.000Z');
  const at='2026-11-09T12:00:00.000Z';
  assert.deepEqual(await runPorchlightRetention({db:h.db,at}),{eligibleEvents:1,deletedEvents:0,retentionDays:7});
  assert.equal(h.db.rows('SELECT * FROM porchlight_reports').length,1);
  assert.equal((await runPorchlightRetention({db:h.db,at,allowDelete:true})).deletedEvents,1);
  assert.equal(h.db.rows('SELECT * FROM porchlight_reports').length,0);
  assert.equal(h.db.rows('SELECT * FROM porchlight_host_submissions').length,0);
  assert.equal(h.db.rows('SELECT * FROM porchlight_events').length,1);
  assert.equal(h.db.rows('SELECT * FROM porchlight_audit').length,0);
  assert.equal(h.db.rows('SELECT * FROM porchlight_organizer_grants WHERE event_id=?','ev-one').length,0);
});
test('retention never purges less-than-seven-day-old events or accepts invalid control inputs',async()=>{
  const h=fixture();
  const before='2026-11-07T01:59:59.000Z';
  assert.equal((await runPorchlightRetention({db:h.db,at:before,allowDelete:true})).deletedEvents,0);
  assert.equal(h.db.rows('SELECT * FROM porchlight_events').length,2);
  await assert.rejects(runPorchlightRetention({db:h.db,at:'invalid',allowDelete:true}),TypeError);
  await assert.rejects(runPorchlightRetention({db:h.db,at:before,maxEvents:100}),RangeError);
});
