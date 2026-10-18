-- ANEVUM Porchlight V001. Separate database only; NEVER apply to ANEVUM member/community D1.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','closed')),
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  radius_m INTEGER NOT NULL CHECK(radius_m BETWEEN 100 AND 5000),
  created_at INTEGER NOT NULL,
  CHECK (ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS host_submissions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  private_address TEXT,
  contact_email TEXT,
  visibility TEXT NOT NULL CHECK(visibility IN ('exact','area')),
  consent_exact INTEGER NOT NULL DEFAULT 0 CHECK(consent_exact IN (0,1)),
  options_json TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','rejected','withdrawn')),
  receipt_hash TEXT,
  submitted_at INTEGER NOT NULL,
  consent_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  withdrawn_at INTEGER,
  verification_method TEXT,
  public_name TEXT,
  public_label TEXT,
  approved_lat REAL,
  approved_lng REAL,
  CHECK (visibility = 'exact' OR (approved_lat IS NULL AND approved_lng IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_host_event_status ON host_submissions(event_id,status);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  host_id TEXT NOT NULL REFERENCES host_submissions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK(reason IN ('incorrect','privacy','unwanted','accessibility','other')),
  details TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
  resolved_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_reports_event_status ON reports(event_id,status);
CREATE TABLE IF NOT EXISTS rate_buckets (
  bucket_key TEXT PRIMARY KEY, used INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  record_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);
