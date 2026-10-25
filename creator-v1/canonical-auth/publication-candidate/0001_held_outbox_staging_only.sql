-- ANEVUM Creator V1 P0 / HELD PUBLICATION OUTBOX CANDIDATE
-- UNROUTED / NEVER AUTODISCOVERED BY THE CANONICAL MIGRATION RUNNER.
-- Disposable stage-only schema; do not apply to live MEMBER_DB or COMMUNITY_DB.
-- This records independently reviewed intent, NOT authorization to publish.
-- Initial status is held; SQL has deliberately NO ready/applied/published state.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS member_studio_publication_reviews (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 submission_id TEXT NOT NULL UNIQUE REFERENCES member_studio_submissions(id) ON DELETE CASCADE,
 project_id TEXT NOT NULL REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 owner_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 reviewer_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 project_revision INTEGER NOT NULL CHECK(project_revision>=2),
 idempotency_key TEXT NOT NULL UNIQUE CHECK(length(idempotency_key) BETWEEN 60 AND 120),
 fingerprint TEXT NOT NULL CHECK(length(fingerprint)=64),
 snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)=1 AND length(snapshot_json)<=20000),
 reviewer_reason TEXT NOT NULL CHECK(length(reviewer_reason) BETWEEN 12 AND 1200),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 status TEXT NOT NULL DEFAULT 'held' CHECK(status IN ('held','cancelled')),
 CHECK(reviewer_user_id IS NULL OR reviewer_user_id<>owner_user_id),
 UNIQUE(project_id,project_revision)
);
CREATE INDEX IF NOT EXISTS idx_member_studio_publication_reviews_owner
 ON member_studio_publication_reviews(owner_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_studio_publication_reviews_status
 ON member_studio_publication_reviews(status,created_at,id);

CREATE TABLE IF NOT EXISTS member_studio_publication_outbox (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 review_id TEXT NOT NULL UNIQUE REFERENCES member_studio_publication_reviews(id) ON DELETE CASCADE,
 project_id TEXT NOT NULL REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 idempotency_key TEXT NOT NULL UNIQUE CHECK(length(idempotency_key) BETWEEN 60 AND 120),
 fingerprint TEXT NOT NULL CHECK(length(fingerprint)=64),
 event_type TEXT NOT NULL DEFAULT 'publish_intent' CHECK(event_type='publish_intent'),
 status TEXT NOT NULL DEFAULT 'held' CHECK(status IN ('held','cancelled')),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 cancelled_at INTEGER,
 CHECK((status='held' AND cancelled_at IS NULL) OR
       (status='cancelled' AND cancelled_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_member_studio_publication_outbox_status
 ON member_studio_publication_outbox(status,created_at,id);

-- A creator withdrawal, re-edit, rejection or staff change-request makes the
-- exact held revision ineligible. This trigger DOES NOT emit a public event.
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_project_invalidated
 AFTER UPDATE OF status,revision ON member_studio_projects
 WHEN NEW.status<>'pending_review' OR NEW.revision<>OLD.revision
 BEGIN
   UPDATE member_studio_publication_reviews SET status='cancelled'
    WHERE project_id=NEW.id AND status='held';
   UPDATE member_studio_publication_outbox
    SET status='cancelled',cancelled_at=NEW.updated_at
    WHERE project_id=NEW.id AND status='held';
 END;

-- Snapshot withdrawal is independently fail-closed even if project state did
-- not change because of a future version's review workflow.
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_receipt_invalidated
 AFTER UPDATE OF status ON member_studio_submissions
 WHEN NEW.status<>'pending_review'
 BEGIN
   UPDATE member_studio_publication_reviews SET status='cancelled'
    WHERE submission_id=NEW.id AND status='held';
   UPDATE member_studio_publication_outbox
    SET status='cancelled',cancelled_at=COALESCE(NEW.resolved_at,NEW.submitted_at)
    WHERE review_id IN (
      SELECT id FROM member_studio_publication_reviews
      WHERE submission_id=NEW.id
    ) AND status='held';
 END;
