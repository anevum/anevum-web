// Data-only funnel specification for future, separately authorized first-party telemetry.
// Nothing here collects, transmits, persists, or publishes an event.
export const FUNNEL_CONTRACT_VERSION = 'anevum.funnel-events.v1';
export const CLIENT_EVENT_COLLECTION_ENABLED = false;

export const FUNNEL_EVENT_DEFINITIONS = Object.freeze({
  landing_view: Object.freeze({ origin: 'consented_client', stage: 'ACQUISITION', meaning: 'Consent-aware landing-page impression' }),
  signup_started: Object.freeze({ origin: 'consented_client', stage: 'ACQUISITION', meaning: 'Signup UI initiation' }),
  account_created: Object.freeze({ origin: 'verified_backend', stage: 'ACTIVATION', meaning: 'Canonical account created' }),
  email_verified: Object.freeze({ origin: 'verified_backend', stage: 'ACTIVATION', meaning: 'Canonical email verification recorded' }),
  creator_profile_created: Object.freeze({ origin: 'verified_backend', stage: 'CREATOR', meaning: 'Creator profile persisted' }),
  studio_opened: Object.freeze({ origin: 'consented_client', stage: 'CREATOR', meaning: 'Studio first-view event' }),
  studio_project_created: Object.freeze({ origin: 'verified_backend', stage: 'CREATOR', meaning: 'Canonical private project persisted' }),
  upload_started: Object.freeze({ origin: 'consented_client', stage: 'CREATOR', meaning: 'Upload action initiated' }),
  uplink_package_received: Object.freeze({ origin: 'verified_backend', stage: 'CREATOR', meaning: 'Upload receipt persisted by server' }),
  uplink_submission_created: Object.freeze({ origin: 'verified_backend', stage: 'CREATOR', meaning: 'Submission accepted for staff review' }),
  uplink_published: Object.freeze({ origin: 'verified_backend', stage: 'CREATOR', meaning: 'Independently reviewed release published' }),
  meaningful_return: Object.freeze({ origin: 'consented_client', stage: 'RETENTION', meaning: 'Repeat meaningful use, not just an auth refresh' }),
});

const SAFE_KEYS = new Set(['name','origin','occurred_at_utc','consent','device','route_group','release_cohort']);
const DEVICES = new Set(['mobile','desktop','tablet','unknown']);
const ROUTES = new Set(['landing','discover','community','account','studio','play','other']);
const RELEASE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

function canonicalUtcTimestamp(value) {
  if (typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString().replace('.000Z','Z') !== value) {
    throw new TypeError('Noncanonical UTC event timestamp');
  }
  return value;
}

// Accept only safe categorical fields, never raw URLs, account IDs, email addresses,
// IP, device fingerprints, per-person tracking keys, project names or content.
export function normalizeFunnelEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Event object required');
  for (const key of Object.keys(input)) if (!SAFE_KEYS.has(key)) throw new TypeError('Unsupported event field: ' + key);
  if (typeof input.name !== 'string' || !Object.hasOwn(FUNNEL_EVENT_DEFINITIONS, input.name)) throw new TypeError('Unknown event name');
  const def = FUNNEL_EVENT_DEFINITIONS[input.name];
  if (input.origin !== def.origin) throw new TypeError('Untrusted event origin');
  if (def.origin === 'consented_client' && input.consent !== 'GRANTED') throw new TypeError('Consent required');
  if (def.origin === 'verified_backend' && input.consent != null) throw new TypeError('Backend events cannot assert client consent');
  const occurred = canonicalUtcTimestamp(input.occurred_at_utc);
  if (input.device != null && !DEVICES.has(input.device)) throw new TypeError('Invalid device bucket');
  if (input.route_group != null && !ROUTES.has(input.route_group)) throw new TypeError('Invalid route group');
  if (input.release_cohort != null &&
      (typeof input.release_cohort !== 'string' || !RELEASE_RE.test(input.release_cohort))) throw new TypeError('Invalid release cohort');
  return Object.freeze({
    schema_version: FUNNEL_CONTRACT_VERSION,
    name: input.name,
    origin: input.origin,
    occurred_at_utc: occurred,
    ...(input.device == null ? {} : {device:input.device}),
    ...(input.route_group == null ? {} : {route_group:input.route_group}),
    ...(input.release_cohort == null ? {} : {release_cohort:input.release_cohort}),
    authorized_to_collect: false,
  });
}

function checkCount(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
      !/^(0|[1-9]\d*)$/.test(String(value)) ||
      !Number.isSafeInteger(Number(value))) throw new TypeError('Invalid funnel count');
  return Number(value);
}

// A conversion percentage requires comparable, complete cohorts. A known zero
// denominator is not interpreted as 0% conversion.
export function qualifiedFunnelRate({numerator = null, denominator = null, comparable = false}) {
  if (numerator == null || denominator == null || comparable !== true) return Object.freeze({status:'UNAVAILABLE',ratio:null});
  const n=checkCount(numerator), d=checkCount(denominator);
  if (d === 0) return Object.freeze({status:'NO_DENOMINATOR',ratio:null});
  if (n > d) throw new TypeError('Non-comparable funnel counts');
  return Object.freeze({status:'VERIFIED_COHORT',ratio:n/d});
}
