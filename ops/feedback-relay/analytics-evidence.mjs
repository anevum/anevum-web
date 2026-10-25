// ANEVUM Feedback Relay: read-only analytics definitions.
// This module never connects to providers, collects events, or writes data.
// Cloudflare D1 user.createdAt is ISO TEXT, not Unix milliseconds.
export const ANALYTICS_METRIC_VERSION = 'anevum.analytics-evidence.v1';

export const METRIC_COVERAGE = Object.freeze({
  registrations: 'VERIFIED_AGGREGATE',
  creator_records: 'VERIFIED_AGGREGATE',
  rum_page_loads: 'PARTIAL_SAMPLED',
  unique_visitors: 'UNAVAILABLE',
  social_to_signup_attribution: 'UNAVAILABLE',
  organic_creator_activation: 'UNAVAILABLE',
  facebook_personal_comments: 'NOT_CONNECTED',
  facebook_page_insights: 'NOT_CONNECTED',
  linkedin_personal_comments: 'NOT_CONNECTED',
  linkedin_page_insights: 'NOT_CONNECTED',
  reddit_comment_notifications: 'PARTIAL_EMAIL_SOURCE',
  return_visits: 'UNAVAILABLE',
});

export function registrationSnapshotSQL() {
  return `SELECT datetime('now') AS observed_at_utc,
    count(*) AS account_records,
    coalesce(sum(CASE WHEN emailVerified = 1 THEN 1 ELSE 0 END), 0) AS verified_account_records,
    coalesce(sum(CASE WHEN unixepoch(createdAt) >= unixepoch('now', '-1 day') THEN 1 ELSE 0 END), 0) AS created_last_24h,
    coalesce(sum(CASE WHEN unixepoch(createdAt) >= unixepoch('now', '-7 days') THEN 1 ELSE 0 END), 0) AS created_last_7d,
    coalesce(sum(CASE WHEN unixepoch(createdAt) >= unixepoch('now', '-30 days') THEN 1 ELSE 0 END), 0) AS created_last_30d
  FROM user`;
}

export function registrationDailySQL() {
  return `SELECT date(createdAt) AS utc_day, count(*) AS account_records
    FROM user GROUP BY date(createdAt)
    ORDER BY utc_day DESC LIMIT 31`;
}

export function creatorRecordSnapshotSQL() {
  return `SELECT
    (SELECT count(*) FROM member_creator_profiles) AS creator_profile_records,
    (SELECT count(*) FROM member_studio_projects) AS studio_project_records,
    (SELECT count(*) FROM member_studio_submissions) AS studio_submission_records,
    (SELECT count(*) FROM anevum_alpha_projects) AS uplink_package_records,
    (SELECT count(*) FROM anevum_alpha_projects WHERE status = 'published') AS published_uplink_records,
    (SELECT count(*) FROM member_forum_threads) AS forum_thread_records,
    (SELECT count(*) FROM member_forum_replies) AS forum_reply_records,
    (SELECT count(*) FROM member_wall_posts) AS wall_post_records,
    (SELECT count(*) FROM anevum_alpha_project_votes) AS project_vote_records,
    (SELECT count(*) FROM anevum_alpha_project_saves) AS project_save_records`;
}

// ISO UTC strings only: the permitted argument cannot introduce SQL syntax.
export function validateUtcStart(value) {
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().replace('.000Z', 'Z') !== value) {
    throw new TypeError('Expected exact UTC timestamp YYYY-MM-DDTHH:mm:ssZ');
  }
  return value;
}

export function rumPageLoadSQL(sinceUtc) {
  const since = validateUtcStart(sinceUtc);
  return `SELECT toDate(timestamp) AS utc_day,
    if(requestPath LIKE '/cdn-cgi/access/%' OR requestPath LIKE '/staff%' OR requestPath LIKE '/workspace%', 'restricted',
      if(requestPath = '/', 'home', 'other_public')) AS route_group,
    deviceType,
    count() AS recorded_samples,
    sum(sampleInterval) AS sample_weighted_page_loads
    FROM events.rumPageloadEvents
    WHERE requestHost IN ('anevum.com', 'www.anevum.com')
      AND timestamp >= '${since}'
    GROUP BY utc_day, route_group, deviceType
    ORDER BY utc_day DESC, recorded_samples DESC LIMIT 100 FORMAT JSON`;
}

export function rumReferrerSQL(sinceUtc) {
  const since = validateUtcStart(sinceUtc);
  return `SELECT refererHost AS referrer_host,
    count() AS recorded_samples,
    sum(sampleInterval) AS sample_weighted_page_loads
    FROM events.rumPageloadEvents
    WHERE requestHost IN ('anevum.com', 'www.anevum.com')
      AND timestamp >= '${since}'
      AND bot = 0
      AND requestPath NOT LIKE '/cdn-cgi/access/%'
      AND requestPath NOT LIKE '/staff%'
      AND requestPath NOT LIKE '/workspace%'
    GROUP BY referrer_host
    ORDER BY recorded_samples DESC LIMIT 25 FORMAT JSON`;
}

// The Cloudflare HTTP-request dataset counts requests, NOT visitors.
// All source paths, URLs and identity-bearing fields are excluded here.
export function edgeStatusSQL(sinceUtc) {
  const since = validateUtcStart(sinceUtc);
  return `SELECT edgeResponseStatus AS status,
    verifiedBotCategory AS bot_category,
    count() AS observed_samples,
    sum(sampleInterval) AS sample_weighted_requests
    FROM events.httpRequests
    WHERE clientRequestHttpHost IN ('anevum.com', 'www.anevum.com')
      AND timestamp >= '${since}'
    GROUP BY status, bot_category
    ORDER BY observed_samples DESC LIMIT 30 FORMAT JSON`;
}

function count(value, label) {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
      !/^\d+$/.test(String(value)) ||
      !Number.isSafeInteger(Number(value))) throw new TypeError(`Invalid nonnegative count: ${label}`);
  return Number(value);
}

// Every public-facing summary MUST retain source type and definition.
// Missing source fields become unavailable (null), never fabricated zeros.
export function summarizeAccountRecord(row) {
  if (!row) return Object.freeze({ status: 'UNAVAILABLE', source: 'canonical_d1', accounts: null, verified: null, last24h: null, last7d: null, last30d: null, excludesTestAccounts: false });
  const accounts = count(row.account_records, 'account_records');
  const verified = count(row.verified_account_records, 'verified_account_records');
  const last24h = count(row.created_last_24h, 'created_last_24h');
  const last7d = count(row.created_last_7d, 'created_last_7d');
  const last30d = count(row.created_last_30d, 'created_last_30d');
  if (verified > accounts || last24h > last7d || last7d > last30d || last30d > accounts)
    throw new TypeError('Contradictory account metrics');
  return Object.freeze({
    status: 'VERIFIED_AGGREGATE', source: 'canonical_d1',
    unit: 'account_records', accounts, verified, last24h, last7d, last30d,
    excludesTestAccounts: false,
  });
}
