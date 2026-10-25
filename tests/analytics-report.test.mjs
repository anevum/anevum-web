import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANALYTICS_REPORT_VERSION,
  summarizeCreatorRecords,
  summarizeRumGroups,
  composeAnalyticsEvidenceReport,
} from '../ops/feedback-relay/analytics-report.mjs';

const times = {capturedAtUtc:'2026-10-25T16:30:00Z',windowStartUtc:'2026-10-18T00:00:00Z'};
const accounts = {account_records:'8',verified_account_records:'8',created_last_24h:'2',created_last_7d:'5',created_last_30d:'8'};
const creator = {
  creator_profile_records:'7', studio_project_records:'1', studio_submission_records:'1',
  uplink_package_records:'1', published_uplink_records:'1', forum_thread_records:'1',
  forum_reply_records:'0', wall_post_records:'4', project_vote_records:'1',project_save_records:'1',
};
const rum = [
  {utc_day:'2026-10-24',route_group:'restricted',deviceType:'mobile',recorded_samples:'8',sample_weighted_page_loads:'8'},
  {utc_day:'2026-10-24',route_group:'home',deviceType:'mobile',recorded_samples:'3',sample_weighted_page_loads:'4'},
  {utc_day:'2026-10-23',route_group:'other_nonstaff',deviceType:'desktop',recorded_samples:'2',sample_weighted_page_loads:'2'},
];

test('multi-source report remains source-labeled and distinguishes account, records and beacons',()=>{
  const got=composeAnalyticsEvidenceReport({...times,accountRow:accounts,creatorRow:creator,rumRows:rum});
  assert.equal(got.schema_version,ANALYTICS_REPORT_VERSION);
  assert.equal(got.accounts.accounts,8);
  assert.equal(got.accounts.last24h,2);
  assert.equal(got.creator.records.creator_profile_records,7);
  assert.equal(got.creator.records.published_uplink_records,1);
  assert.equal(got.rum.capturedPageLoadSamples,13);
  assert.equal(got.rum.weightedPageLoads,14);
  assert.equal(got.rum.restrictedSamples,8);
  assert.equal(got.rum.nonstaffSamples,5);
  assert.equal(got.rum.byDevice.mobile,11);
  assert.equal(got.rum.byDevice.desktop,2);
  assert.equal(got.rum.uniqueHumanVisitors,null);
  assert.equal(got.social_and_retention.social_to_signup_conversion,null);
  assert.equal(got.source_quality.unique_visitors,'UNAVAILABLE');
});

test('no input means unavailable, not zero',()=>{
  const got=composeAnalyticsEvidenceReport(times);
  assert.equal(got.accounts.status,'UNAVAILABLE');
  assert.equal(got.source_quality.registration,'UNAVAILABLE');
  assert.equal(got.source_quality.creator_records,'UNAVAILABLE');
  assert.equal(got.source_quality.page_loads,'UNAVAILABLE');
  assert.equal(got.accounts.accounts,null);
  assert.equal(got.creator.records,null);
  assert.equal(got.rum.capturedPageLoadSamples,null);
  assert.equal(got.social_and_retention.monthly_active_people,null);
});

test('explicit complete empty sample response means zero captured samples, not zero people',()=>{
  const r=summarizeRumGroups([]);
  assert.equal(r.status,'PARTIAL_SAMPLED');
  assert.equal(r.capturedPageLoadSamples,0);
  assert.equal(r.uniqueHumanVisitors,null);
});

test('creator object cannot leak identity-bearing additional fields to the report',()=>{
  const got=summarizeCreatorRecords({...creator,user_id:'private-account',email:'private@example.test',secret:'private'});
  assert.equal(got.records.creator_profile_records,7);
  assert.equal(Object.keys(got.records).length,10);
  const serialized=JSON.stringify(got);
  assert.doesNotMatch(serialized,/private|email|user_id/);
  assert.ok(Object.isFrozen(got.records));
});

test('creator miscounts and missing fields are rejected, rather than silently zero',()=>{
  assert.throws(()=>summarizeCreatorRecords({...creator,published_uplink_records:3}),/Published count/);
  assert.throws(()=>summarizeCreatorRecords({...creator,creator_profile_records:undefined}),/Invalid aggregate/);
  assert.throws(()=>summarizeCreatorRecords([]),/expected/);
});

test('reject malformed RUM grouping, weights, duplicate groups and injected values',()=>{
  const first=rum[0];
  for(const altered of [
    {...first,route_group:'staff-sensitive'},
    {...first,deviceType:1},
    {...first,utc_day:'2026-10-24 OR 1=1'},
    {...first,recorded_samples:-1},
    {...first,sample_weighted_page_loads:2},
  ]) assert.throws(()=>summarizeRumGroups([altered]),/Invalid|weight/);
  assert.throws(()=>summarizeRumGroups([first,{...first}]),/Duplicate RUM group/);
});

test('report time range must be canonical UTC and ordered',()=>{
  assert.throws(()=>composeAnalyticsEvidenceReport({...times,windowStartUtc:'2026-10-26T00:00:00Z'}),/after capture/);
  assert.throws(()=>composeAnalyticsEvidenceReport({...times,capturedAtUtc:'not a date'}),/Expected exact UTC/);
});

test('reports preserve only allowed RUM group rollups, never per-page links or identities',()=>{
  const r=summarizeRumGroups([{...rum[1],requestPath:'/account/private',source_url:'https://example.test/?token=SECRET',userId:'secret'}]);
  const serialized=JSON.stringify(r);
  assert.doesNotMatch(serialized,/SECRET|account\/private|userId|source_url/);
  assert.equal(r.nonstaffSamples,3);
});
