-- ANEVUM Porchlight V002: proposed *isolated* D1 schema, NOT applied to production.
-- Never include real household records, credentials, or invitation secrets in Git.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS porchlight_events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  region_label TEXT NOT NULL,
  public_from TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','open','paused','closed')),
  mutation_id TEXT,
  created_at TEXT NOT NULL,
  CHECK(public_from <= starts_at),
  CHECK(starts_at < ends_at)
);

-- Approved public block labels avoid accidentally publishing user-entered house numbers.
CREATE TABLE IF NOT EXISTS porchlight_event_blocks (
  event_id TEXT NOT NULL REFERENCES porchlight_events(id),
  code TEXT NOT NULL,
  public_label TEXT NOT NULL,
  PRIMARY KEY(event_id, code)
);

CREATE TABLE IF NOT EXISTS porchlight_organizer_grants (
  event_id TEXT NOT NULL REFERENCES porchlight_events(id),
  principal_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('reviewer','manager')),
  granted_at TEXT NOT NULL,
  revoked_at TEXT,
  PRIMARY KEY(event_id, principal_id)
);

CREATE TABLE IF NOT EXISTS porchlight_host_submissions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES porchlight_events(id),
  host_principal_id TEXT NOT NULL,
  public_label TEXT NOT NULL,
  private_address TEXT NOT NULL,
  public_exact_address TEXT,
  public_block TEXT NOT NULL,
  display_mode TEXT NOT NULL CHECK(display_mode IN ('block','exact')),
  public_lat REAL,
  public_lng REAL,
  tags_json TEXT NOT NULL CHECK(json_valid(tags_json)),
  consent_version TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  adult_attested INTEGER NOT NULL CHECK(adult_attested = 1),
  property_authority_attested INTEGER NOT NULL CHECK(property_authority_attested = 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','removed','withdrawn')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_method TEXT,
  review_reason TEXT,
  mutation_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK((display_mode='block' AND public_exact_address IS NULL AND public_lat IS NULL AND public_lng IS NULL)
     OR (display_mode='exact' AND public_exact_address IS NOT NULL AND public_lat IS NOT NULL AND public_lng IS NOT NULL)),
  CHECK(public_lat IS NULL OR (public_lat >= -90 AND public_lat <= 90)),
  CHECK(public_lng IS NULL OR (public_lng >= -180 AND public_lng <= 180))
);

-- A host cannot create two simultaneous active invitations/approvals for one event.
CREATE UNIQUE INDEX IF NOT EXISTS porchlight_active_host
  ON porchlight_host_submissions(event_id, host_principal_id)
  WHERE status IN ('pending','approved');
CREATE INDEX IF NOT EXISTS porchlight_public_lookup
  ON porchlight_host_submissions(event_id, status);
CREATE INDEX IF NOT EXISTS porchlight_host_lookup
  ON porchlight_host_submissions(host_principal_id, created_at);

CREATE TABLE IF NOT EXISTS porchlight_audit (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES porchlight_events(id),
  actor_principal_id TEXT NOT NULL,
  target_kind TEXT NOT NULL CHECK(target_kind IN ('submission','event')),
  target_id TEXT NOT NULL,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  mutation_id TEXT NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS porchlight_audit_event
  ON porchlight_audit(event_id, created_at);
