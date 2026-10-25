import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FUNNEL_CONTRACT_VERSION, CLIENT_EVENT_COLLECTION_ENABLED,
  FUNNEL_EVENT_DEFINITIONS, normalizeFunnelEvent, qualifiedFunnelRate,
} from '../ops/feedback-relay/funnel-contract.mjs';

const timestamp='2026-10-25T16:00:00Z';

test('future browser event collection is OFF by default',()=>{
  assert.equal(CLIENT_EVENT_COLLECTION_ENABLED,false);
  assert.equal(FUNNEL_CONTRACT_VERSION,'anevum.funnel-events.v1');
  assert.equal(FUNNEL_EVENT_DEFINITIONS.account_created.origin,'verified_backend');
  assert.equal(FUNNEL_EVENT_DEFINITIONS.signup_started.origin,'consented_client');
});

test('consented event can be normalized but never authorizes collection',()=>{
  const r=normalizeFunnelEvent({name:'landing_view',origin:'consented_client',consent:'GRANTED',occurred_at_utc:timestamp,device:'mobile',route_group:'landing',release_cohort:'V136'});
  assert.equal(r.name,'landing_view');
  assert.equal(r.device,'mobile');
  assert.equal(r.release_cohort,'V136');
  assert.equal(r.authorized_to_collect,false);
  assert.equal(Object.isFrozen(r),true);
});

test('backend event requires verified provenance, never client asserted origin',()=>{
  const r=normalizeFunnelEvent({name:'account_created',origin:'verified_backend',occurred_at_utc:timestamp});
  assert.equal(r.name,'account_created');
  assert.equal(r.authorized_to_collect,false);
  assert.throws(()=>normalizeFunnelEvent({name:'account_created',origin:'consented_client',consent:'GRANTED',occurred_at_utc:timestamp}),/origin/);
  assert.throws(()=>normalizeFunnelEvent({name:'account_created',origin:'verified_backend',consent:'GRANTED',occurred_at_utc:timestamp}),/cannot assert/);
});

test('client event without GRANTED consent is never normalized',()=>{
  const basic={name:'signup_started',origin:'consented_client',occurred_at_utc:timestamp};
  assert.throws(()=>normalizeFunnelEvent(basic),/Consent required/);
  assert.throws(()=>normalizeFunnelEvent({...basic,consent:'DENIED'}),/Consent required/);
});

test('raw identifiers and fingerprints are rejected, even when all other fields valid',()=>{
  const basic={name:'studio_opened',origin:'consented_client',consent:'GRANTED',occurred_at_utc:timestamp};
  for(const name of ['user_id','email','ipAddress','requestPath','source_url','session_id','device_fingerprint','project_title','utm_raw']) {
    assert.throws(()=>normalizeFunnelEvent({...basic,[name]:'anything'}),/Unsupported event field/);
  }
});

test('malformed names, timestamps, arbitrary routes and release strings fail closed',()=>{
  const basic={name:'landing_view',origin:'consented_client',consent:'GRANTED',occurred_at_utc:timestamp};
  for(const x of [
    {...basic,name:'grant_upload_permission'},
    {...basic,device:'iPhone17,3'},
    {...basic,route_group:'/account/private'},
    {...basic,release_cohort:'release?userId=person'},
    {...basic,occurred_at_utc:'2026-10-25T16:00:00-04:00'},
    {...basic,occurred_at_utc:'2026-10-25T16:00:00Z; DROP TABLE user;'},
  ])assert.throws(()=>normalizeFunnelEvent(x),/Unknown|device|route|release|timestamp/);
});

test('event normalization never echoes consent token or unrelated dynamic properties',()=>{
  const r=normalizeFunnelEvent({name:'studio_project_created',origin:'verified_backend',occurred_at_utc:timestamp,route_group:'studio'});
  assert.deepEqual(Object.keys(r).sort(),['schema_version','name','origin','occurred_at_utc','route_group','authorized_to_collect'].sort());
  assert.equal('consent' in r,false);
});

test('conversion is unavailable until both measurements and comparable cohorts are verified',()=>{
  assert.deepEqual(qualifiedFunnelRate({numerator:2,denominator:8,comparable:false}),{status:'UNAVAILABLE',ratio:null});
  assert.deepEqual(qualifiedFunnelRate({numerator:null,denominator:8,comparable:true}),{status:'UNAVAILABLE',ratio:null});
  assert.deepEqual(qualifiedFunnelRate({numerator:2,denominator:null,comparable:true}),{status:'UNAVAILABLE',ratio:null});
});

test('zero denominator is not a 0% conversion',()=>{
  assert.deepEqual(qualifiedFunnelRate({numerator:0,denominator:0,comparable:true}),{status:'NO_DENOMINATOR',ratio:null});
});

test('eligible comparable counts can yield a qualified rate',()=>{
  assert.deepEqual(qualifiedFunnelRate({numerator:2,denominator:8,comparable:true}),{status:'VERIFIED_COHORT',ratio:0.25});
  assert.deepEqual(qualifiedFunnelRate({numerator:0,denominator:8,comparable:true}),{status:'VERIFIED_COHORT',ratio:0});
});

test('invalid cohort numerators cannot be smuggled into conversion rate',()=>{
  assert.throws(()=>qualifiedFunnelRate({numerator:9,denominator:8,comparable:true}),/Non-comparable/);
  assert.throws(()=>qualifiedFunnelRate({numerator:'2.5',denominator:8,comparable:true}),/Invalid funnel count/);
  assert.throws(()=>qualifiedFunnelRate({numerator:-1,denominator:8,comparable:true}),/Invalid funnel count/);
});
