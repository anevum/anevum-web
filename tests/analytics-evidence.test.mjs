import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANALYTICS_METRIC_VERSION,
  METRIC_COVERAGE,
  registrationSnapshotSQL,
  registrationDailySQL,
  creatorRecordSnapshotSQL,
  validateUtcStart,
  rumPageLoadSQL,
  rumReferrerSQL,
  edgeStatusSQL,
  summarizeAccountRecord,
} from '../ops/feedback-relay/analytics-evidence.mjs';

const START = '2026-10-18T00:00:00Z';

test('analytics contract is explicit about source availability and missing metrics', () => {
  assert.equal(ANALYTICS_METRIC_VERSION, 'anevum.analytics-evidence.v1');
  assert.equal(METRIC_COVERAGE.registrations, 'VERIFIED_AGGREGATE');
  assert.equal(METRIC_COVERAGE.unique_visitors, 'UNAVAILABLE');
  assert.equal(METRIC_COVERAGE.social_to_signup_attribution, 'UNAVAILABLE');
  assert.equal(METRIC_COVERAGE.rum_page_loads, 'PARTIAL_SAMPLED');
});

test('canonical account registration query uses ISO TEXT timestamp not numeric comparisons', () => {
  const query = registrationSnapshotSQL();
  assert.match(query, /unixepoch\(createdAt\)/);
  assert.match(query, /'now', '-1 day'/);
  assert.match(query, /'now', '-7 days'/);
  assert.match(query, /'now', '-30 days'/);
  assert.match(query, /coalesce\(sum\(/i);
  assert.doesNotMatch(query, /createdAt\s*[<>=]+\s*(?:\d|unixepoch\('now')/i);
  assert.doesNotMatch(query, /\b(?:email|password|name|image)\b\s*(?:,|FROM|AS)/i);
});

test('daily registrations use date of ISO string and bound row count', () => {
  const query = registrationDailySQL();
  assert.match(query, /date\(createdAt\)/);
  assert.match(query, /ORDER BY utc_day DESC LIMIT 31/);
  assert.doesNotMatch(query, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i);
});

test('creator snapshot keeps published Uplink distinct from private Studio submissions', () => {
  const query = creatorRecordSnapshotSQL();
  assert.match(query, /member_studio_submissions/);
  assert.match(query, /anevum_alpha_projects/);
  assert.match(query, /WHERE status = 'published'/);
  assert.match(query, /member_creator_profiles/);
  assert.doesNotMatch(query, /member_id|user_id|owner_id|email/);
});

test('UTC start must be canonical and not allow SQL injection or offset ambiguity', () => {
  assert.equal(validateUtcStart(START), START);
  for (const v of [
    "2026-10-18T00:00:00Z' OR 1=1 --",
    '2026-10-18T00:00:00-04:00', '2026-02-30T00:00:00Z',
    '2026-10-18', '2026-10-18T00:00Z', null, 123,
  ]) assert.throws(() => validateUtcStart(v), /Expected exact UTC timestamp/);
});

test('RUM reports are explicitly grouped by route category and device, not user identity', () => {
  const query = rumPageLoadSQL(START);
  assert.match(query, /events\.rumPageloadEvents/);
  assert.match(query, /sum\(sampleInterval\)/);
  assert.match(query, /recorded_samples/);
  assert.match(query, /\/cdn-cgi\/access\//);
  assert.match(query, /'restricted'/);
  assert.match(query, /'home'/);
  assert.match(query, /'other_nonstaff'/);
  assert.match(query, /deviceType/);
  assert.match(query, /'2026-10-18T00:00:00Z'/);
});

test('RUM referrers omit staff routes and record only grouped hostnames', () => {
  const query = rumReferrerSQL(START);
  assert.match(query, /refererHost/);
  assert.match(query, /bot = 0/);
  assert.match(query, /requestPath NOT LIKE '\/staff%'/);
  assert.match(query, /sum\(sampleInterval\)/);
  assert.doesNotMatch(query, /refererPath|requestQuery|clientIp|userId/i);
});

test('edge HTTP requests are not reported as unique users or visits', () => {
  const query = edgeStatusSQL(START);
  assert.match(query, /events\.httpRequests/);
  assert.match(query, /sample_weighted_requests/);
  assert.match(query, /verifiedBotCategory/);
  assert.doesNotMatch(query, /clientRequestQuery|rayId|userAgent|clientIp|\bunique/i);
});

test('account snapshot enforces coherent metrics and preserves provenance', () => {
  const result = summarizeAccountRecord({
    account_records: '8', verified_account_records: '8',
    created_last_24h: '2', created_last_7d: '5', created_last_30d: '8',
  });
  assert.deepEqual([result.accounts, result.verified, result.last24h, result.last7d, result.last30d], [8,8,2,5,8]);
  assert.equal(result.source, 'canonical_d1');
  assert.equal(result.unit, 'account_records');
  assert.equal(result.excludesTestAccounts, false);
  assert.ok(Object.isFrozen(result));
});

test('missing source is unavailable, never silently zero', () => {
  assert.deepEqual(summarizeAccountRecord(null), {
    status: 'UNAVAILABLE', source: 'canonical_d1', accounts: null,
    verified: null, last24h: null, last7d: null,
    last30d: null, excludesTestAccounts: false,
  });
});

test('actual zero is distinguishable from missing input', () => {
  const result = summarizeAccountRecord({
    account_records: 0, verified_account_records: 0,
    created_last_24h: 0, created_last_7d: 0, created_last_30d: 0,
  });
  assert.equal(result.status, 'VERIFIED_AGGREGATE');
  assert.equal(result.accounts, 0);
});

test('contradictory or malformed aggregates fail instead of entering the report', () => {
  const base = {account_records:8, verified_account_records:8, created_last_24h:2, created_last_7d:5, created_last_30d:8};
  const invalid = [
    {verified_account_records:9}, {created_last_24h:7},
    {created_last_7d:9}, {created_last_30d:10},
    {account_records:'8.5'}, {account_records:-1},
    {account_records:Infinity}, {created_last_24h:null},
  ];
  for(const entry of invalid) assert.throws(() => summarizeAccountRecord({...base,...entry}), /Invalid|Contradictory/);
});

test('every metric query must be a read-only SELECT free of identity-bearing raw fields', () => {
  const queries = [
    registrationSnapshotSQL(), registrationDailySQL(), creatorRecordSnapshotSQL(),
    rumPageLoadSQL(START), rumReferrerSQL(START), edgeStatusSQL(START),
  ];
  for (const query of queries) {
    assert.match(query, /^SELECT\b/i);
    assert.doesNotMatch(query, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|REPLACE|TRUNCATE|GRANT|REVOKE)\b/i);
    assert.doesNotMatch(query, /\b(?:email|password|sessionToken|ipAddress|clientIp|user_id|owner_id|member_id|rayId)\b/i);
  }
});
