-- Porchlight V004 — reports and private organizer review.
-- ADDITIVE proposal for an isolated, never-provisioned Porchlight D1 database.
-- Do not apply to Creator V1 production D1 or any other ANEVUM database.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS porchlight_reports (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES porchlight_events(id),
  submission_id TEXT NOT NULL REFERENCES porchlight_host_submissions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK(reason IN ('unwanted','incorrect','privacy','accessibility','other')),
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  created_at TEXT NOT NULL,
  resolved_by TEXT,
  resolved_at TEXT,
  resolution_reason TEXT
);
CREATE INDEX IF NOT EXISTS porchlight_reports_queue
  ON porchlight_reports(event_id,status,created_at);

-- Report audit has no reporter identifier, freeform details or public location.
-- Deleting reports on withdrawal/event retention also deletes associated audit.
CREATE TABLE IF NOT EXISTS porchlight_report_audit (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES porchlight_reports(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES porchlight_events(id),
  organizer_principal_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('resolve')),
  created_at TEXT NOT NULL,
  reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS porchlight_report_audit_event
  ON porchlight_report_audit(event_id,created_at);
