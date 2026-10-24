import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 EVENT_SCHEMA_VERSION,GROWTH_EVENTS,GROWTH_METRICS,validateGrowthEvent,eventIsMeaningful
} from '../analytics/growth-events-v1.mjs';

const DATE='2026-10-23T21:10:11.000Z', NOW=Date.parse(DATE);
const valid={
 schemaVersion:1,eventId:'550e8400-e29b-41d4-a716-446655440000',
 eventName:'signup_started',occurredAt:DATE,
 dimensions:{surface:'join',device:'mobile',campaignSource:'reddit',campaignMedium:'community',campaignName:'founding-testers'}
};
const check=(event=valid,authority='client')=>validateGrowthEvent(event,{authority,now:NOW});
const invalid=(x,authority='client')=>assert.throws(()=>check(x,authority),/ANEVUM_GROWTH_EVENT_INVALID/);
test('24 versioned growth events are declared with immutable provenance and classifications',()=>{
 assert.equal(EVENT_SCHEMA_VERSION,1);
 assert.equal(Object.keys(GROWTH_EVENTS).length,24);
 assert.ok(Object.isFrozen(GROWTH_EVENTS));
 assert.ok(Object.values(GROWTH_EVENTS).every(x=>Object.isFrozen(x)));
 assert.equal(GROWTH_EVENTS.account_created.authority,'server');
 assert.equal(GROWTH_EVENTS.landing_view.authority,'client');
});
test('valid client event includes a restricted projection only; never actor or raw URLs',()=>{
 const out=check();
 assert.deepEqual(out,valid);
 assert.ok(Object.isFrozen(out));
 assert.ok(Object.isFrozen(out.dimensions));
 assert.equal(out.actor,undefined);
});
test('client claims of server-confirmed meaningful actions, payments and rewards are refused',()=>{
 for(const eventName of ['account_created','email_verified','project_saved','project_published','creator_achievement_issued','payment_settled','payment_refunded']){
  invalid({...valid,eventName});
  assert.equal(check({...valid,eventName},'server').eventName,eventName);
 }
});
test('no email, IP, private message, raw URL or claimed member ID can enter event envelope',()=>{
 for(const key of ['email','ip','memberId','actorId','url','referer','privateMessage','role','consent','testFlag']){
  invalid({...valid,[key]:'test@example.com'});
 }
});
test('unknown, malformed and personally identifying dimensions are refused rather than stored',()=>{
 invalid({...valid,dimensions:{...valid.dimensions,email:'test@example.com'}});
 invalid({...valid,dimensions:{campaignSource:'test@example.com'}});
 invalid({...valid,dimensions:{campaignName:'me@example.com'}});
 invalid({...valid,dimensions:{campaignSource:'reddit',rawReferrer:'https://s.example/?token=abc'}});
 invalid({...valid,dimensions:{surface:'private-message'}});
 invalid({...valid,dimensions:{device:'invalid-device'}});
 invalid({...valid,dimensions:{campaignContent:'../admin'}});
 invalid({...valid,dimensions:{campaignMedium:'UNTRUSTED_SOURCE'}});
 invalid({...valid,dimensions:Object.fromEntries(Array.from({length:8},(_,i)=>['field'+i,'x']))});
});
test('timestamps are UTC milliseconds, canonical, bounded and cannot be freely backdated',()=>{
 invalid({...valid,occurredAt:'2026-10-23T21:10:11Z'});
 invalid({...valid,occurredAt:'2026-02-30T21:10:11.000Z'});
 invalid({...valid,occurredAt:'2020-01-01T00:00:00.000Z'});
 invalid({...valid,occurredAt:'2026-10-26T00:00:00.000Z'});
 invalid({...valid,occurredAt:'not a date'});
});
test('invalid event identity, authority, extra fields, and schema version fail closed',()=>{
 invalid({...valid,eventId:'not-a-uuid'});
 invalid({...valid,eventName:'invented_xp_bonus'});
 invalid({...valid,schemaVersion:99});
 invalid({...valid,eventName:null});
 assert.throws(()=>validateGrowthEvent(valid,{authority:'admin',now:NOW}),/invalid authority/);
 assert.throws(()=>validateGrowthEvent([], {now:NOW}),/object required/);
});
test('only trusted, server-confirmed qualifying actions can contribute to meaningful engagement',()=>{
 const allowed=GROWTH_METRICS.weeklyMeaningfulParticipants.qualifyingEvents;
 assert.ok(allowed.length>=4);
 assert.ok(allowed.every(k=>GROWTH_EVENTS[k].authority==='server'));
 for(const k of ['landing_view','signup_started','studio_opened','project_play_intent','project_voted','creator_achievement_issued','payment_settled','community_reply_published','community_post_published']){
  assert.equal(eventIsMeaningful(k),false);
  assert.equal(allowed.includes(k),false);
 }
 assert.ok(allowed.includes('community_contribution_qualified'));
 for(const k of allowed)assert.equal(eventIsMeaningful(k),true);
 assert.equal(GROWTH_METRICS.weeklyMeaningfulParticipants.status,'not-instrumented');
});
test('the registry module contains no network, storage, grant or payment implementation',()=>{
 const s=readFileSync(new URL('../analytics/growth-events-v1.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(s,/fetch\s*\(|writeDataPoint|\\.prepare\s*\(|\\.put\s*\(|XMLHttpRequest|INSERT INTO|window\\.location/);
});
