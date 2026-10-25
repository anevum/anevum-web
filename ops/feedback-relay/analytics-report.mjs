import { METRIC_COVERAGE, summarizeAccountRecord, validateUtcStart } from './analytics-evidence.mjs';

export const ANALYTICS_REPORT_VERSION = 'anevum.analytics-summary.v1';

const CREATOR_FIELDS = Object.freeze([
  'creator_profile_records', 'studio_project_records', 'studio_submission_records',
  'uplink_package_records', 'published_uplink_records', 'forum_thread_records',
  'forum_reply_records', 'wall_post_records', 'project_vote_records', 'project_save_records',
]);

function wholeCount(value, field) {
  if ((typeof value !== 'string' && typeof value !== 'number') ||
      !/^(0|[1-9][0-9]*)$/.test(String(value)) ||
      !Number.isSafeInteger(Number(value))) {
    throw new TypeError('Invalid aggregate count: ' + field);
  }
  return Number(value);
}

export function summarizeCreatorRecords(row) {
  if (row == null) return Object.freeze({ status: 'UNAVAILABLE', source: 'canonical_d1', records: null, excludesTestAccounts: false });
  if (typeof row !== 'object' || Array.isArray(row)) throw new TypeError('Creator aggregate expected');
  const records = Object.fromEntries(CREATOR_FIELDS.map((field) => [field, wholeCount(row[field], field)]));
  if (records.published_uplink_records > records.uplink_package_records) throw new TypeError('Published count exceeds Uplink packages');
  return Object.freeze({
    status: 'VERIFIED_AGGREGATE',
    source: 'canonical_d1',
    records: Object.freeze(records),
    excludesTestAccounts: false,
  });
}

// Cloudflare RUM captures page loads, not unique visitors, sessions, or account activation.
// The input MUST be pre-aggregated; no request paths, raw referrer URLs or identities are accepted.
export function summarizeRumGroups(rows) {
  if (rows == null) return Object.freeze({
    status: 'UNAVAILABLE', source: 'cloudflare_rum_sql',
    capturedPageLoadSamples: null, weightedPageLoads: null,
    restrictedSamples: null, nonstaffSamples: null,
    byDevice: null, uniqueHumanVisitors: null,
  });
  if (!Array.isArray(rows) || rows.length > 1000) throw new TypeError('RUM aggregate rows required, max 1000');
  let captured = 0, weighted = 0, restricted = 0, nonstaff = 0;
  const deviceBuckets = { mobile: 0, desktop: 0, tablet: 0, other: 0 };
  const seen = new Set();
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new TypeError('Invalid RUM aggregate row');
    const day = row.utc_day;
    const route = row.route_group;
    const device = row.deviceType;
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
        typeof device !== 'string' || device.length > 40 ||
        !['restricted', 'home', 'other_nonstaff'].includes(route)) throw new TypeError('Invalid RUM grouping');
    const key = JSON.stringify([day, route, device]);
    if (seen.has(key)) throw new TypeError('Duplicate RUM group');
    seen.add(key);
    const n = wholeCount(row.recorded_samples, 'recorded_samples');
    const w = wholeCount(row.sample_weighted_page_loads, 'sample_weighted_page_loads');
    if (w < n) throw new TypeError('RUM sample weight below captured sample count');
    captured += n; weighted += w;
    if (!Number.isSafeInteger(captured) || !Number.isSafeInteger(weighted)) throw new TypeError('RUM aggregate overflow');
    if (route === 'restricted') restricted += n;
    else nonstaff += n;
    deviceBuckets[Object.hasOwn(deviceBuckets, device) ? device : 'other'] += n;
  }
  return Object.freeze({
    status: 'PARTIAL_SAMPLED', source: 'cloudflare_rum_sql',
    capturedPageLoadSamples: captured,
    weightedPageLoads: weighted,
    restrictedSamples: restricted,
    nonstaffSamples: nonstaff,
    byDevice: Object.freeze(deviceBuckets),
    uniqueHumanVisitors: null,
  });
}

export function composeAnalyticsEvidenceReport({
  capturedAtUtc, windowStartUtc, accountRow = null,
  creatorRow = null, rumRows = null,
}) {
  const capturedAt = validateUtcStart(capturedAtUtc);
  const windowStart = validateUtcStart(windowStartUtc);
  if (Date.parse(windowStart) > Date.parse(capturedAt)) throw new TypeError('Analytics start after capture time');
  const accounts = summarizeAccountRecord(accountRow);
  const creator = summarizeCreatorRecords(creatorRow);
  const rum = summarizeRumGroups(rumRows);
  return Object.freeze({
    schema_version: ANALYTICS_REPORT_VERSION,
    captured_at_utc: capturedAt,
    rum_window_start_utc: windowStart,
    accounts,
    creator,
    rum,
    social_and_retention: Object.freeze({
      social_to_signup_conversion: null,
      repeat_visitors: null,
      monthly_active_people: null,
      uploaded_by_external_testers: null,
      status: 'UNAVAILABLE',
    }),
    source_quality: Object.freeze({
      registration: accounts.status,
      creator_records: creator.status,
      page_loads: rum.status,
      unique_visitors: METRIC_COVERAGE.unique_visitors,
      campaign_attribution: METRIC_COVERAGE.social_to_signup_attribution,
    }),
    warnings: Object.freeze([
      'Account records may include staff or test accounts.',
      'RUM sampled page-load events are not visitor or session counts.',
      'Non-staff routes may include account or private member pages.',
      'No verified Facebook or LinkedIn conversion attribution is connected.',
    ]),
  });
}
